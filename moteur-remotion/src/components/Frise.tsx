import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {theme} from '../design/theme';

export type Evenement = {annee: number; libelle: string; a: number; genre?: 'achat' | 'licence'};

/** Frise chronologique : la ligne se trace, chaque date tombe à son moment, la caméra suit la dernière. */
export const Frise: React.FC<{debut: number; fin: number; evenements: Evenement[]; titre?: string; source?: string}> = ({debut, fin, evenements, titre, source}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const L = 1560;   // toute la frise tient dans l'écran : pas de caméra, aucune date coupée
  const X = (an: number) => ((an - debut) / (fin - debut)) * L;
  const decal = (1920 - L) / 2;
  const trace = interpolate(frame, [0, 25], [0, 1], {extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill style={{backgroundColor: 'var(--fond, #0E1116)', overflow: 'hidden'}}>
      <div style={{position: 'absolute', left: decal, top: 560, width: L * trace, height: 4, backgroundColor: 'rgba(242,240,235,0.35)'}} />
      {Array.from({length: fin - debut + 1}, (_, k) => debut + k).filter((an) => an % 5 === 0).map((an) => (
        <div key={an} style={{position: 'absolute', left: decal + X(an) - 40, top: 590, width: 80, textAlign: 'center', fontFamily: theme.type.corps,
          fontSize: 22, color: 'rgba(242,240,235,0.35)'}}>{an}</div>
      ))}
      {evenements.map((e, i) => {
        const s = spring({frame: frame - e.a, fps, config: {damping: 14, stiffness: 150}});
        if (frame < e.a) return null;
        // quatre niveaux d'étiquettes (haut/bas × proche/loin) : des années voisines ne se chevauchent pas
        const niveau = i % 4, haut = niveau % 2 === 0, loin = niveau === 0 || niveau === 3;
        const c = e.genre === 'licence' ? 'var(--accent, #D9A441)' : '#6FB3A7';
        return (
          <div key={e.libelle + e.annee} style={{position: 'absolute', left: decal + X(e.annee), top: 562}}>
            <div style={{position: 'absolute', left: -12, top: -12, width: 24, height: 24, borderRadius: 12, backgroundColor: c, transform: `scale(${s})`}} />
            <div style={{position: 'absolute', left: -1, top: haut ? -(loin ? 250 : 120) * s : 20, width: 3, height: (loin ? 230 : 100) * s, backgroundColor: c, opacity: 0.6}} />
            <div style={{position: 'absolute', left: -150, width: 300, top: haut ? (loin ? -370 : -240) : (loin ? 250 : 120), textAlign: 'center', opacity: s,
              transform: `translateY(${(1 - s) * (haut ? 20 : -20)}px)`}}>
              <div style={{fontFamily: theme.type.titre, fontSize: 56, color: c, lineHeight: 1}}>{e.annee}</div>
              <div style={{fontFamily: theme.type.corps, fontWeight: 700, fontSize: 30, color: 'var(--encre, #F2F0EB)', marginTop: 4}}>{e.libelle}</div>
            </div>
          </div>
        );
      })}
      {titre ? <div style={{position: 'absolute', left: theme.marge, top: theme.marge * 0.8, fontFamily: theme.type.corps, fontWeight: 700,
        fontSize: 24, letterSpacing: 4, color: 'var(--accent, #D9A441)', textTransform: 'uppercase'}}>{titre}</div> : null}
      {null}
    </AbsoluteFill>
  );
};
