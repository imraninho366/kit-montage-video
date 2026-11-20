import timeline from '../videos/glasses01.json';
import {Montage} from './Montage';

export const DUREE_GLASSES01 = timeline.duree;
export const Glasses01: React.FC = () => <Montage timeline={timeline} dossier="glasses01/" />;
