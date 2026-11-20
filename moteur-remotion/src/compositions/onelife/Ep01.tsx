import {loadFont as chargerLora} from '@remotion/google-fonts/Lora';
import {loadFont as chargerMono} from '@remotion/google-fonts/IBMPlexMono';
import {loadFont as chargerMontserrat} from '@remotion/google-fonts/Montserrat';
import {ThreeCanvas} from '@remotion/three';
import {AbsoluteFill, Audio, Easing, interpolate, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Monde, Plan, voitureZ} from './decors';
import voix from './ep01_voix.json';

/**
 * ONE LIFE — épisode 1 (âge 16). Timeline calculée depuis les temps des mots de la voix (ep01_voix.json).
 * Chiffres vérifiés (08/11/2026) :
 *  - permis à 16 ans : 25,2 % des 16 ans (FHWA, Highway Statistics 2023, tableau DL-20)
 *  - emploi des 16-19 ans en juillet 2026 : 36,5 % (BLS, The Economics Daily, 26/08/2026)
 *  - accidents mortels par mile : 16-19 ans ≈ 3 × les 20 ans et plus (CDC, Teen Drivers Risk Factors)
 *  - mourir entre 16 et 17 ans, garçons : 0,000697 ≈ 1 sur 1 435 (CDC, NVSR vol. 74 n° 2, tableau 2, 2022)
 */
const {fontFamily: SERIF} = chargerLora('normal', {weights: ['400', '500'], subsets: ['latin']});
chargerLora('italic', {weights: ['400'], subsets: ['latin']});
const {fontFamily: MONO} = chargerMono('normal', {weights: ['500'], subsets: ['latin']});
const {fontFamily: SANS} = chargerMontserrat('normal', {weights: ['800', '900'], subsets: ['latin']});

const FPS = 30;
const VERT = '#3ccf7a', ROUGE = '#ff4a4a', OR = '#ffcf5a', GRIS = '#5a6378';
const ombre = '0 2px 16px rgba(0,0,0,0.55), 0 1px 3px rgba(0,0,0,0.6)';
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

/* ------------------------------------------------------------------ repères tirés de la voix */
type Mot = {t: string; a: number; b: number; bloc: number};
const MOTS = voix.mots as Mot[];
const B = voix.blocs as {debut: number; fin: number; pause: number}[];
const fr = (s: number) => Math.round(s * FPS);
const mot = (bloc: number, debut: string, n = 0) => {
  const l = MOTS.filter((m) => m.bloc === bloc && m.t.toLowerCase().replace(/[^a-z0-9]/g, '') === debut);
  const l2 = l.length ? l : MOTS.filter((m) => m.bloc === bloc && m.t.toLowerCase().replace(/[^a-z0-9]/g, '').startsWith(debut));
  return (l2[n] ?? l2[0] ?? {a: B[bloc].debut}).a;
};
const finBloc = (i: number) => B[i].fin + B[i].pause;

const T = {
  real: fr(mot(0, 'real')),
  dies: fr(mot(0, 'dies')),
  hookFin: fr(finBloc(0)),
  roue1: fr(mot(1, 'only')),
  roue1Stop: fr(finBloc(1) - 0.25),
  roue2: fr(mot(2, 'just')),
  roue2Stop: fr(finBloc(2) - 0.25),
  nuit: fr(mot(3, 'so')),
  mile: fr(mot(3, 'mile')),
  carrefour: fr(mot(3, 'and', 0)),
  ralenti: fr(B[3].fin),
  fige: fr(B[4].debut),
  mortStop: fr(B[5].debut - 0.3),
  vit: fr(B[5].debut),
  vote: fr(B[6].debut),
  optA: fr(mot(6, 'a')),
  optB: fr(mot(6, 'b')),
  optC: fr(mot(6, 'c')),
  commente: fr(mot(6, 'comment')),
  suivre: fr(mot(6, 'follow')),
};
export const DUREE_EP01 = fr(voix.duree + 2.4);

/* ------------------------------------------------------------------ temps du carrefour (ralenti, arrêt sur image) */
const tsCarrefour = (f: number) => {
  const s = (f - T.carrefour) / FPS;
  const sP = (T.ralenti - T.carrefour) / FPS, sF = (T.fige - T.carrefour) / FPS, sL = (T.vit - T.carrefour) / FPS;
  if (s < sP) return 2.6 - (sP - s);
  if (s < sF) return interpolate(s, [sP, sF], [2.6, 2.9], {easing: Easing.out(Easing.quad)});
  if (s < sL) return interpolate(s, [sF, sL], [2.9, 2.96]);
  return 2.96 + (s - sL);
};

