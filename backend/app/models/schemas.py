from typing import Dict, List, Optional, Any
from pydantic import BaseModel, Field

# --- Stage 1 Models ---
class DocQualityMetric(BaseModel):
    document_role: str # "pan", "gst", "cheque"
    filename: str
    blur_score: float
    blur_passed: bool
    glare_ratio: float
    glare_passed: bool
    framing_ok: bool
    touches_border: bool
    passed: bool
    rejection_reasons: List[str] = []

class Stage1Result(BaseModel):
    passed: bool
    latency_ms: float
    bypassed: bool = False
    metrics: Dict[str, DocQualityMetric] = {}
    summary_feedback: Optional[str] = None

# --- Stage 2 Models ---
class ExtractedDocFields(BaseModel):
    document_type: str = Field(description="PAN_CARD, GST_CERTIFICATE, CANCELLED_CHEQUE, or UNKNOWN")
    full_name: Optional[str] = Field(default=None, description="Full individual name or applicant name")
    business_legal_name: Optional[str] = Field(default=None, description="Registered legal business entity name")
    pan_number: Optional[str] = Field(default=None, description="10-character alphanumeric PAN")
    gstin: Optional[str] = Field(default=None, description="15-character GSTIN")
    dob_or_incorporation_date: Optional[str] = Field(default=None, description="Date of birth or Date of incorporation (DD/MM/YYYY)")
    bank_account_number: Optional[str] = Field(default=None, description="Bank account number from cheque")
    ifsc_code: Optional[str] = Field(default=None, description="IFSC code from cheque")
    field_confidence: Dict[str, float] = Field(default_factory=dict, description="Confidence score 0.0 to 1.0 per field")
    raw_summary: Optional[str] = None

class Stage2Result(BaseModel):
    passed: bool
    latency_ms: float
    is_mock: bool = False
    documents: Dict[str, ExtractedDocFields] = {}
    combined_pan: Optional[str] = None
    combined_gstin: Optional[str] = None
    combined_legal_name: Optional[str] = None

# --- Stage 3 Models ---
class ComplianceRuleCheck(BaseModel):
    rule_id: str
    rule_name: str
    passed: bool
    severity: str # "CRITICAL" or "WARNING"
    details: str
    expected: Optional[str] = None
    actual: Optional[str] = None

class Stage3Result(BaseModel):
    passed: bool
    latency_ms: float
    pan_format_valid: bool
    pan_4th_char_valid: bool
    gstin_format_valid: bool
    cross_pan_gst_match: bool
    name_fuzzy_match: bool
    name_similarity_score: float
    rule_checks: List[ComplianceRuleCheck] = []
    user_nudge: Optional[str] = None
    recommended_status: str # "AUTO_APPROVED", "USER_RETRY_REQUIRED", "OPS_MANUAL_REVIEW"

# --- Master Verification Response ---
class LatencyBreakdown(BaseModel):
    stage1_ms: float = 0.0
    stage2_ms: float = 0.0
    stage3_ms: float = 0.0
    total_ms: float = 0.0

class VerificationResponse(BaseModel):
    submission_id: str
    applicant_type: str
    status: str
    overall_passed: bool
    latencies: LatencyBreakdown
    stage1: Stage1Result
    stage2: Optional[Stage2Result] = None
    stage3: Optional[Stage3Result] = None
    user_nudge: Optional[str] = None
    created_at: str

# --- Ops & Override Schemas ---
class OverrideRequest(BaseModel):
    action: str = Field(description="APPROVE or REJECT")
    notes: str = Field(description="Reason for reviewer override")
    reviewer: str = Field(default="RiskOps_Officer_1")

class SubmissionItem(BaseModel):
    id: str
    applicant_type: str
    status: str
    overall_passed: bool
    merchant_name: Optional[str] = None
    pan_number: Optional[str] = None
    gstin: Optional[str] = None
    total_latency_ms: float
    latencies: Dict[str, float] = {}
    stage1: Optional[Dict[str, Any]] = None
    stage2: Optional[Dict[str, Any]] = None
    stage3: Optional[Dict[str, Any]] = None
    user_nudge: Optional[str] = None
    override_status: Optional[str] = None
    override_notes: Optional[str] = None
    override_by: Optional[str] = None
    created_at: Optional[str] = None

class OpsStatsSummary(BaseModel):
    total_submissions: int
    auto_approved_count: int
    user_retry_count: int
    ops_manual_review_count: int
    overridden_count: int
    auto_approval_rate_pct: float
    avg_total_latency_ms: float
    avg_stage1_ms: float
    avg_stage2_ms: float
    avg_stage3_ms: float
    manual_review_hours_saved: float
