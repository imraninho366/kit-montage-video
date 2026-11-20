import {loadFont as chargerLilita} from '@remotion/google-fonts/LilitaOne';
import {loadFont as chargerMontserrat} from '@remotion/google-fonts/Montserrat';
import {ThreeCanvas} from '@remotion/three';
import {useEffect, useState} from 'react';
import {AbsoluteFill, Audio, Easing, continueRender, delayRender, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import voix from './youtube_ep02_voix.json';
import {CAMPS, EtatAssemblee, Hemicycle, PARCELLES, SIEGES} from './Assemblee3D';

/* Épisode 2, branche YouTube (copie de AssembleeTikTokEp02 avec les données YouTube). Relevé du 09/11/2026 sur le Short yKvQdmKFW_w
   (@abonne_90) : 20 commentaires, 233 abonnés. Les 3 propositions de loi les plus likées passent au vote. Pas de perchoir ni de camps. */

const lilita = chargerLilita('normal', {subsets: ['latin', 'latin-ext']});
const montserrat = chargerMontserrat('normal', {weights: ['900'], subsets: ['latin', 'latin-ext']});
const TITRE = lilita.fontFamily;
const TEXTE = montserrat.fontFamily;

const ABONNES = 233;
const FIN_VOIX = voix.duree + 1.0;
export const DUREE_ASSEMBLEE_YT02 = Math.ceil(FIN_VOIX * 30);

const M = (i: number) => Math.round((voix.mots[i].a - 0.08) * 30);
const FIN = Math.round(FIN_VOIX * 30);
// accroche (loi C puis loi A, puis « c'est vous qui votez »), puis l'épisode
const W = {autre: M(13), vous: M(21), hier: M(27), aujourdhui: M(32), banc: M(39), antoine: M(48), maintenant: M(48), a: M(55), b: M(65), c: M(80),
  mention: M(89), pas: M(97), vote: M(101), bonus: M(112), abonne: M(127)};

type V3 = [number, number, number];
const ease = Easing.inOut(Easing.cubic);
const mix = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];

/* ------------------------------------------------------------------ données des commentaires */

const LOIS = [
  {pseudo: '@abonne_91', loi: '« On paye 300 € par jour par personne »', court: '300 € PAR JOUR', likes: 5},
  {pseudo: '@abonne_92', loi: 'L’essence à 1,20 € et 20 000 € par mois de salaire', court: 'ESSENCE À 1,20 €', likes: 4},
  {pseudo: '@abonne_93', loi: 'L’alcool interdit aux moins de 18 ans', court: 'ALCOOL INTERDIT', likes: 3},
];

// chacun à la place demandée en commentaire (parti cité → camp)
// tous ceux qui ont commenté le pilote sur YouTube (personne n'a demandé de camp)
const BANCS: {titre: string; couleur: string; noms: string[]}[] = [
  {titre: 'ILS ONT', couleur: '#ffc928', noms: ['@abonne_91', '@abonne_92', '@abonne_93', '@abonne_94', '@abonne_95',
    '@abonne_96', '@abonne_97', '@abonne_98', '@abonne_99', '@abonne_100']},
  {titre: 'PRIS LA PAROLE', couleur: '#ffc928', noms: ['@abonne_101', '@abonne_102', '@abonne_103', '@abonne_104', '@abonne_105',
    '@abonne_106', '@abonne_107', '@abonne_108', '@abonne_109']},
];
const NB_NOMS = BANCS.reduce((n, b) => n + b.noms.length, 0);

/* ------------------------------------------------------------------ caméra */

