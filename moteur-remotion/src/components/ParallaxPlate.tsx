import {AbsoluteFill, Img, interpolate, random, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';

/**
 * Parallaxe 2,5D : le décor (sujet retiré, trou rebouché) et le sujet détouré bougent à des vitesses
 * différentes, avec une poussière en suspension au premier plan qui bouge plus vite encore.
 * Calques produits par outils/detourer.swift + outils/calques.py.
 */
export const ParallaxPlate: React.FC<{
  fond: string; sujet: string; mouvement?: 'avant' | 'gauche' | 'droite'; foyer?: [number, number]; force?: number; poussiere?: boolean;
}> = ({fond, sujet, mouvement = 'avant', foyer = [50, 60], force = 1, poussiere = true}) => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();
  const p = interpolate(frame, [0, durationInFrames], [0, 1], {extrapolateRight: 'clamp'});
  // décor : mouvement lent ; sujet : 2,5× plus ample (il est « plus près » de la caméra)
  const couche = (profondeur: number) => {
    if (mouvement === 'avant') return {s: 1.06 + p * 0.05 * profondeur * force, x: 0};
    const sens = mouvement === 'gauche' ? -1 : 1;
    return {s: 1.08, x: sens * (p - 0.5) * 36 * profondeur * force};
  };
  const f = couche(1), sj = couche(2.6);
  const style = (c: {s: number; x: number}): React.CSSProperties => ({
    position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover',
    transform: `translateX(${c.x}px) scale(${c.s})`, transformOrigin: `${foyer[0]}% ${foyer[1]}%`,
  });
  return (
    <AbsoluteFill style={{overflow: 'hidden', backgroundColor: '#000'}}>
      <Img src={staticFile(fond)} style={style(f)} />
      <Img src={staticFile(sujet)} style={{...style(sj), filter: 'drop-shadow(0 18px 30px rgba(0,0,0,.35))'}} />
      {poussiere ? <Poussiere derive={mouvement === 'gauche' ? -1 : 1} /> : null}
    </AbsoluteFill>
  );
};

/** Particules floues au premier plan : c'est elles qui vendent la profondeur. */
const Poussiere: React.FC<{derive: number}> = ({derive}) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{mixBlendMode: 'screen', pointerEvents: 'none'}}>
      {Array.from({length: 26}, (_, i) => {
        const taille = 3 + random(`t${i}`) * 9;
        const x = (random(`x${i}`) * 2100 - 90 + derive * frame * (0.4 + taille * 0.12)) % 2100;
        const y = random(`y${i}`) * 1080 - frame * (0.15 + random(`v${i}`) * 0.35);
        const o = 0.12 + random(`o${i}`) * 0.35;
        return <div key={i} style={{position: 'absolute', left: x, top: ((y % 1080) + 1080) % 1080, width: taille, height: taille,
          borderRadius: '50%', backgroundColor: `rgba(255,236,210,${o})`, filter: `blur(${taille > 8 ? 3 : 1}px)`}} />;
      })}
    </AbsoluteFill>
  );
};
