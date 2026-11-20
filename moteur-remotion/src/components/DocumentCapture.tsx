import {evolvePath} from '@remotion/paths';
import {AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {theme} from '../design/theme';

export type Ligne = {y: number; h: number};   // en fraction de la hauteur de la capture
export type Etape = {a: number; ligne: number | null; zoom: number; x?: number};
export type Cercle = {a: number; cx: number; cy: number; rx: number; ry: number};   // en pixels de la capture

/** Ellipse « à main levée » : un peu plus d'un tour, rayon qui respire, fin qui dépasse le départ. */
const ellipseMain = ({cx, cy, rx, ry}: Cercle) => {
  const pts: string[] = [];
  for (let k = 0; k <= 60; k++) {
    const t = -0.4 + (k / 60) * (Math.PI * 2 + 0.7);
    const r = 1 + Math.sin(t * 3) * 0.04 + (k / 60) * 0.06;
    pts.push(`${(cx + Math.cos(t) * rx * r).toFixed(1)},${(cy + Math.sin(t) * ry * r).toFixed(1)}`);
  }
  return 'M' + pts.join(' L');
};

/**
 * La VRAIE capture d'un document (jamais une recomposition), posée comme une feuille. La caméra
 * glisse de ligne en ligne ; la ligne citée par la voix est surlignée au moment où elle est dite.
 */
export const DocumentCapture: React.FC<{
  src: string; ratio: number; lignes: Ligne[]; etapes: Etape[]; source: string; cercle?: Cercle; largeurSrc?: number;
}> = ({src, ratio, lignes, etapes, source, cercle, largeurSrc = 2280}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const largeur = 1640;
  const hauteur = largeur / ratio;
  // interpolation de caméra : chaque étape part de la précédente avec un ressort
  let zoom = etapes[0].zoom, cy = etapes[0].ligne === null ? 0.5 : lignes[etapes[0].ligne].y, cx = etapes[0].x ?? 0.5;
  for (let i = 1; i < etapes.length; i++) {
    const e = etapes[i];
    const s = spring({frame: frame - e.a, fps, config: {damping: 200, mass: 1.4}});
    zoom += (e.zoom - zoom) * s;
    cy += ((e.ligne === null ? 0.5 : lignes[e.ligne].y) - cy) * s;
    cx += ((e.x ?? 0.5) - cx) * s;
  }
  const derive = interpolate(frame, [0, 600], [0, 0.03]);   // la feuille ne s'arrête jamais tout à fait
  const z = zoom + derive;
  const tx = (0.5 - cx) * largeur * z;
  const ty = (0.5 - cy) * hauteur * z;
  const active = [...etapes].reverse().find((e) => frame >= e.a && e.ligne !== null);
  const balayage = active ? interpolate(frame, [active.a, active.a + 14], [0, 100], {extrapolateRight: 'clamp'}) : 0;
  const l = active && active.ligne !== null ? lignes[active.ligne] : null;
  const apparition = spring({frame, fps, config: {damping: 200}});
  const bascule = interpolate(spring({frame, fps, config: {damping: 200, mass: 1.6}}), [0, 1], [24, 0]);
  const trace = cercle ? interpolate(frame, [cercle.a, cercle.a + 16], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}) : 0;
  const d = cercle ? ellipseMain(cercle) : '';
  const ev = cercle ? evolvePath(trace, d) : null;
  return (
    <AbsoluteFill style={{backgroundColor: '#1a1d22', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', perspective: 1800}}>
      <div style={{width: largeur, height: hauteur, position: 'relative', backgroundColor: '#fff',
        boxShadow: '0 40px 120px rgba(0,0,0,.7)', opacity: apparition,
        transform: `translate(${tx}px, ${ty}px) rotateX(${bascule}deg) scale(${z}) rotate(-0.4deg)`}}>
        <Img src={staticFile(src)} style={{width: '100%', height: '100%', display: 'block'}} />
        {l ? (
          <div style={{position: 'absolute', left: '1%', top: `${(l.y - l.h / 2) * 100}%`, height: `${l.h * 100}%`,
            width: `${balayage * 0.98}%`, backgroundColor: 'rgba(217,164,65,0.55)', mixBlendMode: 'multiply'}} />
        ) : null}
        {cercle && ev ? (
          <svg viewBox={`0 0 ${largeurSrc} ${largeurSrc / ratio}`} style={{position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible'}}>
            <path d={d} fill="none" stroke="#C8322B" strokeWidth={7} strokeLinecap="round" strokeDasharray={ev.strokeDasharray}
              strokeDashoffset={ev.strokeDashoffset} style={{filter: 'drop-shadow(0 1px 1px rgba(0,0,0,.3))'}} />
          </svg>
        ) : null}
      </div>
      
    </AbsoluteFill>
  );
};
