import {geoDistance, geoGraticule10, geoInterpolate, geoOrthographic, geoPath} from 'd3-geo';
import {AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {feature} from 'topojson-client';
import terres from 'world-atlas/land-110m.json';
import {theme} from '../design/theme';

type LonLat = [number, number];
export type Route = {de: LonLat; vers: LonLat; a: number; duree: number; couleur?: string};
export type Etiquette = {pos: LonLat; texte: string; sous: string; a: number; cote?: 'gauche' | 'droite'};
export type Cle = {f: number; lon: number; lat: number; zoom: number};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const TERRE = feature(terres as any, (terres as any).objects.land);
const GRILLE = geoGraticule10();

/** Globe en 3D (projection orthographique) : la caméra tourne d'un point clé à l'autre, les routes se tracent. */
export const Globe: React.FC<{cles: Cle[]; routes: Route[]; etiquettes: Etiquette[]}> = ({cles, routes, etiquettes}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const fs = cles.map((c) => c.f);
  const opt = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic)} as const;
  const lon = interpolate(frame, fs, cles.map((c) => c.lon), opt);
  const lat = interpolate(frame, fs, cles.map((c) => c.lat), opt);
  const zoom = interpolate(frame, fs, cles.map((c) => c.zoom), opt);
  const R = 440 * zoom;
  const proj = geoOrthographic().scale(R).translate([960, 560]).rotate([-lon, -lat]).clipAngle(90);
  const chemin = geoPath(proj);
  const centre: LonLat = [lon, lat];
  return (
    <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 55%, #141a22 0%, #07090c 70%)'}}>
      <svg width={1920} height={1080}>
        <defs>
          <radialGradient id="ocean" cx="45%" cy="40%" r="65%">
            <stop offset="0%" stopColor="#1b2530" />
            <stop offset="100%" stopColor="#0a0e13" />
          </radialGradient>
          <radialGradient id="atmo" cx="50%" cy="50%" r="50%">
            <stop offset="86%" stopColor="rgba(120,170,220,0)" />
            <stop offset="93%" stopColor="rgba(120,170,220,0.22)" />
            <stop offset="100%" stopColor="rgba(120,170,220,0)" />
          </radialGradient>
          <filter id="lueur"><feGaussianBlur stdDeviation="6" /></filter>
        </defs>
        <circle cx={960} cy={560} r={R * 1.08} fill="url(#atmo)" />
        <path d={chemin({type: 'Sphere'}) ?? ''} fill="url(#ocean)" />
        <path d={chemin(GRILLE) ?? ''} fill="none" stroke="rgba(242,240,235,0.06)" strokeWidth={1} />
        <path d={chemin(TERRE) ?? ''} fill="#2b323b" stroke="rgba(242,240,235,0.25)" strokeWidth={0.8} />
        {routes.map((r, i) => {
          const p = interpolate(frame, [r.a, r.a + r.duree], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.quad)});
          if (p <= 0) return null;
          const inter = geoInterpolate(r.de, r.vers);
          const n = Math.max(2, Math.round(80 * p));
          const pts = Array.from({length: n + 1}, (_, k) => inter((k / n) * p));
          const ligne = chemin({type: 'LineString', coordinates: pts}) ?? '';
          const tete = proj(pts[pts.length - 1]);
          const visible = geoDistance(pts[pts.length - 1], centre) < Math.PI / 2;
          const c = r.couleur ?? 'var(--accent, #D9A441)';
          return (
            <g key={i}>
              <path d={ligne} fill="none" style={{stroke: c}} strokeWidth={7} opacity={0.5} filter="url(#lueur)" />
              <path d={ligne} fill="none" style={{stroke: c}} strokeWidth={3} strokeLinecap="round" />
              {tete && visible && p < 1 ? <circle cx={tete[0]} cy={tete[1]} r={7} fill="#fff" /> : null}
            </g>
          );
        })}
      </svg>
      {etiquettes.map((e) => {
        const xy = proj(e.pos);
        if (!xy || geoDistance(e.pos, centre) > Math.PI / 2 - 0.15) return null;
        const s = spring({frame: frame - e.a, fps, config: {damping: 16, stiffness: 150}});
        if (frame < e.a) return null;
        const gauche = e.cote === 'gauche';
        return (
          <div key={e.texte} style={{position: 'absolute', left: xy[0], top: xy[1], transform: `translate(${gauche ? '-100%' : '0'}, -50%)`,
            display: 'flex', alignItems: 'center', flexDirection: gauche ? 'row-reverse' : 'row', gap: 14}}>
            <div style={{width: 18, height: 18, borderRadius: 9, backgroundColor: 'var(--accent, #D9A441)', boxShadow: '0 0 20px rgba(217,164,65,.9)',
              transform: `scale(${s})`}} />
            <div style={{width: 40 * s, height: 2, backgroundColor: 'var(--accent, #D9A441)'}} />
            <div style={{opacity: s, transform: `translateY(${interpolate(s, [0, 1], [10, 0])}px)`, textAlign: gauche ? 'right' : 'left'}}>
              <div style={{fontFamily: theme.type.titre, fontSize: 64, color: 'var(--encre, #F2F0EB)', lineHeight: 1, textShadow: '0 4px 20px rgba(0,0,0,.8)'}}>{e.texte}</div>
              <div style={{fontFamily: theme.type.corps, fontSize: 24, color: 'var(--sourdine, #8A94A0)', textShadow: '0 2px 10px rgba(0,0,0,.9)'}}>{e.sous}</div>
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
