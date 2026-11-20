import {loadFont as chargerLora} from '@remotion/google-fonts/Lora';
import {loadFont as chargerMono} from '@remotion/google-fonts/IBMPlexMono';
import {useThree} from '@react-three/fiber';
import {ThreeCanvas} from '@remotion/three';
import {useMemo} from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import * as THREE from 'three';
import {hasard, useMat} from '../ile/outils3d';

/**
 * Prototype muet de 15 s — série de survie EN « Your city loses power for 30 days ».
 * Mécanique empruntée aux simulations « What if » : question sur la 1re image, compteur qui tombe,
 * une phrase courte à la 2e personne, POV au niveau de la rue. Fin = vote A/B/C pour la partie 2.
 * Aucun logo sur l'image.
 */
const {fontFamily: SERIF} = chargerLora('normal', {weights: ['400', '500'], subsets: ['latin']});
chargerLora('italic', {weights: ['400'], subsets: ['latin']});
const {fontFamily: MONO} = chargerMono('normal', {weights: ['500'], subsets: ['latin']});

export const DUREE_PANNE_PROTO = 450;
type V3 = [number, number, number];

// Timeline (images à 30 i/s)
const T_PANNE = 185;     // la vague de coupure part du fond de la rue
const T_FIN_PANNE = 300; // elle atteint la caméra
const T_VOTE = 368;

