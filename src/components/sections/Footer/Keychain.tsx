import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

import { afterPaint, createStage, disposeNode, watchVisibility } from '../../../lib/threeStage';
import './Keychain.css';

const MODEL_URL = '/models/keychain/footerchain.glb';
const ANIMATION_NAME = 'Mocha_Spin_360';
const NARROW = 768;

/**
 * Decorative footer backdrop. Plays the authored Mocha_Spin_360 clip and
 * adds a slow pointer-driven turn on top.
 */
const Keychain: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let isAlive = true;
    let isVisible = true;
    let frame = 0;
    let teardown: (() => void) | null = null;

    const pointer = new THREE.Vector2();

    // Deferred: the footer sits below three sections, so setup can wait.
    const cancelBuild = afterPaint(() => {
      if (!isAlive) return;

      const stage = createStage(mount);
      if (!stage) return;
      const { scene, camera, renderer } = stage;

      const pivot = new THREE.Group();
      scene.add(pivot);

      const mixer = new THREE.AnimationMixer(pivot);
      const clock = new THREE.Clock();

      const box = new THREE.Box3();
      const size = new THREE.Vector3();

      const fit = () => {
        if (size.lengthSq() === 0) return;
        // On wide screens the copy is in the left half, so shift right.
        pivot.position.x = mount.clientWidth < NARROW ? 0 : size.x * 0.22;

        const isNarrow = mount.clientWidth < NARROW;
        const halfFov = Math.tan((camera.fov * Math.PI) / 360);
        const forHeight = size.y / 2 / halfFov;
        const forWidth = size.x / 2 / (halfFov * camera.aspect);
        camera.position.z = Math.max(forHeight, forWidth) / (isNarrow ? 0.6 : 0.78);
        camera.lookAt(0, 0, 0);
      };

      const resize = () => {
        if (!mount.clientWidth || !mount.clientHeight) return;
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setSize(mount.clientWidth, mount.clientHeight, false);
        camera.aspect = mount.clientWidth / mount.clientHeight;
        camera.updateProjectionMatrix();
        fit();
      };

      const observer = new ResizeObserver(resize);
      observer.observe(mount);

      let hasModel = false;

      new GLTFLoader().load(MODEL_URL, (gltf) => {
        if (!isAlive) return;

        const root = gltf.scene;
        pivot.add(root);

        // Centre on the bounding box; scaling would break the tag normals.
        root.updateWorldMatrix(true, true);
        box.setFromObject(root);
        box.getSize(size);
        root.position.sub(box.getCenter(new THREE.Vector3()));
        fit();

        const clip = THREE.AnimationClip.findByName(gltf.animations, ANIMATION_NAME);
        if (clip) mixer.clipAction(clip).play();

        renderer.compile(scene, camera);
        hasModel = true;
      });

      const tick = () => {
        frame = window.requestAnimationFrame(tick);
        if (document.hidden || !hasModel || !isVisible) return;

        mixer.update(clock.getDelta());

        // Slow drift layered on the authored spin.
        pivot.rotation.y = pointer.x * 0.35 + clock.elapsedTime * 0.02;
        pivot.rotation.x = -pointer.x * 0.06;

        renderer.render(scene, camera);
      };
      tick();

      teardown = () => {
        window.cancelAnimationFrame(frame);
        observer.disconnect();
        mixer.stopAllAction();
        disposeNode(pivot);
        stage.dispose();
      };
    });

    const stopWatching = watchVisibility(mount, (visible) => {
      isVisible = visible;
    });

    const handlePointerMove = (event: PointerEvent) => {
      pointer.set((event.clientX / window.innerWidth - 0.5) * 2, 0);
    };
    window.addEventListener('pointermove', handlePointerMove);

    return () => {
      isAlive = false;
      cancelBuild();
      stopWatching();
      window.removeEventListener('pointermove', handlePointerMove);
      teardown?.();
    };
  }, []);

  return <div ref={mountRef} className="trim-keychain" aria-hidden="true" />;
};

export default Keychain;