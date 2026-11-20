import {ThreeCanvas} from '@remotion/three';
import {AbsoluteFill, Audio, Easing, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import voix from './youtube_ep08_voix.json';
import {Abri, Etat, Monde} from './Ile3D';
import {ABRI, ABRI_ECHELLE, ROBIN} from './IleTikTokEp02';
import {Plages} from './IleTikTokEp03';
import {Ilot} from './IleTikTokEp04';
import {Drapeau} from './IleTikTokEp06';
import {Grotte, Jungle, Source} from './IleYouTubeEp03';
import {BALLON, MATS, Montgolfiere, Singe} from './IleYouTubeEp04';
import {CABANES, ECHELLE_BALLON, PAYS_EP05, POTEAU_FR, SOL, STADE_P, TOUR_P, TRIBUNES, TourEiffel} from './IleYouTubeEp06';
import {useMat} from './outils3d';
import {BoutonAbonne, Confettis, DefTitre, SousTitre, TEXTE, Titre, contour, fairePaquets, usePolicesPretes} from './habillage';

/**
 * L'Île des Abonnés — branche YouTube Shorts, épisode 8 (relevé du 19/11/2026, releves/youtube_ep08_note.md).
 * Épisode 7 « quarts » : 4,6 k vues, 310 commentaires, 185 votants. 1 personne = 1 but.
 * Demi-finales : France 62–41 Algérie, Maroc 65–17 Tunisie. FINALE France – Maroc (Maroc +3).
 */

const FIN = voix.duree + 1.2;
export const DUREE_ILE_YT_EP08 = Math.ceil(FIN * 30);
const T = (i: number) => voix.mots[i].a - 0.08;

const R = {
  finale: T(3), demis: T(14),
  m: [T(18), T(34)], score: [T(22), T(38)], passe: [T(28), T(41)],
  regarde: T(47), maroc: T(52), france: T(56), ecart: T(60),
  joue: T(65), regle: T(73), but: T(81), tribunes: T(82), ecris: T(87), coupe: T(97), abonne: T(103),
};

type V3 = [number, number, number];
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const mix = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const dans = (t: number, a: number, b: number) => t >= a && t < b;
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

type Equipe = {d: string; nom: string};
const FR: Equipe = {d: '🇫🇷', nom: 'FRANCE'};
const DZ: Equipe = {d: '🇩🇿', nom: 'ALGÉRIE'};
const MA: Equipe = {d: '🇲🇦', nom: 'MAROC'};
const TN: Equipe = {d: '🇹🇳', nom: 'TUNISIE'};
const DEMIS: [Equipe, Equipe, number, number][] = [[FR, DZ, 62, 41], [MA, TN, 65, 17]];
// 'q' = éliminé en quart (déjà baissé), 0/1 = éliminé en demi-finale n°
const MATS_Q: {d: string; sort: 'reste' | 'q' | 0 | 1}[] = [
  {d: '🇫🇷', sort: 'reste'}, {d: '🇵🇹', sort: 'q'}, {d: '🇩🇿', sort: 0}, {d: '🇨🇮', sort: 'q'},
  {d: '🇲🇦', sort: 'reste'}, {d: '🇸🇳', sort: 'q'}, {d: '🇨🇦', sort: 'q'}, {d: '🇹🇳', sort: 1},
];
const ELIMINES = ['🇩🇿', '🇹🇳', '🇵🇹', '🇨🇮', '🇸🇳', '🇨🇦', '🇧🇪', '🇨🇭', '🇨🇩', '🇨🇲', '🇮🇹', '🇪🇸', '🇷🇪', '🇬🇦', '🇲🇫', '🇵🇱', '🇯🇵', '🇧🇯', '🇬🇵', '🇬🇪', '🇹🇷'];

const posBalle = (t: number): V3 => {
  const fenetres: [number, number][] = [[R.m[0], R.m[1]], [R.m[1], R.regarde], [R.regle + 0.4, R.but + 0.2]];
  for (const [a, b] of fenetres) {
    if (dans(t, a, b)) {
      const k = Easing.in(Easing.quad)(((t - a) % 0.9) / 0.9);
      return [0.3 + k * 1.15, 0.14 + Math.sin(k * Math.PI) * 0.25, 0.2 - k * 0.2];
    }
  }
  return [0, 0.14, 0];
};

const StadeCoupe: React.FC<{t: number}> = ({t}) => {
  const pelouse = useMat('#3fae4f');
  const raie = useMat('#9be08f');
  const blanc = useMat('#ffffff');
  const rouge = useMat('#e84a5f');
  const bleu = useMat('#3f7fd9');
  const gris = useMat('#8a8f99');
  const lampe = useMat('#fff3a0', {emissive: '#ffe066', emissiveIntensity: 1});
  const or = useMat('#ffc928', {emissive: '#b07800', emissiveIntensity: 0.35, metalness: 0.4, roughness: 0.3});
  const socle = useMat('#2b2f38');
  const tourne = t >= R.coupe ? (t - R.coupe) * 0.8 : 0;
  return (
    <group position={SOL}>
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
      {[0, 1, 2].map((r) => (
        <mesh key={r} material={r % 2 ? bleu : rouge} position={[0, 0.1 + r * 0.14, -(0.95 + r * 0.16)]} castShadow><boxGeometry args={[2.6, 0.14 + r * 0.14, 0.16]} /></mesh>
      ))}
      {[[-1.4, -1.0], [1.4, -1.0], [-1.4, 0.9], [1.4, 0.9]].map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          <mesh material={gris} position={[0, 0.7, 0]}><cylinderGeometry args={[0.03, 0.03, 1.4, 5]} /></mesh>
          <mesh material={lampe} position={[0, 1.42, 0]}><boxGeometry args={[0.22, 0.12, 0.06]} /></mesh>
        </group>
      ))}
      <mesh material={blanc} position={posBalle(t)} castShadow><icosahedronGeometry args={[0.07, 1]} /></mesh>
      <group position={[0, 0, 1.55]}>
        <mesh material={socle} position={[0, 0.12, 0]}><boxGeometry args={[0.3, 0.24, 0.3]} /></mesh>
        <group rotation={[0, tourne, 0]}>
          <mesh material={or} position={[0, 0.3, 0]}><cylinderGeometry args={[0.07, 0.1, 0.12, 12]} /></mesh>
          <mesh material={or} position={[0, 0.42, 0]}><cylinderGeometry args={[0.03, 0.05, 0.14, 10]} /></mesh>
          <mesh material={or} position={[0, 0.58, 0]} scale={[1, 1.15, 1]}><sphereGeometry args={[0.12, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.62]} /></mesh>
          {[-1, 1].map((s) => <mesh key={s} material={or} position={[s * 0.13, 0.57, 0]} rotation={[0, 0, Math.PI / 2]}><torusGeometry args={[0.05, 0.014, 6, 12, Math.PI]} /></mesh>)}
        </group>
      </group>
    </group>
  );
};

