import timeline from '../videos/concerts02.json';
import {Montage} from './Montage';

export const DUREE_CONCERTS02 = timeline.duree;
export const Concerts02: React.FC = () => <Montage timeline={timeline} dossier="concerts02/" />;
