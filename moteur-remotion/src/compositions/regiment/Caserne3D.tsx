import {useThree} from '@react-three/fiber';
import {useMemo} from 'react';
import {useCurrentFrame} from 'remotion';
import * as THREE from 'three';
import {Etiquette, Lettre, VolumeMystere, useMat} from '../ile/outils3d';

/**
 * Le Régiment : la chambrée (12 couchettes superposées) et la cour d'honneur, en low-poly façon jouet,
 * avec les outils de L'Île (useMat, Etiquette, Lettre). Régiment fictif : aucun insigne réel.
 * Tout est piloté image par image par un Etat calculé dans la timeline.
 */

type V3 = [number, number, number];

export type Tenue = 'nuit' | 'calecon' | 'treillis' | 'sergent';
export type Coiffe = 'cheveux' | 'casque' | 'casquette';
export type Humeur = 'dort' | 'panique' | 'fier' | 'gene' | 'neutre' | 'hurle' | 'fache' | 'sourit' | 'rit';
export type Pose = 'couche' | 'debout' | 'court' | 'gardeavous' | 'secoue' | 'fier' | 'pointe' | 'assis';

export type DefPerso = {position: V3; rotY?: number; tenue: Tenue; coiffe?: Coiffe; humeur: Humeur; pose: Pose; echelle?: number};

export type Etat = {
  cam: {pos: V3; cible: V3; fov?: number; secousse?: number};
  lieu: 'chambree' | 'cour';
  ciel?: 'aube' | 'nuit';
  neon?: number;              // chambrée : 0 = nuit (clair de lune), 1 = néons allumés
  litBleu?: 'defait' | 'carre' | 'bataille';
  eclatLit?: number;          // scintillement du lit au carré
  dormeurs?: number;          // 0 = tout le monde dort, 1 = tout le monde est réveillé
  etiquettes?: number;        // pseudos au-dessus des lits (chambrée) ou des soldats (cour)
  lettres?: [number, number, number]; // A lit, B casier, C voisins (chambrée)
  bleu?: DefPerso;
  sergent?: DefPerso;
  section?: {n: number; humeur: Humeur; pose: Pose; decalage?: V3}; // soldats alignés dans la cour
  mysteres?: number;          // places « à venir » en pointillés (marche de nuit)
};

/* ------------------------------------------------------------------ décor : positions */

type Lit = {p: V3; cote: 1 | -1; haut: boolean; pseudo: string};
export const PSEUDOS = ['@abonne_02', '@abonne_03', '@abonne_04', '@abonne_05', '@abonne_06', '@abonne_122', '@abonne_189', '@abonne_190', '@abonne_191', '@abonne_192', '@abonne_193'];
export const LITS: Lit[] = (() => {
  const res: Lit[] = [];
  let k = 0;
  for (const z of [1.6, -0.9, -3.4]) {
    for (const cote of [-1, 1] as const) {
      for (const haut of [false, true]) {
        // le lit du Bleu (gauche, devant, en bas) n'a pas de pseudo : c'est le sien
        const bleu = z === 1.6 && cote === -1 && !haut;
        res.push({p: [cote * 2.55, 0, z], cote, haut, pseudo: bleu ? '' : PSEUDOS[k++ % PSEUDOS.length]});
      }
    }
  }
  return res;
})();
export const LIT_BLEU = LITS[0];
export const CASIER_BLEU: V3 = [-3.2, 0, 0.35];
const dessusMatelas = (l: Lit) => (l.haut ? 1.42 : 0.42) + 0.17;

const PEAUX = ['#e9b27d', '#c98a5a', '#8a5a3b', '#f2c9a0', '#a8714a'];
const CHEVEUX = ['#2a1a10', '#5a3a22', '#1a1410', '#8a5a2b', '#141414'];

/* ------------------------------------------------------------------ caméra & lumière */

const Camera: React.FC<Etat['cam']> = ({pos, cible, fov = 45, secousse = 0}) => {
  const {camera} = useThree();
  const frame = useCurrentFrame();
  const cam = camera as THREE.PerspectiveCamera;
  const s = secousse * 0.05;
  cam.position.set(pos[0] + Math.sin(frame * 1.7) * s, pos[1] + Math.cos(frame * 2.3) * s, pos[2]);
  cam.lookAt(...cible);
  if (cam.fov !== fov) { cam.fov = fov; cam.updateProjectionMatrix(); }
  return null;
};

