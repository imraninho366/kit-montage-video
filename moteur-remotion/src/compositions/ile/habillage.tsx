import {loadFont as chargerLilita} from '@remotion/google-fonts/LilitaOne';
import {loadFont as chargerMontserrat} from '@remotion/google-fonts/Montserrat';
import {useEffect, useState} from 'react';
import {continueRender, delayRender, interpolate, spring, useVideoConfig} from 'remotion';

/**
 * Habillage 2D commun aux épisodes de L'Île des Abonnés (à partir de l'épisode 3).
 * Tout est piloté par t (secondes) et des données propres à chaque épisode : titres, sous-titres, bulles.
 */

const lilita = chargerLilita('normal', {subsets: ['latin', 'latin-ext']});
const montserrat = chargerMontserrat('normal', {weights: ['900'], subsets: ['latin', 'latin-ext']});
export const TITRE = lilita.fontFamily;
export const TEXTE = montserrat.fontFamily;

export const contour = (couleur: string, ep: number) => ({WebkitTextStroke: `${ep}px ${couleur}`, paintOrder: 'stroke fill' as const});

/** Attend les polices avant de monter la 3D (les étiquettes sont dessinées une fois sur canvas). */
export const usePolicesPretes = () => {
  const [pret, setPret] = useState(false);
  const [poignee] = useState(() => delayRender('polices île'));
  useEffect(() => {
    Promise.all([lilita.waitUntilDone(), montserrat.waitUntilDone()]).then(() => { setPret(true); continueRender(poignee); });
  }, [poignee]);
  return pret;
};

export type Voix = {duree: number; mots: {t: string; a: number; b: number}[]};
export type Mot = {t: string; a: number; b: number};

/** Paquets de sous-titres (3 mots au plus, coupés en fin de phrase). affichage : indice → texte ('*x*' = jaune, '' = masqué). */
export const fairePaquets = (voix: Voix, affichage: Record<number, string>): Mot[][] => {
  const mots = voix.mots.map((m, i) => ({...m, t: affichage[i] ?? m.t})).filter((m) => m.t !== '');
  const res: Mot[][] = [];
  let cour: Mot[] = [];
  for (const m of mots) {
    cour.push(m);
    if (cour.length === 3 || /[.?…!:]\*?$/.test(m.t)) { res.push(cour); cour = []; }
  }
  if (cour.length) res.push(cour);
  return res;
};

export type DefTitre = {de: number; petit: string; grand: string};

export const Titre: React.FC<{t: number; titres: DefTitre[]}> = ({t, titres}) => {
  const {fps} = useVideoConfig();
  const i = titres.findIndex((x, k) => t >= x.de && t < (titres[k + 1]?.de ?? Infinity));
  if (i < 0) return null;
  const x = titres[i];
  const e = spring({frame: (t - x.de) * 30, fps, config: {damping: 12, stiffness: 200}});
  return (
    <div style={{position: 'absolute', top: 230, left: 40, right: 40, textAlign: 'center', transform: `scale(${0.6 + 0.4 * e})`, opacity: Math.min(1, e * 1.5)}}>
      <div style={{fontFamily: TEXTE, fontWeight: 900, fontSize: 46, color: '#fff', letterSpacing: 1, ...contour('#1b1d24', 12)}}>{x.petit}</div>
      <div style={{fontFamily: TITRE, fontSize: x.grand.length > 15 ? 88 : x.grand.length > 12 ? 104 : 128, lineHeight: 1.0, whiteSpace: 'nowrap', color: '#ffc928', marginTop: 4,
        ...contour('#2b1a00', 18), textShadow: '0 8px 0 rgba(0,0,0,0.22)'}}>{x.grand}</div>
    </div>
  );
};

export const SousTitre: React.FC<{t: number; paquets: Mot[][]}> = ({t, paquets}) => {
  const i = paquets.findIndex((p, k) => t >= p[0].a - 0.05 && t < (paquets[k + 1]?.[0].a ?? p[p.length - 1].b + 0.4) - 0.05);
  if (i < 0) return null;
  const paquet = paquets[i];
  return (
    <div style={{position: 'absolute', top: 1270, left: 60, right: 60, textAlign: 'center', fontFamily: TEXTE, fontWeight: 900, fontSize: 70, lineHeight: 1.1, ...contour('#000', 14)}}>
      {paquet.map((m, j) => {
        const jaune = m.t.startsWith('*');
        return <span key={j} style={{color: jaune ? '#ffc928' : '#fff', opacity: t >= m.a - 0.05 ? 1 : 0.35}}>{m.t.replace(/\*/g, '')}{j < paquet.length - 1 ? ' ' : ''}</span>;
      })}
    </div>
  );
};

export type DefBulle = {de: number; a: number; pseudo: string; texte: string; x: number; y: number; rot: number};

