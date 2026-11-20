import React from 'react';
import {AbsoluteFill, Audio, Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import ancresBrutes from './ancres_micro.json';
import voixBrute from './voix_micro.json';
import {Ancre, Chiffre, cl, CUIVRE, CYAN, Entete, Etiquette, Fin, FPS, imageBf, JAUNE, ORANGE, phraseA, ROUGE, SousTitre, surPhrase,
  Tampon, Voix} from './commun';

/**
 * « Tech Unseen · Lesson 03 — What your microwave really does » (TikTok 9:16, ~71 s, voix Liam).
 * 3D Cycles (learn-tiktok/proto_micro/scene_micro.py, 241 images). Faits : FDA (pas de cuisson « de l'intérieur »,
 * l'eau vibre, les ondes chauffent les couches extérieures), magnétron 2,45 GHz, grille de porte < longueur d'onde (~12 cm).
 */
const voix = voixBrute as unknown as Voix;
const ANCRES = ancresBrutes as unknown as Record<string, Record<string, Ancre>>;
const N3D = 240;
const FIN_VOIX = Math.ceil((voix.duree + .25) * FPS);
export const DUREE_MICRO_LESSON = FIN_VOIX + 30;
const SEG: [number, number][] = [
  [0, 30], [30, 50], [50, 80], [80, 100], [100, 149], [150, 160], [160, 168], [168, 180], [180, 192], [192, 199],
  [200, 210], [210, 221], [110, 130], [130, 149], [222, 240], [240, 240], [240, 240],
];
const ancre = (bf: number, nom: string): Ancre | null => ANCRES[String(Math.min(Math.max(bf, 0), N3D))]?.[nom] ?? null;

export const MicroLesson: React.FC = () => {
  const f = useCurrentFrame();
  const k = phraseA(voix, f);
  const bf = imageBf(voix, SEG, f);
  const debut = (i: number) => Math.round(voix.debuts[i] * FPS);
  const src = staticFile(`lesson_micro/3d/f${String(bf).padStart(4, '0')}.jpg`);
  const finDebut = debut(15);
  const actif = k <= 4 ? 0 : k <= 9 ? 1 : 2;
  const flash = (i: number) => interpolate(f, [debut(i) - 2, debut(i) + 2, debut(i) + 8], [0, .6, 0], cl);

  return (
    <AbsoluteFill style={{backgroundColor: '#05080F'}}>
      <Audio src={staticFile('lesson_micro/voix_micro.wav')} />
      <AbsoluteFill style={{transform: `scale(${1 + .03 * Math.sin(f / 90)})`}}>
        <Img src={src} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
      </AbsoluteFill>
      <AbsoluteFill style={{background: '#fff', opacity: flash(5) + flash(10)}} />

      <Tampon t={surPhrase(voix, f, 0)} texte="✗ “INSIDE-OUT” = MYTH" couleur={ROUGE} top={430} />
      <Entete lecon="TECH UNSEEN · LESSON 03" noms={['The waves', 'The water', 'The heat']} actif={actif}
        vis={interpolate(f, [debut(1), debut(1) + 15], [0, 1], cl) * (1 - interpolate(f, [finDebut, finDebut + 10], [0, 1], cl))} fini={false} />

      <Etiquette pt={ancre(bf, 'magnetron')} t={surPhrase(voix, f, 2)} texte="MAGNETRON" sous="makes the microwaves" couleur={CUIVRE} dx={-80} dy={-300} />
      <Chiffre t={surPhrase(voix, f, 3)} haut="MICROWAVE FREQUENCY" gros="2.45 GHz" bas="Wi-Fi uses the 2.4 GHz band too" couleur={CYAN} top={340} />
      <Etiquette pt={ancre(bf, 'cavity')} t={surPhrase(voix, f, 4)} texte="METAL WALLS" sous="waves bounce around" couleur={CYAN} dx={60} dy={-320} />
      <Etiquette pt={ancre(bf, 'mol')} t={surPhrase(voix, f, 6)} texte="WATER MOLECULE" sous="one side +, one side −" couleur={JAUNE} dx={0} dy={-380} />
      <Chiffre t={surPhrase(voix, f, 7)} haut="THE FIELD FLIPS" gros="2.45 billion" bas="times every second" couleur={CYAN} top={300} />
      <Tampon t={surPhrase(voix, f, 9)} texte="JOSTLING = HEAT" couleur={ORANGE} top={380} />
      <Etiquette pt={ancre(bf, 'rim')} t={surPhrase(voix, f, 10)} texte="OUTER LAYER" sous="where the waves reach" couleur={ORANGE} dx={80} dy={-330} />
      <Etiquette pt={ancre(bf, 'soup')} t={surPhrase(voix, f, 11)} texte="CENTER" sous="heated later, from outside in" couleur={CYAN} dx={-60} dy={330} />
      <Etiquette pt={ancre(bf, 'rim')} t={surPhrase(voix, f, 12)} texte="HOT & COLD SPOTS" sous="waves don't spread evenly" couleur={ROUGE} dx={60} dy={-360} />
      <Chiffre t={surPhrase(voix, f, 13)} haut="FIX" gros="Spin + stir" bas="halfway through" couleur={JAUNE} top={330} />
      <Etiquette pt={ancre(bf, 'door')} t={surPhrase(voix, f, 14)} texte="HOLES < WAVES" sous="light gets out · microwaves don't" couleur={JAUNE} dx={0} dy={-300} />

      <SousTitre f={f} voix={voix} finVoix={finDebut} />
      <Fin f={f} debut={finDebut} recap={['Waves shake water molecules', 'Only the outer layer heats', 'Stir to kill cold spots']}
        quiz="Why does frozen food heat unevenly?" abo={debut(16)} />
    </AbsoluteFill>
  );
};