const degrade = (haut: string, bas: string) => {
  const c = document.createElement('canvas');
  c.width = 4; c.height = 256;
  const ctx = c.getContext('2d')!;
  const g = ctx.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0, haut); g.addColorStop(0.55, haut); g.addColorStop(1, bas);
  ctx.fillStyle = g; ctx.fillRect(0, 0, 4, 256);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
};

const LumiereChambree: React.FC<{neon: number}> = ({neon}) => {
  const {scene} = useThree();
  scene.background = new THREE.Color('#0a0f1e');
  scene.fog = null;
  return (
    <>
      <ambientLight intensity={0.45 + 0.35 * neon} color={neon > 0.5 ? '#ffffff' : '#9aaee8'} />
      <hemisphereLight args={['#c4d4ff', '#3a4052', 0.75 + 0.6 * neon]} />
      {/* clair de lune bleuté par les fenêtres */}
      <directionalLight position={[6, 5, 4]} intensity={1.3 * (1 - neon) + 0.3} color="#9fb4ff" />
      {[-2.6, 0, 2.6].map((z, i) => (
        <pointLight key={i} position={[0, 2.85, z]} intensity={neon * 9} distance={7} color="#f4f8ff" />
      ))}
    </>
  );
};

const LumiereCour: React.FC<{ciel: 'aube' | 'nuit'}> = ({ciel}) => {
  const {scene} = useThree();
  const tex = useMemo(() => (ciel === 'aube' ? degrade('#26386b', '#f3a46a') : degrade('#04060d', '#1a2444')), [ciel]);
  scene.background = tex;
  scene.fog = new THREE.Fog(ciel === 'aube' ? '#8a7f92' : '#0c1222', 24, 75);
  const nuit = ciel === 'nuit';
  return (
    <>
      <hemisphereLight args={[nuit ? '#5a6fa8' : '#ffd9b8', nuit ? '#10131c' : '#4a4f63', nuit ? 0.6 : 1.15]} />
      <directionalLight position={[8, 10, 9]} intensity={nuit ? 0.55 : 2.0} color={nuit ? '#9fb4ff' : '#ffc9a0'} castShadow
        shadow-mapSize-width={2048} shadow-mapSize-height={2048}
        shadow-camera-left={-10} shadow-camera-right={10} shadow-camera-top={10} shadow-camera-bottom={-10} />
      <ambientLight intensity={nuit ? 0.18 : 0.3} />
    </>
  );
};

/* ------------------------------------------------------------------ chambrée */

const Piece: React.FC<{neon: number}> = ({neon}) => {
  const sol = useMat('#5d6a7a', {side: THREE.DoubleSide});
  const joint = useMat('#4c5866');
  const mur = useMat('#b9c7a5', {side: THREE.DoubleSide});
  const plinthe = useMat('#5b6b4a');
  const plafond = useMat('#d9ddd2', {side: THREE.DoubleSide});
  const vitre = useMat('#1c2b5a', {emissive: '#2a3f88', emissiveIntensity: 0.6});
  const cadre = useMat('#e6e6dc');
  const porte = useMat('#6b4a2e');
  const tube = useMat('#ffffff', {emissive: '#ffffff', emissiveIntensity: 0.15 + neon * 1.6});
  return (
    <group>
      <mesh material={sol} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -1]} receiveShadow><planeGeometry args={[7.6, 11]} /></mesh>
      {[-2.5, -1.25, 0, 1.25, 2.5].map((x) => (
        <mesh key={x} material={joint} position={[x, 0.003, -1]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[0.03, 11]} /></mesh>
      ))}
      <mesh material={plafond} rotation={[Math.PI / 2, 0, 0]} position={[0, 3.1, -1]}><planeGeometry args={[7.6, 11]} /></mesh>
      {[-1, 1].map((s) => (
        <group key={s}>
          <mesh material={mur} position={[s * 3.8, 1.55, -1]} rotation={[0, Math.PI / 2, 0]}><planeGeometry args={[11, 3.1]} /></mesh>
          <mesh material={plinthe} position={[s * 3.78, 0.12, -1]}><boxGeometry args={[0.04, 0.24, 11]} /></mesh>
          {[-3.4, 0.3].map((z) => (
            <group key={z} position={[s * 3.77, 2.35, z]}>
              <mesh material={cadre}><boxGeometry args={[0.06, 0.9, 1.5]} /></mesh>
              <mesh material={vitre} position={[-s * 0.01, 0, 0]}><boxGeometry args={[0.06, 0.76, 1.35]} /></mesh>
            </group>
          ))}
        </group>
      ))}
      <mesh material={mur} position={[0, 1.55, -6.5]}><planeGeometry args={[7.6, 3.1]} /></mesh>
      <mesh material={mur} position={[0, 1.55, 4.5]} rotation={[0, Math.PI, 0]}><planeGeometry args={[7.6, 3.1]} /></mesh>
      <mesh material={cadre} position={[0, 1.15, -6.47]}><boxGeometry args={[1.35, 2.35, 0.06]} /></mesh>
      <mesh material={porte} position={[0, 1.1, -6.44]}><boxGeometry args={[1.15, 2.2, 0.06]} /></mesh>
      {[-2.6, 0, 2.6].map((z) => (
        <mesh key={z} material={tube} position={[0, 3.04, z]}><boxGeometry args={[0.16, 0.08, 1.4]} /></mesh>
      ))}
    </group>
  );
};

