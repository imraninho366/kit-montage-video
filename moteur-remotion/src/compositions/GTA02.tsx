/**
 * Dossier Leonida — vidéo 2 « Pourquoi GTA 6 va battre tous les records ».
 * Reprend les briques de GTA01 (mêmes plans Rockstar, même charte) et ajoute les visuels du « phénomène » :
 * frise des reports, chute en bourse, Netflix 87/93, barres comparatives, calendrier, congés, panneau FERMÉ, fuseaux.
 * Plan : public/gta02/plan.json, écrit par chaine-gta6/videos/02-phenomene/montage.py.
 */
import React from 'react';
import {AbsoluteFill, Easing, interpolate, Sequence, useCurrentFrame} from 'remotion';
import plan from '../../public/gta02/plan.json';
import {
  ANTON, BLANC, Beat, clamp, CYAN, DEGRADE, Fond, GRIS, INTER, Monte, MONO, Neon, NUIT, ORANGE, Panneau, ROSE, ROUGE, Sur, V, VERT,
} from './GTA01';

export const DUREE_GTA02 = plan.frames;
const FONDU = 7;

const avance = (f: number, a: number, b: number) => interpolate(f, [a, b], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});

/* Frise des dates clés, étape k mise en avant. */
const ETAPES = [
  ['17.09.2013', 'GTA 5 sort', ''], ['12.2023', 'GTA 6 révélé', 'prévu automne 2025'], ['05.2025', '1er report', '→ 26 mai 2026'],
  ['11.2025', '2e report', '→ 19 nov. 2026'], ['19.11.2026', 'La sortie', ''],
];
const Frise: React.FC<V> = ({k, d}) => {
  const f = useCurrentFrame();
  const prog = avance(f, 0, 30);
  return <Fond d={d}>
    <div style={{position: 'relative', width: 1640, height: 520}}>
      <div style={{position: 'absolute', left: 40, right: 40, top: 200, height: 8, background: '#2a1f40', borderRadius: 4}} />
      <div style={{position: 'absolute', left: 40, top: 200, height: 8, borderRadius: 4, background: DEGRADE, boxShadow: `0 0 20px ${ROSE}`,
        width: (1560 * (k / (ETAPES.length - 1))) * prog}} />
      {ETAPES.map(([date, x, sous], i) => {
        const left = 40 + (1560 * i) / (ETAPES.length - 1);
        const actif = i === k, passe = i < k;
        const c = actif ? (i === 2 || i === 3 ? ROUGE : ORANGE) : passe ? BLANC : GRIS;
        const taille = actif ? 46 : 30;
        return <div key={date} style={{position: 'absolute', left: left - 150, width: 300, top: 0, textAlign: 'center', opacity: i <= k ? 1 : 0.35}}>
          <div style={{fontFamily: MONO, fontWeight: 600, fontSize: 30, color: c, letterSpacing: 2, height: 180, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: 24, boxSizing: 'border-box'}}>{date}</div>
          <div style={{margin: '0 auto', width: taille, height: taille, marginTop: 4 - taille / 2 + 4, borderRadius: '50%', background: i <= k ? c : '#2a1f40',
            boxShadow: actif ? `0 0 30px ${c}` : undefined, transform: `scale(${actif ? 0.6 + 0.4 * avance(f, 10, 24) : 1})`}} />
          <div style={{fontFamily: ANTON, fontSize: actif ? 64 : 44, color: c, marginTop: 26, textTransform: 'uppercase', lineHeight: 1.05}}>{x}</div>
          {sous && <div style={{fontFamily: INTER, fontWeight: 700, fontSize: 30, color: BLANC, marginTop: 10, opacity: 0.9}}>{sous}</div>}
        </div>;
      })}
    </div>
  </Fond>;
};

