#!/usr/bin/env python3
"""Borough-door landmark pipeline: pencil sketch -> BLKOUT roundel embed -> transparent PNG.

The sketch must be generated (blkout-image-gen skill, nano-banana-2) with a PLAIN BLANK
pale disc in it (a clock face, a full moon) — this script finds that disc, fills it
obsidian, sets the white BLK OUT roundel into it with a pencil-grain treatment, then
luminance-keys the background transparent so the strokes sit directly on the page.

Usage:
  python3 make-landmark.py SKETCH.png OUT.png [--window top|mid] [--max-edge 760]

--window mid  (default) searches the middle band for the disc (building-mounted, e.g. clock face)
--window top  searches the upper band (a moon in the sky)
"""
import argparse, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROUNDEL = '/home/robbe/blkout/platform/apps/community-platform/public/Branding and logos/imageedit_6_2555297898.png'

p = argparse.ArgumentParser()
p.add_argument('sketch'); p.add_argument('out')
p.add_argument('--window', choices=['top', 'mid'], default='mid')
p.add_argument('--max-edge', type=int, default=760)
p.add_argument('--threshold', type=int, default=34, help='alpha luminance floor; raise for textured-ground sketches')
p.add_argument('--moon-scale', type=float, default=1.0, help='<1 shrinks the disc (reads as a farther moon); erases the sketch disc and redraws')
p.add_argument('--moon-rise', type=float, default=0.0, help='raise the redrawn disc by this fraction of the original radius')
p.add_argument('--disc', help='explicit cx,cy,d override when auto-detection merges bright regions')
a = p.parse_args()

sketch = Image.open(a.sketch).convert('RGB')
arr = np.array(sketch); H, W = arr.shape[:2]
win = np.zeros((H, W), bool)
if a.window == 'mid':
    win[int(H*0.38):int(H*0.62), int(W*0.25):int(W*0.60)] = True
else:
    win[int(H*0.02):int(H*0.40), int(W*0.05):int(W*0.95)] = True
if a.disc:
    cx, cy, d = (int(v) for v in a.disc.split(','))
else:
    bright = (arr[:,:,0] > 205) & (arr[:,:,1] > 200) & (arr[:,:,2] > 185) & win
    ys, xs = np.nonzero(bright)
    if len(xs) < 500:
        sys.exit('NO-REPORT: no blank disc found in the %s window — regenerate with a plain pale disc, or pass --disc cx,cy,d' % a.window)
    cx, cy = (xs.min()+xs.max())//2, (ys.min()+ys.max())//2
    d = max(xs.max()-xs.min(), ys.max()-ys.min())
r = int(d*0.53)
print(f'disc: centre ({cx},{cy}) diameter {d}')

draw = ImageDraw.Draw(sketch)
if a.moon_scale < 1.0:
    # erase the sketch's oversized disc (rim included), then redraw smaller and higher
    er = int(r*1.14)
    draw.ellipse((cx-er, cy-er, cx+er, cy+er), fill=(10,10,20))
    cy = max(int(r*a.moon_scale*1.15), cy - int(r*a.moon_rise))
    d = int(d*a.moon_scale); r = int(d*0.53)
    draw.ellipse((cx-r-3, cy-r-3, cx+r+3, cy+r+3), outline=(212,175,55), width=3)
    print(f'moon redrawn: centre ({cx},{cy}) diameter {d}')

# obsidian face + pencil-grain roundel
draw.ellipse((cx-r, cy-r, cx+r, cy+r), fill=(10,10,20))
roundel = Image.open(ROUNDEL).convert('RGBA')
w = int(d*0.97); h = int(w*roundel.size[1]/roundel.size[0])
roundel = roundel.resize((w, h), Image.LANCZOS)
rr = np.array(roundel).astype(np.float32)
rr[:,:,0] *= 245/255; rr[:,:,1] *= 241/255; rr[:,:,2] *= 232/255
rng = np.random.default_rng(7)
grain = np.kron(rng.normal(1.0, 0.16, (h//3+1, w//3+1)), np.ones((3,3)))[:h,:w]
grain = np.clip(grain, 0.72, 1.15)
for c in range(3): rr[:,:,c] = np.clip(rr[:,:,c]*grain, 0, 255)
roundel = Image.fromarray(rr.astype('uint8'), 'RGBA').filter(ImageFilter.GaussianBlur(0.6))
sketch.paste(roundel, (cx-w//2, cy-h//2), roundel.split()[3])

# luminance-keyed transparency; disc opaque; median-clean paper flecks outside the disc
arr = np.array(sketch).astype(np.float32)
lum = arr.max(axis=2)
alpha = np.clip((lum-a.threshold)*(255.0/(255-a.threshold)), 0, 255).astype('uint8')
yy, xx = np.mgrid[0:H, 0:W]
disc = (xx-cx)**2 + (yy-cy)**2 <= (r+6)*(r+6)
alpha[disc] = 255
img = Image.fromarray(np.dstack([arr.astype('uint8'), alpha]), 'RGBA')
c1, c2, c3, aa = img.split()
aa2 = np.array(aa.filter(ImageFilter.MedianFilter(5))); aa2[disc] = 255
img = Image.merge('RGBA', (c1, c2, c3, Image.fromarray(aa2)))
img.thumbnail((a.max_edge, int(a.max_edge*1.25)))
img.save(a.out)
import os; print('saved', a.out, os.path.getsize(a.out)//1024, 'KB', img.size)