const LitSuperpose: React.FC<{p: V3; cote: 1 | -1}> = ({p, cote}) => {
  const metal = useMat('#7f8a96', {roughness: 0.5});
  const matelas = useMat('#e8e4d8');
  return (
    <group position={p}>
      {[[-1, -1], [-1, 1], [1, -1], [1, 1]].map(([a, b], i) => (
        <mesh key={i} material={metal} position={[a * 1.0, 1.05, b * 0.45]}><cylinderGeometry args={[0.035, 0.035, 2.1, 6]} /></mesh>
      ))}
      {[0.42, 1.42].map((y) => (
        <group key={y}>
          <mesh material={metal} position={[0, y, 0]}><boxGeometry args={[2.04, 0.06, 0.94]} /></mesh>
          <mesh material={matelas} position={[0, y + 0.1, 0]} receiveShadow><boxGeometry args={[1.95, 0.14, 0.86]} /></mesh>
        </group>
      ))}
      {[0.75, 1.05, 1.3].map((y) => (
        <mesh key={y} material={metal} position={[-cote * 1.0, y, 0]}><boxGeometry args={[0.04, 0.03, 0.6]} /></mesh>
      ))}
    </group>
  );
};

/** Couverture + oreiller. défait (bosselé), au carré (impeccable, scintille), champ de bataille (en vrac). */
const Literie: React.FC<{lit: Lit; etat?: 'defait' | 'carre' | 'bataille'; eclat?: number; occupe: boolean}> = ({lit, etat = 'defait', eclat = 0, occupe}) => {
  const frame = useCurrentFrame();
  const couverture = useMat('#56663f');
  const drap = useMat('#f4f1e8');
  const oreiller = useMat('#ffffff');
  const etoile = useMat('#fff3a0', {emissive: '#ffe066', emissiveIntensity: 1.5});
  const c = lit.cote; // l'oreiller est côté mur (x = +c)
  return (
    <group position={[lit.p[0], dessusMatelas(lit), lit.p[2]]}>
      {etat === 'bataille' ? (
        <>
          <mesh material={couverture} position={[-0.2 * c, 0.14, 0.1]} rotation={[0.35, 0.6, 0.25]}><boxGeometry args={[1.1, 0.24, 0.8]} /></mesh>
          <mesh material={drap} position={[0.3 * c, 0.1, -0.12]} rotation={[0.1, -0.5, -0.35]}><boxGeometry args={[0.9, 0.12, 0.7]} /></mesh>
          <mesh material={oreiller} position={[-c * 1.25, -0.45, 0.65]} rotation={[0.4, 0.8, 1.1]}><boxGeometry args={[0.5, 0.14, 0.32]} /></mesh>
        </>
      ) : etat === 'carre' ? (
        <>
          <mesh material={couverture} position={[-c * 0.12, 0.03, 0]}><boxGeometry args={[1.7, 0.06, 0.88]} /></mesh>
          <mesh material={drap} position={[c * 0.6, 0.065, 0]}><boxGeometry args={[0.3, 0.02, 0.88]} /></mesh>
          <mesh material={oreiller} position={[c * 0.8, 0.1, 0]}><boxGeometry args={[0.28, 0.12, 0.7]} /></mesh>
          {eclat > 0 && [[-0.4, 0.35, 0.3], [0.3, 0.5, -0.2], [0.7, 0.3, 0.35], [-0.8, 0.45, -0.3], [0, 0.6, 0.1]].map(([x, yy, z], i) => {
            const s = Math.max(0, Math.sin(frame / 4 + i * 1.7)) * eclat * 0.11;
            return <mesh key={i} material={etoile} position={[x, yy, z]} rotation={[0, 0, frame / 10]} scale={s}><octahedronGeometry args={[1, 0]} /></mesh>;
          })}
        </>
      ) : (
        <>
          <mesh material={oreiller} position={[c * 0.78, 0.07, 0]} rotation={[0, 0, 0.05]}><boxGeometry args={[0.32, 0.14, 0.62]} /></mesh>
          <mesh material={couverture} position={[-c * (occupe ? 0.45 : 0.25), occupe ? 0.2 : 0.08, 0.02]} rotation={[0.03, 0.04, -0.03]}>
            <boxGeometry args={[occupe ? 1.0 : 1.35, occupe ? 0.3 : 0.12, 0.9]} />
          </mesh>
        </>
      )}
    </group>
  );
};

