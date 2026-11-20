import {ThreeCanvas} from '@remotion/three';
import {AbsoluteFill, Audio, Easing, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import voix from './youtube_ep07_voix.json';
import {Abri, Etat, Monde} from './Ile3D';
import {ABRI, ABRI_ECHELLE, ROBIN} from './IleTikTokEp02';
import {Plages} from './IleTikTokEp03';
import {Ilot} from './IleTikTokEp04';
import {Drapeau} from './IleTikTokEp06';
import {Grotte, Jungle, Source} from './IleYouTubeEp03';
import {BALLON, MATS, Montgolfiere, Singe} from './IleYouTubeEp04';
import {CABANES, ECHELLE_BALLON, PAYS_EP05, POTEAU_FR, SOL, STADE_P, TOUR_P, TRIBUNES, TourEiffel} from './IleYouTubeEp06';
import {useMat} from './outils3d';
import {BoutonAbonne, Bulles, Confettis, DefBulle, DefTitre, SousTitre, TEXTE, Titre, contour, fairePaquets, usePolicesPretes} from './habillage';

/**
 * L'Île des Abonnés — branche YouTube Shorts, épisode 7 (relevé du 18/11/2026, releves/youtube_ep07_note.md).
 * Épisode 6 « Coupe du monde » : 5,6 k vues, 379 commentaires en 24 h. 1 personne = 1 but.
 * Quarts : France 49–15 Portugal, Algérie 20–14 Côte d'Ivoire, Maroc 51–11 Sénégal, Canada 3–12 Tunisie.
 * Demi-finales : France–Algérie, Maroc–Tunisie. Duel des leaders Maroc 51 / France 49.
 */

const FIN = voix.duree + 1.2;
export const DUREE_ILE_YT_EP07 = Math.ceil(FIN * 30);
const T = (i: number) => voix.mots[i].a - 0.08;

const R = {
  quarts: T(8),
  m: [T(14), T(28), T(39), T(53)], // début de chaque match
  score: [T(20), T(33), T(43), T(62)], // le score tombe
  passe: [T(24), T(36), T(48), T(64)], // le vainqueur est annoncé
  demis: T(66), d: [T(68), T(72)], attention: T(75), maroc: T(78), france: T(84), ecart: T(87),
  regle: T(91), but: T(101), finale: T(103), ecris: T(108), abonne: T(111),
};

type V3 = [number, number, number];
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const mix = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const dans = (t: number, a: number, b: number) => t >= a && t < b;
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

/* ------------------------------------------------------------------ données */

type Equipe = {d: string; nom: string};
const FR: Equipe = {d: '🇫🇷', nom: 'FRANCE'};
const PT: Equipe = {d: '🇵🇹', nom: 'PORTUGAL'};
const DZ: Equipe = {d: '🇩🇿', nom: 'ALGÉRIE'};
const CI: Equipe = {d: '🇨🇮', nom: "CÔTE D'IVOIRE"};
const MA: Equipe = {d: '🇲🇦', nom: 'MAROC'};
const SN: Equipe = {d: '🇸🇳', nom: 'SÉNÉGAL'};
const CA: Equipe = {d: '🇨🇦', nom: 'CANADA'};
const TN: Equipe = {d: '🇹🇳', nom: 'TUNISIE'};
// [équipe A, équipe B, buts A, buts B] ; le vainqueur est celui qui a le plus de buts
const QUARTS: [Equipe, Equipe, number, number][] = [[FR, PT, 49, 15], [DZ, CI, 20, 14], [MA, SN, 51, 11], [CA, TN, 3, 12]];
// les 8 drapeaux derrière la tribune, et le match où chacun peut être éliminé
const MATS_Q: {e: Equipe; match: number; perd: boolean}[] = [
  {e: FR, match: 0, perd: false}, {e: PT, match: 0, perd: true}, {e: DZ, match: 1, perd: false}, {e: CI, match: 1, perd: true},
  {e: MA, match: 2, perd: false}, {e: SN, match: 2, perd: true}, {e: CA, match: 3, perd: true}, {e: TN, match: 3, perd: false},
];

/* ------------------------------------------------------------------ le stade */

/** Le ballon : il enchaîne les buts dans la cage de droite pendant les matchs, puis une dernière fois pendant la règle. */
const posBalle = (t: number): V3 => {
  const fenetres: [number, number][] = [...R.m.map((d, i): [number, number] => [d, R.m[i + 1] ?? R.demis]), [R.regle + 0.4, R.but + 0.2]];
  for (const [a, b] of fenetres) {
    if (dans(t, a, b)) {
      const u = ((t - a) % 0.9) / 0.9;
      const k = Easing.in(Easing.quad)(u);
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
        <mesh material={or} position={[0, 0.3, 0]}><cylinderGeometry args={[0.07, 0.1, 0.12, 12]} /></mesh>
        <mesh material={or} position={[0, 0.42, 0]}><cylinderGeometry args={[0.03, 0.05, 0.14, 10]} /></mesh>
        <mesh material={or} position={[0, 0.58, 0]} scale={[1, 1.15, 1]}><sphereGeometry args={[0.12, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.62]} /></mesh>
        {[-1, 1].map((s) => <mesh key={s} material={or} position={[s * 0.13, 0.57, 0]} rotation={[0, 0, Math.PI / 2]}><torusGeometry args={[0.05, 0.014, 6, 12, Math.PI]} /></mesh>)}
      </group>
    </group>
  );
};

/* ------------------------------------------------------------------ caméra */


type Plan = {de: number; p0: V3; p1: V3; c: V3};
const PLANS: Plan[] = [
  {de: 0, p0: [13, 14, 13], p1: [12, 13, 12], c: [4.2, 0.4, -3.6]},
  {de: R.quarts, p0: add(SOL, [0, 3.4, 5.6]), p1: add(SOL, [0, 2.8, 4.6]), c: add(SOL, [0, 0.3, 0])},
  {de: R.m[0], p0: add(SOL, [0.6, 1.0, 2.0]), p1: add(SOL, [0.55, 0.95, 1.8]), c: add(SOL, [0.95, 0.25, 0])},
  {de: R.m[1], p0: add(SOL, [-2.4, 1.6, 2.8]), p1: add(SOL, [-2.0, 1.5, 2.6]), c: add(SOL, [0, 0.4, -0.6])},
  {de: R.m[2], p0: add(SOL, [1.8, 2.2, 3.6]), p1: add(SOL, [1.5, 2.0, 3.2]), c: add(SOL, [0.2, 0.3, -0.3])},
  {de: R.m[3], p0: add(SOL, [-1.8, 3.6, 5.4]), p1: add(SOL, [-1.5, 3.3, 4.9]), c: add(SOL, [0, 0.3, -0.6])},
  {de: R.demis, p0: add(SOL, [0, 7.5, 6.5]), p1: add(SOL, [0, 7.0, 5.8]), c: SOL},
  {de: R.attention, p0: add(SOL, [-1.2, 4.6, 6.2]), p1: add(SOL, [-0.9, 4.2, 5.6]), c: add(SOL, [0, 0.3, -0.4])},
  {de: R.regle, p0: add(SOL, [0.6, 1.0, 2.0]), p1: add(SOL, [0.55, 0.95, 1.8]), c: add(SOL, [0.95, 0.25, 0])},
  {de: R.finale, p0: add(SOL, [0.4, 0.9, 2.9]), p1: add(SOL, [0.3, 0.85, 2.6]), c: add(SOL, [0, 0.5, 1.55])},
  {de: R.abonne, p0: [0, 2.0, 5.9], p1: [0, 1.95, 5.1], c: [0, 1.75, 2.2]},
];

const camera = (t: number): Etat['cam'] => {
  const i = Math.max(0, PLANS.findIndex((p, k) => t >= p.de && t < (PLANS[k + 1]?.de ?? Infinity)));
  const p = PLANS[i];
  const fin = PLANS[i + 1]?.de ?? FIN;
  return {pos: mix(p.p0, p.p1, interpolate(t, [p.de, fin], [0, 1], clamp)), cible: p.c, fov: 40};
};

/* ------------------------------------------------------------------ état */

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
  return {
    etat,
    // un drapeau éliminé s'abaisse quand son match est tranché
    mats: MATS_Q.map((m) => (m.perd ? 1 - pop(R.passe[m.match] + 0.1) : 1)),
  };
};

const Monde7: React.FC<{t: number}> = ({t}) => {
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
      {MATS_Q.map((m, i) => <Drapeau key={m.e.d} p={add(SOL, [-1.4 + i * 0.4, 0, -1.55])} emoji={m.e.d} e={Math.max(0.001, s.mats[i])} taille={1.25} />)}
      {TRIBUNES.map((d, i) => <Drapeau key={d} p={add(SOL, [-1.22 + i * 0.188, 0.58, -1.27])} emoji={d} e={1} taille={0.45} />)}
    </Monde>
  );
};

