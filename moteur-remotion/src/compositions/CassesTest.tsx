import {loadFont as chargerMontserrat} from '@remotion/google-fonts/Montserrat';
import {loadFont as chargerCormorant} from '@remotion/google-fonts/CormorantGaramond';
import {loadFont as chargerPlayfair} from '@remotion/google-fonts/PlayfairDisplay';
import {evolvePath} from '@remotion/paths';
import {noise2D} from '@remotion/noise';
import {AbsoluteFill, Easing, Img, interpolate, random, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {DepthPlate} from '../components/DepthPlate';
import {FilmGrain} from '../components/FilmGrain';
import {Grade} from '../components/Grade';

/** Test « casses historiques » : 3 plans en parallaxe 2,5D style Magnates (casse d'Anvers, 2003). */
const {fontFamily: TITRE} = chargerMontserrat('normal', {weights: ['800', '500'], subsets: ['latin']});
const {fontFamily: SERIF} = chargerCormorant('italic', {weights: ['500'], subsets: ['latin']});
const {fontFamily: UNE} = chargerPlayfair('normal', {weights: ['900', '700'], subsets: ['latin']});

const ROUGE = '#e3242b';
const DOSSIER = 'casses_test/';
const CHEVAUCHE = 12;
export const PLANS = [160, 160, 170];
export const DUREE_CASSES_TEST = PLANS.reduce((a, b) => a + b, 0) - CHEVAUCHE * (PLANS.length - 1);

const Fondu: React.FC<{children: React.ReactNode; duree: number}> = ({children, duree}) => {
  const f = useCurrentFrame();
  const o = interpolate(f, [0, CHEVAUCHE, duree - CHEVAUCHE, duree], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return <AbsoluteFill style={{opacity: o}}>{children}</AbsoluteFill>;
};

const Pluie: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{pointerEvents: 'none', filter: 'blur(0.6px)'}}>
      <svg width="100%" height="100%">
        {Array.from({length: 160}, (_, i) => {
          const x = random(`x${i}`) * 2100 - 90;
          const v = 38 + random(`v${i}`) * 30;
          const y = ((random(`y${i}`) * 1300 + f * v) % 1300) - 110;
          const l = 40 + random(`l${i}`) * 70;
          return <line key={i} x1={x} y1={y} x2={x - l * 0.18} y2={y + l} stroke="#cfe3ff" strokeWidth={1 + random(`w${i}`) * 1.2}
            opacity={0.12 + random(`o${i}`) * 0.22} />;
        })}
      </svg>
    </AbsoluteFill>
  );
};

const Poussiere: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{pointerEvents: 'none', mixBlendMode: 'screen'}}>
      {Array.from({length: 70}, (_, i) => {
        const x = 1000 + random(`px${i}`) * 900 + noise2D(`n${i}`, f * 0.01, 0) * 60;
        const y = random(`py${i}`) * 1080 + noise2D(`m${i}`, f * 0.01, 1) * 50 - f * 0.15;
        const t = 2 + random(`pt${i}`) * 4;
        return <div key={i} style={{position: 'absolute', left: x, top: y, width: t, height: t, borderRadius: t,
          background: '#fff6e0', opacity: 0.25 + random(`po${i}`) * 0.4, filter: 'blur(1px)'}} />;
      })}
    </AbsoluteFill>
  );
};

/** Titre façon reportage : gros mot, puis la date qui se tape lettre par lettre. */
const TitreLieu: React.FC<{mot: string; date: string}> = ({mot, date}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const s = spring({frame: f - 14, fps, config: {damping: 200}});
  const lettres = Math.floor(interpolate(f, [34, 70], [0, date.length], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}));
  return (
    <div style={{position: 'absolute', left: 150, top: 300, color: '#fff', textShadow: '0 6px 40px rgba(0,0,0,.7)'}}>
      <div style={{fontFamily: TITRE, fontWeight: 800, fontSize: 150, letterSpacing: -3, opacity: s,
        transform: `translateY(${(1 - s) * 30}px)`, filter: `blur(${(1 - s) * 10}px)`}}>{mot}</div>
      <div style={{fontFamily: TITRE, fontWeight: 500, fontSize: 38, marginTop: 6, marginLeft: 8, opacity: 0.92}}>
        {date.slice(0, lettres)}
      </div>
    </div>
  );
};

