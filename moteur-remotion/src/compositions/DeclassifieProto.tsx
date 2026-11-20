import {loadFont as chargerSerif} from '@remotion/google-fonts/Newsreader';
import {loadFont as chargerMono} from '@remotion/google-fonts/IBMPlexMono';
import {AbsoluteFill, Easing, Img, interpolate, Sequence, staticFile, useCurrentFrame} from 'remotion';

/** Prototype Bedtime Declassified : chat espion, 61 s. Sombre, lent, sans blanc plein écran. */
const {fontFamily: SERIF} = chargerSerif('normal', {weights: ['400', '500'], subsets: ['latin']});
const {fontFamily: MONO} = chargerMono('normal', {weights: ['400'], subsets: ['latin']});

const FPS = 30;
const NUIT = '#0a1020';
const BLEU = '#16233f';
const CREME = '#e8dcc2';
const DOUX = '#9c977f';
const ROUGE = '#b3261e';
const FONDU = 60;
export const DUREE_DECLASSIFIE_PROTO = Math.ceil(61 * FPS);

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const s = (x: number) => Math.round(x * FPS);
const douce = Easing.inOut(Easing.sin);

/** Fondu lent d'entrée et de sortie : aucun changement brusque, le public s'endort. */
const Plan: React.FC<{duree: number; children: React.ReactNode}> = ({duree, children}) => {
  const f = useCurrentFrame();
  const o = interpolate(f, [0, FONDU, duree - FONDU, duree], [0, 1, 1, 0], {...clamp, easing: douce});
  return <AbsoluteFill style={{opacity: o}}>{children}</AbsoluteFill>;
};

const Apparait: React.FC<{a: number; children: React.ReactNode; style?: React.CSSProperties}> = ({a, children, style}) => {
  const f = useCurrentFrame();
  return <div style={{opacity: interpolate(f, [a, a + 45], [0, 1], {...clamp, easing: douce}), ...style}}>{children}</div>;
};

const Ciel: React.FC = () => <AbsoluteFill style={{background: `radial-gradient(ellipse at 50% 35%, ${BLEU} 0%, ${NUIT} 70%)`}} />;

const Arbre: React.FC<{x: number; h: number; o?: number}> = ({x, h, o = 1}) => (
  <g transform={`translate(${x} 880)`} stroke="#050913" fill="none" strokeLinecap="round" opacity={o}>
    <path d={`M0 0 Q6 ${-h * 0.4} -4 ${-h}`} strokeWidth={16} />
    <path d={`M0 ${-h * 0.45} Q-60 ${-h * 0.7} -130 ${-h * 0.82}`} strokeWidth={8} />
    <path d={`M-2 ${-h * 0.62} Q60 ${-h * 0.8} 120 ${-h * 0.98}`} strokeWidth={7} />
    <path d={`M-4 ${-h * 0.85} Q-30 ${-h * 1.05} -60 ${-h * 1.14}`} strokeWidth={5} />
    <path d={`M-70 ${-h * 0.74} Q-90 ${-h * 0.92} -80 ${-h * 1.02}`} strokeWidth={4} />
    <path d={`M70 ${-h * 0.85} Q110 ${-h * 0.86} 150 ${-h * 0.8}`} strokeWidth={4} />
  </g>
);

/** Parc de nuit dessiné : lampadaire, banc vide, arbres nus, brume qui respire. */
const ParcNuit: React.FC<{duree: number}> = ({duree}) => {
  const f = useCurrentFrame();
  const z = interpolate(f, [0, duree], [1, 1.05]);
  const brume = interpolate(f, [0, duree], [-40, 40]);
  return (
    <AbsoluteFill style={{transform: `scale(${z})`}}>
      <Ciel />
      <svg width={1920} height={1080} style={{position: 'absolute'}}>
        <defs>
          <radialGradient id="halo"><stop offset="0" stopColor="#f0c98a" stopOpacity={0.42} /><stop offset="1" stopColor="#f0c98a" stopOpacity={0} /></radialGradient>
          <radialGradient id="sol"><stop offset="0" stopColor="#6d5a3c" stopOpacity={0.55} /><stop offset="1" stopColor="#6d5a3c" stopOpacity={0} /></radialGradient>
          <linearGradient id="brume" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#7c8ba8" stopOpacity={0} /><stop offset="1" stopColor="#7c8ba8" stopOpacity={0.2} /></linearGradient>
        </defs>
        <Arbre x={230} h={560} o={0.75} /><Arbre x={1680} h={640} o={0.75} /><Arbre x={1320} h={410} o={0.5} /><Arbre x={520} h={380} o={0.5} />
        <linearGradient id="terre" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#070c18" stopOpacity={0} /><stop offset="0.3" stopColor="#070c18" /></linearGradient>
        <rect y={800} width={1920} height={280} fill="url(#terre)" />
        <ellipse cx={960} cy={900} rx={520} ry={72} fill="url(#sol)" />
        <circle cx={1080} cy={350} r={320} fill="url(#halo)" />
        <rect x={1074} y={362} width={12} height={530} fill="#050913" />
        <path d="M1050 362 H1110 L1098 310 H1062 Z" fill="#050913" />
        <rect x={1062} y={322} width={36} height={36} fill="#f3d6a0" opacity={0.92} />
        <g fill="#050913">
          <rect x={700} y={740} width={330} height={13} rx={4} /><rect x={700} y={765} width={330} height={13} rx={4} />
          <rect x={690} y={815} width={350} height={15} rx={4} />
          <rect x={718} y={740} width={13} height={148} /><rect x={1000} y={740} width={13} height={148} />
        </g>
        <rect x={brume - 60} y={640} width={2100} height={300} fill="url(#brume)" />
      </svg>
    </AbsoluteFill>
  );
};

