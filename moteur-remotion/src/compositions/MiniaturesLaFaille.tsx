import {loadFont as chargerTitre} from '@remotion/google-fonts/Anton';
import {ThreeCanvas} from '@remotion/three';
import {AbsoluteFill, random} from 'remotion';
import * as THREE from 'three';
import {Camera, Reflets, Salle} from './BinanceAccroche';

/** Miniatures de La Faille : grands objets, une idée, texte court en capitales, lisibles à 168 px. */
const {fontFamily: ANTON} = chargerTitre();
const JAUNE = '#FFD400', ROUGE = '#E0231A';

const Texte: React.FC<{l1: string; l2?: string; bas?: boolean}> = ({l1, l2, bas}) => (
  <div style={{position: 'absolute', left: 40, [bas ? 'bottom' : 'top']: 34, fontFamily: ANTON, lineHeight: 1.02, textShadow: '0 6px 0 #000, 0 0 30px rgba(0,0,0,.8)'}}>
    <div style={{fontSize: 118, color: '#fff'}}>{l1}</div>
    {l2 ? <div style={{fontSize: 118, color: JAUNE}}>{l2}</div> : null}
  </div>
);

const Etiquette: React.FC<{x: string; c: string; style: React.CSSProperties}> = ({x, c, style}) => (
  <div style={{position: 'absolute', background: c, color: '#fff', fontFamily: ANTON, fontSize: 62, padding: '4px 22px', ...style}}>{x}</div>
);

const Coffre: React.FC<{vide?: number}> = ({vide = 0}) => (
  <ThreeCanvas width={1280} height={720} shadows>
    <Camera p={[1.6, 2.2, 7]} c={[-0.5, 0.35, -0.8]} />
    <Salle vidange={vide} ouverture={1.2} alarme={1} />
    <pointLight position={[1, 3, 3]} intensity={70} color="#ffe2b0" />
  </ThreeCanvas>
);

/** Binance A : le coffre et le chiffre. */
export const MiniBinanceA: React.FC = () => <AbsoluteFill><Coffre /><Texte l1="6,3 MILLIARDS" l2="EN 20 MIN" /></AbsoluteFill>;

/** Binance B : le contraste, une seule transaction contre un coffre vidé. */
export const MiniBinanceB: React.FC = () => <AbsoluteFill>
  <Coffre vide={0.55} />
  <Etiquette x="1 TRANSACTION" c={ROUGE} style={{left: 40, top: 40}} />
  <Texte l1="6,3 MILLIARDS" bas />
</AbsoluteFill>;

/** Binance C : le chrono. */
export const MiniBinanceC: React.FC = () => <AbsoluteFill style={{background: '#08090b', alignItems: 'center', justifyContent: 'center'}}>
  <Coffre vide={1} />
  <AbsoluteFill style={{background: 'rgba(0,0,0,.35)'}} />
  <div style={{position: 'absolute', fontFamily: ANTON, fontSize: 330, color: JAUNE, textShadow: '0 10px 0 #000'}}>3:24</div>
  <Etiquette x="BINANCE VIDÉ" c={ROUGE} style={{left: 40, bottom: 40}} />
</AbsoluteFill>;

const Usine: React.FC = () => (
  <ThreeCanvas width={1280} height={720}>
    <color attach="background" args={['#c9562f']} />
    <Reflets force={0.2} />
    <Camera p={[-6, 2.6, 19]} c={[0, 6.6, 0]} fov={44} />
    <ambientLight intensity={1} color="#ffc09a" />
    <directionalLight position={[-14, 8, 10]} intensity={3} color="#ffb070" />
    <mesh rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[120, 90]} /><meshStandardMaterial color="#1a1412" /></mesh>
    <mesh position={[1, 2.4, 0]}><boxGeometry args={[14, 4.8, 6]} /><meshStandardMaterial color="#2a2422" /></mesh>
    {[[-3.5, 6], [0, 7.4], [3.5, 6.4]].map(([x, h]) => <mesh key={x} position={[x, 4.8 + h / 2, -1]}><cylinderGeometry args={[0.5, 0.72, h, 28]} /><meshStandardMaterial color="#3a322e" /></mesh>)}
    {Array.from({length: 70}, (_, i) => {
      const t = random(`t${i}`);
      const base = [[-3.5, 10.8], [0, 12.2], [3.5, 11.2]][i % 3];
      return <mesh key={i} position={[base[0] + t * 7 + (random(`x${i}`) - 0.5) * (1 + t * 6), base[1] + t * 14, -1]} scale={0.6 + t * 3.4}>
        <sphereGeometry args={[1, 14, 14]} /><meshStandardMaterial color="#514440" transparent opacity={(1 - t) * 0.5} depthWrite={false} />
      </mesh>;
    })}
    {Array.from({length: 26}, (_, i) => <mesh key={`b${i}`} position={[6 + random(`bx${i}`) * 8, random(`by${i}`) * 11, 2 + random(`bz${i}`) * 2]} rotation={new THREE.Euler(random(`a${i}`), random(`c${i}`), 0)}><boxGeometry args={[1.1, 0.04, 0.55]} /><meshStandardMaterial color="#d8a12a" metalness={0.9} roughness={0.3} /></mesh>)}
  </ThreeCanvas>
);

/** Carbone A : l'usine, le chiffre. */
export const MiniCarboneA: React.FC = () => <AbsoluteFill><Usine /><Texte l1="1,6 MILLIARD" l2="VOLÉ À LA FRANCE" /></AbsoluteFill>;

/** Carbone B : l'arnaque tient sur une facture. */
export const MiniCarboneB: React.FC = () => <AbsoluteFill style={{background: '#14161a', alignItems: 'center', justifyContent: 'center'}}>
  <div style={{position: 'absolute', left: 90, top: 90, width: 720, transform: 'rotate(-3deg)', background: '#F6F2E9', padding: '30px 44px', fontFamily: 'monospace', fontSize: 46, color: '#111', boxShadow: '0 30px 60px #000'}}>
    <div style={{display: 'flex', justifyContent: 'space-between'}}><span>QUOTAS</span><span>100 €</span></div>
    <div style={{display: 'flex', justifyContent: 'space-between', background: ROUGE, color: '#fff', margin: '18px -14px', padding: '12px 14px', fontWeight: 700}}><span>TVA</span><span>19,60 €</span></div>
  </div>
  <div style={{position: 'absolute', right: 60, top: 270, fontFamily: ANTON, fontSize: 200, color: JAUNE, textShadow: '0 8px 0 #000'}}>1,6 Md€</div>
  <Texte l1="UNE SEULE LIGNE" bas />
</AbsoluteFill>;

/** Carbone C : le casse du CO2. */
export const MiniCarboneC: React.FC = () => <AbsoluteFill><Usine /><AbsoluteFill style={{background: 'rgba(0,0,0,.3)'}} /><Etiquette x="8 MOIS" c={ROUGE} style={{left: 40, top: 40}} /><Texte l1="LE CASSE DU CO2" bas /></AbsoluteFill>;
