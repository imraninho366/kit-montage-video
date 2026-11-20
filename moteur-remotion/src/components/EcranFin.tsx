import {AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {polices} from '../design/theme';

/**
 * Écran de fin (15–20 s) : le fond et les emplacements que YouTube remplira avec ses éléments de fin
 * (une vidéo à gauche, le bouton d'abonnement à droite). Positions = gabarit standard de YouTube Studio.
 */
export const EcranFin: React.FC<{logo?: string}> = ({logo}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const s = spring({frame, fps, config: {damping: 200}});
  const pulse = 1 + Math.sin(frame / 12) * 0.015;
  return (
    <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 40%, #1d2330 0%, #090b0f 75%)'}}>
      <div style={{position: 'absolute', top: 110, left: 0, right: 0, textAlign: 'center', opacity: s}}>
        <div style={{fontFamily: polices.bloc, fontSize: 96, color: '#F2F0EB', letterSpacing: 14}}>ITEMIZED</div>
        <div style={{fontFamily: polices.citation, fontSize: 52, color: '#D9A441', marginTop: 6}}>Every price has a receipt.</div>
      </div>
      {/* emplacement « vidéo suivante » (YouTube y posera la vignette) */}
      <div style={{position: 'absolute', left: 190, top: 430, width: 880, height: 495, border: '3px dashed rgba(242,240,235,.25)', borderRadius: 18,
        display: 'flex', alignItems: 'flex-end', padding: 26, opacity: interpolate(frame, [10, 30], [0, 1], {extrapolateRight: 'clamp'})}}>
        <span style={{fontFamily: polices.mono, fontSize: 30, color: 'rgba(242,240,235,.6)'}}>NEXT RECEIPT →</span>
      </div>
      {/* emplacement « s'abonner » (cercle de l'avatar) */}
      <div style={{position: 'absolute', left: 1330, top: 490, width: 380, height: 380, borderRadius: '50%', border: '4px solid #D9A441',
        transform: `scale(${pulse})`, opacity: interpolate(frame, [18, 38], [0, 1], {extrapolateRight: 'clamp'})}} />
      {/* logo de la chaîne dans le cercle, au-dessus de SUBSCRIBE (retour du 26/09) */}
      {logo ? (
        <Img src={staticFile(logo)} style={{position: 'absolute', left: 1340, top: 500, width: 360, height: 360, borderRadius: '50%',
          objectFit: 'cover', transform: `scale(${pulse})`, opacity: interpolate(frame, [18, 38], [0, 1], {extrapolateRight: 'clamp'})}} />
      ) : null}
      <div style={{position: 'absolute', left: 1330, width: 380, top: 900, textAlign: 'center', fontFamily: polices.bloc, fontSize: 40, color: '#F2F0EB',
        opacity: interpolate(frame, [26, 46], [0, 1], {extrapolateRight: 'clamp'})}}>SUBSCRIBE</div>
    </AbsoluteFill>
  );
};
