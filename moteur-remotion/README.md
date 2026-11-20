# Moteur Remotion (doc-kit)

Le moteur de montage utilisé pour produire les vidéos des chaînes : documentaires motion design, Shorts verticaux,
séries interactives TikTok, leçons « POV », miniatures. Tout est en React/Remotion (+ Three.js pour la 3D, d3-geo pour les cartes).

## Démarrer

```bash
cd moteur-remotion
npm install          # une seule fois
npm run studio       # ouvre Remotion Studio dans le navigateur
```

Rendre une vidéo :
```bash
npx remotion render <IdDeComposition> sortie/ma-video.mp4
npx remotion still Miniature01 sortie/miniature.png      # une image (miniature)
```

`remotion.config.ts` est réglé pour un Mac M1 8 Go (2 rendus en parallèle maximum).

## Ce qu'il y a dedans

- **`src/components/`** — 44 briques réutilisables : `TitleCard`, `LowerThird`, `BigStat`, `LineChart`, `StackBar`, `Compare`,
  `Frise` (chronologie), `Globe` et `MapCountries` (cartes), `DocumentCapture`/`DocumentFrame` (captures d'articles),
  `Receipt`, `PriceBreakdown`, `Chapitre`, `Abonnement` (appel à s'abonner animé), `EcranFin`, `FilmGrain`, `LightLeak`,
  `ParallaxPlate`/`DepthPlate` (photo 2,5D), `Neon`, `TextPunch`…
- **`src/design/theme.ts`** — couleurs, typos, rythme (un événement visuel toutes les 3 à 5 s).
- **`src/compositions/`** — les vidéos déjà produites, à copier comme **modèles** :
  documentaire long (`LaFaille01`, `GTA01`, `Glasses01`), Shorts (`Short`, `SecretIkea`, `GTA01Short`),
  séries interactives (`ile/`, `casse/`, `assemblee/`, `onelife/`), leçons POV 3D (`lesson/`, `metro/`, `rentree/`),
  miniatures (`Miniature01`, `MiniaturesLaFaille`).
- **`src/videos/*.json`** et `public/**/plan.json` — le découpage de chaque vidéo (texte affiché, timings) : c'est ce qu'on modifie pour une nouvelle vidéo.
- **`outils/`** — scripts Python/Node : voix ElevenLabs avec horodatage au mot (`voix_*.py`), bruitages (`*_sons.py`),
  images clés et vignettes (`stills_*.mjs`, `images-cles.mjs`), détourage d'image sur macOS (`detourer.swift`).
  Le dossier de publication se fait avec la skill `a-publier` du kit.

## Ce qui n'est PAS fourni

Les médias (`public/` : voix, images, musiques, vidéos sources) ne sont pas dans le dépôt : ils sont propres à chaque vidéo
et parfois soumis à droits. Les compositions existantes servent donc de **modèles de code** : pour rendre l'une d'elles,
il faut d'abord produire ses médias (voix, images) et les placer dans `public/<nom>/`. Le plus simple est de demander à Claude :
« Fais une nouvelle vidéo sur le modèle de `LaFaille01` avec ce sujet ».

## Clés API (optionnelles)

Les scripts de voix ElevenLabs lisent `moteur-remotion/.env` (ou le fichier indiqué par la variable `KIT_ENV`) :
```bash
cp .env.example .env    # puis coller sa clé : ELEVENLABS_API_KEY=...
```
Sans clé, utiliser les voix locales gratuites installées par le kit (Kokoro, Supertonic).
