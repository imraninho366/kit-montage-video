# 🎬 Kit montage vidéo pour Claude Code

Tout ce qu'il faut pour produire des vidéos YouTube / TikTok avec Claude Code, **sans tournage et avec des outils gratuits** :
montage (ffmpeg), motion design (Remotion, Hyperframes), 3D (Blender), sous-titres (Whisper), voix locales (Kokoro, Supertonic),
téléchargement de sources (yt-dlp), et un **dossier A-PUBLIER** prêt à copier-coller pour chaque chaîne et chaque vidéo.

Aucun compte GitHub n'est nécessaire : le dépôt est public.

## Installation sur Mac (M1 ou plus récent conseillé)

**Option 1 — en laissant Claude Code tout faire.** Ouvre Claude Code et colle :

```
Clone https://github.com/imraninho366/kit-montage-video dans ~/kit-montage-video, puis lance ./install.sh et dis-moi quand c'est fini.
```

**Option 2 — dans le Terminal :**

```bash
git clone https://github.com/imraninho366/kit-montage-video.git ~/kit-montage-video && cd ~/kit-montage-video && ./install.sh
```

> `./install.sh --no-extras` = installation rapide (sans Blender, OBS, paquets Python ni voix locales).
> L'installation demande ton mot de passe Mac une fois (pour Homebrew) et prend 15 à 40 min selon la connexion.

## Installation sur Windows 10 / 11

**Option 1 — avec Claude Code.** Ouvre Claude Code et colle :

```
Clone https://github.com/imraninho366/kit-montage-video dans mon dossier utilisateur, puis lance install.ps1 avec PowerShell et dis-moi quand c'est fini.
```

**Option 2 — dans PowerShell :**

```powershell
git clone https://github.com/imraninho366/kit-montage-video.git "$env:USERPROFILE\kit-montage-video"; cd "$env:USERPROFILE\kit-montage-video"; powershell -ExecutionPolicy Bypass -File .\install.ps1
```

> Pas de Git ? Bouton vert **Code → Download ZIP** sur GitHub, décompresse, puis clic droit sur `install.ps1` → **Exécuter avec PowerShell**.
> Sur Windows, les outils sont installés avec `winget` (ffmpeg, yt-dlp, Python, Node, Git, Blender, OBS) ; les voix locales Kokoro/Supertonic ne sont installées que sur Mac.

## Après l'installation (Mac et Windows)

À la fin, le dossier **A-PUBLIER** s'ouvre tout seul dans le Finder (Mac) ou l'Explorateur (Windows).

Ensuite, **dans Claude Code**, tape une par une :

```
/plugin marketplace add DojoCodingLabs/remotion-superpowers
/plugin install remotion-superpowers@remotion-superpowers
/plugin marketplace add affaan-m/everything-claude-code
/plugin install ecc@ecc
```

Puis quitte et relance Claude Code.

## Ce qui est installé

### Outils système (Homebrew)
| Outil | Rôle |
|---|---|
| `ffmpeg` + `ffmpeg-full` | Découpe, encodage, sous-titres incrustés, texte, audio |
| `yt-dlp` | Télécharger des vidéos YouTube, TikTok, Instagram… |
| `whisper-cpp` + `openai-whisper` | Transcription et sous-titres au mot près |
| `node` | Pour Remotion et Hyperframes |
| `uv` + `python@3.13` | Outils Python (auto-editor, scenedetect, TTS) |
| `tesseract` | Lire le texte dans une image (OCR) |
| `rubberband` | Accélérer/ralentir une voix sans changer sa hauteur |
| `espeak-ng` | Synthèse vocale de secours |
| **Blender**, **OBS** | 3D (scènes « toon », objets) · enregistrement d'écran |

### Modèles → `~/.claude/models/`
- Whisper : `ggml-base.bin` (rapide), `ggml-large-v3-turbo-q5_0.bin` (précis)
- Kokoro : `kokoro/kokoro-v1.0.onnx` + `voices-v1.0.bin` (voix anglaises gratuites, en local)
- Supertonic (voix FR/EN) : téléchargé au premier usage

Les paquets Python sont dans `~/.claude/video-venv` (`source ~/.claude/video-venv/bin/activate`).