type Plan = {de: number; a: number; p0: V3; p1: V3; c0: V3};
const GREFFIER_YEUX: V3 = [0, 1.95, 2.75];
const LARGE: V3 = [0, 0.4, -4.2];
const proche = (i: number, de: number, a: number): Plan => ({de, a, p0: add(PARCELLES[i], [0.6, 3.4, 4.3]), p1: add(PARCELLES[i], [0.2, 3.0, 3.7]), c0: add(PARCELLES[i], [0, 0.9, 0])});
const PLANS: Plan[] = [
  proche(0, 0, W.autre),
  proche(1, W.autre, W.vous),
  {de: W.vous, a: W.hier, p0: [0, 12.8, 3.9], p1: [0, 11.6, 3.7], c0: [0, 0, -1.6]},
  {de: W.hier, a: W.aujourdhui, p0: [0, 13.5, 3.9], p1: [0, 11.8, 3.6], c0: LARGE},
  {de: W.aujourdhui, a: W.banc, p0: [0, 11.5, 3.9], p1: [0, 13.2, 3.9], c0: [0, 0.4, -4.4]},
  {de: W.banc, a: W.antoine, p0: [0, 14.5, 3.9], p1: [0, 15.5, 3.9], c0: [0, 0.2, -4.8]},
  {de: W.antoine, a: W.maintenant, p0: [3.4, 4.6, -1.4], p1: [2.8, 4.3, -0.8], c0: [0, 2.8, 3.4]},
  {de: W.maintenant, a: W.a, p0: [0, 12.5, 3.9], p1: [0, 11.6, 3.8], c0: [0, 0, -1.6]},
  proche(0, W.a, W.b),
  proche(1, W.b, W.c),
  proche(2, W.c, W.mention),
  {de: W.mention, a: W.vote, p0: [0.5, 2.3, -0.7], p1: [0.3, 2.2, -0.2], c0: GREFFIER_YEUX},
  {de: W.vote, a: W.bonus, p0: [0, 11.8, 3.8], p1: [0, 12.8, 3.9], c0: [0, 0.3, -2.0]},
  {de: W.bonus, a: W.abonne, p0: [0, 13.5, 3.9], p1: [0, 12.2, 3.7], c0: [0, 0.4, -4.2]},
  {de: W.abonne, a: FIN + 1, p0: [0.4, 2.3, -0.6], p1: [0.2, 2.2, -0.1], c0: GREFFIER_YEUX},
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
  const entre = (de: number, a: number) => f >= de && f < a;
  const accroche = f < W.hier;
  const deputes = accroche ? SIEGES.length + 1 : interpolate(f, [W.aujourdhui + 4, W.banc - 4], [0, SIEGES.length + 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.quad)});
  const choisie = entre(0, W.autre) ? 0 : entre(W.autre, W.vous) ? 1 : entre(W.a, W.b) ? 0 : entre(W.b, W.c) ? 1 : entre(W.c, W.mention) ? 2 : -1;
  return {
    cam: camera(f),
    greffier: {
      humeur: f < W.aujourdhui ? 'triste' : 'joyeux',
      bras: f >= W.abonne || entre(W.antoine, W.maintenant) ? 'salue' : entre(W.maintenant, W.mention) || entre(W.vote, W.abonne) ? 'montre' : 'repos',
    },
    deputes,
    bords: 0,
    // au perchoir dès qu'Antoine est nommé, sauf dans les gros plans du Greffier (sa tête dépasserait derrière)
    president: 0,
    presidentNom: '@abonne_54',
    mysteres: accroche ? [1, 1, 1] : f >= W.maintenant && f < W.abonne ? [0, 1, 2].map((i) => pop(W.maintenant + 4 + i * 5)) : [0, 0, 0],
    lettres: accroche || (f >= W.maintenant && f < W.abonne)
      ? [0, 1, 2].map((i) => {
        const base = accroche ? 1 : pop(W.maintenant + 10 + i * 5);
        const rebond = f >= W.vote ? 1 + 0.18 * Math.max(0, Math.sin((f - W.vote) / 4 - i * 1.3)) : choisie === i ? 1.25 : 1;
        return base * rebond;
      })
      : [0, 0, 0],
    lettresTexte: 'ABC',
  };
};

/* ------------------------------------------------------------------ habillage 2D */

