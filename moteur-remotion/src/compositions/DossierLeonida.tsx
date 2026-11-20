import {loadFont as chargerAnton} from '@remotion/google-fonts/Anton';
import {loadFont as chargerMono} from '@remotion/google-fonts/IBMPlexMono';
import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';

/** Identité de la chaîne « Dossier Leonida » : photo de profil (800×800) et bannière (2560×1440). Images fixes. */
const {fontFamily: ANTON} = chargerAnton('normal', {weights: ['400'], subsets: ['latin']});
const {fontFamily: MONO} = chargerMono('normal', {weights: ['600'], subsets: ['latin']});
const NUIT = '#0D0A18', ROSE = '#FF4FA3', ORANGE = '#FFB547', BLANC = '#F6F2FF';
const DEGRADE = `linear-gradient(135deg, ${ROSE}, ${ORANGE})`;

/** Palmier dessiné (emblème maison, aucun logo officiel). */
const Palmier: React.FC<{taille: number; couleur?: string}> = ({taille, couleur = NUIT}) => (
  <svg width={taille} height={taille} viewBox="0 0 200 200">
    <path d="M104 196 C 100 150, 96 110, 102 70" stroke={couleur} strokeWidth={12} fill="none" strokeLinecap="round" />
    {[[-1, 0.2], [1, 0.1], [-1, -0.55], [1, -0.6], [0.15, -1]].map(([dx, dy], i) => (
      <path key={i} d={`M102 70 Q ${102 + dx * 45} ${70 + dy * 45 - 25}, ${102 + dx * 88} ${70 + dy * 70 + 18}`} stroke={couleur} strokeWidth={14} fill="none" strokeLinecap="round" />
    ))}
  </svg>
);

