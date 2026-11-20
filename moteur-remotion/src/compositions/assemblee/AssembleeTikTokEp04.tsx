import {loadFont as chargerLilita} from '@remotion/google-fonts/LilitaOne';
import {loadFont as chargerMontserrat} from '@remotion/google-fonts/Montserrat';
import {ThreeCanvas} from '@remotion/three';
import {useEffect, useState} from 'react';
import {AbsoluteFill, Audio, Easing, continueRender, delayRender, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import voix from './tiktok_ep04_voix.json';
import {EtatAssemblee, Hemicycle, SIEGES} from './Assemblee3D';

/* Épisode 4, branche TikTok — conçu pour être compris SANS les épisodes précédents (l'ép. 3 a fait 463 vues).
   Commentaires de l'ép. 3 relevés le 13/11/2026 (vidéo 7706602321769270560) : article 1 le plus liké = @abonne_75 (3 likes).
   Abonnés TikTok : 748. Textes vérifiés sur conseil-constitutionnel.fr (Constitution de 1958, art. 1 et art. 8).
   Mécanique : « identifie un pote et donne-lui un ministère » (chaque identification touche un non-abonné). */

const lilita = chargerLilita('normal', {subsets: ['latin', 'latin-ext']});
const montserrat = chargerMontserrat('normal', {weights: ['900'], subsets: ['latin', 'latin-ext']});
const TITRE = lilita.fontFamily;
const TEXTE = montserrat.fontFamily;

const ABONNES = 748;
const FIN_VOIX = voix.duree + 1.3;
export const DUREE_ASSEMBLEE_TT04 = Math.ceil(FIN_VOIX * 30);

const M = (i: number) => Math.round((voix.mots[i].a - 0.08) * 30);
const FIN = Math.round(FIN_VOIX * 30);
const W = {
  recopie: M(9), ici: M(18), demande: M(30), plus: M(36), vrai: M(40), presque: M(56), adopte: M(60), promis: M(64), gouv: M(72), france: M(81),
  vous: M(90), identifie: M(93), likes: M(102), abonne: M(110),
};

type V3 = [number, number, number];
type Ressort = {damping?: number; stiffness?: number};
const ease = Easing.inOut(Easing.cubic);
const mix = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const entre = (f: number, de: number, a: number) => f >= de && f < a;
const SEC: Ressort = {damping: 9, stiffness: 260};

/* ------------------------------------------------------------------ données réelles */

const ARTICLE = {pseudo: '@abonne_75', texte: 'Article 1 : toute personne, malgré leur appartenance, leur religion et leur origine, sont égaux face à la justice', likes: 3};
// tous ceux qui ont commenté sous l'épisode 3 (promesse : « chaque pseudo aura son siège »)
const PSEUDOS = ['@abonne_75', '@abonne_57', '@abonne_76', '@abonne_74', '@abonne_72', '@abonne_77', '@abonne_78', '@abonne_79', '@abonne_09',
  '@abonne_80', '@abonne_24'];
const MINISTERES = ['ministre de la sieste 😴', 'ministre des devoirs 📚', 'ministre de la PlayStation 🎮', 'ministre du kebab 🥙'];

/* ------------------------------------------------------------------ caméra */

type Plan = {de: number; a: number; p0: V3; p1: V3; c0: V3};
const GREFFIER_YEUX: V3 = [0, 1.95, 2.75];
const haut = (de: number, a: number, z0 = 12.6, z1 = 11.6): Plan => ({de, a, p0: [0, z0, 3.9], p1: [0, z1, 3.7], c0: [0, 0.2, -3.0]});
const large = (de: number, a: number, z0 = 13.5, z1 = 15.2): Plan => ({de, a, p0: [0, z0, 3.9], p1: [0, z1, 3.9], c0: [0, 0.3, -4.6]});
const greffier = (de: number, a: number): Plan => ({de, a, p0: [0.5, 2.3, -0.7], p1: [0.3, 2.2, -0.2], c0: GREFFIER_YEUX});
const PLANS: Plan[] = [
  haut(0, W.ici, 10.8, 11.8),
  large(W.ici, W.demande),
  greffier(W.demande, W.vrai),
  haut(W.vrai, W.promis, 11.8, 10.8),
  large(W.promis, W.gouv, 14.2, 15.4),
  greffier(W.gouv, W.identifie),
  large(W.identifie, FIN + 1),
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
  const plansGreffier = entre(f, W.demande, W.vrai) || entre(f, W.gouv, W.identifie);
  return {
    cam: camera(f),
    greffier: {
      humeur: 'joyeux',
      bras: entre(f, W.adopte, W.promis) || f >= W.abonne ? 'salue' : plansGreffier ? 'montre' : 'repos',
    },
    deputes: SIEGES.length + 1,
    bords: 0,
    president: !plansGreffier ? 1 : 0,
    presidentNom: '@abonne_54',
    lignes: interpolate(f, [W.adopte, W.promis], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
    constitution: entre(f, W.vrai, W.promis) ? pop(W.vrai + 4) : 0,
    mysteres: [0, 0, 0],
    lettres: [0, 0, 0],
    lettresTexte: 'ABC',
  };
};

/* ------------------------------------------------------------------ habillage 2D */

const TITRES: {de: number; a: number; petit: string; grand: string; rouge?: boolean}[] = [
  {de: 0, a: W.recopie, petit: 'UN ABONNÉ A ÉCRIT', grand: 'L’ARTICLE 1'},
  {de: W.recopie, a: W.ici, petit: 'SANS LE SAVOIR', grand: 'IL A RECOPIÉ LA VRAIE', rouge: true},
  {de: W.ici, a: W.demande, petit: '1 ABONNÉ', grand: '= 1 DÉPUTÉ'},
  {de: W.demande, a: W.vrai, petit: 'VOTRE ARTICLE 1', grand: 'LE PLUS LIKÉ'},
  {de: W.vrai, a: W.presque, petit: 'LE VRAI · 1958', grand: 'ARTICLE PREMIER'},
  {de: W.presque, a: W.promis, petit: 'PRESQUE MOT POUR MOT', grand: 'ADOPTÉ'},
  {de: W.promis, a: W.gouv, petit: 'PROMESSE TENUE', grand: 'VOS SIÈGES'},
  {de: W.gouv, a: W.france, petit: 'IL MANQUE', grand: 'UN GOUVERNEMENT'},
  {de: W.france, a: W.vous, petit: 'EN FRANCE', grand: 'LE PRÉSIDENT NOMME'},
  {de: W.vous, a: W.identifie, petit: 'ICI', grand: 'C’EST VOUS'},
  {de: W.identifie, a: W.abonne, petit: 'IDENTIFIE UN POTE', grand: 'DONNE-LUI UN MINISTÈRE'},
  {de: W.abonne, a: FIN + 1, petit: 'ABONNE-TOI POUR VOIR', grand: 'QUI SERA MINISTRE'},
];

const AFFICHAGE: Record<number, string> = {5: '*1*', 35: '*1.*', 45: '*1*', 52: '*1958.*', 53: '', 54: '', 55: '', 61: '*1*'};
const JAUNES = new Set(['constitution.', 'constitution', 'recopié', 'vraie.', 'député.', 'liké.', 'française,', 'mot.', 'adopté.', 'siège.', 'gouvernement.', 'ministres.',
  'vous.', 'pote', 'ministère.', 'nommés', 'abonne-toi', 'ministre.']);
const nu = (t: string) => t.toLowerCase().replace(/[.,?…!:]/g, '');
type Mot = {t: string; a: number; b: number};
const PAQUETS: Mot[][] = (() => {
  const mots = voix.mots
    .map((m, i) => ({...m, t: AFFICHAGE[i] ?? (JAUNES.has(m.t.toLowerCase()) || JAUNES.has(nu(m.t)) ? `*${m.t}*` : m.t)}))
    .filter((m) => m.t !== '' && m.t !== ':');
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

/** Accroche : le commentaire qui a écrit l'article 1. */
const Accroche: React.FC<{f: number}> = ({f}) => {
  const s = useS(f);
  if (f >= W.ici) return null;
  return (
    <div style={{position: 'absolute', top: 640, left: 60, right: 60}}>
      <Commentaire pseudo={ARTICLE.pseudo} texte={ARTICLE.texte} likes={ARTICLE.likes} e={s(4)} taille={42} />
      {f >= W.recopie && (
        <div style={{marginTop: 34, display: 'flex', justifyContent: 'center', transform: `scale(${s(W.recopie + 6, SEC)})`}}>
          <span style={{background: '#1b1d24', border: '6px solid #ff4d5e', color: '#ff4d5e', fontFamily: TITRE, fontSize: 64, padding: '6px 30px', borderRadius: 24}}>= CONSTITUTION DE 1958 ?</span>
        </div>
      )}
    </div>
  );
};

/** L'article 1 proposé, puis le vrai, côte à côte. */
const Article: React.FC<{f: number}> = ({f}) => {
  const s = useS(f);
  if (f >= W.demande && f < W.vrai) {
    return (
      <div style={{position: 'absolute', top: 620, left: 60, right: 60}}>
        <Commentaire pseudo={ARTICLE.pseudo} texte={ARTICLE.texte} likes={ARTICLE.likes} e={s(W.plus)} taille={44} />
      </div>
    );
  }
  if (f >= W.vrai && f < W.presque) {
    const p = interpolate(f, [M(46), M(55) + 10], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
    return (
      <div style={{position: 'absolute', top: 560, left: 60, right: 60}}>
        <Texte e={s(W.vrai + 4)} titre="CONSTITUTION DU 4 OCTOBRE 1958 · ARTICLE PREMIER" source="conseil-constitutionnel.fr"
          citation={<>« La France est une République indivisible, laïque, démocratique et sociale. Elle assure <Surligne p={p}>l’égalité devant la loi de tous les citoyens sans distinction d’origine, de race ou de religion</Surligne>. »</>} />
      </div>
    );
  }
  if (f >= W.presque && f < W.promis) {
    return (
      <div style={{position: 'absolute', top: 540, left: 130, right: 130, transform: `scale(${s(W.presque + 2)}) rotate(-1deg)`}}>
        <div style={{position: 'relative', background: '#fffaf0', border: '5px solid #1b1d24', borderRadius: 18, padding: '30px 36px', boxShadow: '12px 12px 0 rgba(27,29,36,0.85)'}}>
          <div style={{fontFamily: TITRE, fontSize: 60, color: '#1b1d24', textAlign: 'center'}}>CONSTITUTION</div>
          <div style={{fontFamily: TEXTE, fontWeight: 900, fontSize: 28, color: '#8a8f99', textAlign: 'center'}}>de l’Assemblée des Abonnés</div>
          <div style={{fontFamily: TEXTE, fontWeight: 900, fontSize: 34, color: '#1b1d24', marginTop: 22, lineHeight: 1.2}}>
            Art. 1 · <span style={{background: '#ffe14d', padding: '0 6px'}}>Égalité face à la justice, sans distinction d’appartenance, de religion ou d’origine.</span>
            <div style={{fontSize: 24, color: '#8a8f99', marginTop: 6}}>— proposé par {ARTICLE.pseudo}</div>
          </div>
          {[2, 3].map((k) => (
            <div key={k} style={{fontFamily: TEXTE, fontWeight: 900, fontSize: 34, color: '#1b1d24', marginTop: 18, display: 'flex', gap: 14, alignItems: 'center'}}>
              Art. {k}<div style={{flex: 1, borderBottom: '4px dotted #b9b2a3', height: 20}} />
            </div>
          ))}
          <Tampon e={s(W.adopte + 6, SEC)} texte="ADOPTÉ" top={-60} />
        </div>
      </div>
    );
  }
  return null;
};

/** Promesse tenue : chaque pseudo de l'épisode 3 sur un siège. */
const Sieges: React.FC<{f: number}> = ({f}) => {
  const s = useS(f);
  if (f < W.promis || f >= W.gouv) return null;
  return (
    <div style={{position: 'absolute', top: 540, left: 40, right: 40, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 14}}>
      {PSEUDOS.map((p, i) => (
        <div key={p} style={{transform: `scale(${s(W.promis + 4 + i * 3, {damping: 10, stiffness: 220})})`, background: '#1b1d24', color: '#ffc928', fontFamily: TEXTE,
          fontWeight: 900, fontSize: 28, padding: '9px 16px', borderRadius: 18, border: '4px solid #ffc928', display: 'flex', alignItems: 'center', gap: 10}}>
          <span>💺</span>{p}
        </div>
      ))}
    </div>
  );
};

/** Le banc des ministres vide, puis l'article 8. */
const Gouvernement: React.FC<{f: number}> = ({f}) => {
  const s = useS(f);
  if (f >= W.gouv && f < W.france) {
    return (
      <div style={{position: 'absolute', top: 560, left: 60, right: 60, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24}}>
        {['PREMIER MINISTRE', 'ÉCONOMIE', 'ÉDUCATION', 'SPORTS'].map((m, i) => (
          <div key={m} style={{transform: `scale(${s(W.gouv + 6 + i * 5)})`, background: 'rgba(27,29,36,0.9)', border: '5px dashed #ffc928', borderRadius: 26, padding: '22px 14px',
            textAlign: 'center', fontFamily: TEXTE, fontWeight: 900}}>
            <div style={{fontSize: 64}}>🪑</div>
            <div style={{fontSize: 26, color: '#fff'}}>{m}</div>
            <div style={{fontFamily: TITRE, fontSize: 52, color: '#ff4d5e'}}>VIDE</div>
          </div>
        ))}
      </div>
    );
  }
  if (f >= W.france && f < W.identifie) {
    const p = interpolate(f, [M(85), M(89) + 10], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
    return (
      <div style={{position: 'absolute', top: 580, left: 60, right: 60}}>
        <Texte e={s(W.france + 4)} titre="CONSTITUTION · ARTICLE 8" source="conseil-constitutionnel.fr"
          citation={<>« Le Président de la République <Surligne p={p}>nomme le Premier ministre</Surligne>. (…) Sur la proposition du Premier ministre, <Surligne p={p}>il nomme les autres membres du Gouvernement</Surligne> (…) »</>} />
        <Tampon e={s(W.vous + 4, SEC)} texte="ICI : C’EST VOUS" top={280} />
      </div>
    );
  }
  return null;
};

/** L'appel : identifier un pote avec un ministère, exemples qui s'empilent. */
const Identifie: React.FC<{f: number}> = ({f}) => {
  const s = useS(f);
  if (f < W.identifie) return null;
  return (
    <div style={{position: 'absolute', top: 560, left: 60, right: 60, display: 'flex', flexDirection: 'column', gap: 18}}>
      {MINISTERES.map((m, i) => {
        const de = W.identifie + 8 + i * 14;
        const likes = Math.round(interpolate(f, [de, FIN], [0, [312, 187, 96, 41][i]], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.quad)}));
        return <Commentaire key={m} pseudo="@toi · à l’instant" texte={`@ton_pote ${m}`} likes={likes} e={s(de)} taille={40} />;
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
  const [poignee] = useState(() => delayRender('polices assemblée ep04'));
  useEffect(() => {
    Promise.all([lilita.waitUntilDone(), montserrat.waitUntilDone()]).then(() => { setPret(true); continueRender(poignee); });
  }, [poignee]);
  return pret;
};

export const AssembleeTikTokEp04: React.FC = () => {
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
      <Jauge f={f} de={W.ici} a={W.demande} />
      <Article f={f} />
      <Sieges f={f} />
      <Gouvernement f={f} />
      <Identifie f={f} />
      <SousTitre t={f / 30} />
      <BoutonAbonne f={f} />
      <Confettis f={f} de={W.adopte + 10} a={W.promis + 20} />
      <Confettis f={f} de={W.abonne + 20} a={FIN + 1} />
      <Audio src={staticFile('assemblee/tiktok_ep04_voix.wav')} />
    </AbsoluteFill>
  );
};
