"""Pixel art de LE COACH, entièrement codé (aucun générateur d'images).

    python3 outils/coach_pixel.py

Écrit dans public/coach/pixel/ :
- décors 180×320 agrandis ×6 (1080×1920), sans aucun texte (le texte est posé dans Remotion) ;
- personnages 32×48 (+ contour noir automatique) agrandis ×13, fond transparent.
Agrandissement au plus proche voisin : pixels nets, même rendu d'un épisode à l'autre.
"""
import math
import random
from pathlib import Path

from PIL import Image

KIT = Path(__file__).resolve().parents[1]
OUT = KIT / "public/coach/pixel"
OUT.mkdir(parents=True, exist_ok=True)
CONTOUR = (20, 22, 28, 255)


def c(h, a=255):
    h = h.lstrip("#")
    return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16), a)


def ombre(col, f=0.78):
    return (int(col[0] * f), int(col[1] * f), int(col[2] * f), col[3])


def clair(col, f=1.18):
    return tuple(min(255, int(v * f)) for v in col[:3]) + (col[3],)


# ---------------------------------------------------------------- personnages
CHIFFRES = {
    "0": ["111", "101", "101", "101", "111"], "1": ["010", "110", "010", "010", "111"],
    "2": ["111", "001", "111", "100", "111"], "3": ["111", "001", "111", "001", "111"],
    "4": ["101", "101", "111", "001", "001"], "5": ["111", "100", "111", "001", "111"],
    "6": ["111", "100", "111", "101", "111"], "7": ["111", "001", "010", "010", "010"],
    "8": ["111", "101", "111", "101", "111"], "9": ["111", "101", "111", "001", "111"],
}


