import {AbsoluteFill, useCurrentFrame} from 'remotion';

/** Grain de pellicule animé (le motif change à chaque image) et léger scintillement de lumière. */
export const FilmGrain: React.FC<{intensite?: number}> = ({intensite = 0.07}) => {
  const frame = useCurrentFrame();
  const graine = frame % 12;
  const scintille = 1 + Math.sin(frame * 1.7) * 0.006 + Math.sin(frame * 0.37) * 0.004;
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <svg width="100%" height="100%" style={{position: 'absolute', opacity: intensite, mixBlendMode: 'overlay'}}>
        <filter id={`grain-${graine}`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={graine} stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter={`url(#grain-${graine})`} />
      </svg>
      <AbsoluteFill style={{backgroundColor: `rgba(255,240,220,${(scintille - 1) * 4})`, mixBlendMode: 'soft-light'}} />
    </AbsoluteFill>
  );
};
