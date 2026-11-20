import {loadFont as chargerLilita} from '@remotion/google-fonts/LilitaOne';
import {loadFont as chargerMontserrat} from '@remotion/google-fonts/Montserrat';
import {ThreeCanvas} from '@remotion/three';
import {useEffect, useState} from 'react';
import {AbsoluteFill, Audio, Easing, continueRender, delayRender, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import voix from './tiktok_ep06_voix.json';
import {EtatAssemblee, Hemicycle, SIEGES} from './Assemblee3D';

/* Épisode 6, branche TikTok — « le duel à l'aveugle » : deux vraies propositions, une de Mélenchon, une de Marine Le Pen, présentées sans leur auteur.
   Loi A = garantie d'autonomie 1 063 €/mois, 3 ans, 18-25 ans sous réserve de formation (L'Avenir en commun 2022 ; Institut Montaigne, melenchon.fr).
   Loi B = exonération d'impôt sur le revenu des jeunes actifs jusqu'à 30 ans (RN « 22 mesures pour 2022 » ; reproposée en oct. 2026 selon LCP).
   Révélation de l'auteur à l'épisode 7 (promesse = abonnement). Vote de l'ép. 5 dépouillé le 16/11/2026 : candidat 2 @abonne_81 16 voix, 3 → 5, 1 → 3, 4 → 0.
   Neutralité : une mesure de chaque camp, même poids (argent des jeunes), aucune caricature, aucun visage. */

const lilita = chargerLilita('normal', {subsets: ['latin', 'latin-ext']});
const montserrat = chargerMontserrat('normal', {weights: ['900'], subsets: ['latin', 'latin-ext']});
const TITRE = lilita.fontFamily;
const TEXTE = montserrat.fontFamily;

const ABONNES = 759;
const FIN_VOIX = voix.duree + 1.3;
export const DUREE_ASSEMBLEE_TT06 = Math.ceil(FIN_VOIX * 30);

const M = (i: number) => Math.round((voix.mots[i].a - 0.08) * 30);
const FIN = Math.round(FIN_VOIX * 30);
const W = {
  a: M(17), b: M(35), vraies: M(53), decision: M(62), elu: M(71), ici: M(79), commente: M(85), envoie: M(89), demain: M(99), abonne: M(106),
};

type V3 = [number, number, number];
type Ressort = {damping?: number; stiffness?: number};
const ease = Easing.inOut(Easing.cubic);
const mix = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const entre = (f: number, de: number, a: number) => f >= de && f < a;
const SEC: Ressort = {damping: 9, stiffness: 260};

/* ------------------------------------------------------------------ données réelles */

const LOIS = [
  {l: 'A', couleur: '#e94b5a', titre: '1 063 € / MOIS', detail: 'pendant 3 ans · pour les 18-25 ans en formation'},
  {l: 'B', couleur: '#3f7fd9', titre: '0 € D’IMPÔT', detail: 'sur le revenu · pour les jeunes qui travaillent · jusqu’à 30 ans'},
];
const PM = {pseudo: '@abonne_81', voix: 16, programme: 'LA MÊME JUSTICE POUR TOUS'};
const SCORES: [string, number][] = [['2', 16], ['3', 5], ['1', 3], ['4', 0]];

/* ------------------------------------------------------------------ caméra */

type Plan = {de: number; a: number; p0: V3; p1: V3; c0: V3};
const GREFFIER_YEUX: V3 = [0, 1.95, 2.75];
const haut = (de: number, a: number, z0 = 12.6, z1 = 11.6): Plan => ({de, a, p0: [0, z0, 3.9], p1: [0, z1, 3.7], c0: [0, 0.2, -3.0]});
const large = (de: number, a: number, z0 = 13.5, z1 = 15.2): Plan => ({de, a, p0: [0, z0, 3.9], p1: [0, z1, 3.9], c0: [0, 0.3, -4.6]});
const greffier = (de: number, a: number): Plan => ({de, a, p0: [0.5, 2.3, -0.7], p1: [0.3, 2.2, -0.2], c0: GREFFIER_YEUX});
const PLANS: Plan[] = [
  haut(0, W.decision, 11.4, 12.4),
  haut(W.decision, W.ici, 12.2, 11.2),
  large(W.ici, FIN + 1, 13.8, 15.4),
];
const camera = (f: number): EtatAssemblee['cam'] => {
  const p = PLANS.find((x) => f >= x.de && f < x.a) ?? PLANS[PLANS.length - 1];
  const t = interpolate(f, [p.de, p.a], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return {pos: mix(p.p0, p.p1, ease(t)), cible: p.c0, fov: 40};
};

/* ------------------------------------------------------------------ état 3D */

const useEtat = (f: number): EtatAssemblee => {
  const plansGreffier = false && entre(f, W.decision, W.ici);
  return {
    cam: camera(f),
    greffier: {humeur: 'joyeux', bras: f >= W.abonne ? 'salue' : plansGreffier ? 'montre' : 'repos'},
    deputes: SIEGES.length + 1, bords: 0, president: !plansGreffier ? 1 : 0, presidentNom: '@abonne_54',
    lignes: 0, constitution: 0, mysteres: [0, 0, 0], lettres: [0, 0, 0], lettresTexte: 'ABC',
  };
};

/* ------------------------------------------------------------------ habillage 2D */

const TITRES: {de: number; a: number; petit: string; grand: string; rouge?: boolean}[] = [
  {de: 0, a: W.a, petit: 'MÉLENCHON OU LE PEN ?', grand: 'TU VOTES LAQUELLE ?'},
  {de: W.a, a: W.b, petit: 'LOI A', grand: '1 063 € PAR MOIS'},
  {de: W.b, a: W.vraies, petit: 'LOI B', grand: '0 € D’IMPÔT'},
  {de: W.vraies, a: W.decision, petit: 'DEUX VRAIES', grand: 'PROPOSITIONS'},
  {de: W.decision, a: W.elu, petit: 'LA 1RE DÉCISION DU', grand: 'PREMIER MINISTRE'},
  {de: W.elu, a: W.ici, petit: 'ÉLU AVEC 16 VOIX', grand: 'CANDIDAT N° 2'},
  {de: W.ici, a: W.envoie, petit: 'VOTE EN COMMENTAIRE', grand: 'A OU B ?'},
  {de: W.envoie, a: W.demain, petit: 'ENVOIE-LA À TON POTE', grand: 'DE L’AUTRE CAMP'},
  {de: W.demain, a: W.abonne, petit: 'DEMAIN', grand: 'QUI A ÉCRIT QUOI ?', rouge: true},
  {de: W.abonne, a: FIN + 1, petit: 'ABONNE-TOI POUR SAVOIR', grand: 'TU AS VOTÉ QUI ?'},
];

const AFFICHAGE: Record<number, string> = {20: '*1 063*', 21: '', 22: '€', 26: '*3*', 30: '*18-25*', 31: '', 38: '*0*', 39: '€', 51: '*30*', 73: '*16*', 77: 'n°', 78: '*2.*'};
const JAUNES = new Set(['mélenchon.', 'pen.', 'votes', 'formation.', 'revenu,', 'vraies', 'ministre.', 'député.', 'a', 'b.', 'pote', 'camp.', 'quoi.', 'abonne-toi', 'mélenchon,', 'pen,']);
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


const CarteLoi: React.FC<{loi: typeof LOIS[number]; e: number; vote?: number; actif?: boolean}> = ({loi, e, vote, actif}) => (
  <div style={{transform: `scale(${e * (actif ? 1.04 : 1)}) rotate(${loi.l === 'A' ? -1.5 : 1.5}deg)`, background: '#fff', borderRadius: 30, border: `8px solid ${loi.couleur}`,
    padding: '20px 26px', display: 'flex', alignItems: 'center', gap: 24, boxShadow: '0 10px 0 rgba(0,0,0,0.2)', fontFamily: TEXTE, fontWeight: 900}}>
    <div style={{flex: 'none', width: 130, height: 130, borderRadius: 70, background: loi.couleur, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: TITRE, fontSize: 100}}>{loi.l}</div>
    <div style={{flex: 1}}>
      <div style={{fontFamily: TITRE, fontSize: 76, color: '#1b1d24', lineHeight: 1}}>{loi.titre}</div>
      <div style={{fontSize: 32, color: '#5b616d', marginTop: 8, lineHeight: 1.15}}>{loi.detail}</div>
      <div style={{fontSize: 26, color: '#8a8f99', marginTop: 8}}>proposée par : <span style={{background: '#1b1d24', color: '#1b1d24', borderRadius: 6, padding: '0 40px'}}>????????</span></div>
    </div>
    {vote !== undefined && <div style={{flex: 'none', fontFamily: TITRE, fontSize: 64, color: loi.couleur}}>{vote}</div>}
  </div>
);

/** Le duel : les deux lois face à face, auteur masqué. */
const Duel: React.FC<{f: number}> = ({f}) => {
  const s = useS(f);
  const visible = f < W.decision || f >= W.ici;
  if (!visible) return null;
  const actif = f >= W.ici ? Math.floor((f - W.ici) / 12) % 2 : f >= W.b ? 1 : f >= W.a ? 0 : -1;
  return (
    <div style={{position: 'absolute', top: 560, left: 50, right: 50, display: 'flex', flexDirection: 'column', gap: 30}}>
      {LOIS.map((l, i) => <CarteLoi key={l.l} loi={l} e={s((f >= W.ici ? W.ici : 4) + i * 6, SEC)} actif={actif === i} />)}
      {f < W.a && (
        <div style={{display: 'flex', justifyContent: 'center', gap: 30, transform: `scale(${s(M(8), SEC)})`}}>
          {['MÉLENCHON', 'LE PEN'].map((n) => (
            <span key={n} style={{background: '#1b1d24', color: '#ffc928', fontFamily: TITRE, fontSize: 52, padding: '6px 26px', borderRadius: 20, border: '5px solid #ffc928'}}>{n} ?</span>
          ))}
        </div>
      )}
      {f >= W.ici && f < W.envoie && <Commentaire pseudo="@toi · à l’instant" texte={actif === 0 ? 'A' : 'B'} e={s(W.commente + 4)} taille={70} />}
    </div>
  );
};

/** Le Premier ministre élu : résultat du vote de l'ép. 5. */
const Elu: React.FC<{f: number}> = ({f}) => {
  const s = useS(f);
  if (f < W.decision || f >= W.ici) return null;
  return (
    <div style={{position: 'absolute', top: 600, left: 70, right: 70, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22}}>
      <div style={{transform: `scale(${s(W.decision + 2, SEC)})`, background: '#1b1d24', border: '8px solid #ffc928', borderRadius: 34, padding: '24px 40px', textAlign: 'center', fontFamily: TEXTE, fontWeight: 900}}>
        <div style={{fontSize: 90}}>🪑</div>
        <div style={{fontSize: 34, color: '#fff'}}>PREMIER MINISTRE</div>
        <div style={{fontFamily: TITRE, fontSize: 84, color: '#ffc928'}}>{PM.pseudo}</div>
        <div style={{fontSize: 30, color: '#d5e2e8'}}>{PM.programme}</div>
      </div>
      {f >= W.elu && (
        <div style={{display: 'flex', gap: 16}}>
          {SCORES.map(([n, v], i) => (
            <div key={n} style={{transform: `scale(${s(W.elu + 4 + i * 4)})`, background: n === '2' ? '#ffc928' : '#fff', border: '5px solid #1b1d24', borderRadius: 20, padding: '8px 18px',
              fontFamily: TITRE, fontSize: 46, color: '#1b1d24'}}>{n} · {v} VOIX</div>
          ))}
        </div>
      )}
      <Tampon e={s(W.elu + 20, SEC)} texte="ÉLU" top={-30} />
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
  const [poignee] = useState(() => delayRender('polices assemblée ep06'));
  useEffect(() => {
    Promise.all([lilita.waitUntilDone(), montserrat.waitUntilDone()]).then(() => { setPret(true); continueRender(poignee); });
  }, [poignee]);
  return pret;
};

export const AssembleeTikTokEp06: React.FC = () => {
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
      <Duel f={f} />
      <Elu f={f} />
      <SousTitre t={f / 30} />
      <BoutonAbonne f={f} />
      <Confettis f={f} de={W.elu + 20} a={W.ici} />
      <Confettis f={f} de={W.abonne + 20} a={FIN + 1} />
      <Audio src={staticFile('assemblee/tiktok_ep06_voix.wav')} />
    </AbsoluteFill>
  );
};
