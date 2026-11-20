#!/usr/bin/env python3
"""Crée les dossiers A-PUBLIER : une fiche de création par chaîne, un dossier par vidéo.

    a_publier.py chaine "Ma Chaine" [--langue fr]
    a_publier.py video  "Ma Chaine" "Titre de la vidéo" --video rendu.mp4 \
        [--miniatures a.png b.png c.png] [--srt st.srt] [--short s.mp4] [--apercu fil.jpg] [--langue fr]
    a_publier.py index

Racine : ~/Downloads/A-PUBLIER (ou variable A_PUBLIER_DIR). Python standard uniquement.
"""
import argparse
import datetime
import os
import re
import shutil
import subprocess
import sys
import unicodedata
from pathlib import Path

RACINE = Path(os.environ.get('A_PUBLIER_DIR', Path.home() / 'Downloads' / 'A-PUBLIER'))
AUJOURDHUI = datetime.date.today().strftime('%d/%m/%Y')
NOMS_MINIATURES = ['2-MINIATURE-A-recommandee', '3-miniature-B-pour-le-test', '4-miniature-C-de-reserve']


def slug(texte, max_len=60):
    t = unicodedata.normalize('NFKD', texte).encode('ascii', 'ignore').decode()
    t = re.sub(r'[^a-zA-Z0-9]+', '-', t).strip('-').lower()
    return t[:max_len].rstrip('-') or 'video'


def nom_dossier_chaine(nom):
    # Garde le nom lisible mais sans caractères gênants pour le Finder / le terminal
    return re.sub(r'[/:\\]', '-', nom).strip()


def lier(src, dst):
    src = Path(src).expanduser().resolve()
    if not src.is_file():
        sys.exit(f'Fichier introuvable : {src}')
    if dst.exists():
        dst.unlink()
    try:
        os.link(src, dst)          # lien physique : zéro espace disque en plus
    except OSError:
        shutil.copy2(src, dst)     # autre disque : simple copie
    return dst


def duree(fichier):
    try:
        s = float(subprocess.check_output(
            ['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', str(fichier)],
            text=True).strip())
        return f'{int(s // 60)}:{int(s % 60):02d}'
    except Exception:
        return '?'


def resolution(fichier):
    try:
        return subprocess.check_output(
            ['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height',
             '-of', 'csv=s=x:p=0', str(fichier)], text=True).strip().replace('x', '×')
    except Exception:
        return '?'


# ---------------------------------------------------------------- chaîne
def cmd_chaine(a):
    d = RACINE / nom_dossier_chaine(a.nom) / '00-CHAINE'
    d.mkdir(parents=True, exist_ok=True)
    (d.parent / 'publie').mkdir(exist_ok=True)
    fiche = d / '0-CREER-LA-CHAINE.md'
    if fiche.exists() and not a.force:
        print(f'Déjà présent (rien écrasé) : {fiche}')
        return
    arobase = '@' + slug(a.nom).replace('-', '')
    fiche.write_text(f"""# {a.nom} — création de la chaîne

## Identité
- **Nom** : {a.nom}
- **@** : {arobase} (vérifier qu'il est libre sur YouTube, TikTok et Instagram — à réserver tout de suite)
- **Langue** : {a.langue} · **Pays** : À REMPLIR
- **Concept en une phrase** : À REMPLIR
- **Public visé** : À REMPLIR

## Description de la chaîne (YouTube → Personnalisation → Informations de base)
```
À REMPLIR — 3 à 5 lignes : ce qu'on trouve ici, pourquoi c'est différent, rythme de publication.
Mention « Voix générée par IA » si c'est le cas.
```

## Mots-clés de la chaîne (Paramètres → Chaîne → Mots clés)
```
À REMPLIR — 8 à 12 mots-clés séparés par des virgules
```

## Bio TikTok / Instagram (80 caractères max)
```
À REMPLIR
```

## Images (dans ce dossier)
- `photo-profil.png` (800 × 800, lisible en tout petit)
- `banniere.png` (2560 × 1440, texte dans la zone visible sur tous les écrans : 1546 × 423 au centre)
- Aucun logo ni marque déposée d'un tiers.

## Réglages
- Contenu pour enfants : À REMPLIR (Paramètres → Chaîne → Paramètres avancés)
- Label « contenu modifié ou synthétique » : à cocher sur chaque vidéo si voix ou images réalistes générées par IA
- Vidéo de bienvenue pour les non-abonnés : la vidéo 1 une fois publiée
- Sections de la page d'accueil : « Vidéos populaires », puis « Dernières vidéos »

## Plan des premières vidéos
| N° | Titre (= requête de recherche réelle) | Statut |
|---|---|---|
| 01 | À REMPLIR | à faire |
| 02 | À REMPLIR | à faire |
| 03 | À REMPLIR | à faire |

_Créé le {AUJOURDHUI}._
""", encoding='utf-8')
    print(f'Chaîne prête : {d.parent}\n  → remplir {fiche}')
    cmd_index(None)


