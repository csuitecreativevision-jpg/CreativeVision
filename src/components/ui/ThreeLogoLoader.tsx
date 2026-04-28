import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { motion } from 'framer-motion';
import { usePortalThemeOptional } from '../../contexts/PortalThemeContext';

export const ThreeLogoLoader = () => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const theme = usePortalThemeOptional();
    const isDark = theme?.isDark ?? (localStorage.getItem('portal_ui_dark_mode') !== 'false');

    useEffect(() => {
        const host = containerRef.current;
        if (!host) return;
        const size = Math.max(220, Math.min(window.innerWidth * 0.62, 320));

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
        camera.position.z = 3;

        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setSize(size, size);
        renderer.setClearAlpha(0);
        host.appendChild(renderer.domElement);

        const loader = new THREE.TextureLoader();
        const texture = loader.load('/Untitled design (3).png');
        texture.colorSpace = THREE.SRGBColorSpace;

        const geometry = new THREE.PlaneGeometry(1.5, 1.5);
        const material = new THREE.MeshBasicMaterial({
            map: texture,
            color: isDark ? 0xffffff : 0x111111,
            transparent: true,
            side: THREE.DoubleSide,
        });
        const logoMesh = new THREE.Mesh(geometry, material);
        scene.add(logoMesh);

        const haloGeometry = new THREE.RingGeometry(0.96, 1.11, 64);
        const haloMaterial = new THREE.MeshBasicMaterial({
            color: isDark ? 0x8b5cf6 : 0x52525b,
            transparent: true,
            opacity: isDark ? 0.22 : 0.18,
            side: THREE.DoubleSide,
        });
        const haloMesh = new THREE.Mesh(haloGeometry, haloMaterial);
        haloMesh.position.z = -0.02;
        scene.add(haloMesh);

        const clock = new THREE.Clock();
        let frameId = 0;
        let mounted = true;
        let rotationY = 0;
        let wobbleX = 0;
        let dragVelocity = 0;
        let dragWobble = 0;
        let boost = 0;
        let isPointerDown = false;
        let lastPointerX = 0;

        const onPointerDown = (e: PointerEvent) => {
            isPointerDown = true;
            lastPointerX = e.clientX;
            boost = 1;
            host.style.cursor = 'grabbing';
        };

        const onPointerMove = (e: PointerEvent) => {
            if (!isPointerDown) return;
            const dx = e.clientX - lastPointerX;
            lastPointerX = e.clientX;
            dragVelocity += dx * 0.0015;
            dragWobble += dx * 0.0005;
        };

        const onPointerUp = () => {
            isPointerDown = false;
            host.style.cursor = 'grab';
        };

        host.style.cursor = 'grab';
        host.style.touchAction = 'none';
        host.addEventListener('pointerdown', onPointerDown);
        window.addEventListener('pointermove', onPointerMove);
        window.addEventListener('pointerup', onPointerUp);
        window.addEventListener('pointercancel', onPointerUp);

        const animate = () => {
            if (!mounted) return;
            const t = clock.getElapsedTime();
            const baseSpin = 0.022;
            rotationY += baseSpin + dragVelocity;
            wobbleX = Math.sin(t * 0.9) * 0.12 + dragWobble;
            dragVelocity *= 0.93;
            dragWobble *= 0.9;
            boost *= 0.92;

            logoMesh.rotation.y = rotationY;
            logoMesh.rotation.x = wobbleX;

            const boostScale = 1 + boost * 0.09;
            logoMesh.scale.set(boostScale, boostScale, 1);
            haloMesh.rotation.z += 0.007 + boost * 0.02;
            haloMesh.material.opacity = (isDark ? 0.18 : 0.12) + Math.max(0, boost) * (isDark ? 0.3 : 0.2);
            haloMesh.scale.set(1 + boost * 0.12, 1 + boost * 0.12, 1);

            renderer.render(scene, camera);
            frameId = requestAnimationFrame(animate);
        };
        animate();

        return () => {
            mounted = false;
            host.removeEventListener('pointerdown', onPointerDown);
            window.removeEventListener('pointermove', onPointerMove);
            window.removeEventListener('pointerup', onPointerUp);
            window.removeEventListener('pointercancel', onPointerUp);
            if (frameId) cancelAnimationFrame(frameId);
            geometry.dispose();
            material.dispose();
            haloGeometry.dispose();
            haloMaterial.dispose();
            texture.dispose();
            renderer.dispose();
            if (host.contains(renderer.domElement)) {
                host.removeChild(renderer.domElement);
            }
        };
    }, [isDark]);

    return (
        <div className={`min-h-screen w-full flex items-center justify-center ${isDark ? 'bg-black' : 'bg-white'}`}>
            <motion.div
                className="flex flex-col items-center justify-center"
                initial={{ opacity: 0, scale: 0.96, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.55, ease: 'easeOut' }}
            >
                <div
                    ref={containerRef}
                    className="w-[min(62vw,320px)] h-[min(62vw,320px)] min-w-[220px] min-h-[220px] flex items-center justify-center overflow-visible"
                />
                <p className={`mt-4 text-xs tracking-[0.2em] ${isDark ? 'text-white/70' : 'text-zinc-800'}`}>CREATIVE VISION</p>
                <p className={`mt-2 text-[10px] tracking-[0.14em] uppercase ${isDark ? 'text-white/45' : 'text-zinc-500'}`}>Drag or click the logo</p>
            </motion.div>
        </div>
    );
};
