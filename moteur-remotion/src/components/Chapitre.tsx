import {AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {palettes, Palette, polices, Police} from '../design/theme';

/** Grand carton de chapitre, par-dessus le premier plan de la partie : entre en volet, reste 1 s, ressort. */
export const Chapitre: React.FC<{numero: string; titre: string; palette: Palette; police: Police}> = ({numero, titre, palette, police}) => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();
  const pal = palettes[palette];
  const e = Easing.bezier(0.7, 0, 0.2, 1);
  const entree = interpolate(frame, [0, 12], [0, 1], {extrapolateRight: 'clamp', easing: e});
  const sortie = interpolate(frame, [durationInFrames - 12, durationInFrames], [0, 1], {extrapolateLeft: 'clamp', easing: e});
  const x = (1 - entree) * 100 - sortie * 100;
  const t = interpolate(frame, [6, 24], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill style={{transform: `translateX(${x}%)`, backgroundColor: pal.fond, justifyContent: 'center', padding: '0 170px'}}>
      <div style={{fontFamily: polices.anton, fontSize: 420, lineHeight: 0.8, color: 'transparent', WebkitTextStroke: `4px ${pal.accent}`,
        opacity: t}}>{numero}</div>
      <div style={{fontFamily: polices[police], fontSize: 130, color: pal.encre, marginTop: 20, clipPath: `inset(0 ${(1 - t) * 100}% 0 0)`,
        textTransform: police === 'anton' || police === 'bloc' ? 'uppercase' : 'none'}}>{titre}</div>
    </AbsoluteFill>
  );
};
