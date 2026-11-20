import {loadFont as chargerLilita} from '@remotion/google-fonts/LilitaOne';
import {loadFont as chargerMontserrat} from '@remotion/google-fonts/Montserrat';
import {ThreeCanvas} from '@remotion/three';
import {useEffect, useState} from 'react';
import {AbsoluteFill, Audio, Easing, continueRender, delayRender, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import voix from './tiktok_ep05_voix.json';
import {EtatAssemblee, Hemicycle, SIEGES} from './Assemblee3D';

/* Épisode 5, branche TikTok — pilote autonome (compris sans les épisodes précédents).
   Commentaires de l'ép. 4 relevés le 14/11/2026 (vidéo 7707704493906906401, 794 vues, 32 commentaires) :
   presque personne n'a identifié de pote, les abonnés se sont proposés EUX-MÊMES → 4 candidats au poste de Premier ministre.
   Mécanique : vote numéroté 1/2/3/4 en commentaire + « candidats, envoyez la vidéo à vos potes » (chaque candidat fait campagne = partages).
   Ministères non disputés (ou le plus liké) nommés à l'écran. Vrai droit : Constitution art. 49 (motion de censure), art. 50,
   texte lu sur conseil-constitutionnel.fr le 14/11/2026 ; censure du gouvernement Barnier le 4 décembre 2024. Abonnés TikTok : 759. */

const lilita = chargerLilita('normal', {subsets: ['latin', 'latin-ext']});
const montserrat = chargerMontserrat('normal', {weights: ['900'], subsets: ['latin', 'latin-ext']});
const TITRE = lilita.fontFamily;
const TEXTE = montserrat.fontFamily;

const ABONNES = 759;
const FIN_VOIX = voix.duree + 1.3;
export const DUREE_ASSEMBLEE_TT05 = Math.ceil(FIN_VOIX * 30);

const M = (i: number) => Math.round((voix.mots[i].a - 0.08) * 30);
const FIN = Math.round(FIN_VOIX * 30);
const W = {
  ici: M(12), c1: M(23), c2: M(31), c3: M(43), c4: M(51), commente: M(62), candidats: M(68), reste: M(79), pseudos: M(85),
  attention: M(90), censure: M(99), barnier: M(106), aussi: M(117), alors: M(129), abonne: M(136),
};

type V3 = [number, number, number];
type Ressort = {damping?: number; stiffness?: number};
const ease = Easing.inOut(Easing.cubic);
const mix = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const entre = (f: number, de: number, a: number) => f >= de && f < a;
const SEC: Ressort = {damping: 9, stiffness: 260};

/* ------------------------------------------------------------------ données réelles */

const CANDIDATS = [
  {n: 1, pseudo: '@abonne_56', texte: 'Article 2 : L’état est le garant de la souveraineté, l’indépendance nationale et de la protection de chaque français', likes: 1, mot: 'PROTÉGER CHAQUE FRANÇAIS'},
  {n: 2, pseudo: '@abonne_81', texte: 'toute Personne enfraignant la justice doit être puni comme n’importe quelle citoyen. Ps je voudrais être 1 er ministre.', likes: 1, mot: 'LA MÊME JUSTICE POUR TOUS'},
  {n: 3, pseudo: '@abonne_74', texte: 'moi premier ministre', likes: 0, mot: 'IL VOULAIT TAXER L’OXYGÈNE'},
  {n: 4, pseudo: '@abonne_82', texte: 'moi 1 er ministre stp', likes: 0, mot: 'IL A DIT « STP »'},
];
// ministère → pseudo (seul candidat, ou le plus liké sous l'ép. 4)
const GOUV: [string, string][] = [
  ['ÉCONOMIE', '@abonne_19'], ['AFF. ÉTRANGÈRES', '@abonne_83'], ['INTÉRIEUR', '@abonne_84'], ['JUSTICE', '@abonne_85'],
  ['DÉFENSE', '@abonne_86'], ['SANTÉ', '@abonne_87'], ['SPORTS', '@abonne_88'], ['TRANSPORTS', '@abonne_28'],
  ['AGRICULTURE', '@abonne_89'], ['PORTE-PAROLE', '@abonne_79'],
];

/* ------------------------------------------------------------------ caméra */

type Plan = {de: number; a: number; p0: V3; p1: V3; c0: V3};
const GREFFIER_YEUX: V3 = [0, 1.95, 2.75];
const haut = (de: number, a: number, z0 = 12.6, z1 = 11.6): Plan => ({de, a, p0: [0, z0, 3.9], p1: [0, z1, 3.7], c0: [0, 0.2, -3.0]});
const large = (de: number, a: number, z0 = 13.5, z1 = 15.2): Plan => ({de, a, p0: [0, z0, 3.9], p1: [0, z1, 3.9], c0: [0, 0.3, -4.6]});
const greffier = (de: number, a: number): Plan => ({de, a, p0: [0.5, 2.3, -0.7], p1: [0.3, 2.2, -0.2], c0: GREFFIER_YEUX});
const PLANS: Plan[] = [
  haut(0, W.ici, 10.8, 11.8),
  large(W.ici, W.c1),
  haut(W.c1, W.commente, 11.8, 10.6),
  large(W.commente, W.reste, 13.8, 15.2),
  haut(W.reste, W.attention, 11.2, 12.2),
  greffier(W.attention, W.censure),
  haut(W.censure, W.aussi, 11.6, 10.8),
  large(W.aussi, FIN + 1, 14.0, 15.4),
];
const camera = (f: number): EtatAssemblee['cam'] => {
  const p = PLANS.find((x) => f >= x.de && f < x.a) ?? PLANS[PLANS.length - 1];
  const t = interpolate(f, [p.de, p.a], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return {pos: mix(p.p0, p.p1, ease(t)), cible: p.c0, fov: 40};
};

/* ------------------------------------------------------------------ état 3D */

const useEtat = (f: number): EtatAssemblee => {
  const plansGreffier = entre(f, W.attention, W.censure);
  return {
    cam: camera(f),
    greffier: {humeur: 'joyeux', bras: f >= W.abonne ? 'salue' : plansGreffier ? 'montre' : 'repos'},
    deputes: SIEGES.length + 1,
    bords: 0,
    president: !plansGreffier ? 1 : 0,
    presidentNom: '@abonne_54',
    lignes: 0,
    constitution: 0,
    mysteres: [0, 0, 0],
    lettres: [0, 0, 0],
    lettresTexte: 'ABC',
  };
};

/* ------------------------------------------------------------------ habillage 2D */

const TITRES: {de: number; a: number; petit: string; grand: string; rouge?: boolean}[] = [
  {de: 0, a: W.ici, petit: '4 CANDIDATS', grand: '1 SEULE PLACE'},
  {de: W.ici, a: W.c1, petit: '1 ABONNÉ', grand: '= 1 DÉPUTÉ'},
  {de: W.c1, a: W.c2, petit: 'PREMIER MINISTRE', grand: 'CANDIDAT 1'},
  {de: W.c2, a: W.c3, petit: 'PREMIER MINISTRE', grand: 'CANDIDAT 2'},
  {de: W.c3, a: W.c4, petit: 'PREMIER MINISTRE', grand: 'CANDIDAT 3'},
  {de: W.c4, a: W.commente, petit: 'PREMIER MINISTRE', grand: 'CANDIDAT 4'},
  {de: W.commente, a: W.candidats, petit: 'VOTE EN COMMENTAIRE', grand: '1 · 2 · 3 · 4'},
  {de: W.candidats, a: W.reste, petit: 'CANDIDATS', grand: 'FAITES CAMPAGNE'},
  {de: W.reste, a: W.attention, petit: 'VOS MINISTRES', grand: 'LE GOUVERNEMENT'},
  {de: W.attention, a: W.aussi, petit: 'ATTENTION', grand: 'LA CENSURE', rouge: true},
  {de: W.aussi, a: W.alors, petit: 'ICI AUSSI', grand: 'VOUS POURREZ LE RENVERSER', rouge: true},
  {de: W.alors, a: FIN + 1, petit: 'ABONNE-TOI POUR VOIR', grand: 'QUI GAGNE'},
];

const AFFICHAGE: Record<number, string> = {0: '*4*', 24: '*1.*', 32: '*2.*', 44: '*3.*', 52: '*4.*', 105: '*49.*', 114: '*2024.*', 115: '', 116: '',
  130: '*1,*', 131: '*2,*', 132: '*3*', 134: '*4*'};
const JAUNES = new Set(['ministre', 'ministre.', 'place.', 'député.', 'votez.', 'oxygène', 'numéro', 'potes.', 'campagne.', 'gouvernement.', 'pseudos', 'renverser',
  'censure', 'barnier', 'abonne-toi', 'gagne.', 'plaît.']);
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


const CarteCandidat: React.FC<{c: typeof CANDIDATS[number]; e: number; actif: boolean}> = ({c, e, actif}) => (
  <div style={{transform: `scale(${e * (actif ? 1.04 : 1)})`, background: actif ? '#ffc928' : 'rgba(27,29,36,0.92)', border: `6px solid ${actif ? '#2b1a00' : '#ffc928'}`,
    borderRadius: 28, padding: '20px 14px', textAlign: 'center', fontFamily: TEXTE, fontWeight: 900, boxShadow: '0 8px 0 rgba(0,0,0,0.2)'}}>
    <div style={{fontFamily: TITRE, fontSize: 96, lineHeight: 1, color: actif ? '#2b1a00' : '#ffc928'}}>{c.n}</div>
    <div style={{fontSize: 30, color: actif ? '#2b1a00' : '#fff', marginTop: 6}}>{c.pseudo}</div>
  </div>
);

/** Accroche : les 4 candidats autour du fauteuil vide. */
const Accroche: React.FC<{f: number}> = ({f}) => {
  const s = useS(f);
  if (f >= W.ici) return null;
  return (
    <div style={{position: 'absolute', top: 560, left: 70, right: 70}}>
      <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 26}}>
        {CANDIDATS.map((c, i) => <CarteCandidat key={c.n} c={c} e={s(4 + i * 5)} actif={false} />)}
      </div>
      <div style={{marginTop: 30, display: 'flex', justifyContent: 'center', transform: `scale(${s(M(6), SEC)})`}}>
        <span style={{background: '#1b1d24', border: '6px solid #ff4d5e', color: '#fff', fontFamily: TITRE, fontSize: 60, padding: '8px 30px', borderRadius: 24}}>🪑 PREMIER MINISTRE : <span style={{color: '#ff4d5e'}}>1</span></span>
      </div>
    </div>
  );
};

