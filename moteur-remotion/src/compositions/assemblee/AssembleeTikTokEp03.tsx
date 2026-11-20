import {loadFont as chargerLilita} from '@remotion/google-fonts/LilitaOne';
import {loadFont as chargerMontserrat} from '@remotion/google-fonts/Montserrat';
import {ThreeCanvas} from '@remotion/three';
import {useEffect, useState} from 'react';
import {AbsoluteFill, Audio, Easing, continueRender, delayRender, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import voix from './tiktok_ep03_voix.json';
import {CAMPS, EtatAssemblee, Hemicycle, PARCELLES, SIEGES} from './Assemblee3D';

/* Épisode 3, branche TikTok. Votes relevés le 10/11/2026 sous l'épisode 2 (vidéo 7706243100728954144) :
   48 commentaires lus, 25 votes (un par pseudo) : A 13, C 9, B 3. 707 abonnés.
   Textes vérifiés le 10/11/2026 : Préambule de 1946 al. 9 et 13, Constitution art. 66-1 (conseil-constitutionnel.fr),
   ticket modérateur et participation forfaitaire de 2 € (ameli.fr). */

const lilita = chargerLilita('normal', {subsets: ['latin', 'latin-ext']});
const montserrat = chargerMontserrat('normal', {weights: ['900'], subsets: ['latin', 'latin-ext']});
const TITRE = lilita.fontFamily;
const TEXTE = montserrat.fontFamily;

const ABONNES = 707;
const FIN_VOIX = voix.duree + 1.2;
export const DUREE_ASSEMBLEE_TT03 = Math.ceil(FIN_VOIX * 30);

const M = (i: number) => Math.round((voix.mots[i].a - 0.08) * 30);
const FIN = Math.round(FIN_VOIX * 30);
const W = {
  quatre: M(9), ici: M(13), hier: M(19), b: M(24), c: M(32), a: M(40), adoptee: M(48), vrai: M(54), ticket: M(64), ecole: M(74),
  bonus: M(87), preambule: M(100), adoptee2: M(119), henri: M(120), gauche: M(126), mention: M(133), refusee: M(140),
  attention: M(144), notre: M(157), manque: M(164), abonne: M(173), siege: M(180),
};

type V3 = [number, number, number];
type Ressort = {damping?: number; stiffness?: number};
const ease = Easing.inOut(Easing.cubic);
const mix = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const entre = (f: number, de: number, a: number) => f >= de && f < a;
const SEC: Ressort = {damping: 9, stiffness: 260};

/* ------------------------------------------------------------------ données réelles */

const VOTES = [
  {lettre: 'B', court: 'FIN DE PARCOURSUP', voix: 3, de: W.b},
  {lettre: 'C', court: 'PEINE DE MORT', voix: 9, de: W.c},
  {lettre: 'A', court: 'TOUT GRATUIT', voix: 13, de: W.a},
];
const LOI_A = {pseudo: '@abonne_08', loi: 'Gratuité de tous les services publics, santé remboursée à 100 %'};
const BONUS = {pseudo: '@abonne_56', loi: 'Nationalisation de l’énergie, des transports en commun et du ferroviaire', likes: 1};
const CHEFS = [
  {camp: 'DROITE', couleur: CAMPS.droite, pseudo: '@abonne_57', de: W.henri},
  {camp: 'GAUCHE', couleur: CAMPS.gauche, pseudo: '@abonne_58', de: W.gauche},
];
// des pseudos qui ont commenté sous l'épisode 2 : ils illustrent la promesse « ton pseudo sur un siège »
const PSEUDOS = ['@abonne_59', '@abonne_60', '@abonne_61', '@abonne_62', '@abonne_63', '@abonne_64', '@abonne_65', '@abonne_66', '@abonne_67', '@abonne_68',
  '@abonne_69', '@abonne_70', '@abonne_71', '@abonne_72', '@abonne_73', '@toi ?'];

/* ------------------------------------------------------------------ caméra */

type Plan = {de: number; a: number; p0: V3; p1: V3; c0: V3};
const GREFFIER_YEUX: V3 = [0, 1.95, 2.75];
const proche = (i: number, de: number, a: number): Plan => ({de, a, p0: add(PARCELLES[i], [0.6, 3.4, 4.3]), p1: add(PARCELLES[i], [0.2, 3.0, 3.7]), c0: add(PARCELLES[i], [0, 0.9, 0])});
const haut = (de: number, a: number, z0 = 12.6, z1 = 11.6): Plan => ({de, a, p0: [0, z0, 3.9], p1: [0, z1, 3.7], c0: [0, 0.2, -3.0]});
const greffier = (de: number, a: number): Plan => ({de, a, p0: [0.5, 2.3, -0.7], p1: [0.3, 2.2, -0.2], c0: GREFFIER_YEUX});
const PLANS: Plan[] = [
  proche(2, 0, W.ici),
  {de: W.ici, a: W.hier, p0: [0, 13.5, 3.9], p1: [0, 14.8, 3.9], c0: [0, 0.3, -4.6]},
  haut(W.hier, W.b, 12.8, 11.8),
  proche(1, W.b, W.c),
  proche(2, W.c, W.a),
  proche(0, W.a, W.adoptee),
  haut(W.adoptee, W.vrai, 11.8, 10.8),
  greffier(W.vrai, W.bonus),
  haut(W.bonus, W.henri, 11.8, 12.8),
  {de: W.henri, a: W.mention, p0: [0, 14.5, 3.9], p1: [0, 15.5, 3.9], c0: [0, 0.2, -4.8]},
  greffier(W.mention, W.attention),
  haut(W.attention, W.notre, 12.8, 11.8),
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
  const votes = f < W.adoptee;
  const choisie = entre(f, 0, W.ici) || entre(f, W.c, W.a) ? 2 : entre(f, W.b, W.c) ? 1 : entre(f, W.a, W.adoptee) ? 0 : -1;
  const plansGreffier = entre(f, W.vrai, W.bonus) || entre(f, W.mention, W.attention);
  return {
    cam: camera(f),
    greffier: {
      humeur: entre(f, W.attention, W.manque) ? 'triste' : 'joyeux',
      bras: f >= W.abonne || entre(f, W.adoptee, W.vrai) || entre(f, W.adoptee2, W.henri + 10) ? 'salue' : plansGreffier || entre(f, W.manque, W.abonne) ? 'montre' : 'repos',
    },
    deputes: SIEGES.length + 1,
    bords: entre(f, W.henri, W.mention) || f < W.hier ? 1 : 0,
    // le président (épisode 2) reste au perchoir, sauf dans les gros plans du Greffier où sa tête dépasserait
    president: !plansGreffier ? 1 : 0,
    presidentEtiquette: 0,
    presidentNom: '@abonne_54',
    lignes: interpolate(f, [W.adoptee + 4, W.vrai - 4], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
    loiNom: entre(f, W.adoptee, W.vrai) ? pop(W.adoptee + 4) : 0,
    constitution: entre(f, W.notre, W.abonne) ? pop(W.notre + 6) : 0,
    mysteres: [0, 0, 0],
    lettres: votes
      ? [0, 1, 2].map((i) => {
        const base = f < W.hier ? (i === 2 ? 1 : 0) : pop(W.hier + 6 + i * 5);
        return base * (choisie === i ? 1.3 : 1);
      })
      : [0, 0, 0],
    lettresTexte: 'ABC',
  };
};

/* ------------------------------------------------------------------ habillage 2D */

const TITRES: {de: number; a: number; petit: string; grand: string; rouge?: boolean}[] = [
  {de: 0, a: W.quatre, petit: 'ELLE A FAILLI VOTER', grand: 'LA PEINE DE MORT', rouge: true},
  {de: W.quatre, a: W.ici, petit: 'À SEULEMENT', grand: '4 VOIX PRÈS', rouge: true},
  {de: W.ici, a: W.hier, petit: '1 ABONNÉ', grand: '= 1 DÉPUTÉ'},
  {de: W.hier, a: W.b, petit: 'HIER', grand: 'VOUS AVEZ VOTÉ'},
  {de: W.b, a: W.adoptee, petit: 'LE DÉPOUILLEMENT', grand: 'RÉSULTATS'},
  {de: W.adoptee, a: W.vrai, petit: 'LOI N° 1', grand: 'ADOPTÉE'},
  {de: W.vrai, a: W.ecole, petit: 'EN VRAI, EN FRANCE', grand: 'PAS GRATUIT'},
  {de: W.ecole, a: W.bonus, petit: 'DÉJÀ GRATUITE', grand: 'L’ÉCOLE PUBLIQUE'},
  {de: W.bonus, a: W.henri, petit: 'LA PLUS LIKÉE', grand: 'LOI BONUS'},
  {de: W.henri, a: W.mention, petit: 'PRÉSIDENTS DE GROUPE', grand: 'ACCORDÉ'},
  {de: W.mention, a: W.attention, petit: 'MENTION', grand: 'SPÉCIALE'},
  {de: W.attention, a: W.notre, petit: 'EN FRANCE', grand: 'C’EST INTERDIT', rouge: true},
  {de: W.notre, a: W.manque, petit: 'NOTRE ASSEMBLÉE', grand: 'N’A PAS DE CONSTITUTION'},
  {de: W.manque, a: W.abonne, petit: 'POUR L’ÉCRIRE', grand: `IL MANQUE ${1000 - ABONNES}`},
  {de: W.abonne, a: W.siege, petit: 'ABONNE-TOI ET PROPOSE', grand: 'L’ARTICLE 1'},
  {de: W.siege, a: FIN + 1, petit: 'TON PSEUDO', grand: 'SUR UN SIÈGE'},
];

const AFFICHAGE: Record<number, string> = {10: '*4*', 30: '*3*', 38: '*9*', 45: '*13*', 70: '*2*', 71: '*€*', 168: '*300*', 169: '', 177: '*1*'};
const JAUNES = new Set(['mort', 'député', 'voté', 'parcoursup', 'gratuit', 'adoptée', 'gratuite', 'modérateur', 'préambule', 'constitution', 'bonus',
  'nationaliser', 'collectivité', 'droite', 'gauche', 'chef', 'oxygène', 'refusée', 'interdit', 'abonne-toi', 'siège', 'pseudo', 'accordé', 'pistache', 'nuage', 'henri']);
const nu = (t: string) => t.toLowerCase().replace(/[.,?…!:]/g, '');
type Mot = {t: string; a: number; b: number};
const PAQUETS: Mot[][] = (() => {
  const mots = voix.mots
    .map((m, i) => ({...m, t: AFFICHAGE[i] ?? (JAUNES.has(nu(m.t)) ? `*${m.t}*` : m.t)}))
    .filter((m) => m.t !== '' && m.t !== ':' && m.t !== '!');
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

/** Accroche : la carte de la loi C, puis l'écart de 4 voix. */
const Accroche: React.FC<{f: number}> = ({f}) => {
  const s = useS(f);
  if (f >= W.ici) return null;
  return (
    <div style={{position: 'absolute', top: 960, left: 50, right: 50}}>
      <Commentaire pseudo="@abonne_10" texte="Le meurtre est puni de la peine de mort" e={s(3)} lettre="C" bord="#ff4d5e" />
      {f >= W.quatre && (
        <div style={{position: 'absolute', top: -330, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 30, transform: `scale(${s(W.quatre + 2)})`}}>
          {([['A', 13, '#ffc928'], ['C', 9, '#ff4d5e']] as const).map(([l, n, c]) => (
            <div key={l} style={{background: '#1b1d24', border: `6px solid ${c}`, borderRadius: 26, padding: '10px 34px', fontFamily: TITRE, fontSize: 84, color: c}}>{l} · {n}</div>
          ))}
        </div>
      )}
    </div>
  );
};

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

/** Dépouillement : barres qui montent dans l'ordre B, C, A. */
const Depouillement: React.FC<{f: number}> = ({f}) => {
  const s = useS(f);
  if (f < W.b || f >= W.adoptee) return null;
  return (
    <div style={{position: 'absolute', top: 520, left: 70, right: 70, background: 'rgba(27,29,36,0.9)', borderRadius: 30, padding: '26px 30px', border: '6px solid #ffc928',
      display: 'flex', flexDirection: 'column', gap: 22}}>
      {VOTES.map((v) => {
        const p = interpolate(f, [v.de + 4, v.de + 34], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
        const gagne = v.lettre === 'A' && f >= W.a + 36;
        const couleur = v.lettre === 'C' ? '#ff4d5e' : '#ffc928';
        return (
          <div key={v.lettre} style={{display: 'flex', alignItems: 'center', gap: 18, opacity: f >= v.de ? 1 : 0.25}}>
            <div style={{width: 76, height: 76, borderRadius: 40, background: couleur, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: TITRE, fontSize: 52, color: '#2b1a00', flex: 'none'}}>{v.lettre}</div>
            <div style={{flex: 1}}>
              <div style={{fontFamily: TEXTE, fontWeight: 900, fontSize: 30, color: '#fff'}}>{v.court}</div>
              <div style={{height: 40, marginTop: 6, width: `${((p * v.voix) / 13) * 100}%`, minWidth: f >= v.de ? 8 : 0, background: couleur, borderRadius: 12,
                boxShadow: gagne ? `0 0 ${20 + 10 * Math.sin(f / 4)}px ${couleur}` : 'none'}} />
            </div>
            <div style={{fontFamily: TITRE, fontSize: 64, color: couleur, width: 90, textAlign: 'right'}}>{Math.round(p * v.voix)}</div>
          </div>
        );
      })}
      <div style={{position: 'absolute', bottom: -70, left: 0, right: 0, textAlign: 'center', transform: `scale(${s(W.a + 36, SEC)})`}}>
        <span style={{background: '#1f9d55', color: '#fff', fontFamily: TITRE, fontSize: 56, padding: '8px 30px', borderRadius: 30, border: '6px solid #fff'}}>A GAGNE · 4 VOIX D’AVANCE</span>
      </div>
    </div>
  );
};

/** La loi A écrite au nom de son auteur. */
const LoiAdoptee: React.FC<{f: number}> = ({f}) => {
  const s = useS(f);
  if (f < W.adoptee || f >= W.vrai) return null;
  return (
    <div style={{position: 'absolute', top: 900, left: 50, right: 50}}>
      <Commentaire pseudo={`LOI N° 1 · ${LOI_A.pseudo}`} texte={LOI_A.loi} e={s(W.adoptee + 2)} lettre="A" />
      <Tampon e={s(W.adoptee + 14, SEC)} texte="ADOPTÉE" top={-110} />
    </div>
  );
};

/** « En vrai » : le reste à charge, puis l'école gratuite dans le Préambule. */
const EnVrai: React.FC<{f: number}> = ({f}) => {
  const s = useS(f);
  if (f >= W.vrai && f < W.ecole) {
    const lignes = [
      {t: 'Part Assurance Maladie', v: '✔', c: '#1f9d55', de: W.vrai + 30},
      {t: 'Ticket modérateur', v: 'TOI', c: '#e0283f', de: W.ticket},
      {t: 'Participation forfaitaire', v: '2 €', c: '#e0283f', de: M(69)},
    ];
    return (
      <div style={{position: 'absolute', top: 560, left: 100, right: 100, transform: `scale(${s(W.vrai + 4)}) rotate(-1.5deg)`}}>
        <div style={{background: '#fff', padding: '28px 34px 44px', fontFamily: 'Space Mono, monospace', fontWeight: 700, boxShadow: '0 12px 0 rgba(0,0,0,0.18)',
          clipPath: 'polygon(0 0,100% 0,100% 96%,95% 100%,90% 96%,85% 100%,80% 96%,75% 100%,70% 96%,65% 100%,60% 96%,55% 100%,50% 96%,45% 100%,40% 96%,35% 100%,30% 96%,25% 100%,20% 96%,15% 100%,10% 96%,5% 100%,0 96%)'}}>
          <div style={{fontFamily: TEXTE, fontWeight: 900, fontSize: 40, textAlign: 'center', color: '#1b1d24'}}>CONSULTATION · REÇU</div>
          <div style={{borderTop: '4px dashed #1b1d24', margin: '16px 0'}} />
          {lignes.map((l) => (
            <div key={l.t} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 34, color: '#1b1d24', margin: '12px 0', opacity: f >= l.de ? 1 : 0,
              transform: `translateX(${(1 - s(l.de)) * 60}px)`}}>
              <span>{l.t}</span><span style={{color: l.c, fontFamily: TITRE, fontSize: 46}}>{l.v}</span>
            </div>
          ))}
          <div style={{fontSize: 24, color: '#8a8f99', marginTop: 14}}>Source : ameli.fr</div>
        </div>
      </div>
    );
  }
  if (f >= W.ecole && f < W.bonus) {
    const p = interpolate(f, [M(76), M(86)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
    return (
      <div style={{position: 'absolute', top: 560, left: 60, right: 60}}>
        <Texte e={s(W.ecole + 4)} titre="PRÉAMBULE DE LA CONSTITUTION DE 1946 · ALINÉA 13" source="conseil-constitutionnel.fr"
          citation={<>« L’organisation de <Surligne p={p}>l’enseignement public gratuit</Surligne> et laïque à tous les degrés est un devoir de l’État. »</>} />
      </div>
    );
  }
  return null;
};

/** Loi bonus (la proposition la plus likée sous l'épisode 2) puis le Préambule, al. 9. */
const LoiBonus: React.FC<{f: number}> = ({f}) => {
  const s = useS(f);
  if (f < W.bonus || f >= W.henri) return null;
  const p = interpolate(f, [M(108), M(118)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <div style={{position: 'absolute', top: 520, left: 50, right: 50, display: 'flex', flexDirection: 'column', gap: 34}}>
      <div style={{position: 'relative'}}>
        <Commentaire pseudo={BONUS.pseudo} texte={BONUS.loi} likes={BONUS.likes} e={s(W.bonus + 4)} taille={40} />
        <Tampon e={s(W.adoptee2, SEC)} texte="ADOPTÉE" top={70} />
      </div>
      {f >= W.preambule && (
        <Texte e={s(W.preambule + 2)} titre="PRÉAMBULE DE 1946 · ALINÉA 9" source="conseil-constitutionnel.fr"
          citation={<>« Tout bien, toute entreprise, dont l’exploitation a ou acquiert les caractères d’un service public national (…) <Surligne p={p}>doit devenir la propriété de la collectivité</Surligne>. »</>} />
      )}
    </div>
  );
};

/** Les deux présidents de groupe demandés en commentaire. */
const Chefs: React.FC<{f: number}> = ({f}) => {
  const s = useS(f);
  if (f < W.henri || f >= W.mention) return null;
  return (
    <div style={{position: 'absolute', top: 560, left: 60, right: 60, display: 'flex', flexDirection: 'column', gap: 30}}>
      {CHEFS.map((c) => (
        <div key={c.camp} style={{transform: `scale(${s(c.de + 3)})`, background: '#fff', border: `8px solid ${c.couleur}`, borderRadius: 30, padding: '18px 26px',
          display: 'flex', alignItems: 'center', gap: 22, boxShadow: '0 8px 0 rgba(0,0,0,0.18)'}}>
          <div style={{width: 110, height: 110, borderRadius: 60, background: c.couleur, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 64}}>👑</div>
          <div style={{fontFamily: TEXTE, fontWeight: 900}}>
            <div style={{fontSize: 30, color: c.couleur}}>PRÉSIDENT DU GROUPE · {c.camp}</div>
            <div style={{fontSize: 52, color: '#1b1d24'}}>{c.pseudo}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

/** Mention spéciale : la taxe sur l'oxygène, refusée. */
const Mention: React.FC<{f: number}> = ({f}) => {
  const s = useS(f);
  if (f < W.mention || f >= W.attention) return null;
  return (
    <div style={{position: 'absolute', top: 600, left: 70, right: 70}}>
      <Commentaire pseudo="@abonne_74" texte="Une taxe de 0,0001 centime sur l’oxygène" e={s(W.mention + 4)} taille={48} />
      <Tampon e={s(W.refusee, SEC)} texte="REFUSÉE" couleur="#e0283f" top={150} />
    </div>
  );
};

/** La vraie Constitution interdit la peine de mort ; la nôtre est vide. */
const Constitution: React.FC<{f: number}> = ({f}) => {
  const s = useS(f);
  if (f >= W.attention && f < W.notre) {
    const p = interpolate(f, [M(148), M(156)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
    return (
      <div style={{position: 'absolute', top: 600, left: 70, right: 70}}>
        <Texte e={s(W.attention + 4)} titre="CONSTITUTION FRANÇAISE · ARTICLE 66-1" source="conseil-constitutionnel.fr"
          citation={<>« <Surligne p={p}>Nul ne peut être condamné à la peine de mort.</Surligne> »</>} />
      </div>
    );
  }
  if (f >= W.notre && f < W.manque) {
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
  }
  return null;
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

/** Voile rouge qui pulse pendant l'accroche. */
const Alerte: React.FC<{f: number}> = ({f}) => {
  if (f >= W.ici) return null;
  const o = 0.36 + 0.3 * Math.abs(Math.sin(f / 6));
  return <AbsoluteFill style={{boxShadow: `inset 0 0 220px rgba(224,40,63,${o})`}} />;
};

const usePolicesPretes = () => {
  const [pret, setPret] = useState(false);
  const [poignee] = useState(() => delayRender('polices assemblée ep03'));
  useEffect(() => {
    Promise.all([lilita.waitUntilDone(), montserrat.waitUntilDone()]).then(() => { setPret(true); continueRender(poignee); });
  }, [poignee]);
  return pret;
};

export const AssembleeTikTokEp03: React.FC = () => {
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
      <Alerte f={f} />
      <Titre f={f} />
      <Accroche f={f} />
      <Jauge f={f} de={W.ici} a={W.hier} />
      <Depouillement f={f} />
      <LoiAdoptee f={f} />
      <EnVrai f={f} />
      <LoiBonus f={f} />
      <Chefs f={f} />
      <Mention f={f} />
      <Constitution f={f} />
      <Jauge f={f} de={W.manque} a={W.abonne} manque />
      <Appel f={f} />
      <SousTitre t={f / 30} />
      <BoutonAbonne f={f} />
      <Confettis f={f} de={W.a + 36} a={W.adoptee + 30} />
      <Confettis f={f} de={W.siege + 20} a={FIN + 1} />
      <Audio src={staticFile('assemblee/tiktok_ep03_voix.wav')} />
    </AbsoluteFill>
  );
};
