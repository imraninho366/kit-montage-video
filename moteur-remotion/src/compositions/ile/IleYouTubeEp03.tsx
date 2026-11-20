import {ThreeCanvas} from '@remotion/three';
import {AbsoluteFill, Audio, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import voix from './youtube_ep03_voix.json';
import {Abri, DefCabane, Etat, Monde, Palmier} from './Ile3D';
import {ABRI, ABRI_ECHELLE, ROBIN, ROBIN_YEUX} from './IleTikTokEp02';
import {Plages, VOTE} from './IleTikTokEp03';
import {CABANES_YT} from './IleYouTubeEp02';
import {Etiquette, useMat} from './outils3d';
import {BoutonAbonne, Bulles, Confettis, DefBulle, DefTitre, SousTitre, Titre, fairePaquets, usePolicesPretes} from './habillage';

/**
 * L'Île des Abonnés — branche YouTube Shorts, épisode 3 (relevé du 10/11/2026 sur le Short HxFGAuWQ30U).
 * Vote : C (explorer la jungle) 4 voix contre 3 pour A et 1 pour B → annoncé « à une voix près ».
 * 15 commentateurs veulent leur cabane : l'île s'agrandit (deux plages) et chacun a sa cabane à son nom.
 * Histoire propre à YouTube : la jungle, une source d'eau, puis une grotte qui fait du bruit.
 * Nouveau vote : A entrer dans la grotte, B la boucher, C l'espionner la nuit.
 */

const FIN = voix.duree + 0.9;
export const DUREE_ILE_YT_EP03 = Math.ceil(FIN * 30);
const T = (i: number) => voix.mots[i].a - 0.08;

const R = {
  gagnant: T(8), jungle: T(14), source: T(20), quinze: T(29), agrandit: T(37), noms: [41, 42, 43, 44, 45, 46, 47].map(T), tous: T(48),
  grotte: T(57), bruits: T(68), vote: T(74), A: T(78), B: T(83), C: T(89), commente: T(93), abonne: T(98),
};

type V3 = [number, number, number];
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const mix = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const dans = (t: number, a: number, b: number) => t >= a && t < b;

/* ------------------------------------------------------------------ plan de l'île (branche YouTube) */

export const JUNGLE: V3 = [0, 0, -6.8];
export const SOURCE: V3 = [1.1, 0.4, -6.0];
export const GROTTE: V3 = [-1.4, 0.4, -7.3];
const ROBIN_MARCHE: V3 = [0.5, 0.4, -4.6];
const ROBIN_SOURCE: V3 = [0.1, 0.4, -5.5]; // à côté du bassin, pour ne pas le cacher
const COULEURS = ['#e84a5f', '#3f7fd9', '#f2c230', '#2bb39b', '#9b59d0', '#f08a24', '#ff7eb6', '#47c46a'];
const NOUVELLES: {p: V3; pseudo: string}[] = [
  // les 7 prénoms dits par la voix, dans l'ordre
  {p: [1.2, 0.4, 0.6], pseudo: '@abonne_163'},
  {p: [-1.3, 0.4, 3.2], pseudo: '@abonne_164'},
  {p: [2.1, 0.4, 2.4], pseudo: '@abonne_165'},
  {p: [-5.6, 0.4, -0.7], pseudo: '@abonne_166'},
  {p: [5.6, 0.4, -0.9], pseudo: '@abonne_167'},
  {p: [-4.6, 0.4, 0.2], pseudo: '@abonne_168'},
  {p: [4.6, 0.4, -0.1], pseudo: '@abonne_169'},
  // « et tous les autres »
  {p: [3.2, 0.4, -0.6], pseudo: '@abonne_170'},
  {p: [3.6, 0.4, 0.8], pseudo: '@abonne_171'},
  {p: [-6.6, 0.4, 0.3], pseudo: '@abonne_172'},
  {p: [6.6, 0.4, 0.0], pseudo: '@abonne_173'},
  {p: [-5.1, 0.4, 1.5], pseudo: '@abonne_174'},
  {p: [5.2, 0.4, 1.3], pseudo: '@abonne_175'},
  {p: [-6.3, 0.4, 1.7], pseudo: '@abonne_176'},
  {p: [6.4, 0.4, 1.5], pseudo: '@abonne_177'},
];
export const CABANES_EP03: DefCabane[] = [
  ...CABANES_YT,
  ...NOUVELLES.map((c, i) => ({...c, c: COULEURS[i % COULEURS.length]})),
];

/* ------------------------------------------------------------------ la jungle */

export const Jungle: React.FC<{e: number}> = ({e}) => {
  const sable = useMat('#f3d58b');
  const herbe = useMat('#5cb544');
  const lagon = useMat('#62d8d6', {transparent: true, opacity: 0.85});
  const buisson = useMat('#2f8f3c');
  const buisson2 = useMat('#3fa34d');
  if (e <= 0.001) return null;
  const buissons: [number, number, number][] = [[-2.0, -5.6, 0.45], [2.2, -6.9, 0.5], [0.2, -8.6, 0.55], [-2.8, -5.9, 0.4], [1.9, -8.3, 0.45], [-1.0, -4.7, 0.35], [2.4, -5.4, 0.35], [-2.6, -6.6, 0.4]];
  return (
    <group>
      <group position={JUNGLE}>
        <mesh material={lagon} position={[0, 0.025, 0]} scale={[e, 1, e]}><cylinderGeometry args={[3.7, 4.0, 0.1, 18]} /></mesh>
        <mesh material={sable} position={[0, -0.5 + 0.45 * e, 0]} scale={[1, e, 1]} receiveShadow castShadow><cylinderGeometry args={[2.9, 3.3, 0.9, 16]} /></mesh>
        <mesh material={herbe} position={[0, -0.04 + 0.45 * e, 0]} scale={[e, 1, e]} receiveShadow><cylinderGeometry args={[2.5, 2.6, 0.1, 14]} /></mesh>
      </group>
      {buissons.map(([x, z, r], i) => (
        <mesh key={i} material={i % 2 ? buisson : buisson2} position={[x, 0.45 + r * 0.6, z]} scale={e} castShadow><icosahedronGeometry args={[r, 0]} /></mesh>
      ))}
      {e > 0.5 && ([[-1.9, -6.2, 6, 0.25], [2.0, -7.6, 7, -0.2], [0.6, -8.9, 6, 0.15]] as number[][]).map(([x, z, h, r], i) => (
        <Palmier key={i} p={[x, 0.45, z]} h={h} r={r} graine={i * 2.1 + 5} />
      ))}
    </group>
  );
};

export const Source: React.FC<{e: number}> = ({e}) => {
  const frame = useCurrentFrame();
  const roche = useMat('#8a929c');
  const eau = useMat('#56dcff', {emissive: '#1aa6cf', emissiveIntensity: 0.5, roughness: 0.15});
  const chute = useMat('#bff0ff', {transparent: true, opacity: 0.8, emissive: '#56dcff', emissiveIntensity: 0.6});
  const ecume = useMat('#ffffff', {transparent: true, opacity: 0.9});
  if (e <= 0.001) return null;
  return (
    <group position={SOURCE} scale={e}>
      <mesh material={eau} position={[0, 0.06, 0.2]}><cylinderGeometry args={[0.75, 0.75, 0.06, 16]} /></mesh>
      {Array.from({length: 9}).map((_, i) => {
        const a = (i / 9) * Math.PI * 2;
        return <mesh key={i} material={roche} position={[Math.cos(a) * 0.82, 0.08, 0.2 + Math.sin(a) * 0.82]} rotation={[i, i * 2, 0]} castShadow><dodecahedronGeometry args={[0.16, 0]} /></mesh>;
      })}
      <mesh material={roche} position={[0, 0.55, -0.55]} scale={[1.2, 1.1, 0.8]} castShadow><dodecahedronGeometry args={[0.55, 0]} /></mesh>
      <mesh material={chute} position={[0, 0.55, -0.15]} scale={[1, 1 + Math.sin(frame / 3) * 0.03, 1]}><boxGeometry args={[0.3, 0.9, 0.05]} /></mesh>
      {[0, 1, 2, 3].map((i) => {
        const c = (frame * 0.05 + i * 0.25) % 1;
        return <mesh key={i} material={ecume} position={[(i - 1.5) * 0.1, 0.1 + c * 0.15, 0.0]} scale={1 - c}><icosahedronGeometry args={[0.05, 0]} /></mesh>;
      })}
    </group>
  );
};

/** La grotte : un rocher creusé, deux yeux qui s'allument sur « des bruits ». */
export const Grotte: React.FC<{e: number; yeux: number; etiq: number}> = ({e, yeux, etiq}) => {
  const frame = useCurrentFrame();
  const roche = useMat('#7d858f');
  const noir = useMat('#0d0d12');
  const jaune = useMat('#ffd23f', {emissive: '#ffb300', emissiveIntensity: 2});
  if (e <= 0.001) return null;
  const cligne = Math.floor(frame / 40) % 4 === 3 && frame % 40 < 4 ? 0.1 : 1;
  return (
    <group position={GROTTE} rotation={[0, -2.24, 0]}>
      <group scale={e}>
        <mesh material={roche} position={[0, 0.5, 0]} scale={[1.4, 0.9, 1.1]} castShadow receiveShadow><dodecahedronGeometry args={[1.0, 0]} /></mesh>
        <mesh material={roche} position={[0.9, 0.3, 0.4]} castShadow><dodecahedronGeometry args={[0.45, 0]} /></mesh>
        <mesh material={noir} position={[0, 0.02, 1.02]}><circleGeometry args={[0.55, 16, 0, Math.PI]} /></mesh>
        {yeux > 0.001 && [-1, 1].map((s) => (
          <mesh key={s} material={jaune} position={[s * 0.14, 0.28, 1.04]} scale={[yeux, yeux * cligne, yeux]}><sphereGeometry args={[0.05, 10, 8]} /></mesh>
        ))}
      </group>
      <Etiquette texte="GRRR…" position={[0, 1.7, 0.6]} echelle={etiq * yeux * (1 + Math.sin(frame / 3) * 0.08)} hauteur={0.26} fond="#1b1d24" encre="#ffd23f" />
    </group>
  );
};

/* aperçus du vote */

const Radeau: React.FC<{p: V3; e: number; children: React.ReactNode}> = ({p, e, children}) => {
  const bois = useMat('#a8743f');
  if (e <= 0.001) return null;
  return (
    <group position={p} scale={e}>
      {[-0.3, -0.1, 0.1, 0.3].map((o) => <mesh key={o} material={bois} position={[o, 0.06, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow><cylinderGeometry args={[0.1, 0.1, 1.0, 6]} /></mesh>)}
      {children}
    </group>
  );
};

const Torche: React.FC<{e: number}> = ({e}) => {
  const frame = useCurrentFrame();
  const bois = useMat('#6b4423');
  const orange = useMat('#ff8a1f', {emissive: '#ff5a00', emissiveIntensity: 1});
  const jaune = useMat('#ffd23f', {emissive: '#ffb300', emissiveIntensity: 1.2});
  const f = 1 + Math.sin(frame / 2.2) * 0.15;
  return (
    <Radeau p={VOTE[0]} e={e}>
      <mesh material={bois} position={[0, 0.5, 0]} rotation={[0, 0, 0.15]}><cylinderGeometry args={[0.035, 0.05, 0.8, 6]} /></mesh>
      <mesh material={orange} position={[0.06, 1.0, 0]} scale={[1, f, 1]}><coneGeometry args={[0.12, 0.3, 6]} /></mesh>
      <mesh material={jaune} position={[0.06, 0.97, 0.02]} scale={[1, 2 - f, 1]}><coneGeometry args={[0.07, 0.2, 6]} /></mesh>
      <pointLight position={[0.06, 1.1, 0]} color="#ff9a3c" intensity={2 * e} distance={3} />
    </Radeau>
  );
};

const Pierres: React.FC<{e: number}> = ({e}) => {
  const roche = useMat('#8a929c');
  const roche2 = useMat('#a3abb4');
  const pile: [number, number, number, number][] = [[-0.2, 0.2, 0, 0.18], [0.18, 0.2, 0.05, 0.17], [0, 0.2, -0.2, 0.16], [-0.05, 0.46, -0.05, 0.16], [0.12, 0.44, -0.1, 0.13], [0.02, 0.66, -0.06, 0.12]];
  return (
    <Radeau p={VOTE[1]} e={e}>
      {pile.map(([x, y, z, r], i) => <mesh key={i} material={i % 2 ? roche : roche2} position={[x, y, z]} rotation={[i, i * 2, 0]} castShadow><dodecahedronGeometry args={[r, 0]} /></mesh>)}
    </Radeau>
  );
};

const Jumelles: React.FC<{e: number}> = ({e}) => {
  const noir = useMat('#1b1d24');
  const verre = useMat('#7fd6ff', {roughness: 0.2, emissive: '#2aa6d6', emissiveIntensity: 0.3});
  const lune = useMat('#fff6c8', {emissive: '#fff0a0', emissiveIntensity: 1});
  return (
    <Radeau p={VOTE[2]} e={e}>
      <group position={[0, 0.35, 0]} rotation={[0.2, 0, 0]}>
        {[-1, 1].map((s) => (
          <group key={s} position={[s * 0.1, 0, 0]}>
            <mesh material={noir} rotation={[Math.PI / 2, 0, 0]} castShadow><cylinderGeometry args={[0.07, 0.08, 0.28, 10]} /></mesh>
            <mesh material={verre} position={[0, 0, 0.145]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.06, 0.06, 0.01, 10]} /></mesh>
          </group>
        ))}
        <mesh material={noir}><boxGeometry args={[0.1, 0.05, 0.08]} /></mesh>
      </group>
      <mesh material={lune} position={[0.15, 1.1, -0.2]}><sphereGeometry args={[0.16, 14, 10]} /></mesh>
    </Radeau>
  );
};

/* ------------------------------------------------------------------ caméra */

type Plan = {de: number; p0: V3; p1: V3; c: V3};
const PLANS: Plan[] = [
  {de: 0, p0: [12, 10, 16], p1: [9.5, 8, 13], c: [0, 0.6, -0.5]},
  {de: R.jungle, p0: [2.1, 3.6, -0.4], p1: [1.8, 3.3, -1.0], c: add(ROBIN_MARCHE, [0, 0.8, -1.6])},
  {de: R.source, p0: [3.9, 2.7, -2.3], p1: [3.5, 2.5, -2.8], c: [0.8, 0.8, -5.8]}, // à droite : à gauche, la caméra entrait dans un palmier
  {de: R.quinze, p0: [-15.5, 13, 7], p1: [-14, 12, 6.3], c: [0, 0.4, -0.6]},
  {de: R.grotte, p0: [-5.6, 2.4, -10.7], p1: [-5.1, 2.2, -10.1], c: add(GROTTE, [0, 0.7, 0])},
  {de: R.vote, p0: [0, 9, 15.5], p1: [0, 8.6, 14.6], c: [0.1, 0.3, 3.6]},
  {de: R.A, p0: add(VOTE[0], [0.9, 1.5, 2.8]), p1: add(VOTE[0], [0.75, 1.4, 2.4]), c: add(VOTE[0], [0, 0.55, 0])},
  {de: R.B, p0: add(VOTE[1], [0.9, 1.5, 2.8]), p1: add(VOTE[1], [0.75, 1.4, 2.4]), c: add(VOTE[1], [0, 0.45, 0])},
  {de: R.C, p0: add(VOTE[2], [-0.9, 1.5, 2.8]), p1: add(VOTE[2], [-0.75, 1.4, 2.4]), c: add(VOTE[2], [0, 0.6, 0])},
  {de: R.commente, p0: [0, 8.6, 14.6], p1: [0, 9.2, 15.6], c: [0.1, 0.3, 3.6]},
  {de: R.abonne, p0: [0, 1.95, 5.9], p1: [0, 1.9, 5.1], c: ROBIN_YEUX},
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
  const marche = dans(t, R.jungle, R.source);
  const etat: Etat = {
    cam: camera(t),
    robin: {
      humeur: dans(t, R.grotte, R.abonne) ? 'triste' : 'joyeux',
      position: marche ? mix(ROBIN_MARCHE, add(ROBIN_MARCHE, [0, 0, -0.8]), interpolate(t, [R.jungle, R.source], [0, 1])) : dans(t, R.source, R.quinze) ? ROBIN_SOURCE : ROBIN,
      rotY: marche ? Math.PI : dans(t, R.source, R.quinze) ? 0.85 : 0,
      bras: t >= R.abonne || dans(t, R.source + 0.3, R.quinze) ? 'salue' : 'repos',
    },
    cabanes: [...CABANES_YT.map(() => 1), ...R.noms.map((d) => pop(d + 0.05)), ...Array.from({length: 8}, (_, i) => pop(R.tous + 0.05 + i * 0.08))],
    etiquettes: dans(t, R.noms[0], R.grotte) ? 1 : 0,
    mysteres: [0, 1, 2].map((i) => pop(R.vote + 0.15 + i * 0.18) * (1 - pop([R.A, R.B, R.C][i] + 0.1))),
    lettres: dans(t, R.vote, R.A) || dans(t, R.commente, R.abonne) ? [0, 1, 2].map((i) => pop(R.vote + 0.35 + i * 0.18)) : [0, 0, 0],
  };
  return {
    etat,
    jungle: pop(R.jungle - 0.3), source: pop(R.source + 0.05), plages: pop(R.agrandit), grotte: pop(R.grotte + 0.1), yeux: pop(R.bruits + 0.25),
    torche: pop(R.A + 0.15), pierres: pop(R.B + 0.15), jumelles: pop(R.C + 0.15),
  };
};

const Monde3: React.FC<{t: number}> = ({t}) => {
  const s = useScene(t);
  return (
    <Monde etat={s.etat} cabanesDef={CABANES_EP03} parcellesVote={VOTE} tailleMystere={0.7}>
      <Plages g={s.plages} d={s.plages} />
      <Jungle e={s.jungle} />
      <Source e={s.source} />
      <Grotte e={s.grotte} yeux={s.yeux} etiq={dans(t, R.bruits, R.vote) ? 1 : 0} />
      <group position={ABRI}><Abri e={ABRI_ECHELLE} /></group>
      <Torche e={s.torche} />
      <Pierres e={s.pierres} />
      <Jumelles e={s.jumelles} />
    </Monde>
  );
};

/* ------------------------------------------------------------------ habillage */

const TITRES: DefTitre[] = [
  {de: 0, petit: 'VOTE SERRÉ', grand: 'C GAGNE !'},
  {de: R.jungle, petit: 'ROBIN EXPLORE', grand: 'LA JUNGLE…'},
  {de: R.source, petit: 'ET IL TROUVE', grand: 'UNE SOURCE !'},
  {de: R.quinze, petit: '15 NOUVEAUX NAUFRAGÉS', grand: "L'ÎLE GRANDIT"},
  {de: R.noms[0], petit: 'AVEC VOS NOMS', grand: 'VOS CABANES'},
  {de: R.grotte, petit: 'AU FOND DE LA JUNGLE…', grand: 'UNE GROTTE'},
  {de: R.bruits, petit: 'ET IL EN SORT', grand: 'DES BRUITS…'},
  {de: R.vote, petit: 'QUE FAIT ROBIN ?', grand: 'ON FAIT QUOI ?'},
  {de: R.A, petit: 'CHOIX A', grand: 'ENTRER'},
  {de: R.B, petit: 'CHOIX B', grand: 'LA BOUCHER'},
  {de: R.C, petit: 'CHOIX C', grand: "L'ESPIONNER"},
  {de: R.commente, petit: 'COMMENTE', grand: 'A, B OU C'},
  {de: R.abonne, petit: 'ABONNE-TOI POUR SAVOIR', grand: 'CE QUI SE CACHE'},
];

const PAQUETS = fairePaquets(voix, {
  4: '*serré :*', 5: '', 8: '*C,*', 12: '*près !*', 13: '', 19: '*jungle…*', 25: '*source*', 27: '*fraîche !*', 28: '',
  31: '*15*', 35: '*cabane :*', 36: '', 38: "*s'agrandit*", 41: '*Charly,*', 42: '*Kerem,*', 43: '*Mia,*', 44: '*Lucas,*', 45: '*Louane,*',
  46: '*Kenly,*', 47: '*Jeannette…*', 51: '*autres :*', 52: '', 54: '*noms*', 67: '*grotte.*', 73: '*bruits.*', 76: '*quoi ?*', 77: '',
  78: '*A,*', 82: '*grotte.*', 83: '*B,*', 88: '*pierres.*', 89: '*C,*', 92: '*nuit.*', 94: '*A,*', 95: '*B*', 97: '*C.*', 98: '*Abonne-toi*', 105: '*dedans.*',
});

const BULLES: DefBulle[] = [
  {de: 0.05, a: R.jungle, pseudo: '@abonne_163', texte: 'C et je veux bien une cabane', x: 90, y: 560, rot: -3},
  {de: 0.4, a: R.jungle, pseudo: '@abonne_172', texte: 'Non non non, C pas B', x: 230, y: 760, rot: 3},
  {de: 0.75, a: R.jungle, pseudo: '@abonne_164', texte: 'Moi et le A', x: 140, y: 960, rot: -2},
  {de: R.quinze + 0.2, a: R.noms[0], pseudo: '@abonne_169', texte: 'je veux la mienne, je me suis abonnée direct', x: 70, y: 560, rot: -2},
  {de: R.quinze + 0.6, a: R.noms[0], pseudo: '@abonne_175', texte: 'moi je veux ma cabane, je suis abo', x: 200, y: 760, rot: 2},
];

/* ------------------------------------------------------------------ composition */

export const IleYouTubeEp03: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / 30;
  const {width, height} = useVideoConfig();
  const pret = usePolicesPretes();
  return (
    <AbsoluteFill style={{background: '#8fd6f6'}}>
      {pret && (
        <ThreeCanvas width={width} height={height} shadows camera={{fov: 40, near: 0.1, far: 300}} gl={{antialias: true}}>
          <Monde3 t={t} />
        </ThreeCanvas>
      )}
      <Titre t={t} titres={TITRES} />
      <Bulles t={t} bulles={BULLES} />
      <SousTitre t={t} paquets={PAQUETS} />
      <BoutonAbonne t={t} de={R.abonne + 0.15} />
      <Confettis t={t} de={R.source + 0.3} a={R.quinze} />
      <Confettis t={t} de={R.abonne + 1.17} />
      <Audio src={staticFile('ile/youtube_ep03_voix.wav')} />
    </AbsoluteFill>
  );
};
