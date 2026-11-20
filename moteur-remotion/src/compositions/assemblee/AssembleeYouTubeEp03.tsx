import {loadFont as chargerLilita} from '@remotion/google-fonts/LilitaOne';
import {loadFont as chargerMontserrat} from '@remotion/google-fonts/Montserrat';
import {ThreeCanvas} from '@remotion/three';
import {useEffect, useState} from 'react';
import {AbsoluteFill, Audio, Easing, continueRender, delayRender, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import voix from './youtube_ep03_voix.json';
import {EtatAssemblee, Hemicycle, PARCELLES, SIEGES} from './Assemblee3D';

/* Épisode 3, branche YouTube. Votes relevés le 10/11/2026 sous l'épisode 2 YouTube (Short oPXzVfKI7DU, 271 vues) :
   2 commentaires, 2 votes B. 249 abonnés. Loi bonus = la seule proposition : @abonne_110 (tromperie, 1 like).
   Textes vérifiés le 10/11/2026 sur Légifrance : code de commerce L410-2, code de la consommation L454-1,
   code civil art. 212, loi n° 75-617 du 11 juillet 1975 art. 17 (abroge les art. 336 à 339 de l'ancien code pénal : adultère). */

const lilita = chargerLilita('normal', {subsets: ['latin', 'latin-ext']});
const montserrat = chargerMontserrat('normal', {weights: ['900'], subsets: ['latin', 'latin-ext']});
const TITRE = lilita.fontFamily;
const TEXTE = montserrat.fontFamily;

const ABONNES = 249;
const FIN_VOIX = voix.duree + 1.2;
export const DUREE_ASSEMBLEE_YT03 = Math.ceil(FIN_VOIX * 30);

const M = (i: number) => Math.round((voix.mots[i].a - 0.08) * 30);
const FIN = Math.round(FIN_VOIX * 30);
const W = {
  deux: M(11), ici: M(12), hier: M(18), a: M(23), c: M(32), b: M(40), adoptee: M(51), vrai: M(57), code: M(68), gouv: M(81), smic: M(93),
  bonus: M(111), bonne: M(121), mauvaise: M(139), mariage: M(151), plus: M(160), pese: M(172), notre: M(182), mille: M(190), abonne: M(196), siege: M(203),
};

type V3 = [number, number, number];
type Ressort = {damping?: number; stiffness?: number};
const ease = Easing.inOut(Easing.cubic);
const mix = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const entre = (f: number, de: number, a: number) => f >= de && f < a;
const SEC: Ressort = {damping: 9, stiffness: 260};

/* ------------------------------------------------------------------ données réelles */

// ordre du dépouillement : A, C, puis B (parcelles 0, 2, 1)
const VOTES = [
  {lettre: 'A', court: '300 € PAR JOUR', voix: 0, de: W.a},
  {lettre: 'C', court: 'ALCOOL INTERDIT AUX MINEURS', voix: 0, de: W.c},
  {lettre: 'B', court: 'ESSENCE À 1,20 €', voix: 2, de: W.b},
];
const LOI_B = {pseudo: '@abonne_92', loi: 'L’essence à 1,20 € et 20 000 € par mois de salaire'};
const BONUS = {pseudo: '@abonne_110', loi: '« La tromperie sera punie par 6 millions € d’amende »', likes: 1};
// ceux qui ont commenté sous les épisodes YouTube : ils illustrent la promesse « ton pseudo sur un siège »
const PSEUDOS = ['@abonne_111', '@abonne_110', '@abonne_92', '@abonne_91', '@abonne_93', '@abonne_102', '@abonne_105',
  '@abonne_104', '@abonne_107', '@abonne_99', '@abonne_97', '@abonne_94', '@toi ?'];

/* ------------------------------------------------------------------ caméra */

type Plan = {de: number; a: number; p0: V3; p1: V3; c0: V3};
const GREFFIER_YEUX: V3 = [0, 1.95, 2.75];
const proche = (i: number, de: number, a: number): Plan => ({de, a, p0: add(PARCELLES[i], [0.6, 3.4, 4.3]), p1: add(PARCELLES[i], [0.2, 3.0, 3.7]), c0: add(PARCELLES[i], [0, 0.9, 0])});
const haut = (de: number, a: number, z0 = 12.6, z1 = 11.6): Plan => ({de, a, p0: [0, z0, 3.9], p1: [0, z1, 3.7], c0: [0, 0.2, -3.0]});
const greffier = (de: number, a: number): Plan => ({de, a, p0: [0.5, 2.3, -0.7], p1: [0.3, 2.2, -0.2], c0: GREFFIER_YEUX});
const PLANS: Plan[] = [
  {de: 0, a: W.ici, p0: [0, 15.5, 3.9], p1: [0, 13.5, 3.9], c0: [0, 0.3, -4.6]},
  {de: W.ici, a: W.hier, p0: [0, 13.5, 3.9], p1: [0, 14.8, 3.9], c0: [0, 0.3, -4.6]},
  haut(W.hier, W.a, 12.8, 11.8),
  proche(0, W.a, W.c),
  proche(2, W.c, W.b),
  proche(1, W.b, W.adoptee),
  haut(W.adoptee, W.vrai, 11.8, 10.8),
  greffier(W.vrai, W.bonus),
  haut(W.bonus, W.mauvaise, 11.8, 12.8),
  greffier(W.mauvaise, W.pese),
  {de: W.pese, a: W.notre, p0: [0, 14.5, 3.9], p1: [0, 15.5, 3.9], c0: [0, 0.2, -4.8]},
  haut(W.notre, W.abonne, 11.6, 12.8),
  {de: W.abonne, a: FIN + 1, p0: [0, 13.5, 3.9], p1: [0, 15.2, 3.9], c0: [0, 0.3, -4.6]},
];
const camera = (f: number): EtatAssemblee['cam'] => {
  const p = PLANS.find((x) => f >= x.de && f < x.a) ?? PLANS[PLANS.length - 1];
  const t = interpolate(f, [p.de, p.a], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return {pos: mix(p.p0, p.p1, ease(t)), cible: p.c0, fov: 40};
};

/* ------------------------------------------------------------------ état 3D */

const useEtat = (f: number): EtatAssemblee => {
  const {fps} = useVideoConfig();
  const pop = (de: number) => (f < de ? 0 : spring({frame: f - de, fps, config: {damping: 11, stiffness: 170}}));
  const choisie = entre(f, W.a, W.c) ? 0 : entre(f, W.c, W.b) ? 2 : entre(f, W.b, W.adoptee) ? 1 : -1;
  const plansGreffier = entre(f, W.vrai, W.bonus) || entre(f, W.mauvaise, W.pese);
  return {
    cam: camera(f),
    greffier: {
      humeur: entre(f, W.mauvaise, W.mariage) ? 'triste' : 'joyeux',
      bras: f >= W.abonne || entre(f, W.adoptee, W.vrai) ? 'salue' : plansGreffier || entre(f, W.mille, W.abonne) ? 'montre' : 'repos',
    },
    deputes: SIEGES.length + 1,
    bords: 0,
    president: 0,
    lignes: interpolate(f, [W.adoptee + 4, W.vrai - 4], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
    loiNom: 0,
    constitution: entre(f, W.notre, W.abonne) ? pop(W.notre + 6) : 0,
    mysteres: [0, 0, 0],
    lettres: entre(f, W.hier, W.adoptee) ? [0, 1, 2].map((i) => pop(W.hier + 6 + i * 5) * (choisie === i ? 1.3 : 1)) : [0, 0, 0],
    lettresTexte: 'ABC',
  };
};

/* ------------------------------------------------------------------ habillage 2D */

const TITRES: {de: number; a: number; petit: string; grand: string; rouge?: boolean}[] = [
  {de: 0, a: W.deux, petit: 'UNE LOI POUR TOUS', grand: 'CHOISIE PAR 2', rouge: true},
  {de: W.deux, a: W.ici, petit: 'OUI. SEULEMENT', grand: 'DEUX.', rouge: true},
  {de: W.ici, a: W.hier, petit: '1 ABONNÉ', grand: '= 1 DÉPUTÉ'},
  {de: W.hier, a: W.a, petit: 'HIER', grand: 'VOUS AVEZ VOTÉ'},
  {de: W.a, a: W.adoptee, petit: 'LE DÉPOUILLEMENT', grand: 'RÉSULTATS'},
  {de: W.adoptee, a: W.vrai, petit: 'LOI N° 1', grand: 'ADOPTÉE'},
  {de: W.vrai, a: W.smic, petit: 'EN VRAI, EN FRANCE', grand: 'LE PRIX EST LIBRE'},
  {de: W.smic, a: W.bonus, petit: '20 000 € PAR MOIS ?', grand: 'DÉSOLÉ'},
  {de: W.bonus, a: W.mauvaise, petit: 'LA SEULE PROPOSÉE', grand: 'LOI BONUS'},
  {de: W.mauvaise, a: W.mariage, petit: 'MAUVAISE NOUVELLE', grand: 'PAS TON COUPLE', rouge: true},
  {de: W.mariage, a: W.pese, petit: 'DANS LE MARIAGE', grand: 'LA FIDÉLITÉ'},
  {de: W.pese, a: W.notre, petit: 'ICI, TA VOIX', grand: 'PÈSE LOURD'},
  {de: W.notre, a: W.mille, petit: 'NOTRE ASSEMBLÉE', grand: 'N’A PAS DE CONSTITUTION'},
  {de: W.mille, a: W.abonne, petit: 'POUR L’ÉCRIRE', grand: `IL MANQUE ${1000 - ABONNES}`},
  {de: W.abonne, a: W.siege, petit: 'ABONNE-TOI ET PROPOSE', grand: 'L’ARTICLE 1'},
  {de: W.siege, a: FIN + 1, petit: 'TON PSEUDO', grand: 'SUR UN SIÈGE'},
];

const AFFICHAGE: Record<number, string> = {
  0: '*2*', 11: '*Deux.*', 24: '*300*', 25: '', 26: '€', 30: '*0*', 38: '*0*', 44: '*1,20*', 45: '€', 46: '', 48: '*2*', 95: '*20 000*', 96: '', 97: '€',
  114: '*6*', 115: '*millions*', 116: 'd’€', 130: '*3*', 134: '*300 000*', 135: '', 136: '', 137: '€', 168: '*1975.*', 169: '', 170: '', 171: '',
  178: '*2*', 191: '*1 000*', 200: '*1*',
};
const JAUNES = new Set(['député', 'voté', 'manuella', 'adoptée', 'libre', 'concurrence', 'excessive', 'smic', 'bonus', 'tromperie', 'délit', 'client', 'couple',
  'fidélité', 'lourd', 'constitution', 'abonne-toi', 'siège', 'pseudo', 'minimum', 'prison']);
const nu = (t: string) => t.toLowerCase().replace(/[.,?…!:]/g, '');
type Mot = {t: string; a: number; b: number};
const PAQUETS: Mot[][] = (() => {
  const mots = voix.mots
    .map((m, i) => ({...m, t: AFFICHAGE[i] ?? (JAUNES.has(nu(m.t)) ? `*${m.t}*` : m.t)}))
    .filter((m) => m.t !== '' && m.t !== ':' && m.t !== '!' && m.t !== '?');
  const res: Mot[][] = [];
  let cour: Mot[] = [];
  for (const m of mots) {
    cour.push(m);
    if (cour.length === 3 || /[.?…!]\*?$/.test(m.t)) { res.push(cour); cour = []; }
  }
  if (cour.length) res.push(cour);
  return res;
})();

const contour = (couleur: string, ep: number) => ({WebkitTextStroke: `${ep}px ${couleur}`, paintOrder: 'stroke fill' as const});
const COEUR = 'M12 21s-7.5-4.6-10-9.3C.4 8.3 2.4 4 6.4 4c2.2 0 3.6 1.2 4.6 2.6l1 1.4 1-1.4C14 5.2 15.4 4 17.6 4c4 0 6 4.3 4.4 7.7C19.5 16.4 12 21 12 21z';
/** Ressort qui démarre à la frame `de` (0 avant). */
const useS = (f: number) => {
  const {fps} = useVideoConfig();
  return (de: number, config: Ressort = {damping: 12}) => (f < de ? 0 : spring({frame: f - de, fps, config}));
};

const Titre: React.FC<{f: number}> = ({f}) => {
  const s = useS(f);
  const t = TITRES.find((x) => f >= x.de && f < x.a);
  if (!t) return null;
  const e = s(t.de, {damping: 12, stiffness: 200});
  const taille = t.grand.length > 18 ? 76 : t.grand.length > 15 ? 92 : t.grand.length > 12 ? 108 : 128;
  return (
    <div style={{position: 'absolute', top: 230, left: 30, right: 30, textAlign: 'center', transform: `scale(${0.6 + 0.4 * e})`, opacity: Math.min(1, e * 1.5)}}>
      <div style={{fontFamily: TEXTE, fontWeight: 900, fontSize: 46, color: '#fff', letterSpacing: 1, ...contour('#1b1d24', 12)}}>{t.petit}</div>
      <div style={{fontFamily: TITRE, fontSize: taille, lineHeight: 1.0, whiteSpace: 'nowrap', color: t.rouge ? '#ff4d5e' : '#ffc928', marginTop: 4,
        ...contour(t.rouge ? '#3a0008' : '#2b1a00', 18), textShadow: '0 8px 0 rgba(0,0,0,0.22)'}}>{t.grand}</div>
    </div>
  );
};

const SousTitre: React.FC<{t: number}> = ({t}) => {
  const i = PAQUETS.findIndex((p, k) => t >= p[0].a - 0.05 && t < (PAQUETS[k + 1]?.[0].a ?? p[p.length - 1].b + 0.4) - 0.05);
  if (i < 0) return null;
  const paquet = PAQUETS[i];
  return (
    <div style={{position: 'absolute', top: 1290, left: 60, right: 60, textAlign: 'center', fontFamily: TEXTE, fontWeight: 900, fontSize: 70, lineHeight: 1.1, ...contour('#000', 14)}}>
      {paquet.map((m, j) => (
        <span key={j} style={{color: m.t.startsWith('*') ? '#ffc928' : '#fff', opacity: t >= m.a - 0.05 ? 1 : 0.35}}>{m.t.replace(/\*/g, '')}{j < paquet.length - 1 ? ' ' : ''}</span>
      ))}
    </div>
  );
};

/** Tampon encreur qui s'écrase sur une carte. */
const Tampon: React.FC<{e: number; texte: string; couleur?: string; top?: number}> = ({e, texte, couleur = '#1f9d55', top = 120}) => {
  if (e < 0.01) return null;
  return (
    <div style={{position: 'absolute', top, right: 10, transform: `scale(${2.2 - 1.2 * e}) rotate(-9deg)`, opacity: Math.min(1, e * 1.4), border: `9px solid ${couleur}`,
      color: couleur, borderRadius: 16, padding: '4px 22px', fontFamily: TITRE, fontSize: 70, background: 'rgba(255,255,255,0.92)', whiteSpace: 'nowrap'}}>{texte}</div>
  );
};

/** Carte « commentaire » : pseudo + texte tel qu'écrit, likes éventuels. */
const Commentaire: React.FC<{pseudo: string; texte: string; e: number; likes?: number; lettre?: string; bord?: string; taille?: number}> = ({pseudo, texte, e, likes, lettre, bord = '#ffc928', taille = 44}) => (
  <div style={{transform: `scale(${e}) rotate(-1.2deg)`, background: '#fff', borderRadius: 28, padding: '18px 26px', boxShadow: '0 8px 0 rgba(0,0,0,0.18)',
    fontFamily: TEXTE, fontWeight: 900, display: 'flex', alignItems: 'center', gap: 20, border: `6px solid ${bord}`}}>
    {lettre && (
      <div style={{flex: 'none', width: 88, height: 88, borderRadius: 50, background: '#ffc928', border: '6px solid #2b1a00', display: 'flex', alignItems: 'center',
        justifyContent: 'center', fontFamily: TITRE, fontSize: 60, color: '#2b1a00'}}>{lettre}</div>
    )}
    <div style={{flex: 1}}>
      <div style={{fontSize: 30, color: '#8a8f99'}}>{pseudo}</div>
      <div style={{fontSize: taille, color: '#1b1d24', lineHeight: 1.1}}>{texte}</div>
    </div>
    {likes !== undefined && (
      <div style={{flex: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#ff3b5c', fontSize: 32}}>
        <svg width="48" height="48" viewBox="0 0 24 24"><path fill="#ff3b5c" d={COEUR} /></svg>{likes}
      </div>
    )}
  </div>
);

/** Extrait d'un vrai texte, avec sa source. */
const Texte: React.FC<{e: number; source: string; titre: string; citation: React.ReactNode}> = ({e, source, titre, citation}) => (
  <div style={{transform: `scale(${e}) rotate(1deg)`, background: '#fffaf0', borderRadius: 18, padding: '26px 34px 22px', border: '5px solid #1b1d24',
    boxShadow: '12px 12px 0 rgba(27,29,36,0.85)', fontFamily: TEXTE, fontWeight: 900}}>
    <div style={{fontSize: 30, color: '#b0261f', letterSpacing: 1}}>{titre}</div>
    <div style={{fontFamily: 'Georgia, serif', fontWeight: 700, fontSize: 48, color: '#1b1d24', lineHeight: 1.22, marginTop: 12}}>{citation}</div>
    <div style={{fontSize: 24, color: '#8a8f99', marginTop: 16}}>Source : {source}</div>
  </div>
);
const Surligne: React.FC<{children: React.ReactNode; p: number}> = ({children, p}) => (
  <span style={{backgroundImage: 'linear-gradient(#ffe14d,#ffe14d)', backgroundRepeat: 'no-repeat', backgroundSize: `${p * 100}% 100%`, padding: '0 4px'}}>{children}</span>
);

/** Compteur d'abonnés (« 1 abonné = 1 député ») ou jauge vers la Constitution avec la part manquante qui clignote. */
const Jauge: React.FC<{f: number; de: number; a: number; manque?: boolean}> = ({f, de, a, manque}) => {
  const s = useS(f);
  if (f < de || f >= a) return null;
  const n = Math.round(interpolate(f, [de + 4, de + 40], [manque ? ABONNES : 0, ABONNES], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.quad)}));
  const clign = 0.55 + 0.45 * Math.abs(Math.sin((f - de) / 7));
  return (
    <div style={{position: 'absolute', top: 560, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22, transform: `scale(${s(de + 2)})`}}>
      <div style={{background: '#1b1d24', border: '6px solid #ffc928', borderRadius: 26, padding: '10px 34px', fontFamily: TEXTE, fontWeight: 900,
        fontSize: 58, color: '#ffc928', letterSpacing: 2, display: 'flex', gap: 18}}>
        <span style={{color: '#fff'}}>DÉPUTÉS</span> {n}
      </div>
      <div style={{width: 820, background: '#1b1d24', borderRadius: 22, padding: 10, border: '5px solid #fff', position: 'relative'}}>
        <div style={{height: 46, width: `${(n / 1000) * 100}%`, background: '#ffc928', borderRadius: 14}} />
        {manque && <div style={{position: 'absolute', top: 10, bottom: 10, left: `calc(${ABONNES / 10}% + 4px)`, right: 10, borderRadius: 14,
          background: `repeating-linear-gradient(45deg, rgba(255,77,94,${clign}) 0 18px, rgba(255,77,94,0.25) 18px 36px)`}} />}
      </div>
      <div style={{fontFamily: TEXTE, fontWeight: 900, fontSize: 38, color: '#fff', ...contour('#1b1d24', 10)}}>{n} / 1 000 → 📜 LA CONSTITUTION</div>
    </div>
  );
};

/** Accroche : les deux seuls votes, tels qu'écrits. */
const Accroche: React.FC<{f: number}> = ({f}) => {
  const s = useS(f);
  if (f >= W.ici) return null;
  return (
    <div style={{position: 'absolute', top: 600, left: 70, right: 70, display: 'flex', flexDirection: 'column', gap: 26}}>
      <Commentaire pseudo="@abonne_111" texte="B 😅" e={s(8)} taille={56} />
      <Commentaire pseudo="@abonne_110" texte="Mmh je dirais B…" e={s(22)} taille={48} />
      <div style={{alignSelf: 'center', transform: `scale(${s(W.deux, SEC)})`, background: '#1b1d24', border: '6px solid #ff4d5e', borderRadius: 26, padding: '8px 34px',
        fontFamily: TITRE, fontSize: 72, color: '#ff4d5e'}}>2 VOTES · {ABONNES} DÉPUTÉS</div>
    </div>
  );
};

/** Dépouillement : A, C, puis B. */
const Depouillement: React.FC<{f: number}> = ({f}) => {
  const s = useS(f);
  if (f < W.a || f >= W.adoptee) return null;
  return (
    <div style={{position: 'absolute', top: 520, left: 70, right: 70, background: 'rgba(27,29,36,0.9)', borderRadius: 30, padding: '26px 30px', border: '6px solid #ffc928',
      display: 'flex', flexDirection: 'column', gap: 22}}>
      {VOTES.map((v) => {
        const p = interpolate(f, [v.de + 4, v.de + 34], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
        const gagne = v.lettre === 'B' && f >= W.b + 36;
        return (
          <div key={v.lettre} style={{display: 'flex', alignItems: 'center', gap: 18, opacity: f >= v.de ? 1 : 0.25}}>
            <div style={{width: 76, height: 76, borderRadius: 40, background: '#ffc928', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: TITRE, fontSize: 52, color: '#2b1a00', flex: 'none'}}>{v.lettre}</div>
            <div style={{flex: 1}}>
              <div style={{fontFamily: TEXTE, fontWeight: 900, fontSize: 28, color: '#fff'}}>{v.court}</div>
              <div style={{height: 40, marginTop: 6, width: `${((p * v.voix) / 2) * 100}%`, minWidth: f >= v.de ? 8 : 0, background: '#ffc928', borderRadius: 12,
                boxShadow: gagne ? `0 0 ${20 + 10 * Math.sin(f / 4)}px #ffc928` : 'none'}} />
            </div>
            <div style={{fontFamily: TITRE, fontSize: 64, color: '#ffc928', width: 90, textAlign: 'right'}}>{Math.round(p * v.voix)}</div>
          </div>
        );
      })}
      <div style={{position: 'absolute', bottom: -70, left: 0, right: 0, textAlign: 'center', transform: `scale(${s(W.b + 36, SEC)})`}}>
        <span style={{background: '#1f9d55', color: '#fff', fontFamily: TITRE, fontSize: 56, padding: '8px 30px', borderRadius: 30, border: '6px solid #fff'}}>B GAGNE · 2 À 0</span>
      </div>
    </div>
  );
};

/** La loi B écrite au nom de son autrice. */
const LoiAdoptee: React.FC<{f: number}> = ({f}) => {
  const s = useS(f);
  if (f < W.adoptee || f >= W.vrai) return null;
  return (
    <div style={{position: 'absolute', top: 900, left: 50, right: 50}}>
      <Commentaire pseudo={`LOI N° 1 · ${LOI_B.pseudo}`} texte={LOI_B.loi} e={s(W.adoptee + 2)} lettre="B" />
      <Tampon e={s(W.adoptee + 14, SEC)} texte="ADOPTÉE" top={-110} />
    </div>
  );
};

/** « En vrai » : le code de commerce (prix libres, sauf mesures temporaires), puis le SMIC. */
const EnVrai: React.FC<{f: number}> = ({f}) => {
  const s = useS(f);
  if (f >= W.vrai && f < W.smic) {
    const p1 = interpolate(f, [M(74), M(80) + 10], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
    const p2 = interpolate(f, [M(84), M(92)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
    const al3 = f >= W.gouv;
    return (
      <div style={{position: 'absolute', top: 540, left: 60, right: 60}}>
        <Texte e={s(W.vrai + 4)} titre={al3 ? 'CODE DE COMMERCE · ARTICLE L410-2, ALINÉA 3' : 'CODE DE COMMERCE · ARTICLE L410-2'} source="legifrance.gouv.fr"
          citation={al3
            ? <>« Le Gouvernement [peut arrêter] <Surligne p={p2}>contre des hausses ou des baisses excessives de prix, des mesures temporaires</Surligne> motivées (…) »</>
            : <>« Sauf dans les cas où la loi en dispose autrement, les prix (…) sont <Surligne p={p1}>librement déterminés par le jeu de la concurrence</Surligne>. »</>} />
      </div>
    );
  }
  if (f >= W.smic && f < W.bonus) {
    return (
      <div style={{position: 'absolute', top: 640, left: 80, right: 80}}>
        <Commentaire pseudo={LOI_B.pseudo} texte="20 000 € par mois de salaire" e={s(W.smic + 2)} taille={54} />
        <Tampon e={s(M(105), SEC)} texte="LA LOI : UN MINIMUM" couleur="#e0283f" top={170} />
      </div>
    );
  }
  return null;
};

/** Loi bonus (la tromperie), le vrai délit, puis le mariage. */
const LoiBonus: React.FC<{f: number}> = ({f}) => {
  const s = useS(f);
  if (f >= W.bonus && f < W.mauvaise) {
    const p = interpolate(f, [M(130), M(138) + 10], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
    return (
      <div style={{position: 'absolute', top: 520, left: 50, right: 50, display: 'flex', flexDirection: 'column', gap: 34}}>
        <Commentaire pseudo={BONUS.pseudo} texte={BONUS.loi} likes={BONUS.likes} e={s(W.bonus + 4)} taille={42} />
        {f >= W.bonne && (
          <Texte e={s(W.bonne + 2)} titre="CODE DE LA CONSOMMATION · ARTICLE L454-1" source="legifrance.gouv.fr"
            citation={<>« La violation de l’interdiction [de tromperie] est punie d’<Surligne p={p}>une peine d’emprisonnement de trois ans et d’une amende de 300 000 euros</Surligne>. »</>} />
        )}
      </div>
    );
  }
  if (f >= W.mauvaise && f < W.mariage) {
    const lignes = [
      {t: '🛒 Tromper un CLIENT', v: 'DÉLIT', c: '#1f9d55', de: M(145)},
      {t: '💔 Tromper son COUPLE', v: 'NON', c: '#e0283f', de: M(148)},
    ];
    return (
      <div style={{position: 'absolute', top: 600, left: 70, right: 70, display: 'flex', flexDirection: 'column', gap: 26}}>
        {lignes.map((l) => (
          <div key={l.t} style={{transform: `scale(${s(l.de)})`, background: '#fff', border: `7px solid ${l.c}`, borderRadius: 28, padding: '20px 28px', display: 'flex',
            justifyContent: 'space-between', alignItems: 'center', fontFamily: TEXTE, fontWeight: 900, fontSize: 46, color: '#1b1d24', boxShadow: '0 8px 0 rgba(0,0,0,0.18)'}}>
            <span>{l.t}</span><span style={{fontFamily: TITRE, fontSize: 60, color: l.c}}>{l.v}</span>
          </div>
        ))}
      </div>
    );
  }
  if (f >= W.mariage && f < W.pese) {
    const p = interpolate(f, [M(157), M(159) + 10], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
    return (
      <div style={{position: 'absolute', top: 600, left: 70, right: 70}}>
        <Texte e={s(W.mariage + 4)} titre="CODE CIVIL · ARTICLE 212" source="legifrance.gouv.fr"
          citation={<>« Les époux se doivent mutuellement respect, <Surligne p={p}>fidélité</Surligne>, secours, assistance. »</>} />
        <Tampon e={s(M(165), SEC)} texte="PLUS UN DÉLIT DEPUIS 1975" couleur="#e0283f" top={250} />
      </div>
    );
  }
  return null;
};

/** « Ta voix pèse lourd » : 2 votes ont suffi. */
const Poids: React.FC<{f: number}> = ({f}) => {
  const s = useS(f);
  if (f < W.pese || f >= W.notre) return null;
  return (
    <div style={{position: 'absolute', top: 600, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20}}>
      <div style={{transform: `scale(${s(W.pese + 4)})`, background: '#1b1d24', border: '8px solid #ffc928', borderRadius: 40, padding: '20px 50px', fontFamily: TITRE,
        fontSize: 110, color: '#ffc928'}}>2 VOTES</div>
      <div style={{transform: `scale(${s(W.pese + 16)})`, fontFamily: TITRE, fontSize: 80, color: '#fff', ...contour('#1b1d24', 16)}}>=</div>
      <div style={{transform: `scale(${s(W.pese + 28, SEC)})`, background: '#1f9d55', border: '8px solid #fff', borderRadius: 40, padding: '20px 50px', fontFamily: TITRE,
        fontSize: 110, color: '#fff'}}>1 LOI</div>
    </div>
  );
};

/** Notre Constitution : page vide. */
const Constitution: React.FC<{f: number}> = ({f}) => {
  const s = useS(f);
  if (f < W.notre || f >= W.mille) return null;
  return (
    <div style={{position: 'absolute', top: 560, left: 150, right: 150, transform: `scale(${s(W.notre + 4)}) rotate(-1deg)`}}>
      <div style={{background: '#fffaf0', border: '5px solid #1b1d24', borderRadius: 18, padding: '30px 36px', boxShadow: '12px 12px 0 rgba(27,29,36,0.85)'}}>
        <div style={{fontFamily: TITRE, fontSize: 60, color: '#1b1d24', textAlign: 'center'}}>CONSTITUTION</div>
        <div style={{fontFamily: TEXTE, fontWeight: 900, fontSize: 28, color: '#8a8f99', textAlign: 'center'}}>de l’Assemblée des Abonnés</div>
        {[1, 2, 3].map((k) => (
          <div key={k} style={{fontFamily: TEXTE, fontWeight: 900, fontSize: 36, color: '#1b1d24', marginTop: 20, display: 'flex', gap: 14, alignItems: 'center'}}>
            Art. {k}<div style={{flex: 1, borderBottom: '4px dotted #b9b2a3', height: 20}} />
          </div>
        ))}
        <div style={{fontFamily: TITRE, fontSize: 44, color: '#e0283f', textAlign: 'center', marginTop: 20}}>PAGE VIDE</div>
      </div>
    </div>
  );
};

/** Appel final : proposer l'article 1, puis la promesse du siège à son pseudo. */
const Appel: React.FC<{f: number}> = ({f}) => {
  const s = useS(f);
  if (f < W.abonne) return null;
  if (f < W.siege) {
    const likes = Math.round(interpolate(f, [W.abonne + 10, W.siege], [1, 999], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.in(Easing.quad)}));
    return (
      <div style={{position: 'absolute', top: 600, left: 70, right: 70}}>
        <Commentaire pseudo="@toi · à l’instant" texte="Article 1 : ta proposition ici ✍️" e={s(W.abonne + 6)} taille={48} likes={likes} />
      </div>
    );
  }
  return (
    <div style={{position: 'absolute', top: 520, left: 40, right: 40, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 14}}>
      {PSEUDOS.map((p, i) => {
        const e = s(W.siege + 3 + i * 3, {damping: 10, stiffness: 220});
        const toi = p === '@toi ?';
        return (
          <div key={p} style={{transform: `scale(${e})`, background: toi ? '#fe2c55' : '#1b1d24', color: toi ? '#fff' : '#ffc928', fontFamily: TEXTE, fontWeight: 900,
            fontSize: toi ? 44 : 30, padding: '10px 20px', borderRadius: 18, border: `4px solid ${toi ? '#fff' : '#ffc928'}`, display: 'flex', alignItems: 'center', gap: 10}}>
            <span>💺</span>{p}
          </div>
        );
      })}
    </div>
  );
};

const BoutonAbonne: React.FC<{f: number}> = ({f}) => {
  const s = useS(f);
  const de = W.abonne + 2;
  if (f < de) return null;
  const e = s(de, {damping: 10});
  const fait = f >= de + 26;
  const clic = s(de + 26, {damping: 8, stiffness: 300});
  return (
    <div style={{position: 'absolute', top: 1500, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
      <div style={{transform: `scale(${e * (1 + 0.12 * Math.sin(clic * Math.PI))})`, background: fait ? '#8a8f99' : '#fe2c55', color: '#fff',
        fontFamily: TEXTE, fontWeight: 900, fontSize: 58, padding: '18px 60px', borderRadius: 60, border: '6px solid #fff',
        boxShadow: '0 10px 0 rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', gap: 18}}>
        {fait ? 'ABONNÉ' : "S'ABONNER"}
        {fait && <svg width="50" height="50" viewBox="0 0 24 24"><path fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" d="M4 12.5l5 5L20 6.5" /></svg>}
      </div>
    </div>
  );
};

const Confettis: React.FC<{f: number; de: number; a: number}> = ({f, de, a}) => {
  if (f < de || f >= a) return null;
  const t = f - de;
  const couleurs = ['#ffc928', '#fe2c55', '#3f7fd9', '#2bb39b', '#ffffff', '#9b59d0'];
  return (
    <>
      {Array.from({length: 70}).map((_, i) => {
        const x = (Math.sin(i * 91.7) * 0.5 + 0.5) * 1080;
        const v = 14 + (Math.sin(i * 13.1) * 0.5 + 0.5) * 16;
        const y = -60 + t * v - (i % 7) * 40;
        return <div key={i} style={{position: 'absolute', left: x + Math.sin(t / 6 + i) * 30, top: y, width: 20, height: 34,
          background: couleurs[i % couleurs.length], transform: `rotate(${t * 12 + i * 40}deg)`, borderRadius: 4}} />;
      })}
    </>
  );
};

const usePolicesPretes = () => {
  const [pret, setPret] = useState(false);
  const [poignee] = useState(() => delayRender('polices assemblée yt ep03'));
  useEffect(() => {
    Promise.all([lilita.waitUntilDone(), montserrat.waitUntilDone()]).then(() => { setPret(true); continueRender(poignee); });
  }, [poignee]);
  return pret;
};

export const AssembleeYouTubeEp03: React.FC = () => {
  const f = useCurrentFrame();
  const {width, height} = useVideoConfig();
  const pret = usePolicesPretes();
  const etat = useEtat(f);
  return (
    <AbsoluteFill style={{background: '#f3e3c3'}}>
      {pret && (
        <ThreeCanvas width={width} height={height} shadows camera={{fov: 40, near: 0.1, far: 300}} gl={{antialias: true}}>
          <Hemicycle etat={etat} />
        </ThreeCanvas>
      )}
      <Titre f={f} />
      <Accroche f={f} />
      <Jauge f={f} de={W.ici} a={W.hier} />
      <Depouillement f={f} />
      <LoiAdoptee f={f} />
      <EnVrai f={f} />
      <LoiBonus f={f} />
      <Poids f={f} />
      <Constitution f={f} />
      <Jauge f={f} de={W.mille} a={W.abonne} manque />
      <Appel f={f} />
      <SousTitre t={f / 30} />
      <BoutonAbonne f={f} />
      <Confettis f={f} de={W.b + 36} a={W.adoptee + 30} />
      <Confettis f={f} de={W.siege + 20} a={FIN + 1} />
      <Audio src={staticFile('assemblee/youtube_ep03_voix.wav')} />
    </AbsoluteFill>
  );
};
