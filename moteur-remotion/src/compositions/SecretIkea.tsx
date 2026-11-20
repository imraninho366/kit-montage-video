import {AbsoluteFill, Audio, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig, Easing} from 'remotion';
import {evolvePath, getLength, getPointAtLength} from '@remotion/paths';
import {polices} from '../design/theme';
import data from '../videos/secret_ikea.json';

/** Short « The Hidden Why » #1 : pourquoi IKEA est un labyrinthe. Vue de dessus, tout dessiné en SVG. */
export const DUREE_SECRET_IKEA = data.frames;

const C = {fond: '#F3EDE2', sol: '#FFFCF6', encre: '#1F2230', rouge: '#FF4D2E', vert: '#1FA38C', gris: '#B9B2A6', ombre: 'rgba(31,34,48,.12)'};
const p = (f: number, a: number, b: number, e = Easing.inOut(Easing.cubic)) =>
  interpolate(f, [a, b], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: e});

// ---------- plan du magasin (repère 1000 × 1000) ----------
const MURS_EXT = 'M80 80 H920 V760 M920 870 V920 H80 V220 M80 80 V150';
// cloisons : trois rangées de pièces en serpentin, la 4e rangée = Marketplace + caisses
const CLOISONS = [
  'M80 290 H760', 'M240 500 H920', 'M80 710 H760',
  'M290 80 V150 M290 220 V290', 'M500 80 V150 M500 220 V290', 'M710 80 V150 M710 220 V290',
  'M290 290 V360 M290 430 V500', 'M500 290 V360 M500 430 V500', 'M710 290 V360 M710 430 V500',
  'M290 500 V570 M290 640 V710', 'M500 500 V570 M500 640 V710', 'M710 500 V570 M710 640 V710',
];
const CHEMIN = 'M30 185 H840 V395 H185 V605 H840 V815 H990';
const LONG_CHEMIN = getLength(CHEMIN);
const DIRECT = 'M30 185 C300 185 420 600 520 815 S800 815 990 815';

const Personne: React.FC<{x: number; y: number; ang?: number; chariot?: boolean; couleur?: string; s?: number}> = ({x, y, ang = 0, chariot, couleur = C.encre, s = 1}) => (
  <g transform={`translate(${x} ${y}) rotate(${ang}) scale(${s})`}>
    {chariot && <rect x={24} y={-16} width={38} height={32} rx={6} fill="none" stroke={couleur} strokeWidth={5} />}
    <ellipse cx={0} cy={0} rx={14} ry={24} fill={couleur} />
    <circle cx={2} cy={0} r={13} fill="#F6C9A8" stroke={couleur} strokeWidth={4} />
  </g>
);

// ---------- petites icônes ----------
const Lampe: React.FC<{x: number; y: number; s?: number}> = ({x, y, s = 1}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path d="M-28 -10 L28 -10 L18 -46 L-18 -46 Z" fill={C.rouge} />
    <rect x={-3} y={-10} width={6} height={50} fill={C.encre} /><rect x={-20} y={38} width={40} height={8} rx={4} fill={C.encre} />
  </g>
);
const Canape: React.FC<{x: number; y: number; s?: number}> = ({x, y, s = 1}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <rect x={-90} y={-40} width={180} height={80} rx={18} fill={C.vert} />
    <rect x={-90} y={-40} width={180} height={28} rx={12} fill="#178270" />
    <rect x={-104} y={-34} width={26} height={74} rx={10} fill="#178270" /><rect x={78} y={-34} width={26} height={74} rx={10} fill="#178270" />
  </g>
);
const Bougie: React.FC<{x: number; y: number; s?: number}> = ({x, y, s = 1}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}><rect x={-14} y={-20} width={28} height={50} rx={4} fill="#F2E6CF" stroke={C.encre} strokeWidth={4} />
    <path d="M0 -44 C10 -32 8 -24 0 -22 C-8 -24 -10 -32 0 -44 Z" fill={C.rouge} /></g>
);
const Verre: React.FC<{x: number; y: number; s?: number}> = ({x, y, s = 1}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}><path d="M-20 -30 H20 L14 30 H-14 Z" fill="#CFE9F1" stroke={C.encre} strokeWidth={4} /></g>
);
const Cadre: React.FC<{x: number; y: number; s?: number}> = ({x, y, s = 1}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}><rect x={-26} y={-32} width={52} height={64} fill="#D9A15B" stroke={C.encre} strokeWidth={4} />
    <rect x={-16} y={-22} width={32} height={44} fill="#BFE0C9" /></g>
);
const Plante: React.FC<{x: number; y: number; s?: number}> = ({x, y, s = 1}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>{[[-12, -8], [12, -10], [0, -22], [0, 4]].map(([a, b], i) => <circle key={i} cx={a} cy={b} r={16} fill="#3E9B5A" />)}
    <rect x={-14} y={14} width={28} height={22} rx={4} fill={C.rouge} /></g>
);
const OBJETS = [Bougie, Verre, Cadre, Plante, Lampe];

