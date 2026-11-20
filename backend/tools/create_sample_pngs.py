import os
from PIL import Image, ImageDraw, ImageFont

def create_png(path, text):
    img = Image.new('RGB', (800, 600), color='white')
    d = ImageDraw.Draw(img)
    # Simple text in center
    w, h = d.textsize(text)
    d.text(((800 - w) / 2, (600 - h) / 2), text, fill='black')
    img.save(path, format='PNG')

folder = r'D:\merchant-kyc-copilot\backend\app\static\sample-docs'
os.makedirs(folder, exist_ok=True)
create_png(os.path.join(folder, 'valid_company_pan.png'), 'Valid PAN & GST Sample')
create_png(os.path.join(folder, 'blurry_pan_sample.png'), 'Blurry PAN Sample')
create_png(os.path.join(folder, 'pan_gst_mismatch.png'), 'PAN-GST Mismatch Sample')
print('Sample PNGs created in', folder)
