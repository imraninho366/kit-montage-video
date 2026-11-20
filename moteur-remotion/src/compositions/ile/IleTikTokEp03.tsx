import {ThreeCanvas} from '@remotion/three';
import {AbsoluteFill, Audio, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import * as THREE from 'three';
import voix from './tiktok_ep03_voix.json';
import {Abri, DefCabane, Etat, Monde, Naufrage} from './Ile3D';
import {
  ABRI, ABRI_ECHELLE, BATEAU, CABANES_TT, ChatNoir, JACUZZI, Jacuzzi, MaisonBateau, Puits, ROBIN, ROBIN_ABRI, ROBIN_YEUX, Restaurant, VOTE as VOTE_EP02,
} from './IleTikTokEp02';
import {Etiquette, VolumeMystere, useMat} from './outils3d';
import {
  BoutonAbonne, Bulles, Confettis, DefBulle, DefTitre, JaugeEau, SousTitre, Titre, fairePaquets, usePolicesPretes,
} from './habillage';

/**
 * L'Île des Abonnés — branche TikTok, épisode 3 (relevé du 09/11/2026 : A puits gagne, 6 votants contre 3 et 1).
 * Toutes les demandes : puits foot (@abonne_135), scène (@abonne_136), cabane blanche (@abonne_137), pâtisserie (@abonne_138),
 * maison sous une piscine (@abonne_139), 2e cabane en or (@abonne_140), petit chien (@abonne_141), chihuahua d'anniversaire
 * (@abonne_142), plus de sable (@abonne_143), mosquée (@abonne_144), Robin dans le jacuzzi (@abonne_145).
 * La tempête frappe : la cabane-bateau de @abonne_124 part en mer, puis un requin tourne autour de l'île.
 * Nouveau vote : A une barrière, B un piège, C l'apprivoiser.
 */

const FIN = voix.duree + 0.9;
export const DUREE_ILE_TT_EP03 = Math.ceil(FIN * 30);
const T = (i: number) => voix.mots[i].a - 0.08;

const R = {
  gagnant: T(4), kaki: T(9), foot: T(13), eau: T(15), scene: T(22), blanche: T(26), patis: T(31), piscine: T(35), or2: T(40),
  chiens: T(46), chihua: T(51), sable: T(53), mosquee: T(57), nuit: T(62), abri: T(69), bateau: T(72), requin: T(82),
  vote: T(90), A: T(94), B: T(97), C: T(100), commente: T(102), abonne: T(107),
};

type V3 = [number, number, number];
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const mix = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const dans = (t: number, a: number, b: number) => t >= a && t < b;

/* ------------------------------------------------------------------ plan de l'île (branche TikTok, état après l'épisode 3) */

export const PUITS: V3 = VOTE_EP02[0];
// « encore plus de sable » : deux nouvelles plages, à gauche et à droite
export const EXT_G: V3 = [-5.6, 0, 0.6];
export const EXT_D: V3 = [5.6, 0, 0.2];
const SCENE: V3 = [-5.3, 0.4, -0.3];
const BLANCHE: V3 = [-4.5, 0.4, 1.9];
const MOSQUEE: V3 = [-6.4, 0.4, 1.2];
const PATIS: V3 = [5.0, 0.4, -0.8];
const PISCINE: V3 = [6.2, 0.4, 0.6];
const OR2: V3 = [4.8, 0.4, 1.6];
const CHIHUA: V3 = [0.2, 0.4, 3.05];
const CHIEN: V3 = [-0.4, 0.4, 3.3];
const ROBIN_JACUZZI: V3 = [JACUZZI[0] - 0.12, 0.4, JACUZZI[2] + 0.12];
export const VOTE: V3[] = [[-2.2, 0.08, 5.0], [0.2, 0.08, 5.4], [2.4, 0.08, 5.0]]; // sur le lagon, devant l'île
const LARGE: V3 = [6.5, 0.0, 6.8]; // la cabane-bateau dérive jusque-là

export const CABANES_EP03: DefCabane[] = [
  ...CABANES_TT,
  {p: BLANCHE, c: '#ffffff', murs: '#f4f4f4', pseudo: '@abonne_137'},
  {p: OR2, c: '#ffb800', pseudo: '@abonne_140', or: true},
];

/* ------------------------------------------------------------------ nouvelles constructions */

export const Plages: React.FC<{g: number; d: number}> = ({g, d}) => {
  const sable = useMat('#f3d58b');
  const lagon = useMat('#62d8d6', {transparent: true, opacity: 0.85});
  const roche = useMat('#9aa3ad');
  return (
    <>
      {([[EXT_G, g], [EXT_D, d]] as [V3, number][]).map(([c, e], i) => e > 0.001 && (
        <group key={i} position={c}>
          <mesh material={lagon} position={[0, 0.025, 0]} scale={[e, 1, e]}><cylinderGeometry args={[3.2, 3.5, 0.1, 18]} /></mesh>
          <mesh material={sable} position={[0, -0.5 + 0.45 * e, 0]} scale={[1, e, 1]} receiveShadow castShadow><cylinderGeometry args={[2.3, 2.7, 0.9, 14]} /></mesh>
          {[[1.2, 1.3, 0.3], [-1.0, -1.4, 0.25]].map(([x, z, r], j) => (
            <mesh key={j} material={roche} position={[x * (i ? -1 : 1), 0.36 * Math.min(1, e), z]} rotation={[j, j * 2, 0]} castShadow><dodecahedronGeometry args={[r * Math.min(1, e), 0]} /></mesh>
          ))}
        </group>
      ))}
    </>
  );
};

const Ballon: React.FC<{p: V3; s?: number}> = ({p, s = 1}) => {
  const blanc = useMat('#ffffff');
  const noir = useMat('#1b1d24');
  return (
    <group position={p} scale={s}>
      <mesh material={blanc} castShadow><icosahedronGeometry args={[0.11, 1]} /></mesh>
      {[[0, 0.1, 0.03], [0.08, 0.02, 0.07], [-0.08, 0.03, 0.06], [0.02, -0.05, 0.1]].map(([x, y, z], i) => (
        <mesh key={i} material={noir} position={[x, y, z]}><icosahedronGeometry args={[0.035, 0]} /></mesh>
      ))}
    </group>
  );
};

/** Ballons, bande verte et petit but autour du puits (@abonne_135). */
export const DecoFoot: React.FC<{e: number}> = ({e}) => {
  const blanc = useMat('#ffffff');
  const filet = useMat('#ffffff', {transparent: true, opacity: 0.35, side: THREE.DoubleSide});
  const vert = useMat('#2bb34a', {side: THREE.DoubleSide});
  if (e <= 0.001) return null;
  return (
    <group position={PUITS} scale={e}>
      <mesh material={vert} position={[0, 0.44, 0]}><cylinderGeometry args={[0.56, 0.56, 0.07, 14, 1, true]} /></mesh>
      <Ballon p={[0.4, 0.5, 0.18]} />
      <Ballon p={[-0.36, 0.5, 0.26]} />
      <Ballon p={[0, 1.3, 0]} s={1.3} />
      <Ballon p={[0.75, 0.11, 0.55]} />
      <group position={[-0.9, 0, 0.25]} rotation={[0, 0.5, 0]}>
        {[-1, 1].map((s) => <mesh key={s} material={blanc} position={[s * 0.42, 0.3, 0]} castShadow><cylinderGeometry args={[0.03, 0.03, 0.6, 6]} /></mesh>)}
        <mesh material={blanc} position={[0, 0.6, 0]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.03, 0.03, 0.87, 6]} /></mesh>
        <mesh material={filet} position={[0, 0.3, -0.2]} rotation={[-0.35, 0, 0]}><planeGeometry args={[0.84, 0.65]} /></mesh>
      </group>
    </group>
  );
};

