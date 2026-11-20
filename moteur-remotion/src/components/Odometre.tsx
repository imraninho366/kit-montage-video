import {spring, useCurrentFrame, useVideoConfig} from 'remotion';

/**
 * Un nombre affiché comme un compteur mécanique : chaque chiffre est une colonne 0-9 qui défile
 * jusqu'à sa valeur, de droite à gauche, avec un léger décalage entre colonnes.
 */
export const Odometre: React.FC<{texte: string; style: React.CSSProperties; delai?: number}> = ({texte, style, delai = 0}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const caracteres = texte.split('');
  const nbChiffres = caracteres.filter((c) => /\d/.test(c)).length;
  let rang = 0;
  const H = 1.2;   // hauteur d'une case : plus grande que le glyphe, sinon les chiffres voisins débordent
  return (
    <div style={{...style, display: 'flex', lineHeight: `${H}em`}}>
      {caracteres.map((c, i) => {
        if (!/\d/.test(c)) return <span key={i}>{c === ' ' ? '\u00A0' : c}</span>;
        const ordre = nbChiffres - 1 - rang++;               // les unités arrivent en premier
        const s = spring({frame: frame - delai - ordre * 2, fps, config: {damping: 22, stiffness: 110}});
        const cible = Number(c) + (ordre === 0 ? 10 : 0);   // seules les unités font un tour complet
        const pos = s * cible;
        return (
          <span key={i} style={{display: 'inline-block', height: `${H}em`, overflow: 'hidden', position: 'relative',
            maskImage: 'linear-gradient(transparent 0%, #000 18%, #000 82%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(transparent 0%, #000 18%, #000 82%, transparent 100%)'}}>
            <span style={{visibility: 'hidden'}}>0</span>
            <span style={{position: 'absolute', left: 0, top: 0, display: 'flex', flexDirection: 'column',
              transform: `translateY(${-pos * H}em)`, filter: s < 0.9 ? `blur(${(1 - s) * 3}px)` : undefined}}>
              {Array.from({length: 20}, (_, k) => <span key={k} style={{height: `${H}em`, textAlign: 'center'}}>{k % 10}</span>)}
            </span>
          </span>
        );
      })}
    </div>
  );
};
