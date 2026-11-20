import {ThreeCanvas} from '@remotion/three';
import {AbsoluteFill, Audio, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import * as THREE from 'three';
import voix from './youtube_ep04_voix.json';
import {Abri, DefCabane, Etat, Monde} from './Ile3D';
import {ABRI, ABRI_ECHELLE, ROBIN} from './IleTikTokEp02';
import {Plages} from './IleTikTokEp03';
import {CABANES_EP03, GROTTE, Grotte, Jungle, Source} from './IleYouTubeEp03';
import {Etiquette, useMat} from './outils3d';
import {BoutonAbonne, Confettis, DefTitre, SousTitre, TEXTE, Titre, contour, fairePaquets, usePolicesPretes} from './habillage';

/**
 * L'Île des Abonnés — branche YouTube Shorts, épisode 4 (relevé du 13/11/2026 sur le Short W8ZOKjCNnRw).
 * Vote : C (espionner la nuit) 8 voix contre 3 et 2. Les yeux jaunes = un petit singe perdu ; derrière lui, une montgolfière.
 * Mécanique virale : « écris ton pays en commentaire » — le pays le plus cité gagne la destination de la montgolfière,
 * et chaque pays cité aura son drapeau sur l'île (épisode suivant). Pas de vote A/B/C cette fois.
 * Nouvelles cabanes : @abonne_178, @abonne_179, @abonne_180, @abonne_181
 */

const FIN = voix.duree + 1.2;
export const DUREE_ILE_YT_EP04 = Math.ceil(FIN * 30);
const T = (i: number) => voix.mots[i].a - 0.08;

const R = {
  nuit: T(12), yeux: T(19), singe: T(23), ballon: T(28), noms: [34, 35, 36, 37].map(T), seul: T(43), ecris: T(56), plus: T(62),
  drapeaux: T(66), tuviens: T(75), abonne: T(79),
};

type V3 = [number, number, number];
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const mix = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const dans = (t: number, a: number, b: number) => t >= a && t < b;

/* ------------------------------------------------------------------ plan (branche YouTube) */

export const BALLON: V3 = [0.4, 0.4, -7.0];
export const BALLON_ECHELLE = 1.7;
const ROBIN_CACHE: V3 = [-3.6, 0.4, -5.4]; // caché derrière le buisson, face à la grotte
const SINGE: V3 = [-2.2, 0.4, -7.9]; // à la bouche de la grotte
const NOUVELLES: DefCabane[] = [
  {p: [2.7, 0.4, -4.3], c: '#e84a5f', pseudo: '@abonne_178'},
  {p: [-2.6, 0.4, -4.6], c: '#3f7fd9', pseudo: '@abonne_179'},
  {p: [-7.3, 0.4, -0.6], c: '#f2c230', pseudo: '@abonne_180'},
  {p: [7.2, 0.4, -1.0], c: '#9b59d0', pseudo: '@abonne_181'},
];
export const CABANES_EP04: DefCabane[] = [...CABANES_EP03, ...NOUVELLES];
// mâts à drapeau vides, qui attendent les pays des commentaires
export const MATS: V3[] = CABANES_EP04.filter((_, i) => i % 2 === 0).slice(0, 12).map((c) => add(c.p, [0.55, 0, 0.1]));

/* ------------------------------------------------------------------ nouveautés */

export const Singe: React.FC<{e: number}> = ({e}) => {
  const frame = useCurrentFrame();
  const brun = useMat('#7a4a26');
  const visage = useMat('#e9c08f');
  const noir = useMat('#1a1410', {roughness: 0.3});
  const blanc = useMat('#ffffff');
  const banane = useMat('#ffd23f');
  if (e <= 0.001) return null;
  const saut = Math.max(0, Math.sin(frame / 5)) * 0.06;
  return (
    <group position={[SINGE[0], SINGE[1] + saut, SINGE[2]]} rotation={[0, -2.3, 0]} scale={e * 1.6}>
      <mesh material={brun} position={[0, 0.2, 0]} scale={[0.9, 1.1, 0.8]} castShadow><icosahedronGeometry args={[0.16, 1]} /></mesh>
      <mesh material={brun} position={[0, 0.48, 0]} castShadow><icosahedronGeometry args={[0.14, 1]} /></mesh>
      <mesh material={visage} position={[0, 0.46, 0.09]} scale={[1, 0.85, 0.6]}><icosahedronGeometry args={[0.1, 1]} /></mesh>
      {[-1, 1].map((s) => (
        <group key={s}>
          <mesh material={visage} position={[s * 0.15, 0.5, 0]} scale={[0.4, 1, 1]}><sphereGeometry args={[0.06, 8, 6]} /></mesh>
          <mesh material={blanc} position={[s * 0.045, 0.5, 0.15]}><sphereGeometry args={[0.03, 8, 6]} /></mesh>
          <mesh material={noir} position={[s * 0.045, 0.5, 0.175]}><sphereGeometry args={[0.018, 8, 6]} /></mesh>
          <mesh material={brun} position={[s * 0.13, 0.22, 0.04]} rotation={[0, 0, s * 0.5]}><cylinderGeometry args={[0.03, 0.03, 0.22, 5]} /></mesh>
        </group>
      ))}
      <mesh material={noir} position={[0, 0.42, 0.16]} scale={[1, 0.4, 0.4]}><sphereGeometry args={[0.03, 8, 6]} /></mesh>
      <group position={[0, 0.1, -0.14]} rotation={[-0.9 + Math.sin(frame / 6) * 0.2, 0, 0]}>
        <mesh material={brun} position={[0, 0.15, 0]}><cylinderGeometry args={[0.02, 0.025, 0.3, 5]} /></mesh>
      </group>
      <mesh material={banane} position={[0.18, 0.3, 0.1]} rotation={[0, 0, 0.6]}><torusGeometry args={[0.07, 0.022, 5, 10, Math.PI]} /></mesh>
    </group>
  );
};

/** Vieille montgolfière à fuseaux colorés, nacelle en osier, brûleur allumé. */
export const Montgolfiere: React.FC<{e: number; brule: number; etiq: number; p?: V3; echelle?: number}> = ({e, brule, etiq, p = BALLON, echelle = BALLON_ECHELLE}) => {
  const frame = useCurrentFrame();
  const m0 = useMat('#e84a5f', {side: THREE.DoubleSide});
  const m1 = useMat('#ffc928', {side: THREE.DoubleSide});
  const m2 = useMat('#3f7fd9', {side: THREE.DoubleSide});
  const m3 = useMat('#ffffff', {side: THREE.DoubleSide});
  const osier = useMat('#a8743f');
  const corde = useMat('#e8d8a8');
  const flamme = useMat('#ffb347', {emissive: '#ff7a00', emissiveIntensity: 1.5});
  if (e <= 0.001) return null;
  const mats = [m0, m1, m2, m3];
  const n = 10;
  const bob = Math.sin(frame / 20) * 0.04;
  return (
    <group position={p}>
      <group scale={e * echelle} position={[0, bob, 0]}>
        {Array.from({length: n}).map((_, i) => (
          <mesh key={i} material={mats[i % 4]} position={[0, 2.35, 0]} scale={[1, 1.12, 1]} castShadow>
            <sphereGeometry args={[0.9, 4, 12, (i / n) * Math.PI * 2, (Math.PI * 2) / n, 0, Math.PI * 0.72]} />
          </mesh>
        ))}
        <mesh material={m0} position={[0, 1.36, 0]}><cylinderGeometry args={[0.52, 0.22, 0.42, 10, 1, true]} /></mesh>
        {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([x, z], i) => {
          const a: V3 = [x * 0.24, 0.42, z * 0.24], b: V3 = [x * 0.2, 1.15, z * 0.2];
          return <mesh key={i} material={corde} position={mix(a, b, 0.5)}><cylinderGeometry args={[0.008, 0.008, 0.74, 4]} /></mesh>;
        })}
        <mesh material={osier} position={[0, 0.2, 0]} castShadow receiveShadow><boxGeometry args={[0.55, 0.4, 0.55]} /></mesh>
        <mesh material={corde} position={[0, 0.41, 0]}><boxGeometry args={[0.58, 0.03, 0.58]} /></mesh>
        {brule > 0.001 && <mesh material={flamme} position={[0, 1.1 + Math.sin(frame / 2) * 0.02, 0]} scale={[1, brule * (1 + Math.sin(frame / 2.3) * 0.25), 1]}><coneGeometry args={[0.08, 0.3, 8]} /></mesh>}
        {brule > 0.001 && <pointLight position={[0, 1.3, 0]} color="#ff9a3c" intensity={3 * brule} distance={4} />}
      </group>
      <Etiquette texte="DESTINATION : ?" position={[0, 4.7 * e, 0]} echelle={etiq * e} hauteur={0.38} fond="#2b1a00" encre="#ffc928" />
    </group>
  );
};

