import {useThree} from '@react-three/fiber';
import {useMemo} from 'react';
import {useCurrentFrame} from 'remotion';
import * as THREE from 'three';
import {mergeGeometries} from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {Etiquette, Lettre, VolumeMystere, hasard, useMat} from './outils3d';

type V3 = [number, number, number];

/** Tout ce que la timeline peut piloter dans la scène, image par image. */
export type Etat = {
  cam: {pos: V3; cible: V3; fov?: number};
  robin: {humeur: 'triste' | 'joyeux'; rotY?: number; bras?: 'repos' | 'montre' | 'salue'; position?: V3};
  pluie?: number;          // 0 → 1
  orage?: number;          // assombrit le ciel et la lumière
  eclair?: number;         // flash 0 → 1
  radeaux?: number;        // progression de l'arrivée des naufragés
  foule?: number;          // nombre de naufragés sur la plage
  cabanes?: number[];      // apparition de chaque cabane (0 → 1)
  bateau?: number;         // silhouette du palier 100
  volcan?: number;         // silhouette du palier 1 000
  mysteres?: number[];     // volumes en pointillés sur les 3 parcelles
  lettres?: number[];      // pastilles A, B, C
  constructions?: number[];// abri, feu, radeau
  etiquettes?: number;     // pseudos au-dessus des cabanes (masqués en gros plan)
  cielDegage?: boolean;    // sans nuage d'orage (photo de profil)
};

export const ROBIN: V3 = [0, 0.4, 2.2];
export const PARCELLES: V3[] = [[-2.1, 0.4, 0.5], [0.1, 0.4, -0.5], [2.3, 0.4, 0.7]];
export type DefCabane = {p: V3; c: string; pseudo: string; or?: boolean; murs?: string};
export const CABANES: DefCabane[] = [
  {p: [-2.6, 0.4, -1.5], c: '#3f7fd9', pseudo: '@abonne_02'},
  {p: [-1.5, 0.4, -2.6], c: '#f08a24', pseudo: '@abonne_03'},
  {p: [-0.2, 0.4, -3.0], c: '#2bb39b', pseudo: '@abonne_04'},
  {p: [1.2, 0.4, -2.8], c: '#9b59d0', pseudo: '@abonne_05'},
  {p: [2.4, 0.4, -2.0], c: '#e84a5f', pseudo: '@abonne_06'},
  {p: [3.1, 0.4, -0.7], c: '#f2c230', pseudo: '@abonne_122'},
];
const PALMIERS: {p: V3; h: number; r: number}[] = [
  {p: [-3.1, 0.4, 1.4], h: 6, r: 0.3}, {p: [3.3, 0.4, 1.9], h: 5, r: -0.25},
  {p: [-0.9, 0.4, -1.6], h: 7, r: 0.15}, {p: [1.7, 0.4, -1.3], h: 5, r: -0.2},
];
const FOULE: V3[] = [[-1.2, 0.4, 3.0], [1.1, 0.4, 3.1], [-0.4, 0.4, 3.5], [0.6, 0.4, 3.6], [-2.4, 0.4, 2.6], [2.2, 0.4, 2.8], [-3.4, 0.4, 0.4], [3.5, 0.4, 0.4]];
const TENUES = ['#e84a5f', '#3f7fd9', '#f2c230', '#2bb39b', '#9b59d0', '#f08a24', '#ff7eb6', '#47c46a'];
const PEAUX = ['#e9b27d', '#c98a5a', '#8a5a3b', '#f2c9a0', '#a8714a'];

/* ------------------------------------------------------------------ caméra & ambiance */

const Camera: React.FC<Etat['cam']> = ({pos, cible, fov = 40}) => {
  const {camera} = useThree();
  const cam = camera as THREE.PerspectiveCamera;
  cam.position.set(...pos);
  cam.lookAt(...cible);
  if (cam.fov !== fov) { cam.fov = fov; cam.updateProjectionMatrix(); }
  return null;
};

const CIEL = new THREE.Color('#8fd6f6');
const CIEL_ORAGE = new THREE.Color('#3d4656');

