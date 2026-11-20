import {AbsoluteFill, Audio, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig, Easing} from 'remotion';
import {polices} from '../design/theme';
import data from '../videos/secret_hublots.json';

/** Short « Secretly Designed » #2 : pourquoi les hublots sont ronds (le de Havilland Comet, 1954). */
export const DUREE_SECRET_HUBLOTS = data.frames;

const C = {ciel1: '#5FA8E8', ciel2: '#CFE8FF', mer: '#1D5C8C', encre: '#1F2230', rouge: '#FF4D2E', vert: '#22B07D', metal: '#E7EBF0', metal2: '#B8C2CE',
  fond: '#F3EDE2', eau: '#3D8FD1'};
const p = (f: number, a: number, b: number, e = Easing.inOut(Easing.cubic)) =>
  interpolate(f, [a, b], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: e});

// ---------- l'avion vu de profil (repère local : longueur ~840, centré) ----------
const Fenetres: React.FC<{x0: number; x1: number; rond: boolean}> = ({x0, x1, rond}) => (
  <>{Array.from({length: Math.floor((x1 - x0) / 46)}, (_, i) => (
    <rect key={i} x={x0 + i * 46} y={-20} width={24} height={rond ? 30 : 24} rx={rond ? 12 : 1} fill="#2B3A55" />
  ))}</>
);
/** casse : 0 = intact, 1 = trois morceaux bien séparés. */
const Avion: React.FC<{x: number; y: number; s?: number; ang?: number; rond?: boolean; casse?: number}> = ({x, y, s = 1, ang = 0, rond = false, casse = 0}) => {
  const d = casse * 120;
  return (
    <g transform={`translate(${x} ${y}) rotate(${ang}) scale(${s})`}>
      {/* queue */}
      <g transform={`translate(${-d} ${d * 0.6}) rotate(${-casse * 25} -260 0)`}>
        <path d="M-130 -40 H-330 Q-380 -40 -400 -10 L-420 -120 H-370 L-300 -40 Z" fill={C.metal2} />
        <path d="M-130 -40 H-340 Q-400 -30 -410 0 Q-400 40 -340 40 H-130 Z" fill={C.metal} stroke={C.metal2} strokeWidth={4} />
        <Fenetres x0={-320} x1={-140} rond={rond} />
      </g>
      {/* milieu + aile */}
      <g transform={`translate(0 ${d * 0.3}) rotate(${casse * 10})`}>
        <path d="M-60 25 L60 25 L-40 140 L-110 140 Z" fill={C.metal2} />
        <rect x={-130} y={-40} width={290} height={80} fill={C.metal} stroke={C.metal2} strokeWidth={4} />
        <Fenetres x0={-118} x1={150} rond={rond} />
      </g>
      {/* nez */}
      <g transform={`translate(${d} ${d * 0.9}) rotate(${casse * 30} 200 0)`}>
        <path d="M160 -40 H330 Q420 -30 430 0 Q420 40 330 40 H160 Z" fill={C.metal} stroke={C.metal2} strokeWidth={4} />
        <path d="M360 -24 Q395 -20 410 -6 H368 Z" fill="#2B3A55" />
        <Fenetres x0={172} x1={340} rond={rond} />
      </g>
    </g>
  );
};

const Nuages: React.FC<{f: number; vitesse?: number}> = ({f, vitesse = 6}) => (
  <>{[[200, 380, 1.2], [760, 520, 0.9], [420, 980, 1.4], [900, 1150, 1], [120, 1250, 0.8]].map(([x, y, s], i) => {
    const xx = ((x - f * vitesse * s) % 1400 + 1400) % 1400 - 200;
    return <g key={i} transform={`translate(${xx} ${y}) scale(${s})`} opacity={0.9}>
      <ellipse cx={0} cy={0} rx={110} ry={38} fill="#fff" /><ellipse cx={-50} cy={-22} rx={60} ry={40} fill="#fff" /><ellipse cx={40} cy={-30} rx={70} ry={48} fill="#fff" />
    </g>;
  })}</>
);

const Ciel: React.FC<{children?: React.ReactNode; f: number; rouge?: number}> = ({children, f, rouge = 0}) => (
  <svg viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
    <defs><linearGradient id="ciel" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={C.ciel1} /><stop offset="1" stopColor={C.ciel2} /></linearGradient></defs>
    <rect width={1080} height={1920} fill="url(#ciel)" />
    <Nuages f={f} />
    {children}
    <rect width={1080} height={1920} fill={C.rouge} opacity={rouge} />
  </svg>
);

