"use client";

import { useEffect, useRef } from "react";
import styles from "./HalftoneVideo.module.scss";

// Draws a muted video as a halftone dot matrix (after the dithered hero object of sybiosme.com),
// in the theme's yellow and cyan. Dots swell around the pointer. Falls back to the poster without WebGL.
const VERTEX = `#version 300 es
layout(location = 0) in vec2 a_pos;
void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }`;

const FRAGMENT = `#version 300 es
precision highp float;
out vec4 color;
uniform sampler2D u_tex;
uniform vec2 u_res;
uniform vec2 u_video;
uniform vec2 u_mouse;
uniform float u_cell;
uniform float u_time;

vec2 coverUv(vec2 p) {
  vec2 uv = p / u_res;
  float screen = u_res.x / u_res.y;
  float video = u_video.x / u_video.y;
  vec2 scale = screen > video ? vec2(1.0, video / screen) : vec2(screen / video, 1.0);
  uv = (uv - 0.5) * scale + 0.5;
  return vec2(uv.x, 1.0 - uv.y);
}

void main() {
  vec2 frag = gl_FragCoord.xy;
  vec2 cell = floor(frag / u_cell);
  vec2 center = (cell + 0.5) * u_cell;
  vec3 src = texture(u_tex, coverUv(center)).rgb;
  float lum = dot(src, vec3(0.299, 0.587, 0.114));
  lum = smoothstep(0.06, 0.9, lum);

  float near = 1.0 - smoothstep(0.0, u_res.y * 0.35, distance(center, u_mouse));
  float radius = u_cell * 0.5 * clamp(sqrt(lum) * (0.92 + near * 0.5), 0.0, 1.05);
  float d = distance(frag, center);
  float dot = 1.0 - smoothstep(radius - 1.0, radius, d);

  vec3 yellow = vec3(0.988, 0.933, 0.039);
  vec3 cyan = vec3(0.0, 0.941, 1.0);
  vec3 ink = mix(cyan * 0.85, yellow, smoothstep(0.35, 0.85, lum));
  float flicker = 0.93 + 0.07 * sin(u_time * 40.0 + cell.y * 1.7);
  color = vec4(ink * dot * flicker, 1.0);
}`;

function compile(gl: WebGL2RenderingContext, type: number, source: string) {
  const shader = gl.createShader(type)!;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(log ?? "shader compile error");
  }
  return shader;
}

export default function HalftoneVideo({
  src,
  poster,
  cell = 9,
  onTime,
}: {
  src: string;
  poster?: string | null;
  cell?: number; // dot pitch in CSS pixels
  onTime?: (seconds: number) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const onTimeRef = useRef(onTime);
  onTimeRef.current = onTime;

  useEffect(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    const gl = canvas?.getContext("webgl2", { antialias: false, premultipliedAlpha: false });
    if (!canvas || !video || !gl) {
      canvas?.setAttribute("data-fallback", "");
      return;
    }

    let program: WebGLProgram | null = null;
    try {
      program = gl.createProgram()!;
      gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, VERTEX));
      gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, FRAGMENT));
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error("link error");
    } catch {
      canvas.setAttribute("data-fallback", "");
      return;
    }

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.useProgram(program);

    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    const u = {
      res: gl.getUniformLocation(program, "u_res"),
      video: gl.getUniformLocation(program, "u_video"),
      mouse: gl.getUniformLocation(program, "u_mouse"),
      cell: gl.getUniformLocation(program, "u_cell"),
      time: gl.getUniformLocation(program, "u_time"),
    };

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const mouse = { x: -9999, y: -9999 };
    let raf = 0;
    let visible = true;
    let hasFrame = false;
    let lastTime = -1;
    const start = performance.now();

    const resize = () => {
      const w = Math.max(1, Math.floor(canvas.clientWidth * ratio));
      const h = Math.max(1, Math.floor(canvas.clientHeight * ratio));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
    };

    const draw = () => {
      raf = 0;
      if (video.readyState >= 2) {
        resize();
        // Upload only when the video has moved on; the dots still react to the pointer in between.
        if (video.currentTime !== lastTime || !hasFrame) {
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, video);
          lastTime = video.currentTime;
        }
        gl.uniform2f(u.res, canvas.width, canvas.height);
        gl.uniform2f(u.video, video.videoWidth || 16, video.videoHeight || 9);
        gl.uniform2f(u.mouse, mouse.x * ratio, canvas.height - mouse.y * ratio);
        gl.uniform1f(u.cell, cell * ratio);
        gl.uniform1f(u.time, (performance.now() - start) / 1000);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
        hasFrame = true;
        onTimeRef.current?.(video.currentTime);
      }
      if (visible && (!reduce || !hasFrame)) raf = requestAnimationFrame(draw);
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(draw);
    };

    const onPointer = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
      if (reduce) schedule();
    };
    const onLeave = () => {
      mouse.x = mouse.y = -9999;
    };

    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) {
        if (!reduce) video.play().catch(() => undefined);
        schedule();
      } else {
        video.pause();
      }
    });
    observer.observe(canvas);

    const onError = () => canvas.setAttribute("data-fallback", "");
    video.addEventListener("error", onError);

    if (reduce) {
      video.pause();
      video.addEventListener("loadeddata", schedule);
    }
    window.addEventListener("pointermove", onPointer, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    window.addEventListener("resize", schedule);
    schedule();

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      video.removeEventListener("loadeddata", schedule);
      video.removeEventListener("error", onError);
      window.removeEventListener("pointermove", onPointer);
      document.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("resize", schedule);
      gl.deleteTexture(texture);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      // StrictMode re-runs this effect on the same canvas: release the context only once it is gone.
      if (!canvas.isConnected) gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, [src, cell]);

  return (
    <div className={styles.wrap}>
      {/* Fallback without WebGL; a plain <img> keeps API-hosted posters working without next/image config. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {poster && <img className={styles.poster} src={poster} alt="" aria-hidden="true" />}
      <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />
      <video
        ref={videoRef}
        className={styles.source}
        src={src}
        muted
        loop
        playsInline
        preload="metadata"
        crossOrigin="anonymous"
        aria-hidden="true"
      />
    </div>
  );
}