const Ambiance: React.FC<{orage: number; eclair: number}> = ({orage, eclair}) => {
  const {scene} = useThree();
  const c = CIEL.clone().lerp(CIEL_ORAGE, orage).lerp(new THREE.Color('#ffffff'), eclair * 0.6);
  scene.background = c;
  scene.fog = new THREE.Fog(c, 28, 95);
  return (
    <>
      <hemisphereLight args={['#e8f8ff', '#f3d58b', 1.25 * (1 - 0.55 * orage)]} />
      <directionalLight position={[8, 14, 7]} intensity={2.4 * (1 - 0.7 * orage)} castShadow
        shadow-mapSize-width={2048} shadow-mapSize-height={2048}
        shadow-camera-left={-8} shadow-camera-right={8} shadow-camera-top={8} shadow-camera-bottom={-8} />
      <ambientLight intensity={0.25 + eclair * 3} />
    </>
  );
};

/* ------------------------------------------------------------------ décor */

const Ocean: React.FC = () => {
  const frame = useCurrentFrame();
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(160, 160, 56, 56);
    g.rotateX(-Math.PI / 2);
    return g;
  }, []);
  const base = useMemo(() => Float32Array.from(geo.attributes.position.array), [geo]);
  const pos = geo.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const x = base[i * 3], z = base[i * 3 + 2];
    pos.setY(i, Math.sin(x * 0.35 + frame * 0.06) * 0.13 + Math.cos(z * 0.3 + frame * 0.05) * 0.11);
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  const mat = useMat('#1aa6cf', {roughness: 0.35});
  return <mesh geometry={geo} material={mat} position={[0, -0.05, 0]} receiveShadow />;
};

const Ile: React.FC = () => {
  const sable = useMat('#f3d58b');
  const lagon = useMat('#62d8d6', {transparent: true, opacity: 0.85});
  const herbe = useMat('#7cc44f');
  const roche = useMat('#9aa3ad');
  return (
    <group>
      <mesh material={lagon} position={[0, 0.03, 0]}><cylinderGeometry args={[6.4, 6.9, 0.1, 22]} /></mesh>
      <mesh material={sable} position={[0, -0.05, 0]} receiveShadow castShadow><cylinderGeometry args={[4, 4.8, 0.9, 16]} /></mesh>
      <mesh material={herbe} position={[-0.8, 0.44, -1.7]} receiveShadow><cylinderGeometry args={[1.7, 1.9, 0.1, 10]} /></mesh>
      {([[-3.6, 0.38, -0.4, 0.42], [1.0, 0.36, 3.6, 0.3], [-1.8, 0.36, 3.3, 0.36], [3.7, 0.36, -1.6, 0.34]] as number[][]).map(([x, y, z, r], i) => (
        <mesh key={i} material={roche} position={[x, y, z]} rotation={[i, i * 2, 0]} castShadow><dodecahedronGeometry args={[r, 0]} /></mesh>
      ))}
    </group>
  );
};

export const Palmier: React.FC<{p: V3; h: number; r: number; graine: number}> = ({p, h, r, graine}) => {
  const frame = useCurrentFrame();
  const tronc = useMat('#9c6b3f');
  const feuille = useMat('#3fa34d', {side: THREE.DoubleSide});
  const coco = useMat('#6b4423');
  const balance = Math.sin(frame / 25 + graine) * 0.04;
  const segs = Array.from({length: h});
  const haut = h * 0.36;
  return (
    <group position={p} rotation={[0, graine, r * 0.25 + balance]}>
      {segs.map((_, i) => (
        <mesh key={i} material={tronc} position={[r * 0.02 * i * i, 0.18 + i * 0.36, 0]} rotation={[0, i * 0.5, 0]} castShadow>
          <cylinderGeometry args={[0.1 - i * 0.005, 0.13 - i * 0.005, 0.38, 6]} />
        </mesh>
      ))}
      <group position={[r * 0.02 * h * h, haut, 0]}>
        {Array.from({length: 7}).map((_, i) => (
          <group key={i} rotation={[0, (i / 7) * Math.PI * 2, -0.45 - (i % 2) * 0.2 + balance * 2]}>
            <mesh material={feuille} position={[0.75, 0, 0]} castShadow><boxGeometry args={[1.5, 0.04, 0.36]} /></mesh>
          </group>
        ))}
        {[0, 2, 4].map((i) => (
          <mesh key={i} material={coco} position={[Math.cos(i) * 0.14, -0.12, Math.sin(i) * 0.14]}><icosahedronGeometry args={[0.1, 0]} /></mesh>
        ))}
      </group>
    </group>
  );
};

