import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

import './ToolModel.css';

const TOOLS_URL = '/models/barber-tools/Barber_Tool.gltf';
const HOLD_MS = 3000;
const FADE_MS = 450;
const FILL = 0.78;
const MAX_TURN = 0.7;

const ease = (t: number) => t * t * (3 - 2 * t);

interface Tool {
  root: THREE.Group;
  holder: THREE.Group;
  radius: number;
  materials: THREE.Material[];
  isScissor: boolean;
}

// The scissors read small next to the bulkier tools, so they get their own boost.
const SCISSOR_BOOST = 1.45;

interface ToolModelProps {
  isEntered: boolean;
}

const ToolModel: React.FC<ToolModelProps> = ({ isEntered }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  // Lets the effect below reveal the tool once the hero is on screen.
  const revealRef = useRef<(() => void) | null>(null);
  const revealedRef = useRef(isEntered);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    // Tools are authored facing +Z, so the camera sits on Z and looks back.
    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
    camera.position.set(0, 0, 8);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearAlpha(0);
    mount.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 1));
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.6);
    keyLight.position.set(2, 3, 4);
    scene.add(keyLight);

    // Metals need something to reflect or they render near black.
    const pmrem = new THREE.PMREMGenerator(renderer);
    const envMap = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envMap;
    scene.environmentIntensity = 0.75;

    const pivot = new THREE.Group();
    scene.add(pivot);

    const pointer = new THREE.Vector2();
    const tools: Tool[] = [];
    let active = -1;
    let opacity = 0;
    // Sequential fade, never two tools at once: overlapping transparent models
    // in the same spot write depth and z-fight.
    let phase: 'idle' | 'out' | 'in' = 'idle';
    let phaseStart = 0;
    let holdStart = 0;

    const paint = () => {
      tools.forEach((tool, index) => {
        const value = index === active ? opacity : 0;
        tool.root.visible = value > 0.002;
        tool.materials.forEach((material) => {
          material.opacity = value;
        });
      });
    };

    // Tools differ in size, so the camera has to reframe on every switch.
    const frame = () => {
      const tool = tools[active];
      if (!tool) return;
      const radius = tool.radius / (tool.isScissor ? SCISSOR_BOOST : 1);
      const needed = (2 * radius) / FILL;
      const half = Math.tan((camera.fov * Math.PI) / 360);
      camera.position.z = Math.max(needed / (2 * half), needed / (2 * half * camera.aspect));
      camera.lookAt(0, 0, 0);
    };

    const resize = () => {
      const { clientWidth, clientHeight } = mount;
      // Can be 0 while the stylesheet is still being injected, so ignore and
      // let ResizeObserver call back once layout settles.
      if (!clientWidth || !clientHeight) return;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(clientWidth, clientHeight, false);
      camera.aspect = clientWidth / clientHeight;
      camera.updateProjectionMatrix();
      frame();
    };

    const observer = new ResizeObserver(resize);
    observer.observe(mount);

    new GLTFLoader().load(TOOLS_URL, (gltf) => {
      gltf.scene.updateWorldMatrix(true, true);

      const meshes: THREE.Mesh[] = [];
      gltf.scene.traverse((node) => {
        if ((node as THREE.Mesh).isMesh) meshes.push(node as THREE.Mesh);
      });

      meshes.forEach((mesh) => {
        // root carries the facing yaw, holder the authored placement.
        const root = new THREE.Group();
        const holder = new THREE.Group();
        holder.position.setFromMatrixPosition(mesh.matrixWorld);
        holder.quaternion.setFromRotationMatrix(mesh.matrixWorld);
        holder.scale.setFromMatrixScale(mesh.matrixWorld);

        // Both scissor meshes read small next to the bulkier tools.
        const isScissor = /scissors/i.test(mesh.name ?? '');

        const copy = mesh.clone(true);
        const materials: THREE.Material[] = [];
        copy.traverse((node) => {
          const part = node as THREE.Mesh;
          if (!part.isMesh) return;
          part.material = Array.isArray(part.material)
            ? part.material.map((material) => material.clone())
            : part.material?.clone();
          const list = Array.isArray(part.material) ? part.material : [part.material];
          list.forEach((material) => {
            if (!material) return;
            material.transparent = true;
            material.opacity = 0;
            materials.push(material);
          });
        });
        holder.add(copy);
        root.add(holder);

        // Yaw anything whose long axis points at the camera so it lies flat on screen.
        let box = new THREE.Box3().setFromObject(root);
        if (box.getSize(new THREE.Vector3()).z > box.getSize(new THREE.Vector3()).x) {
          holder.rotateY(Math.PI / 2);
          box = new THREE.Box3().setFromObject(root);
        }

        root.position.sub(box.getCenter(new THREE.Vector3()));
        const radius = box.getBoundingSphere(new THREE.Sphere()).radius;

        pivot.add(root);
        tools.push({ root, holder, radius, materials, isScissor });
      });

      if (tools.length === 0) return;
      // Lead with the scissors.
      const lead = tools.findIndex((tool) => tool.isScissor);
      if (lead > 0) tools.unshift(...tools.splice(lead, 1));

      revealRef.current = () => {
        opacity = 1;
        holdStart = performance.now();
        paint();
      };

      active = 0;
      // Stay hidden until the hero has faded in, then the scissors appear at once.
      opacity = revealedRef.current ? 1 : 0;
      if (opacity === 1) holdStart = performance.now();
      paint();
      resize();
    });

    const handlePointerMove = (event: PointerEvent) => {
      pointer.set((event.clientX / window.innerWidth - 0.5) * 2, 0);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      pointer.x = event.key === 'ArrowLeft' ? -1 : 1;
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('keydown', handleKeyDown);

    let frame2 = 0;
    const tick = () => {
      frame2 = requestAnimationFrame(tick);
      if (document.hidden) return;
      const now = performance.now();

      if (tools.length > 0) {
        if (phase === 'idle') {
          if (now - holdStart > HOLD_MS) {
            phase = 'out';
            phaseStart = now;
          }
        } else if (phase === 'out') {
          const t = Math.min(1, (now - phaseStart) / FADE_MS);
          opacity = 1 - ease(t);
          paint();
          if (t >= 1) {
            active = (active + 1) % tools.length;
            opacity = 0;
            phase = 'in';
            phaseStart = now;
            frame();
            paint();
          }
        } else {
          const t = Math.min(1, (now - phaseStart) / FADE_MS);
          opacity = ease(t);
          paint();
          if (t >= 1) {
            opacity = 1;
            phase = 'idle';
            holdStart = now;
          }
        }
      }

      // Turn the tool toward the cursor instead of spinning it.
      const yaw = -pointer.x * MAX_TURN;
      pivot.rotation.y += (yaw - pivot.rotation.y) * 0.06;
      renderer.render(scene, camera);
    };
    tick();

    return () => {
      cancelAnimationFrame(frame2);
      revealRef.current = null;
      observer.disconnect();
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('keydown', handleKeyDown);
      pivot.traverse((node) => {
        const mesh = node as THREE.Mesh;
        mesh.geometry?.dispose();
        const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        materials.forEach((material) => {
          Object.values(material ?? {}).forEach((value) => {
            if (value instanceof THREE.Texture) value.dispose();
          });
          material?.dispose();
        });
      });
      renderer.dispose();
      envMap.dispose();
      pmrem.dispose();
      mount.removeChild(renderer.domElement);
    };
  }, []);

  useEffect(() => {
    if (!isEntered || revealedRef.current) return;
    revealedRef.current = true;
    revealRef.current?.();
  }, [isEntered]);

  return <div ref={mountRef} className="trim-tools" aria-hidden="true" />;
};

export default ToolModel;