const CHAT = 'M210 138 L222 60 L270 112 Q300 104 330 114 L376 58 L388 140 Q412 188 382 236 Q356 266 342 280 Q440 340 470 470 Q488 560 450 640 L520 640 Q600 640 640 590 Q672 546 636 520 Q608 504 596 534 Q590 566 540 586 L498 592 L492 648 L210 648 Q190 648 196 620 L240 606 Q262 450 276 300 Q240 280 218 244 Q184 188 210 138 Z';

const Note: React.FC<{a: number; x: number; y: number; titre: string; detail: string}> = ({a, x, y, titre, detail}) => (
  <Apparait a={a} style={{position: 'absolute', left: x, top: y}}>
    <div style={{fontFamily: MONO, fontSize: 22, letterSpacing: 3, color: DOUX}}>{titre}</div>
    <div style={{fontFamily: SERIF, fontSize: 44, color: CREME, marginTop: 8}}>{detail}</div>
  </Apparait>
);

/** Schéma : seule illustration du dispositif, signalée comme telle. Aucune chirurgie montrée. */
const Schema: React.FC<{duree: number}> = ({duree}) => {
  const f = useCurrentFrame();
  const z = interpolate(f, [0, duree], [1, 1.035]);
  const trait = (a: number) => interpolate(f, [a, a + 75], [0, 1], {...clamp, easing: douce});
  const mic = s(4.2), emetteur = s(7.4), fil = s(11.6);
  return (
    <AbsoluteFill>
      <Ciel />
      <AbsoluteFill style={{transform: `scale(${z})`}}>
        <svg width={1920} height={1080} style={{position: 'absolute'}}>
          <g transform="translate(170 180) scale(1.08)">
            <path d={CHAT} fill={BLEU} stroke={CREME} strokeWidth={3} strokeLinejoin="round" />
            <path d="M242 190 q16 -12 32 0 M322 190 q16 -12 32 0" fill="none" stroke={CREME} strokeWidth={3} strokeLinecap="round" />
            <path d="M286 222 l12 10 l12 -10" fill="none" stroke={CREME} strokeWidth={3} strokeLinejoin="round" />
            <circle cx={362} cy={120} r={9} fill={ROUGE} opacity={trait(mic)} />
            <circle cx={366} cy={252} r={11} fill={ROUGE} opacity={trait(emetteur)} />
            <path d="M366 252 Q430 330 450 470 Q462 550 442 620" fill="none" stroke={ROUGE} strokeWidth={3} strokeDasharray="620" strokeDashoffset={620 * (1 - trait(fil))} />
            <path d="M372 120 H800" stroke={ROUGE} strokeWidth={1.5} pathLength={1} strokeDasharray="1" strokeDashoffset={1 - trait(mic)} />
            <path d="M378 252 H800" stroke={ROUGE} strokeWidth={1.5} pathLength={1} strokeDasharray="1" strokeDashoffset={1 - trait(emetteur)} />
            <path d="M452 480 H800" stroke={ROUGE} strokeWidth={1.5} pathLength={1} strokeDasharray="1" strokeDashoffset={1 - trait(fil)} />
          </g>
          <text x={80} y={1030} fontFamily={MONO} fontSize={18} letterSpacing={2} fill={DOUX} opacity={0.7}>ILLUSTRATION · PLACEMENT APPROXIMATE</text>
        </svg>
        <Note a={mic} x={1050} y={270} titre="MICROPHONE" detail="in the ear canal" />
        <Note a={emetteur} x={1050} y={412} titre="RADIO TRANSMITTER" detail="at the base of the skull" />
        <Note a={fil} x={1050} y={660} titre="THIN WIRE" detail="through the fur" />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const Version: React.FC<{a: number; x: number; nom: string; role: string; texte: string; rot: number}> = ({a, x, nom, role, texte, rot}) => (
  <Apparait a={a} style={{position: 'absolute', left: x, top: 330, width: 560, transform: `rotate(${rot}deg)`, background: '#1b2237', border: `1px solid ${DOUX}55`, padding: '38px 42px'}}>
    <div style={{fontFamily: MONO, fontSize: 20, letterSpacing: 3, color: DOUX}}>{role}</div>
    <div style={{fontFamily: SERIF, fontSize: 48, color: CREME, marginTop: 10}}>{nom}</div>
    <div style={{fontFamily: SERIF, fontSize: 36, lineHeight: 1.3, color: CREME, opacity: 0.85, marginTop: 24}}>{texte}</div>
  </Apparait>
);

/** Le récit de la mort du chat reste contesté : on montre les deux versions. */
const Dispute: React.FC<{duree: number}> = ({duree}) => (
  <AbsoluteFill>
    <AbsoluteFill style={{filter: 'brightness(.5) blur(3px)'}}><ParcNuit duree={duree} /></AbsoluteFill>
    <Apparait a={40} style={{position: 'absolute', left: 0, right: 0, top: 170, textAlign: 'center', fontFamily: MONO, fontSize: 24, letterSpacing: 6, color: DOUX}}>WASHINGTON, D.C.</Apparait>
    <Version a={s(6.8)} x={270} role="FORMER CIA OFFICER" nom="Victor Marchetti" texte="The cat was struck by a taxi almost at once." rot={-1.2} />
    <Version a={s(7.6)} x={1090} role="FORMER CIA TECHNICAL CHIEF" nom="Robert Wallace" texte="Too hard to train. It lived a long and happy life." rot={1} />
  </AbsoluteFill>
);

const LARGEUR = 1500;
const ECH = LARGEUR / 1275;

type Trait = {x: number; y: number; l: number; a: number};

/** Vrai mémo CIA, négatif sombre, pour ne jamais éclairer une chambre. Le document n'est pas réécrit. */
const Memo: React.FC<{page: string; duree: number; de: number; vers: number; traits: Trait[]; source?: boolean}> = ({page, duree, de, vers, traits, source}) => {
  const f = useCurrentFrame();
  const y = interpolate(f, [0, duree], [de, vers], {...clamp, easing: douce});
  return (
    <AbsoluteFill style={{background: '#080c16', overflow: 'hidden'}}>
      <div style={{position: 'absolute', left: (1920 - LARGEUR) / 2, top: 540 - y * ECH, width: LARGEUR}}>
        <Img src={staticFile(`declassifie/${page}`)} style={{width: LARGEUR, display: 'block', filter: 'invert(1) sepia(.45) brightness(.82) contrast(.92)'}} />
        <svg width={LARGEUR} height={1960} style={{position: 'absolute', left: 0, top: 0}}>
          {traits.map((t) => (
            <path key={t.a} d={`M${t.x * ECH} ${t.y * ECH} h${t.l * ECH}`} stroke={ROUGE} strokeWidth={4} pathLength={1} strokeDasharray="1"
              strokeDashoffset={1 - interpolate(f, [t.a, t.a + 60], [0, 1], {...clamp, easing: douce})} />
          ))}
        </svg>
      </div>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at center, transparent 45%, #080c16 92%)'}} />
      {source && <Apparait a={40} style={{position: 'absolute', left: 70, bottom: 46, fontFamily: MONO, fontSize: 18, letterSpacing: 2, color: DOUX, background: '#080c16', padding: '6px 12px'}}>CIA MEMO, MARCH 1967 · NATIONAL SECURITY ARCHIVE</Apparait>}
    </AbsoluteFill>
  );
};

const Carte: React.FC = () => {
  const f = useCurrentFrame();
  const o = interpolate(f, [30, 75, 300, 360], [0, 1, 1, 0], {...clamp, easing: douce});
  return (
    <div style={{position: 'absolute', left: 90, bottom: 80, opacity: o}}>
      <div style={{fontFamily: MONO, fontSize: 24, letterSpacing: 5, color: DOUX}}>FILE 01</div>
      <div style={{fontFamily: SERIF, fontSize: 72, fontWeight: 500, color: CREME, marginTop: 8}}>Acoustic Kitty</div>
    </div>
  );
};

export const DeclassifieProto: React.FC = () => {
  const plans = [
    {de: 0, a: 15.0, C: (d: number) => <><ParcNuit duree={d} /><Carte /></>},
    {de: 14.0, a: 30.0, C: (d: number) => <Schema duree={d} />},
    {de: 29.0, a: 41.0, C: (d: number) => <Dispute duree={d} />},
    {de: 40.0, a: 46.5, C: (d: number) => <Memo page="memo-1.png" duree={d} de={430} vers={520} traits={[{x: 445, y: 505, l: 295, a: 80}]} source />},
    {de: 45.5, a: 55.3, C: (d: number) => <Memo page="memo-1.png" duree={d} de={1160} vers={1235} traits={[{x: 570, y: 1271, l: 270, a: 40}, {x: 280, y: 1232, l: 465, a: s(5)}]} source />},
    {de: 54.3, a: 61, C: (d: number) => <Memo page="memo-2.png" duree={d} de={350} vers={420} traits={[{x: 795, y: 442, l: 195, a: s(2.8)}, {x: 215, y: 480, l: 165, a: s(3.4)}]} source />},
  ];
  return (
    <AbsoluteFill style={{background: NUIT}}>
      {plans.map((p) => {
        const d = s(p.a - p.de);
        return <Sequence key={p.de} from={s(p.de)} durationInFrames={d}><Plan duree={d}>{p.C(d)}</Plan></Sequence>;
      })}
    </AbsoluteFill>
  );
};
