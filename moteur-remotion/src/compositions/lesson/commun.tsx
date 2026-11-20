import React from 'react';
import {AbsoluteFill, interpolate, useVideoConfig} from 'remotion';
import {loadFont as loadInter} from '@remotion/google-fonts/Inter';
import {loadFont as loadCaveat} from '@remotion/google-fonts/Caveat';

/** Briques communes « Tech Unseen » : voix → images 3D, karaoké, étiquettes ancrées, tampons, écran de fin. */
export const {fontFamily: SANS} = loadInter();
export const {fontFamily: CRAIE} = loadCaveat();
export const FPS = 30;
export const JAUNE = '#FFD84D', CYAN = '#5FE0FF', CUIVRE = '#FF9A4D', VERT = '#3BE37A', ROUGE = '#FF4B3E', ORANGE = '#FF9F1A';
export const cl = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

export type Voix = {phrases: string[]; debuts: number[]; duree: number; mots: {m: string; a: number; b: number}[]};
export type Ancre = [number, number, number];

/** Phrase en cours (index) à l'image f. */
export const phraseA = (voix: Voix, f: number) => {
  let k = 0;
  voix.debuts.forEach((d, i) => { if (f / FPS >= d - .03) k = i; });
  return k;
};

/** Image 3D à afficher : chaque phrase k parcourt le segment SEG[k] = [image début, image fin] pendant sa durée. */
export const imageBf = (voix: Voix, seg: [number, number][], f: number) => {
  const k = phraseA(voix, f);
  const a = voix.debuts[k] * FPS, b = (voix.debuts[k + 1] ?? voix.duree + .3) * FPS;
  const t = Math.min(Math.max((f - a) / (b - a), 0), 1);
  const [s0, s1] = seg[Math.min(k, seg.length - 1)];
  return Math.round(s0 + (s1 - s0) * t);
};

/** Fenêtre d'apparition d'un habillage de la phrase k à la phrase k2 (fondus de 6 images). */
export const surPhrase = (voix: Voix, f: number, k: number, k2 = k) => {
  const a = voix.debuts[k] * FPS, b = (voix.debuts[k2 + 1] ?? voix.duree) * FPS;
  return interpolate(f, [a - 4, a + 6, b - 6, b], [0, 1, 1, 0], cl);
};

export const SousTitre: React.FC<{f: number; voix: Voix; finVoix: number}> = ({f, voix, finVoix}) => {
  const t = f / FPS;
  let k = -1;
  voix.debuts.forEach((d, i) => { if (t >= d - .05) k = i; });
  if (k < 0 || f >= finVoix) return null;
  const debut = voix.debuts[k], finP = voix.debuts[k + 1] ?? voix.duree + .1;
  const mots = voix.mots.filter((m) => m.a >= debut - .05 && m.a < finP - .05);
  const apparition = interpolate(t, [debut - .05, debut + .12], [0, 1], cl);
  return (
    <div style={{position: 'absolute', left: 60, right: 60, bottom: 300, textAlign: 'center', opacity: apparition,
      transform: `scale(${.92 + .08 * apparition})`}}>
      <span style={{fontFamily: SANS, fontWeight: 900, fontSize: k === 0 ? 80 : 62, lineHeight: 1.12, color: '#fff',
        WebkitTextStroke: '2px #000', textShadow: '0 4px 0 #000, 0 0 24px rgba(0,0,0,.85)'}}>
        {mots.map((m, i) => (
          <span key={i} style={{color: t >= m.a && t < m.b + .08 ? JAUNE : t >= m.a ? '#fff' : 'rgba(255,255,255,.55)'}}>{m.m} </span>
        ))}
      </span>
    </div>
  );
};

