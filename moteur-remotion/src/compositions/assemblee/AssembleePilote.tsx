import {loadFont as chargerLilita} from '@remotion/google-fonts/LilitaOne';
import {loadFont as chargerMontserrat} from '@remotion/google-fonts/Montserrat';
import {ThreeCanvas} from '@remotion/three';
import {useEffect, useState} from 'react';
import {AbsoluteFill, Audio, Easing, continueRender, delayRender, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import voix from './pilote_voix.json';
import {EtatAssemblee, Hemicycle, PARCELLES, SIEGES} from './Assemblee3D';

const lilita = chargerLilita('normal', {subsets: ['latin', 'latin-ext']});
const montserrat = chargerMontserrat('normal', {weights: ['900'], subsets: ['latin', 'latin-ext']});
const TITRE = lilita.fontFamily;
const TEXTE = montserrat.fontFamily;

const FIN_VOIX = voix.duree + 0.9;
export const DUREE_ASSEMBLEE_PILOTE = Math.ceil(FIN_VOIX * 30);

/** Image où commence le mot n° i de la voix (un peu en avance : la scène change juste avant le mot). */
const M = (i: number) => Math.round((voix.mots[i].a - 0.08) * 30);
const FIN = Math.round(FIN_VOIX * 30);
// début de chaque plan, accroché aux mots (indices dans pilote_voix.json)
const W = {code: M(5), assemblee: M(9), toi: M(15), abonne: M(20), siege: M(24), comm: M(30), passe: M(35), mille: M(42),
  dixMille: M(49), vote: M(57), propose: M(64), trois: M(69), abonneToi: M(77)};

type V3 = [number, number, number];
const ease = Easing.inOut(Easing.cubic);
const mix = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];

/* ------------------------------------------------------------------ caméra : un mouvement par plan */

type Plan = {de: number; a: number; p0: V3; p1: V3; c0: V3};
const GREFFIER_YEUX: V3 = [0, 1.95, 2.75];
const CODE: V3 = [0, 1.15, 0.7];
const PLANS: Plan[] = [
  {de: 0, a: W.code, p0: [0, 13.5, 3.9], p1: [0, 11.5, 3.6], c0: [0, 0.4, -4.2]},
  {de: W.code, a: W.assemblee, p0: [0, 3.5, -2.9], p1: [0, 3.2, -2.4], c0: CODE},
  {de: W.assemblee, a: W.toi, p0: [0, 4.3, 2.4], p1: [0, 4.8, 2.0], c0: [0, 1.0, -6]},
  {de: W.toi, a: W.abonne, p0: [0.5, 2.3, -0.7], p1: [0.3, 2.2, -0.2], c0: GREFFIER_YEUX},
  {de: W.abonne, a: W.comm, p0: [0, 11.5, 3.9], p1: [0, 13, 3.9], c0: [0, 0.4, -4.4]},
  {de: W.comm, a: W.passe, p0: [-5.5, 5.0, 3.2], p1: [-4.6, 4.6, 2.6], c0: [0, 1.0, -3.8]},
  {de: W.passe, a: W.mille, p0: [0, 3.5, -3.2], p1: [0, 3.2, -2.6], c0: [0, 1.75, 0.7]},
  {de: W.mille, a: W.dixMille, p0: [0, 5.2, 3.9], p1: [0, 5.6, 3.6], c0: [0, 4.0, -8.3]},
  {de: W.dixMille, a: W.vote, p0: [0, 3.8, -6.2], p1: [0, 4.0, -5.4], c0: [0, 2.3, 2.9]},
  {de: W.vote, a: W.propose, p0: [0, 12.5, 3.9], p1: [0, 11.8, 3.8], c0: [0, 0, -1.6]},
  {de: W.propose, a: W.trois, p0: [0, 11.8, 3.8], p1: [0, 12.8, 3.9], c0: [0, 0.6, -2.6]},
  {de: W.trois, a: W.abonneToi, p0: [0, 12.8, 3.9], p1: [0, 11.6, 3.7], c0: [0, 0, -1.6]},
  {de: W.abonneToi, a: FIN + 1, p0: [0.4, 2.3, -0.6], p1: [0.2, 2.2, -0.1], c0: GREFFIER_YEUX},
];

