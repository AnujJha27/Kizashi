"use client";

import { useEffect, useRef } from "react";

const vertexSource = `
  attribute vec2 a_position;
  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

const fragmentSource = `
  precision mediump float;
  uniform vec2 u_resolution;
  uniform float u_time;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
      f.y
    );
  }

  void main() {
    vec2 pixel = gl_FragCoord.xy;
    vec2 p = (pixel - 0.5 * u_resolution) / u_resolution.y;
    float t = u_time * 0.018;
    float ridges = p.y
      + 0.15 * sin(p.x * 4.0 + t)
      + 0.09 * sin(p.x * 8.0 - t * 0.7)
      + 0.06 * noise(p * 3.2 + t * 0.2);
    float contour = 1.0 - smoothstep(0.0, 0.075, abs(sin(ridges * 18.0)));
    contour *= smoothstep(-0.58, 0.34, p.y);

    float distanceToSun = distance(gl_FragCoord.xy / u_resolution, vec2(0.79, 0.27));
    float sun = 1.0 - smoothstep(0.0, 0.24, distanceToSun);
    float grain = hash(pixel + u_time) - 0.5;

    float sky = smoothstep(-0.58, 0.58, p.y);
    vec3 color = mix(vec3(0.045, 0.047, 0.075), vec3(0.13, 0.065, 0.10), sky);
    color += vec3(0.30, 0.065, 0.035) * sun * 0.72;
    color += vec3(0.15, 0.12, 0.11) * contour * 0.56;
    color += grain * 0.014;
    gl_FragColor = vec4(color, 0.86);
  }
`;

function compileShader(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

export function InkField({ className = "ink-field" }: Readonly<{ className?: string }>) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl", { alpha: true, antialias: false });
    if (!gl) return;

    const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexSource);
    const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
    if (!vertexShader || !fragmentShader) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;

    const position = gl.getAttribLocation(program, "a_position");
    const resolution = gl.getUniformLocation(program, "u_resolution");
    const time = gl.getUniformLocation(program, "u_time");
    const buffer = gl.createBuffer();
    if (!buffer || position < 0 || !resolution || !time) return;

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
    gl.useProgram(program);
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

    let width = 0;
    let height = 0;
    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      const bounds = canvas.getBoundingClientRect();
      const nextWidth = Math.max(1, Math.floor(bounds.width * ratio));
      const nextHeight = Math.max(1, Math.floor(bounds.height * ratio));
      if (nextWidth === width && nextHeight === height) return;
      width = nextWidth;
      height = nextHeight;
      canvas.width = width;
      canvas.height = height;
      gl.viewport(0, 0, canvas.width, canvas.height);
    };

    let frame = 0;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const draw = (timestamp: number) => {
      resize();
      gl.uniform2f(resolution, canvas.width, canvas.height);
      gl.uniform1f(time, timestamp);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      if (!reducedMotion) frame = window.requestAnimationFrame(draw);
    };

    window.addEventListener("resize", resize);
    draw(0);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
    };
  }, []);

  return <canvas ref={canvasRef} className={`${className} absolute inset-0 h-full w-full`} aria-hidden="true" />;
}
