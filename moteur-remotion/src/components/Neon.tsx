import {noise2D} from '@remotion/noise';
import {AbsoluteFill, interpolate} from 'remotion';
import {useCurrentFrame} from 'remotion';
import {polices, Police} from '../design/theme';

/** Allumage d'un tube néon : quelques ratés irréguliers, puis stable avec un léger bourdonnement. */
export const allumage = (t: number, graine: string): number => {
  if (t < 0) return 0;
  const rates = [1, 0, 0, 1, 0.3, 1, 0, 1, 1, 0.5, 1];
  if (t < rates.length) return rates[Math.floor(t)];
  return 0.92 + 0.08 * noise2D(graine, t * 0.25, 0);
};

export const lueur = (o: number) =>
  `0 0 ${6 * o}px #fff, 0 0 ${18 * o}px var(--accent, #FF2E88), 0 0 ${42 * o}px var(--accent, #FF2E88), 0 0 ${90 * o}px var(--accent, #FF2E88)`;

/**
 * Enseigne néon plein cadre, sur un mur sombre : chaque ligne s'allume quand la voix la prononce.
 * Remplace le carton-titre de la vidéo 1.
 */
export const Neon: React.FC<{lignes: {texte: string; a: number; police?: Police; taille?: number}[]; sous?: {texte: string; a: number}}> = ({lignes, sous}) => {
  const frame = useCurrentFrame();
  const halo = Math.max(0, ...lignes.map((l, i) => allumage(frame - l.a, `n${i}`)));
  const derive = interpolate(frame, [0, 300], [1.0, 1.04], {extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill style={{backgroundColor: 'var(--fond, #0B0714)', justifyContent: 'center', alignItems: 'center', overflow: 'hidden'}}>
      {/* mur de briques sombre, éclairé par l'enseigne */}
      <AbsoluteFill style={{opacity: 0.35, backgroundImage:
        'linear-gradient(rgba(0,0,0,.55) 2px, transparent 2px), linear-gradient(90deg, rgba(0,0,0,.55) 2px, transparent 2px)',
        backgroundSize: '120px 52px, 120px 104px', backgroundPosition: '0 0, 60px 52px'}} />
      <AbsoluteFill style={{background: `radial-gradient(ellipse 55% 45% at 50% 50%, color-mix(in srgb, var(--accent, #FF2E88) ${Math.round(30 * halo)}%, transparent) 0%, transparent 75%)`}} />
      <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, transform: `scale(${derive})`}}>
        {lignes.map((l, i) => {
          const o = allumage(frame - l.a, `n${i}`);
          const police = l.police ?? 'neon';
          return (
            <div key={i} style={{fontFamily: polices[police], fontSize: l.taille ?? (police === 'neon' ? 150 : 190), lineHeight: 1.1, textAlign: 'center',
              color: o > 0.2 ? '#FFF4FB' : 'rgba(255,255,255,.08)', textShadow: o > 0.2 ? lueur(o) : 'none', letterSpacing: police === 'neon' ? 4 : 6,
              textTransform: 'uppercase', maxWidth: 1700}}>{l.texte}</div>
          );
        })}
        {sous ? (
          <div style={{marginTop: 26, fontFamily: polices.spacemono, fontSize: 32, letterSpacing: 10, color: 'var(--encre, #F4EEFF)',
            opacity: interpolate(frame - sous.a, [0, 12], [0, 0.85], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}}>{sous.texte}</div>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};
