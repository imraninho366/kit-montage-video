import React from 'react';
import {AbsoluteFill, Audio, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig, spring} from 'remotion';
import ancresBrutes from './ancres_tap.json';
import voixBrute from './voix_liam.json';
import {Ancre, Chiffre, cl, CUIVRE, CYAN, Entete, Etiquette, Fin, FPS, imageBf, JAUNE, Liste, phraseA, ROUGE, SousTitre, surPhrase,
  Tampon, Voix, VERT, SANS} from './commun';

/**
 * « Tech Unseen · Lesson 01 — tap-to-pay » (TikTok 9:16, ~65 s, voix Liam).
 * 3D Cycles qualité ultime (learn-tiktok/proto_tap/scene_real.py, 241 images) réutilisée phrase par phrase.
 */
const voix = voixBrute as unknown as Voix;
const ANCRES = ancresBrutes as unknown as Record<string, Record<string, Ancre>>;
const N3D = 240;
const FIN_VOIX = Math.ceil((voix.duree + .25) * FPS);
export const DUREE_TAP_LESSON = FIN_VOIX + 30;
// [image début, image fin] de la 3D pour chacune des 17 phrases
const SEG: [number, number][] = [
  [0, 30], [30, 62], [62, 92], [92, 96], [96, 100], [100, 120], [120, 138], [138, 166], [166, 195], [196, 240],
  [0, 40], [100, 137], [140, 180], [40, 62], [62, 92], [240, 240], [240, 240],
];
const ancre = (bf: number, nom: string): Ancre | null => ANCRES[String(Math.min(Math.max(bf, 0), N3D))]?.[nom] ?? null;

const CodeUnique: React.FC<{t: number; f: number; fige: boolean}> = ({t, f, fige}) => {
  if (t <= 0) return null;
  const hex = '0123456789ABCDEF';
  const code = Array.from({length: 16}, (_, i) => hex[(Math.floor(f / 2) * 7 + i * 13 + i * i * 3) % 16]).join('');
  return (
    <div style={{position: 'absolute', left: 60, right: 60, top: 330, textAlign: 'center', opacity: t}}>
      <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 30, letterSpacing: 4, color: JAUNE}}>ONE-TIME CODE (CRYPTOGRAM)</div>
      <div style={{fontFamily: 'Menlo, monospace', fontWeight: 700, fontSize: 64, color: '#fff', marginTop: 8,
        textShadow: `0 0 18px ${JAUNE}`}}>{fige ? '9F26·A41C·7E03·B58D' : code.match(/.{4}/g)!.join('·')}</div>
      <div style={{fontFamily: SANS, fontWeight: 700, fontSize: 28, color: 'rgba(255,255,255,.8)', marginTop: 6}}>
        {fige ? 'used once → useless to thieves' : 'generating…'}</div>
    </div>
  );
};

