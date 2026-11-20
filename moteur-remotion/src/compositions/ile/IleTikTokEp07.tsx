import {ThreeCanvas} from '@remotion/three';
import {AbsoluteFill, Audio, Easing, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import voix from './tiktok_ep07_voix.json';
import {Abri, Etat, Monde, Naufrage} from './Ile3D';
import {ABRI, ABRI_ECHELLE, ChatNoir, Jacuzzi, Puits, ROBIN, Restaurant} from './IleTikTokEp02';
import {CABANES_EP03, Chihuahua, DecoFoot, MaisonPiscine, Mosquee, Patisserie, PetitChien, Plages, Scene as SceneCalvin} from './IleTikTokEp03';
import {
  Aeroport, BoulangerieHalloween, CabaneGateau, CabanePecheur, Chateau, EXT_A, EXT_B, FLIPEUR_CENTRE, Flipeur, Ilot, MaisonPaillettes, Panier, Stade,
} from './IleTikTokEp04';
import {BalancoireNoel, Boucherie, Casquette, EXT_F, FILS, Lucarne, MATS, Perroquet, VillaPoisson} from './IleTikTokEp05';
import {Drapeau, PAYS, POTEAU_PT} from './IleTikTokEp06';
import {useMat} from './outils3d';
import {BoutonAbonne, Bulles, Confettis, DefBulle, DefTitre, SousTitre, TEXTE, Titre, contour, fairePaquets, usePolicesPretes} from './habillage';

/**
 * L'Île des Abonnés — branche TikTok, épisode 7 « Coupe du monde » (relevé du 17/11/2026, voir releves/tiktok_ep07_note.md).
 * Remplace l'épisode « panne de carburant » (archivé : IleTikTokEp07Panne.tsx).
 * Ép. 6 : pastéis 1 – tramway 1 → égalité, on fait les deux. Pays (ép. 5 + 6, 1 par pseudo) : 20 personnes, 11 pays.
 * 8 places : 5 qualifiés (Portugal 4, France 4, Maroc 2, Sénégal 2, Palestine 2), 3 places à prendre entre 6 pays à 1 voix.
 * Règle : 1 personne qui écrit son pays = 1 but ; les 3 plus cités entrent.
 */

const FIN = voix.duree + 1.2;
export const DUREE_ILE_TT_EP07 = Math.ceil(FIN * 30);
const T = (i: number) => voix.mots[i].a - 0.08;

const R = {
  onze: T(2), mais: T(11), egal: T(21), deux: T(24), avion: T(28), tram: T(35), coupe: T(44), huit: T(52),
  pays: [61, 63, 65, 67, 70].map(T), reste: T(71), candidats: [83, 85, 87, 89, 93, 96].map(T),
  regle: T(97), but: T(110), trois: T(113), liste: T(121), ecris: T(129), abonne: T(137),
};

type V3 = [number, number, number];
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const mix = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const dans = (t: number, a: number, b: number) => t >= a && t < b;
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

/* ------------------------------------------------------------------ données */

const QUALIFIES: {d: string; nom: string; nb: number}[] = [
  {d: '🇵🇹', nom: 'PORTUGAL', nb: 4}, {d: '🇫🇷', nom: 'FRANCE', nb: 4}, {d: '🇲🇦', nom: 'MAROC', nb: 2}, {d: '🇸🇳', nom: 'SÉNÉGAL', nb: 2}, {d: '🇵🇸', nom: 'PALESTINE', nb: 2},
];
const CANDIDATS: {d: string; nom: string}[] = [
  {d: '🇩🇿', nom: 'ALGÉRIE'}, {d: '🇹🇳', nom: 'TUNISIE'}, {d: '🇹🇷', nom: 'TURQUIE'}, {d: '🇰🇷', nom: 'CORÉE DU SUD'}, {d: '🇨🇱', nom: 'CHILI'}, {d: '🇵🇰', nom: 'PAKISTAN'},
];
const TOUS = [...QUALIFIES.map((q) => q.d), ...CANDIDATS.map((c) => c.d)];

const STADE_P: V3 = [-8.6, 0, -5.6]; // nouvel îlot du stade, derrière l'île à gauche
const SOL: V3 = add(STADE_P, [0, 0.4, 0]);

/* ------------------------------------------------------------------ l'avion qui revient */

const P0: V3 = [16, 7, -14];
const P2: V3 = [5, 4.2, -3.0];
const P3: V3 = [-3, 3.8, 1.5];
const CAP = Math.atan2(-(P3[2] - P0[2]), P3[0] - P0[0]);

const posAvion = (t: number): V3 => {
  if (t < R.coupe) return mix(P0, P2, interpolate(t, [R.avion - 0.6, R.coupe], [0, 1], {...clamp, easing: Easing.out(Easing.quad)}));
  return mix(P2, P3, interpolate(t, [R.coupe, R.regle], [0, 1], clamp));
};

/** L'avion de l'île, avec la boîte de pastéis sur le dos et le tramway jaune suspendu dessous. */
const AvionRetour: React.FC<{t: number}> = ({t}) => {
  const frame = useCurrentFrame();
  const blanc = useMat('#ffffff');
  const bleu = useMat('#3f7fd9');
  const rose = useMat('#ff8fb1');
  const ruban = useMat('#ffc928');
  const jaune = useMat('#ffc928');
  const toit = useMat('#fbf6ea');
  const corde = useMat('#4a4f5a');
  if (t > R.regle) return null;
  return (
    <group position={posAvion(t)} rotation={[0, CAP, 0]} scale={1.6}>
      <group rotation={[Math.sin(t * 1.3) * 0.05, 0, 0]}>
        <mesh material={blanc} rotation={[0, 0, Math.PI / 2]} castShadow><cylinderGeometry args={[0.1, 0.1, 1.0, 10]} /></mesh>
        <mesh material={blanc} position={[0.56, 0, 0]} rotation={[0, 0, -Math.PI / 2]}><coneGeometry args={[0.1, 0.16, 10]} /></mesh>
        <mesh material={bleu} position={[0.05, 0, 0]}><boxGeometry args={[0.22, 0.03, 1.1]} /></mesh>
        <mesh material={bleu} position={[-0.45, 0.14, 0]}><boxGeometry args={[0.16, 0.22, 0.03]} /></mesh>
        <mesh material={bleu} position={[-0.45, 0.04, 0]}><boxGeometry args={[0.12, 0.02, 0.4]} /></mesh>
        <mesh material={rose} position={[0.12, 0.15, 0]}><boxGeometry args={[0.2, 0.09, 0.16]} /></mesh>
        <mesh material={ruban} position={[0.12, 0.15, 0]}><boxGeometry args={[0.03, 0.095, 0.165]} /></mesh>
        {[-0.18, 0.18].map((x) => <mesh key={x} material={corde} position={[x, -0.26, 0]}><cylinderGeometry args={[0.006, 0.006, 0.42, 4]} /></mesh>)}
        <group position={[0, -0.6, 0]} rotation={[0, 0, Math.sin(frame / 9) * 0.06]}>
          <mesh material={jaune} castShadow><boxGeometry args={[0.55, 0.22, 0.24]} /></mesh>
          <mesh material={toit} position={[0, 0.14, 0]}><boxGeometry args={[0.57, 0.07, 0.25]} /></mesh>
        </group>
      </group>
    </group>
  );
};

/* ------------------------------------------------------------------ le stade */

/** Le stade de la Coupe du monde : pelouse, buts, tribune du fond, coupe dorée ; le ballon file au but pendant la règle. */
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
  {de: R.mais, p0: [3.4, 5.4, 9.2], p1: [3.0, 5.0, 8.4], c: [0, 0.8, 0]},
  {de: R.avion, p0: [3.6, 2.2, 4.0], p1: [3.2, 2.0, 3.4], c: [0, -0.5, 0], suit: true},
  {de: R.tram, p0: [2.0, -0.4, 2.6], p1: [1.8, -0.5, 2.2], c: [0, -0.95, 0], suit: true},
  {de: R.coupe, p0: [-15, 14, 12], p1: [-14.2, 13.2, 11.2], c: [-6.8, 0.4, -4.4]},
  {de: R.huit, p0: add(SOL, [0, 3.4, 5.6]), p1: add(SOL, [0, 2.8, 4.6]), c: add(SOL, [0, 0.3, 0])},
  {de: R.reste, p0: add(SOL, [-3.6, 2.8, 4.2]), p1: add(SOL, [-2.4, 2.6, 4.8]), c: add(SOL, [0, 0.6, -0.6])},
  {de: R.regle, p0: add(SOL, [0.6, 1.0, 2.0]), p1: add(SOL, [0.55, 0.95, 1.8]), c: add(SOL, [0.95, 0.25, 0])},
  {de: R.trois, p0: add(SOL, [-1.8, 3.6, 5.4]), p1: add(SOL, [-1.5, 3.3, 4.9]), c: add(SOL, [0, 0.3, -0.6])},
  {de: R.liste, p0: add(SOL, [0, 4.6, 6.4]), p1: add(SOL, [0, 4.0, 5.6]), c: add(SOL, [0, 0.3, -0.4])},
  {de: R.abonne, p0: [0, 2.0, 5.9], p1: [0, 1.95, 5.1], c: [0, 1.75, 2.2]},
];

