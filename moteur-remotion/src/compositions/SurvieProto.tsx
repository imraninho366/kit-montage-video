import {loadFont as chargerAnton} from '@remotion/google-fonts/Anton';
import {loadFont as chargerMono} from '@remotion/google-fonts/IBMPlexMono';
import {noise2D} from '@remotion/noise';
import {AbsoluteFill, Audio, Easing, interpolate, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {CarteLoyers3D, CleCamera} from '../components/CarteLoyers3D';
import {DepthPlate} from '../components/DepthPlate';
import {FilmGrain} from '../components/FilmGrain';
import donnees from '../videos/survie_proto.json';

/**
 * Prototype « l'Amérique qui survit », version dynamique : un seul mouvement du début à la fin.
 * La fenêtre du van devient l'ampoule de la cuisine, le 399 $ avale l'écran, la carte sort du noir.
 */
const {fontFamily: CHOC} = chargerAnton('normal', {weights: ['400'], subsets: ['latin']});
const {fontFamily: MONO} = chargerMono('normal', {weights: ['500', '700'], subsets: ['latin']});

const ROUGE = '#ff2a2f';
const CREME = '#f4efe4';
const DOSSIER = 'survie_proto/';

// temps absolus (images à 30 i/s)
const T_TABLE = 280;
const T_CARTE = 730;
export const DUREE_SURVIE = 1410;
// chaque impact secoue l'image ; même liste que le son (usine/chaines/survie_us/proto/son.py)
const IMPACTS: [number, number][] = [
  [30, 26], [122, 12], [150, 20], [205, 14], [T_TABLE, 16],
  [T_TABLE + 70, 8], [T_TABLE + 120, 10], [T_TABLE + 170, 10], [T_TABLE + 300, 40],
  [T_TABLE + 340, 9], [T_TABLE + 365, 9], [T_TABLE + 390, 12], [T_CARTE, 18], [T_CARTE + 400, 30], [T_CARTE + 450, 16], [T_CARTE + 572, 14],
];

const dollars = (n: number) => `$${Math.round(n).toLocaleString('en-US')}`;
const fen = (f: number, a: number, b: number, de = 0, vers = 1, easing?: (t: number) => number) =>
  interpolate(f, [a, b], [de, vers], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing});

/** Secousse : chaque impact donne un coup qui s'amortit en quelques images. */
const Secousse: React.FC<{children: React.ReactNode}> = ({children}) => {
  const f = useCurrentFrame();
  let x = 0, y = 0, r = 0;
  IMPACTS.forEach(([i, force], n) => {
    if (f < i || f > i + 24) return;
    const e = force * Math.exp(-(f - i) / 5);
    x += noise2D(`x${n}`, f * 0.9, 0) * e;
    y += noise2D(`y${n}`, f * 0.9, 1) * e;
    r += noise2D(`r${n}`, f * 0.9, 2) * e * 0.012;
  });
  return <AbsoluteFill style={{transform: `translate(${x}px, ${y}px) rotate(${r}deg) scale(1.04)`}}>{children}</AbsoluteFill>;
};

/** Mot qui frappe l'écran : arrive de trop près, flou, puis se fige ; sort vers le haut. */
const Frappe: React.FC<{de: number; a: number; children: React.ReactNode; style?: React.CSSProperties; taille?: number}> = ({de, a, children, style, taille = 150}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  if (f < de || f >= a) return null;
  const s = spring({frame: f - de, fps, config: {damping: 15, stiffness: 240}});
  const sortie = fen(f, a - 7, a, 0, 1, Easing.in(Easing.cubic));
  return (
    <div style={{position: 'absolute', fontFamily: CHOC, fontSize: taille, lineHeight: 1.02, color: '#fff', textTransform: 'uppercase',
      textShadow: '0 10px 50px rgba(0,0,0,.75)', opacity: 1 - sortie, transformOrigin: 'left center',
      transform: `scale(${2 - s}) translateY(${-sortie * 70}px)`, filter: `blur(${(1 - Math.min(1, s)) * 14 + sortie * 10}px)`, ...style}}>{children}</div>
  );
};

const Eclair: React.FC<{a: number; couleur?: string; force?: number}> = ({a, couleur = '#fff', force = 0.75}) => {
  const f = useCurrentFrame();
  return <AbsoluteFill style={{backgroundColor: couleur, opacity: fen(f, a, a + 7, force, 0) * (f >= a ? 1 : 0), pointerEvents: 'none'}} />;
};