# ---------------------------------------------------------------- vidéo
def prochain_numero(dossier_chaine):
    nums = []
    for base in (dossier_chaine, dossier_chaine / 'publie'):
        if base.exists():
            nums += [int(m.group(1)) for p in base.iterdir() if p.is_dir()
                     for m in [re.match(r'(\d\d)-', p.name)] if m]
    return max([n for n in nums if n > 0], default=0) + 1


def cmd_video(a):
    chaine = RACINE / nom_dossier_chaine(a.chaine)
    if not (chaine / '00-CHAINE').exists():
        print(f'Chaîne inconnue, je la crée d’abord : {a.chaine}')
        cmd_chaine(argparse.Namespace(nom=a.chaine, langue=a.langue, force=False))
    n = a.numero or prochain_numero(chaine)
    d = chaine / f'{n:02d}-{slug(a.titre)}'
    d.mkdir(parents=True, exist_ok=True)

    fichiers = []
    if a.video:
        v = lier(a.video, d / '1-VIDEO.mp4')
        fichiers.append(f'`1-VIDEO.mp4` ({duree(v)}, {resolution(v)})')
    for nom, src in zip(NOMS_MINIATURES, a.miniatures or []):
        dst = lier(src, d / f'{nom}{Path(src).suffix.lower()}')
        fichiers.append(f'`{dst.name}`')
    if a.srt:
        lier(a.srt, d / f'5-sous-titres-{a.langue.upper()}.srt')
        fichiers.append(f'`5-sous-titres-{a.langue.upper()}.srt`')
    if a.apercu:
        dst = lier(a.apercu, d / f'6-apercu-dans-le-fil{Path(a.apercu).suffix.lower()}')
        fichiers.append(f'`{dst.name}` (test interne, à ne pas publier)')
    if a.short:
        s = lier(a.short, d / '7-SHORT.mp4')
        fichiers.append(f'`7-SHORT.mp4` ({duree(s)}, {resolution(s)})')

    fiche = d / '0-TOUT-COPIER.md'
    if fiche.exists() and not a.force:
        print(f'Fichiers mis à jour ; fiche existante conservée : {fiche}')
        cmd_index(None)
        return
    bloc_short = """
## ▸ SHORT (`7-SHORT.mp4`)
Titre :
```
À REMPLIR #Shorts
```
Description :
```
À REMPLIR — renvoyer vers la vidéo longue.
```
Tags : `À REMPLIR`
Réglages : champ **« Vidéo associée »** → la vidéo longue. Publier 2-3 jours après la longue.
""" if a.short else ''
    fiche.write_text(f"""# {a.chaine} · Vidéo {n:02d} — {a.titre}

Fichiers : {' · '.join(fichiers) or 'À AJOUTER'}

## ▸ TITRE
```
{a.titre}
```
Requête réelle à vérifier dans l'autocomplétion YouTube (noter la date) : À REMPLIR
Titre de secours pour « Tester et comparer » :
```
À REMPLIR
```

## ▸ DESCRIPTION
```
À REMPLIR — 2 lignes d'accroche qui reprennent la promesse du titre.

0:00 À REMPLIR (chapitres mesurés sur la vidéo réelle)

Sources : À REMPLIR (citées par leur nom, sans liens)
```

## ▸ TAGS
```
À REMPLIR — 10 à 15 tags, du plus précis au plus large
```

## ▸ SOUS-TITRES
`5-sous-titres-{a.langue.upper()}.srt` → Studio › Sous-titres › Ajouter une langue › **Importer un fichier** (« Avec minutage »).

## ▸ MINIATURES
- **A** (`2-MINIATURE-A-recommandee`) : **principale**
- **B** (`3-miniature-B-pour-le-test`) : pour « Tester et comparer » face à A
- C (`4-miniature-C-de-reserve`) : en réserve

## ▸ RÉGLAGES STUDIO
- Audience : **À REMPLIR** (conçue pour les enfants : oui / non)
- Catégorie : **À REMPLIR** · Langue de la vidéo : **{a.langue}**
- Contenu modifié ou synthétique : **À REMPLIR**
- Écran de fin : les 5 dernières secondes, bouton S'abonner + vidéo suivante
- Publication conseillée : **À REMPLIR** (heure de pointe du public visé)

## ▸ FAITS VÉRIFIÉS LE {AUJOURDHUI}
- À REMPLIR — chaque chiffre de la vidéo, avec sa source. ✅ vérifié · ⚠️ incertain
{bloc_short}
## ▸ APRÈS PUBLICATION
Déplacer ce dossier dans `{chaine.name}/publie/`.
""", encoding='utf-8')
    print(f'Vidéo prête : {d}\n  → remplir {fiche}')
    cmd_index(None)


