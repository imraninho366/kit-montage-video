import {AbsoluteFill} from 'remotion';
import {theme} from '../design/theme';

/** Couche d'étalonnage posée sur TOUS les plans : teinte, vignette, grain. */
export type Etalonnage = {teinte?: string; contraste?: number; saturation?: number; vignette?: number; mode?: string};

export const Grade: React.FC<{children: React.ReactNode; reglage?: Etalonnage}> = ({children, reglage = {}}) => {
  const g = {...theme.grade, mode: 'multiply', ...reglage};
  return (
  <AbsoluteFill>
    <AbsoluteFill
      style={{filter: `contrast(${g.contraste}) saturate(${g.saturation})`}}>
      {children}
    </AbsoluteFill>
    <AbsoluteFill style={{backgroundColor: g.teinte, mixBlendMode: g.mode as React.CSSProperties['mixBlendMode']}} />
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse at center, rgba(0,0,0,0) 45%, rgba(0,0,0,${g.vignette}) 100%)`,
      }}
    />
  </AbsoluteFill>
);
};
