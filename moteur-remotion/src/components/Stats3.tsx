import {AbsoluteFill, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {theme} from '../design/theme';
import {Odometre} from './Odometre';

export type Stat = {texte: string; legende: string; a: number};

/** Deux à quatre chiffres côte à côte, chacun qui défile au moment où la voix le dit. */
export const Stats3: React.FC<{stats: Stat[]; titre?: string; source?: string}> = ({stats, titre, source}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return (
    <AbsoluteFill style={{backgroundColor: 'var(--fond, #0E1116)', justifyContent: 'center', alignItems: 'center'}}>
      {titre ? <div style={{fontFamily: theme.type.corps, fontWeight: 700, fontSize: 26, letterSpacing: 6, color: 'var(--accent, #D9A441)',
        textTransform: 'uppercase', marginBottom: 70}}>{titre}</div> : null}
      <div style={{display: 'flex', gap: 110}}>
        {stats.map((s) => {
          const o = spring({frame: frame - s.a, fps, config: {damping: 200}});
          return (
            <div key={s.legende} style={{textAlign: 'center', opacity: frame < s.a ? 0.1 : 1, minWidth: 380}}>
              {frame >= s.a ? <div style={{display: 'flex', justifyContent: 'center'}}>
                <Odometre texte={s.texte} style={{fontFamily: theme.type.titre, fontSize: 170, color: 'var(--encre, #F2F0EB)'}} />
              </div> : <div style={{height: 204}} />}
              <div style={{fontFamily: theme.type.corps, fontSize: 32, color: 'var(--sourdine, #8A94A0)', marginTop: 10, opacity: o}}>{s.legende}</div>
            </div>
          );
        })}
      </div>
      {null}
    </AbsoluteFill>
  );
};
