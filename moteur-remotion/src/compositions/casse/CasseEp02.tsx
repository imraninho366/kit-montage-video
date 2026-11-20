import {loadFont as chargerLilita} from '@remotion/google-fonts/LilitaOne';
import {loadFont as chargerMontserrat} from '@remotion/google-fonts/Montserrat';
import {ThreeCanvas} from '@remotion/three';
import {useEffect, useState} from 'react';
import {AbsoluteFill, Audio, Easing, Sequence, continueRender, delayRender, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import voix from './ep02_voix.json';
import {EtatLocal, Local} from './Local3D';
import {EtatMusee, Musee} from './Musee3D';

/**
 * Épisode 2 — les lasers (chrono 50:00 → 40:00).
 * Résultat de l'épisode 1 (9 bonnes réponses sur 11, code 4-6-3, diamant n° 1 tiré au sort : @abonne_114),
 * puis l'énigme d'observation : compter les coupures de chaque laser. Solution : A, le laser 4 (4 coupures).
 */

const lilita = chargerLilita('normal', {subsets: ['latin', 'latin-ext']});
const montserrat = chargerMontserrat('normal', {weights: ['900'], subsets: ['latin', 'latin-ext']});
const TITRE = lilita.fontFamily;
const TEXTE = montserrat.fontFamily;
const FPS = 30;

/* ------------------------------------------------------------------ temps : la voix étirée par trois silences */

/** [temps dans la voix (milieu d'un silence mesuré), durée insérée] : porte qui s'ouvre, séquence de comptage, compte à rebours. */
const SILENCES: [number, number][] = [[6.54, 1.0], [31.76, 6.5], [38.98, 5.0]];
const QUEUE = 2.3;
const enVideo = (v: number) => v + SILENCES.reduce((s, [a, d]) => (v >= a ? s + d : s), 0);
const enVoix = (t: number) => {
  let v = t;
  for (const [a, d] of SILENCES) {
    const debut = enVideo(a) - d;
    if (t >= debut + d) v -= d;
    else if (t >= debut) return a;
  }
  return v;
};
const FIN = enVideo(voix.duree) + QUEUE;
export const DUREE_CASSE_EP02 = Math.ceil(FIN * FPS);

const AVANCE = 0.08;
const M = (i: number) => enVideo(voix.mots[i].a) - AVANCE;
const debutSilence = (k: number) => enVideo(SILENCES[k][0]) - SILENCES[k][1];
const SEQUENCE_DEBUT = debutSilence(1);
const PAUSE_DEBUT = debutSilence(2);

/** L'énigme : ordre des coupures (vérifié : laser 4 = 4 fois, lasers 2 et 5 = 3 fois, lasers 1 et 3 = 1 fois). */
const COUPURES = [2, 4, 5, 1, 4, 2, 5, 4, 3, 2, 5, 4];
const PAS = 0.5, DUREE_COUPURE = 0.22, DECALAGE = 0.4;
const instantCoupure = (k: number) => SEQUENCE_DEBUT + DECALAGE + k * PAS;
const lasersAllumes = (t: number) => {
  const on = [1, 1, 1, 1, 1];
  COUPURES.forEach((n, k) => {
    const d = instantCoupure(k);
    if (t >= d && t < d + DUREE_COUPURE) on[n - 1] = 0;
  });
  return on;
};

/* ------------------------------------------------------------------ plans */

type V3 = [number, number, number];
const ease = Easing.inOut(Easing.cubic);
const mix = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const entre = (t: number, a: number, b: number) => Math.min(1, Math.max(0, (t - a) / (b - a)));

type Plan = {de: number; a: number; lieu: 'musee' | 'local'; p0: V3; p1: V3; c0: V3; c1?: V3; fov: number; titre?: [string, string]};

const COMPTE: Pick<Plan, 'p0' | 'p1' | 'c0' | 'fov'> = {p0: [0, 1.5, 2.6], p1: [0, 1.5, 2.6], c0: [0, 1.05, -1.3], fov: 50};
const PLANS: Plan[] = [
  {de: 0, a: M(6), lieu: 'local', p0: [0.4, 1.6, 1.0], p1: [0.35, 1.6, 0.7], c0: [0.25, 1.0, -1.6], fov: 65, titre: ['ÉPISODE 2', 'VOUS ÊTES 9']},
  {de: M(6), a: M(12), lieu: 'local', p0: [-0.4, 1.36, -1.0], p1: [-0.4, 1.36, -1.12], c0: [-0.4, 1.35, -1.6], fov: 40, titre: ['LE CODE ÉTAIT', '4 · 6 · 3']},
  {de: M(12), a: M(15), lieu: 'local', p0: [-0.55, 1.6, 0.9], p1: [-0.3, 1.6, 0.15], c0: [0.3, 1.1, -1.6], fov: 65, titre: ['LA PORTE', "S'OUVRE"]},
  {de: M(15), a: M(28), lieu: 'musee', p0: [0, 1.6, -3.3], p1: [0, 1.56, -3.05], c0: [0, 1.47, -4], fov: 28, titre: ['DIAMANT N° 1', 'GRAVÉ']},
  {de: M(28), a: M(46), lieu: 'musee', p0: [0.3, 1.5, 4.2], p1: [0, 1.5, 2.9], c0: [0, 1.2, -3], fov: 55, titre: ['IL NE RESTE QUE', '50 MINUTES']},
  {de: M(46), a: M(52), lieu: 'musee', ...COMPTE, p0: [0, 1.5, 3.0], titre: ['DEVANT LA VITRINE', '5 LASERS']},
  {de: M(52), a: M(63), lieu: 'musee', p0: [3, 4.4, 4.5], p1: [2.6, 3.9, 3.6], c0: [-0.4, 0.8, -5], fov: 58, titre: ['UN SEUL CONTACT', 'TOUT SE VERROUILLE']},
  {de: M(63), a: M(93), lieu: 'musee', p0: [1.4, 1.1, 0.6], p1: [0.9, 1.0, 0.2], c0: [-1.6, 0.9, -1.4], fov: 50, titre: ['LE SYSTÈME EST VIEUX', 'UN LASER EST FAIBLE']},
  {de: M(93), a: M(119), lieu: 'musee', ...COMPTE},
  {de: M(119), a: M(130), lieu: 'musee', p0: [3, 4.4, 4.5], p1: [2.6, 3.9, 3.6], c0: [-0.4, 0.8, -5], fov: 58, titre: ['A, B OU C ?', 'COMMENTE']},
  {de: M(130), a: FIN + 1, lieu: 'musee', p0: [0, 1.62, -3.0], p1: [0.15, 1.75, -2.1], c0: [0, 1.5, -4], fov: 34, titre: ['ABONNE-TOI POUR', 'LA SUITE DU CASSE']},
];

const planA = (t: number) => PLANS.find((p) => t >= p.de && t < p.a) ?? PLANS[PLANS.length - 1];
const camera = (t: number) => {
  const p = planA(t);
  const k = ease(entre(t, p.de, p.a));
  return {pos: mix(p.p0, p.p1, k), cible: p.c1 ? mix(p.c0, p.c1, k) : p.c0, fov: p.fov};
};

/** Le code tapé chiffre par chiffre, calé sur « quatre… six… trois ». */
const codeTape = (t: number) => (t >= M(11) ? '463' : t >= M(10) ? '46' : t >= M(9) ? '4' : '');

const etatLocal = (t: number): EtatLocal => ({
  cam: camera(t),
  code: codeTape(t),
  voyant: t >= M(11) + 0.45 ? 'vert' : 'neutre',
  porte: ease(entre(t, M(12) + 0.2, M(12) + 1.6)),
});

const etatMusee = (t: number): EtatMusee => {
  const enAlarme = (t >= M(52) && t < M(63)) || (t >= M(119) && t < M(130));
  return {
    cam: camera(t),
    lasers: 1,
    lasersOn: lasersAllumes(t),
    // pastilles seulement quand on présente les lasers et pendant le comptage (énormes et coupées sur les plans rapprochés)
    numeros: t >= M(46) && t < M(52) ? entre(t, M(50), M(50) + 0.4) : t >= M(93) && t < M(119) ? 1 : 0,
    alarme: enAlarme ? 0.5 + 0.4 * Math.sin(t * 9) : 0,
  };
};

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
  2: '*9*', 9: '*4…*', 10: '*6…*', 11: '*3.*', 14: "*s'ouvre.*", 18: '*diamant*', 24: '*@abonne_114*', 25: '', 26: '', 27: 'Bravo.',
  44: '*50*', 45: '*minutes.*', 50: '*5*', 51: '*lasers.*', 57: '*seul,*', 62: '*verrouillent.*', 67: '*vieux.*', 87: '*faible.*',
  94: '*bien.*', 96: '*compte.*', 105: '', 108: '*4.*', 110: '', 113: '*2.*', 115: '', 118: '*5.*',
  120: '*A,*', 121: '*B*', 123: '*C.*', 129: '*sonne.*', 130: '*Abonne-toi*', 135: '*casse.*', 137: '*demain.*',
};
type Mot = {t: string; a: number; b: number};
const PAQUETS: Mot[][] = (() => {
  const mots = voix.mots.map((m, i) => ({...m, t: AFFICHAGE[i] ?? m.t})).filter((m) => m.t !== '');
  const res: Mot[][] = [];
  let cour: Mot[] = [];
  for (const m of mots) {
    cour.push(m);
    if (cour.length === 3 || /[.?…!]\*?$/.test(m.t)) { res.push(cour); cour = []; }
  }
  if (cour.length) res.push(cour);
  return res;
})();