/* Courbe schématique d'une action qui chute après l'annonce. */
const Bourse: React.FC<V> = ({d}) => {
  const f = useCurrentFrame();
  const p = avance(f, 0, Math.min(60, d - 10));
  const pts: [number, number][] = [];
  for (let i = 0; i <= 60; i++) {
    const x = i / 60;
    const bruit = Math.sin(i * 1.7) * 6 + Math.sin(i * 0.6) * 9;
    const y = x < 0.72 ? 160 + bruit - x * 40 : 160 - 0.72 * 40 + bruit + ((x - 0.72) / 0.28) * 230;
    pts.push([60 + x * 1300, y]);
  }
  const vis = pts.slice(0, Math.max(2, Math.round(p * pts.length)));
  const chemin = vis.map(([x, y], i) => `${i ? 'L' : 'M'}${x},${y}`).join(' ');
  const chute = p > 0.75;
  return <Fond d={d}>
    <Monte><Sur c={ORANGE}>Take-Two · annonce du 2e report</Sur></Monte>
    <div style={{position: 'relative', marginTop: 30}}>
      <svg width={1420} height={500}>
        {[100, 200, 300, 400].map((y) => <line key={y} x1={60} x2={1360} y1={y} y2={y} stroke="rgba(167,159,194,0.18)" strokeWidth={2} />)}
        <line x1={60 + 0.72 * 1300} x2={60 + 0.72 * 1300} y1={40} y2={460} stroke="rgba(255,181,71,0.5)" strokeWidth={3} strokeDasharray="10 10" />
        <path d={chemin} fill="none" stroke={chute ? ROUGE : VERT} strokeWidth={8} strokeLinejoin="round" strokeLinecap="round" />
      </svg>
      <div style={{position: 'absolute', right: 40, top: -10, opacity: avance(f, 45, 58), fontFamily: ANTON, fontSize: 150, color: ROUGE, textShadow: `0 0 30px ${ROUGE}88`}}>−8 %</div>
      <div style={{position: 'absolute', left: 60 + 0.72 * 1300 - 140, top: 0, width: 280, textAlign: 'center', fontFamily: MONO, fontSize: 24, color: ORANGE}}>REPORT</div>
    </div>
    <Monte r={20} style={{marginTop: 10}}><Sur>schéma · baisse de près de 8 % après l'annonce</Sur></Monte>
  </Fond>;
};

/* Netflix : 87 pays allumés sur 93. */
const Netflix: React.FC<V> = ({d}) => {
  const f = useCurrentFrame();
  const n = Math.round(87 * avance(f, 6, Math.min(54, d - 6)));
  return <Fond d={d}>
    <div style={{display: 'flex', alignItems: 'center', gap: 90}}>
      <div style={{display: 'grid', gridTemplateColumns: 'repeat(12, 46px)', gap: 12}}>
        {Array.from({length: 93}).map((_, i) => {
          const on = i < n;
          return <div key={i} style={{width: 46, height: 46, borderRadius: 10, background: on ? '#E50914' : '#2a1f40', boxShadow: on ? '0 0 14px #E5091488' : undefined}} />;
        })}
      </div>
      <div style={{textAlign: 'left'}}>
        <Monte><div style={{fontFamily: ANTON, fontSize: 70, color: '#E50914', letterSpacing: 4}}>NETFLIX</div></Monte>
        <div style={{fontFamily: ANTON, fontSize: 260, lineHeight: 1, color: BLANC}}>{n}<span style={{fontSize: 110, color: GRIS}}>/93</span></div>
        <Monte r={20}><Sur c={BLANC}>pays · numéro un</Sur></Monte>
        <Monte r={30} style={{marginTop: 20}}><Sur c={ORANGE}>31,1 M de vues en 4 jours</Sur></Monte>
      </div>
    </div>
  </Fond>;
};

/* Barres horizontales comparées. items : [{l, v, txt, est?}] ; max : valeur de la barre pleine. */
const Barres: React.FC<V> = ({titre, items, max, note, d}) => {
  const f = useCurrentFrame();
  return <Fond d={d}>
    <Panneau w={1500}>
      <Sur c={ORANGE}>{titre}</Sur>
      {items.map((it: V, i: number) => {
        const p = avance(f, 8 + i * 10, 30 + i * 10);
        const c = it.est ? ORANGE : i === items.length - 1 ? ROSE : CYAN;
        return <div key={it.l} style={{marginTop: 34}}>
          <div style={{display: 'flex', justifyContent: 'space-between', fontFamily: INTER, fontWeight: 800, fontSize: 44, color: BLANC}}>
            <span>{it.l}</span><span style={{color: c, opacity: p}}>{it.txt}</span></div>
          <div style={{height: 46, marginTop: 12, background: '#2a1f40', borderRadius: 12, overflow: 'hidden'}}>
            <div style={{height: '100%', width: `${(it.v / max) * 100 * p}%`, borderRadius: 12,
              background: it.est ? `repeating-linear-gradient(135deg, ${ORANGE}, ${ORANGE} 16px, #c98a2e 16px, #c98a2e 32px)` : c}} />
          </div>
        </div>;
      })}
      {note && <div style={{marginTop: 30}}><Sur>{note}</Sur></div>}
    </Panneau>
  </Fond>;
};

