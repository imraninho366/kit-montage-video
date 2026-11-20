import {ThreeCanvas} from '@remotion/three';
import {AbsoluteFill, Audio, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import * as THREE from 'three';
import {mergeGeometries} from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import voix from './youtube_ep02_voix.json';
import {Abri, DefCabane, Etat, Monde} from './Ile3D';
import {ABRI, ABRI_ECHELLE, PanneauJungle, Puits, ROBIN, ROBIN_ABRI, ROBIN_YEUX, Recuperateur, VOTE} from './IleTikTokEp02';
import {Etiquette, VolumeMystere} from './outils3d';
import {BoutonAbonne, Bulles, Confettis, DefBulle, DefTitre, JaugeEau, SousTitre, Titre, fairePaquets, usePolicesPretes} from './habillage';

/**
 * L'Île des Abonnés — branche YouTube Shorts, épisode 2 (relevé du 09/11/2026 sur le Short yF0CdPBhVHc).
 * Vote : A (abri) 2 voix contre 1 pour C. Pas de demande spéciale : une cabane à leur nom pour les 5 commentateurs.
 * Cette île est celle de YouTube : rien de la branche TikTok n'y apparaît (ni restaurant, ni jacuzzi, ni chat…).
 * Même danger que TikTok (l'eau) : A puits, B récupérer la pluie, C explorer la jungle.
 */

const FIN = voix.duree + 0.9;
export const DUREE_ILE_YT_EP02 = Math.ceil(FIN * 30);
const T = (i: number) => voix.mots[i].a - 0.08;

const R = {
  gagnant: T(6), l1: T(11), noms: T(19), n: [T(19), T(20), T(21), T(22), T(24)], place: T(33), tienne: T(40),
  l7: T(48), eau: T(53), l8: T(58), A: T(66), B: T(70), C: T(74), l9: T(78), abonne: T(83),
};

type V3 = [number, number, number];
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const mix = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const dans = (t: number, a: number, b: number) => t >= a && t < b;

export const CABANES_YT: DefCabane[] = [
  {p: [-2.9, 0.4, -1.9], c: '#ff7eb6', pseudo: '@abonne_158'},
  {p: [-1.5, 0.4, -2.7], c: '#3f7fd9', pseudo: '@abonne_159'},
  {p: [-0.2, 0.4, -3.1], c: '#2bb39b', pseudo: '@abonne_160'},
  {p: [1.2, 0.4, -2.8], c: '#f08a24', pseudo: '@abonne_161'},
  {p: [2.4, 0.4, -2.0], c: '#9b59d0', pseudo: '@abonne_162'},
];
// places libres : des cabanes en pointillés, « TA CABANE ? »
const LIBRES: V3[] = [[1.2, 0.4, 0.6], [-1.3, 0.4, 3.2], [2.1, 0.4, 2.4]];
const geoCabane = mergeGeometries([
  new THREE.BoxGeometry(0.8, 0.6, 0.7).translate(0, 0.3, 0),
  (() => { const g = new THREE.ConeGeometry(0.68, 0.5, 4); g.rotateY(Math.PI / 4); return g.translate(0, 0.82, 0); })(),
]);
const geoBlocAbri = new THREE.BoxGeometry(1.4, 1.1, 1.4).translate(0, 0.55, 0);

/* ------------------------------------------------------------------ caméra */

type Plan = {de: number; p0: V3; p1: V3; c: V3};
const PLANS: Plan[] = [
  {de: 0, p0: [14, 11, 17], p1: [10, 8, 12.5], c: [0, 0.6, 0]},
  {de: R.gagnant - 0.12, p0: add(ABRI, [2.8, 2.9, 6.4]), p1: add(ABRI, [2.4, 2.6, 5.6]), c: add(ABRI, [0, 1.5, 0])},
  {de: R.l1, p0: add(ROBIN_ABRI, [2.2, 1.3, 3.7]), p1: add(ROBIN_ABRI, [1.9, 1.3, 3.2]), c: add(ROBIN_ABRI, [0, 1.55, 0])},
  {de: R.noms, p0: [0.6, 10, -15.5], p1: [0.3, 9.3, -14.3], c: [-0.3, 0.6, -1.9]}, // de dos, depuis la mer : les portes des cabanes regardent vers l'extérieur
  {de: R.place, p0: [0, 12.5, 11.5], p1: [0, 11.5, 10.5], c: [0.1, 0.4, -0.2]},
  {de: R.l7, p0: [0.5, 3.2, 8.4], p1: [0.4, 3.3, 7.4], c: [-0.4, 2.2, -30]},
  {de: R.eau, p0: [0.4, 1.95, 6.0], p1: [0.2, 1.9, 5.3], c: ROBIN_YEUX},
  {de: R.l8, p0: [0, 11, 11.5], p1: [0, 10.3, 10.7], c: [-0.15, 0.4, 1.4]},
  {de: R.A, p0: add(VOTE[0], [1.3, 3.5, 1.8]), p1: add(VOTE[0], [1.1, 3.2, 1.5]), c: add(VOTE[0], [0, 0.75, 0])},
  {de: R.B, p0: add(VOTE[1], [-2.0, 2.4, 1.8]), p1: add(VOTE[1], [-1.7, 2.2, 1.5]), c: add(VOTE[1], [0, 0.7, 0])},
  {de: R.C, p0: add(VOTE[2], [-0.7, 2.1, 3.8]), p1: add(VOTE[2], [-0.55, 1.9, 3.2]), c: add(VOTE[2], [0, 0.85, 0])},
  {de: R.l9, p0: [0, 11, 11.5], p1: [0, 11.6, 12.3], c: [-0.15, 0.4, 1.4]},
  {de: R.abonne, p0: [0, 1.95, 5.9], p1: [0, 1.9, 5.1], c: ROBIN_YEUX},
];

const camera = (t: number): Etat['cam'] => {
  const i = Math.max(0, PLANS.findIndex((p, k) => t >= p.de && t < (PLANS[k + 1]?.de ?? Infinity)));
  const p = PLANS[i];
  const fin = PLANS[i + 1]?.de ?? FIN;
  const u = interpolate(t, [p.de, fin], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return {pos: mix(p.p0, p.p1, u), cible: p.c, fov: 40};
};

/* ------------------------------------------------------------------ état */

const useScene = (t: number) => {
  const {fps} = useVideoConfig();
  const pop = (de: number) => (t < de ? 0 : spring({frame: (t - de) * 30, fps, config: {damping: 11, stiffness: 170}}));
  const flash = (...d: number[]) => Math.max(0, ...d.map((x) => (t >= x && t < x + 0.17 ? 1 - (t - x) / 0.17 : 0)));
  const orage = dans(t, R.l7, R.eau);
  const etat: Etat = {
    cam: camera(t),
    robin: {
      humeur: dans(t, R.l7, R.l8) ? 'triste' : 'joyeux',
      position: dans(t, R.gagnant - 0.12, R.noms) ? ROBIN_ABRI : ROBIN,
      rotY: orage ? Math.PI : 0,
      bras: t >= R.abonne ? 'salue' : dans(t, R.tienne, R.l7) ? 'montre' : 'repos',
    },
    pluie: dans(t, R.l1, R.noms) ? 1 : orage ? 0.6 : dans(t, R.eau, R.l8) ? 0.5 : 0,
    orage: dans(t, R.l1, R.noms) ? 0.4 : orage ? interpolate(t, [R.l7, R.l7 + 2], [0.2, 0.8], {extrapolateRight: 'clamp'}) : dans(t, R.eau, R.l8) ? 0.55 : 0,
    eclair: orage ? flash(R.l7 + 1.1, R.l7 + 1.6) : 0,
    cabanes: R.n.map((d) => pop(d + 0.05)),
    etiquettes: dans(t, R.noms, R.l7) ? 1 : 0,
    mysteres: [0, 1, 2].map((i) => pop(R.l8 + 0.15 + i * 0.18) * (1 - pop([R.A, R.B, R.C][i] + 0.1))),
    lettres: dans(t, R.l8, R.A) || dans(t, R.l9, R.abonne) ? [0, 1, 2].map((i) => pop(R.l8 + 0.35 + i * 0.18)) : [0, 0, 0],
  };
  return {
    etat,
    abri: pop(R.gagnant), mystereAbri: 1.25 * (1 - pop(R.gagnant - 0.05)),
    libres: LIBRES.map((_, i) => (t < R.l7 ? pop(R.place + 0.1 + i * 0.12) : 0)),
    etiqLibres: dans(t, R.place, R.l7) ? 1 : 0,
    puits: pop(R.A + 0.15), recup: pop(R.B + 0.15), jungle: pop(R.C + 0.15), etiqJungle: dans(t, R.C, R.abonne) ? 1 : 0,
  };
};

const Scene: React.FC<{t: number}> = ({t}) => {
  const s = useScene(t);
  return (
    <Monde etat={s.etat} cabanesDef={CABANES_YT} parcellesVote={VOTE} tailleMystere={0.7}>
      <VolumeMystere geometrie={geoBlocAbri} position={ABRI} echelle={s.mystereAbri} />
      <group position={ABRI}><Abri e={s.abri * ABRI_ECHELLE} /></group>
      {LIBRES.map((p, i) => (
        <group key={i}>
          <VolumeMystere geometrie={geoCabane} position={p} echelle={s.libres[i]} rotation={[0, Math.atan2(p[0], p[2]), 0]} />
          <Etiquette texte="TA CABANE ?" position={[p[0], p[1] + 1.55, p[2]]} echelle={s.libres[i] * s.etiqLibres} hauteur={0.36} fond="#ffc928" encre="#2b1a00" />
        </group>
      ))}
      <Puits e={s.puits} />
      <Recuperateur e={s.recup} />
      <PanneauJungle e={s.jungle} etiq={s.etiqJungle} />
    </Monde>
  );
};

/* ------------------------------------------------------------------ habillage */

const TITRES: DefTitre[] = [
  {de: 0, petit: 'VOUS AVEZ', grand: 'VOTÉ !'},
  {de: R.gagnant - 0.12, petit: 'LE GAGNANT', grand: 'A : UN ABRI'},
  {de: R.l1, petit: 'ROBIN EST ENFIN', grand: "À L'ABRI"},
  {de: R.noms, petit: '5 NOUVEAUX NAUFRAGÉS', grand: 'VOS CABANES'},
  {de: R.place, petit: 'IL RESTE DE LA PLACE', grand: 'TA CABANE ?'},
  {de: R.tienne, petit: 'DEMANDE-LA', grand: 'EN COMMENTAIRE'},
  {de: R.l7, petit: 'LA TEMPÊTE ARRIVE', grand: 'DEMAIN'},
  {de: R.eau, petit: "ET ROBIN N'A", grand: "PLUS D'EAU"},
  {de: R.l8, petit: "POUR TROUVER DE L'EAU", grand: 'ON FAIT QUOI ?'},
  {de: R.A, petit: 'CHOIX A', grand: 'UN PUITS'},
  {de: R.B, petit: 'CHOIX B', grand: 'LA PLUIE'},
  {de: R.C, petit: 'CHOIX C', grand: 'LA JUNGLE'},
  {de: R.l9, petit: 'COMMENTE', grand: 'A, B OU C'},
  {de: R.abonne, petit: 'ABONNE-TOI POUR SAVOIR', grand: "S'IL SURVIT"},
];

const PAQUETS = fairePaquets(voix, {
  2: '*voté…*', 6: '*A :*', 7: '', 9: '*abri !*', 10: '', 15: "*l'abri*", 18: '*pluie.*',
  19: '*Priscillia,*', 20: '*Volcan,*', 21: '*Marina,*', 22: '*Caramel*', 24: '*Tom :*', 25: '', 27: '*cabanes*', 32: '*noms.*',
  37: '*place*', 43: '*tienne ?*', 44: '', 47: '*commentaire.*', 50: '*tempête*', 52: '*demain.*', 57: "*d'eau.*",
  64: '*quoi ?*', 65: '', 66: '*A,*', 69: '*puits.*', 70: '*B,*', 73: '*pluie.*', 74: '*C,*', 77: '*jungle.*',
  79: '*A,*', 80: '*B*', 82: '*C.*', 83: '*Abonne-toi*', 87: '*survit.*',
});

/** Les vrais commentaires YouTube du pilote. */
const BULLES: DefBulle[] = [
  {de: 0.05, a: R.gagnant - 0.12, pseudo: '@abonne_158', texte: 'A stp moi', x: 90, y: 560, rot: -4},
  {de: 0.4, a: R.gagnant - 0.12, pseudo: '@abonne_159', texte: 'je choisis le A et je me suis abonné', x: 150, y: 780, rot: 3},
  {de: 0.75, a: R.gagnant - 0.12, pseudo: '@abonne_160', texte: 'C', x: 200, y: 1000, rot: -2},
  {de: R.tienne + 0.15, a: R.l7, pseudo: '@toi · il y a 2 s', texte: 'Une cabane pour moi !', x: 100, y: 620, rot: -3},
];

/* ------------------------------------------------------------------ composition */

export const IleYouTubeEp02: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / 30;
  const {width, height} = useVideoConfig();
  const pret = usePolicesPretes();
  const eclair = dans(t, R.l7, R.eau) ? Math.max(0, ...[R.l7 + 1.1, R.l7 + 1.6].map((d) => (t >= d && t < d + 0.17 ? 1 - (t - d) / 0.17 : 0))) : 0;
  return (
    <AbsoluteFill style={{background: '#8fd6f6'}}>
      {pret && (
        <ThreeCanvas width={width} height={height} shadows camera={{fov: 40, near: 0.1, far: 300}} gl={{antialias: true}}>
          <Scene t={t} />
        </ThreeCanvas>
      )}
      <AbsoluteFill style={{background: '#fff', opacity: eclair * 0.45}} />
      <Titre t={t} titres={TITRES} />
      <Bulles t={t} bulles={BULLES} />
      <JaugeEau t={t} de={R.eau} a={R.l8} niveau0={0.3} niveau1={0} />
      <SousTitre t={t} paquets={PAQUETS} />
      <BoutonAbonne t={t} de={R.abonne + 0.15} />
      <Confettis t={t} de={R.abonne + 1.17} />
      <Audio src={staticFile('ile/youtube_ep02_voix.wav')} />
    </AbsoluteFill>
  );
};
