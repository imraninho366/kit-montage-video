import {loadFont as chargerLilita} from '@remotion/google-fonts/LilitaOne';
import {loadFont as chargerMontserrat} from '@remotion/google-fonts/Montserrat';
import {ThreeCanvas} from '@remotion/three';
import {useEffect, useState} from 'react';
import {AbsoluteFill, continueRender, delayRender, useVideoConfig} from 'remotion';
import {Monde} from './Ile3D';

const lilita = chargerLilita('normal', {subsets: ['latin', 'latin-ext']});
const montserrat = chargerMontserrat('normal', {weights: ['900'], subsets: ['latin', 'latin-ext']});

/**
 * Bannière de la chaîne YouTube, 2560×1440.
 * YouTube n'affiche pas tout partout : la bande 2560×423 au centre sur ordinateur, et seulement
 * le rectangle central 1546×423 sur téléphone. Le titre et Robin tiennent donc dans ce rectangle (ZONE).
 */
export const ZONE = {x: 507, y: 508, w: 1546, h: 423};

const contour = (couleur: string, ep: number) => ({WebkitTextStroke: `${ep}px ${couleur}`, paintOrder: 'stroke fill' as const});

export const IleBanniere: React.FC<{reperes?: boolean}> = ({reperes = false}) => {
  const {width, height} = useVideoConfig();
  const [pret, setPret] = useState(false);
  const [poignee] = useState(() => delayRender('polices bannière'));
  useEffect(() => {
    Promise.all([lilita.waitUntilDone(), montserrat.waitUntilDone()]).then(() => { setPret(true); continueRender(poignee); });
  }, [poignee]);
  return (
    <AbsoluteFill style={{background: '#8fd6f6'}}>
      {pret && (
        <ThreeCanvas width={width} height={height} shadows camera={{fov: 26, near: 0.1, far: 300}} gl={{antialias: true}}>
          {/* caméra décalée : l'île tombe dans la moitié droite de la zone visible, le titre à gauche */}
          <Monde etat={{
            cam: {pos: [-6.6, 6.2, 35.5], cible: [-4.4, 1.25, 0.6], fov: 26},
            robin: {humeur: 'joyeux', bras: 'salue'},
            foule: 8,
            cabanes: [1, 1, 1, 1, 1, 1],
            cielDegage: true,
          }} />
        </ThreeCanvas>
      )}
      <div style={{position: 'absolute', left: ZONE.x + 30, top: ZONE.y, height: ZONE.h, width: 860,
        display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 14}}>
        <div style={{fontFamily: lilita.fontFamily, fontSize: 118, lineHeight: 0.95, color: '#ffc928',
          ...contour('#2b1a00', 22), textShadow: '0 10px 0 rgba(0,0,0,0.22)', whiteSpace: 'nowrap'}}>
          L'ÎLE DES ABONNÉS
        </div>
        <div style={{fontFamily: montserrat.fontFamily, fontWeight: 900, fontSize: 44, color: '#fff', ...contour('#1b1d24', 12), lineHeight: 1.15}}>
          Tu commentes. On construit.<br />Robin va-t-il survivre ?
        </div>
        <div style={{alignSelf: 'flex-start', marginTop: 6, background: '#fe2c55', color: '#fff', fontFamily: montserrat.fontFamily, fontWeight: 900,
          fontSize: 34, padding: '10px 28px', borderRadius: 40, border: '5px solid #fff', boxShadow: '0 8px 0 rgba(0,0,0,0.2)'}}>
          🏝️ UN ÉPISODE CHAQUE JOUR
        </div>
      </div>
      {reperes && (
        <>
          <div style={{position: 'absolute', left: 0, right: 0, top: ZONE.y, height: ZONE.h, outline: '6px dashed #ff00aa'}} />
          <div style={{position: 'absolute', left: ZONE.x, top: ZONE.y, width: ZONE.w, height: ZONE.h, outline: '6px solid #00ff66'}} />
        </>
      )}
    </AbsoluteFill>
  );
};
