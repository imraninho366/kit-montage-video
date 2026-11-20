import {loadFont as chargerLilita} from '@remotion/google-fonts/LilitaOne';
import {loadFont as chargerMontserrat} from '@remotion/google-fonts/Montserrat';
import {ThreeCanvas} from '@remotion/three';
import {useEffect, useState} from 'react';
import {AbsoluteFill, Audio, Easing, Sequence, continueRender, delayRender, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import voix from './ep01_final_voix.json';
import {EtatLocal, Local} from './Local3D';
import {EtatMusee, Musee} from './Musee3D';

const lilita = chargerLilita('normal', {subsets: ['latin', 'latin-ext']});
const montserrat = chargerMontserrat('normal', {weights: ['900'], subsets: ['latin', 'latin-ext']});
const TITRE = lilita.fontFamily;
const TEXTE = montserrat.fontFamily;
const FPS = 30;

/* ------------------------------------------------------------------ temps : la voix étirée par deux silences */

/**
 * La voix (53 s) est coupée en trois morceaux pour atteindre plus d'une minute :
 * 1 s de respiration avant « Première épreuve », 5 s de compte à rebours après « C : 463 ».
 * [temps dans la voix où le silence s'insère, durée du silence]
 */
const SILENCES: [number, number][] = [[27.95, 1.0], [44.0, 5.0]];
const QUEUE = 2.3; // fin sur le bouton S'abonner, après le dernier mot
const enVideo = (v: number) => v + SILENCES.reduce((s, [a, d]) => (v >= a ? s + d : s), 0);
const enVoix = (t: number) => {
  let v = t;
  for (const [a, d] of SILENCES) {
    const debut = enVideo(a) - d; // instant vidéo où ce silence commence
    if (t >= debut + d) v -= d;
    else if (t >= debut) return a; // pendant le silence, la voix est figée
  }
  return v;
};
const FIN = enVideo(voix.duree) + QUEUE;
export const DUREE_CASSE_EP01 = Math.ceil(FIN * FPS);

const AVANCE = 0.08; // le plan change une fraction de seconde avant le mot
/** Instant vidéo (s) où commence le mot n° i de la voix. */
const M = (i: number) => enVideo(voix.mots[i].a) - AVANCE;
const PAUSE_DEBUT = enVideo(44.0) - 5.0; // début du compte à rebours

/* ------------------------------------------------------------------ plans */

type V3 = [number, number, number];
const ease = Easing.inOut(Easing.cubic);
const mix = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const entre = (t: number, a: number, b: number) => Math.min(1, Math.max(0, (t - a) / (b - a)));

type Plan = {
  de: number; a: number; lieu: 'musee' | 'local';
  p0: V3; p1: V3; c0: V3; c1?: V3; fov: number;
  titre?: [string, string];
};

const VITRINE_CIBLE: V3 = [0, 1.5, -4];
const LOCAL_CIBLE: V3 = [-0.35, 1.6, -1.4];
const PLANS: Plan[] = [
  {de: 0, a: M(6), lieu: 'musee', p0: [0.05, 1.66, -2.75], p1: [0.12, 1.72, -2.35], c0: VITRINE_CIBLE, fov: 34, titre: ['ÉPISODE 1', 'LE COLLIER']},
  // « Et ce soir… » : on avance dans la galerie, entre les lasers, vers la vitrine
  {de: M(6), a: M(15), lieu: 'musee', p0: [0.3, 1.5, 4.2], p1: [0, 1.55, 0.6], c0: [0, 1.4, -4], fov: 58, titre: ['CE SOIR', 'TU LE VOLES']},
  {de: M(15), a: M(27), lieu: 'local', p0: [0.75, 1.65, 1.5], p1: [0.55, 1.62, 1.05], c0: LOCAL_CIBLE, fov: 80, titre: ['TU ES CACHÉ', 'DANS LE LOCAL']},
  {de: M(27), a: M(43), lieu: 'local', p0: [-1.45, 2.6, 1.45], p1: [-1.42, 2.58, 1.4], c0: [0.35, 0.9, -0.9], fov: 75, titre: ['LA POLICE ARRIVE', 'DANS 1 HEURE']},
  {de: M(43), a: M(55), lieu: 'local', p0: [0.3, 1.6, 0.9], p1: [0.28, 1.6, 0.45], c0: [0.25, 1.25, -1.6], fov: 65, titre: ["SEUL, C'EST IMPOSSIBLE", 'MAIS TU NOUS AS']},
  {de: M(55), a: M(59), lieu: 'local', p0: [0.75, 1.65, 1.5], p1: [0.7, 1.65, 1.4], c0: LOCAL_CIBLE, fov: 80, titre: ['1 ABONNÉ', '= 1 COMPLICE']},
  {de: M(59), a: M(77), lieu: 'musee', p0: [0, 1.6, -3.3], p1: [0, 1.56, -3.05], c0: [0, 1.47, -4], fov: 28, titre: ['UN GAGNANT TIRÉ AU SORT', 'TON NOM GRAVÉ']},
  {de: M(77), a: M(90), lieu: 'musee', p0: [0, 1.6, 4], p1: [0, 1.6, 2.3], c0: [0, 1.35, -4], fov: 62, titre: ['LES PALIERS', '100 · 1 000']},
  {de: M(90), a: M(100), lieu: 'local', p0: [-0.4, 1.36, -1.0], p1: [-0.4, 1.36, -1.1], c0: [-0.4, 1.35, -1.6], fov: 40, titre: ['ÉPREUVE 1 / 6', 'LE DIGICODE']},
  // la feuille : on s'approche en la parcourant de haut en bas, puis cadre fixe pour la pause
  {de: M(100), a: M(113), lieu: 'local', p0: [-0.4, 1.7, -0.62], p1: [-0.4, 1.6, -0.72], c0: [-0.4, 1.66, -1.6], c1: [-0.4, 1.58, -1.6], fov: 30},
  {de: M(113), a: M(133), lieu: 'local', p0: [-0.4, 1.6, -0.72], p1: [-0.4, 1.6, -0.74], c0: [-0.4, 1.58, -1.6], fov: 30},
  {de: M(133), a: M(146), lieu: 'local', p0: [0.3, 1.35, 0.8], p1: [0.28, 1.2, 0.35], c0: [0.25, 0.25, -1.6], fov: 65, titre: ['SI ON SE TROMPE…', 'IL ENTEND TOUT']},
  {de: M(146), a: FIN + 1, lieu: 'musee', p0: [3, 4.4, 4.5], p1: [2.4, 3.6, 3.2], c0: [-0.4, 0.8, -5], fov: 58, titre: ['ABONNE-TOI POUR', 'REJOINDRE LE CASSE']},
];

const planA = (t: number) => PLANS.find((p) => t >= p.de && t < p.a) ?? PLANS[PLANS.length - 1];

const camera = (t: number) => {
  const p = planA(t);
  const k = ease(entre(t, p.de, p.a));
  return {pos: mix(p.p0, p.p1, k), cible: p.c1 ? mix(p.c0, p.c1, k) : p.c0, fov: p.fov};
};

/** Le néon grésille quand on découvre le local. */
const neon = (t: number) => {
  const d = t - M(15);
  if (d < 0 || d > 0.8) return 1;
  return [0, 1, 0, 0, 1, 1, 0, 1][Math.floor(d / 0.1)] ?? 1;
};

const etatLocal = (t: number): EtatLocal => ({
  cam: camera(t),
  neon: neon(t),
  code: '',
  torche: entre(t, M(138), M(146)),
});

const etatMusee = (t: number): EtatMusee => ({
  cam: camera(t),
  lasers: 1,
  alarme: t >= M(146) ? 0.45 + 0.35 * Math.sin(t * 7) : 0,
});

/* ------------------------------------------------------------------ habillage 2D */

const contour = (couleur: string, ep: number) => ({WebkitTextStroke: `${ep}px ${couleur}`, paintOrder: 'stroke fill' as const});
const useRessort = (f: number, debut: number, config = {damping: 12, stiffness: 200}) => {
  const {fps} = useVideoConfig();
  return f < debut ? 0 : spring({frame: f - debut, fps, config});
};

const Titre: React.FC<{t: number; f: number}> = ({t, f}) => {
  const p = planA(t);
  const e = useRessort(f, Math.round(p.de * FPS));
  if (!p.titre) return null;
  const [petit, grand] = p.titre;
  return (
    <div style={{position: 'absolute', top: 230, left: 40, right: 40, textAlign: 'center', transform: `scale(${0.6 + 0.4 * e})`, opacity: Math.min(1, e * 1.5)}}>
      <div style={{fontFamily: TEXTE, fontWeight: 900, fontSize: 46, color: '#fff', letterSpacing: 1, ...contour('#0b0d14', 12)}}>{petit}</div>
      <div style={{fontFamily: TITRE, fontSize: grand.length > 16 ? 90 : grand.length > 12 ? 108 : 128, lineHeight: 1.0, whiteSpace: 'nowrap', color: '#ffc928', marginTop: 4,
        ...contour('#2b1a00', 18), textShadow: '0 8px 0 rgba(0,0,0,0.3)'}}>{grand}</div>
    </div>
  );
};

// mots affichés, un pour un avec les mots dits ; * = jaune ; "" = collé au mot précédent
const AFFICHAGE: Record<number, string> = {
  1: '*collier*', 3: '*100*', 4: '*millions*', 14: '*voler.*', 25: '*local*', 26: '*technique.*', 37: '*police.*', 41: '*1*', 42: '*heure.*',
  54: '*nous.*', 56: '*abonné*', 58: "*l'équipe.*", 64: '*nom*', 74: '*diamant*', 78: '*100*', 79: '*complices,*', 87: '*1 000…*',
  92: '', 99: '*digicode.*', 134: '*A,*', 135: '*B*', 137: '*C.*', 141: '*trompe…*', 146: '*Abonne-toi*', 150: '*casse.*', 152: '*demain.*',
};
type Mot = {t: string; a: number; b: number};
const PAQUETS: Mot[][] = (() => {
  const mots = voix.mots.map((m, i) => ({...m, t: AFFICHAGE[i] ?? m.t})).filter((m) => m.t !== '');
  const res: Mot[][] = [];
  let cour: Mot[] = [];
  for (const m of mots) {
    cour.push(m);
    if (cour.length === 3 || /[.?…]\*?$/.test(m.t)) { res.push(cour); cour = []; }
  }
  if (cour.length) res.push(cour);
  return res;
})();

/** Sous-titres de 3 mots au plus, calés sur la voix. Masqués pendant l'énigme : la feuille et les réponses parlent. */
const SousTitre: React.FC<{t: number}> = ({t}) => {
  if (t >= M(100) && t < M(133)) return null;
  const v = enVoix(t);
  const i = PAQUETS.findIndex((p, k) => v >= p[0].a - 0.05 && v < (PAQUETS[k + 1]?.[0].a ?? p[p.length - 1].b + 0.4) - 0.05);
  if (i < 0) return null;
  const paquet = PAQUETS[i];
  return (
    <div style={{position: 'absolute', top: 1270, left: 60, right: 60, textAlign: 'center', fontFamily: TEXTE, fontWeight: 900, fontSize: 70, lineHeight: 1.1, ...contour('#000', 14)}}>
      {paquet.map((m, j) => {
        const jaune = m.t.startsWith('*');
        const dit = v >= m.a - 0.05;
        return <span key={j} style={{color: jaune ? '#ffc928' : '#fff', opacity: dit ? 1 : 0.35}}>{m.t.replace(/\*/g, '')}{j < paquet.length - 1 ? ' ' : ''}</span>;
      })}
    </div>
  );
};

/** Le chrono de la police : 60:00 quand elle est appelée, 50:00 à la fin de l'épisode (10 min de casse). */
const Chrono: React.FC<{t: number; f: number}> = ({t, f}) => {
  const debut = M(38);
  const e = useRessort(f, Math.round(debut * FPS), {damping: 9, stiffness: 220});
  if (t < debut) return null;
  const reste = Math.round(3600 - 600 * entre(t, debut + 0.8, FIN));
  const z = (n: number) => String(n).padStart(2, '0');
  // il apparaît en grand au centre, puis file se ranger en haut à droite
  const k = ease(entre(t, debut + 1.2, debut + 1.8));
  return (
    <div style={{position: 'absolute', left: interpolate(k, [0, 1], [290, 700]), top: interpolate(k, [0, 1], [560, 70]),
      transform: `scale(${(1.6 - 0.6 * k) * e})`, transformOrigin: 'top left'}}>
      <div style={{background: 'rgba(12,4,6,0.85)', border: '5px solid #ff3344', borderRadius: 22, padding: '6px 22px', fontFamily: TEXTE, fontWeight: 900,
        fontSize: 54, color: '#ff3344', letterSpacing: 3, display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 0 30px rgba(255,40,60,0.45)'}}>
        <svg width="34" height="34" viewBox="0 0 24 24"><path fill="#ff3344" d="M12 2a10 10 0 1 0 .001 20.001A10 10 0 0 0 12 2zm1 10.4V6h-2v7.4l5 3 1-1.7z" /></svg>
        {z(Math.floor(reste / 60))}:{z(reste % 60)}
      </div>
    </div>
  );
};

/** Plan 3 : l'image de la caméra de surveillance. */
const Surveillance: React.FC<{t: number; f: number}> = ({t, f}) => {
  if (t < M(27) || t >= M(43)) return null;
  const sec = 14 + Math.floor(t - M(27));
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{background: 'rgba(40,90,140,0.28)', mixBlendMode: 'multiply'}} />
      <AbsoluteFill style={{backgroundImage: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.25) 0px, rgba(0,0,0,0.25) 2px, transparent 2px, transparent 5px)'}} />
      {/* la silhouette du voleur filmée par la caméra */}
      <svg style={{position: 'absolute', left: 430, top: 760}} width="260" height="760" viewBox="0 0 100 290">
        <ellipse cx="50" cy="30" rx="22" ry="26" fill="#05070a" />
        <path d="M18 70 Q50 52 82 70 L92 175 L76 178 L72 120 L70 285 L54 285 L50 185 L46 285 L30 285 L28 120 L24 178 L8 175 Z" fill="#05070a" />
      </svg>
      <div style={{position: 'absolute', top: 640, left: 50, fontFamily: 'Menlo, monospace', fontSize: 34, color: '#e8f4ff', textShadow: '0 0 6px #000'}}>
        CAM 03 · LOCAL TECHNIQUE
      </div>
      <div style={{position: 'absolute', top: 690, left: 50, fontFamily: 'Menlo, monospace', fontSize: 34, color: '#e8f4ff', textShadow: '0 0 6px #000'}}>
        22:14:{String(sec % 60).padStart(2, '0')}
      </div>
      <div style={{position: 'absolute', top: 640, right: 50, fontFamily: 'Menlo, monospace', fontSize: 38, color: '#ff3344', opacity: Math.floor(f / 15) % 2 ? 1 : 0.25}}>● REC</div>
    </AbsoluteFill>
  );
};

/** Plan 4 : les complices apparaissent derrière toi. */
const Complices: React.FC<{t: number; f: number}> = ({t, f}) => {
  const {fps} = useVideoConfig();
  if (t < M(51) || t >= M(55)) return null;
  const xs = [80, 300, 520, 740, 900];
  return (
    <>
      {xs.map((x, i) => {
        const d = Math.round((M(51) + i * 0.12) * FPS);
        const e = f < d ? 0 : spring({frame: f - d, fps, config: {damping: 13}});
        const h = 520 + (i % 2) * 90;
        return (
          <svg key={i} style={{position: 'absolute', left: x - 60, top: 1920 - h * e, opacity: e}} width="240" height={h} viewBox="0 0 100 220" preserveAspectRatio="none">
            <path d="M50 4 C70 4 78 22 76 40 C88 46 96 60 96 80 L96 220 L4 220 L4 80 C4 60 12 46 24 40 C22 22 30 4 50 4 Z" fill="#0b0e16" stroke="#ffc928" strokeWidth="2.5" />
          </svg>
        );
      })}
    </>
  );
};

const PSEUDOS = ['@abonne_02', '@abonne_03', '@abonne_04', '@abonne_05', '@abonne_06'];
/** Plan 5 : les abonnés qui rejoignent l'équipe. */
const Recrues: React.FC<{t: number; f: number}> = ({t, f}) => {
  const {fps} = useVideoConfig();
  if (t < M(55) || t >= M(59)) return null;
  return (
    <div style={{position: 'absolute', top: 560, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22}}>
      {PSEUDOS.map((p, i) => {
        const d = Math.round((M(55) + 0.15 + i * 0.22) * FPS);
        const e = f < d ? 0 : spring({frame: f - d, fps, config: {damping: 12}});
        return (
          <div key={p} style={{transform: `translateX(${(1 - e) * (i % 2 ? 600 : -600)}px)`, opacity: e, background: '#fff', borderRadius: 50, padding: '14px 34px',
            fontFamily: TEXTE, fontWeight: 900, fontSize: 40, color: '#1b1d24', boxShadow: '0 8px 0 rgba(0,0,0,0.3)', display: 'flex', gap: 14, alignItems: 'center'}}>
            <span style={{color: '#2bb34b'}}>+</span>{p}<span style={{color: '#8a8f99', fontSize: 30}}>a rejoint le casse</span>
          </div>
        );
      })}
    </div>
  );
};

/** Plan 6 : le pseudo gravé sur un diamant. */
const Gravure: React.FC<{t: number; f: number}> = ({t, f}) => {
  const e = useRessort(f, Math.round(M(69) * FPS), {damping: 11, stiffness: 160});
  if (t < M(69) || t >= M(77)) return null;
  return (
    <div style={{position: 'absolute', top: 1060, left: 0, right: 0, display: 'flex', justifyContent: 'center', transform: `scale(${e})`}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 18, background: 'linear-gradient(180deg, #ffe08a, #c9962e)', borderRadius: 24, padding: '14px 34px',
        border: '5px solid #fff4c9', boxShadow: '0 0 40px rgba(255,210,120,0.6)'}}>
        <svg width="54" height="54" viewBox="0 0 24 24"><path fill="#eaf4ff" stroke="#2b1a00" strokeWidth="1.2" d="M6 3h12l4 6-10 12L2 9z M2 9h20 M9 3l3 18 3-18" /></svg>
        <span style={{fontFamily: TEXTE, fontWeight: 900, fontSize: 52, color: '#2b1a00'}}>@ton_pseudo</span>
      </div>
    </div>
  );
};

