"use client";

import { useEffect, useRef } from "react";
import styles from "./OuiFlare.module.css";

// Rim lighting and scattering adapted from Vercel's MIT-licensed example:
// https://vgpu.sh/examples/nextjs-flare (see flare-LICENSE.txt).
const vertex = `#version 300 es
in vec2 position;
out vec2 uv;
void main(){uv=position*.5+.5;gl_Position=vec4(position,0.,1.);}`;
const fragment = `#version 300 es
precision highp float;
in vec2 uv;
out vec4 color;
uniform sampler2D glyph;
uniform vec2 resolution;
uniform vec2 light;
uniform float time;
uniform float pulse;
uniform float dark;
float noise(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float rim(vec2 p){return texture(glyph,clamp(p,vec2(0.),vec2(1.))).r;}
void main(){
  vec2 aspect=vec2(resolution.x/resolution.y,1.);
  vec2 px=1./resolution;
  vec2 delta=(uv-light)*(.88+pulse*.08)/48.;
  vec2 at=uv-delta*noise(gl_FragCoord.xy+floor(time*30.));
  float rays=0.;float weight=1.;float total=0.;
  for(int i=0;i<48;i++){
    at-=delta;
    float sampleRim=mix(rim(at),texture(glyph,clamp(at,vec2(0.),vec2(1.))).g,.85);
    float proximity=exp(-length((at-light)*aspect)*2.6);
    rays+=sampleRim*weight*(.25+proximity*2.4);
    total+=weight;weight*=.95;
  }
  rays=rays/total*4.2;
  float edge=rim(uv);
  float soft=(rim(uv+px*2.)+rim(uv-px*2.)+rim(uv+vec2(px.x,-px.y)*2.)+rim(uv-vec2(px.x,-px.y)*2.))*.25;
  float fill=texture(glyph,uv).b;
  float bevel=max(0.,fill-texture(glyph,uv+px*3.).b);
  float mask=smoothstep(0.,.18,uv.x)*smoothstep(0.,.18,1.-uv.x)*smoothstep(0.,.2,uv.y)*smoothstep(0.,.2,1.-uv.y);
  float lettering=clamp(fill*.96+edge*.96+soft*.03+bevel*.02,0.,1.);
  float beam=(1.-exp(-rays*1.5))*mask*(1.+pulse*.3);
  vec3 spectral=.5+.5*cos(uv.x*4.+uv.y*2.+vec3(0.,2.1,4.2));
  vec3 tint=mix(vec3(.58,.64,.8),spectral,.45);
  vec3 ink=mix(vec3(.085),vec3(.88),dark);
  float glow=clamp(beam*mix(.68,.62,dark),0.,1.);
  float alpha=lettering+glow*(1.-lettering);
  vec3 rgb=(ink*lettering+tint*glow*(1.-lettering))/max(alpha,.0001);
  color=vec4(rgb,alpha);
}`;

