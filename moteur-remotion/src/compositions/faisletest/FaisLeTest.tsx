import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';

export type EpisodeBras = {frames: number; phrases: {d: number; f: number}[]; mots: {m: string; d: number; f: number; p: number}[]};

const POLICE = 'Helvetica Neue, Arial, sans-serif';
const JAUNE = '#FFD23F', NOIR = '#141414', CORAIL = '#FF4F4F', BLANC = '#FFFDF6', NUIT = '#1B1B3A';
const lim = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

const Bonhomme: React.FC<{x: number; angle: number; effort: number; surpris?: boolean; echelle?: number; y?: number; couleurBras?: string; encre?: string}> = ({x, angle, effort, surpris, echelle = 1, y = 0, couleurBras = CORAIL, encre = NOIR}) => {
  const frame = useCurrentFrame();
  const tremble = effort * Math.sin(frame * 1.7) * 1.6;
  const a = ((angle + tremble) * Math.PI) / 180;
  const ex = 340 * Math.sin(a), ey = 340 * Math.cos(a);
  return (
    <g transform={`translate(${x} ${y}) scale(${echelle})`}>
      <g stroke={encre} strokeWidth={26} strokeLinecap="round" fill="none">
        <line x1={0} y1={700} x2={0} y2={1060} />
        <line x1={0} y1={1060} x2={-90} y2={1340} />
        <line x1={0} y1={1060} x2={90} y2={1340} />
        <line x1={0} y1={760} x2={-70} y2={1080} />
      </g>
      <line x1={0} y1={760} x2={ex} y2={760 + ey} stroke={couleurBras} strokeWidth={30} strokeLinecap="round" />
      <circle cx={ex} cy={760 + ey} r={30} fill={couleurBras} />
      <circle cx={0} cy={610} r={92} fill={BLANC} stroke={encre} strokeWidth={14} />
      <circle cx={-32} cy={595} r={surpris ? 14 : 10} fill={NOIR} />
      <circle cx={32} cy={595} r={surpris ? 14 : 10} fill={NOIR} />
      {surpris ? <ellipse cx={0} cy={648} rx={16} ry={22} fill={NOIR} />
        : effort > 0 ? <rect x={-30} y={638} width={60} height={14} rx={7} fill={NOIR} />
        : <path d="M-28 640 Q0 668 28 640" stroke={NOIR} strokeWidth={9} fill="none" strokeLinecap="round" />}
    </g>
  );
};

const Cadre: React.FC<{opacity: number}> = ({opacity}) => (
  <g opacity={opacity}>
    <rect x={760} y={330} width={70} height={1040} fill={BLANC} stroke={NOIR} strokeWidth={12} />
    <line x1={60} y1={1370} x2={1020} y2={1370} stroke={NOIR} strokeWidth={12} />
  </g>
);

const Influx: React.FC<{x: number; angle: number}> = ({x, angle}) => {
  const frame = useCurrentFrame();
  const a = (angle * Math.PI) / 180;
  return (
    <>
      {[0, 1, 2].map((k) => {
        const p = ((frame + k * 12) % 36) / 36;
        const cx = x + p * 340 * Math.sin(a), cy = 760 + p * 340 * Math.cos(a);
        return <circle key={k} cx={cx} cy={cy} r={16} fill="#1F7AFF" stroke={BLANC} strokeWidth={5} />;
      })}
    </>
  );
};

const Carte: React.FC<{t: number; d: number; f: number; haut: string; bas: string}> = ({t, d, f, haut, bas}) => {
  const {fps} = useVideoConfig();
  const s = spring({frame: (t - d) * fps, fps, config: {damping: 14}});
  const o = interpolate(t, [f - 0.2, f], [1, 0], lim);
  if (t < d || t > f) return null;
  return (
    <div style={{position: 'absolute', left: 90, top: 400, width: 800, background: NOIR, color: BLANC, borderRadius: 26, padding: '22px 30px', textAlign: 'center', fontFamily: POLICE, transform: `scale(${s})`, opacity: o}}>
      <div style={{fontSize: 42, fontWeight: 600}}>{haut}</div>
      <div style={{fontSize: 74, fontWeight: 900, color: JAUNE}}>{bas}</div>
    </div>
  );
};

