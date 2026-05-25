"use client";

import { useEffect, useRef } from "react";

const VERTEX_SHADER = `
  attribute vec2 a_position;
  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

const FRAGMENT_SHADER = `
  precision highp float;

  uniform vec2 u_resolution;
  uniform float u_time;
  uniform vec2 u_mouse;

  // Simplex noise for fog
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec3 permute(vec3 x) { return mod289(((x * 34.0) + 1.0) * x); }

  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
    vec2 i = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
    m = m * m;
    m = m * m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
    vec3 g;
    g.x = a0.x * x0.x + h.x * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;
    for (int i = 0; i < 5; i++) {
      value += amplitude * snoise(p * frequency);
      amplitude *= 0.5;
      frequency *= 2.0;
    }
    return value;
  }

  void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution;

    // Aspect ratio correction for horizontal distances
    float aspect = u_resolution.x / u_resolution.y;
    float cx = (uv.x - 0.5) * aspect;
    float cy = uv.y;

    // Distance from vertical center line
    float distX = abs(cx);

    // Vertical intensity - strong everywhere, slightly brighter at bottom
    float verticalFade = 0.7 + 0.3 * pow(1.0 - cy, 0.6);

    // --- ANIMATED FOG ---
    float time = u_time * 0.12;
    float verticalFlow = u_time * 0.08;
    vec2 fogUV = uv * 2.5;
    fogUV.y += verticalFlow;
    float fog1 = fbm(fogUV + vec2(time * 0.2, 0.0));
    float fog2 = fbm(fogUV * 1.3 + vec2(-time * 0.15, verticalFlow * 0.5));
    float fog = (fog1 + fog2 * 0.5) * 0.35;
    fog = smoothstep(-0.15, 0.7, fog);

    // --- BEAM CORE (thin bright white line) ---
    float coreWidth = 0.003;
    float core = exp(-distX * distX / (coreWidth * coreWidth));
    core *= verticalFade;

    // --- INNER GLOW (blue-white, medium spread) ---
    float innerWidth = 0.025 + (1.0 - cy) * 0.015;
    float innerGlow = exp(-distX * distX / (innerWidth * innerWidth));
    innerGlow *= verticalFade;

    // --- OUTER GLOW (deep blue/purple, wide spread) ---
    float outerWidth = 0.12 + (1.0 - cy) * 0.08;
    float outerGlow = exp(-distX * distX / (outerWidth * outerWidth));
    outerGlow *= verticalFade;

    // --- WIDE AMBIENT (very subtle, very wide) ---
    float ambientWidth = 0.35 + (1.0 - cy) * 0.15;
    float ambient = exp(-distX * distX / (ambientWidth * ambientWidth));
    ambient *= pow(1.0 - cy, 0.8);

    // --- BOTTOM GLOW (floor reflection) ---
    float bottomFade = exp(-cy / 0.03);
    float bottomGlow = bottomFade * exp(-distX * distX / 0.06);
    float bottomCore = exp(-cy / 0.015) * exp(-distX * distX / 0.015);

    // --- SLOW BREATHING WIDTH (moves upward) ---
    float breathSpeed = u_time * 0.3;
    float breathWave = sin(cy * 3.0 - breathSpeed) * 0.5 + 0.5;
    float breathWidth = 1.0 + breathWave * 0.4;

    // --- BREATHING ---
    float pulse = 0.92 + 0.08 * sin(u_time * 0.8);

    // --- PULSE (travels down the beam, rare, constant speed) ---
    float pulseCycle = 6.0;
    float travelTime = 1.2;
    float fadeTime = 0.6;
    float pulseT = mod(u_time, pulseCycle);
    float pulseLinear = clamp(pulseT / travelTime, 0.0, 1.0);
    // Single ease-out curve: fast at top, slows into bottom
    float pulseProgress = 1.0 - (1.0 - pulseLinear) * (1.0 - pulseLinear);
    float pulseY = 1.0 - pulseProgress;
    // After reaching bottom, fade out over fadeTime
    float fadeProgress = clamp((pulseT - travelTime) / fadeTime, 0.0, 1.0);
    float pulseActive = pulseT < travelTime ? 1.0 : 1.0 - fadeProgress;
    float pulseDist = abs(cy - pulseY);
    float pulseRing = exp(-pulseDist * pulseDist / 0.0012) * pulseActive;
    float halo = exp(-pulseDist * pulseDist / 0.008) * exp(-distX * distX / 0.1) * pulseActive;
    float pulseWidening = pulseRing * exp(-distX * distX / 0.04) * 0.8;
    // Shimmer — randomized rapid flicker
    float shimmer1 = sin(u_time * 31.0);
    float shimmer2 = sin(u_time * 47.0 + 2.7);
    float shimmer3 = sin(u_time * 19.0 + 5.1);
    float pulseShimmer = 0.3 + 0.7 * abs(shimmer1 * 0.5 + shimmer2 * 0.3 + shimmer3 * 0.2);
    pulseWidening *= pulseShimmer;
    halo *= (0.5 + 0.5 * pulseShimmer);

    // Apply breathing width to beam layers
    core *= pulse;
    innerGlow *= breathWidth * pulse;
    outerGlow *= (1.0 + breathWave * 0.2) * pulse;

    // --- FOG ILLUMINATION (fog lit by beam glow + pulse) ---
    float fogLight = outerGlow * 2.0 + innerGlow * 1.0 + halo * 2.0;
    float illuminatedFog = fog * (0.15 + fogLight * 1.5);
    float fogFlow = fbm(vec2(cx * 3.0, uv.y * 2.0 - u_time * 0.15));
    illuminatedFog *= (0.8 + fogFlow * 0.4);

    // --- COLORS ---
    vec3 bgColor = vec3(0.004, 0.006, 0.015);
    vec3 coreColor = vec3(0.95, 0.95, 1.0);
    vec3 innerColor = vec3(0.55, 0.6, 1.0);
    vec3 outerColor = vec3(0.25, 0.2, 0.8);
    vec3 ambientColor = vec3(0.12, 0.08, 0.35);
    vec3 sourceColor = vec3(0.7, 0.75, 1.0);
    vec3 floorColor = vec3(0.3, 0.25, 0.7);
    vec3 fogColor = vec3(0.15, 0.12, 0.35);

    // --- COMPOSITING ---
    vec3 color = bgColor;

    // Fog layers
    color = mix(color, fogColor, fog * 0.15);
    color += fogColor * illuminatedFog * 0.4;

    // Beam layers
    color += ambientColor * ambient * 0.3 * pulse;
    color += outerColor * outerGlow * 0.5 * pulse;
    color += innerColor * innerGlow * 0.6;
    color += coreColor * core * 1.2;

    // Pulse + halo
    color += innerColor * pulseWidening;
    color += outerColor * halo * 0.5;

    // Bottom glow
    color += floorColor * bottomGlow * 0.6;
    color += sourceColor * bottomCore * 0.8;

    gl_FragColor = vec4(color, 1.0);
  }
