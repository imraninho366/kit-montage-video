import {useThree} from '@react-three/fiber';
import {useMemo} from 'react';
import * as THREE from 'three';
import {hasard, useMat} from '../ile/outils3d';

type V3 = [number, number, number];

/** Épisode 1 : le local technique où le voleur est caché. Tout ce que la timeline peut piloter. */
export type EtatLocal = {
  cam: {pos: V3; cible: V3; fov?: number};
  neon?: number;        // 1 = allumé, 0 = éteint (grésillement piloté par la timeline)
  code?: string;        // chiffres affichés sur le digicode (3 cases), ex. "46" ; vide = "_ _ _"
  voyant?: 'neutre' | 'vert' | 'rouge';
  torche?: number;      // lampe du gardien qui passe sous la porte, 0 → 1
  porte?: number;       // ouverture de la porte, 0 = fermée, 1 = grande ouverte
};

/* Pièce : x de -1.6 à 1.6, z de -1.6 à 1.6, plafond à 2.8 m. La porte est sur le mur du fond (z = -1.6). */
const W = 1.6, H = 2.8;
export const PORTE: V3 = [0.25, 0, -W];
export const DIGICODE: V3 = [-0.4, 1.35, -W + 0.03];
export const AFFICHE: V3 = [-W + 0.02, 1.5, -0.95];
export const PLAQUE: V3 = [0.25, 2.38, -W + 0.02];
export const POSTIT: V3 = [-0.4, 1.63, -W + 0.02];

/* ------------------------------------------------------------------ textures écrites */

const ecrit = (w: number, h: number, dessin: (ctx: CanvasRenderingContext2D) => void) => {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  dessin(c.getContext('2d')!);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
};

