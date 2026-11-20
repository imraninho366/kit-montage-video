import {useThree} from '@react-three/fiber';
import {useMemo} from 'react';
import {useCurrentFrame} from 'remotion';
import * as THREE from 'three';
import {mergeGeometries} from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {Etiquette, Lettre, VolumeMystere, useMat} from '../ile/outils3d';

type V3 = [number, number, number];

/** Tout ce que la timeline peut piloter dans l'hémicycle, image par image. */
export type EtatAssemblee = {
  cam: {pos: V3; cible: V3; fov?: number};
  greffier: {humeur: 'triste' | 'joyeux'; bras?: 'repos' | 'montre' | 'salue'};
  deputes?: number;        // nombre de sièges occupés (fractionnaire : le dernier député apparaît en douceur)
  etiquettes?: number;     // pseudos au-dessus de quelques députés
  lignes?: number;         // 0 → 1 : la loi s'écrit dans le Code
  loiNom?: number;         // étiquette « LOI @TOI » au-dessus du Code
  constitution?: number;   // silhouette du palier 1 000
  trone?: number;          // silhouette du palier 10 000
  mysteres?: number[];     // volumes en pointillés sur les 3 parcelles
  lettres?: number[];      // pastilles au-dessus des parcelles
  lettresTexte?: string;   // une lettre par parcelle (« ??? » puis « ABC »)
  constructions?: number[];// lit, trottinette interdite, pièces
  bords?: number;          // > 0,5 : les tenues prennent la couleur du camp (gauche rouge, centre jaune, droite bleu, sans étiquette gris)
  president?: number;      // député au perchoir + étiquette (épisode 2 : demande d'un abonné)
  presidentNom?: string;
  presidentEtiquette?: number; // l'étiquette seule (sinon elle suit president)
};

/* ------------------------------------------------------------------ géométrie de l'hémicycle */

const RANGS = 7;
const OUVERTURE = 1.45; // demi-angle de l'hémicycle (rad)
const rayon = (k: number) => 3.4 + k * 0.78;
const hauteur = (k: number) => 0.32 * k;

type Siege = {p: V3; rot: number; ordre: number};
/** Sièges rangés par ordre de remplissage : du premier rang vers le fond, en partant du centre. */
export const SIEGES: Siege[] = (() => {
  const s: (Siege & {cle: number})[] = [];
  for (let k = 0; k < RANGS; k++) {
    const r = rayon(k);
    const n = Math.floor((r * OUVERTURE * 2) / 0.6);
    for (let i = 0; i < n; i++) {
      const a = -OUVERTURE + ((i + 0.5) / n) * OUVERTURE * 2;
      s.push({p: [r * Math.sin(a), hauteur(k), -r * Math.cos(a)], rot: -a, ordre: 0, cle: k * 2 + Math.abs(a) * 3 + ((i * 7) % 5) * 0.15});
    }
  }
  s.sort((x, y) => x.cle - y.cle);
  return s.map((x, i) => ({p: x.p, rot: x.rot, ordre: i}));
})();

/** Gradin : un secteur d'anneau extrudé vers le haut (le centre de l'hémicycle est en z négatif). */
const gradin = (rIn: number, rOut: number, h: number) => {
  const sh = new THREE.Shape();
  const pas = 40;
  for (let i = 0; i <= pas; i++) {
    const a = -OUVERTURE - 0.08 + (i / pas) * (OUVERTURE + 0.08) * 2;
    const x = rOut * Math.sin(a), y = rOut * Math.cos(a);
    if (i === 0) sh.moveTo(x, y); else sh.lineTo(x, y);
  }
  for (let i = pas; i >= 0; i--) {
    const a = -OUVERTURE - 0.08 + (i / pas) * (OUVERTURE + 0.08) * 2;
    sh.lineTo(rIn * Math.sin(a), rIn * Math.cos(a));
  }
  const g = new THREE.ExtrudeGeometry(sh, {depth: h, bevelEnabled: false, curveSegments: 4});
  g.rotateX(-Math.PI / 2); // forme (x, y) → sol (x, -z), extrusion vers le haut
  return g;
};