/* ------------------------------------------------------------------ personnages */

export const Robin: React.FC<Etat['robin'] & {position?: V3}> = ({humeur, rotY = 0, bras = 'repos', position = ROBIN}) => {
  const frame = useCurrentFrame();
  const peau = useMat('#e9b27d');
  const barbe = useMat('#7a4a26', {side: THREE.DoubleSide});
  const chemise = useMat('#f3ecd9');
  const short = useMat('#2f6db5');
  const bandana = useMat('#e0283f');
  const noir = useMat('#1a1410', {roughness: 0.3});
  const blanc = useMat('#ffffff');
  const bouche = useMat('#5a1a10');
  const rose = useMat('#ff8fa3', {transparent: true, opacity: 0.6});
  const triste = humeur === 'triste';
  const souffle = Math.sin(frame / 9) * 0.015;
  // bras droit (côté +x) : une rotation z POSITIVE l'écarte du corps vers l'extérieur et vers le haut
  const brasD = bras === 'montre' ? {x: -1.35, z: 0.1} : bras === 'salue' ? {x: -0.25, z: 2.35 + Math.sin(frame / 3) * 0.3} : {x: 0, z: 0.12};
  const sourcils = triste ? 0.38 : -0.12;
  return (
    <group position={position} rotation={[0, rotY, 0]}>
      {[-1, 1].map((s) => (
        <group key={s}>
          <mesh material={peau} position={[s * 0.14, 0.26, 0]} castShadow><cylinderGeometry args={[0.1, 0.1, 0.46, 8]} /></mesh>
          <mesh material={peau} position={[s * 0.14, 0.04, 0.05]}><boxGeometry args={[0.16, 0.08, 0.26]} /></mesh>
        </group>
      ))}
      <mesh material={short} position={[0, 0.6, 0]} castShadow><boxGeometry args={[0.52, 0.28, 0.32]} /></mesh>
      <group position={[0, souffle, 0]}>
        <mesh material={chemise} position={[0, 0.98, 0]} castShadow><boxGeometry args={[0.56, 0.5, 0.34]} /></mesh>
        {/* ourlet déchiré */}
        {[-0.18, 0.02, 0.2].map((x, i) => (
          <mesh key={i} material={chemise} position={[x, 0.72, 0.01]} rotation={[0, 0, Math.PI / 4]}><boxGeometry args={[0.12, 0.12, 0.33]} /></mesh>
        ))}
        <mesh material={peau} position={[0, 1.15, 0.165]} rotation={[0, 0, Math.PI / 4]}><boxGeometry args={[0.12, 0.12, 0.02]} /></mesh>
        {[-1, 1].map((s) => {
          const r = s > 0 ? brasD : {x: triste ? -0.15 : 0, z: -0.12};
          return (
            <group key={s} position={[s * 0.36, 1.17, 0]} rotation={[r.x, 0, r.z]}>
              <mesh material={chemise} position={[0, -0.08, 0]}><boxGeometry args={[0.18, 0.18, 0.2]} /></mesh>
              <mesh material={peau} position={[0, -0.27, 0]} castShadow><cylinderGeometry args={[0.075, 0.075, 0.4, 8]} /></mesh>
              <mesh material={peau} position={[0, -0.5, 0]}><icosahedronGeometry args={[0.09, 0]} /></mesh>
            </group>
          );
        })}
        <group position={[0, 1.62, 0]} rotation={[triste ? 0.14 : -0.04, 0, triste ? 0 : Math.sin(frame / 14) * 0.05]}>
          <mesh material={peau} castShadow><icosahedronGeometry args={[0.46, 1]} /></mesh>
          <mesh material={barbe} position={[0, -0.01, 0.02]}>
            <sphereGeometry args={[0.475, 12, 8, Math.PI / 2 - 1.45, 2.9, 1.78, 1.36]} />
          </mesh>
          <mesh material={barbe} position={[0, 0.03, -0.02]}><sphereGeometry args={[0.47, 12, 6, 0, Math.PI * 2, 0, 1.05]} /></mesh>
          <mesh material={bandana} position={[0, 0.24, 0]} rotation={[-0.12, 0, 0.06]}><cylinderGeometry args={[0.43, 0.47, 0.15, 14]} /></mesh>
          <mesh material={bandana} position={[0.05, 0.27, -0.47]} rotation={[0.5, 0.3, 0.4]}><boxGeometry args={[0.12, 0.26, 0.05]} /></mesh>
          <mesh material={bandana} position={[-0.06, 0.25, -0.47]} rotation={[0.5, -0.3, -0.5]}><boxGeometry args={[0.12, 0.24, 0.05]} /></mesh>
          {[-1, 1].map((s) => (
            <group key={s}>
              <mesh material={blanc} position={[s * 0.155, 0.05, 0.4]}><sphereGeometry args={[0.1, 14, 10]} /></mesh>
              <mesh material={noir} position={[s * 0.155, 0.04, 0.47]}><sphereGeometry args={[0.065, 14, 10]} /></mesh>
              <mesh material={blanc} position={[s * 0.155 + 0.022, 0.07, 0.53]}><sphereGeometry args={[0.02, 8, 6]} /></mesh>
              <mesh material={barbe} position={[s * 0.155, 0.19, 0.44]} rotation={[0, 0, s * -sourcils]}><boxGeometry args={[0.17, 0.04, 0.05]} /></mesh>
              <mesh material={rose} position={[s * 0.29, -0.05, 0.36]} rotation={[0, s * 0.6, 0]}><circleGeometry args={[0.07, 12]} /></mesh>
            </group>
          ))}
          <mesh material={peau} position={[0, -0.03, 0.47]}><icosahedronGeometry args={[0.065, 0]} /></mesh>
          {triste
            ? <mesh material={bouche} position={[0, -0.22, 0.47]}><torusGeometry args={[0.08, 0.025, 6, 12, Math.PI]} /></mesh>
            : <mesh material={bouche} position={[0, -0.14, 0.475]}><circleGeometry args={[0.12, 16, Math.PI, Math.PI]} /></mesh>}
        </group>
      </group>
    </group>
  );
};

