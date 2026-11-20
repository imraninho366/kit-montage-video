import {ThreeCanvas} from '@remotion/three';
import {AbsoluteFill, Audio, Easing, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import voix from './youtube_ep06_voix.json';
import {Abri, DefCabane, Etat, Monde} from './Ile3D';
import {ABRI, ABRI_ECHELLE, ROBIN} from './IleTikTokEp02';
import {Plages} from './IleTikTokEp03';
import {Ilot} from './IleTikTokEp04';
import {Drapeau} from './IleTikTokEp06';
import {Grotte, Jungle, Source} from './IleYouTubeEp03';
import {BALLON, CABANES_EP04, MATS, Montgolfiere, Singe} from './IleYouTubeEp04';
import {useMat} from './outils3d';
import {BoutonAbonne, Bulles, Confettis, DefBulle, DefTitre, SousTitre, TEXTE, Titre, contour, fairePaquets, usePolicesPretes} from './habillage';

/**
 * L'Île des Abonnés — branche YouTube Shorts, épisode 6 (relevé du 17/11/2026).
 * « TON PAYS » recompté : 207 votants, 41 pays (France 43, Maroc 32, Algérie 26, Canada 22, Tunisie 11, Côte d'Ivoire 10,
 * Sénégal 8, Portugal 6). Ép. 5 : B mini tour Eiffel 10 voix contre 1.
 * Nouveau format : la Coupe du monde des abonnés. Les 8 premiers sont qualifiés, quarts de finale à la fois :
 * moitié 1 = France–Portugal, Algérie–Côte d'Ivoire ; moitié 2 = Maroc–Sénégal, Canada–Tunisie
 * (Maroc et Algérie ne peuvent se croiser qu'en finale). Règle : 1 personne qui écrit son pays = 1 but.
 * Les pays non qualifiés vont dans les tribunes. Kurdistan et Kosovo : pas de drapeau affiché (statut disputé).
 */

const FIN = voix.duree + 1.2;
export const DUREE_ILE_YT_EP06 = Math.ceil(FIN * 30);
const T = (i: number) => voix.mots[i].a - 0.08;

const R = {
  robin: T(14), tour: T(20), dix: T(24), mais: T(28), coupe: T(38), qualif: T(46), pays: [56, 58, 59, 61, 63, 65, 68, 70].map(T),
  quarts: T(72), matchs: [76, 79, 83, 87].map(T), regle: T(90), but: T(101), tribunes: T(106), abonne: T(122),
};

type V3 = [number, number, number];
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const mix = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const dans = (t: number, a: number, b: number) => t >= a && t < b;
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

/* ------------------------------------------------------------------ données */

// les 8 qualifiés, dans l'ordre du classement (= ordre où la voix les cite)
export const QUALIFIES: {d: string; nom: string; nb: number}[] = [
  {d: '🇫🇷', nom: 'FRANCE', nb: 43}, {d: '🇲🇦', nom: 'MAROC', nb: 32}, {d: '🇩🇿', nom: 'ALGÉRIE', nb: 26}, {d: '🇨🇦', nom: 'CANADA', nb: 22},
  {d: '🇹🇳', nom: 'TUNISIE', nb: 11}, {d: '🇨🇮', nom: "CÔTE D'IVOIRE", nb: 10}, {d: '🇸🇳', nom: 'SÉNÉGAL', nb: 8}, {d: '🇵🇹', nom: 'PORTUGAL', nb: 6},
];
const MATCHS: [number, number][] = [[0, 7], [2, 5], [1, 6], [3, 4]]; // indices dans QUALIFIES
// les autres pays cités : tribunes (3D) et pluie de drapeaux (2D)
export const TRIBUNES = ['🇨🇩', '🇧🇪', '🇨🇭', '🇮🇹', '🇲🇬', '🇪🇸', '🇵🇭', '🇧🇷', '🇨🇴', '🇨🇲', '🇲🇱', '🇩🇪', '🇦🇺', '🇲🇽'];
const AUTRES = [...TRIBUNES, '🇲🇶', '🇬🇵', '🇷🇪', '🏴󠁧󠁢󠁷󠁬󠁳󠁿', '🇵🇱', '🇬🇪', '🇦🇲', '🇦🇱', '🇷🇴', '🇿🇦', '🇲🇺', '🇺🇿', '🇱🇺', '🇨🇳', '🇲🇫', '🇸🇽', '🇾🇹', '🇵🇫'];
const TOUS = [...QUALIFIES.map((q) => q.d), ...AUTRES];
export const PAYS_EP05 = ['🇫🇷', '🇩🇿', '🇨🇦', '🇲🇦', '🇲🇬', '🇨🇩', '🇧🇪', '🇨🇭', '🇪🇸', '🇨🇮', '🇷🇪', '🏴󠁧󠁢󠁷󠁬󠁳󠁿'];

export const STADE_P: V3 = [8.0, 0, -8.0]; // nouvel îlot du stade, derrière l'île à droite
export const SOL: V3 = add(STADE_P, [0, 0.4, 0]);
export const TOUR_P: V3 = add(BALLON, [2.2, 0, -0.6]);
export const POTEAU_FR: V3 = add(BALLON, [2.0, 0, 1.0]);
export const ECHELLE_BALLON = 2.2;
export const CECILIA: DefCabane = {p: [-3.4, 0.4, 2.7], c: '#2bb34a', pseudo: '@abonne_182'};
export const CABANES = [...CABANES_EP04, CECILIA];

/** La montgolfière revient de Paris et se pose. */
const posBallon = (t: number): V3 => {
  const u = interpolate(t, [R.robin - 0.6, R.robin + 2.6], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
  return mix(add(BALLON, [1.2, 6.5, -2]), BALLON, u);
};

/* ------------------------------------------------------------------ décor */

export const TourEiffel: React.FC<{p: V3; e: number}> = ({p, e}) => {
  const fer = useMat('#8a6a4a');
  const dore = useMat('#ffc928', {emissive: '#ffb000', emissiveIntensity: 0.4});
  if (e <= 0.001) return null;
  return (
    <group position={p} scale={e * 1.3} rotation={[0, Math.PI / 4, 0]}>
      {[[1, 1], [1, -1], [-1, 1], [-1, -1]].map(([x, z], i) => (
        <mesh key={i} material={fer} position={[x * 0.14, 0.18, z * 0.14]} rotation={[z * 0.26, 0, -x * 0.26]} castShadow><boxGeometry args={[0.07, 0.38, 0.07]} /></mesh>
      ))}
      <mesh material={fer} position={[0, 0.36, 0]}><boxGeometry args={[0.36, 0.05, 0.36]} /></mesh>
      <mesh material={fer} position={[0, 0.56, 0]} rotation={[0, Math.PI / 4, 0]} castShadow><cylinderGeometry args={[0.07, 0.17, 0.36, 4]} /></mesh>
      <mesh material={fer} position={[0, 0.76, 0]}><boxGeometry args={[0.16, 0.04, 0.16]} /></mesh>
      <mesh material={fer} position={[0, 1.04, 0]} rotation={[0, Math.PI / 4, 0]} castShadow><cylinderGeometry args={[0.012, 0.075, 0.52, 4]} /></mesh>
      <mesh material={dore} position={[0, 1.34, 0]}><sphereGeometry args={[0.025, 8, 6]} /></mesh>
    </group>
  );
};

/** Le stade de la Coupe du monde, avec la coupe dorée et le ballon qui file au but pendant la règle. */
const StadeCoupe: React.FC<{e: number; t: number}> = ({e, t}) => {
  const pelouse = useMat('#3fae4f');
  const raie = useMat('#9be08f');
  const blanc = useMat('#ffffff');
  const rouge = useMat('#e84a5f');
  const bleu = useMat('#3f7fd9');
  const gris = useMat('#8a8f99');
  const lampe = useMat('#fff3a0', {emissive: '#ffe066', emissiveIntensity: 1});
  const or = useMat('#ffc928', {emissive: '#b07800', emissiveIntensity: 0.35, metalness: 0.4, roughness: 0.3});
  const socle = useMat('#2b2f38');
  if (e <= 0.001) return null;
  const u = interpolate(t, [R.regle + 0.4, R.but + 0.2], [0, 1], {...clamp, easing: Easing.in(Easing.quad)});
  const ballon: V3 = [0.3 + u * 1.15, 0.14 + Math.sin(u * Math.PI) * 0.25, 0.2 - u * 0.2];
  return (
    <group position={SOL} scale={e}>
      <mesh material={pelouse} position={[0, 0.03, 0]} receiveShadow><boxGeometry args={[2.6, 0.06, 1.5]} /></mesh>
      {[-0.975, -0.325, 0.325, 0.975].map((x) => <mesh key={x} material={raie} position={[x, 0.065, 0]}><boxGeometry args={[0.32, 0.01, 1.5]} /></mesh>)}
      <mesh material={blanc} position={[0, 0.075, 0]}><boxGeometry args={[0.03, 0.01, 1.4]} /></mesh>
      <mesh material={blanc} position={[0, 0.075, 0]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[0.2, 0.23, 20]} /></mesh>
      {[-1, 1].map((s) => (
        <group key={s} position={[s * 1.25, 0, 0]}>
          {[-0.28, 0.28].map((z) => <mesh key={z} material={blanc} position={[0, 0.2, z]}><cylinderGeometry args={[0.02, 0.02, 0.35, 5]} /></mesh>)}
          <mesh material={blanc} position={[0, 0.37, 0]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.02, 0.02, 0.58, 5]} /></mesh>
        </group>
      ))}
      {/* tribune du fond seulement : la caméra filme depuis l'avant */}
      {[0, 1, 2].map((r) => (
        <mesh key={r} material={r % 2 ? bleu : rouge} position={[0, 0.1 + r * 0.14, -(0.95 + r * 0.16)]} castShadow><boxGeometry args={[2.6, 0.14 + r * 0.14, 0.16]} /></mesh>
      ))}
      {[[-1.4, -1.0], [1.4, -1.0], [-1.4, 0.9], [1.4, 0.9]].map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          <mesh material={gris} position={[0, 0.7, 0]}><cylinderGeometry args={[0.03, 0.03, 1.4, 5]} /></mesh>
          <mesh material={lampe} position={[0, 1.42, 0]}><boxGeometry args={[0.22, 0.12, 0.06]} /></mesh>
        </group>
      ))}
      <mesh material={blanc} position={ballon} castShadow><icosahedronGeometry args={[0.07, 1]} /></mesh>
      {/* la coupe, devant le terrain */}
      <group position={[0, 0, 1.55]}>
        <mesh material={socle} position={[0, 0.12, 0]}><boxGeometry args={[0.3, 0.24, 0.3]} /></mesh>
        <mesh material={or} position={[0, 0.3, 0]}><cylinderGeometry args={[0.07, 0.1, 0.12, 12]} /></mesh>
        <mesh material={or} position={[0, 0.42, 0]}><cylinderGeometry args={[0.03, 0.05, 0.14, 10]} /></mesh>
        <mesh material={or} position={[0, 0.58, 0]} scale={[1, 1.15, 1]}><sphereGeometry args={[0.12, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.62]} /></mesh>
        {[-1, 1].map((s) => <mesh key={s} material={or} position={[s * 0.13, 0.57, 0]} rotation={[0, 0, Math.PI / 2]}><torusGeometry args={[0.05, 0.014, 6, 12, Math.PI]} /></mesh>)}
      </group>
    </group>
  );
};