/* ------------------------------------------------------------------ caméra & ambiance */

const Camera: React.FC<EtatAssemblee['cam']> = ({pos, cible, fov = 40}) => {
  const {camera} = useThree();
  const cam = camera as THREE.PerspectiveCamera;
  cam.position.set(...pos);
  cam.lookAt(...cible);
  if (cam.fov !== fov) { cam.fov = fov; cam.updateProjectionMatrix(); }
  return null;
};

const FOND = new THREE.Color('#f3e3c3');
const Ambiance: React.FC = () => {
  const {scene} = useThree();
  scene.background = FOND;
  scene.fog = new THREE.Fog(FOND, 26, 70);
  return (
    <>
      <hemisphereLight args={['#fff6e6', '#b9875a', 1.3]} />
      <directionalLight position={[5, 14, 9]} intensity={2.3} castShadow
        shadow-mapSize-width={2048} shadow-mapSize-height={2048}
        shadow-camera-left={-11} shadow-camera-right={11} shadow-camera-top={11} shadow-camera-bottom={-11} />
      <ambientLight intensity={0.3} />
    </>
  );
};

/* ------------------------------------------------------------------ décor */

const Salle: React.FC = () => {
  const moquette = useMat('#2f4f9e');
  const marche = useMat('#a8323a');
  const bois = useMat('#9a6235');
  const mur = useMat('#efe0bf', {side: THREE.DoubleSide});
  const or = useMat('#d9a43a', {metalness: 0.3, roughness: 0.5});
  const parquet = useMat('#c48a52');
  const gradins = useMemo(() => Array.from({length: RANGS}, (_, k) => gradin(rayon(k) - 0.45, rayon(k) + 0.33, hauteur(k) + 0.06)), []);
  return (
    <group>
      {/* sol : hémicycle bleu au centre, parquet autour */}
      <mesh material={parquet} position={[0, -0.06, 0]} receiveShadow><boxGeometry args={[40, 0.1, 40]} /></mesh>
      <mesh material={moquette} position={[0, -0.005, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[rayon(0) - 0.45, 40, Math.PI / 2 - OUVERTURE - 0.08 + Math.PI, (OUVERTURE + 0.08) * 2]} />
      </mesh>
      <mesh material={moquette} position={[0, -0.004, 1.4]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[6.4, 2.8]} /></mesh>
      {gradins.map((g, k) => (
        <mesh key={k} geometry={g} material={k % 2 ? marche : moquette} position={[0, -0.06, 0]} receiveShadow castShadow />
      ))}
      {/* pupitres en bois devant chaque rang */}
      {Array.from({length: RANGS}, (_, k) => (
        <mesh key={k} material={bois} position={[0, hauteur(k) + 0.24, 0]} castShadow>
          <cylinderGeometry args={[rayon(k) - 0.36, rayon(k) - 0.36, 0.42, 48, 1, true, Math.PI - OUVERTURE, OUVERTURE * 2]} />
        </mesh>
      ))}
      {/* mur du fond, frise dorée */}
      <mesh material={mur} position={[0, 3, 0]}>
        <cylinderGeometry args={[rayon(RANGS) + 0.6, rayon(RANGS) + 0.6, 7, 48, 1, true, Math.PI - OUVERTURE - 0.2, (OUVERTURE + 0.2) * 2]} />
      </mesh>
      <mesh material={or} position={[0, 4.6, 0]}>
        <cylinderGeometry args={[rayon(RANGS) + 0.5, rayon(RANGS) + 0.5, 0.25, 48, 1, true, Math.PI - OUVERTURE - 0.2, (OUVERTURE + 0.2) * 2]} />
      </mesh>
      {/* colonnes */}
      {[-1.2, -0.6, 0, 0.6, 1.2].map((a, i) => (
        <mesh key={i} material={mur} position={[(rayon(RANGS) + 0.2) * Math.sin(a), 3, -(rayon(RANGS) + 0.2) * Math.cos(a)]} castShadow>
          <cylinderGeometry args={[0.3, 0.34, 7, 10]} />
        </mesh>
      ))}
    </group>
  );
};

const Tribune: React.FC = () => {
  const bois = useMat('#8a5530');
  const boisClair = useMat('#b37a45');
  const or = useMat('#d9a43a', {metalness: 0.3, roughness: 0.5});
  const mur = useMat('#efe0bf');
  const rideau = useMat('#a8323a');
  return (
    <group>
      <mesh material={boisClair} position={[0, 0.15, 2.9]} receiveShadow castShadow><boxGeometry args={[5.4, 0.3, 2.2]} /></mesh>
      {/* tribune de l'orateur */}
      <mesh material={bois} position={[0, 0.75, 2.25]} castShadow><boxGeometry args={[2.2, 1.0, 0.55]} /></mesh>
      <mesh material={or} position={[0, 1.27, 2.08]} rotation={[0.35, 0, 0]}><boxGeometry args={[2.3, 0.06, 0.4]} /></mesh>
      {/* perchoir derrière, plus haut */}
      <mesh material={bois} position={[0, 1.15, 3.55]} castShadow><boxGeometry args={[3.4, 1.7, 0.7]} /></mesh>
      <mesh material={or} position={[0, 2.02, 3.55]}><boxGeometry args={[3.5, 0.06, 0.75]} /></mesh>
      {/* mur et rideaux */}
      <mesh material={mur} position={[0, 3.2, 4.3]}><boxGeometry args={[9, 6.6, 0.3]} /></mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} material={rideau} position={[s * 3.3, 3.1, 4.1]} castShadow><boxGeometry args={[1.4, 6.2, 0.2]} /></mesh>
      ))}
      <mesh material={or} position={[0, 4.4, 4.13]}><torusGeometry args={[0.85, 0.08, 6, 24]} /></mesh>
    </group>
  );
};

