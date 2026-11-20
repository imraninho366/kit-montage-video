import {ThreeCanvas} from '@remotion/three';
import {AbsoluteFill, Audio, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import * as THREE from 'three';
import voix from './tiktok_ep04_voix.json';
import {Abri, Etat, Monde} from './Ile3D';
import {ABRI, ABRI_ECHELLE, ChatNoir, Jacuzzi, Puits, ROBIN, ROBIN_YEUX, Restaurant} from './IleTikTokEp02';
import {
  CABANES_EP03, Chihuahua, DecoFoot, MaisonPiscine, Mosquee, Patisserie, PetitChien, Piege, Plages, Scene as SceneCalvin, VOTE,
} from './IleTikTokEp03';
import {Etiquette, useMat} from './outils3d';
import {
  BoutonAbonne, Bulles, Confettis, DefBulle, DefTitre, SousTitre, TEXTE, Titre, contour, fairePaquets, usePolicesPretes,
} from './habillage';

/**
 * L'Île des Abonnés — branche TikTok, épisode 4 (relevé du 10/11/2026 sur l'épisode 3).
 * Vote : égalité 4-4 entre B (piège) et C (apprivoiser) → on fait les deux : le piège attrape le requin, puis il est apprivoisé.
 * @abonne_131 l'appelle Flipeur. Demandes : cabane de pêcheur (@abonne_131), stade de foot (@abonne_142, @abonne_135),
 * mini château drapeau du Maroc (@abonne_148), maison à paillettes (@abonne_149), boulangerie d'Halloween (@abonne_150),
 * cabane-gâteau (@abonne_147), aéroport international dirigé par @abonne_151
 * Nouveau mystère : les noix de coco ont disparu, des traces de pas. A suivre les traces, B poser une caméra, C accuser le chat noir.
 */

const FIN = voix.duree + 0.9;
export const DUREE_ILE_TT_EP04 = Math.ceil(FIN * 30);
const T = (i: number) => voix.mots[i].a - 0.08;

const R = {
  B4: T(7), C4: T(11), deux: T(12), attrape: T(22), apprivoise: T(23), william: T(27), pecheur: T(31), stade: T(38),
  chateau: T(45), paillettes: T(53), boulangerie: T(57), gateau: T(60), comete: T(67), aeroport: T(71),
  matin: T(75), traces: T(85), vote: T(93), A: T(97), B: T(101), C: T(105), commente: T(110), abonne: T(115),
};

type V3 = [number, number, number];
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const mix = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const dans = (t: number, a: number, b: number) => t >= a && t < b;

/* ------------------------------------------------------------------ plan de l'île (branche TikTok, après l'épisode 4) */

const CAGE: V3 = VOTE[1]; // le piège de l'épisode 3
export const FLIPEUR_CENTRE: V3 = [3.4, 0.03, 3.7]; // apprivoisé : il sort la tête de l'eau
const PECHEUR: V3 = [2.5, 0.4, 0.7]; // à la place de la cabane-bateau partie en mer
export const EXT_B: V3 = [0, 0, -6.6];
export const EXT_A: V3 = [9.0, 0, -5.0]; // îlot de l'aéroport
export const STADE: V3 = [0, 0.4, -7.0];
const PAILLETTES: V3 = [-2.0, 0.4, -5.6];
const GATEAU: V3 = [2.0, 0.4, -5.6];
const CHATEAU: V3 = [-7.0, 0.4, 0.1];
const BOULANGERIE: V3 = [6.6, 0.4, -0.9];
const PANIER: V3 = [-0.7, 0.4, 2.55];
export const VOTE4: V3[] = [[-2.2, 0.08, 5.0], [0.2, 0.08, 5.4], [2.4, 0.08, 5.0]];

/* ------------------------------------------------------------------ décor ajouté */

export const Ilot: React.FC<{c: V3; r: number; e: number}> = ({c, r, e}) => {
  const sable = useMat('#f3d58b');
  const lagon = useMat('#62d8d6', {transparent: true, opacity: 0.85});
  if (e <= 0.001) return null;
  return (
    <group position={c}>
      <mesh material={lagon} position={[0, 0.025, 0]} scale={[e, 1, e]}><cylinderGeometry args={[r + 0.9, r + 1.2, 0.1, 18]} /></mesh>
      <mesh material={sable} position={[0, -0.5 + 0.45 * e, 0]} scale={[1, e, 1]} receiveShadow castShadow><cylinderGeometry args={[r, r + 0.4, 0.9, 16]} /></mesh>
    </group>
  );
};

/** Flipeur, le requin apprivoisé : il tourne doucement dans le lagon, un cœur au-dessus de lui. */
export const Flipeur: React.FC<{v: number; p: V3; cap: number; coeur: number; etiq: number; echelle?: number}> = ({v, p, cap, coeur, etiq, echelle = 1}) => {
  const frame = useCurrentFrame();
  const gris = useMat('#6f7f8f');
  const ventre = useMat('#e8eef2');
  const noir = useMat('#111111');
  const blanc = useMat('#ffffff');
  const rose = useMat('#ff5c8a', {emissive: '#ff2d6f', emissiveIntensity: 0.5});
  if (v <= 0.001) return null;
  return (
    <group position={p}>
      <group rotation={[0, cap, 0]} scale={v * echelle}>
        <mesh material={gris} scale={[0.55, 0.42, 1.9]}><icosahedronGeometry args={[0.5, 1]} /></mesh>
        <mesh material={ventre} position={[0, -0.08, 0.3]} scale={[0.45, 0.25, 1.1]}><icosahedronGeometry args={[0.5, 1]} /></mesh>
        <mesh material={gris} position={[0, 0.5, -0.05]} rotation={[-0.35, 0, 0]} scale={[0.25, 1, 1]}><coneGeometry args={[0.28, 0.75, 4]} /></mesh>
        <mesh material={gris} position={[0, 0.15, -1.05]} rotation={[-1.1, Math.sin(frame / 5) * 0.3, 0]} scale={[0.2, 1, 1]}><coneGeometry args={[0.25, 0.6, 4]} /></mesh>
        {[-1, 1].map((s) => (
          <group key={s}>
            <mesh material={blanc} position={[s * 0.21, 0.1, 0.66]}><sphereGeometry args={[0.06, 10, 8]} /></mesh>
            <mesh material={noir} position={[s * 0.235, 0.11, 0.69]}><sphereGeometry args={[0.035, 8, 6]} /></mesh>
          </group>
        ))}
      </group>
      {coeur > 0.001 && (
        <group position={[0, 1.2 + Math.sin(frame / 7) * 0.08, 0]} scale={coeur * (1 + Math.sin(frame / 5) * 0.08)}>
          {[-1, 1].map((k) => <mesh key={k} material={rose} position={[k * 0.1, 0.06, 0]}><sphereGeometry args={[0.13, 14, 10]} /></mesh>)}
          <mesh material={rose} position={[0, -0.1, 0]} rotation={[0, 0, Math.PI]}><coneGeometry args={[0.215, 0.3, 14]} /></mesh>
        </group>
      )}
      <Etiquette texte="FLIPEUR" position={[0, 1.75, 0]} echelle={etiq} hauteur={0.28} fond="#3f7fd9" encre="#ffffff" />
    </group>
  );
};

export const CabanePecheur: React.FC<{e: number}> = ({e}) => {
  const bois = useMat('#a8743f');
  const clair = useMat('#d9b27c');
  const toit = useMat('#2f6db5');
  const filet = useMat('#e8d8a8', {transparent: true, opacity: 0.55, side: THREE.DoubleSide});
  const poisson = useMat('#7fb7d9');
  if (e <= 0.001) return null;
  return (
    <group position={PECHEUR} rotation={[0, 0.7, 0]}>
      <group scale={e}>
        {[[-0.55, -0.45], [0.55, -0.45], [-0.55, 0.45], [0.55, 0.45]].map(([x, z], i) => (
          <mesh key={i} material={bois} position={[x, 0.2, z]} castShadow><cylinderGeometry args={[0.05, 0.05, 0.4, 6]} /></mesh>
        ))}
        <mesh material={bois} position={[0, 0.42, 0]} castShadow receiveShadow><boxGeometry args={[1.4, 0.08, 1.2]} /></mesh>
        <mesh material={clair} position={[0, 0.78, -0.1]} castShadow><boxGeometry args={[0.85, 0.65, 0.75]} /></mesh>
        <mesh material={toit} position={[0, 1.32, -0.1]} rotation={[0, Math.PI / 4, 0]} castShadow><coneGeometry args={[0.72, 0.45, 4]} /></mesh>
        <mesh material={filet} position={[0.62, 0.75, 0.2]} rotation={[0, Math.PI / 2, 0]}><planeGeometry args={[0.8, 0.55]} /></mesh>
        {[-0.15, 0.15].map((z, i) => (
          <mesh key={i} material={poisson} position={[0.64, 0.65, z]} rotation={[0, 0, Math.PI / 2]} scale={[1, 0.5, 0.35]}><icosahedronGeometry args={[0.12, 0]} /></mesh>
        ))}
        <group position={[-0.5, 0.46, 0.5]} rotation={[0.6, 0, 0.3]}>
          <mesh material={bois} position={[0, 0.8, 0]}><cylinderGeometry args={[0.02, 0.03, 1.6, 5]} /></mesh>
        </group>
      </group>
    </group>
  );
};

export const Stade: React.FC<{e: number}> = ({e}) => {
  const pelouse = useMat('#3fae4f');
  const raie = useMat('#9be08f');
  const blanc = useMat('#ffffff');
  const rouge = useMat('#e84a5f');
  const bleu = useMat('#3f7fd9');
  const gris = useMat('#8a8f99');
  const lampe = useMat('#fff3a0', {emissive: '#ffe066', emissiveIntensity: 1});
  if (e <= 0.001) return null;
  return (
    <group position={STADE}>
      <group scale={e}>
        <mesh material={pelouse} position={[0, 0.03, 0]} receiveShadow><boxGeometry args={[2.6, 0.06, 1.5]} /></mesh>
        {[-0.975, -0.325, 0.325, 0.975].map((x) => <mesh key={x} material={raie} position={[x, 0.065, 0]}><boxGeometry args={[0.32, 0.01, 1.5]} /></mesh>)}
        <mesh material={blanc} position={[0, 0.075, 0]}><boxGeometry args={[0.03, 0.01, 1.4]} /></mesh>
        <mesh material={blanc} position={[0, 0.075, 0]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[0.2, 0.23, 20]} /></mesh>
        {[-1, 1].map((s) => (
          <group key={s} position={[s * 1.25, 0, 0]}>
            {[-0.28, 0.28].map((z) => <mesh key={z} material={blanc} position={[0, 0.2, z]}><cylinderGeometry args={[0.02, 0.02, 0.35, 5]} /></mesh>)}
            <mesh material={blanc} position={[0, 0.37, 0]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.02, 0.02, 0.58, 5]} /></mesh>
          </group>
        ))}
        {/* tribunes */}
        {[-1, 1].map((s) => [0, 1, 2].map((r) => (
          <mesh key={`${s}${r}`} material={r % 2 ? bleu : rouge} position={[0, 0.1 + r * 0.14, s * (0.95 + r * 0.16)]} castShadow><boxGeometry args={[2.6, 0.14 + r * 0.14, 0.16]} /></mesh>
        )))}
        {[[-1.4, -1.0], [1.4, -1.0], [-1.4, 1.0], [1.4, 1.0]].map(([x, z], i) => (
          <group key={i} position={[x, 0, z]}>
            <mesh material={gris} position={[0, 0.7, 0]}><cylinderGeometry args={[0.03, 0.03, 1.4, 5]} /></mesh>
            <mesh material={lampe} position={[0, 1.42, 0]}><boxGeometry args={[0.22, 0.12, 0.06]} /></mesh>
          </group>
        ))}
        <mesh material={blanc} position={[0.3, 0.14, 0.2]} castShadow><icosahedronGeometry args={[0.07, 1]} /></mesh>
      </group>
    </group>
  );
};

