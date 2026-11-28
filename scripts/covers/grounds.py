# Cover grounds for the project tiles (bg-<name>.webp in public/projects/covers).
#   python3 scripts/covers/grounds.py [name=seed ...]   e.g. zervo=12 to try another layout of shapes
# It rewrites every ground from its seed and saves a sheet of all of them to
# output/covers/grounds.png. To add a project, add one ground(...) line to G. Each is a field of a few soft, clearly
# separate shapes: a smooth noise field, bent by a second one, is mapped
# through a short colour ramp with fairly steep steps, so the result reads as
# blobs, sweeps, and folds instead of one even gradient. Every tile has its
# own seed, scale, and ramp; some ramps carry a second hue. Fine grain on top.
import colorsys, os, sys
import numpy as np
from PIL import Image, ImageFilter
out='public/projects/covers/'
W,H=1280,800
def hexrgb(h): return np.array([int(h[i:i+2],16) for i in (1,3,5)],np.float32)
def smooth_noise(rng, cells_x, cells_y):
    g=rng.random((cells_y+3,cells_x+3)).astype(np.float32)
    im=Image.fromarray((g*255).astype(np.uint8)).resize((W+2*W//cells_x,H+2*H//cells_y),Image.BICUBIC).filter(ImageFilter.GaussianBlur(min(W//cells_x,H//cells_y)*0.28))
    a=np.asarray(im,np.float32)[H//cells_y:H//cells_y+H, W//cells_x:W//cells_x+W]/255
    return (a-a.min())/(a.max()-a.min()+1e-6)
def ground(name, seed, stops, cells=(3,2), warp=0.16, sharp=2.4, tilt=(0.0,0.0), grain=3.0, centre=0.0, spread=(.34,.36)):
    rng=np.random.default_rng(seed)
    yy,xx=np.mgrid[0:H,0:W].astype(np.float32); u=xx/W; v=yy/H
    wx=smooth_noise(rng,2,2)-.5; wy=smooth_noise(rng,2,2)-.5
    f=smooth_noise(rng,*cells)
    # bend the field with the two warp fields
    sx=np.clip((u+wx*warp)*W,0,W-1).astype(np.int32); sy=np.clip((v+wy*warp)*H,0,H-1).astype(np.int32); f=f[sy,sx]
    # `centre` pushes the middle of the tile toward the deeper end of the ramp, so a
    # white card there never sits on the palest shape
    f=f+tilt[0]*(u-.5)+tilt[1]*(v-.5)-centre*np.exp(-(((u-.5)/spread[0])**2+((v-.5)/spread[1])**2)); f=(f-f.min())/(f.max()-f.min())
    f=np.asarray(Image.fromarray((f*255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(14)),np.float32)/255
    pos=[s[0] for s in stops]; cols=[hexrgb(s[1]) for s in stops]
    img=np.zeros((H,W,3),np.float32)+cols[0]
    for i in range(1,len(stops)):
        t=np.clip((f-pos[i-1])/(pos[i]-pos[i-1]+1e-6),0,1)
        t=t**sharp/(t**sharp+(1-t)**sharp)          # a steeper step between neighbours
        img=img*(1-t[...,None])+cols[i]*t[...,None]
    img+=rng.normal(0,grain,(H,W,1))
    im=Image.fromarray(np.clip(img,0,255).astype(np.uint8))
    s=np.asarray(im.resize((64,40))).reshape(-1,3)/255; hls=[colorsys.rgb_to_hls(*p) for p in s]
    print(f'bg-{name}: L {min(x[1] for x in hls)*100:.0f}-{max(x[1] for x in hls)*100:.0f}, S {min(x[2] for x in hls)*100:.0f}-{max(x[2] for x in hls)*100:.0f}')
    # saved at 960 wide: the widest tile is 558 CSS px, and the six grounds load with the page
    im.resize((960,600),Image.LANCZOS).save(out+f'bg-{name}.webp',quality=80,method=6); return im
SEEDS=dict(zervo=11,vsenses=22,wishlist=33,leafmark=44,flee=55,huly=66)
for a in sys.argv[1:]:
    k,v=a.split('='); SEEDS[k]=int(v)
G=[
 ground('zervo',SEEDS['zervo'],[(0,'#2f6bdc'),(.42,'#5a9cf0'),(.7,'#8fc0fb'),(1,'#e6f1ff')],cells=(3,2),warp=.2,tilt=(-.25,-.35),centre=.5,spread=(.52,.56)),
 ground('vsenses',SEEDS['vsenses'],[(0,'#d9623a'),(.45,'#ee8b55'),(.78,'#f4a878'),(1,'#f8c4a2')],cells=(2,2),warp=.14,tilt=(0,.5)),
 ground('wishlist',SEEDS['wishlist'],[(0,'#43916e'),(.42,'#6eae8c'),(.76,'#a3cfb0'),(1,'#ebe4ac')],cells=(3,2),warp=.2,tilt=(-.3,-.2),centre=.56,spread=(.72,.5)),
 ground('leafmark',SEEDS['leafmark'],[(0,'#5d49b8'),(.4,'#8a78d6'),(.7,'#c79adf'),(1,'#f6b7d2')],cells=(3,2),warp=.24,tilt=(-.2,.35)),
 ground('flee-the-faculty',SEEDS['flee'],[(0,'#1f96c2'),(.45,'#48bcd9'),(.8,'#8fdbe8'),(1,'#d4f3f7')],cells=(3,2),warp=.18,tilt=(.25,.3),centre=.38),
 ground('huly-cli',SEEDS['huly'],[(0,'#ee6f35'),(.38,'#f39a3a'),(.68,'#f4bd46'),(1,'#fdeaa6')],cells=(2,2),warp=.22,tilt=(.35,.3)),
]
s=Image.new('RGB',(3*650,-(-len(G)//3)*410),'#fff')
for i,g in enumerate(G): s.paste(g.resize((640,400)),((i%3)*650,(i//3)*410))
os.makedirs('output/covers',exist_ok=True); s.save('output/covers/grounds.png'); print('output/covers/grounds.png')
