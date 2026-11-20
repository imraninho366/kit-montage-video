import timeline from '../videos/lunettes.json';
import {Montage} from './Montage';

export const DUREE_LUNETTES = timeline.duree;
export const Lunettes: React.FC = () => <Montage timeline={timeline} dossier="lunettes/" />;