export const TapLesson: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const k = phraseA(voix, f);
  const bf = imageBf(voix, SEG, f);
  const debut = (i: number) => Math.round(voix.debuts[i] * FPS);
  const src = staticFile(`lesson_tap/3d/f${String(bf).padStart(4, '0')}.jpg`);
  const voleur = k >= 10 && k <= 12;
  const finDebut = debut(15);
  const barre = spring({frame: f - debut(3) - 10, fps, config: {damping: 14}});
  const actif = k <= 3 ? 0 : k <= 6 ? 1 : k <= 9 ? 2 : 3;
  const flash = interpolate(f, [debut(10) - 2, debut(10) + 2, debut(10) + 8], [0, .7, 0], cl);

  return (
    <AbsoluteFill style={{backgroundColor: '#05080F'}}>
      <Audio src={staticFile('lesson_tap/voix_liam.wav')} />
      <AbsoluteFill style={{transform: `scale(${1 + .03 * Math.sin(f / 90)})`}}>
        <Img src={src} style={{width: '100%', height: '100%', objectFit: 'cover',
          filter: voleur ? 'saturate(.45) brightness(.75) contrast(1.1)' : 'none'}} />
      </AbsoluteFill>
      {voleur && <AbsoluteFill style={{background: 'radial-gradient(ellipse at center, rgba(0,0,0,0) 45%, rgba(140,0,0,.55) 100%)'}} />}
      <AbsoluteFill style={{background: '#fff', opacity: flash}} />

      {/* « no battery » : batterie barrée */}
      {surPhrase(voix, f, 3) > 0 && (
        <div style={{position: 'absolute', top: 470, width: '100%', display: 'flex', justifyContent: 'center', opacity: surPhrase(voix, f, 3)}}>
          <div style={{position: 'relative', width: 260, height: 130}}>
            <div style={{position: 'absolute', inset: 0, border: '12px solid #fff', borderRadius: 26, background: 'rgba(5,8,15,.5)'}} />
            <div style={{position: 'absolute', right: -34, top: 38, width: 24, height: 54, background: '#fff', borderRadius: 8}} />
            <div style={{position: 'absolute', left: -30, top: 58, width: 320 * barre, height: 16, background: ROUGE,
              transform: 'rotate(-28deg)', transformOrigin: 'left center', borderRadius: 8}} />
          </div>
        </div>
      )}

      <Entete lecon="TECH UNSEEN · LESSON 01" noms={['Antenna', 'Power', 'Code', 'Thieves']} actif={actif}
        vis={interpolate(f, [debut(1), debut(1) + 15], [0, 1], cl) * (1 - interpolate(f, [finDebut, finDebut + 10], [0, 1], cl))} fini={false} />

      <Etiquette pt={ancre(bf, 'coil')} t={surPhrase(voix, f, 2)} texte="COPPER ANTENNA" sous="hidden inside the plastic" couleur={CUIVRE} dx={-60} dy={230} />
      <Etiquette pt={ancre(bf, 'field')} t={surPhrase(voix, f, 5)} texte="MAGNETIC FIELD" sous="13.56 MHz · invisible" couleur={CYAN} dx={-120} dy={-230} />
      <Etiquette pt={ancre(bf, 'chip')} t={surPhrase(voix, f, 6)} texte="CHIP WAKES UP" sous="powered wirelessly" couleur={JAUNE} dx={60} dy={-260} />
      <CodeUnique t={surPhrase(voix, f, 7, 8)} f={f} fige={k === 8} />
      <Tampon t={interpolate(f, [debut(9), debut(9) + 8, debut(10) - 4, debut(10)], [0, 1, 1, 0], cl)} texte="✓ APPROVED" couleur={VERT} />

      {/* les voleurs */}
      <Chiffre t={surPhrase(voix, f, 10)} haut="⚠ THE THREAT" gros="RFID SKIMMING" bas="a hidden reader in a crowd" couleur={ROUGE} />
      <Liste t={surPhrase(voix, f, 11, 12)} f={f} debut={debut(11) + 20} titre="A SKIMMER A FEW CM AWAY CAN READ"
        items={[['Card number', true], ['Expiry date (sometimes)', true]]} top={560} />
      <Liste t={surPhrase(voix, f, 12)} f={f} debut={debut(12) + 4}
        items={[['Security code (CVV)', false], ['One-time code', false]]} top={870} />
      <Tampon t={surPhrase(voix, f, 13)} texte="✗ CLONE DECLINED" couleur={ROUGE} />
      <Chiffre t={surPhrase(voix, f, 14)} haut="RFID WALLET?" gros="Optional" bas="a cheap extra layer, nothing more" couleur={CYAN} />

      <SousTitre f={f} voix={voix} finVoix={finDebut} />
      <Fin f={f} debut={finDebut} recap={['No battery inside', "The reader's field = power", 'New code every tap']}
        quiz="Why must the reader be so close?" abo={debut(16)} />
    </AbsoluteFill>
  );
};
