import {AbsoluteFill, Easing, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {geoGraticule10, geoMercator, geoOrthographic, geoPath} from 'd3-geo';
import {feature} from 'topojson-client';
import pays10 from 'world-atlas/countries-10m.json';
import {polices} from '../design/theme';

/** « Born In » (TikTok 9:16) : un pays par épisode, plan construit par usine/chaines/bornin/outils/construire.py. */
type Ev = {t: number; k: string; texte?: string; y: number; c?: string; de?: number; a?: number; prefixe?: string; suffixe?: string; duree?: number};
type Plan = {a: number; b: number; type: string; img?: string; cible?: [number, number]; total?: number; rouges?: number;
  rougeA?: number; finA?: number; icones?: boolean; fond?: string; pays?: string; label?: string; zoom?: number; legende?: string; ev: Ev[]};
export type EpisodeBornIn = {id: string; fps: number; frames: number; dureeVoix: number; plans: Plan[]; mots: {m: string; a: number; b: number}[]};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const PAYS = ((feature(pays10 as any, (pays10 as any).objects.countries) as any).features as any[])
  // Le polygone des Maldives est mal orienté dans countries-10m : en orthographique il recouvre toute la sphère.
  .filter((f) => f.properties?.name !== 'Maldives');
const ROUGE = '#E3122C', OR = '#FFC83D', NUIT = '#0B1B33';
const XF = 0.25;
const cl = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const contour = (w: number): React.CSSProperties => ({WebkitTextStroke: `${w}px #000`, paintOrder: 'stroke fill',
  textShadow: '0 8px 0 rgba(0,0,0,.85), 0 0 30px rgba(0,0,0,.5)'});

const usePop = (t: number, t0: number, raide = 180) => {
  const {fps} = useVideoConfig();
  return spring({frame: Math.round((t - t0) * fps), fps, config: {damping: 13, stiffness: raide}});
};

const Evenement: React.FC<{e: Ev; t: number}> = ({e, t}) => {
  const p = usePop(t, e.t);
  if (t < e.t) return null;
  const base: React.CSSProperties = {position: 'absolute', left: 50, right: 50, top: e.y, transform: 'translateY(-50%)',
    textAlign: 'center', fontFamily: polices.anton, textTransform: 'uppercase', lineHeight: 1.05};
  const c = e.c ?? '#fff';
  const len = (e.texte ?? '').length;
  switch (e.k) {
    case 'titre':
      return <div style={{...base, fontSize: Math.min(124, 1900 / Math.max(len, 1)), color: '#fff', ...contour(10)}}>{e.texte}</div>;
    case 'carton':
      // texte long : on passe sur deux lignes plutôt que de descendre sous 76 px (illisible sur téléphone)
      return <div style={{...base, fontSize: Math.min(108, Math.max(76, 1750 / Math.max(len, 1))), color: c, ...contour(9),
        transform: `translateY(-50%) scale(${0.6 + 0.4 * p})`, opacity: Math.min(1, p * 2)}}>{e.texte}</div>;
    case 'pastille':
      return <div style={{...base, transform: `translateY(-50%) scale(${p})`}}>
        <span style={{background: c, color: '#000', fontSize: Math.min(58, 1500 / Math.max(len, 1)), padding: '10px 34px', borderRadius: 60,
          boxShadow: '0 10px 0 rgba(0,0,0,.6)', display: 'inline-block'}}>{e.texte}</span></div>;
    case 'legende':
      return <div style={{...base, opacity: Math.min(1, p * 2)}}>
        <span style={{background: 'rgba(0,0,0,.6)', color: '#fff', fontSize: 46, padding: '8px 26px', borderRadius: 14}}>{e.texte}</span></div>;
    case 'tampon': {
      const s = interpolate(t - e.t, [0, 0.18], [2.3, 1], {...cl, easing: Easing.out(Easing.back(2))});
      return <div style={{...base, transform: `translateY(-50%) rotate(-6deg) scale(${s})`, opacity: interpolate(t - e.t, [0, 0.08], [0, 1], cl)}}>
        <span style={{fontFamily: polices.tampon, color: c, background: 'rgba(255,255,255,.93)', border: `9px solid ${c}`, borderRadius: 18,
          padding: '6px 30px', fontSize: Math.min(92, 1500 / Math.max(len, 1)), display: 'inline-block', boxShadow: '0 12px 0 rgba(0,0,0,.45)'}}>{e.texte}</span></div>;
    }
    case 'compteur': {
      const v = interpolate(t - e.t, [0, e.duree ?? 1.2], [e.de ?? 0, e.a ?? 0], {...cl, easing: Easing.out(Easing.cubic)});
      return <div style={{...base, fontSize: 168, color: c, ...contour(11), transform: `translateY(-50%) scale(${0.7 + 0.3 * p})`}}>
        {(e.prefixe ?? '') + Math.round(v).toLocaleString('en-US')}
        {e.suffixe ? <span style={{fontSize: 84}}>{e.suffixe}</span> : null}</div>;
    }
    case 'geant':
      return <div style={{...base, fontSize: 460, color: c, ...contour(16), transform: `translateY(-50%) scale(${p})`}}>{e.texte}</div>;
    case 'francais': {
      const cols = ['#2E6BFF', '#2E6BFF', '#FFFFFF', '#FFFFFF', ROUGE, ROUGE];
      return <div style={{...base, fontSize: 250, transform: `translateY(-50%) scale(${0.5 + 0.5 * p})`}}>
        {(e.texte ?? '').split('').map((l, i) => <span key={i} style={{color: cols[i % 6], ...contour(12)}}>{l}</span>)}</div>;
    }
    case 'barres': {
      const g = interpolate(t - e.t, [0, 0.9], [0, 1], {...cl, easing: Easing.out(Easing.cubic)});
      const ligne = (lib: string, v: number, coul: string, d: number) => {
        const gg = interpolate(t - e.t - d, [0, 0.9], [0, 1], {...cl, easing: Easing.out(Easing.cubic)});
        return <div style={{display: 'flex', alignItems: 'center', margin: '18px 0'}}>
          <div style={{width: 300, textAlign: 'right', paddingRight: 24, fontSize: 52, color: '#fff', ...contour(6)}}>{lib}</div>
          <div style={{height: 70, width: 620 * (v / 65493) * gg, background: coul, borderRadius: 12, boxShadow: '0 8px 0 rgba(0,0,0,.5)'}} />
          <div style={{paddingLeft: 18, fontSize: 56, color: coul, ...contour(6)}}>{Math.round(v * gg).toLocaleString('en-US')}</div>
        </div>;
      };
      return <div style={{...base, textAlign: 'left', left: 20, opacity: g}}>{ligne('JOBS', 65493, OR, 0)}{ligne('RESIDENTS', 38857, '#fff', 0.35)}</div>;
    }
    default:
      return null;
  }
};

const Bonhomme: React.FC<{x: number; y: number; s: number; c: string; sc: number}> = ({x, y, s, c, sc}) => (
  <g transform={`translate(${x},${y}) scale(${s * sc})`} stroke={c} strokeWidth={7} strokeLinecap="round" fill="none">
    <circle cx={0} cy={-34} r={15} fill={c} />
    <line x1={0} y1={-18} x2={0} y2={16} /><line x1={-18} y1={-4} x2={18} y2={-4} />
    <line x1={0} y1={16} x2={-14} y2={42} /><line x1={0} y1={16} x2={14} y2={42} />
  </g>
);

const Globe: React.FC<{p: Plan; t: number}> = ({p, t}) => {
  const [lon1, lat1] = p.cible ?? [0, 0];
  const e = {...cl, easing: Easing.inOut(Easing.cubic)};
  const lon = interpolate(t, [0, 2.3], [-25, lon1], e);
  const lat = interpolate(t, [0, 2.3], [22, lat1], e);
  const z = Math.exp(interpolate(t, [0.25, 2.9], [0, Math.log(p.zoom ?? 650)], e));
  const cible = p.pays ?? 'Monaco';
  // le pays visé est dessiné en dernier, pour qu'aucun voisin ne le recouvre
  const ordre = [...PAYS.filter((f) => f.properties?.name !== cible), ...PAYS.filter((f) => f.properties?.name === cible)];
  const proj = geoOrthographic().scale(390 * z).translate([540, 900]).rotate([-lon, -lat]).clipAngle(90);
  const chemin = geoPath(proj);
  const centre = proj([lon1, lat1]) ?? [540, 900];
  const lab = interpolate(t, [2.2, 2.6], [0, 1], cl);
  return (
    <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 47%, #16335c 0%, #071226 75%)'}}>
      <svg width={1080} height={1920}>
        <path d={chemin({type: 'Sphere'}) ?? ''} fill="#0d2748" />
        {z < 30 ? <path d={chemin(geoGraticule10()) ?? ''} fill="none" stroke="rgba(255,255,255,.07)" /> : null}
        {ordre.map((f, i) => <path key={i} d={chemin(f) ?? ''} fill={f.properties?.name === cible ? ROUGE : '#2a3f5f'}
          stroke="rgba(255,255,255,.35)" strokeWidth={1.2} />)}
        <circle cx={centre[0]} cy={centre[1]} r={30 + 60 * ((t * 1.2) % 1)} fill="none" stroke={ROUGE} strokeWidth={6}
          opacity={(1 - ((t * 1.2) % 1)) * (z < 200 ? 1 : 0)} />
      </svg>
      <div style={{position: 'absolute', left: 0, right: 0, top: 1150, textAlign: 'center', fontFamily: polices.anton, fontSize: 96,
        color: '#fff', opacity: lab, ...contour(8)}}>{p.label ?? 'MONACO'}</div>
    </AbsoluteFill>
  );
};

const Grille: React.FC<{p: Plan; t: number}> = ({p, t}) => {
  const n = p.total ?? 39, cols = 7;
  return (
    <AbsoluteFill style={{background: `radial-gradient(ellipse at 50% 45%, #15305a 0%, ${NUIT} 75%)`}}>
      <svg width={1080} height={1920}>
        {Array.from({length: n}, (_, i) => {
          const x = 540 + ((i % cols) - (cols - 1) / 2) * 128, y = 545 + Math.floor(i / cols) * 106;
          const sc = interpolate(t - p.a - 0.4 - i * 0.025, [0, 0.25], [0, 1], {...cl, easing: Easing.out(Easing.back(2))});
          const rouge = i < (p.rouges ?? 0) && t >= (p.rougeA ?? 1e9) + i * 0.05;
          return <Bonhomme key={i} x={x} y={y} s={1.0} sc={sc} c={rouge ? ROUGE : '#E8EEF8'} />;
        })}
      </svg>
    </AbsoluteFill>
  );
};

const Taille: React.FC<{p: Plan; t: number}> = ({p, t}) => {
  const mon = PAYS.find((f) => f.properties?.name === 'Monaco');
  // Le polygone Natural Earth de Monaco est grossier et trop grand : on le ramène à sa vraie surface (2,08 km²).
  const proj0 = geoMercator().center([7.4246, 43.7384]).scale(105 * 6371 * Math.cos((43.74 * Math.PI) / 180)).translate([0, 0]);
  const k = Math.sqrt((2.08 * 105 * 105) / geoPath(proj0).area(mon));
  const [cx, cy] = geoPath(proj0).centroid(mon);
  const proj = geoMercator().center([7.4246, 43.7384]).scale(105 * 6371 * Math.cos((43.74 * Math.PI) / 180) * k)
    .translate([330 - cx * k, 900 - cy * k]);
  const chemin = geoPath(proj);
  const pm = interpolate(t - p.a, [0.3, 0.9], [0, 1], {...cl, easing: Easing.out(Easing.back(1.6))});
  const pc = interpolate(t - (p.finA ?? 1e9), [0, 0.6], [0, 1], {...cl, easing: Easing.out(Easing.cubic)});
  const L = 4.1 * 105, l = 0.83 * 105;
  const txt = (x: number, y: number, s: string, c: string, taille: number, o: number) =>
    <text x={x} y={y} textAnchor="middle" fontFamily={polices.anton} fontSize={taille} fill={c} opacity={o}
      stroke="#000" strokeWidth={6} paintOrder="stroke">{s}</text>;
  return (
    <AbsoluteFill style={{background: NUIT}}>
      <svg width={1080} height={1920}>
        {Array.from({length: 40}, (_, i) => <line key={i} x1={0} y1={i * 52} x2={1080} y2={i * 52} stroke="rgba(255,255,255,.05)" />)}
        {Array.from({length: 22}, (_, i) => <line key={`v${i}`} x1={i * 52} y1={0} x2={i * 52} y2={1920} stroke="rgba(255,255,255,.05)" />)}
        <g transform={`translate(330,900) scale(${pm}) translate(-330,-900)`}>
          <path d={chemin(mon) ?? ''} fill={ROUGE} stroke="#fff" strokeWidth={4} />
        </g>
        {txt(330, 1210, 'MONACO', '#fff', 64, pm)}{txt(330, 1280, '2.0 km²', ROUGE, 58, pm)}
        <rect x={780 - l / 2} y={900 - (L / 2) * pc} width={l} height={L * pc} fill="#3FAE5A" stroke="#fff" strokeWidth={4} rx={6} />
        {txt(780, 1210, 'CENTRAL PARK', '#fff', 64, pc)}{txt(780, 1280, '3.4 km²', '#5FD07A', 58, pc)}
        <line x1={440} y1={1370} x2={545} y2={1370} stroke="#fff" strokeWidth={6} opacity={pm} />
        {txt(492, 1350, '1 KM', '#fff', 40, pm)}
      </svg>
    </AbsoluteFill>
  );
};

const Carte: React.FC<{p: Plan; t: number}> = ({p, t}) => {
  const proj = geoMercator().center([7.47, 43.74]).scale(24 * 6371 * Math.cos((43.74 * Math.PI) / 180)).translate([540, 1000]);
  const chemin = geoPath(proj);
  const villes: [string, [number, number]][] = [['NICE', [7.262, 43.703]], ['MENTON', [7.497, 43.776]],
    ['VENTIMIGLIA', [7.608, 43.79]], ['SANREMO', [7.776, 43.817]], ['BEAUSOLEIL', [7.43, 43.75]]];
  const m = proj([7.4246, 43.7384]) ?? [540, 1000];
  const pays = PAYS.filter((f) => ['France', 'Italy', 'Monaco'].includes(f.properties?.name));
  const lab = (pos: [number, number], s: string, taille: number, c = '#fff') => {
    const q = proj(pos) ?? [0, 0];
    return <text x={q[0]} y={q[1]} textAnchor="middle" fontFamily={polices.anton} fontSize={taille} fill={c} stroke="#000" strokeWidth={6} paintOrder="stroke">{s}</text>;
  };
  return (
    <AbsoluteFill style={{background: '#0c2a4d'}}>
      <svg width={1080} height={1920}>
        {pays.map((f, i) => <path key={i} d={chemin(f) ?? ''} fill={f.properties?.name === 'Monaco' ? ROUGE : f.properties?.name === 'Italy' ? '#2f4a3a' : '#2a3f5f'}
          stroke="rgba(255,255,255,.45)" strokeWidth={2} />)}
        {villes.slice(0, 4).map(([, pos], k) => {
          const q = proj(pos) ?? [0, 0];
          return Array.from({length: 7}, (_, j) => {
            const ph = ((t - p.a) * 0.55 + j / 7 + k * 0.13) % 1;
            const vis = t - p.a > 0.4 + j * 0.08;
            return vis ? <circle key={`${k}-${j}`} cx={q[0] + (m[0] - q[0]) * ph} cy={q[1] + (m[1] - q[1]) * ph} r={11} fill={OR}
              stroke="#000" strokeWidth={3} /> : null;
          });
        })}
        {lab([7.27, 43.86], 'FRANCE', 80)}{lab([7.64, 43.9], 'ITALY', 80)}
        {lab([7.262, 43.69], 'NICE', 44)}{lab([7.608, 43.775], 'VENTIMIGLIA', 40)}
        <circle cx={m[0]} cy={m[1]} r={18} fill={ROUGE} stroke="#fff" strokeWidth={5} />
        {lab([7.4246, 43.715], 'MONACO', 54, ROUGE)}
      </svg>
    </AbsoluteFill>
  );
};

const Image: React.FC<{p: Plan; t: number; i: number; dossier: string}> = ({p, t, i, dossier}) => {
  const u = interpolate(t, [p.a, p.b + XF], [0, 1], cl);
  const avant = i % 2 === 0;
  const s = avant ? 1.0 + 0.09 * u : 1.09 - 0.09 * u;
  const dx = [0, -18, 18, 0][i % 4] * u;
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <Img src={staticFile(`${dossier}/${p.img}.jpg`)} style={{width: '100%', height: '100%', objectFit: 'cover',
        transform: `scale(${s}) translate(${dx}px, ${-10 * u}px)`}} />
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(0,0,0,.38) 0%, rgba(0,0,0,0) 38%, rgba(0,0,0,0) 62%, rgba(0,0,0,.35) 100%)'}} />
      {p.icones ? <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0}}>
        <rect x={90} y={150} width={900} height={170} rx={30} fill="rgba(0,0,0,.55)" />
        {Array.from({length: 10}, (_, k) => {
          const sc = interpolate(t - p.a - 0.2 - k * 0.04, [0, 0.2], [0, 1], {...cl, easing: Easing.out(Easing.back(2))});
          const or = k < 4 && t >= (p.rougeA ?? 1e9) + k * 0.12;
          return <Bonhomme key={k} x={153 + k * 86} y={250} s={1.15} sc={sc} c={or ? OR : '#fff'} />;
        })}
      </svg> : null}
    </AbsoluteFill>
  );
};

