import json
import uuid
import datetime
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import desc
from backend.app.models.db_models import VerificationSubmission
from backend.app.models.schemas import (
    OpsStatsSummary,
    SubmissionItem,
    OverrideRequest,
    Stage1Result,
    Stage2Result,
    Stage3Result
)

def create_submission_record(
    db: Session,
    applicant_type: str,
    status: str,
    overall_passed: bool,
    pan_filename: str,
    gst_filename: str,
    cheque_filename: Optional[str],
    stage1: Stage1Result,
    stage2: Optional[Stage2Result],
    stage3: Optional[Stage3Result],
    latencies: Dict[str, float],
    user_nudge: Optional[str]
) -> VerificationSubmission:
    sub_id = f"KYC-{datetime.datetime.utcnow().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
    
    # Extract merchant identifiers
    merchant_name = None
    pan_number = None
    gstin = None

    if stage2:
        merchant_name = stage2.combined_legal_name
        pan_number = stage2.combined_pan
        gstin = stage2.combined_gstin

    record = VerificationSubmission(
        id=sub_id,
        applicant_type=applicant_type,
        status=status,
        overall_passed=overall_passed,
        pan_filename=pan_filename,
        gst_filename=gst_filename,
        cheque_filename=cheque_filename,
        merchant_name=merchant_name,
        pan_number=pan_number,
        gstin=gstin,
        stage1_json=json.dumps(stage1.model_dump()) if stage1 else None,
        stage2_json=json.dumps(stage2.model_dump()) if stage2 else None,
        stage3_json=json.dumps(stage3.model_dump()) if stage3 else None,
        latencies_json=json.dumps(latencies),
        total_latency_ms=latencies.get("total_ms", 0.0),
        user_nudge=user_nudge,
        created_at=datetime.datetime.utcnow(),
        updated_at=datetime.datetime.utcnow()
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record

def list_submissions(
    db: Session,
    status: Optional[str] = None,
    applicant_type: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = 50,
    offset: int = 0
) -> List[SubmissionItem]:
    query = db.query(VerificationSubmission)
    
    if status and status != "ALL":
        query = query.filter(VerificationSubmission.status == status)
    if applicant_type and applicant_type != "ALL":
        query = query.filter(VerificationSubmission.applicant_type == applicant_type)
    if search and search.strip():
        term = f"%{search.strip()}%"
        query = query.filter(
            (VerificationSubmission.id.ilike(term)) |
            (VerificationSubmission.merchant_name.ilike(term)) |
            (VerificationSubmission.pan_number.ilike(term)) |
            (VerificationSubmission.gstin.ilike(term))
        )
        
    query = query.order_by(desc(VerificationSubmission.created_at))
    records = query.offset(offset).limit(limit).all()
    
    items = []
    for r in records:
        d = r.to_dict()
        items.append(SubmissionItem(
            id=d["id"],
            applicant_type=d["applicant_type"],
            status=d["status"],
            overall_passed=d["overall_passed"],
            merchant_name=d["merchant_name"],
            pan_number=d["pan_number"],
            gstin=d["gstin"],
            total_latency_ms=d["total_latency_ms"],
            latencies=d["latencies"],
            stage1=d["stage1"],
            stage2=d["stage2"],
            stage3=d["stage3"],
            user_nudge=d["user_nudge"],
            override_status=d["override_status"],
            override_notes=d["override_notes"],
            override_by=d["override_by"],
            created_at=d["created_at"]
        ))
    return items

def get_submission_by_id(db: Session, sub_id: str) -> Optional[Dict[str, Any]]:
    record = db.query(VerificationSubmission).filter(VerificationSubmission.id == sub_id).first()
    return record.to_dict() if record else None

def apply_override(
    db: Session,
    sub_id: str,
    req: OverrideRequest
) -> Optional[Dict[str, Any]]:
    record = db.query(VerificationSubmission).filter(VerificationSubmission.id == sub_id).first()
    if not record:
        return None
    
    if req.action.upper() == "APPROVE":
        record.status = "OVERRIDDEN_APPROVED"
        record.overall_passed = True
    else:
        record.status = "OVERRIDDEN_REJECTED"
        record.overall_passed = False
        
    record.override_status = record.status
    record.override_notes = req.notes
    record.override_by = req.reviewer
    record.updated_at = datetime.datetime.utcnow()
    
    db.commit()
    db.refresh(record)
    return record.to_dict()

def compute_ops_stats(db: Session) -> OpsStatsSummary:
    records = db.query(VerificationSubmission).all()
    total = len(records)
    if total == 0:
        return OpsStatsSummary(
            total_submissions=0,
            auto_approved_count=0,
            user_retry_count=0,
            ops_manual_review_count=0,
            overridden_count=0,
            auto_approval_rate_pct=0.0,
            avg_total_latency_ms=0.0,
            avg_stage1_ms=0.0,
            avg_stage2_ms=0.0,
            avg_stage3_ms=0.0,
            manual_review_hours_saved=0.0
        )
    
    auto_approved = sum(1 for r in records if r.status == "AUTO_APPROVED")
    user_retry = sum(1 for r in records if r.status == "USER_RETRY_REQUIRED")
    ops_manual = sum(1 for r in records if r.status == "OPS_MANUAL_REVIEW")
    overridden = sum(1 for r in records if r.status in ["OVERRIDDEN_APPROVED", "OVERRIDDEN_REJECTED"])

    total_latencies = [r.total_latency_ms for r in records if r.total_latency_ms]
    avg_total_ms = round(sum(total_latencies) / len(total_latencies), 1) if total_latencies else 0.0

    stage1_latencies = []
    stage2_latencies = []
    stage3_latencies = []
    for r in records:
        if r.latencies_json:
            try:
                lats = json.loads(r.latencies_json)
                if "stage1_ms" in lats: stage1_latencies.append(lats["stage1_ms"])
                if "stage2_ms" in lats: stage2_latencies.append(lats["stage2_ms"])
                if "stage3_ms" in lats: stage3_latencies.append(lats["stage3_ms"])
            except Exception:
                pass

    avg_s1 = round(sum(stage1_latencies) / len(stage1_latencies), 1) if stage1_latencies else 0.0
    avg_s2 = round(sum(stage2_latencies) / len(stage2_latencies), 1) if stage2_latencies else 0.0
    avg_s3 = round(sum(stage3_latencies) / len(stage3_latencies), 1) if stage3_latencies else 0.0

    rate = round((auto_approved / total) * 100, 1)
    # Each auto-approval saves an underwriter ~15 minutes (0.25 hours) of document cross-checking
    hours_saved = round(auto_approved * 0.25, 2)

    return OpsStatsSummary(
        total_submissions=total,
        auto_approved_count=auto_approved,
        user_retry_count=user_retry,
        ops_manual_review_count=ops_manual,
        overridden_count=overridden,
        auto_approval_rate_pct=rate,
        avg_total_latency_ms=avg_total_ms,
        avg_stage1_ms=avg_s1,
        avg_stage2_ms=avg_s2,
        avg_stage3_ms=avg_s3,
        manual_review_hours_saved=hours_saved
    )
