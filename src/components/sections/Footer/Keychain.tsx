import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

import './Keychain.css';

const MODEL_URL = '/models/keychain/footerchain.glb';
const ANIMATION_NAME = 'Mocha_Spin_360';
const NARROW = 768;

/**
 * Decorative keychain backdrop for the footer. Plays the authored
 * Mocha_Spin_360 clip and adds a slow pointer-driven turn on top.
 */
const Keychain: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
    camera.position.set(0, 0, 8);
    camera.lookAt(0, 0, 0);

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

    // The clips are acrylic and anodised metal, both of which need an
    // environment to read as anything but flat colour.
    const pmrem = new THREE.PMREMGenerator(renderer);
    const envMap = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envMap;
    scene.environmentIntensity = 0.85;

    const pivot = new THREE.Group();
    scene.add(pivot);

    const mixer = new THREE.AnimationMixer(pivot);
    const clock = new THREE.Clock();
    const pointer = new THREE.Vector2();
    let hasModel = false;

    let refit: (() => void) | null = null;

    const resize = () => {
      const { clientWidth, clientHeight } = mount;
      // 0 until the stylesheet lands; ResizeObserver calls back once it settles.
      if (!clientWidth || !clientHeight) return;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(clientWidth, clientHeight, false);
      camera.aspect = clientWidth / clientHeight;
      camera.updateProjectionMatrix();
      refit?.();
    };

    new GLTFLoader().load(MODEL_URL, (gltf) => {
      gltf.scene.updateWorldMatrix(true, true);

      const root = gltf.scene;
      pivot.add(root);

      // Centre on the bounding box. Scaling the model instead would break the
      // normals on the thin acrylic tags.
      root.updateWorldMatrix(true, true);
      const box = new THREE.Box3().setFromObject(root);
      const size = box.getSize(new THREE.Vector3());
      root.position.sub(box.getCenter(new THREE.Vector3()));

      // Fit each axis against its own frustum limit rather than padding the model
      // out to a single bounding sphere. The chain is tall and narrow, so fitting
      // on longest-axis alone pulled the camera far back on a portrait phone and
      // left the model tiny in the middle of the screen.
      refit = () => {
        const isNarrow = mount.clientWidth < NARROW;
        const halfFov = Math.tan((camera.fov * Math.PI) / 360);
        const forHeight = size.y / 2 / halfFov;
        const forWidth = size.x / 2 / (halfFov * camera.aspect);
        // Narrow viewports keep it a backdrop rather than crowding the copy.
        const fill = isNarrow ? 0.6 : 0.78;
        camera.position.z = Math.max(forHeight, forWidth) / fill;
        camera.lookAt(0, 0, 0);

        // On wide screens the copy sits in the left half, so shift the chain into
        // the empty right side instead of letting it run through the labels.
        root.position.x = isNarrow ? 0 : size.x * 0.22;
      };
      refit();

      const clip = THREE.AnimationClip.findByName(gltf.animations, ANIMATION_NAME);
      if (clip) mixer.clipAction(clip).play();

      renderer.compile(scene, camera);
      hasModel = true;
    });

    const observer = new ResizeObserver(resize);
    observer.observe(mount);

    const handlePointerMove = (event: PointerEvent) => {
      pointer.set((event.clientX / window.innerWidth - 0.5) * 2, 0);
    };
    window.addEventListener('pointermove', handlePointerMove);

    let frame = 0;
    const tick = () => {
      frame = requestAnimationFrame(tick);
      if (document.hidden || !hasModel) return;

      mixer.update(clock.getDelta());

      // Slow drift on top of the authored spin, not a replacement for it.
      pivot.rotation.y = pointer.x * 0.35 + clock.elapsedTime * 0.02;
      pivot.rotation.x = -pointer.x * 0.06;

      renderer.render(scene, camera);
    };
    tick();

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener('pointermove', handlePointerMove);
      mixer.stopAllAction();
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

  return <div ref={mountRef} className="trim-keychain" aria-hidden="true" />;
};

export default Keychain;