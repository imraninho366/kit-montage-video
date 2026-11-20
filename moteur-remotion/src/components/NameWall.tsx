import {AbsoluteFill, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {theme} from '../design/theme';

export type Nom = {texte: string; detail?: string; a: number};

/** Mur de noms propres (marques, maisons de mode) : grands, en grille, chacun à son moment. Jamais de logo. */
export const NameWall: React.FC<{titre: string; noms: Nom[]; source?: string; couleur?: string}> = ({titre, noms, source, couleur}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const cols = noms.length > 4 ? 3 : 2;
  return (
    <AbsoluteFill style={{backgroundColor: 'var(--fond, #0E1116)', justifyContent: 'center', alignItems: 'center'}}>
      <div style={{fontFamily: theme.type.corps, fontWeight: 700, fontSize: 26, letterSpacing: 6, color: couleur ?? 'var(--accent, #D9A441)',
        textTransform: 'uppercase', marginBottom: 60, opacity: spring({frame, fps, config: {damping: 200}})}}>{titre}</div>
      <div style={{display: 'grid', gridTemplateColumns: `repeat(${cols}, 520px)`, gap: '40px 30px'}}>
        {noms.map((n) => {
          const s = spring({frame: frame - n.a, fps, config: {damping: 16, stiffness: 150}});
          return (
            <div key={n.texte} style={{textAlign: 'center', opacity: frame < n.a ? 0.08 : s, transform: `translateY(${(1 - s) * 30}px)`}}>
              <div style={{fontFamily: theme.type.titre, fontSize: 96, color: 'var(--encre, #F2F0EB)', letterSpacing: 2, lineHeight: 1}}>{n.texte}</div>
              {n.detail ? <div style={{fontFamily: theme.type.corps, fontSize: 26, color: 'var(--sourdine, #8A94A0)', marginTop: 8}}>{n.detail}</div> : null}
            </div>
          );
        })}
      </div>
      {null}
    </AbsoluteFill>
  );
};
