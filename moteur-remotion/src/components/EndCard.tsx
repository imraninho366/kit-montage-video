import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {theme} from '../design/theme';

/** Carton final : les sources, lisibles, sur fond noir. */
export const EndCard: React.FC<{titre: string; sources: string[]}> = ({titre, sources}) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{backgroundColor: '#07080A', justifyContent: 'center', padding: '0 220px'}}>
      <div style={{fontFamily: theme.type.corps, fontWeight: 700, fontSize: 24, letterSpacing: 5, color: 'var(--accent, #D9A441)',
        marginBottom: 34, opacity: interpolate(frame, [0, 15], [0, 1], {extrapolateRight: 'clamp'})}}>{titre}</div>
      {sources.map((s, i) => (
        <div key={s} style={{fontFamily: theme.type.corps, fontSize: 30, color: 'var(--encre, #F2F0EB)', marginBottom: 16,
          opacity: interpolate(frame, [8 + i * 5, 22 + i * 5], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}}>
          {s}
        </div>
      ))}
    </AbsoluteFill>
  );
};
