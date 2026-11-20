import {ThreeCanvas} from '@remotion/three';
import {useMemo} from 'react';
import {AbsoluteFill, Audio, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import * as THREE from 'three';
import voix from './tiktok_ep06_voix.json';
import {Abri, Etat, Monde, Naufrage} from './Ile3D';
import {ABRI, ABRI_ECHELLE, ChatNoir, Jacuzzi, Puits, ROBIN, Restaurant} from './IleTikTokEp02';
import {CABANES_EP03, Chihuahua, DecoFoot, MaisonPiscine, Mosquee, Patisserie, PetitChien, Plages, Scene as SceneCalvin} from './IleTikTokEp03';
import {
  Aeroport, BoulangerieHalloween, CabaneGateau, CabanePecheur, Chateau, EXT_A, EXT_B, FLIPEUR_CENTRE, Flipeur, Ilot, MaisonPaillettes, Panier, Radeau, Stade, VOTE4,
} from './IleTikTokEp04';
import {AVION, BalancoireNoel, Boucherie, Casquette, EXT_F, FILS, Lucarne, MATS, Perroquet, TOUR, VillaPoisson} from './IleTikTokEp05';
import {Etiquette, useMat} from './outils3d';
import {
  BoutonAbonne, Bulles, Confettis, DefBulle, DefTitre, SousTitre, TEXTE, Titre, contour, fairePaquets, usePolicesPretes,
} from './habillage';

/**
 * L'Île des Abonnés — branche TikTok, épisode 6 (relevé du 15/11/2026 sur l'épisode 5 « TON PAYS »).
 * Pays (1 par pseudo) : Portugal 4 et France 4 → égalité, départagés par les likes (8 contre 5) : PORTUGAL.
 * L'avion décolle vers Lisbonne, @abonne_130 (Wizzy) copilote. Les 10 pays cités ont leur drapeau sur l'île.
 * Nouveau vote : le souvenir que l'avion rapporte. A pastéis de nata, B tramway jaune de Lisbonne, C coq de Barcelos.
 */

const FIN = voix.duree + 0.9;
export const DUREE_ILE_TT_EP06 = Math.ceil(FIN * 30);
const T = (i: number) => voix.mots[i].a - 0.08;

const R = {
  likes: T(12), portugal: T(23), comete: T(27), wizzy: T(34), decollage: T(38), promis: T(43),
  pays: [55, 57, 59, 60, 62, 64, 68, 70, 73].map(T), souvenir: T(74), A: T(84), B: T(89), C: T(95), commente: T(100), ecris: T(105), abonne: T(115),
};

type V3 = [number, number, number];
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const mix = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const dans = (t: number, a: number, b: number) => t >= a && t < b;

/* ------------------------------------------------------------------ drapeaux */

// ordre : le gagnant, puis les pays dans l'ordre où la voix les cite
export const PAYS = ['🇵🇹', '🇫🇷', '🇲🇦', '🇸🇳', '🇩🇿', '🇹🇳', '🇰🇷', '🇨🇱', '🇵🇸', '🇾🇪'];
export const POTEAU_PT: V3 = [9.8, 0.4, -3.4]; // grand drapeau du gagnant, sur l'îlot de l'aéroport

const textureDrapeau = (emoji: string) => {
  const c = document.createElement('canvas');
  c.width = 220; c.height = 170;
  const ctx = c.getContext('2d')!;
  ctx.font = '150px "Apple Color Emoji", "Noto Color Emoji", "Segoe UI Emoji", sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(emoji, 110, 92);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
};

export const Drapeau: React.FC<{p: V3; emoji: string; e: number; taille?: number}> = ({p, emoji, e, taille = 1}) => {
  const frame = useCurrentFrame();
  const metal = useMat('#c8ccd2');
  const tex = useMemo(() => textureDrapeau(emoji), [emoji]);
  if (e <= 0.001) return null;
  return (
    <group position={p} scale={e * taille}>
      <mesh material={metal} position={[0, 0.65, 0]}><cylinderGeometry args={[0.02, 0.02, 1.3, 5]} /></mesh>
      <mesh material={metal} position={[0, 1.31, 0]}><sphereGeometry args={[0.035, 8, 6]} /></mesh>
      <mesh position={[0.24, 1.08, 0]} rotation={[0, Math.sin(frame / 7 + p[0]) * 0.25, Math.sin(frame / 5 + p[2]) * 0.04]}>
        <planeGeometry args={[0.5, 0.39]} />
        <meshBasicMaterial map={tex} transparent side={THREE.DoubleSide} toneMapped={false} />
      </mesh>
    </group>
  );
};

/* ------------------------------------------------------------------ aperçus du vote */

const Pasteis: React.FC<{e: number}> = ({e}) => {
  const plateau = useMat('#c8ccd2');
  const pate = useMat('#d9a066');
  const creme = useMat('#f2c14e');
  const brule = useMat('#7a4a26');
  return (
    <Radeau p={VOTE4[0]} e={e}>
      <mesh material={plateau} position={[0, 0.2, 0]}><cylinderGeometry args={[0.42, 0.42, 0.03, 18]} /></mesh>
      {([[0, 0], [0.22, 0.1], [-0.22, 0.1], [0.12, -0.2], [-0.12, -0.2], [0, 0.24]] as [number, number][]).map(([x, z], i) => (
        <group key={i} position={[x, 0.27, z]}>
          <mesh material={pate}><cylinderGeometry args={[0.1, 0.075, 0.09, 10]} /></mesh>
          <mesh material={creme} position={[0, 0.046, 0]}><cylinderGeometry args={[0.085, 0.085, 0.01, 10]} /></mesh>
          {[0, 1, 2].map((k) => <mesh key={k} material={brule} position={[Math.cos(k * 2 + i) * 0.04, 0.053, Math.sin(k * 2 + i) * 0.04]}><sphereGeometry args={[0.014, 5, 4]} /></mesh>)}
        </group>
      ))}
    </Radeau>
  );
};

const Tramway: React.FC<{e: number}> = ({e}) => {
  const jaune = useMat('#ffc928');
  const blanc = useMat('#fbf6ea');
  const vitre = useMat('#7fd6ff', {roughness: 0.2});
  const noir = useMat('#1b1d24');
  const gris = useMat('#8a8f99');
  return (
    <Radeau p={VOTE4[1]} e={e}>
      <group position={[0, 0.14, 0]} rotation={[0, 0.5, 0]}>
        <mesh material={jaune} position={[0, 0.3, 0]} castShadow><boxGeometry args={[0.95, 0.38, 0.42]} /></mesh>
        <mesh material={blanc} position={[0, 0.56, 0]}><boxGeometry args={[0.98, 0.14, 0.44]} /></mesh>
        <mesh material={blanc} position={[0, 0.67, 0]}><boxGeometry args={[0.85, 0.06, 0.36]} /></mesh>
        {[-0.3, -0.1, 0.1, 0.3].map((x) => [-1, 1].map((s) => <mesh key={`${x}${s}`} material={vitre} position={[x, 0.55, s * 0.225]}><boxGeometry args={[0.14, 0.1, 0.01]} /></mesh>))}
        {[-0.3, 0.3].map((x) => [-1, 1].map((s) => <mesh key={`r${x}${s}`} material={noir} position={[x, 0.08, s * 0.2]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.07, 0.07, 0.04, 10]} /></mesh>))}
        <mesh material={gris} position={[0, 0.88, 0]} rotation={[0, 0, 0.5]}><cylinderGeometry args={[0.01, 0.01, 0.4, 4]} /></mesh>
      </group>
    </Radeau>
  );
};

