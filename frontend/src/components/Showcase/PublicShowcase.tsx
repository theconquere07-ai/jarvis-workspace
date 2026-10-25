import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import './public-showcase.css';
import { api } from '../../lib/api';
import { Project, Publication } from '../../types';

interface PublicShowcaseProps {
  onGoToWorkspace?: () => void;
}

interface ShowcaseProject {
  id: string;
  name: string;
  tag: string;
  st: 'Active' | 'In development' | 'Prototype' | 'Concept';
  tags: string[];
  desc: string[];
  pts: string[];
  cover?: string;
  links?: Array<{ l: string; u: string }>;
  img?: string[];
}

interface LibraryDoc {
  t: string;
  title: string;
  d: string;
  url: string;
  p?: string;
}

// Original Content Baseline
const INITIAL_ME = {
  lead: 'I design and build systems: devotional commerce, engineering studio work and a personal AI operating system. I plan the architecture, delegate the analysis, and own the execution.',
  bio: [
    'Founder of Gauri Idols, StarkForge and Sovereign OS, and the builder behind the projects on this page.',
    'This platform is Work&Own in miniature: a place to show real work, with its plans, research and documentation, where anyone can read it.',
  ],
  links: [
    { l: 'GitHub', u: 'https://github.com/theconquere07-ai' },
    { l: 'YouTube', u: 'https://youtube.com/@AbhishekOnProffesion' },
    { l: 'Instagram', u: 'https://instagram.com/abhishek_onproffesion' },
  ],
};

const INITIAL_P: ShowcaseProject[] = [
  {
    id: 'work-and-own',
    name: 'Work&Own',
    tag: 'A nonprofit platform for self-employment and open project building.',
    st: 'Concept',
    tags: ['SaaS', 'Nonprofit', 'Platform'],
    desc: [
      'Work&Own is a concept for a nonprofit website and SaaS that helps people build their own livelihood: manage projects, publish them publicly, and earn recognition for finished work.',
      'Instead of a resume, every member gets a living public record of what they have actually made.',
    ],
    pts: [
      'Self-employment and project management tools in one place',
      'Public project listing for every member',
      'Credits and badges system that rewards completed work',
      'Nonprofit by design',
    ],
  },
  {
    id: 'gauri-idols',
    name: 'Gauri Idols',
    tag: 'Devotional idol e-commerce.',
    st: 'Active',
    tags: ['E-commerce', 'Web', 'Brand'],
    desc: [
      'Gauri Idols is an online store for devotional idols, built around a clean product catalogue and a brand-first presentation.',
    ],
    pts: [
      'Storefront and product feed',
      'Brand advertisement video project',
      'Business and catalogue details maintained as a single source of truth',
    ],
    links: [{ l: 'Live site', u: 'https://gauriidols.com' }],
  },
  {
    id: 'starkforge',
    name: 'StarkForge',
    tag: 'Technology and engineering studio, digital agency.',
    st: 'Active',
    tags: ['Agency', 'Web', 'Design'],
    desc: [
      'StarkForge is a tech and engineering studio that builds websites and digital products with a defined design language: black, precise, engineered.',
    ],
    pts: [
      'Web builds for clients and for the other projects here',
      'A consistent design language across every build',
    ],
  },
  {
    id: 'sovereign-os',
    name: 'Sovereign OS',
    tag: 'A personal AI intelligence operating system.',
    st: 'In development',
    tags: ['AI', 'Architecture', 'Systems'],
    desc: [
      'Sovereign OS is a personal operating system for intelligence: one architecture that hosts several subsystems for thinking, monitoring and execution.',
      'It is designed document-first, with each subsystem specified before a line of code is written.',
    ],
    pts: [
      'Modular subsystems under a single architecture',
      'Hosts JARVIS Prime and Sentinel Engine',
      'Several subsystems already completed',
    ],
  },
  {
    id: 'jarvis-prime',
    name: 'JARVIS Prime',
    tag: 'Unified AI orchestration under Sovereign OS.',
    st: 'In development',
    tags: ['AI', 'Orchestration'],
    desc: [
      'JARVIS Prime is the orchestration layer of Sovereign OS: a single interface over multiple AI capabilities, with its architecture and open decisions documented in the open.',
    ],
    pts: [
      'One interface over several AI capabilities',
      'Architecture and open decisions written down',
    ],
  },
  {
    id: 'sentinel-engine',
    name: 'Sentinel Engine',
    tag: 'Passive multi-source monitoring.',
    st: 'Concept',
    tags: ['Monitoring', 'AI'],
    desc: [
      'Sentinel Engine is a monitoring system under Sovereign OS that watches many sources passively and surfaces only what matters.',
    ],
    pts: [
      'Multi-source, passive by design',
      'Part of the Sovereign OS architecture',
    ],
  },
  {
    id: 'adshell',
    name: 'AdShell',
    tag: 'An Android YouTube ad-blocking WebView app.',
    st: 'In development',
    tags: ['Android', 'Kotlin', 'WebView'],
    desc: [
      'AdShell is a personal Android app that wraps YouTube in a WebView shell built to block ads, written in Kotlin in Android Studio.',
      'Features are planned in phases, each with a defined scope.',
    ],
    pts: [
      'Kotlin WebView shell',
      'Focused on a clean, ad-free viewing experience',
      'Phased feature roadmap',
    ],
  },
  {
    id: 'learning-gap-detector',
    name: 'Learning Gap Detector',
    tag: 'AI-powered learning gap detection for education.',
    st: 'Prototype',
    tags: ['EdTech', 'Hackathon', 'UI/UX'],
    desc: [
      'Built for an education-technology hackathon (DU-01), Learning Gap Detector finds where a student is actually stuck, not just what they scored.',
      'The prototype covers three roles with separate experiences.',
    ],
    pts: [
      'UI/UX prototype for student, teacher and admin roles',
      'Education and Technology track',
    ],
  },
  {
    id: 'sit-academic-hub',
    name: 'SIT Academic Hub',
    tag: 'A multi-college academic resource platform.',
    st: 'Concept',
    tags: ['Education', 'Community', 'Platform'],
    desc: [
      'SIT Academic Hub organises study resources as College, Branch and Subject hubs, so students find the right material in a few taps.',
    ],
    pts: [
      'College → Branch → Subject hub structure',
      'Student contributions',
      'Per-college communities with approval',
    ],
  },
];