def personnage(nom, peau, cheveux, coiffure, haut, haut2, bas, chaussures, *, barbe=None, moustache=None,
               manches_longues=False, short=False, chaussettes=None, numero=None, brassard=False,
               ventre=False, sifflet=False, rayure=None, echelle=13):
    W, H = 32, 48
    p = {}

    def r(x0, y0, x1, y1, col):
        for y in range(y0, y1 + 1):
            for x in range(x0, x1 + 1):
                p[(x, y)] = col

    def pt(x, y, col):
        p[(x, y)] = col

    peau_o = ombre(peau, 0.82)
    # tête
    r(9, 3, 22, 16, peau)
    for k in [(9, 3), (22, 3), (9, 16), (22, 16)]:
        p.pop(k, None)
    r(20, 4, 22, 15, peau_o)
    r(8, 9, 8, 11, peau_o); r(23, 9, 23, 11, peau_o)  # oreilles
    # cheveux
    if coiffure == "court":
        r(10, 2, 21, 2, cheveux); r(9, 3, 22, 5, cheveux); r(9, 6, 10, 8, cheveux); r(21, 6, 22, 8, cheveux)
        pt(12, 6, cheveux); pt(16, 6, cheveux); pt(19, 6, cheveux)
    elif coiffure == "boucle":
        for x in (11, 12, 15, 16, 19, 20):
            pt(x, 0, cheveux)
        r(10, 1, 21, 1, cheveux); r(9, 2, 22, 5, cheveux); r(9, 6, 10, 8, cheveux); r(21, 6, 22, 8, cheveux)
        for x in (11, 14, 17, 20):
            pt(x, 6, cheveux)
        for x in (12, 16, 20):
            pt(x, 3, clair(cheveux, 1.8))
    elif coiffure == "chauve":
        r(9, 7, 10, 11, cheveux); r(21, 7, 22, 11, cheveux)
        pt(13, 4, clair(peau, 1.2)); pt(14, 4, clair(peau, 1.2)); pt(14, 5, clair(peau, 1.12))
    elif coiffure == "degarni":
        r(12, 3, 19, 3, cheveux); r(9, 4, 10, 10, cheveux); r(21, 4, 22, 10, cheveux)
    # sourcils, yeux, nez, bouche
    sourcil = cheveux if coiffure != "chauve" else ombre(cheveux, 0.6)
    r(11, 8, 13, 8, sourcil); r(18, 8, 20, 8, sourcil)
    for x0 in (12, 18):
        r(x0, 10, x0 + 1, 11, (18, 18, 22, 255))
        pt(x0, 10, (245, 245, 245, 255))
    pt(15, 12, peau_o); pt(16, 12, peau_o); pt(16, 13, peau_o)
    r(14, 14, 17, 14, c("7a3b2e"))
    if barbe:
        r(9, 13, 9, 15, barbe); r(22, 13, 22, 15, barbe)
        r(10, 15, 21, 16, barbe); r(10, 14, 13, 14, barbe); r(18, 14, 21, 14, barbe)
        r(12, 13, 13, 13, barbe); r(18, 13, 19, 13, barbe)
        r(14, 15, 17, 15, barbe)
        p.pop((9, 16), None); p.pop((22, 16), None)
    if moustache:
        r(13, 13, 18, 13, moustache)
    # cou
    r(13, 17, 18, 18, peau_o)
    # buste
    r(8, 19, 23, 33, haut)
    p.pop((8, 19), None); p.pop((23, 19), None)
    if ventre:
        r(7, 25, 24, 33, haut)
    r(21, 20, 24 if ventre else 23, 33, ombre(haut, 0.82))
    r(13, 19, 18, 19, haut2)  # col
    pt(14, 20, haut2); pt(17, 20, haut2)
    if manches_longues:
        r(15, 20, 16, 33, haut2)  # fermeture éclair / boutons
    # bras
    for bx in (5, 24):
        cote = haut if bx == 5 else ombre(haut, 0.82)
        cp = peau if bx == 5 else peau_o
        if manches_longues:
            r(bx, 20, bx + 2, 30, cote); r(bx, 31, bx + 2, 33, cp)
        else:
            r(bx, 20, bx + 2, 24, cote); r(bx, 25, bx + 2, 33, cp)
    if ventre:  # les bras s'écartent du ventre
        for y in range(25, 34):
            p[(4, y)] = p.pop((5, y), peau); p[(27, y)] = p.pop((26, y), peau_o)
            p[(5, y)] = p.get((6, y)); p[(26, y)] = p.get((25, y))
    if rayure:
        r(5, 21, 5, 30, rayure); r(26, 21, 26, 30, rayure)
    if brassard:
        r(24, 21, 26, 23, c("f2c230"))
    if sifflet:
        pt(13, 20, c("cfd3da")); pt(13, 21, c("cfd3da")); pt(14, 22, c("cfd3da"))
        r(14, 23, 15, 23, c("e6eaf0")); pt(15, 24, c("8a9099"))
    if numero:
        larg = len(numero) * 4 - 1
        nx = 16 - (larg + 1) // 2
        for k, ch in enumerate(numero):
            for dy, ligne in enumerate(CHIFFRES[ch]):
                for dx, v in enumerate(ligne):
                    if v == "1":
                        pt(nx + k * 4 + dx, 23 + dy, haut2)
    # bas du corps
    if short:
        r(9, 34, 22, 38, bas); r(19, 34, 22, 38, ombre(bas, 0.85))
        r(10, 39, 14, 40, peau); r(17, 39, 21, 40, peau_o)
        r(10, 41, 14, 45, chaussettes); r(17, 41, 21, 45, ombre(chaussettes, 0.85))
        r(10, 41, 14, 41, clair(chaussettes, 1.35)); r(17, 41, 21, 41, clair(chaussettes, 1.25))
    else:
        r(9, 34, 22, 36, bas)
        r(10, 37, 14, 45, bas); r(17, 37, 21, 45, ombre(bas, 0.82))
        if rayure:
            r(10, 35, 10, 45, rayure); r(21, 35, 21, 45, rayure)
    r(9, 46, 14, 47, chaussures); r(17, 46, 22, 47, chaussures)
    r(10, 46, 14, 46, clair(chaussures, 1.08))
    p = {k: v for k, v in p.items() if v is not None}
    # contour automatique
    img = Image.new("RGBA", (W + 4, H + 2), (0, 0, 0, 0))
    plein = {(x + 2, y + 1) for (x, y) in p}
    for (x, y), col in p.items():
        img.putpixel((x + 2, y + 1), col)
    for y in range(H + 2):
        for x in range(W + 4):
            if (x, y) in plein:
                continue
            if any((x + dx, y + dy) in plein for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))):
                img.putpixel((x, y), CONTOUR)
    img = img.resize(((W + 4) * echelle, (H + 2) * echelle), Image.NEAREST)
    img.save(OUT / f"{nom}.png")
    print("perso", nom, img.size)


