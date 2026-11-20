"""Voix ElevenLabs de LE COACH (méthode F.pdf : une seule voix masculine, balises d'émotion).

    python3 outils/voix_coach.py ep01

- Lit src/compositions/coach/<ep>_texte.txt : une phrase par ligne, balises FR en tête ([tendu] …).
- Les balises FR sont traduites en balises anglaises (comprises par eleven_v4) et retirées des mots.
- Un seul appel /with-timestamps, silences internes > 0,45 s ramenés à 0,32 s (coupe au milieu
  du silence mesuré, temps des mots recalculés), puis loudnorm I=-14 → public/coach/<ep>_voix.wav.
- Écrit src/compositions/coach/<ep>_voix.json : {"duree", "mots": [{"t", "a", "b", "ligne"}]}.
Clé : ELEVENLABS_API_KEY dans ~/Downloads/le-coach/.env.
"""
import base64
import json
import os
import re
import subprocess
import sys
import urllib.error
import urllib.request
import wave
from pathlib import Path

try:
    import certifi
    os.environ.setdefault("SSL_CERT_FILE", certifi.where())
except ImportError:
    pass

sys.path.insert(0, str(Path(__file__).resolve().parent))
from voix_onelife import compresse_silences, pcm, SR  # noqa: E402

KIT = Path(__file__).resolve().parents[1]
ENV = Path(os.environ.get("KIT_ENV", Path(__file__).resolve().parents[1] / ".env"))
# Nicolas Petit - Convincing and Bright (FR, sérieux). Signature du compte : ne plus changer.
VOIX = os.environ.get("VOIX_ID", "AmMsHJaCw4BtwV3KoUXF")
MODELE = os.environ.get("MODELE", "eleven_v4")
REGLAGES = {"stability": 0.5, "similarity_boost": 0.8, "use_speaker_boost": True}
BALISES = {"tendu": "tense", "sérieux": "serious", "déterminé": "determined", "triste": "sad",
           "excité": "excited", "curieux": "curious", "menaçant": "menacing", "chuchoté": "whispers",
           "choqué": "shocked", "fier": "proud", "en colère": "angry", "soulagé": "relieved"}


def cle():
    for l in ENV.read_text().splitlines():
        if l.startswith("ELEVENLABS_API_KEY="):
            return l.split("=", 1)[1].strip()
    sys.exit("ELEVENLABS_API_KEY absente de " + str(ENV))


def traduit(ligne):
    def rep(m):
        fr = m.group(1).strip().lower()
        if fr not in BALISES:
            sys.exit(f"balise inconnue : [{fr}]")
        return f"[{BALISES[fr]}]"
    return re.sub(r"\[([^\]]+)\]", rep, ligne)


def mots_depuis(texte, debuts, fins):
    """Mots avec temps et position, en sautant tout ce qui est entre crochets (balises)."""
    mots, cour, dans_balise = [], None, False
    for i, ch in enumerate(texte):
        if ch == "[":
            dans_balise = True
        if dans_balise:
            if ch == "]":
                dans_balise = False
            if cour:
                mots.append(cour); cour = None
            continue
        if ch in " \n":
            if cour:
                mots.append(cour); cour = None
            continue
        if cour is None:
            cour = {"t": "", "a": debuts[i], "b": fins[i], "i": i}
        cour["t"] += ch
        cour["b"] = fins[i]
    if cour:
        mots.append(cour)
    return mots


def main():
    ep = sys.argv[1]
    dossier = KIT / "src/compositions/coach"
    lignes = [l.strip() for l in (dossier / f"{ep}_texte.txt").read_text().splitlines() if l.strip()]
    texte = "\n".join(traduit(l) for l in lignes)
    sortie = KIT / "public/coach"
    sortie.mkdir(parents=True, exist_ok=True)
    mp3, cache = sortie / f"{ep}_brut.mp3", sortie / f"{ep}_brut.json"
    if cache.exists() and mp3.exists() and json.loads(cache.read_text()).get("texte") == texte:
        al = json.loads(cache.read_text())["alignment"]
        print("cache réutilisé (aucun crédit consommé)")
    else:
        corps = json.dumps({"text": texte, "model_id": MODELE, "voice_settings": REGLAGES}).encode()
        req = urllib.request.Request(
            f"https://api.elevenlabs.io/v1/text-to-speech/{VOIX}/with-timestamps?output_format=mp3_44100_128",
            data=corps, headers={"xi-api-key": cle(), "Content-Type": "application/json"})
        try:
            with urllib.request.urlopen(req, timeout=600) as r:
                rep = json.loads(r.read())
        except urllib.error.HTTPError as e:
            sys.exit(f"ElevenLabs {e.code} : {e.read().decode()[:400]}")
        al = rep["alignment"]
        mp3.write_bytes(base64.b64decode(rep["audio_base64"]))
        cache.write_text(json.dumps({"texte": texte, "alignment": al}, ensure_ascii=False))
    recu = "".join(al["characters"])
    sauts = [i for i, c in enumerate(recu) if c == "\n"]
    brut, conv = compresse_silences(pcm(mp3, sortie / f"{ep}_brut.raw"))
    mots = [{"t": m["t"], "a": round(conv(m["a"]), 3), "b": round(conv(m["b"]), 3),
             "ligne": sum(1 for s in sauts if s < m["i"])}
            for m in mots_depuis(recu, al["character_start_times_seconds"], al["character_end_times_seconds"])]
    assemble = sortie / f"{ep}_assemble.wav"
    with wave.open(str(assemble), "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(brut)
    wav = sortie / f"{ep}_voix.wav"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(assemble), "-af", "loudnorm=I=-14:TP=-1.5:LRA=11",
                    "-ar", str(SR), "-ac", "1", str(wav)], check=True)
    duree = len(brut) / 2 / SR
    (dossier / f"{ep}_voix.json").write_text(json.dumps({"duree": round(duree, 3), "mots": mots}, ensure_ascii=False, indent=1))
    print(f"{len(mots)} mots, {duree:.2f} s → {wav}")


if __name__ == "__main__":
    main()