/** Front de l'obscurité : tout ce qui est en z < front est éteint. Il avance du fond (-140) vers la caméra (+16). */
const front = (f: number) => interpolate(f, [T_PANNE, T_FIN_PANNE], [-175, 16], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

/** Niveau d'allumage (0-1) d'un objet en z, avec grésillement juste avant la coupure. */
const allume = (z: number, f: number, graine: number) => {
  const d = z - front(f);
  if (d <= 0) return 0;
  if (d < 9 && f >= T_PANNE) return hasard(graine * 31 + Math.floor(f / 2)) > 0.4 ? 1 : 0.15;
  return 1;
};

/* ------------------------------------------------------------------ ville */

type Immeuble = {x: number; z: number; w: number; l: number; h: number; couleur: string; graine: number};
const COULEURS = ['#b5654a', '#c98b5e', '#8e5a4a', '#d4b48a', '#7d8a96', '#a3a8ad', '#c4a06a', '#9a6f5a', '#6f7d8c'];

const IMMEUBLES: Immeuble[] = (() => {
  const liste: Immeuble[] = [];
  [-1, 1].forEach((cote) => {
    let z = 14;
    let i = 0;
    while (z > -150) {
      const g = cote * 100 + i;
      const l = 7 + hasard(g) * 5;
      const zc = z - l / 2;
      if (zc < -2 && zc > -17) { z = -17; i++; continue; } // rue transversale
      const w = 7 + hasard(g + 3) * 4;
      const h = 9 + hasard(g + 7) * (zc < -40 ? 42 : 24);
      liste.push({x: cote * (8.2 + w / 2), z: zc, w, l, h, couleur: COULEURS[Math.floor(hasard(g + 11) * COULEURS.length)], graine: g});
      z -= l + 0.35;
      i++;
    }
  });
  return liste;
})();

/** Façade : fenêtres en grille. Texture diffuse + texture des fenêtres allumées (emissive). */
const texturesFacade = (b: Immeuble) => {
  const cols = Math.max(2, Math.round(b.l / 2.6));
  const rows = Math.max(3, Math.round(b.h / 3.1));
  const px = 32;
  const mk = () => { const c = document.createElement('canvas'); c.width = cols * px; c.height = rows * px; return c; };
  const cBase = mk(), cLum = mk();
  const base = cBase.getContext('2d')!, lum = cLum.getContext('2d')!;
  base.fillStyle = b.couleur; base.fillRect(0, 0, cBase.width, cBase.height);
  lum.fillStyle = '#000'; lum.fillRect(0, 0, cLum.width, cLum.height);
  for (let r = 0; r < rows; r++) {
    if (r === rows - 1) { // rez-de-chaussée : vitrines
      base.fillStyle = '#2a2f3a'; base.fillRect(0, r * px + 4, cBase.width, px - 4);
      lum.fillStyle = '#ffe2a8'; lum.fillRect(4, r * px + 8, cLum.width - 8, px - 14);
      continue;
    }
    for (let c = 0; c < cols; c++) {
      const x = c * px + 7, y = r * px + 6, ww = px - 14, hh = px - 12;
      base.fillStyle = '#1c2230'; base.fillRect(x, y, ww, hh);
      const v = hasard(b.graine * 7 + r * 13 + c * 3);
      if (v > 0.32) {
        lum.fillStyle = v > 0.85 ? '#cfe3ff' : v > 0.6 ? '#ffd27a' : '#ffb85c';
        lum.fillRect(x, y, ww, hh);
      }
    }
  }
  const t = (c: HTMLCanvasElement) => { const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace; tx.anisotropy = 8; return tx; };
  return {map: t(cBase), emissiveMap: t(cLum)};
};

const BlocImmeuble: React.FC<{b: Immeuble; f: number}> = ({b, f}) => {
  const {facade, toit} = useMemo(() => {
    const {map, emissiveMap} = texturesFacade(b);
    return {
      facade: new THREE.MeshStandardMaterial({map, emissiveMap, emissive: new THREE.Color('#ffffff'), emissiveIntensity: 1, flatShading: true, roughness: 0.9}),
      toit: new THREE.MeshStandardMaterial({color: '#4a4c52', flatShading: true, roughness: 1}),
    };
  }, [b]);
  facade.emissiveIntensity = 1.15 * allume(b.z, f, b.graine);
  // ordre des faces : +x, -x, +y, -y, +z, -z
  return (
    <mesh position={[b.x, b.h / 2, b.z]} material={[facade, facade, toit, toit, facade, facade]}>
      <boxGeometry args={[b.w, b.h, b.l]} />
    </mesh>
  );
};

const Sol: React.FC = () => {
  const asphalte = useMat('#34373e');
  const trottoir = useMat('#8a8780');
  const blanc = useMat('#e8e6df');
  const jaune = useMat('#e2b33a');
  return (
    <group>
      <mesh material={asphalte} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -60]}><planeGeometry args={[200, 240]} /></mesh>
      {[-1, 1].map((s) => (
        <group key={s}>
          <mesh material={trottoir} position={[s * 6.6, 0.08, 6]}><boxGeometry args={[3.2, 0.16, 16]} /></mesh>
          <mesh material={trottoir} position={[s * 6.6, 0.08, -84]}><boxGeometry args={[3.2, 0.16, 134]} /></mesh>
          <mesh material={trottoir} position={[s * 40, 0.08, -9.5]}><boxGeometry args={[64, 0.16, 9.6]} /></mesh>
        </group>
      ))}
      {Array.from({length: 24}, (_, i) => {
        const z = 8 - i * 6;
        if (z < -2 && z > -17) return null;
        return <mesh key={i} material={jaune} position={[0, 0.01, z]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[0.18, 3]} /></mesh>;
      })}
      {[-3.4, -15.6].map((z) => Array.from({length: 9}, (_, i) => (
        <mesh key={`${z}-${i}`} material={blanc} position={[-4 + i, 0.012, z]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[0.55, 2.2]} /></mesh>
      )))}
    </group>
  );
};

const Reverbere: React.FC<{p: V3; f: number; graine: number}> = ({p, f, graine}) => {
  const metal = useMat('#2b2e33');
  const ampoule = useMemo(() => new THREE.MeshStandardMaterial({color: '#3a3428', emissive: new THREE.Color('#ffcf7a'), emissiveIntensity: 1}), []);
  ampoule.emissiveIntensity = 2.2 * allume(p[2], f, graine);
  const vers = p[0] > 0 ? -1 : 1;
  return (
    <group position={p}>
      <mesh material={metal} position={[0, 2.6, 0]}><cylinderGeometry args={[0.07, 0.09, 5.2, 6]} /></mesh>
      <mesh material={metal} position={[vers * 0.6, 5.15, 0]}><boxGeometry args={[1.3, 0.08, 0.08]} /></mesh>
      <mesh material={ampoule} position={[vers * 1.15, 5.02, 0]}><boxGeometry args={[0.5, 0.14, 0.26]} /></mesh>
    </group>
  );
};

