import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {theme} from '../design/theme';

/** « 1er mars 1971. / Washington, D.C. » — le carton de date en fragments, voix documentaire. */
export const DatelineCard: React.FC<{lignes: string[]; taille?: number}> = ({lignes, taille = theme.type.tailleDateline}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return (
    <AbsoluteFill
      style={{backgroundColor: 'var(--fond, #0E1116)', justifyContent: 'center', padding: theme.marge}}>
      {lignes.map((l, i) => {
        const s = spring({frame: frame - i * 9, fps, config: {damping: 200}});
        return (
          <div
            key={l}
            style={{
              fontFamily: theme.type.titre,
              fontSize: taille,
              color: i === 0 ? 'var(--encre, #F2F0EB)' : 'var(--sourdine, #8A94A0)',
              letterSpacing: 2,
              textTransform: 'uppercase',
              opacity: s,
              transform: `translateY(${interpolate(s, [0, 1], [18, 0])}px)`,
              lineHeight: 1.25,
            }}>
            {l}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
