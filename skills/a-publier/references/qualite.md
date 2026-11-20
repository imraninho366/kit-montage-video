# Module qualité — à appliquer à chaque vidéo de chaîne

Règles apprises en produisant des dizaines de vidéos faceless. Elles valent sans qu'on ait à les redemander.

## Audio (priorité n°1)
- Script écrit pour être **lu à voix haute** : phrases de 15 mots max, une idée par phrase, ponctuation forte, nombres en toutes lettres.
- Chaîne de traitement de la voix, **dans cet ordre** :
  `voix → loudnorm (−14 LUFS) → suppression des silences > 400 ms → Whisper (sous-titres/timing) → rendu`.
  Couper les silences après Whisper désynchronise toute la vidéo.
  ```bash
  ffmpeg -i voix_brute.wav -af "loudnorm=I=-14:TP=-1.5:LRA=11" -ar 48000 voix_norm.wav
  ffmpeg -i voix_norm.wav -af "silenceremove=stop_periods=-1:stop_duration=0.4:stop_threshold=-40dB" voix.wav
  ```
- **Vérifier la voix avant le montage** : transcrire (Whisper large-v3), comparer au script, refaire chaque passage mal prononcé.
- Musique de fond à −30 dB sous la voix, sans mélodie marquée, coupée 2 s avant une révélation.
- **Content ID** : beaucoup de musiques « libres » (Pixabay…) sont revendiquées. Vérifier avant, ou générer sa propre musique.

## Rythme visuel
- Un événement visuel toutes les 3 à 5 s, aucun plan de plus de 8 s.
- Aucune image totalement fixe (Ken Burns lent, sens alterné), sauf choix de style assumé.
- Transitions de 200-300 ms. Alterner les types de plan : illustration, détail recadré, texte animé, schéma.
- Images IA : trier **avant** le rendu (mains, doigts, membres en double, faux texte, anachronismes).

## Rétention
- Le **titre s'écrit avant le script**, et c'est une vraie requête de recherche (autocomplétion YouTube).
- Le **hook s'écrit en dernier** : le moment le plus fort dans les 15 premières secondes, accroche ≤ 25 s.
  Interdits : « Bonjour et bienvenue », « Aujourd'hui on va parler de », « Dans cette vidéo… ».
- Toutes les 2-3 min, une promesse de suite (« mais le plus important arrive à l'étape suivante »).
- Appel à s'abonner : une seule phrase, précédée d'une promesse, à la fin du 1er chapitre et dans les 20 dernières secondes.

## Sous-titres
- Shorts verticaux : karaoké mot à mot (Whisper), gros, centrés, contrastés.
- Vidéos longues : pas d'incrustation, un `.srt` livré à part (dans le dossier A-PUBLIER).

## Miniatures
- 3 versions (A principale, B pour « Tester et comparer », C en réserve), 1280×720.
- Une idée, 3 mots max, lisible à 168 px de large ; la comparer à côté des miniatures concurrentes.
- Le texte de la miniature complète le titre, il ne le répète pas.

## Monétisation YouTube
- Contenu « réutilisé » ou « inauthentique » = refus du Programme Partenaire : chaque vidéo doit apporter une vraie valeur (script original, montage, analyse).
- Cocher « contenu modifié ou synthétique » quand une voix ou une image réaliste est générée par IA.
- Ne jamais inventer de faits, de témoignages ni de chiffres : tout vérifier en ligne, avec la date et la source dans `0-TOUT-COPIER.md`.
- Publication **manuelle** par l'humain (pas d'upload automatique).

## Checklist avant de dire « prêt »
- [ ] Vidéo regardée en entier (skill `watch-video`), aucun écran noir, aucune coupure de voix
- [ ] Voix à −14 LUFS, silences nettoyés, transcription conforme au script
- [ ] Hook ≤ 15-25 s sans formule de politesse
- [ ] Aucun plan > 8 s, aucune image totalement fixe
- [ ] Musique vérifiée (Content ID), à −30 dB
- [ ] 3 miniatures + `.srt` + `0-TOUT-COPIER.md` rempli, sans aucun « À REMPLIR »
- [ ] Faits vérifiés et datés