const camera = (t: number): Etat['cam'] => {
  const i = Math.max(0, PLANS.findIndex((p, k) => t >= p.de && t < (PLANS[k + 1]?.de ?? Infinity)));
  const p = PLANS[i];
  const fin = PLANS[i + 1]?.de ?? FIN;
  const u = interpolate(t, [p.de, fin], [0, 1], clamp);
  const a = posAvion(t);
  return {pos: p.suit ? add(a, mix(p.p0, p.p1, u)) : mix(p.p0, p.p1, u), cible: p.suit ? add(a, p.c) : p.c, fov: 40};
};

/* ------------------------------------------------------------------ état */

const useScene = (t: number) => {
  const {fps} = useVideoConfig();
  const pop = (de: number) => (t < de ? 0 : spring({frame: (t - de) * 30, fps, config: {damping: 11, stiffness: 170}}));
  const etat: Etat = {
    cam: camera(t),
    robin: {humeur: 'joyeux', position: ROBIN, bras: t >= R.abonne ? 'salue' : 'repos'},
    cabanes: CABANES_EP03.map(() => 1),
    etiquettes: 0,
  };
  const a = t * 0.6;
  return {
    etat,
    flipeurP: [FLIPEUR_CENTRE[0] + Math.sin(a) * 0.8, FLIPEUR_CENTRE[1], FLIPEUR_CENTRE[2] + Math.cos(a) * 0.8] as V3,
    flipeurCap: a + Math.PI / 2,
    ilot: pop(R.coupe + 0.3),
    stade: pop(R.coupe + 0.9),
    qualif: R.pays.map((d) => pop(d + 0.05)),
    candidats: R.candidats.map((d) => pop(d + 0.05)),
  };
};