export const Scene: React.FC<{e: number; etiq: number}> = ({e, etiq}) => {
  const frame = useCurrentFrame();
  const plateau = useMat('#3b2b5a');
  const bord = useMat('#ffc928', {emissive: '#ffb300', emissiveIntensity: 0.6});
  const noir = useMat('#1b1d24');
  const gris = useMat('#8a8f99');
  const spot = useMat('#fff3a0', {emissive: '#ffe066', emissiveIntensity: 1.2});
  const faisceau = useMat('#fff3a0', {transparent: true, opacity: 0.22, emissive: '#ffe066', emissiveIntensity: 0.5, side: THREE.DoubleSide});
  if (e <= 0.001) return null;
  return (
    <group position={SCENE} rotation={[0, 0.25, 0]}>
      <group scale={e}>
        <mesh material={plateau} position={[0, 0.15, 0]} castShadow receiveShadow><boxGeometry args={[1.9, 0.3, 1.2]} /></mesh>
        <mesh material={bord} position={[0, 0.31, 0.6]}><boxGeometry args={[1.9, 0.04, 0.04]} /></mesh>
        {[-1, 1].map((s) => <mesh key={s} material={noir} position={[s * 0.9, 1.05, -0.5]} castShadow><boxGeometry args={[0.08, 1.8, 0.08]} /></mesh>)}
        <mesh material={noir} position={[0, 1.92, -0.5]}><boxGeometry args={[1.88, 0.08, 0.08]} /></mesh>
        {[-0.5, 0.5].map((x, i) => (
          <group key={x}>
            <mesh material={spot} position={[x, 1.8, -0.4]} rotation={[0.6, 0, 0]}><cylinderGeometry args={[0.07, 0.11, 0.18, 8]} /></mesh>
            <mesh material={faisceau} position={[x * 0.8, 1.05, -0.05]} rotation={[0.45 + Math.sin(frame / 12 + i) * 0.08, 0, 0]}><coneGeometry args={[0.38, 1.5, 12, 1, true]} /></mesh>
          </group>
        ))}
        {[-1, 1].map((s) => (
          <group key={s} position={[s * 1.15, 0.3, 0.2]}>
            <mesh material={noir} castShadow><boxGeometry args={[0.3, 0.6, 0.3]} /></mesh>
            <mesh material={gris} position={[0, 0.05, 0.155]}><circleGeometry args={[0.1, 12]} /></mesh>
          </group>
        ))}
        <mesh material={gris} position={[0.1, 0.6, 0.35]}><cylinderGeometry args={[0.015, 0.015, 0.6, 5]} /></mesh>
        <mesh material={noir} position={[0.1, 0.93, 0.35]}><sphereGeometry args={[0.045, 8, 6]} /></mesh>
        {/* quelqu'un danse déjà dessus */}
        <Naufrage p={[-0.3, 0.3, 0]} graine={5} />
      </group>
      <Etiquette texte="@abonne_136" position={[0, 2.4 * e, 0]} echelle={etiq * e} hauteur={0.34} />
    </group>
  );
};