### Skills → `~/.claude/skills/`
| Skill | Rôle |
|---|---|
| **`a-publier`** | Crée `~/Downloads/A-PUBLIER/<Chaîne>/` : fiche de création de chaîne + un dossier par vidéo avec `0-TOUT-COPIER.md` (titre, description, tags, réglages), vidéo, 3 miniatures, sous-titres. Inclut le module qualité. |
| `hyperframes` (+ `-core`, `-animation`, `-keyframes`, `-audio`, `-creative`, `-cli`, `-registry`, `-studio`) | Vidéos composées en HTML/GSAP, rendues en MP4 |
| `general-video` | Compositions longues : sizzle reels, vidéos de marque |
| `media-use` | Musique, SFX, voix off, sous-titres, étalonnage, recadrage |
| `remotion-best-practices` | Vidéo en React avec Remotion |
| `watch-video` | Claude « regarde » une vidéo, image par image et avec transcription |
| `youtube-marketing` | Titres, miniatures, SEO, Shorts |

### Plugins Claude Code (étape manuelle ci-dessus)
- **remotion-superpowers** : musique, voix, stock Pexels, sous-titres TikTok, transitions (certaines fonctions demandent des clés API, à régler avec `/setup`)
- **ecc** : `video-editing`, `remotion-video-creation`, `manim-video`, `motion-*`…

### Serveur MCP
- `remotion-documentation` : doc Remotion à jour, sans compte.

## Le dossier A-PUBLIER

```
~/Downloads/A-PUBLIER/
├── LISEZ-MOI.md                     ← toutes les chaînes et vidéos prêtes
└── Ma Chaîne/
    ├── 00-CHAINE/0-CREER-LA-CHAINE.md   ← nom, @, description, mots-clés, bio, images
    ├── 01-titre-de-la-video/
    │   ├── 0-TOUT-COPIER.md         ← titre, description, tags, réglages Studio, faits vérifiés
    │   ├── 1-VIDEO.mp4
    │   ├── 2-MINIATURE-A-recommandee.png · 3-miniature-B-pour-le-test.png · 4-miniature-C-de-reserve.png
    │   └── 5-sous-titres-FR.srt
    └── publie/                      ← déplacer ici une vidéo une fois en ligne
```

Emplacement : `~/Downloads/A-PUBLIER` sur Mac, `C:\Users\<toi>\Downloads\A-PUBLIER` sur Windows.
Il suffit de demander à Claude : « Crée ma chaîne *Nom* » ou « Prépare la vidéo pour la publication » : le dossier est créé,
la fiche est remplie (description, tags, réglages…) et il s'ouvre dans le Finder / l'Explorateur.
Tu publies toi-même : rien n'est envoyé automatiquement sur YouTube ou TikTok.

## Exemples de demandes à Claude

- « Crée une chaîne YouTube *Le Pourquoi des Choses* et prépare sa fiche dans A-PUBLIER »
- « Fais une vidéo Hyperframes de 30 s en 9:16 pour présenter mon produit »
- « Regarde cette vidéo et juge mon montage : <lien> »
- « Ajoute des sous-titres style TikTok à `video.mp4` »
- « Coupe les silences de mon enregistrement »
- « Génère une voix off anglaise avec Kokoro pour ce script »

## Comptes : qu'est-ce qui est obligatoire ?
| | Obligatoire ? |
|---|---|
| GitHub | **Non** (dépôt public) |
| Claude Code (abonnement Claude Pro/Max ou clé API) | **Oui** |
| Homebrew | Installé automatiquement |
| ElevenLabs, Pexels, Suno, etc. | Non, seulement pour les fonctions payantes optionnelles |

## Sources d'origine
- Hyperframes : [heygen-com/hyperframes](https://github.com/heygen-com/hyperframes)
- Remotion Superpowers : [DojoCodingLabs/remotion-superpowers](https://github.com/DojoCodingLabs/remotion-superpowers)
- ECC : [affaan-m/everything-claude-code](https://github.com/affaan-m/everything-claude-code)
- Kokoro ONNX : [thewh1teagle/kokoro-onnx](https://github.com/thewh1teagle/kokoro-onnx) · Supertonic : [supertone-inc/supertonic](https://github.com/supertone-inc/supertonic) (modèle sous licence OpenRAIL-M)
