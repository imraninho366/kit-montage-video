import React from 'react';
import {AbsoluteFill, Audio, Img, interpolate, Sequence, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import ancresBrutes from './ancres_full.json';
import voixBrute from './voix_applepay.json';
import {Ancre, cl, CRAIE, SANS, Voix} from './commun';

/**
 * « Inside 1 Second · Apple Pay » — vidéo complète (~66 s), POV toon.
 * 3D EEVEE : learn-tiktok/proto_pov/scene_full.py (gel du temps à 135, monde intérieur du téléphone, dégel sur « Approved »).
 * Faits : Apple (support.apple.com/101554, Platform Security Guide) — le vrai numéro n'est jamais envoyé ; Device Account Number
 * dans le Secure Element, isolé du système ; paiement libéré après authentification ; code unique par transaction.
 * Sous-titres : tout en blanc (consigne d'Imran).
 */
const voix = voixBrute as unknown as Voix;
const ANCRES = ancresBrutes as unknown as Record<string, Record<string, Ancre>>;
const OFF = 140, GEL = 135;
const PH = [...voix.debuts.map((t) => OFF + Math.round(t * 30)), OFF + Math.round(voix.duree * 30)];
const DEGEL = PH[11], I0 = PH[2] + 55, I1 = PH[9];
export const DUREE_APPLEPAY = PH[16] + 25;
const ease = (f: number, a: number, b: number) => interpolate(f, [a, b], [0, 1], {...cl, easing: (t) => 1 - Math.pow(1 - t, 3)});
const fen = (f: number, a: number, b: number) => interpolate(f, [a - 4, a + 6, b - 6, b], [0, 1, 1, 0], cl);
const est3D = (f: number) => f < PH[10] || (f >= PH[11] && f < PH[12]) || (f >= PH[13] && f < PH[14] + 30);
const NUIT = '#0B1530', BLANC = '#fff';

const Texte: React.FC<{t: number; children: React.ReactNode; top?: number; taille?: number}> = ({t, children, top = 230, taille = 64}) => (
  t <= 0 ? null : (
    <div style={{position: 'absolute', top, left: 60, right: 60, textAlign: 'center', opacity: t, transform: `translateY(${(1 - t) * 20}px)`}}>
      <span style={{fontFamily: SANS, fontWeight: 900, fontSize: taille, lineHeight: 1.15, color: BLANC, WebkitTextStroke: '3px #000',
        paintOrder: 'stroke', textShadow: '0 6px 0 #000'}}>{children}</span>
    </div>
  )
);

const Etiq: React.FC<{f: number; nom: string; t: number; texte: string; sous?: string; dy?: number}> = ({f, nom, t, texte, sous, dy = -200}) => {
  const {width, height} = useVideoConfig();
  const pt = ANCRES[String(f)]?.[nom];
  if (!pt || t <= 0 || pt[2] <= 0) return null;
  const px = pt[0] * width, py = pt[1] * height, ly = py + dy;
  return (
    <>
      <svg width={width} height={height} style={{position: 'absolute', opacity: t}}>
        <line x1={px} y1={py} x2={px} y2={py + dy * t} stroke={BLANC} strokeWidth={5} />
        <circle cx={px} cy={py} r={12 * t} fill={BLANC} stroke="#000" strokeWidth={4} />
      </svg>
      <div style={{position: 'absolute', left: Math.min(Math.max(px - 260, 30), width - 550), top: Math.max(190, ly - (dy < 0 ? 100 : 0)), width: 520,
        textAlign: 'center', opacity: t, transform: `scale(${.85 + .15 * t})`}}>
        <div style={{display: 'inline-block', fontFamily: SANS, fontWeight: 900, fontSize: 44, color: BLANC, background: 'rgba(0,0,0,.78)',
          border: '3px solid #fff', padding: '8px 22px', borderRadius: 16}}>{texte}</div>
        {sous && <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 32, color: BLANC, marginTop: 8, WebkitTextStroke: '2px #000',
          paintOrder: 'stroke'}}>{sous}</div>}
      </div>
    </>
  );
};

