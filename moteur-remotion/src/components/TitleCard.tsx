import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {theme} from '../design/theme';

/** Carton de section, plein cadre. */
export const TitleCard: React.FC<{titre: string; sous?: string}> = ({titre, sous}) => {
  const frame = useCurrentFrame();
  const o = interpolate(frame, [0, 12], [0, 1], {extrapolateRight: 'clamp'});
  const y = interpolate(frame, [0, 24], [14, 0], {extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill
      style={{backgroundColor: 'var(--fond, #0E1116)', justifyContent: 'center', alignItems: 'center', padding: theme.marge}}>
      <div
        style={{
          fontFamily: theme.type.titre, fontSize: theme.type.tailleTitre, color: 'var(--encre, #F2F0EB)',
          textTransform: 'uppercase', letterSpacing: 3, opacity: o, transform: `translateY(${y}px)`,
          textAlign: 'center',
        }}>
        {titre}
      </div>
      {sous ? (
        <div
          style={{
            marginTop: 20, fontFamily: theme.type.corps, fontSize: 34, color: 'var(--accent, #D9A441)',
            opacity: o, letterSpacing: 1,
          }}>
          {sous}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};
