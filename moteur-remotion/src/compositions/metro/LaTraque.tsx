// @ts-nocheck — scène 3D écrite en JSX three (types R3F trop verbeux pour un épisode).
import {loadFont as chargerBaloo} from '@remotion/google-fonts/Baloo2';
import {noise2D} from '@remotion/noise';
import {ThreeCanvas} from '@remotion/three';
import {useFrame, useThree} from '@react-three/fiber';
import React, {useMemo, useRef} from 'react';
import {AbsoluteFill, Audio, Easing, Img, interpolate, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import * as THREE from 'three';
import {mergeVertices} from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import voix from './traque01_voix.json';

/**
 * TU FAIS QUOI ? — « La Traque » : épisode AUTONOME, en ville, au crépuscule.
 * 18:57 : ta photo s'affiche sur tous les téléphones. « À 19 h, la traque commence. Un million pour cette personne. »
 * Tu marches dans la rue pendant que les passants lèvent les yeux de leur écran… et te regardent. Choix à 19:00:00.
 * Tout est fonction du temps t (secondes) : aucune animation n'a d'état propre.
 */
const FPS = 30;
const T_FIN = 62.0;
export const DUREE_TRAQUE_01 = Math.round(T_FIN * FPS);
const {fontFamily: BALOO} = chargerBaloo('normal', {weights: ['700', '800'], subsets: ['latin']});

// ================================================================== chronologie (s)
const L: Record<string, number> = {
  L01: 0.5, L02: 7.8, L03: 11.6, L04: 16.0, L05: 20.3, L06: 23.2, L07: 28.0, L08: 31.4,
  L09: 35.2, L10: 41.4, L11: 44.6, L12: 49.4,
};
const S = {
  ALARME_FIN: 7.0, CARTE_FIN: 7.4, MARCHE: 9.0, APPEL: 15.0, DECROCHE: 15.6, COUPE: 26.6, ARRET: 26.6,
  FENETRES: 26.9, PORTE_VOISINE: 34.8, TICS: 41.0, REGARDS: 47.8, TRAQUE: 51.0, VOTE: 53.0,
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
const sortie = Easing.out(Easing.cubic);
type V3 = [number, number, number];
const mixv = (a: number[], b: number[], k: number) => a.map((x, i) => x + (b[i] - x) * k) as V3;

// horloge : 18:57:00 → 18:59:50 en accéléré, puis les 10 dernières secondes en temps réel
const horloge = (t: number) => (t < S.TICS ? (170 * t) / S.TICS : Math.min(180, 170 + (t - S.TICS)));
const hh = (t: number) => {
  const s = Math.floor(horloge(t)), tot = 18 * 3600 + 57 * 60 + s;
  const p = (x: number) => String(x).padStart(2, '0');
  return `${p(Math.floor(tot / 3600))}:${p(Math.floor(tot / 60) % 60)}:${p(tot % 60)}`;
};
const reste = (t: number) => {
  const r = Math.max(0, 180 - Math.floor(horloge(t)));
  return `${Math.floor(r / 60)}:${String(r % 60).padStart(2, '0')}`;
};

// ================================================================== palette chaude
const C = {
  mur: '#f7ecd6', murBas: '#e6cfa6', plafond: '#fdf6e8', sol: '#c2ae96', siege: '#3f93a0', siegeDos: '#2f7884',
  barre: '#f5c04a', tunnel: '#4a3328', ballast: '#5d4a3e', rail: '#9aa0a6', lampe: '#ffd27a', porte: '#9fb3b5', vitre: '#2b3a40',
  peau: '#f1b98c', peau2: '#c98a5a', peau3: '#8d5a3b', manche: '#2c3b6b', tel: '#1c1c22',
  contour: '#24150f', coin: '#1e2140', rouge: '#d4412e',
};

// ================================================================== toon
const gradient = (() => {
  const t = new THREE.DataTexture(new Uint8Array([178, 222, 255]), 3, 1, THREE.RedFormat);
  t.minFilter = t.magFilter = THREE.NearestFilter;
  t.needsUpdate = true;
  return t;
})();
const cacheToon = new Map<string, THREE.Material>();
const toon = (c: string) => {
  if (!cacheToon.has(c)) cacheToon.set(c, new THREE.MeshToonMaterial({color: c, gradientMap: gradient}));
  return cacheToon.get(c)!;
};
const cacheBasic = new Map<string, THREE.Material>();
const plat = (c: string) => {
  if (!cacheBasic.has(c)) cacheBasic.set(c, new THREE.MeshBasicMaterial({color: c, toneMapped: false}));
  return cacheBasic.get(c)!;
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
const G = {
  boite: new THREE.BoxGeometry(1, 1, 1),
  sphere: new THREE.SphereGeometry(1, 28, 20),
  demi: new THREE.SphereGeometry(1, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2),
  capsule: new THREE.CapsuleGeometry(1, 1, 6, 16),
  cylindre: new THREE.CylinderGeometry(1, 1, 1, 18),
  tore: new THREE.TorusGeometry(1, 0.28, 10, 24, Math.PI),
};
const T: React.FC<any> = ({g, c, p = [0, 0, 0], s = [1, 1, 1], r = [0, 0, 0], contour = true, mat, visible = true}) => (
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

// ================================================================== personnage toon générique
type Style = {peau: string; haut: string; bas: string; chaussures: string; cheveux: string; coiffure: 'chignon' | 'court' | 'capuche';
  costume?: boolean; casque?: boolean; manteau?: boolean};
const Perso: React.FC<any> = ({p, rotY = 0, assis = 0, marche = 0, phase = 0, torse = 0, tete = [0, 0], brasD = [0, 0.08, 0], brasG = [0, 0.08, 0],
  bouche = 0, cligne: cl = 1, regard = [0, 0], sourire = 0, style, visible = true, telMain}) => {
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
          {style.manteau ? <T g={G.capsule} c={style.haut} p={[0, 0.06, 0.01]} s={[0.21, 0.12, 0.16]} /> : null}
          {style.costume ? (
            <>
              <Boite c={'#f4f1ea'} p={[0, 0.43, 0.125]} s={[0.1, 0.16, 0.02]} contour={false} />
              <Boite c={C.rouge} p={[0, 0.39, 0.138]} s={[0.035, 0.17, 0.01]} contour={false} />
            </>
          ) : null}
          {style.coiffure === 'capuche' ? <T g={G.sphere} c={style.haut} p={[0, 0.55, -0.11]} s={[0.15, 0.09, 0.08]} /> : null}
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
            {style.coiffure === 'chignon' ? (
              <>
                <T g={G.demi} c={style.cheveux} p={[0, 0.17, -0.01]} s={[0.158, 0.15, 0.155]} />
                <T g={G.sphere} c={style.cheveux} p={[0, 0.33, -0.06]} s={[0.075, 0.068, 0.075]} />
                <T g={G.sphere} c={style.cheveux} p={[-0.125, 0.1, -0.03]} s={[0.045, 0.11, 0.08]} />
                <T g={G.sphere} c={style.cheveux} p={[0.125, 0.1, -0.03]} s={[0.045, 0.11, 0.08]} />
                <T g={G.sphere} c={style.cheveux} p={[0.03, 0.25, 0.11]} r={[0, 0, 0.6]} s={[0.1, 0.035, 0.04]} />
              </>
            ) : null}
            {style.coiffure === 'court' ? (
              <>
                <T g={G.demi} c={style.cheveux} p={[0, 0.2, -0.015]} s={[0.155, 0.12, 0.15]} />
                <T g={G.sphere} c={style.cheveux} p={[0, 0.235, 0.06]} r={[0.3, 0, 0]} s={[0.13, 0.05, 0.1]} />
              </>
            ) : null}
            {style.coiffure === 'capuche' ? (
              <>
                <T g={G.demi} c={style.cheveux} p={[0, 0.2, -0.01]} s={[0.157, 0.13, 0.152]} />
                {[-0.07, 0, 0.07].map((x) => <T key={x} g={G.sphere} c={style.cheveux} p={[x, 0.29, 0.06]} s={[0.05, 0.045, 0.05]} />)}
              </>
            ) : null}
            {style.casque ? (
              <>
                <T g={G.tore} c={'#22262e'} p={[0, 0.16, 0]} r={[0, Math.PI / 2, 0]} s={[0.17, 0.17, 0.17]} />
                <T g={G.cylindre} c={'#f0573a'} p={[-0.165, 0.12, 0]} r={[0, 0, Math.PI / 2]} s={[0.06, 0.04, 0.06]} />
                <T g={G.cylindre} c={'#f0573a'} p={[0.165, 0.12, 0]} r={[0, 0, Math.PI / 2]} s={[0.06, 0.04, 0.06]} />
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
              <Boite key={k} c={style.cheveux} p={[k * 0.057, 0.218, 0.135]} r={[0, 0, k * (0.12 - sourire * 0.1)]} s={[0.05, 0.012, 0.012]} contour={false} />
            ))}
            <mesh geometry={G.sphere} material={toon('#d98a5e')} position={[0, 0.1, 0.148]} scale={[0.016, 0.014, 0.012]} />
            <mesh geometry={G.capsule} material={toon('#6a221c')} position={[0, 0.045, 0.138]} rotation={[0, 0, Math.PI / 2]}
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



// ================================================================== la marche (on avance vers -x sur le trottoir, ~0,9 m/s)
const marcheX = (t: number) => -0.9 * (S.ARRET - S.MARCHE) * fen(t, S.MARCHE, S.ARRET, 0, 1, Easing.inOut(Easing.sin));
const enMarche = (t: number) => t > S.MARCHE + 0.3 && t < S.ARRET - 0.3;

// ================================================================== qui est où (x = le long de la rue, z = de la façade (-2,8) à l'autre trottoir (10,8))
const PASSANT_P: V3 = [-4.3, 0, -0.95];
const ADO_P: V3 = [-19.2, 0, 6.6];
const VOISINE_P: V3 = [-18.3, 0, -2.45];
const FENETRES: V3 = [-22, 5.6, 10.8];
const FOULE: {p: V3; s: number; meneur?: boolean}[] = [
  {p: [-11.5, 0, 0.9], s: 1}, {p: [-20.5, 0, -0.6], s: 0, meneur: true}, {p: [-22.4, 0, 0.8], s: 2}, {p: [-24.0, 0, -1.4], s: 3},
  {p: [-19.6, 0, 9.0], s: 4}, {p: [-25.5, 0, 9.6], s: 1}, {p: [-27.0, 0, 0.2], s: 2}, {p: [-23.2, 0, 4.2], s: 4},
];

// ================================================================== caméra subjective
const OEIL = 1.62;
const camBase = (t: number): V3 => [marcheX(t), OEIL, 0];
const rel = (t: number, d: V3): V3 => {
  const c = camBase(t);
  return [c[0] + d[0], c[1] + d[1], c[2] + d[2]];
};
const teteDe = (p: V3, h = 1.66): V3 => [p[0], h, p[2]];
const CIBLES: Record<string, (t: number) => V3> = {
  TEL: (t) => rel(t, [-0.7, -0.5, -0.08]),
  AVANT: (t) => rel(t, [-10, -0.2, 0.3]),
  PASSANT: () => teteDe(PASSANT_P, 1.72),
  FENETRES: () => FENETRES,
  ADO: () => teteDe(ADO_P),
  FOULE: () => [-22.5, 1.45, 1.0],
  VOISINE: () => teteDe(VOISINE_P, 1.6),
};
const CLES: [number, string, number][] = [
  [0, 'TEL', 0], [7.7, 'AVANT', 0.55], [11.3, 'PASSANT', 0.45], [14.4, 'AVANT', 0.45], [S.APPEL - 0.1, 'TEL', 0.35], [S.APPEL + 1.4, 'AVANT', 0.6],
  [S.FENETRES, 'FENETRES', 0.6], [L.L07 - 0.2, 'ADO', 0.45], [L.L08, 'FOULE', 0.6], [S.PORTE_VOISINE, 'VOISINE', 0.45],
  [L.L10 - 0.6, 'FOULE', 0.6],
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
  const recule = fen(t, S.TRAQUE, S.TRAQUE + 0.8, 0, 0.35, sortie); // on recule d'un pas quand ils avancent
  const b = camBase(t);
  const pos: V3 = [b[0] + recule + noise2D('px', t * 0.6, 0) * 0.01, b[1] + pas * Math.abs(Math.sin(t * 5.6)) * 0.035, b[2] + pas * Math.sin(t * 2.8) * 0.02];
  const c = cibleA(t);
  const tremble = 0.03 + (t > S.TICS ? 0.03 : 0);
  const cible: V3 = [c[0] + noise2D('cx', t * 1.1, 0) * tremble, c[1] + noise2D('cy', t * 1.1, 1) * tremble, c[2] + noise2D('cz', t * 1.1, 2) * tremble];
  const roulis = noise2D('r', t * 0.8, 2) * 0.025 + pas * Math.sin(t * 2.8) * 0.01;
  return {pos, cible, roulis};
};
const dirCam = (t: number) => {
  const {pos, cible} = poseCam(t);
  const d = new THREE.Vector3(cible[0] - pos[0], cible[1] - pos[1], cible[2] - pos[2]).normalize();
  return {lacet: Math.atan2(d.x, -d.z), tangage: Math.asin(d.y)};
};

// ================================================================== la ville
const alea = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
const FACADES = ['#e9b88a', '#d98f72', '#f0d3a2', '#c98a7a', '#e7c49a', '#b9967f', '#efc08f', '#d6a07e'];
const IMMEUBLES = (() => {
  const out: {x: number; l: number; h: number; c: string; cote: number; i: number}[] = [];
  for (const cote of [-1, 1]) {
    let x = 14;
    let i = cote > 0 ? 100 : 0;
    while (x > -70) {
      const l = 6 + alea(i) * 4, h = 9 + alea(i + 0.5) * 8;
      out.push({x: x - l / 2, l, h, c: FACADES[Math.floor(alea(i + 0.3) * FACADES.length)], cote, i});
      x -= l + 0.15;
      i++;
    }
  }
  return out;
})();
const Immeuble: React.FC<{x: number; l: number; h: number; c: string; cote: number; i: number}> = ({x, l, h, c, cote, i}) => {
  const zF = cote < 0 ? -2.8 : 10.8; // façade
  const s = cote < 0 ? 1 : -1; // vers la rue
  const prof = 6;
  const cols = Math.max(2, Math.floor(l / 1.6));
  const etages = Math.floor((h - 3.2) / 2.4);
  const store = ['#c0392b', '#2d6a4f', '#264f8f', '#b5651d'][Math.floor(alea(i + 0.9) * 4)];
  return (
    <group>
      <T g={G.boite} c={c} p={[x, h / 2, zF - s * prof / 2]} s={[l, h, prof]} />
      <T g={G.boite} c={'#8a6a5a'} p={[x, h + 0.12, zF - s * prof / 2]} s={[l + 0.2, 0.24, prof + 0.2]} />
      {Array.from({length: etages}, (_, e) => Array.from({length: cols}, (_, k) => {
        const on = alea(i * 7.3 + e * 3.1 + k) > 0.45;
        const wx = x - l / 2 + (k + 0.5) * (l / cols);
        return <mesh key={`${e}-${k}`} position={[wx, 3.9 + e * 2.4, zF + s * 0.01]} geometry={G.boite} scale={[0.75, 1.15, 0.02]}
          material={plat(on ? (alea(i + e + k * 0.7) > 0.5 ? '#ffd88a' : '#ffc26b') : '#3d3a5c')} />;
      }))}
      <mesh position={[x + l * 0.12, 1.25, zF + s * 0.012]} geometry={G.boite} scale={[l * 0.5, 1.7, 0.02]} material={plat(alea(i + 2.2) > 0.4 ? '#ffe2a6' : '#4a4766')} />
      <T g={G.boite} c={store} p={[x + l * 0.12, 2.35, zF + s * 0.45]} r={[s * 0.35, 0, 0]} s={[l * 0.55, 0.08, 0.95]} />
      <T g={G.boite} c={'#5a3a2c'} p={[x - l * 0.32, 1.05, zF + s * 0.03]} s={[1.0, 2.1, 0.06]} />
    </group>
  );
};
const Voiture: React.FC<{x: number; c: string; z: number}> = ({x, c, z}) => (
  <group position={[x, 0, z]}>
    <T g={G.boite} c={c} p={[0, 0.55, 0]} s={[4.1, 0.65, 1.75]} />
    <T g={G.boite} c={c} p={[0.2, 1.05, 0]} s={[2.2, 0.55, 1.6]} />
    <mesh position={[0.2, 1.05, 0.81]} geometry={G.boite} scale={[2.0, 0.42, 0.02]} material={plat('#2c3350')} />
    <mesh position={[0.2, 1.05, -0.81]} geometry={G.boite} scale={[2.0, 0.42, 0.02]} material={plat('#2c3350')} />
    {[-1.35, 1.35].map((wx) => [-0.85, 0.85].map((wz) => (
      <T key={`${wx}${wz}`} g={G.cylindre} c={'#1d1d22'} p={[wx, 0.32, wz]} r={[Math.PI / 2, 0, 0]} s={[0.32, 0.22, 0.32]} />
    )))}
    <mesh position={[-2.06, 0.62, 0.55]} geometry={G.boite} scale={[0.02, 0.14, 0.3]} material={plat('#fff3c4')} />
    <mesh position={[-2.06, 0.62, -0.55]} geometry={G.boite} scale={[0.02, 0.14, 0.3]} material={plat('#fff3c4')} />
  </group>
);
const Lampadaire: React.FC<{x: number; z: number; s: number}> = ({x, z, s}) => (
  <group position={[x, 0, z]}>
    <T g={G.cylindre} c={'#2e3440'} p={[0, 2.4, 0]} s={[0.06, 4.8, 0.06]} />
    <T g={G.boite} c={'#2e3440'} p={[0, 4.75, -s * 0.45]} s={[0.08, 0.08, 0.9]} />
    <mesh position={[0, 4.65, -s * 0.85]} geometry={G.sphere} scale={[0.22, 0.12, 0.22]} material={plat('#ffe7a8')} />
  </group>
);
// le ciel du crépuscule : une grande sphère dégradée qui suit la caméra
const matCiel = new THREE.ShaderMaterial({
  side: THREE.BackSide, depthWrite: false,
  uniforms: {haut: {value: new THREE.Color('#3b2d6e')}, milieu: {value: new THREE.Color('#d9707a')}, bas: {value: new THREE.Color('#f7a35c')}},
  vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: `uniform vec3 haut, milieu, bas; varying vec3 vP;
    void main(){ float y = vP.y; vec3 c = y > 0.18 ? mix(milieu, haut, smoothstep(0.18, 0.7, y)) : mix(bas, milieu, smoothstep(-0.05, 0.18, y)); gl_FragColor = vec4(c, 1.0); }`,
});
const VOITURES = [6, -1.5, -8, -12.6, -24, -32, -40].map((x, i) => ({x, c: ['#c0392b', '#f2f2f2', '#2f5d8a', '#f1c40f', '#27313f', '#7a8c5a', '#e67e22'][i]}));
const Ville: React.FC<{t: number; matAffiche: THREE.Material}> = ({t, matAffiche}) => (
  <group>
    <mesh position={[marcheX(t), 0, 4]} geometry={G.sphere} scale={[80, 80, 80]} material={matCiel} renderOrder={-1} />
    <T g={G.boite} c={'#cdbca7'} p={[-30, -0.05, -0.6]} s={[120, 0.1, 4.4]} />
    <T g={G.boite} c={'#9c8e80'} p={[-30, 0.02, 1.62]} s={[120, 0.14, 0.18]} />
    <T g={G.boite} c={'#4b4655'} p={[-30, -0.08, 5.1]} s={[120, 0.1, 7.0]} contour={false} />
    {Array.from({length: 30}, (_, i) => <mesh key={i} position={[14 - i * 4, -0.02, 5.1]} geometry={G.boite} scale={[2, 0.01, 0.14]} material={plat('#f2efe6')} />)}
    <T g={G.boite} c={'#cdbca7'} p={[-30, -0.05, 9.7]} s={[120, 0.1, 2.2]} />
    {IMMEUBLES.map((b) => <Immeuble key={`${b.cote}${b.i}`} {...b} />)}
    {VOITURES.map((v) => <Voiture key={v.x} x={v.x} c={v.c} z={2.55} />)}
    <Voiture x={-12} c={'#5b4b8a'} z={7.6} />
    <Voiture x={-34} c={'#d35400'} z={7.6} />
    {Array.from({length: 10}, (_, i) => <Lampadaire key={i} x={10 - i * 9} z={1.35} s={-1} />)}
    {Array.from({length: 10}, (_, i) => <Lampadaire key={`b${i}`} x={5 - i * 9} z={8.75} s={1} />)}
    {/* écrans géants de la ville : ton avis de recherche */}
    <group position={[-16, 6.4, 10.74]} rotation={[0, Math.PI, 0]}>
      <T g={G.boite} c={'#1c1c22'} s={[3.4, 4.4, 0.12]} />
      <mesh position={[0, 0, 0.07]} material={matAffiche}><planeGeometry args={[3.1, 4.1]} /></mesh>
    </group>
    <group position={[-31, 5.8, -2.74]}>
      <T g={G.boite} c={'#1c1c22'} s={[3.0, 3.9, 0.12]} />
      <mesh position={[0, 0, 0.07]} material={matAffiche}><planeGeometry args={[2.7, 3.6]} /></mesh>
    </group>
  </group>
);

// ================================================================== textures d'écrans
const ecranTel = (messages: string[], titre: string, largeur = 380, hauteur = 780) => {
  const cv = document.createElement('canvas');
  cv.width = largeur; cv.height = hauteur;
  const g = cv.getContext('2d')!;
  const fond = g.createLinearGradient(0, 0, 0, hauteur);
  fond.addColorStop(0, '#2a2f45'); fond.addColorStop(1, '#141724');
  g.fillStyle = fond; g.fillRect(0, 0, largeur, hauteur);
  g.fillStyle = '#ffffff'; g.font = '700 26px sans-serif'; g.textAlign = 'left';
  g.fillText('23:47', 24, 40);
  g.textAlign = 'right'; g.font = '600 22px sans-serif'; g.fillText('Pas de service', largeur - 22, 40);
  g.fillStyle = '#353b55'; g.fillRect(0, 62, largeur, 92);
  g.fillStyle = '#e2702c'; g.beginPath(); g.arc(56, 108, 26, 0, 7); g.fill();
  g.fillStyle = '#fff'; g.font = '800 30px sans-serif'; g.textAlign = 'center'; g.fillText('?', 56, 119);
  g.textAlign = 'left'; g.font = '800 30px sans-serif'; g.fillText(titre, 98, 118);
  let y = hauteur - 40;
  [...messages].reverse().forEach((m, i) => {
    g.font = '700 30px sans-serif';
    const lignes: string[] = [];
    let cour = '';
    for (const w of m.split(' ')) {
      if (g.measureText(`${cour} ${w}`).width > largeur - 110 && cour) { lignes.push(cour); cour = w; } else cour = cour ? `${cour} ${w}` : w;
    }
    lignes.push(cour);
    const h = lignes.length * 38 + 30;
    y -= h;
    g.fillStyle = i === 0 ? '#ffffff' : '#c9cbd6';
    g.beginPath(); g.roundRect(20, y, largeur - 70, h, 24); g.fill();
    g.fillStyle = '#16182a';
    lignes.forEach((l, k) => g.fillText(l, 40, y + 46 + k * 38));
    y -= 18;
  });
  const tx = new THREE.CanvasTexture(cv);
  tx.colorSpace = THREE.SRGBColorSpace;
  return tx;
};
const useEcranMat = (cle: string, fab: () => THREE.Texture) => {
  const mat = useMemo(() => new THREE.MeshBasicMaterial({toneMapped: false}), []);
  const tex = useMemo(fab, [cle]);
  mat.map = tex;
  mat.needsUpdate = true;
  return mat;
};
const Telephone: React.FC<{mat: THREE.Material; echelle?: number}> = ({mat, echelle = 1}) => (
  <group scale={echelle}>
    <T g={G.boite} c={C.tel} s={[0.072, 0.15, 0.009]} />
    <mesh position={[0, 0, 0.0047]} material={mat}><planeGeometry args={[0.065, 0.142]} /></mesh>
  </group>
);



// ton avis de recherche, dessiné à la main (même dessin sur les écrans 3D et sur la carte 2D)
const dessineVisage = (g: CanvasRenderingContext2D, cx: number, cy: number, r: number) => {
  g.fillStyle = '#2c3b6b'; g.beginPath(); g.ellipse(cx, cy + r * 1.55, r * 1.25, r * 0.9, 0, Math.PI, 0); g.fill();
  g.fillStyle = '#9a6240'; g.beginPath(); g.arc(cx, cy, r, 0, 7); g.fill();
  g.fillStyle = '#1b120d'; g.beginPath(); g.ellipse(cx, cy - r * 0.55, r * 1.02, r * 0.62, 0, Math.PI, 0); g.fill();
  g.fillStyle = '#fff'; [-1, 1].forEach((k) => { g.beginPath(); g.ellipse(cx + k * r * 0.36, cy + r * 0.05, r * 0.2, r * 0.24, 0, 0, 7); g.fill(); });
  g.fillStyle = '#1a1210'; [-1, 1].forEach((k) => { g.beginPath(); g.arc(cx + k * r * 0.36, cy + r * 0.08, r * 0.1, 0, 7); g.fill(); });
  g.strokeStyle = '#4a2a1a'; g.lineWidth = r * 0.07; g.beginPath(); g.arc(cx, cy + r * 0.62, r * 0.22, Math.PI * 1.15, Math.PI * 1.85); g.stroke();
};
const ecranRecherche = (largeur = 380, hauteur = 780) => {
  const cv = document.createElement('canvas');
  cv.width = largeur; cv.height = hauteur;
  const g = cv.getContext('2d')!;
  const k = largeur / 380;
  g.fillStyle = '#141724'; g.fillRect(0, 0, largeur, hauteur);
  g.fillStyle = '#c0302a'; g.fillRect(0, hauteur * 0.09, largeur, hauteur * 0.12);
  g.fillStyle = '#fff'; g.textAlign = 'center'; g.font = `800 ${46 * k}px sans-serif`; g.fillText('RECHERCHÉ', largeur / 2, hauteur * 0.17);
  g.fillStyle = '#f4e9d6'; g.fillRect(largeur * 0.1, hauteur * 0.25, largeur * 0.8, hauteur * 0.42);
  dessineVisage(g, largeur / 2, hauteur * 0.43, 92 * k);
  g.fillStyle = '#ffd23f'; g.font = `800 ${54 * k}px sans-serif`; g.fillText('1 000 000 €', largeur / 2, hauteur * 0.77);
  g.fillStyle = '#fff'; g.font = `700 ${30 * k}px sans-serif`; g.fillText('NAËL · 19 ANS', largeur / 2, hauteur * 0.835);
  g.font = `700 ${26 * k}px sans-serif`; g.fillStyle = '#ff8a7a'; g.fillText('Traque : 19 h 00', largeur / 2, hauteur * 0.9);
  const tx = new THREE.CanvasTexture(cv); tx.colorSpace = THREE.SRGBColorSpace; return tx;
};
const ecranAppel = (fini: boolean, largeur = 380, hauteur = 780) => {
  const cv = document.createElement('canvas');
  cv.width = largeur; cv.height = hauteur;
  const g = cv.getContext('2d')!;
  const fond = g.createLinearGradient(0, 0, 0, hauteur);
  fond.addColorStop(0, '#2a2f45'); fond.addColorStop(1, '#141724');
  g.fillStyle = fond; g.fillRect(0, 0, largeur, hauteur);
  g.fillStyle = '#e88aa6'; g.beginPath(); g.arc(largeur / 2, 230, 80, 0, 7); g.fill();
  g.fillStyle = '#fff'; g.textAlign = 'center'; g.font = '800 90px sans-serif'; g.fillText('M', largeur / 2, 262);
  g.font = '800 52px sans-serif'; g.fillText('Maman', largeur / 2, 390);
  g.font = '700 30px sans-serif'; g.fillStyle = fini ? '#ff6b5a' : '#9fe0a8'; g.fillText(fini ? 'Appel terminé' : 'En appel', largeur / 2, 440);
  g.fillStyle = '#e0453a'; g.beginPath(); g.arc(largeur / 2, 650, 50, 0, 7); g.fill();
  const tx = new THREE.CanvasTexture(cv); tx.colorSpace = THREE.SRGBColorSpace; return tx;
};

// ================================================================== mains (accrochées à la caméra)
const Mains: React.FC<{t: number}> = ({t}) => {
  const etat = t < S.APPEL ? 'recherche' : t < S.COUPE ? 'appel' : t < S.COUPE + 3 ? 'fini' : 'recherche';
  const mat = useEcranMat(etat, () => (etat === 'recherche' ? ecranRecherche() : ecranAppel(etat === 'fini')));
  const leve = poidsTel(t);
  const sonne = (t < 2.5 || (t >= S.APPEL && t < S.DECROCHE)) ? Math.sin(t * 190) * 0.003 : 0;
  return (
    <group position={[0.07 + sonne - leve * 0.04, -0.27 + leve * 0.13, -0.33 + leve * 0.03]} rotation={[0.5 + leve * 0.25, -0.15 + leve * 0.1, 0.06]} scale={1.5}>
      <T g={G.capsule} c={C.manche} p={[0.035, -0.125, 0.03]} r={[-0.45, 0, 0.35]} s={[0.03, 0.075, 0.03]} />
      <T g={G.cylindre} c={'#e8e2d4'} p={[0.022, -0.085, 0.012]} r={[-0.45, 0, 0.35]} s={[0.031, 0.012, 0.031]} />
      <T g={G.sphere} c={C.peau3} p={[0.012, -0.04, -0.016]} s={[0.042, 0.05, 0.02]} />
      <Telephone mat={mat} />
      <T g={G.capsule} c={C.peau3} p={[-0.036, -0.032, 0.012]} r={[0.2, 0, -0.5]} s={[0.012, 0.024, 0.012]} />
      {[-0.034, -0.008, 0.018, 0.042].map((y, i) => (
        <T key={i} g={G.capsule} c={C.peau3} p={[0.041, y - 0.012, 0.006]} r={[0, 0, 0.25]} s={[0.0098, 0.012, 0.0098]} />
      ))}
    </group>
  );
};

// ================================================================== rendu fisheye + flou de mouvement
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
        coin: {value: new THREE.Color(C.coin)}, flou: {value: new THREE.Vector2(0, 0)}, voile: {value: 0}},
      vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`,
      fragmentShader: `uniform sampler2D tex; uniform float aspect, k, zoom, voile; uniform vec3 coin; uniform vec2 flou; varying vec2 vUv;
        vec2 deforme(vec2 uv){ vec2 d = uv - 0.5; d.x *= aspect; float r2 = dot(d, d); vec2 s = d * zoom * (1.0 + k * r2); s.x /= aspect; return s + 0.5; }
        void main(){
          vec2 s = deforme(vUv);
          vec3 c = vec3(0.0);
          for (int i = 0; i < 9; i++) { float f = float(i) / 8.0 - 0.5; c += texture2D(tex, clamp(s + flou * f, 0.0, 1.0)).rgb; }
          c /= 9.0;
          float bord = max(max(-s.x, s.x - 1.0), max(-s.y, s.y - 1.0));
          c = mix(c, coin, smoothstep(-0.004, 0.004, bord));
          vec2 d = vUv - 0.5; d.x *= aspect;
          float vig = smoothstep(0.95, 0.25, dot(d, d) * 1.6);
          c *= mix(0.74, 1.0, vig);
          c = mix(c, vec3(0.0), voile);
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
  const voile = 0;
  useFrame(() => {
    const cam = camera as THREE.PerspectiveCamera;
    cam.fov = 108;
    cam.near = 0.02;
    cam.far = 90;
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
    post.mat.uniforms.voile.value = voile;
    gl.setRenderTarget(cible);
    gl.render(scene, cam);
    gl.setRenderTarget(null);
    gl.render(post.s, post.cam);
  }, 1);
  return null;
};


// ================================================================== scène
const STYLES: Style[] = [
  {peau: C.peau, haut: '#3b4256', bas: '#3b4256', chaussures: '#1d1d22', cheveux: '#5a4a3e', coiffure: 'court', costume: true},
  {peau: '#c98a5a', haut: '#2f2f38', bas: '#1f2430', chaussures: '#f2f2f2', cheveux: '#1d1410', coiffure: 'court'},
  {peau: '#f1c9a0', haut: '#7a4fa0', bas: '#2d3340', chaussures: '#f4ece0', cheveux: '#c58b3a', coiffure: 'chignon', manteau: true},
  {peau: C.peau3, haut: '#d9822b', bas: '#34477a', chaussures: '#1d1d22', cheveux: '#1d1410', coiffure: 'capuche'},
  {peau: '#e8b48a', haut: '#2e7d5b', bas: '#2d3340', chaussures: '#f2f2f2', cheveux: '#3a2a20', coiffure: 'court'},
];
const STYLE_ADO: Style = {peau: C.peau3, haut: '#5fae6e', bas: '#2d3340', chaussures: '#f2f2f2', cheveux: '#1d1410', coiffure: 'capuche', casque: true};
const STYLE_VOISINE: Style = {peau: C.peau, haut: C.rouge, bas: '#34477a', chaussures: '#f4ece0', cheveux: '#2f1a12', coiffure: 'chignon', manteau: true};
const TEL_BAS: V3 = [-0.35, 0.12, -1.1];
const rotVers = (p: V3, cible: V3) => Math.atan2(cible[0] - p[0], cible[2] - p[2]);

const Scene: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const mains = useRef<THREE.Group>(null);
  const cam = poseCam(t).pos;
  const matAffiche = useEcranMat('affiche', () => ecranRecherche(310, 410));
  const matTel = useEcranMat('telpassant', () => ecranRecherche());
  const rouge = fen(t, S.TRAQUE, S.TRAQUE + 0.25) * (1 - fen(t, S.TRAQUE + 0.25, S.TRAQUE + 1.4));
  const avance = Math.max(0, t - S.TRAQUE) * 1.5; // à 19 h, la foule se met en marche vers toi
  const telMain = <group rotation={[Math.PI / 2 - 0.1, Math.PI, 0]}><Telephone mat={matTel} /></group>;

  const vuP = t > L.L03 - 0.6;
  const rotP = rotVers(PASSANT_P, cam);
  const rotA = rotVers(ADO_P, cam);
  const ouvre = fen(t, S.PORTE_VOISINE - 0.3, S.PORTE_VOISINE + 0.3);
  const rotV = rotVers(VOISINE_P, cam);
  const signe = t > L.L09 && t < L.L09 + 3.6 ? Math.sin((t - L.L09) * 9) * 0.5 : 0;
  return (
    <>
      <color attach="background" args={['#3b2d6e']} />
      <ambientLight intensity={1.05} color={'#ffd9c4'} />
      <hemisphereLight intensity={0.55} color={'#ffcfb0'} groundColor={'#5a3a4a'} />
      <directionalLight position={[-30, 12, 8]} intensity={1.5} color={'#ffb27a'} />
      {rouge > 0 ? <ambientLight intensity={1.2 * rouge} color={'#ff3b2a'} /> : null}
      <Ville t={t} matAffiche={matAffiche} />

      {/* le passant qui te reconnaît, téléphone en main */}
      <Perso p={PASSANT_P} rotY={vuP ? rotP : Math.PI / 2} style={STYLES[0]} tete={vuP ? viser(teteDe(PASSANT_P, 1.72), cam, rotP) : [0, 0.45]}
        bouche={t < 20 ? parle(['PASSANT'], t) : 0} cligne={cligne(t, 2)} brasD={TEL_BAS} brasG={[-0.1, 0.1, -0.3]} telMain={telMain} />

      {/* la foule : écran à la main, tête baissée ; ils lèvent les yeux un à un ; à 19 h ils avancent */}
      {FOULE.map((f, i) => {
        const leve = t > S.FENETRES + i * 1.6 || t > S.REGARDS;
        const p: V3 = [f.p[0] + (t > S.TRAQUE ? avance : 0), 0, f.p[2]];
        const rot = leve ? rotVers(p, cam) : Math.PI / 2 + (i % 2 ? 0.6 : -0.4);
        const range = t > S.REGARDS; // ils rangent leur téléphone et te fixent
        return <Perso key={i} p={p} rotY={rot} style={STYLES[f.s]} marche={t > S.TRAQUE ? 1 : 0} phase={(t - S.TRAQUE) * 8 + i}
          tete={leve ? viser(teteDe(p), cam, rot) : [0, 0.45]} bouche={f.meneur && t > 40 ? parle(['PASSANT'], t) : 0} cligne={cligne(t, i + 4)}
          brasD={range ? [-0.1, 0.1, -0.3] : leve && i % 3 === 0 ? [-2.4, 0.2, -0.4] : TEL_BAS} brasG={[-0.1, 0.1, -0.3]} telMain={range ? null : telMain} />;
      })}

      {/* l'ado de l'autre côté de la rue : il te filme et crie */}
      <Perso p={[ADO_P[0] + (t > S.TRAQUE ? avance : 0), 0, ADO_P[2]]} rotY={rotA} style={STYLE_ADO} tete={viser(teteDe(ADO_P), cam, rotA)}
        bouche={parle(['ADO'], t)} cligne={cligne(t, 3)} marche={t > S.TRAQUE ? 1 : 0} phase={(t - S.TRAQUE) * 8}
        brasD={t > L.L07 - 0.5 ? [-2.5, 0.2, -0.5] : TEL_BAS} brasG={t > L.L07 && t < L.L07 + 2.8 ? [-2.9, -0.3, -0.2] : [-0.1, 0.1, -0.3]} telMain={telMain} />

      {/* les gens aux fenêtres, téléphone allumé */}
      {t > S.FENETRES
        ? [[-18.4, 3.9], [-20.9, 6.3], [-23.5, 3.9], [-26.2, 6.3], [-16.0, 8.7], [-29, 3.9]].map(([x, y], i) => (
          <group key={i} position={[x, y, 10.77]} visible={t > S.FENETRES + i * 0.35}>
            <mesh position={[0, -0.1, 0]} geometry={G.boite} scale={[0.5, 0.9, 0.02]} material={plat('#1f1830')} />
            <mesh position={[0, 0.48, 0]} geometry={G.sphere} scale={[0.18, 0.2, 0.02]} material={plat('#1f1830')} />
            <mesh position={[0.12, 0.05, -0.02]} geometry={G.boite} scale={[0.1, 0.17, 0.01]} material={plat('#dfeaff')} />
          </group>
        ))
        : null}

      {/* l'inconnue qui t'ouvre sa porte */}
      <mesh position={[VOISINE_P[0], 1.05, -2.77]} geometry={G.boite} scale={[1.0, 2.1, 0.02]} material={plat('#ffe0a0')} visible={ouvre > 0} />
      <Perso p={VOISINE_P} rotY={rotV} style={STYLE_VOISINE} visible={ouvre > 0.5} tete={viser(teteDe(VOISINE_P, 1.6), cam, rotV)}
        bouche={parle(['VOISINE'], t)} cligne={cligne(t, 1)} brasD={[-1.6 - signe, 0.3, -0.9 + signe]} brasG={[-0.1, 0.1, -0.3]} />

      <group ref={mains}>
        <Mains t={t} />
      </group>
      <Rendu t={t} mains={mains} />
    </>
  );
};

// ================================================================== calques 2D
const VisageSvg: React.FC<{taille: number}> = ({taille}) => (
  <svg width={taille} height={taille} viewBox="0 0 200 200">
    <rect width="200" height="200" fill="#f4e9d6" />
    <ellipse cx="100" cy="205" rx="92" ry="66" fill="#2c3b6b" />
    <circle cx="100" cy="98" r="62" fill="#9a6240" />
    <path d="M37 88 A63 40 0 0 1 163 88 Z" fill="#1b120d" />
    <ellipse cx="78" cy="101" rx="12" ry="15" fill="#fff" /><ellipse cx="122" cy="101" rx="12" ry="15" fill="#fff" />
    <circle cx="78" cy="103" r="6.5" fill="#1a1210" /><circle cx="122" cy="103" r="6.5" fill="#1a1210" />
    <path d="M88 138 Q100 128 112 138" stroke="#4a2a1a" strokeWidth="4.5" fill="none" />
  </svg>
);
const Hud: React.FC = () => {
  const t = useCurrentFrame() / FPS;
  if (t >= S.VOTE) return null;
  const fini = t >= S.TRAQUE;
  const bat = t >= S.TICS && !fini ? 1 + 0.06 * Math.max(0, Math.cos((t - S.TICS) * Math.PI * 2)) : 1;
  return (
    <div style={{position: 'absolute', top: 70, left: 54, fontFamily: BALOO, fontWeight: 800}}>
      <div style={{color: '#fffaf1', fontSize: 30, letterSpacing: 2, WebkitTextStroke: '6px #24150f', paintOrder: 'stroke fill'}}>RUE DES LILAS · TA VILLE</div>
      <div style={{color: fini ? '#ff5a4a' : '#fffaf1', fontSize: 108, lineHeight: 1, WebkitTextStroke: '14px #24150f', paintOrder: 'stroke fill', transform: `scale(${bat})`, transformOrigin: 'left center'}}>{hh(t)}</div>
      <div style={{display: 'inline-block', marginTop: 10, background: '#c0302a', color: '#fff', border: '6px solid #24150f', borderRadius: 18, padding: '4px 20px', fontSize: 40}}>
        {fini ? 'LA TRAQUE A COMMENCÉ' : `LA TRAQUE DANS ${reste(t)}`}
      </div>
    </div>
  );
};
const CarteRecherche: React.FC = () => {
  const t = useCurrentFrame() / FPS;
  const {fps} = useVideoConfig();
  if (t > S.CARTE_FIN + 0.4) return null;
  const s = spring({frame: t * fps, fps, config: {damping: 12, stiffness: 240}, from: 0.92, to: 1});
  const out = fen(t, S.CARTE_FIN, S.CARTE_FIN + 0.4, 0, 1, Easing.in(Easing.cubic));
  const clign = t < S.ALARME_FIN && t % 1 < 0.8 ? 1 : 0.88;
  return (
    <div style={{position: 'absolute', top: 330, left: 60, right: 60, transform: `scale(${s}) translateY(${out * -1000}px)`, opacity: 1 - out,
      background: '#c0302a', border: '9px solid #24150f', borderRadius: 44, boxShadow: '0 18px 0 #24150f', padding: '26px 36px 34px', fontFamily: BALOO, color: '#fff', filter: `brightness(${clign})`}}>
      <div style={{fontSize: 58, fontWeight: 800}}>⚠ AVIS À LA POPULATION</div>
      <div style={{fontSize: 32, fontWeight: 700, opacity: 0.85, marginTop: -6}}>Tous les téléphones · maintenant</div>
      <div style={{display: 'flex', gap: 28, alignItems: 'center', marginTop: 20}}>
        <div style={{border: '7px solid #24150f', borderRadius: 18, overflow: 'hidden', flexShrink: 0, lineHeight: 0}}><VisageSvg taille={240} /></div>
        <div>
          <div style={{fontSize: 50, fontWeight: 800, lineHeight: 1}}>RECHERCHÉ</div>
          <div style={{fontSize: 70, fontWeight: 800, color: '#ffd23f', lineHeight: 1.05}}>1 000 000 €</div>
          <div style={{fontSize: 40, fontWeight: 800, lineHeight: 1.1, marginTop: 6}}>La traque commence à 19 h.</div>
        </div>
      </div>
    </div>
  );
};
const COULEURS: Record<string, string> = {NAEL: '#ffffff', ADO: '#9ff0a8', PASSANT: '#8fd3ff', MAMAN: '#ff9fbf', ALERTE: '#ffffff', VOISINE: '#ffd23f'};
const ETIQUETTE: Record<string, string> = {ALERTE: 'TOUS LES TÉLÉPHONES', MAMAN: 'MAMAN · AU TÉLÉPHONE'};
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
    <div style={{position: 'absolute', top: l.perso === 'ALERTE' ? 1250 : 1160, width: '100%', textAlign: 'center', fontFamily: BALOO, fontWeight: 800}}>
      {etq ? <div style={{display: 'inline-block', background: '#24150f', color: '#ffd27a', borderRadius: 18, padding: '6px 22px', fontSize: 34, marginBottom: 14}}>{etq}</div> : null}
      <div style={{fontSize: etq ? 96 : 118, color: COULEURS[l.perso], transform: `scale(${0.55 + 0.45 * s})`,
        WebkitTextStroke: '15px #24150f', paintOrder: 'stroke fill', textShadow: '0 10px 0 #24150f', lineHeight: 1}}>
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
    <div style={{transform: `translateX(${(1 - kk) * 700 * sens}px) rotate(${(1 - kk) * 8 * sens}deg)`, background: fond, border: '8px solid #24150f',
      borderRadius: 40, boxShadow: '0 16px 0 #24150f', padding: '28px 36px', display: 'flex', alignItems: 'center', gap: 30}}>
      <div style={{width: 120, height: 120, borderRadius: 60, background: '#24150f', color: fond, fontSize: 92, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0}}>{lettre}</div>
      <div style={{fontSize: 64, lineHeight: 1.02, color: '#24150f'}}>{txt}</div>
    </div>
  );
  const pulse = 1 + 0.03 * Math.sin((t - S.VOTE) * 6);
  return (
    <AbsoluteFill style={{background: 'rgba(14,10,8,0.62)', fontFamily: BALOO, fontWeight: 800, padding: '210px 64px 0', display: 'flex', flexDirection: 'column', gap: 40}}>
      <div style={{alignSelf: 'center', background: '#c0302a', color: '#fff', borderRadius: 30, padding: '8px 34px', fontSize: 44, transform: `scale(${k(0)})`, border: '6px solid #24150f'}}>19:00:00</div>
      <div style={{fontSize: 100, lineHeight: 1.0, color: '#fff', textAlign: 'center', WebkitTextStroke: '14px #24150f', paintOrder: 'stroke fill',
        textShadow: '0 10px 0 #24150f', transform: `scale(${(0.6 + 0.4 * k(0.15)) * pulse})`}}>Tu entres chez l'inconnue, ou tu cours&nbsp;?</div>
      <div style={{display: 'flex', flexDirection: 'column', gap: 34, marginTop: 30}}>
        {carte('A', "J'entre chez elle", '#ffd23f', k(0.7), -1)}
        {carte('B', 'Je cours', '#fffaf1', k(1.1), 1)}
      </div>
      <div style={{textAlign: 'center', color: '#fff', fontSize: 56, marginTop: 30, opacity: k(1.8), WebkitTextStroke: '10px #24150f', paintOrder: 'stroke fill'}}>
        Écris A ou B en commentaire
      </div>
      <div style={{textAlign: 'center', color: '#ffd27a', fontSize: 44, opacity: k(2.3)}}>La suite suivra vos votes</div>
      <div style={{alignSelf: 'center', marginTop: 34, display: 'flex', alignItems: 'center', gap: 26, transform: `translateY(${(1 - k(3.0)) * 500}px) scale(${1 + 0.04 * Math.max(0, Math.sin((t - S.VOTE - 3.4) * 7))})`}}>
        <Img src={staticFile('metro/avatar.png')} style={{width: 150, height: 150, borderRadius: 75, border: '7px solid #24150f', boxShadow: '0 10px 0 #24150f'}} />
        <div style={{display: 'flex', flexDirection: 'column', gap: 10}}>
          <div style={{background: '#fe2c55', color: '#fff', borderRadius: 26, padding: '10px 34px', fontSize: 58, border: '7px solid #24150f', boxShadow: '0 10px 0 #24150f'}}>+ Abonne-toi</div>
          <div style={{color: '#fff', fontSize: 40, WebkitTextStroke: '8px #24150f', paintOrder: 'stroke fill'}}>pour voir la suite</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ================================================================== son
const fr = (s: number) => Math.round(s * FPS);
const Son: React.FC<{a: number; src: string; v?: number; d?: number; boucle?: boolean; fondu?: [number, number]}> = ({a, src, v = 1, d, boucle, fondu}) => (
  <Sequence from={fr(a)} durationInFrames={d ? fr(d) : undefined} layout="none">
    <Audio src={staticFile(`metro/sons/${src}.wav`)} loop={boucle}
      volume={(f) => {
        if (!fondu) return v;
        const tt = f / FPS;
        const dd = d ?? 999;
        return v * Math.min(1, tt / Math.max(0.01, fondu[0])) * Math.max(0, Math.min(1, (dd - tt) / Math.max(0.01, fondu[1])));
      }} />
  </Sequence>
);
const TICS = Array.from({length: 10}, (_, i) => S.TICS + i);
const BandeSon: React.FC = () => (
  <>
    {LIGNES.map((l) => (
      <Sequence key={l.id} from={fr(l.debut)} layout="none">
        <Audio src={staticFile(l.fichier)} />
      </Sequence>
    ))}
    <Son a={0} src="alerte" v={0.5} d={S.ALARME_FIN} fondu={[0.01, 0.6]} boucle />
    <Son a={0} src="impact" v={0.6} />
    <Son a={0} src="vent" v={0.1} d={S.VOTE} boucle fondu={[0.5, 1.0]} />
    <Son a={S.MARCHE} src="pas" v={0.35} d={S.ARRET - S.MARCHE} boucle fondu={[0.3, 0.4]} />
    {[7.7, 11.3, S.APPEL - 0.1, S.FENETRES, L.L07 - 0.2, S.PORTE_VOISINE, L.L10 - 0.6].map((a) => <Son key={a} a={a} src="whoosh" v={0.22} />)}
    <Son a={S.APPEL} src="vibre" v={0.6} />
    <Son a={S.APPEL + 0.4} src="vibre" v={0.6} />
    <Son a={S.COUPE} src="raccroche" v={0.5} />
    <Son a={S.PORTE_VOISINE - 0.2} src="porte" v={0.45} />
    {TICS.map((a) => <Son key={a} a={a} src="tic" v={0.55} />)}
    <Son a={S.TRAQUE} src="impact" v={0.9} />
    <Son a={S.TRAQUE + 0.1} src="pas" v={0.6} d={S.VOTE - S.TRAQUE + 0.4} boucle fondu={[0.1, 0.4]} />
    <Son a={1.0} src="drone" v={0.24} d={S.TICS - 2 - 1.0} boucle fondu={[2.0, 0.4]} />
    <Son a={S.TICS} src="battement" v={0.5} d={S.TRAQUE - S.TICS} boucle fondu={[0.6, 0.05]} />
    <Son a={S.TRAQUE - 2.2} src="montee" v={0.32} />
    <Son a={S.VOTE} src="impact" v={0.75} />
    <Son a={S.VOTE + 0.7} src="pop" v={0.45} />
    <Son a={S.VOTE + 1.1} src="pop" v={0.45} />
    <Son a={S.VOTE + 3.05} src="pop" v={0.6} />
    <Son a={S.VOTE + 0.2} src="drone" v={0.18} d={T_FIN - S.VOTE - 0.2} fondu={[0.5, 1.2]} />
  </>
);

export const LaTraque01: React.FC = () => {
  const {width, height} = useVideoConfig();
  const t = useCurrentFrame() / FPS;
  const flouVote = fen(t, S.VOTE, S.VOTE + 0.4, 0, 9);
  return (
    <AbsoluteFill style={{backgroundColor: C.coin}}>
      <AbsoluteFill style={{filter: flouVote > 0 ? `blur(${flouVote}px)` : undefined}}>
        <ThreeCanvas width={width} height={height} gl={{antialias: true, toneMapping: THREE.NoToneMapping}} flat camera={{fov: 108, near: 0.02, far: 90}}>
          <Scene />
        </ThreeCanvas>
      </AbsoluteFill>
      <Hud />
      <CarteRecherche />
      <SousTitres />
      <Vote />
      <BandeSon />
    </AbsoluteFill>
  );
};
