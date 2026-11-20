import {geoCentroid, geoMercator, geoNaturalEarth1, geoPath} from 'd3-geo';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {feature} from 'topojson-client';
import pays from 'world-atlas/countries-50m.json';
import {theme} from '../design/theme';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const PAYS = (feature(pays as any, (pays as any).objects.countries) as any).features as any[];
export type Pays = {id: string; libelle: string; valeur?: string; a: number; decal?: [number, number]};
export type Point = {lonlat: [number, number]; libelle: string; a: number; decal?: [number, number]};

/**
 * Carte 2D : cadrée sur une zone (bbox [ouest, sud, est, nord]), les pays s'allument un par un
 * (codes ISO numériques de world-atlas), avec leur étiquette et une valeur éventuelle.
 */
export const MapCountries: React.FC<{
  zone: [number, number, number, number]; pays: Pays[]; points?: Point[]; titre?: string; source?: string; projection?: 'mercator' | 'monde';
}> = ({zone, pays: allumes, points = [], titre, source, projection = 'mercator'}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  // Cadrage par une grille de points, jamais par un rectangle : un polygone tracé dans le mauvais sens
  // est compris par d3 comme « toute la Terre sauf ce rectangle » (carte du monde minuscule, vu au contrôle).
  const cadre = {type: 'MultiPoint', coordinates: [0, 0.5, 1].flatMap((u) => [0, 0.5, 1].map((v) =>
    [zone[0] + (zone[2] - zone[0]) * u, zone[1] + (zone[3] - zone[1]) * v]))};
  const proj = (projection === 'monde' ? geoNaturalEarth1() : geoMercator()).fitExtent([[140, 130], [1780, 980]], cadre as never);
  const chemin = geoPath(proj);
  const zoom = interpolate(frame, [0, 300], [1, 1.05], {extrapolateRight: 'clamp'});
  const entree = spring({frame, fps, config: {damping: 200}});
  return (
    <AbsoluteFill style={{backgroundColor: '#0b0e13', overflow: 'hidden'}}>
      <svg width={1920} height={1080} style={{transform: `scale(${zoom})`, opacity: entree}}>
        {PAYS.map((f) => {
          const cible = allumes.find((p) => p.id === f.id);
          const s = cible ? spring({frame: frame - cible.a, fps, config: {damping: 200}}) : 0;
          return <path key={f.id} d={chemin(f) ?? ''} strokeWidth={s > 0.01 ? 1.6 : 0.6} style={{
            fill: s > 0.01 ? `color-mix(in srgb, var(--accent, #D9A441) ${Math.round((0.25 + 0.6 * s) * 100)}%, transparent)` : 'var(--terre, #232a33)',
            stroke: s > 0.01 ? 'var(--accent, #D9A441)' : 'rgba(242,240,235,0.18)'}} />;
        })}
        {points.map((p) => {
          const xy = proj(p.lonlat); if (!xy) return null;
          const s = spring({frame: frame - p.a, fps, config: {damping: 12, stiffness: 160}});
          const pulse = ((frame - p.a) % 40) / 40;
          return frame < p.a ? null : (
            <g key={p.libelle}>
              <circle cx={xy[0]} cy={xy[1]} r={10 + pulse * 34} fill="none" style={{stroke: 'var(--accent, #D9A441)'}} strokeWidth={3} opacity={1 - pulse} />
              <circle cx={xy[0]} cy={xy[1]} r={11 * s} style={{fill: 'var(--accent, #D9A441)'}} />
            </g>
          );
        })}
      </svg>
      {[...allumes.map((p) => {
        const f = PAYS.find((x) => x.id === p.id); const xy = f ? proj(geoCentroid(f)) : null;
        return xy ? {x: xy[0] + (p.decal?.[0] ?? 0), y: xy[1] + (p.decal?.[1] ?? 0), libelle: p.libelle, valeur: p.valeur, a: p.a} : null;
      }), ...points.map((p) => {
        const xy = proj(p.lonlat);
        return xy ? {x: xy[0] + (p.decal?.[0] ?? 24), y: xy[1] + (p.decal?.[1] ?? 0), libelle: p.libelle, valeur: undefined, a: p.a} : null;
      })].filter(Boolean).map((e) => {
        const s = spring({frame: frame - e!.a - 4, fps, config: {damping: 200}});
        return frame < e!.a ? null : (
          <div key={e!.libelle} style={{position: 'absolute', left: e!.x, top: e!.y, transform: `translate(-50%, -50%) translateY(${(1 - s) * 12}px)`,
            opacity: s, textAlign: 'center', textShadow: '0 2px 12px rgba(0,0,0,.95)'}}>
            <div style={{fontFamily: theme.type.corps, fontWeight: 700, fontSize: 30, color: 'var(--encre, #F2F0EB)', letterSpacing: 2, textTransform: 'uppercase'}}>{e!.libelle}</div>
            {e!.valeur ? <div style={{fontFamily: theme.type.titre, fontSize: 64, color: 'var(--accent, #D9A441)', lineHeight: 1.05}}>{e!.valeur}</div> : null}
          </div>
        );
      })}
      {titre ? <div style={{position: 'absolute', left: theme.marge, top: theme.marge * 0.8, fontFamily: theme.type.corps, fontWeight: 700,
        fontSize: 24, letterSpacing: 4, color: 'var(--accent, #D9A441)', textTransform: 'uppercase', opacity: entree}}>{titre}</div> : null}
      {null}
    </AbsoluteFill>
  );
};
