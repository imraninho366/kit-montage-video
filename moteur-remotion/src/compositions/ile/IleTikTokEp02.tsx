import {loadFont as chargerLilita} from '@remotion/google-fonts/LilitaOne';
import {loadFont as chargerMontserrat} from '@remotion/google-fonts/Montserrat';
import {ThreeCanvas} from '@remotion/three';
import {useEffect, useMemo, useState} from 'react';
import {AbsoluteFill, Audio, continueRender, delayRender, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import * as THREE from 'three';
import voix from './tiktok_ep02_voix.json';
import {Abri, DefCabane, Etat, Monde, Naufrage} from './Ile3D';
import {Etiquette, VolumeMystere, hasard, useMat} from './outils3d';

/**
 * L'Île des Abonnés — branche TikTok, épisode 2 (relevé du 08/11/2026 : A gagne, 8 voix contre 1).
 * Demandes réalisées : restaurant + anniversaire (@abonne_123), cabane-bateau (@abonne_124), jacuzzi (@abonne_125),
 * chat noir (@abonne_126), cabane rose (@abonne_127), cabane en or (@abonne_128), cabanes à leur nom.
 * Nouveau vote : de l'eau avant la tempête. A puits, B récupérer la pluie, C explorer la jungle.
 * La timeline est écrite en secondes, accrochée aux mots de la voix (T(i) = début du mot i).
 * Cette île est celle de la branche TikTok : la branche YouTube a ses propres constructions.
 */

const lilita = chargerLilita('normal', {subsets: ['latin', 'latin-ext']});
const montserrat = chargerMontserrat('normal', {weights: ['900'], subsets: ['latin', 'latin-ext']});
const TITRE = lilita.fontFamily;
const TEXTE = montserrat.fontFamily;

const FIN = voix.duree + 0.9;
export const DUREE_ILE_TT_EP02 = Math.ceil(FIN * 30);
const T = (i: number) => voix.mots[i].a - 0.08;

// repères (indices de mots, voir tiktok_ep02_texte.txt)
const R = {
  gagnant: T(6), l1: T(11), l2: T(19), anniv: T(25), l3: T(30), l4: T(38), l5: T(45), chat: T(50),
  l6: T(52), or: T(55), toutes: T(59), l7: T(63), eau: T(68), l8: T(73), A: T(81), B: T(85), C: T(89), l9: T(93), abonne: T(98),
};

type V3 = [number, number, number];
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const mix = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

/* ------------------------------------------------------------------ plan de l'île (branche TikTok) */

export const ABRI: V3 = [-2.0, 0.4, 0.0];
export const ABRI_ECHELLE = 1.8; // assez grand pour que Robin tienne dessous
export const ROBIN_ABRI: V3 = [-2.0, 0.4 + 0.18 * ABRI_ECHELLE, 0.1];
export const RESTO: V3 = [0.5, 0.4, -0.5];
const GATEAU: V3 = add(RESTO, [0.38, 0.62, 0.28]);
export const BATEAU: V3 = [2.5, 0.4, 0.7];
export const JACUZZI: V3 = [1.5, 0.4, 2.6];
export const CHAT: V3 = [0.75, 0.4, 2.75];
export const ROBIN: V3 = [0, 0.4, 2.2];
export const ROBIN_YEUX: V3 = [0, 1.62, 2.2];
export const VOTE: V3[] = [[-1.7, 0.4, 2.2], [-0.3, 0.4, 1.0], [1.4, 0.4, 1.0]]; // serrés au centre : le cadre vertical est étroit

export const ROSE: V3 = [-1.2, 0.4, 3.2];
export const OR: V3 = [3.1, 0.4, -0.7]; // filmée depuis la mer, à droite : ailleurs, un palmier ou Robin la cachait
export const CABANES_TT: DefCabane[] = [
  {p: ROSE, c: '#ff7eb6', pseudo: '@abonne_127'},
  {p: OR, c: '#ffb800', pseudo: '@abonne_128', or: true},
  {p: [-2.9, 0.4, -1.9], c: '#3f7fd9', pseudo: '@abonne_129'},
  {p: [-1.5, 0.4, -2.7], c: '#f08a24', pseudo: '@abonne_89'},
  {p: [-0.2, 0.4, -3.1], c: '#2bb39b', pseudo: '@abonne_130'},
  {p: [1.2, 0.4, -2.8], c: '#9b59d0', pseudo: '@abonne_131'},
  {p: [2.4, 0.4, -2.0], c: '#e84a5f', pseudo: '@abonne_132'},
  {p: [3.6, 0.4, 0.6], c: '#47c46a', pseudo: '@abonne_133'},
];

/* ------------------------------------------------------------------ constructions de l'épisode */

export const Restaurant: React.FC<{e: number; gateau: number; etiq: number}> = ({e, gateau, etiq}) => {
  const frame = useCurrentFrame();
  const bois = useMat('#c58b4e');
  const clair = useMat('#e6b77a');
  const poteau = useMat('#8b5a2b');
  const rouge = useMat('#e0283f');
  const blanc = useMat('#fbf6ea');
  const poisson = useMat('#7fb7d9');
  const creme = useMat('#ffd6e4');
  const fraise = useMat('#e0283f');
  const flamme = useMat('#ffd23f', {emissive: '#ffb300', emissiveIntensity: 1.2});
  const fil = useMat('#e8e8e8');
  if (e <= 0.001) return null;
  return (
    <group position={RESTO}>
      <group scale={e}>
        {/* cuisine au fond, comptoir devant */}
        <mesh material={clair} position={[0, 0.5, -0.3]} castShadow receiveShadow><boxGeometry args={[1.4, 1.0, 0.45]} /></mesh>
        <mesh material={bois} position={[0, 0.3, 0.3]} castShadow receiveShadow><boxGeometry args={[1.4, 0.6, 0.42]} /></mesh>
        <mesh material={blanc} position={[0, 0.62, 0.3]}><boxGeometry args={[1.46, 0.05, 0.48]} /></mesh>
        {[[-0.66, 0.5], [0.66, 0.5], [-0.66, -0.5], [0.66, -0.5]].map(([x, z], i) => (
          <mesh key={i} material={poteau} position={[x, 0.75, z]} castShadow><cylinderGeometry args={[0.05, 0.05, 1.5, 6]} /></mesh>
        ))}
        {/* auvent rayé */}
        {Array.from({length: 6}).map((_, i) => (
          <mesh key={i} material={i % 2 ? blanc : rouge} position={[-0.625 + i * 0.25, 1.55, 0.05]} rotation={[0.28, 0, 0]} castShadow>
            <boxGeometry args={[0.25, 0.06, 1.25]} />
          </mesh>
        ))}
        {/* poissons suspendus */}
        {[-0.4, 0, 0.4].map((x, i) => (
          <group key={i} position={[x, 1.12 + Math.sin(frame / 10 + i) * 0.02, 0.62]} rotation={[0, 0, Math.PI / 2]}>
            <mesh material={fil} position={[-0.2, 0, 0]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.008, 0.008, 0.3, 4]} /></mesh>
            <mesh material={poisson} scale={[1, 0.55, 0.35]}><icosahedronGeometry args={[0.14, 0]} /></mesh>
            <mesh material={poisson} position={[0.17, 0, 0]} rotation={[0, 0, Math.PI / 2]}><coneGeometry args={[0.08, 0.1, 3]} /></mesh>
          </group>
        ))}
        {/* canne à pêche */}
        <group position={[-0.85, 0, 0.45]} rotation={[0.25, 0, 0.32]}>
          <mesh material={poteau} position={[0, 1.0, 0]}><cylinderGeometry args={[0.02, 0.03, 2.0, 5]} /></mesh>
        </group>
        {/* gâteau d'anniversaire (apparaît sur « joyeux anniversaire ») */}
        {gateau > 0.001 && (
          <group position={[0.38, 0.65, 0.28]} scale={gateau}>
            <mesh material={creme} position={[0, 0.08, 0]} castShadow><cylinderGeometry args={[0.17, 0.17, 0.16, 14]} /></mesh>
            <mesh material={blanc} position={[0, 0.17, 0]}><cylinderGeometry args={[0.175, 0.175, 0.03, 14]} /></mesh>
            {[0, 1, 2, 3, 4].map((i) => (
              <mesh key={i} material={fraise} position={[Math.cos(i * 1.26) * 0.12, 0.2, Math.sin(i * 1.26) * 0.12]}><icosahedronGeometry args={[0.03, 0]} /></mesh>
            ))}
            <mesh material={blanc} position={[0, 0.27, 0]}><cylinderGeometry args={[0.015, 0.015, 0.16, 6]} /></mesh>
            <mesh material={flamme} position={[0, 0.38, 0]} scale={[1, 1 + Math.sin(frame / 2) * 0.2, 1]}><coneGeometry args={[0.03, 0.08, 6]} /></mesh>
            <pointLight position={[0, 0.45, 0]} color="#ffb347" intensity={1.5} distance={1.5} />
          </group>
        )}
      </group>
      <Etiquette texte="CHEZ CACTUS" position={[0, 2.25 * e, 0]} echelle={etiq * e} hauteur={0.4} fond="#e0283f" encre="#ffffff" />
    </group>
  );
};