/* ------------------------------------------------------------------ caméra */

type Plan = {de: number; p0: V3; p1: V3; c: V3; suit?: boolean};
const PLANS: Plan[] = [
  {de: 0, p0: [12, 10, 15], p1: [10.5, 9, 13.5], c: [0, 0.6, -1.5]},
  {de: R.robin, p0: add(BALLON, [3.8, 3.4, 6.8]), p1: add(BALLON, [3.4, 3.0, 6.2]), c: [0, 1.8, 0], suit: true},
  {de: R.tour, p0: add(TOUR_P, [2.8, 1.5, 1.2]), p1: add(TOUR_P, [2.4, 1.4, 1.0]), c: add(TOUR_P, [0, 0.9, 0])}, // de côté : le palmier reste hors champ
  {de: R.mais, p0: [13, 14, 13], p1: [12, 13, 12], c: [4.2, 0.4, -3.6]}, // l'île à gauche, l'îlot du stade qui surgit à droite
  {de: R.coupe, p0: add(SOL, [0, 3.4, 5.6]), p1: add(SOL, [0, 2.8, 4.6]), c: add(SOL, [0, 0.3, 0])},
  {de: R.qualif, p0: add(SOL, [-3.6, 2.8, 4.2]), p1: add(SOL, [-2.4, 2.6, 4.8]), c: add(SOL, [0, 0.6, -0.6])},
  {de: R.quarts, p0: add(SOL, [0, 7.5, 6.5]), p1: add(SOL, [0, 7.0, 5.8]), c: SOL},
  {de: R.regle, p0: add(SOL, [2.3, 0.6, 1.3]), p1: add(SOL, [2.2, 0.55, 1.1]), c: add(SOL, [1.0, 0.25, 0])},
  {de: R.tribunes, p0: add(SOL, [0.6, 1.5, 2.8]), p1: add(SOL, [0.2, 1.4, 2.4]), c: add(SOL, [0, 0.55, -1.0])},
  {de: R.abonne, p0: [0, 2.0, 5.9], p1: [0, 1.95, 5.1], c: [0, 1.75, 2.2]},
];

