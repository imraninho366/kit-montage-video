#!/usr/bin/env bash
# Kit montage vidéo pour Claude Code — installation complète (macOS)
# Usage : ./install.sh            -> tout installer
#         ./install.sh --no-extras -> sans les paquets Python lourds
set -euo pipefail

KIT_DIR="$(cd "$(dirname "$0")" && pwd)"
SKILLS_DST="$HOME/.claude/skills"
MODELS_DST="$HOME/.claude/models"
EXTRAS=1
[[ "${1:-}" == "--no-extras" ]] && EXTRAS=0

step() { printf "\n\033[1;35m==> %s\033[0m\n" "$1"; }
ok()   { printf "    \033[32m✓\033[0m %s\n" "$1"; }

# 1. Homebrew --------------------------------------------------------------
step "Homebrew"
if ! command -v brew >/dev/null; then
  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
  eval "$(/opt/homebrew/bin/brew shellenv)"
fi
ok "$(brew --version | head -1)"

# 2. Outils système --------------------------------------------------------
step "Outils vidéo/audio (ffmpeg, yt-dlp, whisper, node, uv…)"
FORMULAS=(ffmpeg yt-dlp whisper-cpp openai-whisper node python@3.13 uv espeak-ng git gh)
for f in "${FORMULAS[@]}"; do
  if brew list --formula "$f" >/dev/null 2>&1; then ok "$f déjà installé"
  else brew install "$f" && ok "$f installé" || echo "    ⚠ $f non installé"; fi
done

# 3. Claude Code -----------------------------------------------------------
step "Claude Code"
command -v claude >/dev/null || npm install -g @anthropic-ai/claude-code
ok "claude installé"

# 4. Skills ----------------------------------------------------------------
step "Skills (Hyperframes, Remotion, Higgsfield, media-use, watch-video…)"
mkdir -p "$SKILLS_DST"
for dir in "$KIT_DIR"/skills/*/; do
  name="$(basename "$dir")"
  # Sauvegarde une version existante au lieu de l'écraser
  [[ -e "$SKILLS_DST/$name" ]] && mv "$SKILLS_DST/$name" "$SKILLS_DST/$name.bak.$(date +%s)"
  cp -R "$dir" "$SKILLS_DST/$name"
  ok "$name"
done

# 5. Modèles Whisper (trop gros pour GitHub, téléchargés ici) ---------------
step "Modèles Whisper pour la transcription"
mkdir -p "$MODELS_DST"
HF="https://huggingface.co/ggerganov/whisper.cpp/resolve/main"
for m in ggml-base.bin ggml-large-v3-turbo-q5_0.bin; do
  if [[ -f "$MODELS_DST/$m" ]]; then ok "$m déjà présent"
  else curl -L --fail -o "$MODELS_DST/$m" "$HF/$m" && ok "$m téléchargé"; fi
done

# 6. Remotion + Hyperframes (préchargés dans le cache npx) -----------------
step "Remotion & Hyperframes"
npx -y hyperframes@latest --version >/dev/null 2>&1 && ok "hyperframes" || echo "    (hyperframes sera téléchargé au premier usage)"
npx -y @remotion/cli@latest --version >/dev/null 2>&1 && ok "remotion" || echo "    (remotion sera téléchargé au premier usage)"

# 7. Paquets Python utilisés par media-use / hyperframes-audio --------------
if [[ $EXTRAS == 1 ]]; then
  step "Paquets Python (montage auto, détection de scènes, TTS local…)"
  VENV="$HOME/.claude/video-venv"
  uv venv --python 3.13 "$VENV" >/dev/null 2>&1 || true
  uv pip install --python "$VENV/bin/python" \
    auto-editor scenedetect numpy soundfile kokoro-onnx elevenlabs google-genai python-dotenv requests
  if [[ "$(uname -m)" == "arm64" ]]; then
    uv pip install --python "$VENV/bin/python" parakeet-mlx || true
  fi
  ok "venv : $VENV  (activer : source $VENV/bin/activate)"
fi

# 8. Serveurs MCP ---------------------------------------------------------
step "Serveurs MCP"
claude mcp add --scope user remotion-documentation -- npx -y @remotion/mcp@latest >/dev/null 2>&1 || true
ok "remotion-documentation"
claude mcp add --scope user --transport http higgsfield https://mcp.higgsfield.ai/mcp >/dev/null 2>&1 || true
ok "higgsfield (se connecter ensuite via /mcp)"

# 9. Plugins (à lancer dans Claude Code) -----------------------------------
step "Dernière étape : à taper DANS Claude Code"
cat <<'EOF'
    /plugin marketplace add DojoCodingLabs/remotion-superpowers
    /plugin install remotion-superpowers@remotion-superpowers
    /plugin marketplace add affaan-m/everything-claude-code
    /plugin install ecc@ecc
    /setup     (clés API de remotion-superpowers : KIE, Pexels, TwelveLabs…)
    /mcp       (se connecter à Higgsfield)

Installation terminée. Relance Claude Code.
EOF