const camera = (f: number): EtatAssemblee['cam'] => {
  const p = PLANS.find((x) => f >= x.de && f < x.a) ?? PLANS[PLANS.length - 1];
  const t = interpolate(f, [p.de, p.a], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return {pos: mix(p.p0, p.p1, ease(t)), cible: p.c0, fov: 40};
};

/* ------------------------------------------------------------------ état de la scène à chaque image */

const useEtat = (f: number): EtatAssemblee => {
  const {fps} = useVideoConfig();
  const pop = (de: number) => (f < de ? 0 : spring({frame: f - de, fps, config: {damping: 11, stiffness: 170}}));
  const entre = (de: number, a: number) => f >= de && f < a;
  // les sièges se remplissent à toute vitesse, puis le dernier rang se complète pendant « sans limite »
  const deputes = interpolate(f, [W.abonne + 6, W.siege, W.comm - 6], [0, SIEGES.length * 0.45, SIEGES.length + 1],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.quad)});
  const voix0 = (de: number, a: number) => (entre(de, a) ? pop(de + 4) : 0);
  return {
    cam: camera(f),
    greffier: {
      humeur: f < W.toi ? 'triste' : 'joyeux',
      bras: entre(W.toi, W.abonne) || f >= W.abonneToi ? 'salue' : entre(W.vote, W.propose) ? 'montre' : 'repos',
    },
    deputes,
    etiquettes: entre(W.siege, W.comm) ? 1 : 0,
    lignes: interpolate(f, [W.passe + 4, W.mille - 8], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
    loiNom: entre(M(39), W.mille) ? pop(M(39)) : 0,
    constitution: voix0(W.mille, W.dixMille),
    trone: voix0(W.dixMille, W.vote),
    mysteres: f < W.abonneToi ? [0, 1, 2].map((i) => pop(W.vote + 4 + i * 5)) : [0, 0, 0],
    // « ? » tant que les lois ne sont pas proposées, puis A, B, C quand les trois plus likées passent au vote
    lettres: f >= W.vote && f < W.abonneToi ? [0, 1, 2].map((i) => (f < W.trois ? pop(W.vote + 10 + i * 5) : pop(W.trois + 4 + i * 5))) : [0, 0, 0],
    lettresTexte: f < W.trois ? '???' : 'ABC',
  };
};

/* ------------------------------------------------------------------ habillage 2D */

const TITRES: {de: number; a: number; petit: string; grand: string}[] = [
  {de: 0, a: W.code, petit: "CE PAYS N'A", grand: 'AUCUNE LOI'},
  {de: W.code, a: W.assemblee, petit: 'SON CODE EST', grand: 'VIDE'},
  {de: W.assemblee, a: W.toi, petit: 'AUCUN', grand: 'DÉPUTÉ'},
  {de: W.toi, a: W.abonne, petit: 'MAIS MAINTENANT', grand: "ELLE T'A TOI"},
  {de: W.abonne, a: W.siege, petit: '1 ABONNÉ', grand: '= 1 DÉPUTÉ'},
  {de: W.siege, a: W.comm, petit: 'UN SIÈGE DE PLUS', grand: 'SANS LIMITE'},
  {de: W.comm, a: W.passe, petit: '1 COMMENTAIRE', grand: '= 1 LOI'},
  {de: W.passe, a: W.mille, petit: 'SI ELLE PASSE', grand: 'ELLE A TON NOM'},
  {de: W.mille, a: W.dixMille, petit: '1 000 ABONNÉS', grand: 'LA CONSTITUTION'},
  {de: W.dixMille, a: W.vote, petit: '10 000 ABONNÉS', grand: 'UN PRÉSIDENT ?'},
  {de: W.vote, a: W.propose, petit: 'LA PREMIÈRE LOI', grand: "C'EST TOI QUI L'ÉCRIS"},
  {de: W.propose, a: W.trois, petit: 'PROPOSE TA LOI', grand: 'EN COMMENTAIRE'},
  {de: W.trois, a: W.abonneToi, petit: 'LES 3 PLUS LIKÉES', grand: 'AU VOTE DEMAIN'},
  {de: W.abonneToi, a: FIN + 1, petit: 'ABONNE-TOI POUR', grand: 'PRENDRE TON SIÈGE'},
];

// mots affichés, un pour un avec les mots dits ; * = jaune ; "" = collé au mot précédent
const AFFICHAGE: Record<number, string> = {43: '*1 000*', 51: '*10 000…*', 52: '', 70: '*3*'};
const JAUNES = new Set(['loi', 'vide', 'député', 'toi', 'abonné', 'siège', 'limite', 'commentaire', 'nom', 'constitution', 'président',
  'demain', 'abonne-toi', 'vote', "l'écris", 'propose', 'likées']);