/* ------------------------------------------------------------------ habillage */

/** Accroche : le compteur 379 commentaires. */
const Accroche: React.FC<{t: number}> = ({t}) => {
  const {fps} = useVideoConfig();
  if (t >= R.quarts) return null;
  const e = spring({frame: t * 30, fps, config: {damping: 12}});
  const n = Math.round(interpolate(t, [0, T(3) + 0.2], [0, 379], clamp));
  return (
    <div style={{position: 'absolute', top: 620, left: 0, right: 0, textAlign: 'center', fontFamily: TEXTE, fontWeight: 900, transform: `scale(${e})`}}>
      <div style={{fontSize: 220, lineHeight: 1, color: '#fff', ...contour('#1b1d24', 20)}}>{n}</div>
      <div style={{fontSize: 62, color: '#ffc928', ...contour('#1b1d24', 12)}}>COMMENTAIRES 💬</div>
      <div style={{fontSize: 52, color: '#fff', marginTop: 8, ...contour('#1b1d24', 10)}}>EN 1 JOUR</div>
    </div>
  );
};

const Cote: React.FC<{q: Equipe; n: number; u: number; gagne: boolean; fini: boolean}> = ({q, n, u, gagne, fini}) => (
  <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', width: 330, opacity: fini && !gagne ? 0.45 : 1, transform: `scale(${fini && gagne ? 1.08 : 1})`}}>
    <div style={{fontSize: 140, lineHeight: 1}}>{q.d}</div>
    <div style={{fontSize: q.nom.length > 9 ? 32 : 42, color: '#fff', marginTop: 6}}>{q.nom}</div>
    <div style={{fontSize: 130, lineHeight: 1, color: gagne && fini ? '#ffc928' : '#fff', ...contour('#1b1d24', 14)}}>{Math.round(n * u)}</div>
  </div>
);

