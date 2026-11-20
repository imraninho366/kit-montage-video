import {loadFont as chargerLora} from '@remotion/google-fonts/Lora';
import {loadFont as chargerMono} from '@remotion/google-fonts/IBMPlexMono';
import {AbsoluteFill, Audio, Easing, interpolate, OffthreadVideo, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';

/**
 * Prototype réaliste de ONE LIFE (15 s) : la vidéo 3D vient de Blender (onelife-3d/scene_proto.py, Ethan MPFB),
 * l'interface (compteurs, roue de la mort, vote) et le son sont posés ici.
 * Chiffre vérifié : probabilité de mourir entre 16 et 17 ans, garçons, États-Unis 2022 = 0,000697 (CDC, NVSR vol. 74 n° 2, tableau 2).
 */
const {fontFamily: SERIF} = chargerLora('normal', {weights: ['400', '500'], subsets: ['latin']});
chargerLora('italic', {weights: ['400'], subsets: ['latin']});
const {fontFamily: MONO} = chargerMono('normal', {weights: ['500'], subsets: ['latin']});

export const DUREE_REEL3D = 450;
const P_MORT = 0.000697;
const T_ROUE = 215, D_ROUE = 150, T_VOTE = 368;
const OR = '#ffcf5a', ROUGE = '#ff4a4a';
const ombre = '0 2px 16px rgba(0,0,0,0.55), 0 1px 3px rgba(0,0,0,0.6)';
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

/** Rotation de la roue à l'image t (degrés). Partagée par l'image et par les « tic » sonores. */
const TOURS = 4;
const CIBLE = P_MORT * 360 + 3.2; // s'arrête juste après la part rouge : le frisson, sans tricher sur la taille
const rotRoue = (t: number) => (360 * TOURS - CIBLE) * interpolate(t, [16, D_ROUE - 34], [0, 1], {...clamp, easing: Easing.bezier(0.1, 0.62, 0.1, 1)});

const Compteurs: React.FC<{f: number}> = ({f}) => {
  const o = interpolate(f, [T_VOTE - 10, T_VOTE + 6], [1, 0], clamp) * interpolate(f, [0, 8], [0, 1], clamp);
  return (
    <div style={{position: 'absolute', top: 110, left: 60, color: '#fff', textShadow: ombre, opacity: o}}>
      <div style={{fontFamily: MONO, fontSize: 22, letterSpacing: 5, opacity: 0.85}}>ONE LIFE · EPISODE 1</div>
      <div style={{fontFamily: SERIF, fontSize: 112, lineHeight: 1}}>Age 16</div>
      <div style={{fontFamily: MONO, fontSize: 22, letterSpacing: 2, marginTop: 14}}>RISK OF DYING THIS YEAR · {(P_MORT * 100).toFixed(2)}%</div>
      <div style={{fontFamily: MONO, fontSize: 16, letterSpacing: 2, opacity: 0.6, marginTop: 4}}>SOURCE: CDC LIFE TABLES 2022</div>
    </div>
  );
};

const LIGNES: {de: number; a: number; t: string; rouge?: boolean}[] = [
  {de: 6, a: 88, t: 'This is Ethan. He’s 16.'},
  {de: 92, a: 150, t: 'From now on, you decide his life.'},
  {de: 154, a: 210, t: 'Real odds. If he dies, it’s over.', rouge: true},
];

const Ligne: React.FC<{f: number}> = ({f}) => {
  const l = LIGNES.find((x) => f >= x.de && f < x.a);
  if (!l) return null;
  const o = interpolate(f, [l.de, l.de + 8, l.a - 8, l.a], [0, 1, 1, 0]);
  return (
    <div style={{position: 'absolute', top: 1520, left: 70, right: 70, textAlign: 'center', fontFamily: SERIF, fontStyle: 'italic', fontSize: 54,
      color: l.rouge ? '#ffb3a8' : '#fff', textShadow: ombre, opacity: o}}>{l.t}</div>
  );
};

const arc = (r: number, a0: number, a1: number) => {
  const pt = (a: number) => [Math.sin((a * Math.PI) / 180) * r, -Math.cos((a * Math.PI) / 180) * r];
  const [x0, y0] = pt(a0), [x1, y1] = pt(a1);
  return `M0,0 L${x0},${y0} A${r},${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${x1},${y1} Z`;
};

const RoueMort: React.FC<{f: number}> = ({f}) => {
  const {fps} = useVideoConfig();
  const t = f - T_ROUE;
  if (t < 0 || t > D_ROUE + 20) return null;
  const e = spring({frame: t, fps, config: {damping: 14, stiffness: 170}});
  const sortie = interpolate(t, [D_ROUE + 4, D_ROUE + 20], [1, 0], clamp);
  const fini = t > D_ROUE - 32;
  const R = 230;
  return (
    <AbsoluteFill style={{alignItems: 'center', paddingTop: 1010, opacity: sortie}}>
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(5,8,20,0) 40%, rgba(5,8,20,0.7) 62%, rgba(5,8,20,0.85) 100%)', opacity: e}} />
      <div style={{position: 'relative', fontFamily: SERIF, fontSize: 56, color: '#fff', textShadow: ombre, opacity: e}}>Does Ethan survive age 16?</div>
      <div style={{position: 'relative', display: 'flex', gap: 34, marginTop: 14, opacity: e, fontFamily: MONO, fontSize: 26, color: '#fff', textShadow: ombre}}>
        <span><span style={{color: ROUGE}}>■</span> DIES {(P_MORT * 100).toFixed(2)}%</span>
        <span><span style={{color: '#7d8bb0'}}>■</span> LIVES {((1 - P_MORT) * 100).toFixed(2)}%</span>
      </div>
      <svg style={{position: 'relative', marginTop: 18, transform: `scale(${0.75 + 0.25 * e})`}} width={R * 2 + 30} height={R * 2 + 60} viewBox={`${-R - 15} ${-R - 45} ${R * 2 + 30} ${R * 2 + 60}`}>
        <g transform={`rotate(${rotRoue(t)})`}>
          <circle r={R} fill="#3a4766" stroke="#0b0f1e" strokeWidth={4} />
          <path d={arc(R, 0, Math.max(P_MORT * 360, 0.7))} fill={ROUGE} />
          <circle r={26} fill="#0b0f1e" />
        </g>
        <path d={`M-20,${-R - 40} L20,${-R - 40} L0,${-R + 6} Z`} fill="#fff" stroke="#0b0f1e" strokeWidth={4} />
      </svg>
      <div style={{position: 'absolute', top: 1600, left: 0, right: 0, textAlign: 'center', fontFamily: SERIF, fontSize: 76, color: '#fff', textShadow: ombre,
        opacity: fini ? interpolate(t, [D_ROUE - 32, D_ROUE - 20], [0, 1], clamp) : 0}}>He lives.</div>
    </AbsoluteFill>
  );
};

