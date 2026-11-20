import React from 'react';
import {AbsoluteFill, Audio, Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import ancresBrutes from './ancres_phone.json';
import voixBrute from './voix_phone.json';
import {Ancre, Chiffre, cl, CYAN, Entete, Etiquette, Fin, FPS, imageBf, JAUNE, Liste, ORANGE, phraseA, ROUGE, SANS, SousTitre, surPhrase,
  Tampon, Voix, VERT} from './commun';

/**
 * « Tech Unseen · Lesson 02 — Is your phone secretly listening? » (TikTok 9:16, ~71 s, voix Liam).
 * 3D Cycles (learn-tiktok/proto_phone/scene_phone.py, 241 images). Faits : étude Northeastern 2018 (17 000+ applis Android),
 * plainte FTC contre Cox Media Group « Active Listening », indicateurs micro iOS / Android.
 */
const voix = voixBrute as unknown as Voix;
const ANCRES = ancresBrutes as unknown as Record<string, Record<string, Ancre>>;
const N3D = 240;
const FIN_VOIX = Math.ceil((voix.duree + .25) * FPS);
export const DUREE_PHONE_LESSON = FIN_VOIX + 30;
const SEG: [number, number][] = [
  [0, 40], [40, 92], [92, 108], [108, 122], [112, 150], [150, 155], [155, 165], [165, 170], [205, 225],
  [60, 92], [92, 108], [150, 160], [160, 185], [185, 200], [212, 240], [240, 240], [240, 240],
];
const ancre = (bf: number, nom: string): Ancre | null => ANCRES[String(Math.min(Math.max(bf, 0), N3D))]?.[nom] ?? null;

export const PhoneLesson: React.FC = () => {
  const f = useCurrentFrame();
  const k = phraseA(voix, f);
  const bf = imageBf(voix, SEG, f);
  const debut = (i: number) => Math.round(voix.debuts[i] * FPS);
  const src = staticFile(`lesson_phone/3d/f${String(bf).padStart(4, '0')}.jpg`);
  const finDebut = debut(15);
  const actif = k <= 4 ? 0 : k <= 10 ? 1 : 2;
  const preuve = k >= 5 && k <= 10;

  return (
    <AbsoluteFill style={{backgroundColor: '#05080F'}}>
      <Audio src={staticFile('lesson_phone/voix_phone.wav')} />
      <AbsoluteFill style={{transform: `scale(${1 + .03 * Math.sin(f / 90)})`}}>
        <Img src={src} style={{width: '100%', height: '100%', objectFit: 'cover',
          filter: preuve ? 'blur(6px) brightness(.6)' : 'none'}} />
      </AbsoluteFill>

      {/* accroche : « sneakers… » → pub */}
      {surPhrase(voix, f, 0) > 0 && (
        <div style={{position: 'absolute', top: 420, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 40, opacity: surPhrase(voix, f, 0)}}>
          <div style={{background: '#fff', borderRadius: 40, padding: '20px 34px', fontFamily: SANS, fontWeight: 900, fontSize: 52, color: '#05080F'}}>💬 “sneakers…”</div>
          <div style={{opacity: interpolate(f, [40, 50], [0, 1], cl), transform: `scale(${interpolate(f, [40, 50], [.6, 1], cl)})`,
            background: JAUNE, borderRadius: 24, padding: '20px 30px', fontFamily: SANS, fontWeight: 900, fontSize: 52, color: '#05080F'}}>👟 AD</div>
        </div>
      )}

      <Entete lecon="TECH UNSEEN · LESSON 02" noms={['The mic', 'The proof', 'The real spy']} actif={actif}
        vis={interpolate(f, [debut(1), debut(1) + 15], [0, 1], cl) * (1 - interpolate(f, [finDebut, finDebut + 10], [0, 1], cl))} fini={false} />

      <Etiquette pt={ancre(bf, 'mic')} t={surPhrase(voix, f, 2)} texte="MICROPHONE" sous="always powered" couleur={CYAN} dx={60} dy={-300} />
      <Etiquette pt={ancre(bf, 'chip')} t={surPhrase(voix, f, 3)} texte="LOW-POWER CHIP" sous="waits for one phrase" couleur={JAUNE} dx={-40} dy={-320} />
      <Etiquette pt={ancre(bf, 'chip')} t={surPhrase(voix, f, 4)} texte="SOUND DISCARDED" sous="never leaves the phone" couleur={ROUGE} dx={-40} dy={-320} />

      <Chiffre t={surPhrase(voix, f, 5)} gros="Did anyone check?" bas="" couleur={JAUNE} />
      <Chiffre t={surPhrase(voix, f, 6)} haut="NORTHEASTERN UNIVERSITY · 2018" gros="17,000+" bas="Android apps tested" couleur={CYAN} />
      <Tampon t={surPhrase(voix, f, 7)} texte="NO SECRET AUDIO" couleur={VERT} top={520} />
      <Chiffre t={surPhrase(voix, f, 8)} haut="BUT…" gros="📱 ➜ 🎥" bas="a few apps sent screen recordings" couleur={ORANGE} />
      <Chiffre t={surPhrase(voix, f, 9)} haut="2024 · AD MARKETING COMPANY" gros="“We listen”" bas="pitched “active listening” ads" couleur={ROUGE} />
      <Chiffre t={surPhrase(voix, f, 10)} haut="FTC FINDING" gros="It didn't work" bas="company ordered to pay $880,000" couleur={JAUNE} />

      <Liste t={surPhrase(voix, f, 12, 13)} f={f} debut={debut(12)} titre="WHAT REALLY GIVES YOU AWAY"
        items={[['Your location', true], ['Your searches', true], ["Your friends' searches", true], ['Your voice', false]]} top={430} />
      <Etiquette pt={ancre(bf, 'dot')} t={surPhrase(voix, f, 14)} texte="MIC IN USE" sous="orange (iPhone) · green (Android)" couleur={ORANGE} dx={-200} dy={280} />

      <SousTitre f={f} voix={voix} finVoix={finDebut} />
      <Fin f={f} debut={finDebut} recap={['Mic waits for a wake word', 'No proof of secret listening', 'Your data says enough']}
        quiz="Why is listening a bad way to spy?" abo={debut(16)} />
    </AbsoluteFill>
  );
};
