// @ts-nocheck — scène 3D écrite en JSX three (types R3F trop verbeux pour un épisode).
import {loadFont as chargerBaloo} from '@remotion/google-fonts/Baloo2';
import {noise2D} from '@remotion/noise';
import {ThreeCanvas} from '@remotion/three';
import {useFrame, useThree} from '@react-three/fiber';
import React, {useMemo, useRef} from 'react';
import {AbsoluteFill, Audio, Easing, Img, interpolate, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import * as THREE from 'three';
import {mergeVertices} from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import voix from './s01p1_voix.json';

/**
 * T'ES BIEN RENTRÉE ? — Série 1 « Le Suiveur », partie 1.
 * 2 h 14, le VTC annule, 12 % de batterie, 9 min à pied. Inès (toi, en POV) remarque l'homme en capuche,
 * traverse pour vérifier… il traverse aussi. Choix : entrer dans le kebab encore ouvert, ou rechanger de trottoir.
 * Moteur repris de « La Traque » (Tu Fais Quoi ?), passé de nuit. Tout est fonction du temps t (secondes).
 */
const FPS = 30;
const T_FIN = 62.0;
export const DUREE_SUIVEUR_P1 = Math.round(T_FIN * FPS);
const {fontFamily: BALOO} = chargerBaloo('normal', {weights: ['700', '800'], subsets: ['latin']});

// ================================================================== chronologie (s)
const L: Record<string, number> = {
  L01: 0.4, L02: 6.3, L03: 10.2, L04: 16.3, L05: 20.9, L06: 28.3, L07: 31.8, L08: 34.6, L09: 38.0, L10: 42.6, L11: 46.4,
};
const S = {
  NOTIF_FIN: 5.8, MARCHE: 1.5, VOCAL: 9.9, VOCAL_FIN: 14.1, TRAVERSE: 22.0, TRAVERSE_FIN: 26.8, IL_TRAVERSE: 25.6, IL_TRAVERSE_FIN: 29.4,
  ACCELERE: 32.4, BATTERIE: 37.7, BATTERIE_FIN: 41.5, ARRET: 50.0, VOTE: 53.0,
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

// HUD : l'heure avance de 5 min sur l'épisode, la distance baisse, la batterie tombe à 8 %
const heure = (t: number) => {
  const m = 14 + Math.floor(fen(t, 0, S.VOTE, 0, 5.4));
  return `02:${String(m).padStart(2, '0')}`;
};
const minutesRestantes = (t: number) => (t < 14 ? 9 : t < 24 ? 8 : t < 31 ? 7 : t < S.BATTERIE + 0.3 ? 6 : 5);
const batterie = (t: number) => (t < S.BATTERIE + 0.3 ? 12 : 8);

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
export const Perso: React.FC<any> = ({p, rotY = 0, marche = 0, phase = 0, torse = 0, tete = [0, 0], brasD = [0, 0.08, 0], brasG = [0, 0.08, 0],
  bouche = 0, cligne: cl = 1, regard = [0, 0], sourire = 0, sourcils = 0, style, visible = true, telMain}) => {
  const hanche = 0.86;
  const pas = Math.sin(phase);
  const jambe = (k: number) => ({h: marche * k * pas * 0.5, g: marche * Math.max(0, -k * pas) * 0.8});
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

// ================================================================== la marche (vers -x), elle accélère après « Tu vas où ? »
/** Distance parcourue à vitesse 1 entre a et b, avec rampes linéaires de r secondes au départ et à l'arrêt. */
const rampe = (t: number, a: number, b: number, r = 0.8) => {
  const u = t - a, l = b - a, tot = l - r;
  if (u <= 0) return 0;
  if (u < r) return (u * u) / (2 * r);
  if (u < l - r) return r / 2 + (u - r);
  if (u < l) return tot - ((l - u) * (l - u)) / (2 * r);
  return tot;
};
const marcheX = (t: number) => -(1.1 * rampe(t, S.MARCHE, S.ARRET) + 0.4 * rampe(t, S.ACCELERE, S.ARRET));
const marcheZ = (t: number) => fen(t, S.TRAVERSE, S.TRAVERSE_FIN, 0, 9.2, Easing.inOut(Easing.sin));
const enMarche = (t: number) => t > S.MARCHE + 0.3 && t < S.ARRET - 0.3;
const cadence = (t: number) => (t > S.ACCELERE ? 6.6 : 5.6);

// ================================================================== le suiveur : derrière toi (+x), il se rapproche puis s'arrête sous un lampadaire
const ecartHomme = (t: number) => interpolate(t, [0, 15, 28, 34, S.ARRET, S.ARRET + 1.6], [11, 9.5, 8.2, 6.6, 5.6, 5.0], clamp);
const hommeP = (t: number): V3 => [marcheX(t) + ecartHomme(t), 0, 0.45 + fen(t, S.IL_TRAVERSE, S.IL_TRAVERSE_FIN, 0, 8.9, Easing.inOut(Easing.sin))];
const hommeMarche = (t: number) => (t > S.MARCHE + 0.3 && t < S.ARRET + 1.5 ? 1 : 0);

// ================================================================== caméra subjective
const OEIL = 1.6;
const camBase = (t: number): V3 => [marcheX(t), OEIL, marcheZ(t)];
const rel = (t: number, d: V3): V3 => {
  const c = camBase(t);
  return [c[0] + d[0], c[1] + d[1], c[2] + d[2]];
};
const KEBAB_X = -61.0;
const CIBLES: Record<string, (t: number) => V3> = {
  TEL: (t) => rel(t, [-0.75, -0.42, -0.06]),
  AVANT: (t) => rel(t, [-10, -0.15, 0.4 - marcheZ(t) * 0.04]),
  HOMME: (t) => {
    const h = hommeP(t);
    return [h[0], 1.55, h[2]];
  },
  TRAVERSE: (t) => [marcheX(t) - 5.5, 1.1, 9.6],
  RETOUR: (t) => [marcheX(t) - 5, 1.2, -0.5],
  KEBAB: () => [KEBAB_X, 1.6, 10.8],
};
const CLES: [number, string, number][] = [
  [0, 'TEL', 0], [5.6, 'AVANT', 0.6], [S.VOCAL - 0.1, 'TEL', 0.45], [S.VOCAL_FIN, 'AVANT', 0.5], [15.5, 'HOMME', 0.75],
  [20.3, 'AVANT', 0.55], [21.6, 'TRAVERSE', 0.7], [27.5, 'HOMME', 0.7], [30.9, 'AVANT', 0.45],
  [S.BATTERIE - 0.1, 'TEL', 0.4], [S.BATTERIE_FIN - 0.4, 'AVANT', 0.5], [42.2, 'KEBAB', 0.7], [46.2, 'RETOUR', 0.7], [50.0, 'HOMME', 0.7],
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
  const pas = enMarche(t) ? 1 : 0;
  const b = camBase(t);
  const cad = cadence(t);
  const sursaut = fen(t, L.L07, L.L07 + 0.12) * (1 - fen(t, L.L07 + 0.12, L.L07 + 0.9)); // « Hé… » : on sursaute
  const pos: V3 = [b[0] + noise2D('px', t * 0.6, 0) * 0.01, b[1] + pas * Math.abs(Math.sin(t * cad)) * 0.035 + sursaut * 0.03, b[2] + pas * Math.sin(t * cad / 2) * 0.02];
  const c = cibleA(t);
  const tremble = 0.03 + (t > L.L04 ? 0.025 : 0) + (t > L.L07 ? 0.02 : 0);
  const cible: V3 = [c[0] + noise2D('cx', t * 1.1, 0) * tremble, c[1] + noise2D('cy', t * 1.1, 1) * tremble + sursaut * 0.08, c[2] + noise2D('cz', t * 1.1, 2) * tremble];
  const roulis = noise2D('r', t * 0.8, 2) * 0.025 + pas * Math.sin(t * cad / 2) * 0.01;
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
  return out;
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
  const matV = useTexMat('vitrine', vitrineKebab);
  const matE = useTexMat('enseigne', enseigneKebab);
  const neon = Math.sin(t * 23) > 0.93 ? 0.96 : 1;
  return (
    <group position={[KEBAB_X, 0, 10.74]} rotation={[0, Math.PI, 0]}>
      <mesh position={[0, 1.3, 0]} material={matV}><planeGeometry args={[4.2, 2.36]} /></mesh>
      <T g={G.boite} c={'#2a1e26'} p={[0, 1.3, 0.04]} s={[4.4, 0.12, 0.08]} />
      <group position={[0, 2.95, 0.02]} scale={neon}>
        <mesh material={matE}><planeGeometry args={[3.4, 0.85]} /></mesh>
      </group>
      <mesh position={[0, 0.03, 1.6]} rotation={[-Math.PI / 2, 0, 0]} geometry={G.disque} scale={[3.2, 2.0, 1]} material={halo('#ffd27a', 0.3)} />
      <mesh position={[0, 1.3, 0.3]} geometry={G.sphere} scale={[2.6, 1.6, 0.4]} material={halo('#ffcf7a', 0.12)} />
    </group>
  );
};

const Ville: React.FC<{t: number}> = ({t}) => (
  <group>
    <mesh position={[marcheX(t), 0, 4]} geometry={G.sphere} scale={[85, 85, 85]} material={matCiel} renderOrder={-1} />
    <mesh position={[marcheX(t) - 40, 30, -30]} geometry={G.sphere} scale={2.2} material={plat('#f3efd8')} />
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
  </group>
);

// ================================================================== le téléphone d'Inès (écran simple : le détail lisible est en calque 2D)
const ecranTel = (etat: string) => {
  const cv = document.createElement('canvas');
  cv.width = 380; cv.height = 780;
  const g = cv.getContext('2d')!;
  const f = g.createLinearGradient(0, 0, 0, 780);
  f.addColorStop(0, '#3a3270'); f.addColorStop(1, '#b4507a');
  g.fillStyle = f; g.fillRect(0, 0, 380, 780);
  g.fillStyle = '#fff'; g.textAlign = 'center'; g.font = '800 96px sans-serif'; g.fillText(etat === 'bat' ? '02:18' : '02:14', 190, 210);
  g.fillStyle = 'rgba(255,255,255,0.92)'; g.beginPath(); g.roundRect(26, 300, 328, 130, 30); g.fill();
  g.fillStyle = etat === 'bat' ? '#d4412e' : etat === 'jade' ? '#e88aa6' : '#222';
  g.beginPath(); g.arc(78, 365, 30, 0, 7); g.fill();
  g.fillStyle = '#222'; g.textAlign = 'left'; g.font = '800 30px sans-serif';
  g.fillText(etat === 'bat' ? 'Batterie faible' : etat === 'jade' ? 'Jade' : 'Course annulée', 124, 356);
  g.font = '600 24px sans-serif'; g.fillText(etat === 'bat' ? '8 % restants' : etat === 'jade' ? 'Message vocal' : 'Chauffeur indisponible', 124, 392);
  const tx = new THREE.CanvasTexture(cv); tx.colorSpace = THREE.SRGBColorSpace; return tx;
};
const Telephone: React.FC<{mat: THREE.Material}> = ({mat}) => (
  <group>
    <T g={G.boite} c={'#f2d4dc'} s={[0.074, 0.152, 0.01]} />
    <mesh position={[0, 0, 0.0052]} material={mat}><planeGeometry args={[0.065, 0.142]} /></mesh>
  </group>
);
const Mains: React.FC<{t: number}> = ({t}) => {
  const etat = t < S.VOCAL - 0.3 ? 'vtc' : t < S.BATTERIE - 0.3 ? 'jade' : 'bat';
  const mat = useTexMat(etat, () => ecranTel(etat));
  const leve = poidsTel(t);
  const sonne = (t < 1.2 || (t >= S.VOCAL && t < S.VOCAL + 0.5)) ? Math.sin(t * 190) * 0.003 : 0;
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
  const peur = fen(t, L.L04, L.L04 + 2) * 0.5 + fen(t, L.L07, L.L07 + 1) * 0.5;
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

// ================================================================== scène
export const STYLE_HOMME: Style = {peau: '#d9a27a', haut: '#4a4e5e', bas: '#2a2d38', chaussures: '#e8e8e8', cheveux: '#1d1410', coiffure: 'court', capucheTete: true};
const STYLE_PASSANT: Style = {peau: '#c98a5a', haut: '#4a3a5e', bas: '#1f2430', chaussures: '#f2f2f2', cheveux: '#1d1410', coiffure: 'court'};

const Scene: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const mains = useRef<THREE.Group>(null);
  const cam = poseCam(t).pos;
  const h = hommeP(t);
  const rotH = Math.atan2(cam[0] - h[0], cam[2] - h[2]);
  const fixe = t > 27; // tête baissée au début ; après sa traversée, il te fixe
  return (
    <>
      <color attach="background" args={['#060818']} />
      <ambientLight intensity={1.35} color={'#9aa6e6'} />
      <hemisphereLight intensity={0.6} color={'#b4c0ff'} groundColor={'#4a3a40'} />
      <directionalLight position={[-20, 25, -10]} intensity={0.55} color={'#b9c4ff'} />
      <directionalLight position={[10, 6, 6]} intensity={0.35} color={'#ffb070'} />
      <Ville t={t} />

      {/* le suiveur */}
      <Perso p={h} rotY={rotH} style={STYLE_HOMME} marche={hommeMarche(t)} phase={t * (t > S.ACCELERE ? 6.6 : 5.6)}
        tete={fixe ? viser([h[0], 1.66, h[2]], cam, rotH) : [0, 0.35]} bouche={parle(['HOMME'], t)} cligne={cligne(t, 2)}
        brasD={[-0.05, 0.08, -0.25]} brasG={[-0.05, 0.08, -0.25]} />
      <mesh position={[h[0], 0.03, h[2]]} rotation={[-Math.PI / 2, 0, 0]} geometry={G.disque} scale={1.1} material={halo('#ffb070', 0.16)} />

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
  if (t >= S.VOTE) return null;
  const bas = batterie(t) <= 8;
  const choc = bas ? 1 + 0.12 * Math.max(0, 1 - (t - S.BATTERIE - 0.3) * 2) : 1;
  const clign = bas && Math.floor(t * 2) % 2 === 0 ? 0.55 : 1;
  return (
    <div style={{position: 'absolute', top: 64, left: 50, right: 50, fontFamily: BALOO, fontWeight: 800}}>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
        <div style={{color: '#fffaf1', fontSize: 104, lineHeight: 1, ...contourTexte(14)}}>{heure(t)}</div>
        <div style={{background: '#fffaf1', color: TRAIT, border: `6px solid ${TRAIT}`, borderRadius: 18, padding: '2px 18px', fontSize: 30, marginTop: 14}}>LE SUIVEUR · PARTIE 1</div>
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
  const avance = vocal ? fen(t, L.L03, L.L03 + 3.57) : 0;
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
const COULEURS: Record<string, string> = {INES: '#ffffff', JADE: '#ff9fbf', HOMME: '#ff6b5a'};
const ETIQUETTE: Record<string, string> = {JADE: 'JADE · MESSAGE VOCAL', HOMME: 'DERRIÈRE TOI'};
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
        transform: `scale(${(0.6 + 0.4 * k(0.15)) * pulse})`}}>Tu entres dans le kebab, ou tu changes de trottoir&nbsp;?</div>
      <div style={{display: 'flex', flexDirection: 'column', gap: 30, marginTop: 20}}>
        {carte('A', "J'entre dans le kebab", '#ffd23f', k(0.7), -1)}
        {carte('B', 'Je change de trottoir', '#fffaf1', k(1.1), 1)}
      </div>
      <div style={{textAlign: 'center', color: '#fff', fontSize: 56, marginTop: 20, opacity: k(1.8), ...contourTexte(10)}}>Écris A ou B en commentaire</div>
      <div style={{textAlign: 'center', color: '#ffd27a', fontSize: 44, opacity: k(2.3)}}>La partie 2 suivra vos votes</div>
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
    <Son a={0} src="vibre" v={0.6} />
    <Son a={0.05} src="ding" v={0.35} />
    <Son a={0} src="vent" v={0.16} d={S.VOTE} boucle fondu={[0.5, 1.0]} />
    <Son a={S.MARCHE} src="pas" v={0.3} d={S.ACCELERE - S.MARCHE} boucle fondu={[0.3, 0.3]} />
    <Son a={S.ACCELERE} src="pas" v={0.36} d={S.ARRET - S.ACCELERE} boucle fondu={[0.3, 0.4]} vitesse={1.2} />
    {/* ses pas à lui, plus loin derrière : on ne les entend qu'une fois qu'on l'a repéré */}
    <Son a={16.0} src="pas" v={0.12} d={S.ARRET + 1.4 - 16.0} boucle fondu={[1.5, 0.3]} vitesse={0.93} />
    {[5.6, 15.5, 20.3, 21.6, 27.5, 42.2, 46.2, 50.0].map((a) => <Son key={a} a={a} src="whoosh" v={0.2} />)}
    <Son a={S.VOCAL} src="vibre" v={0.55} />
    <Son a={L.L04 - 0.3} src="impact" v={0.45} />
    <Son a={L.L07 - 0.05} src="impact" v={0.85} />
    <Son a={S.BATTERIE} src="alerte" v={0.18} d={0.7} />
    <Son a={1.0} src="drone" v={0.2} d={L.L07 - 1.0} boucle fondu={[2.0, 0.3]} />
    <Son a={L.L07 + 0.4} src="battement" v={0.5} d={S.VOTE - L.L07 - 0.4} boucle fondu={[0.8, 0.05]} />
    <Son a={S.VOTE - 2.4} src="montee" v={0.3} />
    <Son a={S.VOTE} src="impact" v={0.75} />
    <Son a={S.VOTE + 0.7} src="pop" v={0.45} />
    <Son a={S.VOTE + 1.1} src="pop" v={0.45} />
    <Son a={S.VOTE + 3.05} src="pop" v={0.6} />
    <Son a={S.VOTE + 4.2} src="vibre" v={0.5} />
    <Son a={S.VOTE + 0.2} src="drone" v={0.16} d={T_FIN - S.VOTE - 0.2} fondu={[0.5, 1.2]} />
  </>
);

export const SuiveurP1: React.FC = () => {
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
      <CarteNotif debut={0} fin={S.NOTIF_FIN} couleur="#2a2f55" icone="🚗" titre="Course annulée" texte="Ton chauffeur a annulé. Aucun véhicule disponible." />
      <CarteNotif debut={S.VOCAL} fin={S.VOCAL_FIN} couleur="#e88aa6" icone="💛" titre="Jade" texte="Message vocal" vocal />
      <CarteNotif debut={S.BATTERIE} fin={S.BATTERIE_FIN} couleur="#d4412e" icone="🪫" titre="Batterie faible" texte="8 % restants. Activer le mode économie ?" />
      <SousTitres />
      <Vote />
      <BandeSon />
    </AbsoluteFill>
  );
};