/** Le plan, éventuellement en cours de construction. */
const Plan: React.FC<{murs?: number; cloisons?: number; chemin?: number; fleches?: number; bacs?: number; caisses?: number}> = ({murs = 1, cloisons = 1, chemin = 0, fleches = 0, bacs = 0, caisses = 0}) => (
  <g>
    <rect x={80} y={80} width={840} height={840} fill={C.sol} />
    <path d={MURS_EXT} stroke={C.encre} strokeWidth={14} fill="none" strokeLinecap="round" {...evolvePath(murs, MURS_EXT)} />
    {CLOISONS.map((d, i) => {
      const v = Math.max(0, Math.min(1, cloisons * CLOISONS.length - i));
      return v > 0 ? <path key={i} d={d} stroke={C.encre} strokeWidth={9} fill="none" strokeLinecap="round" {...evolvePath(v, d)} /> : null;
    })}
    {/* Marketplace : bacs */}
    {bacs > 0 && [190, 330, 470, 610].map((x, i) => (
      <g key={i} opacity={Math.max(0, Math.min(1, bacs * 4 - i))}>
        <rect x={x - 50} y={735} width={100} height={46} rx={8} fill="#F1D9B5" stroke={C.encre} strokeWidth={4} />
        {[0, 1, 2].map((k) => <circle key={k} cx={x - 28 + k * 28} cy={758} r={10} fill={[C.rouge, C.vert, '#D9A15B'][(i + k) % 3]} />)}
      </g>
    ))}
    {caisses > 0 && [790, 850].map((y, i) => <rect key={i} x={760} y={y - 14} width={110} height={28} rx={6} fill={C.encre} opacity={caisses} />)}
    {chemin > 0 && <path d={CHEMIN} stroke={C.rouge} strokeWidth={16} fill="none" strokeLinecap="round" strokeLinejoin="round"
      opacity={0.9} {...evolvePath(chemin, CHEMIN)} />}
    {fleches > 0 && Array.from({length: 14}, (_, i) => {
      const l = ((i + 0.5) / 14) * LONG_CHEMIN;
      const a = getPointAtLength(CHEMIN, l), b = getPointAtLength(CHEMIN, Math.min(LONG_CHEMIN, l + 4));
      const ang = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
      return <path key={i} d="M-14 -12 L10 0 L-14 12" transform={`translate(${a.x} ${a.y}) rotate(${ang})`} stroke="#fff" strokeWidth={6} fill="none"
        strokeLinecap="round" strokeLinejoin="round" opacity={Math.max(0, Math.min(1, fleches * 14 - i))} />;
    })}
  </g>
);

const Etiquette: React.FC<{x: number; y: number; texte: string; f: number; a: number; couleur?: string; police?: keyof typeof polices; taille?: number; rot?: number}> = (
  {x, y, texte, f, a, couleur = C.rouge, police = 'tampon', taille = 64, rot = -6}) => {
  const {fps} = useVideoConfig();
  const s = spring({frame: f - a, fps, config: {damping: 11, stiffness: 160}});
  if (f < a) return null;
  const tampon = police === 'tampon';
  return (
    <div style={{position: 'absolute', left: x, top: y, transform: `translate(-50%,-50%) rotate(${rot}deg) scale(${s})`, fontFamily: polices[police], fontSize: taille,
      color: couleur, border: tampon ? `7px solid ${couleur}` : undefined, padding: tampon ? '6px 22px' : 0, borderRadius: 10,
      background: tampon ? 'rgba(255,252,246,.92)' : undefined, whiteSpace: 'nowrap', letterSpacing: 2}}>{texte}</div>
  );
};