/* ------------------------------------------------------------------ plans (décor + caméra), un événement toutes les 3-4 s */
/** Même trajectoire que la voiture du décor Examen (z de -10 à 8 en 260 images depuis le début du décor). */
const examenZ = (f: number) => interpolate(f - T.hookFin, [0, 260], [-10, 8], clamp);
const lisse = (t: number) => t * t * (3 - 2 * t);
const P = (decor: Plan['decor'], de: number, a: number, cam: Plan['cam'], ref?: number): Plan => ({decor, de, a, cam, ref});

const PLANS: Plan[] = [
  // chambre au réveil
  P('chambre', 0, fr(3.0), (t) => ({pos: [1.6 - 0.5 * t, 1.55, 3.4 - 0.6 * t], cible: [-1.1, 1.0, -0.7], fov: 44})),
  // il marche dans la rue (caméra qui l'accompagne)
  P('rue', fr(3.0), T.real, (_t, f) => {
    const x = -3 + (f - fr(3.0)) * 0.045;
    return {pos: [x + 2.2, 1.45, 4.6], cible: [x + 0.4, 1.2, 0.6], fov: 40};
  }, fr(3.0)),
  // vue de grue sur le quartier
  P('rue', T.real, T.hookFin, (t, f) => {
    const x = -3 + (f - fr(3.0)) * 0.045;
    return {pos: [x - 7 + 6 * t, 15 - 5 * lisse(t), 17 - 3 * t], cible: [x, 0.5, 0], fov: 38};
  }, fr(3.0)),
  // centre d'examen, plan large
  P('examen', T.hookFin, T.roue1, (_t, f) => {
    const z = examenZ(f);
    return {pos: [8.5, 3.6, z + 7], cible: [Math.sin(z * 0.75) * 1.6, 0.7, z], fov: 42};
  }, T.hookFin),
  // la voiture entre les cônes (pendant la roue du permis)
  P('examen', T.roue1, T.roue1Stop + fr(0.7), (_t, f) => {
    const z = examenZ(f);
    return {pos: [5.5, 1.6, z + 5.5], cible: [Math.sin(z * 0.75) * 1.6, 0.9, z], fov: 40};
  }, T.hookFin),
  // fast-food : il approche de la porte
  P('burger', T.roue1Stop + fr(0.7), T.roue2, (t) => ({pos: [2.0 - 0.6 * t, 2.2, 16 - 1.5 * t], cible: [1.0, 2.2, 1.0], fov: 42}), T.roue1Stop + fr(0.7)),
  // la roue du job, puis il repart
  P('burger', T.roue2, T.nuit, (t) => ({pos: [-2.8 + t, 1.5, 7.2], cible: [0.6, 1.2, 3.2], fov: 40}), T.roue1Stop + fr(0.7)),
  // route de nuit, caméra de poursuite
  P('nuit', T.nuit, T.mile, (_t, f) => {
    const z = (f - T.nuit) * 0.32;
    return {pos: [-4.6, 2.5, z - 7.5], cible: [-1.9, 1.0, z + 4], fov: 42};
  }, T.nuit),
  // de profil, les amis dans la voiture
  P('nuit', T.mile, T.carrefour, (_t, f) => {
    const z = (f - T.nuit) * 0.32;
    return {pos: [-12.5, 3.4, z + 6.0], cible: [-1.9, 1.0, z], fov: 40};
  }, T.nuit),
  // carrefour : poursuite, ralenti, temps figé (orbite), le temps repart
  P('carrefour', T.carrefour, T.vote, (_t, f) => {
    const ts = tsCarrefour(f);
    const z = voitureZ(ts);
    if (f < T.ralenti) return {pos: [-6.0, 2.8, Math.min(z - 4.5, -9)], cible: [6.0, 1.2, 1.5], fov: 50};
    if (f < T.fige) return {pos: [-9.5, 1.0, -6.5], cible: [-0.8, 1.1, 0.3], fov: 40};
    if (f < T.vit) {
      const u = (f - T.fige) / (T.vit - T.fige);
      const ang = -2.5 + 1.7 * lisse(u);
      return {pos: [-1.0 + Math.cos(ang) * 7.5, 1.4 + 1.6 * u, 0.6 + Math.sin(ang) * 7.5], cible: [-1.0, 1.0, 0.6], fov: 40};
    }
    return {pos: [-7.5, 1.7, -9.5], cible: [-1.6, 1.0, -0.8], fov: 42};
  }),
  // fin d'année : sa chambre, la nuit
  P('chambreNuit', T.vote, DUREE_EP01 + 1, (t) => ({pos: [0.9 - 0.3 * t, 1.4, 2.8 - 0.6 * t], cible: [-1.2, 1.1, -0.6], fov: 42})),
];