const FeuTricolore: React.FC<{p: V3; f: number}> = ({p, f}) => {
  const metal = useMat('#22252a');
  const eteint = useMat('#1a1c20');
  const vert = useMemo(() => new THREE.MeshStandardMaterial({color: '#0e1a12', emissive: new THREE.Color('#3dff7a'), emissiveIntensity: 1}), []);
  vert.emissiveIntensity = 2.4 * allume(p[2], f, 77);
  return (
    <group position={p}>
      <mesh material={metal} position={[0, 1.7, 0]}><cylinderGeometry args={[0.07, 0.07, 3.4, 6]} /></mesh>
      <mesh material={metal} position={[0, 3.6, 0]}><boxGeometry args={[0.42, 1.15, 0.36]} /></mesh>
      {[0.36, 0, -0.36].map((y, i) => (
        <mesh key={i} material={i === 2 ? vert : eteint} position={[0, 3.6 + y, 0.19]}><circleGeometry args={[0.12, 12]} /></mesh>
      ))}
    </group>
  );
};

/* ------------------------------------------------------------------ véhicules */

const Voiture: React.FC<{x: number; z0: number; v: number; dir: 1 | -1; couleur: string; f: number}> = ({x, z0, v, dir, couleur, f}) => {
  const carrosserie = useMat(couleur, {roughness: 0.5});
  const vitre = useMat('#1a2433', {roughness: 0.2});
  const pneu = useMat('#151515');
  const phares = useMemo(() => new THREE.MeshStandardMaterial({color: '#ffffff', emissive: new THREE.Color('#fff4d6'), emissiveIntensity: 2.5}), []);
  const feuxAr = useMemo(() => new THREE.MeshStandardMaterial({color: '#400', emissive: new THREE.Color('#ff2a2a'), emissiveIntensity: 1.6}), []);
  // roule à vitesse constante, puis freine sur 40 images quand les feux meurent
  const tStop = T_PANNE + 20;
  const t = Math.min(f, tStop);
  const d = Math.max(0, Math.min(40, f - tStop));
  const z = z0 + dir * (v * t + v * (d - (d * d) / 80));
  feuxAr.emissiveIntensity = d > 0 && d < 40 ? 3.2 : 1.4;
  return (
    <group position={[x, 0, z]} rotation={[0, dir > 0 ? 0 : Math.PI, 0]}>
      <mesh material={carrosserie} position={[0, 0.62, 0]}><boxGeometry args={[1.9, 0.62, 4.3]} /></mesh>
      <mesh material={vitre} position={[0, 1.18, -0.2]}><boxGeometry args={[1.7, 0.55, 2.2]} /></mesh>
      {[[-0.85, 1.35], [0.85, 1.35], [-0.85, -1.35], [0.85, -1.35]].map(([wx, wz], i) => (
        <mesh key={i} material={pneu} position={[wx, 0.36, wz]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.36, 0.36, 0.28, 10]} /></mesh>
      ))}
      {[-0.62, 0.62].map((px) => <mesh key={px} material={phares} position={[px, 0.68, 2.16]}><boxGeometry args={[0.42, 0.16, 0.04]} /></mesh>)}
      {[-0.68, 0.68].map((px) => <mesh key={px} material={feuxAr} position={[px, 0.7, -2.16]}><boxGeometry args={[0.36, 0.14, 0.04]} /></mesh>)}
    </group>
  );
};

/* ------------------------------------------------------------------ personnages-jouets */

