import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {theme} from '../design/theme';

/**
 * Le document authentique posé à l'écran, avec la ligne qui compte surlignée.
 * C'est le composant qui remplace la coupure de presse d'un documentaire d'archive :
 * il ne prouve rien tout seul — la mention de source en bas fait le travail.
 */
export const DocumentFrame: React.FC<{
  titre: string; lignes: string[]; surligne: number; source: string;
}> = ({titre, lignes, surligne, source}) => {
  const frame = useCurrentFrame();
  const largeur = interpolate(frame, [12, 34], [0, 100], {extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill style={{backgroundColor: 'var(--fond, #0E1116)', padding: theme.marge, justifyContent: 'center'}}>
      <div style={{backgroundColor: '#EFEAE0', color: '#15181D', padding: 56, boxShadow: '0 30px 80px rgba(0,0,0,.6)'}}>
        <div style={{fontFamily: theme.type.titre, fontSize: 44, marginBottom: 28, letterSpacing: 1}}>{titre}</div>
        {lignes.map((l, i) => (
          <div key={l} style={{position: 'relative', padding: '10px 0', fontFamily: theme.type.corps, fontSize: 34}}>
            {i === surligne ? (
              <div
                style={{
                  position: 'absolute', left: -10, top: 4, height: '100%',
                  width: `${largeur}%`, backgroundColor: theme.couleur.surlignage,
                }}
              />
            ) : null}
            <span style={{position: 'relative', fontWeight: i === surligne ? 700 : 400}}>{l}</span>
          </div>
        ))}
      </div>
      <div style={{marginTop: 24, fontFamily: theme.type.corps, fontSize: 26, color: 'var(--sourdine, #8A94A0)'}}>
        {source}
      </div>
    </AbsoluteFill>
  );
};
