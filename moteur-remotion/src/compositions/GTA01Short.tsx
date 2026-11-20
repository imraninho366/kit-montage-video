import {loadFont as chargerAnton} from '@remotion/google-fonts/Anton';
import {loadFont as chargerMono} from '@remotion/google-fonts/IBMPlexMono';
import React from 'react';
import {AbsoluteFill, Audio, interpolate, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {Beat} from './GTA01';
import s1 from '../../public/gta01/shorts/s1-disque.json';
import s2 from '../../public/gta01/shorts/s2-police.json';
import s3 from '../../public/gta01/shorts/s3-rumeurs.json';
import v2s1 from '../../public/gta02/shorts/s1-netflix.json';
import v2s2 from '../../public/gta02/shorts/s2-conges.json';
import v2s3 from '../../public/gta02/shorts/s3-milliard.json';
import {VISUELS_GTA02} from './GTA02';

/** Shorts 9:16 de Dossier Leonida, tirés de la vidéo 1 (plan : chaine-gta6/videos/01-tout-savoir/shorts.py). */
const {fontFamily: ANTON} = chargerAnton('normal', {weights: ['400'], subsets: ['latin']});
const {fontFamily: MONO} = chargerMono('normal', {weights: ['600'], subsets: ['latin']});
const NUIT = '#0D0A18', ROSE = '#FF4FA3', ORANGE = '#FFB547', BLANC = '#F6F2FF';
const FPS = 30, CARRE = 1080, HAUT = 300;
type Mot = {m: string; a: number; b: number};
type Episode = {frames: number; beats: {d: number; f: number; v: Record<string, any>}[]; mots: Mot[]};
export const SHORTS_GTA01: Record<string, Episode> = {'s1-disque': s1 as Episode, 's2-police': s2 as Episode, 's3-rumeurs': s3 as Episode};
export const SHORTS_GTA02: Record<string, Episode> = {'s1-netflix': v2s1 as Episode, 's2-conges': v2s2 as Episode, 's3-milliard': v2s3 as Episode};

/** Les plans Rockstar remplissent le carré ; les interfaces sont réduites pour rester entières. */
const Fenetre: React.FC<{v: Record<string, any>; d: number}> = ({v, d}) => {
  const plein = v.t === 'clip';
  const echelle = plein ? 1 : 0.5625;  // 1920 × 0.5625 = 1080 : l'interface tient entière
  const vue = plein ? {...v, x: '', sur: ''} : v;          // la légende 16:9 serait coupée : on la repose en dessous
  return <div style={{position: 'absolute', top: HAUT, left: 0, width: CARRE, height: CARRE, overflow: 'hidden', background: NUIT}}>
    <div style={{position: 'absolute', width: 1920, height: 1080, left: (CARRE - 1920 * echelle) / 2, top: (CARRE - 1080 * echelle) / 2,
      transform: `scale(${echelle})`, transformOrigin: 'top left'}}>
      <Beat v={vue} d={d} extra={VISUELS_GTA02} />
    </div>
    {plein && v.x && <LegendeCarre x={v.x} sur={v.sur} />}
  </div>;
};

const LegendeCarre: React.FC<{x: string; sur?: string}> = ({x, sur}) => {
  const f = useCurrentFrame();
  const e = interpolate(f, [2, 10], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return <AbsoluteFill style={{background: 'linear-gradient(0deg, rgba(13,10,24,0.92) 0%, rgba(13,10,24,0.5) 32%, transparent 55%)', justifyContent: 'flex-end', alignItems: 'center',
    paddingBottom: 60, opacity: e}}>
    {sur && <div style={{fontFamily: MONO, fontWeight: 600, fontSize: 34, letterSpacing: 8, color: ORANGE, textTransform: 'uppercase', marginBottom: 12}}>{sur}</div>}
    <div style={{fontFamily: ANTON, fontSize: x.length > 30 ? 74 : 92, lineHeight: 1.06, color: BLANC, textTransform: 'uppercase', textAlign: 'center', padding: '0 60px',
      textShadow: '0 5px 0 #000'}}>{x}</div>
  </AbsoluteFill>;
};

/** Groupes de 3 mots au plus, coupés après la ponctuation. */
const groupes = (mots: Mot[]) => {
  const g: Mot[][] = [];
  let cur: Mot[] = [];
  for (const m of mots) {
    cur.push(m);
    if (cur.length === 3 || /[.,:;!?…»]$/.test(m.m)) { g.push(cur); cur = []; }
  }
  if (cur.length) g.push(cur);
  return g;
};

const Karaoke: React.FC<{mots: Mot[]}> = ({mots}) => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const gs = groupes(mots);
  let i = gs.findIndex((g, k) => t >= g[0].a - 0.05 && (k === gs.length - 1 || t < gs[k + 1][0].a - 0.05));
  if (i < 0) i = t < gs[0][0].a ? 0 : gs.length - 1;
  const g = gs[i];
  const pop = interpolate(t - g[0].a, [-0.05, 0.08], [0.9, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return <div style={{position: 'absolute', top: HAUT + CARRE + 70, left: 50, right: 50, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '0 26px',
    transform: `scale(${pop})`}}>
    {g.map((m, k) => {
      const dit = t >= m.a - 0.03;
      return <span key={k} style={{fontFamily: ANTON, fontSize: 118, lineHeight: 1.12, textTransform: 'uppercase', color: dit && t < m.b + 0.15 ? ROSE : BLANC,
        WebkitTextStroke: '5px #000', paintOrder: 'stroke', textShadow: '0 8px 0 #000'}}>{m.m.replace(/[«»"]/g, '')}</span>;
    })}
  </div>;
};

export const GTA01Short: React.FC<{nom: string; video?: 'gta01' | 'gta02'}> = ({nom, video = 'gta01'}) => {
  const ep = (video === 'gta02' ? SHORTS_GTA02 : SHORTS_GTA01)[nom];
  const f = useCurrentFrame();
  return <AbsoluteFill style={{background: `radial-gradient(circle at 50% 35%, #2a1440, ${NUIT} 70%)`}}>
    <Audio src={staticFile(`${video}/shorts/${nom}.wav`)} />
    <div style={{position: 'absolute', top: 150, width: '100%', textAlign: 'center', fontFamily: MONO, fontWeight: 600, fontSize: 40, letterSpacing: 10, color: ORANGE}}>DOSSIER LEONIDA</div>
    {ep.beats.map((b, i) => <Sequence key={i} from={b.d} durationInFrames={Math.max(1, b.f - b.d)}><Fenetre v={b.v} d={b.f - b.d} /></Sequence>)}
    <div style={{position: 'absolute', top: HAUT - 6, left: 0, width: CARRE, height: 6, background: `linear-gradient(90deg, ${ROSE}, ${ORANGE})`}} />
    <div style={{position: 'absolute', top: HAUT + CARRE, left: 0, width: CARRE, height: 6, background: `linear-gradient(90deg, ${ROSE}, ${ORANGE})`}} />
    <Karaoke mots={ep.mots} />
    <div style={{position: 'absolute', bottom: 0, left: 0, height: 12, width: `${(f / ep.frames) * 100}%`, background: ROSE}} />
  </AbsoluteFill>;
};
