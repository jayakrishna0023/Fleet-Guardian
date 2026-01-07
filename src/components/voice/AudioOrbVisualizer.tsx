import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { AudioAnalyzer } from './AudioAnalyzer';

interface AudioOrbVisualizerProps {
  audioContext?: AudioContext;
  audioSource?: MediaStreamAudioSourceNode | AudioNode;
  isActive: boolean;
  state?: 'idle' | 'listening' | 'processing' | 'speaking';
}

export const AudioOrbVisualizer: React.FC<AudioOrbVisualizerProps> = ({
  audioContext,
  audioSource,
  isActive,
  state = 'idle',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sphereRef = useRef<THREE.Mesh | null>(null);
  const analyzerRef = useRef<AudioAnalyzer | null>(null);
  const animationIdRef = useRef<number | null>(null);
  const timeRef = useRef<number>(0);

  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize Three.js scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 3;
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ 
      alpha: true, 
      antialias: true 
    });
    renderer.setSize(
      containerRef.current.clientWidth,
      containerRef.current.clientHeight
    );
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Create ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    // Create point lights
    const pointLight1 = new THREE.PointLight(0x00ffff, 1, 100);
    pointLight1.position.set(5, 5, 5);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0xff00ff, 1, 100);
    pointLight2.position.set(-5, -5, 5);
    scene.add(pointLight2);

    // Create sphere geometry with more segments for smoother animation
    const geometry = new THREE.IcosahedronGeometry(1, 4);
    
    // Create shader material for the orb
    const material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        audioIntensity: { value: 0 },
        bassIntensity: { value: 0 },
        midIntensity: { value: 0 },
        trebleIntensity: { value: 0 },
        color1: { value: new THREE.Color(0x6366f1) }, // Indigo
        color2: { value: new THREE.Color(0x8b5cf6) }, // Purple
        color3: { value: new THREE.Color(0x06b6d4) }, // Cyan
        isActive: { value: isActive ? 1.0 : 0.0 },
      },
      vertexShader: `
        uniform float time;
        uniform float audioIntensity;
        uniform float bassIntensity;
        uniform float midIntensity;
        uniform float trebleIntensity;
        uniform float isActive;
        
        varying vec3 vNormal;
        varying vec3 vPosition;
        varying float vIntensity;
        
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vPosition = position;
          
          // Calculate audio-reactive displacement
          float bassWave = sin(position.y * 3.0 + time * 2.0) * bassIntensity * 0.3;
          float midWave = sin(position.x * 5.0 + time * 3.0) * midIntensity * 0.2;
          float trebleWave = sin(position.z * 7.0 + time * 4.0) * trebleIntensity * 0.15;
          
          // Idle pulsing animation
          float idlePulse = sin(time * 1.5) * 0.05;
          
          // Combine displacements
          float displacement = mix(
            idlePulse,
            bassWave + midWave + trebleWave,
            isActive
          );
          
          vec3 newPosition = position + normal * displacement;
          vIntensity = audioIntensity;
          
          gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform float audioIntensity;
        uniform vec3 color1;
        uniform vec3 color2;
        uniform vec3 color3;
        uniform float isActive;
        
        varying vec3 vNormal;
        varying vec3 vPosition;
        varying float vIntensity;
        
        void main() {
          // Calculate fresnel effect
          vec3 viewDirection = normalize(cameraPosition - vPosition);
          float fresnel = pow(1.0 - dot(viewDirection, vNormal), 3.0);
          
          // Mix colors based on audio intensity and position
          vec3 color = mix(color1, color2, vPosition.y * 0.5 + 0.5);
          color = mix(color, color3, vIntensity * isActive);
          
          // Add glow effect
          float glow = fresnel * (0.5 + vIntensity * isActive);
          color += glow;
          
          // Pulsing brightness
          float pulse = sin(time * 2.0) * 0.1 + 0.9;
          color *= pulse;
          
          gl_FragColor = vec4(color, 0.9);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide,
    });

    const sphere = new THREE.Mesh(geometry, material);
    scene.add(sphere);
    sphereRef.current = sphere;

    // Setup audio analyzer if audio source is provided
    if (audioContext && audioSource) {
      analyzerRef.current = new AudioAnalyzer(audioContext, audioSource);
    }

    // Handle window resize
    const handleResize = () => {
      if (!containerRef.current || !camera || !renderer) return;
      
      camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(
        containerRef.current.clientWidth,
        containerRef.current.clientHeight
      );
    };
    window.addEventListener('resize', handleResize);

    // Animation loop
    const animate = () => {
      timeRef.current += 0.016; // Approximate 60fps

      if (sphereRef.current && sphereRef.current.material instanceof THREE.ShaderMaterial) {
        const material = sphereRef.current.material;
        material.uniforms.time.value = timeRef.current;
        material.uniforms.isActive.value = isActive ? 1.0 : 0.0;

        // Update audio data if available
        if (analyzerRef.current && isActive) {
          const avgIntensity = analyzerRef.current.getAverageIntensity();
          const bass = analyzerRef.current.getBassIntensity();
          const mid = analyzerRef.current.getMidIntensity();
          const treble = analyzerRef.current.getTrebleIntensity();

          material.uniforms.audioIntensity.value = avgIntensity;
          material.uniforms.bassIntensity.value = bass;
          material.uniforms.midIntensity.value = mid;
          material.uniforms.trebleIntensity.value = treble;
        } else {
          // Smooth decay when not active
          material.uniforms.audioIntensity.value *= 0.95;
          material.uniforms.bassIntensity.value *= 0.95;
          material.uniforms.midIntensity.value *= 0.95;
          material.uniforms.trebleIntensity.value *= 0.95;
        }

        // Update colors based on state
        if (state === 'listening') {
          material.uniforms.color1.value.set(0x3b82f6); // Blue
          material.uniforms.color2.value.set(0x06b6d4); // Cyan
          material.uniforms.color3.value.set(0x0ea5e9); // Sky
        } else if (state === 'processing') {
          material.uniforms.color1.value.set(0xa855f7); // Purple
          material.uniforms.color2.value.set(0xec4899); // Pink
          material.uniforms.color3.value.set(0xf472b6); // Rose
        } else if (state === 'speaking') {
          material.uniforms.color1.value.set(0x10b981); // Emerald
          material.uniforms.color2.value.set(0x14b8a6); // Teal
          material.uniforms.color3.value.set(0x22d3ee); // Cyan
        } else {
          material.uniforms.color1.value.set(0x6366f1); // Indigo
          material.uniforms.color2.value.set(0x8b5cf6); // Purple
          material.uniforms.color3.value.set(0x06b6d4); // Cyan
        }
      }

      // Rotate sphere slowly
      if (sphereRef.current) {
        sphereRef.current.rotation.y += 0.002;
        sphereRef.current.rotation.x += 0.001;
      }

      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }

      animationIdRef.current = requestAnimationFrame(animate);
    };

    animate();

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      
      if (analyzerRef.current) {
        analyzerRef.current.dispose();
      }
      
      if (rendererRef.current && containerRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
        rendererRef.current.dispose();
      }
      
      if (sphereRef.current) {
        sphereRef.current.geometry.dispose();
        if (sphereRef.current.material instanceof THREE.Material) {
          sphereRef.current.material.dispose();
        }
      }
    };
  }, []);

  // Update active state and audio source
  useEffect(() => {
    if (audioContext && audioSource && !analyzerRef.current) {
      analyzerRef.current = new AudioAnalyzer(audioContext, audioSource);
    }
  }, [audioContext, audioSource]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full"
      style={{ minHeight: '400px' }}
    />
  );
};