/** Le Code : un grand livre ouvert sur un pupitre, au centre de l'hémicycle. */
const Code: React.FC<{lignes: number}> = ({lignes}) => {
  const cuir = useMat('#7a1f28');
  const page = useMat('#fffdf6');
  const encre = useMat('#1b1d24');
  const bois = useMat('#8a5530');
  const or = useMat('#d9a43a', {metalness: 0.3, roughness: 0.5});
  const n = 6;
  return (
    <group position={[0, 0, 0.7]}>
      <mesh material={bois} position={[0, 0.45, 0]} castShadow><cylinderGeometry args={[0.32, 0.45, 0.9, 8]} /></mesh>
      <group position={[0, 1.0, 0]} rotation={[-0.5, 0, 0]}>
        <mesh material={cuir} castShadow><boxGeometry args={[2.1, 0.08, 1.45]} /></mesh>
        <mesh material={or} position={[0, 0.05, 0]}><boxGeometry args={[0.06, 0.04, 1.47]} /></mesh>
        {[-1, 1].map((s) => (
          <group key={s} position={[s * 0.5, 0.08, 0]} rotation={[0, 0, s * -0.07]}>
            <mesh material={page}><boxGeometry args={[0.96, 0.06, 1.32]} /></mesh>
            {/* lignes de la loi qui s'écrivent, page gauche puis page droite */}
            {Array.from({length: n}, (_, i) => {
              const k = (s < 0 ? 0 : n) + i;
              const v = Math.min(1, Math.max(0, lignes * n * 2 - k));
              if (v <= 0) return null;
              const l = (i === 0 ? 0.5 : 0.78) * v;
              return <mesh key={i} material={encre} position={[-0.39 + l / 2, 0.035, -0.5 + i * 0.19]}><boxGeometry args={[l, 0.01, 0.05]} /></mesh>;
            })}
          </group>
        ))}
      </group>
    </group>
  );
};

/* ------------------------------------------------------------------ personnages */

