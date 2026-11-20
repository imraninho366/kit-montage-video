import {useThree} from '@react-three/fiber';
import {useMemo} from 'react';
import * as THREE from 'three';
import {hasard, useMat} from '../ile/outils3d';

type V3 = [number, number, number];

/** Tout ce que la timeline d'un épisode peut piloter dans la galerie. */
export type EtatMusee = {
  cam: {pos: V3; cible: V3; fov?: number};
  lasers?: number;      // 0 = coupés, 1 = actifs
  lasersOn?: number[];  // laser par laser (1 = allumé, 0 = coupé), pour l'énigme des coupures
  numeros?: number;     // pastilles numérotées sur les faisceaux, 0 → 1
  alarme?: number;      // gyrophare rouge 0 → 1
  vitrine?: number;     // 0 = fermée, 1 = cloche levée
  diamants?: number[];  // éclat des 6 grands diamants (un par épisode)
};

/* Galerie : x de -4 à 4, z de -15 à 5, plafond à 5 m. La vitrine est au centre, en z = -4. */
const L = 4, Z0 = -15, Z1 = 5, H = 5;
export const VITRINE: V3 = [0, 0, -4];

/* ------------------------------------------------------------------ textures dessinées */

const canvasTexture = (w: number, h: number, dessin: (ctx: CanvasRenderingContext2D) => void, repeat?: [number, number]) => {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  dessin(c.getContext('2d')!);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...repeat); }
  return t;
};

/** Parquet à lames décalées, teintes de chêne ciré. */
const parquet = () => canvasTexture(512, 512, (ctx) => {
  const lame = 64, long = 256;
  for (let y = 0; y < 512; y += lame) {
    const dec = ((y / lame) % 2) * (long / 2);
    for (let x = -long; x < 512; x += long) {
      const v = hasard(x * 0.13 + y * 7.1);
      ctx.fillStyle = `hsl(${26 + v * 6}, ${42 + v * 10}%, ${24 + v * 9}%)`;
      ctx.fillRect(x + dec, y, long - 3, lame - 3);
    }
  }
}, [7, 18]);

