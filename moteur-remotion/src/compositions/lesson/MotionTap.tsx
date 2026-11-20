import React from 'react';
import {AbsoluteFill, Audio, interpolate, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import voixBrute from './voix_liam.json';
import {cl, CRAIE, CUIVRE, CYAN, FPS, JAUNE, ROUGE, SANS, SousTitre, Voix, VERT} from './commun';

/**
 * « Tech Unseen · Lesson 01 — tap-to-pay » en MOTION DESIGN 2D (SVG), une scène par phrase de la voix Liam.
 * Remplace la version 3D Cycles (trop lente à produire pour un rendu trop statique).
 */
const voix = voixBrute as unknown as Voix;
const FIN_VOIX = Math.ceil((voix.duree + .25) * FPS);
export const DUREE_MOTION_TAP = FIN_VOIX + 20;
const D = (k: number) => Math.round(voix.debuts[k] * FPS);
const L = (k: number) => (k + 1 < voix.debuts.length ? D(k + 1) : FIN_VOIX + 20) - D(k);
const FOND = '#0B1020', OR = '#F2C14E', BLANC = '#F4F6FB';
const ease = (f: number, a: number, b: number) => interpolate(f, [a, b], [0, 1], {...cl, easing: (t) => 1 - Math.pow(1 - t, 3)});

// ---------------------------------------------------------------- éléments dessinés
const Defs = () => (
  <defs>
    <linearGradient id="gCarte" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stopColor="#1B3A8C" /><stop offset="1" stopColor="#0E7C86" />
    </linearGradient>
    <linearGradient id="gPuce" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stopColor="#FFE08A" /><stop offset="1" stopColor="#C8922E" />
    </linearGradient>
    <filter id="lueur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="10" result="b" />
      <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
    <radialGradient id="gRouge"><stop offset="0" stopColor="#FF4B3E" stopOpacity="0" /><stop offset="1" stopColor="#7A0A0A" stopOpacity=".75" /></radialGradient>
  </defs>
);

const Bobine: React.FC<{p: number; energie: number}> = ({p, energie}) => (
  <g filter={energie > .05 ? 'url(#lueur)' : undefined}>
    {[0, 1, 2, 3].map((i) => {
      const m = 30 + i * 22, t = Math.min(Math.max(p * 4 - i, 0), 1);
      return <rect key={i} x={-428 + m} y={-270 + m} width={856 - 2 * m} height={540 - 2 * m} rx={30} fill="none"
        stroke={energie > .05 ? '#FFB36B' : CUIVRE} strokeWidth={7 + energie * 3} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - t} />;
    })}
  </g>
);

const Carte: React.FC<{x: number; y: number; s?: number; rot?: number; xray?: number; bobine?: number; energie?: number; puce?: number}> =
  ({x, y, s = 1, rot = 0, xray = 0, bobine = 0, energie = 0, puce = 0}) => (
    <g transform={`translate(${x},${y}) rotate(${rot}) scale(${s})`}>
      <rect x={-428} y={-270} width={856} height={540} rx={42} fill="url(#gCarte)" fillOpacity={1 - xray * .88}
        stroke={CYAN} strokeWidth={6 * xray + 0.01} strokeOpacity={xray} />
      <g opacity={1 - xray * .75}>
        <text x={-370} y={-170} fill={BLANC} fontFamily={SANS} fontWeight={900} fontSize={64} letterSpacing={6}>NOVA</text>
        <text x={-370} y={110} fill={BLANC} fontFamily="Menlo, monospace" fontWeight={700} fontSize={56} letterSpacing={4}>1234 5678 9012 3456</text>
        <text x={-370} y={200} fill={BLANC} fillOpacity={.85} fontFamily={SANS} fontWeight={700} fontSize={34} letterSpacing={3}>ALEX MORGAN · 12/29</text>
        {[0, 1, 2].map((i) => <path key={i} d={`M ${-130 + i * 24} -95 a ${30 + i * 24} ${30 + i * 24} 0 0 1 0 ${70 + i * 30}`} stroke={BLANC}
          strokeWidth={8} fill="none" strokeLinecap="round" transform={`translate(${-i * 12},${-i * 15})`} />)}
      </g>
      <Bobine p={bobine} energie={energie} />
      {energie > 0 && <path d="M -398 -60 L -250 -60" stroke="#FFB36B" strokeWidth={9} filter="url(#lueur)" opacity={energie} />}
      <g transform="translate(-300,-60)" filter={puce > .05 ? 'url(#lueur)' : undefined}>
        <rect x={-62} y={-48} width={124} height={96} rx={16} fill="url(#gPuce)" />
        <path d="M -62 -14 H -18 V -48 M 62 -14 H 18 V -48 M -62 18 H -18 V 48 M 62 18 H 18 V 48 M -18 -14 H 18 V 18 H -18 Z" stroke="#9A6A1A"
          strokeWidth={5} fill="none" />
        {puce > 0 && <rect x={-62} y={-48} width={124} height={96} rx={16} fill="#FFF3B0" opacity={puce * .8} />}
      </g>
    </g>
  );