/** Mâts à drapeau blancs : les pays cités en commentaire les rempliront au prochain épisode. */
export const Mats: React.FC<{v: number[]}> = ({v}) => {
  const frame = useCurrentFrame();
  const metal = useMat('#c8ccd2');
  const blanc = useMat('#ffffff', {side: THREE.DoubleSide});
  return (
    <>
      {MATS.map((p, i) => v[i] > 0.001 && (
        <group key={i} position={p} scale={v[i]}>
          <mesh material={metal} position={[0, 0.6, 0]}><cylinderGeometry args={[0.02, 0.02, 1.2, 5]} /></mesh>
          <mesh material={blanc} position={[0.17, 1.08, 0]} rotation={[0, Math.sin(frame / 7 + i) * 0.3, 0]}><planeGeometry args={[0.32, 0.22]} /></mesh>
          <Etiquette texte="?" position={[0.17, 1.08, 0.02]} echelle={1} hauteur={0.16} fond="#ffffff" encre="#2b1a00" />
        </group>
      ))}
    </>
  );
};

/* ------------------------------------------------------------------ caméra */

type Plan = {de: number; p0: V3; p1: V3; c: V3};
const PLANS: Plan[] = [
  {de: 0, p0: [11, 9, 15], p1: [9, 7.5, 12.5], c: [0, 0.6, -1.5]},
  {de: R.nuit, p0: [-9.2, 3.4, -2.2], p1: [-8.7, 3.2, -2.7], c: [-2.4, 1.0, -6.6]},
  {de: R.yeux, p0: [-5.4, 2.0, -10.0], p1: [-5.0, 1.9, -9.6], c: add(GROTTE, [0, 0.5, 0])},
  {de: R.singe, p0: add(SINGE, [-1.6, 1.0, -1.6]), p1: add(SINGE, [-1.3, 0.9, -1.3]), c: add(SINGE, [0, 0.6, 0])},
  {de: R.ballon, p0: [6.8, 3.4, -0.4], p1: [6.2, 3.8, -0.9], c: add(BALLON, [0, 2.6, 0])},
  {de: R.noms[0], p0: [-15.5, 13, 7], p1: [-14, 12, 6.3], c: [0, 0.4, -1.4]},
  {de: R.seul, p0: [5.6, 5.2, -1.6], p1: [4.6, 5.8, -1.0], c: add(BALLON, [0, 3.2, 0])},
  {de: R.ecris, p0: [12, 10, 15], p1: [10.5, 9, 13.5], c: [0, 0.6, -1.5]},
  {de: R.drapeaux, p0: [-15.5, 13, 7], p1: [-14, 12, 6.3], c: [0, 0.4, -1.4]},
  {de: R.tuviens, p0: [0, 1.95, 5.9], p1: [0, 1.9, 5.1], c: [0, 1.62, 2.2]},
];