const Coq: React.FC<{e: number}> = ({e}) => {
  const noir = useMat('#1b1d24');
  const rouge = useMat('#e0283f');
  const jaune = useMat('#ffc928');
  const vert = useMat('#2bb34a');
  const bleu = useMat('#3f7fd9');
  const pois = [rouge, jaune, vert, bleu];
  return (
    <Radeau p={VOTE4[2]} e={e}>
      <group position={[0, 0.15, 0]} rotation={[0, -0.6, 0]} scale={1.3}>
        <mesh material={noir} position={[0, 0.3, 0]} scale={[0.8, 0.85, 1.15]} castShadow><icosahedronGeometry args={[0.2, 1]} /></mesh>
        <mesh material={noir} position={[0, 0.55, 0.14]} castShadow><icosahedronGeometry args={[0.1, 1]} /></mesh>
        <mesh material={rouge} position={[0, 0.67, 0.14]} scale={[0.4, 1, 1]}><coneGeometry args={[0.07, 0.12, 4]} /></mesh>
        <mesh material={jaune} position={[0, 0.54, 0.25]} rotation={[Math.PI / 2, 0, 0]}><coneGeometry args={[0.025, 0.07, 4]} /></mesh>
        <mesh material={rouge} position={[0, 0.48, 0.2]}><sphereGeometry args={[0.03, 6, 5]} /></mesh>
        <mesh material={noir} position={[0, 0.45, -0.22]} rotation={[-0.6, 0, 0]} scale={[0.35, 1, 1]}><coneGeometry args={[0.13, 0.32, 5]} /></mesh>
        {Array.from({length: 10}).map((_, i) => {
          const a = i * 1.3, h = 0.2 + (i % 4) * 0.06;
          return <mesh key={i} material={pois[i % 4]} position={[Math.cos(a) * 0.16, h, Math.sin(a) * 0.2]}><sphereGeometry args={[0.025, 6, 5]} /></mesh>;
        })}
        {[-1, 1].map((s) => <mesh key={s} material={jaune} position={[s * 0.06, 0.07, 0]}><cylinderGeometry args={[0.015, 0.015, 0.14, 4]} /></mesh>)}
      </group>
    </Radeau>
  );
};