export const Patisserie: React.FC<{e: number; etiq: number}> = ({e, etiq}) => {
  const rose = useMat('#ffb3c7');
  const blanc = useMat('#fff7fa');
  const vitre = useMat('#bfe9ff', {roughness: 0.2});
  const papier = useMat('#e0a96d');
  const creme = useMat('#ffe0ec');
  const cerise = useMat('#e0283f');
  const porte = useMat('#8b5a2b');
  if (e <= 0.001) return null;
  return (
    <group position={PATIS} rotation={[0, -0.3, 0]}>
      <group scale={e}>
        <mesh material={rose} position={[0, 0.43, 0]} castShadow receiveShadow><boxGeometry args={[1.2, 0.86, 0.9]} /></mesh>
        <mesh material={vitre} position={[-0.28, 0.4, 0.455]}><boxGeometry args={[0.45, 0.35, 0.02]} /></mesh>
        <mesh material={porte} position={[0.3, 0.27, 0.455]}><boxGeometry args={[0.26, 0.48, 0.02]} /></mesh>
        {Array.from({length: 5}).map((_, i) => (
          <mesh key={i} material={i % 2 ? blanc : rose} position={[-0.48 + i * 0.24, 0.95, 0.55]} rotation={[0.45, 0, 0]} castShadow><boxGeometry args={[0.24, 0.04, 0.4]} /></mesh>
        ))}
        {/* cupcake géant sur le toit */}
        <mesh material={papier} position={[0, 1.0, -0.05]} castShadow><cylinderGeometry args={[0.28, 0.22, 0.26, 12]} /></mesh>
        <mesh material={creme} position={[0, 1.28, -0.05]} castShadow><coneGeometry args={[0.32, 0.4, 12]} /></mesh>
        <mesh material={cerise} position={[0, 1.52, -0.05]}><sphereGeometry args={[0.07, 10, 8]} /></mesh>
      </group>
      <Etiquette texte="@abonne_138" position={[0, 2.0 * e, 0]} echelle={etiq * e} hauteur={0.34} />
    </group>
  );
};

export const MaisonPiscine: React.FC<{e: number; etiq: number}> = ({e, etiq}) => {
  const frame = useCurrentFrame();
  const murs = useMat('#e8eef2');
  const fenetre = useMat('#3f7fd9', {roughness: 0.3});
  const rebord = useMat('#ffffff');
  const eau = useMat('#56dcff', {emissive: '#1aa6cf', emissiveIntensity: 0.45, roughness: 0.2});
  const metal = useMat('#c8ccd2');
  if (e <= 0.001) return null;
  return (
    <group position={PISCINE} rotation={[0, -0.5, 0]}>
      <group scale={e}>
        <mesh material={murs} position={[0, 0.4, 0]} castShadow receiveShadow><boxGeometry args={[1.15, 0.8, 1.0]} /></mesh>
        {[-0.3, 0.3].map((x) => <mesh key={x} material={fenetre} position={[x, 0.45, 0.505]}><boxGeometry args={[0.26, 0.26, 0.02]} /></mesh>)}
        {/* la piscine sur le toit */}
        <mesh material={rebord} position={[0, 0.84, 0]}><boxGeometry args={[1.25, 0.08, 1.1]} /></mesh>
        {[-0.53, 0.53].map((z) => <mesh key={z} material={rebord} position={[0, 0.98, z]}><boxGeometry args={[1.25, 0.22, 0.06]} /></mesh>)}
        {[-0.6, 0.6].map((x) => <mesh key={x} material={rebord} position={[x, 0.98, 0]}><boxGeometry args={[0.06, 0.22, 1.1]} /></mesh>)}
        <mesh material={eau} position={[0, 0.98, 0]}><boxGeometry args={[1.14, 0.14, 1.0]} /></mesh>
        {[-0.12, 0.12].map((z) => <mesh key={z} material={metal} position={[0.66, 1.15, z]} rotation={[0, 0, 0.2]}><cylinderGeometry args={[0.015, 0.015, 0.5, 5]} /></mesh>)}
        {/* un naufragé se baigne */}
        <group position={[0.1, 0.92 + Math.sin(frame / 9) * 0.02, 0.1]}><Naufrage p={[0, 0, 0]} graine={6} echelle={0.85} /></group>
      </group>
      <Etiquette texte="@abonne_139" position={[0, 2.0 * e, 0]} echelle={etiq * e} hauteur={0.34} />
    </group>
  );
};

export const Mosquee: React.FC<{e: number; etiq: number}> = ({e, etiq}) => {
  const blanc = useMat('#f5f1e8');
  const vert = useMat('#2e9e6a');
  const or = useMat('#ffc928', {emissive: '#b88a00', emissiveIntensity: 0.3});
  const sombre = useMat('#3a2a1c');
  if (e <= 0.001) return null;
  return (
    <group position={MOSQUEE} rotation={[0, 0.35, 0]}>
      <group scale={e}>
        <mesh material={blanc} position={[0, 0.38, 0]} castShadow receiveShadow><boxGeometry args={[1.1, 0.76, 1.1]} /></mesh>
        <mesh material={blanc} position={[0, 0.84, 0]}><cylinderGeometry args={[0.4, 0.4, 0.16, 16]} /></mesh>
        <mesh material={vert} position={[0, 0.92, 0]} castShadow><sphereGeometry args={[0.41, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2]} /></mesh>
        <mesh material={or} position={[0, 1.4, 0]}><cylinderGeometry args={[0.012, 0.012, 0.12, 5]} /></mesh>
        <mesh material={or} position={[0, 1.48, 0]}><sphereGeometry args={[0.045, 8, 6]} /></mesh>
        <mesh material={sombre} position={[0, 0.22, 0.555]}><boxGeometry args={[0.26, 0.42, 0.02]} /></mesh>
        <mesh material={sombre} position={[0, 0.43, 0.555]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.13, 0.13, 0.02, 12, 1, false, 0, Math.PI]} /></mesh>
        <group position={[0.48, 0, -0.48]}>
          <mesh material={blanc} position={[0, 0.95, 0]} castShadow><cylinderGeometry args={[0.1, 0.12, 1.9, 10]} /></mesh>
          <mesh material={blanc} position={[0, 1.55, 0]}><cylinderGeometry args={[0.16, 0.16, 0.06, 10]} /></mesh>
          <mesh material={vert} position={[0, 2.05, 0]} castShadow><coneGeometry args={[0.12, 0.32, 10]} /></mesh>
        </group>
      </group>
      <Etiquette texte="@abonne_144" position={[0, 2.6 * e, 0]} echelle={etiq * e} hauteur={0.34} />
    </group>
  );
};