/** Tableaux de la collection : paysage, portrait, nature morte, marine. */
const TABLEAUX: ((ctx: CanvasRenderingContext2D) => void)[] = [
  (ctx) => { // paysage au couchant
    const g = ctx.createLinearGradient(0, 0, 0, 300);
    g.addColorStop(0, '#f2b45a'); g.addColorStop(1, '#c4573a');
    ctx.fillStyle = g; ctx.fillRect(0, 0, 400, 300);
    ctx.fillStyle = '#5a3a2a'; ctx.beginPath(); ctx.moveTo(0, 220); ctx.quadraticCurveTo(140, 150, 400, 210); ctx.lineTo(400, 300); ctx.lineTo(0, 300); ctx.fill();
    ctx.fillStyle = '#2f2a24'; ctx.beginPath(); ctx.moveTo(0, 260); ctx.quadraticCurveTo(220, 200, 400, 270); ctx.lineTo(400, 300); ctx.lineTo(0, 300); ctx.fill();
  },
  (ctx) => { // portrait de la reine
    ctx.fillStyle = '#1d2a3a'; ctx.fillRect(0, 0, 300, 400);
    ctx.fillStyle = '#4a6a8a'; ctx.beginPath(); ctx.ellipse(150, 380, 120, 110, 0, Math.PI, 0); ctx.fill();
    ctx.fillStyle = '#e8c7a8'; ctx.beginPath(); ctx.ellipse(150, 170, 52, 66, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#d9d2c4'; ctx.beginPath(); ctx.ellipse(150, 110, 70, 55, 0, Math.PI, 0); ctx.fill();
    ctx.strokeStyle = '#f4f0ff'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(150, 250, 48, 0.2, Math.PI - 0.2); ctx.stroke();
  },
  (ctx) => { // nature morte
    ctx.fillStyle = '#2a2018'; ctx.fillRect(0, 0, 400, 300);
    ctx.fillStyle = '#6b4a2a'; ctx.fillRect(0, 210, 400, 90);
    [['#b8352a', 130], ['#d99a2b', 200], ['#6f8a3a', 265]].forEach(([c, x]) => {
      ctx.fillStyle = c as string; ctx.beginPath(); ctx.arc(x as number, 190, 34, 0, Math.PI * 2); ctx.fill();
    });
  },
  (ctx) => { // marine
    const g = ctx.createLinearGradient(0, 0, 0, 300);
    g.addColorStop(0, '#9fb8c8'); g.addColorStop(0.55, '#e7dcc0'); g.addColorStop(0.56, '#3d6378'); g.addColorStop(1, '#1f3b4a');
    ctx.fillStyle = g; ctx.fillRect(0, 0, 400, 300);
    ctx.fillStyle = '#efe6d2'; ctx.beginPath(); ctx.moveTo(190, 70); ctx.lineTo(190, 160); ctx.lineTo(250, 160); ctx.fill();
    ctx.fillStyle = '#3a2a20'; ctx.fillRect(150, 160, 120, 14);
  },
];

/* ------------------------------------------------------------------ caméra & lumières */

const Camera: React.FC<EtatMusee['cam']> = ({pos, cible, fov = 55}) => {
  const {camera} = useThree();
  const cam = camera as THREE.PerspectiveCamera;
  cam.position.set(...pos);
  cam.lookAt(...cible);
  if (cam.fov !== fov) { cam.fov = fov; cam.updateProjectionMatrix(); }
  return null;
};

/** Projecteur pointé sur une cible fixe (r3f ne gère pas la cible tout seul). */
const Projecteur: React.FC<{pos: V3; cible: V3; couleur: string; intensite: number; angle: number; ombre?: boolean}> = ({pos, cible, couleur, intensite, angle, ombre}) => {
  const lum = useMemo(() => {
    const s = new THREE.SpotLight(couleur, intensite, 14, angle, 0.55, 1.6);
    s.position.set(...pos);
    s.target.position.set(...cible);
    if (ombre) { s.castShadow = true; s.shadow.mapSize.set(1024, 1024); s.shadow.bias = -0.0004; }
    return s;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [couleur, intensite, angle, ombre]);
  return <><primitive object={lum} /><primitive object={lum.target} /></>;
};

const Ambiance: React.FC<{alarme: number}> = ({alarme}) => {
  const {scene} = useThree();
  const fond = new THREE.Color('#070a14').lerp(new THREE.Color('#2a0508'), alarme * 0.6);
  scene.background = fond;
  scene.fog = new THREE.Fog(fond, 9, 26);
  return (
    <>
      <ambientLight color="#4a5a8a" intensity={0.55} />
      {/* clair de lune qui tombe de la verrière */}
      <directionalLight color="#8fa8ff" position={[2.5, 14, 1]} intensity={1.1} castShadow
        shadow-mapSize-width={2048} shadow-mapSize-height={2048}
        shadow-camera-left={-6} shadow-camera-right={6} shadow-camera-top={12} shadow-camera-bottom={-12} />
      {/* le spot de la vitrine : la seule lumière chaude de la salle */}
      <Projecteur pos={[0, H - 0.1, VITRINE[2] + 0.4]} cible={[0, 1.2, VITRINE[2]]} couleur="#fff1d6" intensite={90} angle={0.32} ombre />
      {alarme > 0 && <pointLight color="#ff1e2d" position={[0, H - 0.4, 1]} intensity={40 * alarme} distance={16} />}
    </>
  );
};

/* ------------------------------------------------------------------ architecture */

const Salle: React.FC = () => {
  const sol = useMemo(() => new THREE.MeshStandardMaterial({map: parquet(), roughness: 0.35, metalness: 0.05}), []);
  const mur = useMat('#7a2a34', {flatShading: false, roughness: 0.95});
  const lambris = useMat('#2a1c18', {flatShading: false, roughness: 0.7});
  const moulure = useMat('#b08a4a', {flatShading: false, roughness: 0.4, metalness: 0.5});
  const plafond = useMat('#1a1c26', {flatShading: false});
  const verre = useMemo(() => new THREE.MeshBasicMaterial({color: '#0d1630'}), []);
  const long = Z1 - Z0, zc = (Z0 + Z1) / 2;
  return (
    <group>
      <mesh material={sol} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, zc]} receiveShadow><planeGeometry args={[2 * L, long]} /></mesh>
      {[-1, 1].map((s) => (
        <group key={s}>
          <mesh material={mur} position={[s * L, H / 2, zc]} rotation={[0, -s * Math.PI / 2, 0]} receiveShadow><planeGeometry args={[long, H]} /></mesh>
          <mesh material={lambris} position={[s * (L - 0.04), 0.55, zc]} receiveShadow><boxGeometry args={[0.08, 1.1, long]} /></mesh>
          <mesh material={moulure} position={[s * (L - 0.06), 1.12, zc]}><boxGeometry args={[0.1, 0.05, long]} /></mesh>
          <mesh material={moulure} position={[s * (L - 0.08), H - 0.15, zc]}><boxGeometry args={[0.16, 0.12, long]} /></mesh>
          {/* pilastres qui rythment la galerie */}
          {[-12, -8, -4, 0, 4].map((z) => (
            <mesh key={z} material={lambris} position={[s * (L - 0.12), H / 2, z]} castShadow receiveShadow><boxGeometry args={[0.24, H, 0.36]} /></mesh>
          ))}
        </group>
      ))}
      <mesh material={mur} position={[0, H / 2, Z0]} receiveShadow><planeGeometry args={[2 * L, H]} /></mesh>
      {/* plafond percé d'une verrière centrale */}
      {[-1, 1].map((s) => (
        <mesh key={s} material={plafond} position={[s * (L - 1.5), H, zc]} rotation={[Math.PI / 2, 0, 0]} castShadow><planeGeometry args={[3, long]} /></mesh>
      ))}
      <mesh material={verre} position={[0, H + 0.3, zc]} rotation={[Math.PI / 2, 0, 0]}><planeGeometry args={[2, long]} /></mesh>
      {/* armature de la verrière : ses barreaux projettent leur ombre sur le parquet */}
      {Array.from({length: 11}, (_, i) => (
        <mesh key={i} material={plafond} position={[0, H + 0.05, Z0 + i * 2]} castShadow><boxGeometry args={[2, 0.05, 0.05]} /></mesh>
      ))}
      <mesh material={plafond} position={[0, H + 0.05, zc]} castShadow><boxGeometry args={[0.06, 0.06, long]} /></mesh>
    </group>
  );
};