/** Le match en cours : les deux drapeaux, le score qui défile, puis « QUALIFIÉ ». */
const Match: React.FC<{t: number}> = ({t}) => {
  const {fps} = useVideoConfig();
  const i = R.m.findIndex((d, k) => dans(t, d, R.m[k + 1] ?? R.demis));
  if (i < 0) return null;
  const [a, b, na, nb] = QUARTS[i];
  const e = spring({frame: (t - R.m[i]) * 30, fps, config: {damping: 12}});
  const u = interpolate(t, [R.score[i] - 0.3, R.score[i] + 1.0], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
  const fini = t >= R.passe[i];
  const gagneA = na > nb;
  const tampon = fini ? spring({frame: (t - R.passe[i]) * 30, fps, config: {damping: 9, stiffness: 220}}) : 0;
  return (
    <div style={{position: 'absolute', top: 540, left: 0, right: 0, display: 'flex', justifyContent: 'center', fontFamily: TEXTE, fontWeight: 900, transform: `scale(${e})`}}>
      <div style={{position: 'relative', display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(27,29,36,0.82)', borderRadius: 40, padding: '30px 30px 24px'}}>
        <Cote q={a} n={na} u={u} gagne={gagneA} fini={fini} />
        <div style={{fontSize: 60, color: '#ffc928'}}>–</div>
        <Cote q={b} n={nb} u={u} gagne={!gagneA} fini={fini} />
        <div style={{position: 'absolute', top: -26, left: 0, right: 0, textAlign: 'center'}}>
          <span style={{fontSize: 34, color: '#1b1d24', background: '#ffc928', padding: '6px 22px', borderRadius: 14}}>QUART DE FINALE {i + 1}/4</span>
        </div>
        {tampon > 0 && (
          <div style={{position: 'absolute', left: 0, right: 0, bottom: -60, textAlign: 'center', transform: `rotate(-6deg) scale(${2 - tampon})`, opacity: Math.min(1, tampon)}}>
            <span style={{fontSize: 64, color: '#fff', background: i === 3 ? '#e84a5f' : '#2bb34a', padding: '8px 26px', borderRadius: 18, border: '6px solid #fff'}}>
              {(gagneA ? a : b).nom} {i === 3 ? 'SURPRISE !' : 'QUALIFIÉ !'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

const Ligne: React.FC<{a: Equipe; b: Equipe; e: number; sep?: boolean}> = ({a, b, e, sep}) => (
  <div>
    {sep && <div style={{height: 6, background: '#ffc928', borderRadius: 3, margin: '6px 120px 18px', opacity: e}} />}
    <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', transform: `scale(${e})`, background: 'rgba(27,29,36,0.85)', borderRadius: 28, padding: '16px 30px'}}>
      <span style={{fontSize: 90, lineHeight: 1}}>{a.d}</span>
      <span style={{fontSize: 44, color: '#fff', flex: 1, textAlign: 'center'}}>{a.nom} <span style={{color: '#ffc928'}}>VS</span> {b.nom}</span>
      <span style={{fontSize: 90, lineHeight: 1}}>{b.d}</span>
    </div>
  </div>
);

/** Les demi-finales, puis le duel des leaders (Maroc 51 / France 49). */
const Demis: React.FC<{t: number}> = ({t}) => {
  const {fps} = useVideoConfig();
  if (!dans(t, R.demis, R.regle)) return null;
  const sp = (de: number, damping = 12) => (t >= de ? spring({frame: (t - de) * 30, fps, config: {damping, stiffness: 180}}) : 0);
  if (t >= R.attention) {
    const ee = t >= R.ecart ? spring({frame: (t - R.ecart) * 30, fps, config: {damping: 8, stiffness: 220}}) : 0;
    return (
      <div style={{position: 'absolute', top: 540, left: 0, right: 0, textAlign: 'center', fontFamily: TEXTE, fontWeight: 900}}>
        <div style={{display: 'flex', justifyContent: 'center', gap: 70}}>
          {[{q: MA, n: 51, e: sp(R.maroc, 10)}, {q: FR, n: 49, e: sp(R.france, 10)}].map(({q, n, e}) => (
            <div key={q.nom} style={{transform: `scale(${e})`, display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
              <div style={{fontSize: 150, lineHeight: 1}}>{q.d}</div>
              <div style={{fontSize: 150, lineHeight: 1, color: '#fff', ...contour('#1b1d24', 16)}}>{n}</div>
              <div style={{fontSize: 40, color: '#ffc928', ...contour('#1b1d24', 8)}}>BUTS</div>
            </div>
          ))}
        </div>
        {ee > 0 && (
          <div style={{marginTop: 26, transform: `scale(${ee}) rotate(-3deg)`}}>
            <span style={{fontSize: 70, color: '#fff', background: '#e84a5f', padding: '8px 28px', borderRadius: 18, border: '6px solid #fff'}}>2 BUTS D'ÉCART !</span>
          </div>
        )}
      </div>
    );
  }
  return (
    <div style={{position: 'absolute', top: 520, left: 60, right: 60, display: 'flex', flexDirection: 'column', gap: 18, fontFamily: TEXTE, fontWeight: 900}}>
      <Ligne a={FR} b={DZ} e={sp(R.d[0])} />
      <Ligne a={MA} b={TN} e={sp(R.d[1])} sep />
    </div>
  );
};

/** La règle : 1 personne = 1 but. */
const Regle: React.FC<{t: number}> = ({t}) => {
  const {fps} = useVideoConfig();
  if (!dans(t, R.regle + 0.2, R.finale)) return null;
  const e = spring({frame: (t - R.regle - 0.2) * 30, fps, config: {damping: 11}});
  const but = t >= R.but + 0.2 ? spring({frame: (t - R.but - 0.2) * 30, fps, config: {damping: 8, stiffness: 220}}) : 0;
  return (
    <div style={{position: 'absolute', top: 560, left: 0, right: 0, textAlign: 'center', fontFamily: TEXTE, fontWeight: 900}}>
      <div style={{display: 'inline-block', transform: `scale(${e}) rotate(-2deg)`, background: '#fff', borderRadius: 28, padding: '16px 34px', boxShadow: '0 10px 0 rgba(0,0,0,0.2)'}}>
        <span style={{fontSize: 62, color: '#1b1d24'}}>1 PERSONNE = 1 BUT ⚽</span>
      </div>
      {but > 0 && <div style={{marginTop: 26, fontSize: 120, color: '#ffc928', transform: `scale(${but})`, ...contour('#1b1d24', 16)}}>BUT !</div>}
    </div>
  );
};

/** Fin : écris ton pays. */
const Ecris: React.FC<{t: number}> = ({t}) => {
  const {fps} = useVideoConfig();
  if (!dans(t, R.ecris, R.abonne)) return null;
  const e = spring({frame: (t - R.ecris) * 30, fps, config: {damping: 9, stiffness: 200}});
  return (
    <div style={{position: 'absolute', top: 980, left: 0, right: 0, textAlign: 'center', fontFamily: TEXTE, fontWeight: 900, transform: `scale(${e})`}}>
      <span style={{fontSize: 74, color: '#fff', background: '#e84a5f', padding: '10px 30px', borderRadius: 22, border: '6px solid #fff'}}>ÉCRIS TON PAYS 👇</span>
    </div>
  );
};

const TITRES: DefTitre[] = [
  {de: 0, petit: 'VOUS AVEZ FAIT', grand: 'EXPLOSER LES SCORES'},
  {de: R.quarts, petit: 'COUPE DU MONDE', grand: 'LES QUARTS !'},
  {de: R.m[0], petit: 'MATCH 1', grand: 'FRANCE – PORTUGAL'},
  {de: R.m[1], petit: 'MATCH 2', grand: "ALGÉRIE – CÔTE D'IVOIRE"},
  {de: R.m[2], petit: 'MATCH 3', grand: 'MAROC – SÉNÉGAL'},
  {de: R.m[3], petit: 'MATCH 4', grand: 'LA SURPRISE !'},
  {de: R.demis, petit: 'TABLEAU', grand: 'DEMI-FINALES'},
  {de: R.attention, petit: 'MAIS ATTENTION…', grand: 'LE DUEL DES LEADERS'},
  {de: R.regle, petit: 'MÊME RÈGLE', grand: '1 PERSONNE = 1 BUT'},
  {de: R.finale, petit: 'QUI IRA', grand: 'EN FINALE ?'},
  {de: R.abonne, petit: 'LES DEMI-FINALES', grand: 'AU PROCHAIN ÉPISODE'},
];

const PAQUETS = fairePaquets(voix, {
  0: '*379*', 1: '', 2: '', 3: '*commentaires*', 6: '*jour !*', 7: '', 9: '*quarts*', 13: '*joués.*', 15: 'match :', 16: '', 17: '*France*', 19: '*Portugal…*',
  20: '*49*', 23: '*15.*', 26: '*passe !*', 27: '', 28: '*Algérie*', 30: '*Côte*', 31: "*d'Ivoire :*", 32: '', 33: '*20*', 35: '*14.*', 37: '*passe !*', 38: '',
  39: '*Maroc*', 41: '*Sénégal :*', 42: '', 43: '*51*', 44: '', 45: '', 47: '*11.*', 50: '*écrase*', 51: '*tout !*', 52: '', 55: '*surprise :*', 56: '', 58: '*Tunisie*',
  61: '*Canada,*', 62: '*12*', 64: '*3 !*', 65: '', 66: '*Demi-finales :*', 67: '', 68: '*France*', 70: '*Algérie.*', 72: '*Maroc*', 74: '*Tunisie.*', 76: '*attention.*',
  78: '*Maroc*', 80: '*51*', 81: '', 82: '', 85: '*France*', 86: '*49.*', 87: '*2*', 89: "*d'écart !*", 90: '', 92: 'règle :', 93: '', 95: '*personne*', 99: '*pays*',
  102: '*but.*', 106: '*finale ?*', 107: '', 108: '*Écris*', 111: '*Abonne-toi*', 115: '*demi-finales.*',
});

const BULLES: DefBulle[] = [
  {de: R.passe[3] + 0.3, a: R.demis, pseudo: '@abonne_183', texte: 'BUT 🇹🇳🇹🇳🇹🇳🇹🇳🇹🇳', x: 90, y: 1080, rot: -2},
];

/* ------------------------------------------------------------------ composition */

export const IleYouTubeEp07: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / 30;
  const {width, height} = useVideoConfig();
  const pret = usePolicesPretes();
  return (
    <AbsoluteFill style={{background: '#8fd6f6'}}>
      {pret && (
        <ThreeCanvas width={width} height={height} shadows camera={{fov: 40, near: 0.1, far: 300}} gl={{antialias: true}}>
          <Monde7 t={t} />
        </ThreeCanvas>
      )}
      <Accroche t={t} />
      <Titre t={t} titres={TITRES} />
      <Match t={t} />
      <Demis t={t} />
      <Regle t={t} />
      <Ecris t={t} />
      <Bulles t={t} bulles={BULLES} />
      <SousTitre t={t} paquets={PAQUETS} />
      <BoutonAbonne t={t} de={R.abonne + 0.1} />
      {R.passe.map((p, i) => <Confettis key={i} t={t} de={p + 0.1} a={p + 1.6} />)}
      <Confettis t={t} de={R.abonne + 1.12} />
      <Audio src={staticFile('ile/youtube_ep07_voix.wav')} />
    </AbsoluteFill>
  );
};
