import math
from PIL import Image, ImageDraw
S=2048; K=S/1024.0
BEIGE=(244,232,213); GREEN=(74,116,94)
def p(v): return v*K
def bez(a,b,c,n=64):
    return [((1-t)**2*a[0]+2*(1-t)*t*b[0]+t*t*c[0],(1-t)**2*a[1]+2*(1-t)*t*b[1]+t*t*c[1])
            for t in (i/n for i in range(n+1))]

# --- Verlauf: --gradient-sky nach CSS-Regel gerechnet ------------------------
# Die Alpha-Flanke laeuft linear, genau wie im Browser. Ein weicher Uebergang
# (smoothstep) sah gefaelliger aus, hat aber das Perlblau oben links
# weggedrueckt — und das ist die Farbe, an der man kialia erkennt.
STOPS=[((143,155,224),0.06,0.04,0.75,1.20,0.58),
       ((247,214,127),0.96,0.00,0.65,1.10,0.62),
       ((206,127, 95),0.78,1.00,0.85,1.30,0.60),
       ((160,121,140),0.22,1.04,0.70,1.20,0.62),
       ((240,160, 85),0.50,0.40,1.20,0.90,0.70)]
def grund():
    N=224; im=Image.new("RGB",(N,N)); px=im.load()
    ca,sa = math.cos(math.radians(50)), math.sin(math.radians(50))
    for j in range(N):
        for i in range(N):
            u,v=i/(N-1), j/(N-1)
            t=max(0.0,min(1.0,(u*ca+v*sa)/(ca+sa)))
            r,g,b=(143+(240-143)*t, 155+(160-155)*t, 224+(85-224)*t)
            # In CSS liegt die ZUERST genannte Verlaufsebene OBEN. Ich hatte
            # sie zuerst aufgetragen und damit als unterste behandelt — das
            # Orange aus der letzten Zeile lag dadurch ueber allem und hat das
            # Perlblau zugedeckt. Also von hinten nach vorn auftragen.
            for (cr,cg,cb),cx,cy,rx,ry,end in reversed(STOPS):
                a=max(0.0,min(1.0,1-math.hypot((u-cx)/rx,(v-cy)/ry)/end))
                r,g,b = r+(cr-r)*a, g+(cg-g)*a, b+(cb-b)*a
            px[i,j]=(int(r),int(g),int(b))
    return im.resize((S,S), Image.LANCZOS)

# --- Form, an der Vorlage abgemessen ----------------------------------------
CX, CY, SEP = 513, 555, 181
RO, RW      = 182, 146      # Aussenkante und Fenster: die Fassung ist 36 stark
SH_W, SH_TOP = 168, 300     # Schultern
MID_W, MID_TOP = 124, 346   # Mittelstueck

def silhouette(d, off=0.0):
    for s in (-1,1):
        ox=CX+s*SEP
        d.ellipse([p(ox-RO+off),p(CY-RO+off),p(ox+RO-off),p(CY+RO-off)], fill=255)
        d.rounded_rectangle([p(ox-SH_W/2+off),p(SH_TOP+off),p(ox+SH_W/2-off),p(CY)],
                            radius=p(max(2,58-off)), fill=255)
    d.rounded_rectangle([p(CX-MID_W/2+off),p(MID_TOP+off),p(CX+MID_W/2-off),p(CY)],
                        radius=p(max(2,58-off)), fill=255)

def kontur(img, lw):
    """Aussenlinie der ganzen Form. Schultern, Mittelstueck und Glaeser sind
       eine einzige Flaeche — also darf auch nur eine Linie aussen herumlaufen.
       Einzeln gezeichnete Umrisse haetten Nahtstellen dort, wo sich die Teile
       ueberlappen."""
    a=Image.new("L",(S,S),0); silhouette(ImageDraw.Draw(a), 0)
    b=Image.new("L",(S,S),0); silhouette(ImageDraw.Draw(b), lw/K)
    img.paste(Image.new("RGB",(S,S),BEIGE),(0,0), Image.composite(Image.new("L",(S,S),0), a, b))

def berg(d, ox, lw):
    o=lambda x,y:(p(ox+x),p(CY+y))
    d.line([o(-100,52), o(100,52)], fill=BEIGE, width=lw)
    d.line([o(-92,52), o(-30,-50), o(6,6), o(42,-32), o(96,52)], fill=GREEN, width=lw, joint="curve")
    d.line([o(-50,-6), o(-30,-30)], fill=GREEN, width=max(2,int(lw*0.7)))

def strand(d, ox, lw):
    o=lambda x,y:(p(ox+x),p(CY+y))
    d.ellipse([p(ox+26),p(CY-84),p(ox+92),p(CY-18)], outline=BEIGE, width=lw)
    d.line([o(-100,52), o(100,52)], fill=BEIGE, width=lw)
    d.line([(p(ox+x),p(CY+y)) for x,y in bez((-14,52),(-46,2),(-40,-52))],
           fill=BEIGE, width=lw, joint="curve")
    for ex,ey in ((-98,-56),(-72,-98),(2,-92),(24,-46)):
        d.line([(p(ox+x),p(CY+y)) for x,y in bez((-40,-52),((ex-40)/2,-106),(ex,ey))],
               fill=GREEN, width=lw, joint="curve")

def variante(n):
    img=grund()
    lw=int(p(15 if n<3 else 20))
    if n==2:   # Fenster milchig hinterlegt
        v=Image.new("RGBA",(S,S),(0,0,0,0)); dv=ImageDraw.Draw(v)
        for s in (-1,1):
            ox=CX+s*SEP
            dv.ellipse([p(ox-RW),p(CY-RW),p(ox+RW),p(CY+RW)], fill=(255,252,249,115))
        img.paste(v,(0,0),v)
    kontur(img, lw)
    d=ImageDraw.Draw(img)
    for s in (-1,1):     # Fassung der Glaeser
        ox=CX+s*SEP
        d.ellipse([p(ox-RW),p(CY-RW),p(ox+RW),p(CY+RW)], outline=BEIGE, width=lw)
    sc=Image.new("RGBA",(S,S),(0,0,0,0)); ds=ImageDraw.Draw(sc)
    for s,fn in ((-1,berg),(1,strand)):
        fn(ds, CX+s*SEP, max(2,int(lw*0.86)))
    clip=Image.new("L",(S,S),0); dc=ImageDraw.Draw(clip)
    for s in (-1,1):
        ox=CX+s*SEP; rr=RW-lw/K-6
        dc.ellipse([p(ox-rr),p(CY-rr),p(ox+rr),p(CY+rr)], fill=255)
    img.paste(sc,(0,0), Image.composite(sc.split()[3], Image.new("L",(S,S),0), clip))
    return img.resize((1024,1024), Image.LANCZOS)

for n in (1,2,3): variante(n).save(f"/tmp/icon-y{n}.png")
print("gebaut")
