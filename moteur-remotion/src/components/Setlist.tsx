import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {polices} from '../design/theme';

/**
 * Carton de partie de la vidéo 2 : une setlist manuscrite scotchée, qui monte dans le cadre,
 * reste le temps du titre, puis retombe. Remplace le carton « Chapitre » de la vidéo 1.
 */
export const Setlist: React.FC<{numero: string; titre: string; pistes?: string[]; actif?: number}> = ({numero, titre, pistes = [], actif = -1}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  const e = spring({frame, fps, config: {damping: 15, stiffness: 120}});
  const s = interpolate(frame, [durationInFrames - 12, durationInFrames], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const voile = interpolate(frame, [0, 8, durationInFrames - 10, durationInFrames], [0, 0.82, 0.82, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const y = interpolate(e, [0, 1], [1100, 0]) + s * 1100;
  const trait = interpolate(frame, [10, 26], [0, 100], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
      <AbsoluteFill style={{backgroundColor: 'var(--fond, #0B0714)', opacity: voile}} />
      <div style={{transform: `translateY(${y}px) rotate(${interpolate(e, [0, 1], [8, -3])}deg)`, width: 900, backgroundColor: '#F7F2E6',
        padding: '60px 80px 70px', boxShadow: '0 40px 80px rgba(0,0,0,.6)', position: 'relative',
        backgroundImage: 'repeating-linear-gradient(180deg, transparent 0 58px, rgba(33,120,200,.18) 58px 60px)'}}>
        {/* scotch */}
        <div style={{position: 'absolute', left: 340, top: -26, width: 220, height: 58, backgroundColor: 'rgba(255,240,180,.75)', transform: 'rotate(2deg)'}} />
        <div style={{fontFamily: polices.spacemono, fontSize: 26, letterSpacing: 8, color: '#1A1024', opacity: 0.6}}>SET {numero}</div>
        <div style={{fontFamily: polices.setlist, fontSize: 150, lineHeight: 1, color: '#1A1024', marginTop: 12, position: 'relative', display: 'inline-block'}}>
          {titre}
          <div style={{position: 'absolute', left: 0, bottom: 6, height: 10, width: `${trait}%`, backgroundColor: 'var(--accent, #FF2E88)',
            borderRadius: 5, transform: 'rotate(-1deg)'}} />
        </div>
        {pistes.map((p, i) => (
          <div key={i} style={{fontFamily: polices.setlist, fontSize: 52, lineHeight: 1.15, marginTop: i ? 0 : 20,
            color: i === actif ? 'var(--accent, #FF2E88)' : 'rgba(26,16,36,.45)', textDecoration: i < actif ? 'line-through' : 'none'}}>
            {i + 1}. {p}
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};