const camera = (t: number): Etat['cam'] => {
  const i = Math.max(0, PLANS.findIndex((p, k) => t >= p.de && t < (PLANS[k + 1]?.de ?? Infinity)));
  const p = PLANS[i];
  const fin = PLANS[i + 1]?.de ?? FIN;
  const u = interpolate(t, [p.de, fin], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return {pos: mix(p.p0, p.p1, u), cible: p.c, fov: 40};
};

/* ------------------------------------------------------------------ état */

const useScene = (t: number) => {
  const {fps} = useVideoConfig();
  const pop = (de: number) => (t < de ? 0 : spring({frame: (t - de) * 30, fps, config: {damping: 11, stiffness: 170}}));
  const nuit = dans(t, R.nuit, R.ballon + 1.0);
  const etat: Etat = {
    cam: camera(t),
    robin: {
      humeur: 'joyeux',
      position: dans(t, R.nuit, R.singe) ? ROBIN_CACHE : ROBIN,
      rotY: dans(t, R.nuit, R.singe) ? 2.28 : 0,
      bras: t >= R.tuviens ? 'salue' : 'repos',
    },
    orage: nuit ? interpolate(t, [R.nuit, R.nuit + 0.6, R.ballon, R.ballon + 1.0], [0.4, 0.95, 0.95, 0], {extrapolateRight: 'clamp'}) : t < R.nuit ? 0.35 : 0,
    cielDegage: true,
    cabanes: [...CABANES_EP03.map(() => 1), ...R.noms.map((d) => pop(d + 0.05))],
    etiquettes: dans(t, R.noms[0], R.seul) || dans(t, R.drapeaux, R.tuviens) ? 1 : 0,
  };
  return {
    etat,
    yeux: t < R.singe ? (t >= R.nuit ? 1 : 0) : 1 - pop(R.singe),
    etiqGrotte: 0,
    singe: pop(R.singe + 0.1),
    ballon: pop(R.ballon + 0.35), brule: t >= R.ballon + 0.6 ? 1 : 0,
    etiqBallon: dans(t, R.seul, R.ecris) ? 1 : 0,
    mats: MATS.map((_, i) => pop(R.drapeaux + 0.1 + i * 0.07)),
  };
};

const Monde4: React.FC<{t: number}> = ({t}) => {
  const s = useScene(t);
  return (
    <Monde etat={s.etat} cabanesDef={CABANES_EP04} parcellesVote={[]}>
      <Plages g={1} d={1} />
      <Jungle e={1} />
      <Source e={1} />
      <Grotte e={1} yeux={s.yeux} etiq={s.etiqGrotte} />
      <group position={ABRI}><Abri e={ABRI_ECHELLE} /></group>
      <Singe e={s.singe} />
      <Montgolfiere e={s.ballon} brule={s.brule} etiq={s.etiqBallon} />
      <Mats v={s.mats} />
    </Monde>
  );
};

/* ------------------------------------------------------------------ habillage : les drapeaux */

// drapeaux d'exemple (pays francophones et d'origine fréquents dans les commentaires), sans conflit mis en avant
export const DRAPEAUX = ['🇫🇷', '🇩🇿', '🇲🇦', '🇹🇳', '🇧🇪', '🇨🇭', '🇨🇦', '🇸🇳', '🇨🇮', '🇨🇲', '🇵🇹', '🇮🇹', '🇪🇸', '🇹🇷', '🇷🇴', '🇬🇳', '🇲🇱', '🇭🇹', '🇨🇩', '🇺🇸', '🇧🇷', '🇩🇪'];

/** Accroche : une ronde de drapeaux autour de « TON PAYS ? ». */
export const RondeDrapeaux: React.FC<{t: number; de: number; a: number}> = ({t, de, a}) => {
  const {fps} = useVideoConfig();
  if (t < de || t >= a) return null;
  const e = spring({frame: (t - de) * 30, fps, config: {damping: 12}});
  const sortie = interpolate(t, [a - 0.25, a], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const n = 12;
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: 560, height: 560, opacity: sortie}}>
      {Array.from({length: n}).map((_, i) => {
        const ang = (i / n) * Math.PI * 2 + t * 0.9;
        const x = 540 + Math.cos(ang) * 380 * e, y = 280 + Math.sin(ang) * 230 * e;
        return <div key={i} style={{position: 'absolute', left: x - 68, top: y - 68, fontSize: 130, lineHeight: 1, transform: `scale(${e})`}}>{DRAPEAUX[i]}</div>;
      })}
      <div style={{position: 'absolute', left: 0, right: 0, top: 210, textAlign: 'center', transform: `scale(${e})`, fontFamily: TEXTE, fontWeight: 900, fontSize: 88,
        color: '#ffc928', ...contour('#1b1d24', 16)}}>TON PAYS ?</div>
    </div>
  );
};