const PEAUX = ['#e9b27d', '#c98a5a', '#8a5a3b', '#f2c9a0', '#a8714a'];
const TENUES = ['#3f7fd9', '#2bb39b', '#9b59d0', '#e84a5f', '#47c46a', '#f2c230', '#5a6270', '#c0392b'];

export const Figurine: React.FC<{
  p: V3; rotY: number; tenue: string; peau: string; pantalon?: string;
  marche: number; phase: number; regardeHaut: number; telephone?: boolean; echelle?: number; sac?: string; yeux?: boolean;
}> = ({p, rotY, tenue, peau, pantalon = '#2c3340', marche, phase, regardeHaut, telephone, echelle = 1, sac, yeux}) => {
  const frame = useCurrentFrame();
  const mPeau = useMat(peau), mTenue = useMat(tenue), mPant = useMat(pantalon), mCheveux = useMat('#2a1c14'), mSac = useMat(sac ?? '#333333');
  const ecran = useMemo(() => new THREE.MeshStandardMaterial({color: '#cfe8ff', emissive: new THREE.Color('#bfe0ff'), emissiveIntensity: 2.2}), []);
  const s = Math.sin(frame * 0.32 + phase) * 0.55 * marche;
  const rebond = Math.abs(Math.sin(frame * 0.32 + phase)) * 0.04 * marche;
  return (
    <group position={[p[0], p[1] + rebond, p[2]]} rotation={[0, rotY, 0]} scale={echelle}>
      {[-1, 1].map((k) => (
        <group key={k} position={[k * 0.13, 0.82, 0]} rotation={[k * s, 0, 0]}>
          <mesh material={mPant} position={[0, -0.4, 0]}><boxGeometry args={[0.18, 0.8, 0.2]} /></mesh>
          <mesh material={mCheveux} position={[0, -0.8, 0.05]}><boxGeometry args={[0.2, 0.1, 0.3]} /></mesh>
        </group>
      ))}
      <mesh material={mTenue} position={[0, 1.2, 0]}><boxGeometry args={[0.52, 0.72, 0.3]} /></mesh>
      {sac && <mesh material={mSac} position={[0, 1.22, -0.24]}><boxGeometry args={[0.4, 0.5, 0.18]} /></mesh>}
      {[-1, 1].map((k) => {
        const tient = telephone && k > 0;
        return (
          <group key={k} position={[k * 0.33, 1.5, 0]} rotation={tient ? [-1.1, 0, 0.15] : [-k * s, 0, k * 0.08]}>
            <mesh material={mTenue} position={[0, -0.3, 0]}><boxGeometry args={[0.15, 0.62, 0.17]} /></mesh>
            <mesh material={mPeau} position={[0, -0.66, 0]}><icosahedronGeometry args={[0.08, 0]} /></mesh>
            {tient && <mesh material={ecran} position={[0, -0.72, 0.06]} rotation={[0.3, 0, 0]}><boxGeometry args={[0.13, 0.03, 0.24]} /></mesh>}
          </group>
        );
      })}
      <group position={[0, 1.78, 0]} rotation={[-regardeHaut, 0, 0]}>
        <mesh material={mPeau}><icosahedronGeometry args={[0.24, 1]} /></mesh>
        <mesh material={mCheveux} position={[0, 0.07, -0.03]}><sphereGeometry args={[0.25, 12, 6, 0, Math.PI * 2, 0, 1.3]} /></mesh>
        {yeux && [-1, 1].map((k) => <mesh key={k} material={mCheveux} position={[k * 0.085, 0.0, 0.215]}><sphereGeometry args={[0.035, 8, 6]} /></mesh>)}
      </group>
    </group>
  );
};