type Plan = {de: number; p0: V3; p1: V3; c: V3};
const PLANS: Plan[] = [
  {de: 0, p0: add(SOL, [0.5, 1.5, 4.2]), p1: add(SOL, [0.3, 1.3, 3.6]), c: add(SOL, [0, 0.5, 0.4])},
  {de: R.demis, p0: [13, 14, 13], p1: [12, 13, 12], c: [4.2, 0.4, -3.6]},
  {de: R.m[0], p0: add(SOL, [0.6, 1.0, 2.0]), p1: add(SOL, [0.55, 0.95, 1.8]), c: add(SOL, [0.95, 0.25, 0])},
  {de: R.m[1], p0: add(SOL, [1.8, 2.2, 3.6]), p1: add(SOL, [1.5, 2.0, 3.2]), c: add(SOL, [0.2, 0.3, -0.3])},
  {de: R.regarde, p0: add(SOL, [-1.2, 4.6, 6.2]), p1: add(SOL, [-0.9, 4.2, 5.6]), c: add(SOL, [0, 0.3, -0.4])},
  {de: R.joue, p0: add(SOL, [0, 7.5, 6.5]), p1: add(SOL, [0, 7.0, 5.8]), c: SOL},
  {de: R.regle, p0: add(SOL, [0.6, 1.0, 2.0]), p1: add(SOL, [0.55, 0.95, 1.8]), c: add(SOL, [0.95, 0.25, 0])},
  {de: R.tribunes, p0: add(SOL, [-1.8, 3.6, 5.4]), p1: add(SOL, [-1.5, 3.3, 4.9]), c: add(SOL, [0, 0.3, -0.6])},
  {de: R.coupe, p0: add(SOL, [0.4, 0.9, 2.9]), p1: add(SOL, [0.3, 0.85, 2.6]), c: add(SOL, [0, 0.5, 1.55])},
  {de: R.abonne, p0: [0, 2.0, 5.9], p1: [0, 1.95, 5.1], c: [0, 1.75, 2.2]},
];

