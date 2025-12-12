import { useEffect, useRef, useState } from "react";
import santaSVG from "./santa.tsx";
import { useAuth } from "../context/AuthContext";
import { db } from "../base/firebaseConfig";
import { doc, updateDoc, increment, getDoc } from "firebase/firestore";

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
    // Constants for auto-clicker and spawn speed calculations
    const BASE_AUTO_CLICK_INTERVAL = 10000; // 10 seconds
    const AUTO_CLICK_LEVEL_REDUCTION = 2000; // 2 seconds per level
    const MIN_AUTO_CLICK_INTERVAL = 2000; // 2 seconds minimum
    
    const BASE_SPAWN_INTERVAL = 5000; // 5 seconds
    const SPAWN_SPEED_REDUCTION_FACTOR = 0.8; // 20% reduction per level
    const MIN_SPAWN_INTERVAL = 1000; // 1 second minimum
    
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const rafRef = useRef<number | null>(null);
    const particlesRef = useRef<Particle[]>([]);
    const dprRef = useRef<number>(1);

    const santaImageRef = useRef<HTMLImageElement | null>(null);
    const santaSpritesRef = useRef<Santa[]>([]);
    const spawnIntervalRef = useRef<number | null>(null);
    const autoClickerIntervalRef = useRef<number | null>(null);

    // new: explosion particles
    const explosionsRef = useRef<ExpParticle[]>([]);
    
    // Get current user from auth context
    const { currentUser } = useAuth();
    
    // Store currentUser in a ref so click handler always has latest value
    const currentUserRef = useRef<string | null>(currentUser);
    
    // Store user upgrades
    const [autoClickerLevel, setAutoClickerLevel] = useState(0);
    const [spawnSpeedLevel, setSpawnSpeedLevel] = useState(0);
    const autoClickerLevelRef = useRef(0);
    const spawnSpeedLevelRef = useRef(0);
    
    // Update ref whenever currentUser changes
    useEffect(() => {
        currentUserRef.current = currentUser;
        console.log('Snow: currentUser updated to:', currentUser);
        
        // Load user upgrades when user changes
        if (currentUser) {
            loadUserUpgrades();
        } else {
            setAutoClickerLevel(0);
            setSpawnSpeedLevel(0);
            autoClickerLevelRef.current = 0;
            spawnSpeedLevelRef.current = 0;
        }
    }, [currentUser]);
    
    // Update refs when upgrades change
    useEffect(() => {
        autoClickerLevelRef.current = autoClickerLevel;
        spawnSpeedLevelRef.current = spawnSpeedLevel;
    }, [autoClickerLevel, spawnSpeedLevel]);
    
    const loadUserUpgrades = async () => {
        if (!currentUser) return;
        
        try {
            const userDocRef = doc(db, "Users", currentUser);
            const userDoc = await getDoc(userDocRef);
            
            if (userDoc.exists()) {
                const userData = userDoc.data();
                const autoLevel = userData.autoClickerLevel || 0;
                const spawnLevel = userData.spawnSpeedLevel || 0;
                setAutoClickerLevel(autoLevel);
                setSpawnSpeedLevel(spawnLevel);
                console.log('Loaded upgrades:', { autoLevel, spawnLevel });
            }
        } catch (error) {
            console.error("Error loading upgrades:", error);
        }
    };

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
            
            // Use ref to get current user value (not closure)
            const user = currentUserRef.current;
            console.log('Santa click detected. Current user:', user);
            
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
                    
                    // Increment santa count for logged-in user
                    if (user) {
                        console.log('User is logged in, incrementing santa count for:', user);
                        try {
                            const userDocRef = doc(db, "Users", user);
                            updateDoc(userDocRef, {
                                santasPopped: increment(1)
                            }).then(() => {
                                console.log(`Santa popped! Count incremented for ${user}`);
                            }).catch((error) => {
                                console.error("Error updating santa count:", error);
                                alert(`Failed to save Santa pop. Error: ${error.message}`);
                            });
                        } catch (error) {
                            console.error("Error creating update:", error);
                        }
                    } else {
                        console.log("No user logged in - santa pop not tracked");
                        // Show a one-time alert to inform user they need to login
                        if (!sessionStorage.getItem('loginReminderShown')) {
                            alert('🎅 Login required! Go to the Sign Up page to login or create an account, then your Santa pops will be tracked on the leaderboard!');
                            sessionStorage.setItem('loginReminderShown', 'true');
                        }
                    }
                    
                    break; // only explode one per click
                }
            }
        };

        setSize();
        initParticles();
        rafRef.current = requestAnimationFrame(render);

        // Calculate spawn interval based on spawn speed level
        // Base: 5000ms, each level reduces by 20% (multiply by 0.8)
        const spawnSpeed = spawnSpeedLevelRef.current;
        const spawnInterval = Math.max(MIN_SPAWN_INTERVAL, BASE_SPAWN_INTERVAL * Math.pow(SPAWN_SPEED_REDUCTION_FACTOR, spawnSpeed));
        console.log('Santa spawn interval:', spawnInterval, 'ms (level', spawnSpeed, ')');

        // spawn first santa after 1s, then at calculated interval
        spawnIntervalRef.current = window.setInterval(spawnSanta, spawnInterval);
        const firstSpawn = window.setTimeout(spawnSanta, 1000);
        
        // Auto-clicker setup
        // Only start if auto-clicker level > 0
        // Interval: 10s, 8s, 6s, 4s, 2s for levels 1-5
        if (autoClickerLevelRef.current > 0) {
            const autoClickInterval = Math.max(MIN_AUTO_CLICK_INTERVAL, BASE_AUTO_CLICK_INTERVAL - autoClickerLevelRef.current * AUTO_CLICK_LEVEL_REDUCTION);
            console.log('Auto-clicker active! Interval:', autoClickInterval, 'ms (level', autoClickerLevelRef.current, ')');
            
            autoClickerIntervalRef.current = window.setInterval(() => {
                const santas = santaSpritesRef.current;
                if (santas.length > 0 && currentUserRef.current) {
                    // Auto-click a random santa
                    const randomIndex = Math.floor(Math.random() * santas.length);
                    const s = santas[randomIndex];
                    
                    // Spawn explosion and remove santa
                    spawnExplosion(s.x, s.y, "#4CAF50"); // Green color for auto-click
                    santas.splice(randomIndex, 1);
                    
                    // Increment santa count
                    const user = currentUserRef.current;
                    if (user) {
                        try {
                            const userDocRef = doc(db, "Users", user);
                            updateDoc(userDocRef, {
                                santasPopped: increment(1)
                            }).then(() => {
                                console.log(`Auto-clicked santa for ${user}`);
                            }).catch((error) => {
                                console.error("Error updating santa count:", error);
                            });
                        } catch (error) {
                            console.error("Error with auto-click:", error);
                        }
                    }
                }
            }, autoClickInterval);
        }

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
            if (autoClickerIntervalRef.current) clearInterval(autoClickerIntervalRef.current);
            window.clearTimeout(firstSpawn);
            window.removeEventListener("resize", onResize);
            window.removeEventListener("click", onClick);
        };
    }, [particleCount, speed, size, color, autoClickerLevel, spawnSpeedLevel]);

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