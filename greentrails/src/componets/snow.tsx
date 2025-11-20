import { useEffect, useRef } from "react";
import santaSVG from "./santa.tsx";

type SnowProps = {
    particleCount?: number;
    speed?: number; // base fall speed multiplier
    size?: number; // base size in px
    color?: string;
    zIndex?: number;
};

type Particle = {
    x: number;
    y: number;
    r: number;
    vx: number;
    vy: number;
    o: number; // opacity
    swing: number; // swing amplitude
    phase: number; // swing phase
};

type Santa = {
    x: number;
    y: number;
    vx: number;
    scale: number;
    dir: 1 | -1;
    w: number;
    h: number;
    bob: number;
};

type ExpParticle = {
    x: number;
    y: number;
    vx: number;
    vy: number;
    r: number;
    life: number;
    maxLife: number;
    color: string;
};

export default function Snow({
    particleCount = 120,
    speed = 1,
    size = 3,
    color = "#FFF",
    zIndex = 9999,
}: SnowProps) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const rafRef = useRef<number | null>(null);
    const particlesRef = useRef<Particle[]>([]);
    const dprRef = useRef<number>(1);

    const santaImageRef = useRef<HTMLImageElement | null>(null);
    const santaSpritesRef = useRef<Santa[]>([]);
    const spawnIntervalRef = useRef<number | null>(null);

    // new: explosion particles
    const explosionsRef = useRef<ExpParticle[]>([]);

    useEffect(() => {
        const canvas = canvasRef.current!;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // small inline SVG Santa to avoid external assets
        const santaImg = new Image();
        santaImg.src = `data:image/svg+xml;charset=utf-8,${santaSVG}`;
        santaImageRef.current = santaImg;

        const setSize = () => {
            const dpr = window.devicePixelRatio || 1;
            dprRef.current = dpr;
            const width = window.innerWidth;
            const height = window.innerHeight;
            canvas.style.width = `${width}px`;
            canvas.style.height = `${height}px`;
            canvas.width = Math.round(width * dpr);
            canvas.height = Math.round(height * dpr);
            // keep logical coordinates in CSS pixels by scaling by dpr
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        };

        const initParticles = () => {
            const w = canvas.width / dprRef.current;
            const h = canvas.height / dprRef.current;
            const parts: Particle[] = [];
            for (let i = 0; i < particleCount; i++) {
                const r = Math.random() * size + Math.random() * (size / 2);
                parts.push({
                    x: Math.random() * w,
                    y: Math.random() * h,
                    r,
                    vx: (Math.random() - 0.5) * 0.6, // horizontal drift
                    vy: (0.5 + Math.random() * 0.9) * speed, // fall speed
                    o: 0.5 + Math.random() * 0.8,
                    swing: Math.random() * 20,
                    phase: Math.random() * Math.PI * 2,
                });
            }
            particlesRef.current = parts;
        };

        let lastTime = performance.now();

        const render = (time: number) => {
            const dt = (time - lastTime) / 16.6667; // normalize to ~60fps
            lastTime = time;
            const w = canvas.width / dprRef.current;
            const h = canvas.height / dprRef.current;

            ctx.clearRect(0, 0, w, h);

            // draw snow particles
            const parts = particlesRef.current;
            for (let i = 0; i < parts.length; i++) {
                const p = parts[i];
                p.phase += 0.02 * dt;
                p.x += p.vx * dt + Math.sin(p.phase) * (p.swing * 0.01) * dt;
                p.y += p.vy * dt;

                // wrap-around
                if (p.y - p.r > h) {
                    p.y = -p.r;
                    p.x = Math.random() * w;
                }
                if (p.x - p.r > w) p.x = -p.r;
                if (p.x + p.r < 0) p.x = w + p.r;

                ctx.globalAlpha = p.o;
                const grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 1.8);
                grd.addColorStop(0, color);
                grd.addColorStop(1, "rgba(255,255,255,0)");
                ctx.fillStyle = grd;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.globalAlpha = 1;

            // draw santas
            const santas = santaSpritesRef.current;
            for (let i = santas.length - 1; i >= 0; i--) {
                const s = santas[i];
                s.x += s.vx * dt;
                // small bobbing
                const bob = Math.sin((time / 400) + s.x * 0.02) * 6 * s.scale;
                const drawX = s.x;
                const drawY = s.y + bob;

                if (santaImageRef.current && santaImageRef.current.complete) {
                    ctx.save();
                    ctx.translate(drawX, drawY);
                    if (s.dir === -1) {
                        ctx.scale(-1, 1);
                    }
                    // draw centred
                    ctx.drawImage(santaImageRef.current, -s.w / 2, -s.h / 2, s.w, s.h);
                    ctx.restore();
                } else {
                    // fallback: simple red rectangle if image not ready
                    ctx.fillStyle = "#e74c3c";
                    ctx.fillRect(drawX - (s.w / 2), drawY - (s.h / 2), s.w, s.h);
                }

                // remove when offscreen beyond margin
                if (s.dir === 1 && s.x - s.w / 2 > w + 50) santas.splice(i, 1);
                if (s.dir === -1 && s.x + s.w / 2 < -50) santas.splice(i, 1);
            }

            // update & draw explosions
            const explosions = explosionsRef.current;
            for (let i = explosions.length - 1; i >= 0; i--) {
                const e = explosions[i];
                // simple physics: gravity + drag
                e.vy += 0.06 * dt; // gravity
                e.vx *= 0.995;
                e.vy *= 0.999;
                e.x += e.vx * dt;
                e.y += e.vy * dt;
                e.life -= 1 * dt;
                const alpha = Math.max(0, e.life / e.maxLife);

                ctx.globalAlpha = alpha;
                const g = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, e.r * 2.5);
                g.addColorStop(0, e.color);
                g.addColorStop(0.6, "rgba(255,255,255,0.2)");
                g.addColorStop(1, "rgba(255,255,255,0)");
                ctx.fillStyle = g;
                ctx.beginPath();
                ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2);
                ctx.fill();

                if (e.life <= 0) explosions.splice(i, 1);
            }
            ctx.globalAlpha = 1;

            rafRef.current = requestAnimationFrame(render);
        };

        // spawn a santa sprite occasionally
        const spawnSanta = () => {
            const w = canvas.width / dprRef.current;
            const h = canvas.height / dprRef.current;
            const dir: 1 | -1 = Math.random() > 0.5 ? 1 : -1;
            const startX = dir === 1 ? -60 : w + 60;
            const y = h * ( Math.random() ); // high across the sky
            const scale = 0.6 + Math.random() * 0.8;
            const baseW = 120;
            const baseH = 60;
            // velocity in logical px per frame (normalized dt). Adjust with speed prop.
            const vx = (2 + Math.random() * 2) * (dir === 1 ? 1 : -1) * Math.max(0.5, speed);
            const santa: Santa = {
                x: startX,
                y,
                vx,
                scale,
                dir,
                w: baseW * scale,
                h: baseH * scale,
            };
            santaSpritesRef.current.push(santa);
        };

        // new: spawn explosion at x,y (logical coords)
        const spawnExplosion = (x: number, y: number, colorHint?: string) => {
            const count = 30 + Math.round(Math.random() * 20);
            const parts: ExpParticle[] = [];
            for (let i = 0; i < count; i++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = 1 + Math.random() * 4;
                const vx = Math.cos(angle) * speed * (0.6 + Math.random() * 1.4);
                const vy = Math.sin(angle) * speed * (0.6 + Math.random() * 1.4) - Math.random() * 1.5;
                const r = 1 + Math.random() * 3;
                const life = 30 + Math.random() * 40; // frames
                const c = colorHint || "#e74c3c";
                parts.push({
                    x,
                    y,
                    vx,
                    vy,
                    r,
                    life,
                    maxLife: life,
                    color: c,
                });
            }
            explosionsRef.current.push(...parts);
        };

        // click handler to explode santas
        const onClick = (e: MouseEvent) => {
            const rect = canvas.getBoundingClientRect();
            const x = (e.clientX - rect.left);
            const y = (e.clientY - rect.top);
            const santas = santaSpritesRef.current;
            // iterate in reverse to remove hit santa
            for (let i = santas.length - 1; i >= 0; i--) {
                const s = santas[i];
                const dx = x - s.x;
                const dy = y - s.y;
                const r = Math.max(s.w, s.h) * 0.6; // hit radius
                if (dx * dx + dy * dy <= r * r) {
                    // spawn explosion using santa's position and remove santa
                    spawnExplosion(s.x, s.y, "#ffb347"); // warm color
                    santas.splice(i, 1);
                    break; // only explode one per click
                }
            }
        };

        setSize();
        initParticles();
        rafRef.current = requestAnimationFrame(render);

        // spawn first santa after 1s, then every 5s
        spawnIntervalRef.current = window.setInterval(spawnSanta, 5000);
        const firstSpawn = window.setTimeout(spawnSanta, 1000);

        const onResize = () => {
            setSize();
            initParticles();
            // clear current santas so they re-enter reasonably positioned
            santaSpritesRef.current = [];
        };
        window.addEventListener("resize", onResize);

        // attach click to window instead of canvas to allow clicks through
        window.addEventListener("click", onClick);

        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
            if (spawnIntervalRef.current) clearInterval(spawnIntervalRef.current);
            window.clearTimeout(firstSpawn);
            window.removeEventListener("resize", onResize);
            window.removeEventListener("click", onClick);
        };
    }, [particleCount, speed, size, color]);

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: "fixed",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                // set to none to allow clicks through to underlying elements
                pointerEvents: "none",
                zIndex,
            }}
            aria-hidden
        />
    );
}