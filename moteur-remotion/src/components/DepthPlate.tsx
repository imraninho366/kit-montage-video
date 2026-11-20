import {useEffect, useLayoutEffect, useRef, useState} from 'react';
import {AbsoluteFill, continueRender, delayRender, interpolate, staticFile, useCurrentFrame, useVideoConfig, Easing} from 'remotion';

/**
 * Parallaxe 2,5D continue : chaque pixel se déplace selon sa profondeur (carte Depth Anything,
 * produite par usine/outils/parallaxe/couches.py). Pas de calques découpés, donc pas de couture
 * sur les sols ni les murs. Le premier plan bouge plus que le fond, comme une vraie caméra.
 */
export type MouvementProfondeur = {
  zoom?: [number, number]; // zoom global début → fin (≥ 1.08 pour ne jamais voir le bord)
  pousse?: [number, number]; // zoom supplémentaire du premier plan (profondeur 1) début → fin
  decale?: [[number, number], [number, number]]; // décalage du premier plan (en fraction d'image) début → fin
  foyer?: [number, number]; // point vers lequel la caméra avance (0-1)
};

const VERT = `attribute vec2 p; varying vec2 uv; void main(){ uv = p * 0.5 + 0.5; uv.y = 1.0 - uv.y; gl_Position = vec4(p, 0.0, 1.0); }`;
const FRAG = `precision highp float; varying vec2 uv;
uniform sampler2D img; uniform sampler2D dep;
uniform float zoom; uniform float pousse; uniform vec2 decale; uniform vec2 foyer;
void main(){
  vec2 s = uv;
  for (int i = 0; i < 8; i++) {
    float d = texture2D(dep, s).r;
    s = foyer + (uv - decale * d - foyer) / (zoom + pousse * d);
  }
  gl_FragColor = texture2D(img, clamp(s, 0.0, 1.0));
}`;

const charger = (src: string) =>
  new Promise<HTMLImageElement>((ok, ko) => {
    const i = new Image();
    i.onload = () => ok(i);
    i.onerror = ko;
    i.src = staticFile(src);
  });

export const DepthPlate: React.FC<{image: string; profondeur: string; mouvement?: MouvementProfondeur; avancement?: number}> = ({
  image, profondeur, mouvement = {}, avancement,
}) => {
  const {zoom = [1.1, 1.16], pousse = [0, 0.1], decale = [[0, 0], [0, 0]], foyer = [0.5, 0.55]} = mouvement;
  const frame = useCurrentFrame();
  const {durationInFrames, width, height} = useVideoConfig();
  const canvas = useRef<HTMLCanvasElement>(null);
  const gl = useRef<{ctx: WebGLRenderingContext; prog: WebGLProgram} | null>(null);
  const libere = useRef(false);
  const [pret, setPret] = useState(false);
  const [poignee] = useState(() => delayRender(`profondeur ${image}`));

  useEffect(() => {
    Promise.all([charger(image), charger(profondeur)]).then(([im, dp]) => {
      const ctx = canvas.current!.getContext('webgl', {preserveDrawingBuffer: true})!;
      const shader = (type: number, src: string) => {
        const s = ctx.createShader(type)!;
        ctx.shaderSource(s, src);
        ctx.compileShader(s);
        return s;
      };
      const prog = ctx.createProgram()!;
      ctx.attachShader(prog, shader(ctx.VERTEX_SHADER, VERT));
      ctx.attachShader(prog, shader(ctx.FRAGMENT_SHADER, FRAG));
      ctx.linkProgram(prog);
      ctx.useProgram(prog);
      ctx.bindBuffer(ctx.ARRAY_BUFFER, ctx.createBuffer());
      ctx.bufferData(ctx.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), ctx.STATIC_DRAW);
      const loc = ctx.getAttribLocation(prog, 'p');
      ctx.enableVertexAttribArray(loc);
      ctx.vertexAttribPointer(loc, 2, ctx.FLOAT, false, 0, 0);
      [im, dp].forEach((source, n) => {
        ctx.activeTexture(ctx.TEXTURE0 + n);
        ctx.bindTexture(ctx.TEXTURE_2D, ctx.createTexture());
        ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MIN_FILTER, ctx.LINEAR);
        ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MAG_FILTER, ctx.LINEAR);
        ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_WRAP_S, ctx.CLAMP_TO_EDGE);
        ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_WRAP_T, ctx.CLAMP_TO_EDGE);
        ctx.texImage2D(ctx.TEXTURE_2D, 0, ctx.RGBA, ctx.RGBA, ctx.UNSIGNED_BYTE, source);
      });
      ctx.uniform1i(ctx.getUniformLocation(prog, 'img'), 0);
      ctx.uniform1i(ctx.getUniformLocation(prog, 'dep'), 1);
      gl.current = {ctx, prog};
      setPret(true);
    });
  }, [image, profondeur]);

  useLayoutEffect(() => {
    if (!pret || !gl.current) return;
    const {ctx, prog} = gl.current;
    // avancement : la composition pilote elle-même la caméra (accélérations, plongées)
    const p = avancement ?? interpolate(frame, [0, durationInFrames], [0, 1], {
      extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.sin),
    });
    const u = (n: string) => ctx.getUniformLocation(prog, n);
    const mix = (a: number, b: number) => a + (b - a) * p;
    ctx.viewport(0, 0, width, height);
    ctx.uniform1f(u('zoom'), mix(zoom[0], zoom[1]));
    ctx.uniform1f(u('pousse'), mix(pousse[0], pousse[1]));
    ctx.uniform2f(u('decale'), mix(decale[0][0], decale[1][0]), mix(decale[0][1], decale[1][1]));
    ctx.uniform2f(u('foyer'), foyer[0], foyer[1]);
    ctx.drawArrays(ctx.TRIANGLE_STRIP, 0, 4);
    if (!libere.current) {
      libere.current = true;
      continueRender(poignee);
    }
  }, [frame, pret]);

  return (
    <AbsoluteFill style={{backgroundColor: '#000'}}>
      <canvas ref={canvas} width={width} height={height} style={{width: '100%', height: '100%'}} />
    </AbsoluteFill>
  );
};
