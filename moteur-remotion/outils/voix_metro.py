"""Voix ElevenLabs de DERNIER MÉTRO : une voix par personnage, une réplique par appel.

    python3 outils/voix_metro.py ep01

- Lit src/compositions/metro/<ep>_script.txt : « ID PERSO | [balise] réplique » (# = commentaire).
- Une requête /with-timestamps par réplique, avec un cache par réplique (texte + voix) : relancer ne recoûte rien.
- Chaque réplique est rognée au premier et au dernier caractère prononcé, filtrée selon le perso
  (ANNONCE = haut-parleur, LOIN = écho de tunnel), puis normalisée → public/metro/<ep>/<ID>.wav.
- Écrit src/compositions/metro/<ep>_voix.json : {"lignes": [{"id", "perso", "texte", "fichier", "duree", "mots": [{"t", "a", "b"}]}]}.
Clé : ELEVENLABS_API_KEY dans ~/Downloads/le-coach/.env.
"""
import base64
import hashlib
import json
import os
import re
import subprocess
import sys
import urllib.error
import urllib.request
from pathlib import Path

try:
    import certifi
    os.environ.setdefault("SSL_CERT_FILE", certifi.where())
except ImportError:
    pass

sys.path.insert(0, str(Path(__file__).resolve().parent))
from voix_coach import BALISES, cle, mots_depuis  # noqa: E402

KIT = Path(__file__).resolve().parents[1]
MODELE = os.environ.get("MODELE", "eleven_v4")
SR = 48000

# perso → (voix, stabilité, filtre ffmpeg propre au perso)
VOIX = {
    "NAEL": ("3Tp5mYhT9wrfnry9pzvV", 0.35, "highpass=f=90"),  # Hugo
    "FEMME": ("O31r762Gb3WFygrEOGh0", 0.4, "highpass=f=90"),  # Victoire
    "COSTUME": ("AmMsHJaCw4BtwV3KoUXF", 0.45, "highpass=f=80"),  # Nicolas Petit
    "ADO": ("hv6gVog5LgtIUX88Nmq8", 0.4, "highpass=f=110,asetrate=48000*1.06,aresample=48000,atempo=0.95"),  # Tristan, rajeuni
    "ANNONCE": ("Xb7hH8MSUJpSbSDYk0k2", 0.75,  # Alice, passée dans un haut-parleur de rame
                "highpass=f=380,lowpass=f=3300,acompressor=threshold=-22dB:ratio=6,aecho=0.8:0.55:45|90:0.3|0.18"),
    "ALERTE": ("Xb7hH8MSUJpSbSDYk0k2", 0.9,  # Alice, voix d'alerte sortie de tous les téléphones à la fois
               "highpass=f=300,lowpass=f=3600,acompressor=threshold=-20dB:ratio=5,aecho=0.7:0.5:18|33:0.4|0.3"),
    "PASSANT": ("AmMsHJaCw4BtwV3KoUXF", 0.4, "highpass=f=80"),  # Nicolas, un passant dans la rue
    "VOISINE": ("Xb7hH8MSUJpSbSDYk0k2", 0.35, "highpass=f=90"),  # Alice, en vrai (sans haut-parleur)
    "MAMAN": ("O31r762Gb3WFygrEOGh0", 0.35,  # Victoire, au bout du fil
              "highpass=f=320,lowpass=f=3400,acompressor=threshold=-24dB:ratio=4"),
    "LOIN": ("AmMsHJaCw4BtwV3KoUXF", 0.4,  # COSTUME au fond du tunnel
             "highpass=f=180,lowpass=f=3000,aecho=0.9:0.6:220|460:0.22|0.1"),
}


def traduit(texte):
    def rep(m):
        fr = m.group(1).strip().lower()
        if fr not in BALISES:
            sys.exit(f"balise inconnue : [{fr}]")
        return f"[{BALISES[fr]}]"
    return re.sub(r"\[([^\]]+)\]", rep, texte)


def tts(voix, stab, texte, cache):
    cle_cache = hashlib.sha1(f"{MODELE}|{voix}|{stab}|{texte}".encode()).hexdigest()[:16]
    mp3, js = cache / f"{cle_cache}.mp3", cache / f"{cle_cache}.json"
    if mp3.exists() and js.exists():
        return mp3, json.loads(js.read_text()), False
    corps = json.dumps({"text": texte, "model_id": MODELE,
                        "voice_settings": {"stability": stab, "similarity_boost": 0.8, "use_speaker_boost": True}}).encode()
    req = urllib.request.Request(
        f"https://api.elevenlabs.io/v1/text-to-speech/{voix}/with-timestamps?output_format=mp3_44100_128",
        data=corps, headers={"xi-api-key": cle(), "Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=300) as r:
            rep = json.loads(r.read())
    except urllib.error.HTTPError as e:
        sys.exit(f"ElevenLabs {e.code} : {e.read().decode()[:400]}")
    mp3.write_bytes(base64.b64decode(rep["audio_base64"]))
    js.write_text(json.dumps(rep["alignment"], ensure_ascii=False))
    return mp3, rep["alignment"], True


def main():
    ep = sys.argv[1]
    dossier = KIT / "src/compositions/metro"
    sortie = KIT / "public/metro" / ep
    cache = sortie / "cache"
    cache.mkdir(parents=True, exist_ok=True)
    lignes, payes = [], 0
    for brute in (dossier / f"{ep}_script.txt").read_text().splitlines():
        brute = brute.strip()
        if not brute or brute.startswith("#"):
            continue
        tete, texte = brute.split("|", 1)
        ident, perso = tete.split()
        texte = texte.strip()
        voix, stab, filtre = VOIX[perso]
        envoye = traduit(texte)
        mp3, al, paye = tts(voix, stab, envoye, cache)
        payes += len(envoye) if paye else 0
        recu = "".join(al["characters"])
        mots = mots_depuis(recu, al["character_start_times_seconds"], al["character_end_times_seconds"])
        if not mots:
            sys.exit(f"{ident} : aucun mot aligné")
        debut = max(0.0, mots[0]["a"] - 0.05)
        fin = mots[-1]["b"] + (0.9 if perso in ("LOIN", "ANNONCE") else 0.18)  # on laisse traîner l'écho
        wav = sortie / f"{ident}.wav"
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", f"{debut:.3f}", "-to", f"{fin:.3f}", "-i", str(mp3),
                        "-af", f"apad=pad_dur=0.6,{filtre},atrim=0:{fin - debut + 0.05:.3f},"
                               "acompressor=threshold=-20dB:ratio=3:attack=5:release=80,loudnorm=I=-16:TP=-1.5:LRA=7",
                        "-ar", str(SR), "-ac", "1", str(wav)], check=True)
        duree = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(wav)],
                                     capture_output=True, text=True, check=True).stdout)
        lignes.append({"id": ident, "perso": perso, "texte": re.sub(r"\[[^\]]+\]\s*", "", texte), "fichier": f"metro/{ep}/{ident}.wav",
                       "duree": round(duree, 3),
                       "mots": [{"t": m["t"], "a": round(m["a"] - debut, 3), "b": round(m["b"] - debut, 3)} for m in mots]})
        print(f"{ident} {perso:8} {duree:5.2f} s {'(payé)' if paye else '(cache)'}  {lignes[-1]['texte']}")
    (dossier / f"{ep}_voix.json").write_text(json.dumps({"lignes": lignes}, ensure_ascii=False, indent=1))
    print(f"{len(lignes)} répliques, {sum(l['duree'] for l in lignes):.1f} s de voix, {payes} caractères facturés")


if __name__ == "__main__":
    main()