const geoCoque = (() => {
  const s = new THREE.Shape();
  s.moveTo(-0.5, -0.9); s.lineTo(0.5, -0.9); s.lineTo(0.5, 0.45); s.lineTo(0, 1.15); s.lineTo(-0.5, 0.45); s.closePath();
  const g = new THREE.ExtrudeGeometry(s, {depth: 0.55, bevelEnabled: false});
  g.rotateX(-Math.PI / 2); // l'extrusion part vers le haut, la proue vers -z
  return g;
})();

export const MaisonBateau: React.FC<{e: number; etiq: number; p?: V3; roulis?: number}> = ({e, etiq, p = BATEAU, roulis = 0}) => {
  const frame = useCurrentFrame();
  const coque = useMat('#c0532b', {side: THREE.DoubleSide});
  const lisere = useMat('#fbf6ea', {side: THREE.DoubleSide});
  const bois = useMat('#e6b77a');
  const toit = useMat('#3f7fd9');
  const hublot = useMat('#1b3d6b', {roughness: 0.3});
  const mat = useMat('#8b5a2b');
  const drapeau = useMat('#ffc928', {side: THREE.DoubleSide});
  if (e <= 0.001) return null;
  return (
    <group position={p} rotation={[roulis, 0, roulis * 0.6]}>
      <group scale={e} rotation={[0, Math.PI + 0.35, 0]}>
        <mesh material={coque} geometry={geoCoque} castShadow receiveShadow />
        <mesh material={lisere} geometry={geoCoque} position={[0, 0.55, 0]} scale={[1.04, 0.15, 1.04]} />
        <mesh material={bois} position={[0, 0.95, 0.2]} castShadow><boxGeometry args={[0.72, 0.7, 0.8]} /></mesh>
        <mesh material={toit} position={[0, 1.5, 0.2]} rotation={[0, Math.PI / 4, 0]} castShadow><coneGeometry args={[0.62, 0.45, 4]} /></mesh>
        {[-1, 1].map((s) => [0, 0.32].map((z) => (
          <mesh key={`${s}${z}`} material={hublot} position={[s * 0.365, 0.98, z]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.09, 0.09, 0.02, 12]} /></mesh>
        )))}
        <mesh material={mat} position={[0, 1.4, -0.45]} castShadow><cylinderGeometry args={[0.035, 0.035, 1.7, 6]} /></mesh>
        <mesh material={drapeau} position={[0.17, 2.1, -0.45]} rotation={[0, Math.sin(frame / 6) * 0.25, 0]}><boxGeometry args={[0.32, 0.2, 0.02]} /></mesh>
      </group>
      <Etiquette texte="@abonne_124" position={[0, 2.7 * e, 0]} echelle={etiq * e} hauteur={0.36} />
    </group>
  );
};