VERT = c("1e8f4e")
BLANC = c("f2f4f5")
personnage("karim", c("c68a5a"), c("1b1410"), "court", c("1f3a8a"), BLANC, c("1f3a8a"), BLANC,
           barbe=c("2a1d16"), manches_longues=True, sifflet=True, rayure=BLANC)
personnage("momo", c("8d5a3b"), c("9aa0a6"), "chauve", VERT, BLANC, BLANC, c("1a1a1a"),
           barbe=c("a9aeb4"), short=True, chaussettes=VERT, numero="9", brassard=True, ventre=True)
personnage("sofiane", c("d9a066"), c("161210"), "boucle", BLANC, c("d0d4d8"), c("3b5b9a"), BLANC)
personnage("president", c("e8b98f"), c("b8bcc2"), "degarni", c("5a6470"), c("e9e2d0"), c("2f3540"),
           c("3a2a20"), moustache=c("9aa0a6"), manches_longues=True, ventre=True)
# ép. 2 : Sofiane titulaire (maillot du club n°11) et Bilal, 29 ans, ex-National (sweat sombre, barbe courte)
personnage("sofiane_maillot", c("d9a066"), c("161210"), "boucle", VERT, BLANC, BLANC, c("1a1a1a"),
           short=True, chaussettes=VERT, numero="11")
personnage("bilal", c("a8714a"), c("120e0c"), "court", c("2b2f3a"), c("3c4250"), c("1d2028"), BLANC,
           moustache=c("1a1310"), manches_longues=True)


# ---------------------------------------------------------------- décors
BW, BH, BS = 180, 320, 6