/* ------------------------------------------------------------------ caméra */

type Plan = {de: number; p0: V3; p1: V3; c: V3};
const PLANS: Plan[] = [
  {de: 0, p0: [4.6, 5.4, 2.6], p1: [5.2, 4.8, 1.4], c: add(EXT_A, [0, 0.8, 0])},
  {de: R.portugal, p0: add(POTEAU_PT, [-1.8, 1.4, 2.6]), p1: add(POTEAU_PT, [-1.5, 1.3, 2.2]), c: add(POTEAU_PT, [0.3, 1.6, 0])},
  {de: R.comete, p0: [6.6, 2.3, -3.4], p1: [6.9, 2.2, -3.7], c: add(TOUR, [0, 1.3, 0])},
  {de: R.wizzy, p0: [5.6, 2.1, -2.0], p1: [5.9, 2.0, -2.4], c: add(AVION, [0, 0.4, 0])},
  {de: R.decollage, p0: [3.6, 3.0, 1.0], p1: [3.2, 3.8, 0.6], c: add(EXT_A, [1.5, 2.2, 0])},
  {de: R.promis, p0: [-15.5, 13, 7], p1: [-14, 12, 6.3], c: [0, 0.4, 0]},
  {de: R.souvenir, p0: [0, 9, 15.5], p1: [0, 8.6, 14.6], c: [0.1, 0.3, 3.6]},
  {de: R.A, p0: add(VOTE4[0], [0.9, 1.5, 2.8]), p1: add(VOTE4[0], [0.75, 1.4, 2.4]), c: add(VOTE4[0], [0, 0.45, 0])},
  {de: R.B, p0: add(VOTE4[1], [0.9, 1.5, 2.8]), p1: add(VOTE4[1], [0.75, 1.4, 2.4]), c: add(VOTE4[1], [0, 0.55, 0])},
  {de: R.C, p0: add(VOTE4[2], [-0.9, 1.5, 2.8]), p1: add(VOTE4[2], [-0.75, 1.4, 2.4]), c: add(VOTE4[2], [0, 0.6, 0])},
  {de: R.commente, p0: [0, 8.6, 14.6], p1: [0, 9.2, 15.6], c: [0.1, 0.3, 3.6]},
  {de: R.ecris, p0: [-15.5, 13, 7], p1: [-14.5, 12.4, 6.6], c: [0, 0.4, 0]},
  {de: R.abonne, p0: [0, 2.0, 5.9], p1: [0, 1.95, 5.1], c: [0, 1.75, 2.2]},
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
  const etat: Etat = {
    cam: camera(t),
    robin: {humeur: 'joyeux', position: ROBIN, bras: t >= R.abonne ? 'salue' : 'repos'},
    cabanes: CABANES_EP03.map(() => 1),
    mysteres: [0, 1, 2].map((i) => pop(R.souvenir + 0.15 + i * 0.18) * (1 - pop([R.A, R.B, R.C][i] + 0.1))),
    lettres: dans(t, R.souvenir, R.A) || dans(t, R.commente, R.ecris) ? [0, 1, 2].map((i) => pop(R.souvenir + 0.35 + i * 0.18)) : [0, 0, 0],
  };
  const a = t * 0.6;
  return {
    etat,
    flipeurP: [FLIPEUR_CENTRE[0] + Math.sin(a) * 0.8, FLIPEUR_CENTRE[1], FLIPEUR_CENTRE[2] + Math.cos(a) * 0.8] as V3,
    flipeurCap: a + Math.PI / 2,
    // drapeaux : le Portugal au mot « Portugal ! », puis chaque pays sur son nom
    drapeauPT: pop(R.portugal + 0.15),
    drapeaux: [pop(R.promis + 0.3), ...R.pays.map((d) => pop(d + 0.05))],
    decollage: interpolate(t, [R.decollage, R.decollage + 3.4], [0, 2.4], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
    etiqWizzy: 0, // en gros plan, l'étiquette recouvrait le titre
    pasteis: pop(R.A + 0.15), tram: pop(R.B + 0.15), coq: pop(R.C + 0.15),
  };
};

const Monde6: React.FC<{t: number}> = ({t}) => {
  const s = useScene(t);
  return (
    <Monde etat={s.etat} cabanesDef={CABANES_EP03} parcellesVote={VOTE4} tailleMystere={0.7}>
      <Plages g={1} d={1} />
      <Ilot c={EXT_B} r={2.6} e={1} />
      <Ilot c={EXT_A} r={2.4} e={1} />
      <Ilot c={EXT_F} r={2.2} e={1} />
      <group position={ABRI}><Abri e={ABRI_ECHELLE} /></group>
      <Restaurant e={1} gateau={0} etiq={0} />
      <Jacuzzi e={1} etiq={0} />
      <ChatNoir e={1} etiq={0} />
      <Puits e={1} />
      <DecoFoot e={1} />
      <SceneCalvin e={1} etiq={0} />
      <Patisserie e={1} etiq={0} />
      <MaisonPiscine e={1} etiq={0} />
      <Mosquee e={1} etiq={0} />
      <PetitChien e={1} etiq={0} />
      <Chihuahua e={1} etiq={0} chapeau={0} />
      <Flipeur v={1} p={s.flipeurP} cap={s.flipeurCap} coeur={0} etiq={0} />
      <CabanePecheur e={1} />
      <Stade e={1} />
      <Chateau e={1} />
      <MaisonPaillettes e={1} />
      <BoulangerieHalloween e={1} />
      <CabaneGateau e={1} />
      <Aeroport e={1} decollage={s.decollage} etiq={0} />
      <Etiquette texte="@abonne_130 · COPILOTE" position={add(AVION, [0, 0.75, 0])} echelle={s.etiqWizzy} hauteur={0.16} fond="#1b2a4a" encre="#ffc928" />
      <Panier e={1} />
      <Perroquet e={1} />
      <VillaPoisson e={1} />
      <Boucherie e={1} />
      <BalancoireNoel e={1} />
      <Casquette p={add(ROBIN, [0, 2.12, 0])} s={1.15} />
      <Naufrage p={FILS} graine={4} echelle={1.3} />
      <Casquette p={add(FILS, [0, 0.9, 0])} s={0.5} />
      <Lucarne e={1} />
      <Drapeau p={POTEAU_PT} emoji="🇵🇹" e={s.drapeauPT} taille={2.2} />
      {MATS.map((p, i) => <Drapeau key={i} p={p} emoji={PAYS[i]} e={s.drapeaux[i] ?? 0} taille={1.8} />)}
      <Pasteis e={s.pasteis} />
      <Tramway e={s.tram} />
      <Coq e={s.coq} />
    </Monde>
  );
};

/* ------------------------------------------------------------------ habillage */

const Colonne: React.FC<{drapeau: string; nb: number; likes: number; montreLikes: boolean; etat: 'egal' | 'gagne' | 'perd'}> = ({drapeau, nb, likes, montreLikes, etat}) => (
  <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, transform: `scale(${etat === 'gagne' ? 1.12 : etat === 'perd' ? 0.85 : 1})`, opacity: etat === 'perd' ? 0.55 : 1}}>
    <div style={{fontSize: 110, lineHeight: 1}}>{drapeau}</div>
    <div style={{fontFamily: TEXTE, fontWeight: 900, fontSize: 64, color: '#fff', ...contour('#1b1d24', 12)}}>{nb} voix</div>
    {montreLikes && <div style={{fontFamily: TEXTE, fontWeight: 900, fontSize: 48, color: '#ff5c8a', ...contour('#1b1d24', 10)}}>+{likes} ❤️</div>}
  </div>
);

