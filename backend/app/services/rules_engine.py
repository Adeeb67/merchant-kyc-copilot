import re
import time
import difflib
from typing import Dict, List, Optional, Tuple
from backend.app.config import settings
from backend.app.models.schemas import Stage2Result, Stage3Result, ComplianceRuleCheck

PAN_REGEX = re.compile(r"^[A-Z]{5}[0-9]{4}[A-Z]$")
GSTIN_REGEX = re.compile(r"^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$")
IFSC_REGEX = re.compile(r"^[A-Z]{4}0[A-Z0-9]{6}$")

def normalize_entity_name(name: str) -> str:
    if not name:
        return ""
    text = name.upper()
    # Remove common suffixes and punctuation for robust comparison
    suffixes = [
        "PRIVATE LIMITED", "PVT LTD", "PVT. LTD.", "PVT. LIMITED",
        "LIMITED", "LTD.", "LTD", "LLP", "LLC", "INC", "CORP",
        "ENTERPRISES", "SOLUTIONS", "TRADERS", "COMPANY", "CO."
    ]
    for s in suffixes:
        text = re.sub(rf"\b{s}\b", "", text)
    # Remove special characters
    text = re.sub(r"[^A-Z0-9\s]", " ", text)
    # Collapse extra whitespace
    return " ".join(text.split()).strip()

def compute_name_similarity(name1: Optional[str], name2: Optional[str]) -> float:
    if not name1 or not name2:
        return 100.0 # If one is missing, don't penalize unconditionally
    norm1 = normalize_entity_name(name1)
    norm2 = normalize_entity_name(name2)
    if not norm1 or not norm2:
        norm1 = name1.strip().upper()
        norm2 = name2.strip().upper()
    
    # Exact or substring match shortcut
    if norm1 == norm2 or norm1 in norm2 or norm2 in norm1:
        return 100.0
    
    ratio = difflib.SequenceMatcher(None, norm1, norm2).ratio()
    return round(ratio * 100, 1)