const Monde7: React.FC<{t: number}> = ({t}) => {
  const s = useScene(t);
  return (
    <Monde etat={s.etat} cabanesDef={CABANES_EP03} parcellesVote={[]}>
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
      <Aeroport e={1} decollage={6} etiq={0} />
      <Panier e={1} />
      <Perroquet e={1} />
      <VillaPoisson e={1} />
      <Boucherie e={1} />
      <BalancoireNoel e={1} />
      <Casquette p={add(ROBIN, [0, 2.12, 0])} s={1.15} />
      <Naufrage p={FILS} graine={4} echelle={1.3} />
      <Casquette p={add(FILS, [0, 0.9, 0])} s={0.5} />
      <Lucarne e={1} />
      <Drapeau p={POTEAU_PT} emoji="🇵🇹" e={1} taille={2.2} />
      {MATS.map((p, i) => <Drapeau key={i} p={p} emoji={PAYS[i]} e={1} taille={1.8} />)}
      <AvionRetour t={t} />
      <Ilot c={STADE_P} r={2.4} e={s.ilot} />
      <StadeCoupe e={s.stade} t={t} />
      {/* les 5 qualifiés derrière la tribune du fond, 3 mâts « ? » pour les places à prendre */}
      {QUALIFIES.map((q, i) => <Drapeau key={q.d} p={add(SOL, [-1.4 + i * 0.4, 0, -1.55])} emoji={q.d} e={s.qualif[i] * s.stade} taille={1.25} />)}
      {[5, 6, 7].map((i) => <Drapeau key={i} p={add(SOL, [-1.4 + i * 0.4, 0, -1.55])} emoji="❓" e={t >= R.reste ? s.stade : 0} taille={1.25} />)}
      {/* les 6 pays à égalité, en haut de la tribune */}
      {CANDIDATS.map((c, i) => <Drapeau key={c.d} p={add(SOL, [-1.0 + i * 0.4, 0.58, -1.27])} emoji={c.d} e={s.candidats[i] * s.stade} taille={0.5} />)}
    </Monde>
  );
};