const Karaoke: React.FC<{mots: EpisodeBornIn['mots']; t: number}> = ({mots, t}) => {
  const groupes: (typeof mots)[] = [];
  mots.forEach((m) => {
    const g = groupes[groupes.length - 1];
    if (!g || g.length >= 3 || /[.?!,]$/.test(g[g.length - 1].m) || m.a - g[g.length - 1].b > 0.25) groupes.push([m]);
    else g.push(m);
  });
  const k = groupes.findIndex((g, i) => t >= g[0].a - 0.05 && t < (groupes[i + 1]?.[0].a ?? g[g.length - 1].b + 0.4) - 0.05);
  if (k < 0) return null;
  const g = groupes[k];
  const s = interpolate(t - g[0].a, [-0.05, 0.1], [0.88, 1], cl);
  return (
    <div style={{position: 'absolute', left: 50, right: 50, top: 1400, textAlign: 'center', fontFamily: polices.anton, fontSize: 92,
      textTransform: 'uppercase', lineHeight: 1.1, transform: `scale(${s})`}}>
      {g.map((m, i) => <span key={i} style={{color: t >= m.a - 0.03 ? OR : '#fff', margin: '0 14px', display: 'inline-block', ...contour(8)}}>
        {m.m.replace(/[,.;:]$/, '')}</span>)}
    </div>
  );
};