type Mot = {m: string; t: number; f: number};
const Karaoke: React.FC<{mots: Mot[]}> = ({mots}) => {
  const frame = useCurrentFrame();
  const groupes: Mot[][] = [];
  mots.forEach((m) => {
    const g = groupes[groupes.length - 1];
    if (!g || g.length >= 3 || /[.?!,]$/.test(g[g.length - 1].m)) groupes.push([m]); else g.push(m);
  });
  const g = groupes.find((x, i) => frame >= x[0].t - 2 && frame < (groupes[i + 1]?.[0].t ?? x[x.length - 1].f + 20) - 2);
  if (!g) return null;
  const debut = frame - g[0].t;
  return (
    <div style={{position: 'absolute', left: 40, right: 40, top: 1410, textAlign: 'center', fontFamily: polices.anton, fontSize: 112, lineHeight: 1.1,
      textTransform: 'uppercase', transform: `scale(${interpolate(debut, [-2, 4], [0.88, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})})`}}>
      {g.map((m, i) => (
        <span key={i} style={{color: frame >= m.t - 1 ? C.rouge : C.encre, margin: '0 14px', display: 'inline-block', WebkitTextStroke: '3px #fff',
          paintOrder: 'stroke', textShadow: '0 6px 0 rgba(31,34,48,.25)'}}>{m.m.replace(/[,.;:?]$/, '')}</span>
      ))}
    </div>
  );
};

/** Caméra sur le plan : centre (cx, cy) et zoom z. */
const Scene: React.FC<{cx?: number; cy?: number; z?: number; children: React.ReactNode}> = ({cx = 500, cy = 500, z = 1, children}) => (
  <svg viewBox="0 0 1000 1000" style={{position: 'absolute', left: 0, top: 300, width: 1080, height: 1080, overflow: 'hidden'}}>
    <g transform={`translate(500 500) scale(${z}) translate(${-cx} ${-cy})`}>{children}</g>
  </svg>
);

const Titre: React.FC<{children: React.ReactNode; taille?: number; couleur?: string; police?: keyof typeof polices; style?: React.CSSProperties}> = (
  {children, taille = 96, couleur = C.encre, police = 'bloc', style}) => (
  <div style={{position: 'absolute', top: 150, left: 0, right: 0, textAlign: 'center', fontFamily: polices[police], fontSize: taille, color: couleur, lineHeight: 1, ...style}}>
    {children}</div>
);