/* Calendrier de novembre 2026 (le 1er est un dimanche) : le 19 s'allume, les autres sorties s'écartent. */
const Calendrier: React.FC<V> = ({d}) => {
  const f = useCurrentFrame();
  const fuite = avance(f, 20, 55);
  const DECALAGE = 6;
  const cases = Array.from({length: 42}, (_, i) => i - DECALAGE);
  const jeux = [{de: 18, vers: 4}, {de: 20, vers: 30}, {de: 26, vers: 9}];
  const pos = (j: number) => { const i = j + DECALAGE; return {x: (i % 7) * 180, y: Math.floor(i / 7) * 100}; };
  return <Fond d={d}>
    <Monte><Sur c={ORANGE}>Novembre 2026</Sur></Monte>
    <div style={{position: 'relative', width: 1260, height: 600, marginTop: 24}}>
      {cases.map((j) => {
        const {x, y} = pos(j); const jour = j + 1; const ok = jour >= 1 && jour <= 30; const gta = jour === 19;
        return <div key={j} style={{position: 'absolute', left: x, top: y, width: 168, height: 90, borderRadius: 14,
          background: gta ? DEGRADE : ok ? '#1e1633' : 'transparent', boxShadow: gta ? `0 0 40px ${ROSE}` : undefined,
          fontFamily: gta ? ANTON : INTER, fontWeight: 700, fontSize: gta ? 40 : 30, color: ok ? BLANC : 'transparent', padding: 12, boxSizing: 'border-box'}}>
          {ok ? jour : ''}{gta && <span style={{marginLeft: 12}}>GTA VI</span>}</div>;
      })}
      {jeux.map((g, i) => {
        const a = pos(g.de - 1), b = pos(g.vers - 1);
        const x = a.x + (b.x - a.x) * fuite, y = a.y + (b.y - a.y) * fuite;
        return <div key={i} style={{position: 'absolute', left: x + 14, top: y + 44, width: 140, height: 38, borderRadius: 10, background: CYAN,
          fontFamily: MONO, fontWeight: 600, fontSize: 22, color: NUIT, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>autre jeu</div>;
      })}
    </div>
    <Monte r={40}><Sur c={BLANC}>au moins 3 grands éditeurs prêts à décaler</Sur></Monte>
  </Fond>;
};

/* Congés posés : jeudi normal contre 19 novembre (fourchette hachurée). */
const Conges: React.FC<V> = ({d}) => {
  const f = useCurrentFrame();
  const p = avance(f, 8, 40);
  const H = 420;
  const barres: [string, number, string, string][] = [['Un jeudi normal', 100, CYAN, ''], ['Jeudi 19 novembre', 117, ROSE, '+9 à +17 %']];
  return <Fond d={d}>
    <Monte><Sur c={ORANGE}>Demandes de congé · données BambooHR</Sur></Monte>
    <div style={{display: 'flex', alignItems: 'flex-end', gap: 160, marginTop: 40, height: H + 220}}>
      {barres.map(([l, v, c, t], i) => <div key={l} style={{textAlign: 'center'}}>
        <div style={{fontFamily: ANTON, fontSize: 90, color: c, opacity: i ? avance(f, 36, 48) : 0, height: 120}}>{t}</div>
        <div style={{position: 'relative', width: 300, height: H * (v / 117) * p, background: c, borderRadius: '16px 16px 0 0', margin: '0 auto'}}>
          {i === 1 && <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: H * (8 / 117) * p, borderRadius: '16px 16px 0 0',
            background: 'repeating-linear-gradient(135deg, rgba(255,255,255,0.4), rgba(255,255,255,0.4) 10px, transparent 10px, transparent 20px)'}} />}
        </div>
        <div style={{fontFamily: INTER, fontWeight: 800, fontSize: 40, color: BLANC, marginTop: 20}}>{l}</div>
      </div>)}
    </div>
  </Fond>;
};

