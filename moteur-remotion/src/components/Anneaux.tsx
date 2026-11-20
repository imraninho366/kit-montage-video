import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {theme} from '../design/theme';

export type Anneau = {valeur: number; legende: string; a: number; couleur?: string};

/** Un ou deux anneaux de pourcentage qui se remplissent, le chiffre au centre. */
export const Anneaux: React.FC<{anneaux: Anneau[]; source?: string}> = ({anneaux, source}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const R = 190, C = 2 * Math.PI * R;
  return (
    <AbsoluteFill style={{backgroundColor: 'var(--fond, #0E1116)', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 160}}>
      {anneaux.map((a) => {
        const s = spring({frame: frame - a.a, fps, config: {damping: 200, mass: 1.4}});
        const c = a.couleur ?? 'var(--accent, #D9A441)';
        return (
          <div key={a.legende} style={{position: 'relative', width: 480, textAlign: 'center', opacity: frame < a.a ? 0.15 : 1}}>
            <svg width={480} height={480}>
              <circle cx={240} cy={240} r={R} fill="none" stroke="rgba(242,240,235,0.1)" strokeWidth={34} />
              <circle cx={240} cy={240} r={R} fill="none" style={{stroke: c}} strokeWidth={34} strokeLinecap="round" transform="rotate(-90 240 240)"
                strokeDasharray={`${C * (a.valeur / 100) * s} ${C}`} />
            </svg>
            <div style={{position: 'absolute', left: 0, right: 0, top: 170, fontFamily: theme.type.titre, fontSize: 130, color: 'var(--encre, #F2F0EB)',
              lineHeight: 1}}>{(a.valeur * s).toFixed(a.valeur % 1 ? 1 : 0)}%</div>
            <div style={{fontFamily: theme.type.corps, fontSize: 32, color: 'var(--encre, #F2F0EB)', marginTop: 20,
              opacity: interpolate(s, [0.3, 1], [0, 1], {extrapolateLeft: 'clamp'})}}>{a.legende}</div>
          </div>
        );
      })}
      {null}
    </AbsoluteFill>
  );
};
