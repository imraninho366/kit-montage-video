import {loadFont as chargerLilita} from '@remotion/google-fonts/LilitaOne';
import {loadFont as chargerMontserrat} from '@remotion/google-fonts/Montserrat';
import {ThreeCanvas} from '@remotion/three';
import {useEffect, useState} from 'react';
import {AbsoluteFill, Audio, Easing, continueRender, delayRender, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import voix from './pilote_voix.json';
import {Etat, Monde, PARCELLES} from './Ile3D';

const lilita = chargerLilita('normal', {subsets: ['latin', 'latin-ext']});
const montserrat = chargerMontserrat('normal', {weights: ['900'], subsets: ['latin', 'latin-ext']});
const TITRE = lilita.fontFamily;
const TEXTE = montserrat.fontFamily;

const FIN_VOIX = voix.duree + 0.9;
export const DUREE_ILE_PILOTE = Math.ceil(FIN_VOIX * 30);

/**
 * La timeline visuelle est écrite sur une grille fixe (870 images). Chaque repère de cette grille est
 * accroché au début d'un mot de la voix : la scène change pile sur le mot, quelle que soit la voix.
 * [image de la grille, indice du mot]
 */
const REPERES: [number, number][] = [[75, 7], [165, 14], [255, 21], [315, 26], [375, 31], [435, 38], [480, 43],
  [525, 48], [575, 54], [620, 57], [665, 60], [705, 63], [750, 68], [795, 76]];
const AVANCE = 0.08; // la scène change une fraction de seconde avant le mot
const GRILLE = [0, ...REPERES.map(([g]) => g), 870];
const TEMPS = [0, ...REPERES.map(([, m]) => voix.mots[m].a - AVANCE), FIN_VOIX];
const versGrille = (f: number) => interpolate(f / 30, TEMPS, GRILLE, {extrapolateRight: 'clamp'});

type V3 = [number, number, number];
const ease = Easing.inOut(Easing.cubic);
const mix = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const prog = (f: number, de: number, a: number) => ease(Math.min(1, Math.max(0, (f - de) / (a - de))));

/* ------------------------------------------------------------------ caméra : un mouvement par plan */

type Plan = {de: number; a: number; p0: V3; p1: V3; c0: V3; c1?: V3; fov?: number};
const ROBIN_YEUX: V3 = [0, 1.62, 2.2];
const A = PARCELLES[0], B = PARCELLES[1], C = PARCELLES[2];
const PLANS: Plan[] = [
  {de: 0, a: 75, p0: [16, 13, 20], p1: [9, 7, 12], c0: [0, 0.8, 0]},
  {de: 75, a: 165, p0: [0.5, 1.95, 6.0], p1: [0.3, 1.9, 5.4], c0: ROBIN_YEUX},
  {de: 165, a: 255, p0: [0.5, 3.2, 8.4], p1: [0.4, 3.3, 7.4], c0: [-0.4, 2.2, -30]},
  {de: 255, a: 315, p0: [0, 1.9, 5.8], p1: [0, 1.85, 5.0], c0: ROBIN_YEUX},
  {de: 315, a: 435, p0: [1.5, 11, 11], p1: [0.8, 9, 8.5], c0: [0, 0.4, -1.0]},
  {de: 435, a: 480, p0: [2, 2.6, 3.5], p1: [1.6, 2.5, 3.3], c0: [-17, 2.0, 5]},
  {de: 480, a: 525, p0: [5.5, 3.2, 4.0], p1: [5.2, 3.4, 3.2], c0: [9, 4, -26]},
  {de: 525, a: 575, p0: [0, 12.5, 11.5], p1: [0, 11.5, 10.5], c0: [0.1, 0.4, -1.0]},
  {de: 575, a: 620, p0: add(A, [2.1, 3.3, 5.2]), p1: add(A, [1.8, 3.0, 4.6]), c0: add(A, [0, 1.5, 0])},
  {de: 620, a: 665, p0: add(B, [-2.7, 3.5, 3.9]), p1: add(B, [-2.4, 3.2, 3.4]), c0: add(B, [0, 1.4, 0])},
  {de: 665, a: 705, p0: add(C, [-1.6, 3.1, 4.8]), p1: add(C, [-1.4, 2.8, 4.2]), c0: add(C, [0, 1.3, 0])},
  {de: 705, a: 750, p0: [0, 11.5, 10.5], p1: [0, 12.2, 11.4], c0: [0.1, 0.5, -1.0]},
  {de: 750, a: 795, p0: [0.4, 1.95, 6.0], p1: [0.2, 1.9, 5.3], c0: ROBIN_YEUX},
  {de: 795, a: 870, p0: [0, 1.95, 5.9], p1: [0, 1.9, 5.1], c0: ROBIN_YEUX},
];

const camera = (f: number): Etat['cam'] => {
  const p = PLANS.find((x) => f >= x.de && f < x.a) ?? PLANS[PLANS.length - 1];
  // plans de déplacement (vers A, B, C) : on arrive vite puis on se pose sur la construction
  const voyage = p.c1 !== undefined;
  const t = voyage ? prog(f, p.de, p.de + 18) : interpolate(f, [p.de, p.a], [0, 1], {extrapolateRight: 'clamp'});
  return {pos: mix(p.p0, p.p1, t), cible: p.c1 ? mix(p.c0, p.c1, t) : p.c0, fov: p.fov ?? 40};
};

/* ------------------------------------------------------------------ état de la scène à chaque image */

const useEtat = (f: number): Etat => {
  const {fps} = useVideoConfig();
  const pop = (de: number) => (f < de ? 0 : spring({frame: f - de, fps, config: {damping: 11, stiffness: 170}}));
  const flash = (...debuts: number[]) => Math.max(0, ...debuts.map((d) => (f >= d && f < d + 5 ? 1 - (f - d) / 5 : 0)));
  const ensemble = (debuts: number[]) => debuts.map(pop);

  const constructions = [pop(582), pop(627), pop(672)];
  const enOrage3 = f >= 165 && f < 255;
  const enOrage8 = f >= 750 && f < 795;
  return {
    cam: camera(f),
    robin: {
      humeur: (f >= 75 && f < 255) || enOrage8 ? 'triste' : 'joyeux',
      rotY: enOrage3 ? Math.PI : 0,
      bras: f >= 255 && f < 315 ? 'montre' : (f >= 315 && f < 435) || f >= 795 ? 'salue' : 'repos',
    },
    pluie: f >= 75 && f < 165 ? 1 : enOrage3 ? 0.6 : enOrage8 ? 1 : 0,
    orage: enOrage3 ? interpolate(f, [165, 230], [0.25, 0.75], {extrapolateRight: 'clamp'}) : enOrage8 ? interpolate(f, [750, 770], [0.3, 0.85], {extrapolateRight: 'clamp'}) : f >= 75 && f < 165 ? 0.45 : 0,
    eclair: enOrage3 ? flash(200, 238) : enOrage8 ? flash(762, 784) : 0,
    radeaux: interpolate(f, [318, 372], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
    foule: interpolate(f, [356, 396], [0, 8], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
    cabanes: ensemble([380, 387, 394, 401, 408, 415]),
    bateau: f >= 435 && f < 480 ? pop(440) : 0,
    volcan: f >= 480 && f < 525 ? pop(485) : 0,
    mysteres: [pop(530) * (1 - pop(578)), pop(536) * (1 - pop(623)), pop(542) * (1 - pop(668))],
    lettres: f >= 525 && f < 750 ? ensemble([548, 554, 560]) : [0, 0, 0],
    etiquettes: f >= 375 && f < 435 ? 1 : 0,
    constructions,
  };
};

/* ------------------------------------------------------------------ habillage 2D */

const TITRES: {de: number; a: number; petit: string; grand: string}[] = [
  {de: 0, a: 75, petit: 'CE NAUFRAGÉ EST', grand: 'SEUL SUR UNE ÎLE'},
  {de: 75, a: 165, petit: "IL N'A", grand: 'RIEN'},
  {de: 165, a: 255, petit: 'UNE TEMPÊTE ARRIVE', grand: 'DANS 2 JOURS'},
  {de: 255, a: 315, petit: 'MAIS MAINTENANT', grand: "IL T'A TOI"},
  {de: 315, a: 375, petit: '1 ABONNÉ', grand: '= 1 NAUFRAGÉ'},
  {de: 375, a: 435, petit: '1 COMMENTAIRE', grand: '= TA CABANE'},
  {de: 435, a: 480, petit: '100 ABONNÉS', grand: 'UNE SURPRISE'},
  {de: 480, a: 525, petit: '1 000 ABONNÉS', grand: '???'},
  {de: 525, a: 575, petit: 'POUR SURVIVRE', grand: 'ON CONSTRUIT QUOI ?'},
  {de: 575, a: 620, petit: 'CHOIX A', grand: 'UN ABRI'},
  {de: 620, a: 665, petit: 'CHOIX B', grand: 'UN FEU'},
  {de: 665, a: 705, petit: 'CHOIX C', grand: 'UN RADEAU'},
  {de: 705, a: 750, petit: 'COMMENTE', grand: 'A, B OU C'},
  {de: 750, a: 795, petit: 'SI ON CHOISIT MAL…', grand: 'IL NE SURVIVRA PAS'},
  {de: 795, a: 870, petit: 'ABONNE-TOI POUR SAVOIR', grand: "S'IL SURVIT"},
];

// mots affichés, un pour un avec les mots dits ; * = jaune ; "" = collé au mot précédent
const AFFICHAGE: Record<number, string> = {
  1: '*naufragé*', 6: '*île.*', 9: '*rien.*', 13: "*d'abri.*", 16: '*tempête*', 19: '*2*', 20: '*jours.*', 25: '*toi.*',
  27: '*abonné*', 32: '*commentaire,*', 36: '*ton*', 37: '*nom.*', 39: '*100*', 42: '*surprise.*', 45: '*1\u00a0000…*',
  52: '*quoi\u00a0?*', 53: '', 54: '*A,*', 57: '*B,*', 60: '*C,*', 64: '*A,*', 65: '*B*', 67: '*C.*', 71: '*mal…*',
  74: '*survivra*', 76: '*Abonne-toi*', 80: '*survit.*',
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

const contour = (couleur: string, ep: number) => ({WebkitTextStroke: `${ep}px ${couleur}`, paintOrder: 'stroke fill' as const});

const Titre: React.FC<{f: number}> = ({f}) => {
  const {fps} = useVideoConfig();
  const t = TITRES.find((x) => f >= x.de && f < x.a);
  if (!t) return null;
  const e = spring({frame: f - t.de, fps, config: {damping: 12, stiffness: 200}});
  return (
    <div style={{position: 'absolute', top: 230, left: 50, right: 50, textAlign: 'center', transform: `scale(${0.6 + 0.4 * e})`, opacity: Math.min(1, e * 1.5)}}>
      <div style={{fontFamily: TEXTE, fontWeight: 900, fontSize: 46, color: '#fff', letterSpacing: 1, ...contour('#1b1d24', 12)}}>{t.petit}</div>
      <div style={{fontFamily: TITRE, fontSize: t.grand.length > 16 ? 92 : t.grand.length > 12 ? 108 : 128, lineHeight: 1.0, whiteSpace: 'nowrap', color: '#ffc928', marginTop: 4,
        ...contour('#2b1a00', 18), textShadow: '0 8px 0 rgba(0,0,0,0.22)'}}>{t.grand}</div>
    </div>
  );
};

/** Sous-titres par paquets de 3 mots au plus, coupés en fin de phrase, calés sur la voix. */
const SousTitre: React.FC<{t: number}> = ({t}) => {
  const i = PAQUETS.findIndex((p, k) => t >= p[0].a - 0.05 && t < (PAQUETS[k + 1]?.[0].a ?? p[p.length - 1].b + 0.4) - 0.05);
  if (i < 0) return null;
  const paquet = PAQUETS[i];
  return (
    <div style={{position: 'absolute', top: 1270, left: 60, right: 60, textAlign: 'center', fontFamily: TEXTE, fontWeight: 900, fontSize: 70, lineHeight: 1.1, ...contour('#000', 14)}}>
      {paquet.map((m, j) => {
        const jaune = m.t.startsWith('*');
        const dit = t >= m.a - 0.05;
        return <span key={j} style={{color: jaune ? '#ffc928' : '#fff', opacity: dit ? 1 : 0.35}}>{m.t.replace(/\*/g, '')}{j < paquet.length - 1 ? ' ' : ''}</span>;
      })}
    </div>
  );
};

const CompteARebours: React.FC<{f: number}> = ({f}) => {
  if (f < 165 || f >= 255) return null;
  const reste = 48 * 3600 - Math.round((f - 165) * 137);
  const h = Math.floor(reste / 3600), m = Math.floor((reste % 3600) / 60), s = reste % 60;
  const z = (n: number) => String(n).padStart(2, '0');
  return (
    <div style={{position: 'absolute', top: 520, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
      <div style={{background: '#1b1d24', border: '6px solid #ff4d5e', borderRadius: 26, padding: '10px 34px', fontFamily: TEXTE, fontWeight: 900, fontSize: 64, color: '#ff4d5e', letterSpacing: 4}}>
        {z(h)}:{z(m)}:{z(s)}
      </div>
    </div>
  );
};

const BulleCommentaire: React.FC<{f: number}> = ({f}) => {
  const {fps} = useVideoConfig();
  if (f < 384 || f >= 435) return null;
  const e = spring({frame: f - 384, fps, config: {damping: 12}});
  return (
    <div style={{position: 'absolute', top: 640, left: 90, transform: `scale(${e}) rotate(-3deg)`, transformOrigin: 'left center',
      background: '#fff', borderRadius: 30, padding: '20px 30px', boxShadow: '0 10px 0 rgba(0,0,0,0.18)', fontFamily: TEXTE, fontWeight: 900}}>
      <div style={{fontSize: 30, color: '#8a8f99'}}>@toi · il y a 2 s</div>
      <div style={{fontSize: 46, color: '#1b1d24', display: 'flex', alignItems: 'center', gap: 16}}>
        Une cabane pour moi !
        <svg width="40" height="40" viewBox="0 0 24 24"><path fill="#ff3b5c" d="M12 21s-7.5-4.6-10-9.3C.4 8.3 2.4 4 6.4 4c2.2 0 3.6 1.2 4.6 2.6l1 1.4 1-1.4C14 5.2 15.4 4 17.6 4c4 0 6 4.3 4.4 7.7C19.5 16.4 12 21 12 21z" /></svg>
      </div>
    </div>
  );
};

const BoutonAbonne: React.FC<{f: number}> = ({f}) => {
  const {fps} = useVideoConfig();
  if (f < 800) return null;
  const e = spring({frame: f - 800, fps, config: {damping: 10}});
  const fait = f >= 830;
  const clic = fait ? spring({frame: f - 830, fps, config: {damping: 8, stiffness: 300}}) : 0;
  return (
    <div style={{position: 'absolute', top: 1090, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
      <div style={{transform: `scale(${e * (1 + 0.12 * Math.sin(clic * Math.PI))})`, background: fait ? '#8a8f99' : '#fe2c55', color: '#fff',
        fontFamily: TEXTE, fontWeight: 900, fontSize: 58, padding: '18px 60px', borderRadius: 60, border: '6px solid #fff',
        boxShadow: '0 10px 0 rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', gap: 18}}>
        {fait ? 'ABONNÉ' : "S'ABONNER"}
        {fait && <svg width="50" height="50" viewBox="0 0 24 24"><path fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" d="M4 12.5l5 5L20 6.5" /></svg>}
      </div>
    </div>
  );
};

const Confettis: React.FC<{f: number}> = ({f}) => {
  if (f < 832) return null;
  const t = f - 832;
  const couleurs = ['#ffc928', '#fe2c55', '#3f7fd9', '#2bb39b', '#ffffff', '#9b59d0'];
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

/* ------------------------------------------------------------------ composition */

/** Attend les polices avant de monter la 3D : les étiquettes sont dessinées une seule fois sur canvas. */
const usePolicesPretes = () => {
  const [pret, setPret] = useState(false);
  const [poignee] = useState(() => delayRender('polices île'));
  useEffect(() => {
    Promise.all([lilita.waitUntilDone(), montserrat.waitUntilDone()]).then(() => { setPret(true); continueRender(poignee); });
  }, [poignee]);
  return pret;
};

export const IlePilote: React.FC = () => {
  const vrai = useCurrentFrame();
  const f = versGrille(vrai);
  const {width, height} = useVideoConfig();
  const pret = usePolicesPretes();
  const etat = useEtat(f);
  return (
    <AbsoluteFill style={{background: '#8fd6f6'}}>
      {pret && (
        <ThreeCanvas width={width} height={height} shadows camera={{fov: 40, near: 0.1, far: 300}} gl={{antialias: true}}>
          <Monde etat={etat} />
        </ThreeCanvas>
      )}
      <AbsoluteFill style={{background: '#fff', opacity: (etat.eclair ?? 0) * 0.45}} />
      <Titre f={f} />
      <CompteARebours f={f} />
      <BulleCommentaire f={f} />
      <SousTitre t={vrai / 30} />
      <BoutonAbonne f={f} />
      <Confettis f={f} />
      <Audio src={staticFile('ile/pilote_voix.wav')} />
    </AbsoluteFill>
  );
};

/** Photo de profil : Robin en gros plan, souriant, sur fond de plage. */
export const IleProfil: React.FC = () => {
  const {width, height} = useVideoConfig();
  const pret = usePolicesPretes();
  return (
    <AbsoluteFill style={{background: '#8fd6f6'}}>
      {pret && (
        <ThreeCanvas width={width} height={height} shadows camera={{fov: 30, near: 0.1, far: 300}} gl={{antialias: true}}>
          <Monde etat={{cam: {pos: [0.3, 2.1, 6.0], cible: [0, 1.95, 2.2], fov: 30}, robin: {humeur: 'joyeux', bras: 'salue'}, cielDegage: true}} />
        </ThreeCanvas>
      )}
    </AbsoluteFill>
  );
};