/** Tableau encadré, éclairé par sa petite rampe. */
const Tableau: React.FC<{pos: V3; cote: 1 | -1; motif: number; w: number; h: number}> = ({pos, cote, motif, w, h}) => {
  const toile = useMemo(() => new THREE.MeshStandardMaterial({
    map: canvasTexture(w > h ? 400 : 300, w > h ? 300 : 400, TABLEAUX[motif]), roughness: 0.8,
  }), [motif, w, h]);
  const cadre = useMat('#a37b3a', {roughness: 0.35, metalness: 0.6});
  const cartel = useMat('#e9e2d0', {flatShading: false});
  return (
    <group position={pos} rotation={[0, -cote * Math.PI / 2, 0]}>
      <mesh material={cadre} castShadow><boxGeometry args={[w + 0.24, h + 0.24, 0.08]} /></mesh>
      <mesh material={toile} position={[0, 0, 0.045]}><planeGeometry args={[w, h]} /></mesh>
      <mesh material={cartel} position={[w / 2 + 0.35, -h / 2 + 0.1, 0.02]}><boxGeometry args={[0.22, 0.14, 0.01]} /></mesh>
      <Projecteur pos={[0, h / 2 + 0.6, 0.7]} cible={[0, 0, 0]} couleur="#ffd9a0" intensite={6} angle={0.7} />
    </group>
  );
};

