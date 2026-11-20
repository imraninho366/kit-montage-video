import {AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {polices} from '../design/theme';

export type EtapeDip = {titre: string; detail: string; a: number};

/**
 * Le « triple dip » décrit par la FTC : le même billet passe trois fois par la caisse.
 * Trois étapes en ligne ; à chacune, une pièce « fee » monte dans la caisse du haut, qui compte ×1, ×2, ×3.
 */
export const TripleDip: React.FC<{etapes: EtapeDip[]; caisse: string; titre?: string}> = ({etapes, caisse, titre}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const X = [360, 960, 1560], Y = 720, CY = 250;
  const faites = etapes.filter((e) => frame >= e.a + 24).length;
  const pouls = spring({frame: frame - (etapes[Math.max(0, faites - 1)]?.a ?? 0) - 24, fps, config: {damping: 8, stiffness: 220}});
  return (
    <AbsoluteFill style={{backgroundColor: 'var(--fond, #0B0714)'}}>
      {titre ? <div style={{position: 'absolute', left: 96, top: 60, fontFamily: polices.spacemono, fontSize: 26, letterSpacing: 6,
        color: 'var(--sourdine, #9A8CB8)'}}>{titre}</div> : null}
      {/* la caisse */}
      <div style={{position: 'absolute', left: 960, top: CY, transform: `translate(-50%, -50%) scale(${faites ? interpolate(pouls, [0, 1], [1.15, 1]) : 1})`,
        border: '4px solid var(--accent, #FF2E88)', borderRadius: 18, padding: '18px 44px', display: 'flex', alignItems: 'baseline', gap: 28,
        boxShadow: '0 0 40px color-mix(in srgb, var(--accent, #FF2E88) 45%, transparent)', backgroundColor: 'rgba(0,0,0,.35)'}}>
        <span style={{fontFamily: polices.affiche, fontSize: 80, color: 'var(--encre, #F4EEFF)', letterSpacing: 3}}>{caisse}</span>
        <span style={{fontFamily: polices.affiche, fontSize: 96, color: 'var(--accent, #FF2E88)'}}>{faites ? `×${faites}` : ''}</span>
      </div>
      {/* la ligne du billet */}
      <svg width={1920} height={1080} style={{position: 'absolute'}}>
        {etapes.slice(1).map((e, i) => {
          const p = interpolate(frame - e.a, [0, 16], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
          return <line key={i} x1={X[i] + 90} y1={Y} x2={X[i] + 90 + (X[i + 1] - X[i] - 180) * p} y2={Y}
            style={{stroke: 'var(--sourdine, #9A8CB8)', strokeWidth: 4, strokeDasharray: '14 10'}} />;
        })}
      </svg>
      {etapes.map((e, i) => {
        const s = spring({frame: frame - e.a, fps, config: {damping: 14, stiffness: 150}});
        const vol = interpolate(frame - e.a, [8, 28], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic)});
        const px = interpolate(vol, [0, 1], [X[i], 960]);
        const py = interpolate(vol, [0, 1], [Y - 120, CY + 40]) - Math.sin(vol * Math.PI) * 120;
        if (frame < e.a) return null;
        return (
          <div key={i}>
            <div style={{position: 'absolute', left: X[i], top: Y, transform: `translate(-50%, -50%) scale(${s})`, width: 170, height: 170, borderRadius: 85,
              border: '4px solid var(--encre, #F4EEFF)', display: 'flex', justifyContent: 'center', alignItems: 'center',
              fontFamily: polices.affiche, fontSize: 110, color: 'var(--encre, #F4EEFF)'}}>{i + 1}</div>
            <div style={{position: 'absolute', left: X[i], top: Y + 120, transform: 'translateX(-50%)', width: 520, textAlign: 'center', opacity: s}}>
              <div style={{fontFamily: polices.grotesk, fontWeight: 700, fontSize: 38, color: 'var(--encre, #F4EEFF)'}}>{e.titre}</div>
              <div style={{fontFamily: polices.spacemono, fontSize: 26, color: 'var(--accent, #FF2E88)', marginTop: 8}}>{e.detail}</div>
            </div>
            {vol < 1 ? (
              <div style={{position: 'absolute', left: px, top: py, transform: 'translate(-50%, -50%)', width: 86, height: 86, borderRadius: 43,
                backgroundColor: 'var(--accent, #FF2E88)', display: 'flex', justifyContent: 'center', alignItems: 'center', fontFamily: polices.spacemono,
                fontWeight: 700, fontSize: 22, color: '#FFF', boxShadow: '0 0 24px var(--accent, #FF2E88)', opacity: interpolate(vol, [0, 0.1, 0.9, 1], [0, 1, 1, 0])}}>fee</div>
            ) : null}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