const Carton: React.FC<{texte: string; f: number; a: number; taille?: number; couleur?: string; fond?: string; y?: number; police?: keyof typeof polices}> = (
  {texte, f, a, taille = 150, couleur = C.encre, fond = '#fff', y = 640, police = 'anton'}) => {
  const {fps} = useVideoConfig();
  const s = spring({frame: f - a, fps, config: {damping: 12, stiffness: 150}});
  if (f < a) return null;
  return <div style={{position: 'absolute', left: '50%', top: y, transform: `translate(-50%,-50%) scale(${s}) rotate(-2deg)`, background: fond, color: couleur,
    fontFamily: polices[police], fontSize: taille, padding: '10px 50px', borderRadius: 24, boxShadow: '0 18px 0 rgba(31,34,48,.18)', whiteSpace: 'nowrap'}}>{texte}</div>;
};

const Titre: React.FC<{children: React.ReactNode; couleur?: string; taille?: number; top?: number}> = ({children, couleur = '#fff', taille = 110, top = 120}) => (
  <div style={{position: 'absolute', top, left: 30, right: 30, textAlign: 'center', fontFamily: polices.anton, fontSize: taille, lineHeight: 1.02, color: couleur,
    WebkitTextStroke: '10px #1F2230', paintOrder: 'stroke', textShadow: '0 8px 0 rgba(31,34,48,.5)'}}>{children}</div>
);

// ---------- lignes de force autour d'un trou ----------
const LIGNES = [-330, -250, -180, -120, -70, -30, 30, 70, 120, 180, 250, 330];
/** Écoulement potentiel autour d'un cylindre de rayon R : on résout y(1 - R²/r²) = y0 pour chaque x. */
const ligneRonde = (y0: number, R: number) => {
  const pts: string[] = [];
  for (let x = -480; x <= 480; x += 12) {
    // dichotomie sur |y| entre le bord du cercle et loin : y(1 - R²/(x²+y²)) croît avec |y|
    const a0 = Math.abs(y0);
    let lo = Math.sqrt(Math.max(0, R * R - x * x)) + 0.01, hi = a0 + R + 400;
    for (let k = 0; k < 50; k++) { const m = (lo + hi) / 2; if (m * (1 - (R * R) / (x * x + m * m)) < a0) lo = m; else hi = m; }
    pts.push(`${x},${(Math.sign(y0) * (lo + hi) / 2).toFixed(1)}`);
  }
  return 'M' + pts.join(' L');
};
/** Autour d'un carré de demi-côté h : les lignes proches se tassent contre les coins. */
const ligneCarree = (y0: number, h: number) => {
  const pts: string[] = [];
  for (let x = -480; x <= 480; x += 8) {
    const prox = Math.max(0, 1 - Math.max(0, Math.abs(x) - h) / 110);
    const cible = Math.sign(y0) * (h + 8 + Math.abs(y0) * 0.25);
    const y = Math.abs(y0) < h + 60 ? y0 + (cible - y0) * Math.pow(prox, 0.6) : y0 + Math.sign(y0) * 30 * prox;
    pts.push(`${x},${y.toFixed(1)}`);
  }
  return 'M' + pts.join(' L');
};
const Ecoulement: React.FC<{f: number; forme: 'aucune' | 'rond' | 'carre'; chaud?: number}> = ({f, forme, chaud = 0}) => (
  <g transform="translate(540 820)">
    <rect x={-500} y={-420} width={1000} height={840} rx={30} fill="#D9DEE5" stroke={C.metal2} strokeWidth={8} />
    {LIGNES.map((y0) => {
      const d = forme === 'rond' ? ligneRonde(y0, 130) : forme === 'carre' ? ligneCarree(y0, 130) : `M-480 ${y0} H480`;
      return <path key={y0} d={d} stroke={forme === 'carre' && Math.abs(y0) < 200 ? C.rouge : C.eau} strokeWidth={9} fill="none" strokeLinecap="round"
        strokeDasharray="40 26" strokeDashoffset={-f * 6} />;
    })}
    {forme === 'rond' && <circle r={130} fill={C.fond} stroke={C.encre} strokeWidth={10} />}
    {forme === 'carre' && <>
      <rect x={-130} y={-130} width={260} height={260} fill={C.fond} stroke={C.encre} strokeWidth={10} />
      {[[-130, -130], [130, -130], [-130, 130], [130, 130]].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={30 + 40 * chaud} fill={C.rouge} opacity={0.35 + 0.5 * chaud} />))}
    </>}
  </g>
);