const PlanParking: React.FC = () => {
  const f = useCurrentFrame();
  const montant = fen(f, 30, 62, 0, donnees.pension, Easing.out(Easing.cubic));
  // lente approche, puis la caméra plonge dans la fenêtre allumée
  const avance = fen(f, 0, 215, 0, 0.1) + fen(f, 215, 280, 0, 0.9, Easing.in(Easing.cubic));
  const braise = fen(f, 238, 280, 0, 1, Easing.in(Easing.quad));
  return (
    <AbsoluteFill>
      <DepthPlate image={`${DOSSIER}s1_parking.jpg`} profondeur={`${DOSSIER}s1_parking_profondeur.png`} avancement={avance}
        mouvement={{zoom: [1.09, 7], pousse: [0, 0.5], decale: [[0.012, 0], [-0.01, 0]], foyer: [0.602, 0.492]}} />
      <AbsoluteFill style={{background: 'radial-gradient(circle at 60% 49%, #fff3cf 0%, #ffb648 30%, #7a3d05 100%)', opacity: braise, mixBlendMode: 'screen'}} />
      <AbsoluteFill style={{backgroundColor: '#fff0c8', opacity: fen(f, 266, 280)}} />
      <Frappe de={30} a={120} taille={270} style={{left: 90, top: 50}}>
        {dollars(montant)}
        <div style={{fontSize: 56, letterSpacing: 1, lineHeight: 1.1}}>A month. The average Social Security check.</div>
      </Frappe>
      <Frappe de={122} a={205} taille={130} style={{left: 90, top: 70}}>
        In one state,
        {f >= 150 ? <div style={{color: ROUGE, fontSize: 190}}>rent is higher.</div> : null}
      </Frappe>
      <Frappe de={205} a={262} taille={210} style={{left: 90, top: 80}}>Is it yours?</Frappe>
      <Eclair a={30} force={0.4} />
    </AbsoluteFill>
  );
};

const LigneTicket: React.FC<{debut: number; libelle: string; montant: string; rouge?: boolean}> = ({debut, libelle, montant, rouge}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const s = spring({frame: f - debut, fps, config: {damping: 13, stiffness: 260}});
  if (f < debut) return <div style={{height: 104}} />;
  return (
    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', height: 104, fontFamily: MONO, fontWeight: 500, fontSize: 40,
      color: rouge ? '#c8141a' : '#191919', borderBottom: '3px dashed rgba(0,0,0,.22)', transform: `scale(${1.5 - s * 0.5})`, transformOrigin: 'right center'}}>
      <span style={{paddingTop: 30}}>{libelle}</span><span style={{fontWeight: 700, fontSize: 62}}>{montant}</span>
    </div>
  );
};

const PlanTable: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  // sortie de l'ampoule : la fenêtre du van est devenue la lampe de la cuisine
  const recul = fen(f, 0, 34, 0, 1, Easing.out(Easing.cubic));
  const derive = fen(f, 34, 450, 0, 1);
  const zoom = 6 - recul * 4.88 + derive * 0.14;
  const entree = spring({frame: f - 40, fps, config: {damping: 19, stiffness: 70}});
  const revele = spring({frame: f - 300, fps, config: {damping: 11, stiffness: 170}});
  const redresse = fen(f, 288, 312, 0, 1, Easing.inOut(Easing.cubic));
  // le chiffre avale l'écran avant la carte
  const avale = fen(f, 418, 450, 0, 1, Easing.in(Easing.cubic));
  const reste = fen(f, 300, 335, donnees.pension, donnees.reste, Easing.out(Easing.cubic));
  // la lampe vacille pendant le silence
  const vacille = f > 215 && f < 300 ? 0.32 + noise2D('lampe', f * 0.35, 0) * 0.2 : 0;
  const pouls = f > 215 && f < 300 ? 1 + Math.max(0, Math.sin((f - 215) * 0.28)) ** 6 * 0.025 : 1;
  return (
    <AbsoluteFill>
      <DepthPlate image={`${DOSSIER}s2_table.jpg`} profondeur={`${DOSSIER}s2_table_profondeur.png`} avancement={0}
        mouvement={{zoom: [zoom, zoom], pousse: [0.08, 0.08], foyer: [0.495, 0.17]}} />
      <AbsoluteFill style={{backgroundColor: '#000', opacity: vacille + redresse * 0.45}} />
      <AbsoluteFill style={{perspective: 1500, perspectiveOrigin: '50% 30%'}}>
        <div style={{position: 'absolute', left: 150 + redresse * 300, top: 70 - redresse * 20, width: 960, background: CREME, padding: '34px 54px 30px', borderRadius: 4,
          boxShadow: '0 70px 120px rgba(0,0,0,.75)', transformOrigin: '50% 40%',
          transform: `translateY(${(1 - entree) * 1100}px) rotateX(${(1 - redresse) * 30}deg) rotateZ(${(1 - redresse) * -5}deg) scale(${(0.9 + derive * 0.06 + redresse * 0.06) * pouls + avale * 9})`}}>
          <div style={{fontFamily: MONO, fontWeight: 700, fontSize: 36, letterSpacing: 6, color: '#191919', textAlign: 'center'}}>ONE MONTH</div>
          <LigneTicket debut={70} libelle="Social Security" montant={`+${dollars(donnees.pension)}`} />
          <LigneTicket debut={120} libelle="Median rent" montant={`-${dollars(donnees.loyerUS)}`} rouge />
          <LigneTicket debut={170} libelle="Medicare Part B" montant={`-${dollars(donnees.partB)}`} rouge />
          <div style={{fontFamily: MONO, fontWeight: 700, fontSize: 32, color: '#191919', marginTop: 24}}>LEFT FOR EVERYTHING ELSE</div>
          <div style={{fontFamily: CHOC, fontSize: 250, lineHeight: 1.12, color: f < 300 ? '#c9c1b0' : '#d8101a', transformOrigin: 'left center',
            transform: `scale(${f < 300 ? 1 : 0.7 + revele * 0.3})`}}>
            {f < 300 ? '$???' : dollars(reste)}
          </div>
        </div>
      </AbsoluteFill>
      <Frappe de={215} a={298} taille={150} style={{left: 1180, top: 110, width: 700}}>
        How much is left?
        <div style={{fontSize: 52, color: '#ffc861', marginTop: 12}}>Guess before I show you.</div>
      </Frappe>
      <Frappe de={340} a={415} taille={110} style={{left: 50, top: 190}}>Food.</Frappe>
      <Frappe de={365} a={415} taille={110} style={{left: 50, top: 340}}>Gas.</Frappe>
      <Frappe de={390} a={415} taille={110} style={{left: 50, top: 490}}>Medicine.</Frappe>
      <Eclair a={300} force={0.85} />
      <Eclair a={0} couleur="#fff0c8" force={1} />
      <AbsoluteFill style={{backgroundColor: '#d8101a', opacity: fen(f, 436, 450)}} />
    </AbsoluteFill>
  );
};

