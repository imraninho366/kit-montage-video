import {loadFont as chargerMontserrat} from '@remotion/google-fonts/Montserrat';
import React from 'react';
import {AbsoluteFill, Audio, Img, interpolate, OffthreadVideo, staticFile, useCurrentFrame} from 'remotion';
import voix01 from '../../../public/vmax/01-pcx125/voix.json';

/**
 * Chaîne « vitesse max » moto/scooter (étude : ~/Downloads/etude-vmaxhunter/ETUDE.md).
 * Gabarit 3 étages : photo constructeur / bandeau titre / POV source + loupe compteur.
 * Préparation et voix : ~/Downloads/chaine-vmax-moto/ (outils/voix.py, <ep>/script.txt).
 */
const {fontFamily: MONT} = chargerMontserrat('normal', {weights: ['700', '900'], subsets: ['latin']});
const FPS = 30, L = 1080, H = 1920, PHOTO_H = 720, JAUNE = '#FFD400';

type Mot = {t: string; a: number; b: number};
type Voix = {duree: number; lignes: {debut: number; fin: number; texte: string; mots: Mot[]}[]};
type Episode = {
  dossier: string; titre: string; voix: Voix;
  creditVideo: string; creditPhoto: string;
  zoomFin: number;                                     // seconde (sortie) où l'on resserre sur le tableau de bord
  loupe: {x: number; y: number; w: number; h: number}; // zone du compteur dans la source 1920×1080
};

export const EPISODES_VMAX: Record<string, Episode> = {
  '01-pcx125': {
    dossier: 'vmax/01-pcx125', titre: 'Vitesse Max Honda PCX 125', voix: voix01 as Voix,
    creditVideo: 'Vidéo : Pavel K. (YouTube)', creditPhoto: 'Photo : Honda',
    zoomFin: 57.9, loupe: {x: 890, y: 540, w: 360, h: 220},
  },
};
export const dureeVmax = (ep: string) => Math.ceil(EPISODES_VMAX[ep].voix.duree * FPS);

/** POV plein cadre en bas ; à la fin on resserre sur le tableau de bord (cache aussi le carton de la source). */
const Route: React.FC<{e: Episode}> = ({e}) => {
  const t = useCurrentFrame() / FPS;
  const zone = H - PHOTO_H;
  const z = interpolate(t, [e.zoomFin, e.zoomFin + 0.4], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const echelle = interpolate(z, [0, 1], [zone / 1080, zone / 790]);
  const haut = interpolate(z, [0, 1], [0, 290]);        // ligne de la source qui arrive en haut du cadre
  const w = 1920 * echelle;
  return <div style={{position: 'absolute', top: PHOTO_H, left: 0, width: L, height: zone, overflow: 'hidden', background: '#000'}}>
    <OffthreadVideo src={staticFile(`${e.dossier}/route.mp4`)} volume={0.22}
      style={{position: 'absolute', width: w, height: 1080 * echelle, left: (L - w) / 2, top: -haut * echelle}} />
  </div>;
};

/** Loupe sur le compteur, comme chez VmaxHunter : la vraie aiguille, agrandie. */
const Loupe: React.FC<{e: Episode}> = ({e}) => {
  const t = useCurrentFrame() / FPS;
  const {x, y, w, h} = e.loupe;
  const k = 1.5, bw = w * k, bh = h * k;
  const o = interpolate(t, [0.3, 0.8, e.zoomFin, e.zoomFin + 0.3], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return <div style={{position: 'absolute', left: (L - bw) / 2, top: PHOTO_H + 70, width: bw, height: bh, borderRadius: 28,
    overflow: 'hidden', border: '6px solid #fff', boxShadow: '0 10px 40px rgba(0,0,0,.55)', opacity: o}}>
    <OffthreadVideo src={staticFile(`${e.dossier}/route.mp4`)} muted
      style={{position: 'absolute', width: 1920 * k, height: 1080 * k, left: -x * k, top: -y * k}} />
  </div>;
};

const Bandeau: React.FC<{titre: string}> = ({titre}) =>
  <div style={{position: 'absolute', top: PHOTO_H - 46, left: 0, width: L, display: 'flex', justifyContent: 'center'}}>
    <div style={{background: '#fff', borderRadius: 26, padding: '16px 38px', fontFamily: MONT, fontWeight: 900, fontSize: 52,
      color: '#111', boxShadow: '0 6px 24px rgba(0,0,0,.35)'}}>{titre}</div>
  </div>;

/** Sous-titres mot à mot, 3 mots à la fois, mot prononcé en jaune. */
const SousTitres: React.FC<{voix: Voix}> = ({voix}) => {
  const t = useCurrentFrame() / FPS;
  const groupes: Mot[][] = [];
  for (const l of voix.lignes) for (let i = 0; i < l.mots.length; i += 3) groupes.push(l.mots.slice(i, i + 3));
  const g = groupes.find((gr, i) => t >= gr[0].a - 0.05 && t < (groupes[i + 1]?.[0].a ?? Infinity) - 0.05 && t < gr[gr.length - 1].b + 0.5);
  if (!g) return null;
  return <div style={{position: 'absolute', top: 1175, left: 60, width: L - 120, textAlign: 'center', fontFamily: MONT, fontWeight: 900,
    fontSize: 74, lineHeight: 1.1, textTransform: 'uppercase'}}>
    {g.map((m, i) => <span key={i} style={{color: t >= m.a ? JAUNE : '#fff', WebkitTextStroke: '10px #000', paintOrder: 'stroke fill',
      marginRight: 18}}>{m.t.replace(/[,.:;…]+$/, '')}</span>)}
  </div>;
};

const Credit: React.FC<{texte: string; top: number; droite?: boolean}> = ({texte, top, droite}) =>
  <div style={{position: 'absolute', top, [droite ? 'right' : 'left']: 22, fontFamily: MONT, fontWeight: 700, fontSize: 26,
    color: '#fff', background: 'rgba(0,0,0,.45)', padding: '4px 12px', borderRadius: 8}}>{texte}</div>;

export const VmaxMoto: React.FC<{ep: string}> = ({ep}) => {
  const e = EPISODES_VMAX[ep];
  return <AbsoluteFill style={{background: '#000'}}>
    <Img src={staticFile(`${e.dossier}/photo.jpg`)}
      style={{position: 'absolute', top: 0, left: 0, width: L, height: PHOTO_H, objectFit: 'cover', objectPosition: '62% 60%'}} />
    <Route e={e} />
    <Loupe e={e} />
    <Bandeau titre={e.titre} />
    <Credit texte={e.creditPhoto} top={22} droite />
    <Credit texte={e.creditVideo} top={PHOTO_H + 46} />
    <SousTitres voix={e.voix} />
    <Audio src={staticFile(`${e.dossier}/voix.wav`)} />
  </AbsoluteFill>;
};