/* ------------------------------------------------------------------ interface */

const Titre: React.FC<{f: number}> = ({f}) => {
  const o = interpolate(f, [0, 70, 85], [1, 1, 0], clamp);
  if (o <= 0) return null;
  return (
    <div style={{position: 'absolute', top: 360, left: 70, right: 70, textAlign: 'center', fontFamily: SERIF, fontSize: 82, lineHeight: 1.12, color: '#fff', textShadow: ombre, opacity: o}}>
      He’s 16.<br />You control his life.
    </div>
  );
};

const Compteurs: React.FC<{f: number}> = ({f}) => {
  const o = interpolate(f, [T.vote - 8, T.vote + 6], [1, 0], clamp);
  if (o <= 0) return null;
  const ligne = (label: string, etat: 'attente' | 'oui' | 'non') => (
    <div style={{fontFamily: MONO, fontSize: 22, letterSpacing: 3, marginTop: 6, color: etat === 'oui' ? VERT : etat === 'non' ? '#ff8a80' : 'rgba(255,255,255,0.75)'}}>
      {label} {etat === 'oui' ? '✓' : etat === 'non' ? '✗' : '—'}
    </div>
  );
  return (
    <div style={{position: 'absolute', top: 96, left: 56, color: '#fff', textShadow: ombre, opacity: o}}>
      <div style={{fontFamily: MONO, fontSize: 20, letterSpacing: 5, opacity: 0.8}}>ONE LIFE · EPISODE 1</div>
      <div style={{fontFamily: SERIF, fontSize: 104, lineHeight: 1}}>Age 16</div>
      {ligne('LICENSE', f >= T.roue1Stop ? 'oui' : 'attente')}
      {ligne('SUMMER JOB', f >= T.roue2Stop ? 'non' : 'attente')}
      <div style={{fontFamily: MONO, fontSize: 21, letterSpacing: 2, marginTop: 12, color: f >= T.carrefour ? '#ffb0a8' : '#fff'}}>RISK OF DYING THIS YEAR · 0.07%</div>
    </div>
  );
};

/** Voile rouge bref sur « if he dies ». */
const FlashRouge: React.FC<{f: number}> = ({f}) => {
  const o = interpolate(f, [T.dies - 2, T.dies + 3, T.dies + 24], [0, 0.45, 0], clamp);
  return <AbsoluteFill style={{background: `radial-gradient(ellipse at center, rgba(120,0,0,0) 30%, rgba(160,0,0,${o}) 100%)`}} />;
};

/** Carte « ×3 » pendant la statistique des jeunes conducteurs. */
const CarteRisque: React.FC<{f: number}> = ({f}) => {
  const {fps} = useVideoConfig();
  if (f < T.mile - 4 || f > T.carrefour + 6) return null;
  const e = spring({frame: f - T.mile + 4, fps, config: {damping: 12, stiffness: 180}});
  const o = interpolate(f, [T.carrefour - 6, T.carrefour + 6], [1, 0], clamp);
  return (
    <div style={{position: 'absolute', top: 520, left: 0, right: 0, textAlign: 'center', opacity: o, transform: `scale(${0.7 + 0.3 * e})`}}>
      <div style={{fontFamily: SANS, fontWeight: 900, fontSize: 260, color: OR, lineHeight: 1, textShadow: '0 8px 30px rgba(0,0,0,0.6)'}}>×3</div>
      <div style={{fontFamily: SERIF, fontSize: 46, color: '#fff', textShadow: ombre, marginTop: 6}}>deadly crashes per mile</div>
      <div style={{fontFamily: SERIF, fontSize: 40, color: '#fff', textShadow: ombre, opacity: 0.9}}>teens 16–19 vs. adults</div>
      <div style={{fontFamily: MONO, fontSize: 18, letterSpacing: 2, color: '#fff', opacity: 0.6, marginTop: 10}}>SOURCE: CDC</div>
    </div>
  );
};