const OPTIONS: [string, string][] = [['A', 'Get his driver’s license'], ['B', 'Find a summer job'], ['C', 'Join the football team']];

const Vote: React.FC<{f: number}> = ({f}) => {
  const {fps} = useVideoConfig();
  if (f < T_VOTE) return null;
  const e = (d: number) => spring({frame: f - T_VOTE - d, fps, config: {damping: 14, stiffness: 170}});
  return (
    <AbsoluteFill style={{background: `rgba(6,10,26,${interpolate(f, [T_VOTE, T_VOTE + 12], [0, 0.62], clamp)})`, alignItems: 'center', paddingTop: 560}}>
      <div style={{fontFamily: MONO, fontSize: 28, letterSpacing: 8, color: OR, opacity: e(0)}}>YOU DECIDE</div>
      <div style={{fontFamily: SERIF, fontSize: 70, color: '#fff', marginTop: 12, textShadow: ombre, opacity: e(3)}}>What does Ethan do first?</div>
      <div style={{marginTop: 50, display: 'flex', flexDirection: 'column', gap: 26, width: 860}}>
        {OPTIONS.map(([k, t], i) => (
          <div key={k} style={{display: 'flex', alignItems: 'center', gap: 26, background: 'rgba(255,255,255,0.1)', border: '2px solid rgba(255,255,255,0.3)', borderRadius: 22, padding: '20px 26px',
            opacity: e(10 + i * 5), transform: `translateX(${(1 - e(10 + i * 5)) * -60}px)`}}>
            <div style={{width: 70, height: 70, borderRadius: 35, background: OR, color: '#1b1406', fontFamily: SERIF, fontWeight: 500, fontSize: 40, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>{k}</div>
            <div style={{fontFamily: SERIF, fontSize: 44, color: '#fff', whiteSpace: 'nowrap'}}>{t}</div>
          </div>
        ))}
      </div>
      <div style={{marginTop: 48, fontFamily: SERIF, fontStyle: 'italic', fontSize: 42, color: '#fff', opacity: e(28), textAlign: 'center'}}>Comment A, B or C.</div>
    </AbsoluteFill>
  );
};

/** Un « tic » à chaque passage d'un cran de 15° sous l'aiguille. */
const tics = (() => {
  const l: number[] = [];
  let prev = 0;
  for (let t = 0; t <= D_ROUE; t++) {
    const k = Math.floor(rotRoue(t) / 15);
    if (k !== prev) { l.push(T_ROUE + t); prev = k; }
  }
  return l;
})();

export const Reel3D: React.FC = () => {
  const f = useCurrentFrame();
  const fin = T_ROUE + D_ROUE - 34; // arrêt de la roue
  const musique = (x: number) => interpolate(x, [0, 20, fin - 70, fin - 60, fin + 30, fin + 60, DUREE_REEL3D - 20, DUREE_REEL3D], [0, 0.32, 0.32, 0, 0, 0.22, 0.22, 0], clamp);
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <OffthreadVideo src={staticFile('onelife/proto_3d.mp4')} muted />
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(5,8,20,0.5) 0%, rgba(5,8,20,0) 22%)'}} />
      <Compteurs f={f} />
      <Ligne f={f} />
      <RoueMort f={f} />
      <Vote f={f} />
      <Audio src={staticFile('onelife/nappe.wav')} volume={musique} />
      <Sequence from={T_ROUE}><Audio src={staticFile('onelife/whoosh.wav')} volume={0.5} /></Sequence>
      <Sequence from={T_VOTE}><Audio src={staticFile('onelife/whoosh.wav')} volume={0.5} /></Sequence>
      {tics.map((d, i) => <Sequence key={i} from={d} durationInFrames={4}><Audio src={staticFile('onelife/tic.wav')} volume={0.35} /></Sequence>)}
      {[0, 22, 42, 60, 76, 90, 102].map((d, i) => <Sequence key={`c${i}`} from={fin - 108 + d} durationInFrames={20}><Audio src={staticFile('onelife/coeur.wav')} volume={0.9} /></Sequence>)}
      <Sequence from={fin}><Audio src={staticFile('onelife/impact.wav')} volume={0.8} /></Sequence>
    </AbsoluteFill>
  );
};