const COULEURS = ['#3fa98c', '#e0ad45', '#e66a2c', ROUGE];
const DEBUTS_CARTE = [70, 175, 285, 400];
const CLES: CleCamera[] = [
  {a: 0, pos: [0.2, 11.5, 1.6], vise: [0, 0, 0]},
  {a: 170, pos: [5.2, 5.6, 7.6], vise: [0.9, 0, 0.2]},
  {a: 300, pos: [0.6, 4.3, 8.6], vise: [-0.3, 0.2, 0.3]},
  {a: 350, pos: [-8.6, 4.6, 4.2], vise: [-2, 0.3, 0.3]},
  {a: 410, pos: [-8.4, 3, -2.2], vise: [-3.9, 0.5, 0.4]},
  {a: 520, pos: [-8.2, 1.9, 0.2], vise: [-4.1, 0.8, 0.4]},
  {a: 640, pos: [-0.5, 10.5, 7.2], vise: [0, 0, 0.2]},
];

const PlanCarte: React.FC = () => {
  const f = useCurrentFrame();
  const compte = Math.round(fen(f, 175, 340, 0, 41));
  return (
    <AbsoluteFill>
      <CarteLoyers3D loyers={donnees.etats as Record<string, number>} paliers={donnees.paliers as Record<string, number>} pension={donnees.pension}
        couleurs={COULEURS} debuts={DEBUTS_CARTE} cles={CLES} plafondDe={110} attenueDe={565} />
      <AbsoluteFill style={{backgroundColor: '#d8101a', opacity: fen(f, 0, 14, 1, 0)}} />
      <Frappe de={8} a={105} taille={130} style={{left: 90, top: 60}}>Rent. State by state.</Frappe>
      <Frappe de={110} a={172} taille={100} style={{left: 90, top: 60}}>
        The glass ceiling
        <div style={{color: '#cfe6ff'}}>is the whole check.</div>
      </Frappe>
      <Frappe de={175} a={395} taille={210} style={{left: 90, top: 50}}>
        {compte} states{f > 340 ? ' + D.C.' : ''}
        <div style={{fontSize: 62, color: '#ffc861'}}>Rent takes over half the check.</div>
      </Frappe>
      <Frappe de={450} a={560} taille={200} style={{left: 90, top: 50, color: ROUGE}}>
        California
        <div style={{fontSize: 72, color: '#fff'}}>{`${dollars((donnees.etats as Record<string, number>).California)} rent. ${dollars(donnees.pension)} check.`}</div>
      </Frappe>
      <Eclair a={400} couleur={ROUGE} force={0.5} />
      <Frappe de={572} a={680} taille={170} style={{left: 0, right: 0, top: 330, textAlign: 'center', transformOrigin: 'center'}}>
        Which state are you in?
        <div style={{color: '#ffc861', fontSize: 130}}>What's your rent?</div>
      </Frappe>
    </AbsoluteFill>
  );
};

export const SurvieProto: React.FC = () => (
  <AbsoluteFill style={{backgroundColor: '#000', overflow: 'hidden'}}>
    <Audio src={staticFile(`${DOSSIER}son.wav`)} />
    <Secousse>
      <Sequence durationInFrames={T_TABLE}><PlanParking /></Sequence>
      <Sequence from={T_TABLE} durationInFrames={T_CARTE - T_TABLE}><PlanTable /></Sequence>
      <Sequence from={T_CARTE} durationInFrames={DUREE_SURVIE - T_CARTE}><PlanCarte /></Sequence>
    </Secousse>
    <AbsoluteFill style={{background: 'radial-gradient(ellipse at center, rgba(0,0,0,0) 55%, rgba(0,0,0,.6) 100%)', pointerEvents: 'none'}} />
    <FilmGrain intensite={0.07} />
  </AbsoluteFill>
);