/** Plan 7 : les paliers, en volumes « à venir » bordés de pointillés. */
const Paliers: React.FC<{t: number; f: number}> = ({t, f}) => {
  const {fps} = useVideoConfig();
  if (t < M(77) || t >= M(90)) return null;
  const cartes: [number, string, string][] = [[M(77), '100', 'LE BUREAU DU DIRECTEUR'], [M(86), '1 000', '???']];
  return (
    <div style={{position: 'absolute', top: 560, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 40}}>
      {cartes.map(([d, n, txt]) => {
        const e = t < d ? 0 : spring({frame: f - Math.round(d * FPS), fps, config: {damping: 12}});
        return (
          <div key={n} style={{transform: `scale(${e})`, opacity: e, border: '6px dashed #fff', borderRadius: 30, background: 'rgba(10,14,26,0.82)', padding: '22px 44px',
            textAlign: 'center', minWidth: 640}}>
            <div style={{fontFamily: TITRE, fontSize: 110, color: '#ffc928', ...contour('#2b1a00', 12)}}>{n}</div>
            <div style={{fontFamily: TEXTE, fontWeight: 900, fontSize: 40, color: '#fff'}}>COMPLICES → {txt}</div>
          </div>
        );
      })}
    </div>
  );
};

/** Plans 10-11 : « mets sur pause », les trois réponses et le compte à rebours. */
const Enigme: React.FC<{t: number; f: number}> = ({t, f}) => {
  const {fps} = useVideoConfig();
  const pause = useRessort(f, Math.round(M(113) * FPS), {damping: 10, stiffness: 220});
  if (t < M(113) || t >= M(133)) return null;
  const choix: [number, string, string][] = [[M(118), 'A', '643'], [M(123), 'B', '436'], [M(128), 'C', '463']];
  const dansPause = t >= PAUSE_DEBUT && t < PAUSE_DEBUT + 5;
  const reste = Math.max(0, 5 - (t - PAUSE_DEBUT));
  return (
    <>
      <div style={{position: 'absolute', top: 70, left: 50, transform: `scale(${pause})`, transformOrigin: 'left center'}}>
        <div style={{background: '#fe2c55', color: '#fff', fontFamily: TEXTE, fontWeight: 900, fontSize: 46, padding: '12px 36px', borderRadius: 50,
          border: '5px solid #fff', display: 'flex', alignItems: 'center', gap: 16, boxShadow: '0 8px 0 rgba(0,0,0,0.3)'}}>
          <svg width="40" height="40" viewBox="0 0 24 24"><rect x="5" y="4" width="5" height="16" rx="1" fill="#fff" /><rect x="14" y="4" width="5" height="16" rx="1" fill="#fff" /></svg>
          METS SUR PAUSE
        </div>
      </div>
      <div style={{position: 'absolute', top: 1340, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 26}}>
        {choix.map(([d, l, code]) => {
          const e = t < d ? 0 : spring({frame: f - Math.round(d * FPS), fps, config: {damping: 11}});
          return (
            <div key={l} style={{transform: `scale(${e})`, display: 'flex', alignItems: 'center', gap: 14, background: '#fff', borderRadius: 30, padding: '12px 26px 12px 14px',
              boxShadow: '0 8px 0 rgba(0,0,0,0.35)'}}>
              <div style={{width: 74, height: 74, borderRadius: 37, background: '#ffc928', border: '5px solid #2b1a00', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: TITRE, fontSize: 52, color: '#2b1a00'}}>{l}</div>
              <span style={{fontFamily: TEXTE, fontWeight: 900, fontSize: 56, color: '#1b1d24', letterSpacing: 4}}>{code}</span>
            </div>
          );
        })}
      </div>
      {dansPause && (
        <div style={{position: 'absolute', top: 1500, left: 140, right: 140}}>
          <div style={{textAlign: 'center', fontFamily: TITRE, fontSize: 96, color: '#fff', ...contour('#000', 12)}}>{Math.ceil(reste)}</div>
          <div style={{height: 22, borderRadius: 11, background: 'rgba(255,255,255,0.25)', overflow: 'hidden', border: '3px solid #fff'}}>
            <div style={{width: `${(reste / 5) * 100}%`, height: '100%', background: reste < 2 ? '#ff3344' : '#ffc928'}} />
          </div>
        </div>
      )}
    </>
  );
};

