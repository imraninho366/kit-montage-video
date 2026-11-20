// @ts-nocheck — scène 3D écrite en JSX three (types R3F trop verbeux pour un épisode).
import {loadFont as chargerBaloo} from '@remotion/google-fonts/Baloo2';
import {noise2D} from '@remotion/noise';
import {ThreeCanvas} from '@remotion/three';
import {useFrame, useThree} from '@react-three/fiber';
import React, {useMemo, useRef} from 'react';
import {AbsoluteFill, Audio, Easing, Img, interpolate, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import * as THREE from 'three';
import {mergeVertices} from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import voix from './fra01_voix.json';

/**
 * TU FAIS QUOI ? — « Alerte extrême » : épisode AUTONOME (compréhensible sans rien avoir vu avant).
 * 18:57, tous les téléphones du wagon hurlent : « Ne remontez pas à la surface. Ne regardez pas le ciel. »
 * Le métro arrive au terminus, les portes s'ouvrent à 19:00:00. Chrono visible en permanence, choix à 19:00.
 * Tout est fonction du temps t (secondes) : aucune animation n'a d'état propre.
 */
const FPS = 30;
const T_FIN = 62.0;
export const DUREE_ALERTE_01 = Math.round(T_FIN * FPS);
const {fontFamily: BALOO} = chargerBaloo('normal', {weights: ['700', '800'], subsets: ['latin']});

// ================================================================== chronologie (s)
const L: Record<string, number> = {
  L01: 0.6, L02: 6.6, L03: 10.0, L04: 15.0, L05: 18.1, L06: 20.9, L07: 26.4, L08: 32.2,
  L09: 35.6, L10: 41.0, L11: 44.2, L12: 50.0,
};
const S = {
  ALARME_FIN: 6.2, CARTE_FIN: 6.0, ARRET: 8.5, APPEL: 14.2, DECROCHE: 14.8, COUPE: 25.45,
  MARCHE_COSTUME: 33.4, ARRIVE_COSTUME: 35.2, TICS: 41.0, PORTES: 51.0, VOTE: 53.0,
};
// ElevenLabs renvoie parfois « ! » ou « ?! » comme un mot à part : on le recolle au mot précédent.
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

// l'horloge : 18:57:00 → 18:59:50 en accéléré, puis les 10 dernières secondes en temps réel
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



// ================================================================== lumière, vitesse
// rame allumée ; un raté quand l'appel coupe ; pulsations sur les 10 dernières secondes
const lumiere = (t: number) => {
  if (t >= S.COUPE && t < S.COUPE + 0.45) return [1, 0, 0, 1, 0, 1, 1, 0, 1][Math.floor((t - S.COUPE) * 20) % 9];
  if (t >= S.TICS && t < S.PORTES) return 0.82 + 0.18 * Math.cos((t - S.TICS) * Math.PI * 2);
  return 1;
};
const secours = (_t: number) => 0;
// le métro freine depuis 14 m/s et s'arrête au terminus à S.ARRET
const DEC = 14 / S.ARRET;
const D_STOP = 0.5 * 14 * S.ARRET;
const distance = (t: number) => (t >= S.ARRET ? D_STOP : 14 * t - 0.5 * DEC * t * t);
const station = (_t: number) => false;

// ================================================================== bouche : ouverte sur les mots prononcés
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



// ================================================================== positions des personnages
const FEMME_P: V3 = [0.15, 0, -1.0];
const ADO_P: V3 = [1.85, 0, -0.32];
const ADO_TETE: V3 = [1.85, 1.66, -0.32];
const COSTUME_A: V3 = [-1.05, 0, -0.45];
const COSTUME_B: V3 = [-2.3, 0, -0.9]; // face aux portes
const costumeEtat = (t: number) => {
  const k = fen(t, S.MARCHE_COSTUME, S.ARRIVE_COSTUME, 0, 1, (x) => x);
  const p = mixv(COSTUME_A, COSTUME_B, k);
  const marche = t > S.MARCHE_COSTUME && t < S.ARRIVE_COSTUME ? 1 : 0;
  const rotY = t < S.MARCHE_COSTUME ? 0.5 : fen(t, S.MARCHE_COSTUME, S.MARCHE_COSTUME + 0.4, 0.5, Math.PI + 0.35, doux);
  return {p, marche, rotY, phase: (t - S.MARCHE_COSTUME) * 9, tete: [p[0], 1.72, p[2] + 0.04] as V3};
};
const FEMME_TETE: V3 = [0.15, 1.34, -0.93];
const QUAI: V3 = [1.75, 1.15, -2.3];
const PORTE: V3 = [-2.4, 1.15, -1.4];

// ================================================================== caméra subjective
const SIEGE: V3 = [0.18, 1.18, 0.92];
const CIBLES: Record<string, (t: number) => V3> = {
  TEL: () => [0.24, 0.5, 0.5],
  FEMME: () => FEMME_TETE,
  ADO: () => ADO_TETE,
  COSTUME: (t) => costumeEtat(t).tete,
  QUAI: () => QUAI,
  PORTE: () => PORTE,
};
const CLES: [number, string, number][] = [
  [0, 'TEL', 0], [5.9, 'ADO', 0.45], [9.7, 'COSTUME', 0.4], [S.APPEL - 0.1, 'TEL', 0.35],
  [S.COUPE + 0.3, 'FEMME', 0.4], [L.L07 + 0.3, 'QUAI', 0.6], [L.L08 - 0.3, 'COSTUME', 0.35],
  [L.L09 - 0.2, 'QUAI', 0.45], [L.L10 - 0.4, 'FEMME', 0.5], [L.L11 + 0.4, 'PORTE', 0.6],
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
  const freine = t < S.ARRET ? Math.sin(t * 40) * 0.003 * (1 - t / S.ARRET) : 0;
  const arret = t >= S.ARRET && t < S.ARRET + 0.7 ? Math.exp(-(t - S.ARRET) * 7) : 0; // l'à-coup de l'arrêt
  const avance = fen(t, S.TICS, S.PORTES, 0, 0.12, doux);
  const pos: V3 = [SIEGE[0] + noise2D('px', t * 0.6, 0) * 0.01 - arret * 0.03, SIEGE[1] + freine, SIEGE[2] - avance];
  const c = cibleA(t);
  const tremble = 0.03 + (t > S.TICS ? 0.025 : 0);
  const cible: V3 = [c[0] + noise2D('cx', t * 1.1, 0) * tremble - arret * 0.25, c[1] + noise2D('cy', t * 1.1, 1) * tremble, c[2]];
  const roulis = noise2D('r', t * 0.8, 2) * 0.025;
  return {pos, cible, roulis};
};
const dirCam = (t: number) => {
  const {pos, cible} = poseCam(t);
  const d = new THREE.Vector3(cible[0] - pos[0], cible[1] - pos[1], cible[2] - pos[2]).normalize();
  return {lacet: Math.atan2(d.x, -d.z), tangage: Math.asin(d.y)};
};

// ================================================================== décor
const OUVERT_PORTE = (t: number) => fen(t, S.PORTES - 0.5, S.PORTES + 0.3, 0, 1, Easing.out(Easing.cubic)); // 19:00:00
const Paroi: React.FC<{cote: number; t: number}> = ({cote, t}) => {
  const z = cote * 1.4;
  const avecPorte = cote < 0;
  const montants = avecPorte ? [-8.4, -6.0, -3.15, -1.65, 0.2, 2.55, 5.0, 7.6] : [-8.4, -6.0, -3.4, -1.1, 0.2, 2.55, 5.0, 7.6];
  const largeurs = avecPorte ? [0.4, 0.4, 0.2, 0.2, 0.75, 0.4, 0.4, 0.4] : [0.4, 0.4, 0.4, 0.4, 0.75, 0.4, 0.4, 0.4];
  const o = OUVERT_PORTE(t) * (avecPorte ? 1 : 0);
  return (
    <group>
      {avecPorte ? (
        <>
          <Boite c={C.murBas} p={[-6.025, 0.58, z]} s={[5.95, 1.16, 0.08]} />
          <Boite c={C.murBas} p={[3.625, 0.58, z]} s={[10.75, 1.16, 0.08]} />
          <Boite c={C.mur} p={[0, 2.08, z]} s={[18, 0.34, 0.08]} />
          {[-1, 1].map((k) => (
            <group key={k} position={[-2.4 + k * (0.325 + o * 0.62), 0.975, z + 0.01]}>
              <Boite c={C.porte} s={[0.64, 1.95, 0.06]} />
              <Boite c={C.vitre} p={[0, 0.45, 0.035]} s={[0.4, 0.7, 0.01]} contour={false} />
              <Boite c={'#ffd23f'} p={[-k * 0.3, 0, 0.04]} s={[0.03, 1.8, 0.01]} contour={false} />
            </group>
          ))}
          <Boite c={C.rouge} p={[-1.62, 1.42, z + 0.05]} s={[0.1, 0.16, 0.04]} r={[0, 0, -0.6]} />
          <Boite c={'#ffffff'} p={[-1.62, 1.62, z + 0.045]} s={[0.12, 0.06, 0.01]} contour={false} />
        </>
      ) : (
        <>
          <Boite c={C.murBas} p={[0, 0.58, z]} s={[18, 1.16, 0.08]} />
          <Boite c={C.mur} p={[0, 2.08, z]} s={[18, 0.34, 0.08]} />
        </>
      )}
      {montants.map((x, i) => <Boite key={x} c={C.mur} p={[x, 1.535, z]} s={[largeurs[i], 0.75, 0.08]} />)}
      <T g={G.cylindre} c={C.barre} p={[0, 1.2, z - cote * 0.06]} r={[0, 0, Math.PI / 2]} s={[0.018, 18, 0.018]} />
    </group>
  );
};
const Banquette: React.FC<{x: number; l: number; cote: number}> = ({x, l, cote}) => {
  const z = cote * 1.4;
  return (
    <group>
      <Boite c={C.siege} p={[x, 0.46, z - cote * 0.32]} s={[l, 0.12, 0.5]} />
      <Boite c={C.siegeDos} p={[x, 0.82, z - cote * 0.1]} s={[l, 0.62, 0.1]} />
      <Boite c={'#6b4a38'} p={[x, 0.2, z - cote * 0.3]} s={[l - 0.15, 0.38, 0.4]} />
      {Array.from({length: Math.round(l / 0.6) - 1}, (_, i) => (
        <Boite key={i} c={C.siegeDos} p={[x - l / 2 + 0.6 * (i + 1), 0.525, z - cote * 0.32]} s={[0.02, 0.01, 0.48]} contour={false} />
      ))}
    </group>
  );
};
const Rame: React.FC<{t: number}> = ({t}) => {
  const allume = lumiere(t);
  const lampeMat = plat(allume ? C.lampe : '#4a3426');
  const sec = secours(t);
  return (
    <group>
      <Boite c={C.sol} p={[0, -0.05, 0]} s={[18, 0.1, 2.8]} />
      <Boite c={'#d8c6ae'} p={[0, 0.002, 0]} s={[18, 0.004, 0.9]} contour={false} />
      <Boite c={C.plafond} p={[0, 2.3, 0]} s={[18, 0.1, 2.8]} />
      {[-0.55, 0.55].map((z) => <T key={z} g={G.boite} c={C.lampe} mat={lampeMat} p={[0, 2.22, z]} s={[17, 0.05, 0.16]} />)}
      {[-6, -2.4, 1.2, 4.8].map((x) => (
        <T key={x} g={G.boite} c={'#ff9a3c'} mat={plat(sec ? '#ffb15a' : '#7a4a2a')} p={[x, 2.2, 0]} s={[0.35, 0.06, 0.12]} />
      ))}
      <T g={G.cylindre} c={'#c9bca6'} p={[1.2, 2.24, 0]} s={[0.12, 0.03, 0.12]} />
      <Paroi cote={-1} t={t} />
      <Paroi cote={1} t={t} />
      {[[-5.95, 5.3], [0.4, 3.8], [5.85, 5.3]].map(([x, l]) => <Banquette key={x} x={x} l={l} cote={-1} />)}
      {[[-5.95, 5.3], [0.4, 3.8], [5.85, 5.3]].map(([x, l]) => <Banquette key={`b${x}`} x={x} l={l} cote={1} />)}
      {[-4.4, 1.55, 4.4].map((x) => <T key={x} g={G.cylindre} c={C.barre} p={[x, 1.15, -0.15]} s={[0.028, 2.3, 0.028]} />)}
      {[-0.85, 0.85].map((z) => <T key={z} g={G.cylindre} c={C.barre} p={[0, 1.95, z]} r={[0, 0, Math.PI / 2]} s={[0.022, 17, 0.022]} />)}
      <group position={[0.85, 0.53, -1.02]} rotation={[0.25, 0.4, 0.15]}>
        <T g={G.demi} c={'#f2b632'} s={[0.1, 0.09, 0.1]} />
        <T g={G.cylindre} c={'#d9922a'} p={[0, 0.01, 0]} s={[0.104, 0.03, 0.104]} />
        <T g={G.sphere} c={'#fff4dc'} p={[0, 0.1, 0]} s={[0.035, 0.035, 0.035]} />
      </group>
      <Boite c={C.porte} p={[-8.95, 1.05, 0]} s={[0.06, 2.1, 1.0]} />
      <Boite c={C.porte} p={[8.95, 1.05, 0]} s={[0.06, 2.1, 1.0]} />
    </group>
  );
};


// ================================================================== tunnel puis quai du terminus
const Tunnel: React.FC<{t: number}> = ({t}) => {
  const d = distance(t);
  const pas = 4.5, n = 15;
  const lampes = Array.from({length: n}, (_, i) => ((((i * pas - d) % (pas * n)) + pas * n) % (pas * n)) - (pas * n) / 2);
  const xq = D_STOP - d; // le quai arrive et s'immobilise face à la rame
  return (
    <group>
      {[-1, 1].map((cote) => (
        <group key={cote}>
          <mesh position={[0, 1.0, cote * 2.5]} geometry={G.boite} scale={[80, 4.5, 0.1]} material={toon(C.tunnel)} />
          {lampes.map((x, i) => (
            <mesh key={i} position={[x, 1.7, cote * 2.43]} geometry={G.boite} scale={[t < S.ARRET - 2 ? 0.9 : 0.35, 0.08, 0.04]} material={plat('#ffcf7a')} />
          ))}
        </group>
      ))}
      {xq < 60 ? (
        <group position={[xq, 0, 0]}>
          {/* quai : sol, mur carrelé, bandeau, piliers, sortie au fond d'où tombe une lumière blanche */}
          <mesh position={[0, -0.04, -1.95]} geometry={G.boite} scale={[34, 0.1, 1.0]} material={toon('#d8cdb8')} />
          <mesh position={[0, 0.02, -1.5]} geometry={G.boite} scale={[34, 0.02, 0.08]} material={plat('#f2c94c')} />
          <mesh position={[0, 1.3, -2.42]} geometry={G.boite} scale={[34, 2.9, 0.06]} material={toon('#f1ead9')} />
          <mesh position={[0, 2.15, -2.38]} geometry={G.boite} scale={[34, 0.26, 0.04]} material={plat('#2d5f9a')} />
          {[-12, -6, 0, 6, 12].map((x) => <T key={x} g={G.boite} c={'#c9bfae'} p={[x, 1.3, -2.3]} s={[0.4, 2.9, 0.2]} />)}
          <group position={[1.9, 0, -2.36]}>
            <mesh position={[0, 1.05, 0]} geometry={G.boite} scale={[1.5, 2.1, 0.05]} material={plat('#ffffff')} />
            <mesh position={[0, 2.35, 0.03]} geometry={G.boite} scale={[1.1, 0.28, 0.03]} material={plat('#1f7a3a')} />
            <pointLight position={[0, 1.2, 0.6]} intensity={2.6} distance={4.5} color={'#eef4ff'} />
          </group>
          {/* ce qu'on a laissé en courant : un sac, un téléphone par terre */}
          <T g={G.boite} c={'#6a4a8a'} p={[1.6, 0.12, -1.9]} r={[0, 0.5, 0.2]} s={[0.35, 0.22, 0.2]} />
          <T g={G.boite} c={'#1c1c22'} p={[2.4, 0.02, -1.75]} r={[0, 0.9, 0]} s={[0.08, 0.012, 0.15]} />
          <pointLight position={[2, 2.2, -1.9]} intensity={1.4} distance={6} color={'#dfe8ff'} />
        </group>
      ) : null}
      <mesh position={[0, -0.82, -1.95]} geometry={G.boite} scale={[80, 0.06, 1.0]} material={toon(C.ballast)} />
    </group>
  );
};

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



// écran d'alerte et écran d'appel, dessinés comme le reste des téléphones
const ecranAlerte = (largeur = 380, hauteur = 780) => {
  const cv = document.createElement('canvas');
  cv.width = largeur; cv.height = hauteur;
  const g = cv.getContext('2d')!;
  g.fillStyle = '#141724'; g.fillRect(0, 0, largeur, hauteur);
  g.fillStyle = '#c0302a'; g.beginPath(); g.roundRect(18, 150, largeur - 36, 430, 30); g.fill();
  g.fillStyle = '#fff'; g.textAlign = 'center'; g.font = '800 34px sans-serif'; g.fillText('⚠ ALERTE EXTRÊME', largeur / 2, 215);
  g.font = '700 26px sans-serif'; g.fillText('FR-ALERT', largeur / 2, 255);
  g.textAlign = 'left'; g.font = '800 34px sans-serif';
  ['Ne remontez pas', 'à la surface.', '', 'Ne regardez pas', 'le ciel.'].forEach((l, i) => g.fillText(l, 44, 330 + i * 46));
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
  const etat = t < S.APPEL ? 'alerte' : t < S.COUPE ? 'appel' : t < S.COUPE + 3 ? 'fini' : 'alerte';
  const mat = useEcranMat(etat, () => (etat === 'alerte' ? ecranAlerte() : ecranAppel(etat === 'fini')));
  const leve = poidsTel(t);
  const sonne = (t < 2.5 || (t >= S.APPEL && t < S.DECROCHE)) ? Math.sin(t * 190) * 0.003 : 0;
  return (
    <group position={[0.07 + sonne - leve * 0.04, -0.27 + leve * 0.13, -0.33 + leve * 0.03]} rotation={[0.5 + leve * 0.25, -0.15 + leve * 0.1, 0.06]} scale={1.5}>
      <T g={G.capsule} c={C.manche} p={[0.035, -0.125, 0.03]} r={[-0.45, 0, 0.35]} s={[0.03, 0.075, 0.03]} />
      <T g={G.cylindre} c={'#e8e2d4'} p={[0.022, -0.085, 0.012]} r={[-0.45, 0, 0.35]} s={[0.031, 0.012, 0.031]} />
      <T g={G.sphere} c={C.peau2} p={[0.012, -0.04, -0.016]} s={[0.042, 0.05, 0.02]} />
      <Telephone mat={mat} />
      <T g={G.capsule} c={C.peau2} p={[-0.036, -0.032, 0.012]} r={[0.2, 0, -0.5]} s={[0.012, 0.024, 0.012]} />
      {[-0.034, -0.008, 0.018, 0.042].map((y, i) => (
        <T key={i} g={G.capsule} c={C.peau2} p={[0.041, y - 0.012, 0.006]} r={[0, 0, 0.25]} s={[0.0098, 0.012, 0.0098]} />
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
const STYLE_FEMME: Style = {peau: C.peau, haut: C.rouge, bas: '#34477a', chaussures: '#f4ece0', cheveux: '#2f1a12', coiffure: 'chignon', manteau: true};
const STYLE_HOMME: Style = {peau: '#e8b48a', haut: '#3b4256', bas: '#3b4256', chaussures: '#1d1d22', cheveux: '#5a4a3e', coiffure: 'court', costume: true};
const STYLE_ADO: Style = {peau: C.peau3, haut: '#5fae6e', bas: '#2d3340', chaussures: '#f2f2f2', cheveux: '#1d1410', coiffure: 'capuche', casque: true};
const TEL_LEVE: V3 = [-0.35, 0.12, -1.1];

const Scene: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const mains = useRef<THREE.Group>(null);
  const cam = poseCam(t).pos;
  const allume = lumiere(t);
  const matAlerte = useEcranMat('alerte', () => ecranAlerte());

  // la femme : figée sur son téléphone, lève les yeux vers toi par moments
  const regardeF = (t > 8 && t < 14) || (t > S.COUPE && t < 30) || (t > L.L10 - 0.5 && t < L.L11 + 0.5);
  const viseF = regardeF ? viser([FEMME_P[0], 1.34, FEMME_P[2]], cam, 0) : [0, 0.45];
  // l'ado : regarde son téléphone, toi quand il parle, puis le quai
  const viseA = t > L.L09 - 0.3 && t < L.L10 ? viser(ADO_TETE, QUAI, -0.55) : t > L.L12 - 0.2 ? viser(ADO_TETE, PORTE, -0.55)
    : (t > L.L02 - 0.2 && t < L.L02 + 3.2) ? viser(ADO_TETE, cam, -0.55) : [0.2, 0.4];
  // le costume
  const co = costumeEtat(t);
  const viseC = co.marche || t > S.ARRIVE_COSTUME ? [0, 0.05] : viser(co.tete, cam, co.rotY);
  const ouvre = fen(t, S.PORTES - 0.4, S.PORTES + 0.5, 0, 1, sortie);

  return (
    <>
      <color attach="background" args={['#120c0a']} />
      <ambientLight intensity={1.35 * allume} color={'#fff1dc'} />
      <hemisphereLight intensity={0.6 * allume} color={'#fff0d8'} groundColor={'#8a4a30'} />
      <directionalLight position={[0.8, 2.6, 4]} intensity={1.7 * allume} color={'#fff0d6'} />
      {ouvre > 0 ? <pointLight position={[-2.4, 1.3, -1.9]} intensity={6 * ouvre} distance={7} color={'#ffffff'} /> : null}
      <Rame t={t} />
      <Tunnel t={t} />

      <Perso p={FEMME_P} assis={1} torse={0.12} style={STYLE_FEMME} tete={viseF} bouche={0} cligne={cligne(t, 1)}
        brasD={TEL_LEVE} brasG={TEL_LEVE} telMain={<group rotation={[Math.PI / 2 - 0.1, Math.PI, 0]}><Telephone mat={matAlerte} /></group>} />
      <pointLight position={[0.3, 0.9, -0.72]} intensity={0.7} distance={0.9} color={'#ff8a80'} />

      <Perso p={ADO_P} rotY={-0.55} style={STYLE_ADO} tete={viseA} bouche={parle(['ADO'], t)} cligne={cligne(t, 3)}
        brasD={[-2.75, 0.25, -0.2]} brasG={TEL_LEVE} telMain={null} />

      <Perso p={co.p} rotY={co.rotY} marche={co.marche} phase={co.phase} style={STYLE_HOMME} tete={viseC} bouche={parle(['COSTUME'], t)} cligne={cligne(t, 2)}
        brasD={t > S.ARRIVE_COSTUME ? [-1.25, 0.1, -0.2] : [-0.1, 0.1, -0.3]} brasG={[-0.1, 0.1, -0.3]} />

      <group ref={mains}>
        <Mains t={t} />
      </group>
      <Rendu t={t} mains={mains} />
    </>
  );
};

// ================================================================== calques 2D
const Hud: React.FC = () => {
  const t = useCurrentFrame() / FPS;
  if (t >= S.VOTE) return null;
  const fini = t >= S.PORTES;
  const dernier = t >= S.TICS && !fini;
  const bat = dernier ? 1 + 0.06 * Math.max(0, Math.cos((t - S.TICS) * Math.PI * 2)) : 1;
  return (
    <div style={{position: 'absolute', top: 70, left: 54, fontFamily: BALOO, fontWeight: 800}}>
      <div style={{color: '#fffaf1', fontSize: 30, letterSpacing: 2, opacity: 0.9, WebkitTextStroke: '6px #24150f', paintOrder: 'stroke fill'}}>TERMINUS · SOUS TERRE</div>
      <div style={{color: fini ? '#ff5a4a' : '#fffaf1', fontSize: 108, lineHeight: 1, WebkitTextStroke: '14px #24150f', paintOrder: 'stroke fill', transform: `scale(${bat})`, transformOrigin: 'left center'}}>{hh(t)}</div>
      <div style={{display: 'inline-block', marginTop: 10, background: '#c0302a', color: '#fff', border: '6px solid #24150f', borderRadius: 18, padding: '4px 20px', fontSize: 40}}>
        {fini ? 'PORTES OUVERTES' : `PORTES DANS ${reste(t)}`}
      </div>
    </div>
  );
};

// l'alerte plein écran, sur tous les téléphones à la fois
const CarteAlerte: React.FC = () => {
  const t = useCurrentFrame() / FPS;
  const {fps} = useVideoConfig();
  if (t > S.CARTE_FIN + 0.4) return null;
  const s = spring({frame: t * fps, fps, config: {damping: 12, stiffness: 240}, from: 0.92, to: 1});
  const out = fen(t, S.CARTE_FIN, S.CARTE_FIN + 0.4, 0, 1, Easing.in(Easing.cubic));
  const clign = t < S.ALARME_FIN && t % 1 < 0.8 ? 1 : 0.85;
  return (
    <div style={{position: 'absolute', top: 400, left: 60, right: 60, transform: `scale(${s}) translateY(${out * -900}px)`, opacity: 1 - out,
      background: '#c0302a', border: '9px solid #24150f', borderRadius: 44, boxShadow: '0 18px 0 #24150f', padding: '30px 44px 40px', fontFamily: BALOO, color: '#fff', filter: `brightness(${clign})`}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 18, fontSize: 64, fontWeight: 800}}>⚠ ALERTE EXTRÊME</div>
      <div style={{fontSize: 34, fontWeight: 700, opacity: 0.85, marginTop: -6}}>FR-ALERT · maintenant</div>
      <div style={{fontSize: 76, lineHeight: 1.02, marginTop: 22, fontWeight: 800}}>Ne remontez pas à la surface.<br />Ne regardez pas le ciel.</div>
    </div>
  );
};

// la lumière blanche qui entre quand les portes s'ouvrent
const Blanc: React.FC = () => {
  const t = useCurrentFrame() / FPS;
  const k = fen(t, S.PORTES, S.PORTES + 0.6, 0, 0.92, sortie) * (1 - fen(t, S.VOTE - 0.3, S.VOTE + 0.4, 0, 0.6));
  return k > 0 ? <AbsoluteFill style={{background: '#ffffff', opacity: k}} /> : null;
};

const COULEURS: Record<string, string> = {NAEL: '#ffffff', ADO: '#9ff0a8', COSTUME: '#8fd3ff', MAMAN: '#ff9fbf', ALERTE: '#ffffff', ANNONCE: '#ffffff'};
const ETIQUETTE: Record<string, string> = {ALERTE: 'TOUS LES TÉLÉPHONES', ANNONCE: 'HAUT-PARLEUR', MAMAN: 'MAMAN · AU TÉLÉPHONE'};
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
    <div style={{position: 'absolute', top: l.perso === 'ALERTE' ? 1230 : 1160, width: '100%', textAlign: 'center', fontFamily: BALOO, fontWeight: 800}}>
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
        textShadow: '0 10px 0 #24150f', transform: `scale(${(0.6 + 0.4 * k(0.15)) * pulse})`}}>Tu sors, ou tu restes dans la rame&nbsp;?</div>
      <div style={{display: 'flex', flexDirection: 'column', gap: 34, marginTop: 30}}>
        {carte('A', 'Je sors', '#ffd23f', k(0.7), -1)}
        {carte('B', 'Je reste', '#fffaf1', k(1.1), 1)}
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
        <Audio src={staticFile(l.fichier)} volume={l.perso === 'ANNONCE' ? 0.8 : 1} />
      </Sequence>
    ))}
    {/* image 1 : tous les téléphones hurlent */}
    <Son a={0} src="alerte" v={0.5} d={S.ALARME_FIN} fondu={[0.01, 0.6]} boucle />
    <Son a={0} src="impact" v={0.6} />
    <Son a={0} src="roulement" v={0.4} d={S.ARRET + 0.3} fondu={[0.01, 1.6]} boucle />
    <Son a={S.ARRET - 2.2} src="frein" v={0.5} />
    {[5.9, 9.7, S.APPEL - 0.1, L.L07 + 0.3, L.L09 - 0.2, L.L11 + 0.4].map((a) => <Son key={a} a={a} src="whoosh" v={0.22} />)}
    <Son a={S.APPEL} src="vibre" v={0.6} />
    <Son a={S.APPEL + 0.4} src="vibre" v={0.6} />
    <Son a={S.COUPE} src="raccroche" v={0.5} />
    <Son a={S.COUPE + 0.05} src="gresille" v={0.35} />
    <Son a={L.L07 - 0.6} src="ding" v={0.4} />
    {TICS.map((a) => <Son key={a} a={a} src="tic" v={0.55} />)}
    <Son a={S.PORTES - 0.5} src="porte" v={0.85} />
    <Son a={S.PORTES} src="impact" v={0.85} />
    {/* musique : nappe, coupée 2 s avant le décompte final, battements sur les 10 dernières secondes */}
    <Son a={1.0} src="drone" v={0.24} d={S.TICS - 2 - 1.0} boucle fondu={[2.0, 0.4]} />
    <Son a={S.TICS} src="battement" v={0.5} d={S.PORTES - S.TICS} boucle fondu={[0.6, 0.05]} />
    <Son a={S.PORTES - 2.2} src="montee" v={0.32} />
    <Son a={S.VOTE} src="impact" v={0.75} />
    <Son a={S.VOTE + 0.7} src="pop" v={0.45} />
    <Son a={S.VOTE + 1.1} src="pop" v={0.45} />
    <Son a={S.VOTE + 3.05} src="pop" v={0.6} />
    <Son a={S.VOTE + 0.2} src="drone" v={0.18} d={T_FIN - S.VOTE - 0.2} fondu={[0.5, 1.2]} />
  </>
);

export const AlerteExtreme01: React.FC = () => {
  const {width, height} = useVideoConfig();
  const t = useCurrentFrame() / FPS;
  const flouVote = fen(t, S.VOTE, S.VOTE + 0.4, 0, 9);
  return (
    <AbsoluteFill style={{backgroundColor: C.coin}}>
      <AbsoluteFill style={{filter: flouVote > 0 ? `blur(${flouVote}px)` : undefined}}>
        <ThreeCanvas width={width} height={height} gl={{antialias: true, toneMapping: THREE.NoToneMapping}} flat camera={{fov: 108, near: 0.02, far: 90}}>
          <Scene />
        </ThreeCanvas>
        <Blanc />
      </AbsoluteFill>
      <Hud />
      <CarteAlerte />
      <SousTitres />
      <Vote />
      <BandeSon />
    </AbsoluteFill>
  );
};
