import {AbsoluteFill, interpolate, Sequence, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {polices} from '../design/theme';
import {Montage, Timeline} from './Montage';

type Mot = {m: string; t: number; f: number};
type Segment = {debut: number; fin: number; a: number};
export type ShortProps = {titre: string[]; segments: Segment[]; mots: Mot[]; corps: number};
/** Habillage propre à chaque vidéo (règle anti-template) : fond, police du titre, couleurs. Défaut = vidéo 1. */
export type Habillage = {fond: string; police: keyof typeof polices; encre: string; accent: string; policeFin: keyof typeof polices; uni: string};
const DEFAUT: Habillage = {fond: 'radial-gradient(ellipse at 50% 45%, #1b212b 0%, #07090c 80%)', police: 'anton', encre: '#F2F0EB', accent: '#FFD23F',
  policeFin: 'bloc', uni: '#0E1116'};

/** Sous-titres karaoké : groupes de 3 mots, le mot dit s'allume en ambre. */
const Karaoke: React.FC<{mots: Mot[]; h: Habillage}> = ({mots, h}) => {
  const frame = useCurrentFrame();
  const groupes: Mot[][] = [];
  mots.forEach((m, i) => {
    const g = groupes[groupes.length - 1];
    const coupe = !g || g.length >= 3 || /[.?!,]$/.test(g[g.length - 1].m) || m.t - g[g.length - 1].f > 12;
    if (coupe) groupes.push([m]); else g.push(m);
    void i;
  });
  const g = groupes.find((x, i) => frame >= x[0].t - 2 && frame < (groupes[i + 1]?.[0].t ?? x[x.length - 1].f + 20) - 2);
  if (!g) return null;
  const debut = frame - g[0].t;
  return (
    <div style={{position: 'absolute', left: 60, right: 60, top: 1290, textAlign: 'center', fontFamily: polices[h.police], fontSize: 104,
      lineHeight: 1.1, textTransform: 'uppercase', transform: `scale(${interpolate(debut, [-2, 4], [0.9, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})})`}}>
      {g.map((m, i) => {
        const dit = frame >= m.t - 1;
        return <span key={i} style={{color: dit ? h.accent : h.encre, margin: '0 14px', display: 'inline-block',
          textShadow: '0 6px 0 rgba(0,0,0,.9), 0 0 30px rgba(0,0,0,.8)', WebkitTextStroke: '3px #000'}}>{m.m.replace(/[,.;:]$/, '')}</span>;
      })}
    </div>
  );
};

export const Short: React.FC<ShortProps & {timeline: Timeline; dossier: string; habillage?: Partial<Habillage>}> = ({titre, segments, mots, corps, timeline, dossier, habillage}) => {
  const h = {...DEFAUT, ...habillage};
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  const s = spring({frame, fps, config: {damping: 14}});
  const fin = frame >= corps;
  return (
    <AbsoluteFill style={{background: h.fond}}>
      {segments.map((sg, i) => (
        <Sequence key={i} from={sg.a} durationInFrames={sg.fin - sg.debut} name={`passage ${i + 1}`}>
          {/* le montage long, décalé pour que son image « debut » tombe au début du passage */}
          <div style={{position: 'absolute', left: 0, top: 640, width: 1920, height: 1080, transform: 'scale(0.5625)', transformOrigin: '0 0',
            overflow: 'hidden', borderRadius: 18}}>
            <Sequence from={-sg.debut}><Montage timeline={timeline} dossier={dossier} /></Sequence>
          </div>
        </Sequence>
      ))}
      <div style={{position: 'absolute', left: 0, right: 0, top: 250, textAlign: 'center', transform: `scale(${s})`}}>
        {titre.map((l, i) => (
          <div key={l} style={{fontFamily: polices[h.police], fontSize: i === 0 ? 120 : 92, lineHeight: 1.05, color: i === 0 ? h.encre : h.accent,
            textShadow: '0 8px 0 rgba(0,0,0,.6)'}}>{l}</div>
        ))}
      </div>
      {!fin ? <Karaoke mots={mots} h={h} /> : null}
      <div style={{position: 'absolute', left: 0, right: 0, bottom: 170, textAlign: 'center', fontFamily: polices.mono, fontSize: 34,
        color: 'rgba(242,240,235,.7)', letterSpacing: 3}}>ITEMIZED · @abonne_01</div>
      {fin ? (
        <AbsoluteFill style={{backgroundColor: h.uni, justifyContent: 'center', alignItems: 'center',
          opacity: interpolate(frame, [corps, corps + 6], [0, 1], {extrapolateRight: 'clamp'})}}>
          <div style={{fontFamily: polices[h.policeFin], fontSize: 88, color: h.encre, letterSpacing: 10}}>ITEMIZED</div>
          <div style={{fontFamily: polices.citation, fontSize: 64, color: h.accent, marginTop: 20}}>Full receipt on the channel ↗</div>
        </AbsoluteFill>
      ) : null}
      {void durationInFrames}
    </AbsoluteFill>
  );
};