const Casier: React.FC<{p: V3; rotY?: number}> = ({p, rotY = 0}) => {
  const tole = useMat('#6f7f5a', {roughness: 0.5});
  const fente = useMat('#3a4430');
  return (
    <group position={p} rotation={[0, rotY, 0]}>
      <mesh material={tole} position={[0, 0.95, 0]} castShadow><boxGeometry args={[0.55, 1.9, 0.6]} /></mesh>
      {[1.6, 1.5, 1.4].map((y) => <mesh key={y} material={fente} position={[0, y, 0.305]}><boxGeometry args={[0.3, 0.03, 0.02]} /></mesh>)}
      <mesh material={fente} position={[0.18, 1.0, 0.31]}><boxGeometry args={[0.04, 0.12, 0.03]} /></mesh>
    </group>
  );
};

/* ------------------------------------------------------------------ cour d'honneur */

const Cour: React.FC<{nuit: boolean}> = ({nuit}) => {
  const frame = useCurrentFrame();
  const bitume = useMat('#6e727a');
  const ligne = useMat('#e8e8e0');
  const facade = useMat('#d8c9a6');
  const toit = useMat('#7a4a3a');
  const vitre = useMat(nuit ? '#ffd66b' : '#3a4a6a', nuit ? {emissive: '#ffb84a', emissiveIntensity: 0.9} : {emissive: '#ffcf7a', emissiveIntensity: 0.25});
  const mat = useMat('#cfd4da', {roughness: 0.4});
  const bleu = useMat('#1f3f9a', {side: THREE.DoubleSide});
  const blanc = useMat('#f4f4f4', {side: THREE.DoubleSide});
  const rouge = useMat('#d42a2a', {side: THREE.DoubleSide});
  const arbre = useMat('#3f6b3a');
  const tronc = useMat('#6b4a2e');
  const ondule = (k: number) => Math.sin(frame / 6 + k) * 0.08;
  return (
    <group>
      <mesh material={bitume} rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[80, 80]} /></mesh>
      {[-4, 0, 4].map((x) => <mesh key={x} material={ligne} position={[x, 0.01, -1]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[0.08, 9]} /></mesh>)}
      <mesh material={ligne} position={[0, 0.01, 3.5]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[9, 0.08]} /></mesh>
      <group position={[0, 0, -11]}>
        <mesh material={facade} position={[0, 2.6, 0]} castShadow receiveShadow><boxGeometry args={[24, 5.2, 3]} /></mesh>
        <mesh material={toit} position={[0, 5.55, 0]}><boxGeometry args={[24.6, 0.7, 3.4]} /></mesh>
        {Array.from({length: 11}).map((_, i) => [1.4, 3.6].map((y) => (
          <mesh key={`${i}-${y}`} material={vitre} position={[-10 + i * 2, y, 1.52]}><boxGeometry args={[0.9, 1.1, 0.05]} /></mesh>
        )))}
      </group>
      <group position={[5.2, 0, -5]}>
        <mesh material={mat} position={[0, 3.5, 0]} castShadow><cylinderGeometry args={[0.06, 0.08, 7, 8]} /></mesh>
        {[bleu, blanc, rouge].map((m, i) => (
          <mesh key={i} material={m} position={[0.35 + i * 0.6, 6.4 + ondule(i), ondule(i + 1) * 0.5]} rotation={[0, ondule(i) * 2, 0]}><planeGeometry args={[0.6, 1.0]} /></mesh>
        ))}
      </group>
      {([[-9, -7], [-7, -8.5], [9, -7.5], [11, -6]] as [number, number][]).map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          <mesh material={tronc} position={[0, 0.8, 0]}><cylinderGeometry args={[0.15, 0.2, 1.6, 6]} /></mesh>
          <mesh material={arbre} position={[0, 2.4, 0]} castShadow><icosahedronGeometry args={[1.3, 0]} /></mesh>
        </group>
      ))}
    </group>
  );
};

