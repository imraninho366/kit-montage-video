"""Voix ElevenLabs de L'Île des Abonnés : texte en un seul bloc → wav normalisé + temps de chaque mot.

    python3 outils/voix_ile.py pilote
    python3 outils/voix_ile.py ep01 casse   # Le Casse des Abonnés (même voix Hugo, choix d'Imran)

- Lit src/compositions/ile/<episode>_texte.txt (une phrase par ligne, nombres en toutes lettres).
- Un seul appel /with-timestamps (le texte entier, pour une voix fluide) → temps par caractère → temps par mot.
- loudnorm I=-14 TP=-1.5 LRA=11, 48 kHz mono → public/ile/<episode>_voix.wav.
  Pas de silenceremove : ça décalerait les temps des mots.
- Écrit src/compositions/ile/<episode>_voix.json : {"duree", "mots": [{"t", "a", "b"}]} (secondes).
Clé : ELEVENLABS_API_KEY dans ~/Downloads/comment-on-faisait/.env (même clé que les autres chaînes).
"""
import base64
import json
import subprocess
import sys
import urllib.request
from pathlib import Path

import os
try:  # le Python de python.org n'a pas de certificats racine
    import os
    import certifi
    os.environ.setdefault("SSL_CERT_FILE", certifi.where())
except ImportError:
    pass

KIT = Path(__file__).resolve().parents[1]
ENV = Path(os.environ.get("KIT_ENV", Path(__file__).resolve().parents[1] / ".env"))
# Hugo - Punchy French Creator (bibliothèque ElevenLabs, ajoutée au compte le 07/11/2026, choisie par Imran).
# Anatole (Jrq4GqCKqYpigdQsZRkP) a été refusée : « pas assez dynamique, fluide et réaliste ».
VOIX = "3Tp5mYhT9wrfnry9pzvV"
# Autre voix possible sans toucher au reste : VOIX_ID=... (ex. Victoria O31r762Gb3WFygrEOGh0 pour l'Assemblée de Code Ouvert)
VOIX = os.environ.get("VOIX_ID", VOIX)
# Hugo est vérifiée en français sur eleven_v4 (c'est le moteur de sa démo). Sur multilingual_v2 elle ne
# ressemble pas à la démo : Imran l'a entendu tout de suite (« t'as pas fait avec Hugo »).
MODELE = "eleven_v4"
# vitesse naturelle : l'accélération rendait la voix moins fluide
REGLAGES = {"stability": 0.5, "similarity_boost": 0.8, "use_speaker_boost": True}


def cle():
    for l in ENV.read_text().splitlines():
        if l.startswith("ELEVENLABS_API_KEY="):
            return l.split("=", 1)[1].strip()
    sys.exit("ELEVENLABS_API_KEY absente de " + str(ENV))


def mots_depuis(texte, debuts, fins):
    """Regroupe les temps par caractère en mots (séparés par espace ou retour à la ligne)."""
    mots, cour = [], None
    for i, ch in enumerate(texte):
        if ch in " \n":
            if cour:
                mots.append(cour); cour = None
            continue
        if cour is None:
            cour = {"t": "", "a": debuts[i], "b": fins[i]}
        cour["t"] += ch
        cour["b"] = fins[i]
    if cour:
        mots.append(cour)
    return mots


def main():
    ep = sys.argv[1]
    chaine = sys.argv[2] if len(sys.argv) > 2 else "ile"
    dossier = KIT / "src/compositions" / chaine
    texte = (dossier / f"{ep}_texte.txt").read_text().strip()
    corps = json.dumps({"text": texte, "model_id": MODELE, "voice_settings": REGLAGES}).encode()
    req = urllib.request.Request(
        f"https://api.elevenlabs.io/v1/text-to-speech/{VOIX}/with-timestamps?output_format=mp3_44100_128",
        data=corps, headers={"xi-api-key": cle(), "Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=600) as r:
        rep = json.loads(r.read())
    al = rep["alignment"]
    # l'alignement renvoie le texte tel que reçu : on recolle les caractères pour retrouver les mots
    recu = "".join(al["characters"])
    mots = mots_depuis(recu, al["character_start_times_seconds"], al["character_end_times_seconds"])

    sortie = KIT / "public" / chaine
    sortie.mkdir(parents=True, exist_ok=True)
    brut = sortie / f"{ep}_voix_brute.mp3"
    brut.write_bytes(base64.b64decode(rep["audio_base64"]))
    wav = sortie / f"{ep}_voix.wav"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(brut), "-af", "loudnorm=I=-14:TP=-1.5:LRA=11",
                    "-ar", "48000", "-ac", "1", str(wav)], check=True)
    duree = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(wav)],
                                 capture_output=True, text=True, check=True).stdout)
    (dossier / f"{ep}_voix.json").write_text(json.dumps({"duree": duree, "mots": mots}, ensure_ascii=False, indent=1))
    print(f"{len(mots)} mots, {duree:.2f} s → {wav}")


if __name__ == "__main__":
    main()
