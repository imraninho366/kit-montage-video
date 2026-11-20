import timeline from '../videos/glasses01.json';
import shorts from '../videos/glasses01-shorts.json';
import {Short} from './Short';

export const SHORTS_GLASSES01 = shorts;
export const Glasses01Short: React.FC<{n: number}> = ({n}) => {
  const s = shorts[n - 1];
  return <Short titre={s.titre} segments={s.segments} mots={s.mots} corps={s.corps} timeline={timeline} dossier="glasses01/" />;
};