/** Chaque candidat : son vrai commentaire + son « programme ». */
const Candidat: React.FC<{f: number}> = ({f}) => {
  const s = useS(f);
  const bornes = [W.c1, W.c2, W.c3, W.c4, W.commente];
  const k = bornes.findIndex((b, i) => i < 4 && f >= b && f < bornes[i + 1]);
  if (k < 0) return null;
  const c = CANDIDATS[k];
  const de = bornes[k];
  return (
    <div style={{position: 'absolute', top: 540, left: 60, right: 60, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 30}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 24, transform: `scale(${s(de + 2, SEC)})`}}>
        <div style={{width: 150, height: 150, borderRadius: 80, background: '#ffc928', border: '8px solid #2b1a00', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: TITRE, fontSize: 110, color: '#2b1a00'}}>{c.n}</div>
        <div style={{fontFamily: TEXTE, fontWeight: 900, fontSize: 54, color: '#fff', ...contour('#1b1d24', 12)}}>{c.pseudo}</div>
      </div>
      <div style={{width: '100%'}}><Commentaire pseudo={c.pseudo} texte={c.texte} likes={c.likes} e={s(de + 8)} taille={c.texte.length > 60 ? 36 : 50} /></div>
      <div style={{transform: `scale(${s(de + 18, SEC)}) rotate(-2deg)`, background: '#1b1d24', border: '6px solid #ffc928', color: '#ffc928', fontFamily: TITRE,
        fontSize: 54, padding: '8px 28px', borderRadius: 22, whiteSpace: 'nowrap'}}>{c.mot}</div>
    </div>
  );
};

