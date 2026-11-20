import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';

/** Éclair bref sur une révélation : blanc chaud, 6 images. */
export const Flash: React.FC = () => {
  const frame = useCurrentFrame();
  return <AbsoluteFill style={{backgroundColor: '#fff4e0', mixBlendMode: 'screen', pointerEvents: 'none',
    opacity: interpolate(frame, [0, 1, 7], [0, 0.55, 0], {extrapolateRight: 'clamp'})}} />;
};