/** Le Greffier : costume sombre, lunettes rondes, moustache. Il garde le Code. */
export const Greffier: React.FC<EtatAssemblee['greffier'] & {position?: V3; rotY?: number}> = ({humeur, bras = 'repos', position = [0, 0.3, 2.75], rotY = Math.PI}) => {
  const frame = useCurrentFrame();
  const peau = useMat('#f0c39a');
  const cheveux = useMat('#d8d4cc');
  const veste = useMat('#1f2a44');
  const chemise = useMat('#ffffff');
  const cravate = useMat('#c8102e');
  const noir = useMat('#1a1410', {roughness: 0.3});
  const blanc = useMat('#ffffff');
  const bouche = useMat('#5a1a10');
  const rose = useMat('#ff8fa3', {transparent: true, opacity: 0.55});
  const lunettes = useMat('#c9962b', {metalness: 0.4, roughness: 0.4});
  const triste = humeur === 'triste';
  const souffle = Math.sin(frame / 9) * 0.015;
  const brasD = bras === 'montre' ? {x: -1.35, z: 0.1} : bras === 'salue' ? {x: -0.25, z: 2.35 + Math.sin(frame / 3) * 0.3} : {x: 0, z: 0.12};
  const sourcils = triste ? 0.38 : -0.12;
  return (
    <group position={position} rotation={[0, rotY, 0]}>
      {[-1, 1].map((s) => (
        <group key={s}>
          <mesh material={veste} position={[s * 0.14, 0.3, 0]} castShadow><cylinderGeometry args={[0.11, 0.11, 0.56, 8]} /></mesh>
          <mesh material={noir} position={[s * 0.14, 0.04, 0.05]}><boxGeometry args={[0.17, 0.09, 0.28]} /></mesh>
        </group>
      ))}
      <group position={[0, souffle, 0]}>
        <mesh material={veste} position={[0, 0.9, 0]} castShadow><boxGeometry args={[0.6, 0.66, 0.36]} /></mesh>
        <mesh material={chemise} position={[0, 1.04, 0.18]} rotation={[0, 0, Math.PI / 4]}><boxGeometry args={[0.2, 0.2, 0.02]} /></mesh>
        <mesh material={cravate} position={[0, 0.92, 0.19]}><boxGeometry args={[0.07, 0.3, 0.02]} /></mesh>
        {[-1, 1].map((s) => {
          const r = s > 0 ? brasD : {x: triste ? -0.15 : 0, z: -0.12};
          return (
            <group key={s} position={[s * 0.38, 1.16, 0]} rotation={[r.x, 0, r.z]}>
              <mesh material={veste} position={[0, -0.22, 0]} castShadow><cylinderGeometry args={[0.085, 0.085, 0.5, 8]} /></mesh>
              <mesh material={peau} position={[0, -0.5, 0]}><icosahedronGeometry args={[0.09, 0]} /></mesh>
            </group>
          );
        })}
        <group position={[0, 1.62, 0]} rotation={[triste ? 0.14 : -0.04, 0, triste ? 0 : Math.sin(frame / 14) * 0.05]}>
          <mesh material={peau} castShadow><icosahedronGeometry args={[0.46, 1]} /></mesh>
          {/* couronne de cheveux gris, crâne dégarni */}
          {[-1, 1].map((s) => <mesh key={s} material={cheveux} position={[s * 0.4, 0.06, -0.08]}><icosahedronGeometry args={[0.17, 0]} /></mesh>)}
          <mesh material={cheveux} position={[0, 0.1, -0.36]}><icosahedronGeometry args={[0.22, 0]} /></mesh>
          {[-1, 1].map((s) => (
            <group key={s}>
              <mesh material={blanc} position={[s * 0.155, 0.05, 0.4]}><sphereGeometry args={[0.1, 14, 10]} /></mesh>
              <mesh material={noir} position={[s * 0.155, 0.04, 0.47]}><sphereGeometry args={[0.065, 14, 10]} /></mesh>
              <mesh material={blanc} position={[s * 0.155 + 0.022, 0.07, 0.53]}><sphereGeometry args={[0.02, 8, 6]} /></mesh>
              <mesh material={lunettes} position={[s * 0.155, 0.05, 0.5]}><torusGeometry args={[0.13, 0.018, 6, 20]} /></mesh>
              <mesh material={cheveux} position={[s * 0.155, 0.22, 0.44]} rotation={[0, 0, s * -sourcils]}><boxGeometry args={[0.17, 0.04, 0.05]} /></mesh>
              <mesh material={rose} position={[s * 0.29, -0.07, 0.36]} rotation={[0, s * 0.6, 0]}><circleGeometry args={[0.07, 12]} /></mesh>
              <mesh material={cheveux} position={[s * 0.09, -0.13, 0.46]} rotation={[0, 0, s * 0.35]}><boxGeometry args={[0.16, 0.05, 0.05]} /></mesh>
            </group>
          ))}
          <mesh material={lunettes} position={[0, 0.05, 0.52]}><boxGeometry args={[0.06, 0.018, 0.018]} /></mesh>
          <mesh material={peau} position={[0, -0.03, 0.47]}><icosahedronGeometry args={[0.065, 0]} /></mesh>
          {triste
            ? <mesh material={bouche} position={[0, -0.25, 0.46]}><torusGeometry args={[0.07, 0.022, 6, 12, Math.PI]} /></mesh>
            : <mesh material={bouche} position={[0, -0.2, 0.465]}><circleGeometry args={[0.1, 16, Math.PI, Math.PI]} /></mesh>}
        </group>
      </group>
    </group>
  );
};