/** Le bulletin : commente le numéro. */
const Bulletin: React.FC<{f: number; de: number; a: number}> = ({f, de, a}) => {
  const s = useS(f);
  if (f < de || f >= a) return null;
  const actif = Math.floor((f - de) / 10) % 4;
  return (
    <div style={{position: 'absolute', top: 560, left: 70, right: 70}}>
      <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 26}}>
        {CANDIDATS.map((c, i) => <CarteCandidat key={c.n} c={c} e={s(de + 2 + i * 4)} actif={i === actif} />)}
      </div>
      <div style={{marginTop: 34}}><Commentaire pseudo="@toi · à l’instant" texte={`${CANDIDATS[actif].n}`} e={s(de + 20)} taille={64} /></div>
    </div>
  );
};

/** Campagne : chaque candidat envoie la vidéo à ses potes. */
const Campagne: React.FC<{f: number}> = ({f}) => {
  const s = useS(f);
  if (f < W.candidats || f >= W.reste) return null;
  return (
    <div style={{position: 'absolute', top: 560, left: 60, right: 60, display: 'flex', flexDirection: 'column', gap: 20}}>
      {CANDIDATS.map((c, i) => (
        <div key={c.n} style={{transform: `scale(${s(W.candidats + 4 + i * 5)})`, background: '#fff', border: '6px solid #ffc928', borderRadius: 26, padding: '14px 24px',
          display: 'flex', alignItems: 'center', gap: 20, fontFamily: TEXTE, fontWeight: 900}}>
          <div style={{fontFamily: TITRE, fontSize: 64, color: '#2b1a00', width: 60, textAlign: 'center'}}>{c.n}</div>
          <div style={{flex: 1, fontSize: 38, color: '#1b1d24'}}>{c.pseudo}</div>
          <div style={{background: '#fe2c55', color: '#fff', borderRadius: 40, padding: '8px 22px', fontSize: 32}}>➦ PARTAGER</div>
        </div>
      ))}
    </div>
  );
};

