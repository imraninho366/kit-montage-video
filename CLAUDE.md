# Kit montage vidéo — consignes pour Claude Code

Réponds en français, de façon directe et concrète.

## Si le kit n'est pas encore installé
`~/.claude/skills/a-publier` absent → lancer `./install.sh` depuis ce dossier (il demande le mot de passe Mac pour Homebrew :
prévenir l'utilisateur). Ensuite, lui rappeler de taper les 4 commandes `/plugin …` du README dans Claude Code, puis de relancer Claude Code.

## Façon de travailler
- **Une vidéo à la fois** : un seul rendu (Remotion, Hyperframes, Blender) ou une seule transcription Whisper en même temps (8 Go de RAM suffisent ainsi).
- Le montage passe par `ffmpeg` (ffmpeg-full pour incruster sous-titres et texte). Voix → `loudnorm` −14 LUFS → silences → Whisper → rendu.
- Toujours **regarder le rendu** (skill `watch-video`) avant de dire qu'une vidéo est prête.
- **Ne jamais inventer** un chiffre, un fait ou un témoignage : vérifier en ligne, noter la date et la source.
- Musique : seulement libre de droits et vérifiée pour Content ID, ou générée.
- L'utilisateur **publie lui-même** : aucun envoi automatique vers YouTube/TikTok.

## Chaînes et publication
Toute nouvelle chaîne et toute vidéo finie passent par la skill **`a-publier`** :
`~/Downloads/A-PUBLIER/<Chaîne>/00-CHAINE/0-CREER-LA-CHAINE.md`, puis `NN-slug/0-TOUT-COPIER.md` + `1-VIDEO.mp4` + miniatures + `.srt`.
Les règles de qualité sont dans `skills/a-publier/references/qualite.md`.

## Moteur Remotion
`moteur-remotion/` : composants dans `src/components/`, vidéos modèles dans `src/compositions/` (déclarées dans `src/Root.tsx`).
Pour une nouvelle vidéo, partir de la composition la plus proche du format demandé et créer ses médias dans `public/<nom>/`.
Rendre avec `npx remotion render <Id> sortie/<nom>.mp4` (2 rendus parallèles maximum, réglé dans `remotion.config.ts`).

## Outils locaux
- Modèles : `~/.claude/models/` (Whisper, Kokoro). Python : `~/.claude/video-venv/bin/python`.
- Voix gratuites : Kokoro (anglais, `kokoro-onnx`), Supertonic (FR/EN, `supertonic`).
- 3D : Blender (`/Applications/Blender.app/Contents/MacOS/Blender -b …` pour rendre sans interface).