const camera = (t: number): Etat['cam'] => {
  const i = Math.max(0, PLANS.findIndex((p, k) => t >= p.de && t < (PLANS[k + 1]?.de ?? Infinity)));
  const p = PLANS[i];
  const fin = PLANS[i + 1]?.de ?? FIN;
  const u = interpolate(t, [p.de, fin], [0, 1], clamp);
  return {pos: mix(p.p0, p.p1, u), cible: p.suit ? add(posBallon(t), p.c) : p.c, fov: 40};
};

/* ------------------------------------------------------------------ état */

const useScene = (t: number) => {
  const {fps} = useVideoConfig();
  const pop = (de: number) => (t < de ? 0 : spring({frame: (t - de) * 30, fps, config: {damping: 11, stiffness: 170}}));
  const ballon = posBallon(t);
  const aBord = dans(t, R.robin - 0.6, R.mais);
  const etat: Etat = {
    cam: camera(t),
    robin: {
      humeur: 'joyeux',
      position: aBord ? add(ballon, [0, -0.06, 0]) : ROBIN,
      bras: t >= R.abonne || dans(t, R.robin + 2.6, R.tour) ? 'salue' : 'repos',
    },
    cielDegage: true,
    cabanes: [...CABANES_EP04.map(() => 1), pop(R.tribunes + 0.4)],
    etiquettes: 0,
  };
  return {
    etat,
    ballon,
    tour: pop(R.tour + 0.1),
    ilot: pop(R.mais + 0.6),
    stade: pop(R.coupe + 0.05),
    qualif: R.pays.map((d) => pop(d + 0.05)),
    tribunes: TRIBUNES.map((_, i) => pop(R.tribunes + 0.3 + i * 0.06)),
  };
};