// Sous-titres par petits groupes (3 mots max, coupés aux pauses et à la ponctuation), tout en blanc.
const GROUPES: {mots: string[]; a: number; b: number}[] = (() => {
  const g: {mots: string[]; a: number; b: number}[] = [];
  let cur: typeof voix.mots = [];
  voix.mots.forEach((m, i) => {
    cur.push(m);
    const suivant = voix.mots[i + 1];
    const coupe = cur.length >= 3 || /[.,?!:]$/.test(m.m) || !suivant || suivant.a - m.b > .25;
    if (coupe) { g.push({mots: cur.map((x) => x.m), a: cur[0].a, b: suivant ? suivant.a : m.b + .4}); cur = []; }
  });
  return g;
})();
const SousTitres: React.FC<{f: number}> = ({f}) => {
  const t = (f - OFF) / 30;
  if (t < 0 || f >= PH[14]) return null;
  const g = GROUPES.find((x) => t >= x.a - .03 && t < x.b);
  if (!g) return null;
  const pop = interpolate(t, [g.a - .03, g.a + .08], [.85, 1], cl);
  return (
    <div style={{position: 'absolute', left: 60, right: 60, bottom: 360, textAlign: 'center', transform: `scale(${pop})`}}>
      <span style={{fontFamily: SANS, fontWeight: 900, fontSize: 76, lineHeight: 1.1, color: BLANC, WebkitTextStroke: '4px #000', paintOrder: 'stroke',
        textShadow: '0 6px 0 #000'}}>{g.mots.join(' ')}</span>
    </div>
  );
};

const Bulle: React.FC<{t: number; texte: string; bas?: boolean}> = ({t, texte, bas}) => (
  t <= 0 ? null : (
    <div style={{position: 'absolute', left: bas ? 140 : 120, top: bas ? 1180 : 420, opacity: t, transform: `scale(${.7 + .3 * t})`,
      transformOrigin: bas ? 'bottom left' : 'top left'}}>
      <div style={{background: '#fff', border: '6px solid #111', borderRadius: 46, padding: '22px 36px', fontFamily: SANS, fontWeight: 900,
        fontSize: 58, color: '#111', boxShadow: '0 8px 0 rgba(0,0,0,.35)'}}>{texte}</div>
    </div>
  )
);

const Batiment: React.FC<{x: number; y: number; nom: string; icone: string; t: number; actif: boolean}> = ({x, y, nom, icone, t, actif}) => (
  <g transform={`translate(${x},${y}) scale(${.6 + .4 * t})`} opacity={t}>
    <rect x={-150} y={-150} width={300} height={260} rx={30} fill={actif ? '#FFD45E' : '#E9EEF7'} stroke="#111" strokeWidth={8} />
    <text x={0} y={-10} textAnchor="middle" fontSize={130}>{icone}</text>
    <text x={0} y={180} textAnchor="middle" fill={BLANC} stroke="#000" strokeWidth={8} paintOrder="stroke" fontFamily={SANS} fontWeight={900} fontSize={44}>{nom}</text>
  </g>
);
const Jeton: React.FC<{x: number; y: number; rouge?: boolean; s?: number}> = ({x, y, rouge, s = 1}) => (
  <g transform={`translate(${x},${y}) scale(${s})`}>
    <rect x={-95} y={-60} width={190} height={120} rx={18} fill={rouge ? '#FF5A4E' : '#FFC93C'} stroke="#111" strokeWidth={7} />
    <text x={0} y={18} textAnchor="middle" fill="#111" fontFamily="Menlo, monospace" fontWeight={700} fontSize={44}>••7716</text>
  </g>
);

const Reseau: React.FC = () => {
  const f = useCurrentFrame(); const d = PH[11] - PH[10];
  const u = ease(f, 14, d * .55), v = ease(f, d * .55, d * .8);
  const jx = u < 1 ? 230 + 310 * u : 540 + 310 * v;
  const jy = u < 1 ? 760 - 130 * Math.sin(u * Math.PI) : 760 - 130 * Math.sin(v * Math.PI);
  return (
    <AbsoluteFill style={{background: NUIT}}>
      <svg viewBox="0 0 1080 1920" width={1080} height={1920}>
        <path d="M 230 760 Q 385 560 540 760 Q 695 560 850 760" fill="none" stroke="#3B5BA8" strokeWidth={10} strokeDasharray="22 18" />
        <Batiment x={230} y={760} nom="STORE" icone="☕" t={ease(f, 0, 10)} actif={u < .2} />
        <Batiment x={540} y={760} nom="NETWORK" icone="🌐" t={ease(f, 4, 14)} actif={u > .9 && v < .2} />
        <Batiment x={850} y={760} nom="YOUR BANK" icone="🏦" t={ease(f, 8, 18)} actif={v > .9} />
        <Jeton x={jx} y={jy - 220} s={.8} />
        <g opacity={ease(f, d * .8, d * .8 + 10)} transform="translate(540,1150)">
          <rect x={-420} y={-110} width={840} height={220} rx={30} fill="#16244A" stroke="#fff" strokeWidth={5} />
          <text x={-220} y={22} textAnchor="middle" fill={BLANC} fontFamily="Menlo, monospace" fontWeight={700} fontSize={54}>••7716</text>
          <text x={0} y={26} textAnchor="middle" fill={BLANC} fontSize={70}>🔒</text>
          <text x={220} y={22} textAnchor="middle" fill={BLANC} fontFamily="Menlo, monospace" fontWeight={700} fontSize={54}>••3456</text>
          <text x={0} y={175} textAnchor="middle" fill={BLANC} stroke="#000" strokeWidth={6} paintOrder="stroke" fontFamily={SANS} fontWeight={900} fontSize={40}>stand-in  →  your real card</text>
        </g>
      </svg>
    </AbsoluteFill>
  );
};

