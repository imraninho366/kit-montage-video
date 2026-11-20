# Kit montage vidéo pour Claude Code — installation Windows (PowerShell)
# Usage, dans le dossier du kit :
#   powershell -ExecutionPolicy Bypass -File .\install.ps1
#   powershell -ExecutionPolicy Bypass -File .\install.ps1 -SansExtras   (sans Blender, OBS ni modèles Whisper)
param([switch]$SansExtras)

$ErrorActionPreference = "Continue"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$Kit    = Split-Path -Parent $MyInvocation.MyCommand.Path
$Claude = Join-Path $env:USERPROFILE ".claude"
$Skills = Join-Path $Claude "skills"
$Models = Join-Path $Claude "models"

function Etape($t) { Write-Host "`n==> $t" -ForegroundColor Magenta }
function Ok($t)    { Write-Host "    v $t" -ForegroundColor Green }
function Alerte($t){ Write-Host "    ! $t" -ForegroundColor Yellow }

# 1. Outils (winget, livré avec Windows 10/11) ---------------------------
Etape "Outils vidéo/audio (ffmpeg, yt-dlp, Python, Node, Git)"
if (-not (Get-Command winget -ErrorAction SilentlyContinue)) {
  Alerte "winget introuvable : installe « App Installer » depuis le Microsoft Store, puis relance."
} else {
  $paquets = @("Gyan.FFmpeg", "yt-dlp.yt-dlp", "Python.Python.3.13", "OpenJS.NodeJS.LTS", "Git.Git")
  if (-not $SansExtras) { $paquets += @("BlenderFoundation.Blender", "OBSProject.OBSStudio") }
  foreach ($p in $paquets) {
    winget list --id $p -e --accept-source-agreements *> $null
    if ($LASTEXITCODE -eq 0) { Ok "$p déjà installé" }
    else {
      winget install --id $p -e --silent --accept-package-agreements --accept-source-agreements *> $null
      if ($LASTEXITCODE -eq 0) { Ok "$p installé" } else { Alerte "$p non installé" }
    }
  }
  # Rend les nouveaux outils visibles dans cette fenêtre
  $env:Path = [Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [Environment]::GetEnvironmentVariable("Path","User")
}

# 2. Claude Code ---------------------------------------------------------
Etape "Claude Code"
if (-not (Get-Command claude -ErrorAction SilentlyContinue)) {
  if (Get-Command npm -ErrorAction SilentlyContinue) { npm install -g @anthropic-ai/claude-code *> $null }
}
if (Get-Command claude -ErrorAction SilentlyContinue) { Ok "claude installé" } else { Alerte "installer Claude Code : https://claude.com/claude-code" }

# 3. Skills --------------------------------------------------------------
Etape "Skills (Hyperframes, Remotion, media-use, watch-video, a-publier…)"
New-Item -ItemType Directory -Force -Path $Skills | Out-Null
Get-ChildItem -Directory (Join-Path $Kit "skills") | ForEach-Object {
  $dst = Join-Path $Skills $_.Name
  if (Test-Path $dst) { Rename-Item $dst "$($_.Name).bak.$([DateTimeOffset]::Now.ToUnixTimeSeconds())" }
  Copy-Item $_.FullName $dst -Recurse
  Ok $_.Name
}

# 4. Modèles Whisper -----------------------------------------------------
if (-not $SansExtras) {
  Etape "Modèles Whisper pour la transcription"
  New-Item -ItemType Directory -Force -Path $Models | Out-Null
  $hf = "https://huggingface.co/ggerganov/whisper.cpp/resolve/main"
  foreach ($m in @("ggml-base.bin", "ggml-large-v3-turbo-q5_0.bin")) {
    $f = Join-Path $Models $m
    if (Test-Path $f) { Ok "$m déjà présent" }
    else { try { Invoke-WebRequest "$hf/$m" -OutFile $f -UseBasicParsing; Ok "$m téléchargé" } catch { Alerte "$m non téléchargé" } }
  }
  if (Get-Command python -ErrorAction SilentlyContinue) {
    python -m pip install --quiet --upgrade openai-whisper auto-editor scenedetect *> $null
    Ok "paquets Python (whisper, auto-editor, scenedetect)"
  }
}

# 5. Serveur MCP Remotion ------------------------------------------------
if (Get-Command claude -ErrorAction SilentlyContinue) {
  claude mcp add --scope user remotion-documentation -- npx -y @remotion/mcp@latest *> $null
  Ok "remotion-documentation"
}

# 6. Dossier A-PUBLIER ---------------------------------------------------
Etape "Dossier A-PUBLIER (une fiche par chaîne, un dossier par vidéo)"
$script = Join-Path $Skills "a-publier\scripts\a_publier.py"
if (Get-Command python -ErrorAction SilentlyContinue) {
  python $script index | Out-Null
  python $script ouvrir
  Ok (Join-Path $env:USERPROFILE "Downloads\A-PUBLIER")
} else {
  New-Item -ItemType Directory -Force -Path (Join-Path $env:USERPROFILE "Downloads\A-PUBLIER") | Out-Null
  Alerte "Python absent : dossier créé vide, relance l'installation après avoir installé Python"
}

Etape "Dernière étape : à taper DANS Claude Code"
@"
    /plugin marketplace add DojoCodingLabs/remotion-superpowers
    /plugin install remotion-superpowers@remotion-superpowers
    /plugin marketplace add affaan-m/everything-claude-code
    /plugin install ecc@ecc

Installation terminée. Ferme cette fenêtre et relance Claude Code.
"@ | Write-Host