/** Buste de marbre sur son socle. */
const Buste: React.FC<{pos: V3}> = ({pos}) => {
  const marbre = useMat('#d8d4cc', {roughness: 0.5});
  const socle = useMat('#1f1f26', {flatShading: false, roughness: 0.6});
  return (
    <group position={pos}>
      <mesh material={socle} position={[0, 0.55, 0]} castShadow receiveShadow><boxGeometry args={[0.5, 1.1, 0.5]} /></mesh>
      <mesh material={marbre} position={[0, 1.3, 0]} castShadow><cylinderGeometry args={[0.18, 0.3, 0.4, 8]} /></mesh>
      <mesh material={marbre} position={[0, 1.62, 0]} castShadow><icosahedronGeometry args={[0.17, 1]} /></mesh>
    </group>
  );
};

/** Caméra de surveillance avec son voyant rouge. */
const CameraSurveillance: React.FC<{pos: V3; rotY: number}> = ({pos, rotY}) => {
  const boitier = useMat('#cfd3da', {roughness: 0.4});
  const led = useMemo(() => new THREE.MeshBasicMaterial({color: '#ff2a2a'}), []);
  return (
    <group position={pos} rotation={[0.35, rotY, 0]}>
      <mesh material={boitier} castShadow><boxGeometry args={[0.18, 0.16, 0.42]} /></mesh>
      <mesh material={led} position={[0.05, 0.05, 0.22]}><sphereGeometry args={[0.02, 8, 6]} /></mesh>
      <pointLight color="#ff2a2a" intensity={0.4} distance={1.2} position={[0, 0, 0.3]} />
    </group>
  );
};

/* ------------------------------------------------------------------ la vitrine et le collier */

/** Collier de la reine : une rivière de petites pierres et 6 grands diamants, un par épisode. */
const Collier: React.FC<{diamants: number[]}> = ({diamants}) => {
  const or = useMat('#e2b84a', {roughness: 0.25, metalness: 0.9});
  const petite = useMemo(() => new THREE.MeshStandardMaterial({color: '#ffffff', roughness: 0.05, metalness: 0.2, emissive: '#bcd8ff', emissiveIntensity: 0.5, flatShading: true}), []);
  const grande = useMemo(() => new THREE.MeshStandardMaterial({color: '#ffffff', roughness: 0.02, metalness: 0.1, emissive: '#d6e8ff', emissiveIntensity: 0.9, flatShading: true}), []);
  const eteinte = useMemo(() => new THREE.MeshStandardMaterial({color: '#3a3f4a', roughness: 0.6, flatShading: true}), []);
  const saphir = useMemo(() => new THREE.MeshStandardMaterial({color: '#1d4fd8', roughness: 0.05, emissive: '#1a3aa8', emissiveIntensity: 0.8, flatShading: true}), []);
  // la chaîne fait le tour du cou et retombe en V sur la poitrine du présentoir
  const point = (u: number): V3 => {
    const a = Math.PI * (0.06 + 0.88 * u);
    const creux = Math.sin(a) ** 3;
    return [Math.cos(a) * 0.19, -creux * 0.13, Math.sin(a) * 0.15 + creux * 0.03];
  };
  const GRANDS = [0.2, 0.31, 0.42, 0.58, 0.69, 0.8];
  const chaine = useMemo(() => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(
    Array.from({length: 30}, (_, i) => new THREE.Vector3(...point(i / 29)))), 60, 0.004, 5), []);
  return (
    <group>
      <mesh geometry={chaine} material={or} />
      {Array.from({length: 26}, (_, i) => {
        const p = point(i / 25);
        return <mesh key={i} material={petite} position={p} scale={0.011}><octahedronGeometry args={[1, 0]} /></mesh>;
      })}
      {GRANDS.map((u, i) => {
        const [x, y, z] = point(u);
        const eclat = diamants[i] ?? 1;
        return (
          <group key={i} position={[x, y - 0.035, z + 0.012]}>
            <mesh material={or} position={[0, 0.022, 0]}><torusGeometry args={[0.009, 0.003, 6, 10]} /></mesh>
            <mesh material={eclat > 0.5 ? grande : eteinte} scale={[0.02, 0.03, 0.014]} rotation={[0, Math.PI / 4, 0]}><octahedronGeometry args={[1, 0]} /></mesh>
          </group>
        );
      })}
      {/* le pendentif central : un saphir serti d'or */}
      <group position={[0, -0.2, 0.2]}>
        <mesh material={or}><torusGeometry args={[0.034, 0.007, 8, 20]} /></mesh>
        <mesh material={saphir} scale={[0.028, 0.038, 0.016]}><octahedronGeometry args={[1, 0]} /></mesh>
      </group>
    </group>
  );
};

