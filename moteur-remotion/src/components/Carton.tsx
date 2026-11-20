import {AbsoluteFill, Img, interpolate, random, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {polices, Police} from '../design/theme';
import {allumage, lueur} from './Neon';

export type Morceau = {texte: string; a: number};
export type Anim = 'pop' | 'machine' | 'masque' | 'tampon' | 'surligne' | 'glisse' | 'neon';

/**
 * Carton de texte à styles multiples : police, animation et fond changent d'un carton à l'autre
 * (retour du 26/09 : jamais deux fois le même carton). Les couleurs viennent de la palette du plan.
 */
export const Carton: React.FC<{mots: Morceau[]; police?: Police; anim?: Anim; taille?: number; photo?: string; majuscules?: boolean;
  alignement?: 'centre' | 'gauche'}> = ({mots, police = 'anton', anim = 'pop', taille = 140, photo, majuscules, alignement = 'centre'}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const maj = majuscules ?? ['anton', 'bloc', 'tampon', 'affiche', 'neon'].includes(police);
  const gauche = alignement === 'gauche';
  return (
    <AbsoluteFill style={{backgroundColor: 'var(--fond, #0E1116)', justifyContent: 'center', alignItems: gauche ? 'flex-start' : 'center',
      padding: gauche ? '0 150px' : 96, overflow: 'hidden'}}>
      {photo ? <AbsoluteFill><Img src={staticFile(photo)} style={{width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(14px) brightness(.35)',
        transform: 'scale(1.1)'}} /></AbsoluteFill> : null}
      {/* grain de papier léger, pour que les fonds unis ne fassent pas « écran » */}
      <AbsoluteFill style={{opacity: 0.08, backgroundImage: 'radial-gradient(rgba(0,0,0,.6) 1px, transparent 1px)', backgroundSize: '3px 3px'}} />
      <div style={{position: 'relative', display: 'flex', flexWrap: 'wrap', justifyContent: gauche ? 'flex-start' : 'center', gap: `0 ${taille * 0.28}px`,
        maxWidth: 1580, textAlign: gauche ? 'left' : 'center'}}>
        {mots.map((m, i) => {
          const t = frame - m.a;
          const s = spring({frame: t, fps, config: {damping: 16, stiffness: 170}});
          const base: React.CSSProperties = {fontFamily: polices[police], fontSize: taille, lineHeight: 1.08, color: 'var(--encre, #F2F0EB)',
            textTransform: maj ? 'uppercase' : 'none', display: 'inline-block', position: 'relative', letterSpacing: police === 'machine' ? 1 : maj ? 2 : 0};
          if (anim === 'machine') {
            const n = Math.max(0, Math.floor(t * 1.4));
            const vis = m.texte.slice(0, n);
            const curseur = t >= 0 && n < m.texte.length + 6 && Math.floor(frame / 8) % 2 === 0;
            return <span key={i} style={base}>{vis}<span style={{opacity: curseur ? 1 : 0}}>▍</span></span>;
          }
          if (anim === 'neon') {
            const o = allumage(t, `c${i}`);
            return <span key={i} style={{...base, color: o > 0.2 ? '#FFF4FB' : 'rgba(255,255,255,.07)', textShadow: o > 0.2 ? lueur(o) : 'none'}}>{m.texte}</span>;
          }
          if (anim === 'masque') {
            const p = interpolate(t, [0, 12], [100, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
            return <span key={i} style={{...base, clipPath: `inset(0 0 ${p}% 0)`, transform: `translateY(${p * 0.3}px)`}}>{m.texte}</span>;
          }
          if (anim === 'tampon') {
            const c = spring({frame: t, fps, config: {damping: 11, stiffness: 260}});
            const rot = (random(`r${i}`) - 0.5) * 10;
            return (
              <span key={i} style={{...base, color: 'var(--accent, #B3463C)', border: `${taille * 0.06}px solid var(--accent, #B3463C)`, padding: '0.05em 0.3em',
                borderRadius: 10, margin: '0.12em', opacity: t < 0 ? 0 : Math.min(1, c * 1.4), transform: `rotate(${rot}deg) scale(${interpolate(c, [0, 1], [1.8, 1])})`,
                maskImage: 'radial-gradient(circle at 30% 40%, #000 60%, rgba(0,0,0,.75) 100%)'}}>{m.texte}</span>
            );
          }
          if (anim === 'surligne') {
            const p = interpolate(t, [4, 16], [0, 100], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
            return (
              <span key={i} style={{...base, opacity: t < 0 ? 0 : 1}}>
                <span style={{position: 'absolute', left: '-0.08em', bottom: '-0.04em', height: '0.24em', width: `calc(${p}% + 0.16em)`,
                  backgroundColor: 'var(--accent, #D9A441)', opacity: 0.85, zIndex: 0, transform: 'skewX(-8deg)'}} />
                <span style={{position: 'relative'}}>{m.texte}</span>
              </span>
            );
          }
          if (anim === 'glisse') {
            return <span key={i} style={{...base, opacity: interpolate(s, [0, 0.4], [0, 1], {extrapolateRight: 'clamp'}),
              transform: `translateX(${interpolate(s, [0, 1], [-80, 0])}px)`}}>{m.texte}</span>;
          }
          return <span key={i} style={{...base, opacity: interpolate(s, [0, 0.3], [0, 1], {extrapolateRight: 'clamp'}),
            transform: `translateY(${interpolate(s, [0, 1], [40, 0])}px)`}}>{m.texte}</span>;
        })}
      </div>
    </AbsoluteFill>
  );
};
