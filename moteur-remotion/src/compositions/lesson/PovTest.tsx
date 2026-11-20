import React from 'react';
import {AbsoluteFill, Audio, Img, interpolate, Sequence, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import ancresBrutes from './ancres_pov.json';
import {Ancre, cl, CYAN, SANS} from './commun';

/**
 * Test 15 s « Inside 1 Second » (POV toon) : tu paies ton café avec ton téléphone → LE TEMPS SE FIGE → plongée dans le téléphone.
 * 3D toon EEVEE : learn-tiktok/proto_pov/scene_toon.py (450 images, gel du temps à l'image 104). Muet : textes + bruitages.
 */
const ANCRES = ancresBrutes as unknown as Record<string, Record<string, Ancre>>;
export const DUREE_POV_TEST = 450;
const GEL = 135;
const CLIENT = 9, SERVEUSE = 60;
const ease = (f: number, a: number, b: number) => interpolate(f, [a, b], [0, 1], {...cl, easing: (t) => 1 - Math.pow(1 - t, 3)});

const Legende: React.FC<{t: number; texte: React.ReactNode; top?: number; taille?: number}> = ({t, texte, top = 250, taille = 64}) => (
  t <= 0 ? null : (
    <div style={{position: 'absolute', top, left: 60, right: 60, textAlign: 'center', opacity: t, transform: `translateY(${(1 - t) * 20}px)`}}>
      <span style={{fontFamily: SANS, fontWeight: 900, fontSize: taille, lineHeight: 1.15, color: '#fff', WebkitTextStroke: '3px #000',
        paintOrder: 'stroke', textShadow: '0 6px 0 #000'}}>{texte}</span>
    </div>
  )
);

const Bulle: React.FC<{t: number; texte: string; bas?: boolean}> = ({t, texte, bas}) => (
  t <= 0 ? null : (
    <div style={{position: 'absolute', left: bas ? 140 : 120, top: bas ? 1180 : 420, opacity: t, transform: `scale(${.7 + .3 * t})`,
      transformOrigin: bas ? 'bottom left' : 'top left'}}>
      <div style={{background: '#fff', border: '6px solid #111', borderRadius: 46, padding: '22px 36px', fontFamily: SANS, fontWeight: 900,
        fontSize: 58, color: '#111', boxShadow: '0 8px 0 rgba(0,0,0,.35)'}}>{texte}</div>
    </div>
  )
);

export const PovTest: React.FC = () => {
  const f = useCurrentFrame();
  const {width, height} = useVideoConfig();
  const src = staticFile(`lesson_pov/3d/f${String(f).padStart(4, '0')}.jpg`);
  const gele = f >= GEL;
  const flash = interpolate(f, [GEL - 1, GEL + 1, GEL + 10], [0, 1, 0], cl);
  const froid = ease(f, GEL, GEL + 14);
  const choc = f >= GEL && f < GEL + 8 ? Math.sin((f - GEL) * 2.4) * 10 * (1 - (f - GEL) / 8) : 0;
  const puce = ANCRES[String(f)]?.chip;
  const tChip = ease(f, 386, 398);
  const secondes = Math.min(f, GEL) / 30;

  return (
    <AbsoluteFill style={{background: '#000'}}>
      <Audio src={staticFile('lesson_pov/sfx/ambiance.wav')} volume={(fr) => (fr < GEL ? .9 : 0)} />
      <Sequence from={CLIENT}><Audio src={staticFile('lesson_pov/client.wav')} volume={1} /></Sequence>
      <Sequence from={SERVEUSE}><Audio src={staticFile('lesson_pov/serveuse.wav')} volume={1} /></Sequence>
      <Sequence from={GEL - 1}><Audio src={staticFile('lesson_pov/sfx/gel.wav')} volume={.9} /></Sequence>
      <Sequence from={GEL + 6}><Audio src={staticFile('lesson_pov/sfx/drone.wav')} volume={.55} /></Sequence>
      {Array.from({length: 10}, (_, i) => <Sequence key={i} from={GEL + 20 + i * 30} durationInFrames={20}>
        <Audio src={staticFile('lesson_pov/sfx/tic.wav')} volume={.5} /></Sequence>)}
      <Sequence from={300} durationInFrames={30}><Audio src={staticFile('lesson_pov/sfx/whoosh.wav')} volume={.5} /></Sequence>
      <Sequence from={385} durationInFrames={30}><Audio src={staticFile('lesson_pov/sfx/pop.wav')} volume={.6} /></Sequence>

      <AbsoluteFill style={{transform: `translateX(${choc}px)`}}>
        <Img src={src} style={{width: '100%', height: '100%', objectFit: 'cover',
          filter: `saturate(${1 - .55 * froid}) hue-rotate(${-12 * froid}deg) contrast(${1 + .08 * froid})`}} />
      </AbsoluteFill>
      <AbsoluteFill style={{background: `radial-gradient(ellipse at center, rgba(60,120,255,${.06 * froid}) 40%, rgba(5,15,50,${.6 * froid}) 100%)`}} />
      <AbsoluteFill style={{background: '#fff', opacity: flash}} />
      {f >= GEL && f < GEL + 24 && (
        <svg width={width} height={height} style={{position: 'absolute'}}>
          <circle cx={width / 2} cy={height * .55} r={ease(f, GEL, GEL + 24) * 1400} fill="none" stroke="#fff" strokeWidth={14}
            opacity={1 - ease(f, GEL, GEL + 24)} />
        </svg>
      )}

      <div style={{position: 'absolute', top: 110, right: 60, fontFamily: 'Menlo, monospace', fontWeight: 700, fontSize: 52,
        color: '#fff', textShadow: '0 4px 0 #000', opacity: ease(f, 10, 20)}}>
        {gele ? '⏸ ' : '● '}{secondes.toFixed(2)}s</div>

      <Legende t={ease(f, 0, 6) * (1 - ease(f, GEL - 8, GEL))} texte={<>POV: you pay for your coffee</>} top={200} taille={54} />
      <Bulle t={ease(f, CLIENT, CLIENT + 5) * (1 - ease(f, CLIENT + 45, CLIENT + 50))} texte="Hey! I'll pay by card." bas />
      <Bulle t={ease(f, SERVEUSE, SERVEUSE + 5) * (1 - ease(f, SERVEUSE + 52, SERVEUSE + 58))} texte="Sure, just tap it here." />
      <Legende t={ease(f, GEL + 4, GEL + 12) * (1 - ease(f, 222, 230))} texte={<>TIME STOPS.</>} top={300} taille={110} />
      <Legende t={ease(f, 232, 240) * (1 - ease(f, 305, 312))} texte={<>In this 0.3 seconds,<br />your phone does something wild…</>} />
      <Legende t={ease(f, 316, 326)} texte={<>It never sends<br />your card number.</>} top={230} taille={72} />

      {puce && tChip > 0 && puce[2] > 0 && (
        <div style={{position: 'absolute', left: Math.min(Math.max(puce[0] * width - 260, 40), width - 560), top: puce[1] * height + 160,
          width: 520, textAlign: 'center', opacity: tChip, transform: `scale(${.85 + .15 * tChip})`}}>
          <div style={{display: 'inline-block', fontFamily: SANS, fontWeight: 900, fontSize: 46, color: '#05080F', background: CYAN,
            padding: '10px 24px', borderRadius: 16, boxShadow: '0 6px 0 rgba(0,0,0,.45)'}}>SECURE ELEMENT</div>
          <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 34, color: '#fff', marginTop: 10, textShadow: '0 3px 0 #000'}}>
            a vault chip inside your phone</div>
        </div>
      )}
    </AbsoluteFill>
  );
};
