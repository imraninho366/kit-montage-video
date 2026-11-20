import {interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {theme} from '../design/theme';

/** Bandeau chiffre + légende + source, en bas à gauche dans la zone sûre. */
export const LowerThird: React.FC<{nom: string; fonction?: string; source?: string}> = ({nom, fonction, source}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const s = spring({frame, fps, config: {damping: 200}});
  const s2 = spring({frame: frame - 5, fps, config: {damping: 200}});
  return (
    <div style={{position: 'absolute', left: theme.marge, bottom: theme.marge}}>
      <div style={{overflow: 'hidden'}}>
        <div style={{display: 'inline-block', backgroundColor: 'var(--accent, #D9A441)', color: 'var(--fond, #0E1116)', fontFamily: theme.type.titre,
          fontSize: 64, letterSpacing: 1, padding: '6px 24px', transform: `translateY(${interpolate(s, [0, 1], [100, 0])}%)`}}>
          {nom}
        </div>
      </div>
      {fonction ? (
        <div style={{backgroundColor: 'rgba(14,17,22,0.92)', color: 'var(--encre, #F2F0EB)', fontFamily: theme.type.corps, fontSize: 28,
          padding: '10px 24px', opacity: s2, transform: `translateX(${interpolate(s2, [0, 1], [-20, 0])}px)`, maxWidth: 1100}}>
          {fonction}
        </div>
      ) : null}
      {null}
    </div>
  );
};