const BoutonAbonne: React.FC<{t: number; f: number}> = ({t, f}) => {
  const debut = Math.round(M(146) * FPS);
  const fait = f >= debut + 30;
  const e = useRessort(f, debut, {damping: 10, stiffness: 200});
  const clic = useRessort(f, debut + 30, {damping: 8, stiffness: 300});
  if (t < M(146)) return null;
  return (
    <div style={{position: 'absolute', top: 1090, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
      <div style={{transform: `scale(${e * (1 + 0.12 * Math.sin(clic * Math.PI))})`, background: fait ? '#8a8f99' : '#fe2c55', color: '#fff',
        fontFamily: TEXTE, fontWeight: 900, fontSize: 58, padding: '18px 60px', borderRadius: 60, border: '6px solid #fff',
        boxShadow: '0 10px 0 rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', gap: 18}}>
        {fait ? 'ABONNÉ' : "S'ABONNER"}
        {fait && <svg width="50" height="50" viewBox="0 0 24 24"><path fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" d="M4 12.5l5 5L20 6.5" /></svg>}
      </div>
    </div>
  );
};

const Confettis: React.FC<{f: number}> = ({f}) => {
  const debut = Math.round(M(146) * FPS) + 32;
  if (f < debut) return null;
  const t = f - debut;
  const couleurs = ['#ffc928', '#fff1b8', '#e2b84a', '#ffffff', '#fe2c55'];
  return (
    <>
      {Array.from({length: 70}).map((_, i) => {
        const x = (Math.sin(i * 91.7) * 0.5 + 0.5) * 1080;
        const v = 14 + (Math.sin(i * 13.1) * 0.5 + 0.5) * 16;
        const y = -60 + t * v - (i % 7) * 40;
        return <div key={i} style={{position: 'absolute', left: x + Math.sin(t / 6 + i) * 30, top: y, width: 20, height: 34,
          background: couleurs[i % couleurs.length], transform: `rotate(${t * 12 + i * 40}deg)`, borderRadius: 4}} />;
      })}
    </>
  );
};

/* ------------------------------------------------------------------ son */

const img = (sec: number) => Math.round(sec * FPS);
const Sons: React.FC = () => {
  const [[c1, d1], [c2, d2]] = SILENCES;
  const tics = Array.from({length: 10}, (_, i) => PAUSE_DEBUT + i * 0.5);
  return (
    <>
      {/* la voix en trois morceaux, séparés par les deux silences */}
      <Sequence from={0} durationInFrames={img(c1)}><Audio src={staticFile('casse/ep01_final.wav')} endAt={img(c1)} /></Sequence>
      <Sequence from={img(c1 + d1)} durationInFrames={img(c2 - c1)}><Audio src={staticFile('casse/ep01_final.wav')} startFrom={img(c1)} endAt={img(c2)} /></Sequence>
      <Sequence from={img(c2 + d1 + d2)}><Audio src={staticFile('casse/ep01_final.wav')} startFrom={img(c2)} /></Sequence>
      {/* la nappe grave, très bas sous la voix, coupée pendant le compte à rebours pour laisser le tic-tac seul */}
      <Audio src={staticFile('casse/nappe.wav')} volume={(f) => {
        const t = f / FPS;
        const coupe = t >= PAUSE_DEBUT - 0.3 && t < PAUSE_DEBUT + 5 ? 0 : 1;
        return 0.09 * coupe * Math.min(1, t / 1.5) * Math.max(0, Math.min(1, (FIN - t) / 1.2));
      }} />
      {tics.map((d, i) => <Sequence key={i} from={img(d)} durationInFrames={10}><Audio src={staticFile(i % 2 ? 'casse/tac.wav' : 'casse/tic.wav')} volume={0.5} /></Sequence>)}
      {[M(6), M(15), M(27), M(59), M(90), M(146)].map((d, i) => <Sequence key={`w${i}`} from={Math.max(0, img(d - 0.25))} durationInFrames={24}><Audio src={staticFile('casse/whoosh.wav')} volume={0.22} /></Sequence>)}
      <Sequence from={img(M(136))} durationInFrames={img(2.7)}><Audio src={staticFile('casse/pas.wav')} volume={0.55} /></Sequence>
      <Sequence from={img(M(146) - 1.5)}><Audio src={staticFile('casse/sirene.wav')} volume={0.12} /></Sequence>
    </>
  );
};

/* ------------------------------------------------------------------ composition */

const usePolicesPretes = () => {
  const [pret, setPret] = useState(false);
  const [poignee] = useState(() => delayRender('polices casse'));
  useEffect(() => {
    Promise.all([lilita.waitUntilDone(), montserrat.waitUntilDone()]).then(() => { setPret(true); continueRender(poignee); });
  }, [poignee]);
  return pret;
};

export const CasseEp01: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const {width, height} = useVideoConfig();
  const pret = usePolicesPretes();
  const p = planA(t);
  const filtre = t >= M(27) && t < M(43) ? 'grayscale(1) contrast(1.25) brightness(1.15)'
    : t >= M(55) && t < M(59) ? 'blur(7px) brightness(0.7)' : 'none';
  return (
    <AbsoluteFill style={{background: '#05070c'}}>
      {pret && (
        <AbsoluteFill style={{filter: filtre}}>
          <ThreeCanvas width={width} height={height} shadows camera={{fov: 60, near: 0.02, far: 200}} gl={{antialias: true}}>
            {p.lieu === 'musee' ? <Musee etat={etatMusee(t)} /> : <Local etat={etatLocal(t)} />}
          </ThreeCanvas>
        </AbsoluteFill>
      )}
      <Surveillance t={t} f={f} />
      <Complices t={t} f={f} />
      <Recrues t={t} f={f} />
      <Gravure t={t} f={f} />
      <Paliers t={t} f={f} />
      <Enigme t={t} f={f} />
      <Titre t={t} f={f} />
      <Chrono t={t} f={f} />
      <SousTitre t={t} />
      <BoutonAbonne t={t} f={f} />
      <Confettis f={f} />
      <Sons />
    </AbsoluteFill>
  );
};