const Vitrine: React.FC<{ouverture: number; diamants: number[]}> = ({ouverture, diamants}) => {
  const socle = useMat('#111218', {flatShading: false, roughness: 0.3, metalness: 0.4});
  const filet = useMat('#b08a4a', {flatShading: false, roughness: 0.3, metalness: 0.7});
  const velours = useMat('#16224a', {flatShading: false, roughness: 1});
  const verre = useMemo(() => new THREE.MeshPhysicalMaterial({color: '#cfe4ff', transparent: true, opacity: 0.12, roughness: 0, metalness: 0, depthWrite: false}), []);
  const aretes = useMemo(() => new THREE.LineBasicMaterial({color: '#e6f0ff', transparent: true, opacity: 0.55}), []);
  const cloche = useMemo(() => new THREE.BoxGeometry(1, 1.05, 1), []);
  const bords = useMemo(() => new THREE.EdgesGeometry(cloche), [cloche]);
  return (
    <group position={VITRINE}>
      <mesh material={socle} position={[0, 0.5, 0]} castShadow receiveShadow><boxGeometry args={[1.2, 1, 1.2]} /></mesh>
      <mesh material={filet} position={[0, 1.01, 0]}><boxGeometry args={[1.24, 0.03, 1.24]} /></mesh>
      {/* présentoir de joaillier en velours : buste, épaules et cou */}
      <mesh material={velours} position={[0, 1.2, 0]} scale={[0.36, 0.34, 0.2]} castShadow><sphereGeometry args={[1, 32, 20, 0, Math.PI * 2, 0, Math.PI / 2]} /></mesh>
      <mesh material={velours} position={[0, 1.66, -0.01]} castShadow><cylinderGeometry args={[0.1, 0.13, 0.36, 24]} /></mesh>
      <group position={[0, 1.6, 0]}><Collier diamants={diamants} /></group>
      {/* la cloche de verre se soulève quand la vitrine s'ouvre */}
      <group position={[0, 1.55 + ouverture * 1.3, 0]}>
        <mesh geometry={cloche} material={verre} renderOrder={5} />
        <lineSegments geometry={bords} material={aretes} />
      </group>
    </group>
  );
};

/** Faisceaux laser en travers de l'allée, devant la vitrine. */
/** Pastille ronde numérotée posée sur un faisceau (blanc, bord rouge, chiffre sombre). */
const texNumero = (n: number) => {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#ff3344'; ctx.beginPath(); ctx.arc(64, 64, 62, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(64, 64, 50, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#1b1d24'; ctx.font = '900 80px Montserrat, Arial, sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(String(n), 64, 70);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
};
const NUMEROS = [1, 2, 3, 4, 5].map(texNumero);
// abscisse de la pastille sur chaque faisceau : décalées pour ne pas se chevaucher vues de l'entrée
const X_NUMERO = [-0.5, 0.45, -0.35, 0.6, 0.05];

