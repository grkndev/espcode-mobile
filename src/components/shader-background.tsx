import { type ExpoWebGLRenderingContext } from 'expo-gl';
import { useCallback, useEffect, useRef } from 'react';
import { View } from 'react-native';

import { GLView } from '@/components/styled';

// Live plasma shader — same GLSL as the approved web datasheet, ported to
// expo-gl's WebGL1 context. "SIG//3D3BFF" ultramarine plasma over a
// datasheet-stock base color.
//
// precision is `highp`, not `mediump`: on many Android GPUs mediump doesn't
// have enough range for the accumulated sin() terms, which quantizes `n`
// into visible banding. There is deliberately no contour/band term at all —
// an alpha-based "transparent line" cutout was tried, but expo-gl's native
// GLView doesn't composite its alpha channel against the RN view tree, so
// the cutout just rendered as solid dark instead of see-through. Simplest
// correct fix: don't draw the contour lines in the first place.
const VERTEX = `attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}`;
const FRAGMENT = `precision highp float;uniform float t;uniform vec2 r;
void main(){
  vec2 uv=gl_FragCoord.xy/r; vec2 q=uv*vec2(r.x/r.y,1.);
  float v=sin(q.x*4.2+t*.5)+sin((q.x+q.y)*3.1-t*.42)+sin(length(q-vec2(.3,1.4))*5.0-t*.6)+sin(q.y*3.7+t*.35);
  float n=v*.25+.5;
  vec3 stock=vec3(.051,.067,.078);
  vec3 sig=vec3(.239,.231,1.0);
  vec3 lite=vec3(.561,.557,1.0);
  vec3 c=mix(stock,sig,smoothstep(.25,.85,n)*.85);
  c=mix(c,lite,smoothstep(.72,1.0,n)*.55);
  c*=1.0-.35*distance(uv,vec2(.5,.62));
  gl_FragColor=vec4(c,1.0);
}`;

// expo-router's <TabSlot> keeps every visited tab mounted (just hidden), so
// without `active` every ShaderBackground on every visited tab would keep
// rendering forever in the background — that's the jitter. Pass
// `active={useIsFocused()}` from the owning screen so only the visible
// screen's shader actually runs.
export function ShaderBackground({ className, active = true }: { className?: string; active?: boolean }) {
  const rafRef = useRef<number | null>(null);
  const mountedRef = useRef(true);
  const activeRef = useRef(active);
  const drawRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  useEffect(() => {
    activeRef.current = active;
    if (active && rafRef.current == null && drawRef.current) {
      rafRef.current = requestAnimationFrame(drawRef.current);
    }
  }, [active]);

  const onContextCreate = useCallback((gl: ExpoWebGLRenderingContext) => {
    const compile = (type: number, src: string) => {
      const shader = gl.createShader(type)!;
      gl.shaderSource(shader, src);
      gl.compileShader(shader);
      return shader;
    };

    const program = gl.createProgram()!;
    gl.attachShader(program, compile(gl.VERTEX_SHADER, VERTEX));
    gl.attachShader(program, compile(gl.FRAGMENT_SHADER, FRAGMENT));
    gl.linkProgram(program);
    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);

    const posLoc = gl.getAttribLocation(program, 'p');
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    const tLoc = gl.getUniformLocation(program, 't');
    const rLoc = gl.getUniformLocation(program, 'r');

    const start = Date.now();

    const draw = () => {
      if (!mountedRef.current) return;
      gl.uniform1f(tLoc, (Date.now() - start) / 1000);
      // re-read drawingBufferWidth/Height each frame instead of once at
      // context-create time — on first mount layout can still be settling,
      // and a stale size here stretches/tears the plasma.
      gl.uniform2f(rLoc, gl.drawingBufferWidth, gl.drawingBufferHeight);
      gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.endFrameEXP();
      rafRef.current = activeRef.current ? requestAnimationFrame(draw) : null;
    };
    drawRef.current = draw;

    if (activeRef.current) {
      rafRef.current = requestAnimationFrame(draw);
    }
  }, []);

  return (
    <View className={`absolute inset-0 ${className ?? ''}`} pointerEvents="none">
      <GLView className="absolute inset-0" onContextCreate={onContextCreate} />
    </View>
  );
}
