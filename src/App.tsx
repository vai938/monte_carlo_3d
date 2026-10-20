import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import gsap from 'gsap';

interface SimulationPoint {
  iteration: number;
  pi: number;
}

export const App: React.FC = () => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [simulationInput, setSimulationInput] = useState<string>('');
  const [piValue, setPiValue] = useState<string | number>('');

  // Store simulation history for CSV download
  const simulationDataRef = useRef<SimulationPoint[]>([]);

  // Three.js object references
  const cubeRef = useRef<THREE.Mesh | null>(null);
  const mesh3Ref = useRef<THREE.Mesh | null>(null);
  const groupRef = useRef<THREE.Group | null>(null);

  // Stats for Monte Carlo estimation
  const statsRef = useRef({
    pIn: 0,
    pOut: 0,
    pTotal: 0,
  });

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = window.innerWidth;
    const height = window.innerHeight;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    const camera = new THREE.PerspectiveCamera(45, width / height, 1, 500);
    camera.position.set(0, 0, 100);
    camera.lookAt(0, 0, 0);

    const scene = new THREE.Scene();
    const group = new THREE.Group();
    groupRef.current = group;

    const geometry = new THREE.BoxGeometry(40, 40, 40, 6, 6, 6);
    const material = new THREE.MeshBasicMaterial({
      color: 0xff0000,
      wireframe: true,
      transparent: true,
      opacity: 0.2,
      wireframeLinewidth: 2.5,
    });
    const cube = new THREE.Mesh(geometry, material);
    cubeRef.current = cube;

    const mesh3 = new THREE.Mesh(
      new THREE.SphereGeometry(20, 40, 40),
      new THREE.MeshBasicMaterial({
        color: 0x0000ff,
        transparent: true,
        opacity: 0.06,
        wireframe: true,
        wireframeLinewidth: 2.5,
      })
    );
    mesh3Ref.current = mesh3;

    group.add(cube, mesh3);
    scene.add(group);

    const mouse = {
      x: 0,
      y: 0,
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = (e.clientX / window.innerWidth) * 4 - 1;
      mouse.y = (e.clientY / window.innerHeight) * 4 + 1;
    };

    window.addEventListener('mousemove', handleMouseMove);

    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      cube.rotation.y += 0.01;
      mesh3.rotation.y += 0.01;
      gsap.to(group.rotation, {
        y: mouse.x * 0.5,
        x: -mouse.y * 0.5,
        duration: 2,
      });
      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      const newWidth = window.innerWidth;
      const newHeight = window.innerHeight;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      geometry.dispose();
      material.dispose();
    };
  }, []);

  const handleRunSimulation = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    const itt = Number(simulationInput);
    if (!itt || isNaN(itt) || itt <= 0) return;

    const main = {
      w: 400,
      h: 400,
    };
    const sphere = {
      x: main.w / 2,
      y: main.h / 2,
      z: main.h / 2,
      r: main.h / 2,
    };

    const cube = cubeRef.current;
    const mesh3 = mesh3Ref.current;
    if (!cube || !mesh3) return;

    for (let i = 1; i < itt; i++) {
      const geometry = new THREE.BufferGeometry();
      const vertices: number[] = [];
      const x = Math.floor(Math.random() * (main.h + 1));
      const y = Math.floor(Math.random() * (main.h + 1));
      const z = Math.floor(Math.random() * (main.h + 1));

      setTimeout(() => {
        const dist = Math.sqrt(
          (x - sphere.x) * (x - sphere.x) +
          (y - sphere.y) * (y - sphere.y) +
          (z - sphere.z) * (z - sphere.z)
        );

        if (dist < sphere.r) {
          statsRef.current.pIn++;
          const randomDirection = new THREE.Vector3(
            Math.random() - 0.5,
            Math.random() - 0.5,
            Math.random() - 0.5
          ).normalize();
          const radius3 = Math.random() * 19 + 1;
          const randomParticle = randomDirection.multiplyScalar(radius3);
          geometry.setAttribute(
            'position',
            new THREE.Float32BufferAttribute([randomParticle.x, randomParticle.y, randomParticle.z], 3)
          );

          const particles1 = new THREE.Points(
            geometry,
            new THREE.PointsMaterial({ color: 0xffffff, size: 0.8 })
          );
          mesh3.add(particles1);
        } else {
          statsRef.current.pOut++;
          vertices.push(THREE.MathUtils.randFloatSpread(40));
          vertices.push(THREE.MathUtils.randFloatSpread(40));
          vertices.push(THREE.MathUtils.randFloatSpread(40));
          geometry.setAttribute(
            'position',
            new THREE.Float32BufferAttribute(vertices, 3)
          );

          const particles = new THREE.Points(
            geometry,
            new THREE.PointsMaterial({ color: 0xffff00, size: 0.8 })
          );
          cube.add(particles);
        }

        const totalPoints = statsRef.current.pIn + statsRef.current.pOut;
        statsRef.current.pTotal = totalPoints;
        const calculatedPi = (6 * statsRef.current.pIn) / (totalPoints || 1);
        setPiValue(calculatedPi);

        simulationDataRef.current.push({
          iteration: i,
          pi: calculatedPi,
        });
      }, 1000);
    }
  };

  const handleDownload = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    let rows = 'Iteration,Calculated Pi \n';
    simulationDataRef.current.forEach((cell) => {
      rows += `${cell.iteration},${cell.pi}\n`;
    });

    const hiddenElement = document.createElement('a');
    hiddenElement.href = 'data:text/csv;charset=utf-8,' + encodeURI(rows);
    hiddenElement.target = '_blank';
    hiddenElement.download = 'Monte-carlo-3d_data.csv';
    hiddenElement.click();
  };

  return (
    <>
      <div
        ref={mountRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 0,
        }}
      />
      <div className="content_value" style={{ position: 'relative', zIndex: 1 }}>
        <div className="pi">
          <label htmlFor="input">Enter the number of Simulation</label>
          <br />
          <input
            id="input"
            type="text"
            className="piVal"
            value={simulationInput}
            onChange={(e) => setSimulationInput(e.target.value)}
          />
          <br />
          <button className="btn" onClick={handleRunSimulation}>
            Submit
          </button>
          <br />
          <button className="click btn" onClick={handleDownload}>
            File download
          </button>
          <br />
          Value of Pi <span className="piValue">{piValue !== '' ? piValue : ''}</span>
          <h1 className="heading">Monte Carlo Estimation of Pi using 3D model</h1>
        </div>
      </div>
    </>
  );
};

export default App;