/** Le gouvernement nommé : les pseudos des commentateurs. */
const Gouvernement: React.FC<{f: number}> = ({f}) => {
  const s = useS(f);
  if (f < W.reste || f >= W.attention) return null;
  return (
    <div style={{position: 'absolute', top: 520, left: 46, right: 46}}>
      <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14}}>
        {GOUV.map(([m, p], i) => (
          <div key={m} style={{transform: `scale(${s(W.reste + 4 + i * 3, {damping: 10, stiffness: 220})})`, background: 'rgba(27,29,36,0.92)', border: '4px solid #ffc928',
            borderRadius: 20, padding: '10px 12px', textAlign: 'center', fontFamily: TEXTE, fontWeight: 900}}>
            <div style={{fontSize: 22, color: '#fff'}}>{m}</div>
            <div style={{fontSize: 30, color: '#ffc928'}}>{p}</div>
          </div>
        ))}
      </div>
      <div style={{marginTop: 16, display: 'flex', justifyContent: 'center', transform: `scale(${s(W.pseudos, SEC)})`}}>
        <span style={{background: '#ff4d5e', color: '#fff', fontFamily: TITRE, fontSize: 46, padding: '6px 26px', borderRadius: 20}}>PREMIER MINISTRE : 1 · 2 · 3 · 4 ?</span>
      </div>
    </div>
  );
};

/** Le vrai droit : article 49 et la chute de Barnier. */
const Censure: React.FC<{f: number}> = ({f}) => {
  const s = useS(f);
  if (f < W.censure || f >= W.alors) return null;
  if (f < W.aussi) {
    const p = interpolate(f, [W.censure + 4, W.censure + 40], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
    return (
      <div style={{position: 'absolute', top: 560, left: 60, right: 60}}>
        <Texte e={s(W.censure + 2)} titre="CONSTITUTION · ARTICLE 49" source="conseil-constitutionnel.fr"
          citation={<>« L’Assemblée nationale <Surligne p={p}>met en cause la responsabilité du Gouvernement par le vote d’une motion de censure</Surligne>. »</>} />
        <Tampon e={s(W.barnier + 6, SEC)} texte="RENVERSÉ EN 2024" couleur="#d62839" top={330} />
      </div>
    );
  }
  return (
    <div style={{position: 'absolute', top: 600, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
      <div style={{position: 'relative', transform: `scale(${s(W.aussi + 2)})`, background: 'rgba(27,29,36,0.92)', border: '6px dashed #ffc928', borderRadius: 30,
        padding: '30px 60px', textAlign: 'center', fontFamily: TEXTE, fontWeight: 900}}>
        <div style={{fontSize: 110}}>🪑</div>
        <div style={{fontSize: 40, color: '#fff'}}>PREMIER MINISTRE</div>
        <div style={{fontFamily: TITRE, fontSize: 64, color: '#ffc928'}}>1 · 2 · 3 · 4 ?</div>
        <Tampon e={s(M(124), SEC)} texte="CENSURÉ ?" couleur="#d62839" top={-40} />
      </div>
    </div>
  );
};

/** Final : les 4 numéros, encore. */
const Final: React.FC<{f: number}> = ({f}) => <Bulletin f={f} de={W.alors} a={FIN + 1} />;

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
  const [poignee] = useState(() => delayRender('polices assemblée ep05'));
  useEffect(() => {
    Promise.all([lilita.waitUntilDone(), montserrat.waitUntilDone()]).then(() => { setPret(true); continueRender(poignee); });
  }, [poignee]);
  return pret;
};

export const AssembleeTikTokEp05: React.FC = () => {
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
      <Jauge f={f} de={W.ici} a={W.c1} />
      <Candidat f={f} />
      <Bulletin f={f} de={W.commente} a={W.candidats} />
      <Campagne f={f} />
      <Gouvernement f={f} />
      <Censure f={f} />
      <Final f={f} />
      <SousTitre t={f / 30} />
      <BoutonAbonne f={f} />
      <Confettis f={f} de={W.reste + 4} a={W.pseudos + 30} />
      <Confettis f={f} de={W.abonne + 20} a={FIN + 1} />
      <Audio src={staticFile('assemblee/tiktok_ep05_voix.wav')} />
    </AbsoluteFill>
  );
};