export const Jacuzzi: React.FC<{e: number; etiq: number}> = ({e, etiq}) => {
  const frame = useCurrentFrame();
  const bois = useMat('#8b5a2b');
  const cercle = useMat('#5a3a22');
  const eau = useMat('#56dcff', {emissive: '#1aa6cf', emissiveIntensity: 0.45, roughness: 0.2});
  const bulle = useMat('#ffffff', {transparent: true, opacity: 0.85});
  const noir = useMat('#1a1410', {roughness: 0.2});
  const bulles = useMemo(() => Array.from({length: 14}, (_, i) => [(hasard(i) - 0.5) * 0.85, (hasard(i + 50) - 0.5) * 0.85, hasard(i + 99)]), []);
  if (e <= 0.001) return null;
  return (
    <group position={JACUZZI}>
      <group scale={e}>
        <mesh material={bois} position={[0, 0.27, 0]} castShadow receiveShadow><cylinderGeometry args={[0.62, 0.64, 0.54, 14]} /></mesh>
        {[0.12, 0.42].map((y) => <mesh key={y} material={cercle} position={[0, y, 0]}><cylinderGeometry args={[0.645, 0.645, 0.05, 14]} /></mesh>)}
        <mesh material={eau} position={[0, 0.53, 0]}><cylinderGeometry args={[0.55, 0.55, 0.04, 14]} /></mesh>
        {bulles.map(([x, z, g], i) => {
          const c = ((frame * 0.03 + g) % 1);
          return <mesh key={i} material={bulle} position={[x * 0.9, 0.55 + c * 0.18, z * 0.9]} scale={1 - c}><icosahedronGeometry args={[0.04, 0]} /></mesh>;
        })}
        {/* Aaron, les lunettes de soleil sur le nez */}
        <Naufrage p={[0.05, 0.12, 0.05]} graine={3} />
        <mesh material={noir} position={[0.05, 0.67, 0.21]}><boxGeometry args={[0.24, 0.05, 0.03]} /></mesh>
      </group>
      <Etiquette texte="@abonne_125" position={[0, 1.35 * e, 0]} echelle={etiq * e} hauteur={0.34} />
    </group>
  );
};

export const ChatNoir: React.FC<{e: number; etiq: number}> = ({e, etiq}) => {
  const frame = useCurrentFrame();
  const poil = useMat('#26262e');
  const yeux = useMat('#c8f53a', {emissive: '#9ad11a', emissiveIntensity: 0.6});
  const pupille = useMat('#000000');
  const rose = useMat('#ff8fa3');
  if (e <= 0.001) return null;
  const queue = Math.sin(frame / 7) * 0.4;
  return (
    <group position={CHAT}>
      <group scale={e * 1.5} rotation={[0, -0.35, 0]}>
        <mesh material={poil} position={[0, 0.17, -0.02]} scale={[1, 1.15, 1.1]} castShadow><icosahedronGeometry args={[0.15, 1]} /></mesh>
        <mesh material={poil} position={[0, 0.4, 0.03]} castShadow><icosahedronGeometry args={[0.12, 1]} /></mesh>
        {[-1, 1].map((s) => (
          <group key={s}>
            <mesh material={poil} position={[s * 0.07, 0.52, 0.02]} rotation={[0, 0, s * -0.3]}><coneGeometry args={[0.045, 0.1, 4]} /></mesh>
            <mesh material={yeux} position={[s * 0.045, 0.42, 0.135]}><sphereGeometry args={[0.03, 10, 8]} /></mesh>
            <mesh material={pupille} position={[s * 0.045, 0.42, 0.16]} scale={[0.35, 1, 0.5]}><sphereGeometry args={[0.022, 8, 6]} /></mesh>
            <mesh material={poil} position={[s * 0.06, 0.04, 0.1]}><icosahedronGeometry args={[0.045, 0]} /></mesh>
          </group>
        ))}
        <mesh material={rose} position={[0, 0.385, 0.15]}><icosahedronGeometry args={[0.018, 0]} /></mesh>
        <group position={[0, 0.08, -0.16]} rotation={[-0.9, 0, queue]}>
          <mesh material={poil} position={[0, 0.16, 0]}><cylinderGeometry args={[0.025, 0.03, 0.32, 5]} /></mesh>
        </group>
      </group>
      <Etiquette texte="@abonne_126" position={[0, 1.2 * e, 0]} echelle={etiq * e} hauteur={0.3} />
    </group>
  );
};