export const Etiquette: React.FC<{pt: Ancre | null; t: number; texte: string; sous?: string; couleur: string; dx: number; dy: number}> =
  ({pt, t, texte, sous, couleur, dx, dy}) => {
    const {width, height} = useVideoConfig();
    if (!pt || t <= 0 || pt[2] <= 0) return null;
    const px = pt[0] * width, py = pt[1] * height, lx = px + dx, ly = py + dy;
    const gauche = Math.min(Math.max(lx - 240, 30), width - 510);
    return (
      <>
        <svg width={width} height={height} style={{position: 'absolute', left: 0, top: 0, opacity: t}}>
          <line x1={px} y1={py} x2={px + (lx - px) * t} y2={py + (ly - py) * t} stroke={couleur} strokeWidth={5} />
          <circle cx={px} cy={py} r={13 * t} fill={couleur} stroke="#05080F" strokeWidth={4} />
        </svg>
        <div style={{position: 'absolute', left: gauche, width: 480, top: ly - (dy < 0 ? 90 : 0), textAlign: 'center', opacity: t,
          transform: `scale(${.85 + .15 * t})`}}>
          <div style={{display: 'inline-block', fontFamily: SANS, fontWeight: 900, fontSize: 42, color: '#05080F', background: couleur,
            padding: '8px 20px', borderRadius: 14, boxShadow: '0 6px 0 rgba(0,0,0,.4)'}}>{texte}</div>
          {sous && <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 30, color: '#fff', marginTop: 8,
            textShadow: '0 3px 10px rgba(0,0,0,.9)'}}>{sous}</div>}
        </div>
      </>
    );
  };

/** Tampon incliné (✓ APPROVED, ✗ DECLINED…). */
export const Tampon: React.FC<{t: number; texte: string; couleur: string; top?: number}> = ({t, texte, couleur, top = 420}) => {
  if (t <= 0) return null;
  return (
    <div style={{position: 'absolute', top, width: '100%', textAlign: 'center', opacity: t, transform: `scale(${1.5 - .5 * t}) rotate(-4deg)`}}>
      <span style={{fontFamily: SANS, fontWeight: 900, fontSize: 92, color: couleur, border: `9px solid ${couleur}`, borderRadius: 22,
        padding: '6px 30px', background: 'rgba(5,8,15,.6)'}}>{texte}</span>
    </div>
  );
};

/** Grand chiffre encadré + légende (plan « texte animé isolé »). */
export const Chiffre: React.FC<{t: number; haut?: string; gros: string; bas: string; couleur: string; top?: number}> =
  ({t, haut, gros, bas, couleur, top = 380}) => {
    if (t <= 0) return null;
    return (
      <div style={{position: 'absolute', left: 70, right: 70, top, textAlign: 'center', opacity: t, transform: `translateY(${(1 - t) * 30}px)`}}>
        <div style={{display: 'inline-block', background: 'rgba(5,8,15,.82)', border: `4px solid ${couleur}`, borderRadius: 30, padding: '26px 40px'}}>
          {haut && <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 32, letterSpacing: 4, color: couleur}}>{haut}</div>}
          <div style={{fontFamily: SANS, fontWeight: 900, fontSize: 120, lineHeight: 1.05, color: '#fff'}}>{gros}</div>
          <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 38, color: 'rgba(255,255,255,.88)', marginTop: 6}}>{bas}</div>
        </div>
      </div>
    );
  };