/** Sous-titres masqués pendant le comptage et les réponses : rien ne doit cacher les lasers. */
const SousTitre: React.FC<{t: number}> = ({t}) => {
  if (t >= M(93) && t < M(119)) return null;
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

/** Le chrono de la police : 50:00 au début de l'épisode, 40:00 à la fin. */
const Chrono: React.FC<{t: number}> = ({t}) => {
  const reste = Math.round(3000 - 600 * entre(t, 0.5, FIN));
  const z = (n: number) => String(n).padStart(2, '0');
  return (
    <div style={{position: 'absolute', left: 700, top: 70}}>
      <div style={{background: 'rgba(12,4,6,0.85)', border: '5px solid #ff3344', borderRadius: 22, padding: '6px 22px', fontFamily: TEXTE, fontWeight: 900,
        fontSize: 54, color: '#ff3344', letterSpacing: 3, display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 0 30px rgba(255,40,60,0.45)'}}>
        <svg width="34" height="34" viewBox="0 0 24 24"><path fill="#ff3344" d="M12 2a10 10 0 1 0 .001 20.001A10 10 0 0 0 12 2zm1 10.4V6h-2v7.4l5 3 1-1.7z" /></svg>
        {z(Math.floor(reste / 60))}:{z(reste % 60)}
      </div>
    </div>
  );
};

/** Plan 1 : les vraies réponses des abonnés (commentaires de l'épisode 1). */
const BULLES: [string, string][] = [['@abonne_115', 'C 463'], ['@abonne_116', '463 C'], ['@abonne_117', 'C'], ['@abonne_118', 'C'], ['@abonne_119', 'c']];
const Bulles: React.FC<{t: number; f: number}> = ({t, f}) => {
  const {fps} = useVideoConfig();
  if (t >= M(6)) return null;
  return (
    <div style={{position: 'absolute', top: 560, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20}}>
      {BULLES.map(([pseudo, txt], i) => {
        const d = Math.round((0.1 + i * 0.22) * FPS);
        const e = f < d ? 0 : spring({frame: f - d, fps, config: {damping: 12}});
        return (
          <div key={pseudo} style={{transform: `scale(${e}) rotate(${i % 2 ? 2 : -2}deg)`, background: '#fff', borderRadius: 28, padding: '12px 28px',
            boxShadow: '0 8px 0 rgba(0,0,0,0.3)', fontFamily: TEXTE, fontWeight: 900, display: 'flex', alignItems: 'baseline', gap: 16}}>
            <span style={{fontSize: 28, color: '#8a8f99'}}>{pseudo}</span>
            <span style={{fontSize: 44, color: '#1b1d24'}}>{txt}</span>
          </div>
        );
      })}
    </div>
  );
};

/** Plan 4 : le pseudo tiré au sort, gravé sur le premier diamant. */
const Gravure: React.FC<{t: number; f: number}> = ({t, f}) => {
  const e = useRessort(f, Math.round(M(24) * FPS), {damping: 10, stiffness: 160});
  if (t < M(24) || t >= M(28)) return null;
  return (
    <div style={{position: 'absolute', top: 1040, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, transform: `scale(${e})`}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 18, background: 'linear-gradient(180deg, #ffe08a, #c9962e)', borderRadius: 24, padding: '14px 34px',
        border: '5px solid #fff4c9', boxShadow: '0 0 50px rgba(255,210,120,0.7)'}}>
        <svg width="54" height="54" viewBox="0 0 24 24"><path fill="#eaf4ff" stroke="#2b1a00" strokeWidth="1.2" d="M6 3h12l4 6-10 12L2 9z M2 9h20 M9 3l3 18 3-18" /></svg>
        <span style={{fontFamily: TEXTE, fontWeight: 900, fontSize: 56, color: '#2b1a00'}}>@abonne_114</span>
      </div>
      <div style={{fontFamily: TEXTE, fontWeight: 900, fontSize: 34, color: '#fff', ...contour('#000', 8)}}>DIAMANT 1 / 6</div>
    </div>
  );
};

/** Plans 9-10 : consigne de comptage, puis les trois réponses et le compte à rebours, en haut pour laisser les lasers dégagés. */
const Enigme: React.FC<{t: number; f: number}> = ({t, f}) => {
  const {fps} = useVideoConfig();
  const badge = useRessort(f, Math.round(M(93) * FPS), {damping: 10, stiffness: 220});
  if (t < M(93) || t >= M(119)) return null;
  const choix: [number, string, string][] = [[M(104), 'A', 'LASER 4'], [M(109), 'B', 'LASER 2'], [M(114), 'C', 'LASER 5']];
  const dansPause = t >= PAUSE_DEBUT && t < PAUSE_DEBUT + 5;
  const reste = Math.max(0, 5 - (t - PAUSE_DEBUT));
  const question = t >= M(97);
  return (
    <>
      <div style={{position: 'absolute', top: 70, left: 50, transform: `scale(${badge})`, transformOrigin: 'left center'}}>
        <div style={{background: '#fe2c55', color: '#fff', fontFamily: TEXTE, fontWeight: 900, fontSize: 40, padding: '12px 30px', borderRadius: 50,
          border: '5px solid #fff', boxShadow: '0 8px 0 rgba(0,0,0,0.3)'}}>
          {question ? 'LE PLUS SOUVENT ?' : 'REGARDE · COMPTE'}
        </div>
      </div>
      <div style={{position: 'absolute', top: 210, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 18}}>
        {choix.map(([d, l, txt]) => {
          const e = t < d ? 0 : spring({frame: f - Math.round(d * FPS), fps, config: {damping: 11}});
          return (
            <div key={l} style={{transform: `scale(${e})`, display: 'flex', alignItems: 'center', gap: 12, background: '#fff', borderRadius: 30, padding: '10px 22px 10px 12px',
              boxShadow: '0 8px 0 rgba(0,0,0,0.35)'}}>
              <div style={{width: 64, height: 64, borderRadius: 32, background: '#ffc928', border: '5px solid #2b1a00', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: TITRE, fontSize: 44, color: '#2b1a00'}}>{l}</div>
              <span style={{fontFamily: TEXTE, fontWeight: 900, fontSize: 38, color: '#1b1d24'}}>{txt}</span>
            </div>
          );
        })}
      </div>
      {dansPause && (
        <div style={{position: 'absolute', top: 330, left: 200, right: 200}}>
          <div style={{textAlign: 'center', fontFamily: TITRE, fontSize: 90, color: '#fff', ...contour('#000', 12)}}>{Math.ceil(reste)}</div>
          <div style={{height: 20, borderRadius: 10, background: 'rgba(255,255,255,0.25)', overflow: 'hidden', border: '3px solid #fff'}}>
            <div style={{width: `${(reste / 5) * 100}%`, height: '100%', background: reste < 2 ? '#ff3344' : '#ffc928'}} />
          </div>
        </div>
      )}
    </>
  );
};

const BoutonAbonne: React.FC<{t: number; f: number}> = ({t, f}) => {
  const debut = Math.round(M(130) * FPS);
  const fait = f >= debut + 30;
  const e = useRessort(f, debut, {damping: 10, stiffness: 200});
  const clic = useRessort(f, debut + 30, {damping: 8, stiffness: 300});
  if (t < M(130)) return null;
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

const Confettis: React.FC<{f: number; debut: number; duree?: number}> = ({f, debut, duree = 999}) => {
  if (f < debut || f > debut + duree) return null;
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
  // la voix en quatre morceaux, séparés par les trois silences
  const bornes = [0, ...SILENCES.map(([a]) => a), voix.duree];
  const tics = Array.from({length: 10}, (_, i) => PAUSE_DEBUT + i * 0.5);
  const calme = (t: number) => (t >= SEQUENCE_DEBUT - 0.3 && t < SEQUENCE_DEBUT + 6.5) || (t >= PAUSE_DEBUT - 0.3 && t < PAUSE_DEBUT + 5);
  return (
    <>
      {bornes.slice(0, -1).map((v0, k) => (
        <Sequence key={k} from={img(enVideo(v0))} durationInFrames={img(bornes[k + 1] - v0) + 2}>
          <Audio src={staticFile('casse/ep02_voix.wav')} startFrom={img(v0)} endAt={img(bornes[k + 1])} />
        </Sequence>
      ))}
      <Audio src={staticFile('casse/nappe.wav')} volume={(f) => {
        const t = f / FPS;
        return 0.09 * (calme(t) ? 0 : 1) * Math.min(1, t / 1.5) * Math.max(0, Math.min(1, (FIN - t) / 1.2));
      }} />
      {[M(9), M(10), M(11)].map((d, i) => <Sequence key={`k${i}`} from={img(d)} durationInFrames={6}><Audio src={staticFile('casse/touche.wav')} volume={0.6} /></Sequence>)}
      <Sequence from={img(M(11) + 0.45)} durationInFrames={12}><Audio src={staticFile('casse/bip_vert.wav')} volume={0.4} /></Sequence>
      {COUPURES.map((_, k) => <Sequence key={`z${k}`} from={img(instantCoupure(k))} durationInFrames={6}><Audio src={staticFile('casse/zap.wav')} volume={0.45} /></Sequence>)}
      {tics.map((d, i) => <Sequence key={`t${i}`} from={img(d)} durationInFrames={10}><Audio src={staticFile(i % 2 ? 'casse/tac.wav' : 'casse/tic.wav')} volume={0.5} /></Sequence>)}
      {[M(6), M(12), M(15), M(28), M(52), M(93), M(130)].map((d, i) => <Sequence key={`w${i}`} from={Math.max(0, img(d - 0.25))} durationInFrames={24}><Audio src={staticFile('casse/whoosh.wav')} volume={0.22} /></Sequence>)}
      <Sequence from={img(M(52))} durationInFrames={img(3.8)}><Audio src={staticFile('casse/sirene.wav')} volume={0.1} /></Sequence>
      <Sequence from={img(M(130) - 1.5)}><Audio src={staticFile('casse/sirene.wav')} volume={0.12} /></Sequence>
    </>
  );
};

/* ------------------------------------------------------------------ composition */

const usePolicesPretes = () => {
  const [pret, setPret] = useState(false);
  const [poignee] = useState(() => delayRender('polices casse ep02'));
  useEffect(() => {
    Promise.all([lilita.waitUntilDone(), montserrat.waitUntilDone()]).then(() => { setPret(true); continueRender(poignee); });
  }, [poignee]);
  return pret;
};

export const CasseEp02: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const {width, height} = useVideoConfig();
  const pret = usePolicesPretes();
  const p = planA(t);
  // flash blanc quand la porte s'ouvre sur la galerie
  const flash = interpolate(t, [M(15) - 0.25, M(15), M(15) + 0.3], [0, 0.85, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill style={{background: '#05070c'}}>
      {pret && (
        <ThreeCanvas width={width} height={height} shadows camera={{fov: 60, near: 0.02, far: 200}} gl={{antialias: true}}>
          {p.lieu === 'musee' ? <Musee etat={etatMusee(t)} /> : <Local etat={etatLocal(t)} />}
        </ThreeCanvas>
      )}
      <AbsoluteFill style={{background: '#fff', opacity: flash}} />
      <Bulles t={t} f={f} />
      <Gravure t={t} f={f} />
      <Enigme t={t} f={f} />
      <Titre t={t} f={f} />
      <Chrono t={t} />
      <SousTitre t={t} />
      <BoutonAbonne t={t} f={f} />
      <Confettis f={f} debut={img(M(24)) + 4} duree={70} />
      <Confettis f={f} debut={img(M(130)) + 32} />
      <Sons />
    </AbsoluteFill>
  );
};
