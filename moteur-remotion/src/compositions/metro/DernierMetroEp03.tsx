// @ts-nocheck — scène 3D écrite en JSX three (types R3F trop verbeux pour un épisode).
import {loadFont as chargerBaloo} from '@remotion/google-fonts/Baloo2';
import {noise2D} from '@remotion/noise';
import {ThreeCanvas} from '@remotion/three';
import {useFrame, useThree} from '@react-three/fiber';
import React, {useMemo, useRef} from 'react';
import {AbsoluteFill, Audio, Easing, Img, interpolate, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import * as THREE from 'three';
import {mergeVertices} from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import voix from './ep03_voix.json';

/**
 * DERNIER MÉTRO — Partie 3 (le public a choisi B : « je lis son téléphone »). Même moteur, ~62 s, vote à la fin.
 * Le métro roule sans s'arrêter ; elle part vers l'avant, oublie son téléphone ; tu lis ; elle est déjà revenue.
 * Tout est fonction du temps t (secondes) : aucune animation n'a d'état propre.
 */
const FPS = 30;
const T_FIN = 62.6;
export const DUREE_METRO_EP03 = Math.round(T_FIN * FPS);
const {fontFamily: BALOO} = chargerBaloo('normal', {weights: ['700', '800'], subsets: ['latin']});

// ================================================================== chronologie (s)
const L: Record<string, number> = {
  L01: 3.2, L02: 6.9, L03: 13.6, L04: 17.3, L05: 21.0, L06: 25.2, L07: 33.1, L08: 35.9,
  L09: 38.3, L10: 40.9, L11: 44.3, L12: 50.1,
};
const S = {
  RAPPEL_FIN: 2.6, DEBOUT: 3.4, DEBOUT_FIN: 4.2, POSE: 5.0, POSE_FIN: 5.7, TOURNE: 8.9, MARCHE: 9.3, MARCHE_FIN: 15.0,
  PARTIE: 15.2, OUVRE: 15.8, H_CINQ: 17.0, STATION: 20.8, STATION_FIN: 23.6, H_MOI: 24.8, H_AVANT: 28.8,
  NOUV: 30.6, RETOUR: 31.8, FERME: 32.0, MAIN: 44.1, M8: 46.7, CLIGNE: 48.9, VOTE: 53.0,
};
// tout le fil des parties 1 et 2 reste dans ton téléphone
const ANCIENS = ['Ne parle pas à la femme en rouge.', 'Compte les passagers.', 'Vous étiez cinq au départ.', "Ne sors pas. Il n'est pas parti seul.",
  "Elle t'a menti.", 'Regarde à ses pieds.', 'Recompte.'];
const MESSAGES: [number, string][] = [[S.M8, 'COURS. Dernière voiture.']];
// sa conversation à elle, celle que tu lis en douce
const CONVO: {de: 'lui' | 'elle'; txt: string; h?: number; a?: number}[] = [
  {de: 'lui', txt: 'Combien ce soir ?'},
  {de: 'elle', txt: 'Cinq.', h: S.H_CINQ},
  {de: 'elle', txt: 'Le monsieur est descendu.'},
  {de: 'elle', txt: 'Le petit aussi.'},
  {de: 'elle', txt: 'Il est avec moi.', h: S.H_MOI},
  {de: 'lui', txt: "Amène-le à l'avant.", h: S.H_AVANT},
  {de: 'lui', txt: 'Il lit ton téléphone.', a: S.NOUV},
];
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
const ligne = (id: string) => LIGNES.find((l) => l.id === id)!;

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const fen = (t: number, a: number, b: number, de = 0, vers = 1, easing?: (x: number) => number) =>
  b <= a ? (t < a ? de : vers) : interpolate(t, [a, b], [de, vers], {...clamp, easing});
const doux = Easing.inOut(Easing.cubic);
const sortie = Easing.out(Easing.cubic);
type V3 = [number, number, number];
const mixv = (a: number[], b: number[], k: number) => a.map((x, i) => x + (b[i] - x) * k) as V3;

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

// ================================================================== lumière de la rame
// rame allumée tout du long ; un raté au retour de la femme, puis des clignotements par salves sur la fin
const lumiere = (t: number) => {
  if (t >= S.FERME && t < S.FERME + 0.3) return [1, 0, 1, 0, 0, 1][Math.floor((t - S.FERME) * 20) % 6];
  if (t >= S.CLIGNE && t < S.VOTE) {
    const u = (t - S.CLIGNE) % 1.7;
    if (u < 0.35) return [0, 1, 0, 0, 1, 1, 0][Math.floor(u * 20) % 7];
  }
  return 1;
};
const secours = (_t: number) => 0;
// le métro roule déjà à pleine vitesse (fin de la partie 2) et ne s'arrête plus
const distance = (t: number) => 60 + 14 * t;
const roule = (_t: number) => true;
const station = (t: number) => t > S.STATION && t < S.STATION_FIN;

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
const RETOUR_P: V3 = [0.2, 0, -0.08]; // revenue sans bruit, penchée sur toi
const femmeEtat = (t: number) => {
  // 1) assise penchée (fin de la partie 2) → 2) se lève, pose son téléphone sur la banquette → 3) part vers l'avant
  // 4) invisible pendant que tu lis → 5) juste devant toi
  if (t >= S.RETOUR) {
    const penche = 0.32 + fen(t, L.L10 - 0.2, L.L10 + 0.6, 0, 0.12, doux) - fen(t, S.MAIN, S.MAIN + 0.5, 0, 0.1, doux);
    const p = RETOUR_P;
    return {p, rotY: 0, assis: 0, penche, marche: 0, phase: 0, visible: true, tete: [p[0], 1.66 - penche * 0.2, p[2] + 0.05 + penche * 0.45] as V3};
  }
  const debout = fen(t, S.DEBOUT, S.DEBOUT_FIN, 0, 1, doux);
  const assis = 1 - debout;
  const avance = fen(t, S.MARCHE, S.MARCHE_FIN, 0, 1, (x) => x);
  const x = FEMME_P[0] + (-6.9 - FEMME_P[0]) * avance;
  const z = FEMME_P[2] + debout * 0.3 + fen(t, S.MARCHE, S.MARCHE + 1.2, 0, 0.6, doux);
  const rotY = fen(t, S.TOURNE, S.TOURNE + 0.5, 0, -Math.PI / 2, doux);
  const pose = fen(t, S.POSE, S.POSE + 0.35, 0, 1, doux) * (1 - fen(t, S.POSE_FIN - 0.2, S.POSE_FIN + 0.2, 0, 1, doux));
  const penche = assis * 0.2 + debout * 0.05 + pose * 0.55;
  const marche = t > S.MARCHE && t < S.MARCHE_FIN ? 1 : 0;
  const hY = 0.86 + (0.5 - 0.86) * assis + 0.66 + 0.14 - penche * 0.2;
  return {p: [x, 0, z] as V3, rotY, assis, penche, marche, phase: (t - S.MARCHE) * 8.5, visible: t < S.PARTIE,
    tete: [x, hY, z + 0.05 + penche * 0.45] as V3};
};
const TEL_F: V3 = [-0.32, 0.535, -1.06]; // son téléphone oublié sur la banquette
const ADO_P: V3 = [1.85, 0, -0.32];
const LAMPE_P: V3 = [0.42, 0.06, -0.62]; // la lampe du costume, toujours allumée à ses pieds

// ================================================================== caméra subjective
const SIEGE: V3 = [0.18, 1.18, 0.92];
const CIBLES: Record<string, (t: number) => V3> = {
  TEL: () => [0.24, 0.5, 0.5],
  FEMME: (t) => femmeEtat(t).tete,
  TEL_F: () => TEL_F,
};
const CLES: [number, string, number][] = [
  [0, 'FEMME', 0], [12.9, 'TEL_F', 0.6], [S.RETOUR, 'FEMME', 0.22],
  [S.M8 - 0.2, 'TEL', 0.3], [S.M8 + 2.4, 'FEMME', 0.35],
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
  // partie 2 finie poussée vers elle ; on recule, puis on se penche sur son téléphone ; on se rejette en arrière quand elle est là
  const penche = fen(t, 12.9, 13.6, 0, 1, doux) * (1 - fen(t, S.RETOUR - 0.1, S.RETOUR + 0.15, 0, 1, sortie));
  const avance = 0.13 * (1 - fen(t, 3.0, 4.2, 0, 1, doux)) + penche * 0.24 - fen(t, S.RETOUR, S.RETOUR + 0.3, 0, 0.08, sortie)
    + fen(t, S.CLIGNE, S.VOTE, 0, 0.12, doux);
  const roule = 1;
  const choc = t >= S.RETOUR && t < S.RETOUR + 0.6 ? Math.exp(-(t - S.RETOUR) * 9) : 0;
  const pos: V3 = [SIEGE[0] + noise2D('px', t * 0.6, 0) * 0.01, SIEGE[1] + roule * Math.sin(t * 40) * 0.003 - penche * 0.12 + choc * 0.03, SIEGE[2] - avance];
  const c = cibleA(t);
  const tremble = 0.03 + (t > L.L10 ? 0.025 : 0);
  const cible: V3 = [c[0] + noise2D('cx', t * 1.1, 0) * tremble, c[1] + noise2D('cy', t * 1.1, 1) * tremble - choc * 0.12, c[2]];
  const roulis = noise2D('r', t * 0.8, 2) * 0.025 + roule * Math.sin(t * 13) * 0.004;
  return {pos, cible, roulis};
};
const dirCam = (t: number) => {
  const {pos, cible} = poseCam(t);
  const d = new THREE.Vector3(cible[0] - pos[0], cible[1] - pos[1], cible[2] - pos[2]).normalize();
  return {lacet: Math.atan2(d.x, -d.z), tangage: Math.asin(d.y)};
};

// ================================================================== décor
const OUVERT_PORTE = (_t: number) => 0; // portes fermées : on roule
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
const Tunnel: React.FC<{t: number}> = ({t}) => {
  const d = distance(t);
  const pas = 4.5;
  const n = 15;
  const lampes = Array.from({length: n}, (_, i) => ((((i * pas - d) % (pas * n)) + pas * n) % (pas * n)) - (pas * n) / 2);
  const enStation = station(t);
  const piliers = Array.from({length: 26}, (_, i) => ((((i * 3.2 - d) % (3.2 * 26)) + 3.2 * 26) % (3.2 * 26)) - 3.2 * 13);
  return (
    <group>
      {/* station traversée sans s'arrêter : un quai éclairé qui défile, piliers sombres en stroboscope */}
      {enStation
        ? [-1, 1].map((cote) => (
          <group key={`q${cote}`}>
            <mesh position={[0, 1.15, cote * 2.36]} geometry={G.boite} scale={[80, 2.6, 0.05]} material={plat('#f4e7c8')} />
            <mesh position={[0, 1.95, cote * 2.33]} geometry={G.boite} scale={[80, 0.22, 0.03]} material={plat('#2d5f9a')} />
            {piliers.map((x, i) => <mesh key={i} position={[x, 1.15, cote * 2.3]} geometry={G.boite} scale={[0.45, 2.6, 0.05]} material={plat('#3b2a22')} />)}
          </group>
        ))
        : null}
      {[-1, 1].map((cote) => (
        <group key={cote}>
          <mesh position={[0, 1.0, cote * 2.5]} geometry={G.boite} scale={[80, 4.5, 0.1]} material={toon(C.tunnel)} />
          {lampes.map((x, i) => (
            <mesh key={i} position={[x, 1.7, cote * 2.43]} geometry={G.boite} scale={[0.9, 0.08, 0.04]} material={plat('#ffcf7a')} />
          ))}
          {[1.25, 1.36].map((y) => <mesh key={y} position={[0, y, cote * 2.43]} geometry={G.boite} scale={[80, 0.03, 0.03]} material={plat('#1b100c')} />)}
        </group>
      ))}
      <mesh position={[0, -0.82, -1.95]} geometry={G.boite} scale={[80, 0.06, 1.0]} material={toon(C.ballast)} />
      {Array.from({length: 40}, (_, i) => -20 + i).map((x) => (
        <mesh key={x} position={[x, -0.78, -1.95]} geometry={G.boite} scale={[0.22, 0.04, 0.95]} material={toon('#4a382c')} />
      ))}
      {[-1.7, -2.2].map((z) => <T key={z} g={G.boite} c={C.rail} p={[0, -0.74, z]} s={[80, 0.05, 0.05]} />)}
      <mesh position={[-14, 0.8, -2.3]} geometry={G.sphere} scale={[0.05, 0.05, 0.05]} material={plat('#ff3b2a')} />
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

// ================================================================== mains (accrochées à la caméra)
const Mains: React.FC<{t: number}> = ({t}) => {
  const recus = [...ANCIENS, ...MESSAGES.filter(([a]) => t >= a + 0.25).map(([, m]) => m)];
  const mat = useEcranMat(`n${recus.length}`, () => ecranTel(recus, 'Numéro inconnu'));
  const leve = poidsTel(t);
  const vibre = MESSAGES.some(([a]) => t >= a && t < a + 0.5) ? Math.sin(t * 190) * 0.003 : 0;
  // quand on se penche sur son téléphone à elle, le nôtre descend hors champ
  const baisse = fen(t, 12.9, 13.5, 0, 1, doux) * (1 - fen(t, S.RETOUR, S.RETOUR + 0.4, 0, 1, sortie));
  return (
    <group position={[0.07 + vibre - leve * 0.04, -0.27 + leve * 0.13 - baisse * 0.12, -0.33 + leve * 0.03]}
      rotation={[0.5 + leve * 0.25 - baisse * 0.3, -0.15 + leve * 0.1, 0.06]} scale={1.5}>
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

const Scene: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const mains = useRef<THREE.Group>(null);
  const cam = poseCam(t).pos;
  const allume = lumiere(t);
  const strobe = station(t) ? Math.max(0, Math.sin(t * 38)) : 0;

  // la femme
  const fe = femmeEtat(t);
  const pose = fen(t, S.POSE, S.POSE + 0.35, 0, 1, doux) * (1 - fen(t, S.POSE_FIN - 0.2, S.POSE_FIN + 0.2, 0, 1, doux));
  const viseF: [number, number] = fe.marche ? [0, 0.05] : pose > 0.3 ? viser(fe.tete, TEL_F, fe.rotY) : viser(fe.tete, cam, fe.rotY);
  const tenu = t < S.POSE + 0.35; // son téléphone dans sa main, puis sur la banquette
  const MAIN_TEL: V3 = [-0.35, 0.12, -1.1], DROIT: V3 = [-0.12, 0.1, -0.3], BAS: V3 = [-0.25, 0.4, -0.15], TEND: V3 = [-1.45, 0.05, -0.12];
  let brasD: V3, brasG: V3;
  if (t >= S.RETOUR) {
    brasD = mixv(DROIT, TEND, fen(t, S.MAIN, S.MAIN + 0.5, 0, 1, sortie));
    brasG = DROIT;
  } else if (fe.marche) {
    brasD = [0, 0.08, -0.2]; brasG = [0, 0.08, -0.2];
  } else {
    const seLeve = fen(t, S.DEBOUT, S.DEBOUT_FIN, 0, 1, doux);
    const base = t < S.POSE ? mixv(MAIN_TEL, mixv(MAIN_TEL, DROIT, 0.3), seLeve) : DROIT;
    brasD = mixv(base, BAS, pose);
    brasG = mixv(MAIN_TEL, DROIT, seLeve);
  }
  const sourire = t >= S.RETOUR ? fen(t, L.L09, L.L09 + 0.6, 0, 0.3) + fen(t, L.L10, L.L10 + 0.5, 0, 0.25) : 0.2 * (1 - fen(t, S.DEBOUT, S.DEBOUT_FIN));
  const matTelF = useEcranMat('femme3', () => ecranTel(['Il est avec moi.', "Amène-le à l'avant."], 'Conducteur'));

  return (
    <>
      <color attach="background" args={['#120c0a']} />
      <ambientLight intensity={1.35 * allume + 0.35 + 0.9 * strobe} color={'#fff1dc'} />
      <hemisphereLight intensity={0.6 * allume + 0.1} color={'#fff0d8'} groundColor={'#8a4a30'} />
      <directionalLight position={[0.8, 2.6, 4]} intensity={1.7 * allume + 0.2} color={'#fff0d6'} />
      <Rame t={t} />
      <Tunnel t={t} />

      <Perso p={fe.p} rotY={fe.rotY} assis={fe.assis} torse={fe.penche} marche={fe.marche} phase={fe.phase} style={STYLE_FEMME}
        visible={fe.visible} tete={viseF} bouche={parle(['FEMME'], t)} cligne={cligne(t, 1)} sourire={sourire}
        brasD={brasD} brasG={brasG}
        telMain={tenu ? <group rotation={[Math.PI / 2 - 0.1, Math.PI, 0]}><Telephone mat={matTelF} /></group> : null} />

      {/* son téléphone, oublié sur la banquette, écran allumé */}
      <group visible={!tenu} position={TEL_F} rotation={[-Math.PI / 2, 0, 0.5]}>
        <Telephone mat={matTelF} echelle={1.15} />
      </group>
      {!tenu && t < S.RETOUR + 1 ? <pointLight position={[TEL_F[0], TEL_F[1] + 0.2, TEL_F[2]]} intensity={0.8} distance={0.9} color={'#9fc4ff'} /> : null}

      {/* ce qu'il reste de l'ado : son casque par terre */}
      <group position={[ADO_P[0] - 0.72, 0.03, ADO_P[2] + 0.36]} rotation={[-Math.PI / 2, 0, 0.7]} scale={1.15}>
        <T g={G.tore} c={'#22262e'} s={[0.17, 0.17, 0.17]} />
        <T g={G.cylindre} c={'#f0573a'} p={[-0.165, 0, 0]} s={[0.06, 0.04, 0.06]} />
        <T g={G.cylindre} c={'#f0573a'} p={[0.165, 0, 0]} s={[0.06, 0.04, 0.06]} />
      </group>

      {/* la lampe du costume, toujours allumée par terre */}
      <group position={LAMPE_P} rotation={[0, 0, Math.PI / 2 - 0.15]}>
        <T g={G.cylindre} c={'#2a2a30'} s={[0.028, 0.2, 0.028]} />
        <T g={G.cylindre} c={'#3a3a42'} p={[0, 0.12, 0]} s={[0.042, 0.05, 0.042]} />
        <mesh position={[0, 0.147, 0]} geometry={G.cylindre} scale={[0.036, 0.004, 0.036]} material={plat('#ffffff')} />
        <pointLight position={[0, 0.25, 0]} intensity={0.6} distance={1.2} color={'#ffe2a8'} />
      </group>
      <mesh position={[LAMPE_P[0] - 0.32, 0.012, LAMPE_P[2] + 0.02]} rotation={[-Math.PI / 2, 0, 0]}
        geometry={G.sphere} scale={[0.26, 0.13, 0.002]} material={plat('#ffe7b8')} />

      <group ref={mains}>
        <Mains t={t} />
      </group>
      <Rendu t={t} mains={mains} />
    </>
  );
};

// ================================================================== calques 2D
const Notification: React.FC = () => {
  const t = useCurrentFrame() / FPS;
  const {fps} = useVideoConfig();
  const actif = [...MESSAGES].reverse().find(([a]) => t >= a && t < a + 2.9);
  if (!actif || t >= S.VOTE) return null;
  const [a, m] = actif;
  const s = spring({frame: (t - a) * fps, fps, config: {damping: 14, stiffness: 190}});
  const out = fen(t, a + 2.6, a + 2.9);
  return (
    <div style={{position: 'absolute', top: 120, left: 54, right: 54, transform: `translateY(${(1 - s) * -280 - out * 280}px)`,
      background: '#fffaf1', borderRadius: 40, padding: '26px 36px 30px', boxShadow: '0 16px 0 #24150f', border: '7px solid #24150f',
      fontFamily: BALOO, color: '#24150f'}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 16, fontSize: 36, fontWeight: 800}}>
        <div style={{width: 46, height: 46, borderRadius: 23, background: '#e2702c', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 34}}>?</div>
        Numéro inconnu<span style={{marginLeft: 'auto', fontSize: 30, opacity: 0.5, fontWeight: 700}}>maintenant</span>
      </div>
      <div style={{fontSize: 60, lineHeight: 1.05, marginTop: 10, fontWeight: 800}}>{m}</div>
    </div>
  );
};

// son téléphone à elle, tenu devant toi : la conversation avec « Conducteur »
const TelFemme: React.FC = () => {
  const t = useCurrentFrame() / FPS;
  const {fps} = useVideoConfig();
  if (t < S.OUVRE || t > S.FERME + 0.3) return null;
  const s = spring({frame: (t - S.OUVRE) * fps, fps, config: {damping: 16, stiffness: 120}});
  const out = fen(t, S.FERME - 0.08, S.FERME + 0.22, 0, 1, Easing.in(Easing.cubic));
  const strobe = station(t) ? Math.max(0, Math.sin(t * 38)) : 0;
  const nouv = t >= S.NOUV ? spring({frame: (t - S.NOUV) * fps, fps, config: {damping: 9, stiffness: 260}}) : 0;
  const tremble = t >= S.NOUV ? Math.sin(t * 95) * 4 * (1 - fen(t, S.NOUV, S.NOUV + 0.6)) : 0;
  return (
    <div style={{position: 'absolute', top: 160, left: 175, width: 730, height: 950, transform: `translate(${tremble}px, ${(1 - s) * 1500 + out * 1700}px) rotate(${-2 + out * 8}deg)`,
      background: '#141724', border: '12px solid #24150f', borderRadius: 74, boxShadow: '0 22px 0 #24150f', overflow: 'hidden', fontFamily: BALOO,
      filter: `brightness(${1 + 0.3 * strobe})`, display: 'flex', flexDirection: 'column'}}>
      <div style={{display: 'flex', justifyContent: 'space-between', color: '#fff', fontSize: 30, fontWeight: 700, padding: '20px 44px 6px'}}>
        <span>23:58</span><span>Pas de service</span>
      </div>
      <div style={{display: 'flex', alignItems: 'center', gap: 20, padding: '14px 32px 20px', background: '#232842', borderBottom: '3px solid #0c0e18'}}>
        <div style={{width: 76, height: 76, borderRadius: 38, background: '#5a1f1a', color: '#ffd9c2', fontSize: 46, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>C</div>
        <div style={{display: 'flex', flexDirection: 'column'}}>
          <span style={{color: '#fff', fontSize: 46, fontWeight: 800, lineHeight: 1}}>Conducteur</span>
          <span style={{color: '#7fd18b', fontSize: 28, fontWeight: 700}}>en ligne</span>
        </div>
      </div>
      <div style={{flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: 18, padding: '20px 30px 34px'}}>
        {CONVO.filter((m) => !m.a || t >= m.a).map((m, i) => {
          const elle = m.de === 'elle';
          const h = m.h && t >= m.h ? spring({frame: (t - m.h) * fps, fps, config: {damping: 8, stiffness: 220}}) : 0;
          const neuf = m.a ? nouv : 1;
          return (
            <div key={i} style={{alignSelf: elle ? 'flex-end' : 'flex-start', maxWidth: '78%', background: m.a ? '#c0302a' : elle ? '#e2702c' : '#3a3f5c',
              color: '#fff', fontSize: 46, fontWeight: 800, lineHeight: 1.05, padding: '16px 28px', borderRadius: 34,
              borderBottomRightRadius: elle ? 8 : 34, borderBottomLeftRadius: elle ? 34 : 8,
              outline: h > 0.01 ? `${7 * h}px solid #ffd23f` : 'none', outlineOffset: 4,
              transform: `scale(${(m.a ? neuf : 1) * (1 + 0.1 * h * Math.exp(-(t - (m.h ?? 0)) * 3))})`, transformOrigin: elle ? 'right center' : 'left center'}}>
              {m.txt}
            </div>
          );
        })}
      </div>
    </div>
  );
};
// le quai éclairé qui défile : un stroboscope léger sur toute l'image
const Strobe: React.FC = () => {
  const t = useCurrentFrame() / FPS;
  if (!station(t)) return null;
  return <AbsoluteFill style={{background: '#fff6e0', opacity: 0.16 * Math.max(0, Math.sin(t * 38)), pointerEvents: 'none'}} />;
};

// ouverture : le résultat du vote de la partie 2, sur la dernière image de la partie 2
const Rappel: React.FC = () => {
  const t = useCurrentFrame() / FPS;
  const {fps} = useVideoConfig();
  if (t > S.RAPPEL_FIN + 0.4) return null;
  const k = (d: number) => spring({frame: (t - d) * fps, fps, config: {damping: 13, stiffness: 170}});
  const out = fen(t, S.RAPPEL_FIN, S.RAPPEL_FIN + 0.4);
  return (
    <AbsoluteFill style={{background: `rgba(14,10,8,${0.55 * (1 - out)})`, fontFamily: BALOO, fontWeight: 800, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 34, opacity: 1 - out}}>
      <div style={{background: '#e2702c', color: '#fff', borderRadius: 30, padding: '8px 34px', fontSize: 50, border: '6px solid #24150f', transform: `scale(${k(0)})`}}>PARTIE 3</div>
      <div style={{color: '#fff', fontSize: 84, WebkitTextStroke: '13px #24150f', paintOrder: 'stroke fill', textShadow: '0 10px 0 #24150f', transform: `scale(${0.6 + 0.4 * k(0.15)})`}}>Vous avez choisi</div>
      <div style={{transform: `scale(${k(0.45)}) rotate(-2deg)`, background: '#fffaf1', border: '8px solid #24150f', borderRadius: 40, boxShadow: '0 16px 0 #24150f',
        padding: '26px 40px', display: 'flex', alignItems: 'center', gap: 28}}>
        <div style={{width: 120, height: 120, borderRadius: 60, background: '#24150f', color: '#fffaf1', fontSize: 92, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>B</div>
        <div style={{fontSize: 66, color: '#24150f'}}>Je lis son téléphone</div>
        <div style={{fontSize: 80, color: '#2f9e57'}}>✓</div>
      </div>
    </AbsoluteFill>
  );
};

const COULEURS: Record<string, string> = {NAEL: '#ffffff', FEMME: '#ffd23f', ANNONCE: '#ffffff'};
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
  const annonce = l.perso === 'ANNONCE';
  const lecture = t > S.OUVRE && t < S.FERME; // pendant qu'on lit son téléphone, les sous-titres passent sous l'écran
  return (
    <div style={{position: 'absolute', top: annonce ? (lecture ? 1150 : 360) : lecture ? 1190 : 1160, width: '100%', textAlign: 'center', fontFamily: BALOO, fontWeight: 800}}>
      {annonce ? (
        <div style={{display: 'inline-block', background: '#24150f', color: '#ffd27a', borderRadius: 18, padding: '6px 22px', fontSize: 34, marginBottom: 14}}>HAUT-PARLEUR</div>
      ) : null}
      <div style={{fontSize: annonce ? 92 : 118, color: COULEURS[l.perso], transform: `scale(${0.55 + 0.45 * s})`,
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
    <AbsoluteFill style={{background: 'rgba(14,10,8,0.62)', fontFamily: BALOO, fontWeight: 800, padding: '200px 64px 0', display: 'flex', flexDirection: 'column', gap: 40}}>
      <div style={{alignSelf: 'center', background: '#e2702c', color: '#fff', borderRadius: 30, padding: '8px 34px', fontSize: 44, transform: `scale(${k(0)})`, border: '6px solid #24150f'}}>PARTIE 3</div>
      <div style={{fontSize: 90, lineHeight: 1.0, color: '#fff', textAlign: 'center', WebkitTextStroke: '14px #24150f', paintOrder: 'stroke fill',
        textShadow: '0 10px 0 #24150f', transform: `scale(${(0.6 + 0.4 * k(0.15)) * pulse})`}}>Tu lui donnes ton téléphone, ou tu cours vers la dernière voiture&nbsp;?</div>
      <div style={{display: 'flex', flexDirection: 'column', gap: 34, marginTop: 24}}>
        {carte('A', 'Je lui donne', '#ffd23f', k(0.7), -1)}
        {carte('B', 'Je cours', '#fffaf1', k(1.1), 1)}
      </div>
      <div style={{textAlign: 'center', color: '#fff', fontSize: 56, marginTop: 26, opacity: k(1.8), WebkitTextStroke: '10px #24150f', paintOrder: 'stroke fill'}}>
        Écris A ou B en commentaire
      </div>
      <div style={{textAlign: 'center', color: '#ffd27a', fontSize: 46, opacity: k(2.3)}}>La partie 4 sera la dernière</div>
      <div style={{alignSelf: 'center', marginTop: 30, display: 'flex', alignItems: 'center', gap: 26, transform: `translateY(${(1 - k(3.0)) * 500}px) scale(${1 + 0.04 * Math.max(0, Math.sin((t - S.VOTE - 3.4) * 7))})`}}>
        <Img src={staticFile('metro/avatar.png')} style={{width: 150, height: 150, borderRadius: 75, border: '7px solid #24150f', boxShadow: '0 10px 0 #24150f'}} />
        <div style={{display: 'flex', flexDirection: 'column', gap: 10}}>
          <div style={{background: '#fe2c55', color: '#fff', borderRadius: 26, padding: '10px 34px', fontSize: 58, border: '7px solid #24150f', boxShadow: '0 10px 0 #24150f'}}>+ Abonne-toi</div>
          <div style={{color: '#fff', fontSize: 40, WebkitTextStroke: '8px #24150f', paintOrder: 'stroke fill'}}>pour voir la fin</div>
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
const SALVES = Array.from({length: 3}, (_, i) => S.CLIGNE + i * 1.7).filter((a) => a < S.VOTE);
const BandeSon: React.FC = () => (
  <>
    {LIGNES.map((l) => (
      <Sequence key={l.id} from={fr(l.debut)} layout="none">
        <Audio src={staticFile(l.fichier)} volume={l.perso === 'ANNONCE' ? 0.8 : 1} />
      </Sequence>
    ))}
    <Son a={0.02} src="impact" v={0.55} />
    <Son a={0.5} src="pop" v={0.45} />
    {/* le métro roule tout l'épisode */}
    <Son a={0} src="roulement" v={0.42} d={S.VOTE + 0.5} boucle fondu={[0.01, 1.0]} />
    {[12.9, S.STATION, S.STATION + 1.3, S.STATION_FIN - 0.3, S.M8 - 0.2].map((a) => <Son key={a} a={a} src="whoosh" v={a === 12.9 || a === S.M8 - 0.2 ? 0.22 : 0.5} />)}
    <Son a={S.OUVRE} src="pop" v={0.3} />
    {[S.H_CINQ, S.H_MOI, S.H_AVANT].map((a) => <Son key={a} a={a} src="clic" v={0.45} />)}
    {/* son téléphone à elle vibre dans tes mains */}
    <Son a={S.NOUV} src="vibre" v={0.65} />
    <Son a={S.NOUV + 0.05} src="ding" v={0.4} />
    {/* elle est là */}
    <Son a={S.RETOUR - 0.05} src="whoosh" v={0.4} />
    <Son a={S.RETOUR} src="impact" v={0.9} />
    <Son a={S.FERME} src="gresille" v={0.3} />
    {MESSAGES.map(([a]) => (
      <React.Fragment key={a}>
        <Son a={a} src="vibre" v={0.55} />
        <Son a={a + 0.05} src="ding" v={0.32} />
      </React.Fragment>
    ))}
    {SALVES.map((a) => <Son key={a} a={a} src="gresille" v={0.3} />)}
    {/* musique : nappe coupée plus de 2 s avant le message qui la trahit, reprise à son retour */}
    <Son a={0.3} src="drone" v={0.24} d={S.H_AVANT - 0.6 - 0.3} boucle fondu={[2.0, 0.4]} />
    <Son a={S.RETOUR + 0.4} src="drone" v={0.26} d={S.VOTE - S.RETOUR - 0.4} boucle fondu={[0.8, 0.3]} />
    <Son a={L.L10 - 0.3} src="battement" v={0.5} d={S.VOTE - L.L10 + 0.3} boucle fondu={[1.0, 0.1]} />
    <Son a={S.VOTE - 2.2} src="montee" v={0.32} />
    <Son a={S.VOTE} src="impact" v={0.75} />
    <Son a={S.VOTE + 0.7} src="pop" v={0.45} />
    <Son a={S.VOTE + 1.1} src="pop" v={0.45} />
    <Son a={S.VOTE + 3.05} src="pop" v={0.6} />
    <Son a={S.VOTE + 0.2} src="drone" v={0.18} d={T_FIN - S.VOTE - 0.2} fondu={[0.5, 1.2]} />
  </>
);

export const DernierMetroEp03: React.FC = () => {
  const {width, height} = useVideoConfig();
  const t = useCurrentFrame() / FPS;
  const flouVote = fen(t, S.VOTE, S.VOTE + 0.4, 0, 9) + 8 * (1 - fen(t, S.RAPPEL_FIN, S.RAPPEL_FIN + 0.4));
  return (
    <AbsoluteFill style={{backgroundColor: C.coin}}>
      <AbsoluteFill style={{filter: flouVote > 0 ? `blur(${flouVote}px)` : undefined}}>
        <ThreeCanvas width={width} height={height} gl={{antialias: true, toneMapping: THREE.NoToneMapping}} flat camera={{fov: 108, near: 0.02, far: 90}}>
          <Scene />
        </ThreeCanvas>
      </AbsoluteFill>
      <Strobe />
      <TelFemme />
      <Notification />
      <Rappel />
      <SousTitres />
      <Vote />
      <BandeSon />
    </AbsoluteFill>
  );
};