const TITRES: {de: number; a: number; petit: string; grand: string}[] = [
  {de: 0, a: W.autre, petit: 'UN DÉPUTÉ VEUT', grand: '300 € PAR JOUR'},
  {de: W.autre, a: W.vous, petit: 'UN AUTRE VEUT', grand: 'L’ESSENCE À 1,20 €'},
  {de: W.vous, a: W.hier, petit: 'ET C’EST VOUS', grand: 'QUI VOTEZ'},
  {de: W.hier, a: W.aujourdhui, petit: 'HIER, CETTE ASSEMBLÉE', grand: 'ÉTAIT VIDE'},
  {de: W.aujourdhui, a: W.banc, petit: 'AUJOURD’HUI', grand: `${ABONNES} DÉPUTÉS`},
  {de: W.banc, a: W.maintenant, petit: 'ILS ONT DÉJÀ', grand: 'PRIS LA PAROLE'},
  {de: W.maintenant, a: W.a, petit: 'LES 3 LOIS', grand: 'LES PLUS LIKÉES'},
  {de: W.a, a: W.b, petit: 'LOI A', grand: LOIS[0].court},
  {de: W.b, a: W.c, petit: 'LOI B', grand: LOIS[1].court},
  {de: W.c, a: W.mention, petit: 'LOI C · AUX MOINS DE 18 ANS', grand: LOIS[2].court},
  {de: W.mention, a: W.vote, petit: 'MENTION', grand: 'SPÉCIALE'},
  {de: W.vote, a: W.bonus, petit: 'VOTE EN COMMENTAIRE', grand: 'A, B OU C ?'},
  {de: W.bonus, a: W.abonne, petit: 'CONTINUE DE PROPOSER', grand: 'LOI BONUS'},
  {de: W.abonne, a: FIN + 1, petit: 'ABONNE-TOI POUR', grand: 'PRENDRE TON SIÈGE'},
];

const AFFICHAGE: Record<number, string> = {5: '*300 €*', 6: '', 7: '', 18: '*1,20 €.*', 19: '', 20: '', 35: '*233*', 36: '', 37: '', 57: '*300 €*', 58: '', 59: '',
  69: '*1,20 €,*', 70: '', 71: '', 73: '*20 000 €*', 74: '', 75: '', 87: '*18*'};
const JAUNES = new Set(['vide', 'députés', 'banc', 'gauche', 'droite', 'centre', 'étiquette', 'antoine', 'accordé', 'likées', 'gratuit', 'parcoursup', 'mort',
  'céréales', 'lait', 'vote', 'demain', 'abonne-toi', 'siège', 'voter', 'bonus', 'proposer', 'parole', 'alcool', 'interdit', 'foraine', 'salaire']);
const nu = (t: string) => t.toLowerCase().replace(/[.,?…!:]/g, '');
type Mot = {t: string; a: number; b: number};
const PAQUETS: Mot[][] = (() => {
  const mots = voix.mots
    .map((m, i) => ({...m, t: AFFICHAGE[i] ?? (JAUNES.has(nu(m.t)) ? `*${m.t}*` : m.t)}))
    .filter((m) => m.t !== '' && m.t !== ':');
  const res: Mot[][] = [];
  let cour: Mot[] = [];
  for (const m of mots) {
    cour.push(m);
    if (cour.length === 3 || /[.?…]\*?$/.test(m.t)) { res.push(cour); cour = []; }
  }
  if (cour.length) res.push(cour);
  return res;
})();

const contour = (couleur: string, ep: number) => ({WebkitTextStroke: `${ep}px ${couleur}`, paintOrder: 'stroke fill' as const});
const COEUR = 'M12 21s-7.5-4.6-10-9.3C.4 8.3 2.4 4 6.4 4c2.2 0 3.6 1.2 4.6 2.6l1 1.4 1-1.4C14 5.2 15.4 4 17.6 4c4 0 6 4.3 4.4 7.7C19.5 16.4 12 21 12 21z';

