import {AbsoluteFill} from 'remotion';

/**
 * Photo de profil du « Régiment des Abonnés » : le Bleu, la recrue, en gros plan.
 * Une seule idée lisible à 100 px : un visage casqué, regard déterminé, une goutte de sueur
 * (il en bave, et c'est toi qui décides). Régiment fictif : aucun insigne réel, seulement
 * un galon jaune générique (couleur d'accent de toutes nos chaînes interactives).
 * Carrée 1080, recadrée en rond par TikTok : tout tient dans le disque central.
 */
const JAUNE = '#ffc928', BRUN = '#2b1a00';
const KAKI = '#5b6b2e', KAKI_FONCE = '#3c4a1c', KAKI_CLAIR = '#7d8f43';
const PEAU = '#e8b07c', PEAU_OMBRE = '#c98d5c';

export const RegimentProfil: React.FC = () => (
  <AbsoluteFill style={{background: 'radial-gradient(circle at 50% 40%, #6f7f3a 0%, #34401a 60%, #1a2010 100%)'}}>
    <svg width="1080" height="1080" viewBox="0 0 1080 1080">
      <defs>
        <filter id="ombre" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="20" stdDeviation="16" floodColor="#000" floodOpacity="0.45" />
        </filter>
        <linearGradient id="casque" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={KAKI_CLAIR} /><stop offset="1" stopColor={KAKI_FONCE} />
        </linearGradient>
      </defs>

      <g filter="url(#ombre)">
        {/* épaules : treillis kaki + galon jaune sur la poitrine */}
        <path d="M150 1080 Q150 830 360 780 L720 780 Q930 830 930 1080 Z" fill={KAKI} stroke={BRUN} strokeWidth="22" />
        <path d="M455 780 L540 880 L625 780" fill="none" stroke={BRUN} strokeWidth="22" strokeLinejoin="round" />
        <g transform="translate(760 930)">
          <rect x="-70" y="-60" width="140" height="120" rx="18" fill={KAKI_FONCE} stroke={BRUN} strokeWidth="12" />
          <path d="M-45 -18 L0 12 L45 -18" fill="none" stroke={JAUNE} strokeWidth="22" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M-45 18 L0 48 L45 18" fill="none" stroke={JAUNE} strokeWidth="22" strokeLinecap="round" strokeLinejoin="round" opacity="0.35" />
        </g>

        {/* cou */}
        <rect x="470" y="690" width="140" height="110" fill={PEAU_OMBRE} stroke={BRUN} strokeWidth="18" />

        {/* oreilles puis tête */}
        {[-1, 1].map((s) => (
          <ellipse key={s} cx={540 + s * 238} cy="560" rx="38" ry="58" fill={PEAU} stroke={BRUN} strokeWidth="18" />
        ))}
        <ellipse cx="540" cy="540" rx="235" ry="250" fill={PEAU} stroke={BRUN} strokeWidth="22" />

        {/* sourcils froncés : il serre les dents */}
        <path d="M385 480 L495 505" stroke={BRUN} strokeWidth="30" strokeLinecap="round" />
        <path d="M695 480 L585 505" stroke={BRUN} strokeWidth="30" strokeLinecap="round" />
        {/* yeux */}
        {[-1, 1].map((s) => (
          <g key={s}>
            <ellipse cx={540 + s * 88} cy="560" rx="46" ry="52" fill="#fff" stroke={BRUN} strokeWidth="12" />
            <circle cx={540 + s * 82} cy="566" r="24" fill="#1b1d24" />
            <circle cx={540 + s * 74} cy="556" r="8" fill="#fff" />
          </g>
        ))}
        {/* nez + bouche serrée */}
        <path d="M540 590 Q530 640 552 648" fill="none" stroke={PEAU_OMBRE} strokeWidth="14" strokeLinecap="round" />
        <path d="M480 700 Q540 688 600 702" fill="none" stroke={BRUN} strokeWidth="16" strokeLinecap="round" />

        {/* casque */}
        <path d="M290 470 Q285 215 540 210 Q795 215 790 470 Z" fill="url(#casque)" stroke={BRUN} strokeWidth="22" strokeLinejoin="round" />
        <path d="M262 470 Q540 420 818 470 Q826 505 800 512 Q540 468 280 512 Q254 505 262 470 Z" fill={KAKI_FONCE} stroke={BRUN} strokeWidth="18" strokeLinejoin="round" />
        {/* filet de camouflage */}
        {[340, 420, 500, 580, 660, 740].map((x) => (
          <path key={x} d={`M${x} 250 Q${x + 18} 360 ${x - 6} 465`} fill="none" stroke={KAKI_FONCE} strokeWidth="9" opacity="0.6" />
        ))}
        <path d="M310 340 Q540 300 770 340" fill="none" stroke={KAKI_FONCE} strokeWidth="9" opacity="0.6" />
        {/* jugulaire */}
        {[-1, 1].map((s) => (
          <path key={s} d={`M${540 + s * 245} 500 Q${540 + s * 215} 690 ${540 + s * 70} 770`} fill="none" stroke={KAKI_FONCE} strokeWidth="18" strokeLinecap="round" />
        ))}

        {/* goutte de sueur */}
        <path d="M770 545 Q805 600 790 630 Q770 655 748 632 Q735 605 770 545 Z" fill="#8fd3ff" stroke={BRUN} strokeWidth="12" strokeLinejoin="round" />
      </g>
    </svg>
  </AbsoluteFill>
);