const Lecteur: React.FC<{x: number; y: number; s?: number; ecran?: string; coche?: number; croix?: number}> = ({x, y, s = 1, ecran = '#1C2A44', coche = 0, croix = 0}) => (
  <g transform={`translate(${x},${y}) scale(${s})`}>
    <rect x={-250} y={-380} width={500} height={760} rx={60} fill="#232B3E" stroke="#3A4560" strokeWidth={6} />
    <rect x={-195} y={-320} width={390} height={300} rx={26} fill={ecran} />
    {[0, 1, 2].map((i) => <path key={i} d={`M ${-20 + i * 26} -215 a ${26 + i * 26} ${26 + i * 26} 0 0 1 0 ${60 + i * 30}`} stroke={BLANC}
      strokeOpacity={.75 * (1 - coche) * (1 - croix)} strokeWidth={9} fill="none" strokeLinecap="round" transform={`translate(${-i * 12},${-i * 14})`} />)}
    {coche > 0 && <path d="M -80 -170 L -20 -110 L 90 -230" stroke={BLANC} strokeWidth={22} fill="none" strokeLinecap="round" strokeLinejoin="round"
      pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - coche} />}
    {croix > 0 && <g stroke={BLANC} strokeWidth={22} strokeLinecap="round" opacity={croix}><path d="M -70 -240 L 70 -100" /><path d="M 70 -240 L -70 -100" /></g>}
    {Array.from({length: 12}, (_, i) => <rect key={i} x={-170 + (i % 3) * 125} y={30 + Math.floor(i / 3) * 80} width={90} height={56} rx={14} fill="#36405A" />)}
  </g>
);

const Champ: React.FC<{x: number; y: number; f: number; vis: number; couleur?: string; n?: number; portee?: number}> = ({x, y, f, vis, couleur = CYAN, n = 5, portee = 380}) => (
  <g opacity={vis}>
    {Array.from({length: n}, (_, i) => {
      const t = ((f / 40) + i / n) % 1;
      return <ellipse key={i} cx={x} cy={y - t * portee * .6} rx={120 + t * portee} ry={40 + t * portee * .3} fill="none"
        stroke={couleur} strokeWidth={8} strokeOpacity={(1 - t) * .9} />;
    })}
  </g>
);

const Capuche: React.FC<{x: number; y: number; s?: number; o?: number}> = ({x, y, s = 1, o = 1}) => (
  <g transform={`translate(${x},${y}) scale(${s})`} opacity={o}>
    <path d="M 0 -300 C -150 -300 -175 -140 -160 -40 L -260 340 L 260 340 L 160 -40 C 175 -140 150 -300 0 -300 Z" fill="#05070D" stroke={ROUGE} strokeWidth={6} />
    <ellipse cx={0} cy={-120} rx={92} ry={110} fill="#000" />
    <circle cx={-34} cy={-120} r={9} fill={ROUGE} /><circle cx={34} cy={-120} r={9} fill={ROUGE} />
  </g>
);

const Portefeuille: React.FC<{x: number; y: number; s?: number; bouclier?: number}> = ({x, y, s = 1, bouclier = 0}) => (
  <g transform={`translate(${x},${y}) scale(${s})`}>
    <rect x={-230} y={-60} width={300} height={190} rx={18} fill="url(#gCarte)" transform="rotate(-8)" />
    <rect x={-260} y={-20} width={520} height={330} rx={40} fill="#6B4A2E" stroke="#3E2A18" strokeWidth={8} />
    <path d="M -260 70 H 260" stroke="#3E2A18" strokeWidth={6} strokeDasharray="18 12" />
    {bouclier > 0 && <rect x={-276} y={-36} width={552} height={362} rx={48} fill="none" stroke="#C9D3E6" strokeWidth={14 * bouclier} opacity={bouclier} filter="url(#lueur)" />}
  </g>
);

