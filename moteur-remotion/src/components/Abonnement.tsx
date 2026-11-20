import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {polices} from '../design/theme';

/**
 * Appel à s'abonner, à la manière d'ITEMIZED : un ticket s'imprime (« 1 new receipt — every week », prix 0,00),
 * puis un bouton S'ABONNER se fait cliquer par un curseur et passe à « SUBSCRIBED ».
 */
export const Abonnement: React.FC<{lignesA: number[]; clic: number}> = ({lignesA, clic}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const lignes = [['New receipt', 'every week'], ['Price', '$0.00']];
  // le bouton est là dès le début : le clic (calé sur « subscribe ») ne doit jamais arriver avant lui
  const bouton = spring({frame: frame - 14, fps, config: {damping: 14}});
  const curseurX = interpolate(frame, [clic - 25, clic], [1560, 1180], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const curseurY = interpolate(frame, [clic - 25, clic], [1010, 790], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const appui = frame >= clic && frame < clic + 5;
  const abonne = frame >= clic + 3;
  return (
    <AbsoluteFill style={{backgroundColor: '#12151B', alignItems: 'center'}}>
      <div style={{marginTop: 90, width: 1000, backgroundColor: '#F4F1EA', padding: '50px 64px 40px', fontFamily: polices.mono, color: '#16181C',
        boxShadow: '0 30px 70px rgba(0,0,0,.55)', transform: `translateY(${interpolate(spring({frame, fps, config: {damping: 200}}), [0, 1], [-400, 0])}px)`}}>
        <div style={{textAlign: 'center', fontWeight: 700, fontSize: 54, letterSpacing: 12}}>ITEMIZED</div>
        <div style={{borderTop: '3px dashed #16181C', margin: '24px 0 8px'}} />
        {lignes.map(([a, b], i) => (
          <div key={a} style={{display: 'flex', justifyContent: 'space-between', fontSize: 46, height: 88, alignItems: 'center',
            opacity: frame >= (lignesA[i] ?? 0) ? 1 : 0}}><span>{a}</span><span>{b}</span></div>
        ))}
      </div>
      <div style={{position: 'absolute', top: 700, left: 960, transform: `translateX(-50%) scale(${bouton * (appui ? 0.94 : 1)})`,
        backgroundColor: abonne ? '#3a3f47' : '#CC1F1F', color: '#fff', fontFamily: polices.bloc, fontSize: 80, padding: '30px 84px',
        borderRadius: 14, display: 'flex', alignItems: 'center', gap: 22, boxShadow: '0 14px 40px rgba(0,0,0,.5)'}}>
        <span>{abonne ? 'SUBSCRIBED' : 'SUBSCRIBE'}</span>
        <svg width={72} height={72} viewBox="0 0 24 24"><path fill="#fff" d="M12 22a2.5 2.5 0 0 0 2.45-2h-4.9A2.5 2.5 0 0 0 12 22Zm7-6V11a7 7 0 0 0-5-6.7V3.5a2 2 0 1 0-4 0v.8A7 7 0 0 0 5 11v5l-2 2v1h18v-1Z" /></svg>
      </div>
      {frame >= clic - 25 ? (
        <svg style={{position: 'absolute', left: curseurX, top: curseurY}} width={70} height={70} viewBox="0 0 24 24">
          <path d="M4 2l14 8-6 1.8L9.5 18Z" fill="#fff" stroke="#111" strokeWidth={1.2} strokeLinejoin="round" />
        </svg>
      ) : null}
    </AbsoluteFill>
  );
};
