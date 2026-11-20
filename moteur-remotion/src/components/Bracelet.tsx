import {interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {polices} from '../design/theme';

/**
 * Bandeau chiffre + légende façon bracelet de festival (tissu tissé, fermoir) : l'équivalent
 * du LowerThird de la vidéo 1, habillé pour le concert.
 */
export const Bracelet: React.FC<{nom: string; fonction?: string}> = ({nom, fonction}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  const s = spring({frame, fps, config: {damping: 16, stiffness: 120}});
  const s2 = spring({frame: frame - 6, fps, config: {damping: 200}});
  const sortie = interpolate(frame, [durationInFrames - 10, durationInFrames], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <div style={{position: 'absolute', left: 0, bottom: 90, transform: `translateX(${interpolate(s, [0, 1], [-1100, 0]) - sortie * 1100}px)`}}>
      <div style={{display: 'flex', alignItems: 'center', height: 118, paddingLeft: 96, paddingRight: 36, transform: 'rotate(-1.5deg)',
        backgroundColor: 'var(--accent, #FF2E88)', boxShadow: '0 16px 40px rgba(0,0,0,.45)',
        backgroundImage: 'repeating-linear-gradient(135deg, rgba(255,255,255,.14) 0 6px, transparent 6px 14px), repeating-linear-gradient(45deg, rgba(0,0,0,.08) 0 3px, transparent 3px 9px)'}}>
        <span style={{fontFamily: polices.affiche, fontSize: 96, lineHeight: 1, color: '#FFF', letterSpacing: 2, textShadow: '0 3px 0 rgba(0,0,0,.25)'}}>{nom}</span>
        {/* fermoir */}
        <div style={{marginLeft: 34, width: 64, height: 76, borderRadius: 10, background: 'linear-gradient(180deg, #E8E8EE, #9A9AA8)',
          boxShadow: 'inset 0 -6px 0 rgba(0,0,0,.2)'}} />
      </div>
      {fonction ? (
        <div style={{marginLeft: 96, marginTop: 14, display: 'inline-block', backgroundColor: 'rgba(8,4,14,.9)', padding: '10px 22px', maxWidth: 1150,
          fontFamily: polices.grotesk, fontWeight: 700, fontSize: 30, color: 'var(--encre, #F4EEFF)', opacity: s2,
          transform: `translateY(${interpolate(s2, [0, 1], [-14, 0])}px)`}}>{fonction}</div>
      ) : null}
    </div>
  );
};