# ---------------------------------------------------------------- index
def cmd_index(_):
    RACINE.mkdir(parents=True, exist_ok=True)
    lignes = ['# À PUBLIER — un dossier par chaîne', '',
              '| Chaîne | Vidéos prêtes | Publiées |', '|---|---|---|']
    for c in sorted(p for p in RACINE.iterdir() if p.is_dir() and not p.name.startswith('.')):
        pretes = sorted(p.name for p in c.iterdir() if p.is_dir() and re.match(r'\d\d-', p.name) and p.name != '00-CHAINE')
        publiees = len([p for p in (c / 'publie').iterdir() if p.is_dir()]) if (c / 'publie').exists() else 0
        lignes.append(f"| {c.name} | {' · '.join(f'`{x}/`' for x in pretes) or '—'} | {publiees} |")
    lignes += ['', 'Dans chaque chaîne :',
               '- `00-CHAINE/0-CREER-LA-CHAINE.md` : nom, @, description, mots-clés, bio, images, réglages',
               '- `NN-slug/0-TOUT-COPIER.md` : titre, description, tags et réglages, prêts à coller dans YouTube Studio',
               '- `1-VIDEO.mp4`, `2-MINIATURE-A-recommandee.png`, `3-miniature-B-pour-le-test.png`, '
               '`4-miniature-C-de-reserve.png`, `5-sous-titres-XX.srt`', '',
               'Les fichiers sont des liens vers les originaux (aucune place disque en plus) : '
               'supprimer ce dossier n’efface pas les originaux.',
               'Une fois une vidéo publiée, déplace son dossier dans le sous-dossier `publie/` de la chaîne.', '',
               f'_Mis à jour le {AUJOURDHUI}._', '']
    (RACINE / 'LISEZ-MOI.md').write_text('\n'.join(lignes), encoding='utf-8')
    print(f'Index : {RACINE / "LISEZ-MOI.md"}')


def main():
    p = argparse.ArgumentParser(description='Dossiers A-PUBLIER (chaînes et vidéos)')
    sp = p.add_subparsers(dest='cmd', required=True)
    c = sp.add_parser('chaine', help='créer une chaîne et sa fiche')
    c.add_argument('nom')
    c.add_argument('--langue', default='fr')
    c.add_argument('--force', action='store_true', help='réécrire la fiche si elle existe')
    v = sp.add_parser('video', help='préparer une vidéo finie')
    v.add_argument('chaine')
    v.add_argument('titre')
    v.add_argument('--video')
    v.add_argument('--miniatures', nargs='*')
    v.add_argument('--srt')
    v.add_argument('--short')
    v.add_argument('--apercu')
    v.add_argument('--langue', default='fr')
    v.add_argument('--numero', type=int)
    v.add_argument('--force', action='store_true', help='réécrire 0-TOUT-COPIER.md s’il existe')
    sp.add_parser('index', help='mettre à jour LISEZ-MOI.md')
    a = p.parse_args()
    {'chaine': cmd_chaine, 'video': cmd_video, 'index': cmd_index}[a.cmd](a)


if __name__ == '__main__':
    main()
