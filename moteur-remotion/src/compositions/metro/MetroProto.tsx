import {loadFont as chargerBaloo} from '@remotion/google-fonts/Baloo2';
import {noise2D} from '@remotion/noise';
import {ThreeCanvas} from '@remotion/three';
import {useFrame, useThree} from '@react-three/fiber';
import React, {useMemo, useRef} from 'react';
import {AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import * as THREE from 'three';
import {mergeVertices} from 'three/examples/jsm/utils/BufferGeometryUtils.js';

/**
 * Prototype muet « Dernier Métro » : moteur visuel du format POV toon.
 * 3D toon (aplats à 3 tons + contours épais par coque inversée), couleurs chaudes,
 * rendu dans une texture puis déformé en fisheye, mains et téléphone accrochés à la caméra.
 * Tout dépend de l'image courante : aucune animation n'a d'état propre.
 */
export const DUREE_METRO_PROTO = 600;

const {fontFamily: BALOO} = chargerBaloo('normal', {weights: ['800'], subsets: ['latin']});
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const fen = (f: number, a: number, b: number, de = 0, vers = 1, easing?: (t: number) => number) =>
  interpolate(f, [a, b], [de, vers], {...clamp, easing});
const doux = Easing.inOut(Easing.cubic);

// ------------------------------------------------------------------ chronologie (images)
const T_FREIN = 240; // la rame freine
const T_ARRET = 272;
const T_CLIGNOTE = 292;
const T_NOIR = 332; // secours
const T_NOTIF = 362; // message du numéro inconnu
const T_REGARD = 430; // on relève les yeux : elle nous fixe déjà
const T_PAROLE = 478;
const T_CHOIX = 540;

// ------------------------------------------------------------------ palette chaude
const C = {
  mur: '#f7ecd6', murBas: '#e6cfa6', plafond: '#fdf6e8', sol: '#c2ae96', siege: '#3f93a0', siegeDos: '#2f7884',
  barre: '#f5c04a', cadre: '#7d5a42', tunnel: '#4a3328', lampe: '#ffd27a', porte: '#8fa2a6',
  peau: '#f1b98c', manche: '#2c3b6b', tel: '#1c1c22', manteau: '#c8452f', echarpe: '#f0c040', cheveux: '#3a2219', jean: '#34477a',
  contour: '#24150f', coin: '#1e2140',
};

// ------------------------------------------------------------------ matériaux toon
const gradient = (() => {
  const d = new Uint8Array([178, 222, 255]);
  const t = new THREE.DataTexture(d, 3, 1, THREE.RedFormat);
  t.minFilter = t.magFilter = THREE.NearestFilter;
  t.needsUpdate = true;
  return t;
})();
const cacheToon = new Map<string, THREE.MeshToonMaterial>();
const toon = (c: string) => {
  if (!cacheToon.has(c)) cacheToon.set(c, new THREE.MeshToonMaterial({color: c, gradientMap: gradient}));
  return cacheToon.get(c)!;
};
const matContour = new THREE.ShaderMaterial({
  uniforms: {epaisseur: {value: 0.0105}, couleur: {value: new THREE.Color(C.contour)}},
  vertexShader: `uniform float epaisseur;
    void main(){
      vec4 mv = modelViewMatrix * vec4(position, 1.0);
      vec3 n = normalize(normalMatrix * normal);
      mv.xyz += n * epaisseur * max(0.35, -mv.z);
      gl_Position = projectionMatrix * mv;
    }`,
  fragmentShader: `uniform vec3 couleur; void main(){ gl_FragColor = vec4(couleur, 1.0); }`,
  side: THREE.BackSide,
});
const cacheCoque = new WeakMap<THREE.BufferGeometry, THREE.BufferGeometry>();
const coque = (g: THREE.BufferGeometry) => {
  if (!cacheCoque.has(g)) {
    const c = g.clone();
    c.deleteAttribute('uv');
    c.deleteAttribute('normal');
    const m = mergeVertices(c, 1e-4);
    m.computeVertexNormals();
    cacheCoque.set(g, m);
  }
  return cacheCoque.get(g)!;
};

// géométries partagées
const G = {
  boite: new THREE.BoxGeometry(1, 1, 1),
  sphere: new THREE.SphereGeometry(1, 28, 20),
  capsule: new THREE.CapsuleGeometry(1, 1, 6, 16),
  cylindre: new THREE.CylinderGeometry(1, 1, 1, 18),
};

type V3 = [number, number, number];
/** Volume toon avec contour. */
const T: React.FC<{g: THREE.BufferGeometry; c: string; p?: V3; s?: V3; r?: V3; contour?: boolean; mat?: THREE.Material}> = ({
  g, c, p = [0, 0, 0], s = [1, 1, 1], r = [0, 0, 0], contour = true, mat,
}) => (
  <group position={p} rotation={r} scale={s}>
    <mesh geometry={g} material={mat ?? toon(c)} />
    {contour ? <mesh geometry={coque(g)} material={matContour} /> : null}
  </group>
);
const Boite: React.FC<{c: string; p: V3; s: V3; r?: V3; contour?: boolean}> = (pr) => <T g={G.boite} {...pr} />;

// ------------------------------------------------------------------ mouvement de la rame
/** Distance parcourue (m) : vitesse constante puis freinage jusqu'à l'arrêt. */
const distance = (f: number) => {
  const v = 0.55; // m par image (≈ 60 km/h)
  if (f <= T_FREIN) return f * v;
  const d = Math.min(f, T_ARRET) - T_FREIN;
  const L = T_ARRET - T_FREIN;
  return T_FREIN * v + v * (d - (d * d) / (2 * L));
};
const lumiereAllumee = (f: number) => {
  if (f < T_CLIGNOTE) return 1;
  if (f >= T_NOIR) return 0;
  const motif = [1, 0, 1, 1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0];
  return motif[Math.floor((f - T_CLIGNOTE) / 2) % motif.length];
};

// ------------------------------------------------------------------ décor : la rame
const Rame: React.FC<{f: number}> = ({f}) => {
  const L = 18, W = 2.8, H = 2.25;
  const fenetres = [-6, -3.2, -0.4, 2.4, 5.2];
  const allume = lumiereAllumee(f);
  const lampeMat = useMemo(() => new THREE.MeshBasicMaterial({color: C.lampe}), []);
  lampeMat.color.set(allume ? C.lampe : '#4a3426');
  return (
    <group>
      {/* sol, plafond */}
      <Boite c={C.sol} p={[0, -0.05, 0]} s={[L, 0.1, W]} />
      <Boite c={C.plafond} p={[0, H + 0.05, 0]} s={[L, 0.1, W]} />
      {/* bandeaux lumineux */}
      {[-0.55, 0.55].map((z) => (
        <T key={z} g={G.boite} c={C.lampe} mat={lampeMat} p={[0, H - 0.03, z]} s={[L - 1, 0.05, 0.16]} />
      ))}
      {/* deux parois : bas plein, haut plein, montants entre les fenêtres */}
      {[-1, 1].map((cote) => {
        const z = cote * (W / 2);
        return (
          <group key={cote}>
            <Boite c={C.murBas} p={[0, 0.58, z]} s={[L, 1.16, 0.08]} />
            <Boite c={C.mur} p={[0, 2.08, z]} s={[L, 0.34, 0.08]} />
            {[-7.6, -4.6, -1.8, 1.0, 3.8, 6.6].map((x) => (
              <Boite key={x} c={C.mur} p={[x, 1.535, z]} s={[0.4, 0.75, 0.08]} />
            ))}
            {fenetres.map((x) => (
              <Boite key={x} c={C.cadre} p={[x, 1.535, z - cote * 0.02]} s={[2.42, 0.8, 0.04]} contour={false} />
            ))}
            {/* banquettes : assise + dossier, par blocs */}
            {[-5.4, -2.6, 0.2, 3.0, 5.8].map((x) => (
              <group key={x}>
                <Boite c={C.siege} p={[x, 0.46, z - cote * 0.32]} s={[2.2, 0.12, 0.5]} />
                <Boite c={C.siegeDos} p={[x, 0.8, z - cote * 0.1]} s={[2.2, 0.6, 0.1]} />
                <Boite c={C.cadre} p={[x, 0.22, z - cote * 0.32]} s={[2.0, 0.4, 0.4]} />
              </group>
            ))}
          </group>
        );
      })}
      {/* barres verticales et horizontales */}
      {[-4.2, -1.4, 1.4, 4.2].map((x) => (
        <T key={x} g={G.cylindre} c={C.barre} p={[x, H / 2, 0]} s={[0.028, H, 0.028]} />
      ))}
      {[-0.85, 0.85].map((z) => (
        <T key={z} g={G.cylindre} c={C.barre} p={[0, 1.95, z]} r={[0, 0, Math.PI / 2]} s={[0.022, L - 1, 0.022]} />
      ))}
      {/* portes au fond */}
      <Boite c={C.porte} p={[-8.95, 1.05, -0.36]} s={[0.06, 2.1, 0.7]} />
      <Boite c={C.porte} p={[-8.95, 1.05, 0.36]} s={[0.06, 2.1, 0.7]} />
      <Boite c={C.porte} p={[8.95, 1.05, 0]} s={[0.06, 2.1, 1.4]} />
    </group>
  );
};

/** Le tunnel derrière les vitres : paroi sombre + lampes qui défilent puis s'arrêtent. */
const Tunnel: React.FC<{f: number}> = ({f}) => {
  const d = distance(f);
  const pas = 3.2;
  const lampes: number[] = [];
  for (let i = -8; i <= 8; i++) {
    const x = (((i * pas - d) % (pas * 17)) + pas * 17) % (pas * 17) - pas * 8.5;
    lampes.push(x);
  }
  const lampeMat = useMemo(() => new THREE.MeshBasicMaterial({color: '#ffcf7a'}), []);
  const cableMat = useMemo(() => new THREE.MeshBasicMaterial({color: '#140c0a'}), []);
  return (
    <group>
      {[-1, 1].map((cote) => (
        <group key={cote}>
          <mesh position={[0, 1.4, cote * 2.4]} geometry={G.boite} scale={[60, 4, 0.1]} material={toon(C.tunnel)} />
          {lampes.map((x, i) => (
            <mesh key={i} position={[x, 1.75, cote * 2.33]} geometry={G.boite} scale={[0.5, 0.09, 0.05]} material={lampeMat} />
          ))}
          {[1.2, 1.32].map((y) => (
            <mesh key={y} position={[0, y, cote * 2.33]} geometry={G.boite} scale={[60, 0.03, 0.04]} material={cableMat} />
          ))}
        </group>
      ))}
    </group>
  );
};

// ------------------------------------------------------------------ la passagère en face
const Passagere: React.FC<{f: number}> = ({f}) => {
  const {fps} = useVideoConfig();
  // tête : penchée sur son téléphone, puis relevée vers nous (elle est déjà tournée quand on la regarde)
  const releve = fen(f, T_NOIR + 20, T_NOIR + 45, 0, 1, doux);
  const inertie = spring({frame: f - T_FREIN, fps, config: {damping: 9, stiffness: 60}}) * (f > T_FREIN ? 1 : 0);
  const balancier = Math.sin(f * 0.21) * 0.012 * (f < T_FREIN ? 1 : 0) + (inertie - 1) * -0.06 * (f < T_ARRET + 40 ? 1 : 0);
  const teteX = interpolate(releve, [0, 1], [0.42, -0.02]);
  // clignements
  const cligne = [70, 205, 300, 520].some((c) => f >= c && f < c + 5) ? 0.12 : 1;
  // pupilles : vers le bas (téléphone) puis droit sur la caméra
  const py = interpolate(releve, [0, 1], [-0.012, 0.004]);
  const sourire = fen(f, T_PAROLE - 10, T_PAROLE + 6);
  const parle = f >= T_PAROLE && f < T_PAROLE + 46 ? Math.abs(Math.sin((f - T_PAROLE) * 0.55)) : 0;
  const P = [0.15, 0, -0.98] as V3;
  return (
    <group position={P} rotation={[0, 0, balancier]}>
      {/* jambes assises */}
      <T g={G.capsule} c={C.jean} p={[-0.1, 0.52, 0.18]} r={[Math.PI / 2, 0, 0]} s={[0.075, 0.28, 0.075]} />
      <T g={G.capsule} c={C.jean} p={[0.1, 0.52, 0.18]} r={[Math.PI / 2, 0, 0]} s={[0.075, 0.28, 0.075]} />
      <T g={G.capsule} c={C.jean} p={[-0.1, 0.3, 0.38]} s={[0.065, 0.2, 0.065]} />
      <T g={G.capsule} c={C.jean} p={[0.1, 0.3, 0.38]} s={[0.065, 0.2, 0.065]} />
      <Boite c={'#f4ece0'} p={[-0.1, 0.05, 0.44]} s={[0.11, 0.08, 0.2]} />
      <Boite c={'#f4ece0'} p={[0.1, 0.05, 0.44]} s={[0.11, 0.08, 0.2]} />
      {/* buste : manteau */}
      <T g={G.capsule} c={C.manteau} p={[0, 0.86, 0]} s={[0.2, 0.26, 0.15]} />
      <T g={G.sphere} c={C.echarpe} p={[0, 1.15, 0.0]} s={[0.15, 0.06, 0.13]} />
      {/* bras : épaule → coude le long du corps, puis avant-bras vers le téléphone sur les genoux */}
      {[-1, 1].map((k) => (
        <group key={k}>
          <T g={G.capsule} c={C.manteau} p={[k * 0.215, 0.9, 0.0]} r={[0.15, 0, k * 0.12]} s={[0.055, 0.13, 0.055]} />
          <T g={G.capsule} c={C.manteau} p={[k * 0.15, 0.72, 0.15]} r={[1.25, 0, k * -0.55]} s={[0.05, 0.11, 0.05]} />
          <T g={G.sphere} c={C.peau} p={[k * 0.06, 0.67, 0.29]} s={[0.035, 0.03, 0.035]} />
        </group>
      ))}
      <Boite c={C.tel} p={[0, 0.66, 0.3]} r={[-0.9, 0, 0]} s={[0.07, 0.13, 0.012]} />
      {/* tête */}
      <group position={[0, 1.27, 0.02]} rotation={[teteX, 0, 0]} scale={1.3}>
        <T g={G.sphere} c={C.peau} p={[0, 0.07, 0]} s={[0.13, 0.145, 0.13]} />
        {/* cheveux : calotte + chignon + mèches */}
        <T g={G.sphere} c={C.cheveux} p={[0, 0.13, -0.02]} s={[0.138, 0.12, 0.135]} />
        <T g={G.sphere} c={C.cheveux} p={[0, 0.25, -0.07]} s={[0.065, 0.06, 0.065]} />
        <T g={G.sphere} c={C.cheveux} p={[-0.11, 0.04, -0.02]} s={[0.04, 0.1, 0.07]} />
        <T g={G.sphere} c={C.cheveux} p={[0.11, 0.04, -0.02]} s={[0.04, 0.1, 0.07]} />
        {/* grands yeux */}
        {[-0.048, 0.048].map((x) => (
          <group key={x} position={[x, 0.075, 0.112]} scale={[1, cligne, 1]}>
            <T g={G.sphere} c={'#ffffff'} s={[0.036, 0.042, 0.02]} />
            <mesh geometry={G.sphere} material={toon('#1a1210')} position={[0, py, 0.016]} scale={[0.017, 0.02, 0.01]} />
            <mesh geometry={G.sphere} material={toon('#ffffff')} position={[0.006, py + 0.008, 0.024]} scale={[0.005, 0.005, 0.003]} />
          </group>
        ))}
        {/* sourcils */}
        {[-1, 1].map((k) => (
          <Boite key={k} c={C.cheveux} p={[k * 0.05, 0.13, 0.118]} r={[0, 0, k * (-0.15 + sourire * 0.1)]} s={[0.045, 0.01, 0.01]} contour={false} />
        ))}
        {/* nez + bouche */}
        <mesh geometry={G.sphere} material={toon('#e09a6e')} position={[0, 0.035, 0.13]} scale={[0.014, 0.012, 0.01]} />
        <mesh geometry={G.capsule} material={toon('#7a2a22')} position={[0, -0.01, 0.122]} rotation={[0, 0, Math.PI / 2]}
          scale={[0.006 + parle * 0.012, 0.018 + sourire * 0.016, 0.006]} />
      </group>
    </group>
  );
};

// ------------------------------------------------------------------ écran du téléphone
const useEcran = (f: number) => {
  const notif = f >= T_NOTIF;
  const sombre = f >= T_NOIR;
  return useMemo(() => {
    const W = 360, H = 740;
    const cv = document.createElement('canvas');
    cv.width = W; cv.height = H;
    const g = cv.getContext('2d')!;
    const fond = g.createLinearGradient(0, 0, 0, H);
    fond.addColorStop(0, '#f39a4c'); fond.addColorStop(1, '#7a2c3a');
    g.fillStyle = fond; g.fillRect(0, 0, W, H);
    g.fillStyle = '#fff';
    g.textAlign = 'center';
    g.font = '800 104px sans-serif';
    g.fillText('23:47', W / 2, 200);
    g.font = '600 30px sans-serif';
    g.fillText('Pas de service', W / 2, 250);
    if (notif) {
      g.fillStyle = 'rgba(255,255,255,0.94)';
      g.beginPath(); g.roundRect(22, 300, W - 44, 170, 26); g.fill();
      g.fillStyle = '#e2702c'; g.beginPath(); g.arc(56, 336, 12, 0, 7); g.fill();
      g.textAlign = 'left'; g.fillStyle = '#222';
      g.font = '800 26px sans-serif'; g.fillText('Numéro inconnu', 78, 345);
      g.font = '600 27px sans-serif';
      g.fillText('Ne parle pas à la', 42, 400);
      g.fillText('femme en face de toi.', 42, 438);
    }
    const t = new THREE.CanvasTexture(cv);
    t.colorSpace = THREE.SRGBColorSpace;
    return {texture: t, sombre};
  }, [notif, sombre]);
};

// ------------------------------------------------------------------ caméra subjective + mains
type Pose = {x: number; y: number; z: number; tangage: number; lacet: number; roulis: number};
const poseCamera = (f: number): Pose => {
  // regard : téléphone → elle → (arrêt brutal) → téléphone (notif) → elle
  const versElle1 = fen(f, 70, 115, 0, 1, doux);
  const versTel = fen(f, T_NOTIF - 6, T_NOTIF + 18, 0, 1, doux);
  const versElle2 = fen(f, T_REGARD, T_REGARD + 22, 0, 1, Easing.out(Easing.cubic));
  const regard = versElle1 * (1 - versTel) + versElle2; // 0 = téléphone, 1 = elle
  let tangage = interpolate(Math.min(regard, 1), [0, 1], [-0.62, -0.06]);
  let lacet = interpolate(Math.min(regard, 1), [0, 1], [0.08, 0]);
  // la caméra glisse un peu vers la vitre quand ça clignote
  lacet += fen(f, T_CLIGNOTE, T_CLIGNOTE + 20, 0, 0.35, doux) * (1 - fen(f, T_NOIR + 10, T_NOTIF, 0, 1, doux));
  // à-coups : roulement puis freinage
  const roule = f < T_ARRET ? 1 : 0;
  const jolt = f >= T_FREIN && f < T_ARRET + 30 ? Math.exp(-(f - T_FREIN) / 9) * Math.sin((f - T_FREIN) * 0.7) : 0;
  const choc = f >= T_ARRET && f < T_ARRET + 20 ? Math.exp(-(f - T_ARRET) / 4) : 0;
  const n = (k: string, a: number) => noise2D(k, f * 0.035, 0) * a;
  tangage += n('t', 0.025) + roule * Math.sin(f * 1.7) * 0.004 - choc * 0.12;
  lacet += n('l', 0.03) + jolt * 0.03;
  const roulis = n('r', 0.02) + roule * Math.sin(f * 0.9) * 0.006 + jolt * 0.05;
  // zoom de tension sur la réplique : on se penche vers elle
  const penche = fen(f, T_PAROLE - 20, T_CHOIX, 0, 0.16, doux);
  return {x: 0.18 + n('x', 0.01), y: 1.18 + roule * Math.sin(f * 1.3) * 0.004 - choc * 0.03, z: 0.92 - penche, tangage, lacet, roulis};
};

const Mains: React.FC<{f: number}> = ({f}) => {
  const {texture, sombre} = useEcran(f);
  const ecranMat = useMemo(() => new THREE.MeshBasicMaterial({toneMapped: false}), []);
  ecranMat.map = texture;
  ecranMat.needsUpdate = true;
  // le téléphone remonte quand on le regarde, redescend quand on la regarde
  const versTel = fen(f, T_NOTIF - 10, T_NOTIF + 10, 0, 1, doux) * (1 - fen(f, T_REGARD, T_REGARD + 20, 0, 1, doux));
  const debut = 1 - fen(f, 70, 115, 0, 1, doux);
  const leve = Math.max(versTel, debut);
  const vibre = f >= T_NOTIF && f < T_NOTIF + 14 ? Math.sin(f * 3.1) * 0.004 : 0;
  return (
    <group position={[0.1 + vibre, -0.21 + leve * 0.045, -0.3]} rotation={[0.72 - leve * 0.12, -0.18, 0.08]} scale={1.55}>
      {/* manche : monte du bas de l'image jusqu'au poignet */}
      <T g={G.capsule} c={C.manche} p={[0.035, -0.125, 0.03]} r={[-0.45, 0, 0.35]} s={[0.03, 0.075, 0.03]} />
      <T g={G.cylindre} c={'#e8e2d4'} p={[0.022, -0.085, 0.012]} r={[-0.45, 0, 0.35]} s={[0.031, 0.012, 0.031]} />
      {/* paume derrière le téléphone */}
      <T g={G.sphere} c={C.peau} p={[0.012, -0.04, -0.016]} s={[0.042, 0.05, 0.02]} />
      {/* téléphone */}
      <T g={G.boite} c={C.tel} s={[0.072, 0.15, 0.009]} />
      <mesh position={[0, 0, 0.0047]} material={ecranMat}>
        <planeGeometry args={[0.065, 0.142]} />
      </mesh>
      {/* pouce posé sur le bord gauche */}
      <T g={G.capsule} c={C.peau} p={[-0.036, -0.032, 0.012]} r={[0.2, 0, -0.5]} s={[0.012, 0.024, 0.012]} />
      {/* quatre doigts qui enroulent le bord droit */}
      {[-0.034, -0.008, 0.018, 0.042].map((y, i) => (
        <T key={i} g={G.capsule} c={C.peau} p={[0.041, y - 0.012, 0.006]} r={[0, 0, 0.25]} s={[0.0098, 0.012, 0.0098]} />
      ))}
      {sombre ? <pointLight position={[0, 0.03, 0.1]} intensity={0.05} distance={0.5} color={'#ffd2a0'} /> : null}
    </group>
  );
};

// ------------------------------------------------------------------ rendu fisheye
const Fisheye: React.FC<{pose: Pose; mains: React.RefObject<THREE.Group | null>}> = ({pose, mains}) => {
  const {gl, scene, camera, size} = useThree();
  const cible = useMemo(() => {
    const rt = new THREE.WebGLRenderTarget(Math.round(size.width * 1.25), Math.round(size.height * 1.25), {samples: 4});
    rt.texture.colorSpace = THREE.SRGBColorSpace;
    return rt;
  }, [size.width, size.height]);
  const post = useMemo(() => {
    const s = new THREE.Scene();
    const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const mat = new THREE.ShaderMaterial({
      uniforms: {tex: {value: cible.texture}, aspect: {value: size.width / size.height}, k: {value: 1.25}, zoom: {value: 0.7},
        coin: {value: new THREE.Color(C.coin)}},
      vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`,
      fragmentShader: `uniform sampler2D tex; uniform float aspect, k, zoom; uniform vec3 coin; varying vec2 vUv;
        void main(){
          vec2 d = vUv - 0.5; d.x *= aspect;
          float r2 = dot(d, d);
          vec2 s = d * zoom * (1.0 + k * r2);
          s.x /= aspect; s += 0.5;
          float bord = max(max(-s.x, s.x - 1.0), max(-s.y, s.y - 1.0));
          vec3 c = texture2D(tex, clamp(s, 0.0, 1.0)).rgb;
          c = mix(c, coin, smoothstep(-0.004, 0.004, bord));
          float vig = smoothstep(0.95, 0.25, r2 * 1.6);
          gl_FragColor = vec4(c * mix(0.78, 1.0, vig), 1.0);
        }`,
      depthTest: false, depthWrite: false,
    });
    s.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat));
    return {s, cam};
  }, [cible, size.width, size.height]);
  useFrame(() => {
    const cam = camera as THREE.PerspectiveCamera;
    cam.fov = 108;
    cam.near = 0.02;
    cam.aspect = size.width / size.height;
    cam.position.set(pose.x, pose.y, pose.z);
    cam.rotation.order = 'YXZ';
    cam.rotation.set(pose.tangage, pose.lacet, pose.roulis);
    cam.updateProjectionMatrix();
    cam.updateMatrixWorld();
    if (mains.current) {
      mains.current.position.copy(cam.position);
      mains.current.quaternion.copy(cam.quaternion);
      mains.current.updateMatrixWorld();
    }
    gl.setRenderTarget(cible);
    gl.render(scene, cam);
    gl.setRenderTarget(null);
    gl.render(post.s, post.cam);
  }, 1);
  return null;
};

const Scene: React.FC = () => {
  const f = useCurrentFrame();
  const mains = useRef<THREE.Group>(null);
  const pose = poseCamera(f);
  const allume = lumiereAllumee(f);
  const secours = f >= T_NOIR ? 0.85 + 0.12 * Math.sin(f * 0.15) : 0;
  return (
    <>
      <color attach="background" args={['#120c0a']} />
      <ambientLight intensity={1.35 * allume + 0.85 * secours} color={allume ? '#fff1dc' : '#ffc896'} />
      <hemisphereLight intensity={0.6 * allume + 0.25 * secours} color={'#fff0d8'} groundColor={'#8a4a30'} />
      <directionalLight position={[0.8, 2.6, 4]} intensity={1.7 * allume} color={'#fff0d6'} />
      {secours ? <pointLight position={[-7, 2.0, 0]} intensity={3 * secours} distance={14} color={'#ffa860'} /> : null}
      {secours ? <directionalLight position={[-3, 3, 1]} intensity={1.0 * secours} color={'#ffb070'} /> : null}
      <Rame f={f} />
      <Tunnel f={f} />
      <Passagere f={f} />
      <group ref={mains}>
        <Mains f={f} />
      </group>
      <Fisheye pose={pose} mains={mains} />
    </>
  );
};

// ------------------------------------------------------------------ calques 2D par-dessus
const Notification: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  if (f < T_NOTIF || f > T_REGARD + 10) return null;
  const s = spring({frame: f - T_NOTIF, fps, config: {damping: 14, stiffness: 180}});
  const sortie = fen(f, T_REGARD - 4, T_REGARD + 10);
  return (
    <div style={{position: 'absolute', top: 150, left: 60, right: 60, transform: `translateY(${(1 - s) * -260 - sortie * 260}px)`,
      background: '#fff8ee', borderRadius: 38, padding: '30px 38px', boxShadow: '0 18px 0 rgba(36,21,15,0.9)', border: '6px solid #24150f',
      fontFamily: BALOO, color: '#24150f'}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 18, fontSize: 38}}>
        <div style={{width: 26, height: 26, borderRadius: 13, background: '#e2702c'}} />
        Numéro inconnu<span style={{marginLeft: 'auto', fontSize: 30, opacity: 0.55}}>maintenant</span>
      </div>
      <div style={{fontSize: 54, lineHeight: 1.08, marginTop: 8}}>Ne parle pas à la femme en face de toi.</div>
    </div>
  );
};

/** Sous-titres mot par mot, gros, jaunes, contour épais. */
const MOTS: [number, string, string?][] = [
  [T_FREIN + 4, 'Hein ?!'], [T_CLIGNOTE + 4, 'Non non non…'], [T_NOIR + 6, 'Super.'],
  [T_PAROLE, 'Il', '#ffd23f'], [T_PAROLE + 8, "t'écrit", '#ffd23f'], [T_PAROLE + 18, 'à toi', '#ffd23f'], [T_PAROLE + 30, 'aussi ?', '#ffd23f'],
];
const SousTitre: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  let actif: [number, string, string?] | null = null;
  for (const m of MOTS) if (f >= m[0] && f < m[0] + 26) actif = m;
  if (!actif || f >= T_CHOIX) return null;
  const s = spring({frame: f - actif[0], fps, config: {damping: 11, stiffness: 260}});
  return (
    <div style={{position: 'absolute', top: 1180, width: '100%', textAlign: 'center', fontFamily: BALOO, fontSize: 112,
      color: actif[2] ?? '#ffffff', transform: `scale(${0.6 + 0.4 * s})`,
      WebkitTextStroke: '14px #24150f', paintOrder: 'stroke fill', textShadow: '0 10px 0 #24150f'}}>{actif[1]}</div>
  );
};

const Choix: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  if (f < T_CHOIX) return null;
  const a = spring({frame: f - T_CHOIX, fps, config: {damping: 13}});
  const b = spring({frame: f - T_CHOIX - 6, fps, config: {damping: 13}});
  const bouton = (txt: string, lettre: string, k: number, fond: string) => (
    <div style={{transform: `translateY(${(1 - k) * 400}px)`, background: fond, border: '7px solid #24150f', borderRadius: 34,
      boxShadow: '0 14px 0 #24150f', padding: '26px 34px', fontFamily: BALOO, fontSize: 58, color: '#24150f', lineHeight: 1.05,
      display: 'flex', gap: 24, alignItems: 'center'}}>
      <span style={{fontSize: 84}}>{lettre}</span>{txt}
    </div>
  );
  return (
    <div style={{position: 'absolute', bottom: 260, left: 70, right: 70, display: 'flex', flexDirection: 'column', gap: 34}}>
      {bouton('Tu lui montres ton téléphone', 'A', a, '#ffd23f')}
      {bouton('Tu fais semblant de rien', 'B', b, '#fff8ee')}
    </div>
  );
};

export const MetroProto: React.FC = () => {
  const {width, height} = useVideoConfig();
  return (
    <AbsoluteFill style={{backgroundColor: C.coin}}>
      <ThreeCanvas width={width} height={height} gl={{antialias: true, toneMapping: THREE.NoToneMapping}} flat camera={{fov: 108, near: 0.02, far: 80}}>
        <Scene />
      </ThreeCanvas>
      <Notification />
      <SousTitre />
      <Choix />
    </AbsoluteFill>
  );
};
