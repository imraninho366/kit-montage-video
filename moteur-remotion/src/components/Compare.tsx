import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {theme} from '../design/theme';

export type Barre = {nom: string; detail: string; valeur: number; a: number; couleur: string};

/** Deux (ou plus) barres horizontales à la même échelle : la différence d'ordre de grandeur se voit. */
const formater = (v: number, format: 'dollar' | 'pourcent' | 'nombre' | 'euro', dec: number) => {
  const n = v.toLocaleString('en-US', {minimumFractionDigits: dec, maximumFractionDigits: dec});
  return format === 'dollar' ? `$${n}` : format === 'euro' ? `€${n}` : format === 'pourcent' ? `${n}%` : n;
};

export const Compare: React.FC<{titre: string; barres: Barre[]; max: number; source: string; format?: 'dollar' | 'pourcent' | 'nombre' | 'euro'; decimales?: number}> = ({titre, barres, max, source, format = 'dollar', decimales = 2}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const L = 1100;
  return (
    <AbsoluteFill style={{backgroundColor: 'var(--fond, #0E1116)', padding: '0 160px', justifyContent: 'center'}}>
      <div style={{fontFamily: theme.type.corps, fontWeight: 700, fontSize: 26, letterSpacing: 4, color: 'var(--accent, #D9A441)',
        textTransform: 'uppercase', marginBottom: 60}}>{titre}</div>
      {barres.map((b) => {
        const s = spring({frame: frame - b.a, fps, config: {damping: 200, mass: 1.2}});
        return (
          <div key={b.nom} style={{marginBottom: 70, opacity: interpolate(s, [0, 0.2], [0, 1], {extrapolateRight: 'clamp'})}}>
            <div style={{display: 'flex', alignItems: 'baseline', gap: 20, marginBottom: 14}}>
              <div style={{fontFamily: theme.type.titre, fontSize: 52, color: 'var(--encre, #F2F0EB)'}}>{b.nom}</div>
              <div style={{fontFamily: theme.type.corps, fontSize: 24, color: 'var(--sourdine, #8A94A0)'}}>{b.detail}</div>
            </div>
            <div style={{display: 'flex', alignItems: 'center', gap: 28}}>
              <div style={{height: 70, width: Math.max(6, (b.valeur / max) * L * s), backgroundColor: b.couleur}} />
              <div style={{fontFamily: theme.type.titre, fontSize: 72, color: 'var(--encre, #F2F0EB)'}}>{formater(b.valeur * s, format, decimales)}</div>
            </div>
          </div>
        );
      })}
      
    </AbsoluteFill>
  );
};
