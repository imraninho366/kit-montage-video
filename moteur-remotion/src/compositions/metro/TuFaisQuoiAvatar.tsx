// Photo de profil de la chaîne « Tu Fais Quoi ? » (TikTok, affichée en rond, lisible dès 100 px).
// Même ADN que les épisodes : contours brun épais, lumière orange de la rame, écran bleu nuit, notification « Numéro inconnu ».
import {loadFont as chargerBaloo} from '@remotion/google-fonts/Baloo2';
import React from 'react';
import {AbsoluteFill} from 'remotion';

const {fontFamily: BALOO} = chargerBaloo('normal', {weights: ['800'], subsets: ['latin']});
const TRAIT = '#24150f';

export const TuFaisQuoiAvatar: React.FC = () => (
  <AbsoluteFill style={{background: 'radial-gradient(circle at 50% 45%, #ffb04a 0%, #ec7a2a 55%, #c4481b 100%)'}}>
    <svg viewBox="0 0 1080 1080" width={1080} height={1080}>
      <g transform="rotate(-8 540 540)">
        {/* ombre portée façon toon */}
        <rect x={300} y={150} width={480} height={800} rx={90} fill={TRAIT} transform="translate(0 26)" />
        {/* le téléphone */}
        <rect x={300} y={150} width={480} height={800} rx={90} fill="#1e2140" stroke={TRAIT} strokeWidth={34} />
        <rect x={360} y={205} width={150} height={26} rx={13} fill="#3a3f6e" />
        {/* la notification du numéro inconnu */}
        <rect x={350} y={330} width={380} height={380} rx={74} fill="#fffaf1" stroke={TRAIT} strokeWidth={26} />
        <path d="M 432 700 L 400 810 L 530 706 Z" fill="#fffaf1" stroke={TRAIT} strokeWidth={26} strokeLinejoin="round" />
        <rect x={392} y={676} width={180} height={30} fill="#fffaf1" />
        <text x={540} y={655} textAnchor="middle" fontFamily={BALOO} fontWeight={800} fontSize={400} fill="#e2702c"
          stroke={TRAIT} strokeWidth={20} paintOrder="stroke fill">?</text>
      </g>
    </svg>
  </AbsoluteFill>
);