const Titre: React.FC<{f: number}> = ({f}) => {
  const {fps} = useVideoConfig();
  const t = TITRES.find((x) => f >= x.de && f < x.a);
  if (!t) return null;
  const e = spring({frame: f - t.de, fps, config: {damping: 12, stiffness: 200}});
  const taille = t.grand.length > 15 ? 92 : t.grand.length > 12 ? 108 : 128;
  return (
    <div style={{position: 'absolute', top: 230, left: 40, right: 40, textAlign: 'center', transform: `scale(${0.6 + 0.4 * e})`, opacity: Math.min(1, e * 1.5)}}>
      <div style={{fontFamily: TEXTE, fontWeight: 900, fontSize: 46, color: '#fff', letterSpacing: 1, ...contour('#1b1d24', 12)}}>{t.petit}</div>
      <div style={{fontFamily: TITRE, fontSize: taille, lineHeight: 1.0, whiteSpace: 'nowrap', color: '#ffc928', marginTop: 4,
        ...contour('#2b1a00', 18), textShadow: '0 8px 0 rgba(0,0,0,0.22)'}}>{t.grand}</div>
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

/** Compteur qui grimpe jusqu'au vrai nombre d'abonnés, avec la jauge vers la Constitution (1 000). */
const Compteur: React.FC<{f: number}> = ({f}) => {
  if (f < W.aujourdhui || f >= W.banc) return null;
  const n = Math.round(interpolate(f, [W.aujourdhui + 4, W.banc - 10], [0, ABONNES], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.quad)}));
  return (
    <div style={{position: 'absolute', top: 520, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22}}>
      <div style={{background: '#1b1d24', border: '6px solid #ffc928', borderRadius: 26, padding: '10px 34px', fontFamily: TEXTE, fontWeight: 900,
        fontSize: 58, color: '#ffc928', letterSpacing: 2, display: 'flex', gap: 18}}>
        <span style={{color: '#fff'}}>DÉPUTÉS</span> {n}
      </div>
      <div style={{width: 760, background: '#1b1d24', borderRadius: 22, padding: 10, border: '5px solid #fff'}}>
        <div style={{height: 34, width: `${(n / 1000) * 100}%`, background: '#ffc928', borderRadius: 14}} />
      </div>
      <div style={{fontFamily: TEXTE, fontWeight: 900, fontSize: 34, color: '#fff', ...contour('#1b1d24', 10)}}>{n} / 1 000 → LA CONSTITUTION</div>
    </div>
  );
};

/** Les bancs : chaque pseudo à la place qu'il a demandée en commentaire. */
const Bancs: React.FC<{f: number}> = ({f}) => {
  const {fps} = useVideoConfig();
  if (f < W.banc || f >= W.antoine) return null;
  // tous les noms sont affichés à mi-plan, pour laisser le temps de se chercher
  const pas = Math.max(1, Math.floor(((W.antoine - W.banc) * 0.45) / NB_NOMS));
  let k = 0;
  return (
    <div style={{position: 'absolute', top: 470, left: 24, right: 24, display: 'flex', gap: 12, alignItems: 'flex-start'}}>
      {BANCS.map((b) => (
        <div key={b.titre} style={{flex: 1, background: 'rgba(27,29,36,0.88)', borderRadius: 22, border: `5px solid ${b.couleur}`, padding: '10px 8px 14px',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3}}>
          <div style={{fontFamily: TITRE, fontSize: 46, color: b.couleur, lineHeight: 1.05, textAlign: 'center', marginBottom: 6}}>{b.titre}</div>
          {b.noms.map((n) => {
            const e = spring({frame: f - W.banc - 4 - (k++) * pas, fps, config: {damping: 13, stiffness: 220}});
            return <div key={n} style={{fontFamily: TEXTE, fontWeight: 900, fontSize: Math.min(34, 760 / n.length), color: '#fff', transform: `scale(${e})`,
              whiteSpace: 'nowrap', lineHeight: 1.25}}>{n}</div>;
          })}
        </div>
      ))}
    </div>
  );
};

