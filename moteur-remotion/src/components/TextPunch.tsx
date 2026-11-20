import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {theme} from '../design/theme';

/** Une phrase courte, en capitales, mot par mot (chaque mot arrive à son image, calée sur la voix). */
export const TextPunch: React.FC<{mots: {texte: string; a: number}[]; taille?: number}> = ({mots, taille = 140}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return (
    <AbsoluteFill style={{backgroundColor: 'var(--fond, #0E1116)', justifyContent: 'center', alignItems: 'center', padding: theme.marge}}>
      <div style={{display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '0 34px', maxWidth: 1500}}>
        {mots.map((m) => {
          const s = spring({frame: frame - m.a, fps, config: {damping: 16, stiffness: 180}});
          return (
            <span key={m.texte + m.a} style={{fontFamily: theme.type.titre, fontSize: taille, color: 'var(--encre, #F2F0EB)',
              textTransform: 'uppercase', letterSpacing: 2, opacity: interpolate(s, [0, 0.3], [0, 1], {extrapolateRight: 'clamp'}),
              transform: `translateY(${interpolate(s, [0, 1], [40, 0])}px)`, display: 'inline-block'}}>
              {m.texte}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
