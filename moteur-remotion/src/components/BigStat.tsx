import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {polices, Police, theme} from '../design/theme';
import {Odometre} from './Odometre';

/** Un chiffre seul au centre, qui défile comme un compteur. Posé sur fond uni ou sur une image assombrie. */
export const BigStat: React.FC<{
  valeur: number; decimales?: number; prefixe?: string; suffixe?: string; legende?: string; source?: string; couleur?: string; police?: Police;
}> = ({valeur, decimales = 0, prefixe = '', suffixe = '', legende, source, couleur, police = 'anton'}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const s = spring({frame, fps, config: {damping: 200}});
  const texte = prefixe + valeur.toLocaleString('en-US', {minimumFractionDigits: decimales, maximumFractionDigits: decimales}) + suffixe;
  const l = spring({frame: frame - 14, fps, config: {damping: 200}});
  return (
    <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', padding: theme.marge}}>
      <div style={{transform: `scale(${interpolate(s, [0, 1], [1.12, 1])})`, opacity: s, textShadow: '0 10px 60px rgba(0,0,0,.5)'}}>
        <Odometre texte={texte} style={{fontFamily: theme.type.titre, fontSize: 250, color: couleur ?? 'var(--encre, #F2F0EB)'}} />
      </div>
      {legende ? (
        <div style={{marginTop: 30, fontFamily: police === 'serif' ? polices.citation : theme.type.corps, fontSize: police === 'serif' ? 48 : 38, color: 'var(--encre, #F2F0EB)', opacity: l,
          transform: `translateY(${interpolate(l, [0, 1], [14, 0])}px)`, textAlign: 'center', maxWidth: 1300}}>
          {legende}
        </div>
      ) : null}
      {null}
    </AbsoluteFill>
  );
};
