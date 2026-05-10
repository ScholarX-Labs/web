import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

const DigitalPetalsShader = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const clock = new THREE.Clock();

    const vertexShader = `void main(){gl_Position=vec4(position,1.0);}`;

    const fragmentShader = `precision highp float;uniform vec2 iResolution;uniform float iTime;uniform vec2 iMouse;float random(vec2 st){return fract(sin(dot(st.xy,vec2(12.9898,78.233)))*43758.5453123);}void main(){vec2 uv=(gl_FragCoord.xy-0.5*iResolution.xy)/iResolution.y;vec2 mouse=(iMouse-0.5*iResolution.xy)/iResolution.y;float t=iTime*0.3;float r=length(uv);float a=atan(uv.y,uv.x);float mouseDist=length(uv-mouse);float bloom=smoothstep(0.4,0.0,mouseDist);float petals=5.0+sin(t)*2.0;float petalShape=sin(a*petals+r*2.0);petalShape=pow(abs(petalShape),0.5);float flow=sin(r*10.0-t*2.0);float pattern=mix(petalShape,flow,0.5)+bloom*0.5;vec3 color1=vec3(0.8,0.1,0.5);vec3 color2=vec3(0.2,0.4,0.9);vec3 highlightColor=vec3(1.0);vec3 finalColor=mix(color1,color2,smoothstep(0.5,0.8,r+random(vec2(t,t))*0.1))*pattern;finalColor+=highlightColor*pow(pattern,10.0)*(1.0+bloom);gl_FragColor=vec4(finalColor,1.0);}`;

    const uniforms = {
      iTime: { value: 0 },
      iResolution: { value: new THREE.Vector2() },
      iMouse: { value: new THREE.Vector2() },
    };

    const material = new THREE.ShaderMaterial({ vertexShader, fragmentShader, uniforms });
    const geometry = new THREE.PlaneGeometry(2, 2);
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    const onResize = () => {
      const width = container.clientWidth;
      const height = container.clientHeight;
      renderer.setSize(width, height);
      uniforms.iResolution.value.set(width, height);
    };
    window.addEventListener('resize', onResize);
    onResize();
    uniforms.iMouse.value.set(container.clientWidth / 2, container.clientHeight / 2);

    const onMouseMove = (e: MouseEvent) => {
      uniforms.iMouse.value.set(e.clientX, container.clientHeight - e.clientY);
    };
    window.addEventListener('mousemove', onMouseMove);

    renderer.setAnimationLoop(() => {
      uniforms.iTime.value = clock.getElapsedTime();
      renderer.render(scene, camera);
    });

    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('mousemove', onMouseMove);
      renderer.setAnimationLoop(null);
      const canvas = renderer.domElement;
      if (canvas && canvas.parentNode) canvas.parentNode.removeChild(canvas);
      material.dispose();
      geometry.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="shader-container"
      style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: -1, pointerEvents: 'none' }}
      aria-label="Digital Petals animated background"
    />
  );
};

export default DigitalPetalsShader;