/** Les vrais commentaires du relevé, cités dans la vidéo. */
export const Bulles: React.FC<{t: number; bulles: DefBulle[]}> = ({t, bulles}) => {
  const {fps} = useVideoConfig();
  return (
    <>
      {bulles.filter((b) => t >= b.de && t < b.a).map((b) => {
        const e = spring({frame: (t - b.de) * 30, fps, config: {damping: 12}});
        return (
          <div key={b.pseudo + b.de} style={{position: 'absolute', top: b.y, left: b.x, maxWidth: 900, transform: `scale(${e}) rotate(${b.rot}deg)`, transformOrigin: 'left center',
            background: '#fff', borderRadius: 30, padding: '18px 28px', boxShadow: '0 10px 0 rgba(0,0,0,0.18)', fontFamily: TEXTE, fontWeight: 900}}>
            <div style={{fontSize: 28, color: '#8a8f99'}}>{b.pseudo}</div>
            <div style={{fontSize: 42, color: '#1b1d24', lineHeight: 1.15}}>{b.texte}</div>
          </div>
        );
      })}
    </>
  );
};

/** Jauge d'eau (de → a : niveau), sous le visage de Robin. */
export const JaugeEau: React.FC<{t: number; de: number; a: number; niveau0: number; niveau1: number}> = ({t, de, a, niveau0, niveau1}) => {
  const {fps} = useVideoConfig();
  if (t < de || t >= a) return null;
  const e = spring({frame: (t - de) * 30, fps, config: {damping: 12}});
  const niveau = interpolate(t, [de + 0.2, de + 1.2], [niveau0, niveau1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const plein = niveau > 0.5;
  return (
    <div style={{position: 'absolute', top: 1110, left: 0, right: 0, display: 'flex', justifyContent: 'center', transform: `scale(${e})`}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 20, background: '#1b1d24', borderRadius: 30, padding: '14px 30px', border: '6px solid #56dcff'}}>
        <svg width="56" height="56" viewBox="0 0 24 24"><path fill="#56dcff" d="M12 2s-7 8-7 13a7 7 0 0 0 14 0c0-5-7-13-7-13z" /></svg>
        <div style={{width: 380, height: 44, borderRadius: 22, background: '#3a3f4b', overflow: 'hidden'}}>
          <div style={{width: `${niveau * 100}%`, height: '100%', background: '#56dcff'}} />
        </div>
        <div style={{fontFamily: TEXTE, fontWeight: 900, fontSize: 52, color: plein ? '#56dcff' : '#ff4d5e'}}>{Math.round(niveau * 100)}%</div>
      </div>
    </div>
  );
};

export const BoutonAbonne: React.FC<{t: number; de: number}> = ({t, de}) => {
  const {fps} = useVideoConfig();
  if (t < de) return null;
  const e = spring({frame: (t - de) * 30, fps, config: {damping: 10}});
  const fait = t >= de + 1.0;
  const clic = fait ? spring({frame: (t - de - 1.0) * 30, fps, config: {damping: 8, stiffness: 300}}) : 0;
  return (
    <div style={{position: 'absolute', top: 1090, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
      <div style={{transform: `scale(${e * (1 + 0.12 * Math.sin(clic * Math.PI))})`, background: fait ? '#8a8f99' : '#fe2c55', color: '#fff',
        fontFamily: TEXTE, fontWeight: 900, fontSize: 58, padding: '18px 60px', borderRadius: 60, border: '6px solid #fff',
        boxShadow: '0 10px 0 rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', gap: 18}}>
        {fait ? 'ABONNÉ' : "S'ABONNER"}
        {fait && <svg width="50" height="50" viewBox="0 0 24 24"><path fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" d="M4 12.5l5 5L20 6.5" /></svg>}
      </div>
    </div>
  );
};

export const Confettis: React.FC<{t: number; de: number; a?: number}> = ({t, de, a = Infinity}) => {
  if (t < de || t >= a) return null;
  const f = (t - de) * 30;
  const couleurs = ['#ffc928', '#fe2c55', '#3f7fd9', '#2bb39b', '#ffffff', '#9b59d0'];
  return (
    <>
      {Array.from({length: 70}).map((_, i) => {
        const x = (Math.sin(i * 91.7) * 0.5 + 0.5) * 1080;
        const v = 14 + (Math.sin(i * 13.1) * 0.5 + 0.5) * 16;
        const y = -60 + f * v - (i % 7) * 40;
        return <div key={i} style={{position: 'absolute', left: x + Math.sin(f / 6 + i) * 30, top: y, width: 20, height: 34,
          background: couleurs[i % couleurs.length], transform: `rotate(${f * 12 + i * 40}deg)`, borderRadius: 4}} />;
      })}
    </>
  );
};