/** Photo de profil : disque dégradé néon, palmier et « DL » — lisible même à 48 px. */
export const DLProfil: React.FC = () => (
  <AbsoluteFill style={{background: NUIT, alignItems: 'center', justifyContent: 'center'}}>
    <div style={{width: 800, height: 800, borderRadius: '50%', background: DEGRADE, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden'}}>
      <Palmier taille={250} />
      <div style={{fontFamily: ANTON, fontSize: 330, color: NUIT, lineHeight: 0.9, letterSpacing: -6, marginTop: -10}}>DL</div>
    </div>
  </AbsoluteFill>
);

/** Bannière : plan officiel de Vice City assombri, titre et promesse dans la zone sûre (1546×423 au centre). */
export const DLBanniere: React.FC = () => (
  <AbsoluteFill style={{background: NUIT}}>
    <Img src={staticFile('gta01/banniere_fond.jpg')} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
    <AbsoluteFill style={{background: 'linear-gradient(90deg, rgba(13,10,24,0.92) 0%, rgba(13,10,24,0.55) 50%, rgba(13,10,24,0.92) 100%)'}} />
    <AbsoluteFill style={{background: 'linear-gradient(0deg, rgba(13,10,24,0.85), transparent 35%, transparent 65%, rgba(13,10,24,0.85))'}} />
    <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
      <div style={{width: 1546, height: 423, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 50}}>
        <div style={{width: 230, height: 230, borderRadius: '50%', background: DEGRADE, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          boxShadow: `0 0 60px ${ROSE}88`}}><Palmier taille={170} /></div>
        <div>
          <div style={{fontFamily: ANTON, fontSize: 150, lineHeight: 1, textTransform: 'uppercase', backgroundImage: `linear-gradient(95deg, ${ROSE}, ${ORANGE})`,
            WebkitBackgroundClip: 'text', color: 'transparent', filter: `drop-shadow(0 0 30px ${ROSE}66)`, whiteSpace: 'nowrap'}}>Dossier Leonida</div>
          <div style={{fontFamily: MONO, fontWeight: 600, fontSize: 40, letterSpacing: 6, color: BLANC, textTransform: 'uppercase', marginTop: 18}}>GTA 6 décortiqué en français</div>
          <div style={{fontFamily: MONO, fontWeight: 600, fontSize: 30, letterSpacing: 5, color: ORANGE, textTransform: 'uppercase', marginTop: 14}}>Le vrai du faux · sources à l'appui</div>
        </div>
      </div>
    </AbsoluteFill>
  </AbsoluteFill>
);

/* ---------- Miniatures de la vidéo 1 (1280×720) ---------- */
const JAUNE = '#FFD43B', ROUGE = '#FF3B4E';
const ombre = '0 6px 0 #000, 0 0 40px rgba(0,0,0,0.85)';

const FondMini: React.FC<{src: string; zoom?: number; fx?: string; clair?: number}> = ({src, zoom = 1.2, fx = '50% 50%', clair = 1.2}) => (
  <AbsoluteFill style={{overflow: 'hidden', background: NUIT}}>
    <Img src={staticFile(`gta01/${src}.jpg`)} style={{width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${zoom})`, transformOrigin: fx,
      filter: `brightness(${clair}) saturate(1.45) contrast(1.12)`}} />
    <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(13,10,24,0.7) 0%, rgba(13,10,24,0.1) 38%, transparent 60%)'}} />
    <AbsoluteFill style={{boxShadow: `inset 0 0 0 10px ${ROSE}`}} />
  </AbsoluteFill>
);

const Etoiles6: React.FC<{taille: number}> = ({taille}) => (
  <div style={{display: 'flex', gap: taille * 0.12}}>
    {Array.from({length: 6}, (_, i) => <div key={i} style={{fontSize: taille, lineHeight: 1, color: JAUNE, textShadow: ombre}}>★</div>)}
  </div>
);

/** Variante « TOUT » façon GrandGecko / Vico GTA : Terre de nuit, mot géant derrière le personnage, Lucia détourée au premier plan. */
const MiniTout: React.FC = () => (
  <AbsoluteFill style={{background: NUIT, overflow: 'hidden'}}>
    <Img src={staticFile('gta01/terre_nuit.jpg')} style={{width: '100%', height: '100%', objectFit: 'cover', filter: 'saturate(1.3) brightness(1.1)'}} />
    <div style={{position: 'absolute', top: -6, left: 0, right: 0, textAlign: 'center', fontFamily: ANTON, fontSize: 300, zIndex: 2, lineHeight: 1, letterSpacing: 6,
      backgroundImage: 'linear-gradient(180deg, #FFE38A 0%, #FFB547 30%, #FF4FA3 62%, #9B3DFF 100%)', WebkitBackgroundClip: 'text', color: 'transparent',
      WebkitTextStroke: '6px #2a0b4a', filter: 'drop-shadow(0 0 26px rgba(255,79,163,0.9)) drop-shadow(0 10px 0 #12062a)'}}>TOUT</div>
    <Img src={staticFile('gta01/logo_vi.png')} style={{position: 'absolute', top: 235, left: '50%', height: 540, transform: 'translateX(-50%)', zIndex: 1,
      filter: 'drop-shadow(0 0 30px rgba(255,79,163,0.7))'}} />
    <Img src={staticFile('gta01/lucia_detouree.png')} style={{position: 'absolute', bottom: -330, left: '50%', height: 960, transform: 'translateX(-50%)', zIndex: 3,
      filter: 'brightness(1.75) contrast(1.08) saturate(1.2) drop-shadow(0 0 3px #FF4FA3) drop-shadow(0 0 30px rgba(255,79,163,0.65))'}} />
  </AbsoluteFill>
);

/** Variante « 5 étoiles / 6 étoiles » façon GrandGecko : GTA 5 à gauche, GTA 6 à droite, Lucia masquée au centre. */
const ETOILE = {color: BLANC, WebkitTextStroke: '4px #111', paintOrder: 'stroke', textShadow: '0 5px 0 #000, 0 0 18px rgba(0,0,0,0.6)'} as const;
const MiniDuel: React.FC = () => (
  <AbsoluteFill style={{background: NUIT, overflow: 'hidden'}}>
    <div style={{position: 'absolute', left: 0, top: 0, width: 640, height: 720, overflow: 'hidden'}}>
      <Img src={staticFile('gta01/gta5_rue.jpg')} style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: '62% 50%', filter: 'saturate(1.15)'}} />
    </div>
    <div style={{position: 'absolute', left: 640, top: 0, width: 640, height: 720, overflow: 'hidden'}}>
      <Img src={staticFile('gta01/mini_b.jpg')} style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: '68% 50%', transform: 'scale(1.34)', filter: 'saturate(1.3) brightness(1.05)'}} />
    </div>
    <div style={{position: 'absolute', left: 30, top: 18, fontSize: 78, letterSpacing: 2, ...ETOILE}}>★★★★★</div>
    <div style={{position: 'absolute', right: 26, top: 18, fontSize: 70, letterSpacing: 0, ...ETOILE}}>★★★★★★</div>
    <Img src={staticFile('gta01/logo_v.png')} style={{position: 'absolute', left: 26, bottom: 20, height: 180,
      filter: 'drop-shadow(0 0 2px #000) drop-shadow(0 0 2px #000) drop-shadow(0 6px 0 #000)'}} />
    <Img src={staticFile('gta01/logo_vi.png')} style={{position: 'absolute', right: 26, bottom: 22, height: 170, filter: 'drop-shadow(0 6px 0 #000)'}} />
    <Img src={staticFile('gta01/lucia_bandana.png')} style={{position: 'absolute', bottom: -120, left: '50%', height: 860, transform: 'translateX(-46%)',
      WebkitMaskImage: 'linear-gradient(90deg, #000 82%, transparent 100%)',
      filter: 'brightness(1.15) contrast(1.08) saturate(1.2) drop-shadow(0 0 4px #B04DFF) drop-shadow(0 0 26px rgba(176,77,255,0.9))'}} />
  </AbsoluteFill>
);

export const MiniGTA01: React.FC<{v: 'a' | 'b' | 'c' | 'd' | 'e'}> = ({v}) => {
  if (v === 'd') return <MiniTout />;
  if (v === 'e') return <MiniDuel />;
  if (v === 'a') return <AbsoluteFill>
    <FondMini src="mini_a" zoom={1.28} fx="24% 18%" clair={1.25} />
    <AbsoluteFill style={{background: 'linear-gradient(0deg, rgba(13,10,24,0.8) 0%, transparent 42%)'}} />
    <div style={{position: 'absolute', bottom: 40, left: 0, right: 0, textAlign: 'center', fontFamily: ANTON, fontSize: 176, lineHeight: 1, color: BLANC, textShadow: ombre}}>
      OUBLIE <span style={{color: JAUNE, position: 'relative'}}>GTA 5<span style={{position: 'absolute', left: -10, right: -10, top: '52%', height: 22, background: ROUGE, transform: 'rotate(-6deg)', boxShadow: '0 4px 0 #000'}} /></span>
    </div>
  </AbsoluteFill>;
  if (v === 'b') return <AbsoluteFill>
    <FondMini src="mini_b" zoom={1.14} fx="55% 55%" clair={1.0} />
    <div style={{position: 'absolute', top: 30, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
      <Etoiles6 taille={120} />
      <div style={{fontFamily: ANTON, fontSize: 150, lineHeight: 1, color: BLANC, textShadow: ombre, marginTop: 6}}>ILS <span style={{color: JAUNE}}>T'OUBLIENT</span> PLUS</div>
    </div>
  </AbsoluteFill>;
  return <AbsoluteFill>
    <FondMini src="mini_c" zoom={1.5} fx="20% 55%" clair={1.25} />
    <AbsoluteFill style={{background: 'linear-gradient(270deg, rgba(13,10,24,0.75) 0%, transparent 55%)'}} />
    <div style={{position: 'absolute', top: 40, right: 56, textAlign: 'right', fontFamily: ANTON, fontSize: 168, lineHeight: 0.98, color: BLANC, textShadow: ombre}}>
      212 GO<br /><span style={{color: JAUNE}}>SANS<br />DISQUE</span>
    </div>
    <div style={{position: 'absolute', right: 505, top: 60, width: 170, height: 170, borderRadius: '50%', background: 'radial-gradient(circle, #ddd 0 18%, #9aa 19% 22%, #e9e9f2 23% 100%)',
      boxShadow: '0 8px 0 #000, 0 0 50px rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
      <div style={{fontFamily: ANTON, fontSize: 190, color: ROUGE, lineHeight: 1, textShadow: '0 6px 0 #000'}}>✕</div>
    </div>
  </AbsoluteFill>;
};

/* ---------- Vidéo 2 « le monde s'arrête » ---------- */
const MOT = {fontFamily: ANTON, lineHeight: 1.1, whiteSpace: 'nowrap' as const, letterSpacing: 4, textAlign: 'center' as const,
  backgroundImage: 'linear-gradient(180deg, #FFE38A 0%, #FFB547 30%, #FF4FA3 62%, #9B3DFF 100%)', WebkitBackgroundClip: 'text', color: 'transparent',
  WebkitTextStroke: '6px #2a0b4a', filter: 'drop-shadow(0 0 26px rgba(255,79,163,0.9)) drop-shadow(0 10px 0 #12062a)', paddingTop: 30};

/** f : LE MONDE S'ARRÊTE — Terre de nuit, mot géant, Lucia détourée devant, logo VI. */
const MiniMonde: React.FC = () => (
  <AbsoluteFill style={{background: NUIT, overflow: 'hidden'}}>
    <Img src={staticFile('gta01/terre_nuit.jpg')} style={{width: '100%', height: '100%', objectFit: 'cover', filter: 'saturate(1.3) brightness(1.1)'}} />
    <div style={{position: 'absolute', top: -50, left: 0, right: 0, zIndex: 2, ...MOT, fontSize: 190}}>LE MONDE<br />S'ARRÊTE</div>
    <Img src={staticFile('gta01/lucia_detouree.png')} style={{position: 'absolute', bottom: -560, left: '50%', height: 880, transform: 'translateX(-50%)', zIndex: 3,
      filter: 'brightness(1.75) contrast(1.08) saturate(1.2) drop-shadow(0 0 3px #FF4FA3) drop-shadow(0 0 30px rgba(255,79,163,0.65))'}} />
    <Img src={staticFile('gta01/logo_vi.png')} style={{position: 'absolute', right: 24, bottom: 20, height: 190, zIndex: 4, filter: 'drop-shadow(0 6px 0 #000)'}} />
    <div style={{position: 'absolute', left: 30, bottom: 30, zIndex: 4, fontFamily: ANTON, fontSize: 96, color: BLANC, textShadow: '0 6px 0 #000, 0 0 20px rgba(0,0,0,0.7)'}}>19.11</div>
  </AbsoluteFill>
);

/** g : FERMÉ — Vice City au coucher de soleil, panneau FERMÉ « pour GTA 6 », Lucia au bandana. */
const MiniFerme: React.FC = () => (
  <AbsoluteFill style={{background: NUIT, overflow: 'hidden'}}>
    <Img src={staticFile('gta01/mini_b.jpg')} style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: '60% 50%', transform: 'scale(1.34)', filter: 'saturate(1.3) brightness(1.05)'}} />
    <AbsoluteFill style={{background: 'linear-gradient(90deg, rgba(13,10,24,0.55) 0%, transparent 55%)'}} />
    <div style={{position: 'absolute', left: 60, top: 70, transform: 'rotate(-7deg)', background: BLANC, borderRadius: 22, padding: '26px 54px 22px', border: `12px solid ${ROUGE}`,
      boxShadow: '0 16px 0 #000, 0 0 60px rgba(0,0,0,0.6)', textAlign: 'center'}}>
      <div style={{fontFamily: ANTON, fontSize: 190, color: ROUGE, lineHeight: 1}}>FERMÉ</div>
      <div style={{fontFamily: ANTON, fontSize: 78, color: NUIT, lineHeight: 1.1}}>POUR GTA 6</div>
    </div>
    <div style={{position: 'absolute', left: 300, top: 0, width: 6, height: 80, background: '#222'}} />
    <Img src={staticFile('gta01/lucia_bandana.png')} style={{position: 'absolute', bottom: -120, right: -60, height: 860,
      filter: 'brightness(1.15) contrast(1.08) saturate(1.2) drop-shadow(0 0 4px #B04DFF) drop-shadow(0 0 26px rgba(176,77,255,0.9))'}} />
    <Img src={staticFile('gta01/logo_vi.png')} style={{position: 'absolute', left: 40, bottom: 26, height: 170, filter: 'drop-shadow(0 6px 0 #000)'}} />
  </AbsoluteFill>
);

/** h : ≈ 1 MILLIARD $ — avant même la sortie (estimation), Terre de nuit + logo VI. */
const MiniMilliard: React.FC = () => (
  <AbsoluteFill style={{background: NUIT, overflow: 'hidden'}}>
    <Img src={staticFile('gta01/terre_nuit.jpg')} style={{width: '100%', height: '100%', objectFit: 'cover', filter: 'saturate(1.3) brightness(1.1) hue-rotate(-12deg)'}} />
    <Img src={staticFile('gta01/logo_vi.png')} style={{position: 'absolute', top: 245, left: '50%', height: 330, transform: 'translateX(-50%)', zIndex: 1, filter: 'drop-shadow(0 0 30px rgba(255,79,163,0.7))'}} />
    <div style={{position: 'absolute', top: -20, left: 0, right: 0, zIndex: 2, ...MOT, fontSize: 196}}>≈ 1 MILLIARD $</div>
    <div style={{position: 'absolute', bottom: 34, left: 0, right: 0, zIndex: 3, textAlign: 'center', fontFamily: ANTON, fontSize: 104, color: BLANC,
      textShadow: '0 7px 0 #000, 0 0 24px rgba(0,0,0,0.8)'}}>AVANT LA SORTIE</div>
  </AbsoluteFill>
);

export const MiniGTA02: React.FC<{v: 'f' | 'g' | 'h'}> = ({v}) => v === 'g' ? <MiniFerme /> : v === 'h' ? <MiniMilliard /> : <MiniMonde />;