/* aperçus du vote */

export const Puits: React.FC<{e: number}> = ({e}) => {
  const pierre = useMat('#9aa3ad');
  const fond = useMat('#123a52');
  const bois = useMat('#8b5a2b');
  const seau = useMat('#a8743f');
  const corde = useMat('#e8d8a8');
  if (e <= 0.001) return null;
  return (
    <group position={VOTE[0]} scale={e}>
      {[0, 1].map((rang) => Array.from({length: 11}).map((_, i) => {
        const a = (i / 11) * Math.PI * 2 + rang * 0.3;
        return <mesh key={`${rang}-${i}`} material={pierre} position={[Math.cos(a) * 0.42, 0.12 + rang * 0.2, Math.sin(a) * 0.42]} rotation={[i, i * 2, 0]} castShadow><dodecahedronGeometry args={[0.13, 0]} /></mesh>;
      }))}
      <mesh material={fond} position={[0, 0.3, 0]}><cylinderGeometry args={[0.32, 0.32, 0.02, 12]} /></mesh>
      {[-1, 1].map((s) => <mesh key={s} material={bois} position={[s * 0.5, 0.65, 0]} castShadow><cylinderGeometry args={[0.04, 0.04, 1.1, 6]} /></mesh>)}
      <mesh material={bois} position={[0, 1.18, 0]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.04, 0.04, 1.1, 6]} /></mesh>
      <mesh material={corde} position={[0, 0.98, 0]}><cylinderGeometry args={[0.01, 0.01, 0.4, 4]} /></mesh>
      <mesh material={seau} position={[0, 0.72, 0]} castShadow><cylinderGeometry args={[0.1, 0.08, 0.15, 8]} /></mesh>
    </group>
  );
};