const camera = (t: number): Etat['cam'] => {
  const i = Math.max(0, PLANS.findIndex((p, k) => t >= p.de && t < (PLANS[k + 1]?.de ?? Infinity)));
  const p = PLANS[i];
  const fin = PLANS[i + 1]?.de ?? FIN;
  return {pos: mix(p.p0, p.p1, interpolate(t, [p.de, fin], [0, 1], clamp)), cible: p.c, fov: 40};
};

const useScene = (t: number) => {
  const {fps} = useVideoConfig();
  const pop = (de: number) => (t < de ? 0 : spring({frame: (t - de) * 30, fps, config: {damping: 11, stiffness: 170}}));
  const etat: Etat = {
    cam: camera(t),
    robin: {humeur: 'joyeux', position: ROBIN, bras: t >= R.abonne ? 'salue' : 'repos'},
    cielDegage: true,
    cabanes: CABANES.map(() => 1),
    etiquettes: 0,
  };
  return {etat, mats: MATS_Q.map((m) => (m.sort === 'reste' ? 1 : m.sort === 'q' ? 0 : 1 - pop(R.passe[m.sort] + 0.1)))};
};

const Monde8: React.FC<{t: number}> = ({t}) => {
  const s = useScene(t);
  return (
    <Monde etat={s.etat} cabanesDef={CABANES} parcellesVote={[]}>
      <Plages g={1} d={1} />
      <Jungle e={1} />
      <Source e={1} />
      <Grotte e={1} yeux={0} etiq={0} />
      <group position={ABRI}><Abri e={ABRI_ECHELLE} /></group>
      <Singe e={1} />
      <Montgolfiere e={1} brule={0} etiq={0} p={BALLON} echelle={ECHELLE_BALLON} />
      <Drapeau p={POTEAU_FR} emoji="🇫🇷" e={1} taille={2.2} />
      {MATS.map((p, i) => <Drapeau key={i} p={p} emoji={PAYS_EP05[i]} e={1} taille={1.8} />)}
      <TourEiffel p={TOUR_P} e={1} />
      <Ilot c={STADE_P} r={2.4} e={1} />
      <StadeCoupe t={t} />
      {MATS_Q.map((m, i) => <Drapeau key={m.d} p={add(SOL, [-1.4 + i * 0.4, 0, -1.55])} emoji={m.d} e={Math.max(0.001, s.mats[i])} taille={1.25} />)}
      {TRIBUNES.map((d, i) => <Drapeau key={d} p={add(SOL, [-1.22 + i * 0.188, 0.58, -1.27])} emoji={d} e={1} taille={0.45} />)}
    </Monde>
  );
};

