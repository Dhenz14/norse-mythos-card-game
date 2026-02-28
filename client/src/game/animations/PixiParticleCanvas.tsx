import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Application, Graphics, Container } from 'pixi.js';
import gsap from 'gsap';

export interface ParticleColor {
	primary: string;
	secondary: string;
	glow: string;
}

export const ELEMENT_PALETTES: Record<string, ParticleColor> = {
	fire:      { primary: '#ff5500', secondary: '#ffd700', glow: 'rgba(255,85,0,0.6)' },
	ice:       { primary: '#00ccff', secondary: '#b3e5fc', glow: 'rgba(0,204,255,0.6)' },
	lightning: { primary: '#ffd700', secondary: '#fff9c4', glow: 'rgba(255,215,0,0.6)' },
	shadow:    { primary: '#7b1fa2', secondary: '#ce93d8', glow: 'rgba(123,31,162,0.6)' },
	nature:    { primary: '#4caf50', secondary: '#a5d6a7', glow: 'rgba(76,175,80,0.6)' },
	neutral:   { primary: '#cd7f32', secondary: '#f0e68c', glow: 'rgba(205,127,50,0.6)' },
};

function hexToNum(hex: string): number {
	return parseInt(hex.replace('#', ''), 16);
}

function pickColor(palette: ParticleColor): number {
	return Math.random() > 0.5 ? hexToNum(palette.primary) : hexToNum(palette.secondary);
}

let pixiApp: Application | null = null;
let trailContainer: Container | null = null;
let burstContainer: Container | null = null;

export function spawnSlashTrail(
	sx: number, sy: number,
	tx: number, ty: number,
	count: number,
	palette: ParticleColor
) {
	if (!pixiApp || !trailContainer) return;
	const dx = tx - sx;
	const dy = ty - sy;
	const len = Math.sqrt(dx * dx + dy * dy);
	const nx = len > 0 ? -dy / len : 0;
	const ny = len > 0 ? dx / len : 0;

	for (let i = 0; i < count; i++) {
		const t = i / count;
		const spread = (Math.random() - 0.5) * 30;
		const x = sx + dx * t + nx * spread;
		const y = sy + dy * t + ny * spread;
		const r = 2 + Math.random() * 3;

		const g = new Graphics();
		g.circle(0, 0, r);
		g.fill(pickColor(palette));
		g.position.set(x, y);
		g.alpha = 0;
		trailContainer.addChild(g);

		gsap.to(g, {
			alpha: 1,
			duration: 0.1,
			delay: t * 0.25,
			onComplete: () => {
				gsap.to(g, {
					alpha: 0,
					duration: 0.3,
					ease: 'power2.out',
					onComplete: () => {
						trailContainer?.removeChild(g);
						g.destroy();
					}
				});
				gsap.to(g.scale, {
					x: 0.3,
					y: 0.3,
					duration: 0.3,
					ease: 'power2.out',
				});
			}
		});
	}
}

export function spawnParticleBurst(
	cx: number, cy: number,
	count: number,
	palette: ParticleColor
) {
	if (!pixiApp || !burstContainer) return;

	for (let i = 0; i < count; i++) {
		const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.4;
		const dist = 30 + Math.random() * 90;
		const r = 2 + Math.random() * 6;
		const endX = cx + Math.cos(angle) * dist;
		const endY = cy + Math.sin(angle) * dist;

		const g = new Graphics();
		g.circle(0, 0, r);
		g.fill(pickColor(palette));
		g.position.set(cx, cy);
		g.alpha = 1;
		burstContainer.addChild(g);

		gsap.to(g, {
			x: endX,
			y: endY,
			alpha: 0,
			duration: 0.4 + Math.random() * 0.2,
			ease: 'power2.out',
			onComplete: () => {
				burstContainer?.removeChild(g);
				g.destroy();
			}
		});
	}
}

export function spawnImpactRing(
	cx: number, cy: number,
	palette: ParticleColor
) {
	if (!pixiApp || !burstContainer) return;

	const ring = new Graphics();
	ring.circle(0, 0, 20);
	ring.stroke({ width: 3, color: hexToNum(palette.primary) });
	ring.position.set(cx, cy);
	ring.alpha = 0.9;
	ring.scale.set(0.2);
	burstContainer.addChild(ring);

	gsap.to(ring, {
		alpha: 0,
		duration: 0.35,
		ease: 'power2.out',
		onComplete: () => {
			burstContainer?.removeChild(ring);
			ring.destroy();
		}
	});
	gsap.to(ring.scale, {
		x: 2.5,
		y: 2.5,
		duration: 0.35,
		ease: 'power2.out',
	});
}

export function spawnEmbers(
	cx: number, cy: number,
	count: number,
	palette: ParticleColor
) {
	if (!pixiApp || !burstContainer) return;

	for (let i = 0; i < count; i++) {
		const angle = Math.random() * Math.PI * 2;
		const dist = 10 + Math.random() * 40;
		const r = 1 + Math.random() * 2;

		const g = new Graphics();
		g.circle(0, 0, r);
		g.fill(hexToNum(palette.secondary));
		g.position.set(cx + (Math.random() - 0.5) * 20, cy + (Math.random() - 0.5) * 20);
		g.alpha = 0.8;
		burstContainer.addChild(g);

		gsap.to(g, {
			x: cx + Math.cos(angle) * dist,
			y: cy + Math.sin(angle) * dist - 20,
			alpha: 0,
			duration: 0.8 + Math.random() * 0.6,
			delay: 0.3 + Math.random() * 0.3,
			ease: 'power1.out',
			onComplete: () => {
				burstContainer?.removeChild(g);
				g.destroy();
			}
		});
	}
}

export const PixiParticleCanvas: React.FC = () => {
	const containerRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!containerRef.current) return;

		const app = new Application();
		let mounted = true;

		app.init({
			backgroundAlpha: 0,
			resizeTo: window,
			antialias: true,
			resolution: window.devicePixelRatio || 1,
			autoDensity: true,
		}).then(() => {
			if (!mounted || !containerRef.current) {
				app.destroy(true);
				return;
			}

			containerRef.current.appendChild(app.canvas as HTMLCanvasElement);
			pixiApp = app;

			trailContainer = new Container();
			burstContainer = new Container();
			app.stage.addChild(trailContainer);
			app.stage.addChild(burstContainer);
		});

		return () => {
			mounted = false;
			if (trailContainer) { trailContainer.destroy({ children: true }); trailContainer = null; }
			if (burstContainer) { burstContainer.destroy({ children: true }); burstContainer = null; }
			if (pixiApp === app) pixiApp = null;
			app.destroy(true);
		};
	}, []);

	const overlay = (
		<div
			ref={containerRef}
			style={{
				position: 'fixed',
				top: 0,
				left: 0,
				width: '100vw',
				height: '100vh',
				pointerEvents: 'none',
				zIndex: 8500,
			}}
		/>
	);

	return createPortal(overlay, document.body);
};

export default PixiParticleCanvas;