const Cadenas: React.FC<{x: number; y: number; t: number; label: string}> = ({x, y, t, label}) => (
  <g transform={`translate(${x},${y}) scale(${.6 + .4 * t})`} opacity={t}>
    <path d="M -60 -40 V -90 a 60 60 0 0 1 120 0 V -40" stroke="#C9D3E6" strokeWidth={22} fill="none" />
    <rect x={-95} y={-45} width={190} height={160} rx={26} fill={JAUNE} />
    <circle cx={0} cy={25} r={18} fill={FOND} /><rect x={-7} y={25} width={14} height={45} fill={FOND} />
    <text x={0} y={185} textAnchor="middle" fill={BLANC} fontFamily={SANS} fontWeight={900} fontSize={48}>{label}</text>
  </g>
);

const Mot: React.FC<{texte: string; t: number; y?: number; couleur?: string; taille?: number}> = ({texte, t, y = 330, couleur = JAUNE, taille = 120}) => (
  <div style={{position: 'absolute', top: y, width: '100%', textAlign: 'center', opacity: t, transform: `scale(${.7 + .3 * t})`}}>
    <span style={{fontFamily: SANS, fontWeight: 900, fontSize: taille, color: couleur, letterSpacing: 2,
      textShadow: '0 8px 0 rgba(0,0,0,.45)'}}>{texte}</span>
  </div>
);

