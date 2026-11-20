import {AbsoluteFill, Img, staticFile} from 'remotion';
import {theme} from '../design/theme';

/** Miniatures de la vidéo 1 : fond FLUX sans texte, texte composé ici (jamais généré par l'IA). */
export const Miniature01: React.FC<{variante: 'a' | 'b' | 'c'}> = ({variante}) => {
  const ombre = '0 6px 0 rgba(0,0,0,.25)';
  if (variante === 'a') return (
    <AbsoluteFill>
      <Img src={staticFile('glasses01/mini_a_ticket.jpg')} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
      <div style={{position: 'absolute', left: 60, top: 150, fontFamily: theme.type.titre, color: '#111', lineHeight: 0.9}}>
        <div style={{fontSize: 260}}>$20</div>
        <div style={{fontSize: 118}}>OF PARTS</div>
      </div>
    </AbsoluteFill>
  );
  if (variante === 'b') return (
    <AbsoluteFill>
      <Img src={staticFile('glasses01/mini_b_eclate.jpg')} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
      {/* prix écrits sur les étiquettes vierges de l'image */}
      <div style={{position: 'absolute', left: 116, top: 380, transform: 'rotate(-62deg)', fontFamily: theme.type.titre, fontSize: 40, color: '#111'}}>$11.90</div>
      <div style={{position: 'absolute', left: 1085, top: 305, transform: 'rotate(58deg)', fontFamily: theme.type.titre, fontSize: 40, color: '#111'}}>$8.50</div>
      <div style={{position: 'absolute', left: 0, right: 0, bottom: 36, textAlign: 'center', fontFamily: theme.type.titre, fontSize: 150,
        color: '#fff', textShadow: ombre, letterSpacing: 2}}>WHO PROFITS?</div>
    </AbsoluteFill>
  );
  return (
    <AbsoluteFill>
      <Img src={staticFile('glasses01/mini_c_spot.jpg')} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
      <div style={{position: 'absolute', left: 918, top: 418, transform: 'rotate(8deg)', fontFamily: theme.type.titre, fontSize: 44, color: '#111'}}>$20</div>
      <div style={{position: 'absolute', left: 60, top: 60, fontFamily: theme.type.titre, fontSize: 150, color: '#fff', lineHeight: 0.92}}>
        WHO<br />OWNS<br /><span style={{color: '#E0685C'}}>THIS?</span>
      </div>
    </AbsoluteFill>
  );
};
