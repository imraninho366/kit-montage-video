import {ThreeCanvas} from '@remotion/three';
import {AbsoluteFill, Audio, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import * as THREE from 'three';
import voix from './tiktok_ep05_voix.json';
import {Abri, Etat, Monde, Naufrage} from './Ile3D';
import {ABRI, ABRI_ECHELLE, ChatNoir, Jacuzzi, Puits, ROBIN, Restaurant} from './IleTikTokEp02';
import {CABANES_EP03, Chihuahua, DecoFoot, MaisonPiscine, Mosquee, Patisserie, PetitChien, Plages, Scene as SceneCalvin} from './IleTikTokEp03';
import {
  Aeroport, BoulangerieHalloween, CabaneGateau, CabanePecheur, Chateau, EXT_A, EXT_B, FLIPEUR_CENTRE, Flipeur, Ilot, MaisonPaillettes, Panier, STADE, Stade,
} from './IleTikTokEp04';
import {BulleExemple, PluieDrapeaux, RondeDrapeaux} from './IleYouTubeEp04';
import {Etiquette, useMat} from './outils3d';
import {BoutonAbonne, Bulles, Confettis, DefBulle, DefTitre, SousTitre, Titre, fairePaquets, usePolicesPretes} from './habillage';

/**
 * L'Île des Abonnés — branche TikTok, épisode 5 (relevé du 13/11/2026 sur l'épisode 4).
 * Vote : A (suivre les traces) 6 voix contre 2 et 1. Les traces mènent à l'aéroport : le voleur est un perroquet.
 * Demandes : villa-poisson (@abonne_152), boucherie (@abonne_153), balançoire de Noël (@abonne_130 « Wizzy »),
 * fils du capitaine (@abonne_140), lucarne magique dans le stade (@abonne_135).
 * Mécanique virale (comme YouTube ép. 4) : l'avion du directeur @abonne_151 part vers le pays le plus cité en commentaire,
 * et chaque pays cité aura son drapeau sur l'île.
 */

const FIN = voix.duree + 1.2;
export const DUREE_ILE_TT_EP05 = Math.ceil(FIN * 30);
const T = (i: number) => voix.mots[i].a - 0.08;

const R = {
  traces: T(11), aeroport: T(20), voleur: T(23), theo: T(36), tornade: T(44), wizzy: T(47), sayan: T(53), kaki: T(59),
  comete: T(65), seul: T(74), ecris: T(83), plus: T(88), drapeaux: T(92), tuviens: T(101), abonne: T(105),
};

type V3 = [number, number, number];
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const mix = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const dans = (t: number, a: number, b: number) => t >= a && t < b;

/* ------------------------------------------------------------------ plan (branche TikTok, après l'épisode 5) */

export const AVION: V3 = [7.51, 0.92, -4.19]; // avion garé en bout de piste (voir Aeroport, décollage = 0)
export const TOUR: V3 = [8.87, 0.4, -6.07];
const PERROQUET: V3 = [7.75, 0.4, -3.45];
export const EXT_F: V3 = [-6.5, 0, 5.5]; // nouvel îlot, devant à gauche
const VILLA: V3 = [-6.0, 0.4, 4.8];
const BOUCHERIE: V3 = [-7.6, 0.4, 6.0];
const BALANCOIRE: V3 = [-5.6, 0.4, 6.4];
const LUCARNE: V3 = add(STADE, [1.25, 0.33, 0.2]);
export const FILS: V3 = add(ROBIN, [0.65, 0, 0.45]);
export const MATS: V3[] = CABANES_EP03.map((c) => add(c.p, [0.55, 0, 0.1]));
const TRACES: V3[] = Array.from({length: 7}, (_, i) => mix([8.7, 0.425, -2.75], [7.95, 0.425, -3.3], i / 6));

/* ------------------------------------------------------------------ nouveautés */

export const Perroquet: React.FC<{e: number}> = ({e}) => {
  const frame = useCurrentFrame();
  const rouge = useMat('#e0283f');
  const bleu = useMat('#2f6db5');
  const jaune = useMat('#ffc928');
  const bec = useMat('#f2e6c9');
  const noir = useMat('#111111');
  const coco = useMat('#6b4423');
  if (e <= 0.001) return null;
  const tete = Math.sin(frame / 6) * 0.25;
  return (
    <group position={PERROQUET} scale={e}>
      {/* le butin : un tas de noix de coco */}
      {([[0, 0.12, 0], [0.22, 0.1, 0.1], [-0.2, 0.1, 0.08], [0.05, 0.1, -0.2], [0.02, 0.3, 0.0], [-0.12, 0.28, -0.08], [0.16, 0.28, -0.05]] as V3[]).map((p, i) => (
        <mesh key={i} material={coco} position={p} castShadow><icosahedronGeometry args={[0.12, 0]} /></mesh>
      ))}
      <group position={[0, 0.42, 0]} rotation={[0, -1.0, 0]} scale={1.4}>
        <mesh material={rouge} position={[0, 0.12, 0]} scale={[0.8, 1.1, 0.9]} castShadow><icosahedronGeometry args={[0.1, 1]} /></mesh>
        <group position={[0, 0.26, 0.02]} rotation={[0, tete, 0]}>
          <mesh material={rouge}><icosahedronGeometry args={[0.075, 1]} /></mesh>
          <mesh material={bec} position={[0, -0.01, 0.08]} rotation={[0.4, 0, 0]}><coneGeometry args={[0.03, 0.07, 6]} /></mesh>
          {[-1, 1].map((s) => <mesh key={s} material={noir} position={[s * 0.045, 0.02, 0.05]}><sphereGeometry args={[0.014, 6, 5]} /></mesh>)}
        </group>
        {[-1, 1].map((s) => <mesh key={s} material={bleu} position={[s * 0.085, 0.12, -0.02]} rotation={[0.2, 0, s * (0.3 + Math.sin(frame / 3) * 0.08)]}><boxGeometry args={[0.03, 0.17, 0.12]} /></mesh>)}
        <mesh material={jaune} position={[0, 0.02, -0.12]} rotation={[-0.9, 0, 0]}><boxGeometry args={[0.05, 0.16, 0.02]} /></mesh>
      </group>
    </group>
  );
};

export const VillaPoisson: React.FC<{e: number}> = ({e}) => {
  const frame = useCurrentFrame();
  const orange = useMat('#f08a24');
  const blanc = useMat('#fbf6ea');
  const noir = useMat('#111111');
  const hublot = useMat('#7fd6ff', {roughness: 0.2});
  const porte = useMat('#8b5a2b');
  if (e <= 0.001) return null;
  return (
    <group position={VILLA} rotation={[0, 0.4, 0]}>
      <group scale={e}>
        <mesh material={orange} position={[0, 0.62, 0]} scale={[1.35, 0.85, 0.75]} castShadow receiveShadow><icosahedronGeometry args={[0.6, 1]} /></mesh>
        {[-0.2, 0.25].map((x) => <mesh key={x} material={blanc} position={[x, 0.62, 0]} scale={[0.12, 0.86, 0.76]}><icosahedronGeometry args={[0.6, 1]} /></mesh>)}
        <group position={[-0.95, 0.62, 0]} rotation={[0, 0, Math.sin(frame / 8) * 0.12]}>
          <mesh material={orange} rotation={[0, 0, Math.PI / 2]} scale={[1, 1, 0.3]}><coneGeometry args={[0.35, 0.5, 4]} /></mesh>
        </group>
        <mesh material={orange} position={[0.05, 1.18, 0]} rotation={[0, 0, -0.3]} scale={[1, 1, 0.2]}><coneGeometry args={[0.22, 0.38, 3]} /></mesh>
        <mesh material={blanc} position={[0.62, 0.72, 0.32]}><sphereGeometry args={[0.09, 10, 8]} /></mesh>
        <mesh material={noir} position={[0.66, 0.72, 0.38]}><sphereGeometry args={[0.05, 8, 6]} /></mesh>
        {[-0.45, 0.0].map((x) => <mesh key={x} material={hublot} position={[x, 0.75, 0.43]}><sphereGeometry args={[0.08, 10, 8]} /></mesh>)}
        <mesh material={porte} position={[0.25, 0.25, 0.4]}><boxGeometry args={[0.2, 0.34, 0.04]} /></mesh>
      </group>
    </group>
  );
};

export const Boucherie: React.FC<{e: number}> = ({e}) => {
  const blanc = useMat('#f4f4f4');
  const rouge = useMat('#c0272d');
  const jambon = useMat('#c9716a');
  const os = useMat('#f2e6c9');
  const vitre = useMat('#bfe9ff', {roughness: 0.2});
  if (e <= 0.001) return null;
  return (
    <group position={BOUCHERIE} rotation={[0, 0.9, 0]}>
      <group scale={e}>
        <mesh material={blanc} position={[0, 0.42, 0]} castShadow receiveShadow><boxGeometry args={[1.1, 0.84, 0.85]} /></mesh>
        {Array.from({length: 5}).map((_, i) => (
          <mesh key={i} material={i % 2 ? blanc : rouge} position={[-0.44 + i * 0.22, 0.92, 0.52]} rotation={[0.45, 0, 0]} castShadow><boxGeometry args={[0.22, 0.04, 0.38]} /></mesh>
        ))}
        <mesh material={vitre} position={[0, 0.45, 0.43]}><boxGeometry args={[0.6, 0.3, 0.02]} /></mesh>
        {[-0.3, 0.3].map((x) => (
          <group key={x} position={[x, 0.66, 0.62]}>
            <mesh material={os} position={[0, 0.1, 0]}><cylinderGeometry args={[0.01, 0.01, 0.12, 4]} /></mesh>
            <mesh material={jambon} scale={[0.8, 1.2, 0.8]}><icosahedronGeometry args={[0.09, 1]} /></mesh>
          </group>
        ))}
        <mesh material={rouge} position={[0, 1.06, 0]}><boxGeometry args={[0.7, 0.18, 0.05]} /></mesh>
      </group>
    </group>
  );
};

export const BalancoireNoel: React.FC<{e: number}> = ({e}) => {
  const frame = useCurrentFrame();
  const rouge = useMat('#c0272d');
  const corde = useMat('#e8d8a8');
  const bois = useMat('#8b5a2b');
  const sapin = useMat('#1f7a3a');
  const etoile = useMat('#ffd23f', {emissive: '#ffb300', emissiveIntensity: 1.2});
  const tronc = useMat('#6b4423');
  const a0 = useMat('#ff3b3b', {emissive: '#ff0000', emissiveIntensity: 1});
  const a1 = useMat('#3bff6b', {emissive: '#00ff40', emissiveIntensity: 1});
  const a2 = useMat('#ffd23f', {emissive: '#ffb300', emissiveIntensity: 1});
  const a3 = useMat('#3b9bff', {emissive: '#0080ff', emissiveIntensity: 1});
  if (e <= 0.001) return null;
  const ampoules = [a0, a1, a2, a3];
  const balance = Math.sin(frame / 12) * 0.35;
  return (
    <group position={BALANCOIRE} rotation={[0, 0.5, 0]}>
      <group scale={e}>
        {[-1, 1].map((s) => [-1, 1].map((d) => (
          <mesh key={`${s}${d}`} material={rouge} position={[s * 0.5, 0.55, d * 0.18]} rotation={[d * 0.3, 0, 0]} castShadow><cylinderGeometry args={[0.035, 0.035, 1.15, 6]} /></mesh>
        )))}
        <mesh material={rouge} position={[0, 1.1, 0]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.035, 0.035, 1.1, 6]} /></mesh>
        <group position={[0, 1.1, 0]} rotation={[balance, 0, 0]}>
          {[-0.18, 0.18].map((x) => <mesh key={x} material={corde} position={[x, -0.38, 0]}><cylinderGeometry args={[0.008, 0.008, 0.76, 4]} /></mesh>)}
          <mesh material={bois} position={[0, -0.77, 0]}><boxGeometry args={[0.44, 0.04, 0.16]} /></mesh>
        </group>
        {Array.from({length: 8}).map((_, i) => (
          <mesh key={i} material={ampoules[(i + Math.floor(frame / 10)) % 4]} position={[-0.45 + i * 0.13, 1.06, 0.04]}><sphereGeometry args={[0.025, 6, 5]} /></mesh>
        ))}
        {/* petit sapin à côté */}
        <group position={[0.85, 0, -0.1]}>
          <mesh material={tronc} position={[0, 0.08, 0]}><cylinderGeometry args={[0.05, 0.05, 0.16, 6]} /></mesh>
          {[0, 1, 2].map((k) => <mesh key={k} material={sapin} position={[0, 0.3 + k * 0.22, 0]} castShadow><coneGeometry args={[0.32 - k * 0.08, 0.36, 8]} /></mesh>)}
          <mesh material={etoile} position={[0, 0.98, 0]}><octahedronGeometry args={[0.07, 0]} /></mesh>
        </group>
      </group>
    </group>
  );
};

