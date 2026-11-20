import {ThreeCanvas} from '@remotion/three';
import {AbsoluteFill, Audio, Easing, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import voix from './youtube_ep05_voix.json';
import {Abri, Etat, Monde} from './Ile3D';
import {ABRI, ABRI_ECHELLE, ROBIN} from './IleTikTokEp02';
import {Plages, VOTE} from './IleTikTokEp03';
import {Radeau} from './IleTikTokEp04';
import {Drapeau} from './IleTikTokEp06';
import {Grotte, Jungle, Source} from './IleYouTubeEp03';
import {BALLON, CABANES_EP04, MATS, Mats, Montgolfiere, Singe} from './IleYouTubeEp04';
import {useMat} from './outils3d';
import {BoutonAbonne, Confettis, DefTitre, SousTitre, TEXTE, Titre, contour, fairePaquets, usePolicesPretes} from './habillage';

/**
 * L'Île des Abonnés — branche YouTube Shorts, épisode 5 (relevé du 16/11/2026 sur « TON PAYS », vJvlrNFdpn0).
 * 54 commentaires, un pays par pseudo : France 7, Algérie 4, Canada 3, Maroc 3, Madagascar 2, puis 1 chacun.
 * Robin s'envole en montgolfière vers Paris ; les 11 autres pays cités ont leur drapeau sur l'île.
 * Nouveau vote : le souvenir de France. A baguette géante, B mini tour Eiffel, C croissant géant.
 */

const FIN = voix.duree + 1.2;
export const DUREE_ILE_YT_EP05 = Math.ceil(FIN * 30);
const T = (i: number) => voix.mots[i].a - 0.08;

const R = {
  france: T(12), sept: T(14), algerie: T(20), canada: T(22), maroc: T(25), monte: T(26), direction: T(31), promis: T(34),
  pays: [45, 47, 49, 50, 52, 54, 56, 57, 59, 61, 66].map(T), mais: T(70), A: T(80), B: T(84), C: T(89), commente: T(93), ecris: T(98), abonne: T(108),
};

type V3 = [number, number, number];
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const mix = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const dans = (t: number, a: number, b: number) => t >= a && t < b;

/* ------------------------------------------------------------------ drapeaux et vol */

// ordre : la France, puis les pays dans l'ordre où la voix les cite
const PAYS = ['🇫🇷', '🇩🇿', '🇨🇦', '🇲🇦', '🇲🇬', '🇨🇩', '🇧🇪', '🇨🇭', '🇪🇸', '🇨🇮', '🇷🇪', '🏴󠁧󠁢󠁷󠁬󠁳󠁿'];
const ECHELLE = 2.2; // assez grande pour que Robin tienne dans la nacelle sous la jupe
const POTEAU_FR: V3 = add(BALLON, [2.0, 0, 1.0]);
const VOL_FIN: V3 = [3.0, 9.0, -18.0];
const DANS_NACELLE: V3 = [0, -0.06, 0]; // un peu plus bas : la flamme du brûleur ne touche plus sa tête

/** Position de la montgolfière : au sol, puis montée et dérive vers le large. */
const posBallon = (t: number): V3 => {
  const u = interpolate(t, [R.direction, R.direction + 6], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.quad)});
  const h = interpolate(t, [R.direction, R.direction + 2.5], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.quad)});
  return [BALLON[0] + (VOL_FIN[0] - BALLON[0]) * u, BALLON[1] + (VOL_FIN[1] - BALLON[1]) * (0.55 * h + 0.45 * u), BALLON[2] + (VOL_FIN[2] - BALLON[2]) * u];
};

/* ------------------------------------------------------------------ aperçus du vote */

const Baguette: React.FC<{e: number}> = ({e}) => {
  const croute = useMat('#d9a05b');
  const entaille = useMat('#f3dcae');
  return (
    <Radeau p={VOTE[0]} e={e}>
      <group position={[0, 0.25, 0]} rotation={[0, 0.7, Math.PI / 2]}>
        <mesh material={croute} castShadow><cylinderGeometry args={[0.11, 0.11, 1.15, 12]} /></mesh>
        {[-1, 1].map((s) => <mesh key={s} material={croute} position={[0, s * 0.575, 0]}><sphereGeometry args={[0.11, 12, 8]} /></mesh>)}
        {[-0.38, -0.13, 0.12, 0.37].map((y) => (
          <mesh key={y} material={entaille} position={[0.095, y, 0]} rotation={[0, 0, 0.5]}><boxGeometry args={[0.03, 0.17, 0.06]} /></mesh>
        ))}
      </group>
    </Radeau>
  );
};

