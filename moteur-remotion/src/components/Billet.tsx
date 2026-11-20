import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {polices} from '../design/theme';
import {Odometre} from './Odometre';

export type LigneBillet = {libelle: string; montant?: string; valeur?: number; a: number; style?: 'normal' | 'frais' | 'revente' | 'note' | 'barre'};

/**
 * Le billet de concert qui se charge : prix facial, puis chaque couche (frais, revente) s'imprime
 * dessous comme un tampon, et le talon de droite recompte le total à chaque ajout.
 * Pendant de Receipt (vidéo 1) : même rôle, autre objet, pour que deux vidéos ne se ressemblent pas.
 */
export const Billet: React.FC<{titre: string; sous?: string; lignes: LigneBillet[]; prefixe?: string; libelleTotal?: string; totalA?: number; talon?: string}> = ({
  titre, sous, lignes, prefixe = '$', libelleTotal = 'YOU PAY', totalA = 0, talon,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const entree = spring({frame, fps, config: {damping: 18, stiffness: 90}});
  const visibles = lignes.filter((l) => frame >= l.a);
  const total = visibles.reduce((s, l) => s + (l.valeur ?? 0), 0);
  const avecValeur = visibles.filter((l) => l.valeur);
  const dernier = avecValeur.length ? Math.max(totalA, ...avecValeur.map((l) => l.a)) : totalA;
  const camera = interpolate(frame, [0, 360], [1, 1.05], {extrapolateRight: 'clamp'});
  const encre = '#1A1024';
  return (
    <AbsoluteFill style={{backgroundColor: 'var(--fond, #0B0714)', justifyContent: 'center', alignItems: 'center', overflow: 'hidden'}}>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse 60% 55% at 50% 42%, color-mix(in srgb, var(--accent, #FF2E88) 22%, transparent) 0%, transparent 70%)'}} />
      <div style={{transform: `translateY(${interpolate(entree, [0, 1], [700, 0])}px) rotate(${interpolate(entree, [0, 1], [-9, -2.5])}deg) scale(${camera})`,
        display: 'flex', filter: 'drop-shadow(0 40px 60px rgba(0,0,0,.55))'}}>
        {/* corps du billet */}
        <div style={{width: 1060, minHeight: 560, backgroundColor: '#F3E9D2', borderRadius: '18px 0 0 18px', color: encre, position: 'relative',
          backgroundImage: 'repeating-linear-gradient(90deg, rgba(26,16,36,.035) 0 2px, transparent 2px 9px)'}}>
          <div style={{backgroundColor: 'var(--accent, #FF2E88)', padding: '18px 44px', borderRadius: '18px 0 0 0', display: 'flex',
            justifyContent: 'space-between', alignItems: 'baseline'}}>
            <span style={{fontFamily: polices.affiche, fontSize: 86, lineHeight: 1, color: '#F3E9D2', letterSpacing: 3}}>{titre}</span>
            <span style={{fontFamily: polices.spacemono, fontSize: 22, color: '#F3E9D2', letterSpacing: 6}}>ADMIT ONE</span>
          </div>
          {sous ? <div style={{fontFamily: polices.spacemono, fontSize: 22, padding: '14px 44px 0', opacity: 0.7, letterSpacing: 2}}>{sous}</div> : null}
          <div style={{padding: '10px 44px 34px'}}>
            {lignes.map((l, i) => {
              const t = frame - l.a;
              if (t < 0) return null;
              const c = spring({frame: t, fps, config: {damping: 12, stiffness: 230}});
              const couleur = l.style === 'frais' ? 'var(--accent, #FF2E88)' : l.style === 'revente' ? '#D7263D' : encre;
              const barre = l.style === 'barre' ? interpolate(t, [8, 20], [0, 100], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}) : 0;
              return (
                <div key={i} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px dashed rgba(26,16,36,.25)',
                  padding: l.style === 'note' ? '8px 0' : '14px 0', fontFamily: polices.spacemono, fontSize: l.style === 'note' ? 24 : 38,
                  fontWeight: l.style === 'note' ? 400 : 700, color: couleur, opacity: Math.min(1, c * 1.5), position: 'relative',
                  transform: `scale(${interpolate(c, [0, 1], [1.25, 1])})`, transformOrigin: '0% 50%'}}>
                  <span>{l.style === 'frais' || l.style === 'revente' ? '+ ' : ''}{l.libelle}</span>
                  {l.montant ? <span style={{fontVariantNumeric: 'tabular-nums'}}>{l.montant}</span> : null}
                  {barre > 0 ? <div style={{position: 'absolute', left: 0, top: '52%', height: 5, width: `${barre}%`, backgroundColor: '#D7263D'}} /> : null}
                </div>
              );
            })}
          </div>
          {/* encoches de la perforation */}
          <div style={{position: 'absolute', right: -22, top: -22, width: 44, height: 44, borderRadius: 22, backgroundColor: 'var(--fond, #0B0714)'}} />
          <div style={{position: 'absolute', right: -22, bottom: -22, width: 44, height: 44, borderRadius: 22, backgroundColor: 'var(--fond, #0B0714)'}} />
        </div>
        {/* talon */}
        <div style={{width: 330, backgroundColor: '#EADDBF', borderRadius: '0 18px 18px 0', borderLeft: '5px dotted rgba(26,16,36,.45)', color: encre,
          display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 10}}>
          <div style={{fontFamily: polices.spacemono, fontSize: 22, letterSpacing: 6, opacity: 0.7}}>{libelleTotal}</div>
          {talon ? <div style={{fontFamily: polices.affiche, fontSize: Math.min(120, 280 / (0.42 * talon.length)), lineHeight: 0.95, textAlign: 'center',
            color: 'var(--accent, #FF2E88)', whiteSpace: 'nowrap', transform: 'rotate(-4deg)'}}>{talon}</div> : <Odometre key={visibles.length} delai={dernier} texte={prefixe + (Number.isInteger(total) ? total.toString() : total.toFixed(2))}
            style={{fontFamily: polices.affiche, fontSize: 118, color: encre}} />}
        </div>
      </div>
    </AbsoluteFill>
  );
};