/* ------------------------------------------------------------------ habillage */

/** Accroche : 20 personnes, 11 pays, pluie de drapeaux. */
const Accroche: React.FC<{t: number}> = ({t}) => {
  const {fps} = useVideoConfig();
  if (t >= R.mais) return null;
  const f = t * 30;
  const e1 = spring({frame: f, fps, config: {damping: 12}});
  const e2 = t >= R.onze ? spring({frame: (t - R.onze) * 30, fps, config: {damping: 12}}) : 0;
  const n1 = Math.round(interpolate(t, [0, T(1) + 0.3], [0, 20], clamp));
  const n2 = Math.round(interpolate(t, [R.onze, T(3) + 0.3], [0, 11], clamp));
  const sortie = interpolate(t, [R.mais - 0.25, R.mais], [1, 0], clamp);
  const pluie = [...TOUS, ...TOUS, ...TOUS];
  return (
    <AbsoluteFill style={{opacity: sortie}}>
      {pluie.map((d, i) => {
        const x = (Math.sin(i * 77.3) * 0.5 + 0.5) * 980;
        const v = 7 + (Math.sin(i * 13.7) * 0.5 + 0.5) * 8;
        const y = -140 + ((f * v + i * 97) % 2100);
        return <div key={i} style={{position: 'absolute', left: x, top: y, fontSize: 64 + (i % 3) * 16, transform: `rotate(${Math.sin(f / 10 + i) * 18}deg)`}}>{d}</div>;
      })}
      <div style={{position: 'absolute', top: 600, left: 0, right: 0, textAlign: 'center', fontFamily: TEXTE, fontWeight: 900}}>
        <div style={{transform: `scale(${e1})`}}>
          <div style={{fontSize: 190, lineHeight: 1, color: '#fff', ...contour('#1b1d24', 18)}}>{n1}</div>
          <div style={{fontSize: 64, color: '#ffc928', ...contour('#1b1d24', 12)}}>PERSONNES</div>
        </div>
        <div style={{transform: `scale(${e2})`, marginTop: 30}}>
          <div style={{fontSize: 190, lineHeight: 1, color: '#fff', ...contour('#1b1d24', 18)}}>{n2}</div>
          <div style={{fontSize: 64, color: '#ffc928', ...contour('#1b1d24', 12)}}>PAYS 🌍</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const Colonne: React.FC<{lettre: string; icone: string; nom: string}> = ({lettre, icone, nom}) => (
  <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4}}>
    <div style={{fontSize: 100, lineHeight: 1}}>{icone}</div>
    <div style={{fontFamily: TEXTE, fontWeight: 900, fontSize: 40, color: '#ffc928', ...contour('#1b1d24', 8)}}>{lettre} · {nom}</div>
    <div style={{fontFamily: TEXTE, fontWeight: 900, fontSize: 64, color: '#fff', ...contour('#1b1d24', 12)}}>1 voix</div>
  </div>
);

/** L'égalité 1-1 de l'épisode 6, puis le tampon « ON FAIT LES DEUX ». */
const Score: React.FC<{t: number}> = ({t}) => {
  const {fps} = useVideoConfig();
  if (!dans(t, R.mais + 0.3, R.avion)) return null;
  const e = spring({frame: (t - R.mais - 0.3) * 30, fps, config: {damping: 12}});
  const tampon = t >= R.deux ? spring({frame: (t - R.deux) * 30, fps, config: {damping: 9, stiffness: 220}}) : 0;
  return (
    <div style={{position: 'absolute', top: 560, left: 0, right: 0, display: 'flex', justifyContent: 'center', transform: `scale(${e})`}}>
      <div style={{position: 'relative', display: 'flex', alignItems: 'center', gap: 40, background: 'rgba(27,29,36,0.8)', borderRadius: 40, padding: '24px 46px'}}>
        <Colonne lettre="A" icone="🥧" nom="PASTÉIS" />
        <div style={{fontFamily: TEXTE, fontWeight: 900, fontSize: 70, color: '#ffc928'}}>=</div>
        <Colonne lettre="B" icone="🚋" nom="TRAMWAY" />
        {tampon > 0 && (
          <div style={{position: 'absolute', left: 0, right: 0, top: '38%', textAlign: 'center', transform: `rotate(-8deg) scale(${2 - tampon})`, opacity: Math.min(1, tampon)}}>
            <span style={{fontFamily: TEXTE, fontWeight: 900, fontSize: 76, color: '#fff', background: '#e84a5f', padding: '8px 26px', borderRadius: 18, border: '6px solid #fff'}}>ON FAIT LES DEUX !</span>
          </div>
        )}
      </div>
    </div>
  );
};