/* ------------------------------------------------------------------ roues */
type Part = {p: number; couleur: string; label: string};
const arc = (r: number, a0: number, a1: number) => {
  const pt = (a: number) => [Math.sin((a * Math.PI) / 180) * r, -Math.cos((a * Math.PI) / 180) * r];
  const [x0, y0] = pt(a0), [x1, y1] = pt(a1);
  return `M0,0 L${x0},${y0} A${r},${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${x1},${y1} Z`;
};

type DefRoue = {de: number; stop: number; parts: Part[]; cible: number; tours: number; titre: string; source: string; verdict: string; couleur: string};
const rotation = (r: DefRoue, f: number) =>
  (360 * r.tours - r.cible) * interpolate(f, [r.de + 10, r.stop], [0, 1], {...clamp, easing: Easing.bezier(0.1, 0.62, 0.1, 1)});
const pct = (p: number) => (p < 0.01 || p > 0.99 ? (p * 100).toFixed(2) : (p * 100).toFixed(1).replace(/\.0$/, ''));

const ROUES: DefRoue[] = [
  {de: T.roue1, stop: T.roue1Stop, tours: 3, cible: 0.252 * 360 * 0.5, titre: 'Driver’s license at 16?', source: 'FHWA · 2023',
    parts: [{p: 0.252, couleur: VERT, label: 'PASSES'}, {p: 0.748, couleur: GRIS, label: 'NOT YET'}], verdict: 'Licensed.', couleur: VERT},
  {de: T.roue2, stop: T.roue2Stop, tours: 3, cible: 360 * (0.365 + 0.635 * 0.42), titre: 'Summer job?', source: 'BLS · JULY 2026',
    parts: [{p: 0.365, couleur: VERT, label: 'HIRED'}, {p: 0.635, couleur: GRIS, label: 'NO JOB'}], verdict: 'Rejected.', couleur: '#ff8a80'},
  {de: T.fige, stop: T.mortStop, tours: 4, cible: 0.000697 * 360 + 3.4, titre: 'Does Ethan survive 16?', source: 'CDC LIFE TABLES · 2022',
    parts: [{p: 0.000697, couleur: ROUGE, label: 'DIES'}, {p: 0.999303, couleur: '#3a4766', label: 'LIVES'}], verdict: 'He lives.', couleur: '#ffffff'},
];

const Roue: React.FC<{f: number; r: DefRoue}> = ({f, r}) => {
  const {fps} = useVideoConfig();
  const t = f - r.de;
  const finAff = r.stop + 34;
  if (t < 0 || f > finAff) return null;
  const e = spring({frame: t, fps, config: {damping: 14, stiffness: 170}});
  const sortie = interpolate(f, [finAff - 12, finAff], [1, 0], clamp);
  const R = 220;
  let acc = 0;
  return (
    <AbsoluteFill style={{alignItems: 'center', paddingTop: 660, opacity: sortie}}>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 55%, rgba(5,8,20,0.6) 0%, rgba(5,8,20,0) 60%)', opacity: e}} />
      <div style={{position: 'relative', fontFamily: SERIF, fontSize: 60, color: '#fff', textShadow: ombre, opacity: e}}>{r.titre}</div>
      <div style={{position: 'relative', display: 'flex', gap: 30, marginTop: 10, opacity: e, fontFamily: MONO, fontSize: 26, color: '#fff', textShadow: ombre}}>
        {r.parts.map((p) => <span key={p.label}><span style={{color: p.couleur}}>■</span> {p.label} {pct(p.p)}%</span>)}
      </div>
      <svg style={{position: 'relative', marginTop: 14, transform: `scale(${0.75 + 0.25 * e})`}} width={R * 2 + 30} height={R * 2 + 60} viewBox={`${-R - 15} ${-R - 45} ${R * 2 + 30} ${R * 2 + 60}`}>
        <g transform={`rotate(${rotation(r, f)})`}>
          {r.parts.map((p, i) => {
            const a0 = acc * 360, a1 = (acc + p.p) * 360;
            acc += p.p;
            return <path key={i} d={arc(R, a0, Math.max(a1, a0 + 0.7))} fill={p.couleur} stroke="#0b0f1e" strokeWidth={3} />;
          })}
          <circle r={24} fill="#0b0f1e" />
        </g>
        <path d={`M-20,${-R - 40} L20,${-R - 40} L0,${-R + 6} Z`} fill="#fff" stroke="#0b0f1e" strokeWidth={4} />
      </svg>
      <div style={{position: 'relative', fontFamily: MONO, fontSize: 18, letterSpacing: 2, color: '#fff', opacity: 0.6 * e}}>SOURCE: {r.source}</div>
      {f >= r.stop && (
        <div style={{position: 'absolute', top: 1110, left: 0, right: 0, textAlign: 'center', fontFamily: SANS, fontWeight: 900, fontSize: 92, color: r.couleur, textShadow: '0 6px 24px rgba(0,0,0,0.6)',
          transform: `scale(${0.7 + 0.3 * spring({frame: f - r.stop, fps, config: {damping: 9}})})`}}>{r.verdict}</div>
      )}
    </AbsoluteFill>
  );
};