/** Les drapeaux des pays cités, qui s'ajoutent à l'écran au fil de l'énumération. */
const GrilleDrapeaux: React.FC<{t: number}> = ({t}) => {
  const {fps} = useVideoConfig();
  if (t < R.promis + 0.2 || t >= R.souvenir) return null;
  const debuts = [R.promis + 0.3, ...R.pays];
  return (
    <div style={{position: 'absolute', top: 470, left: 60, right: 60, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 18}}>
      {PAYS.map((d, i) => {
        const e = t >= debuts[i] ? spring({frame: (t - debuts[i]) * 30, fps, config: {damping: 10, stiffness: 200}}) : 0;
        return <div key={i} style={{fontSize: 120, lineHeight: 1, transform: `scale(${e})`, filter: 'drop-shadow(0 6px 0 rgba(0,0,0,0.25))'}}>{d}</div>;
      })}
    </div>
  );
};

/** Le tableau de l'égalité, puis les likes qui départagent. */
const Score: React.FC<{t: number}> = ({t}) => {
  const {fps} = useVideoConfig();
  if (t >= R.comete) return null;
  const e = spring({frame: t * 30, fps, config: {damping: 12}});
  const likes = t >= R.likes + 0.6;
  const gagne = t >= R.portugal;
  return (
    <div style={{position: 'absolute', top: 560, left: 0, right: 0, display: 'flex', justifyContent: 'center', transform: `scale(${e})`}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 40, background: 'rgba(27,29,36,0.8)', borderRadius: 40, padding: '24px 46px'}}>
        <Colonne drapeau="🇵🇹" nb={4} likes={4} montreLikes={likes} etat={gagne ? 'gagne' : 'egal'} />
        <div style={{fontFamily: TEXTE, fontWeight: 900, fontSize: 70, color: '#ffc928'}}>VS</div>
        <Colonne drapeau="🇫🇷" nb={4} likes={1} montreLikes={likes} etat={gagne ? 'perd' : 'egal'} />
      </div>
    </div>
  );
};

