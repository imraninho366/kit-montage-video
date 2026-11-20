import {ThreeCanvas} from '@remotion/three';
import {AbsoluteFill, Audio, Easing, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {TEXTE, TITRE, contour, fairePaquets, usePolicesPretes} from '../ile/habillage';
import {Caserne, DefPerso, Etat} from './Caserne3D';
import voix from './ep01_voix.json';

/**
 * Le Régiment — vidéo 1 : « Réveil surprise à 4 h ». 1080×1920, plus d'une minute (compte monétisé).
 * Construite pour tenir seule : enjeu en 2 s, choix A/B/C, les trois issues révélées (la bonne en dernier),
 * le vrai chiffre, puis commentaire + partage. Timeline accrochée aux mots de la voix (ep01_voix.json).
 */

const FPS = 30;

/* ------------------------------------------------------------------ temps : la voix + 3 s de pause pour choisir */

const SILENCES: [number, number][] = [[27.9, 3.0]];
const QUEUE = 1.8;
const enVideo = (v: number) => v + SILENCES.reduce((s, [a, d]) => (v >= a ? s + d : s), 0);
const enVoix = (t: number) => {
  let v = t;
  for (const [a, d] of SILENCES) {
    const debut = enVideo(a) - d;
    if (t >= debut + d) v -= d;
    else if (t >= debut) return a;
  }
  return v;
};
const FIN = enVideo(voix.duree) + QUEUE;
export const DUREE_REGIMENT_EP01 = Math.ceil(FIN * FPS);
const AVANCE = 0.08;
const M = (i: number) => enVideo(voix.mots[i].a) - AVANCE;
const PAUSE = enVideo(27.9) - 3.0; // début du compte à rebours

/* ------------------------------------------------------------------ plans */

type V3 = [number, number, number];
const ease = Easing.inOut(Easing.cubic);
const mix = (a: V3, b: V3, k: number): V3 => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
const entre = (t: number, a: number, b: number) => Math.min(1, Math.max(0, (t - a) / (b - a)));

type Plan = {de: number; lieu: Etat['lieu']; p0: V3; p1: V3; c0: V3; c1?: V3; fov: number; titre?: [string, string]};

const PLANS: Plan[] = [
  {de: 0, lieu: 'chambree', p0: [0.2, 1.8, 4.1], p1: [-1.0, 1.25, 3.0], c0: [-2.6, 0.8, 1.4], fov: 46, titre: ['4 H DU MATIN', 'IL A 3 MINUTES']},
  {de: M(12), lieu: 'chambree', p0: [-2.5, 1.15, 3.8], p1: [-2.7, 1.1, 3.45], c0: [-3.0, 0.86, 1.6], fov: 40, titre: ["ET C'EST TOI", 'QUI DÉCIDES']},
  {de: M(20), lieu: 'chambree', p0: [-0.4, 1.65, 4.35], p1: [-0.6, 1.6, 4.1], c0: [-1.65, 1.3, 1.9], fov: 44, titre: ["LUI, C'EST", 'LE BLEU']},
  {de: M(29), lieu: 'chambree', p0: [1.5, 2.3, 4.2], p1: [1.3, 2.1, 3.6], c0: [-2.5, 1.2, -1.2], fov: 52, titre: ['1 ABONNÉ', '= 1 SOLDAT']},
  {de: M(40), lieu: 'chambree', p0: [0.45, 1.7, 3.8], p1: [0.35, 1.75, 2.0], c0: [0, 1.75, -5.6], fov: 42, titre: ['TOUT LE MONDE', 'DEHORS !']},
  {de: M(54), lieu: 'chambree', p0: [0.35, 1.95, -3.0], p1: [0.2, 1.95, -3.4], c0: [0, 1.95, -5.6], fov: 42, titre: ['LE DERNIER', '= 50 POMPES']},
  {de: M(64), lieu: 'chambree', p0: [-0.5, 1.65, 4.35], p1: [-0.7, 1.6, 4.05], c0: [-1.65, 1.3, 1.95], fov: 44, titre: ['TROIS MINUTES', 'TU FAIS QUOI ?']},
  {de: M(71), lieu: 'chambree', p0: [0.6, 2.1, 4.25], p1: [0.5, 2.0, 3.9], c0: [-0.4, 1.3, 0], fov: 50},
  // A
  {de: M(95), lieu: 'chambree', p0: [-1.2, 1.35, 3.0], p1: [-1.45, 1.25, 2.75], c0: [-2.6, 0.6, 1.6], fov: 40, titre: ['A', 'LIT PARFAIT…']},
  {de: M(100), lieu: 'cour', p0: [0, 1.6, 6.2], p1: [0, 1.45, 4.7], c0: [0, 1.1, 0.4], fov: 42, titre: ['…MAIS IL SORT', 'EN CALEÇON']},
  // B
  {de: M(112), lieu: 'cour', p0: [3.4, 2.3, 6.4], p1: [2.6, 2.0, 5.4], c0: [0, 1.0, 0.2], fov: 44, titre: ['B', 'LE PREMIER !']},
  {de: M(118), lieu: 'chambree', p0: [-1.2, 1.35, 3.0], p1: [-1.4, 1.3, 2.8], c0: [-2.6, 0.6, 1.6], fov: 42, titre: ['MAIS SON LIT', 'CHAMP DE BATAILLE']},
  {de: M(126), lieu: 'cour', p0: [1.05, 1.9, 7.0], p1: [1.05, 1.8, 6.4], c0: [1.05, 1.3, 0.7], fov: 42, titre: ['CE SOIR', 'CORVÉE DE WC']},
  // C
  {de: M(131), lieu: 'chambree', p0: [-1.3, 2.7, 3.6], p1: [-1.1, 2.6, 3.3], c0: [1.7, 0.8, -0.8], fov: 50, titre: ['C', 'TOUS DEBOUT !']},
  {de: M(137), lieu: 'cour', p0: [-3.6, 2.2, 6.6], p1: [-2.6, 2.0, 5.6], c0: [0, 1.0, -1.0], fov: 46, titre: ['TOUS ENSEMBLE…', '+1 MIN DE RETARD']},
  {de: M(145), lieu: 'cour', p0: [0, 2.05, 4.6], p1: [0, 2.0, 4.1], c0: [0, 1.9, 1.0], fov: 38},
  {de: M(148), lieu: 'cour', p0: [0, 2.0, 4.0], p1: [0, 2.0, 3.85], c0: [0, 1.95, 1.3], fov: 34, titre: ['…ET IL', 'SOURIT']},
  {de: M(151), lieu: 'cour', p0: [0, 2.6, 7.0], p1: [0, 4.2, 8.2], c0: [0, 1.0, -1.5], fov: 48, titre: ["À L'ARMÉE", 'PERSONNE DERRIÈRE']},
  {de: M(159), lieu: 'cour', p0: [0, 4.2, 8.2], p1: [0, 4.6, 8.6], c0: [0, 1.0, -1.5], fov: 48, titre: ["C'ÉTAIT ÇA,", 'LE VRAI TEST']},
  // le vrai chiffre
  {de: M(164), lieu: 'cour', p0: [-5, 3, 7], p1: [-4, 3, 7.5], c0: [0, 1, -2], fov: 50, titre: ['EN VRAI', '12 SEMAINES']},
  {de: M(174), lieu: 'cour', p0: [-4, 3, 7.5], p1: [-3, 3, 8], c0: [0, 1, -2], fov: 50, titre: ['PRESQUE', '1 SUR 3']},
  // commentaire, demain, partage
  {de: M(187), lieu: 'cour', p0: [0.2, 1.75, 3.2], p1: [0.1, 1.72, 2.8], c0: [0, 1.6, 0.5], fov: 38, titre: ['TOI, TU TIENDRAIS ?', 'A, B OU C ?']},
  {de: M(198), lieu: 'cour', p0: [0, 3.0, 8.5], p1: [0, 2.6, 7.2], c0: [0, 1.0, -0.5], fov: 46, titre: ['DEMAIN', 'MARCHE DE NUIT']},
  {de: M(205), lieu: 'cour', p0: [0, 2.5, 7.8], p1: [0, 2.3, 6.9], c0: [0, 1.3, 0.9], fov: 44, titre: ['ÉCRIS TON PSEUDO', 'LES 10 PLUS LIKÉS']},
  {de: M(218), lieu: 'cour', p0: [0, 1.5, 4.2], p1: [0, 1.4, 3.6], c0: [0, 1.15, 0.8], fov: 40, titre: ['ENVOIE ÇA', 'AU POTE']},
];
const indicePlan = (t: number) => {
  let i = 0;
  while (i + 1 < PLANS.length && t >= PLANS[i + 1].de) i++;
  return i;
};
const finPlan = (i: number) => PLANS[i + 1]?.de ?? FIN;

/* ------------------------------------------------------------------ état de la scène, plan par plan */

const BLEU_LIT: DefPerso = {position: [0, 0, 0], tenue: 'nuit', humeur: 'dort', pose: 'couche'};
const BLEU_ALLEE: V3 = [-1.65, 0, 2.0];
const SERGENT_PORTE: DefPerso = {position: [0, 0, -5.55], tenue: 'sergent', humeur: 'hurle', pose: 'pointe'};

const etat = (t: number): Etat => {
  const i = indicePlan(t);
  const p = PLANS[i];
  const k = ease(entre(t, p.de, finPlan(i)));
  const cam: Etat['cam'] = {pos: mix(p.p0, p.p1, k), cible: p.c1 ? mix(p.c0, p.c1, k) : p.c0, fov: p.fov};

  // néon : grésille à l'entrée du sergent, puis reste allumé
  const neonSergent = t < M(40) ? 0 : t < M(40) + 0.7 ? [0, 1, 0, 0, 1, 1, 0][Math.floor((t - M(40)) / 0.1)] ?? 1 : 1;

  switch (i) {
    case 0: return {cam, lieu: 'chambree', bleu: BLEU_LIT};
    case 1: return {cam, lieu: 'chambree', bleu: {...BLEU_LIT, humeur: 'panique'}};
    case 2: return {cam, lieu: 'chambree', bleu: {position: BLEU_ALLEE, rotY: 0.35, tenue: 'nuit', humeur: 'panique', pose: 'debout'}};
    case 3: return {cam, lieu: 'chambree', etiquettes: ease(entre(t, M(30), M(33)))};
    case 4: return {cam: {...cam, secousse: t > M(41) && t < M(48) ? 0.8 : 0}, lieu: 'chambree', neon: neonSergent, dormeurs: entre(t, M(44), M(50)),
      sergent: SERGENT_PORTE, bleu: {position: [-1.25, 0, 0.5], rotY: Math.PI * 0.85, tenue: 'nuit', humeur: 'panique', pose: 'debout'}};
    case 5: return {cam, lieu: 'chambree', neon: 1, dormeurs: 1, sergent: SERGENT_PORTE};
    case 6: return {cam, lieu: 'chambree', neon: 1, dormeurs: 1, bleu: {position: BLEU_ALLEE, rotY: 0.3, tenue: 'nuit', humeur: 'panique', pose: 'debout'}};
    case 7: return {cam, lieu: 'chambree', neon: 1, dormeurs: 0,
            bleu: {position: [-0.3, 0, 0.8], rotY: 0.3, tenue: 'nuit', humeur: 'panique', pose: 'debout'}};
    case 8: return {cam, lieu: 'chambree', neon: 1, dormeurs: 0, litBleu: 'carre', eclatLit: 1};
    case 9: return {cam, lieu: 'cour', section: {n: 10, humeur: 'rit', pose: 'gardeavous'},
      bleu: {position: [0, 0, 1.6], tenue: 'calecon', coiffe: 'casque', humeur: 'gene', pose: 'gardeavous'},
      sergent: {position: [2.4, 0, 1.4], rotY: -1.3, tenue: 'sergent', humeur: t > M(109) ? 'hurle' : 'fache', pose: 'debout'}};
    case 10: return {cam, lieu: 'cour', bleu: {position: [0, 0, 0.4], tenue: 'treillis', coiffe: 'casque', humeur: 'fier', pose: 'fier'},
      sergent: {position: [2.3, 0, 1.2], rotY: -1.2, tenue: 'sergent', humeur: 'neutre', pose: 'debout'}};
    case 11: return {cam, lieu: 'chambree', neon: 1, dormeurs: 0, litBleu: 'bataille'};
    case 12: return {cam, lieu: 'cour', bleu: {position: [0.2, 0, 0.6], rotY: 0.5, tenue: 'treillis', coiffe: 'casque', humeur: 'gene', pose: 'gardeavous'},
      sergent: {position: [1.9, 0, 0.9], rotY: -1.4, tenue: 'sergent', humeur: 'fache', pose: 'pointe'}};
    case 13: return {cam, lieu: 'chambree', neon: 1, dormeurs: entre(t, M(133), M(137)),
      bleu: {position: [1.25, 0, -0.35], rotY: Math.PI / 2, tenue: 'nuit', humeur: 'panique', pose: 'secoue'}};
    case 14: {
      // la section arrive en courant, d'un bloc, avec le Bleu devant
      const arrivee = ease(entre(t, M(137), M(141)));
      const z = -7 + 7 * arrivee;
      const pose = arrivee < 1 ? 'court' : 'gardeavous';
      return {cam, lieu: 'cour', section: {n: 10, humeur: 'panique', pose, decalage: [0, 0, z]},
        bleu: {position: [0, 0, 0.6 + z], tenue: 'treillis', coiffe: 'casque', humeur: 'panique', pose},
        sergent: {position: [3.0, 0, 1.6], rotY: -1.5, tenue: 'sergent', humeur: 'fache', pose: 'debout'}};
    }
    case 15:
    case 16: {
      const z = -0.6 + 1.4 * ease(entre(t, M(145), M(148)));
      return {cam, lieu: 'cour', section: {n: 10, humeur: 'neutre', pose: 'gardeavous'},
        sergent: {position: [0, 0, z], rotY: 0, tenue: 'sergent', humeur: i === 16 ? 'sourit' : 'fache', pose: 'debout', echelle: 1.12}};
    }
    case 17:
    case 18: return {cam, lieu: 'cour', section: {n: 10, humeur: 'fier', pose: 'gardeavous'}, etiquettes: i === 18 ? 0 : ease(entre(t, M(152), M(155))),
      bleu: {position: [0, 0, 0.3], tenue: 'treillis', coiffe: 'casque', humeur: 'fier', pose: 'gardeavous'},
      sergent: {position: [2.6, 0, 2.2], rotY: -Math.PI * 0.8, tenue: 'sergent', humeur: 'sourit', pose: 'debout'}};
    case 19:
    case 20: return {cam, lieu: 'cour', section: {n: 10, humeur: 'neutre', pose: 'gardeavous'},
      bleu: {position: [0, 0, 0.3], tenue: 'treillis', coiffe: 'casque', humeur: 'neutre', pose: 'gardeavous'}};
    case 21: return {cam, lieu: 'cour', bleu: {position: [0, 0, 0.5], tenue: 'treillis', coiffe: 'casque', humeur: t > M(191) ? 'sourit' : 'neutre', pose: t > M(191) ? 'pointe' : 'debout'}};
    case 22:
    case 23: return {cam, lieu: 'cour', ciel: 'nuit', section: {n: 10, humeur: 'neutre', pose: 'gardeavous', decalage: [0, 0, -1.5]},
      mysteres: i === 23 ? ease(entre(t, M(205), M(212))) : 0,
      bleu: {position: [0, 0, 1.2], tenue: 'treillis', coiffe: 'casque', humeur: 'neutre', pose: 'gardeavous'}};
    default: return {cam, lieu: 'cour', section: {n: 10, humeur: 'rit', pose: 'gardeavous'},
      bleu: {position: [0, 0, 1.5], tenue: 'calecon', coiffe: 'casque', humeur: 'gene', pose: 'gardeavous'}};
  }
};

/* ------------------------------------------------------------------ habillage 2D */

const ressort = (t: number, de: number, fps: number, config = {damping: 12, stiffness: 200}) => (t < de ? 0 : spring({frame: (t - de) * FPS, fps, config}));

const Titre: React.FC<{t: number}> = ({t}) => {
  const {fps} = useVideoConfig();
  const p = PLANS[indicePlan(t)];
  if (!p.titre) return null;
  const e = ressort(t, p.de, fps);
  const [petit, grand] = p.titre;
  const lettre = grand.length === 1 || petit.length === 1;
  return (
    <div style={{position: 'absolute', top: 230, left: 30, right: 30, textAlign: 'center', transform: `scale(${0.6 + 0.4 * e})`, opacity: Math.min(1, e * 1.5)}}>
      {lettre ? (
        // une issue : la lettre en gros, puis ce qui se passe
        <>
          <div style={{display: 'inline-flex', width: 150, height: 150, borderRadius: 75, background: '#ffc928', border: '8px solid #2b1a00', alignItems: 'center', justifyContent: 'center',
            fontFamily: TITRE, fontSize: 110, color: '#2b1a00', boxShadow: '0 8px 0 rgba(0,0,0,0.3)'}}>{petit}</div>
          <div style={{fontFamily: TITRE, fontSize: grand.length > 12 ? 100 : 118, lineHeight: 1.0, whiteSpace: 'nowrap', color: '#fff', marginTop: 12,
            ...contour('#2b1a00', 18), textShadow: '0 8px 0 rgba(0,0,0,0.3)'}}>{grand}</div>
        </>
      ) : (
        <>
          <div style={{fontFamily: TEXTE, fontWeight: 900, fontSize: 46, color: '#fff', letterSpacing: 1, ...contour('#0b0d14', 12)}}>{petit}</div>
          <div style={{fontFamily: TITRE, fontSize: grand.length > 15 ? 84 : grand.length > 12 ? 100 : 124, lineHeight: 1.0, whiteSpace: 'nowrap', color: '#ffc928', marginTop: 4,
            ...contour('#2b1a00', 18), textShadow: '0 8px 0 rgba(0,0,0,0.3)'}}>{grand}</div>
        </>
      )}
    </div>
  );
};

const AFFICHAGE: Record<number, string> = {
  0: '*4*', 1: '*heures*', 7: '*3*', 8: '*minutes*', 14: '*toi*', 23: '*Bleu.*', 31: '*abonné*', 36: '*soldat*', 42: '*hurle*', 47: '*dehors,*',
  58: '*50*', 59: '*pompes.*', 64: '*3*', 65: '*minutes.*', 104: '*caleçon.*', 108: '*rigole…*', 117: '*premier.*', 125: '*bataille.*', 130: '*toilettes.*',
  139: '*ensemble.*', 150: '*sourit.*', 157: '*personne*', 158: '*derrière.*', 162: '*vrai*', 163: '*test.*', 172: '*12*', 173: '*semaines.*',
  176: '*une*', 177: '*recrue*', 178: '*sur*', 179: '*trois*', 193: '*commentaire*', 202: '*marche*', 204: '*nuit.*', 207: '*pseudo*', 210: '*10*', 222: '*pote*', 226: '*caleçon.*',
};
const PAQUETS = fairePaquets(voix, AFFICHAGE);

const SousTitre: React.FC<{t: number}> = ({t}) => {
  if (t >= M(71) && t < M(95)) return null; // les cartes A/B/C parlent
  const v = enVoix(t);
  const i = PAQUETS.findIndex((p, k) => v >= p[0].a - 0.05 && v < (PAQUETS[k + 1]?.[0].a ?? p[p.length - 1].b + 0.4) - 0.05);
  if (i < 0) return null;
  const paquet = PAQUETS[i];
  return (
    <div style={{position: 'absolute', top: 1270, left: 60, right: 60, textAlign: 'center', fontFamily: TEXTE, fontWeight: 900, fontSize: 70, lineHeight: 1.1, ...contour('#000', 14)}}>
      {paquet.map((m, j) => (
        <span key={j} style={{color: m.t.startsWith('*') ? '#ffc928' : '#fff', opacity: v >= m.a - 0.05 ? 1 : 0.35}}>{m.t.replace(/\*/g, '')}{j < paquet.length - 1 ? ' ' : ''}</span>
      ))}
    </div>
  );
};

/** Plan 1 : le réveil de la chambrée, 04:00 qui clignote. */
const Reveil: React.FC<{t: number}> = ({t}) => {
  const {fps} = useVideoConfig();
  if (t >= M(12)) return null;
  const e = ressort(t, 0.1, fps, {damping: 9, stiffness: 220});
  const allume = Math.floor(t * 2.5) % 2 === 0 || t > 1.6;
  return (
    <div style={{position: 'absolute', top: 560, left: 0, right: 0, display: 'flex', justifyContent: 'center', transform: `scale(${e})`}}>
      <div style={{background: '#0b0d12', border: '8px solid #2a2f3a', borderRadius: 30, padding: '10px 50px', boxShadow: '0 0 60px rgba(255,40,60,0.35)'}}>
        <span style={{fontFamily: 'Menlo, monospace', fontWeight: 900, fontSize: 150, color: '#ff3344', letterSpacing: 8, opacity: allume ? 1 : 0.15, textShadow: '0 0 24px #ff3344'}}>04:00</span>
      </div>
    </div>
  );
};

/** Le chrono des 3 minutes : apparaît en grand, se range en haut à droite ; « +1:00 » rouge pour l'issue C. */
const Chrono: React.FC<{t: number}> = ({t}) => {
  const {fps} = useVideoConfig();
  const de = M(64);
  const issueC = t >= M(137) && t < M(145);
  if (!((t >= de && t < M(95)) || issueC)) return null;
  const e = ressort(t, issueC ? M(137) : de, fps, {damping: 9, stiffness: 220});
  const reste = issueC ? 0 : Math.max(0, Math.round(180 - (t - de) * 2.2));
  const k = issueC ? 1 : ease(entre(t, de + 1.0, de + 1.6));
  const z = (n: number) => String(n).padStart(2, '0');
  return (
    <div style={{position: 'absolute', left: 290 + (690 - 290) * k, top: 560 + (70 - 560) * k, transform: `scale(${(1.6 - 0.6 * k) * e})`, transformOrigin: 'top left'}}>
      <div style={{background: 'rgba(12,4,6,0.85)', border: '5px solid #ff3344', borderRadius: 22, padding: '6px 22px', fontFamily: TEXTE, fontWeight: 900,
        fontSize: 54, color: '#ff3344', letterSpacing: 3, display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 0 30px rgba(255,40,60,0.45)'}}>
        <svg width="34" height="34" viewBox="0 0 24 24"><path fill="#ff3344" d="M12 2a10 10 0 1 0 .001 20.001A10 10 0 0 0 12 2zm1 10.4V6h-2v7.4l5 3 1-1.7z" /></svg>
        {issueC ? '+1:00' : `${z(Math.floor(reste / 60))}:${z(reste % 60)}`}
      </div>
    </div>
  );
};

/** Les trois choix, puis « mets sur pause » et le compte à rebours de 3 s. */
const Choix: React.FC<{t: number}> = ({t}) => {
  const {fps} = useVideoConfig();
  if (t < M(71) || t >= M(95)) return null;
  const choix: [number, string, string][] = [[M(71), 'A', 'IL FAIT SON LIT'], [M(78), 'B', "IL S'HABILLE"], [M(84), 'C', 'IL RÉVEILLE LES AUTRES']];
  const pause = ressort(t, M(91), fps, {damping: 10, stiffness: 220});
  const reste = Math.max(0, 3 - (t - PAUSE));
  const dansPause = t >= PAUSE && t < PAUSE + 3;
  return (
    <>
      {t >= M(91) && (
        <div style={{position: 'absolute', top: 240, left: 0, right: 0, display: 'flex', justifyContent: 'center', transform: `scale(${pause})`}}>
          <div style={{background: '#fe2c55', color: '#fff', fontFamily: TEXTE, fontWeight: 900, fontSize: 46, padding: '12px 36px', borderRadius: 50,
            border: '5px solid #fff', display: 'flex', alignItems: 'center', gap: 16, boxShadow: '0 8px 0 rgba(0,0,0,0.3)'}}>
            <svg width="40" height="40" viewBox="0 0 24 24"><rect x="5" y="4" width="5" height="16" rx="1" fill="#fff" /><rect x="14" y="4" width="5" height="16" rx="1" fill="#fff" /></svg>
            METS SUR PAUSE
          </div>
        </div>
      )}
      <div style={{position: 'absolute', top: 1130, left: 60, right: 60, display: 'flex', flexDirection: 'column', gap: 22}}>
        {choix.map(([d, l, txt]) => {
          const e = ressort(t, d, fps, {damping: 11, stiffness: 200});
          return (
            <div key={l} style={{transform: `translateX(${(1 - e) * -900}px)`, display: 'flex', alignItems: 'center', gap: 22, background: '#fff', borderRadius: 34,
              padding: '12px 30px 12px 14px', boxShadow: '0 8px 0 rgba(0,0,0,0.35)'}}>
              <div style={{width: 84, height: 84, borderRadius: 42, background: '#ffc928', border: '5px solid #2b1a00', display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontFamily: TITRE, fontSize: 58, color: '#2b1a00', flexShrink: 0}}>{l}</div>
              <span style={{fontFamily: TEXTE, fontWeight: 900, fontSize: 46, color: '#1b1d24'}}>{txt}</span>
            </div>
          );
        })}
      </div>
      {dansPause && (
        <div style={{position: 'absolute', top: 1560, left: 140, right: 140}}>
          <div style={{textAlign: 'center', fontFamily: TITRE, fontSize: 110, color: '#fff', ...contour('#000', 12)}}>{Math.ceil(reste)}</div>
          <div style={{height: 22, borderRadius: 11, background: 'rgba(255,255,255,0.25)', overflow: 'hidden', border: '3px solid #fff'}}>
            <div style={{width: `${(reste / 3) * 100}%`, height: '100%', background: reste < 1 ? '#ff3344' : '#ffc928'}} />
          </div>
        </div>
      )}
    </>
  );
};

/** Le vrai chiffre : 12 semaines, puis 1 recrue sur 3, avec la source. */
const Fait: React.FC<{t: number}> = ({t}) => {
  const {fps} = useVideoConfig();
  if (t < M(164) || t >= M(187)) return null;
  const sur3 = t >= M(174);
  const tombe = ease(entre(t, M(179), M(181)));
  return (
    <>
      <div style={{position: 'absolute', top: 640, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 40}}>
        {sur3 ? [0, 1, 2].map((i) => {
          const e = ressort(t, M(175) + i * 0.15, fps);
          const part = i === 2;
          return (
            <svg key={i} width="200" height="380" viewBox="0 0 100 190" style={{transform: `scale(${e}) translateY(${part ? tombe * 60 : 0}px) rotate(${part ? tombe * 12 : 0}deg)`,
              opacity: part ? 1 - tombe * 0.65 : 1}}>
              <ellipse cx="50" cy="28" rx="30" ry="22" fill={part ? '#ff3344' : '#5f6f3a'} stroke="#1b1d24" strokeWidth="4" />
              <circle cx="50" cy="40" r="22" fill="#e8b07c" stroke="#1b1d24" strokeWidth="4" />
              <path d="M18 70 Q50 58 82 70 L86 140 L14 140 Z" fill={part ? '#ff3344' : '#5f6f3a'} stroke="#1b1d24" strokeWidth="4" />
              <rect x="24" y="140" width="20" height="44" rx="6" fill="#47552a" stroke="#1b1d24" strokeWidth="4" />
              <rect x="56" y="140" width="20" height="44" rx="6" fill="#47552a" stroke="#1b1d24" strokeWidth="4" />
            </svg>
          );
        }) : (
          <div style={{transform: `scale(${ressort(t, M(171), fps)})`, background: '#fff', borderRadius: 34, padding: '20px 44px', boxShadow: '0 10px 0 rgba(0,0,0,0.3)', textAlign: 'center'}}>
            <div style={{fontFamily: TITRE, fontSize: 150, color: '#2b1a00', lineHeight: 1}}>12</div>
            <div style={{fontFamily: TEXTE, fontWeight: 900, fontSize: 44, color: '#5f6f3a'}}>SEMAINES DE CLASSES</div>
          </div>
        )}
      </div>
      <div style={{position: 'absolute', bottom: 70, left: 60, right: 60, textAlign: 'center', fontFamily: TEXTE, fontWeight: 900, fontSize: 26, color: '#fff', opacity: 0.85, ...contour('#000', 6)}}>
        {sur3 ? 'Source : HCECM, rapport 2026 (recrues 2024 de l’armée de Terre)' : 'Source : ministère des Armées, formation initiale des engagés'}
      </div>
    </>
  );
};

/** « moi j'avais pris C » en bulle de commentaire. */
const BulleCommentaire: React.FC<{t: number}> = ({t}) => {
  const {fps} = useVideoConfig();
  if (t < M(191) || t >= M(198)) return null;
  const e = ressort(t, M(191), fps, {damping: 11, stiffness: 200});
  return (
    <div style={{position: 'absolute', top: 1020, left: 0, right: 0, display: 'flex', justifyContent: 'center', transform: `scale(${e})`}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 18, background: '#fff', borderRadius: 40, padding: '16px 34px', boxShadow: '0 10px 0 rgba(0,0,0,0.3)'}}>
        <svg width="56" height="56" viewBox="0 0 24 24"><path fill="#1b1d24" d="M4 4h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H9l-5 4v-4H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" /></svg>
        <span style={{fontFamily: TEXTE, fontWeight: 900, fontSize: 50, color: '#1b1d24'}}>moi j'avais pris <span style={{color: '#e0a800'}}>C</span></span>
      </div>
    </div>
  );
};

/** Fin : le bouton partager qui pulse. */
const Partage: React.FC<{t: number}> = ({t}) => {
  const {fps} = useVideoConfig();
  if (t < M(219)) return null;
  const e = ressort(t, M(219), fps, {damping: 9, stiffness: 220});
  const pouls = 1 + 0.08 * Math.max(0, Math.sin((t - M(219)) * 7));
  return (
    <div style={{position: 'absolute', top: 980, right: 70, transform: `scale(${e * pouls})`, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8}}>
      <div style={{width: 170, height: 170, borderRadius: 85, background: '#ffc928', border: '7px solid #2b1a00', display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 10px 0 rgba(0,0,0,0.3)'}}>
        <svg width="100" height="100" viewBox="0 0 24 24"><path fill="#2b1a00" d="M14 4l8 7.5-8 7.5v-4.5C8 14.5 4.5 16.5 2 21c.6-6.4 4-11.8 12-12.5V4z" /></svg>
      </div>
      <div style={{fontFamily: TEXTE, fontWeight: 900, fontSize: 40, color: '#fff', ...contour('#000', 10)}}>PARTAGE</div>
    </div>
  );
};

/* ------------------------------------------------------------------ son */

const img = (s: number) => Math.round(s * FPS);
const Sons: React.FC = () => {
  const [[c, d]] = SILENCES;
  return (
    <>
      <Sequence from={0} durationInFrames={img(c)}><Audio src={staticFile('regiment/ep01_voix.wav')} endAt={img(c)} /></Sequence>
      <Sequence from={img(c + d)}><Audio src={staticFile('regiment/ep01_voix.wav')} startFrom={img(c)} /></Sequence>
      {/* nappe grave très bas sous la voix (≈ −30 dB), coupée pendant la pause et avant le vrai chiffre */}
      <Audio src={staticFile('regiment/nappe.wav')} volume={(f) => {
        const t = f / FPS;
        const coupe = (t >= PAUSE - 0.2 && t < PAUSE + 3) || (t >= M(162) && t < M(166)) ? 0 : 1;
        return 0.08 * coupe * Math.min(1, t / 1.5) * Math.max(0, Math.min(1, (FIN - t) / 1.2));
      }} />
      <Sequence from={0}><Audio src={staticFile('regiment/clairon.wav')} volume={0.32} /></Sequence>
      <Sequence from={img(M(40))}><Audio src={staticFile('regiment/sifflet.wav')} volume={0.28} /></Sequence>
      {Array.from({length: 6}, (_, i) => PAUSE + i * 0.5).map((s, i) => (
        <Sequence key={`t${i}`} from={img(s)} durationInFrames={10}><Audio src={staticFile(i % 2 ? 'regiment/tac.wav' : 'regiment/tic.wav')} volume={0.5} /></Sequence>
      ))}
      {PLANS.slice(1).map((p, i) => (
        <Sequence key={`w${i}`} from={Math.max(0, img(p.de - 0.22))} durationInFrames={24}><Audio src={staticFile('regiment/whoosh.wav')} volume={0.16} /></Sequence>
      ))}
      <Sequence from={img(M(137))} durationInFrames={img(3)}><Audio src={staticFile('regiment/pas.wav')} volume={0.5} /></Sequence>
      {[M(171), M(179)].map((s, i) => <Sequence key={`b${i}`} from={img(s)} durationInFrames={20}><Audio src={staticFile('regiment/bip_vert.wav')} volume={0.25} /></Sequence>)}
    </>
  );
};

/* ------------------------------------------------------------------ composition */

export const RegimentEp01: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const {width, height} = useVideoConfig();
  const pret = usePolicesPretes();
  const flou = t >= M(164) && t < M(187) ? 'blur(6px) brightness(0.6)' : 'none';
  return (
    <AbsoluteFill style={{background: '#05070c'}}>
      {pret && (
        <AbsoluteFill style={{filter: flou}}>
          <ThreeCanvas width={width} height={height} shadows camera={{fov: 45, near: 0.05, far: 200}} gl={{antialias: true}}>
            <Caserne etat={etat(t)} />
          </ThreeCanvas>
        </AbsoluteFill>
      )}
      <Reveil t={t} />
      <Choix t={t} />
      <Fait t={t} />
      <BulleCommentaire t={t} />
      <Partage t={t} />
      <Titre t={t} />
      <Chrono t={t} />
      <SousTitre t={t} />
      <Sons />
    </AbsoluteFill>
  );
};