const Monde6: React.FC<{t: number}> = ({t}) => {
  const s = useScene(t);
  return (
    <Monde etat={s.etat} cabanesDef={CABANES} parcellesVote={[]}>
      <Plages g={1} d={1} />
      <Jungle e={1} />
      <Source e={1} />
      <Grotte e={1} yeux={0} etiq={0} />
      <group position={ABRI}><Abri e={ABRI_ECHELLE} /></group>
      <Singe e={1} />
      <Montgolfiere e={1} brule={0} etiq={0} p={s.ballon} echelle={ECHELLE_BALLON} />
      <Drapeau p={POTEAU_FR} emoji="🇫🇷" e={1} taille={2.2} />
      {MATS.map((p, i) => <Drapeau key={i} p={p} emoji={PAYS_EP05[i]} e={1} taille={1.8} />)}
      <TourEiffel p={TOUR_P} e={s.tour} />
      <Ilot c={STADE_P} r={2.4} e={s.ilot} />
      <StadeCoupe e={s.stade} t={t} />
      {/* les 8 qualifiés, derrière la tribune du fond */}
      {QUALIFIES.map((q, i) => <Drapeau key={q.d} p={add(SOL, [-1.4 + i * 0.4, 0, -1.55])} emoji={q.d} e={s.qualif[i] * s.stade} taille={1.25} />)}
      {/* les autres pays, en haut de la tribune */}
      {TRIBUNES.map((d, i) => <Drapeau key={d} p={add(SOL, [-1.22 + i * 0.188, 0.58, -1.27])} emoji={d} e={s.tribunes[i] * s.stade} taille={0.45} />)}
    </Monde>
  );
};