const TourEiffel: React.FC<{e: number}> = ({e}) => {
  const fer = useMat('#8a6a4a');
  const dore = useMat('#ffc928', {emissive: '#ffb000', emissiveIntensity: 0.4});
  return (
    <Radeau p={VOTE[1]} e={e}>
      <group position={[0, 0.13, 0]} rotation={[0, Math.PI / 4, 0]}>
        {[[1, 1], [1, -1], [-1, 1], [-1, -1]].map(([x, z], i) => (
          <mesh key={i} material={fer} position={[x * 0.17, 0.17, z * 0.17]} rotation={[z * 0.45, 0, -x * 0.45]} castShadow><boxGeometry args={[0.07, 0.4, 0.07]} /></mesh>
        ))}
        <mesh material={fer} position={[0, 0.36, 0]}><boxGeometry args={[0.36, 0.05, 0.36]} /></mesh>
        <mesh material={fer} position={[0, 0.56, 0]} rotation={[0, Math.PI / 4, 0]} castShadow><cylinderGeometry args={[0.07, 0.17, 0.36, 4]} /></mesh>
        <mesh material={fer} position={[0, 0.76, 0]}><boxGeometry args={[0.16, 0.04, 0.16]} /></mesh>
        <mesh material={fer} position={[0, 1.04, 0]} rotation={[0, Math.PI / 4, 0]} castShadow><cylinderGeometry args={[0.012, 0.075, 0.52, 4]} /></mesh>
        <mesh material={dore} position={[0, 1.34, 0]}><sphereGeometry args={[0.025, 8, 6]} /></mesh>
      </group>
    </Radeau>
  );
};

const Croissant: React.FC<{e: number}> = ({e}) => {
  const pate = useMat('#e0a24e');
  const dore = useMat('#b8702a');
  return (
    <Radeau p={VOTE[2]} e={e}>
      <group position={[0, 0.27, 0]} rotation={[-Math.PI / 2, 0, -0.4]}>
        <mesh material={pate} castShadow><torusGeometry args={[0.28, 0.13, 10, 18, Math.PI * 1.25]} /></mesh>
        {[0.15, 0.4, 0.62, 0.85, 1.1].map((k, i) => {
          const a = k * Math.PI;
          return <mesh key={i} material={dore} position={[Math.cos(a) * 0.28, Math.sin(a) * 0.28, 0]} rotation={[0, 0, a]}><torusGeometry args={[0.13, 0.018, 6, 14]} /></mesh>;
        })}
      </group>
    </Radeau>
  );
};

/* ------------------------------------------------------------------ caméra */