const nu = (t: string) => t.toLowerCase().replace(/[.,?…!]/g, '');
type Mot = {t: string; a: number; b: number};
const PAQUETS: Mot[][] = (() => {
  const mots = voix.mots
    .map((m, i) => ({...m, t: AFFICHAGE[i] ?? (JAUNES.has(nu(m.t)) ? `*${m.t}*` : m.t)}))
    .filter((m) => m.t !== '' && m.t !== '?');
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

const Titre: React.FC<{f: number}> = ({f}) => {
  const {fps} = useVideoConfig();
  const t = TITRES.find((x) => f >= x.de && f < x.a);
  if (!t) return null;
  const e = spring({frame: f - t.de, fps, config: {damping: 12, stiffness: 200}});
  const taille = t.grand.length > 18 ? 80 : t.grand.length > 15 ? 92 : t.grand.length > 12 ? 108 : 128;
  return (
    <div style={{position: 'absolute', top: 230, left: 40, right: 40, textAlign: 'center', transform: `scale(${0.6 + 0.4 * e})`, opacity: Math.min(1, e * 1.5)}}>
      <div style={{fontFamily: TEXTE, fontWeight: 900, fontSize: 46, color: '#fff', letterSpacing: 1, ...contour('#1b1d24', 12)}}>{t.petit}</div>
      <div style={{fontFamily: TITRE, fontSize: taille, lineHeight: 1.0, whiteSpace: 'nowrap', color: '#ffc928', marginTop: 4,
        ...contour('#2b1a00', 18), textShadow: '0 8px 0 rgba(0,0,0,0.22)'}}>{t.grand}</div>
    </div>
  );
};

/** Sous-titres par paquets de 3 mots au plus, coupés en fin de phrase, calés sur la voix. */
const SousTitre: React.FC<{t: number}> = ({t}) => {
  const i = PAQUETS.findIndex((p, k) => t >= p[0].a - 0.05 && t < (PAQUETS[k + 1]?.[0].a ?? p[p.length - 1].b + 0.4) - 0.05);
  if (i < 0) return null;
  const paquet = PAQUETS[i];
  return (
    <div style={{position: 'absolute', top: 1290, left: 60, right: 60, textAlign: 'center', fontFamily: TEXTE, fontWeight: 900, fontSize: 70, lineHeight: 1.1, ...contour('#000', 14)}}>
      {paquet.map((m, j) => {
        const jaune = m.t.startsWith('*');
        const dit = t >= m.a - 0.05;
        return <span key={j} style={{color: jaune ? '#ffc928' : '#fff', opacity: dit ? 1 : 0.35}}>{m.t.replace(/\*/g, '')}{j < paquet.length - 1 ? ' ' : ''}</span>;
      })}
    </div>
  );
};

/** Compteur de députés pendant le remplissage de l'hémicycle. */
const Compteur: React.FC<{f: number; n: number}> = ({f, n}) => {
  if (f < W.abonne || f >= W.comm) return null;
  return (
    <div style={{position: 'absolute', top: 520, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
      <div style={{background: '#1b1d24', border: '6px solid #ffc928', borderRadius: 26, padding: '10px 34px', fontFamily: TEXTE, fontWeight: 900,
        fontSize: 58, color: '#ffc928', letterSpacing: 2, display: 'flex', gap: 18, alignItems: 'center'}}>
        <span style={{color: '#fff'}}>DÉPUTÉS</span> {f >= W.siege + 20 ? '∞' : Math.floor(n)}
      </div>
    </div>
  );
};

const BulleCommentaire: React.FC<{f: number}> = ({f}) => {
  const {fps} = useVideoConfig();
  if (f < W.comm + 6 || f >= W.passe) return null;
  const e = spring({frame: f - W.comm - 6, fps, config: {damping: 12}});
  return (
    <div style={{position: 'absolute', top: 640, left: 90, transform: `scale(${e}) rotate(-3deg)`, transformOrigin: 'left center',
      background: '#fff', borderRadius: 30, padding: '20px 30px', boxShadow: '0 10px 0 rgba(0,0,0,0.18)', fontFamily: TEXTE, fontWeight: 900}}>
      <div style={{fontSize: 30, color: '#8a8f99'}}>@toi · il y a 2 s</div>
      <div style={{fontSize: 44, color: '#1b1d24', display: 'flex', alignItems: 'center', gap: 16}}>
        Je propose : 4 jours de week-end !
        <svg width="40" height="40" viewBox="0 0 24 24"><path fill="#ff3b5c" d="M12 21s-7.5-4.6-10-9.3C.4 8.3 2.4 4 6.4 4c2.2 0 3.6 1.2 4.6 2.6l1 1.4 1-1.4C14 5.2 15.4 4 17.6 4c4 0 6 4.3 4.4 7.7C19.5 16.4 12 21 12 21z" /></svg>
      </div>
    </div>
  );
};

/** Propositions des abonnés : les likes montent, puis les trois plus likées deviennent A, B et C. */
const PROPOSITIONS = [
  {pseudo: '@abonne_02', loi: '4 jours de week-end', likes: 2400},
  {pseudo: '@abonne_03', loi: 'Pas de devoirs le week-end', likes: 1800},
  {pseudo: '@abonne_05', loi: 'Le kebab remboursé par la Sécu', likes: 1100},
  {pseudo: '@abonne_04', loi: 'Les profs notés par les élèves', likes: 640},
];
const Propositions: React.FC<{f: number}> = ({f}) => {
  const {fps} = useVideoConfig();
  if (f < W.propose || f >= W.abonneToi) return null;
  const montee = interpolate(f, [W.propose + 6, W.trois], [0.05, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.quad)});
  const choix = f >= W.trois;
  const fmt = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(1).replace('.', ',')} k` : String(Math.round(n)));
  return (
    <div style={{position: 'absolute', top: 560, left: 60, right: 60, display: 'flex', flexDirection: 'column', gap: 22}}>
      {PROPOSITIONS.map((p, i) => {
        const e = spring({frame: f - W.propose - 4 - i * 6, fps, config: {damping: 12}});
        const retenue = i < 3;
        const badge = choix && retenue ? spring({frame: f - W.trois - 4 - i * 5, fps, config: {damping: 9, stiffness: 220}}) : 0;
        return (
          <div key={p.pseudo} style={{transform: `scale(${e}) rotate(${i % 2 ? 1.5 : -1.5}deg)`, opacity: choix && !retenue ? 0.25 : 1,
            background: '#fff', borderRadius: 28, padding: '14px 26px', boxShadow: '0 8px 0 rgba(0,0,0,0.18)', fontFamily: TEXTE, fontWeight: 900,
            display: 'flex', alignItems: 'center', gap: 20, border: badge > 0.5 ? '6px solid #ffc928' : '6px solid transparent'}}>
            {badge > 0.01 && (
              <div style={{transform: `scale(${badge})`, flex: 'none', width: 74, height: 74, borderRadius: 37, background: '#ffc928', border: '6px solid #2b1a00',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: TITRE, fontSize: 52, color: '#2b1a00'}}>{'ABC'[i]}</div>
            )}
            <div style={{flex: 1}}>
              <div style={{fontSize: 28, color: '#8a8f99'}}>{p.pseudo}</div>
              <div style={{fontSize: 40, color: '#1b1d24', lineHeight: 1.1}}>{p.loi}</div>
            </div>
            <div style={{flex: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#ff3b5c', fontSize: 30}}>
              <svg width="44" height="44" viewBox="0 0 24 24"><path fill="#ff3b5c" d="M12 21s-7.5-4.6-10-9.3C.4 8.3 2.4 4 6.4 4c2.2 0 3.6 1.2 4.6 2.6l1 1.4 1-1.4C14 5.2 15.4 4 17.6 4c4 0 6 4.3 4.4 7.7C19.5 16.4 12 21 12 21z" /></svg>
              {fmt(p.likes * montee)}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const BoutonAbonne: React.FC<{f: number}> = ({f}) => {
  const {fps} = useVideoConfig();
  const de = W.abonneToi + 6;
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
  const de = W.abonneToi + 38;
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

/* ------------------------------------------------------------------ composition */

/** Attend les polices avant de monter la 3D : les étiquettes sont dessinées une seule fois sur canvas. */
const usePolicesPretes = () => {
  const [pret, setPret] = useState(false);
  const [poignee] = useState(() => delayRender('polices assemblée'));
  useEffect(() => {
    Promise.all([lilita.waitUntilDone(), montserrat.waitUntilDone()]).then(() => { setPret(true); continueRender(poignee); });
  }, [poignee]);
  return pret;
};

export const AssembleePilote: React.FC = () => {
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
      <Compteur f={f} n={etat.deputes ?? 0} />
      <BulleCommentaire f={f} />
      <Propositions f={f} />
      <SousTitre t={f / 30} />
      <BoutonAbonne f={f} />
      <Confettis f={f} />
      <Audio src={staticFile('assemblee/pilote_voix.wav')} />
    </AbsoluteFill>
  );
};
