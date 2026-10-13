"""Prepares the original OVERTHRONE artwork for remaster.html: mirrors the left half onto the right (the AI art was
lopsided), upscales 2x and sharpens. The lettering is covered by the nameplate drawn in remaster.html.

    python3 remaster_logo.py <original.png> <out art.png>
"""
import sys
import numpy as np
from PIL import Image, ImageFilter

src, out = sys.argv[1:3]
a = np.array(Image.open(src).convert('RGBA'))
w = a.shape[1]; a[:, w - w // 2:] = a[:, : w // 2][:, ::-1]
im = Image.fromarray(a).resize((w * 2, w * 2), Image.LANCZOS)
rgb = im.convert('RGB').filter(ImageFilter.UnsharpMask(radius=2.5, percent=70, threshold=2))
rgb.putalpha(im.split()[3]); rgb.save(out)
print('wrote', out)
