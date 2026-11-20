import os
import time
import shutil
from typing import Optional, List
from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException, Query
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from backend.app.config import settings
from backend.app.models.db_models import get_db
from backend.app.models.schemas import (
    VerificationResponse,
    LatencyBreakdown,
    OverrideRequest,
    SubmissionItem,
    OpsStatsSummary
)
from backend.app.services.quality_gate import run_stage1_quality_gate
from backend.app.services.extraction import run_stage2_extraction
from backend.app.services.rules_engine import run_stage3_compliance_engine
from backend.app.services.audit_service import (
    create_submission_record,
    list_submissions,
    get_submission_by_id,
    apply_override,
    compute_ops_stats
)

router = APIRouter(prefix="/api", tags=["KYC Verification"])

@router.post("/verify-kyc", response_model=VerificationResponse)
async def verify_kyc(
    pan_image: UploadFile = File(..., description="PAN card image file"),
    gst_image: UploadFile = File(..., description="GST registration certificate image file"),
    cheque_image: Optional[UploadFile] = File(None, description="Optional cancelled cheque image file"),
    applicant_type: str = Form("company", description="'individual' or 'company'"),
    bypass_quality_gate: bool = Form(False, description="Toggle to bypass deterministic quality gate for testing"),
    db: Session = Depends(get_db)
):
    total_start = time.perf_counter()
    applicant_type = applicant_type.lower().strip()
    if applicant_type not in ["individual", "company"]:
        applicant_type = "company"

    # Read uploaded file contents into memory
    pan_bytes = await pan_image.read()
    gst_bytes = await gst_image.read()
    cheque_bytes = await cheque_image.read() if cheque_image else None

    # Save files to uploads folder
    timestamp_prefix = int(time.time())
    pan_filename = f"{timestamp_prefix}_{pan_image.filename}"
    gst_filename = f"{timestamp_prefix}_{gst_image.filename}"
    cheque_filename = f"{timestamp_prefix}_{cheque_image.filename}" if cheque_image else None

    with open(os.path.join(settings.UPLOAD_DIR, pan_filename), "wb") as f:
        f.write(pan_bytes)
    with open(os.path.join(settings.UPLOAD_DIR, gst_filename), "wb") as f:
        f.write(gst_bytes)
    if cheque_bytes and cheque_filename:
        with open(os.path.join(settings.UPLOAD_DIR, cheque_filename), "wb") as f:
            f.write(cheque_bytes)

    documents_map = {
        "pan": (pan_image.filename, pan_bytes),
        "gst": (gst_image.filename, gst_bytes),
    }
    if cheque_bytes and cheque_image:
        documents_map["cheque"] = (cheque_image.filename, cheque_bytes)

    # -------------------------------------------------------------
    # STAGE 1: Deterministic OpenCV Quality Gate (Zero LLM Cost)
    # -------------------------------------------------------------
    stage1_res = run_stage1_quality_gate(documents_map, bypass=bypass_quality_gate)

    if not stage1_res.passed:
        # Immediate rejection at Stage 1 - No LLM Cost Incurred!
        total_latency = round((time.perf_counter() - total_start) * 1000, 2)
        latencies = {
            "stage1_ms": stage1_res.latency_ms,
            "stage2_ms": 0.0,
            "stage3_ms": 0.0,
            "total_ms": total_latency
        }
        
        # Build empathetic, actionable retry nudge
        nudge_lines = ["❌ Document Quality Gate Rejected (Zero AI Cost Incurred):"]
        for role, metric in stage1_res.metrics.items():
            if not metric.passed:
                doc_name = "PAN Card" if role == "pan" else ("GST Certificate" if role == "gst" else "Cancelled Cheque")
                for reason in metric.rejection_reasons:
                    nudge_lines.append(f"• {doc_name}: {reason}")
        nudge_lines.append("\nPlease re-capture your document under even lighting, holding the device steady so all four corners are clearly framed.")
        user_nudge = "\n".join(nudge_lines)

        sub_record = create_submission_record(
            db=db,
            applicant_type=applicant_type,
            status="USER_RETRY_REQUIRED",
            overall_passed=False,
            pan_filename=pan_filename,
            gst_filename=gst_filename,
            cheque_filename=cheque_filename,
            stage1=stage1_res,
            stage2=None,
            stage3=None,
            latencies=latencies,
            user_nudge=user_nudge
        )

        return VerificationResponse(
            submission_id=sub_record.id,
            applicant_type=applicant_type,
            status="USER_RETRY_REQUIRED",
            overall_passed=False,
            latencies=LatencyBreakdown(**latencies),
            stage1=stage1_res,
            stage2=None,
            stage3=None,
            user_nudge=user_nudge,
            created_at=sub_record.created_at.isoformat()
        )

    # -------------------------------------------------------------
    # STAGE 2: Multimodal Structured Extraction (Gemini 2.5 Flash)
    # -------------------------------------------------------------
    stage2_res = run_stage2_extraction(documents_map)

    # -------------------------------------------------------------
    # STAGE 3: Deterministic Compliance & Cross-Match Rules Engine
    # -------------------------------------------------------------
    stage3_res = run_stage3_compliance_engine(stage2_res, applicant_type=applicant_type)

    total_latency = round((time.perf_counter() - total_start) * 1000, 2)
    latencies = {
        "stage1_ms": stage1_res.latency_ms,
        "stage2_ms": stage2_res.latency_ms,
        "stage3_ms": stage3_res.latency_ms,
        "total_ms": total_latency
    }

    final_status = stage3_res.recommended_status
    overall_passed = stage3_res.passed
    user_nudge = stage3_res.user_nudge

    sub_record = create_submission_record(
        db=db,
        applicant_type=applicant_type,
        status=final_status,
        overall_passed=overall_passed,
        pan_filename=pan_filename,
        gst_filename=gst_filename,
        cheque_filename=cheque_filename,
        stage1=stage1_res,
        stage2=stage2_res,
        stage3=stage3_res,
        latencies=latencies,
        user_nudge=user_nudge
    )

    return VerificationResponse(
        submission_id=sub_record.id,
        applicant_type=applicant_type,
        status=final_status,
        overall_passed=overall_passed,
        latencies=LatencyBreakdown(**latencies),
        stage1=stage1_res,
        stage2=stage2_res,
        stage3=stage3_res,
        user_nudge=user_nudge,
        created_at=sub_record.created_at.isoformat()
    )

