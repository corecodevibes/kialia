#!/usr/bin/env python3
"""Erzeugt saemtliche App-Icons aus einer einzigen Beschreibung.

Warum ein Skript und keine Bilddatei: das alte Icon lag nur als 1024er-PNG vor.
Jede Aenderung war Handarbeit in einem Bildprogramm, und die abgeleiteten
Groessen liefen auseinander. Hier ist die Form der Quelltext — `python3
scripts/generate_icons.py` schreibt Logo, beide PWA-Groessen, das maskable
Icon und das Favicon in einem Durchgang neu.

Zur Gestaltung. Die Vorgabe war "duenner, feiner, edler", und die steht in
direktem Konflikt mit der Groesse, in der ein App-Icon meistens gesehen wird:
eine Haarlinie, die bei 512 px edel wirkt, ist bei 28 px schlicht weg.
Ein erster Versuch mit ausgehoehltem Koerper sah bei 180 px gut aus und
zerfiel darunter zu Rauschen.

Aufgeloest ist es ueber eine Arbeitsteilung:

  Die Silhouette traegt die Erkennbarkeit. Der Koerper ist eine durchgehende
  helle Flaeche — zwei schmale, hohe Tuben, ein kurzer Steg, zwei Objektive,
  die breiter ausstellen als die Tuben. Das ist auch als reiner Umriss noch
  ein Fernglas.

  Die feine Linie traegt die Anmutung, und zwar dort, wo sie wirkt: in den
  Glaesern. Berg und Palme sind duenne Konturen statt gefuellter Flaechen,
  dazu je eine Haarlinie als Fassung. Bei 180 px sieht man ein praezise
  gebautes Objekt; darunter loesen sich die Motive auf, ohne die Form
  mitzunehmen.

Das Bisherige hatte einen Farbverlauf als Grund und gefuellte Motive in den
Glaesern. Bei 28 px wurde daraus ein Farbfleck. Der Grund ist jetzt eine
ruhige Flaeche in --primary; der Verlauf lebt in der App weiter, wo er Platz
hat.
"""

from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter
S=4096; K=S/1024.0
PRIMARY=(88,72,118); PRIMARY_HI=(108,90,142); IVORY=(250,246,240); CLAY=(206,127,95)
def p(v): return v*K
def q(v, k, c): return (c + (v - c) * k) * K
def bez(a,b,c,n=52):
    return [((1-t)**2*a[0]+2*(1-t)*t*b[0]+t*t*c[0],(1-t)**2*a[1]+2*(1-t)*t*b[1]+t*t*c[1])
            for t in (i/n for i in range(n+1))]

CX, CY, SEP, R = 512, 594, 144, 134
BW, BTOP = 126, 330

def koerper(img, k=1.0):
    """Eine durchgehende helle Silhouette. Zwei schmale Tuben, ein kurzer Steg,
       zwei Objektive, die breiter ausstellen als die Tuben — daran erkennt man
       ein Fernglas auch als Umriss allein.
       Die Feinheit steckt nicht in einer duennen Aussenlinie, sondern in der
       Proportion und in dem, was innen passiert. Eine ausgehoehlte Form waere
       bei 28 px nur noch Rauschen."""
    m = Image.new("L",(S,S),0); d = ImageDraw.Draw(m)
    for s in (-1,1):
        ox = CX+s*SEP
        d.rounded_rectangle([p(ox-BW/2),p(BTOP),p(ox+BW/2),p(CY)], radius=p(42), fill=255)
        d.ellipse([p(ox-R),p(CY-R),p(ox+R),p(CY+R)], fill=255)
    d.rounded_rectangle([p(CX-SEP+BW/2-16),p(352),p(CX+SEP-BW/2+16),p(398)], radius=p(22), fill=255)
    img.paste(Image.new("RGB",(S,S),IVORY),(0,0),m)

def berg(d, ox):
    o = lambda x,y: (p(ox+x), p(CY+y))
    lw = int(p(17))
    d.line([o(-94,52), o(94,52)], fill=PRIMARY, width=lw)
    d.line([o(-84,52), o(-30,-46), o(4,6), o(36,-30), o(88,52)], fill=PRIMARY, width=lw, joint="curve")
    d.line([o(-48,-4), o(-30,-28)], fill=PRIMARY, width=int(p(11)))