/** Pentagramme vert du drapeau marocain, en cinq segments. */
const Etoile: React.FC<{mat: THREE.Material}> = ({mat}) => {
  const pts = Array.from({length: 5}, (_, i) => [Math.sin((i / 5) * Math.PI * 2) * 0.09, Math.cos((i / 5) * Math.PI * 2) * 0.09]);
  return (
    <>
      {pts.map((a, i) => {
        const b = pts[(i + 2) % 5];
        const dx = b[0] - a[0], dy = b[1] - a[1];
        return <mesh key={i} material={mat} position={[(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, 0.006]} rotation={[0, 0, Math.atan2(dy, dx)]}><boxGeometry args={[Math.hypot(dx, dy), 0.018, 0.004]} /></mesh>;
      })}
    </>
  );
};

export const Chateau: React.FC<{e: number}> = ({e}) => {
  const frame = useCurrentFrame();
  const pierre = useMat('#d8c7a4');
  const fonce = useMat('#a8977a');
  const porte = useMat('#5a3a22');
  const rouge = useMat('#c1272d', {side: THREE.DoubleSide});
  const vert = useMat('#006233');
  const mat = useMat('#8a8f99');
  if (e <= 0.001) return null;
  return (
    <group position={CHATEAU} rotation={[0, 1.2, 0]}>
      <group scale={e}>
        <mesh material={pierre} position={[0, 0.3, 0]} castShadow receiveShadow><boxGeometry args={[1.0, 0.6, 1.0]} /></mesh>
        {[[-0.5, -0.5], [0.5, -0.5], [-0.5, 0.5], [0.5, 0.5]].map(([x, z], i) => (
          <group key={i} position={[x, 0, z]}>
            <mesh material={pierre} position={[0, 0.45, 0]} castShadow><cylinderGeometry args={[0.18, 0.2, 0.9, 8]} /></mesh>
            <mesh material={fonce} position={[0, 0.98, 0]}><coneGeometry args={[0.22, 0.3, 8]} /></mesh>
          </group>
        ))}
        {[-0.3, -0.1, 0.1, 0.3].map((x) => <mesh key={x} material={pierre} position={[x, 0.66, 0.5]}><boxGeometry args={[0.1, 0.12, 0.1]} /></mesh>)}
        <mesh material={porte} position={[0, 0.18, 0.505]}><boxGeometry args={[0.24, 0.34, 0.02]} /></mesh>
        <mesh material={mat} position={[0, 1.15, 0]}><cylinderGeometry args={[0.02, 0.02, 1.1, 5]} /></mesh>
        <group position={[0.31, 1.32, 0]} rotation={[0, Math.sin(frame / 8) * 0.15, 0]} scale={1.5}>
          <mesh material={rouge}><planeGeometry args={[0.6, 0.4]} /></mesh>
          <Etoile mat={vert} />
          <group rotation={[0, Math.PI, 0]}><Etoile mat={vert} /></group>
        </group>
      </group>
    </group>
  );
};

export const MaisonPaillettes: React.FC<{e: number}> = ({e}) => {
  const frame = useCurrentFrame();
  const murs = useMat('#e7a8f2', {emissive: '#a24bd0', emissiveIntensity: 0.15, roughness: 0.4});
  const toit = useMat('#ff7eb6', {emissive: '#ff3d8a', emissiveIntensity: 0.2, roughness: 0.4});
  const porte = useMat('#7a3fa0');
  const paillette = useMat('#ffffff', {emissive: '#fff6b0', emissiveIntensity: 1.5});
  if (e <= 0.001) return null;
  return (
    <group position={PAILLETTES}>
      <group scale={e} rotation={[0, Math.PI - 0.3, 0]}>
        <mesh material={murs} position={[0, 0.35, 0]} castShadow><boxGeometry args={[0.9, 0.7, 0.8]} /></mesh>
        <mesh material={toit} position={[0, 0.95, 0]} rotation={[0, Math.PI / 4, 0]} castShadow><coneGeometry args={[0.75, 0.55, 4]} /></mesh>
        <mesh material={porte} position={[0, 0.22, 0.41]}><boxGeometry args={[0.22, 0.38, 0.02]} /></mesh>
        {Array.from({length: 22}).map((_, i) => {
          const a = i * 2.4, h = 0.15 + ((i * 37) % 100) / 100 * 1.3, r = 0.55 + ((i * 13) % 10) / 30;
          const s = Math.max(0, Math.sin(frame / 4 + i * 1.7));
          return <mesh key={i} material={paillette} position={[Math.cos(a) * r, h, Math.sin(a) * r]} scale={0.03 + s * 0.05} rotation={[frame / 10, i, 0]}><octahedronGeometry args={[1, 0]} /></mesh>;
        })}
      </group>
    </group>
  );
};

export const BoulangerieHalloween: React.FC<{e: number}> = ({e}) => {
  const frame = useCurrentFrame();
  const orange = useMat('#f08a24');
  const noir = useMat('#2a2433');
  const violet = useMat('#7b3fbf');
  const citrouille = useMat('#ff8a1f', {emissive: '#ff5a00', emissiveIntensity: 0.25});
  const tige = useMat('#3fa34d');
  const yeux = useMat('#ffd23f', {emissive: '#ffb300', emissiveIntensity: 1.2});
  const pain = useMat('#d9a066');
  if (e <= 0.001) return null;
  return (
    <group position={BOULANGERIE} rotation={[0, -1.6, 0]}>
      <group scale={e}>
        <mesh material={noir} position={[0, 0.42, 0]} castShadow receiveShadow><boxGeometry args={[1.1, 0.84, 0.85]} /></mesh>
        {Array.from({length: 5}).map((_, i) => (
          <mesh key={i} material={i % 2 ? violet : orange} position={[-0.44 + i * 0.22, 0.92, 0.52]} rotation={[0.45, 0, 0]} castShadow><boxGeometry args={[0.22, 0.04, 0.38]} /></mesh>
        ))}
        <mesh material={orange} position={[0, 0.5, 0.43]}><boxGeometry args={[0.5, 0.28, 0.02]} /></mesh>
        {[-0.12, 0.12].map((x) => <mesh key={x} material={pain} position={[x, 0.5, 0.46]} scale={[1.4, 0.7, 0.7]}><icosahedronGeometry args={[0.06, 0]} /></mesh>)}
        {/* citrouille sur le toit */}
        <group position={[0, 1.05, -0.05]}>
          <mesh material={citrouille} scale={[1.25, 0.9, 1.25]} castShadow><icosahedronGeometry args={[0.24, 1]} /></mesh>
          <mesh material={tige} position={[0, 0.25, 0]}><cylinderGeometry args={[0.03, 0.04, 0.1, 5]} /></mesh>
          {[-1, 1].map((s) => <mesh key={s} material={yeux} position={[s * 0.09, 0.04, 0.27]} rotation={[0, 0, s * 0.3]}><coneGeometry args={[0.045, 0.07, 3]} /></mesh>)}
          <mesh material={yeux} position={[0, -0.07, 0.28]} scale={[1, 0.35, 0.3]}><sphereGeometry args={[0.09, 10, 6]} /></mesh>
        </group>
        {/* chauve-souris */}
        <group position={[0.4, 1.45 + Math.sin(frame / 6) * 0.08, 0.2]} rotation={[0, frame / 15, Math.sin(frame / 3) * 0.3]}>
          <mesh material={noir}><sphereGeometry args={[0.05, 6, 5]} /></mesh>
          {[-1, 1].map((s) => <mesh key={s} material={noir} position={[s * 0.1, 0, 0]} rotation={[0, 0, s * Math.sin(frame / 2) * 0.5]}><boxGeometry args={[0.16, 0.01, 0.08]} /></mesh>)}
        </group>
      </group>
    </group>
  );
};

export const CabaneGateau: React.FC<{e: number}> = ({e}) => {
  const frame = useCurrentFrame();
  const biscuit = useMat('#c98a5a');
  const creme = useMat('#fff0f5');
  const rose = useMat('#ff9ec4');
  const choco = useMat('#6b4423');
  const cerise = useMat('#e0283f');
  const flamme = useMat('#ffd23f', {emissive: '#ffb300', emissiveIntensity: 1.2});
  const porte = useMat('#5a3a22');
  if (e <= 0.001) return null;
  return (
    <group position={GATEAU}>
      <group scale={e} rotation={[0, Math.PI + 0.3, 0]}>
        <mesh material={biscuit} position={[0, 0.25, 0]} castShadow><cylinderGeometry args={[0.6, 0.6, 0.5, 16]} /></mesh>
        <mesh material={creme} position={[0, 0.52, 0]}><cylinderGeometry args={[0.62, 0.62, 0.06, 16]} /></mesh>
        <mesh material={rose} position={[0, 0.75, 0]} castShadow><cylinderGeometry args={[0.42, 0.42, 0.4, 16]} /></mesh>
        <mesh material={choco} position={[0, 0.97, 0]}><cylinderGeometry args={[0.44, 0.44, 0.05, 16]} /></mesh>
        <mesh material={cerise} position={[0, 1.07, 0]}><sphereGeometry args={[0.09, 10, 8]} /></mesh>
        {[0.25, -0.25].map((x) => (
          <group key={x} position={[x, 1.0, 0.15]}>
            <mesh material={creme} position={[0, 0.1, 0]}><cylinderGeometry args={[0.015, 0.015, 0.2, 6]} /></mesh>
            <mesh material={flamme} position={[0, 0.24, 0]} scale={[1, 1 + Math.sin(frame / 2 + x * 9) * 0.2, 1]}><coneGeometry args={[0.025, 0.07, 6]} /></mesh>
          </group>
        ))}
        <mesh material={porte} position={[0, 0.18, 0.6]}><boxGeometry args={[0.22, 0.34, 0.02]} /></mesh>
      </group>
    </group>
  );
};

/** Îlot de l'aéroport : piste, tour de contrôle, petit avion qui décolle sur « l'aéroport international ». */
export const Aeroport: React.FC<{e: number; decollage: number; etiq: number}> = ({e, decollage, etiq}) => {
  const piste = useMat('#4a4f5a');
  const blanc = useMat('#ffffff');
  const vitre = useMat('#7fd6ff', {emissive: '#2aa6d6', emissiveIntensity: 0.4, roughness: 0.2});
  const rouge = useMat('#e84a5f');
  const bleu = useMat('#3f7fd9');
  if (e <= 0.001) return null;
  const d = decollage;
  const x = -1.7 + 3.6 * d * d;
  const y = 0.12 + Math.max(0, d - 0.55) * 2.6;
  return (
    <group position={EXT_A} rotation={[0, 0.5, 0]}>
      <group scale={e}>
        <mesh material={piste} position={[0, 0.42, 0]} receiveShadow><boxGeometry args={[4.0, 0.03, 0.7]} /></mesh>
        {[-1.5, -0.9, -0.3, 0.3, 0.9, 1.5].map((px) => <mesh key={px} material={blanc} position={[px, 0.44, 0]}><boxGeometry args={[0.3, 0.01, 0.05]} /></mesh>)}
        <group position={[0.4, 0.4, -1.0]}>
          <mesh material={blanc} position={[0, 0.6, 0]} castShadow><cylinderGeometry args={[0.13, 0.18, 1.2, 10]} /></mesh>
          <mesh material={vitre} position={[0, 1.32, 0]}><cylinderGeometry args={[0.3, 0.24, 0.26, 10]} /></mesh>
          <mesh material={rouge} position={[0, 1.5, 0]}><coneGeometry args={[0.32, 0.14, 10]} /></mesh>
        </group>
        {/* avion */}
        <group position={[x, 0.4 + y, 0]} rotation={[0, 0, Math.max(0, d - 0.55) * 0.5]}>
          <mesh material={blanc} rotation={[0, 0, Math.PI / 2]} castShadow><cylinderGeometry args={[0.1, 0.1, 1.0, 10]} /></mesh>
          <mesh material={blanc} position={[0.56, 0, 0]} rotation={[0, 0, -Math.PI / 2]}><coneGeometry args={[0.1, 0.16, 10]} /></mesh>
          <mesh material={bleu} position={[0.05, 0, 0]}><boxGeometry args={[0.22, 0.03, 1.1]} /></mesh>
          <mesh material={bleu} position={[-0.45, 0.14, 0]}><boxGeometry args={[0.16, 0.22, 0.03]} /></mesh>
          <mesh material={bleu} position={[-0.45, 0.04, 0]}><boxGeometry args={[0.12, 0.02, 0.4]} /></mesh>
        </group>
      </group>
      <Etiquette texte="AÉROPORT · DIRECTEUR @abonne_151" position={[0.4, 2.05 * e, -1.0]} echelle={etiq * e} hauteur={0.26} fond="#2b1a00" encre="#ffc928" />
    </group>
  );
};

export const Panier: React.FC<{e: number}> = ({e}) => {
  const osier = useMat('#c58b4e', {side: THREE.DoubleSide});
  const fonce = useMat('#8b5a2b');
  if (e <= 0.001) return null;
  return (
    <group position={PANIER} scale={e}>
      <mesh material={osier} position={[0, 0.15, 0]} castShadow><cylinderGeometry args={[0.25, 0.18, 0.3, 10, 1, true]} /></mesh>
      <mesh material={fonce} position={[0, 0.01, 0]}><cylinderGeometry args={[0.18, 0.18, 0.02, 10]} /></mesh>
      <mesh material={fonce} position={[0, 0.3, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.25, 0.02, 4, 12]} /></mesh>
    </group>
  );
};

/** Traces de pas, du panier vide jusqu'à la jungle. */
const Traces: React.FC<{v: number}> = ({v}) => {
  const encre = useMat('#6b4a2a');
  const n = 14;
  return (
    <>
      {Array.from({length: n}).map((_, i) => {
        if (i / n > v) return null;
        const z = PANIER[2] - 0.35 - i * 0.28;
        const x = -0.45 + (i % 2 ? 0.08 : -0.08);
        return <mesh key={i} material={encre} position={[x, 0.415, z]} rotation={[-Math.PI / 2, 0, 0]} scale={[0.6, 1, 1]}><circleGeometry args={[0.07, 8]} /></mesh>;
      })}
    </>
  );
};

/* aperçus du vote */

export const Radeau: React.FC<{p: V3; e: number; children: React.ReactNode}> = ({p, e, children}) => {
  const bois = useMat('#a8743f');
  if (e <= 0.001) return null;
  return (
    <group position={p} scale={e}>
      {[-0.3, -0.1, 0.1, 0.3].map((o) => <mesh key={o} material={bois} position={[o, 0.06, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow><cylinderGeometry args={[0.1, 0.1, 1.0, 6]} /></mesh>)}
      {children}
    </group>
  );
};

const VoteTraces: React.FC<{e: number}> = ({e}) => {
  const bois = useMat('#8b5a2b');
  const encre = useMat('#6b4a2a');
  return (
    <Radeau p={VOTE4[0]} e={e}>
      <mesh material={bois} position={[0, 0.5, -0.2]}><cylinderGeometry args={[0.035, 0.035, 0.8, 6]} /></mesh>
      <mesh material={bois} position={[0.1, 0.82, -0.18]} rotation={[0, 0, 0.05]}><boxGeometry args={[0.55, 0.18, 0.04]} /></mesh>
      {[0, 1, 2].map((i) => <mesh key={i} material={encre} position={[-0.15 + i * 0.15, 0.17, 0.25 - i * 0.12]} rotation={[-Math.PI / 2, 0, 0]} scale={[0.6, 1, 1]}><circleGeometry args={[0.06, 8]} /></mesh>)}
    </Radeau>
  );
};

const VoteCamera: React.FC<{e: number}> = ({e}) => {
  const frame = useCurrentFrame();
  const noir = useMat('#1b1d24');
  const gris = useMat('#8a8f99');
  const rouge = useMat('#ff2d3a', {emissive: '#ff0000', emissiveIntensity: 1.5});
  const verre = useMat('#3f7fd9', {roughness: 0.2});
  return (
    <Radeau p={VOTE4[1]} e={e}>
      {[0, 2.1, 4.2].map((a) => <mesh key={a} material={gris} position={[Math.sin(a) * 0.12, 0.38, Math.cos(a) * 0.12]} rotation={[Math.cos(a) * 0.3, 0, -Math.sin(a) * 0.3]}><cylinderGeometry args={[0.015, 0.015, 0.6, 5]} /></mesh>)}
      <mesh material={noir} position={[0, 0.74, 0]} castShadow><boxGeometry args={[0.32, 0.22, 0.2]} /></mesh>
      <mesh material={verre} position={[0, 0.74, 0.14]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.07, 0.08, 0.1, 10]} /></mesh>
      {Math.floor(frame / 12) % 2 === 0 && <mesh material={rouge} position={[0.11, 0.88, 0.08]}><sphereGeometry args={[0.025, 8, 6]} /></mesh>}
    </Radeau>
  );
};

const VoteChat: React.FC<{e: number}> = ({e}) => {
  const poil = useMat('#26262e');
  const yeux = useMat('#c8f53a', {emissive: '#9ad11a', emissiveIntensity: 0.6});
  const faisceau = useMat('#fff3a0', {transparent: true, opacity: 0.25, emissive: '#ffe066', emissiveIntensity: 0.6, side: THREE.DoubleSide});
  return (
    <Radeau p={VOTE4[2]} e={e}>
      <mesh material={faisceau} position={[0, 0.85, 0]}><coneGeometry args={[0.45, 1.5, 14, 1, true]} /></mesh>
      <group position={[0, 0.12, 0]} scale={1.5}>
        <mesh material={poil} position={[0, 0.17, 0]} scale={[1, 1.15, 1.1]}><icosahedronGeometry args={[0.15, 1]} /></mesh>
        <mesh material={poil} position={[0, 0.4, 0.03]}><icosahedronGeometry args={[0.12, 1]} /></mesh>
        {[-1, 1].map((s) => (
          <group key={s}>
            <mesh material={poil} position={[s * 0.07, 0.52, 0.02]} rotation={[0, 0, s * -0.3]}><coneGeometry args={[0.045, 0.1, 4]} /></mesh>
            <mesh material={yeux} position={[s * 0.045, 0.42, 0.135]}><sphereGeometry args={[0.03, 10, 8]} /></mesh>
          </group>
        ))}
      </group>
    </Radeau>
  );
};

/* ------------------------------------------------------------------ caméra */

type Plan = {de: number; p0: V3; p1: V3; c: V3};
const PLANS: Plan[] = [
  {de: 0, p0: [12, 10, 16], p1: [9.5, 8, 13], c: [0, 0.6, -0.5]},
  {de: R.deux, p0: add(CAGE, [1.1, 1.6, 2.9]), p1: add(CAGE, [0.9, 1.45, 2.5]), c: add(CAGE, [0, 0.45, 0])},
  {de: R.apprivoise, p0: [0.9, 3.0, 9.6], p1: [1.1, 2.8, 9.0], c: add(FLIPEUR_CENTRE, [0, 0.6, 0])},
  {de: R.pecheur, p0: add(PECHEUR, [-0.6, 1.9, 3.6]), p1: add(PECHEUR, [-0.5, 1.7, 3.1]), c: add(PECHEUR, [0, 0.8, 0])},
  {de: R.stade, p0: [0.6, 4.6, -11.8], p1: [0.4, 4.2, -11.0], c: add(STADE, [0, 0.3, 0])},
  {de: R.chateau, p0: [-10.4, 2.3, 1.8], p1: [-9.9, 2.1, 1.5], c: add(CHATEAU, [0, 0.8, 0])},
  {de: R.paillettes, p0: add(PAILLETTES, [-1.3, 1.9, -3.4]), p1: add(PAILLETTES, [-1.1, 1.7, -2.9]), c: add(PAILLETTES, [0, 0.7, 0])},
  {de: R.boulangerie, p0: add(BOULANGERIE, [3.4, 1.9, 1.3]), p1: add(BOULANGERIE, [2.9, 1.7, 1.1]), c: add(BOULANGERIE, [0, 0.8, 0])},
  {de: R.gateau, p0: add(GATEAU, [1.3, 1.8, -3.3]), p1: add(GATEAU, [1.1, 1.6, -2.8]), c: add(GATEAU, [0, 0.65, 0])},
  {de: R.comete, p0: [5.0, 5.2, 2.2], p1: [5.4, 4.6, 1.2], c: add(EXT_A, [0, 0.8, 0])},
  {de: R.matin, p0: [0.0, 1.95, 6.0], p1: [-0.2, 1.9, 5.3], c: ROBIN_YEUX},
  {de: R.traces, p0: [-2.5, 5.4, 4.4], p1: [-2.3, 5.0, 4.0], c: [-0.45, 0.4, 0.6]},
  {de: R.vote, p0: [0, 9, 15.5], p1: [0, 8.6, 14.6], c: [0.1, 0.3, 3.6]},
  {de: R.A, p0: add(VOTE4[0], [0.9, 1.5, 2.8]), p1: add(VOTE4[0], [0.75, 1.4, 2.4]), c: add(VOTE4[0], [0, 0.5, 0])},
  {de: R.B, p0: add(VOTE4[1], [0.9, 1.5, 2.8]), p1: add(VOTE4[1], [0.75, 1.4, 2.4]), c: add(VOTE4[1], [0, 0.55, 0])},
  {de: R.C, p0: add(VOTE4[2], [-0.9, 1.5, 2.8]), p1: add(VOTE4[2], [-0.75, 1.4, 2.4]), c: add(VOTE4[2], [0, 0.65, 0])},
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
  const etat: Etat = {
    cam: camera(t),
    robin: {
      humeur: dans(t, R.matin, R.abonne) ? 'triste' : 'joyeux',
      position: ROBIN,
      bras: t >= R.abonne ? 'salue' : 'repos',
    },
    cabanes: CABANES_EP03.map(() => 1),
    mysteres: [0, 1, 2].map((i) => pop(R.vote + 0.15 + i * 0.18) * (1 - pop([R.A, R.B, R.C][i] + 0.1))),
    lettres: dans(t, R.vote, R.A) || dans(t, R.commente, R.abonne) ? [0, 1, 2].map((i) => pop(R.vote + 0.35 + i * 0.18)) : [0, 0, 0],
  };
  // Flipeur : dans le piège sur « attrapé », puis libre et apprivoisé, il tourne dans le lagon
  const libre = t >= R.apprivoise;
  const a = t * 0.6;
  const pLibre: V3 = [FLIPEUR_CENTRE[0] + Math.sin(a) * 0.8, FLIPEUR_CENTRE[1], FLIPEUR_CENTRE[2] + Math.cos(a) * 0.8];
  return {
    etat,
    cage: t < R.apprivoise ? 1 : 1 - pop(R.apprivoise),
    flipeur: libre ? 1 : pop(R.attrape),
    flipeurP: libre ? pLibre : add(CAGE, [0, 0.35, 0]),
    flipeurCap: libre ? a + Math.PI / 2 : 0.4,
    flipeurEchelle: libre ? 1 : 0.42,
    coeur: pop(R.apprivoise + 0.3),
    etiqFlipeur: dans(t, R.william, R.pecheur) ? 1 : 0,
    pecheur: pop(R.pecheur + 0.1), plageB: pop(R.stade - 0.25), stade: pop(R.stade + 0.1), chateau: pop(R.chateau + 0.1),
    paillettes: pop(R.paillettes + 0.1), boulangerie: pop(R.boulangerie + 0.1), gateau: pop(R.gateau + 0.1),
    ilotA: pop(R.comete - 0.1), aeroport: pop(R.comete + 0.1),
    decollage: interpolate(t, [R.aeroport, R.matin], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
    etiqAeroport: dans(t, R.comete, R.matin) ? 1 : 0,
    traces: interpolate(t, [R.traces + 0.1, R.traces + 1.0], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
    vTraces: pop(R.A + 0.15), vCamera: pop(R.B + 0.15), vChat: pop(R.C + 0.15),
  };
};

const Monde4: React.FC<{t: number}> = ({t}) => {
  const s = useScene(t);
  return (
    <Monde etat={s.etat} cabanesDef={CABANES_EP03} parcellesVote={VOTE4} tailleMystere={0.7}>
      <Plages g={1} d={1} />
      <Ilot c={EXT_B} r={2.6} e={s.plageB} />
      <Ilot c={EXT_A} r={2.4} e={s.ilotA} />
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
      <Piege e={s.cage} />
      <Flipeur v={s.flipeur} p={s.flipeurP} cap={s.flipeurCap} coeur={s.coeur} etiq={s.etiqFlipeur} echelle={s.flipeurEchelle} />
      <CabanePecheur e={s.pecheur} />
      <Stade e={s.stade} />
      <Chateau e={s.chateau} />
      <MaisonPaillettes e={s.paillettes} />
      <BoulangerieHalloween e={s.boulangerie} />
      <CabaneGateau e={s.gateau} />
      <Aeroport e={s.aeroport} decollage={s.decollage} etiq={s.etiqAeroport} />
      <Panier e={1} />
      <Traces v={s.traces} />
      <VoteTraces e={s.vTraces} />
      <VoteCamera e={s.vCamera} />
      <VoteChat e={s.vChat} />
    </Monde>
  );
};

/* ------------------------------------------------------------------ habillage */

/** Tableau d'égalité « B 4 – 4 C », puis le tampon « ON FAIT LES DEUX ! ». */
const Case: React.FC<{l: string; n: number}> = ({l, n}) => (
  <div style={{display: 'flex', alignItems: 'center', gap: 18}}>
    <div style={{width: 96, height: 96, borderRadius: 48, background: '#ffc928', border: '7px solid #2b1a00', display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: TEXTE, fontWeight: 900, fontSize: 58, color: '#2b1a00'}}>{l}</div>
    <div style={{fontFamily: TEXTE, fontWeight: 900, fontSize: 100, color: '#fff', ...contour('#1b1d24', 14)}}>{n}</div>
  </div>
);

const Egalite: React.FC<{t: number}> = ({t}) => {
  const {fps} = useVideoConfig();
  if (t >= R.apprivoise) return null;
  const e = spring({frame: t * 30, fps, config: {damping: 12}});
  const tampon = t >= R.deux ? spring({frame: (t - R.deux) * 30, fps, config: {damping: 9, stiffness: 220}}) : 0;
  return (
    <>
      {t < R.deux + 0.05 && (
        <div style={{position: 'absolute', top: 600, left: 0, right: 0, display: 'flex', justifyContent: 'center', transform: `scale(${e})`}}>
          <div style={{display: 'flex', alignItems: 'center', gap: 50, background: 'rgba(27,29,36,0.82)', borderRadius: 40, padding: '24px 50px'}}>
            <Case l="B" n={t >= R.B4 ? 4 : 0} />
            <div style={{fontFamily: TEXTE, fontWeight: 900, fontSize: 80, color: '#ffc928'}}>–</div>
            <Case l="C" n={t >= R.C4 ? 4 : 0} />
          </div>
        </div>
      )}
      {tampon > 0 && (
        <div style={{position: 'absolute', top: 1080, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
          <div style={{transform: `scale(${0.4 + 0.6 * tampon}) rotate(-6deg)`, background: '#fe2c55', color: '#fff', fontFamily: TEXTE, fontWeight: 900,
            fontSize: 62, padding: '14px 40px', borderRadius: 24, border: '7px solid #fff', boxShadow: '0 10px 0 rgba(0,0,0,0.2)'}}>ON FAIT LES DEUX !</div>
        </div>
      )}
    </>
  );
};

const TITRES: DefTitre[] = [
  {de: 0, petit: 'LE VOTE', grand: 'ÉGALITÉ !'},
  {de: R.deux, petit: 'LE PIÈGE', grand: "L'A ATTRAPÉ…"},
  {de: R.apprivoise, petit: 'ET ON', grand: "L'A APPRIVOISÉ"},
  {de: R.william, petit: '@ABONNE_131 L’APPELLE', grand: 'FLIPEUR'},
  {de: R.pecheur, petit: '@ABONNE_131', grand: 'CABANE DE PÊCHEUR'},
  {de: R.stade, petit: '@ABONNE_142 ET @ABONNE_135', grand: 'UN STADE DE FOOT'},
  {de: R.chateau, petit: '@ABONNE_148', grand: 'UN MINI CHÂTEAU'},
  {de: R.paillettes, petit: '@ABONNE_149', grand: 'MAISON PAILLETTES'},
  {de: R.boulangerie, petit: '@ABONNE_150', grand: 'BOULANGERIE HALLOWEEN'},
  {de: R.gateau, petit: '@ABONNE_147', grand: 'CABANE-GÂTEAU'},
  {de: R.comete, petit: '@ABONNE_151 DEVIENT DIRECTEUR', grand: "DE L'AÉROPORT !"},
  {de: R.matin, petit: 'MAIS CE MATIN…', grand: 'PLUS DE COCO !'},
  {de: R.traces, petit: 'ET IL Y A', grand: 'DES TRACES…'},
  {de: R.vote, petit: 'QUI A FAIT LE COUP ?', grand: 'ON FAIT QUOI ?'},
  {de: R.A, petit: 'CHOIX A', grand: 'SUIVRE LES TRACES'},
  {de: R.B, petit: 'CHOIX B', grand: 'UNE CAMÉRA'},
  {de: R.C, petit: 'CHOIX C', grand: 'ACCUSER LE CHAT'},
  {de: R.commente, petit: 'COMMENTE', grand: 'A, B OU C'},
  {de: R.abonne, petit: 'ABONNE-TOI POUR SAVOIR', grand: 'QUI A FAIT LE COUP'},
];

const PAQUETS = fairePaquets(voix, {
  0: '*Égalité*', 1: '*parfaite !*', 2: '', 7: '*B,*', 11: '*C.*', 17: '*deux :*', 18: '', 20: '*piège*', 22: '*attrapé…*',
  26: '*apprivoisé.*', 27: '*William*', 30: '*Flipeur.*', 37: '*pêcheur.*', 39: '*stade*', 44: '*fois.*', 47: '*château,*', 52: '*Maroc.*',
  56: '*paillettes,*', 59: "*d'Halloween,*", 66: '*gâteau.*', 68: '*Comete*', 70: '*directeur…*', 73: '*international !*', 74: '',
  82: '*coco*', 84: '*disparu.*', 90: '*traces*', 95: '*quoi ?*', 96: '', 97: '*A,*', 100: '*traces.*', 101: '*B,*', 104: '*caméra.*',
  105: '*C,*', 108: '*chat*', 109: '*noir.*', 111: '*A,*', 112: '*B*', 114: '*C.*', 115: '*Abonne-toi*', 122: '*coup.*',
});

const BULLES: DefBulle[] = [
  {de: R.william + 0.15, a: R.pecheur, pseudo: '@abonne_131', texte: 'une cabane de pêcheur pour apprivoiser Flipeur le requin', x: 60, y: 560, rot: -2},
  {de: R.stade + 0.15, a: R.chateau, pseudo: '@abonne_142', texte: 'stp un mini mini mini stade', x: 90, y: 560, rot: 2},
  {de: R.stade + 0.6, a: R.chateau, pseudo: '@abonne_135', texte: 'fais un stade de foot géant', x: 190, y: 760, rot: -2},
  {de: R.chateau + 0.15, a: R.paillettes, pseudo: '@abonne_148', texte: 'un mini château avec le drapeau du Maroc', x: 70, y: 1000, rot: -2},
  {de: R.paillettes + 0.15, a: R.boulangerie, pseudo: '@abonne_149', texte: 'une maison à paillettes', x: 120, y: 560, rot: 2},
  {de: R.boulangerie + 0.15, a: R.gateau, pseudo: '@abonne_150', texte: 'une boulangerie halloween', x: 110, y: 560, rot: -2},
  {de: R.gateau + 0.15, a: R.comete, pseudo: '@abonne_147', texte: 'une cabane en forme de gâteau', x: 100, y: 560, rot: 2},
  {de: R.comete + 0.15, a: R.matin, pseudo: '@abonne_151', texte: 'directeur de l’aéroport international', x: 90, y: 560, rot: -2},
];

/* ------------------------------------------------------------------ composition */

export const IleTikTokEp04: React.FC = () => {
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
      <Titre t={t} titres={TITRES} />
      <Egalite t={t} />
      <Bulles t={t} bulles={BULLES} />
      <SousTitre t={t} paquets={PAQUETS} />
      <BoutonAbonne t={t} de={R.abonne + 0.15} />
      <Confettis t={t} de={R.apprivoise + 0.2} a={R.william + 0.8} />
      <Confettis t={t} de={R.abonne + 1.17} />
      <Audio src={staticFile('ile/tiktok_ep04_voix.wav')} />
    </AbsoluteFill>
  );
};
