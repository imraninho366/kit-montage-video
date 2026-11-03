---
name: watch-video
description: Use when the user gives a video (URL YouTube/Instagram/TikTok/Loom/lien direct, OU un fichier local .mp4/.mov) and wants Claude to actually SEE the video — a scene-by-scene / frame-by-frame breakdown, not just the transcript. Triggers on "/watch-video <url-ou-fichier>", "regarde cette vidéo", "watch this video", "juge mon montage", "break this reel down".
---

# watch-video — voir la vidéo, pas seulement lire le transcript

Claude n'a pas de modèle vidéo natif : ce skill découpe une vidéo en **images + texte** et lit les deux
avec les timestamps alignés. Exécute chaque étape ; ne saute jamais l'échantillonnage dense du hook.

## Étape 0 — Source
- **Fichier local** (cas fréquent : juger un montage d'Imran) → copie-le dans le dossier de travail, saute le téléchargement.
- **URL** → télécharge avec yt-dlp.

```bash
mkdir -p /tmp/watch-video && cd /tmp/watch-video
# URL :
yt-dlp -o video.mp4 -f "mp4" "<URL>"
# Fichier local :
cp "<CHEMIN_LOCAL>" video.mp4
ffprobe -v error -show_entries format=duration -of csv=p=0 video.mp4   # durée (secondes)
```

## Étape 1 — Échantillonnage en deux passes (la partie importante)
Le hook concentre le mouvement et décide de la rétention → dense sur le hook, clairsemé sur le corps.
```bash
# HOOK : 15 premières secondes à 15 fps → planches-contact (5x9 = 45 frames = 3 s par planche)
mkdir -p hook && ffmpeg -y -t 15 -i video.mp4 \
  -vf "fps=15,scale=200:-1,tile=5x9:margin=6:padding=4:color=white" -an hook/sheet_%02d.jpg
# CORPS : 1 frame / 3,5 s sur toute la vidéo
mkdir -p body && ffmpeg -y -i video.mp4 -vf "fps=1/3.5,scale=360:-1" body/f_%02d.jpg
```
Lire les planches dans l'ordre ; la frame N du hook est à t = N/15 s (planche k, case i → frame (k-1)*45 + i).

## Étape 2 — Transcription (gratuite, locale)
```bash
ffmpeg -y -i video.mp4 -ar 16000 -ac 1 audio.wav
# Modèle multilingue (français OK) — langue auto-détectée :
whisper-cli -m ~/.claude/models/ggml-base.bin -f audio.wav -l auto -otxt -osrt -of transcript
```
Si YouTube fournit des sous-titres, les utiliser (exacts, gratuits). Toujours vérifier le transcript
contre les frames — les modèles locaux écorchent les noms propres.

## Étape 3 — Lire frames + transcript ensemble, puis produire
Regarder les planches du hook et les frames du corps, les aligner sur les timestamps, et livrer :
1. **Transcript** (corrigé d'après ce qui est à l'écran).
2. **Découpage scène par scène** — par chapitre : temps, ce qui est à l'écran, le texte incrusté, le cut.
3. **Pourquoi ça marche (ou pas)** — 2-3 mécanismes concrets : structure du hook, cadence des cuts, payoff visuel, CTA. Pour le contenu d'Imran : juger honnêtement (rétention, lisibilité des sous-titres, rythme), dire ce qui cloche.
4. **Notes "voler la structure"** — quoi reprendre dans ses propres vidéos (changer le contenu, garder la structure).

Nettoyer `/tmp/watch-video` à la fin.
