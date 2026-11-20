import {AbsoluteFill, interpolate, random, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {polices} from '../design/theme';
import {Odometre} from './Odometre';

export type EtapeFile = {texte: string; legende: string; a: number; couleur?: string};

/**
 * La file d'attente, en abstrait (aucune fausse interface) : des points-fans convergent vers une
 * porte étroite ; à `bots`, une nuée de carrés rouges déferle et bouche le passage ; à `gel`, tout se fige.
 * Les compteurs à gauche portent les chiffres dits par la voix.
 */
export const FileAttente: React.FC<{etapes: EtapeFile[]; bots?: number; gel?: number}> = ({etapes, bots = 1e9, gel = 1e9}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const PX = 1560, PY = 560;
  const N = 170, B = 230;
  const fige = frame >= gel;
  const f = fige ? gel + (frame - gel) * 0.04 : frame;   // le temps ralentit presque à l'arrêt quand le site gèle
  const tremble = fige ? Math.sin(frame * 1.7) * 3 : 0;
  const alerte = frame >= bots ? interpolate(frame - bots, [0, 30], [0, 1], {extrapolateRight: 'clamp'}) : 0;
  const points: React.ReactNode[] = [];
  for (let i = 0; i < N + B; i++) {
    const bot = i >= N;
    const depart = bot ? bots + random(`bd${i}`) * 70 : random(`d${i}`) * 170 - 40;
    const t = f - depart;
    if (t < 0) continue;
    const vitesse = bot ? 26 + random(`bv${i}`) * 14 : 7 + random(`v${i}`) * 5;
    const y0 = 180 + random(`y${i}`) * 760;
    const bout = PX - 40 - random(`p${i}`) * (bot ? 520 : 760);   // où il s'arrête dans la cohue
    const x = Math.min(-40 + t * vitesse, bout);
    const p = Math.max(0, Math.min(1, x / PX));
    const y = PY + (y0 - PY) * (1 - Math.pow(p, 1.6)) * (bot ? 0.9 : 0.8) + (random(`j${i}`) - 0.5) * 40 * p;
    const taille = bot ? 12 : 14;
    points.push(
      <div key={i} style={{position: 'absolute', left: x + tremble, top: y, width: taille, height: taille, borderRadius: bot ? 2 : 7,
        backgroundColor: bot ? '#FF3B3B' : '#21D4FD', boxShadow: bot ? '0 0 10px #FF3B3B' : '0 0 8px #21D4FD', opacity: bot ? 0.9 : 0.85}} />,
    );
  }
  return (
    <AbsoluteFill style={{backgroundColor: 'var(--fond, #0B0714)', overflow: 'hidden'}}>
      <AbsoluteFill style={{background: `radial-gradient(ellipse 40% 60% at 82% 52%, rgba(255,59,59,${0.28 * alerte}) 0%, transparent 70%)`}} />
      {points}
      {/* la porte : deux murs et un passage étroit */}
      <div style={{position: 'absolute', left: PX, top: 0, width: 26, height: PY - 34, backgroundColor: 'var(--encre, #F4EEFF)', opacity: 0.9}} />
      <div style={{position: 'absolute', left: PX, top: PY + 34, width: 26, bottom: 0, backgroundColor: 'var(--encre, #F4EEFF)', opacity: 0.9}} />
      <div style={{position: 'absolute', left: PX - 6, top: PY - 34, width: 38, height: 68, border: `4px solid ${alerte > 0.5 ? '#FF3B3B' : '#21D4FD'}`,
        boxShadow: `0 0 30px ${alerte > 0.5 ? '#FF3B3B' : '#21D4FD'}`, opacity: fige ? (Math.floor(frame / 6) % 2 ? 1 : 0.2) : 1}} />
      <div style={{position: 'absolute', left: 96, top: 110, display: 'flex', flexDirection: 'column', gap: 34}}>
        {etapes.map((e, i) => {
          const s = spring({frame: frame - e.a, fps, config: {damping: 200}});
          if (frame < e.a) return null;
          return (
            <div key={i} style={{opacity: s, transform: `translateX(${interpolate(s, [0, 1], [-40, 0])}px)`, textShadow: '0 4px 24px rgba(0,0,0,.9)'}}>
              <Odometre texte={e.texte} style={{fontFamily: polices.affiche, fontSize: 124, color: e.couleur ?? 'var(--encre, #F4EEFF)'}} />
              <div style={{fontFamily: polices.grotesk, fontWeight: 700, fontSize: 30, color: 'var(--encre, #F4EEFF)', opacity: 0.85, marginTop: -6}}>{e.legende}</div>
            </div>
          );
        })}
      </div>
      <div style={{position: 'absolute', right: 96, bottom: 70, display: 'flex', gap: 30, fontFamily: polices.spacemono, fontSize: 22, color: 'var(--encre, #F4EEFF)', opacity: 0.8}}>
        <span><span style={{color: '#21D4FD'}}>●</span> fans</span>
        {frame >= bots ? <span><span style={{color: '#FF3B3B'}}>■</span> bots</span> : null}
      </div>
    </AbsoluteFill>
  );
};