type Plan = {de: number; p0: V3; p1: V3; c: V3; suit?: boolean};
const PLANS: Plan[] = [
  {de: 0, p0: [12, 10, 15], p1: [10.5, 9, 13.5], c: [0, 0.6, -1.5]},
  {de: R.france, p0: add(BALLON, [3.4, 6.2, 9.0]), p1: add(BALLON, [3.0, 5.8, 8.2]), c: add(BALLON, [0.9, 3.0, 0])},
  {de: R.monte, p0: add(BALLON, [3.6, 3.2, 6.0]), p1: add(BALLON, [3.2, 3.0, 5.4]), c: add(BALLON, [0, 1.9, 0])},
  {de: R.direction, p0: [3.5, 2.2, 1.5], p1: [3.0, 2.0, 2.2], c: [0, 2.6, 0], suit: true},
  {de: R.promis, p0: [-15.5, 13, 7], p1: [-14, 12, 6.3], c: [0, 0.4, -1.4]},
  {de: R.pays[4], p0: [15, 11, 9], p1: [13.6, 10.2, 8.2], c: [0, 0.4, -1.4]},
  {de: R.pays[8], p0: [0, 12, 14], p1: [0, 11, 12.8], c: [0, 0.4, -2.2]},
  {de: R.mais, p0: add(VOL_FIN, [3.4, 2.4, 6.6]), p1: add(VOL_FIN, [2.6, 2.2, 5.6]), c: add(VOL_FIN, [0, 1.8, 0])},
  {de: R.A, p0: add(VOTE[0], [0.9, 1.5, 2.8]), p1: add(VOTE[0], [0.75, 1.4, 2.4]), c: add(VOTE[0], [0, 0.4, 0])},
  {de: R.B, p0: add(VOTE[1], [0.9, 1.7, 2.9]), p1: add(VOTE[1], [0.75, 1.6, 2.5]), c: add(VOTE[1], [0, 0.75, 0])},
  {de: R.C, p0: add(VOTE[2], [-0.9, 1.5, 2.8]), p1: add(VOTE[2], [-0.75, 1.4, 2.4]), c: add(VOTE[2], [0, 0.4, 0])},
  {de: R.commente, p0: [0, 8.6, 14.6], p1: [0, 9.2, 15.6], c: [0.1, 0.3, 3.6]},
  {de: R.ecris, p0: [-15.5, 13, 7], p1: [-14.5, 12.4, 6.6], c: [0, 0.4, -1.4]},
  {de: R.abonne, p0: add(VOL_FIN, [0, 1.75, 4.0]), p1: add(VOL_FIN, [0, 1.7, 3.3]), c: add(VOL_FIN, [0, 1.45, 0])},
];