const Hacker: React.FC = () => {
  const f = useCurrentFrame(); const d = PH[13] - PH[12];
  const vol = ease(f, 20, 55), rouge = f > d * .5, tampon = ease(f, d * .5, d * .5 + 10);
  return (
    <AbsoluteFill style={{background: '#1A0B12'}}>
      <svg viewBox="0 0 1080 1920" width={1080} height={1920}>
        <g transform="translate(250,820)">
          <rect x={-160} y={-200} width={320} height={400} rx={24} fill="#2C3550" stroke="#111" strokeWidth={8} />
          {[0, 1, 2, 3].map((i) => <rect key={i} x={-120} y={-160 + i * 90} width={240} height={60} rx={10} fill="#4C5A80" stroke="#111" strokeWidth={5} />)}
          <text x={0} y={270} textAnchor="middle" fill={BLANC} stroke="#000" strokeWidth={8} paintOrder="stroke" fontFamily={SANS} fontWeight={900} fontSize={44}>STORE DATA</text>
        </g>
        <g transform="translate(830,880)">
          <path d="M 0 -240 C -120 -240 -140 -110 -130 -30 L -210 260 L 210 260 L 130 -30 C 140 -110 120 -240 0 -240 Z" fill="#05070D" stroke="#FF5A4E" strokeWidth={6} />
          <ellipse cx={0} cy={-95} rx={72} ry={88} fill="#000" />
          <circle cx={-26} cy={-95} r={8} fill="#FF5A4E" /><circle cx={26} cy={-95} r={8} fill="#FF5A4E" />
        </g>
        <Jeton x={250 + 480 * vol} y={760 - 160 * Math.sin(vol * Math.PI)} rouge={rouge} s={.9} />
        <g opacity={tampon} transform={`translate(540,1200) rotate(-8) scale(${1.4 - .4 * tampon})`}>
          <rect x={-330} y={-85} width={660} height={170} rx={26} fill="rgba(0,0,0,.6)" stroke="#FF5A4E" strokeWidth={14} />
          <text x={0} y={35} textAnchor="middle" fill="#FF5A4E" fontFamily={SANS} fontWeight={900} fontSize={110}>USELESS</text>
        </g>
      </svg>
    </AbsoluteFill>
  );
};

// ---------------- page de fin animée (quiz puis abonnement, couleurs du logo) ----------------
const CYAN_L = '#4FF3FF', NAVY = '#0E1B33';
const MOTS_QUIZ = voix.mots.filter((m) => m.a >= voix.debuts[14] - .05 && m.a < voix.debuts[15] - .05);
const Pistes: React.FC<{f: number}> = ({f}) => (
  <svg viewBox="0 0 1080 1920" width={1080} height={1920} style={{position: 'absolute', opacity: .35}}>
    {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
      const y = 180 + i * 220, x = (i % 2) * 300;
      return <path key={i} d={`M ${-50 + x} ${y} H ${300 + x} L ${380 + x} ${y + 80} H ${1130}`} fill="none" stroke={CYAN_L} strokeWidth={4}
        strokeDasharray="60 1400" strokeDashoffset={-((f * 14 + i * 170) % 1460)} strokeLinecap="round" />;
    })}
  </svg>
);
const Telephone: React.FC<{x: number; y: number; rot: number; s: number}> = ({x, y, rot, s}) => (
  <g transform={`translate(${x},${y}) rotate(${rot}) scale(${s})`}>
    <rect x={-70} y={-140} width={140} height={280} rx={26} fill="#1E2433" stroke="#fff" strokeWidth={7} />
    <rect x={-56} y={-120} width={112} height={236} rx={16} fill="#3A6FE0" />
    <rect x={-40} y={-90} width={80} height={50} rx={8} fill="#7FB0FF" />
  </g>
);