const INITIAL_L: LibraryDoc[] = [
  { t: 'Presentation', title: 'Renewable energy', d: 'National-level competition presentation, SIT Yadrav.', url: '' },
  { t: 'Research', title: 'AI in construction', d: 'Research-paper presentation for the national competition, SIT Yadrav.', url: '' },
  { t: 'Architecture', title: 'Sovereign OS architecture', d: 'Subsystems, boundaries and completed components.', url: '', p: 'sovereign-os' },
  { t: 'Architecture', title: 'JARVIS Prime architecture', d: 'Orchestration design and open decisions.', url: '', p: 'jarvis-prime' },
  { t: 'Prototype', title: 'Learning Gap Detector UI/UX', d: 'Role-based prototype for student, teacher and admin.', url: '', p: 'learning-gap-detector' },
];

const W: [string, string][] = [
  ['Truth over comfort', 'Decisions follow evidence and logic, not opinion.'],
  ['Architecture before code', 'Full documents first, so nothing is built twice.'],
  ['Delegate analysis, own execution', 'Ideas and systems planning are mine. Shipping is mine.'],
  ['Production-ready only', 'If it cannot be used today, it is not delivered.'],
];

const NAV_ITEMS: [string, string][] = [
  ['about', 'About'],
  ['work', 'Work'],
  ['library', 'Library'],
  ['process', 'Process'],
  ['contact', 'Contact'],
];

const STATUS_CLASS: Record<string, string> = {
  Active: 'live',
  'In development': 'build',
  Prototype: 'build',
  Concept: '',
};