const camera = (t: number): Etat['cam'] => {
  const i = Math.max(0, PLANS.findIndex((p, k) => t >= p.de && t < (PLANS[k + 1]?.de ?? Infinity)));
  const p = PLANS[i];
  const fin = PLANS[i + 1]?.de ?? FIN;
  const u = interpolate(t, [p.de, fin], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const cible = p.suit ? add(posBallon(t), p.c) : p.c;
  const pos = p.suit ? add(mix(p.p0, p.p1, u), [0, posBallon(t)[1] * 0.6, 0]) : mix(p.p0, p.p1, u);
  return {pos, cible, fov: 40};
};

/* ------------------------------------------------------------------ état */

const useScene = (t: number) => {
  const {fps} = useVideoConfig();
  const pop = (de: number) => (t < de ? 0 : spring({frame: (t - de) * 30, fps, config: {damping: 11, stiffness: 170}}));
  const ballon = posBallon(t);
  const aBord = t >= R.monte + 0.35;
  const etat: Etat = {
    cam: camera(t),
    robin: {
      humeur: 'joyeux',
      position: aBord ? add(ballon, DANS_NACELLE) : ROBIN,
      bras: t >= R.abonne || dans(t, R.direction, R.promis) ? 'salue' : 'repos',
    },
    cielDegage: true,
    cabanes: CABANES_EP04.map(() => 1),
    etiquettes: 0, // les drapeaux sont la vedette : sans pseudos, la vue large reste lisible
    mysteres: [0, 1, 2].map((i) => pop(R.mais + 1.6 + i * 0.18) * (1 - pop([R.A, R.B, R.C][i] + 0.1))),
    lettres: dans(t, R.mais + 1.6, R.A) || dans(t, R.commente, R.ecris) ? [0, 1, 2].map((i) => pop(R.mais + 1.8 + i * 0.18)) : [0, 0, 0],
  };
  const drapeaux = [pop(R.promis + 0.3), ...R.pays.map((d) => pop(d + 0.05))];
  return {
    etat,
    ballon,
    brule: 0, // la flamme, juste au-dessus de sa tête, ressemblait à un chapeau pointu
    drapeauFR: pop(R.france + 0.15),
    drapeaux,
    blancs: drapeaux.map((d) => 1 - d),
    baguette: pop(R.A + 0.15), tour: pop(R.B + 0.15), croissant: pop(R.C + 0.15),
  };
};

const Monde5: React.FC<{t: number}> = ({t}) => {
  const s = useScene(t);
  return (
    <Monde etat={s.etat} cabanesDef={CABANES_EP04} parcellesVote={VOTE} tailleMystere={0.7}>
      <Plages g={1} d={1} />
      <Jungle e={1} />
      <Source e={1} />
      <Grotte e={1} yeux={0} etiq={0} />
      <group position={ABRI}><Abri e={ABRI_ECHELLE} /></group>
      <Singe e={1} />
      <Montgolfiere e={1} brule={s.brule} etiq={0} p={s.ballon} echelle={ECHELLE} />
      <Drapeau p={POTEAU_FR} emoji="🇫🇷" e={s.drapeauFR} taille={2.2} />
      <Mats v={s.blancs} />
      {MATS.map((p, i) => <Drapeau key={i} p={p} emoji={PAYS[i]} e={s.drapeaux[i] ?? 0} taille={1.8} />)}
      <Baguette e={s.baguette} />
      <TourEiffel e={s.tour} />
      <Croissant e={s.croissant} />
    </Monde>
  );
};

/* ------------------------------------------------------------------ habillage */

const CLASSEMENT: {d: string; nom: string; nb: number; de: number}[] = [
  {d: '🇫🇷', nom: 'FRANCE', nb: 7, de: R.sept},
  {d: '🇩🇿', nom: 'ALGÉRIE', nb: 4, de: R.algerie},
  {d: '🇨🇦', nom: 'CANADA', nb: 3, de: R.canada},
  {d: '🇲🇦', nom: 'MAROC', nb: 3, de: R.maroc},
];

/** Le compteur de commentaires, puis le classement en barres. */
const Classement: React.FC<{t: number}> = ({t}) => {
  const {fps} = useVideoConfig();
  if (t >= R.monte) return null;
  const sortie = interpolate(t, [R.monte - 0.25, R.monte], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  if (t < R.france) {
    const n = Math.round(interpolate(t, [0.2, R.france - 0.4], [0, 54], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}));
    const e = spring({frame: t * 30, fps, config: {damping: 12}});
    return (
      <div style={{position: 'absolute', top: 620, left: 0, right: 0, textAlign: 'center', transform: `scale(${e})`, fontFamily: TEXTE, fontWeight: 900}}>
        <div style={{fontSize: 210, lineHeight: 1, color: '#fff', ...contour('#1b1d24', 18)}}>{n}</div>
        <div style={{fontSize: 70, color: '#ffc928', ...contour('#1b1d24', 14)}}>💬 COMMENTAIRES</div>
      </div>
    );
  }
  return (
    <div style={{position: 'absolute', top: 560, left: 70, right: 70, display: 'flex', flexDirection: 'column', gap: 22, opacity: sortie,
      background: 'rgba(27,29,36,0.78)', borderRadius: 40, padding: '30px 34px'}}>
      {CLASSEMENT.map((c, i) => {
        const e = t >= c.de ? spring({frame: (t - c.de) * 30, fps, config: {damping: 14, stiffness: 160}}) : 0;
        const premier = i === 0;
        return (
          <div key={i} style={{display: 'flex', alignItems: 'center', gap: 20, opacity: e > 0 ? 1 : 0}}>
            <div style={{fontSize: premier ? 100 : 80, lineHeight: 1, width: 110, textAlign: 'center'}}>{c.d}</div>
            <div style={{flex: 1, height: premier ? 86 : 66, position: 'relative'}}>
              <div style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: `${(c.nb / 7) * 100 * e}%`, borderRadius: 18,
                background: premier ? '#ffc928' : '#5fb8ff', display: 'flex', alignItems: 'center', paddingLeft: 18, overflow: 'hidden'}}>
                <span style={{fontFamily: TEXTE, fontWeight: 900, fontSize: premier ? 44 : 36, color: '#1b1d24', whiteSpace: 'nowrap'}}>{c.nom}</span>
              </div>
            </div>
            <div style={{fontFamily: TEXTE, fontWeight: 900, fontSize: premier ? 76 : 60, color: '#fff', width: 70, textAlign: 'right', ...contour('#1b1d24', 10)}}>{Math.round(c.nb * e)}</div>
          </div>
        );
      })}
    </div>
  );
};