const TENUES = ['#1f2a44', '#3f7fd9', '#7a1f28', '#2bb39b', '#5b4a8a', '#3a3a3a', '#f08a24', '#47c46a'];
const PEAUX = ['#e9b27d', '#c98a5a', '#8a5a3b', '#f2c9a0', '#a8714a'];

/** Camp d'un siège. Les plans larges regardent depuis la tribune (z > 0) vers les gradins : la gauche de l'écran = x < 0. */
export const CAMPS = {gauche: '#d63b3b', centre: '#f2b81f', droite: '#2f5fd0', sans: '#9aa0a8'};
const campDe = (s: Siege) => (s.ordre % 11 === 5 ? CAMPS.sans : s.p[0] < -1.7 ? CAMPS.gauche : s.p[0] > 1.7 ? CAMPS.droite : CAMPS.centre);

const SiegeDepute: React.FC<{s: Siege; occupe: number; bords?: number}> = ({s, occupe, bords = 0}) => {
  const frame = useCurrentFrame();
  const velours = useMat('#b8323c');
  const tenue = useMat(bords > 0.5 ? campDe(s) : TENUES[s.ordre % TENUES.length]);
  const peau = useMat(PEAUX[(s.ordre * 3) % PEAUX.length]);
  const noir = useMat('#1a1410');
  const saut = occupe > 0 ? Math.max(0, Math.sin(frame / 6 + s.ordre * 1.7)) * 0.04 : 0;
  return (
    <group position={s.p} rotation={[0, s.rot, 0]}>
      <mesh material={velours} position={[0, 0.25, 0.05]} castShadow><boxGeometry args={[0.42, 0.12, 0.38]} /></mesh>
      <mesh material={velours} position={[0, 0.5, -0.15]} castShadow><boxGeometry args={[0.42, 0.44, 0.08]} /></mesh>
      {occupe > 0.001 && (
        <group position={[0, saut, 0.02]} scale={occupe}>
          <mesh material={tenue} position={[0, 0.5, 0]} castShadow><cylinderGeometry args={[0.13, 0.16, 0.4, 8]} /></mesh>
          <mesh material={peau} position={[0, 0.84, 0.02]} castShadow><icosahedronGeometry args={[0.17, 1]} /></mesh>
          {[-1, 1].map((k) => <mesh key={k} material={noir} position={[k * 0.06, 0.86, 0.17]}><sphereGeometry args={[0.025, 6, 6]} /></mesh>)}
        </group>
      )}
    </group>
  );
};