/** Phrase en serif qui arrive mot par mot ; un mot en rouge lumineux. */
const PhraseSerif: React.FC<{mots: string[]; rouge: string; debut?: number; style?: React.CSSProperties}> = ({mots, rouge, debut = 18, style}) => {
  const f = useCurrentFrame();
  return (
    <div style={{position: 'absolute', fontFamily: SERIF, fontStyle: 'italic', fontSize: 104, lineHeight: 1.02, color: '#f4f1ea',
      textShadow: '0 4px 30px rgba(0,0,0,.8)', maxWidth: 900, ...style}}>
      {mots.map((m, i) => {
        const o = interpolate(f, [debut + i * 7, debut + i * 7 + 12], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
        const r = m === rouge;
        return (
          <span key={i} style={{display: 'inline-block', marginRight: 26, opacity: o, filter: `blur(${(1 - o) * 8}px)`,
            transform: `translateY(${(1 - o) * 14}px)`, color: r ? ROUGE : undefined,
            textShadow: r ? `0 0 18px ${ROUGE}, 0 0 46px rgba(227,36,43,.6)` : undefined}}>{m}</span>
        );
      })}
    </div>
  );
};

const progression = (f: number, duree: number) =>
  interpolate(f, [0, duree], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.sin)});

const Plan1: React.FC = () => (
  <Fondu duree={PLANS[0]}>
    <DepthPlate image={`${DOSSIER}p1_exterieur.jpg`} profondeur={`${DOSSIER}p1_exterieur_profondeur.png`}
      mouvement={{zoom: [1.08, 1.13], pousse: [0, 0.2], decale: [[0.012, 0], [-0.018, -0.005]], foyer: [0.62, 0.62]}} />
    <Pluie />
    <TitreLieu mot="ANTWERP" date="February 15th, 2003." />
  </Fondu>
);

const Plan2: React.FC = () => {
  const f = useCurrentFrame();
  const torche = 0.55 + noise2D('torche', f * 0.08, 0) * 0.12 + Math.sin(f * 0.9) * 0.03;
  return (
    <Fondu duree={PLANS[1]}>
      <DepthPlate image={`${DOSSIER}p2_coffre.jpg`} profondeur={`${DOSSIER}p2_coffre_profondeur.png`}
        mouvement={{zoom: [1.12, 1.14], pousse: [0.04, 0.12], decale: [[0.03, 0], [-0.03, 0]], foyer: [0.78, 0.5]}} />
      <AbsoluteFill style={{mixBlendMode: 'screen', opacity: torche,
        background: `radial-gradient(ellipse 22% 30% at ${78 + noise2D('tx', f * 0.03, 0) * 3}% 46%, rgba(255,236,200,.55), rgba(255,236,200,0) 70%)`}} />
      <Poussiere />
      <PhraseSerif mots={['Ten', 'layers', 'of', 'security.']} rouge="security." style={{left: 120, top: 120}} />
    </Fondu>
  );
};

// trajet tracé sur la carte, en pixels de l'image plein cadre (1920×1080)
const TRAJET = 'M 560 250 C 690 300, 620 450, 830 500 S 1120 560, 1150 690 S 1240 790, 1286 805';
const DIAMANTS: [number, number] = [0.67, 0.745];

