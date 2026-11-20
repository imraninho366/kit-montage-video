---
name: a-publier
description: Prépare le dossier de publication d'une chaîne YouTube/TikTok dans ~/Downloads/A-PUBLIER/<Chaîne>/ — fiche de création de chaîne (00-CHAINE/0-CREER-LA-CHAINE.md) puis un dossier par vidéo (NN-slug/ avec 0-TOUT-COPIER.md, 1-VIDEO.mp4, miniatures, sous-titres). À utiliser dès qu'on lance une nouvelle chaîne, qu'une vidéo est finie, ou qu'on demande « prépare la publication », « dossier à publier », « fiche description/tags », « crée ma chaîne ».
---

# A-PUBLIER — point de retrait unique

L'utilisateur **publie lui-même** (jamais d'envoi automatique sur YouTube/TikTok : ni API, ni navigateur).
Le travail de Claude s'arrête à un dossier complet et prêt à copier-coller.

## Structure (à respecter à la lettre)

```
~/Downloads/A-PUBLIER/
├── LISEZ-MOI.md                      ← tableau de toutes les chaînes et vidéos prêtes
└── <Nom de la chaîne>/
    ├── 00-CHAINE/
    │   ├── 0-CREER-LA-CHAINE.md      ← nom, @, description, mots-clés, bio TikTok, réglages
    │   ├── photo-profil.png          ← 800×800
    │   └── banniere.png              ← 2560×1440 (texte dans les 1546×423 du centre)
    ├── 01-slug-de-la-video/
    │   ├── 0-TOUT-COPIER.md          ← titre, description, tags, réglages Studio, faits vérifiés
    │   ├── 1-VIDEO.mp4
    │   ├── 2-MINIATURE-A-recommandee.png
    │   ├── 3-miniature-B-pour-le-test.png
    │   ├── 4-miniature-C-de-reserve.png
    │   ├── 5-sous-titres-XX.srt      ← XX = langue (FR, EN…)
    │   ├── 6-apercu-dans-le-fil.jpg  ← test interne, à ne pas publier
    │   └── 7-SHORT.mp4               ← optionnel (vertical 1080×1920)
    └── publie/                       ← y déplacer chaque dossier vidéo une fois publié
```

## Outil

Le script `scripts/a_publier.py` (Python standard, aucune dépendance) crée tout ça :

```bash
# 1. Nouvelle chaîne : crée le dossier + la fiche 0-CREER-LA-CHAINE.md, et l'ouvre dans le Finder / l'Explorateur
python3 ~/.claude/skills/a-publier/scripts/a_publier.py chaine "Nom De La Chaine" --langue fr --ouvrir

# 2. Vidéo finie : crée NN-slug/, numérote tout seul, range les fichiers, écrit 0-TOUT-COPIER.md
python3 ~/.claude/skills/a-publier/scripts/a_publier.py video "Nom De La Chaine" "Titre de la vidéo" \
    --video rendu.mp4 --miniatures a.png b.png c.png --srt sous-titres.srt --langue fr \
    [--short short.mp4] [--apercu fil.jpg] [--ouvrir]

# 3. Remettre à jour le tableau LISEZ-MOI.md
python3 ~/.claude/skills/a-publier/scripts/a_publier.py index

# 4. Ouvrir A-PUBLIER (ou une chaîne) dans le Finder / l'Explorateur Windows
python3 ~/.claude/skills/a-publier/scripts/a_publier.py ouvrir ["Nom De La Chaine"]
```

**Windows** : remplacer `python3` par `python` et `~/.claude` par `"$env:USERPROFILE\.claude"` (PowerShell).
Le dossier est alors `C:\Users\<nom>\Downloads\A-PUBLIER`.

Toujours passer `--ouvrir` quand on crée une chaîne ou qu'une vidéo est prête, pour que l'utilisateur voie le dossier.

Les fichiers lourds sont des **liens physiques** quand c'est possible (aucun espace disque en plus ;
supprimer A-PUBLIER n'efface pas les originaux). Dossier racine modifiable : variable `A_PUBLIER_DIR`.

## Ce que Claude doit faire après le script

Le script pose des **gabarits**. Claude remplit ensuite chaque `0-TOUT-COPIER.md` / `0-CREER-LA-CHAINE.md`
avec le vrai contenu — jamais de section laissée en `À REMPLIR` :

1. **Titre** : une requête de recherche réelle (vérifiée dans l'autocomplétion YouTube, date notée) + un titre de secours pour « Tester et comparer ».
2. **Description** : 2 lignes d'accroche, chapitres horodatés (`0:00 …`, mesurés sur la vidéo réelle), sources citées par leur nom (pas de liens), mention « voix générée par IA » si c'est le cas.
3. **Tags** : 10 à 15, séparés par des virgules, du plus précis au plus large.
4. **Miniatures** : laquelle est la principale (A), laquelle sert au test A/B (B), la réserve (C).
5. **Réglages Studio** : audience (enfants oui/non), catégorie, langue, case « contenu modifié ou synthétique », écran de fin, heure de publication conseillée.
6. **Faits vérifiés** : chaque chiffre de la vidéo vérifié en ligne, avec la date et la source ; ⚠️ pour ce qui est incertain.
7. **Short** (si présent) : titre, description, tags, champ « Vidéo associée » vers la vidéo longue.
8. Lancer `index` pour mettre `LISEZ-MOI.md` à jour.

Avant d'annoncer « prêt » : regarder la vidéo (skill `watch-video`), vérifier la durée, le son (−14 LUFS)
et que les miniatures sont lisibles en petit (168 px de large). Voir `references/qualite.md`.