/* ------------------------------------------------------------------ constructions du vote */

export const PARCELLES: V3[] = [[-1.8, 0, -1.3], [0, 0, -1.9], [1.8, 0, -1.3]];

const Lit: React.FC<{e: number}> = ({e}) => {
  const bois = useMat('#8a5530');
  const drap = useMat('#ffffff');
  const couette = useMat('#3f7fd9');
  if (e <= 0.001) return null;
  return (
    <group scale={e} rotation={[0, 0.5, 0]}>
      <mesh material={bois} position={[0, 0.18, 0]} castShadow><boxGeometry args={[0.9, 0.24, 1.4]} /></mesh>
      <mesh material={bois} position={[0, 0.45, -0.68]} castShadow><boxGeometry args={[0.9, 0.7, 0.08]} /></mesh>
      <mesh material={drap} position={[0, 0.36, 0]}><boxGeometry args={[0.84, 0.12, 1.32]} /></mesh>
      <mesh material={drap} position={[0, 0.48, -0.45]}><boxGeometry args={[0.6, 0.12, 0.28]} /></mesh>
      <mesh material={couette} position={[0, 0.45, 0.2]} castShadow><boxGeometry args={[0.9, 0.08, 0.9]} /></mesh>
    </group>
  );
};

const Trottinette: React.FC<{e: number}> = ({e}) => {
  const metal = useMat('#2b2f3a');
  const vert = useMat('#2bb39b');
  const rouge = useMat('#e0283f');
  const blanc = useMat('#ffffff');
  if (e <= 0.001) return null;
  return (
    <group scale={e}>
      <group rotation={[0, 0.9, 0]}>
        <mesh material={vert} position={[0, 0.12, 0]} castShadow><boxGeometry args={[0.22, 0.06, 0.9]} /></mesh>
        <mesh material={metal} position={[0, 0.58, 0.42]} rotation={[0.18, 0, 0]} castShadow><cylinderGeometry args={[0.03, 0.03, 0.95, 6]} /></mesh>
        <mesh material={metal} position={[0, 1.04, 0.5]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.025, 0.025, 0.5, 6]} /></mesh>
        {[-0.42, 0.42].map((z) => <mesh key={z} material={metal} position={[0, 0.1, z]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.1, 0.1, 0.06, 12]} /></mesh>)}
      </group>
      {/* panneau d'interdiction devant */}
      <group position={[0, 0.85, 0.55]}>
        <mesh material={blanc}><circleGeometry args={[0.5, 24]} /></mesh>
        <mesh material={rouge} position={[0, 0, 0.01]}><ringGeometry args={[0.4, 0.5, 24]} /></mesh>
        <mesh material={rouge} position={[0, 0, 0.012]} rotation={[0, 0, -Math.PI / 4]}><planeGeometry args={[0.85, 0.11]} /></mesh>
      </group>
    </group>
  );
};

const Pieces: React.FC<{e: number}> = ({e}) => {
  const or = useMat('#f2c230', {metalness: 0.4, roughness: 0.4});
  if (e <= 0.001) return null;
  const piles: [number, number, number][] = [[0, 0, 7], [0.42, 0.15, 4], [-0.38, 0.2, 5], [0.1, -0.4, 3]];
  return (
    <group scale={e}>
      {piles.map(([x, z, n], i) => Array.from({length: n}, (_, j) => (
        <mesh key={`${i}-${j}`} material={or} position={[x, 0.05 + j * 0.09, z]} rotation={[0, j * 0.4, 0]} castShadow>
          <cylinderGeometry args={[0.2, 0.2, 0.08, 14]} />
        </mesh>
      )))}
    </group>
  );
};

/* ------------------------------------------------------------------ silhouettes des paliers */