export const BornIn: React.FC<{ep: EpisodeBornIn}> = ({ep}) => {
  const frame = useCurrentFrame();
  const t = frame / ep.fps;
  return (
    <AbsoluteFill style={{background: '#000'}}>
      {ep.plans.map((p, i) => {
        if (t < p.a || t > p.b + XF) return null;
        const o = i === 0 ? 1 : interpolate(t, [p.a, p.a + XF], [0, 1], cl);
        return (
          <AbsoluteFill key={i} style={{opacity: o}}>
            {p.type === 'globe' ? <Globe p={p} t={t} /> : null}
            {p.type === 'grille' ? <Grille p={p} t={t} /> : null}
            {p.type === 'taille' ? <Taille p={p} t={t} /> : null}
            {p.type === 'carte' ? <Carte p={p} t={t} /> : null}
            {p.type === 'image' ? <Image p={p} t={t} i={i} dossier={ep.id} /> : null}
            {p.type === 'texte' ? <AbsoluteFill style={{background: `radial-gradient(ellipse at 50% 45%, #1d2f52 0%, ${p.fond ?? NUIT} 70%)`}} /> : null}
            {p.ev.map((e, j) => <Evenement key={j} e={e} t={t} />)}
          </AbsoluteFill>
        );
      })}
      {t < ep.dureeVoix + 0.4 ? <Karaoke mots={ep.mots} t={t} /> : null}
    </AbsoluteFill>
  );
};
