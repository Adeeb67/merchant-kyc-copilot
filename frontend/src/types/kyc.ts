export type ApplicantType = 'individual' | 'company';

export type SubmissionStatus = 
  | 'AUTO_APPROVED' 
  | 'USER_RETRY_REQUIRED' 
  | 'OPS_MANUAL_REVIEW' 
  | 'OVERRIDDEN_APPROVED' 
  | 'OVERRIDDEN_REJECTED';

export interface DocQualityMetric {
  document_role: string;
  filename: string;
  blur_score: number;
  blur_passed: boolean;
  glare_ratio: number;
  glare_passed: boolean;
  framing_ok: boolean;
  touches_border: boolean;
  passed: boolean;
  rejection_reasons: string[];
}

export interface Stage1Result {
  passed: boolean;
  latency_ms: number;
  bypassed: boolean;
  metrics: Record<string, DocQualityMetric>;
  summary_feedback?: string;
}

export interface ExtractedDocFields {
  document_type: string;
  full_name?: string | null;
  business_legal_name?: string | null;
  pan_number?: string | null;
  gstin?: string | null;
  dob_or_incorporation_date?: string | null;
  bank_account_number?: string | null;
  ifsc_code?: string | null;
  field_confidence: Record<string, number>;
  raw_summary?: string | null;
}

export interface Stage2Result {
  passed: boolean;
  latency_ms: number;
  is_mock: boolean;
  documents: Record<string, ExtractedDocFields>;
  combined_pan?: string | null;
  combined_gstin?: string | null;
  combined_legal_name?: string | null;
}

export interface ComplianceRuleCheck {
  rule_id: string;
  rule_name: string;
  passed: boolean;
  severity: 'CRITICAL' | 'WARNING';
  details: string;
  expected?: string | null;
  actual?: string | null;
}

export interface Stage3Result {
  passed: boolean;
  latency_ms: number;
  pan_format_valid: boolean;
  pan_4th_char_valid: boolean;
  gstin_format_valid: boolean;
  cross_pan_gst_match: boolean;
  name_fuzzy_match: boolean;
  name_similarity_score: number;
  rule_checks: ComplianceRuleCheck[];
  user_nudge?: string | null;
  recommended_status: SubmissionStatus;
}

export interface LatencyBreakdown {
  stage1_ms: number;
  stage2_ms: number;
  stage3_ms: number;
  total_ms: number;
}

export interface VerificationResponse {
  submission_id: string;
  applicant_type: ApplicantType;
  status: SubmissionStatus;
  overall_passed: boolean;
  latencies: LatencyBreakdown;
  stage1: Stage1Result;
  stage2?: Stage2Result | null;
  stage3?: Stage3Result | null;
  user_nudge?: string | null;
  created_at: string;
}

export interface SubmissionItem {
  id: string;
  applicant_type: ApplicantType;
  status: SubmissionStatus;
  overall_passed: boolean;
  merchant_name?: string | null;
  pan_number?: string | null;
  gstin?: string | null;
  total_latency_ms: number;
  latencies: Record<string, number>;
  stage1?: Stage1Result | null;
  stage2?: Stage2Result | null;
  stage3?: Stage3Result | null;
  user_nudge?: string | null;
  override_status?: string | null;
  override_notes?: string | null;
  override_by?: string | null;
  created_at?: string | null;
}

export interface OpsStatsSummary {
  total_submissions: number;
  auto_approved_count: number;
  user_retry_count: number;
  ops_manual_review_count: number;
  overridden_count: number;
  auto_approval_rate_pct: number;
  avg_total_latency_ms: number;
  avg_stage1_ms: number;
  avg_stage2_ms: number;
  avg_stage3_ms: number;
  manual_review_hours_saved: number;
}

export interface SampleDocCatalogItem {
  id: string;
  title: string;
  description: string;
  applicant_type: ApplicantType;
  pan: string;
  gst: string;
  cheque?: string | null;
  expected_verdict: string;
  expected_stage: string;
}