/** Casquette de capitaine (pour Robin et pour son « fils »). */
export const Casquette: React.FC<{p: V3; s: number}> = ({p, s}) => {
  const marine = useMat('#1b2a4a');
  const blanc = useMat('#ffffff');
  const or = useMat('#ffc928', {emissive: '#b88a00', emissiveIntensity: 0.4});
  if (s <= 0.001) return null;
  return (
    <group position={p} scale={s}>
      <mesh material={blanc} position={[0, 0.07, 0]}><cylinderGeometry args={[0.36, 0.3, 0.14, 16]} /></mesh>
      <mesh material={marine} position={[0, -0.02, 0]}><cylinderGeometry args={[0.31, 0.31, 0.08, 16]} /></mesh>
      <mesh material={marine} position={[0, -0.05, 0.27]} rotation={[0.3, 0, 0]} scale={[1, 0.25, 0.7]}><sphereGeometry args={[0.2, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2]} /></mesh>
      <mesh material={or} position={[0, 0.06, 0.32]}><sphereGeometry args={[0.05, 8, 6]} /></mesh>
    </group>
  );
};

export const Lucarne: React.FC<{e: number}> = ({e}) => {
  const frame = useCurrentFrame();
  const violet = useMat('#b45cff', {emissive: '#8a2be2', emissiveIntensity: 1.5});
  const voile = useMat('#e0c3ff', {transparent: true, opacity: 0.6, emissive: '#b45cff', emissiveIntensity: 1, side: THREE.DoubleSide});
  const etincelle = useMat('#ffffff', {emissive: '#e0c3ff', emissiveIntensity: 2});
  if (e <= 0.001) return null;
  return (
    <group position={LUCARNE} rotation={[0, Math.PI / 2, 0]} scale={e}>
      <mesh material={violet} rotation={[0, 0, frame / 8]}><torusGeometry args={[0.13, 0.025, 6, 20]} /></mesh>
      <mesh material={voile}><circleGeometry args={[0.12, 16]} /></mesh>
      {Array.from({length: 6}).map((_, i) => {
        const a = frame / 6 + i;
        return <mesh key={i} material={etincelle} position={[Math.cos(a) * 0.22, Math.sin(a) * 0.22, 0.02]} scale={0.6 + Math.sin(frame / 3 + i) * 0.4}><octahedronGeometry args={[0.02, 0]} /></mesh>;
      })}
    </group>
  );
};

