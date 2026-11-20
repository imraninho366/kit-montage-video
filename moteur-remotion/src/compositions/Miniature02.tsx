import {AbsoluteFill, Img, staticFile} from 'remotion';
import {polices} from '../design/theme';

/**
 * Miniatures, 2e série. Règles : 3 mots max, un chiffre ou une question, lisible à 168 px de large,
 * un seul point d'attention. Texte composé ici, jamais généré par l'IA. Chiffres : ceux de la vidéo.
 */
const contour = (px: number, c = '#000') => `${px}px ${px}px 0 ${c}, -${px}px ${px}px 0 ${c}, ${px}px -${px}px 0 ${c}, -${px}px -${px}px 0 ${c}, 0 ${px * 2}px ${px * 3}px rgba(0,0,0,.6)`;

export const Miniature02: React.FC<{variante: 'a' | 'b' | 'c' | 'd'}> = ({variante}) => {
  if (variante === 'a') return (   // la paire coupée en deux : pièces brutes / monture finie
    <AbsoluteFill>
      <Img src={staticFile('glasses01/mini2_a_split.jpg')} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
      <div style={{position: 'absolute', left: 150, top: 20, fontFamily: polices.anton, fontSize: 200, color: '#fff', textShadow: contour(6)}}>$20</div>
      <div style={{position: 'absolute', left: 760, top: 20, fontFamily: polices.anton, fontSize: 200, color: '#FFD23F', textShadow: contour(6)}}>$???</div>
    </AbsoluteFill>
  );
  if (variante === 'b') return (   // les verres reflètent la tour du propriétaire
    <AbsoluteFill>
      <Img src={staticFile('glasses01/mini2_b_reflet.jpg')} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
      <div style={{position: 'absolute', left: 54, top: 150, fontFamily: polices.anton, fontSize: 158, lineHeight: 0.95, color: '#fff'}}>
        WHO<br />OWNS<br /><span style={{color: '#FFB020'}}>THEM?</span>
      </div>
    </AbsoluteFill>
  );
  if (variante === 'c') return (   // 19 cents : la pièce à côté de la paire
    <AbsoluteFill>
      <Img src={staticFile('glasses01/mini2_c_piece.jpg')} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
      <svg style={{position: 'absolute', left: 1000, top: 275}} width={210} height={210} viewBox="0 0 210 210">
        <ellipse cx={105} cy={105} rx={92} ry={88} fill="none" stroke="#E0201B" strokeWidth={12} strokeLinecap="round"
          strokeDasharray="520 60" transform="rotate(-30 105 105)" />
      </svg>
      <div style={{position: 'absolute', left: 60, top: 30, fontFamily: polices.anton, fontSize: 210, color: '#111', lineHeight: 1}}>$0.19</div>
      <div style={{position: 'absolute', left: 66, top: 250, fontFamily: polices.bloc, fontSize: 58, color: '#E0201B'}}>PROFIT?!</div>
    </AbsoluteFill>
  );
  return (   // la paire et son ticket de caisse, avec la ligne qui manque
    <AbsoluteFill>
      <Img src={staticFile('glasses01/mini2_d_ticket_long.jpg')} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
      <div style={{position: 'absolute', left: 395, top: 330, width: 330, transform: 'rotate(8deg) skewY(4deg)', fontFamily: polices.mono,
        fontWeight: 700, fontSize: 30, color: '#1b1d21', lineHeight: 1.6}}>
        <div style={{display: 'flex', justifyContent: 'space-between'}}><span>FRAME</span><span>11.90</span></div>
        <div style={{display: 'flex', justifyContent: 'space-between'}}><span>LENSES</span><span>8.50</span></div>
        <div style={{display: 'flex', justifyContent: 'space-between', color: '#E0201B'}}><span>???</span><span>???</span></div>
      </div>
      <div style={{position: 'absolute', left: 50, top: 40, fontFamily: polices.anton, fontSize: 118, color: '#111', lineHeight: 0.95}}>
        THE<br />RECEIPT</div>
    </AbsoluteFill>
  );
};
