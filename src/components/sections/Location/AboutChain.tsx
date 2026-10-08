import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

import { afterPaint, createStage, disposeNode, watchVisibility } from '../../../lib/threeStage';
import './AboutChain.css';

const MODEL_URL = '/models/keychain/aboutchain.glb';
// The clip in this file is named Mocha_Spin_360, not Mocha_Spin: it is the same
// authored animation the footer keychain uses.
const ANIMATION_NAME = 'Mocha_Spin_360';
const NARROW = 768;

/**
 * Decorative keychain in the right column of the about page. Plays the
 * authored Mocha_Spin clip and adds a slow pointer turn on top. The stage is
 * built after the first paint so arriving on this page never blocks on an 8MB
 * model, and rendering stops whenever the section scrolls away.
 */
const AboutChain: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let isAlive = true;
    let isVisible = true;
    let frame = 0;
    let teardown: (() => void) | null = null;

    const pointer = new THREE.Vector2();

    // Building the renderer, the PMREM environment and the compiled materials
    // blocks for seconds. Deferring past the first paint keeps the route
    // transition responsive; the model simply appears a beat later.
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
        const isNarrow = mount.clientWidth < NARROW;
        const halfFov = Math.tan((camera.fov * Math.PI) / 360);
        const forHeight = size.y / 2 / halfFov;
        const forWidth = size.x / 2 / (halfFov * camera.aspect);
        camera.position.z = Math.max(forHeight, forWidth) / (isNarrow ? 0.8 : 1);
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

        // Centre on the bounding box rather than scaling the model, which would
        // break the normals on the thin acrylic tags.
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

        // Slow turn layered over the authored spin, not a replacement for it.
        pivot.rotation.y = pointer.x * 0.3;
        pivot.rotation.x = -pointer.x * 0.05;

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

  return <div ref={mountRef} className="trim-about-chain" aria-hidden="true" />;
};

export default AboutChain;