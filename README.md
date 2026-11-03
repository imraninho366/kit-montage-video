# 🎬 Kit montage vidéo pour Claude Code

Tout ce qu'il faut pour faire du montage, du motion design et de la génération vidéo avec Claude Code : **ffmpeg, Remotion, Hyperframes, Whisper, yt-dlp, Higgsfield**, plus 18 skills prêts à l'emploi.

## Installation (macOS)

```bash
git clone <URL-DU-REPO> kit-montage-video
cd kit-montage-video
chmod +x install.sh
./install.sh
```

> `./install.sh --no-extras` saute les paquets Python lourds si tu veux une installation rapide.

Ensuite, ouvre Claude Code et tape :

```
/plugin marketplace add DojoCodingLabs/remotion-superpowers
/plugin install remotion-superpowers@remotion-superpowers
/plugin marketplace add affaan-m/everything-claude-code
/plugin install ecc@ecc
/setup
/mcp
```

## Ce qui est installé

### Outils système (Homebrew)
| Outil | Rôle |
|---|---|
| `ffmpeg` | Découpe, encodage, extraction audio et images |
| `yt-dlp` | Télécharger des vidéos YouTube, TikTok, Instagram… |
| `whisper-cpp` + `openai-whisper` | Transcription et sous-titres |
| `node` | Nécessaire pour Remotion et Hyperframes |
| `uv` + `python@3.13` | Outils Python (auto-editor, scenedetect, TTS) |
| `espeak-ng` | Synthèse vocale locale |

### Modèles Whisper → `~/.claude/models/`
`ggml-base.bin` (rapide) et `ggml-large-v3-turbo-q5_0.bin` (précis), téléchargés depuis Hugging Face.

### Skills → `~/.claude/skills/`
| Skill | Rôle |
|---|---|
| `hyperframes` (+ `-core`, `-animation`, `-keyframes`, `-audio`, `-creative`, `-cli`, `-registry`, `-studio`) | Vidéos composées en HTML/GSAP, rendues en MP4 |
| `general-video` | Compositions longues : sizzle reels, vidéos de marque |
| `media-use` | Musique, SFX, voix off, sous-titres, étalonnage, recadrage |
| `remotion-best-practices` | Vidéo en React avec Remotion |
| `higgsfield-generate` (+ `-soul-id`, `-product-photoshoot`, `-marketplace-cards`) | Génération d'images et de vidéos IA |
| `watch-video` | Claude « regarde » une vidéo, image par image et avec transcription |
| `youtube-marketing` | Titres, miniatures, SEO, Shorts |

### Plugins Claude Code
- **remotion-superpowers** : musique Suno, voix ElevenLabs, stock Pexels, analyse TwelveLabs, sous-titres TikTok, transitions
- **ecc** : `video-editing`, `remotion-video-creation`, `manim-video`, `videodb`, `fal-ai-media`, `motion-*`

### Serveurs MCP
| Serveur | Compte requis |
|---|---|
| `remotion-documentation` | Non |
| `higgsfield` | Oui, se connecter via `/mcp` |
| vidIQ, Canva | Oui, à ajouter depuis claude.ai → Connecteurs |

## Exemples de demandes à Claude

- « Fais une vidéo Hyperframes de 30 s en 9:16 pour présenter mon produit »
- « Regarde cette vidéo et juge mon montage : <lien> »
- « Ajoute des sous-titres style TikTok à `video.mp4` »
- « Coupe les silences de mon enregistrement »
- « Crée une intro animée avec Remotion »

## Sources d'origine
- Hyperframes : [heygen-com/hyperframes](https://github.com/heygen-com/hyperframes)
- Higgsfield : [higgsfield-ai/skills](https://github.com/higgsfield-ai/skills)
- Remotion Superpowers : [DojoCodingLabs/remotion-superpowers](https://github.com/DojoCodingLabs/remotion-superpowers)
- ECC : [affaan-m/everything-claude-code](https://github.com/affaan-m/everything-claude-code)