/* Panneau FERMÉ qui se balance. */
const Ferme: React.FC<V> = ({d}) => {
  const f = useCurrentFrame();
  const angle = Math.sin(f / 9) * 7 * Math.exp(-f / 60);
  return <Fond d={d}>
    <div style={{width: 6, height: 120, background: GRIS}} />
    <div style={{transformOrigin: 'top center', transform: `rotate(${angle}deg)`, background: BLANC, borderRadius: 24, padding: '40px 90px', border: `10px solid ${ROUGE}`, textAlign: 'center',
      boxShadow: '0 30px 80px rgba(0,0,0,0.5)'}}>
      <div style={{fontFamily: ANTON, fontSize: 200, color: ROUGE, lineHeight: 1}}>FERMÉ</div>
      <div style={{fontFamily: INTER, fontWeight: 800, fontSize: 48, color: NUIT, marginTop: 10}}>jeudi 19 novembre</div>
    </div>
    <Monte r={16} style={{marginTop: 50}}><Sur c={BLANC}>Burger Motorsports · États-Unis</Sur></Monte>
  </Fond>;
};

/* Ordre de déblocage si « minuit heure locale » se confirme, en heure de Paris. */
const VILLES = [['Auckland', 'mer. 18 · 12 h'], ['Sydney', 'mer. 18 · 14 h'], ['Tokyo', 'mer. 18 · 16 h'], ['Paris', 'jeu. 19 · 0 h'], ['New York', 'jeu. 19 · 6 h']];
const Fuseaux: React.FC<V> = ({d}) => {
  const f = useCurrentFrame();
  return <Fond d={d}>
    <Monte><Sur c={ORANGE}>Si c'est minuit heure locale · en heure de Paris</Sur></Monte>
    <div style={{display: 'flex', gap: 26, marginTop: 50}}>
      {VILLES.map(([v, h], i) => {
        const p = avance(f, 6 + i * 9, 18 + i * 9);
        const premier = i === 0, paris = v === 'Paris';
        return <div key={v} style={{width: 300, padding: '36px 10px', borderRadius: 22, textAlign: 'center', opacity: p, transform: `translateY(${(1 - p) * 40}px)`,
          background: premier ? DEGRADE : '#1e1633', border: paris ? `3px solid ${CYAN}` : '3px solid transparent', boxShadow: premier ? `0 0 40px ${ROSE}` : undefined}}>
          <div style={{fontFamily: MONO, fontWeight: 600, fontSize: 26, color: premier ? NUIT : GRIS}}>{premier ? '1ER' : `${i + 1}E`}</div>
          <div style={{fontFamily: ANTON, fontSize: 62, color: BLANC, marginTop: 10}}>{v}</div>
          <div style={{fontFamily: INTER, fontWeight: 700, fontSize: 30, color: premier ? NUIT : BLANC, marginTop: 10}}>{h}</div>
        </div>;
      })}
    </div>
    <Monte r={50} style={{marginTop: 46}}><Sur>heure non confirmée par Rockstar</Sur></Monte>
  </Fond>;
};

/* Gros mot néon sur nuit, pour les chocs (« LE MONDE S'ARRÊTE »). */
const Choc: React.FC<V> = ({x, sous, d}) => {
  const f = useCurrentFrame();
  const s = interpolate(f, [0, d], [1.08, 1], clamp);
  return <AbsoluteFill style={{background: `radial-gradient(circle at 50% 50%, #3a1550, ${NUIT} 70%)`, alignItems: 'center', justifyContent: 'center'}}>
    <div style={{transform: `scale(${s})`}}><Neon taille={x.length > 16 ? 170 : 220}>{x}</Neon></div>
    {sous && <Monte r={10} style={{marginTop: 30}}><Sur c={BLANC}>{sous}</Sur></Monte>}
  </AbsoluteFill>;
};

export const VISUELS_GTA02: Record<string, React.FC<V>> = {
  frise: Frise, bourse: Bourse, netflix: Netflix, barres: Barres, calendrier: Calendrier, conges: Conges, ferme: Ferme, fuseaux: Fuseaux, choc: Choc,
};

export const GTA02: React.FC = () => (
  <AbsoluteFill style={{background: NUIT}}>
    {(plan.beats as {d: number; f: number; v: V}[]).map((b, i) => {
      const d = b.f - b.d + (i < plan.beats.length - 1 ? FONDU : 0);
      return <Sequence key={i} from={b.d} durationInFrames={d}><Beat v={b.v} d={d} premier={i === 0} extra={VISUELS_GTA02} /></Sequence>;
    })}
  </AbsoluteFill>
);
