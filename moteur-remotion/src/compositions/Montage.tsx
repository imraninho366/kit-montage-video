import {CameraMotionBlur} from '@remotion/motion-blur';
import {noise2D} from '@remotion/noise';
import {AbsoluteFill, Audio, Easing, interpolate, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {ArchivePlate, Mouvement} from '../components/ArchivePlate';
import {BigStat} from '../components/BigStat';
import {Chips} from '../components/Chips';
import {Compare} from '../components/Compare';
import {DatelineCard} from '../components/DatelineCard';
import {DocumentCapture} from '../components/DocumentCapture';
import {EndCard} from '../components/EndCard';
import {FilmGrain} from '../components/FilmGrain';
import {Flash} from '../components/Flash';
import {Globe} from '../components/Globe';
import {LineChart} from '../components/LineChart';
import {Lunettes3D} from '../components/Lunettes3D';
import {ParallaxPlate} from '../components/ParallaxPlate';
import {Grade} from '../components/Grade';
import {Kicker} from '../components/Kicker';
import {LightLeak} from '../components/LightLeak';
import {LowerThird} from '../components/LowerThird';
import {StackBar} from '../components/StackBar';
import {TextPunch} from '../components/TextPunch';
import {Anneaux} from '../components/Anneaux';
import {Frise} from '../components/Frise';
import {MapCountries} from '../components/MapCountries';
import {NameWall} from '../components/NameWall';
import {Receipt} from '../components/Receipt';
import {RouteChain} from '../components/RouteChain';
import {Stats3} from '../components/Stats3';
import {TitleCard} from '../components/TitleCard';
import {Abonnement} from '../components/Abonnement';
import {Carton} from '../components/Carton';
import {Chapitre} from '../components/Chapitre';
import {EcranFin} from '../components/EcranFin';
import {Billet} from '../components/Billet';
import {Bracelet} from '../components/Bracelet';
import {FileAttente} from '../components/FileAttente';
import {Neon} from '../components/Neon';
import {Projecteurs} from '../components/Projecteurs';
import {Setlist} from '../components/Setlist';
import {TripleDip} from '../components/TripleDip';
import {Volant} from '../components/Volant';
import {palettes, Palette, polices} from '../design/theme';
import {theme} from '../design/theme';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Props = Record<string, any>;

/** Texte posé DANS l'image (panneau publicitaire) : il suit le mouvement de la plaque. */
const Panneau: React.FC<{p: Props}> = ({p}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const s = spring({frame: frame - p.a, fps, config: {damping: 14, stiffness: 140}});
  return (
    <div style={{position: 'absolute', left: `${p.x}%`, top: `${p.y}%`, transform: `translate(-50%, -50%) scale(${interpolate(s, [0, 1], [0.8, 1])})`,
      opacity: interpolate(s, [0, 0.3], [0, 1], {extrapolateRight: 'clamp'}), textAlign: 'center'}}>
      <div style={{fontFamily: theme.type.titre, fontSize: 190, lineHeight: 1, color: '#15181D'}}>{p.texte}</div>
      <div style={{fontFamily: theme.type.corps, fontWeight: 700, fontSize: 34, letterSpacing: 10, color: '#B3463C'}}>{p.sous}</div>
    </div>
  );
};

/** Grand nom propre révélé lettre par lettre au centre de l'image. */
const GrandTitre: React.FC<{p: Props}> = ({p}) => {
  const frame = useCurrentFrame() - p.a;
  const espacement = interpolate(frame, [0, 45], [40, 8], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const o = interpolate(frame, [0, 10], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
      <div style={{fontFamily: theme.type.titre, fontSize: 150, color: theme.couleur.encre, letterSpacing: espacement, opacity: o,
        textTransform: 'uppercase', textShadow: '0 10px 50px rgba(0,0,0,.7)'}}>{p.texte}</div>
    </AbsoluteFill>
  );
};

const Fond: React.FC<{type: string; p: Props; DOSSIER: string}> = ({type, p: brut, DOSSIER}) => {
  // retour du 26/09 : les sources ne s'affichent plus à l'écran, elles vivent dans la description
  const p: Props = {...brut, source: undefined};
  switch (type) {
    case 'plaque':
      return (
        <AbsoluteFill>
          <ArchivePlate src={DOSSIER + p.src} mouvement={p.mouvement as Mouvement} foyer={p.foyer} ampleur={p.ampleur}
            flou={p.flou} assombrir={p.assombrir}>
            {p.panneau ? <Panneau p={p.panneau} /> : null}
          </ArchivePlate>
          {p.titre ? <GrandTitre p={p.titre} /> : null}
        </AbsoluteFill>
      );
    case 'stat':
      return (
        <AbsoluteFill style={{backgroundColor: 'var(--fond, #0E1116)'}}>
          {p.src ? <ArchivePlate src={DOSSIER + p.src} mouvement="avant" assombrir={0.72} flou={3} /> : null}
          <BigStat valeur={p.valeur} decimales={p.decimales} prefixe={p.prefixe} suffixe={p.suffixe} legende={p.legende} source={p.source} couleur={p.couleur} police={p.police} />
        </AbsoluteFill>
      );
    case 'parallaxe':
      return <ParallaxPlate fond={DOSSIER + p.fond} sujet={DOSSIER + p.sujet} mouvement={p.mouvement} foyer={p.foyer} />;
    case '3d':
      return <Lunettes3D eclate={p.eclate} rassemble={p.rassemble} monture={p.monture} verres={p.verres} total={p.total} source={p.source} />;
    case 'courbe':
      return <LineChart titre={p.titre} points={p.points} min={p.min} max={p.max} unite={p.unite} source={p.source} trace={p.trace} final={p.final} apparitions={p.apparitions} />;
    case 'carton':
      return <Carton mots={p.mots} police={p.police} anim={p.anim} taille={p.taille} photo={p.photo ? DOSSIER + p.photo : undefined} alignement={p.alignement} />;
    case 'abonnement':
      return <Abonnement lignesA={p.lignesA} clic={p.clic} />;
    case 'ecranfin':
      return <EcranFin logo={p.logo ? DOSSIER + p.logo : undefined} />;
    case 'ticket':
      return <Receipt titre={p.titre} sous={p.sous} lignes={p.lignes} source={p.source} />;
    case 'carte':
      return <MapCountries zone={p.zone} pays={p.pays ?? []} points={p.points} titre={p.titre} source={p.source} projection={p.projection} />;
    case 'frise':
      return <Frise debut={p.anDebut} fin={p.anFin} evenements={p.evenements} titre={p.titre} source={p.source} />;
    case 'route':
      return <RouteChain etapes={p.etapes} groupe={p.groupe} source={p.source} />;
    case 'anneaux':
      return <Anneaux anneaux={p.anneaux} source={p.source} />;
    case 'mur':
      return <NameWall titre={p.titre} noms={p.noms} source={p.source} />;
    case 'stats':
      return <Stats3 stats={p.stats} titre={p.titre} source={p.source} />;
    case 'titre':
      return <TitleCard titre={p.titre} sous={p.sous} />;
    case 'globe':
      return <Globe cles={p.cles} routes={p.routes} etiquettes={p.etiquettes} />;
    case 'punch':
      return <TextPunch mots={p.mots} />;
    case 'dateline':
      return <DatelineCard lignes={p.lignes} taille={p.taille} />;
    case 'document':
      return <DocumentCapture src={DOSSIER + p.src} ratio={p.ratio} lignes={p.lignes} etapes={p.etapes} source={p.source} cercle={p.cercle} largeurSrc={p.largeurSrc} />;
    case 'pile':
      return <StackBar tranches={p.tranches} total={p.total} perte={p.perte} source={p.source} />;
    case 'compare':
      return <Compare titre={p.titre} barres={p.barres} max={p.max} source={p.source} format={p.format} decimales={p.decimales} />;
    case 'fin':
      return <EndCard titre={p.titre} sources={p.sources} />;
    case 'billet':
      return <Billet titre={p.titre} sous={p.sous} lignes={p.lignes} prefixe={p.prefixe} libelleTotal={p.libelleTotal} totalA={p.totalA} talon={p.talon} />;
    case 'neon':
      return <Neon lignes={p.lignes} sous={p.sous} />;
    case 'file':
      return <FileAttente etapes={p.etapes} bots={p.bots} gel={p.gel} />;
    case 'tripledip':
      return <TripleDip etapes={p.etapes} caisse={p.caisse} titre={p.titre} />;
    case 'volant':
      return <Volant segments={p.segments} centre={p.centre} rotation={p.rotation} titre={p.titre} />;
    default:
      throw new Error(`type de plan inconnu : ${type}`);
  }
};

const Surcouche: React.FC<{type: string; p: Props}> = ({type, p: brut}) => {
  const p: Props = {...brut, source: undefined};
  switch (type) {
    case 'kicker':
      return <Kicker numero={p.numero} titre={p.titre} duree={p.duree} />;
    case 'lowerthird':
      return <LowerThird nom={p.nom} fonction={p.fonction} source={p.source} />;
    case 'chips':
      return <Chips noms={p.noms} titre={p.titre} source={p.source} />;
    case 'chapitre':
      return <Chapitre numero={p.numero} titre={p.titre} palette={p.palette} police={p.police} />;
    case 'lumiere':
      return <LightLeak graine={p.graine} />;
    case 'flash':
      return <Flash />;
    case 'projecteurs':
      return <Projecteurs graine={p.graine} intensite={p.intensite} />;
    case 'setlist':
      return <Setlist numero={p.numero} titre={p.titre} pistes={p.pistes} actif={p.actif} />;
    case 'bracelet':
      return <Bracelet nom={p.nom} fonction={p.fonction} />;
    case 'source':
      return null;
    default:
      throw new Error(`type de surcouche inconnu : ${type}`);
  }
};

type Transition = 'fondu' | 'zoom' | 'glisse' | 'coupe';
const GLISSE = Easing.bezier(0.75, 0, 0.2, 1);

/**
 * Un plan et ses deux transitions. Entrée : fondu, zoom traversant (l'image arrive de trop près, floue),
 * panoramique filé (glisse, avec flou de mouvement) ou coupe franche. Sortie : si le plan suivant
 * glisse, celui-ci est poussé hors champ dans le même mouvement. `secousses` : images où la caméra encaisse.
 */
const Plan: React.FC<{
  transition: Transition; duree: number; sens: number; sortie: number; sortieGlisse: boolean; sortieSens: number;
  secousses: number[]; children: React.ReactNode;
}> = ({transition, duree, sens, sortie, sortieGlisse, sortieSens, secousses, children}) => {
  const frame = useCurrentFrame();
  const t = duree > 0 ? Math.min(1, frame / duree) : 1;
  let x = 0, echelle = 1, flou = 0, opacite = 1;
  if (transition === 'fondu') opacite = t;
  if (transition === 'zoom') {
    const e = Easing.out(Easing.cubic)(t);
    echelle = interpolate(e, [0, 1], [1.35, 1]); flou = interpolate(e, [0, 1], [14, 0]); opacite = interpolate(t, [0, 0.4], [0, 1], {extrapolateRight: 'clamp'});
  }
  if (transition === 'glisse') x = sens * 1920 * (1 - GLISSE(t));
  if (sortieGlisse && frame >= sortie) x -= sortieSens * 1920 * GLISSE(Math.min(1, (frame - sortie) / 9));
  let dx = 0, dy = 0;
  for (const a of secousses) {
    const age = frame - a;
    if (age < 0 || age > 16) continue;
    const amp = 22 * Math.exp(-age / 5);
    dx += noise2D('sx' + a, age * 0.9, 0) * amp; dy += noise2D('sy' + a, 0, age * 0.9) * amp;
  }
  const enMouvement = (transition === 'glisse' && frame < duree + 1) || (sortieGlisse && frame >= sortie - 1);
  const contenu = (
    <AbsoluteFill style={{opacity: opacite, transform: `translate(${x + dx}px, ${dy}px) scale(${echelle * (secousses.length ? 1.03 : 1)})`,
      filter: flou > 0.2 ? `blur(${flou}px)` : undefined}}>
      {children}
    </AbsoluteFill>
  );
  return enMouvement ? <CameraMotionBlur shutterAngle={200} samples={8}>{contenu}</CameraMotionBlur> : contenu;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Timeline = any;

/** La palette du plan devient des variables CSS, lues par les composants (fond, texte, accent). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let PALETTES: Record<string, any> = palettes;
const varsPalette = (nom?: Palette | string): React.CSSProperties => {
  const pal = PALETTES[nom ?? 'nuit'] ?? PALETTES.nuit;
  return {['--fond' as string]: pal.fond, ['--encre' as string]: pal.encre, ['--sourdine' as string]: pal.sourdine, ['--accent' as string]: pal.accent} as React.CSSProperties;
};

/**
 * Moteur de montage générique : lit une timeline (plans, surcouches, sons, voix, musiques) et la joue.
 * Chaque vidéo n'est plus qu'un JSON produit par son timeline.py.
 */
export const Montage: React.FC<{timeline: Timeline; dossier: string}> = ({timeline, dossier}) => {
  const {plans, surcouches, sons, voix, duree} = timeline;
  // Direction artistique propre à la vidéo (règle du 26/09 : jamais le même habillage d'une vidéo à l'autre)
  const DA = timeline.direction ?? {};
  // une police se donne par son rôle dans le kit (« affiche », « grotesk »…) ou par son nom CSS
  const police = (k?: string) => (k ? ((polices as Record<string, string>)[k] ?? k) : undefined);
  PALETTES = {...palettes, ...(DA.palettes ?? {})};
  const racine: React.CSSProperties = {
    ...varsPalette(DA.palette ?? 'nuit'),
    ...(DA.polices ? {['--police-titre' as string]: police(DA.polices.titre), ['--police-corps' as string]: police(DA.polices.corps),
      ['--police-mono' as string]: police(DA.polices.mono)} : {}),
  } as React.CSSProperties;
  const musiques: {src: string; debut: number; fin: number; volume: number; depart?: number}[] =
    timeline.musiques ?? [{src: timeline.musique.src, debut: 0, fin: duree, volume: timeline.musique.volume}];
  const coupes: [number, number][] = timeline.coupes ?? timeline.musique?.coupes ?? [];
  const enveloppe = (f: number) => {
    let v = 1;
    for (const [a, b] of coupes) v *= interpolate(f, [a - 9, a, b, b + 15], [1, 0, 0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
    return v;
  };
  return (
    <AbsoluteFill style={{backgroundColor: '#000', ...racine}}>
      <Grade reglage={DA.etalonnage}>
        {plans.map((pl: Props, i: number) => {
          const suivant = plans[i + 1];
          const fin = suivant ? suivant.debut + suivant.fondu : duree;
          const debutPlan = Math.max(0, pl.debut);
          return (
            <Sequence key={i} from={debutPlan} durationInFrames={Math.max(1, fin - debutPlan)} name={`${i} ${pl.type}`}>
              <Plan transition={pl.transition as Transition} duree={i === 0 ? 15 : pl.fondu} sens={pl.sens}
                sortie={suivant ? suivant.debut - debutPlan : 1e9} sortieGlisse={suivant?.transition === 'glisse'}
                sortieSens={suivant?.sens ?? 1} secousses={pl.secousses}>
                <AbsoluteFill style={varsPalette(pl.props?.palette)}>
                  <Fond type={pl.type} p={pl.props as Props} DOSSIER={dossier} />
                </AbsoluteFill>
              </Plan>
            </Sequence>
          );
        })}
      </Grade>
      {surcouches.map((s: Props, i: number) => (
        <Sequence key={`s${i}`} from={s.debut} durationInFrames={Math.max(1, s.fin - s.debut)} name={`sur ${s.type}`}>
          <AbsoluteFill style={s.props?.palette ? varsPalette(s.props.palette) : undefined}>
            <Surcouche type={s.type} p={s.props as Props} />
          </AbsoluteFill>
        </Sequence>
      ))}
      {DA.grain === false ? null : <FilmGrain intensite={DA.grain ?? 0.07} />}
      <Sequence from={voix.a}><Audio src={staticFile(dossier + voix.src)} /></Sequence>
      {musiques.map((m, i) => (
        <Sequence key={`m${i}`} from={m.debut} durationInFrames={Math.max(1, m.fin - m.debut)} name={`musique ${i}`}>
          <Audio src={staticFile(dossier + m.src)} startFrom={Math.round((m.depart ?? 0) * 30)}
            volume={(f) => m.volume * enveloppe(f + m.debut) *
              interpolate(f, [0, 45, m.fin - m.debut - 60, m.fin - m.debut], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})} />
        </Sequence>
      ))}
      {sons.map((s: Props, i: number) => (
        <Sequence key={`a${i}`} from={s.a}><Audio src={staticFile(dossier + s.src)} volume={s.volume} /></Sequence>
      ))}
    </AbsoluteFill>
  );
};
