#!/usr/bin/env python3
"""Erzeugt saemtliche App-Icons aus einer einzigen Beschreibung.

Warum ein Skript und keine Bilddatei: das Icon lag bisher nur als 1024er-PNG
vor. Jede Aenderung war Handarbeit in einem Bildprogramm, und die abgeleiteten
Groessen liefen auseinander. Hier ist die Form der Quelltext —
`python3 scripts/generate_icons.py` schreibt Logo, beide PWA-Groessen, das
maskable Icon und das Favicon in einem Durchgang neu.

DIE FORM ist die bisherige, an der Vorlage abgemessen: Mitten, Radien und
Fassungsstaerke stammen aus dem alten Icon. Neu ist die Ausfuehrung — statt
gefuellter Flaechen eine feine Linie in Beige, Berggrat und Palmenwedel in
Gruen. Schultern, Mittelstueck und Glaeser sind eine einzige Flaeche, also
laeuft auch nur eine Linie aussen herum; einzeln gezeichnete Umrisse haetten
an den Ueberlappungen Nahtstellen.

DER VERLAUF ist derselbe wie in der App (--gradient-sky), nur weicher. "Weich"
heisst hier ausdruecklich nicht "heller": die Linien sind beige, also hell —
ein aufgehellter Grund laesst sie verschwinden. Weich wird er ueber breitere
Flanken der Farbkreise und eine leicht zurueckgenommene Saettigung. Gemessen
traegt diese Fassung 2,60:1 gegen die Linie und damit MEHR als die kraeftigere
Vorversion mit 2,41:1.

Zwei Fallen, beide in der Verlaufsberechnung, beide hier vermieden:
  - In CSS liegt die ZUERST genannte Verlaufsebene oben. Traegt man sie in
    Lesereihenfolge auf, landet das Orange aus der letzten Zeile ueber allem
    und deckt das Perlblau zu.
  - Die Alpha-Flanke laeuft in CSS linear. Eine weiche Kurve (smoothstep) sieht
    gefaelliger aus, verwaescht aber die Farbkreise.

Bleibt eine Grenze, die in der Sache liegt und nicht in der Ausfuehrung: eine
feine helle Linie auf hellem Grund traegt nie viel Kontrast. Bei 28 px loest
sich die Zeichnung sichtbar auf. Das ist der Preis dieser Richtung.
"""

import colorsys
import math
from pathlib import Path

from PIL import Image, ImageDraw
S=2048; K=S/1024.0
BEIGE=(246,235,217); GREEN=(72,114,92)
def p(v): return v*K
def bez(a,b,c,n=72):
    return [((1-t)**2*a[0]+2*(1-t)*t*b[0]+t*t*c[0],(1-t)**2*a[1]+2*(1-t)*t*b[1]+t*t*c[1])
            for t in (i/n for i in range(n+1))]

def pastell(c, saett=0.76, auf=0.06):
    """Weicher, nicht heller.

    "Pastellig" heisst umgangssprachlich meist "aufgehellt". Genau das darf hier
    nicht passieren: die Linien sind beige, also hell — wird der Grund heller,
    verschwinden sie. Also wird die Saettigung zurueckgenommen und die
    Helligkeit nur minimal angehoben. Das Ergebnis wirkt weich, behaelt aber
    den Abstand zur Linie."""
    h,l,s = colorsys.rgb_to_hls(*[v/255 for v in c])
    r,g,b = colorsys.hls_to_rgb(h, min(1.0, l + auf*(1-l)), s*saett)
    return (int(r*255), int(g*255), int(b*255))

STOPS=[((143,155,224),0.06,0.04,0.75,1.20,0.58),
       ((247,214,127),0.96,0.00,0.65,1.10,0.62),
       ((206,127, 95),0.78,1.00,0.85,1.30,0.60),
       ((160,121,140),0.22,1.04,0.70,1.20,0.62),
       ((240,160, 85),0.50,0.40,1.20,0.90,0.70)]
def grund():
    N=256; im=Image.new("RGB",(N,N)); px=im.load()
    ca,sa = math.cos(math.radians(50)), math.sin(math.radians(50))
    A, B = pastell((143,155,224)), pastell((240,160,85))
    stops = [(pastell(c),cx,cy,rx*1.10,ry*1.10,end*1.16) for c,cx,cy,rx,ry,end in STOPS]
    for j in range(N):
        for i in range(N):
            u,v=i/(N-1), j/(N-1)
            t=max(0.0,min(1.0,(u*ca+v*sa)/(ca+sa)))
            r,g,b=[A[k]+(B[k]-A[k])*t for k in range(3)]
            for (cr,cg,cb),cx,cy,rx,ry,end in reversed(stops):
                a=max(0.0,min(1.0,1-math.hypot((u-cx)/rx,(v-cy)/ry)/end))
                r,g,b = r+(cr-r)*a, g+(cg-g)*a, b+(cb-b)*a
            px[i,j]=(int(r),int(g),int(b))
    return im.resize((S,S), Image.LANCZOS)

CX, CY, SEP = 513, 555, 181
RO, RW = 182, 146
SH_W, SH_TOP = 168, 300
MID_W, MID_TOP = 124, 346

def silhouette(d, off=0.0):
    for s in (-1,1):
        ox=CX+s*SEP
        d.ellipse([p(ox-RO+off),p(CY-RO+off),p(ox+RO-off),p(CY+RO-off)], fill=255)
        d.rounded_rectangle([p(ox-SH_W/2+off),p(SH_TOP+off),p(ox+SH_W/2-off),p(CY)],
                            radius=p(max(2,58-off)), fill=255)
    d.rounded_rectangle([p(CX-MID_W/2+off),p(MID_TOP+off),p(CX+MID_W/2-off),p(CY)],
                        radius=p(max(2,58-off)), fill=255)