const Lasers: React.FC<{actifs: number; on?: number[]; numeros?: number}> = ({actifs, on = [], numeros = 0}) => {
  const coeur = useMemo(() => new THREE.MeshBasicMaterial({color: '#ff3b3b', fog: false}), []);
  const halo = useMemo(() => new THREE.MeshBasicMaterial({color: '#ff1a1a', transparent: true, opacity: 0.18, blending: THREE.AdditiveBlending, depthWrite: false, fog: false}), []);
  const emetteur = useMat('#2a2d36', {roughness: 0.4, metalness: 0.6});
  if (actifs <= 0.01) return null;
  const FAISCEAUX: [number, number, number][] = [ // [hauteur gauche, hauteur droite, z]
    [0.35, 0.9, -0.6], [1.4, 0.5, -0.9], [0.8, 1.6, -1.3], [1.9, 1.1, -1.6], [0.5, 0.5, -2.0],
  ];
  return (
    <group>
      {FAISCEAUX.map(([ya, yb, z], i) => {
        const a = new THREE.Vector3(-L + 0.25, ya, z), b = new THREE.Vector3(L - 0.25, yb, z);
        const milieu = a.clone().add(b).multiplyScalar(0.5);
        const long = a.distanceTo(b);
        const angle = Math.atan2(yb - ya, b.x - a.x);
        return (
          <group key={i}>
            <group position={milieu.toArray()} rotation={[0, 0, angle - Math.PI / 2]} scale={[actifs * (on[i] ?? 1), 1, actifs * (on[i] ?? 1)]}>
              <mesh material={coeur}><cylinderGeometry args={[0.008, 0.008, long, 6]} /></mesh>
              <mesh material={halo}><cylinderGeometry args={[0.04, 0.04, long, 8]} /></mesh>
            </group>
            {[a, b].map((p, j) => (
              <mesh key={j} material={emetteur} position={p.toArray()}><boxGeometry args={[0.1, 0.12, 0.12]} /></mesh>
            ))}
            <pointLight color="#ff2020" intensity={0.8 * actifs * (on[i] ?? 1)} distance={2.2} position={milieu.toArray()} />
            {numeros > 0.01 && (() => {
              const k = (X_NUMERO[i] - a.x) / (b.x - a.x);
              const p = a.clone().lerp(b, k);
              return (
                <sprite position={[p.x, p.y, p.z + 0.06]} scale={[0.2 * numeros, 0.2 * numeros, 1]} renderOrder={12}>
                  <spriteMaterial map={NUMEROS[i]} depthTest={false} transparent fog={false} />
                </sprite>
              );
            })()}
          </group>
        );
      })}
    </group>
  );
};

/* ------------------------------------------------------------------ assemblage */

export const Musee: React.FC<{etat: EtatMusee}> = ({etat}) => (
  <>
    <Camera {...etat.cam} />
    <Ambiance alarme={etat.alarme ?? 0} />
    <Salle />
    <Tableau pos={[-L + 0.05, 2.5, 1.8]} cote={-1} motif={0} w={1.8} h={1.3} />
    <Tableau pos={[L - 0.05, 2.6, 1.8]} cote={1} motif={1} w={1.2} h={1.6} />
    <Tableau pos={[-L + 0.05, 2.5, -6]} cote={-1} motif={2} w={1.6} h={1.2} />
    <Tableau pos={[L - 0.05, 2.5, -6]} cote={1} motif={3} w={1.8} h={1.3} />
    <Tableau pos={[-L + 0.05, 2.6, -10]} cote={-1} motif={1} w={1.2} h={1.6} />
    <Tableau pos={[L - 0.05, 2.5, -10]} cote={1} motif={0} w={1.6} h={1.2} />
    <Buste pos={[-2.6, 0, -1.5]} />
    <Buste pos={[2.6, 0, -1.5]} />
    <Buste pos={[-2.6, 0, -8]} />
    <Buste pos={[2.6, 0, -8]} />
    <CameraSurveillance pos={[L - 0.3, H - 0.6, 4.2]} rotY={-2.6} />
    <CameraSurveillance pos={[-L + 0.3, H - 0.6, -13.5]} rotY={0.6} />
    <Lasers actifs={etat.lasers ?? 1} on={etat.lasersOn} numeros={etat.numeros ?? 0} />
    <Vitrine ouverture={etat.vitrine ?? 0} diamants={etat.diamants ?? [1, 1, 1, 1, 1, 1]} />
  </>
);