const Plan3: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const zoom = 1.1 + (1.2 - 1.1) * progression(f, PLANS[2]);
  const trace = interpolate(f, [14, 80], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic)});
  const {strokeDasharray, strokeDashoffset} = evolvePath(trace, TRAJET);
  const impact = spring({frame: f - 80, fps, config: {damping: 12}});
  // le journal n'entre qu'une fois le trajet lu (tracé fini à 80, cible visible ~1 s)
  const journal = spring({frame: f - 112, fps, config: {damping: 18, mass: 0.9}});
  return (
    <Fondu duree={PLANS[2]}>
      <DepthPlate image={`${DOSSIER}p3_carte.jpg`} profondeur={`${DOSSIER}p3_carte_profondeur.png`}
        mouvement={{zoom: [1.1, 1.2], pousse: [0, 0.06], foyer: DIAMANTS}} />
      <AbsoluteFill style={{transform: `scale(${zoom})`, transformOrigin: `${DIAMANTS[0] * 100}% ${DIAMANTS[1] * 100}%`}}>
        <svg width={1920} height={1080} style={{position: 'absolute', overflow: 'visible'}}>
          <path d={TRAJET} fill="none" stroke={ROUGE} strokeWidth={7} strokeLinecap="round" strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset} style={{filter: `drop-shadow(0 0 10px ${ROUGE})`}} />
          <circle cx={1286} cy={805} r={14 + impact * 34} fill="none" stroke={ROUGE} strokeWidth={5} opacity={impact * (1 - Math.min(1, (f - 80) / 60)) + 0.25 * impact} />
        </svg>
      </AbsoluteFill>
      <div style={{position: 'absolute', left: 230, top: 1300 - journal * 1170, width: 1060,
        transform: `rotate(${-14 + journal * 10}deg)`, filter: 'drop-shadow(0 40px 60px rgba(0,0,0,.65))'}}>
        <Img src={staticFile(`${DOSSIER}p3_journal.png`)} style={{width: '100%', display: 'block'}} />
        <div style={{position: 'absolute', left: '5.5%', top: '9%', width: '89%', height: '36%', display: 'flex', flexDirection: 'column',
          justifyContent: 'center', alignItems: 'center', color: '#141414', fontFamily: UNE, textAlign: 'center'}}>
          <div style={{fontWeight: 900, fontSize: 94, lineHeight: 0.95, letterSpacing: -1}}>DIAMOND VAULT</div>
          <div style={{fontWeight: 900, fontSize: 94, lineHeight: 0.95, letterSpacing: -1}}>EMPTIED</div>
          <div style={{fontWeight: 700, fontSize: 30, marginTop: 14}}>Thieves strike the heart of Antwerp over the weekend</div>
        </div>
      </div>
    </Fondu>
  );
};

/** Rayures et poussières de pellicule qui sautent d'une image à l'autre. */
const Rayures: React.FC = () => {
  const f = useCurrentFrame();
  const n = Math.floor(f / 3);
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      {random(`r${n}`) > 0.55 ? <div style={{position: 'absolute', left: random(`rx${n}`) * 1920, top: 0, width: 1.5, height: 1080,
        background: 'rgba(255,255,255,.18)'}} /> : null}
      {random(`t${n}`) > 0.7 ? <div style={{position: 'absolute', left: random(`tx${n}`) * 1920, top: random(`ty${n}`) * 1080,
        width: 3, height: 3, borderRadius: 3, background: 'rgba(0,0,0,.5)'}} /> : null}
    </AbsoluteFill>
  );
};

export const CassesTest: React.FC = () => {
  const debuts = PLANS.map((_, i) => PLANS.slice(0, i).reduce((a, b) => a + b, 0) - CHEVAUCHE * i);
  const corps = [Plan1, Plan2, Plan3];
  return (
    <AbsoluteFill style={{backgroundColor: '#000'}}>
      <Grade reglage={{teinte: '#24404f', contraste: 1.1, saturation: 0.72, vignette: 0.7, mode: 'soft-light'}}>
        {corps.map((Corps, i) => (
          <Sequence key={i} from={debuts[i]} durationInFrames={PLANS[i]}>
            <Corps />
          </Sequence>
        ))}
      </Grade>
      <Rayures />
      <FilmGrain intensite={0.14} />
    </AbsoluteFill>
  );
};
