// @ts-nocheck — photo de profil de « T'es bien rentrée ? » (TikTok, affichée en rond, lisible dès 100 px).
// Inès en gros plan, même personnage toon que dans les épisodes : visage éclairé en bleu par son téléphone,
// lampadaire orange en contre-jour, et loin derrière elle, flou, l'homme en capuche sous un réverbère.
import {ThreeCanvas} from '@remotion/three';
import {useFrame, useThree} from '@react-three/fiber';
import React from 'react';
import {AbsoluteFill, useVideoConfig} from 'remotion';
import * as THREE from 'three';
import {G, halo, matContour, Perso, plat, STYLE_HOMME} from './SuiveurP1';

const STYLE_INES = {peau: '#e9b48e', haut: '#1d1d26', bas: '#2a2a35', chaussures: '#f2f2f2', cheveux: '#3a2418', coiffure: 'longs', boucles: true, levres: '#a8323e'};

const Camera: React.FC = () => {
  const {camera, gl, scene} = useThree();
  // priorité 1 = R3F ne rend plus tout seul : on rend nous-mêmes, comme dans les épisodes
  useFrame(() => {
    const c = camera as THREE.PerspectiveCamera;
    c.fov = 26;
    c.position.set(0.3, 1.56, 2.0);
    c.lookAt(-0.12, 1.5, 0);
    matContour.uniforms.epaisseur.value = 0.0105 * 0.3; // objectif serré : contour aminci pour garder le même trait qu'en fisheye
    c.updateProjectionMatrix();
    gl.render(scene, c);
  }, 1);
  return null;
};

const Scene: React.FC = () => (
  <>
    <ambientLight intensity={0.5} color={'#6a74b0'} />
    {/* la lumière du téléphone, par en dessous, bleue */}
    <pointLight position={[0.05, 1.18, 0.45]} intensity={2.4} decay={0} color={'#7fb6ff'} />
    {/* le lampadaire, derrière à droite, orange */}
    <directionalLight position={[-2, 3, -2]} intensity={1.3} color={'#ffa04a'} />
    <Perso p={[0, 0, 0]} rotY={0.12} style={STYLE_INES} tete={[0.18, 0.04]} regard={[0.9, 0.1]} sourcils={0.9} bouche={0.25} cligne={1}
      brasD={[-0.05, 0.08, -0.25]} brasG={[-0.05, 0.08, -0.25]} />
    {/* l'homme en capuche, loin derrière, sous son réverbère */}
    <Perso p={[-2.75, 0, -6.5]} rotY={0.35} style={{...STYLE_HOMME, peau: '#231c26', haut: '#14141a', bas: '#101016', chaussures: '#3a3a44'}} tete={[0.3, 0.12]} cligne={0.08} />
    <mesh position={[-2.75, 0.02, -6.4]} rotation={[-Math.PI / 2, 0, 0]} geometry={G.disque} scale={1.2} material={halo('#ffa850', 0.1)} />
  </>
);

export const RentreeAvatar: React.FC = () => {
  const {width, height} = useVideoConfig();
  return (
    <AbsoluteFill style={{background: 'radial-gradient(circle at 17% 40%, #ffb05a 0%, #c0603e 7%, #5a2c4a 20%, #1d1a40 42%, #070918 100%)'}}>
      <ThreeCanvas width={width} height={height} gl={{antialias: true, alpha: true, toneMapping: THREE.NoToneMapping}} flat camera={{fov: 30}}>
        <Camera />
        <Scene />
      </ThreeCanvas>
    </AbsoluteFill>
  );
};
