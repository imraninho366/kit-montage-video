"""Bruitages de LE COACH, synthétisés (aucune piste tierce → aucun risque Content ID, pas de musique).

    python3 outils/coach_sons.py

Écrit dans public/coach/sons/ (48 kHz mono 16 bits, normalisés vers -1 dBFS ; volume réglé dans Remotion) :
whoosh, pop, sifflet, ballon, porte, notif, foule (murmure 6 s), coup (impact grave), moteur (voiture au ralenti 4 s),
ding (choix), tic (apparition des cartes).
"""
import math
import random
import struct
import wave
from pathlib import Path

SR = 48000
OUT = Path(__file__).resolve().parents[1] / "public/coach/sons"
OUT.mkdir(parents=True, exist_ok=True)
rnd = random.Random(7)


def ecrire(nom, ech):
    pic = max(1e-9, max(abs(x) for x in ech))
    with wave.open(str(OUT / f"{nom}.wav"), "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes(b"".join(struct.pack("<h", int(x / pic * 0.89 * 32767)) for x in ech))
    print(nom, f"{len(ech) / SR:.2f} s")


def bruit(n):
    return [rnd.uniform(-1, 1) for _ in range(n)]


def passe_bas(ech, coef):
    out, y = [], 0.0
    for x in ech:
        y += coef * (x - y); out.append(y)
    return out


def passe_haut(ech, coef):
    return [a - b for a, b in zip(ech, passe_bas(ech, coef))]


def whoosh():
    n = int(0.45 * SR)
    out, y = [], 0.0
    for i, x in enumerate(bruit(n)):  # filtre qui s'ouvre puis se ferme
        e = math.sin(math.pi * i / n) ** 2
        y += (0.02 + 0.25 * e) * (x - y); out.append(y * e)
    ecrire("whoosh", out)


def pop():
    n = int(0.12 * SR)
    ecrire("pop", [math.sin(2 * math.pi * (700 - 3000 * i / SR) * i / SR) * (1 - i / n) ** 3 for i in range(n)])


def sifflet():
    n = int(0.9 * SR)
    out = []
    for i in range(n):
        t = i / SR
        f = 2900 + 120 * math.sin(2 * math.pi * 28 * t)  # roulement de la bille
        a = min(1, t / 0.02) * (1 if t < 0.75 else max(0, 1 - (t - 0.75) / 0.15))
        out.append(a * (0.8 * math.sin(2 * math.pi * f * t) + 0.15 * rnd.uniform(-1, 1)))
    ecrire("sifflet", out)


def ballon():
    n = int(0.25 * SR)
    ecrire("ballon", [math.sin(2 * math.pi * (140 * math.exp(-i / SR * 18) + 60) * i / SR) * math.exp(-i / SR * 22)
                      + 0.4 * rnd.uniform(-1, 1) * math.exp(-i / SR * 90) for i in range(n)])


def porte():
    n = int(0.6 * SR)
    b = passe_bas(bruit(n), 0.08)
    ecrire("porte", [b[i] * math.exp(-i / SR * 14) * 2 + math.sin(2 * math.pi * 85 * i / SR) * math.exp(-i / SR * 9) * 0.8
                     for i in range(n)])


def notif():
    n = int(0.5 * SR)
    out = []
    for i in range(n):
        t = i / SR
        f, t0 = (1318, t) if t < 0.12 else (1760, t - 0.12)
        out.append(math.sin(2 * math.pi * f * t) * math.exp(-t0 * 12))
    ecrire("notif", out)


def foule():
    n = int(6 * SR)
    b = passe_bas(bruit(n), 0.05)
    out = []
    for i in range(n):
        t = i / SR
        mod = 0.7 + 0.3 * math.sin(2 * math.pi * 0.6 * t) * math.sin(2 * math.pi * 0.23 * t + 1)
        out.append(b[i] * mod * min(1, t / 0.8, (6 - t) / 0.8))
    ecrire("foule", passe_haut(out, 0.01))


def coup():
    n = int(1.4 * SR)
    out = [math.sin(2 * math.pi * (55 * math.exp(-i / SR * 2) + 32) * i / SR) * math.exp(-i / SR * 3.2)
           + 0.3 * rnd.uniform(-1, 1) * math.exp(-i / SR * 40) for i in range(n)]
    ecrire("coup", passe_bas(out, 0.2))


def moteur():
    n = int(4 * SR)
    out = []
    for i in range(n):
        t = i / SR
        ph = 2 * math.pi * (38 + 2 * math.sin(2 * math.pi * 0.7 * t)) * t
        out.append((0.6 * math.sin(ph) + 0.3 * math.sin(2 * ph) + 0.25 * rnd.uniform(-1, 1)) * min(1, t / 0.5, (4 - t) / 0.7))
    ecrire("moteur", passe_bas(out, 0.06))


def ding():
    n = int(1.2 * SR)
    ecrire("ding", [(math.sin(2 * math.pi * 1046 * i / SR) + 0.5 * math.sin(2 * math.pi * 1568 * i / SR)) * math.exp(-i / SR * 3.5)
                    for i in range(n)])


def tic():
    n = int(0.06 * SR)
    ecrire("tic", [rnd.uniform(-1, 1) * (1 - i / n) ** 4 + math.sin(2 * math.pi * 2200 * i / SR) * (1 - i / n) ** 6 for i in range(n)])


for f in (whoosh, pop, sifflet, ballon, porte, notif, foule, coup, moteur, ding, tic):
    f()