const geoBloc = new THREE.BoxGeometry(1.3, 1.1, 1.3);
geoBloc.translate(0, 0.55, 0);
const geoTablette = (() => {
  const t = new THREE.BoxGeometry(2.4, 3.2, 0.4).translate(0, 1.6, 0);
  const pied = new THREE.BoxGeometry(2.9, 0.4, 0.8).translate(0, 0.2, 0);
  return mergeGeometries([t, pied]);
})();
const geoTrone = (() => {
  const assise = new THREE.BoxGeometry(1.8, 0.5, 1.6).translate(0, 0.9, 0);
  const dossier = new THREE.BoxGeometry(1.8, 3.0, 0.4).translate(0, 2.4, -0.6);
  const pieds = new THREE.BoxGeometry(1.8, 0.7, 1.4).translate(0, 0.35, 0);
  const accoudoirs = [-1, 1].map((s) => new THREE.BoxGeometry(0.3, 0.6, 1.4).translate(s * 0.95, 1.4, 0));
  return mergeGeometries([assise, dossier, pieds, ...accoudoirs]);
})();

/* ------------------------------------------------------------------ scène complète */

const PSEUDOS = ['@abonne_02', '@abonne_03', '@abonne_04', '@abonne_05', '@abonne_06'];

export const Hemicycle: React.FC<{etat: EtatAssemblee}> = ({etat}) => {
  const {cam, greffier, deputes = 0, etiquettes = 0, lignes = 0, loiNom = 0, constitution = 0, trone = 0, mysteres = [], lettres = [], lettresTexte = 'ABC', constructions = [],
    bords = 0, president = 0, presidentNom = '', presidentEtiquette} = etat;
  return (
    <>
      <Camera {...cam} />
      <Ambiance />
      <Salle />
      <Tribune />
      <Code lignes={lignes} />
      <Greffier {...greffier} />
      {SIEGES.map((s) => <SiegeDepute key={s.ordre} s={s} occupe={Math.max(0, Math.min(1, deputes - s.ordre))} bords={bords} />)}
      {president > 0.001 && (
        <>
          <group position={[0, 1.7, 3.5]} scale={1.5}><SiegeDepute s={{p: [0, 0, 0], rot: Math.PI, ordre: 3}} occupe={president} /></group>
          <Etiquette texte={presidentNom} position={[0, 3.75, 3.4]} hauteur={0.36} echelle={presidentEtiquette ?? president} fond="#ffc928" encre="#2b1a00" />
        </>
      )}
      {PSEUDOS.map((p, i) => {
        const s = SIEGES[i * 7 + 2];
        return <Etiquette key={p} texte={p} position={[s.p[0], s.p[1] + 1.45, s.p[2]]} hauteur={0.34} echelle={etiquettes * Math.min(1, Math.max(0, deputes - s.ordre))} />;
      })}
      <Etiquette texte="LOI @TOI" position={[0, 2.1, 0.7]} hauteur={0.42} echelle={loiNom} fond="#ffc928" encre="#2b1a00" />
      {PARCELLES.map((p, i) => (
        <group key={i}>
          <VolumeMystere geometrie={geoBloc} position={p} echelle={mysteres[i] ?? 0} />
          <Lettre key={lettresTexte[i]} lettre={lettresTexte[i]} position={[p[0], p[1] + 1.85, p[2]]} echelle={lettres[i] ?? 0} />
        </group>
      ))}
      <group position={PARCELLES[0]}><Lit e={constructions[0] ?? 0} /></group>
      <group position={PARCELLES[1]}><Trottinette e={constructions[1] ?? 0} /></group>
      <group position={PARCELLES[2]}><Pieces e={constructions[2] ?? 0} /></group>
      <VolumeMystere geometrie={geoTablette} position={[0, hauteur(RANGS) + 0.5, -rayon(RANGS) + 0.4]} echelle={constitution * 1.3} />
      <VolumeMystere geometrie={geoTrone} position={[0, 0.3, 2.9]} echelle={trone * 1.2} />
    </>
  );
};
