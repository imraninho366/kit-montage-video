import timeline from '../videos/concerts02.json';
import shorts from '../videos/concerts02-shorts.json';
import {Short} from './Short';

export const SHORTS_CONCERTS02 = shorts;
// habillage de la vidéo 2 : nuit violette, Bebas Neue, karaoké magenta
const HABILLAGE = {fond: 'radial-gradient(ellipse at 50% 42%, #2A0D3A 0%, #07040C 80%)', police: 'affiche' as const, encre: '#F4EEFF',
  accent: '#FF2E88', policeFin: 'affiche' as const, uni: '#0B0714'};
export const Concerts02Short: React.FC<{n: number}> = ({n}) => {
  const s = shorts[n - 1];
  return <Short titre={s.titre} segments={s.segments} mots={s.mots} corps={s.corps} timeline={timeline} dossier="concerts02/" habillage={HABILLAGE} />;
};