/* ------------------------------------------------------------------ habillage */

/** Accroche : 207 votants, 41 pays, et une pluie de tous les drapeaux. */
const Accroche: React.FC<{t: number}> = ({t}) => {
  const {fps} = useVideoConfig();
  if (t >= R.robin) return null;
  const f = t * 30;
  const e1 = spring({frame: f, fps, config: {damping: 12}});
  const e2 = t >= T(4) ? spring({frame: (t - T(4)) * 30, fps, config: {damping: 12}}) : 0;
  const n1 = Math.round(interpolate(t, [0, T(3) + 0.3], [0, 207], clamp));
  const n2 = Math.round(interpolate(t, [T(4), T(7) + 0.3], [0, 41], clamp));
  const sortie = interpolate(t, [R.robin - 0.25, R.robin], [1, 0], clamp);
  return (
    <AbsoluteFill style={{opacity: sortie}}>
      {TOUS.map((d, i) => {
        const x = (Math.sin(i * 77.3) * 0.5 + 0.5) * 980;
        const v = 7 + (Math.sin(i * 13.7) * 0.5 + 0.5) * 8;
        const y = -140 + ((f * v + i * 97) % 2100);
        return <div key={i} style={{position: 'absolute', left: x, top: y, fontSize: 64 + (i % 3) * 16, transform: `rotate(${Math.sin(f / 10 + i) * 18}deg)`}}>{d}</div>;
      })}
      <div style={{position: 'absolute', top: 600, left: 0, right: 0, textAlign: 'center', fontFamily: TEXTE, fontWeight: 900}}>
        <div style={{transform: `scale(${e1})`}}>
          <div style={{fontSize: 190, lineHeight: 1, color: '#fff', ...contour('#1b1d24', 18)}}>{n1}</div>
          <div style={{fontSize: 64, color: '#ffc928', ...contour('#1b1d24', 12)}}>VOTANTS</div>
        </div>
        <div style={{transform: `scale(${e2})`, marginTop: 30}}>
          <div style={{fontSize: 190, lineHeight: 1, color: '#fff', ...contour('#1b1d24', 18)}}>{n2}</div>
          <div style={{fontSize: 64, color: '#ffc928', ...contour('#1b1d24', 12)}}>PAYS 🌍</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

/** Le vote de l'épisode 5 : B 10, A 1. */
const VoteEp5: React.FC<{t: number}> = ({t}) => {
  const {fps} = useVideoConfig();
  if (!dans(t, R.dix, R.mais)) return null;
  const e = spring({frame: (t - R.dix) * 30, fps, config: {damping: 12}});
  return (
    <div style={{position: 'absolute', top: 1040, left: 0, right: 0, display: 'flex', justifyContent: 'center', transform: `scale(${e})`}}>
      <div style={{display: 'flex', gap: 40, alignItems: 'center', background: 'rgba(27,29,36,0.8)', borderRadius: 34, padding: '18px 40px', fontFamily: TEXTE, fontWeight: 900}}>
        <span style={{fontSize: 58, color: '#ffc928'}}>B 🗼 10</span>
        <span style={{fontSize: 40, color: '#8a8f99'}}>A 🥖 1</span>
      </div>
    </div>
  );
};

/** Les 8 qualifiés, qui s'ajoutent au fil de l'énumération. */
const Qualifies: React.FC<{t: number}> = ({t}) => {
  const {fps} = useVideoConfig();
  if (!dans(t, R.qualif, R.quarts)) return null;
  return (
    <div style={{position: 'absolute', top: 520, left: 40, right: 40, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16}}>
      {QUALIFIES.map((q, i) => {
        const e = t >= R.pays[i] ? spring({frame: (t - R.pays[i]) * 30, fps, config: {damping: 10, stiffness: 200}}) : 0;
        return (
          <div key={i} style={{display: 'flex', flexDirection: 'column', alignItems: 'center', transform: `scale(${e})`, background: 'rgba(27,29,36,0.72)', borderRadius: 24, padding: '10px 4px'}}>
            <div style={{fontSize: 96, lineHeight: 1}}>{q.d}</div>
            <div style={{fontFamily: TEXTE, fontWeight: 900, fontSize: q.nom.length > 9 ? 22 : 30, color: '#fff', marginTop: 4}}>{q.nom}</div>
            <div style={{fontFamily: TEXTE, fontWeight: 900, fontSize: 26, color: '#ffc928'}}>{q.nb} voix</div>
          </div>
        );
      })}
    </div>
  );
};

/** Le tableau des quarts de finale, en deux moitiés. */
const Tableau: React.FC<{t: number}> = ({t}) => {
  const {fps} = useVideoConfig();
  if (!dans(t, R.quarts, R.tribunes)) return null;
  const petit = t >= R.regle; // pendant la règle, le tableau se range en haut
  return (
    <div style={{position: 'absolute', top: petit ? 440 : 470, left: 60, right: 60, display: 'flex', flexDirection: 'column', gap: petit ? 8 : 16,
      transform: `scale(${petit ? 0.62 : 1})`, transformOrigin: 'top center'}}>
      {MATCHS.map(([a, b], i) => {
        const e = t >= R.matchs[i] ? spring({frame: (t - R.matchs[i]) * 30, fps, config: {damping: 12, stiffness: 180}}) : 0;
        const actif = !petit && dans(t, R.matchs[i], R.matchs[i + 1] ?? R.regle);
        return (
          <div key={i}>
            {i === 2 && <div style={{height: 6, background: '#ffc928', borderRadius: 3, margin: '4px 80px 12px', opacity: e}} />}
            <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', transform: `scale(${e * (actif ? 1.06 : 1)})`, opacity: e > 0.01 ? 1 : 0,
              background: actif ? 'rgba(255,201,40,0.95)' : 'rgba(27,29,36,0.82)', borderRadius: 26, padding: '12px 26px', fontFamily: TEXTE, fontWeight: 900}}>
              <span style={{fontSize: 70, lineHeight: 1}}>{QUALIFIES[a].d}</span>
              <span style={{fontSize: 40, color: actif ? '#1b1d24' : '#fff', flex: 1, textAlign: 'center'}}>{QUALIFIES[a].nom} <span style={{color: actif ? '#e84a5f' : '#ffc928'}}>VS</span> {QUALIFIES[b].nom}</span>
              <span style={{fontSize: 70, lineHeight: 1}}>{QUALIFIES[b].d}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

/** La règle : 1 personne = 1 but. */
const Regle: React.FC<{t: number}> = ({t}) => {
  const {fps} = useVideoConfig();
  if (!dans(t, R.regle + 0.3, R.tribunes)) return null;
  const e = spring({frame: (t - R.regle - 0.3) * 30, fps, config: {damping: 11}});
  const but = t >= R.but + 0.2 ? spring({frame: (t - R.but - 0.2) * 30, fps, config: {damping: 8, stiffness: 220}}) : 0;
  return (
    <div style={{position: 'absolute', top: 980, left: 0, right: 0, textAlign: 'center', fontFamily: TEXTE, fontWeight: 900}}>
      <div style={{display: 'inline-block', transform: `scale(${e}) rotate(-2deg)`, background: '#fff', borderRadius: 28, padding: '16px 34px', boxShadow: '0 10px 0 rgba(0,0,0,0.2)'}}>
        <span style={{fontSize: 62, color: '#1b1d24'}}>1 PERSONNE = 1 BUT ⚽</span>
      </div>
      {but > 0 && <div style={{marginTop: 26, fontSize: 120, color: '#ffc928', transform: `scale(${but})`, ...contour('#1b1d24', 16)}}>BUT !</div>}
    </div>
  );
};

/** Les pays non qualifiés, qui montent dans les tribunes. */
const Tribunes: React.FC<{t: number}> = ({t}) => {
  const {fps} = useVideoConfig();
  if (!dans(t, R.tribunes + 0.2, R.abonne)) return null;
  return (
    <div style={{position: 'absolute', top: 1010, left: 40, right: 40, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 10}}>
      {AUTRES.map((d, i) => {
        const de = R.tribunes + 0.3 + i * 0.07;
        const e = t >= de ? spring({frame: (t - de) * 30, fps, config: {damping: 10, stiffness: 200}}) : 0;
        return <div key={i} style={{fontSize: 62, lineHeight: 1, transform: `scale(${e})`}}>{d}</div>;
      })}
    </div>
  );
};

const TITRES: DefTitre[] = [
  {de: 0, petit: 'VOUS AVEZ FAIT', grand: "EXPLOSER L'ÎLE !"},
  {de: R.robin, petit: 'ROBIN RENTRE DE PARIS', grand: 'AVEC…'},
  {de: R.tour, petit: 'VOUS AVEZ CHOISI B', grand: 'LA TOUR EIFFEL !'},
  {de: R.mais, petit: 'AUTANT DE PAYS ?', grand: 'FINI LE SIMPLE VOTE'},
  {de: R.coupe, petit: 'LA COUPE DU MONDE', grand: 'DES ABONNÉS !'},
  {de: R.qualif, petit: 'LES 8 QUALIFIÉS', grand: 'VOS PAYS'},
  {de: R.quarts, petit: 'TABLEAU', grand: 'QUARTS DE FINALE'},
  {de: R.regle, petit: 'ÉCRIS TON PAYS', grand: '= UN BUT POUR LUI'},
  {de: R.tribunes, petit: 'PAS QUALIFIÉ ?', grand: 'DANS LES TRIBUNES'},
  {de: R.abonne, petit: 'LES 4 MATCHS', grand: 'AU PROCHAIN ÉPISODE'},
];

const PAQUETS = fairePaquets(voix, {
  0: '*207*', 1: '', 2: '', 3: '*votants.*', 4: '*41*', 5: '', 6: '', 7: '*pays.*', 11: '*exploser*', 12: "*l'île !*", 13: '', 17: '*Paris…*', 20: '*mini*', 21: '*tour*',
  22: '*Eiffel :*', 23: '', 24: '*10*', 27: '*1.*', 35: '*vote,*', 37: '*fini.*', 40: '*Coupe*', 42: '*monde*', 44: '*abonnés !*', 45: '', 47: '*8*', 53: '*qualifiés :*', 54: '',
  56: '*France,*', 58: '*Maroc,*', 59: "*l'Algérie,*", 61: '*Canada,*', 63: '*Tunisie,*', 65: '*Côte*', 66: "*d'Ivoire,*", 68: '*Sénégal*', 71: '*Portugal.*',
  72: '*Quarts*', 74: '*finale :*', 75: '', 76: '*France*', 78: '*Portugal.*', 79: '*Algérie*', 81: '*Côte*', 82: "*d'Ivoire.*", 83: '*Maroc*', 85: '*Sénégal.*',
  87: '*Canada*', 89: '*Tunisie.*', 93: '*simple :*', 94: '', 96: '*personne*', 100: '*pays*', 103: '*but*', 110: '*qualifié ?*', 111: '', 115: '', 117: '*drapeau*',
  121: '*tribunes.*', 122: '*Abonne-toi*', 126: '*4*', 127: '*matchs*',
});

const BULLES: DefBulle[] = [
  {de: R.tribunes + 1.0, a: R.abonne, pseudo: '@abonne_182', texte: 'Italie je me suis abonné pour ma cabane', x: 70, y: 560, rot: -2},
];

/* ------------------------------------------------------------------ composition */

export const IleYouTubeEp06: React.FC = () => {
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
      <Accroche t={t} />
      <Titre t={t} titres={TITRES} />
      <VoteEp5 t={t} />
      <Qualifies t={t} />
      <Tableau t={t} />
      <Regle t={t} />
      <Tribunes t={t} />
      <Bulles t={t} bulles={BULLES} />
      <SousTitre t={t} paquets={PAQUETS} />
      <BoutonAbonne t={t} de={R.abonne + 0.1} />
      <Confettis t={t} de={R.coupe + 0.3} a={R.qualif} />
      <Confettis t={t} de={R.abonne + 1.12} />
      <Audio src={staticFile('ile/youtube_ep06_voix.wav')} />
    </AbsoluteFill>
  );
};
