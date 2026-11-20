import os
import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

OUTPUT_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "sample_docs")
os.makedirs(OUTPUT_DIR, exist_ok=True)

def get_font(size: int, bold: bool = False):
    candidates = [
        "C:\\Windows\\Fonts\\arialbd.ttf" if bold else "C:\\Windows\\Fonts\\arial.ttf",
        "C:\\Windows\\Fonts\\segoeuib.ttf" if bold else "C:\\Windows\\Fonts\\segoeui.ttf",
        "C:\\Windows\\Fonts\\calibrib.ttf" if bold else "C:\\Windows\\Fonts\\calibri.ttf",
    ]
    for font_path in candidates:
        if os.path.exists(font_path):
            try:
                return ImageFont.truetype(font_path, size)
            except Exception:
                continue
    return ImageFont.load_default()

def create_pan_card(
    name: str,
    pan: str,
    dob_or_inc: str,
    parent_or_legal: str = "DIRECTOR / AUTHORIZED SIGNATORY",
    is_company: bool = True,
    blur: bool = False,
    glare: bool = False,
    touch_border: bool = False
) -> Image.Image:
    # Canvas with neutral desk background border to simulate realistic framing capture
    canvas_w, canvas_h = 920, 600
    card_w, card_h = 840, 520

    # Desk surface
    desk_color = (235, 238, 242)
    img = Image.new("RGB", (canvas_w, canvas_h), desk_color)
    draw = ImageDraw.Draw(img)

    # Position card centered on desk (leaving comfortable 40px margins ~ 4.3% > 2%)
    if touch_border:
        card_x, card_y = 5, 5 # Will touch within 2% margin!
    else:
        card_x, card_y = (canvas_w - card_w) // 2, (canvas_h - card_h) // 2

    # Draw card rectangle with subtle shadow
    shadow_box = [card_x + 6, card_y + 6, card_x + card_w + 6, card_y + card_h + 6]
    draw.rounded_rectangle(shadow_box, radius=18, fill=(200, 205, 215))

    # Base card background (light blue guilloche gradient)
    card_box = [card_x, card_y, card_x + card_w, card_y + card_h]
    for y in range(card_h):
        ratio = y / card_h
        r = int(210 + 20 * ratio)
        g = int(230 + 10 * (1 - ratio))
        b = int(242 - 12 * ratio)
        draw.line([(card_x, card_y + y), (card_x + card_w, card_y + y)], fill=(r, g, b))

    # Card border
    draw.rounded_rectangle(card_box, radius=18, outline=(40, 75, 120), width=3)

    # Top header bar
    header_font = get_font(20, bold=True)
    sub_header_font = get_font(13, bold=True)
    draw.text((card_x + card_w // 2, card_y + 40), "INCOME TAX DEPARTMENT", fill=(20, 45, 90), font=header_font, anchor="mm")
    draw.text((card_x + card_w // 2, card_y + 65), "GOVT. OF INDIA", fill=(30, 60, 120), font=sub_header_font, anchor="mm")

    # Emblem placeholder
    draw.ellipse([card_x + 40, card_y + 25, card_x + 105, card_y + 90], fill=(225, 235, 245), outline=(20, 50, 100), width=2)
    draw.ellipse([card_x + 60, card_y + 42, card_x + 85, card_y + 72], fill=(195, 212, 232), outline=(30, 70, 120), width=2)
    draw.text((card_x + 72, card_y + 57), "IND", fill=(20, 50, 100), font=get_font(12, bold=True), anchor="mm")

    # QR Code placeholder
    draw.rectangle([card_x + card_w - 120, card_y + 25, card_x + card_w - 35, card_y + 110], fill=(238, 241, 243), outline=(50, 50, 50), width=2)
    for qx in range(card_x + card_w - 110, card_x + card_w - 45, 7):
        for qy in range(card_y + 35, card_y + 100, 7):
            if (qx * 13 + qy * 17) % 7 < 4:
                draw.rectangle([qx, qy, qx + 5, qy + 5], fill=(20, 20, 20))

    # Photo / Entity Seal box
    photo_box = [card_x + 45, card_y + 130, card_x + 200, card_y + 300]
    draw.rectangle(photo_box, fill=(235, 240, 248), outline=(50, 70, 90), width=2)
    if is_company:
        draw.ellipse([card_x + 75, card_y + 165, card_x + 170, card_y + 260], fill=(215, 228, 242), outline=(30, 60, 120), width=3)
        draw.text((card_x + 122, card_y + 212), "CORP\nSEAL", fill=(20, 40, 90), font=get_font(15, bold=True), anchor="mm", align="center")
    else:
        draw.ellipse([card_x + 90, card_y + 160, card_x + 155, card_y + 225], fill=(160, 175, 195))
        draw.chord([card_x + 70, card_y + 210, card_x + 175, card_y + 290], 0, 180, fill=(130, 150, 175))

    # Field labels and values
    label_font = get_font(13, bold=False)
    val_font = get_font(17, bold=True)
    pan_label_font = get_font(14, bold=False)
    pan_val_font = get_font(26, bold=True)

    x_content = card_x + 230
    y = card_y + 135

    # Legal Name
    draw.text((x_content, y), "Name / नाम", fill=(90, 100, 115), font=label_font)
    y += 22
    draw.text((x_content, y), name, fill=(15, 25, 40), font=val_font)
    y += 36

    # Authorized Signatory / Father Name
    parent_label = "Authorized Signatory / अधिकृत हस्ताक्षरकर्ता" if is_company else "Father's Name / पिता का नाम"
    draw.text((x_content, y), parent_label, fill=(90, 100, 115), font=label_font)
    y += 22
    draw.text((x_content, y), parent_or_legal, fill=(20, 30, 45), font=get_font(15, bold=True))
    y += 36

    # DOB / Incorporation Date
    dob_label = "Date of Incorporation / निगमन की तारीख" if is_company else "Date of Birth / जन्म तिथि"
    draw.text((x_content, y), dob_label, fill=(90, 100, 115), font=label_font)
    y += 22
    draw.text((x_content, y), dob_or_inc, fill=(20, 30, 45), font=val_font)
    y += 40

    # PAN Number Box
    draw.rectangle([x_content, y, x_content + 400, y + 62], fill=(238, 241, 243), outline=(40, 80, 130), width=2)
    draw.text((x_content + 15, y + 10), "Permanent Account Number / स्थायी लेखा संख्या", fill=(90, 100, 115), font=pan_label_font)
    draw.text((x_content + 15, y + 30), pan, fill=(180, 20, 20), font=pan_val_font)

    # Signature strip
    draw.rectangle([card_x + 45, card_y + 350, card_x + 245, card_y + 420], fill=(238, 241, 243), outline=(150, 150, 150), width=1)
    sig_points = [(card_x + 65, card_y + 395), (card_x + 90, card_y + 375), (card_x + 115, card_y + 400),
                  (card_x + 140, card_y + 365), (card_x + 165, card_y + 390), (card_x + 195, card_y + 370), (card_x + 230, card_y + 395)]
    draw.line(sig_points, fill=(10, 20, 80), width=2)
    draw.text((card_x + 145, card_y + 435), "Signature / हस्ताक्षर", fill=(90, 100, 115), font=get_font(12), anchor="mm")

    # Bottom watermark
    draw.text((card_x + card_w // 2, card_y + card_h - 25), "भारत गणराज्य / REPUBLIC OF INDIA", fill=(80, 100, 130), font=get_font(12, bold=True), anchor="mm")

    if blur:
        # Extreme Gaussian blur to fail Laplacian check (< 100)
        img = img.filter(ImageFilter.GaussianBlur(radius=10))

    if glare:
        # Strong specular glare hotspot covering > 20% of image
        overlay = Image.new("RGBA", (canvas_w, canvas_h), (0, 0, 0, 0))
        odraw = ImageDraw.Draw(overlay)
        cx, cy = canvas_w // 2, canvas_h // 2
        odraw.ellipse([cx - 320, cy - 190, cx + 320, cy + 190], fill=(255, 255, 255, 255))
        img = Image.alpha_composite(img.convert("RGBA"), overlay).convert("RGB")

    return img

def create_gst_certificate(
    legal_name: str,
    trade_name: str,
    gstin: str,
    constitution: str = "Private Limited Company",
    inc_date: str = "01/09/2019"
) -> Image.Image:
    # A4 proportion on neutral surface
    canvas_w, canvas_h = 960, 1300
    sheet_w, sheet_h = 880, 1220

    img = Image.new("RGB", (canvas_w, canvas_h), (235, 238, 242))
    draw = ImageDraw.Draw(img)

    sheet_x = (canvas_w - sheet_w) // 2
    sheet_y = (canvas_h - sheet_h) // 2

    # Drop shadow
    draw.rectangle([sheet_x + 8, sheet_y + 8, sheet_x + sheet_w + 8, sheet_y + sheet_h + 8], fill=(205, 210, 220))
    # Paper base with subtle warm tint
    draw.rectangle([sheet_x, sheet_y, sheet_x + sheet_w, sheet_y + sheet_h], fill=(240, 242, 244), outline=(170, 175, 185), width=2)

    # Inner decorative borders
    draw.rectangle([sheet_x + 18, sheet_y + 18, sheet_x + sheet_w - 18, sheet_y + sheet_h - 18], outline=(40, 50, 70), width=2)
    draw.rectangle([sheet_x + 24, sheet_y + 24, sheet_x + sheet_w - 24, sheet_y + sheet_h - 24], outline=(190, 195, 205), width=1)

    # Header Box
    h_font = get_font(21, bold=True)
    draw.text((sheet_x + sheet_w // 2, sheet_y + 55), "Government of India", fill=(20, 30, 45), font=h_font, anchor="mm")
    draw.text((sheet_x + sheet_w // 2, sheet_y + 85), "Form GST REG-06", fill=(40, 50, 70), font=get_font(16, bold=True), anchor="mm")
    draw.text((sheet_x + sheet_w // 2, sheet_y + 110), "[See Rule 10(1)]", fill=(100, 100, 100), font=get_font(12), anchor="mm")
    draw.text((sheet_x + sheet_w // 2, sheet_y + 140), "Registration Certificate", fill=(20, 30, 45), font=get_font(20, bold=True), anchor="mm")

    # Emblem placeholder
    draw.ellipse([sheet_x + sheet_w // 2 - 25, sheet_y + 165, sheet_x + sheet_w // 2 + 25, sheet_y + 215], outline=(50, 50, 50), width=2)
    draw.text((sheet_x + sheet_w // 2, sheet_y + 190), "सत्यमेव जयते", fill=(40, 40, 40), font=get_font(10), anchor="mm")

    # Section Table
    y_start = sheet_y + 245
    table_x1 = sheet_x + 40
    table_x2 = sheet_x + sheet_w - 40

    draw.line([(table_x1, y_start), (table_x2, y_start)], fill=(50, 50, 50), width=2)

    rows = [
        ("1. Registration Number (GSTIN)", gstin, True),
        ("2. Legal Name", legal_name, False),
        ("3. Trade Name, if any", trade_name, False),
        ("4. Constitution of Business", constitution, False),
        ("5. Address of Principal Place of Business", "Plot 42, Tech Park Central, Andheri East, Mumbai, MH, 400069", False),
        ("6. Date of Liability", inc_date, False),
        ("7. Period of Validity", f"From {inc_date} To Regular", False),
        ("8. Type of Registration", "Regular", False),
        ("9. Approving Authority", "Jurisdictional Officer, Ward 104, Central Mumbai", False),
    ]

    curr_y = y_start
    col_split = sheet_x + 360

    for idx, (label, val, highlight) in enumerate(rows):
        row_height = 56 if len(val) < 45 else 80
        draw.line([(table_x1, curr_y), (table_x2, curr_y)], fill=(200, 205, 215), width=1)
        draw.line([(col_split, curr_y), (col_split, curr_y + row_height)], fill=(200, 205, 215), width=1)

        draw.text((table_x1 + 15, curr_y + 18), label, fill=(50, 60, 75), font=get_font(13, bold=True))

        if highlight:
            draw.rectangle([col_split + 10, curr_y + 8, table_x2 - 10, curr_y + row_height - 8], fill=(228, 238, 244), outline=(50, 100, 180), width=1)
            draw.text((col_split + 20, curr_y + 14), val, fill=(180, 20, 20), font=get_font(19, bold=True))
        else:
            if len(val) > 45:
                draw.text((col_split + 15, curr_y + 14), val[:42], fill=(20, 30, 45), font=get_font(14, bold=True))
                draw.text((col_split + 15, curr_y + 38), val[42:], fill=(20, 30, 45), font=get_font(14, bold=True))
            else:
                draw.text((col_split + 15, curr_y + 18), val, fill=(20, 30, 45), font=get_font(14, bold=True))

        curr_y += row_height

    draw.line([(table_x1, curr_y), (table_x2, curr_y)], fill=(50, 50, 50), width=2)

    # Barcode/QR representation
    draw.rectangle([sheet_x + 50, curr_y + 40, sheet_x + 200, curr_y + 140], fill=(238, 241, 243), outline=(60, 60, 60), width=1)
    for qx in range(sheet_x + 65, sheet_x + 185, 9):
        for qy in range(curr_y + 55, curr_y + 125, 9):
            if (qx * 7 + qy * 11) % 5 < 3:
                draw.rectangle([qx, qy, qx + 6, qy + 6], fill=(20, 20, 20))
    draw.text((sheet_x + 125, curr_y + 155), "Digital Verification QR", fill=(110, 115, 120), font=get_font(11), anchor="mm")

    # Signature / Signatory Box
    sig_x1 = sheet_x + sheet_w - 380
    draw.rectangle([sig_x1, curr_y + 40, sheet_x + sheet_w - 50, curr_y + 160], fill=(235, 239, 242), outline=(180, 185, 195), width=1)
    draw.text((sig_x1 + 18, curr_y + 55), "Digitally Signed by:", fill=(90, 100, 115), font=get_font(12))
    draw.text((sig_x1 + 18, curr_y + 78), "Goods and Services Tax Network", fill=(20, 35, 60), font=get_font(13, bold=True))
    draw.text((sig_x1 + 18, curr_y + 100), f"Date: {inc_date}", fill=(90, 100, 115), font=get_font(12))
    draw.text((sig_x1 + 18, curr_y + 122), "Location: Mumbai, Maharashtra", fill=(90, 100, 115), font=get_font(12))

    draw.text((sheet_x + sheet_w // 2, sheet_y + sheet_h - 40), "Note: The registration certificate is valid from the date of liability till cancelled.", fill=(110, 120, 130), font=get_font(11), anchor="mm")

    return img

def create_cancelled_cheque(
    account_name: str,
    account_number: str = "98765432101234",
    bank_name: str = "HDFC BANK LTD",
    ifsc: str = "HDFC0001234"
) -> Image.Image:
    canvas_w, canvas_h = 960, 480
    cheque_w, cheque_h = 880, 400

    img = Image.new("RGB", (canvas_w, canvas_h), (235, 238, 242))
    draw = ImageDraw.Draw(img)

    ch_x = (canvas_w - cheque_w) // 2
    ch_y = (canvas_h - cheque_h) // 2

    # Drop shadow
    draw.rectangle([ch_x + 6, ch_y + 6, ch_x + cheque_w + 6, ch_y + cheque_h + 6], fill=(205, 210, 220))
    # Cheque base
    draw.rectangle([ch_x, ch_y, ch_x + cheque_w, ch_y + cheque_h], fill=(235, 240, 238), outline=(100, 140, 120), width=2)

    # Bank Logo & Name
    draw.rectangle([ch_x + 35, ch_y + 30, ch_x + 85, ch_y + 75], fill=(0, 75, 145))
    draw.text((ch_x + 60, ch_y + 52), "HDFC", fill=(255, 255, 255), font=get_font(12, bold=True), anchor="mm")
    draw.text((ch_x + 105, ch_y + 40), bank_name, fill=(0, 60, 130), font=get_font(18, bold=True))
    draw.text((ch_x + 105, ch_y + 66), f"RTGS / NEFT IFSC: {ifsc}", fill=(60, 70, 80), font=get_font(13, bold=True))

    # Date Box
    draw.rectangle([ch_x + cheque_w - 240, ch_y + 35, ch_x + cheque_w - 40, ch_y + 75], outline=(120, 130, 140), width=1)
    draw.text((ch_x + cheque_w - 230, ch_y + 48), "D  D  M  M  Y  Y  Y  Y", fill=(150, 150, 150), font=get_font(13))

    # Payee line
    draw.text((ch_x + 45, ch_y + 110), "PAY", fill=(80, 80, 80), font=get_font(13, bold=True))
    draw.line([(ch_x + 90, ch_y + 125), (ch_x + cheque_w - 60, ch_y + 125)], fill=(150, 150, 150), width=1)

    # Rupees line
    draw.text((ch_x + 45, ch_y + 155), "RUPEES", fill=(80, 80, 80), font=get_font(13, bold=True))
    draw.line([(ch_x + 120, ch_y + 170), (ch_x + cheque_w - 260, ch_y + 170)], fill=(150, 150, 150), width=1)
    draw.rectangle([ch_x + cheque_w - 240, ch_y + 140, ch_x + cheque_w - 40, ch_y + 190], outline=(100, 100, 100), width=2)
    draw.text((ch_x + cheque_w - 225, ch_y + 160), "₹", fill=(50, 50, 50), font=get_font(20, bold=True), anchor="mm")

    # A/C No. Box
    draw.text((ch_x + 45, ch_y + 215), "A/C NO.", fill=(80, 80, 80), font=get_font(13, bold=True))
    draw.rectangle([ch_x + 120, ch_y + 200, ch_x + 420, ch_y + 250], outline=(50, 50, 50), fill=(238, 241, 243), width=2)
    draw.text((ch_x + 135, ch_y + 216), account_number, fill=(20, 30, 40), font=get_font(19, bold=True))

    # Account Holder Name
    draw.text((ch_x + cheque_w - 320, ch_y + 255), "For " + account_name, fill=(40, 50, 60), font=get_font(13, bold=True))
    draw.text((ch_x + cheque_w - 260, ch_y + 320), "Authorised Signatory", fill=(100, 100, 100), font=get_font(12))

    # MICR Line at bottom
    micr_font = get_font(14, bold=True)
    micr_text = "⑈123456⑈ 400240012⑆ 001234⑈ 29"
    draw.text((ch_x + cheque_w // 2, ch_y + cheque_h - 30), micr_text, fill=(30, 30, 30), font=micr_font, anchor="mm")

    # CANCELLED stamp across the cheque in bold diagonal red
    stamp_overlay = Image.new("RGBA", (canvas_w, canvas_h), (0, 0, 0, 0))
    sdraw = ImageDraw.Draw(stamp_overlay)

    sdraw.line([(ch_x + 150, ch_y + 340), (ch_x + 720, ch_y + 50)], fill=(180, 30, 30, 200), width=5)
    sdraw.line([(ch_x + 220, ch_y + 370), (ch_x + 790, ch_y + 80)], fill=(180, 30, 30, 200), width=5)

    cancel_txt = Image.new("RGBA", (500, 100), (0, 0, 0, 0))
    cdraw = ImageDraw.Draw(cancel_txt)
    cdraw.text((250, 50), "CANCELLED", fill=(180, 30, 30, 210), font=get_font(44, bold=True), anchor="mm")
    rotated_txt = cancel_txt.rotate(24, expand=True, resample=Image.BICUBIC)

    stamp_overlay.paste(rotated_txt, (ch_x + 180, ch_y + 110), rotated_txt)
    img = Image.alpha_composite(img.convert("RGBA"), stamp_overlay).convert("RGB")

    return img

def main():
    print(f"Generating synthetic documents in {OUTPUT_DIR}...")

    # 1. Valid Company Flow (Auto-Approval)
    company_pan = create_pan_card(
        name="ACME FINTECH SOLUTIONS PRIVATE LIMITED",
        pan="AACCA1234F",
        dob_or_inc="15/08/2019",
        is_company=True
    )
    company_pan.save(os.path.join(OUTPUT_DIR, "valid_company_pan.png"), quality=95)

    company_gst = create_gst_certificate(
        legal_name="ACME FINTECH SOLUTIONS PRIVATE LIMITED",
        trade_name="ACME PAY",
        gstin="27AACCA1234F1Z5",
        constitution="Private Limited Company",
        inc_date="01/09/2019"
    )
    company_gst.save(os.path.join(OUTPUT_DIR, "valid_company_gst.png"), quality=95)

    cancelled_cheque = create_cancelled_cheque(
        account_name="ACME FINTECH SOLUTIONS PRIVATE LIMITED",
        account_number="98765432101234",
        bank_name="HDFC BANK LTD",
        ifsc="HDFC0001234"
    )
    cancelled_cheque.save(os.path.join(OUTPUT_DIR, "valid_cancelled_cheque.png"), quality=95)

    # 2. Stage 1 Failure: Blurry PAN Card (<100 laplacian variance)
    blurry_pan = create_pan_card(
        name="ACME FINTECH SOLUTIONS PRIVATE LIMITED",
        pan="AACCA1234F",
        dob_or_inc="15/08/2019",
        is_company=True,
        blur=True
    )
    blurry_pan.save(os.path.join(OUTPUT_DIR, "blurry_pan_sample.png"), quality=95)

    # 3. Stage 3 Failure: Cross-Document Mismatch
    mismatch_gst = create_gst_certificate(
        legal_name="ACME FINTECH SOLUTIONS PRIVATE LIMITED",
        trade_name="ACME PAY",
        gstin="27XYZAB9876K1Z9",
        constitution="Private Limited Company",
        inc_date="01/09/2019"
    )
    mismatch_gst.save(os.path.join(OUTPUT_DIR, "mismatch_gst_sample.png"), quality=95)

    # 4. Valid Individual Flow
    indiv_pan = create_pan_card(
        name="RAJESH KUMAR SHARMA",
        pan="ABCPS1234H",
        dob_or_inc="22/11/1988",
        parent_or_legal="OM PRAKASH SHARMA",
        is_company=False
    )
    indiv_pan.save(os.path.join(OUTPUT_DIR, "valid_individual_pan.png"), quality=95)

    indiv_gst = create_gst_certificate(
        legal_name="RAJESH KUMAR SHARMA",
        trade_name="SHARMA DIGITAL TRADERS",
        gstin="07ABCPS1234H1Z2",
        constitution="Proprietorship",
        inc_date="10/05/2021"
    )
    indiv_gst.save(os.path.join(OUTPUT_DIR, "valid_individual_gst.png"), quality=95)

    # 5. Overexposed Glare Sample
    glare_pan = create_pan_card(
        name="ACME FINTECH SOLUTIONS PRIVATE LIMITED",
        pan="AACCA1234F",
        dob_or_inc="15/08/2019",
        is_company=True,
        glare=True
    )
    glare_pan.save(os.path.join(OUTPUT_DIR, "glare_pan_sample.png"), quality=95)

    print("Successfully generated all realistic synthetic documents!")

if __name__ == "__main__":
    main()