// Constellation hashing & rendering
function hashString(s: string): number {
  return [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
}

function generateCoverSvg(p: ShowcaseProject): string {
  let h = hashString(p.name);
  const r = () => ((h = (h * 1103515245 + 12345) >>> 0) / 4294967296);
  const pts: [number, number][] = [];
  let s = '';
  let l = '';

  for (let i = 0; i < 46; i++) {
    const x = r() * 400;
    const y = r() * 250;
    pts.push([x, y]);
    s += `<circle cx="${x | 0}" cy="${y | 0}" r="${(0.4 + r() * 1.4).toFixed(1)}" fill="${
      r() > 0.88 ? '#00e5ff' : '#fff'
    }" opacity="${(0.25 + r() * 0.75).toFixed(2)}"/>`;
  }

  for (let i = 0; i < 7; i++) {
    const a = pts[(r() * 46) | 0];
    const b = pts[(r() * 46) | 0];
    l += `<line x1="${a[0] | 0}" y1="${a[1] | 0}" x2="${b[0] | 0}" y2="${b[1] | 0}"/>`;
  }

  const cx = 110 + r() * 180;
  const cy = 70 + r() * 70;
  const g = 'g-' + p.id;

  return `<svg viewBox="0 0 400 250" preserveAspectRatio="xMidYMid slice" style="width:100%;height:100%;display:block"><defs><radialGradient id="${g}"><stop offset="0" stop-color="#fff"/><stop offset=".12" stop-color="#00e5ff" stop-opacity=".9"/><stop offset="1" stop-color="#00e5ff" stop-opacity="0"/></radialGradient></defs><rect width="400" height="250" fill="#050505"/><g stroke="#00e5ff" stroke-opacity=".18" stroke-width=".6">${l}</g>${s}<circle cx="${
    cx | 0
  }" cy="${cy | 0}" r="46" fill="url(#${g})"/><text x="20" y="228" fill="#fff" font-family="Inter,sans-serif" font-weight="700" font-size="22" letter-spacing="-.5">${p.name.slice(
    0,
    18
  )}</text></svg>`;
}

export function PublicShowcase({ onGoToWorkspace }: PublicShowcaseProps) {
  const [currentPage, setCurrentPage] = useState<string>('about');
  const [activeProject, setActiveProject] = useState<ShowcaseProject | null>(null);
  const [workFilter, setWorkFilter] = useState<string>('All');
  const [libFilter, setLibFilter] = useState<string>('All');
  const [showIntro, setShowIntro] = useState<boolean>(() => {
    try {
      const h = window.location.hash.slice(1);
      const seen = sessionStorage.getItem('axp');
      return h === 'intro' || (!seen && !h);
    } catch {
      return false;
    }
  });

  const [projects, setProjects] = useState<ShowcaseProject[]>(INITIAL_P);
  const [libraryDocs, setLibraryDocs] = useState<LibraryDoc[]>(INITIAL_L);

  // References
  const containerRef = useRef<HTMLDivElement>(null);
  const arriveCanvasRef = useRef<HTMLCanvasElement>(null);
  const warpState = useRef({ isWarping: false, warpFactor: 0, currentCurve: { x: 0, y: 0 }, swapped: false });
  const threeRefs = useRef<{
    material?: THREE.ShaderMaterial;
    camera?: THREE.PerspectiveCamera;
    composer?: EffectComposer;
  }>({});

  // 1. Fetch any newly published projects or publications from Supabase
  useEffect(() => {
    Promise.all([
      api.publicShowcase.getProjects().catch(() => []),
      api.publicShowcase.getPublications().catch(() => []),
    ]).then(([liveProjs, livePubs]) => {
      if (liveProjs && liveProjs.length > 0) {
        // Map database projects to showcase project format
        const mappedLive: ShowcaseProject[] = liveProjs.map((p: Project) => {
          let st: ShowcaseProject['st'] = 'Active';
          if (p.status === 'in_development') st = 'In development';
          else if (p.status === 'planned') st = 'Concept';
          else if (p.development_stage === 'prototype') st = 'Prototype';

          const links: Array<{ l: string; u: string }> = [];
          if (p.live_url) links.push({ l: 'Live site', u: p.live_url });
          if (p.repo_url) links.push({ l: 'GitHub Repository', u: p.repo_url });
          if (p.docs_url) links.push({ l: 'Documentation', u: p.docs_url });

          return {
            id: p.slug || p.id,
            name: p.name,
            tag: p.short_desc || p.description || 'Engineered system in the open.',
            st,
            tags: p.tags && p.tags.length > 0 ? p.tags : ['Software', 'Engineered'],
            desc: [p.problem_statement || p.description || '', p.proposed_solution || ''].filter(Boolean),
            pts: p.features_implemented && p.features_implemented.length > 0 ? p.features_implemented : ['Engineered with defined architecture', 'Production-ready execution'],
            links,
          };
        });

        // Merge without duplicating existing IDs
        setProjects((prev) => {
          const ids = new Set(prev.map((x) => x.id));
          const additions = mappedLive.filter((m) => !ids.has(m.id));
          return [...prev, ...additions];
        });
      }

      if (livePubs && livePubs.length > 0) {
        const mappedPubs: LibraryDoc[] = livePubs.map((pub: Publication) => ({
          t: pub.publication_type ? pub.publication_type.charAt(0).toUpperCase() + pub.publication_type.slice(1) : 'Research',
          title: pub.title,
          d: pub.abstract || 'Monograph & research paper.',
          url: `#library`,
          p: pub.project_id || undefined,
        }));

        setLibraryDocs((prev) => {
          const titles = new Set(prev.map((x) => x.title));
          const additions = mappedPubs.filter((m) => !titles.has(m.title));
          return [...prev, ...additions];
        });
      }
    });
  }, []);

  // 2. Initialize Three.js Warp Engine
  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    container.innerHTML = '';

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x050505, 0.0006);

    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 4000);
    camera.position.z = 0;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x050505);
    container.appendChild(renderer.domElement);

    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    composer.addPass(
      new UnrealBloomPass(
        new THREE.Vector2(window.innerWidth, window.innerHeight),
        1.2,
        0.5,
        0.3
      )
    );

    const particleCount = 12000;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    const colors = new Float32Array(particleCount * 3);
    const colorBase = new THREE.Color(0xffffff);
    const colorCyan = new THREE.Color(0x00e5ff);

    for (let i = 0; i < particleCount; i++) {
      const r = 40 + Math.random() * 800;
      const theta = Math.random() * Math.PI * 2;
      const z = Math.random() * 4000 - 2000;
      positions[i * 3] = r * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(theta);
      positions[i * 3 + 2] = z;
      sizes[i] = Math.random() * 2.5 + 0.5;
      const isCyan = Math.random() > 0.95;
      const c = isCyan ? colorCyan : colorBase;
      const b = isCyan ? 1.0 : 0.2 + Math.random() * 0.8;
      colors[i * 3] = c.r * b;
      colors[i * 3 + 1] = c.g * b;
      colors[i * 3 + 2] = c.b * b;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uWarpFactor: { value: 0 },
        uCurve: { value: new THREE.Vector2(0, 0) },
      },
      vertexShader: `
        uniform float uTime;
        uniform float uWarpFactor;
        uniform vec2 uCurve;
        attribute float aSize;
        attribute vec3 aColor;
        varying vec3 vColor;
        varying float vDistance;
        void main() {
          vColor = aColor;
          vec3 pos = position;
          float speed = 25.0 + (uWarpFactor * 800.0);
          pos.z += uTime * speed;
          pos.z = mod(pos.z + 2000.0, 4000.0) - 2000.0;
          float depth = max(0.0, -pos.z) / 2000.0;
          float curveStrength = pow(depth, 2.0);
          pos.x += uCurve.x * curveStrength * 1500.0;
          pos.y += uCurve.y * curveStrength * 1500.0;
          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          float stretch = 1.0 + (uWarpFactor * 8.0);
          gl_PointSize = aSize * (300.0 / -mvPosition.z) * stretch;
          gl_Position = projectionMatrix * mvPosition;
          vDistance = -mvPosition.z;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vDistance;
        void main() {
          vec2 coord = gl_PointCoord - vec2(0.5);
          float dist = length(coord);
          if (dist > 0.5) discard;
          float alpha = smoothstep(0.5, 0.1, dist);
          alpha *= smoothstep(4000.0, 1000.0, vDistance);
          gl_FragColor = vec4(vColor, alpha);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    scene.add(new THREE.Points(geometry, material));

    threeRefs.current = { material, camera, composer };

    const clock = new THREE.Clock();
    let animId: number;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      material.uniforms.uTime.value = clock.getElapsedTime();
      composer.render();
    };
    animate();

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      composer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, []);

  // 3. Constellation Arrival Draw
  const drawArrival = useCallback((targetPage: string, t: number, vis: number, now: number) => {
    const canvas = arriveCanvasRef.current;
    if (!canvas) return;
    const ax = canvas.getContext('2d');
    if (!ax) return;

    const dpr = Math.min(window.devicePixelRatio, 2);
    const aw = window.innerWidth;
    const ah = window.innerHeight;
    canvas.width = aw * dpr;
    canvas.height = ah * dpr;

    ax.setTransform(dpr, 0, 0, dpr, 0, 0);
    ax.clearRect(0, 0, aw, ah);
    if (vis <= 0 || t <= 0) return;

    const arrivalMeta: Record<string, { k: string; t: string; n: [string, string][] }> = {
      about: { k: 'Profile & Background', t: 'Abhii.', n: [['Founder', ''], ['Builder', ''], ['Execution operator', '']] },
      work: { k: 'Selected Work', t: 'Projects.', n: projects.map((p) => [p.name, p.st]) },
      library: { k: 'Research & Documentation', t: 'Library.', n: libraryDocs.map((d) => [d.title, d.t]) },
      process: { k: 'How I work', t: 'Process.', n: W.map((w) => [w[0], '']) },
      contact: { k: 'Contact', t: 'Get in touch.', n: INITIAL_ME.links.map((l) => [l.l, '']) },
    };

    const m = arrivalMeta[targetPage] || arrivalMeta['about'];
    let h = hashString(targetPage);
    const r = () => ((h = (h * 1103515245 + 12345) >>> 0) / 4294967296);
    const n = m.n.length;
    const pts = m.n.map((x, i) => ({
      a: -Math.PI / 2 + (i / n) * Math.PI * 2 + (r() - 0.5) * 0.3,
      rad: 0.78 + r() * 0.22,
      l: x[0],
      s: x[1],
      d: i / n,
      ph: r() * 6.28,
    }));

    const cx = aw / 2;
    const cy = ah / 2;
    const narrow = aw < 700;
    const rx = aw * (narrow ? 0.4 : 0.36);
    const ry = ah * 0.34;
    const fs = narrow ? 11 : 13;
    const zoom = 1.5 - 0.5 * (1 - Math.pow(1 - t, 3));
    const smooth = (x: number) => {
      const clamped = Math.max(0, Math.min(1, x));
      return clamped * clamped * (3 - 2 * clamped);
    };

    const P2 = pts.map((q) => ({
      x: cx + Math.cos(q.a) * rx * q.rad * zoom + Math.sin(now / 900 + q.ph) * 3,
      y: cy + Math.sin(q.a) * ry * q.rad * zoom + Math.cos(now / 1100 + q.ph) * 3,
      al: vis * smooth((t - 0.18 - q.d * 0.45) / 0.25),
      q,
    }));

    ax.lineWidth = 1;
    for (let i = 0; i < n; i++) {
      for (const j of [(i + 1) % n, (i + 2) % n]) {
        if (j === i || (n < 4 && j < i)) continue;
        const A = P2[i];
        const B = P2[j];
        const al = Math.min(A.al, B.al) * 0.28;
        if (al < 0.01) continue;
        ax.strokeStyle = `rgba(0,229,255,${al})`;
        ax.beginPath();
        ax.moveTo(A.x, A.y);
        ax.lineTo(B.x, B.y);
        ax.stroke();
      }
    }

    const tl = vis * smooth((t - 0.1) / 0.3);
    const ts = Math.min(aw * (narrow ? 0.13 : 0.09), 104);
    ax.textAlign = 'center';
    ax.textBaseline = 'middle';
    ax.font = '400 11px Inter,sans-serif';
    ax.fillStyle = `rgba(120,120,120,${tl})`;
    ax.fillText(m.k.toUpperCase(), cx, cy - ts * 0.72);

    ax.font = `700 ${ts}px Inter,sans-serif`;
    ax.fillStyle = `rgba(255,255,255,${tl})`;
    ax.fillText(m.t, cx, cy + ts * 0.1);

    for (const o of P2) {
      if (o.al < 0.01) continue;
      ax.save();
      ax.shadowColor = '#00e5ff';
      ax.shadowBlur = 16;
      ax.fillStyle = `rgba(0,229,255,${o.al})`;
      ax.beginPath();
      ax.arc(o.x, o.y, 3, 0, 6.283);
      ax.fill();
      ax.restore();

      ax.strokeStyle = `rgba(0,229,255,${o.al * 0.35})`;
      ax.beginPath();
      ax.arc(o.x, o.y, 8 + (1 - o.al) * 10, 0, 6.283);
      ax.stroke();

      ax.font = `600 ${fs}px Inter,sans-serif`;
      const w = ax.measureText(o.q.l).width;
      let right = Math.cos(o.q.a) >= -0.15;
      if (right && o.x + 12 + w > aw - 10) right = false;
      if (!right && o.x - 12 - w < 10) right = true;
      ax.textAlign = right ? 'left' : 'right';
      const lx = o.x + (right ? 12 : -12);
      ax.fillStyle = `rgba(255,255,255,${o.al})`;
      ax.fillText(o.q.l, lx, o.y + 4);
    }
  }, [projects, libraryDocs]);

  // 4. Cinematic Warp Transition
  const executeCinematicWarp = useCallback((id: string, direction = 'right') => {
    if (warpState.current.isWarping) return;
    warpState.current.isWarping = true;
    warpState.current.swapped = false;

    let dx = 0;
    const B = 1.5;
    if (direction === 'left') dx = B;
    if (direction === 'right') dx = -B;

    const t0 = performance.now();
    const WARP_MS = 6000;
    const easeInOutQuart = (x: number) => (x < 0.5 ? 8 * x * x * x * x : 1 - Math.pow(-2 * x + 2, 4) / 2);
    const smooth = (x: number) => {
      const clamped = Math.max(0, Math.min(1, x));
      return clamped * clamped * (3 - 2 * clamped);
    };

    function step(now: number) {
      const pr = Math.min((now - t0) / WARP_MS, 1);
      const t = pr < 0.34 ? 0 : Math.min(1, (pr - 0.34) / 0.56);
      let vis = 1;

      const { material, camera } = threeRefs.current;

      if (pr < 0.08) {
        const p = pr / 0.08;
        if (camera) camera.fov = 60 - p * 5;
        warpState.current.warpFactor = p * 0.05;
      } else if (pr < 0.25) {
        const p = (pr - 0.08) / 0.17;
        const e = easeInOutQuart(p);
        warpState.current.warpFactor = 0.05 + e * 0.95;
        if (camera) camera.fov = 55 + e * 85;
        warpState.current.currentCurve.x = dx * e;
      } else if (pr < 0.5) {
        warpState.current.warpFactor = 1;
        if (camera) camera.fov = 140;
        warpState.current.currentCurve.x = dx;
      } else if (pr < 0.9) {
        const p = (pr - 0.5) / 0.4;
        const e = 1 - Math.pow(1 - p, 3);
        warpState.current.warpFactor = 1 - 0.88 * e;
        if (camera) camera.fov = 140 - 78 * e;
        warpState.current.currentCurve.x = dx * (1 - e);
      } else {
        const p = (pr - 0.9) / 0.1;
        warpState.current.warpFactor = 0.12 * (1 - p);
        if (camera) camera.fov = 62 - 2 * p;
        warpState.current.currentCurve.x = 0;
        vis = 1 - smooth((p - 0.2) / 0.8);
        if (p > 0.2 && !warpState.current.swapped) {
          warpState.current.swapped = true;
          setCurrentPage(id);
        }
      }

      if (material) {
        material.uniforms.uWarpFactor.value = warpState.current.warpFactor;
        material.uniforms.uCurve.value.set(warpState.current.currentCurve.x, 0);
      }
      if (camera) camera.updateProjectionMatrix();

      drawArrival(id, t, vis, now);

      if (pr < 1) {
        requestAnimationFrame(step);
      } else {
        if (!warpState.current.swapped) setCurrentPage(id);
        warpState.current.isWarping = false;
        warpState.current.warpFactor = 0;
        warpState.current.currentCurve.x = 0;
        if (material) {
          material.uniforms.uWarpFactor.value = 0;
          material.uniforms.uCurve.value.set(0, 0);
        }
        if (camera) {
          camera.fov = 60;
          camera.updateProjectionMatrix();
        }
        const canvas = arriveCanvasRef.current;
        if (canvas) {
          const ax = canvas.getContext('2d');
          ax?.clearRect(0, 0, canvas.width, canvas.height);
        }
      }
    }

    requestAnimationFrame(step);
  }, [drawArrival]);

  // Navigate between pages
  const navigateTo = useCallback(
    (id: string) => {
      if (id === currentPage || warpState.current.isWarping) return;
      const curIdx = NAV_ITEMS.findIndex((n) => n[0] === currentPage);
      const nextIdx = NAV_ITEMS.findIndex((n) => n[0] === id);
      const dir = nextIdx > curIdx ? 'right' : 'left';
      executeCinematicWarp(id, dir);
      try {
        window.history.replaceState(null, '', `#${id === 'about' ? 'showcase' : id}`);
      } catch {}
    },
    [currentPage, executeCinematicWarp]
  );

  // Handle URL hash on initial load
  useEffect(() => {
    const h = window.location.hash.slice(1);
    if (NAV_ITEMS.some((n) => n[0] === h)) {
      setCurrentPage(h);
    } else if (h.startsWith('p/')) {
      const pid = h.slice(2);
      const p = projects.find((x) => x.id === pid);
      if (p) {
        setCurrentPage('work');
        setActiveProject(p);
      }
    } else {
      const p = projects.find((x) => x.id === h);
      if (p) {
        setCurrentPage('work');
        setActiveProject(p);
      }
    }
  }, [projects]);

  // AxP Studio Intro execution
  const introCanvasRef = useRef<HTMLCanvasElement>(null);
  const [introPercent, setIntroPercent] = useState('000');
  const [introStatus, setIntroStatus] = useState('ACQUIRING SIGNAL');

  useEffect(() => {
    if (!showIntro) return;
    const canvas = introCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let done = false;
    const t0 = performance.now();
    const D = Math.min(window.devicePixelRatio, 2);
    const W = window.innerWidth;
    const H = window.innerHeight;
    canvas.width = W * D;
    canvas.height = H * D;

    const S = Math.min(W / 6.6, 176);
    const oc = document.createElement('canvas');
    oc.width = W;
    oc.height = H;
    const o = oc.getContext('2d', { willReadFrequently: true });
    if (!o) return;

    o.font = `700 ${S}px Inter,sans-serif`;
    o.textBaseline = 'middle';
    o.fillStyle = '#fff';
    o.fillText('AxP Studio', W / 2 - o.measureText('AxP Studio').width / 2, H * 0.47);

    const d = o.getImageData(0, 0, W, H).data;
    const P: number[] = [];
    for (let y = 0; y < H; y += 3) {
      for (let x = 0; x < W; x += 3) {
        if (d[(y * W + x) * 4 + 3] > 128) P.push(x, y);
      }
    }

    const N = P.length / 2;
    const tx = new Float32Array(N);
    const ty = new Float32Array(N);
    const sx = new Float32Array(N);
    const sy = new Float32Array(N);
    const dl = new Float32Array(N);
    const R = Math.max(W, H);

    for (let i = 0; i < N; i++) {
      tx[i] = P[i * 2];
      ty[i] = P[i * 2 + 1];
      const a = Math.random() * 6.283;
      const dist = R * (0.55 + Math.random() * 0.9);
      sx[i] = W / 2 + Math.cos(a) * dist;
      sy[i] = H / 2 + Math.sin(a) * dist;
      dl[i] = Math.random() * 1.3;
    }

    function frame(now: number) {
      if (done || !ctx) return;
      const tt = (now - t0) / 1000;
      const pg = Math.min(1, tt / 4.9);
      setIntroPercent(String(Math.round(pg * 100)).padStart(3, '0'));

      if (tt < 0.7) setIntroStatus('ACQUIRING SIGNAL');
      else if (tt < 2.2) setIntroStatus('RESOLVING AXP STUDIO');
      else if (tt < 3.3) setIntroStatus('LOCKING ON');
      else if (tt < 4.9) setIntroStatus('AXP STUDIO — ONLINE');
      else setIntroStatus('ENTERING PORTFOLIO');

      ctx.setTransform(D, 0, 0, D, 0, 0);
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#00e5ff';

      for (let i = 0; i < N; i++) {
        const p = (tt - 0.7 - dl[i]) / 1.5;
        if (p <= 0) continue;
        const e = 1 - Math.pow(1 - Math.max(0, Math.min(1, p)), 3);
        const x = sx[i] + (tx[i] - sx[i]) * e;
        const y = sy[i] + (ty[i] - sy[i]) * e;
        ctx.fillRect(x, y, 1.8, 1.8);
      }

      if (tt > 3.2) {
        ctx.font = `700 ${S}px Inter,sans-serif`;
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#fff';
        ctx.shadowColor = '#00e5ff';
        ctx.shadowBlur = 24;
        ctx.fillText('AxP Studio', W / 2 - ctx.measureText('AxP Studio').width / 2, H * 0.47);
      }

      if (tt < 5.8) {
        animId = requestAnimationFrame(frame);
      } else {
        done = true;
        setShowIntro(false);
        try {
          sessionStorage.setItem('axp', '1');
        } catch {}
      }
    }

    animId = requestAnimationFrame(frame);

    return () => {
      done = true;
      cancelAnimationFrame(animId);
    };
  }, [showIntro]);

  const filteredProjects = useMemo(() => {
    if (workFilter === 'All') return projects;
    return projects.filter((p) => p.st === workFilter);
  }, [projects, workFilter]);

  const filteredDocs = useMemo(() => {
    if (libFilter === 'All') return libraryDocs;
    return libraryDocs.filter((d) => d.t === libFilter);
  }, [libraryDocs, libFilter]);

  // Project pagination
  const openProject = (p: ShowcaseProject) => {
    setActiveProject(p);
    try {
      window.history.replaceState(null, '', `#${p.id}`);
    } catch {}
  };

  const closeProject = () => {
    setActiveProject(null);
    try {
      window.history.replaceState(null, '', `#${currentPage === 'about' ? 'showcase' : currentPage}`);
    } catch {}
  };

  const currentIdx = activeProject ? projects.indexOf(activeProject) : -1;
  const prevProject = currentIdx >= 0 ? projects[(currentIdx + projects.length - 1) % projects.length] : null;
  const nextProject = currentIdx >= 0 ? projects[(currentIdx + 1) % projects.length] : null;

  return (
    <div className="showcase-root">
      {/* Three.js Particle Warp Canvas Container */}
      <div id="transition-container" ref={containerRef} />

      {/* Arrival Constellation 2D Overlay Canvas */}
      <canvas id="arrive" ref={arriveCanvasRef} />

      {/* AxP Studio Intro Experience */}
      {showIntro && (
        <div id="intro">
          <canvas id="ic" ref={introCanvasRef} />
          <div className="ihud">
            <i className="cn tl" />
            <i className="cn tr" />
            <i className="cn bl" />
            <i className="cn br" />
            <div className="itop">
              <span>
                <b />
                <u id="ist">{introStatus}</u>
              </span>
              <span className="mid">AxP Studio — Portfolio Transmission</span>
              <span>WorkandOwn</span>
            </div>
            <div className="ihl" />
            <div className="ibot">
              <p id="itag">
                {'Engineering systems. Designing experiences. Owning the outcome.'
                  .split(' ')
                  .map((w, i) => (
                    <span key={i} style={{ animationDelay: `${(2.2 + i * 0.08).toFixed(2)}s` }}>
                      {w}
                    </span>
                  ))}
              </p>
              <div className="ibar">
                <i style={{ transform: `scaleX(${parseInt(introPercent, 10) / 100})` }} />
              </div>
              <div className="irow">
                <span className="l">Engineering · Design · Systems</span>
                <span id="ipc">{introPercent}</span>
                <button
                  id="iskip"
                  onClick={() => {
                    setShowIntro(false);
                    try {
                      sessionStorage.setItem('axp', '1');
                    } catch {}
                  }}
                >
                  SKIP ›
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* NAV BAR */}
      <nav
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 30,
          padding: 'calc(26px + env(safe-area-inset-top, 0px)) 80px 0',
        }}
      >
        <div className="logo" onClick={() => navigateTo('about')} style={{ cursor: 'pointer' }}>
          Abhii
        </div>
        <div className="nav-links">
          {NAV_ITEMS.map(([id, label]) => (
            <a
              key={id}
              role="button"
              tabIndex={0}
              className={currentPage === id ? 'active-link' : ''}
              onClick={() => navigateTo(id)}
            >
              {label}
            </a>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button className="btn-start" onClick={() => navigateTo('contact')}>
            GET IN TOUCH
          </button>
          {onGoToWorkspace && (
            <button
              onClick={onGoToWorkspace}
              style={{
                border: '1px solid rgba(255,255,255,0.18)',
                background: 'rgba(255,255,255,0.04)',
                color: '#fff',
                padding: '10px 18px',
                borderRadius: '30px',
                font: '700 11px Inter,sans-serif',
                letterSpacing: '1.5px',
                cursor: 'pointer',
              }}
              title="Return to private JARVIS Workspace"
            >
              Workspace ↵
            </button>
          )}
        </div>
      </nav>

      {/* PAGE 1: ABOUT */}
      <div id="about" className={`mock-page ${currentPage === 'about' ? 'active' : ''}`}>
        <div style={{ height: '100px', flex: 'none' }} />
        <div className="content-container">
          <div className="label">WorkandOwn — By &amp; For Abhii</div>
          <h1 className="hero-title">Abhii.</h1>
          <p className="hero-subtitle">{INITIAL_ME.lead}</p>
          <div className="cta">
            <a role="button" tabIndex={0} onClick={() => navigateTo('work')}>
              Explore projects
            </a>
            <a role="button" tabIndex={0} onClick={() => navigateTo('library')}>
              Read the library
            </a>
          </div>
          <div className="stats">
            <div>
              <b>{projects.length}</b>Projects
            </div>
            <div>
              <b>{libraryDocs.length}</b>Documents
            </div>
            <div>
              <b>{new Set(projects.map((p) => p.st)).size}</b>Stages, all public
            </div>
          </div>
        </div>
      </div>

      {/* PAGE 2: WORK */}
      <div id="work" className={`mock-page ${currentPage === 'work' ? 'active' : ''}`}>
        <div style={{ height: '100px', flex: 'none' }} />
        <div className="content-container top">
          <div className="label">Selected Work</div>
          <h1 className="hero-title">Projects.</h1>
          <p className="hero-subtitle">
            Everything I am building, in the open. Open any project for the full story, links and documents.
          </p>
          <div className="chips">
            {['All', 'Active', 'In development', 'Prototype', 'Concept'].map((chip) => (
              <button
                key={chip}
                className={workFilter === chip ? 'on' : ''}
                onClick={() => setWorkFilter(chip)}
              >
                {chip}
              </button>
            ))}
          </div>

          <div className="grid">
            {filteredProjects.map((p, i) => (
              <article
                key={p.id}
                className="pc"
                onClick={() => openProject(p)}
                tabIndex={0}
                role="button"
                aria-label={`Open ${p.name}`}
              >
                <div
                  className="cv"
                  dangerouslySetInnerHTML={{ __html: generateCoverSvg(p) }}
                />
                <div className="cb">
                  <div className="m">
                    <span className={`dot ${STATUS_CLASS[p.st] || ''}`} />
                    {p.st}
                    <i>{String(i + 1).padStart(2, '0')}</i>
                  </div>
                  <h3>{p.name}</h3>
                  <p>{p.tag}</p>
                  <div className="tags">
                    {p.tags.map((t) => (
                      <span key={t}>{t}</span>
                    ))}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>

      {/* PAGE 3: LIBRARY */}
      <div id="library" className={`mock-page ${currentPage === 'library' ? 'active' : ''}`}>
        <div style={{ height: '100px', flex: 'none' }} />
        <div className="content-container top">
          <div className="label">Research &amp; Documentation</div>
          <h1 className="hero-title">Library.</h1>
          <p className="hero-subtitle">Documentation, research, plans and presentations.</p>
          <div className="chips">
            {['All', 'Presentation', 'Research', 'Architecture', 'Prototype'].map((chip) => (
              <button
                key={chip}
                className={libFilter === chip ? 'on' : ''}
                onClick={() => setLibFilter(chip)}
              >
                {chip}
              </button>
            ))}
          </div>

          <div className="rows">
            {filteredDocs.map((doc, idx) => (
              <div key={idx} className="row">
                <span className="t">{doc.t}</span>
                <div>
                  <h4>{doc.title}</h4>
                  <p>{doc.d}</p>
                </div>
                {doc.url ? (
                  <a href={doc.url} target="_blank" rel="noopener noreferrer">
                    Open ↗
                  </a>
                ) : (
                  <span className="o">On request</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* PAGE 4: PROCESS */}
      <div id="process" className={`mock-page ${currentPage === 'process' ? 'active' : ''}`}>
        <div style={{ height: '100px', flex: 'none' }} />
        <div className="content-container">
          <div className="label">How I work</div>
          <h1 className="hero-title">Process.</h1>
          <p className="hero-subtitle">The rules every project here is built under.</p>
          <div className="how">
            {W.map(([title, desc], idx) => (
              <div key={idx}>
                <b>{title}</b>
                <p>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* PAGE 5: CONTACT */}
      <div id="contact" className={`mock-page ${currentPage === 'contact' ? 'active' : ''}`}>
        <div style={{ height: '100px', flex: 'none' }} />
        <div className="content-container">
          <div className="label">Contact</div>
          <h1 className="hero-title">Get in touch.</h1>
          <div className="bio">
            {INITIAL_ME.bio.map((para, idx) => (
              <p key={idx}>{para}</p>
            ))}
          </div>
          <div className="links">
            {INITIAL_ME.links.map((link, idx) => (
              <a key={idx} href={link.u} target="_blank" rel="noopener noreferrer">
                {link.l} ↗
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* PROJECT DETAIL MODAL OVERLAY */}
      {activeProject && (
        <div id="detail" className="on">
          <div className="dw">
            <div className="bar">
              <button onClick={closeProject}>← All projects</button>
              <button onClick={closeProject} aria-label="Close">
                Close ×
              </button>
            </div>

            <div
              className="dcv"
              dangerouslySetInnerHTML={{ __html: generateCoverSvg(activeProject) }}
            />

            <div className="m" style={{ marginTop: '26px' }}>
              <span className={`dot ${STATUS_CLASS[activeProject.st] || ''}`} />
              {activeProject.st}
            </div>

            <h1>{activeProject.name}</h1>
            <p className="tag">{activeProject.tag}</p>

            <div className="tags" style={{ padding: 0 }}>
              {activeProject.tags.map((t) => (
                <span key={t}>{t}</span>
              ))}
            </div>

            <h5>Overview</h5>
            {activeProject.desc.map((para, idx) => (
              <p key={idx} className="b">
                {para}
              </p>
            ))}

            <h5>Key points</h5>
            <ul>
              {activeProject.pts.map((pt, idx) => (
                <li key={idx}>{pt}</li>
              ))}
            </ul>

            {activeProject.links && activeProject.links.length > 0 && (
              <>
                <h5>Links</h5>
                <div className="links" style={{ marginTop: 0 }}>
                  {activeProject.links.map((link, idx) => (
                    <a key={idx} href={link.u} target="_blank" rel="noopener noreferrer">
                      {link.l} ↗
                    </a>
                  ))}
                </div>
              </>
            )}

            {libraryDocs.filter((d) => d.p === activeProject.id).length > 0 && (
              <>
                <h5>Documentation</h5>
                <div className="rows" style={{ marginTop: 0 }}>
                  {libraryDocs
                    .filter((d) => d.p === activeProject.id)
                    .map((d, idx) => (
                      <div key={idx} className="row" style={{ gridTemplateColumns: '110px 1fr auto' }}>
                        <span className="t">{d.t}</span>
                        <div>
                          <h4>{d.title}</h4>
                          <p>{d.d}</p>
                        </div>
                        {d.url ? (
                          <a href={d.url} target="_blank" rel="noopener noreferrer">
                            Open ↗
                          </a>
                        ) : (
                          <span className="o">On request</span>
                        )}
                      </div>
                    ))}
                </div>
              </>
            )}

            <div className="pn">
              {prevProject && (
                <button onClick={() => openProject(prevProject)}>
                  ← {prevProject.name}
                </button>
              )}
              {nextProject && (
                <button onClick={() => openProject(nextProject)}>
                  {nextProject.name} →
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
