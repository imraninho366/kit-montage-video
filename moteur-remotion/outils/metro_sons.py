"""Bruitages et musique de DERNIER MÉTRO, synthétisés (aucune piste tierce → aucun risque Content ID).

    python3 outils/metro_sons.py

Écrit dans public/metro/sons/ (48 kHz mono 16 bits, crête à -1 dBFS ; le volume se règle dans Remotion).
"""
import math
import random
import struct
import wave
from pathlib import Path

SR = 48000
OUT = Path(__file__).resolve().parents[1] / "public/metro/sons"
OUT.mkdir(parents=True, exist_ok=True)
rnd = random.Random(14)


def ecrire(nom, ech):
    pic = max(1e-9, max(abs(x) for x in ech))
    with wave.open(str(OUT / f"{nom}.wav"), "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes(b"".join(struct.pack("<h", int(max(-1, min(1, x / pic * 0.89)) * 32767)) for x in ech))
    print(f"{nom:12} {len(ech) / SR:5.2f} s")


def n(sec):
    return int(sec * SR)


def bruit(k):
    return [rnd.uniform(-1, 1) for _ in range(k)]


def passe_bas(ech, coef):
    out, y = [], 0.0
    for x in ech:
        y += coef * (x - y); out.append(y)
    return out


def passe_haut(ech, coef):
    out, y, px = [], 0.0, 0.0
    for x in ech:
        y = coef * (y + x - px); px = x; out.append(y)
    return out


def env(k, attaque, chute):
    a, c = max(1, n(attaque)), max(1, n(chute))
    return [min(1.0, i / a) * min(1.0, (k - i) / c) for i in range(k)]


def mix(*pistes):
    k = max(len(p) for p in pistes)
    return [sum(p[i] for p in pistes if i < len(p)) for i in range(k)]


def gain(ech, g):
    return [x * g for x in ech]


def resonance(ech, freq, q=0.97):
    """Filtre résonant simple (2 pôles) : donne une hauteur à du bruit."""
    w = 2 * math.pi * freq / SR
    a1, a2 = 2 * q * math.cos(w), -q * q
    out, y1, y2 = [], 0.0, 0.0
    for x in ech:
        y = x * (1 - q) + a1 * y1 + a2 * y2
        y2, y1 = y1, y; out.append(y)
    return out


# --- alerte des téléphones : deux sons purs superposés (853 + 960 Hz), en impulsions longues, comme les alertes
#     de diffusion cellulaire ; plusieurs téléphones légèrement décalés = tout le wagon sonne
def alerte(sec=4.0):
    k = n(sec)
    def un(decal, g):
        out = []
        for i in range(k):
            t = i / SR - decal
            on = 1.0 if t >= 0 and (t % 1.0) < 0.8 else 0.0
            out.append(on * g * (math.sin(2 * math.pi * 853 * t) + math.sin(2 * math.pi * 960 * t)))
        return out
    return [x * e for x, e in zip(mix(un(0, 1.0), un(0.07, 0.55), un(0.16, 0.4), un(0.23, 0.3)), env(k, 0.005, 0.15))]


# --- trotteuse : tic sec
def tic():
    k = n(0.06)
    return [x * e for x, e in zip(resonance(bruit(k), 2600, 0.9), env(k, 0.0005, 0.05))]


# --- appel coupé : trois bips courts (tonalité 440 Hz)
def raccroche():
    out = []
    for _ in range(3):
        b = [math.sin(2 * math.pi * 440 * i / SR) for i in range(n(0.16))]
        out += [x * e for x, e in zip(b, env(len(b), 0.004, 0.02))] + [0.0] * n(0.14)
    return out


# --- la rame qui roule : grondement + claquements de joints de rail, réguliers
def roulement(sec=8.0):
    k = n(sec)
    gronde = passe_bas(bruit(k), 0.012)
    sifflet = gain(resonance(bruit(k), 820, 0.995), 0.25)
    clacs = [0.0] * k
    t = 0.12
    while t < sec:
        for dt in (0.0, 0.11):  # deux bogies
            d = n(t + dt)
            for i in range(n(0.05)):
                if d + i < k:
                    clacs[d + i] += math.exp(-i / n(0.008)) * rnd.uniform(-1, 1) * 1.4
        t += 0.62
    clacs = passe_bas(clacs, 0.18)
    return [x * (0.8 + 0.2 * math.sin(i / SR * 3.1)) for i, x in enumerate(mix(gain(gronde, 9.0), sifflet, clacs))]


# --- freinage : crissement métallique qui glisse vers le grave + grondement qui meurt
def frein(sec=2.0):
    k = n(sec)
    out = [0.0] * k
    for f0, a in ((2900, 1.0), (4100, 0.55), (1750, 0.4)):
        ph = 0.0
        for i in range(k):
            t = i / SR
            f = f0 * (1 - 0.25 * t / sec) * (1 + 0.012 * math.sin(2 * math.pi * 23 * t))
            ph += 2 * math.pi * f / SR
            out[i] += a * math.sin(ph) * (0.6 + 0.4 * rnd.random())
    e = env(k, 0.05, 0.5)
    gronde = passe_bas(bruit(k), 0.01)
    return [o * e[i] * 0.5 + gronde[i] * 5 * (1 - i / k) for i, o in enumerate(out)]


def choc():
    k = n(0.9)
    b = passe_bas(bruit(k), 0.03)
    return [(b[i] * 6 + math.sin(2 * math.pi * 55 * i / SR) * 0.8) * math.exp(-i / n(0.12)) for i in range(k)]


# --- électricité : grésillement du néon qui clignote, coupure, ballast de secours
def gresille(sec=1.1):
    k = n(sec)
    b = bruit(k)
    out = []
    for i in range(k):
        t = i / SR
        on = 1.0 if (int(t * 17) % 3 != 0 or rnd.random() < 0.02) else 0.0
        out.append((b[i] * 0.5 + math.sin(2 * math.pi * 100 * t) * 0.6 + math.sin(2 * math.pi * 300 * t) * 0.2) * on)
    return passe_haut(out, 0.95)


def coupure():
    k = n(0.8)
    out, ph = [], 0.0
    for i in range(k):
        t = i / SR
        ph += 2 * math.pi * (420 * math.exp(-t * 4) + 40) / SR
        out.append(math.sin(ph) * math.exp(-t * 3.5))
    cl = passe_bas(bruit(n(0.06)), 0.3)
    return mix(out, gain(cl, 3))


def secours(sec=10.0):
    k = n(sec)
    b = passe_bas(bruit(k), 0.05)
    return [math.sin(2 * math.pi * 50 * i / SR) * 0.5 + math.sin(2 * math.pi * 150 * i / SR) * 0.25 + b[i] * 0.6 for i in range(k)]


# --- téléphone
def vibre():
    k = n(0.75)
    out = []
    for i in range(k):
        t = i / SR
        on = 1.0 if (t < 0.28 or 0.42 < t < 0.7) else 0.0
        out.append((math.sin(2 * math.pi * 165 * t) + 0.4 * math.sin(2 * math.pi * 330 * t)) * on * (0.7 + 0.3 * math.sin(2 * math.pi * 31 * t)))
    return passe_bas(out, 0.25)


def ding():
    out = [0.0] * n(0.9)
    for d, f in ((0.0, 1318.5), (0.11, 1975.5)):
        for i in range(n(0.75)):
            j = n(d) + i
            if j < len(out):
                out[j] += math.sin(2 * math.pi * f * i / SR) * math.exp(-i / n(0.18)) * (1 if i > 30 else i / 30)
    return out


# --- mouvements et objets
def whoosh(sec=0.38):
    k = n(sec)
    b = bruit(k)
    out, y = [], 0.0
    for i in range(k):
        c = 0.02 + 0.25 * math.sin(math.pi * i / k) ** 2
        y += c * (b[i] - y); out.append(y * math.sin(math.pi * i / k))
    return out


def levier():
    k = n(0.5)
    out = [0.0] * k
    for f, a in ((1830, 1.0), (2710, 0.6), (4400, 0.3)):
        for i in range(k):
            out[i] += a * math.sin(2 * math.pi * f * i / SR) * math.exp(-i / n(0.05))
    b = passe_bas(bruit(n(0.12)), 0.2)
    return mix(out, gain(b, 2.5))


def porte():
    k = n(1.3)
    souffle = passe_haut(bruit(k), 0.9)
    souffle = [x * math.exp(-i / n(0.35)) * 1.2 for i, x in enumerate(souffle)]
    glisse = passe_bas(bruit(k), 0.04)
    glisse = [x * (4 if 0.15 < i / SR < 0.8 else 0) for i, x in enumerate(glisse)]
    butee = [0.0] * n(0.8) + [x * math.exp(-i / n(0.07)) * 5 for i, x in enumerate(passe_bas(bruit(n(0.4)), 0.05))]
    return mix(souffle, glisse, butee)


def saut():
    k = n(0.6)
    b = passe_bas(bruit(k), 0.4)
    return [(b[i] * 0.8 + rnd.uniform(-1, 1) * 0.3) * math.exp(-i / n(0.09)) for i in range(k)]


def pas(sec=3.6):
    k = n(sec)
    out = [0.0] * k
    t = 0.05
    while t < sec - 0.3:
        loin = math.exp(-t * 0.75)
        d = n(t)
        for i in range(n(0.18)):
            if d + i < k:
                out[d + i] += rnd.uniform(-1, 1) * math.exp(-i / n(0.035)) * loin
        t += 0.48
    return passe_bas(out, 0.3)


def coup():
    """Un poing contre une vitre de rame : choc sourd + résonance métallique du cadre."""
    k = n(0.7)
    sourd = passe_bas(bruit(k), 0.05)
    cadre = gain(resonance(bruit(k), 310, 0.996), 0.6)
    return [(sourd[i] * 7 + cadre[i] + math.sin(2 * math.pi * 70 * i / SR) * 0.9) * math.exp(-i / n(0.09)) for i in range(k)]


def clic():
    return [rnd.uniform(-1, 1) * math.exp(-i / n(0.004)) for i in range(n(0.05))]


def vent(sec=16.0):
    k = n(sec)
    b = bruit(k)
    out, y = [], 0.0
    for i in range(k):
        c = 0.004 + 0.003 * math.sin(i / SR * 0.7)
        y += c * (b[i] - y); out.append(y)
    return out


# --- musique (aucune mélodie : nappes, pulsation, montée)
def drone(sec=34.0):
    k = n(sec)
    out = [0.0] * k
    for f, a in ((55.0, 1.0), (82.4, 0.55), (110.3, 0.35), (164.0, 0.12), (58.2, 0.5)):  # la grave + battement dissonant
        for i in range(k):
            t = i / SR
            out[i] += a * math.sin(2 * math.pi * f * t + 0.6 * math.sin(2 * math.pi * 0.07 * t))
    souffle = passe_bas(bruit(k), 0.004)
    e = env(k, 2.5, 2.0)
    return [(o + souffle[i] * 6) * e[i] for i, o in enumerate(out)]


def battement(sec=8.0, bpm=96):
    k = n(sec)
    out = [0.0] * k
    t = 0.0
    while t < sec:
        for dt, a in ((0.0, 1.0), (0.17, 0.7)):
            d = n(t + dt)
            for i in range(n(0.2)):
                if d + i < k:
                    out[d + i] += a * math.sin(2 * math.pi * 52 * i / SR) * math.exp(-i / n(0.045))
        t += 60 / bpm
    return out


def montee(sec=2.2):
    k = n(sec)
    b = bruit(k)
    out, y, ph = [], 0.0, 0.0
    for i in range(k):
        r = i / k
        y += (0.01 + 0.3 * r * r) * (b[i] - y)
        ph += 2 * math.pi * (110 + 660 * r * r) / SR
        out.append((y * 1.5 + 0.35 * math.sin(ph)) * r ** 1.6)
    return out


def impact():
    k = n(2.6)
    b = passe_bas(bruit(k), 0.02)
    return [(b[i] * 5 + math.sin(2 * math.pi * 41 * i / SR) * 1.2 + math.sin(2 * math.pi * 61.7 * i / SR) * 0.6) * math.exp(-i / n(0.55)) for i in range(k)]


def pop():
    return [math.sin(2 * math.pi * (900 - 500 * i / n(0.09)) * i / SR) * math.exp(-i / n(0.03)) for i in range(n(0.12))]


if __name__ == "__main__":
    for nom, f in [("roulement", roulement), ("frein", frein), ("choc", choc), ("gresille", gresille), ("coupure", coupure),
                   ("secours", secours), ("vibre", vibre), ("ding", ding), ("whoosh", whoosh), ("levier", levier),
                   ("porte", porte), ("saut", saut), ("pas", pas), ("clic", clic), ("coup", coup), ("vent", vent), ("drone", drone),
                   ("battement", battement), ("montee", montee), ("impact", impact), ("pop", pop),
                   ("alerte", alerte), ("tic", tic), ("raccroche", raccroche)]:
        ecrire(nom, f())