/** Une proposition de loi telle qu'écrite en commentaire, avec ses vrais likes. */
const Carte: React.FC<{i: number; e: number; grand?: boolean}> = ({i, e, grand}) => {
  const p = LOIS[i];
  return (
    <div style={{transform: `scale(${e}) rotate(${i % 2 ? 1.2 : -1.2}deg)`, background: '#fff', borderRadius: 28, padding: grand ? '20px 28px' : '14px 24px',
      boxShadow: '0 8px 0 rgba(0,0,0,0.18)', fontFamily: TEXTE, fontWeight: 900, display: 'flex', alignItems: 'center', gap: 20, border: '6px solid #ffc928'}}>
      <div style={{flex: 'none', width: grand ? 92 : 74, height: grand ? 92 : 74, borderRadius: 50, background: '#ffc928', border: '6px solid #2b1a00',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: TITRE, fontSize: grand ? 64 : 52, color: '#2b1a00'}}>{'ABC'[i]}</div>
      <div style={{flex: 1}}>
        <div style={{fontSize: grand ? 32 : 27, color: '#8a8f99'}}>{p.pseudo}</div>
        <div style={{fontSize: grand ? 46 : 36, color: '#1b1d24', lineHeight: 1.1}}>{p.loi}</div>
      </div>
      <div style={{flex: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#ff3b5c', fontSize: grand ? 36 : 30}}>
        <svg width={grand ? 52 : 44} height={grand ? 52 : 44} viewBox="0 0 24 24"><path fill="#ff3b5c" d={COEUR} /></svg>
        {p.likes}
      </div>
    </div>
  );
};

const Lois: React.FC<{f: number}> = ({f}) => {
  const {fps} = useVideoConfig();
  const s = (de: number) => spring({frame: f - de, fps, config: {damping: 12}});
  if (f >= W.maintenant && f < W.a) {
    return (
      <div style={{position: 'absolute', top: 560, left: 60, right: 60, display: 'flex', flexDirection: 'column', gap: 22}}>
        {LOIS.map((_, i) => <Carte key={i} i={i} e={s(W.maintenant + 6 + i * 6)} />)}
      </div>
    );
  }
  const i = f < W.autre ? 0 : f < W.vous ? 1 : f >= W.a && f < W.b ? 0 : f >= W.b && f < W.c ? 1 : f >= W.c && f < W.mention ? 2 : -1;
  if (i < 0) return null;
  const de = f < W.vous ? (i === 0 ? 0 : W.autre) : [W.a, W.b, W.c][i];
  return <div style={{position: 'absolute', top: 1000, left: 50, right: 50}}><Carte i={i} e={s(de + 3)} grand /></div>;
};

/** Mention spéciale : une demande drôle, pas retenue (pas assez de likes). */
const Mention: React.FC<{f: number}> = ({f}) => {
  const {fps} = useVideoConfig();
  if (f < W.mention || f >= W.vote) return null;
  const e = spring({frame: f - W.mention - 4, fps, config: {damping: 12}});
  const tampon = f >= W.pas ? spring({frame: f - W.pas, fps, config: {damping: 9, stiffness: 260}}) : 0;
  return (
    <div style={{position: 'absolute', top: 560, left: 80, right: 80}}>
      <div style={{transform: `scale(${e}) rotate(-2deg)`, background: '#fff', borderRadius: 30, padding: '20px 30px', boxShadow: '0 10px 0 rgba(0,0,0,0.18)', fontFamily: TEXTE, fontWeight: 900}}>
        <div style={{fontSize: 30, color: '#8a8f99'}}>@abonne_102</div>
        <div style={{fontSize: 48, color: '#1b1d24', lineHeight: 1.1}}>L’école est une fête foraine</div>
      </div>
      {tampon > 0.01 && (
        <div style={{position: 'absolute', top: 150, right: 0, transform: `scale(${2.2 - 1.2 * tampon}) rotate(-9deg)`, opacity: Math.min(1, tampon * 1.4),
          border: '9px solid #e0283f', color: '#e0283f', borderRadius: 16, padding: '6px 22px', fontFamily: TITRE, fontSize: 64, background: 'rgba(255,255,255,0.9)'}}>
          PAS RETENUE… POUR L’INSTANT
        </div>
      )}
    </div>
  );
};

const Resultat: React.FC<{f: number}> = ({f}) => {
  const {fps} = useVideoConfig();
  if (f < W.vote + 10 || f >= W.bonus) return null;
  const e = spring({frame: f - W.vote - 10, fps, config: {damping: 10}});
  return (
    <div style={{position: 'absolute', top: 1110, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
      <div style={{transform: `scale(${e})`, background: '#1b1d24', color: '#ffc928', fontFamily: TEXTE, fontWeight: 900, fontSize: 46, padding: '12px 36px',
        borderRadius: 40, border: '5px solid #ffc928'}}>RÉSULTAT DEMAIN</div>
    </div>
  );
};

/** Appel à continuer : n'importe quelle proposition peut devenir la loi bonus si elle est la plus likée. */
const Bonus: React.FC<{f: number}> = ({f}) => {
  const {fps} = useVideoConfig();
  if (f < W.bonus || f >= W.abonne) return null;
  const e = spring({frame: f - W.bonus - 4, fps, config: {damping: 12}});
  const pastille = spring({frame: f - W.bonus - 30, fps, config: {damping: 9, stiffness: 240}});
  const coeurs = Math.round(interpolate(f, [W.bonus + 10, W.abonne - 4], [1, 999], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.in(Easing.quad)}));
  return (
    <div style={{position: 'absolute', top: 600, left: 70, right: 70, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 34}}>
      <div style={{transform: `scale(${e}) rotate(-2deg)`, width: '100%', background: '#fff', borderRadius: 30, padding: '20px 30px', boxShadow: '0 10px 0 rgba(0,0,0,0.18)',
        fontFamily: TEXTE, fontWeight: 900, display: 'flex', alignItems: 'center', gap: 20}}>
        <div style={{flex: 1}}>
          <div style={{fontSize: 30, color: '#8a8f99'}}>@toi · à l’instant</div>
          <div style={{fontSize: 48, color: '#1b1d24', lineHeight: 1.1}}>Je propose : ta loi ici ✍️</div>
        </div>
        <div style={{flex: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#ff3b5c', fontSize: 32}}>
          <svg width="48" height="48" viewBox="0 0 24 24"><path fill="#ff3b5c" d={COEUR} /></svg>{coeurs}
        </div>
      </div>
      <div style={{transform: `scale(${pastille})`, background: '#ffc928', color: '#2b1a00', fontFamily: TITRE, fontSize: 60, padding: '10px 36px', borderRadius: 40,
        border: '7px solid #2b1a00'}}>LA PLUS LIKÉE = LOI BONUS</div>
    </div>
  );
};

const BoutonAbonne: React.FC<{f: number}> = ({f}) => {
  const {fps} = useVideoConfig();
  const de = W.abonne + 6;
  if (f < de) return null;
  const e = spring({frame: f - de, fps, config: {damping: 10}});
  const fait = f >= de + 30;
  const clic = fait ? spring({frame: f - de - 30, fps, config: {damping: 8, stiffness: 300}}) : 0;
  return (
    <div style={{position: 'absolute', top: 1470, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
      <div style={{transform: `scale(${e * (1 + 0.12 * Math.sin(clic * Math.PI))})`, background: fait ? '#8a8f99' : '#fe2c55', color: '#fff',
        fontFamily: TEXTE, fontWeight: 900, fontSize: 58, padding: '18px 60px', borderRadius: 60, border: '6px solid #fff',
        boxShadow: '0 10px 0 rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', gap: 18}}>
        {fait ? 'ABONNÉ' : "S'ABONNER"}
        {fait && <svg width="50" height="50" viewBox="0 0 24 24"><path fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" d="M4 12.5l5 5L20 6.5" /></svg>}
      </div>
    </div>
  );
};

const Confettis: React.FC<{f: number}> = ({f}) => {
  const de = W.abonne + 38;
  if (f < de) return null;
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
  const [poignee] = useState(() => delayRender('polices assemblée yt ep02'));
  useEffect(() => {
    Promise.all([lilita.waitUntilDone(), montserrat.waitUntilDone()]).then(() => { setPret(true); continueRender(poignee); });
  }, [poignee]);
  return pret;
};

export const AssembleeYouTubeEp02: React.FC = () => {
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
      <Compteur f={f} />
      <Bancs f={f} />
      <Lois f={f} />
      <Mention f={f} />
      <Resultat f={f} />
      <Bonus f={f} />
      <SousTitre t={f / 30} />
      <BoutonAbonne f={f} />
      <Confettis f={f} />
      <Audio src={staticFile('assemblee/youtube_ep02_voix.wav')} />
    </AbsoluteFill>
  );
};