def strand(d, ox):
    o = lambda x,y: (p(ox+x), p(CY+y))
    lw = int(p(17))
    d.ellipse([p(ox+26),p(CY-76),p(ox+86),p(CY-16)], fill=CLAY)
    d.line([o(-94,52), o(94,52)], fill=PRIMARY, width=lw)
    d.line([(p(ox+x),p(CY+y)) for x,y in bez((-10,52),(-38,6),(-34,-42))],
           fill=PRIMARY, width=lw, joint="curve")
    for ex,ey in ((-92,-46),(-64,-84),(6,-76),(24,-28)):
        d.line([(p(ox+x),p(CY+y)) for x,y in bez((-34,-42),((ex-34)/2,-88),(ex,ey))],
               fill=PRIMARY, width=int(p(12)), joint="curve")
    d.ellipse([p(ox+34),p(CY+26),p(ox+66),p(CY+44)], outline=PRIMARY, width=int(p(9)))

def glaeser(img, k=1.0):
    d = ImageDraw.Draw(img)
    for s in (-1,1):
        ox = CX+s*SEP
        rr = R-22          # Fassung: eine Haarlinie, die das Glas vom Koerper loest
        d.ellipse([p(ox-rr),p(CY-rr),p(ox+rr),p(CY+rr)], outline=PRIMARY, width=int(p(7)))
    for s,fn in ((-1,berg),(1,strand)):
        ox = CX+s*SEP
        lay = Image.new("RGB",(S,S),IVORY); fn(ImageDraw.Draw(lay), ox)
        m = Image.new("L",(S,S),0); rr = R-32
        ImageDraw.Draw(m).ellipse([p(ox-rr),p(CY-rr),p(ox+rr),p(CY+rr)], fill=255)
        img.paste(lay,(0,0),m)

def grund(img):
    ImageDraw.Draw(img).rectangle([0,0,S,S],fill=PRIMARY)
    g=Image.new("L",(S,S),0); ImageDraw.Draw(g).ellipse([p(-260),p(-320),p(760),p(560)],fill=255)
    img.paste(Image.new("RGB",(S,S),PRIMARY_HI),(0,0),g.filter(ImageFilter.GaussianBlur(p(190))))


def build(maskable=False):
    """maskable: Android beschneidet das Icon auf die inneren rund 80 %.
       Ohne diesen Rand saegt ein Kreiszuschnitt die Tuben oben ab."""
    img = Image.new("RGB", (S, S), PRIMARY)
    grund(img)
    layer = Image.new("RGB", (S, S), PRIMARY)
    grund(layer)
    koerper(layer)
    glaeser(layer)
    if not maskable:
        return layer
    k = 0.74
    small = layer.resize((int(S * k), int(S * k)), Image.LANCZOS)
    off = (S - small.width) // 2
    img.paste(small, (off, off))
    return img


def rounded(img, size, radius_ratio=0.2237):
    """Squircle-Naeherung fuer Stellen, die das Icon nicht selbst maskieren."""
    o = img.resize((size * 4, size * 4), Image.LANCZOS)
    m = Image.new("L", (size * 4, size * 4), 0)
    ImageDraw.Draw(m).rounded_rectangle(
        [0, 0, size * 4 - 1, size * 4 - 1], radius=int(size * 4 * radius_ratio), fill=255
    )
    r = Image.new("RGBA", (size * 4, size * 4), (0, 0, 0, 0))
    r.paste(o, (0, 0), m)
    return r.resize((size, size), Image.LANCZOS)


if __name__ == "__main__":
    root = Path(__file__).resolve().parent.parent
    (root / "public/icons").mkdir(parents=True, exist_ok=True)
    voll = build()
    maske = build(maskable=True)
    # Quadratisch ohne Rundung: iOS und Android legen ihre eigene Maske an
    voll.resize((1024, 1024), Image.LANCZOS).save(root / "src/assets/kialia-logo.png")
    voll.resize((512, 512), Image.LANCZOS).save(root / "public/icons/icon-512.png")
    voll.resize((192, 192), Image.LANCZOS).save(root / "public/icons/icon-192.png")
    maske.resize((512, 512), Image.LANCZOS).save(root / "public/icons/icon-maskable-512.png")
    # Favicon traegt die Rundung selbst — es steht ohne Maske im Browser-Tab
    rounded(voll, 180).save(root / "public/favicon.png")
    print("geschrieben: logo 1024 · icon 512/192 · maskable 512 · favicon 180")