/** Les 8 places : 5 qualifiés qui se remplissent, 3 places « ? » qui clignotent ; puis les 6 pays à égalité. */
const Places: React.FC<{t: number}> = ({t}) => {
  const {fps} = useVideoConfig();
  if (!dans(t, R.huit, R.regle)) return null;
  const e0 = spring({frame: (t - R.huit) * 30, fps, config: {damping: 12}});
  const libres = t >= R.reste;
  const clignote = libres ? 1 + 0.06 * Math.sin((t - R.reste) * 9) : 1;
  return (
    <div style={{position: 'absolute', top: 500, left: 40, right: 40, fontFamily: TEXTE, fontWeight: 900}}>
      <div style={{display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, transform: `scale(${e0})`}}>
        {Array.from({length: 8}).map((_, i) => {
          const q = QUALIFIES[i];
          const e = q && t >= R.pays[i] ? spring({frame: (t - R.pays[i]) * 30, fps, config: {damping: 10, stiffness: 200}}) : 0;
          if (q && e > 0) {
            return (
              <div key={i} style={{display: 'flex', flexDirection: 'column', alignItems: 'center', transform: `scale(${0.6 + 0.4 * e})`, background: 'rgba(27,29,36,0.78)', borderRadius: 24, padding: '10px 4px'}}>
                <div style={{fontSize: 92, lineHeight: 1}}>{q.d}</div>
                <div style={{fontSize: q.nom.length > 8 ? 24 : 30, color: '#fff', marginTop: 4}}>{q.nom}</div>
                <div style={{fontSize: 26, color: '#ffc928'}}>{q.nb} voix</div>
              </div>
            );
          }
          const vide = !q;
          return (
            <div key={i} style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 170, borderRadius: 24,
              border: `5px dashed ${vide && libres ? '#ffc928' : 'rgba(255,255,255,0.7)'}`, background: vide && libres ? 'rgba(255,201,40,0.25)' : 'rgba(27,29,36,0.35)',
              transform: `scale(${vide ? clignote : 1})`}}>
              <div style={{fontSize: 90, lineHeight: 1, color: vide && libres ? '#ffc928' : '#fff', ...contour('#1b1d24', 10)}}>?</div>
            </div>
          );
        })}
      </div>
      {t >= R.candidats[0] - 0.4 && (
        <div style={{display: 'flex', justifyContent: 'space-between', marginTop: 34}}>
          {CANDIDATS.map((c, i) => {
            const e = t >= R.candidats[i] ? spring({frame: (t - R.candidats[i]) * 30, fps, config: {damping: 10, stiffness: 200}}) : 0;
            return (
              <div key={i} style={{width: 156, display: 'flex', flexDirection: 'column', alignItems: 'center', transform: `scale(${e})`, background: 'rgba(255,255,255,0.92)', borderRadius: 20, padding: '8px 2px'}}>
                <div style={{fontSize: 72, lineHeight: 1}}>{c.d}</div>
                <div style={{fontSize: c.nom.length > 8 ? 17 : 22, color: '#1b1d24', marginTop: 2}}>{c.nom}</div>
                <div style={{fontSize: 22, color: '#e84a5f'}}>1 voix</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

/** La règle : 1 personne = 1 but. */
const Regle: React.FC<{t: number}> = ({t}) => {
  const {fps} = useVideoConfig();
  if (!dans(t, R.regle + 0.3, R.liste)) return null;
  const e = spring({frame: (t - R.regle - 0.3) * 30, fps, config: {damping: 11}});
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
  {de: 0, petit: "L'ÎLE DEVIENT", grand: 'UNE COUPE DU MONDE'},
  {de: R.mais, petit: "MAIS D'ABORD", grand: 'PASTÉIS OU TRAMWAY ?'},
  {de: R.egal, petit: 'UNE VOIX CHACUN', grand: 'ÉGALITÉ !'},
  {de: R.deux, petit: 'ALORS', grand: 'ON FAIT LES DEUX'},
  {de: R.avion, petit: "L'AVION REVIENT", grand: 'AVEC LES DEUX !'},
  {de: R.coupe, petit: 'LA COUPE DU MONDE', grand: 'DES ABONNÉS !'},
  {de: R.huit, petit: '8 PLACES', grand: '5 QUALIFIÉS'},
  {de: R.reste, petit: 'IL RESTE', grand: '3 PLACES'},
  {de: R.regle, petit: 'ÉCRIS TON PAYS', grand: '= UN BUT POUR LUI'},
  {de: R.trois, petit: 'LES 3 PLUS CITÉS', grand: 'SONT QUALIFIÉS'},
  {de: R.liste, petit: 'PAS DANS LA LISTE ?', grand: 'ÉCRIS-LE QUAND MÊME'},
  {de: R.abonne, petit: 'LE TABLEAU DES MATCHS', grand: 'AU PROCHAIN ÉPISODE'},
];

const PAQUETS = fairePaquets(voix, {
  0: '*20*', 1: '*personnes.*', 2: '*11*', 3: '*pays.*', 7: '*Coupe*', 9: '*monde !*', 10: '', 12: "d'abord :", 13: '', 14: '*pastéis*', 16: '*tramway ?*', 17: '',
  21: '*égalité !*', 22: '', 27: '*deux.*', 31: '*Lisbonne,*', 34: '*pastéis…*', 37: '*tramway*', 38: '*jaune*', 40: '*dessous !*', 41: '', 46: '*Coupe*', 48: '*monde*',
  50: '*abonnés !*', 51: '', 52: '*8*', 53: '*places.*', 54: '*5*', 58: '*qualifiés :*', 59: '', 61: '*Portugal,*', 63: '*France,*', 65: '*Maroc,*', 67: '*Sénégal*',
  70: '*Palestine.*', 73: '*3*', 74: '*places…*', 76: '*6*', 79: '*égalité,*', 83: "*L'Algérie,*", 85: '*Tunisie,*', 87: '*Turquie,*', 89: '*Corée*', 91: '*Sud,*',
  93: '*Chili*', 96: '*Pakistan.*', 100: '*simple :*', 101: '', 103: '*personne*', 107: '*pays*', 110: '*but*', 114: '*3*', 116: '*cités*', 127: '*liste ?*', 128: '',
  129: '*Écris-le*', 131: 'même :', 132: '', 136: '*entrer.*', 137: '*Abonne-toi*', 141: '*tableau*', 143: '*matchs*',
});

const BULLES: DefBulle[] = [
  {de: R.egal + 0.2, a: R.avion, pseudo: '@abonne_154', texte: 'La A et tu prend des pastel des natas', x: 60, y: 1010, rot: -2},
  {de: R.egal + 0.6, a: R.avion, pseudo: '@abonne_155', texte: 'B', x: 640, y: 1150, rot: 3},
  {de: R.liste + 0.3, a: R.abonne, pseudo: '@abonne_156', texte: 'Turquie', x: 120, y: 560, rot: -2},
];

/* ------------------------------------------------------------------ composition */

export const IleTikTokEp07: React.FC = () => {
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
      <Score t={t} />
      <Places t={t} />
      <Regle t={t} />
      <Ecris t={t} />
      <Bulles t={t} bulles={BULLES} />
      <SousTitre t={t} paquets={PAQUETS} />
      <BoutonAbonne t={t} de={R.abonne + 0.1} />
      <Confettis t={t} de={R.deux + 0.2} a={R.avion + 0.4} />
      <Confettis t={t} de={R.coupe + 0.3} a={R.huit} />
      <Confettis t={t} de={R.abonne + 1.12} />
      <Audio src={staticFile('ile/tiktok_ep07_voix.wav')} />
    </AbsoluteFill>
  );
};