type Passant = {x: number; z0: number; dir: 1 | -1; v: number; tenue: string; peau: string; phase: number; tArret: number};
const PASSANTS: Passant[] = Array.from({length: 18}, (_, i) => {
  const cote = i % 2 === 0 ? -1 : 1;
  const dir: 1 | -1 = hasard(i * 5.3) > 0.5 ? 1 : -1;
  const z0 = -6 - hasard(i * 3.7) * 70;
  const v = 0.035 + hasard(i * 9.1) * 0.02;
  // chacun s'arrête quand l'obscurité le dépasse
  let tArret = DUREE_PANNE_PROTO;
  for (let t = T_PANNE; t < DUREE_PANNE_PROTO; t += 3) {
    if (front(t) > z0 + dir * v * t) { tArret = t + 8 + Math.floor(hasard(i) * 14); break; }
  }
  return {x: cote * (5.6 + hasard(i * 2.1) * 1.9), z0, dir, v, tenue: TENUES[i % TENUES.length],
    peau: PEAUX[Math.floor(hasard(i * 4.4) * PEAUX.length)], phase: hasard(i * 6.6) * 6, tArret};
});

const Foule: React.FC<{f: number}> = ({f}) => (
  <>
    {PASSANTS.map((p, i) => {
      const z = p.z0 + p.dir * p.v * Math.min(f, p.tArret);
      const regarde = interpolate(f - p.tArret, [6, 26], [0, 0.55], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
      return <Figurine key={i} p={[p.x, 0.16, z]} rotY={p.dir > 0 ? 0 : Math.PI} tenue={p.tenue} peau={p.peau}
        marche={f < p.tArret ? 1 : 0} phase={p.phase} regardeHaut={regarde} telephone={i % 4 === 1} />;
    })}
  </>
);

/* ------------------------------------------------------------------ ciel, étoiles, lumières */

const textureCiel = () => {
  const c = document.createElement('canvas'); c.width = 4; c.height = 512;
  const ctx = c.getContext('2d')!;
  const g = ctx.createLinearGradient(0, 0, 0, 512);
  g.addColorStop(0, '#0a0f2c'); g.addColorStop(0.45, '#27285a'); g.addColorStop(0.72, '#7a4a6e'); g.addColorStop(0.86, '#e08a62'); g.addColorStop(1, '#f2b880');
  ctx.fillStyle = g; ctx.fillRect(0, 0, 4, 512);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
};

const Etoiles: React.FC<{v: number}> = ({v}) => {
  const {geo, mat} = useMemo(() => {
    const n = 900, pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const a = hasard(i * 1.7) * Math.PI * 2, el = 0.25 + hasard(i * 2.9) * 1.25, r = 260;
      pos[i * 3] = Math.cos(a) * Math.cos(el) * r; pos[i * 3 + 1] = Math.sin(el) * r; pos[i * 3 + 2] = Math.sin(a) * Math.cos(el) * r - 60;
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const m = new THREE.PointsMaterial({color: '#ffffff', size: 3.4, sizeAttenuation: false, transparent: true, opacity: 0, fog: false, depthWrite: false});
    return {geo: g, mat: m};
  }, []);
  mat.opacity = v;
  return <points geometry={geo} material={mat} />;
};

const Scene: React.FC<{f: number}> = ({f}) => {
  const {scene, camera} = useThree();
  const ciel = useMemo(textureCiel, []);
  scene.background = ciel;
  scene.fog = new THREE.Fog('#5b4466', 35, 150);
  const ville = interpolate(f, [T_PANNE, T_FIN_PANNE], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  // caméra derrière le héros, lente poussée, puis elle lève les yeux vers les étoiles
  const cam = camera as THREE.PerspectiveCamera;
  const z = interpolate(f, [0, DUREE_PANNE_PROTO], [7.2, 4.4]);
  const leve = interpolate(f, [T_FIN_PANNE - 10, T_VOTE], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: (x) => x * x * (3 - 2 * x)});
  cam.position.set(3.1, 1.75 + leve * 0.2, z);
  cam.lookAt(1.2, 3.2 + leve * 44, -40);
  if (cam.fov !== 50) { cam.fov = 50; cam.updateProjectionMatrix(); }

  const etoiles = interpolate(f, [T_FIN_PANNE - 30, T_FIN_PANNE + 40], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <>
      <hemisphereLight args={['#8a8fc8', '#3a2a2a', 0.28 + 0.8 * ville]} />
      <directionalLight position={[-30, 20, -60]} intensity={0.35 + 0.55 * ville} color="#f2a07a" />
      <pointLight position={[3.5, 5, -2]} intensity={40 * ville} distance={22} color="#ffcf7a" />
      <pointLight position={[-3.5, 5, -14]} intensity={40 * ville} distance={22} color="#ffcf7a" />
      <Etoiles v={etoiles} />
      <Sol />
      {IMMEUBLES.map((b, i) => <BlocImmeuble key={i} b={b} f={f} />)}
      {Array.from({length: 12}, (_, i) => [-1, 1].map((s) => (
        <Reverbere key={`${i}${s}`} p={[s * 5.2, 0.16, 6 - i * 13 - s * 4]} f={f} graine={i * 2 + s} />
      )))}
      <FeuTricolore p={[5.3, 0.16, -3.2]} f={f} />
      <FeuTricolore p={[-5.3, 0.16, -15.8]} f={f} />
      <Voiture x={-2.3} z0={-92} v={0.36} dir={1} couleur="#c0392b" f={f} />
      <Voiture x={-2.3} z0={-130} v={0.36} dir={1} couleur="#ecf0f1" f={f} />
      <Voiture x={2.3} z0={-4} v={0.3} dir={-1} couleur="#2e86de" f={f} />
      <Voiture x={2.3} z0={-24} v={0.3} dir={-1} couleur="#f1c40f" f={f} />
      <Foule f={f} />
      {/* le héros : de dos, sac à dos, téléphone allumé */}
      <Figurine p={[4.7, 0.16, -2.6 - 0.0062 * Math.min(f, 205)]} rotY={Math.PI + 0.1} tenue="#f08a24" peau="#c98a5a" pantalon="#26324a" sac="#3a5a40"
        marche={f < 205 ? 1 : 0} phase={0} telephone echelle={0.95}
        regardeHaut={interpolate(f, [T_FIN_PANNE - 20, T_VOTE - 20], [0, 0.6], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})} />
    </>
  );
};