const Minuteur: React.FC<{t: number; d: number; f: number}> = ({t, d, f}) => {
  if (t < d || t > f) return null;
  const reste = Math.ceil(f - t);
  const fin = reste <= 5;
  return (
    <div style={{position: 'absolute', top: 180, left: 0, width: 980, textAlign: 'center', fontFamily: POLICE, fontWeight: 900, fontVariantNumeric: 'tabular-nums', fontSize: fin ? 190 : 150, color: fin ? CORAIL : NOIR}}>
      0:{String(reste).padStart(2, '0')}
    </div>
  );
};

const SousTitres: React.FC<{t: number; ep: EpisodeBras; couleur: string}> = ({t, ep, couleur}) => {
  const i = ep.mots.findIndex((m) => t < m.f + 0.15);
  if (i < 0 || t < ep.mots[i].d - 0.25) return null;
  const courant = ep.mots[i];
  const memes = ep.mots.filter((m) => m.p === courant.p);
  const pos = memes.indexOf(courant);
  const debut = Math.floor(pos / 4) * 4;
  return (
    <div style={{position: 'absolute', left: 70, width: 820, top: 1420, textAlign: 'center', fontFamily: POLICE, fontWeight: 900, fontSize: 66, lineHeight: 1.15, color: couleur}}>
      {memes.slice(debut, debut + 4).map((m) => (
        <span key={m.d} style={{color: m === courant ? CORAIL : couleur, marginRight: 16}}>{m.m}</span>
      ))}
    </div>
  );
};

const Stat: React.FC = () => (
  <svg viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
    {Array.from({length: 10}).map((_, k) => {
      const col = k % 5, lig = Math.floor(k / 5), sans = k < 3;
      return <Bonhomme key={k} x={150 + col * 165} y={100 + lig * 420} echelle={0.42} angle={sans ? 8 : 130} effort={0} couleurBras={sans ? '#9A9A9A' : CORAIL} encre={sans ? '#9A9A9A' : NOIR} />;
    })}
  </svg>
);

export const FaisLeTest: React.FC<{ep: EpisodeBras}> = ({ep}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const P = ep.phrases;
  const debutPoussee = P[6].f, finPoussee = debutPoussee + 30;
  const relache = P[15].f;
  const stat = P[20].d, question = P[22].d;
  let angle = 21, effort = 0, x = 460, cadre = 1, surpris = false;
  if (t < P[2].d) { angle = interpolate(t, [0.3, 3.2], [6, 112], lim); cadre = 0; surpris = true; x = 400; }
  else if (t < P[3].d) angle = 6;
  else if (t < debutPoussee) angle = interpolate(t, [P[3].d, P[3].d + 0.6], [6, 21], lim);
  else if (t < finPoussee) effort = 1;
  else {
    cadre = 1; angle = interpolate(t, [relache + 0.6, relache + 5], [8, 92], lim);
    x = interpolate(t, [finPoussee, finPoussee + 0.7], [460, 300], lim); surpris = t > relache + 1;
  }
  const finale = t >= question;
  return (
    <AbsoluteFill style={{background: finale ? NUIT : JAUNE}}>
      {t < stat && (
        <svg viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
          <Cadre opacity={cadre} />
          <Bonhomme x={x} angle={angle} effort={effort} surpris={surpris} />
          {t > P[9].d && t < P[11].d && <Influx x={x} angle={angle} />}
          {t > P[19].d && <Influx x={x} angle={angle} />}
        </svg>
      )}
      {t >= stat && !finale && <Stat />}
      {t >= stat && !finale && (
        <div style={{position: 'absolute', top: 1050, left: 70, width: 820, textAlign: 'center', fontFamily: POLICE, fontWeight: 900, fontSize: 96, color: NOIR}}>3 sur 10</div>
      )}
      <Minuteur t={t} d={debutPoussee} f={finPoussee} />
      <Carte t={t} d={P[11].d} f={P[12].f + 1.5} haut="L'effet Kohnstamm" bas="décrit en 1915" />
      {finale ? (
        <div style={{position: 'absolute', top: 640, left: 70, width: 820, textAlign: 'center', fontFamily: POLICE, fontWeight: 900, fontSize: 130, lineHeight: 1.1, color: JAUNE, transform: `scale(${spring({frame: frame - question * fps, fps, config: {damping: 12}})})`}}>Ça a marché chez toi ?</div>
      ) : <SousTitres t={t} ep={ep} couleur={NOIR} />}
    </AbsoluteFill>
  );
};
