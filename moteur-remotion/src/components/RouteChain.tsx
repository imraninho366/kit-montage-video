import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {theme} from '../design/theme';

export type Etape = {titre: string; exemple: string; a: number};

/**
 * « La route » : les étapes entre l'usine et le client, reliées par une route. Chaque étape s'allume
 * quand la voix la cite ; à la fin, une accolade les réunit sous un seul nom.
 */
export const RouteChain: React.FC<{etapes: Etape[]; groupe?: {texte: string; a: number}; source?: string}> = ({etapes, groupe, source}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const n = etapes.length, G = 170, D = 1750, Y = 520;
  const X = (i: number) => G + (i / (n - 1)) * (D - G);
  const allumees = etapes.filter((e) => frame >= e.a).length;
  const progression = etapes.reduce((acc, e, i) => acc + (i ? spring({frame: frame - e.a, fps, config: {damping: 200}}) : 0), 0) / (n - 1);
  const g = groupe ? spring({frame: frame - groupe.a, fps, config: {damping: 200}}) : 0;
  return (
    <AbsoluteFill style={{backgroundColor: 'var(--fond, #0E1116)'}}>
      <div style={{position: 'absolute', left: G, top: Y - 3, width: D - G, height: 6, backgroundColor: 'rgba(242,240,235,0.15)'}} />
      <div style={{position: 'absolute', left: G, top: Y - 3, width: (D - G) * progression, height: 6, backgroundColor: 'var(--accent, #D9A441)',
        boxShadow: '0 0 20px rgba(217,164,65,.7)'}} />
      {etapes.map((e, i) => {
        const s = spring({frame: frame - e.a, fps, config: {damping: 14, stiffness: 150}});
        const on = i < allumees;
        return (
          <div key={e.titre} style={{position: 'absolute', left: X(i), top: Y}}>
            <div style={{position: 'absolute', left: -46, top: -46, width: 92, height: 92, borderRadius: 46,
              backgroundColor: on ? 'var(--accent, #D9A441)' : '#1c222a', border: `3px solid ${on ? 'var(--accent, #D9A441)' : 'rgba(242,240,235,0.3)'}`,
              transform: `scale(${on ? 0.85 + 0.15 * s : 0.85})`, boxShadow: on ? '0 0 40px rgba(217,164,65,.5)' : undefined}} />
            <div style={{position: 'absolute', left: -150, width: 300, top: 80, textAlign: 'center'}}>
              <div style={{fontFamily: theme.type.corps, fontWeight: 700, fontSize: 30, color: on ? 'var(--encre, #F2F0EB)' : 'rgba(242,240,235,0.4)',
                textTransform: 'uppercase', letterSpacing: 2}}>{e.titre}</div>
              <div style={{fontFamily: theme.type.titre, fontSize: 40, color: 'var(--accent, #D9A441)', opacity: on ? s : 0, marginTop: 8}}>{e.exemple}</div>
            </div>
          </div>
        );
      })}
      {groupe ? (
        <div style={{position: 'absolute', left: G - 60, width: D - G + 120, top: Y - 230, opacity: g, textAlign: 'center'}}>
          <div style={{fontFamily: theme.type.titre, fontSize: 84, color: 'var(--encre, #F2F0EB)', letterSpacing: 4, textTransform: 'uppercase',
            transform: `scale(${interpolate(g, [0, 1], [0.9, 1])})`}}>{groupe.texte}</div>
          <div style={{height: 40, marginTop: 20, borderTop: `4px solid ${'var(--accent, #D9A441)'}`, borderLeft: `4px solid ${'var(--accent, #D9A441)'}`,
            borderRight: `4px solid ${'var(--accent, #D9A441)'}`, borderRadius: '14px 14px 0 0', width: `${100 * g}%`, marginLeft: `${50 - 50 * g}%`}} />
        </div>
      ) : null}
      {null}
    </AbsoluteFill>
  );
};
