"""Sons du Casse des Abonnés, synthétisés (aucune piste tierce, donc aucun risque Content ID).

    python3 outils/casse_sons.py

Écrit dans public/casse/ : nappe.wav (tension grave, 70 s), tic.wav, tac.wav, pas.wav (4 pas), whoosh.wav,
sirene.wav (sirène lointaine à deux tons, 8 s), touche.wav, bip_vert.wav, zap.wav (laser qui se coupe). 48 kHz mono, 16 bits.
"""
import math
import random
import struct
import wave
from pathlib import Path

SR = 48000
SORTIE = Path(__file__).resolve().parents[1] / "public/casse"
random.seed(3)


def ecrire(nom, ech):
    pic = max(1e-9, max(abs(x) for x in ech))
    ech = [x / pic * 0.89 for x in ech]  # normalisé à environ -1 dBFS, le volume se règle dans Remotion
    with wave.open(str(SORTIE / nom), "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes(b"".join(struct.pack("<h", int(x * 32767)) for x in ech))


def passe_bas(ech, coef):
    out, y = [], 0.0
    for x in ech:
        y += coef * (x - y)
        out.append(y)
    return out


def nappe(duree=70.0):
    """Deux notes graves qui battent lentement + un souffle sourd : la tension sans mélodie."""
    n = int(duree * SR)
    bruit = passe_bas([random.uniform(-1, 1) for _ in range(n)], 0.004)
    ech = []
    for i in range(n):
        t = i / SR
        trem = 0.75 + 0.25 * math.sin(2 * math.pi * 0.18 * t)
        s = 0.55 * math.sin(2 * math.pi * 55 * t) + 0.35 * math.sin(2 * math.pi * 82.4 * t + 0.6 * math.sin(2 * math.pi * 0.07 * t))
        ech.append(trem * s + 6.0 * bruit[i])
    fondu = int(1.5 * SR)
    for i in range(fondu):
        ech[i] *= i / fondu
        ech[-1 - i] *= i / fondu
    return ech


def clic(freq, duree=0.05):
    n = int(duree * SR)
    return [math.exp(-t / (0.006 * SR)) * (0.7 * math.sin(2 * math.pi * freq * t / SR) + 0.3 * random.uniform(-1, 1)) for t in range(n)]


def pas():
    """Quatre pas lourds dans un couloir, de plus en plus proches."""
    ech = [0.0] * int(2.6 * SR)
    for debut, vol in [(0.0, 0.45), (0.62, 0.6), (1.24, 0.8), (1.86, 1.0)]:
        n = int(0.22 * SR)
        coup = passe_bas([random.uniform(-1, 1) for _ in range(n)], 0.03)
        for i in range(n):
            env = math.exp(-i / (0.035 * SR))
            ech[int(debut * SR) + i] += vol * env * (coup[i] * 8 + 0.6 * math.sin(2 * math.pi * 70 * i / SR))
    return ech


def whoosh(duree=0.7):
    n = int(duree * SR)
    ech, y = [], 0.0
    for i in range(n):
        p = i / n
        coef = 0.01 + 0.25 * math.sin(math.pi * p) ** 2  # le filtre s'ouvre puis se referme
        y += coef * (random.uniform(-1, 1) - y)
        ech.append(y * math.sin(math.pi * p) ** 1.5)
    return ech


def sirene(duree=8.0):
    """Sirène de police lointaine (deux tons), étouffée par les murs."""
    n = int(duree * SR)
    ech, phase = [], 0.0
    for i in range(n):
        t = i / SR
        f = 435 if int(t / 0.6) % 2 == 0 else 580
        phase += 2 * math.pi * f / SR
        env = min(1.0, t / 2.5) * min(1.0, (duree - t) / 1.0)
        ech.append(env * (math.sin(phase) + 0.3 * math.sin(2 * phase)))
    return passe_bas(ech, 0.08)


def bip(freqs, duree=0.12):
    """Bips électroniques successifs (ex. deux tons montants = code accepté)."""
    ech = []
    for f in freqs:
        n = int(duree * SR)
        ech += [math.sin(2 * math.pi * f * i / SR) * min(1.0, i / 200, (n - i) / 200) for i in range(n)]
        ech += [0.0] * int(0.03 * SR)
    return ech


def zap(duree=0.14):
    """Grésillement court d'un laser qui se coupe : bourdonnement en dents de scie + souffle."""
    n = int(duree * SR)
    return [math.exp(-i / (0.05 * SR)) * (0.6 * ((i * 140 / SR) % 1 - 0.5) + 0.4 * random.uniform(-1, 1)) for i in range(n)]


if __name__ == "__main__":
    SORTIE.mkdir(parents=True, exist_ok=True)
    ecrire("nappe.wav", nappe())
    ecrire("tic.wav", clic(2200))
    ecrire("tac.wav", clic(1500))
    ecrire("pas.wav", pas())
    ecrire("whoosh.wav", whoosh())
    ecrire("sirene.wav", sirene())
    ecrire("touche.wav", clic(900, 0.04))
    ecrire("bip_vert.wav", bip([1046, 1568]))
    ecrire("zap.wav", zap())
    print("sons écrits dans", SORTIE)
