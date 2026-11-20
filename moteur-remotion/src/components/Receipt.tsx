import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {theme} from '../design/theme';

export type LigneTicket = {libelle: string; montant?: string; a: number; style?: 'normal' | 'sous-total' | 'total' | 'rouge' | 'note'};

/**
 * Le ticket de caisse ITEMIZED : un reçu thermique qui sort de l'imprimante ligne par ligne,
 * chaque ligne à l'image où la voix la prononce. C'est la signature visuelle de la chaîne.
 */
export const Receipt: React.FC<{titre: string; sous?: string; lignes: LigneTicket[]; source?: string}> = ({titre, sous, lignes, source}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const HL = 74;
  const visibles = lignes.filter((l) => frame >= l.a).length;
  const papier = 250 + lignes.length * HL;
  // le ticket « sort » : il descend d'une hauteur de ligne à chaque impression
  const sortie = lignes.reduce((acc, l) => acc + spring({frame: frame - l.a, fps, config: {damping: 30, stiffness: 160}}) * HL, 0);
  const entree = spring({frame, fps, config: {damping: 200}});
  const y = interpolate(entree, [0, 1], [-papier, -papier + 250]) + sortie;
  const camera = interpolate(frame, [0, 400], [1.3, 1.38], {extrapolateRight: 'clamp'});   // ticket lisible sur téléphone
  return (
    <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 30%, #1f252d 0%, #0b0d11 75%)', overflow: 'hidden'}}>
      {/* fente de l'imprimante */}
      <div style={{position: 'absolute', left: 560, width: 800, top: 70, height: 26, borderRadius: 13, backgroundColor: '#050608',
        boxShadow: '0 2px 0 rgba(255,255,255,.06)', zIndex: 2}} />
      <div style={{position: 'absolute', left: 610, width: 700, top: 84, height: 900, overflow: 'hidden', transform: `scale(${camera})`,
        transformOrigin: '50% 0%'}}>
        <div style={{position: 'absolute', left: 0, right: 0, top: y, height: papier, backgroundColor: '#F4F1EA',
          boxShadow: '0 30px 60px rgba(0,0,0,.5)', padding: '40px 46px', fontFamily: theme.type.mono, color: '#1b1d21',
          clipPath: 'polygon(0 0,100% 0,100% calc(100% - 14px),97% 100%,94% calc(100% - 14px),91% 100%,88% calc(100% - 14px),85% 100%,82% calc(100% - 14px),79% 100%,76% calc(100% - 14px),73% 100%,70% calc(100% - 14px),67% 100%,64% calc(100% - 14px),61% 100%,58% calc(100% - 14px),55% 100%,52% calc(100% - 14px),49% 100%,46% calc(100% - 14px),43% 100%,40% calc(100% - 14px),37% 100%,34% calc(100% - 14px),31% 100%,28% calc(100% - 14px),25% 100%,22% calc(100% - 14px),19% 100%,16% calc(100% - 14px),13% 100%,10% calc(100% - 14px),7% 100%,4% calc(100% - 14px),0 100%)'}}>
          <div style={{textAlign: 'center', fontWeight: 700, fontSize: 30, letterSpacing: 6}}>{titre}</div>
          {sous ? <div style={{textAlign: 'center', fontSize: 20, marginTop: 8, opacity: 0.7}}>{sous}</div> : null}
          <div style={{borderTop: '3px dashed #1b1d21', margin: '26px 0 10px'}} />
          {lignes.slice(0, visibles).map((l, i) => {
            const s = spring({frame: frame - l.a, fps, config: {damping: 200}});
            const total = l.style === 'total' || l.style === 'sous-total';
            const couleur = l.style === 'rouge' ? '#B3463C' : '#1b1d21';
            return (
              <div key={i} style={{height: HL, display: 'flex', alignItems: 'center', justifyContent: 'space-between', opacity: s,
                borderTop: total ? '3px solid #1b1d21' : undefined, borderBottom: l.style === 'total' ? '7px double #1b1d21' : undefined,
                fontSize: l.style === 'note' ? 20 : total ? 32 : 28, fontWeight: total || l.style === 'rouge' ? 700 : 400, color: couleur}}>
                <span style={{maxWidth: 440}}>{l.libelle}</span>
                {l.montant ? <span style={{fontVariantNumeric: 'tabular-nums'}}>{l.montant}</span> : null}
              </div>
            );
          })}
        </div>
      </div>
      {null}
    </AbsoluteFill>
  );
};
