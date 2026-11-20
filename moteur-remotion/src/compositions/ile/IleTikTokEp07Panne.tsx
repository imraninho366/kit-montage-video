import {ThreeCanvas} from '@remotion/three';
import {AbsoluteFill, Audio, Easing, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import voix from './tiktok_ep07panne_voix.json';
import {Abri, Etat, Monde, Naufrage} from './Ile3D';
import {ABRI, ABRI_ECHELLE, ChatNoir, Jacuzzi, Puits, ROBIN, Restaurant} from './IleTikTokEp02';
import {CABANES_EP03, Chihuahua, DecoFoot, MaisonPiscine, Mosquee, Patisserie, PetitChien, Plages, Scene as SceneCalvin} from './IleTikTokEp03';
import {
  Aeroport, BoulangerieHalloween, CabaneGateau, CabanePecheur, Chateau, EXT_A, EXT_B, FLIPEUR_CENTRE, Flipeur, Ilot, MaisonPaillettes, Panier, Radeau, STADE, Stade, VOTE4,
} from './IleTikTokEp04';
import {BalancoireNoel, Boucherie, Casquette, EXT_F, FILS, Lucarne, MATS, Perroquet, TOUR, VillaPoisson} from './IleTikTokEp05';
import {Drapeau, PAYS, POTEAU_PT} from './IleTikTokEp06';
import {useMat} from './outils3d';
import {
  BoutonAbonne, Bulles, Confettis, DefBulle, DefTitre, SousTitre, TEXTE, Titre, contour, fairePaquets, usePolicesPretes,
} from './habillage';

/**
 * L'Île des Abonnés — branche TikTok, épisode 7 (relevé du 16/11/2026 sur l'épisode 6 « Portugal », 7708500408477469985).
 * Vote souvenir : A pastéis 1, B tramway 1, 0 like → égalité, on fait les deux (comme l'ép. 4).
 * @abonne_151 (directeur de l'aéroport) : « ya une panne de carburant chef » → rebondissement.
 * Drapeaux demandés : Pakistan (@abonne_157), Palestine en grand sur le stade (@abonne_135, sans slogan écrit).
 * Nouveau vote : l'avion en panne. A atterrir sur la plage, B se poser sur le lagon, C sauter en parachute.
 */

const FIN = voix.duree + 1.0;
export const DUREE_ILE_TT_EP07_PANNE = Math.ceil(FIN * 30);
const T = (i: number) => voix.mots[i].a - 0.08;

const R = {
  egal: T(7), deux: T(15), avion: T(19), tram: T(26), pakistan: T(33), voilaPK: T(40), kaki: T(43), voilaPS: T(52), mais: T(56), panne: T(66),
  tousse: T(71), tombe: T(74), que: T(80), A: T(85), B: T(91), C: T(98), commente: T(105), ecris: T(110), abonne: T(120),
};

type V3 = [number, number, number];
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const mix = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const dans = (t: number, a: number, b: number) => t >= a && t < b;
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

/* ------------------------------------------------------------------ l'avion qui revient */

const P0: V3 = [16, 7, -14];
const P1: V3 = [8, 5, -6.5];
const P2: V3 = [5, 4.2, -3.0];
const P3: V3 = [1.8, 2.8, 0.8];
const CAP = Math.atan2(-(P3[2] - P0[2]), P3[0] - P0[0]); // le nez (axe x local) pointe vers l'île
const POTEAU_PK: V3 = add(EXT_F, [-0.9, 0.4, 0.7]); // à l'écart de la villa poisson
const POTEAU_PS: V3 = add(STADE, [1.5, 0, -0.85]);

const posAvion = (t: number): V3 => {
  if (t < R.pakistan) return mix(P0, P1, interpolate(t, [R.avion - 0.5, R.pakistan], [0, 1], clamp));
  if (t < R.tombe) {
    const p = mix(P1, P2, interpolate(t, [R.pakistan, R.panne], [0, 1], clamp));
    const sec = t >= R.panne ? Math.sin(t * 40) * 0.04 : 0; // le moteur tousse : l'avion tremble
    return add(p, [0, sec - interpolate(t, [R.panne, R.tombe], [0, 0.4], clamp), 0]);
  }
  const u = interpolate(t, [R.tombe, R.que], [0, 1], {...clamp, easing: Easing.in(Easing.quad)});
  const p = mix(add(P2, [0, -0.4, 0]), P3, u);
  return add(p, [0, t >= R.que ? Math.sin(t * 2.2) * 0.06 : 0, 0]); // suspense : figé au-dessus du lagon
};

/** L'avion de l'île, en grand, avec la boîte de pastéis sur le dos et le tramway suspendu dessous. */
const AvionRetour: React.FC<{t: number}> = ({t}) => {
  const frame = useCurrentFrame();
  const blanc = useMat('#ffffff');
  const bleu = useMat('#3f7fd9');
  const rose = useMat('#ff8fb1');
  const ruban = useMat('#ffc928');
  const jaune = useMat('#ffc928');
  const toit = useMat('#fbf6ea');
  const corde = useMat('#4a4f5a');
  const fumee = useMat('#5b5f66', {transparent: true, opacity: 0.75});
  const p = posAvion(t);
  const nez = t >= R.tombe ? -interpolate(t, [R.tombe, R.que], [0, 0.35], clamp) : 0;
  const roulis = t >= R.panne ? Math.sin(t * 5) * 0.12 : 0.04;
  const fume = t >= R.panne;
  return (
    <group position={p} rotation={[0, CAP, 0]} scale={1.6}>
      <group rotation={[roulis, 0, nez]}>
        <mesh material={blanc} rotation={[0, 0, Math.PI / 2]} castShadow><cylinderGeometry args={[0.1, 0.1, 1.0, 10]} /></mesh>
        <mesh material={blanc} position={[0.56, 0, 0]} rotation={[0, 0, -Math.PI / 2]}><coneGeometry args={[0.1, 0.16, 10]} /></mesh>
        <mesh material={bleu} position={[0.05, 0, 0]}><boxGeometry args={[0.22, 0.03, 1.1]} /></mesh>
        <mesh material={bleu} position={[-0.45, 0.14, 0]}><boxGeometry args={[0.16, 0.22, 0.03]} /></mesh>
        <mesh material={bleu} position={[-0.45, 0.04, 0]}><boxGeometry args={[0.12, 0.02, 0.4]} /></mesh>
        {/* la boîte de pastéis */}
        <mesh material={rose} position={[0.12, 0.15, 0]}><boxGeometry args={[0.2, 0.09, 0.16]} /></mesh>
        <mesh material={ruban} position={[0.12, 0.15, 0]}><boxGeometry args={[0.03, 0.095, 0.165]} /></mesh>
        {/* le tramway jaune, accroché dessous */}
        {[-0.18, 0.18].map((x) => <mesh key={x} material={corde} position={[x, -0.26, 0]}><cylinderGeometry args={[0.006, 0.006, 0.42, 4]} /></mesh>)}
        <group position={[0, -0.6, 0]} rotation={[0, 0, Math.sin(frame / 9) * 0.06]}>
          <mesh material={jaune} castShadow><boxGeometry args={[0.55, 0.22, 0.24]} /></mesh>
          <mesh material={toit} position={[0, 0.14, 0]}><boxGeometry args={[0.57, 0.07, 0.25]} /></mesh>
        </group>
        {/* fumée du moteur en panne */}
        {fume && Array.from({length: 6}).map((_, i) => {
          const k = ((frame / 6 + i) % 6) / 6;
          return <mesh key={i} material={fumee} position={[0.45 - k * 1.6, 0.1 + k * 0.5, Math.sin(i * 2.1) * 0.1]} scale={0.06 + k * 0.16}><icosahedronGeometry args={[1, 0]} /></mesh>;
        })}
      </group>
    </group>
  );
};

/* ------------------------------------------------------------------ aperçus du vote */

const MiniAvion: React.FC<{p?: V3; r?: V3}> = ({p = [0, 0, 0], r = [0, 0, 0]}) => {
  const blanc = useMat('#ffffff');
  const bleu = useMat('#3f7fd9');
  return (
    <group position={p} rotation={r} scale={0.55}>
      <mesh material={blanc} rotation={[0, 0, Math.PI / 2]} castShadow><cylinderGeometry args={[0.1, 0.1, 1.0, 10]} /></mesh>
      <mesh material={blanc} position={[0.56, 0, 0]} rotation={[0, 0, -Math.PI / 2]}><coneGeometry args={[0.1, 0.16, 10]} /></mesh>
      <mesh material={bleu} position={[0.05, 0, 0]}><boxGeometry args={[0.22, 0.03, 1.1]} /></mesh>
      <mesh material={bleu} position={[-0.45, 0.14, 0]}><boxGeometry args={[0.16, 0.22, 0.03]} /></mesh>
    </group>
  );
};

const VotePlage: React.FC<{e: number}> = ({e}) => {
  const sable = useMat('#f2d59b');
  const trace = useMat('#c9a96a');
  return (
    <Radeau p={VOTE4[0]} e={e}>
      <mesh material={sable} position={[0, 0.17, 0]}><boxGeometry args={[0.85, 0.04, 0.95]} /></mesh>
      <mesh material={trace} position={[-0.2, 0.195, 0]}><boxGeometry args={[0.45, 0.01, 0.06]} /></mesh>
      <MiniAvion p={[0.12, 0.27, 0]} r={[0, 0.3, 0]} />
    </Radeau>
  );
};

const VoteLagon: React.FC<{e: number}> = ({e}) => {
  const frame = useCurrentFrame();
  const eau = useMat('#3fb6e8');
  const ecume = useMat('#ffffff');
  return (
    <Radeau p={VOTE4[1]} e={e}>
      <mesh material={eau} position={[0, 0.17, 0]}><cylinderGeometry args={[0.45, 0.45, 0.04, 20]} /></mesh>
      <mesh material={ecume} position={[0, 0.2, 0]} rotation={[Math.PI / 2, 0, 0]} scale={1 + Math.sin(frame / 8) * 0.06}><torusGeometry args={[0.36, 0.025, 6, 20]} /></mesh>
      <MiniAvion p={[0, 0.24, 0]} r={[0, -0.4, 0]} />
    </Radeau>
  );
};

const VoteParachute: React.FC<{e: number}> = ({e}) => {
  const frame = useCurrentFrame();
  const rouge = useMat('#e84a5f', {side: 2});
  const blanc = useMat('#ffffff', {side: 2});
  const corde = useMat('#4a4f5a');
  const caisse = useMat('#ff8fb1');
  const h = 0.55 + Math.sin(frame / 12) * 0.05;
  return (
    <Radeau p={VOTE4[2]} e={e}>
      <group position={[0, h, 0]}>
        {Array.from({length: 8}).map((_, i) => (
          <mesh key={i} material={i % 2 ? rouge : blanc} position={[0, 0.5, 0]}>
            <sphereGeometry args={[0.38, 4, 8, (i / 8) * Math.PI * 2, Math.PI / 4, 0, Math.PI / 2]} />
          </mesh>
        ))}
        {[[1, 1], [1, -1], [-1, 1], [-1, -1]].map(([x, z], i) => (
          <mesh key={i} material={corde} position={[x * 0.17, 0.27, z * 0.17]} rotation={[z * 0.6, 0, -x * 0.6]}><cylinderGeometry args={[0.005, 0.005, 0.5, 3]} /></mesh>
        ))}
        <mesh material={caisse} position={[0, 0.02, 0]}><boxGeometry args={[0.16, 0.12, 0.16]} /></mesh>
      </group>
    </Radeau>
  );
};

/* ------------------------------------------------------------------ caméra */

type Plan = {de: number; p0: V3; p1: V3; c: V3; suit?: 'tout' | 'cible'};
const PLANS: Plan[] = [
  {de: 0, p0: [12, 10, 15], p1: [10.5, 9, 13.5], c: [0, 0.6, -1.5]},
  {de: R.avion, p0: [3.6, 2.2, 4.0], p1: [3.2, 2.0, 3.4], c: [0, -0.5, 0], suit: 'tout'},
  {de: R.pakistan, p0: add(POTEAU_PK, [2.4, 2.0, 3.4]), p1: add(POTEAU_PK, [2.0, 1.8, 2.9]), c: add(POTEAU_PK, [0, 1.6, 0])},
  {de: R.kaki, p0: add(STADE, [3.6, 4.2, -6.4]), p1: add(STADE, [3.2, 3.9, -5.8]), c: add(POTEAU_PS, [0.6, 2.6, 0])},
  {de: R.mais, p0: [6.6, 2.3, -3.4], p1: [6.9, 2.2, -3.7], c: add(TOUR, [0, 1.3, 0])},
  {de: R.panne, p0: [4.0, 1.8, 4.2], p1: [3.6, 1.6, 3.8], c: [0, -0.4, 0], suit: 'tout'},
  {de: R.tombe, p0: [0.6, 1.3, 7.2], p1: [0.4, 1.2, 6.8], c: [0, 0, 0], suit: 'cible'},
  {de: R.que, p0: [0, 9, 15.5], p1: [0, 8.6, 14.6], c: [0.1, 0.3, 3.6]},
  {de: R.A, p0: add(VOTE4[0], [0.9, 1.5, 2.8]), p1: add(VOTE4[0], [0.75, 1.4, 2.4]), c: add(VOTE4[0], [0, 0.35, 0])},
  {de: R.B, p0: add(VOTE4[1], [0.9, 1.5, 2.8]), p1: add(VOTE4[1], [0.75, 1.4, 2.4]), c: add(VOTE4[1], [0, 0.3, 0])},
  {de: R.C, p0: add(VOTE4[2], [-0.9, 1.6, 2.9]), p1: add(VOTE4[2], [-0.75, 1.5, 2.5]), c: add(VOTE4[2], [0, 0.8, 0])},
  {de: R.commente, p0: [0, 8.6, 14.6], p1: [0, 9.2, 15.6], c: [0.1, 0.3, 3.6]},
  {de: R.ecris, p0: [-15.5, 13, 7], p1: [-14.5, 12.4, 6.6], c: [0, 0.4, 0]},
  {de: R.abonne, p0: [0, 2.0, 5.9], p1: [0, 1.95, 5.1], c: [0, 1.75, 2.2]},
];

const camera = (t: number): Etat['cam'] => {
  const i = Math.max(0, PLANS.findIndex((p, k) => t >= p.de && t < (PLANS[k + 1]?.de ?? Infinity)));
  const p = PLANS[i];
  const fin = PLANS[i + 1]?.de ?? FIN;
  const u = interpolate(t, [p.de, fin], [0, 1], clamp);
  const a = posAvion(t);
  const pos = p.suit === 'tout' ? add(a, mix(p.p0, p.p1, u)) : mix(p.p0, p.p1, u);
  const cible = p.suit ? add(a, p.c) : p.c;
  return {pos, cible, fov: 40};
};

/* ------------------------------------------------------------------ état */

const useScene = (t: number) => {
  const {fps} = useVideoConfig();
  const pop = (de: number) => (t < de ? 0 : spring({frame: (t - de) * 30, fps, config: {damping: 11, stiffness: 170}}));
  const etat: Etat = {
    cam: camera(t),
    robin: {humeur: 'joyeux', position: ROBIN, bras: t >= R.abonne ? 'salue' : 'repos'},
    cabanes: CABANES_EP03.map(() => 1),
    mysteres: [0, 1, 2].map((i) => pop(R.que + 0.15 + i * 0.18) * (1 - pop([R.A, R.B, R.C][i] - 0.3)) /* disparaît avant que la caméra arrive dessus */),
    lettres: dans(t, R.que, R.A) || dans(t, R.commente, R.ecris) ? [0, 1, 2].map((i) => pop(R.que + 0.35 + i * 0.18)) : [0, 0, 0],
  };
  const a = t * 0.6;
  return {
    etat,
    flipeurP: [FLIPEUR_CENTRE[0] + Math.sin(a) * 0.8, FLIPEUR_CENTRE[1], FLIPEUR_CENTRE[2] + Math.cos(a) * 0.8] as V3,
    flipeurCap: a + Math.PI / 2,
    pk: pop(R.voilaPK + 0.05),
    ps: pop(R.voilaPS + 0.05),
    plage: pop(R.A + 0.15), lagon: pop(R.B + 0.15), para: pop(R.C + 0.15),
  };
};

const Monde7: React.FC<{t: number}> = ({t}) => {
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
      <Drapeau p={POTEAU_PK} emoji="🇵🇰" e={s.pk} taille={1.8} />
      <Drapeau p={POTEAU_PS} emoji="🇵🇸" e={s.ps} taille={2.6} />
      <AvionRetour t={t} />
      <VotePlage e={s.plage} />
      <VoteLagon e={s.lagon} />
      <VoteParachute e={s.para} />
    </Monde>
  );
};