`;

export function LightBeamCanvas() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number>(0);
    const mouseRef = useRef({ x: 0.5, y: 0.5 });
    const smoothMouseRef = useRef({ x: 0.5, y: 0.5 });

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const gl = canvas.getContext("webgl", { antialias: true, alpha: false });
        if (!gl) {
            console.error("WebGL not supported");
            return;
        }

        const compileShader = (source: string, type: number) => {
            const shader = gl.createShader(type);
            if (!shader) return null;
            gl.shaderSource(shader, source);
            gl.compileShader(shader);
            if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
                console.error("Shader compile error:", gl.getShaderInfoLog(shader));
                gl.deleteShader(shader);
                return null;
            }
            return shader;
        };

        const vertexShader = compileShader(VERTEX_SHADER, gl.VERTEX_SHADER);
        const fragmentShader = compileShader(FRAGMENT_SHADER, gl.FRAGMENT_SHADER);
        if (!vertexShader || !fragmentShader) return;

        const program = gl.createProgram();
        if (!program) return;
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);

        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.error("Program link error:", gl.getProgramInfoLog(program));
            return;
        }

        gl.useProgram(program);

        const positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(
            gl.ARRAY_BUFFER,
            new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
            gl.STATIC_DRAW
        );

        const positionLocation = gl.getAttribLocation(program, "a_position");
        gl.enableVertexAttribArray(positionLocation);
        gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

        const resolutionLocation = gl.getUniformLocation(program, "u_resolution");
        const timeLocation = gl.getUniformLocation(program, "u_time");
        const mouseLocation = gl.getUniformLocation(program, "u_mouse");

        const onMouseMove = (e: MouseEvent) => {
            mouseRef.current.x = e.clientX / window.innerWidth;
            mouseRef.current.y = 1.0 - e.clientY / window.innerHeight;
        };
        window.addEventListener("mousemove", onMouseMove);

        const resize = () => {
            const dpr = Math.min(window.devicePixelRatio, 2);
            canvas.width = Math.round(canvas.clientWidth * dpr);
            canvas.height = Math.round(canvas.clientHeight * dpr);
            gl.viewport(0, 0, canvas.width, canvas.height);
        };

        resize();
        window.addEventListener("resize", resize);

        const startTime = performance.now();

        const render = () => {
            const time = (performance.now() - startTime) / 1000;

            const lerp = 0.04;
            smoothMouseRef.current.x += (mouseRef.current.x - smoothMouseRef.current.x) * lerp;
            smoothMouseRef.current.y += (mouseRef.current.y - smoothMouseRef.current.y) * lerp;

            gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
            gl.uniform1f(timeLocation, time);
            gl.uniform2f(mouseLocation, smoothMouseRef.current.x, smoothMouseRef.current.y);
            gl.drawArrays(gl.TRIANGLES, 0, 6);
            animationRef.current = requestAnimationFrame(render);
        };

        render();

        return () => {
            window.removeEventListener("resize", resize);
            window.removeEventListener("mousemove", onMouseMove);
            cancelAnimationFrame(animationRef.current);
            gl.deleteProgram(program);
            gl.deleteShader(vertexShader);
            gl.deleteShader(fragmentShader);
            gl.deleteBuffer(positionBuffer);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full"
            style={{ zIndex: 0 }}
        />
    );
}