@router.get("/submissions", response_model=List[SubmissionItem])
def get_all_submissions(
    status: Optional[str] = Query("ALL"),
    applicant_type: Optional[str] = Query("ALL"),
    search: Optional[str] = Query(None),
    limit: int = Query(50),
    offset: int = Query(0),
    db: Session = Depends(get_db)
):
    return list_submissions(
        db=db,
        status=status,
        applicant_type=applicant_type,
        search=search,
        limit=limit,
        offset=offset
    )

@router.get("/submissions/{submission_id}")
def get_submission_detail(submission_id: str, db: Session = Depends(get_db)):
    sub = get_submission_by_id(db, submission_id)
    if not sub:
        raise HTTPException(status_code=404, detail="Submission not found")
    return sub

@router.post("/submissions/{submission_id}/override")
def override_submission(
    submission_id: str,
    req: OverrideRequest,
    db: Session = Depends(get_db)
):
    updated = apply_override(db, submission_id, req)
    if not updated:
        raise HTTPException(status_code=404, detail="Submission not found")
    return updated

@router.get("/stats", response_model=OpsStatsSummary)
def get_kpi_stats(db: Session = Depends(get_db)):
    return compute_ops_stats(db)

@router.get("/sample-docs")
def get_sample_document_catalog():
    samples = [
        {
            "id": "valid_company_flow",
            "title": "Valid Corporate KYC (Auto-Approve)",
            "description": "Crisp Company PAN + Matching GSTIN (27AACCA1234F1Z5) + Cancelled Cheque.",
            "applicant_type": "company",
            "pan": "valid_company_pan.png",
            "gst": "valid_company_gst.png",
            "cheque": "valid_cancelled_cheque.png",
            "expected_verdict": "AUTO_APPROVED",
            "expected_stage": "Stage 3 (100% Pass)"
        },
        {
            "id": "blurry_pan_gate",
            "title": "Blurry PAN Card (OpenCV Gate)",
            "description": "Triggers Stage 1 Laplacian blur rejection (< 100.0) with zero AI cost.",
            "applicant_type": "company",
            "pan": "blurry_pan_sample.png",
            "gst": "valid_company_gst.png",
            "cheque": None,
            "expected_verdict": "USER_RETRY_REQUIRED",
            "expected_stage": "Stage 1 (OpenCV Blur Check)"
        },
        {
            "id": "pan_gst_mismatch",
            "title": "PAN-GSTIN Mismatch (Cross-Check)",
            "description": "Crisp images pass Stage 1 & 2; Stage 3 flags mismatch between PAN and GSTIN[2:12].",
            "applicant_type": "company",
            "pan": "valid_company_pan.png",
            "gst": "mismatch_gst_sample.png",
            "cheque": None,
            "expected_verdict": "USER_RETRY_REQUIRED",
            "expected_stage": "Stage 3 (Cross-Verification Mismatch)"
        },
        {
            "id": "valid_individual_flow",
            "title": "Valid Individual KYC (Auto-Approve)",
            "description": "Individual PAN (4th char 'P') + Matching Proprietorship GSTIN (07ABCPS1234H1Z2).",
            "applicant_type": "individual",
            "pan": "valid_individual_pan.png",
            "gst": "valid_individual_gst.png",
            "cheque": None,
            "expected_verdict": "AUTO_APPROVED",
            "expected_stage": "Stage 3 (100% Pass)"
        },
        {
            "id": "glare_pan_gate",
            "title": "Overexposed Glare PAN (OpenCV Gate)",
            "description": "Fails Stage 1 Glare threshold (>15% pixels exceeding HSV brightness limit).",
            "applicant_type": "company",
            "pan": "glare_pan_sample.png",
            "gst": "valid_company_gst.png",
            "cheque": None,
            "expected_verdict": "USER_RETRY_REQUIRED",
            "expected_stage": "Stage 1 (OpenCV Glare Check)"
        }
    ]
    return samples

@router.get("/sample-docs/{filename}")
def serve_sample_document(filename: str):
    file_path = os.path.join(settings.SAMPLE_DOCS_DIR, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Sample document not found")
    return FileResponse(file_path, media_type="image/png")

@router.get("/uploads/{filename}")
def serve_uploaded_document(filename: str):
    file_path = os.path.join(settings.UPLOAD_DIR, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Uploaded document not found")
    return FileResponse(file_path)