const TITRES: DefTitre[] = [
  {de: 0, petit: 'PORTUGAL OU FRANCE ?', grand: 'ÉGALITÉ !'},
  {de: R.likes, petit: 'VOS LIKES', grand: 'DÉPARTAGENT…'},
  {de: R.portugal, petit: 'LE GAGNANT', grand: 'LE PORTUGAL !'},
  {de: R.comete, petit: 'LE DIRECTEUR @ABONNE_151', grand: 'FEU VERT !'},
  {de: R.wizzy, petit: '@ABONNE_130', grand: 'COPILOTE'},
  {de: R.decollage, petit: 'DÉCOLLAGE…', grand: 'CAP SUR LISBONNE'},
  {de: R.promis, petit: 'COMME PROMIS', grand: 'VOS DRAPEAUX'},
  {de: R.souvenir, petit: "L'AVION RAPPORTE", grand: '1 SEUL SOUVENIR'},
  {de: R.A, petit: 'CHOIX A', grand: 'PASTÉIS DE NATA'},
  {de: R.B, petit: 'CHOIX B', grand: 'LE TRAMWAY JAUNE'},
  {de: R.C, petit: 'CHOIX C', grand: 'LE COQ DE BARCELOS'},
  {de: R.commente, petit: 'COMMENTE', grand: 'A, B OU C'},
  {de: R.ecris, petit: 'ET ÉCRIS TON PAYS', grand: 'TON DRAPEAU ARRIVE'},
  {de: R.abonne, petit: 'ABONNE-TOI POUR VOIR', grand: 'LE SOUVENIR'},
];