const Affiche: React.FC<{t: number}> = ({t}) => {
  const {fps} = useVideoConfig();
  if (t >= R.demis) return null;
  const e = spring({frame: t * 30, fps, config: {damping: 11}});
  const f = t >= R.finale ? spring({frame: (t - R.finale) * 30, fps, config: {damping: 8, stiffness: 220}}) : 0;
  return (
    <div style={{position: 'absolute', top: 560, left: 0, right: 0, textAlign: 'center', fontFamily: TEXTE, fontWeight: 900}}>
      <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 40, transform: `scale(${e})`}}>
        <div style={{fontSize: 200, lineHeight: 1}}>🇫🇷</div>
        <div style={{fontSize: 90, color: '#ffc928', ...contour('#1b1d24', 14)}}>VS</div>
        <div style={{fontSize: 200, lineHeight: 1}}>🇲🇦</div>
      </div>
      {f > 0 && (
        <div style={{marginTop: 24, transform: `scale(${f}) rotate(-3deg)`}}>
          <span style={{fontSize: 110, color: '#fff', background: '#e84a5f', padding: '6px 34px', borderRadius: 24, border: '7px solid #fff'}}>FINALE 🏆</span>
        </div>
      )}
    </div>
  );
};

const Cote: React.FC<{q: Equipe; n: number; u: number; gagne: boolean; fini: boolean}> = ({q, n, u, gagne, fini}) => (
  <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', width: 330, opacity: fini && !gagne ? 0.45 : 1, transform: `scale(${fini && gagne ? 1.08 : 1})`}}>
    <div style={{fontSize: 140, lineHeight: 1}}>{q.d}</div>
    <div style={{fontSize: 42, color: '#fff', marginTop: 6}}>{q.nom}</div>
    <div style={{fontSize: 130, lineHeight: 1, color: gagne && fini ? '#ffc928' : '#fff', ...contour('#1b1d24', 14)}}>{Math.round(n * u)}</div>
  </div>
);