def berg(d, ox, lw):
    """Zwei Gipfel statt vier Zacken. Der Grat lief vorher mit gleicher
       Strichstaerke bis in die Horizontlinie und wurde dort zum Knoten; jetzt
       treffen sich beide sauber auf der Linie."""
    o=lambda x,y:(p(ox+x),p(CY+y))
    d.line([o(-104,54), o(104,54)], fill=BEIGE, width=lw)
    d.line([o(-96,54), o(-34,-56), o(2,12)], fill=GREEN, width=lw, joint="curve")
    d.line([o(2,12), o(40,-34), o(92,54)], fill=GREEN, width=lw, joint="curve")
    d.line([o(-54,-6), o(-34,-34), o(-16,-6)], fill=GREEN, width=max(2,int(lw*0.62)), joint="curve")

def strand(d, ox, lw):
    """Vier Wedel statt fuenf, jeder mit eigener Laenge und einer Spitze, die
       nach unten auslaeuft — das unterscheidet eine Palme von einem Stern."""
    o=lambda x,y:(p(ox+x),p(CY+y))
    krone=(-36,-48)
    d.ellipse([p(ox+38),p(CY-98),p(ox+98),p(CY-38)], outline=BEIGE, width=max(2,int(lw*0.85)))
    d.line([o(-104,54), o(104,54)], fill=BEIGE, width=lw)
    d.line([(p(ox+x),p(CY+y)) for x,y in bez((-58,54),(-36,34),(6,54))],
           fill=BEIGE, width=max(2,int(lw*0.7)), joint="curve")          # Duene
    d.line([(p(ox+x),p(CY+y)) for x,y in bez((-14,54),(-44,6),krone)],
           fill=BEIGE, width=lw, joint="curve")                          # Stamm
    for spitze, hoch in ((-98,-38),(-70,-96),(6,-92),(38,-46)):
        d.line([(p(ox+x),p(CY+y)) for x,y in
                bez(krone, ((krone[0]+spitze)/2, krone[1]-52), (spitze,hoch))],
               fill=GREEN, width=lw, joint="curve")

def zeichen():
    """Das Zeichen auf durchsichtigem Grund.

    Getrennt vom Verlauf, weil die maskable Fassung nur das Zeichen verkleinern
    darf. Ein verkleinertes Gesamtbild auf den Verlauf zu setzen hinterlaesst
    eine sichtbare Naht dort, wo der geschrumpfte Verlauf auf den vollen trifft.
    """
    lay = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(lay)
    lw = int(p(16))

    # Glaeser milchig hinterlegen, damit Berg und Palme ruhig stehen
    for s_ in (-1, 1):
        ox = CX + s_ * SEP
        d.ellipse([p(ox - RW), p(CY - RW), p(ox + RW), p(CY + RW)], fill=(255, 252, 249, 132))

    # Aussenlinie der ganzen Form: eine Flaeche, also eine Linie
    a = Image.new("L", (S, S), 0)
    silhouette(ImageDraw.Draw(a), 0)
    b = Image.new("L", (S, S), 0)
    silhouette(ImageDraw.Draw(b), lw / K)
    kontur = Image.composite(Image.new("L", (S, S), 0), a, b)
    lay.paste(Image.new("RGBA", (S, S), BEIGE + (255,)), (0, 0), kontur)

    d = ImageDraw.Draw(lay)
    for s_ in (-1, 1):
        ox = CX + s_ * SEP
        d.ellipse([p(ox - RW), p(CY - RW), p(ox + RW), p(CY + RW)], outline=BEIGE, width=lw)

    sc = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    ds = ImageDraw.Draw(sc)
    for s_, fn in ((-1, berg), (1, strand)):
        fn(ds, CX + s_ * SEP, max(2, int(lw * 0.88)))
    clip = Image.new("L", (S, S), 0)
    dc = ImageDraw.Draw(clip)
    for s_ in (-1, 1):
        ox = CX + s_ * SEP
        rr = RW - lw / K - 6
        dc.ellipse([p(ox - rr), p(CY - rr), p(ox + rr), p(CY + rr)], fill=255)
    lay.paste(sc, (0, 0), Image.composite(sc.split()[3], Image.new("L", (S, S), 0), clip))
    return lay


def build(maskable=False):
    """maskable: Android beschneidet auf die inneren rund 80 %. Ohne diesen
       Rand saegt ein Kreiszuschnitt die Schultern oben ab. Verkleinert wird
       nur das Zeichen — der Verlauf fuellt weiter die ganze Flaeche."""
    img = grund()
    z = zeichen()
    if maskable:
        k = 0.76
        klein = z.resize((int(S * k), int(S * k)), Image.LANCZOS)
        z = Image.new("RGBA", (S, S), (0, 0, 0, 0))
        z.paste(klein, ((S - klein.width) // 2, (S - klein.height) // 2))
    img.paste(z, (0, 0), z)
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
    voll, maske = build(), build(maskable=True)
    # Quadratisch ohne Rundung: iOS und Android legen ihre eigene Maske an
    voll.resize((1024, 1024), Image.LANCZOS).save(root / "src/assets/kialia-logo.png")
    voll.resize((512, 512), Image.LANCZOS).save(root / "public/icons/icon-512.png")
    voll.resize((192, 192), Image.LANCZOS).save(root / "public/icons/icon-192.png")
    maske.resize((512, 512), Image.LANCZOS).save(root / "public/icons/icon-maskable-512.png")
    # Favicon traegt die Rundung selbst — es steht ohne Maske im Browser-Tab
    rounded(voll, 180).save(root / "public/favicon.png")
    print("geschrieben: logo 1024 · icon 512/192 · maskable 512 · favicon 180")
