"""Sons de ONE LIFE, synthétisés (aucune piste tierce, donc aucun risque Content ID).

    python3 outils/onelife_sons.py

Écrit dans public/onelife/ : nappe.wav (accords doux sans mélodie, 66 s), tic.wav (cran de la roue),
whoosh.wav (changement de plan), coeur.wav (un battement), ding.wav (bonne nouvelle),
thud.wav (mauvaise nouvelle), impact.wav (verdict de la roue de la mort). 48 kHz mono, 16 bits.
"""
import math
import random
import struct
import wave
from pathlib import Path

SR = 48000
SORTIE = Path(__file__).resolve().parents[1] / "public/onelife"
SORTIE.mkdir(parents=True, exist_ok=True)
random.seed(7)


def ecrire(nom, ech):
    pic = max(1e-9, max(abs(x) for x in ech))
    ech = [x / pic * 0.89 for x in ech]  # environ -1 dBFS ; le volume se règle dans Remotion
    with wave.open(str(SORTIE / nom), "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes(b"".join(struct.pack("<h", int(x * 32767)) for x in ech))


def passe_bas(ech, coef):
    out, y = [], 0.0
    for x in ech:
        y += coef * (x - y)
        out.append(y)
    return out


def nappe(duree=66.0):
    """Quatre accords lents (la mineur, fa, do, sol), notes tenues, enveloppes douces : une ambiance, pas une mélodie."""
    accords = [[220.0, 261.63, 329.63], [174.61, 220.0, 261.63], [196.0, 261.63, 329.63], [196.0, 246.94, 293.66]]
    n = int(duree * SR)
    duree_acc = 4.0
    ech = [0.0] * n
    for i in range(n):
        t = i / SR
        k = int(t / duree_acc) % len(accords)
        local = (t % duree_acc) / duree_acc
        env = math.sin(math.pi * local) ** 0.6
        s = 0.0
        for j, f in enumerate(accords[k]):
            s += math.sin(2 * math.pi * f * t + j) + 0.25 * math.sin(2 * math.pi * f * 2 * t)
        basse = 0.6 * math.sin(2 * math.pi * accords[k][0] / 2 * t)
        ech[i] = env * (s / 3.0) + basse * env
    ech = passe_bas(ech, 0.08)
    fondu = int(2.0 * SR)
    for i in range(fondu):
        ech[i] *= i / fondu
        ech[-1 - i] *= i / fondu
    return ech


def tic():
    n = int(0.035 * SR)
    return [math.exp(-t / (0.004 * SR)) * (0.6 * math.sin(2 * math.pi * 2400 * t / SR) + 0.4 * random.uniform(-1, 1)) for t in range(n)]


def whoosh():
    n = int(0.45 * SR)
    bruit = [random.uniform(-1, 1) for _ in range(n)]
    out, y = [], 0.0
    for i, x in enumerate(bruit):
        p = i / n
        coef = 0.02 + 0.25 * math.sin(math.pi * p)  # le filtre s'ouvre puis se referme
        y += coef * (x - y)
        out.append(y * math.sin(math.pi * p) ** 1.5)
    return out


def coeur():
    """Un battement « lub-dub » grave."""
    n = int(0.6 * SR)
    ech = [0.0] * n
    for debut, vol, f in [(0.0, 1.0, 52), (0.17, 0.7, 46)]:
        d = int(debut * SR)
        for t in range(int(0.16 * SR)):
            if d + t < n:
                ech[d + t] += vol * math.exp(-t / (0.035 * SR)) * math.sin(2 * math.pi * f * t / SR)
    return ech


def ding():
    n = int(1.2 * SR)
    ech = [0.0] * n
    for debut, f in [(0.0, 880.0), (0.12, 1318.5)]:
        d = int(debut * SR)
        for t in range(n - d):
            ech[d + t] += math.exp(-t / (0.35 * SR)) * (math.sin(2 * math.pi * f * t / SR) + 0.3 * math.sin(2 * math.pi * f * 2.01 * t / SR))
    return ech


def thud():
    n = int(0.9 * SR)
    return [math.exp(-t / (0.18 * SR)) * (math.sin(2 * math.pi * (70 - 25 * t / n) * t / SR) + 0.15 * random.uniform(-1, 1)) for t in range(n)]


def impact():
    """Coup sourd + souffle qui retombe : le verdict de la roue de la mort."""
    n = int(2.2 * SR)
    bruit = passe_bas([random.uniform(-1, 1) for _ in range(n)], 0.03)
    return [math.exp(-t / (0.5 * SR)) * (0.9 * math.sin(2 * math.pi * 41 * t / SR) + 3.0 * bruit[t]) for t in range(n)]


if __name__ == "__main__":
    for nom, f in [("tic.wav", tic), ("whoosh.wav", whoosh), ("coeur.wav", coeur), ("ding.wav", ding),
                   ("thud.wav", thud), ("impact.wav", impact), ("nappe.wav", nappe)]:
        ecrire(nom, f())
        print("ok", nom)
