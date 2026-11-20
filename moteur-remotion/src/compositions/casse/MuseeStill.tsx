import {ThreeCanvas} from '@remotion/three';
import {AbsoluteFill, useVideoConfig} from 'remotion';
import {EtatLocal, Local} from './Local3D';
import {EtatMusee, Musee} from './Musee3D';

/** Angles de validation du décor (images fixes, avant toute voix). */
export const ANGLES: Record<string, EtatMusee> = {
  // POV du voleur à l'entrée : l'allée, les lasers, la vitrine au fond
  pov: {cam: {pos: [0, 1.6, 4], cible: [0, 1.35, -4], fov: 62}},
  // face à la vitrine : le collier sous son spot
  vitrine: {cam: {pos: [0.15, 1.72, -2.7], cible: [0, 1.5, -4], fov: 30}, lasers: 0},
  // plongée sur toute la galerie, alarme déclenchée
  alarme: {cam: {pos: [3, 4.4, 4.5], cible: [-0.4, 0.8, -5], fov: 58}, alarme: 1},
  // photo de profil (carrée, recadrée en rond par TikTok) : le collier seul sous son spot, cloche levée
  // épisode 2 : le plan fixe de comptage des coupures (lasers numérotés)
  compte: {cam: {pos: [0, 1.5, 2.6], cible: [0, 1.05, -1.3], fov: 50}, numeros: 1},
  profil: {cam: {pos: [0, 1.5, -3.0], cible: [0, 1.45, -4], fov: 26}, vitrine: 1, lasers: 0},
};

/** Angles du local technique (épisode 1). */
export const ANGLES_LOCAL: Record<string, EtatLocal> = {
  // plan large : la porte, le digicode, l'affiche au mur de gauche, la plaque
  local: {cam: {pos: [0.75, 1.65, 1.5], cible: [-0.35, 1.6, -1.4], fov: 80}},
  // gros plan : la feuille des essais du gardien et le digicode
  digicode: {cam: {pos: [-0.38, 1.53, -0.98], cible: [-0.4, 1.53, -1.6], fov: 44}},
  // l'affiche en pause : l'année doit se lire sans être évidente
  affiche: {cam: {pos: [-0.6, 1.55, -0.9], cible: [-1.6, 1.5, -0.95], fov: 50}},
};

/** Photo de profil : deux faisceaux laser qui encadrent le saphir sans le toucher (le signe « casse » lisible en petit). */
const LasersProfil: React.FC = () => (
  <svg style={{position: 'absolute', inset: 0}} width="1080" height="1080" viewBox="0 0 1080 1080">
    <defs><filter id="lueur" x="-10%" y="-50%" width="120%" height="200%"><feGaussianBlur stdDeviation="9" /></filter></defs>
    {[[0, 175, 1080, 300], [0, 1000, 1080, 830]].map(([x1, y1, x2, y2], i) => (
      <g key={i}>
        <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#ff1a2a" strokeWidth="26" opacity="0.55" filter="url(#lueur)" />
        <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#ff5a64" strokeWidth="7" />
        <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#ffd6d9" strokeWidth="2" />
      </g>
    ))}
  </svg>
);

export const MuseeStill: React.FC<{angle: string}> = ({angle}) => {
  const {width, height} = useVideoConfig();
  const local = ANGLES_LOCAL[angle];
  return (
    <AbsoluteFill style={{background: '#070a14'}}>
      <ThreeCanvas width={width} height={height} shadows camera={{fov: 55, near: 0.02, far: 200}} gl={{antialias: true}}>
        {local ? <Local etat={local} /> : <Musee etat={ANGLES[angle]} />}
      </ThreeCanvas>
      {angle === 'profil' && <LasersProfil />}
    </AbsoluteFill>
  );
};
