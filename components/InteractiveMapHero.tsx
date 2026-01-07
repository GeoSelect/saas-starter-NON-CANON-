'use client';

import { useEffect, useRef } from 'react';

export function InteractiveMapHero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<any>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Dynamically import Three.js to avoid SSR issues
    import('three').then(({ Scene, PerspectiveCamera, WebGLRenderer, SphereGeometry, MeshPhongMaterial, Mesh, TextureLoader, PointLight, AmbientLight }) => {
      const container = containerRef.current;
      if (!container) return;

      // Scene setup
      const scene = new Scene();
      const camera = new PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
      const renderer = new WebGLRenderer({ antialias: true, alpha: true });

      renderer.setSize(container.clientWidth, container.clientHeight);
      renderer.setClearColor(0x1e293b, 0.1);
      container.appendChild(renderer.domElement);

      // Create a textured sphere (Earth)
      const geometry = new SphereGeometry(2, 64, 64);
      const canvas = document.createElement('canvas');
      canvas.width = 2048;
      canvas.height = 1024;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        // Draw a simple map-like texture
        ctx.fillStyle = '#1f2937';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Landmasses in orange
        ctx.fillStyle = '#f97316';
        ctx.beginPath();
        ctx.ellipse(300, 300, 150, 100, 0.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.ellipse(800, 250, 120, 80, 0.3, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.ellipse(1300, 350, 100, 70, -0.2, 0, Math.PI * 2);
        ctx.fill();

        // Grid lines
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;
        for (let i = 0; i < canvas.width; i += 256) {
          ctx.beginPath();
          ctx.moveTo(i, 0);
          ctx.lineTo(i, canvas.height);
          ctx.stroke();
        }
        for (let i = 0; i < canvas.height; i += 256) {
          ctx.beginPath();
          ctx.moveTo(0, i);
          ctx.lineTo(canvas.width, i);
          ctx.stroke();
        }
      }

      const texture = new TextureLoader().parse(canvas);
      const material = new MeshPhongMaterial({ map: texture });
      const globe = new Mesh(geometry, material);
      scene.add(globe);

      // Lighting
      const ambientLight = new AmbientLight(0xffffff, 0.6);
      scene.add(ambientLight);

      const pointLight = new PointLight(0xffffff, 1);
      pointLight.position.set(5, 3, 5);
      scene.add(pointLight);

      camera.position.z = 3.5;

      sceneRef.current = { scene, camera, renderer, globe };

      // Device orientation handling
      let alpha = 0, beta = 0, gamma = 0;

      const handleDeviceOrientation = (event: DeviceOrientationEvent) => {
        alpha = event.alpha ?? 0;
        beta = event.beta ?? 0;
        gamma = event.gamma ?? 0;
      };

      // Request permission for iOS 13+
      if (typeof DeviceOrientationEvent !== 'undefined' && typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
        (DeviceOrientationEvent as any).requestPermission()
          .then((permission: string) => {
            if (permission === 'granted') {
              window.addEventListener('deviceorientation', handleDeviceOrientation);
            }
          })
          .catch(() => {
            window.addEventListener('deviceorientation', handleDeviceOrientation);
          });
      } else {
        // Non-iOS devices
        window.addEventListener('deviceorientation', handleDeviceOrientation);
      }

      // Fallback: Mouse movement for desktop
      let mouseX = 0, mouseY = 0;
      const handleMouseMove = (e: MouseEvent) => {
        mouseX = (e.clientX / window.innerWidth) * 2 - 1;
        mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
      };
      window.addEventListener('mousemove', handleMouseMove);

      // Animation loop
      const animate = () => {
        requestAnimationFrame(animate);

        if (globe) {
          // Rotation based on device orientation
          globe.rotation.y = (gamma * Math.PI) / 180 * 0.5;
          globe.rotation.x = (beta * Math.PI) / 180 * 0.5;

          // Fallback rotation for desktop
          globe.rotation.y += mouseX * 0.1;
          globe.rotation.x += mouseY * 0.1;

          // Gentle auto-rotation when idle
          globe.rotation.z += 0.001;
        }

        renderer.render(scene, camera);
      };
      animate();

      // Handle window resize
      const handleResize = () => {
        if (!container) return;
        const width = container.clientWidth;
        const height = container.clientHeight;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
      };

      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('deviceorientation', handleDeviceOrientation);
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('resize', handleResize);
        container.removeChild(renderer.domElement);
      };
    });
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-full h-96 rounded-2xl overflow-hidden shadow-lg"
      style={{ background: 'linear-gradient(to bottom, #1e293b, #0f172a)' }}
    />
  );
}