export const Chihuahua: React.FC<{e: number; etiq: number; chapeau: number}> = ({e, etiq, chapeau}) => {
  const frame = useCurrentFrame();
  const poil = useMat('#d9a066');
  const rose = useMat('#f7b7b0');
  const noir = useMat('#1a1410', {roughness: 0.3});
  const fete = useMat('#fe2c55');
  const pompon = useMat('#ffc928');
  if (e <= 0.001) return null;
  const saut = Math.max(0, Math.sin(frame / 4)) * 0.04;
  return (
    <group position={CHIHUA}>
      <group scale={e * 1.5} position={[0, saut, 0]} rotation={[0, -0.2, 0]}>
        <mesh material={poil} position={[0, 0.17, -0.02]} scale={[0.8, 0.75, 1.2]} castShadow><icosahedronGeometry args={[0.13, 1]} /></mesh>
        {[[-0.05, 0.08], [0.05, 0.08], [-0.05, -0.1], [0.05, -0.1]].map(([x, z], i) => (
          <mesh key={i} material={poil} position={[x, 0.06, z]}><cylinderGeometry args={[0.02, 0.02, 0.12, 5]} /></mesh>
        ))}
        <mesh material={poil} position={[0, 0.32, 0.11]} castShadow><icosahedronGeometry args={[0.1, 1]} /></mesh>
        {[-1, 1].map((s) => (
          <group key={s}>
            <mesh material={poil} position={[s * 0.085, 0.44, 0.09]} rotation={[0, 0, s * -0.55]}><coneGeometry args={[0.055, 0.15, 4]} /></mesh>
            <mesh material={rose} position={[s * 0.083, 0.43, 0.1]} rotation={[0, 0, s * -0.55]}><coneGeometry args={[0.03, 0.1, 4]} /></mesh>
            <mesh material={noir} position={[s * 0.04, 0.34, 0.2]}><sphereGeometry args={[0.022, 8, 6]} /></mesh>
          </group>
        ))}
        <mesh material={noir} position={[0, 0.3, 0.215]}><sphereGeometry args={[0.014, 6, 5]} /></mesh>
        {chapeau > 0.001 && (
          <group position={[0, 0.42, 0.1]} scale={chapeau}>
            <mesh material={fete} position={[0, 0.07, 0]}><coneGeometry args={[0.05, 0.15, 10]} /></mesh>
            <mesh material={pompon} position={[0, 0.155, 0]}><sphereGeometry args={[0.022, 6, 5]} /></mesh>
          </group>
        )}
      </group>
      <Etiquette texte="@abonne_142" position={[0, 1.0 * e, 0]} echelle={etiq * e} hauteur={0.28} />
    </group>
  );
};

export const PetitChien: React.FC<{e: number; etiq: number}> = ({e, etiq}) => {
  const frame = useCurrentFrame();
  const blanc = useMat('#f4f1ea');
  const brun = useMat('#8a5a3b');
  const noir = useMat('#1a1410', {roughness: 0.3});
  if (e <= 0.001) return null;
  return (
    <group position={CHIEN}>
      <group scale={e * 1.5} rotation={[0, 0.3, 0]}>
        <mesh material={blanc} position={[0, 0.18, -0.02]} scale={[0.85, 0.75, 1.3]} castShadow><icosahedronGeometry args={[0.14, 1]} /></mesh>
        {[[-0.06, 0.09], [0.06, 0.09], [-0.06, -0.12], [0.06, -0.12]].map(([x, z], i) => (
          <mesh key={i} material={blanc} position={[x, 0.06, z]}><cylinderGeometry args={[0.025, 0.025, 0.12, 5]} /></mesh>
        ))}
        <mesh material={blanc} position={[0, 0.33, 0.13]} castShadow><icosahedronGeometry args={[0.11, 1]} /></mesh>
        <mesh material={blanc} position={[0, 0.3, 0.22]}><boxGeometry args={[0.09, 0.07, 0.08]} /></mesh>
        <mesh material={noir} position={[0, 0.32, 0.265]}><sphereGeometry args={[0.02, 6, 5]} /></mesh>
        {[-1, 1].map((s) => (
          <group key={s}>
            <mesh material={brun} position={[s * 0.11, 0.31, 0.11]} rotation={[0, 0, s * 0.25]}><boxGeometry args={[0.04, 0.13, 0.08]} /></mesh>
            <mesh material={noir} position={[s * 0.045, 0.36, 0.22]}><sphereGeometry args={[0.02, 8, 6]} /></mesh>
          </group>
        ))}
        <mesh material={brun} position={[0.04, 0.24, 0.0]}><icosahedronGeometry args={[0.06, 0]} /></mesh>
        <group position={[0, 0.22, -0.18]} rotation={[-0.7, 0, Math.sin(frame / 3) * 0.6]}>
          <mesh material={blanc} position={[0, 0.07, 0]}><cylinderGeometry args={[0.015, 0.02, 0.14, 5]} /></mesh>
        </group>
      </group>
      <Etiquette texte="@abonne_141" position={[0, 1.0 * e, 0]} echelle={etiq * e} hauteur={0.28} />
    </group>
  );
};