/** Pluie de drapeaux pendant l'appel à commenter. */
export const PluieDrapeaux: React.FC<{t: number; de: number}> = ({t, de}) => {
  if (t < de) return null;
  const f = (t - de) * 30;
  return (
    <>
      {Array.from({length: 26}).map((_, i) => {
        const x = (Math.sin(i * 77.3) * 0.5 + 0.5) * 980;
        const v = 6 + (Math.sin(i * 13.7) * 0.5 + 0.5) * 7;
        const y = -120 + ((f * v + i * 140) % 2100);
        return <div key={i} style={{position: 'absolute', left: x, top: y, fontSize: 70 + (i % 3) * 14, transform: `rotate(${Math.sin(f / 10 + i) * 18}deg)`, opacity: 0.95}}>{DRAPEAUX[i % DRAPEAUX.length]}</div>;
      })}
    </>
  );
};

/** Bulle de commentaire exemple. */
export const BulleExemple: React.FC<{t: number; de: number; a: number}> = ({t, de, a}) => {
  const {fps} = useVideoConfig();
  if (t < de || t >= a) return null;
  const e = spring({frame: (t - de) * 30, fps, config: {damping: 12}});
  return (
    <div style={{position: 'absolute', top: 640, left: 110, transform: `scale(${e}) rotate(-3deg)`, transformOrigin: 'left center',
      background: '#fff', borderRadius: 30, padding: '20px 30px', boxShadow: '0 10px 0 rgba(0,0,0,0.18)', fontFamily: TEXTE, fontWeight: 900}}>
      <div style={{fontSize: 30, color: '#8a8f99'}}>@toi · il y a 2 s</div>
      <div style={{fontSize: 52, color: '#1b1d24'}}>Mon pays : <span style={{fontSize: 60}}>🌍</span> ???</div>
    </div>
  );
};

