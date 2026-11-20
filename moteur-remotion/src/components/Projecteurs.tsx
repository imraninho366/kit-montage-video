import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';

/**
 * Faisceaux de scène qui balaient l'image (surcouche, mélange « screen ») : la ponctuation des
 * changements de partie de la vidéo 2, à la place des fuites de lumière de la vidéo 1.
 */
export const Projecteurs: React.FC<{graine?: number; intensite?: number}> = ({graine = 0, intensite = 0.55}) => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();
  const o = interpolate(frame, [0, 8, durationInFrames - 14, durationInFrames], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}) * intensite;
  const couleurs = ['var(--accent, #FF2E88)', '#21D4FD', '#FFFFFF', 'var(--accent, #FF2E88)', '#21D4FD'];
  return (
    <AbsoluteFill style={{mixBlendMode: 'screen', opacity: o, pointerEvents: 'none'}}>
      {couleurs.map((c, i) => {
        const x = 160 + i * 400;
        const angle = Math.sin((frame + graine * 37 + i * 23) / 18) * 26 + (i - 2) * 6;
        return (
          <div key={i} style={{position: 'absolute', left: x - 180, top: -60, width: 360, height: 1500, transformOrigin: '50% 0%',
            transform: `rotate(${angle}deg)`, clipPath: 'polygon(46% 0, 54% 0, 100% 100%, 0 100%)',
            background: `linear-gradient(180deg, ${c} 0%, color-mix(in srgb, ${c} 35%, transparent) 35%, transparent 85%)`, filter: 'blur(14px)'}} />
        );
      })}
    </AbsoluteFill>
  );
};
