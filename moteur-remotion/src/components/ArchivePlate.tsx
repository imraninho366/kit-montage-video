import {AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';

export type Mouvement = 'avant' | 'arriere' | 'gauche' | 'droite';

/**
 * Image plein cadre, mouvement lent. Le mouvement est porté par le calque qui contient l'image ET
 * ses surimpressions (`children`, positionnées en % de l'image) : un texte posé sur un panneau
 * publicitaire suit donc exactement le panneau.
 */
export const ArchivePlate: React.FC<{
  src: string; mouvement?: Mouvement; ampleur?: number; foyer?: [number, number];
  assombrir?: number; flou?: number; children?: React.ReactNode;
}> = ({src, mouvement = 'avant', ampleur = 0.1, foyer = [50, 50], assombrir = 0, flou = 0, children}) => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();
  const p = interpolate(frame, [0, durationInFrames], [0, 1], {extrapolateRight: 'clamp'});
  const base = 1.04;
  const echelle = mouvement === 'avant' ? base + p * ampleur : mouvement === 'arriere' ? base + ampleur - p * ampleur : base + ampleur / 2;
  const x = mouvement === 'gauche' ? 30 - p * 60 : mouvement === 'droite' ? -30 + p * 60 : 0;
  // rotation 3D lente : l'image se comporte comme un plan filmé, pas comme une photo glissée
  const ry = mouvement === 'gauche' ? 1.6 - p * 3.2 : mouvement === 'droite' ? -1.6 + p * 3.2 : 0;
  const rx = mouvement === 'avant' ? 1.2 - p * 1.2 : mouvement === 'arriere' ? -1.2 + p * 1.2 : 0;
  return (
    <AbsoluteFill style={{overflow: 'hidden', backgroundColor: '#000', perspective: 1400}}>
      <AbsoluteFill style={{transform: `rotateY(${ry}deg) rotateX(${rx}deg) scale(${echelle}) translateX(${x}px)`, transformOrigin: `${foyer[0]}% ${foyer[1]}%`}}>
        <Img src={staticFile(src)} style={{width: '100%', height: '100%', objectFit: 'cover', filter: flou ? `blur(${flou}px)` : undefined}} />
        {children}
      </AbsoluteFill>
      {assombrir ? <AbsoluteFill style={{backgroundColor: `rgba(8,10,14,${assombrir})`}} /> : null}
    </AbsoluteFill>
  );
};