// ---------- hublot en gros plan ----------
const Hublot: React.FC<{arrondi: number; fissure?: number; lueur?: number; f: number}> = ({arrondi, fissure = 0, lueur = 0, f}) => {
  const fiss = 'M190 -190 L230 -215 L222 -250 L268 -272 L262 -310 L300 -340';
  return (
    <g transform="translate(540 820)">
      <rect x={-480} y={-480} width={960} height={960} rx={40} fill={C.metal} />
      {Array.from({length: 8}, (_, i) => [-420 + i * 120]).flatMap(([v]) => [[v, -440], [v, 440], [-440, v], [440, v]]).map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={9} fill={C.metal2} />))}
      <rect x={-230} y={-230} width={460} height={460} rx={arrondi} fill={C.metal2} />
      <clipPath id="vitre"><rect x={-200} y={-200} width={400} height={400} rx={Math.max(0, arrondi - 30)} /></clipPath>
      <g clipPath="url(#vitre)">
        <rect x={-200} y={-200} width={400} height={400} fill={C.ciel1} />
        {[[-80, -60], [90, 40], [-20, 120]].map(([x, y], i) => (
          <ellipse key={i} cx={((x + f * 3) % 600 + 600) % 600 - 300} cy={y} rx={90} ry={30} fill="#fff" />))}
      </g>
      {lueur > 0 && <circle cx={200} cy={-200} r={60 + 50 * lueur} fill={C.rouge} opacity={0.25 + 0.5 * lueur} />}
      {fissure > 0 && <path d={fiss} stroke={C.encre} strokeWidth={9} fill="none" strokeLinejoin="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - fissure} />}
    </g>
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
    <div style={{position: 'absolute', left: 40, right: 40, top: 1380, textAlign: 'center', fontFamily: polices.anton, fontSize: 116, lineHeight: 1.1,
      textTransform: 'uppercase', transform: `scale(${interpolate(debut, [-2, 4], [0.88, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})})`}}>
      {g.map((m, i) => (
        <span key={i} style={{color: frame >= m.t - 1 ? '#FFD84D' : '#fff', margin: '0 14px', display: 'inline-block', WebkitTextStroke: '10px #1F2230',
          paintOrder: 'stroke', textShadow: '0 8px 0 rgba(31,34,48,.5)'}}>{m.m.replace(/[,.;:?]$/, '')}</span>
      ))}
    </div>
  );
};

