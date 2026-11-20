// @ts-nocheck — scène 3D écrite en JSX three (types R3F trop verbeux pour un épisode).
import {loadFont as chargerBaloo} from '@remotion/google-fonts/Baloo2';
import {noise2D} from '@remotion/noise';
import {ThreeCanvas} from '@remotion/three';
import {useFrame, useThree} from '@react-three/fiber';
import React, {useMemo, useRef} from 'react';
import {AbsoluteFill, Audio, Easing, Img, interpolate, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import * as THREE from 'three';
import {mergeVertices} from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import voix from './s01p3_voix.json';

/**
 * T'ES BIEN RENTRÉE ? — Série 1 « Le Suiveur », partie 3 (le vote a choisi : B, elle se cache dans l'arrière-boutique).
 * Huis clos dans la réserve sombre : la voix de l'homme étouffée derrière la porte, le vendeur qui ment pour elle,
 * le filet de lumière sous la porte où passent des pieds, batterie 2 %. Il appelle le vendeur… et la poignée tourne.
 * Choix : SMS au 114 (on ne peut pas parler) ou sortir seule par la porte de service. Tout est fonction du temps t.
 */
const FPS = 30;
const T_FIN = 62.0;
export const DUREE_SUIVEUR_P3 = Math.round(T_FIN * FPS);
const {fontFamily: BALOO} = chargerBaloo('normal', {weights: ['700', '800'], subsets: ['latin']});

// ================================================================== chronologie (s)
const L: Record<string, number> = {
  L01: 0.5, L02: 6.0, L03: 10.0, L04: 13.8, L05: 20.0, L06: 23.8, L07: 28.4, L08: 33.4, L09: 37.4, L10: 44.0, L11: 48.0,
};
const S = {
  RECAP_FIN: 2.2, FERME: 2.2, CLOCHETTE: 3.9, BATTERIE: 28.0, BATTERIE_FIN: 32.4, VENDEUR_DEVANT: 33.1, VENDEUR_PART: 49.6,
  POIGNEE: 51.0, VOTE: 53.0,
};
const recolle = (mots) =>
  mots.reduce((acc, m) => {
    if (acc.length && !/[\p{L}\p{N}]/u.test(m.t)) {
      const p = acc[acc.length - 1];
      acc[acc.length - 1] = {...p, t: p.t + m.t, b: Math.max(p.b, m.b)};
    } else acc.push(m);
    return acc;
  }, []);
const LIGNES = voix.lignes.map((l) => ({...l, mots: recolle(l.mots), debut: L[l.id], fin: L[l.id] + l.duree}));

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const fen = (t: number, a: number, b: number, de = 0, vers = 1, easing?: (x: number) => number) =>
  b <= a ? (t < a ? de : vers) : interpolate(t, [a, b], [de, vers], {...clamp, easing});
const doux = Easing.inOut(Easing.cubic);
type V3 = [number, number, number];
const mixv = (a: number[], b: number[], k: number) => a.map((x, i) => x + (b[i] - x) * k) as V3;

// HUD : on reprend à 02:23 (fin de la partie 2), batterie 5 % puis 2 %
const heure = (t: number) => {
  const m = 23 + Math.floor(fen(t, 0, S.VOTE, 0, 4.4));
  return `02:${String(m).padStart(2, '0')}`;
};
const minutesRestantes = (_t: number) => 5;
const batterie = (t: number) => (t < S.BATTERIE + 0.3 ? 5 : 2);

// ================================================================== palette de nuit
export const C = {
  peauInes: '#e9b48e', manche: '#1d1d26', contour: '#1a1020', coin: '#0d1024',
};

// ================================================================== toon
const gradient = (() => {
  const t = new THREE.DataTexture(new Uint8Array([150, 205, 255]), 3, 1, THREE.RedFormat);
  t.minFilter = t.magFilter = THREE.NearestFilter;
  t.needsUpdate = true;
  return t;
})();
const cacheToon = new Map<string, THREE.Material>();
export const toon = (c: string) => {
  if (!cacheToon.has(c)) cacheToon.set(c, new THREE.MeshToonMaterial({color: c, gradientMap: gradient}));
  return cacheToon.get(c)!;
};
const cacheBasic = new Map<string, THREE.Material>();
export const plat = (c: string) => {
  if (!cacheBasic.has(c)) cacheBasic.set(c, new THREE.MeshBasicMaterial({color: c, toneMapped: false}));
  return cacheBasic.get(c)!;
};
const cacheHalo = new Map<string, THREE.Material>();
export const halo = (c: string, o: number) => {
  const k = `${c}${o}`;
  if (!cacheHalo.has(k)) cacheHalo.set(k, new THREE.MeshBasicMaterial({color: c, transparent: true, opacity: o, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false}));
  return cacheHalo.get(k)!;
};
export const matContour = new THREE.ShaderMaterial({
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
export const G = {
  boite: new THREE.BoxGeometry(1, 1, 1),
  sphere: new THREE.SphereGeometry(1, 28, 20),
  demi: new THREE.SphereGeometry(1, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2),
  capsule: new THREE.CapsuleGeometry(1, 1, 6, 16),
  cylindre: new THREE.CylinderGeometry(1, 1, 1, 18),
  disque: new THREE.CircleGeometry(1, 32),
};
export const T: React.FC<any> = ({g, c, p = [0, 0, 0], s = [1, 1, 1], r = [0, 0, 0], contour = true, mat, visible = true}) => (
  <group position={p} rotation={r} scale={s} visible={visible}>
    <mesh geometry={g} material={mat ?? toon(c)} />
    {contour ? <mesh geometry={coque(g)} material={matContour} /> : null}
  </group>
);
const Boite: React.FC<any> = (pr) => <T g={G.boite} {...pr} />;

// ================================================================== bouche, yeux
const parle = (perso: string[], t: number) => {
  for (const l of LIGNES) {
    if (!perso.includes(l.perso) || t < l.debut || t > l.fin) continue;
    const u = t - l.debut;
    for (const m of l.mots) if (u >= m.a && u <= m.b) return 0.45 + 0.55 * Math.abs(Math.sin(((u - m.a) / Math.max(0.08, m.b - m.a)) * Math.PI * 1.6));
    return 0.08;
  }
  return 0;
};
const cligne = (t: number, graine: number) => {
  const p = 3.1 + graine * 0.7;
  const u = (t + graine * 1.37) % p;
  return u < 0.12 ? 0.1 : 1;
};

// ================================================================== personnage toon générique (+ cheveux longs, capuche rabattue)
type Style = {peau: string; haut: string; bas: string; chaussures: string; cheveux: string; coiffure: 'court' | 'longs';
  capucheTete?: boolean; boucles?: boolean; levres?: string};
export const Perso: React.FC<any> = ({p, rotY = 0, assis = 0, marche = 0, phase = 0, torse = 0, tete = [0, 0], brasD = [0, 0.08, 0], brasG = [0, 0.08, 0],
  bouche = 0, cligne: cl = 1, regard = [0, 0], sourire = 0, sourcils = 0, style, visible = true, telMain}) => {
  const hanche = 0.86 + (0.5 - 0.86) * assis;
  const pas = Math.sin(phase);
  const jambe = (k: number) => ({h: -assis * Math.PI / 2 + marche * k * pas * 0.5, g: assis * Math.PI / 2 + marche * Math.max(0, -k * pas) * 0.8});
  const bras = (b: V3, k: number) => [b[0] + marche * -k * pas * 0.35, b[1], b[2]] as V3;
  const peau = style.peau;
  return (
    <group position={p} rotation={[0, rotY, 0]} visible={visible}>
      <group position={[0, hanche + Math.abs(Math.cos(phase)) * 0.02 * marche, 0]}>
        {[-1, 1].map((k) => {
          const j = jambe(k);
          return (
            <group key={k} position={[k * 0.095, 0, 0]} rotation={[j.h, 0, 0]}>
              <T g={G.capsule} c={style.bas} p={[0, -0.2, 0]} s={[0.075, 0.24, 0.075]} />
              <group position={[0, -0.42, 0]} rotation={[j.g, 0, 0]}>
                <T g={G.capsule} c={style.bas} p={[0, -0.19, 0]} s={[0.065, 0.22, 0.065]} />
                <Boite c={style.chaussures} p={[0, -0.41, 0.05]} s={[0.11, 0.08, 0.22]} />
              </group>
            </group>
          );
        })}
        <group rotation={[torse, 0, 0]}>
          <T g={G.capsule} c={style.haut} p={[0, 0.3, 0]} s={[0.19, 0.24, 0.14]} />
          {style.coiffure === 'longs' ? <T g={G.capsule} c={style.cheveux} p={[0, 0.5, -0.1]} s={[0.15, 0.13, 0.05]} /> : null}
          {[[-1, brasG], [1, brasD]].map(([k, b]: any) => {
            const a = bras(b, k);
            return (
              <group key={k} position={[k * -0.215, 0.5, 0]} rotation={[a[0], 0, k * -a[1]]}>
                <T g={G.capsule} c={style.haut} p={[0, -0.13, 0]} s={[0.055, 0.13, 0.055]} />
                <group position={[0, -0.27, 0]} rotation={[a[2], 0, 0]}>
                  <T g={G.capsule} c={style.haut} p={[0, -0.11, 0]} s={[0.05, 0.11, 0.05]} />
                  <T g={G.sphere} c={peau} p={[0, -0.25, 0]} s={[0.045, 0.05, 0.04]} />
                  {k === 1 && telMain ? <group position={[0, -0.27, 0.03]}>{telMain}</group> : null}
                </group>
              </group>
            );
          })}
          <T g={G.cylindre} c={peau} p={[0, 0.6, 0]} s={[0.055, 0.1, 0.055]} />
          <group position={[0, 0.66, 0]} rotation={[tete[1], tete[0], 0, 'YXZ']}>
            <T g={G.sphere} c={peau} p={[0, 0.14, 0]} s={[0.15, 0.165, 0.145]} />
            <T g={G.sphere} c={peau} p={[-0.148, 0.13, 0]} s={[0.025, 0.04, 0.025]} />
            <T g={G.sphere} c={peau} p={[0.148, 0.13, 0]} s={[0.025, 0.04, 0.025]} />
            {style.boucles ? [-1, 1].map((k) => <mesh key={k} geometry={G.sphere} material={plat('#ffd36b')} position={[k * 0.152, 0.075, 0.005]} scale={0.014} />) : null}
            {style.coiffure === 'longs' ? (
              <>
                <T g={G.demi} c={style.cheveux} p={[0, 0.17, -0.035]} r={[-0.5, 0, 0]} s={[0.165, 0.175, 0.16]} />
                <T g={G.capsule} c={style.cheveux} p={[0, 0.02, -0.08]} s={[0.15, 0.17, 0.08]} />
                <T g={G.capsule} c={style.cheveux} p={[-0.13, 0.04, 0.0]} r={[0, 0, -0.08]} s={[0.045, 0.13, 0.07]} />
                <T g={G.capsule} c={style.cheveux} p={[0.13, 0.04, 0.0]} r={[0, 0, 0.08]} s={[0.045, 0.13, 0.07]} />
                <T g={G.sphere} c={style.cheveux} p={[-0.06, 0.275, 0.085]} r={[0.3, 0, -0.45]} s={[0.1, 0.035, 0.05]} />
              </>
            ) : null}
            {style.coiffure === 'court' ? (
              <>
                <T g={G.demi} c={style.cheveux} p={[0, 0.2, -0.015]} s={[0.155, 0.12, 0.15]} />
                <T g={G.sphere} c={style.cheveux} p={[0, 0.235, 0.06]} r={[0.3, 0, 0]} s={[0.13, 0.05, 0.1]} />
              </>
            ) : null}
            {style.capucheTete ? (
              <>
                <T g={G.demi} c={style.haut} p={[0, 0.15, -0.025]} r={[-0.35, 0, 0]} s={[0.192, 0.235, 0.19]} />
                <mesh geometry={G.sphere} material={plat('#0c0a12')} position={[0, 0.27, 0.115]} scale={[0.15, 0.06, 0.04]} />
              </>
            ) : null}
            {[-0.055, 0.055].map((x) => (
              <group key={x} position={[x, 0.15, 0.128]} scale={[1, cl, 1]}>
                <T g={G.sphere} c={'#ffffff'} s={[0.042, 0.05, 0.022]} />
                <mesh geometry={G.sphere} material={toon('#1a1210')} position={[regard[0] * 0.014, regard[1] * 0.016, 0.017]} scale={[0.021, 0.025, 0.01]} />
                <mesh geometry={G.sphere} material={plat('#ffffff')} position={[regard[0] * 0.014 + 0.008, regard[1] * 0.016 + 0.011, 0.026]} scale={[0.0065, 0.0065, 0.003]} />
              </group>
            ))}
            {[-1, 1].map((k) => (
              <Boite key={k} c={style.coiffure === 'longs' ? '#3a2418' : style.cheveux} p={[k * 0.057, 0.218 + sourcils * 0.008, 0.135]}
                r={[0, 0, k * (0.12 - sourire * 0.1) - k * sourcils * 0.25]} s={[0.05, 0.012, 0.012]} contour={false} />
            ))}
            <mesh geometry={G.sphere} material={toon('#d98a5e')} position={[0, 0.1, 0.148]} scale={[0.016, 0.014, 0.012]} />
            <mesh geometry={G.capsule} material={toon(style.levres ?? '#6a221c')} position={[0, 0.045, 0.138]} rotation={[0, 0, Math.PI / 2]}
              scale={[0.006 + bouche * 0.018, 0.02 + sourire * 0.014, 0.008]} />
          </group>
        </group>
      </group>
    </group>
  );
};

/** Angles de tête (lacet, tangage) pour qu'un perso regarde un point, dans son repère. */
const viser = (de: V3, vers: V3, rotY: number, lim = 1.1): [number, number] => {
  const dx = vers[0] - de[0], dy = vers[1] - de[1], dz = vers[2] - de[2];
  let lacet = Math.atan2(dx, dz) - rotY;
  lacet = Math.atan2(Math.sin(lacet), Math.cos(lacet));
  const tangage = -Math.atan2(dy, Math.hypot(dx, dz));
  return [Math.max(-lim, Math.min(lim, lacet)), Math.max(-0.6, Math.min(0.6, tangage))];
};

// ================================================================== le kebab : tout est placé autour de sa vitrine
const KEBAB_X = -61.0;
const IX0 = KEBAB_X - 3.2, IX1 = KEBAB_X + 3.2; // largeur de la boutique
const Z_VITRE = 10.8, Z_FOND = 15.9;
const PORTE_X = KEBAB_X + 1.6; // la porte vitrée

// ================================================================== la réserve : une pièce à part (x de -2,2 à 2,2 ; z de -2,6 à 1,6), la porte du magasin en face de toi
const RX0 = -2.2, RX1 = 2.2, RZ0 = -2.6, RZ1 = 1.6, RH = 2.6;
const PORTE_R = 0.3; // centre de la porte qui donne sur le magasin
const SORTIE_Z = -0.6; // la porte de service, sur le mur de gauche
const ouvertureReserve = (t: number) => 0.55 * (1 - fen(t, S.FERME, S.FERME + 1.0, 0, 1, doux));
// des pieds dans le filet de lumière sous la porte : le vendeur qui monte la garde, puis quelqu'un d'autre
const piedsVendeur = (t: number) => fen(t, S.VENDEUR_DEVANT, S.VENDEUR_DEVANT + 0.5) * (1 - fen(t, S.VENDEUR_PART, S.VENDEUR_PART + 0.8));
const decaleVendeur = (t: number) => fen(t, S.VENDEUR_PART, S.VENDEUR_PART + 0.8, 0, 1.2, Easing.in(Easing.cubic));
const piedsHomme = (t: number) => fen(t, S.POIGNEE - 0.6, S.POIGNEE);
const poignee = (t: number) => fen(t, S.POIGNEE, S.POIGNEE + 0.5, 0, 0.55, doux) + (t > S.POIGNEE + 0.5 ? Math.sin((t - S.POIGNEE) * 31) * 0.05 : 0);

// ================================================================== caméra subjective : accroupie derrière les cartons, face à la porte du magasin
const OEIL = 1.15;
const P_CACHEE: V3 = [0.05, OEIL, -1.3];
const camBase = (_t: number): V3 => P_CACHEE;
const enMarche = (_t: number) => false;
const rel = (t: number, d: V3): V3 => {
  const c = camBase(t);
  return [c[0] + d[0], c[1] + d[1], c[2] + d[2]];
};
const CIBLES: Record<string, (t: number) => V3> = {
  PORTE: () => [PORTE_R, 1.0, RZ1],
  SOL_PORTE: () => [PORTE_R, 0.25, RZ1],
  CARTONS: () => [RX1, 0.9, 0.2],
  FRIGO: () => [-1.3, 0.75, RZ0],
  SORTIE: () => [RX0, 1.35, SORTIE_Z],
  TEL: (t) => rel(t, [0.06, -0.42, 0.75]),
};
const CLES: [number, string, number][] = [
  [0, 'PORTE', 0], [L.L04 - 0.2, 'CARTONS', 0.8], [15.6, 'FRIGO', 0.8], [17.4, 'SORTIE', 0.7], [L.L05 - 0.3, 'PORTE', 0.6],
  [S.BATTERIE, 'TEL', 0.45], [S.VENDEUR_DEVANT - 0.5, 'SOL_PORTE', 0.6], [L.L09 - 0.2, 'SORTIE', 0.8], [L.L10 - 0.2, 'TEL', 0.45],
  [L.L11 - 0.4, 'PORTE', 0.6],
];
const indexCle = (t: number) => {
  let i = 0;
  while (i + 1 < CLES.length && CLES[i + 1][0] <= t) i++;
  return i;
};
const cibleA = (t: number): V3 => {
  const i = indexCle(t);
  const [t0, nom, d] = CLES[i];
  const cur = CIBLES[nom](t);
  if (i === 0 || d <= 0) return cur;
  const prev = CIBLES[CLES[i - 1][1]](t);
  return mixv(prev, cur, fen(t, t0, t0 + d, 0, 1, doux));
};
const poidsTel = (t: number) => {
  const i = indexCle(t);
  const est = CLES[i][1] === 'TEL' ? 1 : 0;
  const etait = i > 0 && CLES[i - 1][1] === 'TEL' ? 1 : 0;
  return etait + (est - etait) * fen(t, CLES[i][0], CLES[i][0] + CLES[i][2], 0, 1, doux);
};
const poseCam = (t: number) => {
  const b = camBase(t);
  const sursaut = fen(t, S.POIGNEE, S.POIGNEE + 0.12) * (1 - fen(t, S.POIGNEE + 0.12, S.POIGNEE + 0.9))
    + fen(t, S.CLOCHETTE, S.CLOCHETTE + 0.1) * (1 - fen(t, S.CLOCHETTE + 0.1, S.CLOCHETTE + 0.7)) * 0.6;
  const souffle = Math.sin(t * 2.4) * 0.008 * (1 + fen(t, L.L02, L.L02 + 2));
  const pos: V3 = [b[0] + noise2D('px', t * 0.5, 0) * 0.012, b[1] + souffle - sursaut * 0.03, b[2] + noise2D('pz', t * 0.5, 1) * 0.012];
  const c = cibleA(t);
  const tremble = 0.02 + (t > L.L02 ? 0.012 : 0) + (t > S.POIGNEE ? 0.02 : 0);
  const cible: V3 = [c[0] + noise2D('cx', t * 1.1, 0) * tremble, c[1] + noise2D('cy', t * 1.1, 1) * tremble + sursaut * 0.06, c[2] + noise2D('cz', t * 1.1, 2) * tremble];
  const roulis = noise2D('r', t * 0.8, 2) * 0.02;
  return {pos, cible, roulis};
};
const dirCam = (t: number) => {
  const {pos, cible} = poseCam(t);
  const d = new THREE.Vector3(cible[0] - pos[0], cible[1] - pos[1], cible[2] - pos[2]).normalize();
  return {lacet: Math.atan2(d.x, -d.z), tangage: Math.asin(d.y)};
};

// ================================================================== la ville, de nuit
const alea = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
const FACADES = ['#8a7590', '#7a6a88', '#9a8090', '#6e6888', '#887272', '#747a92', '#967e86', '#686e88'];
const IMMEUBLES = (() => {
  const out: {x: number; l: number; h: number; c: string; cote: number; i: number}[] = [];
  for (const cote of [-1, 1]) {
    let x = 14;
    let i = cote > 0 ? 100 : 0;
    while (x > -80) {
      const l = 6 + alea(i) * 4, h = 9 + alea(i + 0.5) * 8;
      out.push({x: x - l / 2, l, h, c: FACADES[Math.floor(alea(i + 0.3) * FACADES.length)], cote, i});
      x -= l + 0.15;
      i++;
    }
  }
  // la boutique occupe [IX0, IX1] côté +z : on y recoupe les immeubles
  const coupe: typeof out = [];
  for (const b of out) {
    const x0 = b.x - b.l / 2, x1 = b.x + b.l / 2;
    if (b.cote < 0 || x1 <= IX0 || x0 >= IX1) { coupe.push(b); continue; }
    if (IX0 - x0 > 0.4) coupe.push({...b, x: (x0 + IX0) / 2, l: IX0 - x0 - 0.05});
    if (x1 - IX1 > 0.4) coupe.push({...b, x: (IX1 + x1) / 2, l: x1 - IX1 - 0.05, i: b.i + 500});
  }
  return coupe;
})();
const Immeuble: React.FC<{x: number; l: number; h: number; c: string; cote: number; i: number}> = ({x, l, h, c, cote, i}) => {
  const zF = cote < 0 ? -2.8 : 10.8;
  const s = cote < 0 ? 1 : -1;
  const prof = 6;
  const cols = Math.max(2, Math.floor(l / 1.6));
  const etages = Math.floor((h - 3.2) / 2.4);
  const store = ['#7a2a24', '#24483a', '#223a63', '#6e4420'][Math.floor(alea(i + 0.9) * 4)];
  return (
    <group>
      <T g={G.boite} c={c} p={[x, h / 2, zF - s * prof / 2]} s={[l, h, prof]} />
      <T g={G.boite} c={'#3a2f3c'} p={[x, h + 0.12, zF - s * prof / 2]} s={[l + 0.2, 0.24, prof + 0.2]} />
      {Array.from({length: etages}, (_, e) => Array.from({length: cols}, (_, k) => {
        const on = alea(i * 7.3 + e * 3.1 + k) > 0.8;
        const wx = x - l / 2 + (k + 0.5) * (l / cols);
        return <mesh key={`${e}-${k}`} position={[wx, 3.9 + e * 2.4, zF + s * 0.01]} geometry={G.boite} scale={[0.75, 1.15, 0.02]}
          material={plat(on ? (alea(i + e + k * 0.7) > 0.5 ? '#ffcf7a' : '#9fb8ff') : '#1c1a2e')} />;
      }))}
      {/* vitrine fermée, rideau métallique baissé */}
      <mesh position={[x + l * 0.12, 1.25, zF + s * 0.012]} geometry={G.boite} scale={[l * 0.5, 1.7, 0.02]} material={plat('#2a2838')} />
      {Array.from({length: 7}, (_, k) => <mesh key={k} position={[x + l * 0.12, 0.55 + k * 0.22, zF + s * 0.02]} geometry={G.boite} scale={[l * 0.5, 0.02, 0.01]} material={plat('#3c394e')} />)}
      <T g={G.boite} c={store} p={[x + l * 0.12, 2.35, zF + s * 0.45]} r={[s * 0.35, 0, 0]} s={[l * 0.55, 0.08, 0.95]} />
      <T g={G.boite} c={'#2c2028'} p={[x - l * 0.32, 1.05, zF + s * 0.03]} s={[1.0, 2.1, 0.06]} />
    </group>
  );
};
const Voiture: React.FC<{x: number; c: string; z: number}> = ({x, c, z}) => (
  <group position={[x, 0, z]}>
    <T g={G.boite} c={c} p={[0, 0.55, 0]} s={[4.1, 0.65, 1.75]} />
    <T g={G.boite} c={c} p={[0.2, 1.05, 0]} s={[2.2, 0.55, 1.6]} />
    <mesh position={[0.2, 1.05, 0.81]} geometry={G.boite} scale={[2.0, 0.42, 0.02]} material={plat('#141830')} />
    <mesh position={[0.2, 1.05, -0.81]} geometry={G.boite} scale={[2.0, 0.42, 0.02]} material={plat('#141830')} />
    {[-1.35, 1.35].map((wx) => [-0.85, 0.85].map((wz) => (
      <T key={`${wx}${wz}`} g={G.cylindre} c={'#111116'} p={[wx, 0.32, wz]} r={[Math.PI / 2, 0, 0]} s={[0.32, 0.22, 0.32]} />
    )))}
  </group>
);
// lampadaire + flaque de lumière orange au sol (halo additif : pas besoin de vraies lampes)
const Lampadaire: React.FC<{x: number; z: number; s: number}> = ({x, z, s}) => (
  <group position={[x, 0, z]}>
    <T g={G.cylindre} c={'#232733'} p={[0, 2.4, 0]} s={[0.06, 4.8, 0.06]} />
    <T g={G.boite} c={'#232733'} p={[0, 4.75, -s * 0.45]} s={[0.08, 0.08, 0.9]} />
    <mesh position={[0, 4.65, -s * 0.85]} geometry={G.sphere} scale={[0.22, 0.12, 0.22]} material={plat('#ffd08a')} />
    <mesh position={[0, 4.6, -s * 0.85]} geometry={G.sphere} scale={[0.7, 0.5, 0.7]} material={halo('#ffb860', 0.18)} />
    <mesh position={[0, 0.025, -s * 0.85]} rotation={[-Math.PI / 2, 0, 0]} geometry={G.disque} scale={2.6} material={halo('#ffa850', 0.18)} />
    <mesh position={[0, 0.03, -s * 0.85]} rotation={[-Math.PI / 2, 0, 0]} geometry={G.disque} scale={1.3} material={halo('#ffc070', 0.14)} />
  </group>
);
const matCiel = new THREE.ShaderMaterial({
  side: THREE.BackSide, depthWrite: false,
  uniforms: {haut: {value: new THREE.Color('#060818')}, milieu: {value: new THREE.Color('#121738')}, bas: {value: new THREE.Color('#2e2a52')}},
  vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: `uniform vec3 haut, milieu, bas; varying vec3 vP;
    float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
    void main(){ float y = vP.y; vec3 c = y > 0.18 ? mix(milieu, haut, smoothstep(0.18, 0.7, y)) : mix(bas, milieu, smoothstep(-0.05, 0.18, y));
      vec2 g = floor(vec2(atan(vP.z, vP.x) * 160.0, y * 160.0)); float e = step(0.996, h(g)) * smoothstep(0.25, 0.5, y); c += e * 0.7;
      gl_FragColor = vec4(c, 1.0); }`,
});
// voitures garées, en laissant libre le passage piéton où l'on traverse (x ≈ -22 à -30)
const VOITURES = [6, -1.5, -8, -12.6, -36, -44, -52, -67].map((x, i) => ({x, c: ['#5a2a2a', '#9aa0a8', '#24405e', '#7a6a2a', '#1d232e', '#4a5a3e', '#6a3a1e', '#3a3a48'][i]}));
const VOITURES_FACE = [-12, -40, -48, -70].map((x, i) => ({x, c: ['#3e3463', '#7a3a1a', '#22303a', '#5a5a64'][i]}));

// le kebab (seul commerce ouvert) : intérieur et enseigne dessinés dans des canvas
const vitrineKebab = () => {
  const cv = document.createElement('canvas');
  cv.width = 640; cv.height = 360;
  const g = cv.getContext('2d')!;
  const f = g.createLinearGradient(0, 0, 0, 360);
  f.addColorStop(0, '#fff1c8'); f.addColorStop(1, '#ffc970');
  g.fillStyle = f; g.fillRect(0, 0, 640, 360);
  g.fillStyle = '#d9a04a'; g.fillRect(0, 230, 640, 130);
  g.fillStyle = '#b5652a'; g.fillRect(0, 222, 640, 14);
  g.fillStyle = '#8a4a22'; g.beginPath(); g.moveTo(120, 70); g.lineTo(170, 70); g.lineTo(160, 220); g.lineTo(130, 220); g.closePath(); g.fill();
  g.fillStyle = '#d0402a'; g.fillRect(96, 70, 18, 150);
  g.fillStyle = '#f4f1ea'; g.beginPath(); g.roundRect(330, 156, 100, 80, 26); g.fill();
  g.fillStyle = '#c98a5a'; g.beginPath(); g.arc(380, 128, 28, 0, 7); g.fill();
  g.fillStyle = '#2a1c16'; g.beginPath(); g.arc(380, 116, 29, Math.PI, 0); g.fill();
  g.fillStyle = '#2b2b33'; g.fillRect(470, 30, 150, 110);
  g.fillStyle = '#ffd36b'; g.font = '800 26px sans-serif'; g.fillText('MENU', 506, 66);
  g.fillStyle = '#ffffff'; g.font = '700 18px sans-serif'; ['Sandwich', 'Assiette', 'Tacos'].forEach((m, k) => g.fillText(m, 490, 94 + k * 20));
  const tx = new THREE.CanvasTexture(cv); tx.colorSpace = THREE.SRGBColorSpace; return tx;
};
const enseigneKebab = () => {
  const cv = document.createElement('canvas');
  cv.width = 512; cv.height = 128;
  const g = cv.getContext('2d')!;
  g.fillStyle = '#1a1424'; g.fillRect(0, 0, 512, 128);
  g.shadowColor = '#ff4a3a'; g.shadowBlur = 24;
  g.fillStyle = '#ff6a50'; g.font = '800 78px sans-serif'; g.textAlign = 'center'; g.fillText('KEBAB', 190, 92);
  g.shadowColor = '#5aff9a'; g.fillStyle = '#7dffb0'; g.font = '800 40px sans-serif'; g.fillText('OUVERT', 412, 84);
  const tx = new THREE.CanvasTexture(cv); tx.colorSpace = THREE.SRGBColorSpace; return tx;
};
const useTexMat = (cle: string, fab: () => THREE.Texture) => {
  const mat = useMemo(() => new THREE.MeshBasicMaterial({toneMapped: false}), []);
  const tex = useMemo(fab, [cle]);
  mat.map = tex;
  mat.needsUpdate = true;
  return mat;
};
const Kebab: React.FC<{t: number}> = ({t}) => {
  const matE = useTexMat('enseigne', enseigneKebab);
  const neon = Math.sin(t * 23) > 0.93 ? 0.96 : 1;
  return (
    <group position={[KEBAB_X, 0, 10.74]} rotation={[0, Math.PI, 0]}>
      <group position={[0, 2.95, 0.02]} scale={neon}>
        <mesh material={matE}><planeGeometry args={[3.4, 0.85]} /></mesh>
      </group>
      <mesh position={[0, 0.03, 1.6]} rotation={[-Math.PI / 2, 0, 0]} geometry={G.disque} scale={[3.2, 2.0, 1]} material={halo('#ffd27a', 0.3)} />
    </group>
  );
};

const autocollantAngela = () => {
  const cv = document.createElement('canvas');
  cv.width = 512; cv.height = 512;
  const g = cv.getContext('2d')!;
  g.fillStyle = '#6a2c91'; g.beginPath(); g.arc(256, 256, 250, 0, 7); g.fill();
  g.strokeStyle = '#ffffff'; g.lineWidth = 14; g.beginPath(); g.arc(256, 256, 222, 0, 7); g.stroke();
  g.fillStyle = '#ffffff'; g.textAlign = 'center';
  g.font = '700 54px sans-serif'; g.fillText('ICI,', 256, 170);
  g.font = '800 64px sans-serif'; g.fillText('DEMANDEZ', 256, 250);
  g.fillStyle = '#ffd36b'; g.font = '800 96px sans-serif'; g.fillText('ANGELA', 256, 345);
  g.fillStyle = '#ffffff'; g.font = '600 30px sans-serif'; g.fillText('lieu sûr', 256, 410);
  const tx = new THREE.CanvasTexture(cv); tx.colorSpace = THREE.SRGBColorSpace; return tx;
};
const menuKebab = () => {
  const cv = document.createElement('canvas');
  cv.width = 768; cv.height = 256;
  const g = cv.getContext('2d')!;
  g.fillStyle = '#2a2230'; g.fillRect(0, 0, 768, 256);
  g.fillStyle = '#ffd36b'; g.font = '800 54px sans-serif'; g.fillText('MENU', 30, 70);
  g.fillStyle = '#ffffff'; g.font = '700 38px sans-serif';
  [['Sandwich', '7,50'], ['Assiette', '11,00'], ['Tacos', '8,50'], ['Boisson', '2,00']].forEach(([n, p], k) => {
    const x = 30 + (k % 2) * 380, y = 140 + Math.floor(k / 2) * 70;
    g.fillText(n, x, y); g.fillStyle = '#ff8a6a'; g.fillText(`${p} €`, x + 220, y); g.fillStyle = '#ffffff';
  });
  const tx = new THREE.CanvasTexture(cv); tx.colorSpace = THREE.SRGBColorSpace; return tx;
};
const matVitre = new THREE.MeshBasicMaterial({color: '#bcd8ff', transparent: true, opacity: 0.12, depthWrite: false, side: THREE.DoubleSide, toneMapped: false});
const FACADE_BOUTIQUE = '#6e2f2a';
const Boutique: React.FC<{t: number}> = ({t}) => {
  const matSticker = useTexMat('angela', autocollantAngela);
  const matMenu = useTexMat('menu', menuKebab);
  const l = IX1 - IX0, cx = (IX0 + IX1) / 2, prof = Z_FOND - Z_VITRE, cz = (Z_VITRE + Z_FOND) / 2;
  const ouverture = fen(t, S.PORTE, S.PORTE + 0.7, 0, 1.25, doux) * (1 - fen(t, S.DEDANS + 0.3, S.DEDANS + 1.1, 0, 1, doux))
    + fen(t, S.A_LA_PORTE + 0.4, S.VOTE, 0, 0.18, doux); // à la fin : la porte qui s'entrouvre
  const vx0 = KEBAB_X - 2.1, vx1 = KEBAB_X + 2.1;
  return (
    <group>
      {/* l'étage au-dessus de la boutique */}
      <T g={G.boite} c={'#7a6a88'} p={[cx, 7.2, cz + 0.5]} s={[l, 8.2, prof + 1]} />
      {[0, 1, 2].map((e) => [0, 1, 2, 3].map((k) => (
        <mesh key={`${e}${k}`} position={[IX0 + (k + 0.5) * (l / 4), 4.4 + e * 2.4, Z_VITRE - 0.01]} geometry={G.boite} scale={[0.75, 1.15, 0.02]}
          material={plat((e + k) % 3 === 0 ? '#ffcf7a' : '#1c1a2e')} />
      )))}
      {/* façade avec le trou de la vitrine */}
      <T g={G.boite} c={FACADE_BOUTIQUE} p={[cx, 2.95, Z_VITRE]} s={[l, 0.9, 0.12]} />
      <T g={G.boite} c={FACADE_BOUTIQUE} p={[cx, 0.08, Z_VITRE]} s={[l, 0.16, 0.12]} />
      <T g={G.boite} c={FACADE_BOUTIQUE} p={[(IX0 + vx0) / 2, 1.3, Z_VITRE]} s={[vx0 - IX0, 2.5, 0.12]} />
      <T g={G.boite} c={FACADE_BOUTIQUE} p={[(vx1 + IX1) / 2, 1.3, Z_VITRE]} s={[IX1 - vx1, 2.5, 0.12]} />
      <mesh position={[(vx0 + PORTE_X - 0.5) / 2, 1.33, Z_VITRE]} material={matVitre}><planeGeometry args={[PORTE_X - 0.5 - vx0, 2.34]} /></mesh>
      {[vx0, PORTE_X - 0.5, vx1].map((x) => <T key={x} g={G.boite} c={'#1d1820'} p={[x, 1.33, Z_VITRE]} s={[0.07, 2.36, 0.1]} />)}
      <T g={G.boite} c={'#1d1820'} p={[KEBAB_X, 2.5, Z_VITRE]} s={[4.3, 0.07, 0.1]} />
      <mesh position={[KEBAB_X - 1.2, 1.4, Z_VITRE + 0.012]} material={matSticker}><planeGeometry args={[0.42, 0.42]} /></mesh>
      {/* la porte vitrée, charnière côté droit */}
      <group position={[vx1, 0, Z_VITRE]} rotation={[0, -ouverture, 0]}>
        <mesh position={[-0.5, 1.33, 0]} material={matVitre}><planeGeometry args={[1.0, 2.34]} /></mesh>
        <T g={G.boite} c={'#1d1820'} p={[-0.5, 0.18, 0]} s={[1.0, 0.07, 0.08]} />
        <T g={G.boite} c={'#c9c9d2'} p={[-0.9, 1.1, 0.06]} s={[0.04, 0.4, 0.04]} />
        <T g={G.boite} c={'#c9c9d2'} p={[-0.9, 1.1, -0.06]} s={[0.04, 0.4, 0.04]} />
      </group>
      {/* l'intérieur */}
      <T g={G.boite} c={'#cdb79a'} p={[cx, 0.0, cz]} s={[l, 0.02, prof]} contour={false} />
      {Array.from({length: 7}, (_, k) => <mesh key={k} position={[IX0 + (k + 0.5) * (l / 7), 0.012, cz]} geometry={G.boite} scale={[0.02, 0.005, prof]} material={plat('#b9a184')} />)}
      <T g={G.boite} c={'#fbf1dc'} p={[cx, 3.1, cz]} s={[l, 0.08, prof]} />
      <T g={G.boite} c={'#f1dcb2'} p={[cx, 1.55, Z_FOND]} s={[l, 3.1, 0.1]} />
      <T g={G.boite} c={'#ecd3a4'} p={[IX0, 1.55, cz]} s={[0.1, 3.1, prof]} />
      <T g={G.boite} c={'#ecd3a4'} p={[IX1, 1.55, cz]} s={[0.1, 3.1, prof]} />
      <T g={G.boite} c={'#d9a04a'} p={[cx, 0.6, Z_FOND - 0.06]} s={[l, 1.2, 0.04]} contour={false} />
      {[-1.6, 1.6].map((dx) => <mesh key={dx} position={[KEBAB_X + dx, 3.05, 13.2]} rotation={[Math.PI / 2, 0, 0]} geometry={G.disque} scale={0.35} material={plat('#fff3d6')} />)}
      {/* le comptoir, la vitrine réfrigérée */}
      <T g={G.boite} c={'#8a5a3a'} p={[(IX0 + 0.5 + KEBAB_X + 1.0) / 2, 0.52, 13.95]} s={[KEBAB_X + 1.0 - IX0 - 0.5, 1.04, 0.7]} />
      <T g={G.boite} c={'#ece6da'} p={[(IX0 + 0.5 + KEBAB_X + 1.0) / 2, 1.07, 13.95]} s={[KEBAB_X + 1.0 - IX0 - 0.4, 0.06, 0.8]} />
      <mesh position={[KEBAB_X - 1.2, 1.3, 13.75]} geometry={G.boite} scale={[2.2, 0.38, 0.02]} material={matVitre} />
      {[-2.0, -1.5, -1.0, -0.5].map((dx, k) => <T key={dx} g={G.boite} c={['#3f8a3a', '#d4412e', '#f2c14e', '#e9e2d4'][k]} p={[KEBAB_X + dx, 1.16, 14.0]} s={[0.4, 0.1, 0.35]} />)}
      {/* la broche, sa plaque chauffante, le menu, le frigo à boissons */}
      <mesh position={[KEBAB_X - 1.6, 1.45, Z_FOND - 0.1]} geometry={G.boite} scale={[0.7, 1.2, 0.04]} material={plat('#ff7a3a')} />
      <T g={G.cylindre} c={'#9a5a2a'} p={[KEBAB_X - 1.6, 1.45, Z_FOND - 0.42]} s={[0.2, 1.0, 0.2]} />
      <T g={G.cylindre} c={'#9aa0a8'} p={[KEBAB_X - 1.6, 1.45, Z_FOND - 0.42]} s={[0.02, 1.3, 0.02]} />
      <mesh position={[KEBAB_X + 0.6, 2.35, Z_FOND - 0.07]} material={matMenu}><planeGeometry args={[2.4, 0.8]} /></mesh>
      <group position={[IX1 - 0.45, 0, 15.2]}>
        <T g={G.boite} c={'#e9e9ef'} p={[0, 1.0, 0]} s={[0.7, 2.0, 0.6]} />
        <mesh position={[-0.351, 1.05, 0]} rotation={[0, -Math.PI / 2, 0]} material={plat('#cfeaff')}><planeGeometry args={[0.5, 1.6]} /></mesh>
        {[0.5, 0.9, 1.3, 1.7].map((y, k) => <mesh key={y} position={[-0.355, y, 0]} geometry={G.boite} scale={[0.01, 0.12, 0.45]} material={plat(['#d4412e', '#3f8a3a', '#f2c14e', '#2f6fb0'][k])} />)}
      </group>
      <T g={G.cylindre} c={'#2a2228'} p={[KEBAB_X - 2.2, 0.38, 11.7]} s={[0.04, 0.76, 0.04]} />
      <T g={G.cylindre} c={'#e9e2d4'} p={[KEBAB_X - 2.2, 0.77, 11.7]} s={[0.4, 0.04, 0.4]} />
    </group>
  );
};

const Ville: React.FC<{t: number}> = ({t}) => (
  <group>
    <mesh position={[KEBAB_X, 0, 4]} geometry={G.sphere} scale={[85, 85, 85]} material={matCiel} renderOrder={-1} />
    <mesh position={[KEBAB_X - 40, 30, -30]} geometry={G.sphere} scale={2.2} material={plat('#f3efd8')} />
    <T g={G.boite} c={'#4e4a5a'} p={[-30, -0.05, -0.6]} s={[130, 0.1, 4.4]} />
    <T g={G.boite} c={'#3a3644'} p={[-30, 0.02, 1.62]} s={[130, 0.14, 0.18]} />
    <T g={G.boite} c={'#25232e'} p={[-30, -0.08, 5.1]} s={[130, 0.1, 7.0]} contour={false} />
    {Array.from({length: 34}, (_, i) => <mesh key={i} position={[14 - i * 4, -0.02, 5.1]} geometry={G.boite} scale={[2, 0.01, 0.14]} material={plat('#8d8a96')} />)}
    {/* passage piéton là où l'on traverse */}
    {Array.from({length: 6}, (_, i) => <mesh key={`pp${i}`} position={[-25.5, -0.015, 2.4 + i * 1.12]} geometry={G.boite} scale={[2.6, 0.01, 0.55]} material={plat('#a7a4b0')} />)}
    <T g={G.boite} c={'#3a3644'} p={[-30, 0.02, 8.58]} s={[130, 0.14, 0.18]} />
    <T g={G.boite} c={'#4e4a5a'} p={[-30, -0.05, 9.7]} s={[130, 0.1, 2.2]} />
    {IMMEUBLES.map((b) => <Immeuble key={`${b.cote}${b.i}`} {...b} />)}
    {VOITURES.map((v) => <Voiture key={v.x} x={v.x} c={v.c} z={2.55} />)}
    {VOITURES_FACE.map((v) => <Voiture key={`f${v.x}`} x={v.x} c={v.c} z={7.6} />)}
    {Array.from({length: 10}, (_, i) => <Lampadaire key={i} x={10 - i * 9} z={1.35} s={-1} />)}
    {Array.from({length: 10}, (_, i) => <Lampadaire key={`b${i}`} x={5 - i * 9} z={8.75} s={1} />)}
    <Kebab t={t} />
    <Boutique t={t} />
    {/* le banc d'en face, sous son lampadaire */}
    <Lampadaire x={BANC[0] + 1.1} z={-1.2} s={-1} />
    <group position={BANC}>
      <T g={G.boite} c={'#5a3a2a'} p={[0, 0.45, 0]} s={[1.8, 0.08, 0.45]} />
      <T g={G.boite} c={'#5a3a2a'} p={[0, 0.78, -0.22]} s={[1.8, 0.4, 0.06]} />
      {[-0.75, 0.75].map((x) => <T key={x} g={G.boite} c={'#232733'} p={[x, 0.22, 0]} s={[0.08, 0.44, 0.4]} />)}
      <mesh position={[0, 0.03, 0.2]} rotation={[-Math.PI / 2, 0, 0]} geometry={G.disque} scale={1.8} material={halo('#ffb070', 0.32)} />
    </group>
  </group>
);

// ================================================================== le téléphone d'Inès : écran « 2 % », puis un SMS au 114 prêt à partir
const ecranTel = (etat: string) => {
  const cv = document.createElement('canvas');
  cv.width = 380; cv.height = 780;
  const g = cv.getContext('2d')!;
  if (etat === 'sms') {
    g.fillStyle = '#f4f4f8'; g.fillRect(0, 0, 380, 780);
    g.fillStyle = '#e6e6ee'; g.fillRect(0, 0, 380, 150);
    g.fillStyle = '#2f6fb0'; g.beginPath(); g.arc(190, 70, 38, 0, 7); g.fill();
    g.fillStyle = '#fff'; g.textAlign = 'center'; g.font = '800 30px sans-serif'; g.fillText('114', 190, 81);
    g.fillStyle = '#222'; g.font = '700 22px sans-serif'; g.fillText('Urgence SMS', 190, 135);
    g.fillStyle = '#ffffff'; g.beginPath(); g.roundRect(20, 640, 340, 70, 34); g.fill();
    g.strokeStyle = '#c9c9d6'; g.lineWidth = 3; g.stroke();
    g.fillStyle = '#2f6fb0'; g.fillRect(44, 655, 4, 40);
    g.fillStyle = '#d4412e'; g.textAlign = 'right'; g.font = '800 24px sans-serif'; g.fillText('2 %', 360, 30);
  } else {
    const f = g.createLinearGradient(0, 0, 0, 780);
    f.addColorStop(0, '#3a3270'); f.addColorStop(1, '#b4507a');
    g.fillStyle = f; g.fillRect(0, 0, 380, 780);
    g.fillStyle = '#fff'; g.textAlign = 'center'; g.font = '800 96px sans-serif'; g.fillText(etat === 'bat' ? '02:25' : '02:23', 190, 210);
    g.fillStyle = 'rgba(255,255,255,0.92)'; g.beginPath(); g.roundRect(26, 300, 328, 130, 30); g.fill();
    g.fillStyle = '#d4412e'; g.beginPath(); g.arc(78, 365, 30, 0, 7); g.fill();
    g.fillStyle = '#222'; g.textAlign = 'left'; g.font = '800 30px sans-serif'; g.fillText('Batterie faible', 124, 356);
    g.font = '600 24px sans-serif'; g.fillText(etat === 'bat' ? '2 % restants' : '5 % restants', 124, 392);
  }
  const tx = new THREE.CanvasTexture(cv); tx.colorSpace = THREE.SRGBColorSpace; return tx;
};
const Telephone: React.FC<{mat: THREE.Material}> = ({mat}) => (
  <group>
    <T g={G.boite} c={'#f2d4dc'} s={[0.074, 0.152, 0.01]} />
    <mesh position={[0, 0, 0.0052]} material={mat}><planeGeometry args={[0.065, 0.142]} /></mesh>
  </group>
);
const Mains: React.FC<{t: number}> = ({t}) => {
  const etat = t < S.BATTERIE - 0.3 ? 'cinq' : t < L.L10 - 0.3 ? 'bat' : 'sms';
  const mat = useTexMat(etat, () => ecranTel(etat));
  const leve = poidsTel(t);
  const sonne = t >= S.BATTERIE && t < S.BATTERIE + 0.5 ? Math.sin(t * 190) * 0.003 : 0;
  return (
    <group position={[0.07 + sonne - leve * 0.04, -0.27 + leve * 0.15, -0.33 + leve * 0.03]} rotation={[0.5 + leve * 0.25, -0.15 + leve * 0.1, 0.06]} scale={1.5}>
      <T g={G.capsule} c={C.manche} p={[0.035, -0.125, 0.03]} r={[-0.45, 0, 0.35]} s={[0.032, 0.075, 0.032]} />
      <T g={G.sphere} c={C.peauInes} p={[0.012, -0.04, -0.016]} s={[0.04, 0.048, 0.019]} />
      <Telephone mat={mat} />
      <T g={G.capsule} c={C.peauInes} p={[-0.036, -0.032, 0.012]} r={[0.2, 0, -0.5]} s={[0.011, 0.023, 0.011]} />
      {[-0.034, -0.008, 0.018, 0.042].map((y, i) => (
        <group key={i}>
          <T g={G.capsule} c={C.peauInes} p={[0.041, y - 0.012, 0.006]} r={[0, 0, 0.25]} s={[0.0092, 0.012, 0.0092]} />
          <mesh geometry={G.sphere} material={plat('#c2185b')} position={[0.045, y - 0.003, 0.012]} scale={[0.006, 0.006, 0.003]} />
        </group>
      ))}
    </group>
  );
};

// ================================================================== rendu fisheye + flou de mouvement + vignette qui se resserre avec la peur
const Rendu: React.FC<{t: number; mains: React.RefObject<THREE.Group>}> = ({t, mains}) => {
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
        coin: {value: new THREE.Color(C.coin)}, flou: {value: new THREE.Vector2(0, 0)}, peur: {value: 0}},
      vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`,
      fragmentShader: `uniform sampler2D tex; uniform float aspect, k, zoom, peur; uniform vec3 coin; uniform vec2 flou; varying vec2 vUv;
        vec2 deforme(vec2 uv){ vec2 d = uv - 0.5; d.x *= aspect; float r2 = dot(d, d); vec2 s = d * zoom * (1.0 + k * r2); s.x /= aspect; return s + 0.5; }
        void main(){
          vec2 s = deforme(vUv);
          vec3 c = vec3(0.0);
          for (int i = 0; i < 9; i++) { float f = float(i) / 8.0 - 0.5; c += texture2D(tex, clamp(s + flou * f, 0.0, 1.0)).rgb; }
          c /= 9.0;
          float bord = max(max(-s.x, s.x - 1.0), max(-s.y, s.y - 1.0));
          c = mix(c, coin, smoothstep(-0.004, 0.004, bord));
          vec2 d = vUv - 0.5; d.x *= aspect;
          float vig = smoothstep(0.95, 0.2, dot(d, d) * (1.4 + peur * 0.9));
          c *= mix(0.7, 1.0, vig);
          gl_FragColor = vec4(c, 1.0);
        }`,
      depthTest: false, depthWrite: false,
    });
    s.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat));
    return {s, cam, mat};
  }, [cible, size.width, size.height]);
  const pose = poseCam(t);
  const a = dirCam(t), b = dirCam(t - 1 / FPS);
  let dl = a.lacet - b.lacet;
  dl = Math.atan2(Math.sin(dl), Math.cos(dl));
  const fx = Math.max(-0.08, Math.min(0.08, dl * 0.7)), fy = Math.max(-0.08, Math.min(0.08, -(a.tangage - b.tangage) * 0.7));
  const peur = 0.35 + fen(t, L.L02, L.L02 + 2) * 0.25 + fen(t, S.POIGNEE, S.POIGNEE + 1.5) * 0.4;
  useFrame(() => {
    const cam = camera as THREE.PerspectiveCamera;
    cam.fov = 108;
    cam.near = 0.02;
    cam.far = 95;
    cam.aspect = size.width / size.height;
    cam.position.set(...pose.pos);
    cam.up.set(0, 1, 0);
    cam.lookAt(...pose.cible);
    cam.rotateZ(pose.roulis);
    cam.updateProjectionMatrix();
    cam.updateMatrixWorld();
    if (mains.current) {
      mains.current.position.copy(cam.position);
      mains.current.quaternion.copy(cam.quaternion);
      mains.current.updateMatrixWorld();
    }
    post.mat.uniforms.flou.value.set(fx, fy);
    post.mat.uniforms.peur.value = peur;
    gl.setRenderTarget(cible);
    gl.render(scene, cam);
    gl.setRenderTarget(null);
    gl.render(post.s, post.cam);
  }, 1);
  return null;
};

// ================================================================== scène : la réserve
export const STYLE_HOMME: Style = {peau: '#d9a27a', haut: '#4a4e5e', bas: '#2a2d38', chaussures: '#e8e8e8', cheveux: '#1d1410', coiffure: 'court', capucheTete: true};
const panneauSortie = () => {
  const cv = document.createElement('canvas');
  cv.width = 512; cv.height = 192;
  const g = cv.getContext('2d')!;
  g.fillStyle = '#1aa75a'; g.fillRect(0, 0, 512, 192);
  g.fillStyle = '#ffffff'; g.font = '800 92px sans-serif'; g.textAlign = 'center'; g.fillText('SORTIE', 300, 128);
  g.fillRect(40, 50, 60, 96); g.fillStyle = '#1aa75a'; g.fillRect(52, 62, 36, 84);
  g.fillStyle = '#ffffff'; g.beginPath(); g.arc(122, 66, 12, 0, 7); g.fill(); g.fillRect(112, 82, 18, 44);
  const tx = new THREE.CanvasTexture(cv); tx.colorSpace = THREE.SRGBColorSpace; return tx;
};
const CARTONS: [number, number, number, number][] = [
  // x, y (bas), z, taille
  [1.85, 0.02, -1.6, 0.5], [1.85, 0.52, -1.6, 0.42], [1.9, 0.02, -1.0, 0.45], [1.9, 0.02, 0.6, 0.5], [1.88, 0.52, 0.6, 0.38],
  [0.85, 0.02, -0.95, 0.55], [0.4, 0.02, -0.85, 0.42], [-0.6, 0.02, -0.9, 0.36],
];
const OMBRE = new THREE.MeshBasicMaterial({color: '#0a0810', transparent: true, opacity: 0.75, depthWrite: false, toneMapped: false});
const Reserve: React.FC<{t: number}> = ({t}) => {
  const matSortie = useTexMat('sortie', panneauSortie);
  const l = RX1 - RX0, cz = (RZ0 + RZ1) / 2, prof = RZ1 - RZ0;
  const ouv = ouvertureReserve(t);
  const px0 = PORTE_R - 0.45, px1 = PORTE_R + 0.45;
  return (
    <group>
      {/* sol, plafond, murs */}
      <T g={G.boite} c={'#6e6a76'} p={[0, 0, cz]} s={[l, 0.02, prof]} contour={false} />
      <T g={G.boite} c={'#3e3c48'} p={[0, RH, cz]} s={[l, 0.06, prof]} />
      <T g={G.boite} c={'#857e90'} p={[0, RH / 2, RZ0]} s={[l, RH, 0.08]} />
      <T g={G.boite} c={'#5f5a6a'} p={[RX0, RH / 2, cz]} s={[0.08, RH, prof]} />
      <T g={G.boite} c={'#5f5a6a'} p={[RX1, RH / 2, cz]} s={[0.08, RH, prof]} />
      {/* mur du magasin avec la porte */}
      <T g={G.boite} c={'#6a6474'} p={[(RX0 + px0) / 2, RH / 2, RZ1]} s={[px0 - RX0, RH, 0.08]} />
      <T g={G.boite} c={'#6a6474'} p={[(px1 + RX1) / 2, RH / 2, RZ1]} s={[RX1 - px1, RH, 0.08]} />
      <T g={G.boite} c={'#6a6474'} p={[PORTE_R, (2.08 + RH) / 2, RZ1]} s={[0.9, RH - 2.08, 0.08]} />
      {/* derrière la porte : la lumière du magasin */}
      <mesh position={[PORTE_R, 1.1, RZ1 + 0.35]} geometry={G.boite} scale={[1.4, 2.4, 0.02]} material={plat('#ffd9a0')} />
      {/* le filet de lumière sous la porte, et sa flaque sur le sol */}
      <mesh position={[PORTE_R, 0.05, RZ1 - 0.03]} geometry={G.boite} scale={[0.86, 0.1, 0.002]} material={plat('#ffd9a0')} />
      <mesh position={[PORTE_R, 0.013, RZ1 - 0.55]} rotation={[-Math.PI / 2, 0, 0]} geometry={G.boite} scale={[0.86, 1.05, 0.001]} material={halo('#ffb860', 0.3)} />
      <mesh position={[PORTE_R, 0.014, RZ1 - 0.3]} rotation={[-Math.PI / 2, 0, 0]} geometry={G.boite} scale={[0.86, 0.55, 0.001]} material={halo('#ffc070', 0.25 + ouv * 0.3)} />
      {/* les pieds dans la lumière : le vendeur (deux ombres), puis l'homme */}
      {[0, 1].map((k) => {
        const x = PORTE_R - 0.2 + k * 0.34 + decaleVendeur(t);
        const vu = piedsVendeur(t) > 0.02 && x < PORTE_R + 0.45;
        return (
          <group key={`v${k}`} visible={vu}>
            <mesh position={[x, 0.05, RZ1 - 0.035]} geometry={G.boite} scale={[0.15, 0.1, 0.002]} material={plat('#120e14')} />
            <mesh position={[x - 0.03, 0.016, RZ1 - 0.5]} rotation={[-Math.PI / 2, 0, -0.08]} geometry={G.boite} scale={[0.13, 0.95, 0.001]} material={OMBRE} />
          </group>
        );
      })}
      {[0, 1].map((k) => (
        <group key={`h${k}`} visible={piedsHomme(t) > 0.02}>
          <mesh position={[PORTE_R - 0.12 + k * 0.24, 0.05, RZ1 - 0.036]} geometry={G.boite} scale={[0.16 * piedsHomme(t), 0.1, 0.002]} material={plat('#120e14')} />
          <mesh position={[PORTE_R - 0.12 + k * 0.24, 0.017, RZ1 - 0.55]} rotation={[-Math.PI / 2, 0, 0.05]} geometry={G.boite} scale={[0.15 * piedsHomme(t), 1.05, 0.001]} material={OMBRE} />
        </group>
      ))}
      {/* la porte, charnière à droite, entrouverte au début ; la poignée tournera à la fin */}
      <group position={[px1, 0, RZ1]} rotation={[0, ouv, 0]}>
        <T g={G.boite} c={'#9a7254'} p={[-0.45, 1.1, 0]} s={[0.88, 2.0, 0.05]} />
        <group position={[-0.8, 1.0, -0.05]} rotation={[0, 0, poignee(t)]}>
          <T g={G.boite} c={'#c9c9d2'} p={[0.06, 0, 0]} s={[0.14, 0.025, 0.025]} />
        </group>
        <mesh position={[-0.8, 0.92, -0.03]} geometry={G.boite} scale={[0.012, 0.025, 0.01]} material={plat('#ffcf88')} />
      </group>
      {/* la porte de service, le panneau SORTIE */}
      <group position={[RX0 + 0.045, 0, SORTIE_Z]}>
        <T g={G.boite} c={'#3a4048'} p={[0, 1.04, 0]} s={[0.04, 2.06, 0.92]} />
        <T g={G.boite} c={'#9aa0a8'} p={[0.05, 1.0, 0]} s={[0.04, 0.06, 0.7]} />
        <mesh position={[0.05, 2.3, 0]} rotation={[0, Math.PI / 2, 0]} material={matSortie}><planeGeometry args={[0.6, 0.225]} /></mesh>
        <mesh position={[0.08, 2.3, 0]} geometry={G.sphere} scale={[0.06, 0.16, 0.42]} material={halo('#4aff8a', 0.12)} />
        <mesh position={[0.4, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} geometry={G.disque} scale={[0.6, 0.6, 1]} material={halo('#4aff8a', 0.08)} />
      </group>
      {/* étagère et cartons */}
      <T g={G.boite} c={'#8a8f98'} p={[RX1 - 0.25, 1.3, -0.3]} s={[0.5, 0.04, 2.6]} />
      <T g={G.boite} c={'#8a8f98'} p={[RX1 - 0.25, 1.9, -0.3]} s={[0.5, 0.04, 2.6]} />
      {[-1.5, -0.3, 0.9].map((z) => <T key={z} g={G.boite} c={'#8a8f98'} p={[RX1 - 0.25, 1.2, z]} s={[0.04, 2.4, 0.04]} />)}
      {[[-1.3, 1.32], [-0.6, 1.32], [0.3, 1.32], [-1.0, 1.92], [0.5, 1.92]].map(([z, y], k) => (
        <T key={k} g={G.boite} c={['#d4412e', '#e9e2d4', '#3f8a3a', '#f2c14e', '#2f6fb0'][k]} p={[RX1 - 0.25, y + 0.15, z]} s={[0.3, 0.3, 0.35]} />
      ))}
      {CARTONS.map(([x, y, z, s], k) => (
        <group key={k}>
          <T g={G.boite} c={k % 2 ? '#a8784a' : '#b98a5a'} p={[x, y + s / 2, z]} s={[s, s, s * 0.9]} />
          <mesh position={[x, y + s + 0.001, z]} rotation={[-Math.PI / 2, 0, 0]} geometry={G.boite} scale={[0.08, s * 0.9, 0.001]} material={plat('#d9c39a')} />
        </group>
      ))}
      {/* le frigo coffre, sa lueur bleue */}
      <T g={G.boite} c={'#e4e6ee'} p={[-1.3, 0.45, RZ0 + 0.4]} s={[1.3, 0.9, 0.7]} />
      <mesh position={[-1.3, 0.75, RZ0 + 0.76]} geometry={G.boite} scale={[1.1, 0.04, 0.01]} material={plat('#8fd0ff')} />
      <mesh position={[-1.3, 0.6, RZ0 + 0.9]} geometry={G.sphere} scale={[0.9, 0.5, 0.3]} material={halo('#7fb6ff', 0.12)} />
      {/* seau et balai près de la sortie */}
      <T g={G.cylindre} c={'#d4412e'} p={[RX0 + 0.45, 0.17, SORTIE_Z + 0.75]} s={[0.17, 0.34, 0.17]} />
      <T g={G.cylindre} c={'#8a6a44'} p={[RX0 + 0.5, 0.75, SORTIE_Z + 0.78]} r={[0.15, 0, 0.12]} s={[0.015, 1.4, 0.015]} />
      {/* ampoule éteinte */}
      <T g={G.sphere} c={'#cfcfd8'} p={[0, RH - 0.15, -0.4]} s={[0.06, 0.08, 0.06]} />
    </group>
  );
};

const Scene: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const mains = useRef<THREE.Group>(null);
  const ouv = ouvertureReserve(t);
  return (
    <>
      <color attach="background" args={['#0a0b14']} />
      <ambientLight intensity={1.05} color={'#7a84b8'} />
      <hemisphereLight intensity={0.4} color={'#9aa4d8'} groundColor={'#3a3238'} />
      {/* la lumière du magasin qui passe sous la porte (plus forte tant qu'elle est entrouverte) */}
      <pointLight position={[PORTE_R, 0.25, RZ1 - 0.2]} intensity={0.9 + ouv * 1.6} decay={0} distance={3.6} color={'#ffc880'} />
      <pointLight position={[-1.3, 1.0, RZ0 + 0.9]} intensity={0.55} decay={0} distance={2.4} color={'#7fb0ff'} />
      <pointLight position={[RX0 + 0.3, 2.2, SORTIE_Z]} intensity={0.45} decay={0} distance={2.2} color={'#5aff9a'} />
      <Reserve t={t} />
      <group ref={mains}>
        <Mains t={t} />
      </group>
      <Rendu t={t} mains={mains} />
    </>
  );
};

// ================================================================== calques 2D
const TRAIT = '#1a1020';
const contourTexte = (px: number) => ({WebkitTextStroke: `${px}px ${TRAIT}`, paintOrder: 'stroke fill'} as const);
const Pastille: React.FC<{emoji: string; txt: string; fond: string; echelle?: number}> = ({emoji, txt, fond, echelle = 1}) => (
  <div style={{display: 'inline-flex', alignItems: 'center', gap: 12, background: fond, border: `6px solid ${TRAIT}`, borderRadius: 22, padding: '4px 20px 4px 14px',
    fontSize: 40, color: '#fff', transform: `scale(${echelle})`, transformOrigin: 'left center'}}>
    <span style={{fontSize: 36}}>{emoji}</span><span>{txt}</span>
  </div>
);
const Hud: React.FC = () => {
  const t = useCurrentFrame() / FPS;
  if (t >= S.VOTE || t < S.RECAP_FIN) return null;
  const bas = batterie(t) <= 2;
  const choc = bas ? 1 + 0.12 * Math.max(0, 1 - (t - S.BATTERIE - 0.3) * 2) : 1;
  const clign = bas && Math.floor(t * 2) % 2 === 0 ? 0.55 : 1;
  return (
    <div style={{position: 'absolute', top: 64, left: 50, right: 50, fontFamily: BALOO, fontWeight: 800}}>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
        <div style={{color: '#fffaf1', fontSize: 104, lineHeight: 1, ...contourTexte(14)}}>{heure(t)}</div>
        <div style={{background: '#fffaf1', color: TRAIT, border: `6px solid ${TRAIT}`, borderRadius: 18, padding: '2px 18px', fontSize: 30, marginTop: 14}}>LE SUIVEUR · PARTIE 3</div>
      </div>
      <div style={{display: 'flex', gap: 16, marginTop: 10}}>
        <div style={{opacity: clign}}><Pastille emoji="🔋" txt={`${batterie(t)} %`} fond="#d4412e" echelle={choc} /></div>
        <Pastille emoji="📍" txt={`Chez toi · ${minutesRestantes(t)} min`} fond="#2a2f55" />
      </div>
    </div>
  );
};
// notifications du téléphone, lisibles en 2D (un écran tenu en 3D est illisible : leçon du Dernier Métro)
const CarteNotif: React.FC<{debut: number; fin: number; couleur: string; icone: string; titre: string; texte: string; vocal?: boolean}> = ({debut, fin, couleur, icone, titre, texte, vocal}) => {
  const t = useCurrentFrame() / FPS;
  const {fps} = useVideoConfig();
  if (t < debut || t > fin + 0.45) return null;
  const s = spring({frame: (t - debut) * fps, fps, config: {damping: 13, stiffness: 220}});
  const out = fen(t, fin, fin + 0.45, 0, 1, Easing.in(Easing.cubic));
  const avance = 0;
  return (
    <div style={{position: 'absolute', top: 360, left: 56, right: 56, transform: `translateY(${(1 - s) * -260 - out * 900}px)`, opacity: 1 - out,
      background: '#fffaf1', border: `9px solid ${TRAIT}`, borderRadius: 44, boxShadow: `0 16px 0 ${TRAIT}`, padding: '26px 32px', fontFamily: BALOO, fontWeight: 800}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 26}}>
        <div style={{width: 120, height: 120, borderRadius: 34, background: couleur, border: `6px solid ${TRAIT}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 66, flexShrink: 0}}>{icone}</div>
        <div style={{flex: 1}}>
          <div style={{fontSize: 56, color: TRAIT, lineHeight: 1}}>{titre}</div>
          <div style={{fontSize: 40, color: '#5a4a52', lineHeight: 1.15, marginTop: 6}}>{texte}</div>
        </div>
      </div>
      {vocal ? (
        <div style={{display: 'flex', alignItems: 'center', gap: 18, marginTop: 22}}>
          <div style={{width: 74, height: 74, borderRadius: 37, background: couleur, border: `5px solid ${TRAIT}`, color: '#fff', fontSize: 38, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>▶</div>
          <div style={{flex: 1, display: 'flex', alignItems: 'center', gap: 6, height: 70}}>
            {Array.from({length: 30}, (_, i) => {
              const hh = 14 + Math.abs(Math.sin(i * 1.7) * 40) + Math.abs(Math.sin(i * 0.6) * 12);
              const joue = i / 30 < avance;
              return <div key={i} style={{flex: 1, height: hh * (joue ? 1 + 0.25 * Math.sin(t * 20 + i) : 1), borderRadius: 6, background: joue ? couleur : '#d8ccd0'}} />;
            })}
          </div>
          <div style={{fontSize: 36, color: '#5a4a52'}}>0:04</div>
        </div>
      ) : null}
    </div>
  );
};
const COULEURS: Record<string, string> = {INES: '#ffffff', VENDEUR: '#9fe0ff', VENDEUR_P: '#9fe0ff', HOMME_P: '#ff6b5a'};
const ETIQUETTE: Record<string, string> = {VENDEUR: 'LE VENDEUR · TOUT PRÈS', VENDEUR_P: 'LE VENDEUR · DERRIÈRE LA PORTE', HOMME_P: 'LUI · DERRIÈRE LA PORTE'};
// récap : la dernière image de la partie 1, floutée, avec le choix des abonnés
const Recap: React.FC = () => {
  const t = useCurrentFrame() / FPS;
  const {fps} = useVideoConfig();
  if (t > S.RECAP_FIN + 0.5) return null;
  const s = spring({frame: t * fps, fps, config: {damping: 12, stiffness: 200}});
  const out = fen(t, S.RECAP_FIN, S.RECAP_FIN + 0.5);
  return (
    <AbsoluteFill style={{opacity: 1 - out, fontFamily: BALOO, fontWeight: 800}}>
      <Img src={staticFile('rentree/p2_fin.jpg')} style={{width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(10px) brightness(0.55)'}} />
      <div style={{position: 'absolute', top: 560, left: 70, right: 70, textAlign: 'center', transform: `scale(${0.7 + 0.3 * s})`}}>
        <div style={{display: 'inline-block', background: '#fffaf1', color: TRAIT, border: `7px solid ${TRAIT}`, borderRadius: 22, padding: '4px 26px', fontSize: 44}}>LE SUIVEUR · PARTIE 3</div>
        <div style={{color: '#fff', fontSize: 70, marginTop: 40, ...contourTexte(12)}}>Vous avez choisi</div>
        <div style={{marginTop: 24, background: '#fffaf1', border: `8px solid ${TRAIT}`, borderRadius: 40, boxShadow: `0 16px 0 ${TRAIT}`, padding: '24px 30px',
          display: 'flex', alignItems: 'center', gap: 26, textAlign: 'left'}}>
          <div style={{width: 110, height: 110, borderRadius: 55, background: TRAIT, color: '#fffaf1', fontSize: 84, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0}}>B</div>
          <div style={{fontSize: 58, color: TRAIT, lineHeight: 1.02}}>Je me cache dans l'arrière-boutique</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
const SousTitres: React.FC = () => {
  const t = useCurrentFrame() / FPS;
  const {fps} = useVideoConfig();
  if (t >= S.VOTE) return null;
  const l = LIGNES.find((x) => t >= x.debut && t < x.fin + 0.15);
  if (!l) return null;
  const u = t - l.debut;
  let i = l.mots.findIndex((m, k) => u >= m.a && (k === l.mots.length - 1 || u < l.mots[k + 1].a));
  if (i < 0) i = 0;
  const m = l.mots[i];
  const s = spring({frame: Math.max(0, (u - m.a) * fps), fps, config: {damping: 11, stiffness: 300}});
  const etq = ETIQUETTE[l.perso];
  return (
    <div style={{position: 'absolute', top: 1180 - 330 * poidsTel(t), width: '100%', textAlign: 'center', fontFamily: BALOO, fontWeight: 800}}>
      {etq ? <div style={{display: 'inline-block', background: TRAIT, color: COULEURS[l.perso], borderRadius: 18, padding: '6px 22px', fontSize: 34, marginBottom: 14}}>{etq}</div> : null}
      <div style={{fontSize: etq ? 100 : 118, color: COULEURS[l.perso], transform: `scale(${0.55 + 0.45 * s})`, ...contourTexte(15), textShadow: `0 10px 0 ${TRAIT}`, lineHeight: 1}}>
        {m.t.replace(/[.,]$/, '')}
      </div>
    </div>
  );
};
const Vote: React.FC = () => {
  const t = useCurrentFrame() / FPS;
  const {fps} = useVideoConfig();
  if (t < S.VOTE) return null;
  const k = (d: number) => spring({frame: (t - S.VOTE - d) * fps, fps, config: {damping: 13, stiffness: 150}});
  const carte = (lettre: string, txt: string, fond: string, kk: number, sens: number) => (
    <div style={{transform: `translateX(${(1 - kk) * 700 * sens}px) rotate(${(1 - kk) * 8 * sens}deg)`, background: fond, border: `8px solid ${TRAIT}`,
      borderRadius: 40, boxShadow: `0 16px 0 ${TRAIT}`, padding: '26px 34px', display: 'flex', alignItems: 'center', gap: 28}}>
      <div style={{width: 116, height: 116, borderRadius: 58, background: TRAIT, color: fond, fontSize: 88, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0}}>{lettre}</div>
      <div style={{fontSize: 62, lineHeight: 1.02, color: TRAIT}}>{txt}</div>
    </div>
  );
  const pulse = 1 + 0.03 * Math.sin((t - S.VOTE) * 6);
  const notif = k(4.2);
  return (
    <AbsoluteFill style={{background: 'rgba(6,6,16,0.6)', fontFamily: BALOO, fontWeight: 800, padding: '250px 64px 0', display: 'flex', flexDirection: 'column', gap: 36}}>
      {/* la signature de la chaîne : le SMS de Jade tombe pendant que tu choisis */}
      <div style={{position: 'absolute', top: 40, left: 56, right: 56, transform: `translateY(${(1 - notif) * -300}px)`, background: '#fffaf1', border: `7px solid ${TRAIT}`,
        borderRadius: 34, padding: '16px 26px', display: 'flex', alignItems: 'center', gap: 22, boxShadow: `0 10px 0 ${TRAIT}`}}>
        <div style={{width: 84, height: 84, borderRadius: 42, background: '#e88aa6', border: `5px solid ${TRAIT}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 46, color: '#fff'}}>J</div>
        <div><div style={{fontSize: 36, color: '#5a4a52', lineHeight: 1}}>Jade 💛 · maintenant</div><div style={{fontSize: 52, color: TRAIT, lineHeight: 1.1}}>T'es bien rentrée ?</div></div>
      </div>
      <div style={{fontSize: 92, lineHeight: 1.0, color: '#fff', textAlign: 'center', ...contourTexte(14), textShadow: `0 10px 0 ${TRAIT}`,
        transform: `scale(${(0.6 + 0.4 * k(0.15)) * pulse})`}}>Tu écris au 114, ou tu sors par la ruelle&nbsp;?</div>
      <div style={{display: 'flex', flexDirection: 'column', gap: 30, marginTop: 20}}>
        {carte('A', "J'envoie un SMS au 114", '#ffd23f', k(0.7), -1)}
        {carte('B', 'Je sors par la porte de service', '#fffaf1', k(1.1), 1)}
      </div>
      <div style={{textAlign: 'center', color: '#fff', fontSize: 56, marginTop: 20, opacity: k(1.8), ...contourTexte(10)}}>Écris A ou B en commentaire</div>
      <div style={{textAlign: 'center', color: '#ffd27a', fontSize: 44, opacity: k(2.3)}}>La fin (partie 4) suivra vos votes</div>
      <div style={{alignSelf: 'center', marginTop: 24, display: 'flex', alignItems: 'center', gap: 26, transform: `translateY(${(1 - k(3.0)) * 500}px) scale(${1 + 0.04 * Math.max(0, Math.sin((t - S.VOTE - 3.4) * 7))})`}}>
        <Img src={staticFile('rentree/avatar.png')} style={{width: 150, height: 150, borderRadius: 75, border: `7px solid ${TRAIT}`, boxShadow: `0 10px 0 ${TRAIT}`}} />
        <div style={{display: 'flex', flexDirection: 'column', gap: 10}}>
          <div style={{background: '#fe2c55', color: '#fff', borderRadius: 26, padding: '10px 34px', fontSize: 58, border: `7px solid ${TRAIT}`, boxShadow: `0 10px 0 ${TRAIT}`}}>+ Abonne-toi</div>
          <div style={{color: '#fff', fontSize: 40, ...contourTexte(8)}}>pour voir la suite</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ================================================================== son (bruitages synthétisés de Tu Fais Quoi, réutilisés)
const fr = (s: number) => Math.round(s * FPS);
const Son: React.FC<{a: number; src: string; v?: number; d?: number; boucle?: boolean; fondu?: [number, number]; vitesse?: number}> = ({a, src, v = 1, d, boucle, fondu, vitesse}) => (
  <Sequence from={fr(a)} durationInFrames={d ? fr(d) : undefined} layout="none">
    <Audio src={staticFile(`metro/sons/${src}.wav`)} loop={boucle} playbackRate={vitesse}
      volume={(f) => {
        if (!fondu) return v;
        const tt = f / FPS;
        const dd = d ?? 999;
        return v * Math.min(1, tt / Math.max(0.01, fondu[0])) * Math.max(0, Math.min(1, (dd - tt) / Math.max(0.01, fondu[1])));
      }} />
  </Sequence>
);
const BandeSon: React.FC = () => (
  <>
    {LIGNES.map((l) => (
      <Sequence key={l.id} from={fr(l.debut)} layout="none">
        <Audio src={staticFile(l.fichier)} />
      </Sequence>
    ))}
    <Son a={0} src="impact" v={0.5} />
    <Son a={S.FERME + 0.7} src="porte" v={0.45} />
    <Son a={S.CLOCHETTE} src="ding" v={0.3} />
    {/* le ronronnement du frigo, tout du long */}
    <Son a={0.3} src="drone" v={0.16} d={S.VOTE - 0.3} boucle fondu={[1.0, 0.3]} vitesse={0.8} />
    {[L.L04 - 0.2, 15.6, 17.4, L.L05 - 0.3, S.VENDEUR_DEVANT - 0.5, L.L09 - 0.2, L.L11 - 0.4].map((a) => <Son key={a} a={a} src="whoosh" v={0.14} />)}
    <Son a={S.BATTERIE} src="vibre" v={0.4} />
    <Son a={S.BATTERIE + 0.05} src="alerte" v={0.12} d={0.6} />
    <Son a={S.VENDEUR_DEVANT - 0.3} src="pas" v={0.14} d={0.8} fondu={[0.1, 0.2]} />
    <Son a={L.L05 + 1.0} src="battement" v={0.4} d={S.VOTE - L.L05 - 1.0} boucle fondu={[1.5, 0.05]} />
    <Son a={S.VENDEUR_PART} src="pas" v={0.16} d={1.0} fondu={[0.1, 0.4]} />
    <Son a={S.POIGNEE - 0.7} src="pas" v={0.2} d={0.7} fondu={[0.1, 0.1]} vitesse={0.9} />
    <Son a={S.POIGNEE} src="clic" v={0.6} />
    <Son a={S.POIGNEE + 0.05} src="impact" v={0.75} />
    <Son a={S.POIGNEE + 0.5} src="porte" v={0.4} />
    <Son a={S.VOTE - 2.2} src="montee" v={0.28} />
    <Son a={S.VOTE} src="impact" v={0.75} />
    <Son a={S.VOTE + 0.7} src="pop" v={0.45} />
    <Son a={S.VOTE + 1.1} src="pop" v={0.45} />
    <Son a={S.VOTE + 3.05} src="pop" v={0.6} />
    <Son a={S.VOTE + 4.2} src="vibre" v={0.5} />
    <Son a={S.VOTE + 0.2} src="drone" v={0.16} d={T_FIN - S.VOTE - 0.2} fondu={[0.5, 1.2]} />
  </>
);

export const SuiveurP3: React.FC = () => {
  const {width, height} = useVideoConfig();
  const t = useCurrentFrame() / FPS;
  const flouVote = fen(t, S.VOTE, S.VOTE + 0.4, 0, 9);
  return (
    <AbsoluteFill style={{backgroundColor: C.coin}}>
      <AbsoluteFill style={{filter: flouVote > 0 ? `blur(${flouVote}px)` : undefined}}>
        <ThreeCanvas width={width} height={height} gl={{antialias: true, toneMapping: THREE.NoToneMapping}} flat camera={{fov: 108, near: 0.02, far: 95}}>
          <Scene />
        </ThreeCanvas>
      </AbsoluteFill>
      <Hud />
      <CarteNotif debut={S.BATTERIE} fin={S.BATTERIE_FIN} couleur="#d4412e" icone="🪫" titre="Batterie faible" texte="2 % restants. Le téléphone va s'éteindre." />
      <SousTitres />
      <Recap />
      <Vote />
      <BandeSon />
    </AbsoluteFill>
  );
};