/* ------------------------------------------------------------------ calques texte */

const ombre = '0 2px 18px rgba(0,0,0,0.55), 0 1px 3px rgba(0,0,0,0.6)';

const Titre: React.FC<{f: number}> = ({f}) => {
  const o = interpolate(f, [0, 78, 98], [1, 1, 0], {extrapolateRight: 'clamp'});
  return (
    <div style={{position: 'absolute', top: 400, left: 90, right: 90, textAlign: 'center', fontFamily: SERIF, fontSize: 70, lineHeight: 1.18, color: '#fff', textShadow: ombre, opacity: o}}>
      What if your whole city lost power… for 30 days?
    </div>
  );
};

const Compteur: React.FC<{f: number}> = ({f}) => {
  const allumes = IMMEUBLES.filter((b) => b.z > front(f)).length;
  const pct = Math.round((100 * allumes) / IMMEUBLES.length);
  const o = interpolate(f, [T_VOTE - 12, T_VOTE + 4], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <div style={{position: 'absolute', top: 760, left: 64, color: '#fff', textShadow: ombre, opacity: o}}>
      <div style={{fontFamily: MONO, fontSize: 24, letterSpacing: 4, opacity: 0.85}}>HOMES WITH POWER</div>
      <div style={{fontFamily: SERIF, fontSize: 92, lineHeight: 1.05, color: pct < 30 ? '#ffb4a2' : '#fff'}}>{pct}%</div>
      <div style={{fontFamily: MONO, fontSize: 20, letterSpacing: 3, opacity: 0.6}}>YOUR CITY · 7:42 PM</div>
    </div>
  );
};

const LIGNES: {de: number; a: number; t: string}[] = [
  {de: 50, a: 150, t: 'It’s 7:42 pm. You’re almost home.'},
  {de: 156, a: 222, t: 'Then the lights start going out.'},
  {de: 228, a: 296, t: 'Block by block. Toward you.'},
  {de: 302, a: T_VOTE - 6, t: 'Above you, the stars come out.'},
];