/** Le requin : un aileron qui tourne autour de l'île, le dos à fleur d'eau. */
const Requin: React.FC<{v: number; angle: number}> = ({v, angle}) => {
  const gris = useMat('#6f7f8f');
  const noir = useMat('#111111');
  if (v <= 0.001) return null;
  const r = 7;
  const p: V3 = [Math.sin(angle) * r, -0.12, Math.cos(angle) * r];
  const cap = Math.atan2(Math.cos(angle), -Math.sin(angle));
  return (
    <group position={p} rotation={[0, cap, 0]} scale={v}>
      <mesh material={gris} scale={[0.55, 0.42, 1.9]}><icosahedronGeometry args={[0.5, 1]} /></mesh>
      <mesh material={gris} position={[0, 0.5, -0.05]} rotation={[-0.35, 0, 0]} scale={[0.25, 1, 1]}><coneGeometry args={[0.28, 0.75, 4]} /></mesh>
      <mesh material={gris} position={[0, 0.15, -1.05]} rotation={[-1.1, 0, 0]} scale={[0.2, 1, 1]}><coneGeometry args={[0.25, 0.6, 4]} /></mesh>
      {[-1, 1].map((s) => <mesh key={s} material={noir} position={[s * 0.2, 0.08, 0.68]}><sphereGeometry args={[0.04, 8, 6]} /></mesh>)}
    </group>
  );
};

/* aperçus du vote */

const Barriere: React.FC<{e: number}> = ({e}) => {
  const bois = useMat('#8b5a2b');
  const pointe = useMat('#c58b4e');
  const corde = useMat('#e8d8a8');
  if (e <= 0.001) return null;
  return (
    <group position={VOTE[0]} scale={e} rotation={[0, 0.3, 0]}>
      {Array.from({length: 9}).map((_, i) => (
        <group key={i} position={[(i - 4) * 0.2, 0, -Math.abs(i - 4) * 0.04]}>
          <mesh material={bois} position={[0, 0.4, 0]} castShadow><cylinderGeometry args={[0.055, 0.055, 0.8, 6]} /></mesh>
          <mesh material={pointe} position={[0, 0.88, 0]}><coneGeometry args={[0.055, 0.16, 6]} /></mesh>
        </group>
      ))}
      {[0.3, 0.6].map((y) => <mesh key={y} material={corde} position={[0, y, 0.02]}><boxGeometry args={[1.7, 0.03, 0.03]} /></mesh>)}
    </group>
  );
};

export const Piege: React.FC<{e: number}> = ({e}) => {
  const frame = useCurrentFrame();
  const bois = useMat('#8b5a2b');
  const poisson = useMat('#7fb7d9');
  if (e <= 0.001) return null;
  const s = 0.42;
  const aretes: [V3, V3][] = [];
  for (const a of [-s, s]) for (const b of [-s, s]) {
    aretes.push([[a, s, b], [0.03, 2 * s, 0.03]]);
    aretes.push([[0, b + s, a], [2 * s, 0.03, 0.03]]);
    aretes.push([[a, b + s, 0], [0.03, 0.03, 2 * s]]);
  }
  return (
    <group position={VOTE[1]} scale={e}>
      {aretes.map(([p, d], i) => <mesh key={i} material={bois} position={p} castShadow><boxGeometry args={d} /></mesh>)}
      {[-0.21, 0, 0.21].map((x) => <mesh key={x} material={bois} position={[x, s, s]}><boxGeometry args={[0.025, 2 * s, 0.025]} /></mesh>)}
      <group position={[0, 0.55 + Math.sin(frame / 8) * 0.03, 0]} rotation={[0, 0, Math.PI / 2]}>
        <mesh material={poisson} scale={[1, 0.55, 0.35]}><icosahedronGeometry args={[0.16, 0]} /></mesh>
      </group>
    </group>
  );
};

