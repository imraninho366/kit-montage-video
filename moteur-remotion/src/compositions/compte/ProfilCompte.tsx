import {loadFont as chargerLilita} from '@remotion/google-fonts/LilitaOne';
import {AbsoluteFill} from 'remotion';

const lilita = chargerLilita('normal', {subsets: ['latin']});
const JAUNE = '#ffc928', BRUN = '#2b1a00', ROSE = '#fe2c55';

/**
 * Photos de profil du compte « Les Abonnés Décident » (toutes les séries interactives), en 4 variantes à départager :
 *  a — les trois pastilles de vote A, B, C (la mécanique)
 *  b — le cadenas « ? » (l'énigme à résoudre)
 *  c — la bifurcation (tu choisis, l'histoire change)
 *  d — la médaille « @ » (ton pseudo dans l'épisode suivant)
 *  e — la bande de voleurs masqués (les abonnés sont les complices)
 * Charte des vidéos : jaune #ffc928, contour brun #2b1a00, fond nuit. Carrées, recadrées en rond par TikTok :
 * tout tient dans le disque central.
 */
export type Variante = 'a' | 'b' | 'c' | 'd' | 'e';

const Pastille: React.FC<{x: number; y: number; r: number; lettre: string; fond?: string}> = ({x, y, r, lettre, fond = JAUNE}) => (
  <g>
    <circle cx={x} cy={y} r={r} fill={fond} stroke={BRUN} strokeWidth={r * 0.16} />
    <text x={x} y={y + r * 0.36} textAnchor="middle" fontFamily={lilita.fontFamily} fontSize={r * 1.05} fill={BRUN}>{lettre}</text>
  </g>
);

const VoteABC: React.FC = () => (
  <g filter="url(#ombre)">
    <Pastille x={350} y={430} r={150} lettre="A" />
    <Pastille x={730} y={430} r={150} lettre="B" />
    {/* la pastille C, un peu plus grande et en rose : la réponse choisie */}
    <Pastille x={540} y={720} r={175} lettre="C" fond={ROSE} />
  </g>
);

const Cadenas: React.FC = () => (
  <g filter="url(#ombre)">
    <path d="M395 520 V400 Q395 250 540 250 Q685 250 685 400 V520" fill="none" stroke={BRUN} strokeWidth="104" strokeLinecap="round" />
    <path d="M395 520 V400 Q395 250 540 250 Q685 250 685 400 V520" fill="none" stroke="#cfd6df" strokeWidth="58" strokeLinecap="round" />
    <rect x="290" y="470" width="500" height="390" rx="70" fill={JAUNE} stroke={BRUN} strokeWidth="34" />
    <text x="540" y="790" textAnchor="middle" fontFamily={lilita.fontFamily} fontSize="330" fill={BRUN}>?</text>
  </g>
);

/** Une route qui part d'en bas et se sépare en deux flèches : jaune à gauche, rose à droite. */
const Bifurcation: React.FC = () => {
  const gauche = 'M540 880 V640 Q540 560 440 480 L370 420';
  const droite = 'M540 880 V640 Q540 560 640 480 L710 420';
  // pointes dans l'axe de chaque branche (direction environ -40° vers le haut)
  const pointe = (pts: string, couleur: string) => <path d={pts} fill={couleur} stroke={BRUN} strokeWidth="30" strokeLinejoin="round" />;
  return (
    <g filter="url(#ombre)">
      {[gauche, droite].map((d) => <path key={d} d={d} fill="none" stroke={BRUN} strokeWidth="126" strokeLinecap="round" strokeLinejoin="round" />)}
      <path d={gauche} fill="none" stroke={JAUNE} strokeWidth="78" strokeLinecap="round" strokeLinejoin="round" />
      <path d={droite} fill="none" stroke={ROSE} strokeWidth="78" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M540 880 V640" fill="none" stroke="#ffffff" strokeWidth="78" strokeLinecap="round" />
      {pointe('M446 352 L270 330 L314 506 Z', JAUNE)}
      {pointe('M634 352 L810 330 L766 506 Z', ROSE)}
    </g>
  );
};

const MedailleArobase: React.FC = () => (
  <g filter="url(#ombre)">
    <defs>
      <linearGradient id="or" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#ffe9a3" /><stop offset="0.55" stopColor={JAUNE} /><stop offset="1" stopColor="#c9962e" />
      </linearGradient>
    </defs>
    <circle cx="540" cy="540" r="330" fill="url(#or)" stroke={BRUN} strokeWidth="34" />
    <circle cx="540" cy="540" r="270" fill="none" stroke={BRUN} strokeWidth="10" strokeDasharray="6 22" strokeLinecap="round" opacity="0.55" />
    <text x="540" y="680" textAnchor="middle" fontFamily={lilita.fontFamily} fontSize="400" fill={BRUN}>@</text>
  </g>
);