export const Naufrage: React.FC<{p: V3; graine: number; echelle?: number}> = ({p, graine, echelle = 1}) => {
  const frame = useCurrentFrame();
  const tenue = useMat(TENUES[graine % TENUES.length]);
  const peau = useMat(PEAUX[graine % PEAUX.length]);
  const noir = useMat('#1a1410');
  const saut = Math.max(0, Math.sin(frame / 5 + graine * 1.7)) * 0.08;
  if (echelle <= 0.001) return null;
  return (
    <group position={[p[0], p[1] + saut, p[2]]} scale={echelle} rotation={[0, Math.atan2(-p[0], 6 - p[2]) * 0.5, 0]}>
      <mesh material={tenue} position={[0, 0.22, 0]} castShadow><cylinderGeometry args={[0.12, 0.15, 0.36, 8]} /></mesh>
      <mesh material={peau} position={[0, 0.52, 0]} castShadow><icosahedronGeometry args={[0.17, 1]} /></mesh>
      {[-1, 1].map((s) => <mesh key={s} material={noir} position={[s * 0.06, 0.54, 0.15]}><sphereGeometry args={[0.025, 6, 6]} /></mesh>)}
    </group>
  );
};

const PetitRadeau: React.FC<{angle: number; p: number; graine: number}> = ({angle, p, graine}) => {
  const frame = useCurrentFrame();
  const bois = useMat('#a8743f');
  if (p <= 0) return null;
  const r = 13 - 8.2 * Math.min(1, p);
  const x = Math.sin(angle) * r, z = Math.cos(angle) * r;
  const roulis = Math.sin(frame / 7 + graine) * 0.06;
  return (
    <group position={[x, 0.08 + Math.sin(frame / 8 + graine) * 0.05, z]} rotation={[roulis, -angle, roulis]}>
      {[-0.3, -0.1, 0.1, 0.3].map((o) => (
        <mesh key={o} material={bois} position={[o, 0, 0]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.1, 0.1, 1.0, 6]} /></mesh>
      ))}
      <Naufrage p={[-0.15, 0.08, 0]} graine={graine} />
      <Naufrage p={[0.2, 0.08, 0.15]} graine={graine + 3} />
    </group>
  );
};

/* ------------------------------------------------------------------ constructions */