// une scène = SVG plein cadre + léger travelling + entrée (zoom/fondu 8 images)
const Scene: React.FC<{k: number; children: (lf: number, dur: number) => React.ReactNode; fond?: string; mot?: (lf: number) => React.ReactNode}> = ({k, children, fond = FOND, mot}) => {
  const lf = useCurrentFrame(); const dur = L(k);
  const entree = k === 0 ? 1 : ease(lf, 0, 8);
  const derive = 1 + .05 * (lf / Math.max(dur, 1));
  return (
    <AbsoluteFill style={{background: fond, opacity: entree}}>
      <svg viewBox="0 0 1080 1920" width={1080} height={1920} style={{position: 'absolute', transform: `scale(${(1.06 - .06 * entree) * derive})`}}>
        <Defs />{children(lf, dur)}
      </svg>
      {mot && mot(lf)}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- les 15 plans (phrases 0 à 14)
const PLANS: ((k: number) => React.ReactNode)[] = [
  // 0 — accroche : métro bondé, un voleur approche un lecteur caché d'une poche
  (k) => <Scene k={k} fond="#120A12">{(lf) => {
    const app = ease(lf, 6, 40), pulse = (lf % 20) / 20;
    return <>
      {[160, 380, 700, 920].map((x, i) => <g key={i} opacity={.35}><circle cx={x} cy={620 + (i % 2) * 40} r={70} fill="#2A2233" />
        <rect x={x - 110} y={700 + (i % 2) * 40} width={220} height={700} rx={90} fill="#2A2233" /></g>)}
      <rect x={300} y={560} width={420} height={1100} rx={160} fill="#3B3150" />
      <circle cx={510} cy={470} r={110} fill="#3B3150" />
      <Portefeuille x={560} y={1180} s={.55} />
      <Capuche x={1180 - 260 * app} y={900} s={.9} />
      <g transform={`translate(${1000 - 250 * app},1150)`}>
        <rect x={-70} y={-45} width={140} height={90} rx={16} fill="#111" stroke={ROUGE} strokeWidth={5} />
        <circle cx={0} cy={0} r={60 + pulse * 140} fill="none" stroke={ROUGE} strokeWidth={6} opacity={(1 - pulse) * app} />
      </g>
    </>;
  }}</Scene>,
  // 1 — « Let's look inside your card » : la carte surgit
  (k) => <Scene k={k}>{(lf) => {
    const t = spring({frame: lf, fps: FPS, config: {damping: 13}});
    return <Carte x={540} y={800} s={.3 + .7 * t} rot={-25 + 25 * t} />;
  }}</Scene>,
  // 2 — antenne en cuivre, 4 tours
  (k) => <Scene k={k} mot={(lf) => <Mot texte="×4" t={ease(lf, 70, 85)} y={1150} couleur={CUIVRE} taille={170} />}>{(lf, dur) =>
    <Carte x={540} y={800} xray={ease(lf, 0, 20)} bobine={ease(lf, 18, dur * .8)} />}</Scene>,
  // 3 — pas de batterie
  (k) => <Scene k={k} mot={(lf) => <Mot texte="NO BATTERY" t={ease(lf, 30, 40)} y={1110} couleur={ROUGE} />}>{(lf) => {
    const t = spring({frame: lf - 4, fps: FPS, config: {damping: 10}}), x = ease(lf, 22, 32);
    return <g transform={`translate(540,800) scale(${t})`}>
      <rect x={-230} y={-120} width={420} height={240} rx={40} fill="none" stroke={BLANC} strokeWidth={22} />
      <rect x={190} y={-50} width={40} height={100} rx={12} fill={BLANC} />
      <rect x={-200} y={-90} width={60} height={180} rx={10} fill={ROUGE} opacity={.8} />
      <path d="M -300 160 L 300 -160" stroke={ROUGE} strokeWidth={30} strokeLinecap="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - x} />
    </g>;
  }}</Scene>,
  // 4 — comment parle-t-elle au lecteur ?
  (k) => <Scene k={k} mot={(lf) => <Mot texte="?" t={ease(lf, 8, 16)} y={560} taille={220} />}>{(lf) => <>
    <Carte x={300 - 40 * (1 - ease(lf, 0, 14))} y={1000} s={.42} rot={-12} />
    <Lecteur x={790 + 40 * (1 - ease(lf, 0, 14))} y={980} s={.62} />
  </>}</Scene>,
  // 5 — le lecteur crée un champ magnétique
  (k) => <Scene k={k} mot={(lf) => <Mot texte="13.56 MHz" t={ease(lf, 40, 52)} y={300} couleur={CYAN} />}>{(lf) => <>
    <Lecteur x={540} y={1280} s={.8} />
    <Champ x={540} y={1050} f={lf} vis={ease(lf, 6, 20)} n={6} portee={520} />
  </>}</Scene>,
  // 6 — le champ alimente l'antenne, la puce se réveille
  (k) => <Scene k={k}>{(lf, dur) => <>
    <Champ x={540} y={1500} f={lf} vis={1} n={5} portee={700} />
    <Carte x={540} y={760} s={.95} xray={1} bobine={1} energie={ease(lf, 10, dur * .55)} puce={ease(lf, dur * .6, dur * .7)} />
    {lf > dur * .6 && Array.from({length: 10}, (_, i) => {
      const a = i * .63, r = 60 + (lf - dur * .6) * 9;
      return <circle key={i} cx={255 + Math.cos(a) * r} cy={703 + Math.sin(a) * r} r={8} fill={OR} opacity={Math.max(0, 1 - (lf - dur * .6) / 30)} />;
    })}
  </>}</Scene>,
  // 7 — un code à usage unique
  (k) => <Scene k={k} mot={(lf) => <Mot texte="ONE-TIME CODE" t={ease(lf, 4, 14)} y={300} taille={96} />}>{(lf) => {
    const hex = '0123456789ABCDEF';
    const code = Array.from({length: 16}, (_, i) => hex[(Math.floor(lf / 2) * 7 + i * 13 + i * i * 3) % 16]).join('');
    return <>
      <Carte x={540} y={1250} s={.6} xray={1} bobine={1} energie={1} puce={1} />
      {code.match(/.{4}/g)!.map((g, i) => <text key={i} x={540} y={620 + i * 115} textAnchor="middle" fill={BLANC} fontFamily="Menlo, monospace"
        fontWeight={700} fontSize={110} opacity={ease(lf, 6 + i * 4, 12 + i * 4)} filter="url(#lueur)">{g}</text>)}
    </>;
  }}</Scene>,
  // 8 — ne marche que pour ce paiement
  (k) => <Scene k={k}>{(lf, dur) => {
    const b = ease(lf, dur * .55, dur * .65);
    return <>
      <text x={540} y={760} textAnchor="middle" fill={BLANC} fontFamily="Menlo, monospace" fontWeight={700} fontSize={104}>9F26 A41C</text>
      <text x={540} y={890} textAnchor="middle" fill={BLANC} fontFamily="Menlo, monospace" fontWeight={700} fontSize={104}>7E03 B58D</text>
      <g opacity={ease(lf, 6, 14)}><rect x={290} y={980} width={500} height={110} rx={55} fill={VERT} />
        <text x={540} y={1055} textAnchor="middle" fill={FOND} fontFamily={SANS} fontWeight={900} fontSize={58}>THIS PAYMENT ✓</text></g>
      <g opacity={b} transform={`rotate(-8 540 820) translate(540 820) scale(${1.3 - .3 * b}) translate(-540 -820)`}>
        <rect x={250} y={740} width={580} height={150} rx={24} fill={FOND} fillOpacity={.6} stroke={ROUGE} strokeWidth={14} />
        <text x={540} y={845} textAnchor="middle" fill={ROUGE} fontFamily={SANS} fontWeight={900} fontSize={96}>USED</text></g>
    </>;
  }}</Scene>,
  // 9 — Approved
  (k) => <Scene k={k} mot={(lf) => <Mot texte="APPROVED" t={ease(lf, 10, 18)} y={330} couleur={VERT} />}>{(lf) =>
    <Lecteur x={540} y={1050} s={.95} ecran={lf >= 4 ? VERT : '#1C2A44'} coche={ease(lf, 4, 14)} />}</Scene>,
  // 10 — ce que les voleurs peuvent vraiment faire
  (k) => <Scene k={k} fond="#14070A">{(lf) => <>
    <rect width={1080} height={1920} fill="url(#gRouge)" />
    <Capuche x={540} y={1000} s={1.25 * (.85 + .15 * ease(lf, 0, 20))} o={ease(lf, 0, 10)} />
  </>}</Scene>,
  // 11 — lecteur caché à quelques cm : lit le numéro, parfois la date
  (k) => <Scene k={k} fond="#14070A" mot={(lf) => <Mot texte="~4 CM" t={ease(lf, 20, 30)} y={300} couleur={ROUGE} />}>{(lf, dur) => {
    const app = ease(lf, 0, 30), lit = ease(lf, dur * .4, dur * .9);
    return <>
      <Portefeuille x={330} y={1080} s={.7} />
      <g transform={`translate(${880 - 160 * app},1080)`}>
        <rect x={-90} y={-60} width={180} height={120} rx={20} fill="#111" stroke={ROUGE} strokeWidth={6} />
        <circle cx={0} cy={0} r={70 + ((lf % 18) / 18) * 90} fill="none" stroke={ROUGE} strokeWidth={6} opacity={(1 - (lf % 18) / 18) * app} />
      </g>
      <g opacity={app}><path d="M 520 1250 H 630" stroke={ROUGE} strokeWidth={6} strokeDasharray="14 10" /></g>
      <g opacity={lit}>
        <text x={540} y={600} textAnchor="middle" fill={BLANC} fontFamily="Menlo, monospace" fontWeight={700} fontSize={70}>
          {'1234 5678 9012 3456'.slice(0, Math.round(19 * Math.min(1, lit * 1.4)))}</text>
        <text x={540} y={700} textAnchor="middle" fill={BLANC} fillOpacity={.75} fontFamily="Menlo, monospace" fontWeight={700} fontSize={56}>
          {lit > .75 ? 'EXP 12/29 ?' : ''}</text>
      </g>
    </>;
  }}</Scene>,
  // 12 — mais pas le code de sécurité, ni le code unique
  (k) => <Scene k={k}>{(lf, dur) => <>
    <Cadenas x={300} y={900} t={ease(lf, 2, 14)} label="CVV" />
    <Cadenas x={780} y={900} t={ease(lf, dur * .45, dur * .45 + 12)} label="CODE" />
  </>}</Scene>,
  // 13 — donc impossible de payer avec une copie
  (k) => <Scene k={k} mot={(lf) => <Mot texte="DECLINED" t={ease(lf, 34, 42)} y={330} couleur={ROUGE} />}>{(lf) => <>
    <Lecteur x={540} y={1150} s={.85} ecran={lf > 30 ? ROUGE : '#1C2A44'} croix={ease(lf, 30, 38)} />
    <g opacity={1 - ease(lf, 30, 40)}><Carte x={540} y={620 + 160 * ease(lf, 0, 26)} s={.45} rot={-8} /></g>
    <text x={540} y={480} textAnchor="middle" fill={BLANC} fillOpacity={.7 * (1 - ease(lf, 30, 40))} fontFamily={SANS} fontWeight={900} fontSize={54}>CLONED CARD</text>
  </>}</Scene>,
  // 14 — portefeuille RFID : optionnel
  (k) => <Scene k={k} mot={(lf) => <Mot texte="OPTIONAL" t={ease(lf, 60, 72)} y={330} couleur={CYAN} />}>{(lf) => <>
    <Portefeuille x={540} y={1050} s={1} bouclier={ease(lf, 10, 24)} />
    {[0, 1, 2].map((i) => {
      const t = ((lf / 30) + i / 3) % 1;
      return <path key={i} d={`M ${1060 - t * 200} ${880 + i * 90} q -30 30 0 60`} stroke={ROUGE} strokeWidth={10} fill="none"
        opacity={(1 - t) * ease(lf, 10, 24)} />;
    })}
  </>}</Scene>,
];

const Tableau: React.FC = () => {
  const f = useCurrentFrame();
  const t = ease(f, 0, 10), q2 = ease(f, L(15), L(15) + 10);
  return (
    <AbsoluteFill style={{background: '#16302A', opacity: t, alignItems: 'center', justifyContent: 'center'}}>
      <div style={{width: 940, textAlign: 'center', marginTop: -220}}>
        <div style={{fontFamily: SANS, fontWeight: 900, fontSize: 44, letterSpacing: 6, color: JAUNE}}>POP QUIZ</div>
        <div style={{fontFamily: CRAIE, fontWeight: 700, fontSize: 112, lineHeight: 1.05, color: '#F4F1E6', marginTop: 20}}>
          Why must the reader be so close?</div>
        <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 46, color: '#fff', marginTop: 30, opacity: ease(f, 20, 30)}}>Comment your answer 👇</div>
        <div style={{marginTop: 80, opacity: q2, transform: `scale(${.8 + .2 * q2})`}}>
          <span style={{fontFamily: SANS, fontWeight: 900, fontSize: 52, color: '#fff', background: ROUGE, borderRadius: 50, padding: '20px 50px'}}>+ Follow Tech Unseen</span>
          <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 40, color: 'rgba(255,255,255,.85)', marginTop: 40}}>Next: is your phone listening? 📱</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const SONS: [number, string, number][] = [
  [0, 'whoosh', .5], [1, 'whoosh', .45], [3, 'pop', .6], [5, 'whoosh', .4], [6, 'pop', .4], [7, 'whoosh', .4], [9, 'bip', .55],
  [10, 'grave', .6], [11, 'whoosh', .4], [12, 'pop', .5], [13, 'refus', .5], [14, 'whoosh', .4], [15, 'pop', .5],
];