const Fin: React.FC = () => {
  const f = useCurrentFrame(); const abo = PH[15] - PH[14];
  const t0 = voix.debuts[14];
  const sortie = ease(f, abo - 6, abo + 8);                     // le quiz s'envole quand l'abonnement arrive
  const g = (k: number) => ease(f, abo + k, abo + k + 10);
  const tape = abo + 62;                                        // le doigt appuie sur « Follow »
  const appuye = f >= tape;
  const squish = appuye ? 1 - .12 * Math.max(0, 1 - (f - tape) / 6) : 1;
  return (
    <AbsoluteFill style={{opacity: ease(f, 0, 8)}}>
      <Img src={staticFile(`lesson_full/3d/f${String(PH[14] + 29).padStart(4, '0')}.jpg`)} style={{width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(18px)'}} />
      <AbsoluteFill style={{background: `rgba(14,27,51,${.82 + .1 * sortie})`}} />
      <Pistes f={f} />

      {/* ----- QUIZ ----- */}
      <AbsoluteFill style={{opacity: 1 - sortie, transform: `translateY(${-300 * sortie}px)`}}>
        <div style={{position: 'absolute', top: 300, width: '100%', textAlign: 'center',
          transform: `scale(${interpolate(f, [2, 9, 13], [2.2, .92, 1], cl)}) rotate(${Math.sin(f * .9) * 4 * (1 - ease(f, 8, 22))}deg)`, opacity: ease(f, 2, 6)}}>
          <span style={{fontFamily: SANS, fontWeight: 900, fontSize: 64, letterSpacing: 6, color: NAVY, background: CYAN_L, padding: '14px 40px',
            borderRadius: 50, boxShadow: `0 0 40px ${CYAN_L}`}}>POP QUIZ</span>
        </div>
        <div style={{position: 'absolute', top: 470, left: 70, right: 70, textAlign: 'center', fontFamily: SANS, fontWeight: 900, fontSize: 82,
          lineHeight: 1.12, color: BLANC, WebkitTextStroke: '3px #000', paintOrder: 'stroke'}}>
          {MOTS_QUIZ.filter((m) => !/^(Pop|quiz:?)$/i.test(m.m.replace(/[^a-zA-Z:]/g, '')) && !/^(Comment|below\.?)$/i.test(m.m)).map((m, i) => {
            const ti = ease(f, (m.a - t0) * 30 - 2, (m.a - t0) * 30 + 5);
            return <span key={i} style={{display: 'inline-block', opacity: ti, transform: `translateY(${(1 - ti) * 30}px) scale(${.8 + .2 * ti})`,
              marginRight: 22}}>{i === 0 ? m.m.charAt(0).toUpperCase() + m.m.slice(1) : m.m}</span>;
          })}
        </div>
        <svg viewBox="0 0 1080 1920" width={1080} height={1920} style={{position: 'absolute'}}>
          {(() => {
            const chute = ease(f, 40, 75);
            return <>
              <Telephone x={540 + 40 * Math.sin(f * .08)} y={1000 + 260 * chute} rot={-25 + 300 * chute} s={1 - .25 * chute} />
              {[[-170, -40], [170, -90], [-120, 150], [190, 120]].map(([dx, dy], i) => {
                const q = ease(f, 50 + i * 7, 60 + i * 7);
                return <text key={i} x={540 + dx} y={1100 + dy} textAnchor="middle" fontFamily={SANS} fontWeight={900} fontSize={110}
                  fill={CYAN_L} opacity={q} transform={`rotate(${(i % 2 ? 1 : -1) * 15} ${540 + dx} ${1100 + dy})`}>?</text>;
              })}
            </>;
          })()}
        </svg>
        <div style={{position: 'absolute', top: 1440, width: '100%', textAlign: 'center', opacity: ease(f, (MOTS_QUIZ.at(-2)?.a ?? t0 + 4) * 30 - t0 * 30 - 4, (MOTS_QUIZ.at(-2)?.a ?? t0 + 4) * 30 - t0 * 30 + 6)}}>
          <span style={{display: 'inline-block', fontFamily: SANS, fontWeight: 900, fontSize: 60, color: NAVY, background: BLANC, padding: '18px 40px',
            borderRadius: 46, transform: `translateY(${-Math.abs(Math.sin(f * .25)) * 18}px)`}}>💬 Comment your answer</span>
          <div style={{fontSize: 90, marginTop: 10, transform: `translateY(${Math.abs(Math.sin(f * .25)) * 16}px)`}}>👇</div>
        </div>
      </AbsoluteFill>

      {/* ----- ABONNEMENT ----- */}
      {f >= abo - 4 && (
        <AbsoluteFill>
          <svg viewBox="0 0 1080 1920" width={1080} height={1920} style={{position: 'absolute'}}>
            {[0, 1, 2, 3].map((i) => {
              const t = (((f - abo) / 36) + i / 4) % 1;
              return <circle key={i} cx={540} cy={720} r={230 + t * 420} fill="none" stroke={CYAN_L} strokeWidth={10 * (1 - t) + 2} opacity={(1 - t) * g(0)} />;
            })}
          </svg>
          <div style={{position: 'absolute', left: 540 - 230, top: 720 - 230, width: 460, height: 460, borderRadius: '50%', overflow: 'hidden',
            border: '10px solid #fff', boxShadow: `0 0 60px ${CYAN_L}`,
            transform: `scale(${interpolate(f, [abo, abo + 10, abo + 16], [0, 1.12, 1], cl)}) rotate(${interpolate(f, [abo, abo + 16], [-30, 0], cl)}deg)`}}>
            <Img src={staticFile('lesson_pov/logo.png')} style={{width: '100%', height: '100%'}} />
          </div>
          <div style={{position: 'absolute', top: 1010, width: '100%', textAlign: 'center', fontFamily: SANS, fontWeight: 900, fontSize: 104, letterSpacing: 6,
            color: BLANC, WebkitTextStroke: '3px #000', paintOrder: 'stroke'}}>
            {'TECH UNSEEN'.split('').map((c, i) => {
              const ti = g(12 + i * 2);
              return <span key={i} style={{display: 'inline-block', opacity: ti, transform: `translateY(${(1 - ti) * -40}px) scale(${.6 + .4 * ti})`, whiteSpace: 'pre'}}>{c}</span>;
            })}
          </div>
          <div style={{position: 'absolute', top: 1170, width: '100%', textAlign: 'center', opacity: g(34), transform: `scale(${(.8 + .2 * g(34)) * squish})`}}>
            <span style={{display: 'inline-block', fontFamily: SANS, fontWeight: 900, fontSize: 70, color: BLANC, background: appuye ? '#3C4A66' : '#FF3B5C',
              borderRadius: 60, padding: '24px 70px', boxShadow: appuye ? 'none' : '0 0 40px rgba(255,59,92,.7)'}}>{appuye ? '✓ Following' : '+ Follow'}</span>
          </div>
          {/* le doigt qui vient appuyer */}
          <div style={{position: 'absolute', fontSize: 130, left: interpolate(f, [abo + 40, tape], [900, 600], cl), top: interpolate(f, [abo + 40, tape, tape + 8], [1500, 1225, 1250], cl),
            opacity: ease(f, abo + 40, abo + 46) * (1 - ease(f, tape + 14, tape + 22)), transform: `scale(${appuye && f < tape + 6 ? .85 : 1})`}}>👆</div>
          {/* confettis */}
          {appuye && <svg viewBox="0 0 1080 1920" width={1080} height={1920} style={{position: 'absolute'}}>
            {Array.from({length: 26}, (_, i) => {
              const a = i * 2.4, v = 12 + (i % 5) * 4, t = f - tape;
              return <rect key={i} x={540 + Math.cos(a) * v * t} y={1215 + Math.sin(a) * v * t + .6 * t * t} width={18} height={10}
                fill={[CYAN_L, '#FFD84D', '#FF3B5C', '#fff'][i % 4]} opacity={Math.max(0, 1 - t / 28)} transform={`rotate(${t * 20 + i * 30} 540 1215)`} />;
            })}
          </svg>}
          <div style={{position: 'absolute', left: 90, right: 90, top: interpolate(f, [abo + 50, abo + 64], [1950, 1420], cl)}}>
            <div style={{background: 'rgba(0,0,0,.55)', border: `4px solid ${CYAN_L}`, borderRadius: 34, padding: '26px 34px', textAlign: 'center'}}>
              <div style={{fontFamily: SANS, fontWeight: 900, fontSize: 36, letterSpacing: 5, color: CYAN_L}}>NEXT LESSON</div>
              <div style={{fontFamily: SANS, fontWeight: 900, fontSize: 52, color: BLANC, marginTop: 8}}>📱👂 Is your phone secretly listening?</div>
            </div>
          </div>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};

export const ApplePayPov: React.FC = () => {
  const f = useCurrentFrame();
  const {width, height} = useVideoConfig();
  const fige = f >= GEL && f < DEGEL && !(f >= I0 && f < I1);
  const froid = fige ? ease(f, GEL, GEL + 14) : 0;
  const flash = interpolate(f, [GEL - 1, GEL + 1, GEL + 10], [0, 1, 0], cl) + interpolate(f, [DEGEL - 1, DEGEL + 1, DEGEL + 8], [0, .7, 0], cl)
    + interpolate(f, [I0 - 3, I0, I0 + 8], [0, 1, 0], cl) + interpolate(f, [I1 - 3, I1, I1 + 8], [0, .8, 0], cl);
  const choc = f >= GEL && f < GEL + 8 ? Math.sin((f - GEL) * 2.4) * 10 * (1 - (f - GEL) / 8) : 0;
  const img = Math.min(f, PH[14] + 29);
  const sec = f < GEL ? f / 30 : f < DEGEL ? GEL / 30 : (GEL + f - DEGEL) / 30;

  return (
    <AbsoluteFill style={{background: '#000'}}>
      <Audio src={staticFile('lesson_pov/sfx/ambiance.wav')} volume={(fr) => (fr < GEL ? .9 : 0)} />
      <Sequence from={DEGEL}><Audio src={staticFile('lesson_pov/sfx/ambiance.wav')} volume={.7} /></Sequence>
      <Sequence from={9}><Audio src={staticFile('lesson_pov/client.wav')} /></Sequence>
      <Sequence from={60}><Audio src={staticFile('lesson_pov/serveuse.wav')} /></Sequence>
      <Sequence from={OFF}><Audio src={staticFile('lesson_pov/voix_narration.wav')} /></Sequence>
      <Sequence from={GEL - 1}><Audio src={staticFile('lesson_pov/sfx/gel.wav')} volume={.8} /></Sequence>
      {Array.from({length: Math.floor((DEGEL - GEL - 30) / 30)}, (_, i) => <Sequence key={i} from={GEL + 30 + i * 30} durationInFrames={20}>
        <Audio src={staticFile('lesson_pov/sfx/tic.wav')} volume={.18} /></Sequence>)}
      {[PH[2] + 20, I1 - 4].map((x) => <Sequence key={x} from={x} durationInFrames={30}><Audio src={staticFile('lesson_pov/sfx/whoosh.wav')} volume={.45} /></Sequence>)}
      {[PH[3] + 10, PH[4] + 8, PH[6] + 12, PH[8] + 10, PH[10] + 6].map((x) => <Sequence key={x} from={x} durationInFrames={20}><Audio src={staticFile('lesson_pov/sfx/pop.wav')} volume={.4} /></Sequence>)}
      <Sequence from={PH[5] + 28} durationInFrames={40}><Audio src={staticFile('lesson_pov/sfx/refus.wav')} volume={.45} /></Sequence>
      <Sequence from={PH[7] + 4} durationInFrames={40}><Audio src={staticFile('lesson_pov/sfx/grave.wav')} volume={.6} /></Sequence>
      <Sequence from={DEGEL} durationInFrames={30}><Audio src={staticFile('lesson_pov/sfx/bip.wav')} volume={.7} /></Sequence>
      <Sequence from={PH[12]} durationInFrames={40}><Audio src={staticFile('lesson_pov/sfx/grave.wav')} volume={.5} /></Sequence>

      {est3D(f) && (
        <AbsoluteFill style={{transform: `translateX(${choc}px)`}}>
          <Img src={staticFile(`lesson_full/3d/f${String(img).padStart(4, '0')}.jpg`)} style={{width: '100%', height: '100%', objectFit: 'cover',
            filter: `saturate(${1 - .55 * froid}) hue-rotate(${-12 * froid}deg)`}} />
        </AbsoluteFill>
      )}
      {fige && <AbsoluteFill style={{background: `radial-gradient(ellipse at center, rgba(60,120,255,${.06 * froid}) 40%, rgba(5,15,50,${.55 * froid}) 100%)`}} />}
      <Sequence from={PH[10]} durationInFrames={PH[11] - PH[10]}><Reseau /></Sequence>
      <Sequence from={PH[12]} durationInFrames={PH[13] - PH[12]}><Hacker /></Sequence>
      <Sequence from={PH[14]}><Fin /></Sequence>
      <AbsoluteFill style={{background: '#fff', opacity: Math.min(1, flash)}} />
      {f >= GEL && f < GEL + 24 && (
        <svg width={width} height={height} style={{position: 'absolute'}}>
          <circle cx={width / 2} cy={height * .55} r={ease(f, GEL, GEL + 24) * 1400} fill="none" stroke="#fff" strokeWidth={14} opacity={1 - ease(f, GEL, GEL + 24)} />
        </svg>
      )}

      {f < PH[14] && <div style={{position: 'absolute', top: 110, right: 60, fontFamily: 'Menlo, monospace', fontWeight: 700, fontSize: 50,
        color: BLANC, textShadow: '0 4px 0 #000'}}>{f >= GEL && f < DEGEL ? '⏸ ' : '● '}{sec.toFixed(2)}s</div>}

      <Texte t={ease(f, 0, 6) * (1 - ease(f, GEL - 8, GEL))} top={200} taille={54}>POV: you pay for your coffee</Texte>
      <Bulle t={ease(f, 9, 14) * (1 - ease(f, 54, 59))} texte="Hey! I'll pay by card." bas />
      <Bulle t={ease(f, 60, 65) * (1 - ease(f, 112, 118))} texte="Sure, just tap it here." />
      <Texte t={ease(f, GEL + 4, GEL + 12) * (1 - ease(f, GEL + 70, GEL + 78))} top={290} taille={110}>TIME STOPS.</Texte>
      {fen(f, PH[1], PH[2]) > 0 && (
        <div style={{position: 'absolute', top: 330, width: '100%', textAlign: 'center', opacity: fen(f, PH[1], PH[2])}}>
          <span style={{position: 'relative', fontFamily: 'Menlo, monospace', fontWeight: 700, fontSize: 70, color: BLANC, background: 'rgba(0,0,0,.7)',
            padding: '10px 26px', borderRadius: 16}}>
            1234 5678 9012 3456
            <span style={{position: 'absolute', left: -10, right: -10, top: '50%', height: 10, background: '#FF4B3E', borderRadius: 5,
              transform: `scaleX(${ease(f, PH[1] + 20, PH[1] + 34)})`, transformOrigin: 'left'}} />
          </span>
          <div style={{fontFamily: SANS, fontWeight: 900, fontSize: 48, color: BLANC, marginTop: 24, WebkitTextStroke: '3px #000', paintOrder: 'stroke',
            opacity: ease(f, PH[1] + 30, PH[1] + 40)}}>NEVER SENT</div>
        </div>
      )}
      <Etiq f={img} nom="card_in" t={fen(f, PH[3] + 10, PH[4])} texte="STAND-IN NUMBER" sous="made for this phone only" dy={-260} />
      <Etiq f={img} nom="vault" t={fen(f, PH[4] + 8, PH[5])} texte="SECURE ELEMENT" sous="a vault chip" dy={-280} />
      <Etiq f={img} nom="cpu" t={fen(f, PH[5] + 4, PH[6])} texte="MAIN PROCESSOR" sous="✗ access denied" dy={-260} />
      <Etiq f={img} nom="face" t={fen(f, PH[6] + 12, PH[7])} texte="FACE CHECK" dy={-330} />
      <Etiq f={img} nom="face" t={fen(f, PH[7], PH[8])} texte="MATCH ✓" dy={-330} />
      <Etiq f={img} nom="token" t={fen(f, PH[8] + 14, PH[9])} texte="STAND-IN + ONE-TIME CODE" dy={-260} />
      <Etiq f={img} nom="terminal" t={fen(f, I1 + 10, DEGEL)} texte="A FEW CENTIMETERS" sous="in a fraction of a second" dy={-330} />
      <Texte t={fen(f, DEGEL, PH[12])} top={330} taille={110}>APPROVED ✓</Texte>
      <SousTitres f={f} />
    </AbsoluteFill>
  );
};