const Cabane: React.FC<{p: V3; couleur: string; pseudo: string; e: number; etiq: number; or?: boolean; murs?: string}> = ({p, couleur, pseudo, e, etiq, or = false, murs}) => {
  // cabane « en or » : murs dorés qui brillent un peu (pas de métal : sans reflets d'environnement il paraîtrait noir)
  const bois = useMat(or ? '#ffd23a' : murs ?? '#c58b4e', or ? {emissive: '#b88a00', emissiveIntensity: 0.35, roughness: 0.4} : {});
  const toit = useMat(couleur, or ? {emissive: '#b88a00', emissiveIntensity: 0.3, roughness: 0.4} : {});
  const porte = useMat('#5a3a22');
  if (e <= 0.001) return null;
  const rot = Math.atan2(p[0], p[2]);
  return (
    <group position={p}>
      <group scale={e} rotation={[0, rot, 0]}>
        <mesh material={bois} position={[0, 0.3, 0]} castShadow receiveShadow><boxGeometry args={[0.8, 0.6, 0.7]} /></mesh>
        <mesh material={toit} position={[0, 0.82, 0]} rotation={[0, Math.PI / 4, 0]} castShadow><coneGeometry args={[0.68, 0.5, 4]} /></mesh>
        <mesh material={porte} position={[0, 0.2, 0.36]}><boxGeometry args={[0.22, 0.36, 0.02]} /></mesh>
      </group>
      <Etiquette texte={pseudo} position={[0, 1.55, 0]} echelle={Math.min(1, e * 1.2) * etiq} hauteur={0.36} />
    </group>
  );
};

export const Abri: React.FC<{e: number}> = ({e}) => {
  const bois = useMat('#8b5a2b');
  const paille = useMat('#e2bd5b');
  const plancher = useMat('#b9844d');
  if (e <= 0.001) return null;
  return (
    <group scale={e}>
      <mesh material={plancher} position={[0, 0.12, 0]} castShadow receiveShadow><boxGeometry args={[1.5, 0.12, 1.3]} /></mesh>
      {[[-0.65, -0.55], [0.65, -0.55], [-0.65, 0.55], [0.65, 0.55]].map(([x, z], i) => (
        <mesh key={i} material={bois} position={[x, 0.55, z]} castShadow><cylinderGeometry args={[0.05, 0.05, 0.9, 6]} /></mesh>
      ))}
      {[-1, 1].map((s) => (
        <mesh key={s} material={paille} position={[s * 0.42, 1.18, 0]} rotation={[0, 0, s * -0.72]} castShadow><boxGeometry args={[1.12, 0.1, 1.55]} /></mesh>
      ))}
    </group>
  );
};

const Feu: React.FC<{e: number}> = ({e}) => {
  const frame = useCurrentFrame();
  const pierre = useMat('#8a929c');
  const buche = useMat('#6b4423');
  const orange = useMat('#ff8a1f', {emissive: '#ff5a00', emissiveIntensity: 0.9});
  const jaune = useMat('#ffd23f', {emissive: '#ffb300', emissiveIntensity: 1});
  if (e <= 0.001) return null;
  const f = 1 + Math.sin(frame / 2.2) * 0.12;
  return (
    <group scale={e}>
      {Array.from({length: 9}).map((_, i) => (
        <mesh key={i} material={pierre} position={[Math.cos((i / 9) * Math.PI * 2) * 0.55, 0.1, Math.sin((i / 9) * Math.PI * 2) * 0.55]} castShadow>
          <dodecahedronGeometry args={[0.13, 0]} />
        </mesh>
      ))}
      {[0, 1, 2].map((i) => (
        <mesh key={i} material={buche} position={[0, 0.12, 0]} rotation={[Math.PI / 2, 0, (i / 3) * Math.PI]}><cylinderGeometry args={[0.07, 0.07, 0.8, 6]} /></mesh>
      ))}
      <mesh material={orange} position={[0, 0.45, 0]} scale={[1, f, 1]}><coneGeometry args={[0.28, 0.7, 6]} /></mesh>
      <mesh material={jaune} position={[0.02, 0.38, 0.03]} scale={[1, 2 - f, 1]}><coneGeometry args={[0.16, 0.45, 6]} /></mesh>
      <pointLight position={[0, 0.8, 0]} color="#ff9a3c" intensity={3 * e} distance={4} />
    </group>
  );
};