def run_stage3_compliance_engine(
    stage2: Stage2Result,
    applicant_type: str = "company" # "individual" or "company"
) -> Stage3Result:
    start_time = time.perf_counter()
    rule_checks: List[ComplianceRuleCheck] = []
    user_nudges: List[str] = []
    
    # Extract values from documents
    pan_doc = stage2.documents.get("pan")
    gst_doc = stage2.documents.get("gst")
    cheque_doc = stage2.documents.get("cheque")

    extracted_pan = (pan_doc.pan_number if pan_doc else None) or stage2.combined_pan or ""
    extracted_pan = extracted_pan.strip().upper()

    extracted_gstin = (gst_doc.gstin if gst_doc else None) or stage2.combined_gstin or ""
    extracted_gstin = extracted_gstin.strip().upper()

    # Rule 1: PAN Format Validation
    pan_format_valid = bool(PAN_REGEX.match(extracted_pan))
    rule_checks.append(ComplianceRuleCheck(
        rule_id="RULE-PAN-01",
        rule_name="PAN Structural Format Check",
        passed=pan_format_valid,
        severity="CRITICAL",
        details="PAN must strictly adhere to 5 letters, 4 numbers, 1 letter (e.g., ABCDE1234F).",
        expected="^[A-Z]{5}[0-9]{4}[A-Z]$",
        actual=extracted_pan or "NOT_EXTRACTED"
    ))
    if not pan_format_valid:
        user_nudges.append(
            f"The PAN number extracted ('{extracted_pan or 'missing'}') does not conform to the Indian PAN structure (5 letters, 4 digits, 1 letter). Please upload an authentic, uncropped PAN card."
        )

    # Rule 2: 4th Character of PAN (Entity Type Verification)
    pan_4th_char_valid = False
    pan_4th = extracted_pan[3] if len(extracted_pan) >= 4 else ""
    if applicant_type == "individual":
        pan_4th_char_valid = (pan_4th == "P")
        expected_type_str = "'P' (Individual / Person)"
    else: # company
        pan_4th_char_valid = (pan_4th in ["C", "F"])
        expected_type_str = "'C' (Company) or 'F' (Firm / LLP)"

    rule_checks.append(ComplianceRuleCheck(
        rule_id="RULE-PAN-02",
        rule_name="PAN 4th Character Entity Match",
        passed=pan_4th_char_valid,
        severity="CRITICAL",
        details=f"For applicant type '{applicant_type}', PAN 4th character must be {expected_type_str}.",
        expected=expected_type_str,
        actual=f"'{pan_4th}'" if pan_4th else "None"
    ))
    if not pan_4th_char_valid and pan_format_valid:
        if applicant_type == "company":
            user_nudges.append(
                f"Applicant type selected is 'Company', but the PAN provided ({extracted_pan}) has 4th letter '{pan_4th}' (Individual). For corporate onboarding, please upload your Company's PAN card (4th letter must be 'C' or 'F')."
            )
        else:
            user_nudges.append(
                f"Applicant type selected is 'Individual', but the PAN provided ({extracted_pan}) has 4th letter '{pan_4th}'. Please upload your personal PAN card (4th letter must be 'P')."
            )

    # Rule 3: GSTIN Format Validation
    gstin_format_valid = bool(GSTIN_REGEX.match(extracted_gstin))
    rule_checks.append(ComplianceRuleCheck(
        rule_id="RULE-GST-01",
        rule_name="GSTIN Structural Format Check",
        passed=gstin_format_valid,
        severity="CRITICAL",
        details="GSTIN must be 15 alphanumeric characters: 2 state digits + 10-char PAN + 1 entity num + 'Z' + 1 checksum char.",
        expected="^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$",
        actual=extracted_gstin or "NOT_EXTRACTED"
    ))
    if not gstin_format_valid:
        user_nudges.append(
            f"The GSTIN extracted ('{extracted_gstin or 'missing'}') does not conform to the Indian GSTIN format. Please upload an official Form GST REG-06 certificate."
        )

    # Rule 4: Cross-Document Check (Characters 3 to 12 of GSTIN must strictly match PAN)
    cross_pan_gst_match = False
    gst_embedded_pan = ""
    if len(extracted_gstin) >= 12:
        gst_embedded_pan = extracted_gstin[2:12]
        cross_pan_gst_match = (gst_embedded_pan == extracted_pan)

    rule_checks.append(ComplianceRuleCheck(
        rule_id="RULE-CROSS-01",
        rule_name="GSTIN-to-PAN Cross Verification",
        passed=cross_pan_gst_match,
        severity="CRITICAL",
        details="Characters 3 to 12 of the GST certificate registration number must strictly match the uploaded PAN card.",
        expected=f"GSTIN[2:12] == '{extracted_pan}'",
        actual=f"GSTIN[2:12] is '{gst_embedded_pan}'" if gst_embedded_pan else "None"
    ))
    if not cross_pan_gst_match and pan_format_valid and gstin_format_valid:
        user_nudges.append(
            f"Your PAN card ({extracted_pan}) does not match the PAN embedded in your GST certificate ({gst_embedded_pan}). Please upload the PAN card registered to this GSTIN."
        )

    # Rule 5: Fuzzy Name Match across documents
    pan_name = (pan_doc.business_legal_name or pan_doc.full_name) if pan_doc else ""
    gst_name = (gst_doc.business_legal_name or gst_doc.full_name) if gst_doc else ""
    
    sim_score = compute_name_similarity(pan_name, gst_name)
    name_fuzzy_match = sim_score >= settings.FUZZY_NAME_SIMILARITY_THRESHOLD

    rule_checks.append(ComplianceRuleCheck(
        rule_id="RULE-NAME-01",
        rule_name="Cross-Document Entity Legal Name Consistency",
        passed=name_fuzzy_match,
        severity="WARNING",
        details=f"Entity name similarity between PAN and GST must be >= {settings.FUZZY_NAME_SIMILARITY_THRESHOLD}%.",
        expected=f">= {settings.FUZZY_NAME_SIMILARITY_THRESHOLD}%",
        actual=f"{sim_score}% (PAN: '{pan_name}' vs GST: '{gst_name}')"
    ))
    if not name_fuzzy_match and pan_name and gst_name:
        user_nudges.append(
            f"Business name on PAN ('{pan_name}') and GST certificate ('{gst_name}') have low similarity ({sim_score}%). Please verify that both documents reflect the exact same legal registered entity."
        )

    # Optional Cheque Validation if provided
    if cheque_doc and cheque_doc.bank_account_number:
        acc_num = cheque_doc.bank_account_number.strip()
        ifsc = (cheque_doc.ifsc_code or "").strip().upper()
        ifsc_valid = bool(IFSC_REGEX.match(ifsc))
        rule_checks.append(ComplianceRuleCheck(
            rule_id="RULE-CHEQUE-01",
            rule_name="Cancelled Cheque IFSC & Account Verification",
            passed=ifsc_valid and len(acc_num) >= 9,
            severity="WARNING",
            details="Cheque must contain a valid 11-character Indian IFSC code and active account number.",
            expected="11-char IFSC + Account >= 9 digits",
            actual=f"IFSC: '{ifsc}' (Valid: {ifsc_valid}), Acc: {acc_num[:4]}****"
        ))

    # Overall Decision
    critical_failures = [c for c in rule_checks if not c.passed and c.severity == "CRITICAL"]
    warning_failures = [c for c in rule_checks if not c.passed and c.severity == "WARNING"]

    if not critical_failures and not warning_failures:
        recommended_status = "AUTO_APPROVED"
        passed = True
    elif not critical_failures and warning_failures:
        # Warnings like borderline name similarity route to manual review
        recommended_status = "OPS_MANUAL_REVIEW"
        passed = False
    else:
        recommended_status = "USER_RETRY_REQUIRED"
        passed = False

    latency_ms = round((time.perf_counter() - start_time) * 1000, 2)
    user_nudge = "\n\n".join(user_nudges) if user_nudges else None

    return Stage3Result(
        passed=passed,
        latency_ms=latency_ms,
        pan_format_valid=pan_format_valid,
        pan_4th_char_valid=pan_4th_char_valid,
        gstin_format_valid=gstin_format_valid,
        cross_pan_gst_match=cross_pan_gst_match,
        name_fuzzy_match=name_fuzzy_match,
        name_similarity_score=sim_score,
        rule_checks=rule_checks,
        user_nudge=user_nudge,
        recommended_status=recommended_status
    )