class Decor:
    def __init__(self, seed):
        self.im = Image.new("RGBA", (BW, BH), (0, 0, 0, 255))
        self.rnd = random.Random(seed)

    def r(self, x0, y0, x1, y1, col):
        for y in range(max(0, y0), min(BH - 1, y1) + 1):
            for x in range(max(0, x0), min(BW - 1, x1) + 1):
                self.im.putpixel((x, y), col)

    def pt(self, x, y, col):
        if 0 <= x < BW and 0 <= y < BH:
            self.im.putpixel((x, y), col)

    def melange(self, x, y, col, a):
        if 0 <= x < BW and 0 <= y < BH:
            o = self.im.getpixel((x, y))
            self.im.putpixel((x, y), tuple(int(o[i] * (1 - a) + col[i] * a) for i in range(3)) + (255,))

    def degrade(self, y0, y1, haut, bas, bandes=8):
        for y in range(y0, y1 + 1):
            t = round((y - y0) / max(1, y1 - y0) * bandes) / bandes  # bandes franches
            self.r(0, y, BW - 1, y, tuple(int(haut[i] + (bas[i] - haut[i]) * t) for i in range(3)) + (255,))

    def bruit(self, x0, y0, x1, y1, f=0.06, amp=0.08):
        for y in range(y0, y1 + 1):
            for x in range(x0, x1 + 1):
                if self.rnd.random() < f:
                    o = self.im.getpixel((x, y))
                    k = 1 + self.rnd.choice((-amp, amp))
                    self.pt(x, y, tuple(max(0, min(255, int(v * k))) for v in o[:3]) + (255,))

    def etoiles(self, y1, n=60):
        for _ in range(n):
            self.pt(self.rnd.randrange(BW), self.rnd.randrange(y1), c("dfe6ff") if self.rnd.random() < 0.7 else c("8fa0d8"))

    def immeubles(self, base, coul, fen):
        x = 0
        while x < BW:
            w = self.rnd.randint(14, 28); h = self.rnd.randint(30, 70)
            self.r(x, base - h, x + w, base, coul)
            for fy in range(base - h + 4, base - 3, 6):
                for fx in range(x + 3, x + w - 2, 5):
                    if self.rnd.random() < 0.35:
                        self.r(fx, fy, fx + 1, fy + 2, fen)
            x += w + self.rnd.randint(0, 3)

    def projecteur(self, x, y_tete, sol):
        self.r(x, y_tete, x + 1, sol, c("3a3f4a"))
        self.r(x - 6, y_tete - 6, x + 7, y_tete, c("2a2e36"))
        for k in range(-5, 7, 2):
            self.r(x + k, y_tete - 5, x + k, y_tete - 1, c("fff6c8"))
        for rr in range(4, 26):
            for a in range(0, 360, 4):
                px = int(x + rr * math.cos(math.radians(a))); py = int(y_tete - 3 + rr * math.sin(math.radians(a)))
                self.melange(px, py, c("fff1b0"), 0.10 * (1 - rr / 26))

    def terrain(self, y0, crepuscule=False):
        base, alt = (c("1d7035"), c("238042")) if not crepuscule else (c("2b6a3a"), c("327646"))
        for y in range(y0, BH):
            self.r(0, y, BW - 1, y, base if ((y - y0) // 14) % 2 == 0 else alt)
        self.bruit(0, y0, BW - 1, BH - 1, f=0.12, amp=0.07)
        self.r(0, y0 + 50, BW - 1, y0 + 50, c("e8efe9"))
        for a in range(0, 360, 2):
            self.pt(int(90 + 34 * math.cos(math.radians(a))), int(y0 + 50 + 12 * math.sin(math.radians(a))), c("e8efe9"))

    def grillage(self, y0, y1):
        for y in range(y0, y1 + 1):
            for x in range(BW):
                if (x + y) % 6 == 0 or (x - y) % 6 == 0:
                    self.melange(x, y, c("9aa3ad"), 0.55)
        for x in range(0, BW, 30):
            self.r(x, y0 - 2, x, y1, c("6b7480"))
        self.r(0, y0 - 2, BW - 1, y0 - 2, c("6b7480"))

    def vignette(self, force=0.55):
        for y in range(BH):
            for x in range(BW):
                dx, dy = (x - BW / 2) / (BW / 2), (y - BH * 0.55) / (BH / 2)
                d = min(1, (dx * dx + dy * dy) ** 0.5)
                if d > 0.55:
                    self.melange(x, y, (0, 0, 0, 255), force * (d - 0.55) / 0.45)

    def save(self, nom):
        self.im.resize((BW * BS, BH * BS), Image.NEAREST).convert("RGB").save(OUT / f"{nom}.png")
        print("décor", nom)


def nuit_terrain(nom="terrain_nuit", crepuscule=False):
    d = Decor(11)
    if crepuscule:
        d.degrade(0, 170, c("2a1f4a"), c("e0784a"), 10)
    else:
        d.degrade(0, 170, c("070b1c"), c("1c2552"), 10)
        d.etoiles(110)
    d.immeubles(172, c("141a2e") if not crepuscule else c("2c2440"), c("ffd36b"))
    d.grillage(150, 186)
    d.terrain(187, crepuscule)
    d.projecteur(16, 58, 186); d.projecteur(160, 52, 186)
    d.vignette()
    d.save(nom)


def vestiaire():
    d = Decor(21)
    d.r(0, 0, BW - 1, 232, c("b9c4c9"))
    for y in range(0, 232, 10):
        d.r(0, y, BW - 1, y, c("98a4aa"))
        for x in range((y // 10 % 2) * 5, BW, 10):
            d.r(x, y, x, y + 9, c("98a4aa"))
    d.r(40, 6, 140, 9, c("e8fbff"))  # néon
    for k in range(10, 60):
        for x in range(30, 151):
            d.melange(x, k, c("ffffff"), 0.12 * (1 - (k - 10) / 50))
    d.r(8, 84, 172, 86, c("6d4c35"))  # porte-manteaux
    tenues = [True, False, True, False, False, True, False]  # la moitié des crochets est vide
    for i, x in enumerate(range(16, 172, 24)):
        d.r(x, 87, x + 1, 92, c("cfd3d8"))
        if tenues[i % len(tenues)]:
            d.r(x - 8, 93, x + 9, 120, c("1e8f4e")); d.r(x - 11, 93, x - 8, 104, c("1e8f4e")); d.r(x + 9, 93, x + 12, 104, c("1e8f4e"))
            d.r(x - 3, 93, x + 4, 95, c("f2f4f5"))
            d.r(x + 6, 96, x + 9, 120, c("17703d"))
    d.r(0, 196, BW - 1, 207, c("8d6e4f")); d.r(0, 196, BW - 1, 197, c("a88560"))  # banc
    for x in (10, 60, 115, 165):
        d.r(x, 208, x + 3, 232, c("5a4330"))
    d.r(0, 233, BW - 1, BH - 1, c("4e5d66"))
    for y in range(233, BH, 12):
        d.r(0, y, BW - 1, y, c("435059"))
    for x in range(0, BW, 16):
        d.r(x, 233, x, BH - 1, c("435059"))
    d.r(140, 238, 160, 244, c("e8e8e8")); d.r(141, 236, 159, 237, c("1e8f4e"))  # sac
    d.vignette(0.6)
    d.save("vestiaire")


def garage():
    d = Decor(31)
    d.r(0, 0, BW - 1, 225, c("3b3833"))
    for y in range(0, 225, 8):
        d.r(0, y, BW - 1, y, c("332f2b"))
        for x in range((y // 8 % 2) * 8, BW, 16):
            d.r(x, y, x, y + 7, c("332f2b"))
    d.r(18, 40, 78, 100, c("1f2a44")); d.r(18, 40, 78, 41, c("5a5f66")); d.r(47, 40, 48, 100, c("5a5f66"))
    d.r(18, 70, 78, 71, c("5a5f66"))
    for k in range(8):
        d.pt(24 + k * 7, 48 + (k * 5) % 18, c("ffd36b"))
    d.r(100, 30, 168, 110, c("8a6b4a"))  # panneau à outils
    for x in range(104, 166, 6):
        for y in range(34, 108, 6):
            d.pt(x, y, c("5c4630"))
    d.r(108, 40, 110, 70, c("9aa0a6")); d.r(105, 38, 113, 42, c("9aa0a6"))
    d.r(122, 45, 124, 80, c("c0392b")); d.r(120, 42, 126, 46, c("9aa0a6"))
    d.r(138, 40, 156, 46, c("9aa0a6")); d.r(145, 46, 148, 72, c("6d4c35"))
    d.r(132, 84, 160, 104, c("f2f4f5")); d.r(136, 88, 156, 92, c("1e8f4e")); d.r(140, 95, 152, 100, c("1e8f4e"))
    d.r(0, 226, BW - 1, BH - 1, c("5b5853"))
    d.bruit(0, 226, BW - 1, BH - 1, f=0.18, amp=0.08)
    d.r(6, 205, 174, 214, c("7a5236")); d.r(6, 205, 174, 206, c("94673f"))  # bureau
    d.r(10, 215, 170, 262, c("5e3f29"))
    d.r(24, 186, 54, 204, c("c9c4b2")); d.r(27, 189, 51, 200, c("2a3b4a"))
    d.r(122, 198, 150, 204, c("efe8d6")); d.r(126, 196, 152, 200, c("e3dcc8"))
    d.vignette(0.6)
    d.save("garage")


def parking():
    d = Decor(41)
    d.degrade(0, 150, c("06091a"), c("161d3d"), 8)
    d.etoiles(90, 35)
    d.r(0, 80, BW - 1, 200, c("232838"))
    for fy in range(90, 190, 14):
        for fx in range(8, 175, 14):
            d.r(fx, fy, fx + 6, fy + 7, c("ffd36b") if d.rnd.random() < 0.25 else c("161a26"))
    d.r(0, 200, BW - 1, BH - 1, c("2b2d33"))
    d.bruit(0, 200, BW - 1, BH - 1, f=0.15, amp=0.1)
    for x in range(10, BW, 40):
        d.r(x, 215, x + 1, 300, c("c9ccd2"))
    d.r(146, 120, 148, 300, c("4a4f5a")); d.r(134, 116, 152, 121, c("4a4f5a")); d.r(134, 121, 142, 123, c("fff6c8"))
    for y in range(124, BH):
        dem = (y - 124) * 0.32
        for x in range(int(138 - dem), int(138 + dem)):
            d.melange(x, y, c("ffeaa0"), 0.13)
    d.r(14, 214, 96, 246, c("6b1f24")); d.r(26, 198, 82, 214, c("6b1f24"))  # voiture
    d.r(31, 202, 52, 213, c("1d2a44")); d.r(56, 202, 77, 213, c("1d2a44"))
    d.r(14, 214, 96, 216, c("8a2a31")); d.r(90, 222, 96, 228, c("ffd36b"))
    d.r(22, 242, 36, 254, c("111111")); d.r(74, 242, 88, 254, c("111111"))
    d.r(27, 246, 31, 250, c("6b6f78")); d.r(79, 246, 83, 250, c("6b6f78"))
    d.vignette(0.6)
    d.save("parking")


def tableau():
    d = Decor(51)
    d.r(0, 0, BW - 1, BH - 1, c("1c2a2a"))
    d.bruit(0, 0, BW - 1, BH - 1, f=0.1, amp=0.08)
    d.r(12, 52, 167, 262, c("6d4c35"))
    d.r(16, 56, 163, 258, c("f1efe6"))
    d.r(16, 56, 163, 72, c("1e8f4e"))
    for k in range(12):
        d.r(18, 74 + k * 15 + 14, 161, 74 + k * 15 + 14, c("d7d3c6"))
    d.r(18, 74 + 11 * 15, 161, 74 + 12 * 15 - 2, c("f6c9c9"))
    d.r(18, 74 + 10 * 15, 161, 74 + 11 * 15 - 2, c("fbe3e3"))
    for x in (30, 48, 100):
        d.r(x, 50, x + 2, 52, c("c0392b"))
    d.vignette(0.55)
    d.save("tableau")


def choix():
    d = Decor(61)
    for y in range(BH):
        d.r(0, y, BW - 1, y, c("17603a") if (y // 18) % 2 == 0 else c("1b6d42"))
    d.degrade(0, 70, c("0a1a12"), c("17603a"), 6)
    for _ in range(260):
        d.pt(d.rnd.randrange(BW), d.rnd.randrange(8, 60), d.rnd.choice([c("2c3e50"), c("1e8f4e"), c("f2f4f5"), c("34495e")]))
    d.bruit(0, 70, BW - 1, BH - 1, f=0.08, amp=0.06)
    d.vignette(0.7)
    d.save("choix")


nuit_terrain()
nuit_terrain("terrain_soir", crepuscule=True)
vestiaire()
garage()
parking()
tableau()
choix()
