import {useThree} from '@react-three/fiber';
import {ThreeCanvas} from '@remotion/three';
import {AbsoluteFill, useVideoConfig} from 'remotion';
import * as THREE from 'three';
import {Perso} from './decors';

/** Photo de profil du compte ONE LIFE : Ethan en gros plan, liseré « roue de probabilités ». */
const Cam: React.FC = () => {
  const {camera, scene} = useThree();
  scene.background = null;
  const c = camera as THREE.PerspectiveCamera;
  c.position.set(0.55, 1.78, 1.55);
  c.lookAt(0, 1.66, 0);
  c.fov = 30; c.updateProjectionMatrix();
  return null;
};

export const OneLifeProfil: React.FC = () => {
  const {width, height} = useVideoConfig();
  const R = width / 2 - 18;
  const arc = (a0: number, a1: number) => {
    const p = (a: number) => [width / 2 + Math.sin((a * Math.PI) / 180) * R, height / 2 - Math.cos((a * Math.PI) / 180) * R];
    const [x0, y0] = p(a0), [x1, y1] = p(a1);
    return `M${x0},${y0} A${R},${R} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${x1},${y1}`;
  };
  return (
    <AbsoluteFill style={{background: 'radial-gradient(circle at 50% 40%, #ffd36b 0%, #f2994a 55%, #c4532a 100%)'}}>
      <ThreeCanvas width={width} height={height} camera={{fov: 30, near: 0.1, far: 50}} gl={{antialias: true, alpha: true}}>
        <Cam />
        <hemisphereLight args={['#fff6e8', '#7a4a2a', 1.3]} />
        <directionalLight position={[2, 3, 3]} intensity={2.2} />
        <Perso p={[0, 0, 0]} rotY={0.35} humeur="content" teteY={-0.1} />
      </ThreeCanvas>
      <svg width={width} height={height} style={{position: 'absolute', inset: 0}}>
        <path d={arc(0, 92)} stroke="#3ccf7a" strokeWidth={26} fill="none" />
        <path d={arc(92, 355)} stroke="#2a3148" strokeWidth={26} fill="none" />
        <path d={arc(355, 360)} stroke="#ff3b3b" strokeWidth={26} fill="none" />
      </svg>
    </AbsoluteFill>
  );
};
