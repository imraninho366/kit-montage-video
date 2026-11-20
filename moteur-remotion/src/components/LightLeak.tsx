import {noise2D} from '@remotion/noise';
import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';

/** Halo de lumière chaude qui traverse l'image (fuite de lumière de pellicule), mouvement organique par bruit. */
export const LightLeak: React.FC<{graine?: string; force?: number}> = ({graine = 'a', force = 0.85}) => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();
  const env = interpolate(frame, [0, durationInFrames * 0.35, durationInFrames], [0, 1, 0], {extrapolateRight: 'clamp'});
  const x1 = 30 + noise2D(graine + 'x', frame * 0.02, 0) * 40 + frame * 1.2;
  const y1 = 40 + noise2D(graine + 'y', frame * 0.02, 1) * 30;
  const x2 = 70 + noise2D(graine + 'u', frame * 0.03, 2) * 30 - frame * 0.8;
  return (
    <AbsoluteFill style={{mixBlendMode: 'screen', opacity: env * force, pointerEvents: 'none',
      background: `radial-gradient(ellipse 55% 70% at ${x1}% ${y1}%, rgba(255,150,60,0.9), rgba(255,90,30,0) 70%),
                   radial-gradient(ellipse 40% 50% at ${x2}% 60%, rgba(255,210,140,0.8), rgba(255,160,80,0) 70%)`}} />
  );
};