export const MotionTap: React.FC = () => {
  const f = useCurrentFrame();
  const {width} = useVideoConfig();
  const k = voix.debuts.reduce((acc, d, i) => (f / FPS >= d - .03 ? i : acc), 0);
  return (
    <AbsoluteFill style={{background: FOND}}>
      <Audio src={staticFile('lesson_tap/voix_liam.wav')} />
      {SONS.map(([kk, nom, v]) => <Sequence key={kk + nom} from={Math.max(0, D(kk) - 3)} durationInFrames={45}>
        <Audio src={staticFile(`lesson_tap/sfx/${nom}.wav`)} volume={v} /></Sequence>)}
      {PLANS.map((plan, i) => <Sequence key={i} from={D(i)} durationInFrames={L(i) + 6}>{plan(i)}</Sequence>)}
      <Sequence from={D(15)}><Tableau /></Sequence>
      <div style={{position: 'absolute', top: 90, left: 60, fontFamily: SANS, fontWeight: 800, fontSize: 30, letterSpacing: 5,
        color: 'rgba(255,255,255,.7)', opacity: k >= 1 && k < 15 ? 1 : 0}}>TECH UNSEEN · LESSON 01</div>
      <div style={{position: 'absolute', top: 140, left: 60, width: (width - 120) * Math.min(1, f / D(15)), height: 8, borderRadius: 4,
        background: JAUNE, opacity: k < 15 ? .9 : 0}} />
      <SousTitre f={f} voix={voix} finVoix={D(15)} />
    </AbsoluteFill>
  );
};