const Match: React.FC<{t: number}> = ({t}) => {
  const {fps} = useVideoConfig();
  const i = R.m.findIndex((d, k) => dans(t, d, R.m[k + 1] ?? R.regarde));
  if (i < 0) return null;
  const [a, b, na, nb] = DEMIS[i];
  const e = spring({frame: (t - R.m[i]) * 30, fps, config: {damping: 12}});
  const u = interpolate(t, [R.score[i] - 0.3, R.score[i] + 1.0], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
  const fini = t >= R.passe[i];
  const tampon = fini ? spring({frame: (t - R.passe[i]) * 30, fps, config: {damping: 9, stiffness: 220}}) : 0;
  return (
    <div style={{position: 'absolute', top: 540, left: 0, right: 0, display: 'flex', justifyContent: 'center', fontFamily: TEXTE, fontWeight: 900, transform: `scale(${e})`}}>
      <div style={{position: 'relative', display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(27,29,36,0.82)', borderRadius: 40, padding: '30px 30px 24px'}}>
        <Cote q={a} n={na} u={u} gagne fini={fini} />
        <div style={{fontSize: 60, color: '#ffc928'}}>–</div>
        <Cote q={b} n={nb} u={u} gagne={false} fini={fini} />
        <div style={{position: 'absolute', top: -26, left: 0, right: 0, textAlign: 'center'}}>
          <span style={{fontSize: 34, color: '#1b1d24', background: '#ffc928', padding: '6px 22px', borderRadius: 14}}>DEMI-FINALE {i + 1}/2</span>
        </div>
        {tampon > 0 && (
          <div style={{position: 'absolute', left: 0, right: 0, bottom: -60, textAlign: 'center', transform: `rotate(-6deg) scale(${2 - tampon})`, opacity: Math.min(1, tampon)}}>
            <span style={{fontSize: 64, color: '#fff', background: '#2bb34a', padding: '8px 26px', borderRadius: 18, border: '6px solid #fff'}}>{a.nom} EN FINALE !</span>
          </div>
        )}
      </div>
    </div>
  );
};

const Duel: React.FC<{t: number}> = ({t}) => {
  const {fps} = useVideoConfig();
  if (!dans(t, R.regarde, R.regle)) return null;
  const sp = (de: number) => (t >= de ? spring({frame: (t - de) * 30, fps, config: {damping: 10, stiffness: 180}}) : 0);
  const ee = t >= R.ecart ? spring({frame: (t - R.ecart) * 30, fps, config: {damping: 8, stiffness: 220}}) : 0;
  const direct = t >= R.joue;
  return (
    <div style={{position: 'absolute', top: 540, left: 0, right: 0, textAlign: 'center', fontFamily: TEXTE, fontWeight: 900}}>
      <div style={{display: 'flex', justifyContent: 'center', gap: 70}}>
        {[{q: MA, n: 65, e: sp(R.maroc)}, {q: FR, n: 62, e: sp(R.france)}].map(({q, n, e}) => (
          <div key={q.nom} style={{transform: `scale(${e})`, display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
            <div style={{fontSize: 150, lineHeight: 1}}>{q.d}</div>
            <div style={{fontSize: 150, lineHeight: 1, color: '#fff', ...contour('#1b1d24', 16)}}>{n}</div>
            <div style={{fontSize: 40, color: '#ffc928', ...contour('#1b1d24', 8)}}>BUTS</div>
          </div>
        ))}
      </div>
      {ee > 0 && (
        <div style={{marginTop: 26, transform: `scale(${ee}) rotate(-3deg)`}}>
          <span style={{fontSize: direct ? 40 : 54, whiteSpace: 'nowrap', color: '#fff', background: direct ? '#1b1d24' : '#e84a5f', padding: '8px 24px', borderRadius: 18, border: '6px solid #fff'}}>
            {direct ? '🔴 EN DIRECT DANS LES COMMENTAIRES' : "SEULEMENT 3 BUTS D'ÉCART !"}
          </span>
        </div>
      )}
    </div>
  );
};

const Regle: React.FC<{t: number}> = ({t}) => {
  const {fps} = useVideoConfig();
  if (!dans(t, R.regle + 0.2, R.tribunes)) return null;
  const e = spring({frame: (t - R.regle - 0.2) * 30, fps, config: {damping: 11}});
  const but = t >= R.but - 0.3 ? spring({frame: (t - R.but + 0.3) * 30, fps, config: {damping: 8, stiffness: 220}}) : 0;
  return (
    <div style={{position: 'absolute', top: 560, left: 0, right: 0, textAlign: 'center', fontFamily: TEXTE, fontWeight: 900}}>
      <div style={{display: 'inline-block', transform: `scale(${e}) rotate(-2deg)`, background: '#fff', borderRadius: 28, padding: '16px 34px', boxShadow: '0 10px 0 rgba(0,0,0,0.2)'}}>
        <span style={{fontSize: 62, color: '#1b1d24'}}>1 PERSONNE = 1 BUT ⚽</span>
      </div>
      {but > 0 && <div style={{marginTop: 26, fontSize: 120, color: '#ffc928', transform: `scale(${but})`, ...contour('#1b1d24', 16)}}>BUT !</div>}
    </div>
  );
};

const Tribunes: React.FC<{t: number}> = ({t}) => {
  const {fps} = useVideoConfig();
  if (!dans(t, R.tribunes, R.coupe)) return null;
  const e = t >= R.ecris ? spring({frame: (t - R.ecris) * 30, fps, config: {damping: 9, stiffness: 200}}) : 0;
  return (
    <div style={{position: 'absolute', top: 560, left: 50, right: 50, textAlign: 'center', fontFamily: TEXTE, fontWeight: 900}}>
      <div style={{display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 10}}>
        {ELIMINES.map((d, i) => {
          const de = R.tribunes + 0.2 + i * 0.07;
          const s = t >= de ? spring({frame: (t - de) * 30, fps, config: {damping: 10, stiffness: 200}}) : 0;
          return <div key={i} style={{fontSize: 66, lineHeight: 1, transform: `scale(${s})`}}>{d}</div>;
        })}
      </div>
      {e > 0 && (
        <div style={{marginTop: 30, transform: `scale(${e})`}}>
          <span style={{fontSize: 74, color: '#fff', background: '#e84a5f', padding: '10px 30px', borderRadius: 22, border: '6px solid #fff'}}>ÉCRIS TON PAYS 👇</span>
        </div>
      )}
    </div>
  );
};

const TITRES: DefTitre[] = [
  {de: 0, petit: 'COUPE DU MONDE DES ABONNÉS', grand: "C'EST LA FINALE !"},
  {de: R.demis, petit: "MAIS D'ABORD", grand: 'LES DEMI-FINALES'},
  {de: R.m[0], petit: 'DEMI-FINALE 1', grand: 'FRANCE – ALGÉRIE'},
  {de: R.m[1], petit: 'DEMI-FINALE 2', grand: 'MAROC – TUNISIE'},
  {de: R.regarde, petit: 'REGARDE BIEN', grand: 'LES SCORES…'},
  {de: R.joue, petit: 'LA FINALE SE JOUE', grand: 'MAINTENANT'},
  {de: R.regle, petit: 'MÊME RÈGLE', grand: '1 PERSONNE = 1 BUT'},
  {de: R.tribunes, petit: 'TON PAYS EST ÉLIMINÉ ?', grand: 'DANS LES TRIBUNES'},
  {de: R.coupe, petit: 'QUI VA SOULEVER', grand: 'LA COUPE ?'},
  {de: R.abonne, petit: 'LE RÉSULTAT DE LA FINALE', grand: 'AU PROCHAIN ÉPISODE'},
];

const PAQUETS = fairePaquets(voix, {
  0: '*France*', 2: '*Maroc.*', 5: '*finale*', 8: '*Coupe*', 10: '*monde*', 12: '*abonnés !*', 13: '', 17: '*demi-finales.*', 18: '*France*', 20: '*Algérie :*', 21: '',
  22: '*62*', 25: '*41.*', 26: '', 27: '', 29: '*France*', 32: '*finale !*', 33: '', 34: '*Maroc*', 36: '*Tunisie :*', 37: '', 38: '*65*', 40: '*17.*', 42: '*Maroc*', 45: '*finale !*', 46: '',
  51: '*scores.*', 52: '*65*', 55: '*Maroc,*', 56: '*62*', 59: '*France.*', 61: '*3*', 63: "*d'écart !*", 64: '', 66: '*finale*', 69: '*maintenant,*', 72: '*commentaires.*',
  74: '*personne*', 78: '*pays*', 81: '*but.*', 85: '*éliminé ?*', 86: '', 87: '*Écris-le*', 89: 'même :', 90: '', 96: '*tribunes.*', 99: '*soulever*', 101: '*coupe ?*', 102: '',
  103: '*Abonne-toi*', 107: '*résultat*', 110: '*finale.*',
});

export const IleYouTubeEp08: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / 30;
  const {width, height} = useVideoConfig();
  const pret = usePolicesPretes();
  return (
    <AbsoluteFill style={{background: '#8fd6f6'}}>
      {pret && (
        <ThreeCanvas width={width} height={height} shadows camera={{fov: 40, near: 0.1, far: 300}} gl={{antialias: true}}>
          <Monde8 t={t} />
        </ThreeCanvas>
      )}
      <Affiche t={t} />
      <Titre t={t} titres={TITRES} />
      <Match t={t} />
      <Duel t={t} />
      <Regle t={t} />
      <Tribunes t={t} />
      <SousTitre t={t} paquets={PAQUETS} />
      <BoutonAbonne t={t} de={R.abonne + 0.1} />
      <Confettis t={t} de={R.finale + 0.1} a={R.demis} />
      {R.passe.map((p, i) => <Confettis key={i} t={t} de={p + 0.1} a={p + 1.6} />)}
      <Confettis t={t} de={R.coupe + 0.2} />
      <Audio src={staticFile('ile/youtube_ep08_voix.wav')} />
    </AbsoluteFill>
  );
};
