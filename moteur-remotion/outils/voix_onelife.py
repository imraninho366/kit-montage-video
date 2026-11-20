"""Voix ElevenLabs de ONE LIFE : un appel par bloc, puis assemblage avec des silences calibrés (le temps des roues).

    python3 outils/voix_onelife.py ep01

- Lit src/compositions/onelife/<ep>_blocs.json : [{"texte": "...", "pause": secondes_après}, ...]
  (nombres en toutes lettres, phrases courtes).
- Chaque bloc → /with-timestamps (temps par caractère → temps par mot), décodé en 48 kHz mono.
- Assemblage bloc + silence, puis loudnorm I=-14 TP=-1.5 LRA=11 → public/onelife/<ep>_voix.wav.
  Pas de silenceremove : les silences sont voulus (roues, ralenti) et les temps des mots doivent rester justes.
- Écrit src/compositions/onelife/<ep>_voix.json :
  {"duree", "blocs": [{"debut", "fin", "pause"}], "mots": [{"t", "a", "b", "bloc"}]} (secondes).
Clé : ELEVENLABS_API_KEY dans ~/Downloads/comment-on-faisait/.env.
"""
import base64
import json
import os
import subprocess
import sys
import urllib.request
import wave
from pathlib import Path

try:  # le Python de python.org n'a pas de certificats racine
    import certifi
    os.environ.setdefault("SSL_CERT_FILE", certifi.where())
except ImportError:
    pass

KIT = Path(__file__).resolve().parents[1]
ENV = Path(os.environ.get("KIT_ENV", Path(__file__).resolve().parents[1] / ".env"))
# Liam - Energetic, Social Media Creator (américain, jeune) : narrateur rapide, format TikTok anglophone.
VOIX = os.environ.get("VOIX_ID", "TX3LPaxmHKxFdv7VOQHJ")
MODELE = os.environ.get("MODELE", "eleven_multilingual_v2")
REGLAGES = {"stability": 0.45, "similarity_boost": 0.8, "style": 0.35, "use_speaker_boost": True, "speed": float(os.environ.get("VITESSE", "1.1"))}
SR = 48000


def cle():
    for l in ENV.read_text().splitlines():
        if l.startswith("ELEVENLABS_API_KEY="):
            return l.split("=", 1)[1].strip()
    sys.exit("ELEVENLABS_API_KEY absente de " + str(ENV))


def mots_depuis(texte, debuts, fins):
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


def tts(texte, cle_api):
    corps = json.dumps({"text": texte, "model_id": MODELE, "voice_settings": REGLAGES}).encode()
    req = urllib.request.Request(
        f"https://api.elevenlabs.io/v1/text-to-speech/{VOIX}/with-timestamps?output_format=mp3_44100_128",
        data=corps, headers={"xi-api-key": cle_api, "Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=600) as r:
        return json.loads(r.read())


def pcm(mp3, dest):
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(mp3), "-ar", str(SR), "-ac", "1", "-f", "s16le", str(dest)], check=True)
    return dest.read_bytes()


def compresse_silences(brut, max_sil=0.45, garde=0.32, seuil_db=-38.0, pas=0.01):
    """Raccourcit les silences internes (> max_sil) à `garde` secondes, en coupant au MILIEU du silence mesuré.
    Renvoie (pcm_compressé, fonction de conversion temps_ancien → temps_nouveau)."""
    import array, math
    ech = array.array("h"); ech.frombytes(brut)
    n_pas = int(pas * SR)
    seuil = 32768 * 10 ** (seuil_db / 20)
    silencieux = []
    for i in range(0, len(ech), n_pas):
        bloc = ech[i:i + n_pas]
        rms = math.sqrt(sum(x * x for x in bloc) / max(1, len(bloc)))
        silencieux.append(rms < seuil)
    # plages silencieuses internes (pas en tête ni en queue)
    plages, i = [], 0
    while i < len(silencieux):
        if silencieux[i]:
            j = i
            while j < len(silencieux) and silencieux[j]: j += 1
            if i > 0 and j < len(silencieux) and (j - i) * pas > max_sil:
                plages.append((i * pas, j * pas))
            i = j
        else:
            i += 1
    coupes = []  # (début_coupe, fin_coupe) en secondes, centrées dans le silence
    for a0, a1 in plages:
        retire = (a1 - a0) - garde
        milieu = (a0 + a1) / 2
        coupes.append((milieu - retire / 2, milieu + retire / 2))
    garde_ech = array.array("h"); pos = 0.0
    for c0, c1 in coupes:
        garde_ech.extend(ech[int(pos * SR):int(c0 * SR)]); pos = c1
    garde_ech.extend(ech[int(pos * SR):])

    def conv(t):
        decal = 0.0
        for c0, c1 in coupes:
            if t >= c1: decal += c1 - c0
            elif t > c0: return c0 - decal
        return t - decal
    return garde_ech.tobytes(), conv


def main():
    ep = sys.argv[1]
    dossier = KIT / "src/compositions/onelife"
    blocs = json.loads((dossier / f"{ep}_blocs.json").read_text())
    sortie = KIT / "public/onelife"
    tmp = sortie / f"{ep}_blocs"
    tmp.mkdir(parents=True, exist_ok=True)
    k = cle()
    audio, mots, infos, t = b"", [], [], 0.0
    for i, b in enumerate(blocs):
        mp3, cache = tmp / f"{i:02d}.mp3", tmp / f"{i:02d}.json"
        if cache.exists() and json.loads(cache.read_text()).get("texte") == b["texte"] and mp3.exists():
            al = json.loads(cache.read_text())["alignment"]
        else:
            rep = tts(b["texte"], k)
            al = rep["alignment"]
            mp3.write_bytes(base64.b64decode(rep["audio_base64"]))
            cache.write_text(json.dumps({"texte": b["texte"], "alignment": al}))
        recu = "".join(al["characters"])
        brut, conv = compresse_silences(pcm(mp3, tmp / f"{i:02d}.raw"))
        duree = len(brut) / 2 / SR
        for m in mots_depuis(recu, al["character_start_times_seconds"], al["character_end_times_seconds"]):
            mots.append({"t": m["t"], "a": round(t + conv(m["a"]), 3), "b": round(t + conv(m["b"]), 3), "bloc": i})
        infos.append({"debut": round(t, 3), "fin": round(t + duree, 3), "pause": b["pause"]})
        silence = b"\x00\x00" * int(b["pause"] * SR)
        audio += brut + silence
        t += duree + b["pause"]
        print(f"bloc {i}: {duree:.2f} s + pause {b['pause']} s")
    assemble = tmp / "assemble.wav"
    with wave.open(str(assemble), "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(audio)
    wav = sortie / f"{ep}_voix.wav"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(assemble), "-af", "loudnorm=I=-14:TP=-1.5:LRA=11",
                    "-ar", str(SR), "-ac", "1", str(wav)], check=True)
    (dossier / f"{ep}_voix.json").write_text(json.dumps({"duree": round(t, 3), "blocs": infos, "mots": mots}, ensure_ascii=False, indent=1))
    print(f"{len(mots)} mots, {t:.2f} s → {wav}")


if __name__ == "__main__":
    main()