const Radeau: React.FC<{e: number}> = ({e}) => {
  const bois = useMat('#a8743f');
  const corde = useMat('#e8d8a8');
  const voile = useMat('#fbf6ea', {side: THREE.DoubleSide});
  const geoVoile = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(0, 0); s.lineTo(0, 1.3); s.lineTo(0.9, 0.1); s.closePath();
    return new THREE.ShapeGeometry(s);
  }, []);
  if (e <= 0.001) return null;
  return (
    <group scale={e} rotation={[0, -0.5, 0]}>
      {[-0.45, -0.27, -0.09, 0.09, 0.27, 0.45].map((o) => (
        <mesh key={o} material={bois} position={[o, 0.11, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow><cylinderGeometry args={[0.095, 0.095, 1.4, 7]} /></mesh>
      ))}
      {[-0.42, 0.42].map((z) => (
        <mesh key={z} material={corde} position={[0, 0.2, z]}><boxGeometry args={[1.05, 0.05, 0.08]} /></mesh>
      ))}
      <mesh material={bois} position={[-0.1, 0.95, 0]} castShadow><cylinderGeometry args={[0.04, 0.04, 1.6, 6]} /></mesh>
      <mesh material={voile} geometry={geoVoile} position={[-0.08, 0.32, 0]} rotation={[0, Math.PI / 2, 0]} />
    </group>
  );
};

/* ------------------------------------------------------------------ météo */

const Nuages: React.FC<{orage: number}> = ({orage}) => {
  const frame = useCurrentFrame();
  const gris = useMat('#4b5262');
  const blanc = useMat('#ffffff');
  const z = -34 + orage * 10;
  return (
    <group>
      <group position={[-2, 7 + Math.sin(frame / 40) * 0.2, z]} scale={1 + orage * 0.6}>
        {([[0, 0, 0, 3], [3, -0.6, 0.5, 2.4], [-3, -0.5, 0.3, 2.6], [1.5, 1.2, -0.5, 2.2], [-1.6, 1, 0, 2.1], [5.4, -1, 0, 1.8], [-5.2, -1, 0, 1.7]] as number[][]).map(([x, y, zz, r], i) => (
          <mesh key={i} material={gris} position={[x, y, zz]} rotation={[i, i, 0]}><icosahedronGeometry args={[r, 0]} /></mesh>
        ))}
      </group>
      {/* nuages de beau temps */}
      {orage < 0.5 && ([[14, 9, -30], [-16, 10, -26], [24, 12, 6]] as V3[]).map((p, i) => (
        <group key={i} position={[p[0] + Math.sin(frame / 60 + i) * 0.5, p[1], p[2]]}>
          {[[0, 0, 0, 1.6], [1.6, -0.3, 0, 1.2], [-1.5, -0.3, 0, 1.2]].map(([x, y, zz, r], j) => (
            <mesh key={j} material={blanc} position={[x, y, zz]}><icosahedronGeometry args={[r, 0]} /></mesh>
          ))}
        </group>
      ))}
    </group>
  );
};

const Eclair: React.FC<{v: number; orage: number}> = ({v, orage}) => {
  const mat = useMat('#fff7c2', {emissive: '#fff3a0', emissiveIntensity: 2});
  if (v < 0.4) return null;
  const z = -34 + orage * 10;
  const pts: V3[] = [[0, 6, 0], [0.8, 4.5, 0], [-0.3, 3.2, 0], [0.7, 1.6, 0], [-0.2, 0, 0]];
  return (
    <group position={[-1, 0, z]}>
      {pts.slice(1).map((b, i) => {
        const a = pts[i];
        const dx = b[0] - a[0], dy = b[1] - a[1];
        const l = Math.hypot(dx, dy);
        return (
          <mesh key={i} material={mat} position={[(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, 0]} rotation={[0, 0, Math.atan2(dy, dx) - Math.PI / 2]}>
            <boxGeometry args={[0.18, l, 0.18]} />
          </mesh>
        );
      })}
    </group>
  );
};

const Pluie: React.FC<{v: number; centre: V3}> = ({v, centre}) => {
  const frame = useCurrentFrame();
  const mat = useMat('#cfe8ff', {transparent: true, opacity: 0.65});
  const gouttes = useMemo(() => Array.from({length: 260}, (_, i) => [hasard(i) * 12 - 6, hasard(i + 400) * 10, hasard(i + 900) * 12 - 6]), []);
  if (v <= 0.01) return null;
  return (
    <group position={[centre[0], 0, centre[2]]}>
      {gouttes.slice(0, Math.round(260 * v)).map(([x, y0, z], i) => {
        const y = 10 - ((y0 + frame * 0.45) % 10);
        return <mesh key={i} material={mat} position={[x, y, z]} rotation={[0, 0, 0.15]}><boxGeometry args={[0.018, 0.4, 0.018]} /></mesh>;
      })}
    </group>
  );
};

/* ------------------------------------------------------------------ silhouettes des paliers */

const geoBateau = (() => {
  const bloc = (w: number, h: number, d: number, x: number, y: number) => new THREE.BoxGeometry(w, h, d).translate(x, y, 0);
  return mergeGeometries([bloc(7.6, 1.2, 1.3, 0, 0.6), bloc(3.2, 1.1, 1.0, -0.3, 1.75), bloc(0.5, 1.1, 0.5, 0.6, 2.85)]);
})();
const geoVolcan = new THREE.CylinderGeometry(1.1, 5, 5.5, 9);
geoVolcan.translate(0, 2.75, 0);
const geoBloc = new THREE.BoxGeometry(1.4, 1.1, 1.4);
geoBloc.translate(0, 0.55, 0);

/* ------------------------------------------------------------------ scène complète */

/**
 * cabanesDef : les cabanes d'une branche (vrais pseudos). parcellesVote : où poser les blocs mystère et les lettres
 * du vote en cours (par défaut, les parcelles du pilote). children : constructions propres à une branche / un épisode.
 */
export const Monde: React.FC<{etat: Etat; cabanesDef?: DefCabane[]; parcellesVote?: V3[]; tailleMystere?: number; children?: React.ReactNode}> = ({
  etat, cabanesDef = CABANES, parcellesVote = PARCELLES, tailleMystere = 1, children,
}) => {
  const {
    cam, robin, pluie = 0, orage = 0, eclair = 0, radeaux = 0, foule = 0,
    cabanes = [], bateau = 0, volcan = 0, mysteres = [], lettres = [], constructions = [], etiquettes = 0, cielDegage = false,
  } = etat;
  return (
    <>
      <Camera {...cam} />
      <Ambiance orage={orage} eclair={eclair} />
      <Ocean />
      <Ile />
      {PALMIERS.map((p, i) => <Palmier key={i} {...p} graine={i * 1.3} />)}
      <Robin {...robin} />
      {FOULE.map((p, i) => <Naufrage key={i} p={p} graine={i} echelle={Math.max(0, Math.min(1, foule - i))} />)}
      {[-2.36, -1.57, 3.14, 2.36, -1.1, 1.87].map((a, i) => (
        <PetitRadeau key={i} angle={a} graine={i * 2} p={radeaux * 1.15 - i * 0.04} />
      ))}
      {cabanesDef.map((c, i) => <Cabane key={i} p={c.p} couleur={c.c} pseudo={c.pseudo} or={c.or} murs={c.murs} e={cabanes[i] ?? 0} etiq={etiquettes} />)}
      {parcellesVote.map((p, i) => (
        <group key={i}>
          <VolumeMystere geometrie={geoBloc} position={p} echelle={(mysteres[i] ?? 0) * tailleMystere} />
          <Lettre lettre={'ABC'[i]} position={[p[0], p[1] + 0.5 + 1.45 * tailleMystere, p[2]]} echelle={lettres[i] ?? 0} />
        </group>
      ))}
      <group position={PARCELLES[0]}><Abri e={constructions[0] ?? 0} /></group>
      <group position={PARCELLES[1]}><Feu e={constructions[1] ?? 0} /></group>
      <group position={PARCELLES[2]}><Radeau e={constructions[2] ?? 0} /></group>
      <VolumeMystere geometrie={geoBateau} position={[-17, 0.1, 5]} echelle={bateau * 1.2} rotation={[0, Math.PI / 2, 0]} />
      <VolumeMystere geometrie={geoVolcan} position={[9, 0, -26]} echelle={volcan * 1.3} />
      {children}
      {!cielDegage && <Nuages orage={orage} />}
      <Eclair v={eclair} orage={orage} />
      <Pluie v={pluie} centre={[cam.cible[0], 0, cam.cible[2]]} />
    </>
  );
};