const Apprivoiser: React.FC<{e: number}> = ({e}) => {
  const frame = useCurrentFrame();
  const bois = useMat('#a8743f');
  const seau = useMat('#3f7fd9');
  const poisson = useMat('#7fb7d9');
  const coeur = useMat('#ff5c8a', {emissive: '#ff2d6f', emissiveIntensity: 0.5, side: THREE.DoubleSide});
  if (e <= 0.001) return null;
  return (
    <group position={VOTE[2]} scale={e}>
      {[-0.3, -0.1, 0.1, 0.3].map((o) => (
        <mesh key={o} material={bois} position={[o, 0.06, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow><cylinderGeometry args={[0.1, 0.1, 1.0, 6]} /></mesh>
      ))}
      <mesh material={seau} position={[0, 0.27, 0]} castShadow><cylinderGeometry args={[0.16, 0.13, 0.26, 10]} /></mesh>
      {[0, 1].map((i) => (
        <mesh key={i} material={poisson} position={[i * 0.06 - 0.03, 0.44, 0]} rotation={[0, i, 1.2]} scale={[1, 0.5, 0.35]}><icosahedronGeometry args={[0.1, 0]} /></mesh>
      ))}
      <group position={[0, 1.0 + Math.sin(frame / 7) * 0.06, 0]} scale={1 + Math.sin(frame / 5) * 0.08}>
        {[-1, 1].map((k) => <mesh key={k} material={coeur} position={[k * 0.1, 0.06, 0]}><sphereGeometry args={[0.13, 14, 10]} /></mesh>)}
        <mesh material={coeur} position={[0, -0.1, 0]} rotation={[0, 0, Math.PI]}><coneGeometry args={[0.215, 0.3, 14]} /></mesh>
      </group>
    </group>
  );
};

/* ------------------------------------------------------------------ caméra */

type Plan = {de: number; p0: V3; p1: V3; c: V3};
const [VA, VB, VC] = VOTE;
const PLANS: Plan[] = [
  {de: 0, p0: [12, 10, 16], p1: [9, 7.5, 12], c: [0, 0.6, 0]},
  {de: R.gagnant - 0.1, p0: add(PUITS, [1.3, 3.5, 1.8]), p1: add(PUITS, [1.1, 3.2, 1.5]), c: add(PUITS, [0, 0.7, 0])},
  {de: R.kaki, p0: add(PUITS, [-1.4, 2.2, 2.9]), p1: add(PUITS, [-1.2, 2.0, 2.5]), c: add(PUITS, [-0.35, 0.6, 0])},
  {de: R.eau, p0: [0.4, 1.95, 6.0], p1: [0.2, 1.9, 5.3], c: ROBIN_YEUX},
  {de: R.scene, p0: add(SCENE, [0.9, 2.3, 4.2]), p1: add(SCENE, [0.7, 2.1, 3.6]), c: add(SCENE, [0, 1.0, 0])},
  {de: R.blanche, p0: add(BLANCHE, [0.9, 1.6, 3.2]), p1: add(BLANCHE, [0.7, 1.5, 2.8]), c: add(BLANCHE, [0, 0.6, 0])},
  {de: R.patis, p0: add(PATIS, [-0.8, 2.2, 4.0]), p1: add(PATIS, [-0.6, 2.0, 3.4]), c: add(PATIS, [0, 0.9, 0])},
  {de: R.piscine, p0: add(PISCINE, [-1.0, 2.8, 3.6]), p1: add(PISCINE, [-0.8, 2.6, 3.1]), c: add(PISCINE, [0, 1.0, 0])},
  {de: R.or2, p0: add(OR2, [-0.6, 1.6, 3.2]), p1: add(OR2, [-0.5, 1.5, 2.8]), c: add(OR2, [0, 0.6, 0])},
  {de: R.chiens, p0: [0.8, 1.7, 6.9], p1: [0.7, 1.6, 6.3], c: [-0.1, 0.55, 3.15]},
  {de: R.chihua, p0: add(CHIHUA, [0.55, 0.95, 2.4]), p1: add(CHIHUA, [0.45, 0.85, 2.0]), c: add(CHIHUA, [0, 0.45, 0])},
  // l'île est maintenant longue (gauche-droite) : vue en diagonale pour qu'elle tienne dans le cadre vertical
  {de: R.sable, p0: [-15, 13, 7], p1: [-13.5, 12, 6.3], c: [0, 0.4, 0.3]},
  {de: R.mosquee, p0: add(MOSQUEE, [1.0, 2.4, 4.0]), p1: add(MOSQUEE, [0.8, 2.2, 3.4]), c: add(MOSQUEE, [0, 1.0, 0])},
  {de: R.nuit, p0: [0.5, 3.0, 10], p1: [0.4, 3.2, 9], c: [0, 1.2, -1]},
  {de: R.abri, p0: add(ROBIN_ABRI, [2.2, 1.3, 3.7]), p1: add(ROBIN_ABRI, [1.9, 1.3, 3.2]), c: add(ROBIN_ABRI, [0, 1.55, 0])},
  {de: R.bateau, p0: [0.5, 3.4, 9.8], p1: [0.8, 3.2, 9.2], c: [4.3, 0.5, 3.6]},
  {de: R.requin, p0: [2.6, 1.3, 8.2], p1: [2.9, 1.2, 7.6], c: [4.6, 0.3, 5.0]},
  {de: R.vote, p0: [0, 9, 15.5], p1: [0, 8.6, 14.6], c: [0.1, 0.3, 3.6]},
  {de: R.A, p0: add(VA, [0.9, 1.5, 2.8]), p1: add(VA, [0.75, 1.4, 2.4]), c: add(VA, [0, 0.45, 0])},
  {de: R.B, p0: add(VB, [0.9, 1.5, 2.8]), p1: add(VB, [0.75, 1.4, 2.4]), c: add(VB, [0, 0.5, 0])},
  {de: R.C, p0: add(VC, [-0.9, 1.5, 2.8]), p1: add(VC, [-0.75, 1.4, 2.4]), c: add(VC, [0, 0.55, 0])},
  {de: R.commente, p0: [0, 8.6, 14.6], p1: [0, 9.2, 15.6], c: [0.1, 0.3, 3.6]},
  {de: R.abonne, p0: add(ROBIN_JACUZZI, [0, 1.8, 3.2]), p1: add(ROBIN_JACUZZI, [0, 1.75, 2.5]), c: add(ROBIN_JACUZZI, [0, 1.45, 0])},
];

const camera = (t: number): Etat['cam'] => {
  const i = Math.max(0, PLANS.findIndex((p, k) => t >= p.de && t < (PLANS[k + 1]?.de ?? Infinity)));
  const p = PLANS[i];
  const fin = PLANS[i + 1]?.de ?? FIN;
  const u = interpolate(t, [p.de, fin], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return {pos: mix(p.p0, p.p1, u), cible: p.c, fov: 40};
};

/* ------------------------------------------------------------------ état */

const MILIEU_REQUIN = (R.requin + R.vote) / 2;

const useScene = (t: number) => {
  const {fps} = useVideoConfig();
  const pop = (de: number) => (t < de ? 0 : spring({frame: (t - de) * 30, fps, config: {damping: 11, stiffness: 170}}));
  const flash = (...debuts: number[]) => Math.max(0, ...debuts.map((d) => (t >= d && t < d + 0.17 ? 1 - (t - d) / 0.17 : 0)));
  const tempete = dans(t, R.nuit, R.requin);
  const large = dans(t, R.sable, R.mosquee);

  const etat: Etat = {
    cam: camera(t),
    robin: {
      humeur: dans(t, R.nuit, R.abonne) ? 'triste' : 'joyeux',
      position: dans(t, R.abri, R.bateau) ? ROBIN_ABRI : t >= R.abonne ? ROBIN_JACUZZI : ROBIN,
      rotY: dans(t, R.nuit, R.abri) ? Math.PI : 0,
      bras: t >= R.abonne || dans(t, R.eau, R.scene) ? 'salue' : 'repos',
    },
    pluie: tempete ? 1 : 0,
    orage: tempete ? interpolate(t, [R.nuit, R.nuit + 0.8], [0.3, 1], {extrapolateRight: 'clamp'}) : dans(t, R.requin, R.vote) ? 0.3 : 0,
    eclair: tempete ? flash(R.nuit + 0.8, R.nuit + 1.5, R.bateau + 0.5) : 0,
    cabanes: [...CABANES_TT.map(() => 1), pop(R.blanche + 0.1), pop(R.or2 + 0.05)],
    etiquettes: large ? 1 : 0,
    mysteres: [0, 1, 2].map((i) => pop(R.vote + 0.15 + i * 0.18) * (1 - pop([R.A, R.B, R.C][i] + 0.1))),
    lettres: dans(t, R.vote, R.A) || dans(t, R.commente, R.abonne) ? [0, 1, 2].map((i) => pop(R.vote + 0.35 + i * 0.18)) : [0, 0, 0],
  };
  const derive = interpolate(t, [R.bateau + 0.3, R.requin], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const bosse = large ? 1 + 0.05 * Math.sin(Math.min(1, (t - R.sable) / 0.6) * Math.PI) : 1;
  return {
    etat, etiq: large ? 1 : 0,
    mysterePuits: 1 - pop(R.gagnant - 0.05),
    puits: pop(R.gagnant), foot: pop(R.foot),
    plageG: pop(R.scene - 0.2) * bosse, plageD: pop(R.patis - 0.2) * bosse,
    scene: pop(R.scene + 0.1), patis: pop(R.patis + 0.1), piscine: pop(R.piscine + 0.1), mosquee: pop(R.mosquee + 0.1),
    chien: pop(R.chiens + 0.15), chihua: pop(R.chiens + 0.35), chapeau: pop(R.chihua + 0.2),
    bateau: t < R.requin ? 1 : 0,
    etiqBateau: large ? 1 : 0,
    bateauPos: mix(BATEAU, LARGE, derive),
    roulis: derive > 0 ? Math.sin(t * 5) * 0.18 * Math.min(1, derive * 4) : 0,
    requin: pop(R.requin), angleRequin: Math.PI / 4 + (t - MILIEU_REQUIN) * 0.45,
    barriere: pop(R.A + 0.15), piege: pop(R.B + 0.15), apprivoiser: pop(R.C + 0.15),
  };
};

const geoBloc = new THREE.BoxGeometry(1.4, 1.1, 1.4).translate(0, 0.55, 0);

const Monde3: React.FC<{t: number}> = ({t}) => {
  const s = useScene(t);
  return (
    <Monde etat={s.etat} cabanesDef={CABANES_EP03} parcellesVote={VOTE} tailleMystere={0.7}>
      <Plages g={s.plageG} d={s.plageD} />
      <group position={ABRI}><Abri e={ABRI_ECHELLE} /></group>
      <Restaurant e={1} gateau={0} etiq={s.etiq} />
      <MaisonBateau e={s.bateau} etiq={s.etiqBateau} p={s.bateauPos} roulis={s.roulis} />
      <Jacuzzi e={1} etiq={s.etiq} />
      <ChatNoir e={1} etiq={s.etiq} />
      <VolumeMystere geometrie={geoBloc} position={PUITS} echelle={s.mysterePuits} />
      <Puits e={s.puits} />
      <DecoFoot e={s.foot} />
      <Scene e={s.scene} etiq={s.etiq} />
      <Patisserie e={s.patis} etiq={s.etiq} />
      <MaisonPiscine e={s.piscine} etiq={s.etiq} />
      <Mosquee e={s.mosquee} etiq={s.etiq} />
      <PetitChien e={s.chien} etiq={s.etiq} />
      <Chihuahua e={s.chihua} etiq={s.etiq} chapeau={s.chapeau} />
      <Requin v={s.requin} angle={s.angleRequin} />
      <Barriere e={s.barriere} />
      <Piege e={s.piege} />
      <Apprivoiser e={s.apprivoiser} />
    </Monde>
  );
};

/* ------------------------------------------------------------------ habillage */

const TITRES: DefTitre[] = [
  {de: 0, petit: 'VOUS AVEZ', grand: 'CHOISI…'},
  {de: R.gagnant - 0.1, petit: 'CHOIX A', grand: 'LE PUITS !'},
  {de: R.kaki, petit: '@ABONNE_135 VOULAIT', grand: 'UN PUITS FOOT'},
  {de: R.eau, petit: 'ROBIN A ENFIN', grand: "DE L'EAU !"},
  {de: R.scene, petit: '@ABONNE_136', grand: 'UNE SCÈNE'},
  {de: R.blanche, petit: '@ABONNE_137', grand: 'CABANE BLANCHE'},
  {de: R.patis, petit: '@ABONNE_138', grand: 'UNE PÂTISSERIE'},
  {de: R.piscine, petit: '@abonne_139', grand: 'SOUS UNE PISCINE'},
  {de: R.or2, petit: '@ABONNE_140', grand: 'CABANE EN OR'},
  {de: R.chiens, petit: '@ABONNE_141', grand: 'UN PETIT CHIEN'},
  {de: R.chihua, petit: 'UN CHIHUAHUA POUR @ABONNE_142', grand: 'JOYEUX ANNIV !'},
  {de: R.sable, petit: '@ABONNE_143', grand: 'PLUS DE SABLE'},
  {de: R.mosquee, petit: '@ABONNE_144', grand: 'UNE MOSQUÉE'},
  {de: R.nuit, petit: 'MAIS CETTE NUIT…', grand: 'LA TEMPÊTE'},
  {de: R.abri, petit: "L'ABRI", grand: 'A TENU'},
  {de: R.bateau, petit: 'LA CABANE DE @ABONNE_124', grand: 'PARTIE EN MER !'},
  {de: R.requin, petit: 'ET MAINTENANT…', grand: 'UN REQUIN !'},
  {de: R.vote, petit: 'POUR SURVIVRE', grand: 'ON FAIT QUOI ?'},
  {de: R.A, petit: 'CHOIX A', grand: 'UNE BARRIÈRE'},
  {de: R.B, petit: 'CHOIX B', grand: 'UN PIÈGE'},
  {de: R.C, petit: 'CHOIX C', grand: "L'APPRIVOISER"},
  {de: R.commente, petit: 'COMMENTE', grand: 'A, B OU C'},
  {de: R.abonne, petit: 'ABONNE-TOI POUR SAVOIR', grand: "S'IL SURVIT"},
];

const PAQUETS = fairePaquets(voix, {
  4: '*A :*', 5: '', 7: '*puits !*', 8: '', 10: '*Galet*', 14: '*foot.*', 20: "*l'eau !*", 21: '',
  23: '*scène*', 25: '*Calvin.*', 28: '*blanche*', 30: '*Pixel.*', 32: '*pâtisserie*', 34: '*Brindille.*', 39: '*piscine…*',
  42: '*deuxième*', 45: '*or.*', 48: '*chiens,*', 51: '*chihuahua*', 52: "*d'anniversaire.*", 56: '*sable.*', 59: '*mosquée*',
  61: '*Zigzag.*', 66: '*tempête*', 68: '*frappé.*', 71: '*tenu.*', 74: '*cabane-bateau*', 76: '*Biscotte*', 80: '*mer !*', 81: '',
  85: '*requin*', 92: '*quoi ?*', 93: '', 94: '*A,*', 96: '*barrière.*', 97: '*B,*', 99: '*piège.*', 100: '*C,*',
  101: "*l'apprivoiser.*", 103: '*A,*', 104: '*B*', 106: '*C.*', 107: '*Abonne-toi*', 111: '*survit.*',
});

/** Les vrais commentaires du relevé (fautes de frappe corrigées, sens inchangé). */
const BULLES: DefBulle[] = [
  {de: 0.05, a: R.gagnant - 0.1, pseudo: '@abonne_136', texte: 'On fait le A', x: 120, y: 560, rot: -4},
  {de: 0.35, a: R.gagnant - 0.1, pseudo: '@abonne_146', texte: 'creuser un puits', x: 400, y: 760, rot: 3},
  {de: 0.65, a: R.gagnant - 0.1, pseudo: '@abonne_147', texte: 'A', x: 170, y: 960, rot: -2},
  {de: R.kaki + 0.2, a: R.eau, pseudo: '@abonne_135', texte: 'un puits décoré de plein de trucs de foot', x: 70, y: 560, rot: -2},
  {de: R.scene + 0.2, a: R.blanche, pseudo: '@abonne_136', texte: 'une scène pour chanter, danser, animer l’île', x: 70, y: 560, rot: 2},
  {de: R.blanche + 0.2, a: R.patis, pseudo: '@abonne_137', texte: 'une cabane blanche stp', x: 110, y: 560, rot: -2},
  {de: R.patis + 0.2, a: R.piscine, pseudo: '@abonne_138', texte: 'je veux une pâtisserie', x: 110, y: 560, rot: 2},
  {de: R.piscine + 0.2, a: R.or2, pseudo: '@abonne_139', texte: 'je veux une maison sous une piscine', x: 80, y: 560, rot: -2},
  {de: R.or2 + 0.2, a: R.chiens, pseudo: '@abonne_140', texte: 'je veux une cabane en or stp', x: 100, y: 560, rot: 2},
  {de: R.chiens + 0.2, a: R.chihua, pseudo: '@abonne_141', texte: 'je veux un petit chien', x: 110, y: 560, rot: -2},
  {de: R.chihua + 0.2, a: R.sable, pseudo: '@abonne_142', texte: 'un chiwawa, c’est mon aniv demain', x: 80, y: 560, rot: 2},
  {de: R.sable + 0.2, a: R.mosquee, pseudo: '@abonne_143', texte: 'mettre plus de sable', x: 130, y: 560, rot: -2},
  {de: R.mosquee + 0.2, a: R.nuit, pseudo: '@abonne_144', texte: 'je peux avoir une mosquée', x: 100, y: 560, rot: 2},
  {de: R.abonne + 0.1, a: R.abonne + 1.6, pseudo: '@abonne_145', texte: 'il prend dans la piscine', x: 110, y: 560, rot: -2},
];

/* ------------------------------------------------------------------ composition */

export const IleTikTokEp03: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / 30;
  const {width, height} = useVideoConfig();
  const pret = usePolicesPretes();
  const eclair = dans(t, R.nuit, R.requin)
    ? Math.max(0, ...[R.nuit + 0.8, R.nuit + 1.5, R.bateau + 0.5].map((d) => (t >= d && t < d + 0.17 ? 1 - (t - d) / 0.17 : 0))) : 0;
  return (
    <AbsoluteFill style={{background: '#8fd6f6'}}>
      {pret && (
        <ThreeCanvas width={width} height={height} shadows camera={{fov: 40, near: 0.1, far: 300}} gl={{antialias: true}}>
          <Monde3 t={t} />
        </ThreeCanvas>
      )}
      <AbsoluteFill style={{background: '#fff', opacity: eclair * 0.45}} />
      <Titre t={t} titres={TITRES} />
      <Bulles t={t} bulles={BULLES} />
      <JaugeEau t={t} de={R.eau} a={R.scene} niveau0={0} niveau1={1} />
      <SousTitre t={t} paquets={PAQUETS} />
      <BoutonAbonne t={t} de={R.abonne + 0.15} />
      <Confettis t={t} de={R.chihua + 0.1} a={R.sable} />
      <Confettis t={t} de={R.abonne + 1.17} />
      <Audio src={staticFile('ile/tiktok_ep03_voix.wav')} />
    </AbsoluteFill>
  );
};
