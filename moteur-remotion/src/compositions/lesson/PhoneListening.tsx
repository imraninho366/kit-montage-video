import React from 'react';
import {AbsoluteFill, Audio, Img, interpolate, Sequence, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import ancresBrutes from './ancres_ecoute.json';
import voixBrute from './voix_ecoute.json';
import {Ancre, cl, CRAIE, SANS, Voix} from './commun';

/**
 * « Tech Unseen · Lesson 02 — Is your phone secretly listening? » (POV toon, ~64 s).
 * 3D EEVEE : learn-tiktok/proto_ecoute/scene_ecoute.py. Faits : Northeastern University 2018 (17 000+ applis Android, aucune fuite audio
 * secrète ; quelques-unes envoyaient des captures d'écran) ; FTC vs Cox Media Group « Active Listening » (l'outil ne recevait aucune voix,
 * 880 000 $) ; détection du mot d'éveil en local ; point orange iOS / vert Android. Sous-titres blancs, 3 mots max.
 */
const voix = voixBrute as unknown as Voix;
const ANCRES = ancresBrutes as unknown as Record<string, Record<string, Ancre>>;
const OFF = 180, GEL = 175;
const PH = [...voix.debuts.map((t) => OFF + Math.round(t * 30)), OFF + Math.round(voix.duree * 30)];
const DEGEL = PH[10], I0 = PH[1] + 40, I1 = PH[5];
export const DUREE_ECOUTE = PH[14] + 25;
const ease = (f: number, a: number, b: number) => interpolate(f, [a, b], [0, 1], {...cl, easing: (t) => 1 - Math.pow(1 - t, 3)});
const fen = (f: number, a: number, b: number) => interpolate(f, [a - 4, a + 6, b - 6, b], [0, 1, 1, 0], cl);
const est3D = (f: number) => f < I1 || (f >= DEGEL && f < PH[12] + 30);
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
  if (t < 0 || f >= PH[12]) return null;
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

const Etude: React.FC = () => {
  const f = useCurrentFrame(); const d = PH[7] - PH[5];
  const scan = ease(f, PH[6] - PH[5], PH[6] - PH[5] + 90);
  return (
    <AbsoluteFill style={{background: NUIT}}>
      <svg viewBox="0 0 1080 1920" width={1080} height={1920}>
        {Array.from({length: 42}, (_, i) => {
          const x = 140 + (i % 6) * 160, y = 500 + Math.floor(i / 6) * 128, ti = ease(f, 4 + i * .6, 12 + i * .6), ok = scan * 42 > i;
          return <g key={i} transform={`translate(${x},${y}) scale(${ti})`}>
            <rect x={-52} y={-52} width={104} height={104} rx={26} fill={['#FF6B6B', '#4FC3F7', '#FFD54F', '#81C784', '#BA68C8', '#FF8A65'][i % 6]} stroke="#111" strokeWidth={6} />
            {ok && <text x={0} y={22} textAnchor="middle" fontFamily={SANS} fontWeight={900} fontSize={64} fill="#fff" stroke="#111" strokeWidth={6} paintOrder="stroke">✓</text>}
          </g>;
        })}
        <text x={540} y={400} textAnchor="middle" fill={BLANC} stroke="#000" strokeWidth={8} paintOrder="stroke" fontFamily={SANS} fontWeight={900} fontSize={120}
          opacity={ease(f, 20, 30)}>17,000+ APPS</text>
        <text x={540} y={1700} textAnchor="middle" fill={BLANC} stroke="#000" strokeWidth={6} paintOrder="stroke" fontFamily={SANS} fontWeight={900} fontSize={44}
          opacity={ease(f, 20, 30)}>Northeastern University · 2018</text>
        <g opacity={ease(f, d * .8, d * .8 + 10)} transform={`translate(540,1180) rotate(-6) scale(${1.3 - .3 * ease(f, d * .8, d * .8 + 10)})`}>
          <rect x={-370} y={-80} width={740} height={160} rx={26} fill="rgba(0,0,0,.65)" stroke="#3BE37A" strokeWidth={12} />
          <text x={0} y={30} textAnchor="middle" fill="#3BE37A" fontFamily={SANS} fontWeight={900} fontSize={84}>NO SECRET AUDIO</text>
        </g>
      </svg>
    </AbsoluteFill>
  );
};

const Ftc: React.FC = () => {
  const f = useCurrentFrame(); const d = PH[8] - PH[7];
  const tampon = ease(f, d * .62, d * .62 + 10);
  return (
    <AbsoluteFill style={{background: '#1A0B12'}}>
      <svg viewBox="0 0 1080 1920" width={1080} height={1920}>
        <g transform={`translate(540,880) rotate(${-4 + 4 * ease(f, 0, 14)}) scale(${.8 + .2 * ease(f, 0, 14)})`} opacity={ease(f, 0, 10)}>
          <rect x={-330} y={-440} width={660} height={880} rx={20} fill="#F4F1E6" stroke="#111" strokeWidth={8} />
          <text x={0} y={-330} textAnchor="middle" fill="#111" fontFamily={SANS} fontWeight={900} fontSize={58}>“ACTIVE LISTENING”</text>
          <text x={0} y={-270} textAnchor="middle" fill="#555" fontFamily={SANS} fontWeight={800} fontSize={34}>ad company pitch · 2024</text>
          {[0, 1, 2, 3, 4, 5, 6].map((i) => <rect key={i} x={-260} y={-200 + i * 70} width={i % 3 === 2 ? 340 : 520} height={22} rx={11} fill="#C9C3B3" />)}
          <text x={0} y={350} textAnchor="middle" fontSize={120}>🎤</text>
        </g>
        <g opacity={tampon} transform={`translate(540,1000) rotate(-10) scale(${1.4 - .4 * tampon})`}>
          <rect x={-400} y={-120} width={800} height={240} rx={30} fill="rgba(0,0,0,.6)" stroke="#FF4B3E" strokeWidth={16} />
          <text x={0} y={-10} textAnchor="middle" fill="#FF4B3E" fontFamily={SANS} fontWeight={900} fontSize={96}>FTC: IT NEVER</text>
          <text x={0} y={85} textAnchor="middle" fill="#FF4B3E" fontFamily={SANS} fontWeight={900} fontSize={96}>DID THAT</text>
        </g>
      </svg>
    </AbsoluteFill>
  );
};

const Donnees: React.FC = () => {
  const f = useCurrentFrame(); const d = DEGEL - PH[8];
  const k1 = PH[9] - PH[8];
  const sources: [string, string, number][] = [['📍', 'Location', k1], ['🔍', 'Searches', k1 + 40], ['🧑‍🤝‍🧑', "Friend's searches", k1 + 85]];
  return (
    <AbsoluteFill style={{background: NUIT}}>
      <svg viewBox="0 0 1080 1920" width={1080} height={1920}>
        <text x={540} y={470} textAnchor="middle" fill={BLANC} stroke="#000" strokeWidth={8} paintOrder="stroke" fontFamily={SANS} fontWeight={900} fontSize={90}
          opacity={ease(f, 0, 10)}>HOW DID IT KNOW?</text>
        <g transform="translate(540,1250)" opacity={ease(f, k1 - 10, k1)}>
          <rect x={-200} y={-120} width={400} height={240} rx={30} fill="#FF7A3D" stroke="#111" strokeWidth={8} />
          <text x={0} y={-10} textAnchor="middle" fill="#fff" fontFamily={SANS} fontWeight={900} fontSize={64}>👟 AD</text>
          <text x={0} y={70} textAnchor="middle" fill="#fff" fontFamily={SANS} fontWeight={900} fontSize={44}>for you</text>
        </g>
        {sources.map(([ic, nom, t0], i) => {
          const t = ease(f, t0, t0 + 12), x = 200 + i * 340, y = 800, vol = ease(f, t0 + 14, t0 + 40);
          return <g key={nom} opacity={t}>
            <circle cx={x} cy={y} r={110 * t} fill="#E9EEF7" stroke="#111" strokeWidth={8} />
            <text x={x} y={y + 38} textAnchor="middle" fontSize={110}>{ic}</text>
            <text x={x} y={y + 175} textAnchor="middle" fill={BLANC} stroke="#000" strokeWidth={6} paintOrder="stroke" fontFamily={SANS} fontWeight={900} fontSize={40}>{nom}</text>
            <circle cx={x + (540 - x) * vol} cy={y + 230 + 200 * vol} r={16} fill="#FFD84D" stroke="#111" strokeWidth={4} opacity={vol < 1 ? 1 : 0} />
          </g>;
        })}
      </svg>
    </AbsoluteFill>
  );
};

// ---------------- page de fin animée (quiz puis abonnement, couleurs du logo) ----------------
const CYAN_L = '#4FF3FF', NAVY = '#0E1B33';
const MOTS_QUIZ = voix.mots.filter((m) => m.a >= voix.debuts[12] - .05 && m.a < voix.debuts[13] - .05);
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
  const f = useCurrentFrame(); const abo = PH[13] - PH[12];
  const t0 = voix.debuts[12];
  const sortie = ease(f, abo - 6, abo + 8);                     // le quiz s'envole quand l'abonnement arrive
  const g = (k: number) => ease(f, abo + k, abo + k + 10);
  const tape = abo + 62;                                        // le doigt appuie sur « Follow »
  const appuye = f >= tape;
  const squish = appuye ? 1 - .12 * Math.max(0, 1 - (f - tape) / 6) : 1;
  return (
    <AbsoluteFill style={{opacity: ease(f, 0, 8)}}>
      <Img src={staticFile(`lesson_ecoute/3d/f${String(PH[12] + 29).padStart(4, '0')}.jpg`)} style={{width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(18px)'}} />
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
            const vide = ease(f, 40, 110);
            return <>
              <text x={420} y={1120} textAnchor="middle" fontSize={200}>🎤</text>
              <g transform="translate(700,1040)">
                <rect x={-80} y={-150} width={160} height={290} rx={24} fill="none" stroke="#fff" strokeWidth={12} />
                <rect x={-34} y={-180} width={68} height={30} rx={8} fill="#fff" />
                <rect x={-62} y={-132 + 254 * vide} width={124} height={254 * (1 - vide)} rx={12} fill={vide > .7 ? '#FF4B3E' : '#3BE37A'} />
              </g>
              {[[-170, -60], [330, -110]].map(([dx, dy], i) => {
                const q = ease(f, 60 + i * 9, 70 + i * 9);
                return <text key={i} x={540 + dx} y={1000 + dy} textAnchor="middle" fontFamily={SANS} fontWeight={900} fontSize={110}
                  fill={CYAN_L} opacity={q}>?</text>;
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
              <div style={{fontFamily: SANS, fontWeight: 900, fontSize: 52, color: BLANC, marginTop: 8}}>🍲 What your microwave really does to your food</div>
            </div>
          </div>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};

export const PhoneListening: React.FC = () => {
  const f = useCurrentFrame();
  const {width, height} = useVideoConfig();
  const fige = f >= GEL && f < DEGEL && !(f >= I0 && f < I1);
  const froid = fige ? ease(f, GEL, GEL + 14) : 0;
  const flash = interpolate(f, [GEL - 1, GEL + 1, GEL + 10], [0, 1, 0], cl) + interpolate(f, [DEGEL - 1, DEGEL + 1, DEGEL + 8], [0, .7, 0], cl)
    + interpolate(f, [I0 - 3, I0, I0 + 8], [0, 1, 0], cl) + interpolate(f, [I1 - 3, I1, I1 + 8], [0, .8, 0], cl);
  const choc = f >= GEL && f < GEL + 8 ? Math.sin((f - GEL) * 2.4) * 10 * (1 - (f - GEL) / 8) : 0;
  const img = Math.min(f, PH[12] + 29);
  const sec = f < GEL ? f / 30 : f < DEGEL ? GEL / 30 : (GEL + f - DEGEL) / 30;

  return (
    <AbsoluteFill style={{background: '#000'}}>
      <Audio src={staticFile('lesson_pov/sfx/ambiance.wav')} volume={(fr) => (fr < GEL ? .9 : 0)} />
      <Sequence from={DEGEL}><Audio src={staticFile('lesson_pov/sfx/ambiance.wav')} volume={.7} /></Sequence>
      <Sequence from={9}><Audio src={staticFile('lesson_ecoute/ami.wav')} /></Sequence>
      <Sequence from={76}><Audio src={staticFile('lesson_ecoute/moi.wav')} /></Sequence>
      <Sequence from={OFF}><Audio src={staticFile('lesson_ecoute/voix_narration.wav')} /></Sequence>
      <Sequence from={160} durationInFrames={20}><Audio src={staticFile('lesson_pov/sfx/pop.wav')} volume={.6} /></Sequence>
      <Sequence from={GEL - 1}><Audio src={staticFile('lesson_pov/sfx/gel.wav')} volume={.8} /></Sequence>
      {Array.from({length: Math.floor((DEGEL - GEL - 30) / 30)}, (_, i) => <Sequence key={i} from={GEL + 30 + i * 30} durationInFrames={20}>
        <Audio src={staticFile('lesson_pov/sfx/tic.wav')} volume={.18} /></Sequence>)}
      {[PH[1] + 4, I1 - 4, PH[8] - 2].map((x) => <Sequence key={x} from={x} durationInFrames={30}><Audio src={staticFile('lesson_pov/sfx/whoosh.wav')} volume={.45} /></Sequence>)}
      {[PH[2] + 10, PH[3] + 8, PH[6] + 10, PH[9] + 4, PH[9] + 44, PH[9] + 89, PH[11] + 20].map((x) => <Sequence key={x} from={x} durationInFrames={20}><Audio src={staticFile('lesson_pov/sfx/pop.wav')} volume={.4} /></Sequence>)}
      <Sequence from={PH[4] + 10} durationInFrames={40}><Audio src={staticFile('lesson_pov/sfx/grave.wav')} volume={.45} /></Sequence>
      <Sequence from={PH[7] + Math.round((PH[8] - PH[7]) * .62)} durationInFrames={40}><Audio src={staticFile('lesson_pov/sfx/refus.wav')} volume={.5} /></Sequence>
      <Sequence from={DEGEL} durationInFrames={30}><Audio src={staticFile('lesson_pov/sfx/whoosh.wav')} volume={.5} /></Sequence>

      {est3D(f) && (
        <AbsoluteFill style={{transform: `translateX(${choc}px)`}}>
          <Img src={staticFile(`lesson_ecoute/3d/f${String(img).padStart(4, '0')}.jpg`)} style={{width: '100%', height: '100%', objectFit: 'cover',
            filter: `saturate(${1 - .55 * froid}) hue-rotate(${-12 * froid}deg)`}} />
        </AbsoluteFill>
      )}
      {fige && <AbsoluteFill style={{background: `radial-gradient(ellipse at center, rgba(60,120,255,${.06 * froid}) 40%, rgba(5,15,50,${.55 * froid}) 100%)`}} />}
      <Sequence from={PH[5]} durationInFrames={PH[7] - PH[5]}><Etude /></Sequence>
      <Sequence from={PH[7]} durationInFrames={PH[8] - PH[7]}><Ftc /></Sequence>
      <Sequence from={PH[8]} durationInFrames={DEGEL - PH[8]}><Donnees /></Sequence>
      <Sequence from={PH[12]}><Fin /></Sequence>
      <AbsoluteFill style={{background: '#fff', opacity: Math.min(1, flash)}} />
      {f >= GEL && f < GEL + 24 && (
        <svg width={width} height={height} style={{position: 'absolute'}}>
          <circle cx={width / 2} cy={height * .55} r={ease(f, GEL, GEL + 24) * 1400} fill="none" stroke="#fff" strokeWidth={14} opacity={1 - ease(f, GEL, GEL + 24)} />
        </svg>
      )}

      {f < PH[12] && <div style={{position: 'absolute', top: 110, right: 60, fontFamily: 'Menlo, monospace', fontWeight: 700, fontSize: 50,
        color: BLANC, textShadow: '0 4px 0 #000'}}>{f >= GEL && f < DEGEL ? '⏸ ' : '● '}{sec.toFixed(2)}s</div>}

      <Texte t={ease(f, 0, 6) * (1 - ease(f, GEL - 8, GEL))} top={200} taille={54}>POV: you talk about sneakers…</Texte>
      <Bulle t={ease(f, 9, 14) * (1 - ease(f, 68, 74))} texte="Bro, I need new sneakers." />
      <Bulle t={ease(f, 76, 81) * (1 - ease(f, 128, 134))} texte="Same. Mine are dead." bas />
      <Texte t={ease(f, GEL + 4, GEL + 12) * (1 - ease(f, GEL + 70, GEL + 78))} top={290} taille={110}>TIME STOPS.</Texte>
      <Etiq f={img} nom="mic" t={fen(f, PH[2] + 10, PH[3])} texte="MICROPHONE" sous="always powered" dy={-300} />
      <Etiq f={img} nom="wake" t={fen(f, PH[3] + 8, PH[4])} texte="WAKE-WORD CHIP" sous="listens for one phrase only" dy={-300} />
      <Etiq f={img} nom="shred" t={fen(f, PH[4] + 10, I1)} texte="EVERYTHING ELSE" sous="deleted on the spot" dy={-300} />
      <Etiq f={img} nom="dot" t={fen(f, PH[11] + 30, PH[12])} texte="MIC IN USE" sous="orange on iPhone · green on Android" dy={260} />
      <SousTitres f={f} />
    </AbsoluteFill>
  );
};
