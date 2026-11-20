import {interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {theme} from '../design/theme';

/** Noms propres qui s'empilent en bas à gauche, chacun au moment où la voix le prononce. Jamais de logo. */
export const Chips: React.FC<{noms: {texte: string; a: number}[]; titre?: string; source?: string}> = ({noms, titre, source}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return (
    <div style={{position: 'absolute', left: theme.marge, bottom: theme.marge, display: 'flex', flexDirection: 'column', gap: 12}}>
      {titre ? <div style={{fontFamily: theme.type.corps, fontWeight: 700, fontSize: 22, letterSpacing: 4, color: 'var(--accent, #D9A441)',
        textTransform: 'uppercase', textShadow: '0 2px 10px rgba(0,0,0,.9)', opacity: spring({frame, fps, config: {damping: 200}})}}>{titre}</div> : null}
      {noms.map((n) => {
        const s = spring({frame: frame - n.a, fps, config: {damping: 18, stiffness: 160}});
        return (
          <div key={n.texte} style={{alignSelf: 'flex-start', backgroundColor: 'rgba(14,17,22,0.9)', borderLeft: `6px solid ${'var(--accent, #D9A441)'}`,
            padding: '8px 26px', fontFamily: theme.type.titre, fontSize: 58, color: 'var(--encre, #F2F0EB)', letterSpacing: 1,
            opacity: interpolate(s, [0, 0.4], [0, 1], {extrapolateRight: 'clamp'}), transform: `translateX(${interpolate(s, [0, 1], [-60, 0])}px)`}}>
            {n.texte}
          </div>
        );
      })}
      {null}
    </div>
  );
};