export const Recuperateur: React.FC<{e: number}> = ({e}) => {
  const tonneau = useMat('#a8743f');
  const cercle = useMat('#5a3a22');
  const feuille = useMat('#3fa34d', {side: THREE.DoubleSide});
  const coco = useMat('#6b4423', {side: THREE.DoubleSide});
  const eau = useMat('#56dcff', {emissive: '#1aa6cf', emissiveIntensity: 0.3});
  if (e <= 0.001) return null;
  return (
    <group position={VOTE[1]} scale={e}>
      <mesh material={tonneau} position={[0, 0.32, 0]} castShadow><cylinderGeometry args={[0.28, 0.25, 0.64, 10]} /></mesh>
      {[0.1, 0.52].map((y) => <mesh key={y} material={cercle} position={[0, y, 0]}><cylinderGeometry args={[0.285, 0.285, 0.04, 10]} /></mesh>)}
      {/* entonnoir de grandes feuilles */}
      {Array.from({length: 6}).map((_, i) => (
        <group key={i} rotation={[0, (i / 6) * Math.PI * 2, 0]}>
          <mesh material={feuille} position={[0.36, 0.86, 0]} rotation={[0, 0, 0.75]}><boxGeometry args={[0.55, 0.03, 0.3]} /></mesh>
        </group>
      ))}
      {[[0.55, 0.3], [-0.45, 0.45], [0.2, 0.6]].map(([x, z], i) => (
        <group key={i} position={[x, 0.12, z]}>
          <mesh material={coco}><sphereGeometry args={[0.12, 8, 6, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} /></mesh>
          <mesh material={eau} position={[0, -0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[0.1, 10]} /></mesh>
        </group>
      ))}
    </group>
  );
};

export const PanneauJungle: React.FC<{e: number; etiq: number}> = ({e, etiq}) => {
  const bois = useMat('#8b5a2b');
  const planche = useMat('#c58b4e');
  const buisson = useMat('#2f8f3c');
  if (e <= 0.001) return null;
  return (
    <group position={VOTE[2]}>
      <group scale={e}>
        <mesh material={bois} position={[0, 0.6, 0]} castShadow><cylinderGeometry args={[0.05, 0.05, 1.2, 6]} /></mesh>
        <mesh material={planche} position={[-0.1, 1.05, 0.04]} rotation={[0, 0, 0.08]} castShadow><boxGeometry args={[0.7, 0.2, 0.05]} /></mesh>
        {([[0.45, 0.2, 0.2, 0.32], [-0.5, 0.18, 0.1, 0.28], [0.15, 0.16, -0.45, 0.3], [-0.3, 0.2, -0.4, 0.34]] as number[][]).map(([x, y, z, r], i) => (
          <mesh key={i} material={buisson} position={[x, y, z]} castShadow><icosahedronGeometry args={[r, 0]} /></mesh>
        ))}
      </group>
      <Etiquette texte="JUNGLE ?" position={[-0.1, 1.27 * e, 0.1]} echelle={e * etiq} hauteur={0.24} fond="#2b1a00" encre="#ffc928" />
    </group>
  );
};

/* ------------------------------------------------------------------ caméra */

type Plan = {de: number; p0: V3; p1: V3; c: V3; fov?: number};
const PLANS: Plan[] = [
  {de: 0, p0: [14, 11, 17], p1: [10, 8, 12.5], c: [0, 0.6, 0]},
  {de: R.gagnant - 0.12, p0: add(ABRI, [2.8, 2.9, 6.4]), p1: add(ABRI, [2.4, 2.6, 5.6]), c: add(ABRI, [0, 1.5, 0])},
  {de: R.l1, p0: add(ROBIN_ABRI, [2.2, 1.3, 3.7]), p1: add(ROBIN_ABRI, [1.9, 1.3, 3.2]), c: add(ROBIN_ABRI, [0, 1.55, 0])},
  {de: R.l2, p0: add(RESTO, [1.8, 2.5, 5.0]), p1: add(RESTO, [1.4, 2.3, 4.3]), c: add(RESTO, [0, 1.0, 0])},
  {de: R.anniv, p0: add(GATEAU, [0.6, 0.75, 2.0]), p1: add(GATEAU, [0.45, 0.7, 1.6]), c: add(GATEAU, [0, 0.12, 0])},
  {de: R.l3, p0: add(BATEAU, [-1.3, 2.6, 5.2]), p1: add(BATEAU, [-1.0, 2.4, 4.5]), c: add(BATEAU, [0, 1.0, 0])},
  {de: R.l4, p0: add(JACUZZI, [-1.2, 2.0, 3.8]), p1: add(JACUZZI, [-1.0, 1.8, 3.2]), c: add(JACUZZI, [0, 0.55, 0])},
  {de: R.l5, p0: [1.4, 1.5, 6.2], p1: [1.2, 1.3, 5.4], c: [0.45, 0.85, 2.5]},
  {de: R.l6, p0: add(ROSE, [1.5, 1.7, 3.4]), p1: add(ROSE, [1.2, 1.5, 2.9]), c: add(ROSE, [0, 0.7, 0])},
  {de: R.or, p0: [5.6, 1.7, -0.1], p1: [5.2, 1.6, -0.3], c: add(OR, [0, 0.6, 0])},
  {de: R.toutes, p0: [0, 14, 13], p1: [0, 13, 12], c: [0.1, 0.4, -0.3]},
  {de: R.l7, p0: [0.5, 3.2, 8.4], p1: [0.4, 3.3, 7.4], c: [-0.4, 2.2, -30]},
  {de: R.eau, p0: [0.4, 1.95, 6.0], p1: [0.2, 1.9, 5.3], c: ROBIN_YEUX},
  {de: R.l8, p0: [0, 11, 11.5], p1: [0, 10.3, 10.7], c: [-0.15, 0.4, 1.4]},
  {de: R.A, p0: add(VOTE[0], [1.3, 3.5, 1.8]), p1: add(VOTE[0], [1.1, 3.2, 1.5]), c: add(VOTE[0], [0, 0.75, 0])},
  {de: R.B, p0: add(VOTE[1], [-2.0, 2.4, 1.8]), p1: add(VOTE[1], [-1.7, 2.2, 1.5]), c: add(VOTE[1], [0, 0.7, 0])},
  {de: R.C, p0: add(VOTE[2], [-0.7, 2.1, 3.8]), p1: add(VOTE[2], [-0.55, 1.9, 3.2]), c: add(VOTE[2], [0, 0.85, 0])},
  {de: R.l9, p0: [0, 11, 11.5], p1: [0, 11.6, 12.3], c: [-0.15, 0.4, 1.4]},
  {de: R.abonne, p0: [0, 1.95, 5.9], p1: [0, 1.9, 5.1], c: ROBIN_YEUX},
];

const camera = (t: number): Etat['cam'] => {
  const i = Math.max(0, PLANS.findIndex((p, k) => t >= p.de && t < (PLANS[k + 1]?.de ?? Infinity)));
  const p = PLANS[i];
  const fin = PLANS[i + 1]?.de ?? FIN;
  const u = interpolate(t, [p.de, fin], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return {pos: mix(p.p0, p.p1, u), cible: p.c, fov: p.fov ?? 40};
};

/* ------------------------------------------------------------------ état */

const useScene = (t: number) => {
  const {fps} = useVideoConfig();
  const pop = (de: number) => (t < de ? 0 : spring({frame: (t - de) * 30, fps, config: {damping: 11, stiffness: 170}}));
  const dans = (a: number, b: number) => t >= a && t < b;
  const flash = (...debuts: number[]) => Math.max(0, ...debuts.map((d) => (t >= d && t < d + 0.17 ? 1 - (t - d) / 0.17 : 0)));

  const sousAbri = dans(R.gagnant - 0.12, R.l2);
  const orage = dans(R.l7, R.eau);

  const etat: Etat = {
    cam: camera(t),
    robin: {
      humeur: dans(R.l7, R.l8) ? 'triste' : 'joyeux',
      position: sousAbri ? ROBIN_ABRI : ROBIN,
      rotY: orage ? Math.PI : 0,
      bras: t >= R.abonne ? 'salue' : dans(R.l5, R.l6) ? 'montre' : 'repos',
    },
    pluie: dans(R.l1, R.l2) ? 1 : orage ? 0.6 : dans(R.eau, R.l8) ? 0.5 : 0,
    orage: dans(R.l1, R.l2) ? 0.4 : orage ? interpolate(t, [R.l7, R.l7 + 2], [0.2, 0.8], {extrapolateRight: 'clamp'}) : dans(R.eau, R.l8) ? 0.55 : 0,
    eclair: orage ? flash(R.l7 + 1.1, R.l7 + 1.6) : 0,
    cabanes: [pop(R.l6 + 0.1), pop(R.or + 0.05), ...[0, 1, 2, 3, 4, 5].map((i) => pop(R.toutes + 0.05 + i * 0.09))],
    etiquettes: dans(R.toutes, R.l7) ? 1 : 0,
    mysteres: [0, 1, 2].map((i) => pop(R.l8 + 0.15 + i * 0.18) * (1 - pop([R.A, R.B, R.C][i] + 0.1))),
    lettres: dans(R.l8, R.A) || dans(R.l9, R.abonne) ? [0, 1, 2].map((i) => pop(R.l8 + 0.35 + i * 0.18)) : [0, 0, 0],
  };
  const etiqConstr = (_de: number, _a: number) => (dans(R.toutes, R.l7) ? 1 : 0);
  return {
    etat,
    abri: pop(R.gagnant),
    mystereAbri: 1.25 * (1 - pop(R.gagnant - 0.05)),
    resto: pop(R.l2 + 0.1), gateau: pop(R.anniv + 0.1), etiqResto: etiqConstr(R.l2, R.l3),
    bateau: pop(R.l3 + 0.1), etiqBateau: etiqConstr(R.l3, R.l4),
    jacuzzi: pop(R.l4 + 0.1), etiqJacuzzi: etiqConstr(R.l4, R.l5),
    chat: pop(R.chat), etiqChat: etiqConstr(R.chat, R.l6),
    puits: pop(R.A + 0.15), recup: pop(R.B + 0.15), jungle: pop(R.C + 0.15), etiqJungle: dans(R.C, R.abonne) ? 1 : 0,
  };
};

const geoBlocAbri = new THREE.BoxGeometry(1.4, 1.1, 1.4).translate(0, 0.55, 0);

const Scene: React.FC<{t: number}> = ({t}) => {
  const s = useScene(t);
  return (
    <Monde etat={s.etat} cabanesDef={CABANES_TT} parcellesVote={VOTE} tailleMystere={0.7}>
      <VolumeMystere geometrie={geoBlocAbri} position={ABRI} echelle={s.mystereAbri} />
      <group position={ABRI}><Abri e={s.abri * ABRI_ECHELLE} /></group>
      <Restaurant e={s.resto} gateau={s.gateau} etiq={s.etiqResto} />
      <MaisonBateau e={s.bateau} etiq={s.etiqBateau} />
      <Jacuzzi e={s.jacuzzi} etiq={s.etiqJacuzzi} />
      <ChatNoir e={s.chat} etiq={s.etiqChat} />
      <Puits e={s.puits} />
      <Recuperateur e={s.recup} />
      <PanneauJungle e={s.jungle} etiq={s.etiqJungle} />
    </Monde>
  );
};

/* ------------------------------------------------------------------ habillage 2D */

const TITRES: {de: number; petit: string; grand: string}[] = [
  {de: 0, petit: 'VOUS AVEZ', grand: 'VOTÉ !'},
  {de: R.gagnant - 0.12, petit: 'LE GAGNANT', grand: 'A : UN ABRI'},
  {de: R.l1, petit: 'ROBIN EST ENFIN', grand: "À L'ABRI"},
  {de: R.l2, petit: '@ABONNE_123 VOULAIT', grand: 'UN RESTAURANT'},
  {de: R.anniv, petit: 'JOYEUX', grand: 'ANNIVERSAIRE !'},
  {de: R.l3, petit: '@ABONNE_124 VOULAIT', grand: 'UNE CABANE-BATEAU'},
  {de: R.l4, petit: '@ABONNE_125', grand: 'ET SON JACUZZI'},
  {de: R.l5, petit: '@ABONNE_126 A RAMENÉ', grand: 'UN CHAT NOIR'},
  {de: R.l6, petit: '@ABONNE_127', grand: 'CABANE ROSE'},
  {de: R.or, petit: '@ABONNE_128', grand: 'CABANE EN OR'},
  {de: R.toutes, petit: 'ET TOUTES', grand: 'VOS CABANES'},
  {de: R.l7, petit: 'LA TEMPÊTE ARRIVE', grand: 'DEMAIN'},
  {de: R.eau, petit: "ET ROBIN N'A", grand: "PLUS D'EAU"},
  {de: R.l8, petit: "POUR TROUVER DE L'EAU", grand: 'ON FAIT QUOI ?'},
  {de: R.A, petit: 'CHOIX A', grand: 'UN PUITS'},
  {de: R.B, petit: 'CHOIX B', grand: 'LA PLUIE'},
  {de: R.C, petit: 'CHOIX C', grand: 'LA JUNGLE'},
  {de: R.l9, petit: 'COMMENTE', grand: 'A, B OU C'},
  {de: R.abonne, petit: 'ABONNE-TOI POUR SAVOIR', grand: "S'IL SURVIT"},
];

const AFFICHAGE: Record<number, string> = {
  2: '*voté…*', 6: '*A :*', 7: '', 9: '*abri !*', 10: '', 15: "*l'abri*", 18: '*pluie.*', 19: '*Cactus*', 22: '*restaurant*',
  26: '*joyeux*', 27: '*anniversaire,*', 28: '*Cactus !*', 29: '', 30: '*Biscotte*', 37: '*bateau.*', 38: '*Aaron,*', 44: '*jacuzzi.*',
  50: '*chat*', 51: '*noir.*', 54: '*rose,*', 58: '*or,*', 62: '*cabanes.*', 65: '*tempête*', 67: '*demain.*', 72: "*d'eau.*",
  79: '*quoi ?*', 80: '', 81: '*A,*', 84: '*puits.*', 85: '*B,*', 88: '*pluie.*', 89: '*C,*', 92: '*jungle.*',
  94: '*A,*', 95: '*B*', 97: '*C.*', 98: '*Abonne-toi*', 102: '*survit.*',
};
type Mot = {t: string; a: number; b: number};
const PAQUETS: Mot[][] = (() => {
  const mots = voix.mots.map((m, i) => ({...m, t: AFFICHAGE[i] ?? m.t})).filter((m) => m.t !== '');
  const res: Mot[][] = [];
  let cour: Mot[] = [];
  for (const m of mots) {
    cour.push(m);
    if (cour.length === 3 || /[.?…!:]\*?$/.test(m.t)) { res.push(cour); cour = []; }
  }
  if (cour.length) res.push(cour);
  return res;
})();

const contour = (couleur: string, ep: number) => ({WebkitTextStroke: `${ep}px ${couleur}`, paintOrder: 'stroke fill' as const});

const Titre: React.FC<{t: number}> = ({t}) => {
  const {fps} = useVideoConfig();
  const i = TITRES.findIndex((x, k) => t >= x.de && t < (TITRES[k + 1]?.de ?? Infinity));
  if (i < 0) return null;
  const x = TITRES[i];
  const e = spring({frame: (t - x.de) * 30, fps, config: {damping: 12, stiffness: 200}});
  return (
    <div style={{position: 'absolute', top: 230, left: 40, right: 40, textAlign: 'center', transform: `scale(${0.6 + 0.4 * e})`, opacity: Math.min(1, e * 1.5)}}>
      <div style={{fontFamily: TEXTE, fontWeight: 900, fontSize: 46, color: '#fff', letterSpacing: 1, ...contour('#1b1d24', 12)}}>{x.petit}</div>
      <div style={{fontFamily: TITRE, fontSize: x.grand.length > 15 ? 88 : x.grand.length > 12 ? 104 : 128, lineHeight: 1.0, whiteSpace: 'nowrap', color: '#ffc928', marginTop: 4,
        ...contour('#2b1a00', 18), textShadow: '0 8px 0 rgba(0,0,0,0.22)'}}>{x.grand}</div>
    </div>
  );
};

const SousTitre: React.FC<{t: number}> = ({t}) => {
  const i = PAQUETS.findIndex((p, k) => t >= p[0].a - 0.05 && t < (PAQUETS[k + 1]?.[0].a ?? p[p.length - 1].b + 0.4) - 0.05);
  if (i < 0) return null;
  const paquet = PAQUETS[i];
  return (
    <div style={{position: 'absolute', top: 1270, left: 60, right: 60, textAlign: 'center', fontFamily: TEXTE, fontWeight: 900, fontSize: 70, lineHeight: 1.1, ...contour('#000', 14)}}>
      {paquet.map((m, j) => {
        const jaune = m.t.startsWith('*');
        return <span key={j} style={{color: jaune ? '#ffc928' : '#fff', opacity: t >= m.a - 0.05 ? 1 : 0.35}}>{m.t.replace(/\*/g, '')}{j < paquet.length - 1 ? ' ' : ''}</span>;
      })}
    </div>
  );
};

/** Les vrais commentaires du relevé, cités dans la vidéo (texte d'origine, à peine raccourci). */
const BULLES: {de: number; a: number; pseudo: string; texte: string; x: number; y: number; rot: number}[] = [
  {de: 0.05, a: R.gagnant - 0.12, pseudo: '@abonne_134', texte: 'A', x: 120, y: 560, rot: -4},
  {de: 0.4, a: R.gagnant - 0.12, pseudo: '@abonne_131', texte: 'A et une cabane', x: 420, y: 760, rot: 3},
  {de: 0.75, a: R.gagnant - 0.12, pseudo: '@abonne_123', texte: 'je vote A', x: 160, y: 960, rot: -2},
  {de: R.l2 + 0.25, a: R.anniv, pseudo: '@abonne_123', texte: "une cabane restaurant… c'est mon anniversaire", x: 70, y: 560, rot: -2},
  {de: R.l3 + 0.25, a: R.l4, pseudo: '@abonne_124', texte: 'une cabane en forme de bateau', x: 90, y: 560, rot: 2},
  {de: R.l4 + 0.25, a: R.l5, pseudo: '@abonne_125', texte: 'je peux arriver avec un jacuzzi', x: 80, y: 560, rot: -2},
  {de: R.l5 + 0.25, a: R.l6, pseudo: '@abonne_126', texte: 'une cabane et un chat noir', x: 110, y: 560, rot: 2},
];

const Bulles: React.FC<{t: number}> = ({t}) => {
  const {fps} = useVideoConfig();
  return (
    <>
      {BULLES.filter((b) => t >= b.de && t < b.a).map((b) => {
        const e = spring({frame: (t - b.de) * 30, fps, config: {damping: 12}});
        return (
          <div key={b.pseudo + b.de} style={{position: 'absolute', top: b.y, left: b.x, maxWidth: 900, transform: `scale(${e}) rotate(${b.rot}deg)`, transformOrigin: 'left center',
            background: '#fff', borderRadius: 30, padding: '18px 28px', boxShadow: '0 10px 0 rgba(0,0,0,0.18)', fontFamily: TEXTE, fontWeight: 900}}>
            <div style={{fontSize: 28, color: '#8a8f99'}}>{b.pseudo}</div>
            <div style={{fontSize: 42, color: '#1b1d24', lineHeight: 1.15}}>{b.texte}</div>
          </div>
        );
      })}
    </>
  );
};

const CompteARebours: React.FC<{t: number}> = ({t}) => {
  if (t < R.l7 || t >= R.eau) return null;
  const reste = Math.max(0, 24 * 3600 - Math.round((t - R.l7) * 4100));
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

/** Jauge d'eau qui se vide, sur « Robin n'a plus d'eau ». */
const JaugeEau: React.FC<{t: number}> = ({t}) => {
  const {fps} = useVideoConfig();
  if (t < R.eau || t >= R.l8) return null;
  const e = spring({frame: (t - R.eau) * 30, fps, config: {damping: 12}});
  const niveau = interpolate(t, [R.eau, R.eau + 0.9], [0.3, 0], {extrapolateRight: 'clamp'});
  return (
    <div style={{position: 'absolute', top: 1110, left: 0, right: 0, display: 'flex', justifyContent: 'center', transform: `scale(${e})`}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 20, background: '#1b1d24', borderRadius: 30, padding: '14px 30px', border: '6px solid #56dcff'}}>
        <svg width="56" height="56" viewBox="0 0 24 24"><path fill="#56dcff" d="M12 2s-7 8-7 13a7 7 0 0 0 14 0c0-5-7-13-7-13z" /></svg>
        <div style={{width: 380, height: 44, borderRadius: 22, background: '#3a3f4b', overflow: 'hidden'}}>
          <div style={{width: `${niveau * 100}%`, height: '100%', background: '#56dcff'}} />
        </div>
        <div style={{fontFamily: TEXTE, fontWeight: 900, fontSize: 52, color: '#ff4d5e'}}>{Math.round(niveau * 100)}%</div>
      </div>
    </div>
  );
};

const BoutonAbonne: React.FC<{t: number}> = ({t}) => {
  const {fps} = useVideoConfig();
  const de = R.abonne + 0.15;
  if (t < de) return null;
  const e = spring({frame: (t - de) * 30, fps, config: {damping: 10}});
  const fait = t >= de + 1.0;
  const clic = fait ? spring({frame: (t - de - 1.0) * 30, fps, config: {damping: 8, stiffness: 300}}) : 0;
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

const Confettis: React.FC<{t: number; de: number; a?: number}> = ({t, de, a = Infinity}) => {
  if (t < de || t >= a) return null;
  const f = (t - de) * 30;
  const couleurs = ['#ffc928', '#fe2c55', '#3f7fd9', '#2bb39b', '#ffffff', '#9b59d0'];
  return (
    <>
      {Array.from({length: 70}).map((_, i) => {
        const x = (Math.sin(i * 91.7) * 0.5 + 0.5) * 1080;
        const v = 14 + (Math.sin(i * 13.1) * 0.5 + 0.5) * 16;
        const y = -60 + f * v - (i % 7) * 40;
        return <div key={i} style={{position: 'absolute', left: x + Math.sin(f / 6 + i) * 30, top: y, width: 20, height: 34,
          background: couleurs[i % couleurs.length], transform: `rotate(${f * 12 + i * 40}deg)`, borderRadius: 4}} />;
      })}
    </>
  );
};

/* ------------------------------------------------------------------ composition */

const usePolicesPretes = () => {
  const [pret, setPret] = useState(false);
  const [poignee] = useState(() => delayRender('polices île ep02'));
  useEffect(() => {
    Promise.all([lilita.waitUntilDone(), montserrat.waitUntilDone()]).then(() => { setPret(true); continueRender(poignee); });
  }, [poignee]);
  return pret;
};

export const IleTikTokEp02: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / 30;
  const {width, height} = useVideoConfig();
  const pret = usePolicesPretes();
  const eclair = t >= R.l7 && t < R.eau ? Math.max(0, ...[R.l7 + 1.1, R.l7 + 1.6].map((d) => (t >= d && t < d + 0.17 ? 1 - (t - d) / 0.17 : 0))) : 0;
  return (
    <AbsoluteFill style={{background: '#8fd6f6'}}>
      {pret && (
        <ThreeCanvas width={width} height={height} shadows camera={{fov: 40, near: 0.1, far: 300}} gl={{antialias: true}}>
          <Scene t={t} />
        </ThreeCanvas>
      )}
      <AbsoluteFill style={{background: '#fff', opacity: eclair * 0.45}} />
      <Titre t={t} />
      <Bulles t={t} />
      <CompteARebours t={t} />
      <JaugeEau t={t} />
      <SousTitre t={t} />
      <BoutonAbonne t={t} />
      <Confettis t={t} de={R.anniv + 0.1} a={R.l3} />
      <Confettis t={t} de={R.abonne + 1.17} />
      <Audio src={staticFile('ile/tiktok_ep02_voix.wav')} />
    </AbsoluteFill>
  );
};