/* ------------------------------------------------------------------ personnages */

export const Perso: React.FC<DefPerso & {graine?: number; peau?: string; cheveux?: string; detaille?: boolean}> = ({
  position, rotY = 0, tenue, coiffe = 'cheveux', humeur, pose, echelle = 1, graine = 0, peau = '#e9b27d', cheveux = '#3a2516', detaille = true,
}) => {
  const frame = useCurrentFrame();
  const mPeau = useMat(peau);
  const mCheveux = useMat(cheveux);
  const kaki = useMat(tenue === 'sergent' ? '#3f4a2c' : '#5f6f3a');
  const kakiFonce = useMat(tenue === 'sergent' ? '#2d3520' : '#47552a');
  const tshirt = useMat('#6b7a45');
  const short = useMat('#6d7480');
  const calecon = useMat('#e0283f');
  const pois = useMat('#ffffff');
  const botte = useMat('#1c1a18');
  const casque = useMat('#55663a');
  const casquette = useMat('#2f3a22');
  const noir = useMat('#1a1410', {roughness: 0.3});
  const blanc = useMat('#ffffff');
  const bouche = useMat('#3a0d08');
  const rose = useMat('#ff6f8a', {transparent: true, opacity: 0.55});
  const sueur = useMat('#8fd3ff', {transparent: true, opacity: 0.9});
  const poils = useMat('#2a1a10');
  const galon = useMat('#ffc928', {emissive: '#a07800', emissiveIntensity: 0.2});

  const t = frame + graine * 17;
  const course = pose === 'court' ? Math.sin(t / 2.6) : 0;
  const rire = humeur === 'rit' ? Math.abs(Math.sin(t / 3)) * 0.06 : 0;
  const souffle = Math.sin(t / 9) * 0.012 + rire;
  const jambe = (s: number) => (pose === 'court' ? s * course * 0.7 : pose === 'assis' ? -1.5 : 0);
  const bras = (s: number): {x: number; z: number} => {
    switch (pose) {
      case 'court': return {x: -s * course * 0.9, z: s * 0.15};
      case 'secoue': return {x: -1.3 + Math.sin(t / 1.6 + s) * 0.3, z: s * 0.05};
      case 'fier': return {x: 0.2, z: s * 0.75};
      case 'pointe': return s > 0 ? {x: -1.5, z: 0.1} : {x: 0, z: -0.12};
      case 'gardeavous': return {x: 0, z: s * 0.04};
      default: return {x: humeur === 'rit' ? -0.6 : 0, z: s * 0.12};
    }
  };
  const veste = tenue === 'treillis' || tenue === 'sergent';
  const corps = veste ? kaki : tshirt;
  const nu = tenue === 'calecon' || tenue === 'nuit';
  const sourcils = {panique: 0.45, gene: 0.4, fache: -0.45, hurle: -0.55, fier: -0.1, sourit: -0.05, rit: 0, neutre: 0, dort: 0}[humeur];
  const pupille = humeur === 'panique' ? 0.035 : 0.06;

  return (
    <group position={position} rotation={[0, rotY, 0]} scale={echelle}>
      {[-1, 1].map((s) => (
        <group key={s} position={[s * 0.14, 0.62, 0]} rotation={[jambe(s), 0, 0]}>
          <mesh material={nu ? mPeau : kakiFonce} position={[0, -0.32, 0]} castShadow><cylinderGeometry args={[0.105, 0.1, 0.6, 8]} /></mesh>
          <mesh material={nu ? mPeau : botte} position={[0, -0.6, 0.06]}><boxGeometry args={[0.17, 0.1, 0.3]} /></mesh>
        </group>
      ))}
      <mesh material={tenue === 'calecon' ? calecon : tenue === 'nuit' ? short : kakiFonce} position={[0, 0.66, 0]} castShadow><boxGeometry args={[0.52, 0.26, 0.32]} /></mesh>
      {tenue === 'calecon' && [[-0.15, 0.7], [0.08, 0.6], [0.18, 0.74], [-0.04, 0.76], [-0.2, 0.58], [0.2, 0.6]].map(([x, y], i) => (
        <mesh key={i} material={pois} position={[x, y, 0.162]}><circleGeometry args={[0.032, 8]} /></mesh>
      ))}
      <group position={[0, souffle, 0]}>
        <mesh material={corps} position={[0, 1.02, 0]} castShadow><boxGeometry args={[0.58, 0.52, 0.34]} /></mesh>
        {veste && (
          <>
            <mesh material={kakiFonce} position={[0, 0.8, 0.005]}><boxGeometry args={[0.6, 0.06, 0.35]} /></mesh>
            <mesh material={kakiFonce} position={[0, 1.04, 0.172]}><boxGeometry args={[0.03, 0.46, 0.01]} /></mesh>
            {[-1, 1].map((s) => <mesh key={s} material={kakiFonce} position={[s * 0.15, 1.12, 0.173]}><boxGeometry args={[0.14, 0.1, 0.01]} /></mesh>)}
            {Array.from({length: tenue === 'sergent' ? 3 : 1}).map((_, i) => (
              <mesh key={i} material={galon} position={[-0.15, 1.2 - i * 0.045, 0.176]}><boxGeometry args={[0.1, 0.022, 0.01]} /></mesh>
            ))}
          </>
        )}
        {[-1, 1].map((s) => {
          const r = bras(s);
          return (
            <group key={s} position={[s * 0.37, 1.2, 0]} rotation={[r.x, 0, r.z]}>
              <mesh material={corps} position={[0, -0.1, 0]}><boxGeometry args={[0.18, 0.22, 0.2]} /></mesh>
              <mesh material={veste ? kaki : mPeau} position={[0, -0.3, 0]} castShadow><cylinderGeometry args={[0.075, 0.072, 0.38, 8]} /></mesh>
              <mesh material={mPeau} position={[0, -0.52, 0]}><icosahedronGeometry args={[0.09, 0]} /></mesh>
            </group>
          );
        })}
        <group position={[0, 1.66, 0]} rotation={[humeur === 'gene' ? 0.18 : humeur === 'hurle' ? -0.12 : 0, 0, humeur === 'rit' ? Math.sin(t / 3) * 0.12 : 0]}>
          <mesh material={mPeau} castShadow><icosahedronGeometry args={[0.44, 1]} /></mesh>
          {[-1, 1].map((s) => <mesh key={s} material={mPeau} position={[s * 0.43, -0.02, 0]}><sphereGeometry args={[0.09, 8, 6]} /></mesh>)}
          {coiffe === 'cheveux' && <mesh material={mCheveux} position={[0, 0.06, -0.02]}><sphereGeometry args={[0.455, 14, 8, 0, Math.PI * 2, 0, 1.15]} /></mesh>}
          {coiffe === 'casque' && (
            <>
              <mesh material={casque} position={[0, 0.2, -0.02]}><sphereGeometry args={[0.5, 16, 10, 0, Math.PI * 2, 0, 1.4]} /></mesh>
              <mesh material={casque} position={[0, 0.22, -0.02]}><cylinderGeometry args={[0.55, 0.57, 0.05, 18]} /></mesh>
            </>
          )}
          {coiffe === 'casquette' && (
            <>
              <mesh material={casquette} position={[0, 0.24, -0.02]}><cylinderGeometry args={[0.42, 0.46, 0.3, 16]} /></mesh>
              <mesh material={casquette} position={[0, 0.12, 0.36]} rotation={[0.2, 0, 0]}><boxGeometry args={[0.5, 0.04, 0.28]} /></mesh>
            </>
          )}
          {detaille && (
            <>
              {[-1, 1].map((s) => (
                <group key={s}>
                  {humeur === 'dort' ? (
                    <mesh material={noir} position={[s * 0.15, 0.03, 0.42]}><boxGeometry args={[0.14, 0.025, 0.03]} /></mesh>
                  ) : (
                    <>
                      <mesh material={blanc} position={[s * 0.15, 0.04, 0.37]}><sphereGeometry args={[humeur === 'panique' ? 0.12 : 0.1, 14, 10]} /></mesh>
                      <mesh material={noir} position={[s * 0.15, 0.03, humeur === 'panique' ? 0.48 : 0.45]}><sphereGeometry args={[pupille, 12, 8]} /></mesh>
                    </>
                  )}
                  <mesh material={tenue === 'sergent' ? poils : mCheveux} position={[s * 0.15, 0.2, 0.41]} rotation={[0, 0, s * -sourcils]}><boxGeometry args={[0.16, 0.04, 0.05]} /></mesh>
                  {(humeur === 'gene' || humeur === 'rit') && <mesh material={rose} position={[s * 0.27, -0.06, 0.36]} rotation={[0, s * 0.6, 0]}><circleGeometry args={[0.075, 12]} /></mesh>}
                </group>
              ))}
              <mesh material={mPeau} position={[0, -0.04, 0.44]}><icosahedronGeometry args={[0.06, 0]} /></mesh>
              {tenue === 'sergent' && <mesh material={poils} position={[0, -0.12, 0.42]}><boxGeometry args={[0.28, 0.06, 0.06]} /></mesh>}
              {humeur === 'hurle' || humeur === 'panique'
                ? <mesh material={bouche} position={[0, -0.24, 0.415]} scale={[1.25, humeur === 'hurle' ? 0.85 + Math.sin(t / 2) * 0.12 : 0.7, 1]}><circleGeometry args={[0.1, 14]} /></mesh>
                : humeur === 'sourit' || humeur === 'fier' || humeur === 'rit'
                  ? <mesh material={bouche} position={[0, -0.18, 0.425]}><circleGeometry args={[humeur === 'rit' ? 0.13 : 0.11, 16, Math.PI, Math.PI]} /></mesh>
                  : humeur === 'dort'
                    ? <mesh material={bouche} position={[0, -0.2, 0.425]}><circleGeometry args={[0.035, 10]} /></mesh>
                    : <mesh material={bouche} position={[0, humeur === 'neutre' ? -0.2 : -0.26, 0.42]} rotation={[0, 0, humeur === 'neutre' ? Math.PI : 0]}>
                        <torusGeometry args={[0.07, 0.022, 6, 12, Math.PI]} />
                      </mesh>}
              {humeur === 'panique' && <mesh material={sueur} position={[0.36, 0.14, 0.3]} scale={[0.7, 1, 0.7]}><sphereGeometry args={[0.07, 10, 8]} /></mesh>}
            </>
          )}
        </group>
      </group>
    </group>
  );
};

