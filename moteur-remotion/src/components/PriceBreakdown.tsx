import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {theme} from '../design/theme';

export type Segment = {libelle: string; montant: number};

/** Le composant signature : un prix décomposé en segments empilés qui arrivent un par un. */
export const PriceBreakdown: React.FC<{total: number; segments: Segment[]; devise?: string}> = ({
  total, segments, devise = '$',
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const hauteur = 720;
  // Échelle sur la somme réelle des segments : si les postes publiés ne tombent pas pile
  // sur le total (arrondis, produits financiers), la colonne ne déborde jamais du cadre.
  const somme = segments.reduce((a, s) => a + s.montant, 0) || total;
  const h = (m: number) => (m / somme) * hauteur;
  // Un segment minuscule (0,19 $) garde sa vraie hauteur dans la colonne, mais son étiquette
  // reçoit une hauteur plancher : sinon deux étiquettes voisines s'impriment l'une sur l'autre.
  const ETIQUETTE_MIN = 64;
  return (
    <AbsoluteFill
      style={{backgroundColor: 'var(--fond, #0E1116)', flexDirection: 'row', alignItems: 'center',
              justifyContent: 'center', gap: 64, padding: theme.marge}}>
      <div style={{width: 260, height: hauteur, display: 'flex', flexDirection: 'column'}}>
        {segments.map((s, i) => {
          const a = spring({frame: frame - i * 18, fps, config: {damping: 200}});
          return (
            <div
              key={s.libelle}
              style={{
                height: h(s.montant), backgroundColor: theme.couleur.segments[i % 4],
                transform: `scaleY(${a})`, transformOrigin: 'top', opacity: a,
              }}
            />
          );
        })}
      </div>
      <div style={{display: 'flex', flexDirection: 'column', height: hauteur, overflow: 'visible'}}>
        {segments.map((s, i) => {
          const a = spring({frame: frame - i * 18 - 6, fps, config: {damping: 200}});
          return (
            <div
              key={s.libelle}
              style={{
                height: Math.max(h(s.montant), ETIQUETTE_MIN), display: 'flex', alignItems: 'center', gap: 22,
                opacity: a, transform: `translateX(${interpolate(a, [0, 1], [26, 0])}px)`,
              }}>
              <div style={{fontFamily: theme.type.titre, fontSize: 52, color: 'var(--encre, #F2F0EB)', minWidth: 190}}>
                {devise}{s.montant.toFixed(2)}
              </div>
              <div style={{fontFamily: theme.type.corps, fontSize: 30, color: 'var(--sourdine, #8A94A0)'}}>
                {s.libelle}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