/** L'affiche de l'exposition. La bonne réponse (1785) y est écrite en petit, sous le titre. */
const texAffiche = () => ecrit(600, 850, (ctx) => {
  const g = ctx.createLinearGradient(0, 0, 0, 850);
  g.addColorStop(0, '#13204a'); g.addColorStop(1, '#070b1c');
  ctx.fillStyle = g; ctx.fillRect(0, 0, 600, 850);
  ctx.strokeStyle = '#c9a24a'; ctx.lineWidth = 8; ctx.strokeRect(22, 22, 556, 806);
  // le collier dessiné : un arc de pierres et un saphir
  ctx.strokeStyle = '#d9b75a'; ctx.lineWidth = 5;
  ctx.beginPath(); ctx.arc(300, 250, 150, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
  for (let i = 0; i <= 16; i++) {
    const a = (0.15 + 0.7 * i / 16) * Math.PI;
    ctx.fillStyle = '#eef4ff';
    ctx.beginPath(); ctx.arc(300 + Math.cos(a) * 150, 250 + Math.sin(a) * 150, i % 3 === 1 ? 11 : 6, 0, Math.PI * 2); ctx.fill();
  }
  ctx.fillStyle = '#2f62e8'; ctx.beginPath(); ctx.ellipse(300, 425, 20, 27, 0, 0, Math.PI * 2); ctx.fill();
  ctx.textAlign = 'center'; ctx.fillStyle = '#e8c766';
  ctx.font = '700 30px Georgia, serif'; ctx.fillText('EXPOSITION', 300, 530);
  ctx.font = '700 64px Georgia, serif'; ctx.fillText('LE COLLIER', 300, 610); ctx.fillText('DE LA REINE', 300, 680);
  ctx.fillStyle = '#b9c3dc'; ctx.font = 'italic 26px Georgia, serif';
  ctx.fillText('offert à la reine en 1785', 300, 735);
  ctx.font = '22px Georgia, serif'; ctx.fillText('Grande galerie · jusqu’au 31 mars', 300, 790);
});

/** La plaque de laiton au-dessus de la porte : le piège (1875). */
const texPlaque = () => ecrit(700, 140, (ctx) => {
  const g = ctx.createLinearGradient(0, 0, 0, 140);
  g.addColorStop(0, '#d8b45a'); g.addColorStop(0.5, '#a9822f'); g.addColorStop(1, '#c79f45');
  ctx.fillStyle = g; ctx.fillRect(0, 0, 700, 140);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = '#4a3410'; ctx.font = '700 46px Georgia, serif';
  ctx.fillText('MUSÉE FONDÉ EN 1875', 350, 72);
});

/** La feuille du gardien : ses essais ratés au digicode. Solution unique 4-6-3 (vérifiée par programme). */
export const ESSAIS: [string, string][] = [
  ['3 4 5', '2 bons, mal placés'],
  ['4 5 6', '1 bien placé + 1 mal placé'],
  ['0 7 8', 'rien'],
  ['6 7 8', '1 bon, mal placé'],
  ['7 1 3', '1 bien placé'],
];
const texPostit = () => ecrit(720, 780, (ctx) => {
  ctx.fillStyle = '#fbf6e4'; ctx.fillRect(0, 0, 720, 780);
  ctx.strokeStyle = '#b9cbe6'; ctx.lineWidth = 2;
  for (let y = 150; y < 780; y += 110) { ctx.beginPath(); ctx.moveTo(0, y + 30); ctx.lineTo(720, y + 30); ctx.stroke(); }
  ctx.strokeStyle = '#e8a0a0'; ctx.beginPath(); ctx.moveTo(70, 0); ctx.lineTo(70, 780); ctx.stroke();
  ctx.fillStyle = 'rgba(230,220,180,0.7)'; ctx.fillRect(280, -10, 160, 50); // le scotch
  const main = '"Marker Felt", "Bradley Hand", "Comic Sans MS", cursive';
  ctx.fillStyle = '#1d2a8a'; ctx.font = `46px ${main}`; ctx.fillText('Mes essais :', 90, 120);
  ESSAIS.forEach(([code, rep], i) => {
    const y = 230 + i * 110;
    ctx.fillStyle = '#1d2a8a'; ctx.font = `700 50px ${main}`; ctx.fillText(code, 90, y);
    ctx.fillStyle = '#b3261e'; ctx.font = `32px ${main}`; ctx.fillText('→ ' + rep, 245, y - 4);
  });
});

/** L'écran du digicode : 4 cases, remplies au fil de la saisie. */
const texEcran = (code: string, voyant: EtatLocal['voyant']) => ecrit(320, 110, (ctx) => {
  ctx.fillStyle = voyant === 'vert' ? '#0f3d1c' : voyant === 'rouge' ? '#4a0b0b' : '#0b1a12';
  ctx.fillRect(0, 0, 320, 110);
  ctx.fillStyle = voyant === 'rouge' ? '#ff5a5a' : '#6dff9a';
  ctx.font = '700 64px Menlo, monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const cases = Array.from({length: 3}, (_, i) => code[i] ?? '_').join(' ');
  ctx.fillText(cases, 160, 58);
});

/* ------------------------------------------------------------------ caméra & lumière */

const Camera: React.FC<EtatLocal['cam']> = ({pos, cible, fov = 62}) => {
  const {camera} = useThree();
  const cam = camera as THREE.PerspectiveCamera;
  cam.position.set(...pos);
  cam.lookAt(...cible);
  if (cam.fov !== fov) { cam.fov = fov; cam.updateProjectionMatrix(); }
  return null;
};

const Lumieres: React.FC<{neon: number; torche: number}> = ({neon, torche}) => {
  const {scene} = useThree();
  scene.background = new THREE.Color('#05070c');
  scene.fog = null;
  return (
    <>
      <ambientLight color="#5a6a78" intensity={0.25 + 0.2 * neon} />
      {/* le néon froid au plafond : la seule vraie lumière du local */}
      <pointLight color="#d8f0ff" position={[0, H - 0.15, 0]} intensity={9 * neon} distance={7} decay={1.6} castShadow
        shadow-mapSize-width={1024} shadow-mapSize-height={1024} shadow-bias={-0.002} />
      {torche > 0 && <pointLight color="#ffe6b0" position={[PORTE[0] + (torche - 0.5) * 1.6, 0.05, -W - 0.3]} intensity={14 * Math.sin(torche * Math.PI)} distance={3} />}
    </>
  );
};

/* ------------------------------------------------------------------ mobilier */

const Murs: React.FC = () => {
  const beton = useMat('#5d6862', {flatShading: false, roughness: 0.95});
  const sol = useMat('#2b2f33', {flatShading: false, roughness: 0.8});
  const plinthe = useMat('#3a3f3c', {flatShading: false});
  return (
    <group>
      <mesh material={sol} rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[2 * W, 2 * W]} /></mesh>
      <mesh material={beton} rotation={[Math.PI / 2, 0, 0]} position={[0, H, 0]}><planeGeometry args={[2 * W, 2 * W]} /></mesh>
      {([[0, -W, 0], [0, W, Math.PI], [-W, 0, Math.PI / 2], [W, 0, -Math.PI / 2]] as [number, number, number][]).map(([x, z, r], i) => (
        <group key={i} position={[x, 0, z]} rotation={[0, r, 0]}>
          <mesh material={beton} position={[0, H / 2, 0]} receiveShadow><planeGeometry args={[2 * W, H]} /></mesh>
          <mesh material={plinthe} position={[0, 0.06, 0.01]}><boxGeometry args={[2 * W, 0.12, 0.02]} /></mesh>
        </group>
      ))}
    </group>
  );
};

