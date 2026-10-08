import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

/**
 * Shared plumbing for the three.js mounts.
 *
 * Creating a renderer, generating a PMREM environment and compiling materials
 * all block the main thread for seconds. Doing that inside the React commit
 * froze the page for 3-5s on every navigation, so mounts here build their stage
 * after the first paint and stop rendering whenever they are off screen.
 */

/** Defers work until after the browser has painted the new frame. */
export const afterPaint = (fn: () => void) => {
  let cancelled = false;
  const id = window.requestAnimationFrame(() => {
    // A second frame guarantees the paint has actually happened.
    window.requestAnimationFrame(() => {
      if (!cancelled) fn();
    });
  });
  return () => {
    cancelled = true;
    window.cancelAnimationFrame(id);
  };
};

export interface Stage {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  dispose: () => void;
}

/**
 * Builds the renderer, lights and environment. Returns null when the mount has
 * no box yet, which is a normal transient during route transitions.
 */
export const createStage = (mount: HTMLElement, fov = 35): Stage | null => {
  if (!mount.clientWidth || !mount.clientHeight) return null;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(fov, mount.clientWidth / mount.clientHeight, 0.1, 100);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearAlpha(0);
  mount.appendChild(renderer.domElement);

  scene.add(new THREE.AmbientLight(0xffffff, 1));
  const keyLight = new THREE.DirectionalLight(0xffffff, 1.5);
  keyLight.position.set(2, 3, 4);
  scene.add(keyLight);
  const rimLight = new THREE.DirectionalLight(0xffffff, 0.8);
  rimLight.position.set(-3, -1, -3);
  scene.add(rimLight);

  // Metals and acrylic need an environment or they render as flat colour.
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envMap = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = envMap;
  scene.environmentIntensity = 0.85;

  return {
    scene,
    camera,
    renderer,
    dispose: () => {
      renderer.dispose();
      envMap.dispose();
      pmrem.dispose();
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
    },
  };
};

/**
 * Reports whether an element is on screen. Ionic keeps previous pages in the
 * DOM, so without this their render loops keep burning CPU in the background.
 */
export const watchVisibility = (element: HTMLElement, onChange: (visible: boolean) => void) => {
  const observer = new IntersectionObserver(
    ([entry]) => onChange(entry.isIntersecting),
    { threshold: 0 },
  );
  observer.observe(element);
  return () => observer.disconnect();
};

/** Disposes the GPU resources under a node, including any textures. */
export const disposeNode = (node: THREE.Object3D) => {
  node.traverse((child) => {
    const mesh = child as THREE.Mesh;
    mesh.geometry?.dispose();
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    materials.forEach((material) => {
      Object.values(material ?? {}).forEach((value) => {
        if (value instanceof THREE.Texture) value.dispose();
      });
      material?.dispose();
    });
  });
};