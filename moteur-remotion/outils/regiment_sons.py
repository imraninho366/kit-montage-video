"""Sons du Régiment, synthétisés (aucune piste tierce : aucun risque Content ID).

    python3 outils/regiment_sons.py

public/regiment/clairon.wav : appel de clairon (sol-do-mi-sol, timbre cuivré par harmoniques), 2,6 s.
public/regiment/sifflet.wav : coup de sifflet roulé du sergent, 0,9 s. 48 kHz mono 16 bits.
"""
import math
import struct
import wave
from pathlib import Path

SR = 48000
SORTIE = Path(__file__).resolve().parents[1] / "public/regiment"


def ecrire(nom, ech):
    pic = max(1e-9, max(abs(x) for x in ech))
    with wave.open(str(SORTIE / nom), "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes(b"".join(struct.pack("<h", int(x / pic * 0.89 * 32767)) for x in ech))


def note_cuivre(freq, duree, attaque=0.03):
    n = int(duree * SR)
    out = []
    for i in range(n):
        t = i / SR
        env = min(1, t / attaque) * min(1, (duree - t) / 0.06)
        brillance = 0.55 + 0.45 * min(1, t / 0.12)  # le cuivre s'ouvre après l'attaque
        v = sum((brillance ** (k - 1)) / k * math.sin(2 * math.pi * freq * k * t + k) for k in range(1, 9))
        vib = 1 + 0.004 * math.sin(2 * math.pi * 5.5 * t)
        out.append(env * v * vib)
    return out


def clairon():
    G4, C5, E5, G5 = 392.0, 523.25, 659.25, 783.99
    motif = [(G4, .18), (C5, .18), (E5, .18), (G5, .42), (E5, .18), (G5, .9)]
    ech = []
    for f, d in motif:
        ech += note_cuivre(f, d) + [0.0] * int(0.025 * SR)
    # un peu de salle : écho court
    retard = int(0.09 * SR)
    return [x + 0.25 * (ech[i - retard] if i >= retard else 0) for i, x in enumerate(ech + [0.0] * retard)]


def sifflet():
    n = int(0.9 * SR)
    out, phase = [], 0.0
    for i in range(n):
        t = i / SR
        f = 2900 + 260 * math.sin(2 * math.pi * 28 * t)  # le roulement de la bille
        phase += 2 * math.pi * f / SR
        env = min(1, t / 0.02) * min(1, (0.9 - t) / 0.08)
        out.append(env * (math.sin(phase) + 0.15 * math.sin(2 * phase)))
    return out


if __name__ == "__main__":
    SORTIE.mkdir(parents=True, exist_ok=True)
    ecrire("clairon.wav", clairon())
    ecrire("sifflet.wav", sifflet())
    for nom in ("whoosh.wav", "tic.wav", "tac.wav", "nappe.wav", "bip_vert.wav", "pas.wav"):
        (SORTIE / nom).write_bytes((SORTIE.parent / "casse" / nom).read_bytes())
    print("ok")