/* ------------------------------------------------------------------ habillage */

const Colonne: React.FC<{lettre: string; icone: string; nom: string}> = ({lettre, icone, nom}) => (
  <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4}}>
    <div style={{fontSize: 100, lineHeight: 1}}>{icone}</div>
    <div style={{fontFamily: TEXTE, fontWeight: 900, fontSize: 40, color: '#ffc928', ...contour('#1b1d24', 8)}}>{lettre} · {nom}</div>
    <div style={{fontFamily: TEXTE, fontWeight: 900, fontSize: 64, color: '#fff', ...contour('#1b1d24', 12)}}>1 voix</div>
  </div>
);

/** L'égalité 1-1, puis le tampon « ON FAIT LES DEUX ». */
const Score: React.FC<{t: number}> = ({t}) => {
  const {fps} = useVideoConfig();
  if (t >= R.avion) return null;
  const e = spring({frame: t * 30, fps, config: {damping: 12}});
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

/** Alerte rouge pendant la panne. */
const Alerte: React.FC<{t: number}> = ({t}) => {
  if (!dans(t, R.panne, R.que)) return null;
  const o = 0.18 + 0.14 * Math.sin((t - R.panne) * 12);
  return <AbsoluteFill style={{boxShadow: `inset 0 0 160px 40px rgba(232,40,63,${o * 2})`}} />;
};

const TITRES: DefTitre[] = [
  {de: 0, petit: 'PASTÉIS OU TRAMWAY ?', grand: 'ÉGALITÉ !'},
  {de: R.deux, petit: 'COMME LA DERNIÈRE FOIS', grand: 'ON FAIT LES DEUX'},
  {de: R.avion, petit: "L'AVION REVIENT", grand: 'AVEC LES DEUX !'},
  {de: R.pakistan, petit: '@ABONNE_157', grand: 'LE PAKISTAN'},
  {de: R.kaki, petit: '@ABONNE_135 · SON STADE', grand: 'LA PALESTINE'},
  {de: R.mais, petit: 'LE DIRECTEUR @ABONNE_151', grand: 'ALERTE RADIO'},
  {de: R.panne, petit: 'PANNE DE', grand: 'CARBURANT !'},
  {de: R.tombe, petit: "L'AVION TOMBE", grand: "VERS L'ÎLE !"},
  {de: R.que, petit: 'QUE FAIT', grand: 'LE PILOTE ?'},
  {de: R.A, petit: 'CHOIX A', grand: 'LA PLAGE'},
  {de: R.B, petit: 'CHOIX B', grand: 'LE LAGON'},
  {de: R.C, petit: 'CHOIX C', grand: 'EN PARACHUTE'},
  {de: R.commente, petit: 'COMMENTE', grand: 'A, B OU C'},
  {de: R.ecris, petit: 'ET ÉCRIS TON PAYS', grand: 'TON DRAPEAU ARRIVE'},
  {de: R.abonne, petit: "L'AVION S'EN SORT ?", grand: 'ABONNE-TOI'},
];

const PAQUETS = fairePaquets(voix, {
  0: '*Pastéis*', 2: '*tramway ?*', 3: '', 6: '*chacun…*', 7: '*égalité !*', 8: '', 14: '', 18: '*deux.*', 22: '*Lisbonne,*', 25: '*pastéis…*',
  28: '*tramway*', 29: '*jaune*', 31: '*dessous !*', 32: '', 35: '*Muhammad*', 38: '*Pakistan :*', 39: '', 42: '*drapeau.*', 44: '*Galet*',
  47: '*Palestine*', 50: '*stade :*', 51: '', 55: '*grand.*', 60: '*Comete*', 64: '*radio :*', 65: '', 66: '*panne*', 68: '*carburant,*', 69: '*chef !*', 70: '',
  73: '*tousse…*', 76: '*tombe*', 78: "*l'île !*", 79: '', 83: '*pilote ?*', 84: '', 85: '*A,*', 90: '*plage.*', 91: '*B,*', 97: '*lagon.*', 98: '*C,*',
  104: '*parachute.*', 106: '*A,*', 107: '*B*', 109: '*C.*', 113: '*pays :*', 114: '', 116: '*drapeau*', 120: '*Abonne-toi*', 126: '*sort.*',
});

const BULLES: DefBulle[] = [
  {de: R.egal + 0.2, a: R.deux, pseudo: '@abonne_154', texte: 'La A et tu prend des pastel des natas', x: 60, y: 1010, rot: -2},
  {de: R.egal + 0.6, a: R.deux, pseudo: '@abonne_155', texte: 'B', x: 640, y: 1150, rot: 3},
  {de: R.pakistan + 0.2, a: R.kaki, pseudo: '@abonne_157', texte: 'Pakistan 🇵🇰 stp', x: 120, y: 560, rot: -2},
  {de: R.mais + 0.5, a: R.tousse, pseudo: '@abonne_151', texte: 'ya une panne de carburant chef', x: 90, y: 560, rot: -2},
];

/* ------------------------------------------------------------------ composition */

export const IleTikTokEp07Panne: React.FC = () => {
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
      <Alerte t={t} />
      <Titre t={t} titres={TITRES} />
      <Score t={t} />
      <Bulles t={t} bulles={BULLES} />
      <SousTitre t={t} paquets={PAQUETS} />
      <BoutonAbonne t={t} de={R.abonne + 0.15} />
      <Confettis t={t} de={R.deux + 0.2} a={R.avion + 0.4} />
      <Confettis t={t} de={R.abonne + 1.17} />
      <Audio src={staticFile('ile/tiktok_ep07panne_voix.wav')} />
    </AbsoluteFill>
  );
};