export const SecretIkea: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const pt = (d: string, v: number) => getPointAtLength(d, v * getLength(d));

  let scene: React.ReactNode = null;
  let calques: React.ReactNode = null;

  if (f < 112) {
    // accroche : le labyrinthe déjà tracé, un client perdu à l'entrée
    const a = pt(CHEMIN, 0.04 + 0.05 * p(f, 0, 110));
    scene = <Scene z={1 + 0.06 * p(f, 0, 110)}><Plan chemin={0.35 + 0.65 * p(f, 0, 100)} fleches={1} bacs={1} caisses={1} /><Personne x={a.x} y={a.y} chariot /></Scene>;
    calques = <>
      <Titre taille={112} police="anton" style={{top: 60}}>WHY IKEA IS<br /><span style={{color: C.rouge}}>A MAZE</span></Titre>
      <Etiquette x={540} y={800} texte="PROBLEM" f={f} a={60} taille={120} />
    </>;
  } else if (f < 246) {
    // avant : magasin vide, on entre, on prend la lampe, on sort
    const v = f < 179 ? 0.5 * p(f, 112, 175) : 0.5 + 0.5 * p(f, 180, 240);
    const a = pt(DIRECT, v);
    const pris = f >= 172;
    scene = <Scene><Plan cloisons={0} caisses={1} />
      <path d={DIRECT} stroke={C.gris} strokeWidth={8} strokeDasharray="4 18" strokeLinecap="round" fill="none" />
      {!pris && <Lampe x={560} y={760} s={1.2} />}
      <Personne x={a.x} y={a.y} chariot />{pris && <Lampe x={a.x + 44} y={a.y - 4} s={0.55} />}</Scene>;
    calques = <Titre>CART: <span style={{color: C.rouge}}>{pris ? 1 : 0}</span> ITEM</Titre>;
  } else if (f < 317) {
    // on redessine le magasin
    scene = <Scene><Plan cloisons={p(f, 250, 312)} caisses={1} /></Scene>;
    calques = <Etiquette x={540} y={200} texte="REDESIGN" f={f} a={250} police="feutre" couleur={C.encre} taille={110} rot={-4} />;
  } else if (f < 496) {
    // un seul chemin, les flèches, puis la caméra suit le zigzag
    const suit = p(f, 424, 492, Easing.linear);
    const a = pt(CHEMIN, suit);
    const zoom = interpolate(f, [418, 430], [1, 1.9], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
    const cx = interpolate(zoom, [1, 1.9], [500, a.x]), cy = interpolate(zoom, [1, 1.9], [500, a.y]);
    scene = <Scene cx={cx} cy={cy} z={zoom}>
      <Plan chemin={p(f, 317, 366)} fleches={p(f, 372, 414)} />
      {f >= 418 && <Personne x={a.x} y={a.y} chariot />}</Scene>;
    calques = f < 424 ? <Etiquette x={540} y={200} key={f < 372 ? 'a' : 'b'} texte={f < 372 ? 'ONE PATH' : 'FOLLOW THE ARROWS'} f={f} a={f < 372 ? 320 : 374} taille={f < 372 ? 84 : 66} /> : null;
  } else if (f < 604) {
    // perdu : la sortie disparaît
    const t = f - 496;
    scene = <Scene z={1.25} cx={480} cy={470}><Plan chemin={1} fleches={1} /><Personne x={500} y={395} chariot ang={Math.sin(t / 6) * 40} />
      {[[-80, -70], [90, -60], [-60, 80], [100, 70]].map(([dx, dy], i) => (
        <text key={i} x={500 + dx} y={395 + dy} fontFamily={polices.anton} fontSize={70} fill={C.rouge} textAnchor="middle"
          opacity={p(f, 520 + i * 12, 530 + i * 12)}>?</text>))}</Scene>;
    calques = <Titre style={{opacity: 1 - p(f, 540, 590), filter: `blur(${12 * p(f, 540, 590)}px)`}}>EXIT →</Titre>;
  } else if (f < 731) {
    // à l'étage : un canapé… puis toute une vie
    const vie = p(f, 674, 700);
    scene = <Scene>
      <rect x={140} y={200} width={720} height={600} rx={24} fill={C.sol} stroke={C.encre} strokeWidth={10} />
      <rect x={300} y={500} width={400} height={220} rx={16} fill="#E9DCC6" opacity={vie} />
      <Canape x={500} y={600} s={1.3} />
      <g opacity={vie}><Lampe x={230} y={560} s={1.4} /><Plante x={780} y={300} s={1.8} /><Cadre x={500} y={290} s={1.6} />
        <circle cx={780} cy={600} r={46} fill="#D9A15B" stroke={C.encre} strokeWidth={6} /><Verre x={780} y={596} s={0.8} /><Bougie x={230} y={310} s={1.2} /></g>
    </Scene>;
    calques = <Etiquette x={540} y={190} key={f < 674 ? 'a' : 'b'} texte={f < 674 ? 'UPSTAIRS' : 'A WHOLE LIFE'} f={f} a={f < 674 ? 606 : 676} police="feutre" couleur={C.encre} taille={100} rot={-3} />;
  } else if (f < 835) {
    // ils rêvent : bulle de pensée
    const s = spring({frame: f - 735, fps, config: {damping: 12}});
    scene = <Scene>
      <Personne x={500} y={820} s={2.2} chariot />
      <g transform={`translate(500 420) scale(${s})`}>
        <circle cx={-150} cy={300} r={18} fill="#fff" stroke={C.encre} strokeWidth={5} /><circle cx={-110} cy={235} r={28} fill="#fff" stroke={C.encre} strokeWidth={5} />
        <ellipse cx={0} cy={0} rx={300} ry={190} fill="#fff" stroke={C.encre} strokeWidth={8} />
        <Canape x={0} y={50} s={0.9} /><Lampe x={-190} y={20} s={0.9} /><Plante x={190} y={0} s={1} /><Cadre x={0} y={-80} s={0.9} />
      </g>
    </Scene>;
    calques = <Etiquette x={540} y={190} key={f < 785 ? 'a' : 'b'} texte={f < 785 ? 'NOT BUYING… YET' : 'JUST DREAMING'} f={f} a={f < 785 ? 733 : 787} couleur={C.vert} taille={80} rot={4} />;
  } else if (f < 924) {
    // le piège juste avant les caisses
    const k = p(f, 835, 880);
    const pulse = 0.5 + 0.5 * Math.sin((f - 835) / 3);
    scene = <Scene z={1 + 0.9 * k} cx={500 - 100 * k} cy={500 + 290 * k}>
      <Plan chemin={1} fleches={1} bacs={1} caisses={1} />
      <rect x={130} y={725} width={540} height={66} rx={12} fill="none" stroke={C.rouge} strokeWidth={8} opacity={f >= 880 ? pulse : 0} />
    </Scene>;
    calques = <Etiquette x={540} y={200} texte="THE TRAP" f={f} a={884} taille={120} />;
  } else if (f < 1192) {
    // le chariot se remplit
    const nb = f < 966 ? 2 : f < 1011 ? 3 : f < 1052 ? 4 : f < 1131 ? 4 + Math.floor(p(f, 1052, 1122, Easing.linear) * 6) : 10 + Math.floor(p(f, 1131, 1180, Easing.linear) * 4);
    const items = Math.min(nb - 1, 14);
    const tremble = f >= 1131 ? Math.sin(f) * 4 : 0;
    scene = <Scene>
      <g transform={`translate(${500 + tremble} 600)`}>
        {Array.from({length: items}, (_, i) => {
          const O = OBJETS[i % OBJETS.length];
          const arr = [924, 966, 1011][i] ?? 1052 + (i - 3) * 11;
          const chute = p(f, arr, arr + 10, Easing.out(Easing.quad));
          return <O key={i} x={-150 + (i % 5) * 75} y={-40 - Math.floor(i / 5) * 70 - 500 * (1 - chute)} s={1.1} />;
        })}
        <path d="M-230 -10 H230 L190 170 H-190 Z" fill="rgba(255,252,246,.6)" stroke={C.encre} strokeWidth={12} strokeLinejoin="round" />
        {[-120, -40, 40, 120].map((x) => <line key={x} x1={x} y1={-10} x2={x * 0.85} y2={170} stroke={C.encre} strokeWidth={6} />)}
        <path d="M-230 -10 L-290 -90 H-330" stroke={C.encre} strokeWidth={12} fill="none" strokeLinecap="round" />
        <circle cx={-150} cy={220} r={26} fill={C.encre} /><circle cx={150} cy={220} r={26} fill={C.encre} />
      </g>
    </Scene>;
    calques = <Titre>CART: <span style={{color: C.rouge}}>{nb}</span> ITEMS</Titre>;
  } else if (f < 1276) {
    // l'étude
    scene = <Scene>
      <g transform={`rotate(${-3 + 3 * p(f, 1192, 1215)} 500 490)`}>
        <rect x={150} y={260} width={700} height={460} rx={20} fill="#fff" stroke={C.encre} strokeWidth={8} />
        <text x={500} y={390} textAnchor="middle" fontFamily={polices.machine} fontSize={58} fill={C.encre}>LAYOUT STUDY</text>
        <text x={500} y={470} textAnchor="middle" fontFamily={polices.machine} fontSize={38} fill={C.encre}>University College London</text>
        <text x={500} y={530} textAnchor="middle" fontFamily={polices.machine} fontSize={38} fill={C.encre}>2011</text>
      </g>
      <g opacity={p(f, 1215, 1235)}><path d="M500 570 C455 625 465 655 500 700 C535 655 545 625 500 570 Z" fill={C.rouge} /><circle cx={500} cy={615} r={14} fill="#fff" /></g>
    </Scene>;
    calques = <Etiquette x={540} y={200} texte="LONDON" f={f} a={1196} police="feutre" couleur={C.encre} taille={100} rot={-3} />;
  } else if (f < 1399) {
    // six sur dix
    const rouges = Math.floor(p(f, 1290, 1340, Easing.linear) * 6);
    scene = <Scene>
      {Array.from({length: 10}, (_, i) => {
        const x = 170 + (i % 5) * 165, y = 430 + Math.floor(i / 5) * 230;
        const r = i < rouges;
        return <g key={i} transform={`translate(${x} ${y}) scale(${r ? 1.08 : 1})`}>
          <path d="M-55 -40 H55 L45 75 H-45 Z" fill={r ? C.rouge : C.gris} /><path d="M-25 -40 C-25 -85 25 -85 25 -40" stroke={r ? C.rouge : C.gris} strokeWidth={10} fill="none" />
        </g>;
      })}
    </Scene>;
    calques = <>
      <Titre taille={170} police="anton" couleur={C.rouge} style={{top: 110}}>{rouges} / 10</Titre>
      <Etiquette x={540} y={1170} texte="NOT ON THE LIST" f={f} a={1345} taille={76} rot={-3} />
    </>;
  } else if (f < 1542) {
    // la réponse d'IKEA, puis les raccourcis cachés
    if (f < 1480) {
      scene = <Scene><rect x={110} y={330} width={780} height={320} rx={26} fill="#fff" stroke={C.encre} strokeWidth={8} />
        <text x={500} y={480} textAnchor="middle" fontFamily={polices.playfair} fontSize={78} fill={C.encre}>“Just inspiration.”</text>
        <text x={500} y={580} textAnchor="middle" fontFamily={polices.corps} fontWeight={700} fontSize={44} fill={C.gris}>— IKEA</text></Scene>;
    } else {
      const cl = 0.5 + 0.5 * Math.sin((f - 1480) / 3);
      scene = <Scene><Plan chemin={1} fleches={1} bacs={1} caisses={1} />
        {[[290, 395], [710, 605], [500, 185]].map(([x, y], i) => (
          <g key={i} opacity={cl * p(f, 1484 + i * 8, 1494 + i * 8)}><circle cx={x} cy={y} r={44} fill={C.sol} stroke={C.vert} strokeWidth={8} strokeDasharray="12 10" />
            <text x={x} y={y + 22} textAnchor="middle" fontFamily={polices.anton} fontSize={60} fill={C.vert}>?</text></g>))}</Scene>;
      calques = <Etiquette x={540} y={200} texte="SHORTCUTS?" f={f} a={1482} couleur={C.vert} taille={96} />;
    }
  } else {
    // fin : où est-il ? retour au plan de l'accroche (boucle)
    const z = 1.6 - 0.6 * p(f, 1585, 1640);
    scene = <Scene z={z} cx={500} cy={450}><Plan chemin={1} fleches={1} bacs={1} caisses={1} /><Personne x={500} y={395} chariot /></Scene>;
    calques = <Titre taille={160} police="anton" couleur={C.rouge} style={{top: 110, transform: `scale(${spring({frame: f - 1588, fps, config: {damping: 10}})})`}}>WHERE?</Titre>;
  }

  return (
    <AbsoluteFill style={{background: C.fond}}>
      <Audio src={staticFile('secret_ikea/voix.wav')} />
      {/* fond quadrillé discret, façon plan d'architecte */}
      <AbsoluteFill style={{backgroundImage: `linear-gradient(${C.ombre} 2px, transparent 2px), linear-gradient(90deg, ${C.ombre} 2px, transparent 2px)`,
        backgroundSize: '60px 60px', opacity: 0.5}} />
      {scene}
      {calques}
      <Karaoke mots={data.mots} />
    </AbsoluteFill>
  );
};
