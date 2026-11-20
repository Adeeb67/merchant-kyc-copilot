import time
import cv2
import numpy as np
from typing import Dict, Tuple, List
from backend.app.config import settings
from backend.app.models.schemas import DocQualityMetric, Stage1Result

def evaluate_single_image(
    image_bytes: bytes,
    document_role: str,
    filename: str
) -> DocQualityMetric:
    # Decode bytes to OpenCV BGR array
    np_arr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

    if img is None:
        return DocQualityMetric(
            document_role=document_role,
            filename=filename,
            blur_score=0.0,
            blur_passed=False,
            glare_ratio=0.0,
            glare_passed=False,
            framing_ok=False,
            touches_border=True,
            passed=False,
            rejection_reasons=["File could not be parsed as a valid image format."]
        )

    h, w = img.shape[:2]
    rejection_reasons: List[str] = []

    # 1. Blur Check via Laplacian Variance
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    laplacian_var = float(cv2.Laplacian(gray, cv2.CV_64F).var())
    blur_passed = laplacian_var >= settings.BLUR_THRESHOLD
    if not blur_passed:
        rejection_reasons.append(
            f"Image is too blurry (Laplacian variance {laplacian_var:.1f} < threshold {settings.BLUR_THRESHOLD:.1f}). Please capture a crisp, focused photo."
        )

    # 2. Glare / Specular Overexposure Check in HSV
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    glare_mask = (hsv[:, :, 2] > settings.GLARE_BRIGHTNESS_MIN) & (hsv[:, :, 1] < settings.GLARE_SATURATION_MAX)
    glare_pixel_count = int(np.count_nonzero(glare_mask))
    glare_ratio = float(glare_pixel_count / (h * w))
    glare_passed = glare_ratio <= settings.GLARE_RATIO_THRESHOLD
    if not glare_passed:
        glare_pct = glare_ratio * 100
        threshold_pct = settings.GLARE_RATIO_THRESHOLD * 100
        rejection_reasons.append(
            f"Specular glare / overexposure detected ({glare_pct:.1f}% > {threshold_pct:.1f}% of image). Please avoid bright reflections or disable camera flash."
        )

    # 3. Framing / Crop Boundary Check via Contour Analysis
    # Document bounding box touching outer 2% margin indicates cut-off edges
    touches_border = False
    framing_ok = True
    margin_x = int(settings.BORDER_MARGIN_RATIO * w)
    margin_y = int(settings.BORDER_MARGIN_RATIO * h)

    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    edges = cv2.Canny(blurred, 30, 120)
    contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    if contours:
        # Find dominant bounding contour
        largest_contour = max(contours, key=cv2.contourArea)
        area = cv2.contourArea(largest_contour)
        # If significant contour detected (>15% total area)
        if area > (0.15 * w * h):
            bx, by, bw, bh = cv2.boundingRect(largest_contour)
            if bx <= margin_x or by <= margin_y or (bx + bw) >= (w - margin_x) or (by + bh) >= (h - margin_y):
                touches_border = True
                framing_ok = False
                rejection_reasons.append(
                    "Document bounding edges touch the outer 2% frame. Some corners or text may be cut off. Please center the full document with all 4 corners visible."
                )

    passed = blur_passed and glare_passed and framing_ok

    return DocQualityMetric(
        document_role=document_role,
        filename=filename,
        blur_score=round(laplacian_var, 2),
        blur_passed=blur_passed,
        glare_ratio=round(glare_ratio, 4),
        glare_passed=glare_passed,
        framing_ok=framing_ok,
        touches_border=touches_border,
        passed=passed,
        rejection_reasons=rejection_reasons
    )

def run_stage1_quality_gate(
    documents: Dict[str, Tuple[str, bytes]], # role -> (filename, bytes)
    bypass: bool = False
) -> Stage1Result:
    start_time = time.perf_counter()
    metrics: Dict[str, DocQualityMetric] = {}
    all_passed = True
    reasons: List[str] = []

    for role, (filename, file_bytes) in documents.items():
        metric = evaluate_single_image(file_bytes, role, filename)
        metrics[role] = metric
        if not metric.passed:
            all_passed = False
            for r in metric.rejection_reasons:
                reasons.append(f"[{role.upper()}] {r}")

    latency_ms = round((time.perf_counter() - start_time) * 1000, 2)

    if bypass:
        return Stage1Result(
            passed=True,
            latency_ms=latency_ms,
            bypassed=True,
            metrics=metrics,
            summary_feedback="Quality Gate was bypassed by reviewer / client toggle for testing."
        )

    summary_feedback = "All uploaded documents passed deterministic quality checks." if all_passed else " ; ".join(reasons)

    return Stage1Result(
        passed=all_passed,
        latency_ms=latency_ms,
        bypassed=False,
        metrics=metrics,
        summary_feedback=summary_feedback
    )