/** Une tête de voleur : bonnet, loup noir, yeux qui regardent de côté, petit sourire en coin. */
const Voleur: React.FC<{x: number; y: number; k: number; peau: string; regard: 1 | -1; revers?: string}> = ({x, y, k, peau, regard, revers = '#2a2e3d'}) => (
  <g transform={`translate(${x} ${y}) scale(${k})`}>
    {/* épaules (sweat sombre) */}
    <path d="M-230 330 Q-230 170 -90 140 L90 140 Q230 170 230 330 Z" fill="#20243a" stroke={BRUN} strokeWidth="16" />
    <circle cx="0" cy="0" r="150" fill={peau} stroke={BRUN} strokeWidth="16" />
    {/* bonnet + revers */}
    <path d="M-158 -10 Q-160 -205 0 -205 Q160 -205 158 -10 Z" fill="#15171f" stroke={BRUN} strokeWidth="16" strokeLinejoin="round" />
    <rect x="-166" y="-52" width="332" height="56" rx="20" fill={revers} stroke={BRUN} strokeWidth="14" />
    {/* le loup : un bandeau noir percé de deux yeux */}
    <path d="M-168 30 Q-150 -10 -60 -2 Q0 12 60 -2 Q150 -10 168 30 Q150 95 60 82 Q0 70 -60 82 Q-150 95 -168 30 Z" fill="#0b0c11" stroke={BRUN} strokeWidth="12" />
    {[-72, 72].map((ox) => (
      <g key={ox}>
        <ellipse cx={ox} cy="40" rx="38" ry="28" fill="#fff" />
        <circle cx={ox + regard * 16} cy="42" r="15" fill="#1b1d24" />
      </g>
    ))}
    {/* sourire en coin */}
    <path d={regard === 1 ? 'M-30 100 Q20 128 58 96' : 'M-58 96 Q-20 128 30 100'} fill="none" stroke={BRUN} strokeWidth="12" strokeLinecap="round" />
  </g>
);

const BandeDeVoleurs: React.FC = () => (
  <>
    {/* deux lasers rouges en travers, derrière la bande */}
    {/* le projecteur qui surprend la bande */}
    <circle cx="540" cy="470" r="400" fill="url(#halo)" />
    {[[0, 250, 1080, 170], [0, 330, 1080, 420]].map(([x1, y1, x2, y2], i) => (
      <g key={i}>
        <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#ff1a2a" strokeWidth="24" opacity="0.5" filter="url(#lueurRouge)" />
        <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#ff5a64" strokeWidth="7" />
      </g>
    ))}
    <g filter="url(#ombre)">
      <Voleur x={265} y={540} k={0.95} peau="#c98a5a" regard={1} />
      <Voleur x={815} y={540} k={0.95} peau="#f2c9a0" regard={-1} />
      <Voleur x={540} y={500} k={1.22} peau="#e9b27d" regard={1} revers={JAUNE} />
    </g>
  </>
);

export const ProfilCompte: React.FC<{variante: Variante}> = ({variante}) => (
  <AbsoluteFill style={{background: 'radial-gradient(circle at 50% 42%, #1d2a5a 0%, #0b1024 62%, #05070c 100%)'}}>
    <svg width="1080" height="1080" viewBox="0 0 1080 1080">
      <defs>
        <filter id="ombre" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="22" stdDeviation="18" floodColor="#000" floodOpacity="0.5" />
        </filter>
        <filter id="lueurRouge" x="-10%" y="-50%" width="120%" height="200%"><feGaussianBlur stdDeviation="9" /></filter>
        <radialGradient id="halo"><stop offset="0" stopColor="#ffd75a" stopOpacity="0.75" /><stop offset="0.55" stopColor="#ffc928" stopOpacity="0.25" /><stop offset="1" stopColor="#ffc928" stopOpacity="0" /></radialGradient>
      </defs>
      {variante === 'a' && <VoteABC />}
      {variante === 'b' && <Cadenas />}
      {variante === 'c' && <Bifurcation />}
      {variante === 'd' && <MedailleArobase />}
      {variante === 'e' && <BandeDeVoleurs />}
    </svg>
  </AbsoluteFill>
);
