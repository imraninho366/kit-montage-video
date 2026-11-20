import {evolvePath} from '@remotion/paths';
import {AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {theme} from '../design/theme';

export type Point = {etiquette: string; valeur: number};

/**
 * Courbe qui se dessine de gauche à droite. Sous zéro, l'aire est rouge ; au-dessus, ambre.
 * Chaque point apparaît quand le trait l'atteint ; le dernier est mis en avant.
 */
export const LineChart: React.FC<{
  titre: string; points: Point[]; min: number; max: number; unite: string; source: string; trace?: number; final?: string; apparitions?: number[];
}> = ({titre, points, min, max, unite, source, trace = 55, final, apparitions}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const G = 300, D = 1620, H = 250, B = 860;
  const X = (i: number) => G + (i / (points.length - 1)) * (D - G);
  const Y = (v: number) => B - ((v - min) / (max - min)) * (B - H);
  const d = points.map((p, i) => `${i ? 'L' : 'M'}${X(i).toFixed(1)},${Y(p.valeur).toFixed(1)}`).join(' ');
  // apparitions : image où chaque point doit être atteint (calée sur le mot dit) ; sinon, tracé régulier
  const prog = apparitions && apparitions.length === points.length
    ? interpolate(frame, apparitions, points.map((_, i) => i / (points.length - 1)), {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})
    : interpolate(frame, [6, 6 + trace], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic)});
  const atteinte = (i: number) => (apparitions && apparitions.length === points.length ? apparitions[i] : 6 + ((X(i) - G) / (D - G)) * trace);
  const ev = evolvePath(prog, d);
  const xTrace = G + prog * (D - G);
  const aire = `${d} L${D},${Y(0)} L${G},${Y(0)} Z`;
  const entree = spring({frame, fps, config: {damping: 200}});

  const finTrace = apparitions ? apparitions[apparitions.length - 1] : 6 + trace;
  const pulse = interpolate((frame - finTrace) % 30, [0, 30], [0, 1], {extrapolateLeft: 'clamp'});
  return (
    <AbsoluteFill style={{backgroundColor: 'var(--fond, #0E1116)'}}>
      <div style={{position: 'absolute', left: G, top: 120, fontFamily: theme.type.corps, fontWeight: 700, fontSize: 26, letterSpacing: 4,
        color: 'var(--accent, #D9A441)', textTransform: 'uppercase', opacity: entree}}>{titre}</div>
      <svg width={1920} height={1080} style={{position: 'absolute'}}>
        <defs>
          <clipPath id="progression"><rect x={0} y={0} width={xTrace} height={1080} /></clipPath>
          <clipPath id="sous"><rect x={0} y={Y(0)} width={1920} height={1080} /></clipPath>
          <clipPath id="sur"><rect x={0} y={0} width={1920} height={Y(0)} /></clipPath>
          <filter id="lueurC"><feGaussianBlur stdDeviation="5" /></filter>
        </defs>
        {[min, (min + max) / 2, max].map((v) => (
          <line key={v} x1={G} x2={D} y1={Y(v)} y2={Y(v)} stroke="rgba(242,240,235,0.07)" strokeWidth={1} opacity={entree} />
        ))}
        <g clipPath="url(#progression)">
          <path d={aire} fill="rgba(179,70,60,0.28)" clipPath="url(#sous)" />
          <path d={aire} fill="rgba(217,164,65,0.35)" clipPath="url(#sur)" />
        </g>
        <line x1={G - 20} x2={D + 20} y1={Y(0)} y2={Y(0)} stroke="rgba(242,240,235,0.6)" strokeWidth={2} strokeDasharray="8 8" opacity={entree} />
        <text x={G - 36} y={Y(0) + 9} textAnchor="end" fontFamily={theme.type.titre} fontSize={30} style={{fill: 'var(--encre, #F2F0EB)'}} opacity={entree}>$0</text>
        <path d={d} fill="none" style={{stroke: 'var(--encre, #F2F0EB)'}} strokeWidth={10} opacity={0.35} filter="url(#lueurC)"
          strokeDasharray={ev.strokeDasharray} strokeDashoffset={ev.strokeDashoffset} />
        <path d={d} fill="none" style={{stroke: 'var(--encre, #F2F0EB)'}} strokeWidth={4} strokeLinejoin="round" strokeLinecap="round"
          strokeDasharray={ev.strokeDasharray} strokeDashoffset={ev.strokeDashoffset} />
        {points.map((p, i) => {
          const s = spring({frame: frame - atteinte(i), fps, config: {damping: 12, stiffness: 180}});
          const neg = p.valeur < 0, der = i === points.length - 1;
          return (
            <g key={p.etiquette} opacity={frame >= atteinte(i) ? 1 : 0}>
              {der ? <circle cx={X(i)} cy={Y(p.valeur)} r={10 + pulse * 30} fill="none" style={{stroke: 'var(--accent, #D9A441)'}} strokeWidth={3} opacity={1 - pulse} /> : null}
              <circle cx={X(i)} cy={Y(p.valeur)} r={(der ? 12 : 8) * s} style={{fill: der ? 'var(--accent, #D9A441)' : neg ? '#E0685C' : 'var(--encre, #F2F0EB)'}} />
              <text x={X(i)} y={Y(p.valeur) + (neg ? 52 : -26)} textAnchor="middle" fontFamily={theme.type.titre} fontSize={der ? 46 : 34}
                style={{fill: der ? 'var(--accent, #D9A441)' : 'var(--encre, #F2F0EB)'}} opacity={s}>
                {(p.valeur < 0 ? '−$' : '+$') + Math.abs(p.valeur).toLocaleString('en-US', {maximumFractionDigits: 1}) + unite}
              </text>
              <text x={X(i)} y={B + 70} textAnchor="middle" fontFamily={theme.type.corps} fontSize={26} style={{fill: 'var(--sourdine, #8A94A0)'}} opacity={entree}>
                {p.etiquette}
              </text>
            </g>
          );
        })}
      </svg>
      {final ? (
        <div style={{position: 'absolute', right: 150, top: 110, opacity: interpolate(frame, [finTrace, finTrace + 10], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
          fontFamily: theme.type.corps, fontSize: 30, color: 'var(--encre, #F2F0EB)', textAlign: 'right'}}>{final}</div>
      ) : null}
      
    </AbsoluteFill>
  );
};