/** Un « tic » à chaque cran de 15° sous l'aiguille. */
const ticsDe = (r: DefRoue) => {
  const l: number[] = [];
  let prev = 0;
  for (let f = r.de; f <= r.stop; f++) {
    const k = Math.floor(rotation(r, f) / 15);
    if (k !== prev) { l.push(f); prev = k; }
  }
  return l;
};

/* ------------------------------------------------------------------ vote */
const OPTIONS: [string, string, number][] = [['A', 'Buy a cheap car', T.optA], ['B', 'Any job, even nights', T.optB], ['C', 'No car. Just school.', T.optC]];

const Vote: React.FC<{f: number}> = ({f}) => {
  const {fps} = useVideoConfig();
  if (f < T.vote) return null;
  const e = (de: number) => spring({frame: f - de, fps, config: {damping: 14, stiffness: 170}});
  return (
    <AbsoluteFill style={{background: `rgba(6,10,26,${interpolate(f, [T.vote, T.vote + 12], [0, 0.6], clamp)})`, alignItems: 'center', paddingTop: 300}}>
      <div style={{fontFamily: MONO, fontSize: 28, letterSpacing: 8, color: OR, opacity: e(T.vote)}}>HE SURVIVED 16</div>
      <div style={{fontFamily: SERIF, fontSize: 96, color: '#fff', marginTop: 8, textShadow: ombre, opacity: e(T.vote + 4)}}>Age 17.</div>
      <div style={{fontFamily: SERIF, fontSize: 58, color: '#fff', textShadow: ombre, opacity: e(T.vote + 8)}}>What does Ethan do?</div>
      <div style={{marginTop: 50, display: 'flex', flexDirection: 'column', gap: 26, width: 880}}>
        {OPTIONS.map(([k, t, de]) => (
          <div key={k} style={{display: 'flex', alignItems: 'center', gap: 26, background: 'rgba(255,255,255,0.12)', border: '2px solid rgba(255,255,255,0.32)', borderRadius: 22, padding: '20px 26px',
            opacity: e(de), transform: `translateX(${(1 - e(de)) * -70}px)`}}>
            <div style={{width: 72, height: 72, borderRadius: 36, background: OR, color: '#1b1406', fontFamily: SANS, fontWeight: 900, fontSize: 40, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>{k}</div>
            <div style={{fontFamily: SERIF, fontSize: 46, color: '#fff', whiteSpace: 'nowrap'}}>{t}</div>
          </div>
        ))}
      </div>
      <div style={{marginTop: 44, padding: '16px 34px', borderRadius: 40, background: OR, color: '#1b1406', fontFamily: SANS, fontWeight: 900, fontSize: 40, opacity: e(T.commente), transform: `scale(${0.8 + 0.2 * e(T.commente)})`}}>
        COMMENT A, B OR C
      </div>
      <div style={{marginTop: 22, fontFamily: SERIF, fontStyle: 'italic', fontSize: 38, color: '#fff', textShadow: ombre, opacity: e(T.suivre)}}>The most voted happens in Episode 2.</div>
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ sous-titres karaoké (3 mots max, coupés en fin de phrase) */
const PAQUETS: Mot[][] = (() => {
  const l: Mot[][] = [];
  let cour: Mot[] = [];
  MOTS.forEach((m, i) => {
    cour.push(m);
    const fin = /[.!?:,]$/.test(m.t);
    const suivant = MOTS[i + 1];
    if (cour.length >= 3 || fin || !suivant || suivant.bloc !== m.bloc) { l.push(cour); cour = []; }
  });
  return l;
})();

const MOTS_CLES = /^(one|three|four|fourteen|sixteen|seventeen|dies|death|license|pickup|red|rejected|passes)/i;

const SousTitres: React.FC<{f: number}> = ({f}) => {
  const t = f / FPS;
  const i = PAQUETS.findIndex((p, k) => t >= p[0].a - 0.05 && t < Math.min(p[p.length - 1].b + 0.35, (PAQUETS[k + 1]?.[0].a ?? 1e9) - 0.05));
  if (i < 0) return null;
  const top = f >= T.vote ? 1650 : 1480;
  return (
    <div style={{position: 'absolute', top, left: 50, right: 50, textAlign: 'center', fontFamily: SANS, fontWeight: 900, fontSize: 74, lineHeight: 1.1, textTransform: 'uppercase',
      WebkitTextStroke: '10px #000', paintOrder: 'stroke fill', letterSpacing: 1}}>
      {PAQUETS[i].map((m, j) => {
        const dit = t >= m.a - 0.04;
        const cle = MOTS_CLES.test(m.t.replace(/[^a-z0-9]/gi, ''));
        return <span key={j} style={{color: dit ? (cle ? OR : '#fff') : 'rgba(255,255,255,0.45)'}}>{m.t.replace(/\.\.\.$/, '…')}{j < PAQUETS[i].length - 1 ? ' ' : ''}</span>;
      })}
    </div>
  );
};

/* ------------------------------------------------------------------ composition */
export const OneLifeEp01: React.FC = () => {
  const f = useCurrentFrame();
  const {width, height} = useVideoConfig();
  const etat = {chambreHumeur: 'neutre' as const, rueHumeur: 'neutre' as const, refusBurger: T.roue2Stop + 10, tsCarrefour: tsCarrefour(f)};
  // court passage au noir entre deux décors différents
  const coupes = PLANS.slice(1).filter((p, i) => p.decor !== PLANS[i].decor).map((p) => p.de);
  const noir = Math.max(0, ...coupes.map((d) => interpolate(f, [d - 4, d, d + 5], [0, 0.85, 0], clamp)));
  const musique = (x: number) => interpolate(x, [0, 15, T.mortStop - 62, T.mortStop - 58, T.mortStop + 20, T.mortStop + 40, DUREE_EP01 - 25, DUREE_EP01], [0, 0.07, 0.07, 0, 0, 0.06, 0.06, 0], clamp);
  const coeurs: number[] = [];
  for (let x = T.fige + 6, ecart = 26; x < T.mortStop - 4; x += ecart, ecart = Math.max(13, ecart - 2)) coeurs.push(x);
  return (
    <AbsoluteFill style={{background: '#0b1026'}}>
      <ThreeCanvas width={width} height={height} shadows camera={{fov: 40, near: 0.1, far: 400}} gl={{antialias: true}}>
        <Monde f={f} plans={PLANS} etat={etat} />
      </ThreeCanvas>
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(5,8,20,0.5) 0%, rgba(5,8,20,0) 24%, rgba(5,8,20,0) 66%, rgba(5,8,20,0.45) 100%)'}} />
      <FlashRouge f={f} />
      <AbsoluteFill style={{background: '#000', opacity: noir}} />
      <Titre f={f} />
      <Compteurs f={f} />
      <CarteRisque f={f} />
      {ROUES.map((r, i) => <Roue key={i} f={f} r={r} />)}
      <Vote f={f} />
      <SousTitres f={f} />

      <Audio src={staticFile('onelife/ep01_voix.wav')} />
      <Audio src={staticFile('onelife/nappe.wav')} volume={musique} />
      {coupes.map((d, i) => <Sequence key={`w${i}`} from={Math.max(0, d - 3)} durationInFrames={20}><Audio src={staticFile('onelife/whoosh.wav')} volume={0.28} /></Sequence>)}
      {ROUES.flatMap((r, k) => ticsDe(r).map((d, i) => <Sequence key={`t${k}-${i}`} from={d} durationInFrames={4}><Audio src={staticFile('onelife/tic.wav')} volume={0.3} /></Sequence>))}
      <Sequence from={T.roue1Stop} durationInFrames={40}><Audio src={staticFile('onelife/ding.wav')} volume={0.5} /></Sequence>
      <Sequence from={T.roue2Stop} durationInFrames={30}><Audio src={staticFile('onelife/thud.wav')} volume={0.7} /></Sequence>
      {coeurs.map((d, i) => <Sequence key={`c${i}`} from={d} durationInFrames={18}><Audio src={staticFile('onelife/coeur.wav')} volume={0.85} /></Sequence>)}
      <Sequence from={T.mortStop} durationInFrames={66}><Audio src={staticFile('onelife/impact.wav')} volume={0.75} /></Sequence>
      <Sequence from={T.vit} durationInFrames={20}><Audio src={staticFile('onelife/whoosh.wav')} volume={0.9} /></Sequence>
    </AbsoluteFill>
  );
};