const Ligne: React.FC<{f: number}> = ({f}) => {
  const l = LIGNES.find((x) => f >= x.de && f < x.a);
  if (!l) return null;
  const o = interpolate(f, [l.de, l.de + 8, l.a - 8, l.a], [0, 1, 1, 0]);
  return (
    <div style={{position: 'absolute', top: 1500, left: 80, right: 80, textAlign: 'center', fontFamily: SERIF, fontStyle: 'italic', fontSize: 50, color: '#fff', textShadow: ombre, opacity: o}}>
      {l.t}
    </div>
  );
};

const OPTIONS: [string, string][] = [['A', 'Run to the supermarket'], ['B', 'Fill the bathtub with water'], ['C', 'Find the neighbor with a generator']];

const Vote: React.FC<{f: number}> = ({f}) => {
  const {fps} = useVideoConfig();
  if (f < T_VOTE) return null;
  const fond = interpolate(f, [T_VOTE, T_VOTE + 14], [0, 0.55], {extrapolateRight: 'clamp'});
  const e = (d: number) => spring({frame: f - T_VOTE - d, fps, config: {damping: 14, stiffness: 160}});
  return (
    <AbsoluteFill style={{background: `rgba(5,8,22,${fond})`, alignItems: 'center', paddingTop: 560}}>
      <div style={{fontFamily: MONO, fontSize: 28, letterSpacing: 8, color: '#ffcf7a', opacity: e(0)}}>DAY 1 OF 30</div>
      <div style={{fontFamily: SERIF, fontSize: 76, color: '#fff', marginTop: 18, textShadow: ombre, opacity: e(4), transform: `translateY(${(1 - e(4)) * 30}px)`}}>What do you do first?</div>
      <div style={{marginTop: 70, display: 'flex', flexDirection: 'column', gap: 30, width: 880}}>
        {OPTIONS.map(([k, t], i) => (
          <div key={k} style={{display: 'flex', alignItems: 'center', gap: 30, background: 'rgba(255,255,255,0.1)', border: '2px solid rgba(255,255,255,0.28)', borderRadius: 22, padding: '24px 30px',
            opacity: e(14 + i * 7), transform: `translateX(${(1 - e(14 + i * 7)) * -60}px)`}}>
            <div style={{width: 74, height: 74, borderRadius: 37, background: '#ffcf7a', color: '#1b1406', fontFamily: SERIF, fontWeight: 500, fontSize: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0}}>{k}</div>
            <div style={{fontFamily: SERIF, fontSize: 41, color: '#fff', whiteSpace: 'nowrap'}}>{t}</div>
          </div>
        ))}
      </div>
      <div style={{marginTop: 64, fontFamily: SERIF, fontStyle: 'italic', fontSize: 40, color: '#fff', opacity: e(40) * 0.9, textAlign: 'center', lineHeight: 1.3}}>
        Comment A, B or C.<br />The most voted happens in Part 2.
      </div>
    </AbsoluteFill>
  );
};

export const PanneProto: React.FC = () => {
  const f = useCurrentFrame();
  const {width, height} = useVideoConfig();
  return (
    <AbsoluteFill style={{background: '#1b1c3a'}}>
      <ThreeCanvas width={width} height={height} camera={{fov: 50, near: 0.1, far: 400}} gl={{antialias: true}}>
        <Scene f={f} />
      </ThreeCanvas>
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(8,8,24,0.55) 0%, rgba(8,8,24,0.15) 30%, rgba(0,0,0,0) 45%, rgba(0,0,0,0) 70%, rgba(8,8,24,0.45) 100%)'}} />
      <div style={{position: 'absolute', top: 690, left: -120, width: 620, height: 330, background: 'radial-gradient(ellipse at center, rgba(8,8,24,0.62) 0%, rgba(8,8,24,0) 70%)'}} />
      <Titre f={f} />
      <Compteur f={f} />
      <Ligne f={f} />
      <Vote f={f} />
    </AbsoluteFill>
  );
};
