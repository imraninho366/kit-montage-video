import {AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {polices} from '../design/theme';

export type SegmentVolant = {texte: string; a: number};

/**
 * Le « flywheel » décrit par le DOJ : un anneau découpé en métiers qui s'allument un à un,
 * puis la roue se met à tourner (à `rotation`) — chaque métier nourrit le suivant.
 */
export const Volant: React.FC<{segments: SegmentVolant[]; centre: string; rotation?: number; titre?: string}> = ({segments, centre, rotation = 1e9, titre}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const CX = 960, CY = 560, R = 330, EP = 70;
  const n = segments.length;
  const elan = frame >= rotation ? interpolate(frame - rotation, [0, 60], [0, 1], {extrapolateRight: 'clamp', easing: Easing.in(Easing.quad)}) : 0;
  const tour = frame >= rotation ? (frame - rotation) * 1.6 * elan : 0;
  const arc = (a0: number, a1: number, r: number) => {
    const p = (a: number) => [CX + r * Math.cos(a), CY + r * Math.sin(a)];
    const [x0, y0] = p(a0), [x1, y1] = p(a1);
    return `M ${x0} ${y0} A ${r} ${r} 0 ${a1 - a0 > Math.PI ? 1 : 0} 1 ${x1} ${y1}`;
  };
  return (
    <AbsoluteFill style={{backgroundColor: 'var(--fond, #0B0714)'}}>
      {titre ? <div style={{position: 'absolute', left: 96, top: 60, fontFamily: polices.spacemono, fontSize: 26, letterSpacing: 6,
        color: 'var(--sourdine, #9A8CB8)'}}>{titre}</div> : null}
      <svg width={1920} height={1080} style={{position: 'absolute'}}>
        <g transform={`rotate(${tour} ${CX} ${CY})`}>
          {segments.map((s, i) => {
            const a0 = -Math.PI / 2 + (i / n) * 2 * Math.PI + 0.05, a1 = -Math.PI / 2 + ((i + 1) / n) * 2 * Math.PI - 0.05;
            const p = interpolate(frame - s.a, [0, 18], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
            const fin = a0 + (a1 - a0) * p;
            const pointe = [CX + R * Math.cos(fin), CY + R * Math.sin(fin)];
            return p > 0 ? (
              <g key={i}>
                <path d={arc(a0, fin, R)} style={{fill: 'none', stroke: i % 2 ? '#21D4FD' : 'var(--accent, #FF2E88)', strokeWidth: EP, opacity: 0.9}} />
                {p > 0.95 ? <polygon points={`${pointe[0]},${pointe[1] - 44} ${pointe[0] + 40},${pointe[1]} ${pointe[0]},${pointe[1] + 44}`}
                  transform={`rotate(${(fin * 180) / Math.PI + 90} ${pointe[0]} ${pointe[1]})`} style={{fill: 'var(--encre, #F4EEFF)'}} /> : null}
              </g>
            ) : null;
          })}
        </g>
      </svg>
      {segments.map((s, i) => {
        const a = -Math.PI / 2 + ((i + 0.5) / n) * 2 * Math.PI + (tour * Math.PI) / 180;
        const o = spring({frame: frame - s.a - 6, fps, config: {damping: 200}});
        const x = CX + (R + 150) * Math.cos(a), y = CY + (R + 110) * Math.sin(a);
        return (
          <div key={i} style={{position: 'absolute', left: x, top: y, transform: 'translate(-50%, -50%)', opacity: o, fontFamily: polices.affiche,
            fontSize: 64, color: 'var(--encre, #F4EEFF)', letterSpacing: 2, whiteSpace: 'nowrap', textShadow: '0 4px 20px rgba(0,0,0,.8)'}}>{s.texte}</div>
        );
      })}
      <div style={{position: 'absolute', left: CX, top: CY, transform: 'translate(-50%, -50%)', fontFamily: polices.affiche, fontSize: 84,
        color: 'var(--encre, #F4EEFF)', textAlign: 'center', lineHeight: 0.95, maxWidth: 440}}>{centre}</div>
    </AbsoluteFill>
  );
};