/** Les drapeaux des pays cités, qui s'ajoutent à l'écran au fil de l'énumération. */
const GrilleDrapeaux: React.FC<{t: number}> = ({t}) => {
  const {fps} = useVideoConfig();
  if (t < R.promis + 0.2 || t >= R.mais) return null;
  const debuts = [R.promis + 0.3, ...R.pays];
  return (
    <div style={{position: 'absolute', top: 470, left: 50, right: 50, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 16}}>
      {PAYS.map((d, i) => {
        const e = t >= debuts[i] ? spring({frame: (t - debuts[i]) * 30, fps, config: {damping: 10, stiffness: 200}}) : 0;
        return <div key={i} style={{fontSize: 112, lineHeight: 1, transform: `scale(${e})`, filter: 'drop-shadow(0 6px 0 rgba(0,0,0,0.25))'}}>{d}</div>;
      })}
    </div>
  );
};

const TITRES: DefTitre[] = [
  {de: 0, petit: 'PLUS DE 50 COMMENTAIRES', grand: 'UN PAYS GAGNE…'},
  {de: R.france, petit: 'LE GAGNANT', grand: 'LA FRANCE !'},
  {de: R.monte, petit: 'ROBIN MONTE', grand: 'À BORD !'},
  {de: R.direction, petit: 'DÉCOLLAGE…', grand: 'DIRECTION PARIS'},
  {de: R.promis, petit: 'COMME PROMIS', grand: 'VOS DRAPEAUX'},
  {de: R.mais, petit: 'ROBIN RAPPORTE', grand: '1 SEUL SOUVENIR'},
  {de: R.A, petit: 'CHOIX A', grand: 'BAGUETTE GÉANTE'},
  {de: R.B, petit: 'CHOIX B', grand: 'MINI TOUR EIFFEL'},
  {de: R.C, petit: 'CHOIX C', grand: 'CROISSANT GÉANT'},
  {de: R.commente, petit: 'COMMENTE', grand: 'A, B OU C'},
  {de: R.ecris, petit: 'ET ÉCRIS TON PAYS', grand: 'TON DRAPEAU ARRIVE'},
  {de: R.abonne, petit: 'ABONNE-TOI POUR VOIR', grand: 'LE SOUVENIR'},
];

const PAQUETS = fairePaquets(voix, {
  2: '*50*', 3: '*commentaires…*', 9: '*écrasé :*', 10: '', 12: '*France !*', 13: '', 14: '*7*', 18: '*France,*', 20: "*l'Algérie,*", 22: '*Canada*', 25: '*Maroc.*',
  30: '*montgolfière…*', 32: '*Paris !*', 33: '', 42: '*drapeau*', 45: "*L'Algérie,*", 47: '*Canada,*', 49: '*Maroc,*', 50: '*Madagascar,*', 52: '*Congo,*',
  54: '*Belgique,*', 56: '*Suisse,*', 57: "*l'Espagne,*", 59: '*Côte*', 60: "*d'Ivoire,*", 62: '*Réunion…*', 66: '*Pays*', 68: '*Galles !*', 69: '',
  76: '*seul*', 77: '*souvenir*', 80: '*A,*', 82: '*baguette*', 84: '*B,*', 87: '*tour*', 88: '*Eiffel.*', 89: '*C,*', 91: '*croissant*',
  94: '*A,*', 95: '*B*', 97: '*C.*', 101: '*pays :*', 102: '', 104: '*drapeau*', 108: '*Abonne-toi*', 114: '*rapporte.*',
});

/* ------------------------------------------------------------------ composition */

export const IleYouTubeEp05: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / 30;
  const {width, height} = useVideoConfig();
  const pret = usePolicesPretes();
  return (
    <AbsoluteFill style={{background: '#8fd6f6'}}>
      {pret && (
        <ThreeCanvas width={width} height={height} shadows camera={{fov: 40, near: 0.1, far: 300}} gl={{antialias: true}}>
          <Monde5 t={t} />
        </ThreeCanvas>
      )}
      <Titre t={t} titres={TITRES} />
      <Classement t={t} />
      <GrilleDrapeaux t={t} />
      <SousTitre t={t} paquets={PAQUETS} />
      <BoutonAbonne t={t} de={R.abonne + 0.1} />
      <Confettis t={t} de={R.france + 0.3} a={R.monte} />
      <Confettis t={t} de={R.abonne + 1.12} />
      <Audio src={staticFile('ile/youtube_ep05_voix.wav')} />
    </AbsoluteFill>
  );
};