const ECH_LIT = 0.82;

/** Couché sur le côté dans sa couchette, la tête contre le mur, le visage vers l'allée (et la caméra). */
const Couche: React.FC<{lit: Lit; humeur: Humeur; graine: number; peau: string; cheveux: string}> = ({lit, humeur, graine, peau, cheveux}) => (
  // pieds côté allée ; une rotation z de -cote·90° couche le personnage, la tête vers le mur
  <group position={[lit.p[0] - lit.cote * 0.78, dessusMatelas(lit) + 0.26, lit.p[2]]} rotation={[0, 0, -lit.cote * Math.PI / 2]}>
    <Perso position={[0, 0, 0]} tenue="nuit" humeur={humeur} pose="debout" echelle={ECH_LIT} graine={graine} peau={peau} cheveux={cheveux} />
  </group>
);

/** Réveillé : assis au bord (couchette du haut) ou debout dans l'allée (couchette du bas, la tête taperait). */
const Reveille: React.FC<{lit: Lit; graine: number; peau: string; cheveux: string}> = ({lit, graine, peau, cheveux}) => lit.haut ? (
  <Perso position={[lit.p[0] - lit.cote * 0.45, dessusMatelas(lit) - 0.62 * ECH_LIT + 0.04, lit.p[2]]} rotY={-lit.cote * Math.PI / 2}
    tenue="nuit" humeur="panique" pose="assis" echelle={ECH_LIT} graine={graine} peau={peau} cheveux={cheveux} />
) : (
  <Perso position={[lit.p[0] - lit.cote * 1.45, 0, lit.p[2] + 0.2]} rotY={-lit.cote * Math.PI / 2 * 0.6}
    tenue="nuit" humeur="panique" pose="court" echelle={ECH_LIT} graine={graine} peau={peau} cheveux={cheveux} />
);

