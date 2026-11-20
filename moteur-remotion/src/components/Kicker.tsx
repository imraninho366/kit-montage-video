import {interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {theme} from '../design/theme';

/** Étiquette de partie en haut à gauche (« 02 — WHERE $100 GOES »), qui s'efface seule. */
export const Kicker: React.FC<{numero: string; titre: string; duree?: number}> = ({numero, titre, duree = 120}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const o = interpolate(frame, [0, 10, duree - 12, duree], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const trait = interpolate(frame, [4, 4 + fps * 0.6], [0, 64], {extrapolateRight: 'clamp'});
  return (
    <div style={{position: 'absolute', left: theme.marge, top: theme.marge * 0.8, opacity: o, display: 'flex', alignItems: 'center', gap: 18}}>
      <div style={{fontFamily: theme.type.titre, fontSize: 30, color: 'var(--accent, #D9A441)', letterSpacing: 2}}>{numero}</div>
      <div style={{height: 2, width: trait, backgroundColor: 'var(--accent, #D9A441)'}} />
      <div style={{fontFamily: theme.type.corps, fontWeight: 700, fontSize: 22, color: 'var(--encre, #F2F0EB)', letterSpacing: 4, textTransform: 'uppercase'}}>{titre}</div>
    </div>
  );
};
