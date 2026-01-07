import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

const ThreeGlobe: React.FC = () => {
    const mountRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!mountRef.current) return;

        // Scene Setup
        const scene = new THREE.Scene();
        scene.fog = new THREE.FogExp2(0x000000, 0.002); // Add depth with fog

        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.z = 2.5; // Closer for impact

        const renderer = new THREE.WebGLRenderer({
            alpha: true,
            antialias: true,
            powerPreference: "high-performance"
        });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // optimize for high DPI
        mountRef.current.appendChild(renderer.domElement);

        // Globe Group
        const globeGroup = new THREE.Group();
        scene.add(globeGroup);

        // 1. The Core Sphere (Dark Ocean)
        const geometry = new THREE.SphereGeometry(1, 64, 64);
        const material = new THREE.MeshPhongMaterial({
            color: 0x0f172a, // Slate 900
            emissive: 0x1e293b,
            specular: 0x111111,
            shininess: 10,
            transparent: true,
            opacity: 0.9,
        });
        const earth = new THREE.Mesh(geometry, material);
        globeGroup.add(earth);

        // 2. Wireframe / Grid Layer (Tech feel)
        const wireframeMat = new THREE.MeshBasicMaterial({
            color: 0x3b82f6, // Blue 500
            wireframe: true,
            transparent: true,
            opacity: 0.15,
        });
        const wireframeGlobe = new THREE.Mesh(geometry, wireframeMat);
        wireframeGlobe.scale.set(1.01, 1.01, 1.01);
        globeGroup.add(wireframeGlobe);

        // 3. Particles / Stars Environment
        const particlesGeometry = new THREE.BufferGeometry();
        const particlesCount = 1500;
        const posArray = new Float32Array(particlesCount * 3);

        for (let i = 0; i < particlesCount * 3; i++) {
            // Spread particles around smoothly
            posArray[i] = (Math.random() - 0.5) * 8;
        }

        particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
        const particlesMaterial = new THREE.PointsMaterial({
            size: 0.015,
            color: 0x60a5fa, // Light blue
            transparent: true,
            opacity: 0.6,
            blending: THREE.AdditiveBlending
        });
        const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
        scene.add(particlesMesh);

        // 4. Glowing Atmosphere (Using custom shader simplified via sprite)
        // Creating a glow effect using a slightly larger sphere with back-side rendering suitable for atmosphere is complex in raw Three.js without shaders.
        // Instead, we'll use a rim-light feel with point lights.

        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.2); // Soft overall light
        scene.add(ambientLight);

        // Purple light from bottom right
        const pointLight1 = new THREE.PointLight(0xa855f7, 2, 10);
        pointLight1.position.set(2, -2, 2);
        scene.add(pointLight1);

        // Cyan light from top left
        const pointLight2 = new THREE.PointLight(0x06b6d4, 2, 10);
        pointLight2.position.set(-2, 2, 2);
        scene.add(pointLight2);

        // Animation Loop
        let mouseX = 0;
        let mouseY = 0;
        let targetX = 0;
        let targetY = 0;

        const windowHalfX = window.innerWidth / 2;
        const windowHalfY = window.innerHeight / 2;

        const onDocumentMouseMove = (event: MouseEvent) => {
            mouseX = (event.clientX - windowHalfX);
            mouseY = (event.clientY - windowHalfY);
        };

        // Add event listener locally to this component's effect
        document.addEventListener('mousemove', onDocumentMouseMove);

        const clock = new THREE.Clock();

        const animate = () => {
            const elapsedTime = clock.getElapsedTime();

            targetX = mouseX * 0.001;
            targetY = mouseY * 0.001;

            // Smooth rotation based on mouse
            globeGroup.rotation.y += 0.5 * (targetX - globeGroup.rotation.y);
            globeGroup.rotation.x += 0.5 * (targetY - globeGroup.rotation.x);

            // Constant gentle rotation
            globeGroup.rotation.y += 0.002;

            // Float effect for particles
            particlesMesh.rotation.y = -elapsedTime * 0.05;
            particlesMesh.rotation.x = mouseX * 0.0001;

            renderer.render(scene, camera);
            requestAnimationFrame(animate);
        };

        animate();

        // Resize Handler
        const handleResize = () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        };
        window.addEventListener('resize', handleResize);

        // Cleanup
        return () => {
            window.removeEventListener('resize', handleResize);
            document.removeEventListener('mousemove', onDocumentMouseMove);
            if (mountRef.current) {
                mountRef.current.removeChild(renderer.domElement);
            }
            // Dispose geometries and materials to avoid leaks
            geometry.dispose();
            material.dispose();
            wireframeMat.dispose();
            particlesGeometry.dispose();
            particlesMaterial.dispose();
        };

    }, []);

    return (
        <div
            ref={mountRef}
            className="absolute inset-0 z-0 pointer-events-none opacity-60"
            style={{ overflow: 'hidden' }}
        />
    );
};

export default ThreeGlobe;