/** Liste cochée / barrée (✓ vert, ✗ rouge), éléments qui arrivent un par un. */
export const Liste: React.FC<{t: number; f: number; debut: number; items: [string, boolean][]; titre?: string; top?: number}> =
  ({t, f, debut, items, titre, top = 360}) => {
    if (t <= 0) return null;
    return (
      <div style={{position: 'absolute', left: 90, right: 90, top, opacity: t}}>
        <div style={{background: 'rgba(5,8,15,.84)', borderRadius: 30, padding: '26px 36px', border: '3px solid rgba(255,255,255,.2)'}}>
          {titre && <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 32, letterSpacing: 4, color: JAUNE, marginBottom: 10}}>{titre}</div>}
          {items.map(([txt, ok], i) => {
            const ti = interpolate(f, [debut + i * 10, debut + i * 10 + 8], [0, 1], cl);
            return (
              <div key={txt} style={{display: 'flex', alignItems: 'center', gap: 22, opacity: ti, transform: `translateX(${(1 - ti) * -30}px)`, margin: '10px 0'}}>
                <span style={{fontFamily: SANS, fontWeight: 900, fontSize: 64, color: ok ? VERT : ROUGE, width: 64}}>{ok ? '✓' : '✗'}</span>
                <span style={{fontFamily: SANS, fontWeight: 800, fontSize: 50, color: '#fff', textDecoration: ok ? 'none' : 'line-through',
                  textDecorationColor: ROUGE}}>{txt}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

export const Entete: React.FC<{lecon: string; noms: string[]; actif: number; vis: number; fini: boolean}> = ({lecon, noms, actif, vis, fini}) => (
  <div style={{position: 'absolute', top: 100, left: 60, right: 60, opacity: vis}}>
    <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 30, letterSpacing: 4, color: 'rgba(255,255,255,.85)', marginBottom: 14}}>{lecon}</div>
    <div style={{display: 'flex', gap: 12}}>
      {noms.map((n, i) => {
        const fait = i < actif || fini, encours = i === actif && !fini;
        return (
          <div key={n} style={{flex: 1}}>
            <div style={{height: 10, borderRadius: 5, background: 'rgba(255,255,255,.18)', overflow: 'hidden'}}>
              <div style={{height: '100%', width: fait ? '100%' : encours ? '55%' : '0%', background: encours ? JAUNE : '#fff'}} />
            </div>
            <div style={{fontFamily: SANS, fontWeight: encours ? 900 : 700, fontSize: 30, marginTop: 10,
              color: encours ? JAUNE : 'rgba(255,255,255,.65)'}}>{i + 1}. {n}</div>
          </div>
        );
      })}
    </div>
  </div>
);

/** Écran de fin : récap au tableau, pop quiz, abonnement. */
export const Fin: React.FC<{f: number; debut: number; recap: string[]; quiz: string; abo: number}> = ({f, debut, recap, quiz, abo}) => {
  const fin = interpolate(f, [debut, debut + 12], [0, 1], cl);
  if (fin <= 0) return null;
  return (
    <AbsoluteFill style={{background: `rgba(10,24,20,${fin * .9})`, alignItems: 'center', justifyContent: 'center'}}>
      <div style={{opacity: fin, width: 920, transform: `translateY(${(1 - fin) * 40}px)`, marginTop: -180}}>
        <div style={{fontFamily: CRAIE, fontWeight: 700, fontSize: 96, color: '#F4F1E6', textAlign: 'center', marginBottom: 24}}>Remember:</div>
        {recap.map((l, i) => {
          const ti = interpolate(f, [debut + 6 + i * 8, debut + 16 + i * 8], [0, 1], cl);
          return <div key={l} style={{fontFamily: CRAIE, fontWeight: 700, fontSize: 76, color: '#F4F1E6', opacity: ti, margin: '6px 0',
            transform: `translateX(${(1 - ti) * -40}px)`}}><span style={{color: JAUNE}}>{i + 1}.</span> {l}</div>;
        })}
        <div style={{marginTop: 46, background: JAUNE, borderRadius: 26, padding: '22px 34px', textAlign: 'center',
          opacity: interpolate(f, [debut + 30, debut + 40], [0, 1], cl)}}>
          <div style={{fontFamily: SANS, fontWeight: 900, fontSize: 34, letterSpacing: 4, color: '#142A22'}}>POP QUIZ</div>
          <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 50, color: '#05080F', lineHeight: 1.1, marginTop: 6}}>{quiz} 👇</div>
        </div>
        <div style={{marginTop: 34, textAlign: 'center', opacity: interpolate(f, [abo, abo + 10], [0, 1], cl),
          transform: `scale(${interpolate(f, [abo, abo + 10], [.8, 1], cl)})`}}>
          <span style={{fontFamily: SANS, fontWeight: 900, fontSize: 46, color: '#fff', background: ROUGE, borderRadius: 40, padding: '16px 40px'}}>
            + Follow Tech Unseen</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