const Neon: React.FC<{neon: number}> = ({neon}) => {
  const tube = useMemo(() => new THREE.MeshBasicMaterial({color: '#eaf6ff'}), []);
  const eteint = useMemo(() => new THREE.MeshBasicMaterial({color: '#4a5258'}), []);
  const support = useMat('#9aa3a8', {flatShading: false});
  return (
    <group position={[0, H - 0.08, 0]}>
      <mesh material={support}><boxGeometry args={[1.3, 0.05, 0.14]} /></mesh>
      <mesh material={neon > 0.5 ? tube : eteint} position={[0, -0.05, 0]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.025, 0.025, 1.2, 10]} /></mesh>
    </group>
  );
};

const Porte: React.FC<{code: string; voyant: EtatLocal['voyant']; torche: number; ouverture: number}> = ({code, voyant, torche, ouverture}) => {
  const vide = useMemo(() => new THREE.MeshBasicMaterial({color: '#2a0a12'}), []);
  const metal = useMat('#7d8790', {flatShading: false, roughness: 0.5, metalness: 0.5});
  const cadre = useMat('#454b50', {flatShading: false, roughness: 0.6});
  const poignee = useMat('#c9ccd0', {flatShading: false, roughness: 0.25, metalness: 0.9});
  const boitier = useMat('#2a2d31', {flatShading: false, roughness: 0.4, metalness: 0.3});
  const touche = useMat('#b7bcc2', {flatShading: false, roughness: 0.4, metalness: 0.4});
  const ecran = useMemo(() => new THREE.MeshBasicMaterial({map: texEcran(code, voyant)}), [code, voyant]);
  const plaque = useMemo(() => new THREE.MeshStandardMaterial({map: texPlaque(), roughness: 0.3, metalness: 0.6}), []);
  const postit = useMemo(() => new THREE.MeshStandardMaterial({map: texPostit(), roughness: 0.9}), []);
  const fente = useMemo(() => new THREE.MeshBasicMaterial({color: new THREE.Color('#ffe6b0').multiplyScalar(0.15 + 1.6 * Math.sin(torche * Math.PI))}), [torche]);
  return (
    <group>
      <group position={[PORTE[0], 0, PORTE[2]]}>
        <mesh material={cadre} position={[0, 1.06, 0.02]}><boxGeometry args={[1.06, 2.14, 0.04]} /></mesh>
        {/* l'embrasure : visible seulement quand la porte s'ouvre (le couloir sombre, teinté par les lasers) */}
        <mesh material={vide} position={[0, 1.04, 0.041]}><planeGeometry args={[0.9, 2.02]} /></mesh>
        {/* le battant tourne autour de ses gonds (bord droit) et s'ouvre vers l'intérieur du local */}
        <group position={[0.45, 0, 0.05]} rotation={[0, ouverture * 1.5, 0]}>
          <group position={[-0.45, 0, -0.05]}>
            <mesh material={metal} position={[0, 1.04, 0.05]} castShadow receiveShadow><boxGeometry args={[0.9, 2.02, 0.04]} /></mesh>
            <mesh material={poignee} position={[-0.34, 1.0, 0.1]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.018, 0.018, 0.14, 10]} /></mesh>
          </group>
        </group>
        {/* la fente sous la porte, où passera la lampe du gardien */}
        <mesh material={fente} position={[0, 0.012, 0.03]}><boxGeometry args={[0.88, 0.02, 0.01]} /></mesh>
      </group>
      <mesh material={postit} position={POSTIT} rotation={[0, 0, 0.03]}><planeGeometry args={[0.24, 0.26]} /></mesh>
      <mesh material={plaque} position={PLAQUE}><boxGeometry args={[0.7, 0.14, 0.015]} /></mesh>
      {/* le digicode : boîtier, écran, 12 touches */}
      <group position={DIGICODE}>
        <mesh material={boitier} castShadow><boxGeometry args={[0.16, 0.24, 0.035]} /></mesh>
        <mesh material={ecran} position={[0, 0.075, 0.019]}><planeGeometry args={[0.12, 0.042]} /></mesh>
        {Array.from({length: 12}, (_, i) => (
          <mesh key={i} material={touche} position={[(i % 3 - 1) * 0.038, 0.02 - Math.floor(i / 3) * 0.036, 0.02]}><boxGeometry args={[0.028, 0.026, 0.01]} /></mesh>
        ))}
      </group>
    </group>
  );
};