const TITRES: DefTitre[] = [
  {de: 0, petit: 'ROBIN VA QUITTER', grand: "L'ÎLE !"},
  {de: R.nuit, petit: 'VOUS AVEZ CHOISI C', grand: 'ESPIONNER…'},
  {de: R.singe, petit: 'LES YEUX JAUNES ?', grand: 'UN PETIT SINGE !'},
  {de: R.ballon, petit: 'ET DERRIÈRE LUI…', grand: 'UNE MONTGOLFIÈRE'},
  {de: R.noms[0], petit: '4 NOUVEAUX NAUFRAGÉS', grand: 'VOS CABANES'},
  {de: R.seul, petit: 'ELLE NE VA QUE DANS', grand: '1 SEUL PAYS'},
  {de: R.ecris, petit: 'ÉCRIS TON PAYS', grand: 'EN COMMENTAIRE'},
  {de: R.plus, petit: 'LE PAYS LE PLUS CITÉ', grand: 'GAGNE !'},
  {de: R.drapeaux, petit: 'CHAQUE PAYS CITÉ', grand: 'A SON DRAPEAU'},
  {de: R.tuviens, petit: 'ET TOI…', grand: "TU VIENS D'OÙ ?"},
];

const PAQUETS = fairePaquets(voix, {
  3: "*l'île…*", 6: '*ton*', 7: '*pays*', 16: '*espionné*', 18: '*grotte.*', 21: '*jaunes ?*', 22: '', 25: '*singe*', 26: '*perdu !*', 27: '',
  33: '*montgolfière.*', 34: '*Hugo,*', 35: '*Gaëlle,*', 36: '*Ilyes,*', 37: '*Liliane :*', 38: '', 40: '*cabanes*', 52: '*seul*', 53: '*pays*',
  59: '*pays*', 61: '*commentaire.*', 65: '*gagne.*', 72: '*drapeau*', 77: "*d'où ?*", 78: '', 79: '*Abonne-toi*', 84: '*pays*', 85: '*gagne.*',
});

/* ------------------------------------------------------------------ composition */

export const IleYouTubeEp04: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / 30;
  const {width, height} = useVideoConfig();
  const pret = usePolicesPretes();
  return (
    <AbsoluteFill style={{background: '#8fd6f6'}}>
      {pret && (
        <ThreeCanvas width={width} height={height} shadows camera={{fov: 40, near: 0.1, far: 300}} gl={{antialias: true}}>
          <Monde4 t={t} />
        </ThreeCanvas>
      )}
      <PluieDrapeaux t={t} de={R.ecris} />
      <Titre t={t} titres={TITRES} />
      <RondeDrapeaux t={t} de={0} a={R.nuit} />
      <BulleExemple t={t} de={R.ecris + 0.3} a={R.drapeaux} />
      <SousTitre t={t} paquets={PAQUETS} />
      <BoutonAbonne t={t} de={R.abonne + 0.1} />
      <Confettis t={t} de={R.singe + 0.2} a={R.ballon} />
      <Confettis t={t} de={R.abonne + 1.12} />
      <Audio src={staticFile('ile/youtube_ep04_voix.wav')} />
    </AbsoluteFill>
  );
};