/** fond3d : les images viennent du rendu Blender (public/secret_hublots/3d/fNNNN.jpg) au lieu des dessins SVG. */
export const SecretHublots: React.FC<{fond3d?: boolean}> = ({fond3d = false}) => {
  const f = useCurrentFrame();
  let fond: React.ReactNode = null;
  let dessus: React.ReactNode = null;

  if (f < 167) {
    // accroche : le premier jet de ligne… qui tombe
    const chute = p(f, 95, 160, Easing.in(Easing.quad));
    fond = <Ciel f={f} rouge={0.18 * chute}><Avion x={560 + 40 * Math.sin(f / 20)} y={880 + 260 * chute} s={1.05} ang={8 * Math.sin(f / 25) + 28 * chute} /></Ciel>;
    dessus = <Titre>WHY ARE PLANE<br />WINDOWS <span style={{color: '#FFD84D'}}>ROUND?</span></Titre>;
  } else if (f < 316) {
    // janvier 1954 : au-dessus de la mer, l'avion se disloque
    const casse = p(f, 250, 300, Easing.out(Easing.cubic));
    fond = <Ciel f={f}>
      <rect y={1240} width={1080} height={680} fill={C.mer} />
      <Avion x={540} y={760 + 200 * casse} s={1} ang={6 + 10 * casse} casse={casse} />
    </Ciel>;
    dessus = <Carton texte="JANUARY 1954" f={f} a={168} y={300} taille={120} />;
  } else if (f < 482) {
    // avril : le deuxième ; aucun survivant
    const casse = p(f, 362, 400, Easing.out(Easing.cubic));
    fond = <Ciel f={f}><rect y={1240} width={1080} height={680} fill={C.mer} /><Avion x={540} y={760 + 180 * casse} ang={-4 - 12 * casse} casse={casse} /></Ciel>;
    dessus = <>
      <Carton texte="APRIL 1954" f={f} a={317} y={300} taille={120} />
      {f >= 408 && <div style={{position: 'absolute', top: 1150, left: 0, right: 0, textAlign: 'center', fontFamily: polices.bloc, fontSize: 70, color: '#fff',
        opacity: p(f, 408, 425), letterSpacing: 4}}>NO SURVIVORS</div>}
    </>;
  } else if (f < 785) {
    // la cuve d'eau, puis on gonfle / dégonfle la cabine
    const niveau = p(f, 552, 630);
    const cycle = f >= 646 ? 0.5 - 0.5 * Math.cos(((f - 646) / 22) * Math.PI * 2) : 0;
    fond = <svg viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
      <rect width={1080} height={1920} fill={C.fond} />
      <g transform="translate(540 820)">
        <rect x={-470} y={-380} width={940} height={760} rx={20} fill="#fff" stroke={C.encre} strokeWidth={14} />
        <rect x={-463} y={373 - 746 * niveau} width={926} height={746 * niveau} fill={C.eau} opacity={0.75} />
        <g transform={`scale(1 ${1 + 0.16 * cycle})`}>
          <rect x={-390} y={-80} width={780} height={160} rx={80} fill={C.metal} stroke={C.encre} strokeWidth={8} />
          {Array.from({length: 14}, (_, i) => <rect key={i} x={-330 + i * 48} y={-22} width={26} height={26} fill="#2B3A55" />)}
        </g>
      </g>
    </svg>;
    dessus = f < 646 ? <Titre couleur={fond3d ? '#fff' : C.encre} top={140}>A PLANE IN A<br /><span style={{color: C.eau}}>WATER TANK</span></Titre>
      : <Titre couleur={fond3d ? '#fff' : C.encre} top={140}>PUMP UP<br /><span style={{color: C.rouge}}>LET DOWN</span></Titre>;
  } else if (f < 896) {
    // comme un ballon
    const g = 0.5 - 0.5 * Math.cos(((f - 785) / 26) * Math.PI * 2);
    fond = <svg viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
      <rect width={1080} height={1920} fill={C.fond} />
      <g transform="translate(300 820)"><circle r={170 + 30 * g} fill={C.metal} stroke={C.encre} strokeWidth={12} />
        <circle r={150 + 30 * g} fill="none" stroke={C.metal2} strokeWidth={6} strokeDasharray="20 14" /></g>
      <text x={540} y={840} textAnchor="middle" fontFamily={polices.anton} fontSize={110} fill={C.encre}>=</text>
      <g transform={`translate(800 800) scale(${0.85 + 0.25 * g})`}><ellipse rx={150} ry={175} fill={C.rouge} /><path d="M0 175 L-18 205 H18 Z" fill={C.rouge} />
        <path d="M0 205 C30 260 -30 300 0 360" stroke={C.encre} strokeWidth={5} fill="none" /></g>
    </svg>;
    dessus = <Titre couleur={fond3d ? '#fff' : C.encre} top={140}>EVERY FLIGHT<br />= <span style={{color: C.rouge}}>A BALLOON</span></Titre>;
  } else if (f < 1016) {
    // trois mille vols plus tard… ça se déchire
    const n = Math.floor(3000 * p(f, 900, 985, Easing.in(Easing.quad)));
    const vite = 0.5 - 0.5 * Math.cos(((f - 896) / Math.max(4, 16 - (f - 896) / 8)) * Math.PI * 2);
    const flash = f >= 988 ? Math.max(0, 1 - (f - 988) / 14) : 0;
    fond = <svg viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
      <rect width={1080} height={1920} fill={C.fond} />
      <g transform={`translate(540 860) scale(1 ${1 + 0.14 * vite})`}>
        <rect x={-430} y={-90} width={860} height={180} rx={90} fill={C.metal} stroke={C.encre} strokeWidth={8} />
        {Array.from({length: 15}, (_, i) => <rect key={i} x={-360 + i * 50} y={-24} width={28} height={28} fill="#2B3A55" />)}
        {f >= 988 && <path d="M-40 -90 L-10 -40 L-50 0 L-5 40 L-30 90" stroke={C.rouge} strokeWidth={14} fill="none" />}
      </g>
      <rect width={1080} height={1920} fill="#fff" opacity={flash} />
    </svg>;
    dessus = <Titre couleur={fond3d ? '#fff' : C.encre} top={150} taille={130}>{n.toLocaleString('en-US')}<br /><span style={{fontSize: 80, color: C.rouge}}>FLIGHTS</span></Titre>;
  } else if (f < 1160) {
    // la fissure part d'un coin
    fond = <svg viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}><rect width={1080} height={1920} fill={C.fond} />
      <Hublot arrondi={0} fissure={p(f, 1020, 1075)} lueur={f >= 1088 ? 0.5 + 0.5 * Math.sin(f / 4) : 0} f={f} /></svg>;
    dessus = <Titre couleur={fond3d ? '#fff' : C.encre} top={140}>IT STARTS AT<br /><span style={{color: C.rouge}}>A CORNER</span></Titre>;
  } else if (f < 1440) {
    // la force coule comme de l'eau : plaque pleine, trou rond, trou carré
    const forme = f < 1290 ? 'aucune' : f < 1364 ? 'rond' : 'carre';
    fond = <svg viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}><rect width={1080} height={1920} fill={C.fond} />
      <Ecoulement f={f} forme={forme} chaud={forme === 'carre' ? 0.5 + 0.5 * Math.sin(f / 4) : 0} /></svg>;
    dessus = forme === 'aucune' ? <Titre couleur={fond3d ? '#fff' : C.encre} top={140}>FORCE FLOWS<br /><span style={{color: C.eau}}>LIKE WATER</span></Titre>
      : forme === 'rond' ? <Titre couleur={C.vert} top={140} taille={130}>CURVE: OK</Titre>
      : <Titre couleur={C.rouge} top={140} taille={130}>CORNER: STUCK</Titre>;
  } else if (f < 1563) {
    // même coin, à chaque vol, jusqu'à la déchirure
    const vols = Math.floor(p(f, 1440, 1505, Easing.in(Easing.quad)) * 3000);
    fond = <svg viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}><rect width={1080} height={1920} fill={C.fond} />
      <Hublot arrondi={0} lueur={p(f, 1440, 1505)} fissure={p(f, 1508, 1545)} f={f} /></svg>;
    dessus = <Titre couleur={fond3d ? '#fff' : C.encre} top={150} taille={120}>FLIGHT {vols.toLocaleString('en-US')}</Titre>;
  } else if (f < 1706) {
    // le hublot s'arrondit, puis un avion moderne
    if (f < 1628) {
      const a = 200 * p(f, 1566, 1610, Easing.out(Easing.cubic));
      fond = <svg viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}><rect width={1080} height={1920} fill={C.fond} /><Hublot arrondi={a} f={f} /></svg>;
      dessus = <Titre couleur={C.vert} top={150} taille={130}>ROUND</Titre>;
    } else {
      fond = <Ciel f={f}><Avion x={560} y={860} s={1.05} rond ang={-3 + 2 * Math.sin(f / 15)} /></Ciel>;
      dessus = <Titre top={150}>EVERY PLANE<br /><span style={{color: '#FFD84D'}}>SINCE</span></Titre>;
    }
  } else {
    // fin : depuis ton siège, regarde les coins
    const z = 1 + 0.15 * p(f, 1706, 1860);
    fond = <svg viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}><rect width={1080} height={1920} fill={C.fond} />
      <g transform={`translate(540 820) scale(${z}) translate(-540 -820)`}><Hublot arrondi={200} f={f} /></g></svg>;
    dessus = <Titre couleur={fond3d ? '#fff' : C.encre} top={140}>LOOK AT<br /><span style={{color: C.rouge}}>THE CORNERS</span></Titre>;
  }

  return (
    <AbsoluteFill style={{background: C.fond}}>
      <Audio src={staticFile('secret_hublots/voix.wav')} />
      {fond3d ? <Img src={staticFile(`secret_hublots/3d/f${String(f).padStart(4, '0')}.jpg`)} style={{position: 'absolute', inset: 0, width: 1080, height: 1920}} /> : fond}
      {dessus}
      <Karaoke mots={data.mots} />
    </AbsoluteFill>
  );
};
