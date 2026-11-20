import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';

const POLICE = 'Helvetica Neue, Arial, sans-serif';

// Consigne en fondu : aucun changement brutal de luminosité.
const Consigne: React.FC<{lignes: string[]; couleur: string; fin: number}> = ({lignes, couleur, fin}) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 12, fin - 20, fin], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill style={{justifyContent: 'flex-start', paddingTop: 300, alignItems: 'center', opacity}}>
      {lignes.map((l) => (
        <div key={l} style={{fontFamily: POLICE, fontWeight: 800, fontSize: 60, lineHeight: 1.3, color: couleur, textAlign: 'center', width: 860}}>{l}</div>
      ))}
    </AbsoluteFill>
  );
};

const Croix: React.FC<{x: number; y: number; taille: number; couleur: string}> = ({x, y, taille, couleur}) => (
  <>
    <div style={{position: 'absolute', left: x - taille / 2, top: y - 5, width: taille, height: 10, background: couleur}} />
    <div style={{position: 'absolute', left: x - 5, top: y - taille / 2, width: 10, height: taille, background: couleur}} />
  </>
);

// Tache aveugle : 860 px d'écart, soit environ 5,6 cm sur un écran de 7 cm de large,
// donc disparition attendue vers 20 cm de distance (tache aveugle à environ 15°).
export const IllusionTache: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [150, 170], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill style={{background: '#F4EFE6'}}>
      <Consigne couleur="#1B1B1B" fin={165} lignes={['Ferme ton œil gauche.', 'Fixe la croix à gauche.', 'Approche lentement le téléphone.', 'Ne regarde pas le point.']} />
      <AbsoluteFill style={{opacity}}>
        <Croix x={110} y={760} taille={80} couleur="#1B1B1B" />
        <div style={{position: 'absolute', left: 970 - 45, top: 760 - 45, width: 90, height: 90, borderRadius: '50%', background: '#D7263D'}} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const TACHES = [
  {x: 200, y: 420, c: '#F2A7A0'},
  {x: 880, y: 420, c: '#9CC9E8'},
  {x: 110, y: 860, c: '#A9DDB0'},
  {x: 970, y: 860, c: '#F1D88F'},
  {x: 200, y: 1300, c: '#C7B3E5'},
  {x: 880, y: 1300, c: '#F4B98C'},
];

// Effet Troxler : image immobile, bords très flous, contraste faible, aucun clignotement.
export const IllusionCouleurs: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [150, 170], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill style={{background: '#BDBDBD'}}>
      <Consigne couleur="#1B1B1B" fin={165} lignes={['Fixe la croix au centre.', 'Ne bouge plus les yeux.', 'Attends, et regarde ce qui change autour.']} />
      <AbsoluteFill style={{opacity}}>
        {TACHES.map((t) => (
          <div key={t.c} style={{position: 'absolute', left: t.x - 170, top: t.y - 170, width: 340, height: 340, borderRadius: '50%', background: t.c, filter: 'blur(70px)'}} />
        ))}
        <Croix x={540} y={860} taille={44} couleur="#1B1B1B" />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