const Traces: React.FC<{v: number}> = ({v}) => {
  const encre = useMat('#6b4a2a');
  return (
    <>
      {TRACES.map((p, i) => i / TRACES.length <= v && (
        <mesh key={i} material={encre} position={[p[0] + (i % 2 ? 0.06 : -0.06), p[1], p[2]]} rotation={[-Math.PI / 2, 0, 0]} scale={[0.6, 1, 1]}><circleGeometry args={[0.07, 8]} /></mesh>
      ))}
    </>
  );
};

const Mats: React.FC<{v: number[]}> = ({v}) => {
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
  {de: 0, p0: [4.6, 5.4, 2.6], p1: [5.2, 4.8, 1.4], c: add(EXT_A, [0, 0.8, 0])},
  {de: R.traces, p0: [6.2, 3.0, -0.8], p1: [6.5, 2.7, -1.2], c: [8.0, 0.5, -3.6]},
  {de: R.aeroport, p0: [4.6, 4.4, 0.4], p1: [4.9, 4.2, 0.0], c: add(EXT_A, [0, 0.6, 0])},
  {de: R.voleur, p0: [6.2, 1.8, -1.8], p1: [6.45, 1.65, -2.15], c: [7.6, 0.8, -3.8]},
  {de: R.theo, p0: add(VILLA, [1.4, 1.9, 3.2]), p1: add(VILLA, [1.2, 1.7, 2.8]), c: add(VILLA, [0, 0.7, 0])},
  {de: R.tornade, p0: add(BOUCHERIE, [1.5, 1.7, 3.0]), p1: add(BOUCHERIE, [1.3, 1.6, 2.6]), c: add(BOUCHERIE, [0, 0.65, 0])},
  {de: R.wizzy, p0: add(BALANCOIRE, [1.2, 1.5, 3.0]), p1: add(BALANCOIRE, [1.0, 1.4, 2.6]), c: add(BALANCOIRE, [0.2, 0.7, 0])},
  {de: R.sayan, p0: [1.6, 2.7, 7.6], p1: [1.4, 2.6, 7.0], c: [0.35, 2.15, 2.5]},
  {de: R.kaki, p0: add(LUCARNE, [1.4, 0.9, -2.6]), p1: add(LUCARNE, [1.2, 0.8, -2.2]), c: LUCARNE},
  {de: R.comete, p0: [6.6, 2.3, -3.4], p1: [6.9, 2.2, -3.7], c: add(TOUR, [0, 1.3, 0])},
  {de: R.seul, p0: [5.6, 2.1, -2.0], p1: [5.9, 2.0, -2.4], c: add(AVION, [0, 0.4, 0])},
  {de: R.ecris, p0: [12, 10, 15], p1: [10.5, 9, 13.5], c: [0, 0.6, -1]},
  {de: R.drapeaux, p0: [-15.5, 13, 7], p1: [-14, 12, 6.3], c: [0, 0.4, 0]},
  {de: R.tuviens, p0: [0, 2.0, 5.9], p1: [0, 1.95, 5.1], c: [0, 1.75, 2.2]},
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
  const etat: Etat = {
    cam: camera(t),
    robin: {humeur: 'joyeux', position: ROBIN, bras: t >= R.tuviens || dans(t, R.sayan, R.kaki) ? 'salue' : 'repos'},
    cabanes: CABANES_EP03.map(() => 1),
    etiquettes: dans(t, R.drapeaux, R.tuviens) ? 1 : 0,
  };
  const a = t * 0.6;
  return {
    etat,
    flipeurP: [FLIPEUR_CENTRE[0] + Math.sin(a) * 0.8, FLIPEUR_CENTRE[1], FLIPEUR_CENTRE[2] + Math.cos(a) * 0.8] as V3,
    flipeurCap: a + Math.PI / 2,
    traces: interpolate(t, [R.traces + 0.2, R.traces + 1.2], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
    perroquet: pop(R.voleur + 0.4),
    ilotF: pop(R.theo - 0.3), villa: pop(R.theo + 0.1), boucherie: pop(R.tornade + 0.1), balancoire: pop(R.wizzy + 0.1),
    casquette: pop(R.sayan + 0.1), fils: pop(R.sayan + 0.3), etiqFils: dans(t, R.sayan, R.kaki) ? 1 : 0,
    lucarne: pop(R.kaki + 0.2),
    etiqAeroport: 0, // en gros plan, les étiquettes 3D recouvraient le titre
    etiqDestination: 0,
    mats: MATS.map((_, i) => pop(R.drapeaux + 0.1 + i * 0.08)),
  };
};

const Monde5: React.FC<{t: number}> = ({t}) => {
  const s = useScene(t);
  return (
    <Monde etat={s.etat} cabanesDef={CABANES_EP03} parcellesVote={[]}>
      <Plages g={1} d={1} />
      <Ilot c={EXT_B} r={2.6} e={1} />
      <Ilot c={EXT_A} r={2.4} e={1} />
      <Ilot c={EXT_F} r={2.2} e={s.ilotF} />
      <group position={ABRI}><Abri e={ABRI_ECHELLE} /></group>
      <Restaurant e={1} gateau={0} etiq={0} />
      <Jacuzzi e={1} etiq={0} />
      <ChatNoir e={1} etiq={0} />
      <Puits e={1} />
      <DecoFoot e={1} />
      <SceneCalvin e={1} etiq={0} />
      <Patisserie e={1} etiq={0} />
      <MaisonPiscine e={1} etiq={0} />
      <Mosquee e={1} etiq={0} />
      <PetitChien e={1} etiq={0} />
      <Chihuahua e={1} etiq={0} chapeau={0} />
      <Flipeur v={1} p={s.flipeurP} cap={s.flipeurCap} coeur={0} etiq={0} />
      <CabanePecheur e={1} />
      <Stade e={1} />
      <Chateau e={1} />
      <MaisonPaillettes e={1} />
      <BoulangerieHalloween e={1} />
      <CabaneGateau e={1} />
      <Aeroport e={1} decollage={0} etiq={s.etiqAeroport} />
      <Etiquette texte="DESTINATION : ?" position={add(AVION, [0, 1.0, 0])} echelle={s.etiqDestination} hauteur={0.32} fond="#2b1a00" encre="#ffc928" />
      <Panier e={1} />
      <Traces v={s.traces} />
      <Perroquet e={s.perroquet} />
      <VillaPoisson e={s.villa} />
      <Boucherie e={s.boucherie} />
      <BalancoireNoel e={s.balancoire} />
      <Casquette p={add(ROBIN, [0, 2.12, 0])} s={s.casquette * 1.15} />
      {s.fils > 0.001 && <Naufrage p={FILS} graine={4} echelle={s.fils * 1.3} />}
      <Casquette p={add(FILS, [0, 0.9, 0])} s={s.fils * 0.5} />
      <Etiquette texte="@abonne_140 · FILS DU CAPITAINE" position={add(FILS, [0, 1.3, 0])} echelle={s.etiqFils} hauteur={0.13} fond="#1b2a4a" encre="#ffc928" />
      <Lucarne e={s.lucarne} />
      <Mats v={s.mats} />
    </Monde>
  );
};

/* ------------------------------------------------------------------ habillage */

const TITRES: DefTitre[] = [
  {de: 0, petit: "L'AVION VA", grand: 'DÉCOLLER !'},
  {de: R.traces, petit: 'VOUS AVEZ SUIVI', grand: 'LES TRACES…'},
  {de: R.aeroport, petit: 'ELLES MÈNENT', grand: "À L'AÉROPORT !"},
  {de: R.voleur, petit: 'LE VOLEUR ?', grand: 'UN PERROQUET !'},
  {de: R.theo, petit: '@ABONNE_152', grand: 'VILLA-POISSON'},
  {de: R.tornade, petit: '@ABONNE_153', grand: 'UNE BOUCHERIE'},
  {de: R.wizzy, petit: '@ABONNE_130', grand: 'BALANÇOIRE DE NOËL'},
  {de: R.sayan, petit: '@ABONNE_140', grand: 'FILS DU CAPITAINE'},
  {de: R.kaki, petit: '@ABONNE_135', grand: 'LUCARNE MAGIQUE'},
  {de: R.comete, petit: 'LE DIRECTEUR @ABONNE_151', grand: 'A BESOIN DE VOUS'},
  {de: R.seul, petit: "L'AVION NE VA QUE DANS", grand: '1 SEUL PAYS'},
  {de: R.ecris, petit: 'ÉCRIS TON PAYS', grand: 'EN COMMENTAIRE'},
  {de: R.plus, petit: 'LE PAYS LE PLUS CITÉ', grand: 'GAGNE !'},
  {de: R.drapeaux, petit: 'CHAQUE PAYS CITÉ', grand: 'A SON DRAPEAU'},
  {de: R.tuviens, petit: 'ET TOI…', grand: "TU VIENS D'OÙ ?"},
];

const PAQUETS = fairePaquets(voix, {
  2: '*décoller…*', 5: '*ton*', 6: '*pays*', 15: '*traces.*', 21: "*l'aéroport !*", 22: '', 24: '*voleur ?*', 25: '', 27: '*perroquet,*',
  36: '*Théo*', 43: '*poisson,*', 44: '*Tornade*', 46: '*boucherie,*', 48: '*Wizzy*', 52: '*Noël.*', 53: '*Sayan*', 58: '*capitaine.*',
  60: '*Galet*', 64: '*magique.*', 68: '*Comete*', 72: '*vous :*', 73: '', 81: '*seul*', 82: '*pays.*', 85: '*pays*', 87: '*commentaire.*',
  91: '*gagne.*', 98: '*drapeau*', 103: "*d'où ?*", 104: '', 105: '*Abonne-toi*', 110: '*pays*', 111: '*gagne.*',
});

const BULLES: DefBulle[] = [
  {de: R.theo + 0.15, a: R.tornade, pseudo: '@abonne_152', texte: 'une belle maison en forme de poisson, une villa', x: 70, y: 560, rot: -2},
  {de: R.tornade + 0.1, a: R.wizzy, pseudo: '@abonne_153', texte: 'une boucherie stp', x: 120, y: 560, rot: 2},
  {de: R.wizzy + 0.1, a: R.sayan, pseudo: '@abonne_130', texte: 'une balançoire thème Noël stp', x: 90, y: 560, rot: -2},
  {de: R.sayan + 0.15, a: R.kaki, pseudo: '@abonne_140', texte: 'est-ce que je peux être le fils du capitaine 🥺', x: 60, y: 445, rot: 2},
  {de: R.kaki + 0.15, a: R.comete, pseudo: '@abonne_135', texte: 'une lucarne dans le stade : tu la touches, tu te téléportes', x: 60, y: 560, rot: -2},
];

/* ------------------------------------------------------------------ composition */

export const IleTikTokEp05: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / 30;
  const {width, height} = useVideoConfig();
  const pret = usePolicesPretes();
  return (
    <AbsoluteFill style={{background: '#8fd6f6'}}>
      {pret && (
        <ThreeCanvas width={width} height={height} shadows camera={{fov: 40, near: 0.1, far: 300}} gl={{antialias: true}}>
          <Monde5 t={t} />
        </ThreeCanvas>
      )}
      <PluieDrapeaux t={t} de={R.ecris} />
      <Titre t={t} titres={TITRES} />
      <RondeDrapeaux t={t} de={0} a={R.traces} />
      <Bulles t={t} bulles={BULLES} />
      <BulleExemple t={t} de={R.ecris + 0.3} a={R.drapeaux} />
      <SousTitre t={t} paquets={PAQUETS} />
      <BoutonAbonne t={t} de={R.abonne + 0.1} />
      <Confettis t={t} de={R.voleur + 0.5} a={R.theo} />
      <Confettis t={t} de={R.abonne + 1.12} />
      <Audio src={staticFile('ile/tiktok_ep05_voix.wav')} />
    </AbsoluteFill>
  );
};