const PAQUETS = fairePaquets(voix, {
  1: '*Portugal*', 4: '*France :*', 5: '', 6: '*égalité*', 7: '*parfaite,*', 8: '*4*', 10: '*chacun !*', 11: '', 16: '*likes*', 19: '*tranché…*',
  25: '*Portugal !*', 26: '', 29: '*Comete*', 33: '*vert,*', 35: '*Wizzy*', 37: '*copilote.*', 38: '*Décollage*', 41: '*Lisbonne !*', 42: '',
  51: '*drapeau*', 55: '*France,*', 57: '*Maroc,*', 59: '*Sénégal,*', 60: "*l'Algérie,*", 62: '*Tunisie,*', 64: '*Corée*', 66: '*Sud,*', 68: '*Chili,*',
  70: '*Palestine*', 73: '*Yémen.*', 80: '*seul*', 81: '*souvenir*', 84: '*A,*', 86: '*pastéis*', 88: '*nata.*', 89: '*B,*', 91: '*tramway*', 92: '*jaune*',
  95: '*C,*', 97: '*coq*', 99: '*Barcelos.*', 101: '*A,*', 102: '*B*', 104: '*C.*', 108: '*pays :*', 109: '', 111: '*drapeau*', 115: '*Abonne-toi*', 121: '*rapporte.*',
});

const BULLES: DefBulle[] = [
  {de: R.wizzy + 0.1, a: R.decollage, pseudo: '@abonne_130', texte: 'je suis copilote stp', x: 120, y: 560, rot: -2},
];

/* ------------------------------------------------------------------ composition */

export const IleTikTokEp06: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / 30;
  const {width, height} = useVideoConfig();
  const pret = usePolicesPretes();
  return (
    <AbsoluteFill style={{background: '#8fd6f6'}}>
      {pret && (
        <ThreeCanvas width={width} height={height} shadows camera={{fov: 40, near: 0.1, far: 300}} gl={{antialias: true}}>
          <Monde6 t={t} />
        </ThreeCanvas>
      )}
      <Titre t={t} titres={TITRES} />
      <Score t={t} />
      <GrilleDrapeaux t={t} />
      <Bulles t={t} bulles={BULLES} />
      <SousTitre t={t} paquets={PAQUETS} />
      <BoutonAbonne t={t} de={R.abonne + 0.15} />
      <Confettis t={t} de={R.portugal + 0.3} a={R.comete + 0.6} />
      <Confettis t={t} de={R.abonne + 1.17} />
      <Audio src={staticFile('ile/tiktok_ep06_voix.wav')} />
    </AbsoluteFill>
  );
};