export function OuiFlare() {
  const host = useRef<HTMLButtonElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const button = host.current,
      surface = canvas.current;
    if (!button || !surface) return;
    const gl = surface.getContext("webgl2", {
      alpha: true,
      premultipliedAlpha: false,
      antialias: false,
      powerPreference: "low-power",
    });
    if (!gl) return;
    const compile = (type: number, source: string) => {
      const shader = gl.createShader(type)!;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };
    const vs = compile(gl.VERTEX_SHADER, vertex),
      fs = compile(gl.FRAGMENT_SHADER, fragment);
    if (!vs || !fs) {
      if (vs) gl.deleteShader(vs);
      if (fs) gl.deleteShader(fs);
      return;
    }
    const program = gl.createProgram()!;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    gl.deleteShader(vs);
    gl.deleteShader(fs);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      gl.deleteProgram(program);
      return;
    }
    gl.useProgram(program);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW,
    );
    const position = gl.getAttribLocation(program, "position");
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const locations = Object.fromEntries(
      ["resolution", "light", "time", "pulse", "dark"].map((key) => [
        key,
        gl.getUniformLocation(program, key),
      ]),
    );
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    let visible = false,
      disposed = false,
      contextLost = false,
      raf = 0,
      last = 0,
      phase = 3.8,
      pulseAt = -10000;
    let pointer: number[] | null = null;
    let light = [0.58, 0.68];
    const raster = document.createElement("canvas");
    const context = raster.getContext("2d")!;
    const draw = (now: number) => {
      if (disposed || contextLost || !surface.width) return;
      const reduced = motion.matches;
      const target = pointer ?? [
        0.5 + Math.cos(phase * 0.32) * 0.24,
        0.5 + Math.sin(phase * 0.27) * 0.22,
      ];
      light = light.map((v, i) => v + (target[i] - v) * (reduced ? 1 : 0.09));
      const pulse = reduced ? 0 : Math.max(0, 1 - (now - pulseAt) / 1600);
      gl.uniform2f(locations.resolution, surface.width, surface.height);
      gl.uniform2f(locations.light, light[0], light[1]);
      gl.uniform1f(locations.time, reduced ? 0 : phase);
      gl.uniform1f(locations.pulse, pulse * pulse);
      gl.uniform1f(locations.dark, document.documentElement.dataset.theme === "dark" ? 1 : 0);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      button.dataset.ready = "true";
    };
    const resize = () => {
      const box = button.getBoundingClientRect();
      if (!box.width || !box.height) return;
      const ratio = Math.min(devicePixelRatio, 1.5, 1440 / box.width);
      surface.width = raster.width = Math.round(box.width * ratio);
      surface.height = raster.height = Math.round(box.height * ratio);
      const w = raster.width,
        h = raster.height;
      gl.viewport(0, 0, w, h);
      context.fillStyle = "#000";
      context.fillRect(0, 0, w, h);
      context.font = `600 ${Math.min(w * 0.235, h * 0.55)}px ${getComputedStyle(button).fontFamily}`;
      context.textAlign = "center";
      context.textBaseline = "alphabetic";
      const metrics = context.measureText("OUI-1");
      const baseline =
        h / 2 + (metrics.actualBoundingBoxAscent - metrics.actualBoundingBoxDescent) / 2;
      context.fillStyle = "#0000ff";
      context.fillText("OUI-1", w / 2, baseline);
      context.strokeStyle = "#ff0000";
      context.lineWidth = Math.max(1.2, ratio * 1.25);
      context.lineJoin = "round";
      context.strokeText("OUI-1", w / 2, baseline);
      context.globalCompositeOperation = "lighter";
      context.strokeStyle = "#00ff00";
      context.filter = `blur(${ratio * 2.5}px)`;
      context.strokeText("OUI-1", w / 2, baseline);
      context.filter = "none";
      context.globalCompositeOperation = "source-over";
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, raster);
      draw(performance.now());
    };
    const tick = (now: number) => {
      raf = 0;
      if (!visible || document.hidden || motion.matches || disposed || contextLost) return;
      if (now - last >= 33) {
        phase += Math.min((now - last) / 1000, 0.05);
        last = now;
        draw(now);
      }
      raf = requestAnimationFrame(tick);
    };
    const resume = () => {
      cancelAnimationFrame(raf);
      raf = 0;
      draw(performance.now());
      if (visible && !document.hidden && !motion.matches && !contextLost) {
        last = performance.now();
        raf = requestAnimationFrame(tick);
      }
    };
    const move = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      const box = button.getBoundingClientRect();
      pointer = [
        (event.clientX - box.left) / box.width,
        1 - (event.clientY - box.top) / box.height,
      ];
      if (motion.matches) draw(performance.now());
    };
    const leave = () => {
      pointer = null;
    };
    const click = () => {
      pulseAt = performance.now();
      if (motion.matches) {
        light = light[0] < 0.5 ? [0.75, 0.7] : [0.25, 0.35];
        pointer = light;
        draw(performance.now());
      }
    };
    const lost = (event: Event) => {
      event.preventDefault();
      contextLost = true;
      cancelAnimationFrame(raf);
      button.dataset.ready = "false";
    };
    const observer = new ResizeObserver(resize);
    observer.observe(button);
    const intersection = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      resume();
    });
    intersection.observe(button);
    const theme = new MutationObserver(() => draw(performance.now()));
    theme.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    button.addEventListener("pointermove", move);
    button.addEventListener("pointerleave", leave);
    button.addEventListener("click", click);
    surface.addEventListener("webglcontextlost", lost);
    motion.addEventListener("change", resume);
    document.addEventListener("visibilitychange", resume);
    document.fonts.ready.then(() => {
      if (!disposed) resize();
    });
    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      observer.disconnect();
      intersection.disconnect();
      theme.disconnect();
      button.removeEventListener("pointermove", move);
      button.removeEventListener("pointerleave", leave);
      button.removeEventListener("click", click);
      surface.removeEventListener("webglcontextlost", lost);
      motion.removeEventListener("change", resume);
      document.removeEventListener("visibilitychange", resume);
      gl.deleteTexture(texture);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
    };
  }, []);
  return (
    <button
      ref={host}
      className={styles.flare}
      aria-label="OUI-1: move to guide the light, click to send a pulse"
    >
      <span className={styles.fallback} aria-hidden="true">
        OUI-1
      </span>
      <canvas ref={canvas} aria-hidden="true" />
    </button>
  );
}
