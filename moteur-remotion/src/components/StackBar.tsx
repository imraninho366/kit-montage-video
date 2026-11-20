import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {theme} from '../design/theme';

export type Tranche = {libelle: string; montant: number; couleur: string; a: number};

/**
 * Pile de coûts pour 100 $ de ventes, avec la ligne des 100 $. Quand la pile dépasse la ligne,
 * le dépassement apparaît en rouge : c'est la perte d'exploitation, visible sans un mot.
 */
export const StackBar: React.FC<{
  tranches: Tranche[]; limite?: number; total?: {texte: string; a: number}; perte?: {texte: string; a: number}; source: string;
}> = ({tranches, limite = 100, total, perte, source}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const H = 640, base = 900, echelle = H / limite;
  let cumul = 0;
  const ligneY = base - limite * echelle;
  const entree = spring({frame, fps, config: {damping: 200}});
  return (
    <AbsoluteFill style={{backgroundColor: 'var(--fond, #0E1116)'}}>
      <div style={{position: 'absolute', left: 560, top: ligneY, width: 380, borderTop: '3px dashed rgba(242,240,235,0.55)', opacity: entree}} />
      <div style={{position: 'absolute', left: 440, top: ligneY - 26, fontFamily: theme.type.titre, fontSize: 44, color: 'var(--encre, #F2F0EB)', opacity: entree}}>$100</div>
      {tranches.map((t) => {
        const s = spring({frame: frame - t.a, fps, config: {damping: 22, stiffness: 120}});
        const h = t.montant * echelle * s;
        const y = base - cumul * echelle - h;
        const yLabel = base - (cumul + t.montant / 2) * echelle;
        cumul += t.montant * s;
        const l = spring({frame: frame - t.a - 6, fps, config: {damping: 200}});
        return (
          <div key={t.libelle}>
            <div style={{position: 'absolute', left: 600, top: y, width: 300, height: h, backgroundColor: t.couleur, borderTop: '2px solid #0E1116'}} />
            <div style={{position: 'absolute', left: 960, top: yLabel - 34, opacity: l, transform: `translateX(${interpolate(l, [0, 1], [24, 0])}px)`, display: 'flex', alignItems: 'baseline', gap: 22}}>
              <div style={{fontFamily: theme.type.titre, fontSize: 64, color: 'var(--encre, #F2F0EB)', minWidth: 230}}>${t.montant.toFixed(2)}</div>
              <div style={{fontFamily: theme.type.corps, fontSize: 30, color: 'var(--sourdine, #8A94A0)'}}>{t.libelle}</div>
            </div>
          </div>
        );
      })}
      {/* dépassement de la ligne des 100 $ */}
      {cumul > limite ? (
        <div style={{position: 'absolute', left: 600, top: base - cumul * echelle, width: 300, height: (cumul - limite) * echelle + 2,
          backgroundColor: theme.couleur.segments[2], boxShadow: '0 0 30px rgba(179,70,60,.9)'}} />
      ) : null}
      {total ? (
        <div style={{position: 'absolute', left: 600, top: ligneY - 150, width: 300, textAlign: 'center', fontFamily: theme.type.titre, fontSize: 84,
          color: '#E0685C', opacity: spring({frame: frame - total.a, fps, config: {damping: 200}})}}>
          {total.texte}
        </div>
      ) : null}
      {perte ? (
        <div style={{position: 'absolute', left: 960, top: ligneY - 120, fontFamily: theme.type.corps, fontWeight: 700, fontSize: 40,
          color: '#E0685C', opacity: spring({frame: frame - perte.a, fps, config: {damping: 200}})}}>
          {perte.texte}
        </div>
      ) : null}
      
    </AbsoluteFill>
  );
};