/** Étagère métallique chargée de cartons, de bidons et de produits d'entretien. */
const Etagere: React.FC = () => {
  const metal = useMat('#8f979c', {flatShading: false, roughness: 0.5, metalness: 0.5});
  const carton = useMat('#a77c4f');
  const bidon = useMat('#2f6fb3');
  const rouge = useMat('#b8392f');
  const blanc = useMat('#d9dcd6');
  const NIVEAUX = [0.35, 0.95, 1.55, 2.15];
  return (
    <group position={[W - 0.3, 0, 0.1]}>
      {[[-0.25, -0.7], [0.25, -0.7], [-0.25, 0.7], [0.25, 0.7]].map(([x, z], i) => (
        <mesh key={i} material={metal} position={[x, 1.2, z]} castShadow><boxGeometry args={[0.03, 2.4, 0.03]} /></mesh>
      ))}
      {NIVEAUX.map((y, n) => (
        <group key={n} position={[0, y, 0]}>
          <mesh material={metal} castShadow receiveShadow><boxGeometry args={[0.54, 0.025, 1.44]} /></mesh>
          {Array.from({length: 3}, (_, k) => {
            const v = hasard(n * 5 + k);
            const mat = [carton, bidon, rouge, blanc][Math.floor(v * 4)];
            const h = 0.18 + v * 0.22;
            return <mesh key={k} material={mat} position={[-0.05 + v * 0.1, h / 2 + 0.013, -0.45 + k * 0.45]} castShadow><boxGeometry args={[0.32, h, 0.3 + v * 0.08]} /></mesh>;
          })}
        </group>
      ))}
    </group>
  );
};

/** Seau, balai et chariot de ménage dans le coin gauche. */
const Menage: React.FC = () => {
  const seau = useMat('#e2c02a');
  const manche = useMat('#6a4a2a', {flatShading: false});
  const frange = useMat('#d8d4c8');
  return (
    <group position={[-W + 0.4, 0, 1.0]}>
      <mesh material={seau} position={[0, 0.17, 0]} castShadow><cylinderGeometry args={[0.17, 0.14, 0.34, 12]} /></mesh>
      <group position={[0.2, 0, -0.25]} rotation={[0.12, 0, -0.18]}>
        <mesh material={manche} position={[0, 0.75, 0]} castShadow><cylinderGeometry args={[0.015, 0.015, 1.4, 6]} /></mesh>
        <mesh material={frange} position={[0, 0.05, 0]}><cylinderGeometry args={[0.1, 0.13, 0.12, 8]} /></mesh>
      </group>
    </group>
  );
};

/* ------------------------------------------------------------------ assemblage */

export const Local: React.FC<{etat: EtatLocal}> = ({etat}) => {
  const affiche = useMemo(() => new THREE.MeshStandardMaterial({map: texAffiche(), roughness: 0.7}), []);
  const neon = etat.neon ?? 1;
  return (
    <>
      <Camera {...etat.cam} />
      <Lumieres neon={neon} torche={etat.torche ?? 0} />
      <Murs />
      <Neon neon={neon} />
      <Porte code={etat.code ?? ''} voyant={etat.voyant ?? 'neutre'} torche={etat.torche ?? 0} ouverture={etat.porte ?? 0} />
      <mesh material={affiche} position={AFFICHE} rotation={[0, Math.PI / 2, 0]}><planeGeometry args={[0.6, 0.85]} /></mesh>
      <Etagere />
      <Menage />
    </>
  );
};
