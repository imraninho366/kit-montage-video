# L'Île des Abonnés — fabriquer un épisode

Imran dit « épisode N ». Le jour J+1 après la vidéo précédente : le commentaire épinglé promet « Résultat dans 1 jour » (choix d’Imran, 07/11/2026). La tempête, elle, arrive « dans 2 jours » dans la vidéo.

## 0. Deux branches : TikTok et YouTube Shorts (décision d'Imran, 08/11/2026)
- Le **pilote est le même** sur les deux plateformes.
- À partir de l'épisode 2, **les histoires sont séparées** : chaque plateforme a ses votes, ses pseudos, ses constructions et ses dangers.
  « Épisode N » = **deux épisodes** à fabriquer, un par branche (deux voix, deux rendus), toujours l'un après l'autre (8 Go de RAM).
- Chaque branche garde sa propre île : les constructions d'une branche n'apparaissent jamais dans l'autre.
- Coût : environ 190 crédits ElevenLabs par épisode, soit environ 380 par jour pour les deux branches.

## 1. Relever les commentaires (≈ 2 min par branche)
**TikTok** (yt-dlp ne récupère rien, et TikTok bloque tout envoi de la page vers la machine) :
1. Navigateur intégré → page TikTok de la vidéo précédente → onglet **Commentaires**.
2. Coller dans l'outil JavaScript du navigateur `outils/ile/analyse_commentaires.js` **puis** `outils/ile/extraire_commentaires.js`.
   Lecture seule : rien n'est cliqué, rien n'est posté. Le script analyse dans la page et renvoie un résumé.
3. Enregistrer ce résumé dans `releves/tiktok_epNN_releve.json`, puis `node outils/ile/releve.mjs md releves/tiktok_epNN_releve.json`.

**YouTube** (yt-dlp récupère les commentaires) :
- `node outils/ile/releve.mjs youtube <url du Short précédent> epNN` → `releves/youtube_epNN_releve.json` + `.md`.

Les deux plateformes passent par la même analyse (`analyse_commentaires.js`), donc les mêmes règles de vote.
Validé le 06/11/2026 sur la vidéo de référence (@abonne_120) : 366 commentaires lus, 142 votes reconnus.
Le relevé donne **C** gagnant, et c'est bien le résultat que Sonigz a annoncé dans son épisode 3.
Relevé YouTube testé le 08/11/2026 : 600 commentaires lus sur un Short public.

## 2. Lire le relevé
- **Vote** : score = personnes + likes reçus par leurs commentaires de vote. C'est un sondage sur les commentaires les plus visibles, pas un total.
  Si `serre: true` (écart < 10 %), c'est Imran qui tranche.
- **Demandes spéciales** (`demandes`) : retenir 4 à 6 parmi les plus likées, drôles et constructibles en low-poly.
  Écarter : insultes, sexuel, haine, marques et logos (`ecarter: true`, à revérifier à la main), personnes réelles.
  Une demande complexe se simplifie (« bunker pour toute l'île » → bunker low-poly avec une porte blindée).
- **Cabanes standard** (`cabanes_standard`) : ceux qui ont seulement demandé « ma maison » reçoivent une cabane à leur nom
  (plan large, pseudos sur les toits, ou un tirage au sort « cherche ton pseudo »).
- YouTube a souvent moins de commentaires que TikTok : avec peu de votes, on garde le gagnant mais on cite tous les votants.
- Montrer les deux relevés à Imran avant de construire.

## 3. Écrire l'épisode (≈ 30 s)
Structure des épisodes de référence, qui marche :
1. « Vous êtes plus de N à commenter » + bulles de commentaires (accroche, ≤ 2 s).
2. « Le vote est tombé : c'est le X ! » → la construction gagnante sort de son bloc noir.
3. 3 à 5 demandes : « @abonne_121 voulait… » → la construction apparaît en pointillés, puis se remplit. Toujours un détail drôle.
4. Nouveau danger (pluie de météores, pirates, requin, volcan, il faut de l'eau…) → nouveau vote A/B/C.
5. « Abonne-toi pour savoir s'il survit » + bouton.
Règles : nombres en toutes lettres dans le texte de la voix, jamais d'annonce du résultat de l'épisode suivant.
Les deux branches peuvent garder le même danger suivant, ce qui économise de la 3D : seul ce qui découle des votes diffère.

## 4. Fabriquer (pour chaque branche, l'une après l'autre)
- Texte de la voix : `<branche>_epNN_texte.txt` → `python3 outils/voix_ile.py <branche>_epNN`.
  Voix Hugo, moteur **eleven_v4 obligatoire** (sur multilingual_v2, elle ne ressemble pas à sa démo).
- Vérifier la voix : Whisper large-v3, comparer au script, refaire si un mot est faux.
- Scène : réutiliser `Monde` (Ile3D.tsx). Ajouter chaque construction comme composant (primitives three.js, matériaux `useMat`),
  la placer sur l'île (positions libres : bord de plage, zone herbe) et garder TOUTES les constructions des épisodes précédents DE LA MÊME BRANCHE.
  L'état de chaque île est passé en props (liste de constructions par branche), pour ne jamais mélanger les deux histoires.
- Timeline : copier IlePilote.tsx → IleTikTokEpNN.tsx / IleYouTubeEpNN.tsx (grille + REPERES accrochés aux mots, titres, sous-titres AFFICHAGE).
- Rendu 1080×1920, contrôle image par image (pseudos lisibles, rien devant le visage de Robin), puis watch-video.
- Ranger dans `A-PUBLIER/L'Ile des Abonnes/TikTok/NN-titre/` et `.../YouTube/NN-titre/`, chacun avec son `0-TOUT-COPIER.md`
  (TikTok : texte + hashtags ; YouTube : titre ≤ 100 caractères avec #Shorts + description ; commentaire à épingler des deux côtés).