const geoPlace = new THREE.CapsuleGeometry(0.28, 0.9, 4, 10);
geoPlace.translate(0, 0.75, 0);

/* ------------------------------------------------------------------ scène complète */

export const Caserne: React.FC<{etat: Etat}> = ({etat}) => {
  const {cam, lieu, ciel = 'aube', neon = 0, litBleu = 'defait', eclatLit = 0, dormeurs = 0, etiquettes = 0, lettres = [0, 0, 0], bleu, sergent, section, mysteres = 0} = etat;
  return (
    <>
      <Camera {...cam} />
      {lieu === 'chambree' ? (
        <>
          <LumiereChambree neon={neon} />
          <Piece neon={neon} />
          {LITS.filter((l) => !l.haut).map((l, i) => <LitSuperpose key={i} p={l.p} cote={l.cote} />)}
          <Casier p={CASIER_BLEU} rotY={Math.PI / 2} />
          <Casier p={[3.2, 0, 0.35]} rotY={-Math.PI / 2} />
          <Casier p={[-3.15, 0, -2.15]} rotY={Math.PI / 2} />
          <Casier p={[3.15, 0, -2.15]} rotY={-Math.PI / 2} />
          {LITS.map((l, i) => {
            if (i === 0) {
              return <Literie key={i} lit={l} etat={litBleu} eclat={eclatLit} occupe={bleu?.pose === 'couche'} />;
            }
            const reveil = dormeurs * 1.4 - (i % 5) * 0.08 > 0.5;
            const peau = PEAUX[i % PEAUX.length], cheveux = CHEVEUX[i % CHEVEUX.length];
            return (
              <group key={i}>
                <Literie lit={l} occupe={!reveil} />
                {reveil ? <Reveille lit={l} graine={i} peau={peau} cheveux={cheveux} /> : <Couche lit={l} humeur="dort" graine={i} peau={peau} cheveux={cheveux} />}
                <Etiquette texte={l.pseudo} position={[l.p[0] - l.cote * 0.2, dessusMatelas(l) + (l.haut ? 0.95 : 0.62), l.p[2]]} echelle={etiquettes} hauteur={0.24} />
              </group>
            );
          })}
          {bleu && (bleu.pose === 'couche'
            ? <Couche lit={LIT_BLEU} humeur={bleu.humeur} graine={0} peau="#e8b07c" cheveux="#4a2e18" />
            : <Perso {...bleu} peau="#e8b07c" cheveux="#4a2e18" />)}
          <Lettre lettre="A" position={[LIT_BLEU.p[0] + 0.3, 1.25, LIT_BLEU.p[2]]} echelle={lettres[0]} taille={0.6} />
          <Lettre lettre="B" position={[CASIER_BLEU[0], 2.35, CASIER_BLEU[2]]} echelle={lettres[1]} taille={0.6} />
          <Lettre lettre="C" position={[0, 2.35, -2.2]} echelle={lettres[2]} taille={0.6} />
        </>
      ) : (
        <>
          <LumiereCour ciel={ciel} />
          <Cour nuit={ciel === 'nuit'} />
          {section && Array.from({length: section.n}).map((_, i) => {
            const rang = Math.floor(i / 5), col = i % 5;
            const d = section.decalage ?? [0, 0, 0];
            const p: V3 = [-2.4 + col * 1.2 + d[0], 0, -1.2 - rang * 1.3 + d[2]];
            return (
              <group key={i}>
                <Perso position={p} tenue="treillis" coiffe="casque" humeur={section.humeur} pose={section.pose} graine={i + 3}
                  peau={PEAUX[(i + 2) % PEAUX.length]} echelle={0.92} detaille={rang < 2} />
                <Etiquette texte={PSEUDOS[i % PSEUDOS.length]} position={[p[0], 2.4, p[2]]} echelle={etiquettes} hauteur={0.24} />
              </group>
            );
          })}
          {mysteres > 0 && [-0.8, 0.8].map((x, i) => {
            const e = Math.min(1, Math.max(0, mysteres * 1.6 - i * 0.2));
            return (
              <group key={i}>
                <VolumeMystere geometrie={geoPlace} position={[x, 0, 1.2]} echelle={e * 0.92} />
                <Etiquette texte="@ton_pseudo" position={[x, 2.1, 1.2]} echelle={e} hauteur={0.17} fond="#ffc928" encre="#2b1a00" />
              </group>
            );
          })}
          {bleu && <Perso {...bleu} peau="#e8b07c" cheveux="#4a2e18" />}
        </>
      )}
      {sergent && <Perso {...sergent} coiffe="casquette" peau="#d9a273" echelle={sergent.echelle ?? 1.12} />}
    </>
  );
};
