import { useEffect, useRef, useState } from "react";
import fireworkSVG from "./firework.tsx";
import { useAuth } from "../context/AuthContext";
import { db } from "../base/firebaseConfig";
import { doc, updateDoc, increment, getDoc } from "firebase/firestore";
import { showNotification } from "./Notification";

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

type Firework = {
    x: number;
    y: number;
    vx: number;
    scale: number;
    dir: 1 | -1;
    w: number;
    h: number;
    bob: number;
    isGolden?: boolean; // for Gold Rush upgrade
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
    color = "#FFD700", // Changed to gold for New Year's confetti
    zIndex = 9999,
}: SnowProps) {
    // Constants for auto-clicker and spawn speed calculations
    const BASE_AUTO_CLICK_INTERVAL = 10000; // 10 seconds
    const AUTO_CLICK_LEVEL_REDUCTION = 2000; // 2 seconds per level
    const MIN_AUTO_CLICK_INTERVAL = 2000; // 2 seconds minimum
    
    const BASE_SPAWN_INTERVAL = 5000; // 5 seconds
    const SPAWN_SPEED_REDUCTION_FACTOR = 0.8; // 20% reduction per level
    const MIN_SPAWN_INTERVAL = 1000; // 1 second minimum
    
    // Constants for upgrade mechanics
    const GOLD_RUSH_CHANCE_PER_LEVEL = 0.03; // 3% per level
    const GOLDEN_SANTA_MULTIPLIER = 5; // Golden fireworks worth 5x
    const LUCKY_CLICK_CHANCE_PER_LEVEL = 0.05; // 5% per level
    const LUCKY_CLICK_MULTIPLIER = 2; // Lucky clicks worth 2x
    const CLICK_MULTIPLIER_PER_LEVEL = 0.1; // 10% per level (1 + level * 0.1)
    
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const rafRef = useRef<number | null>(null);
    const particlesRef = useRef<Particle[]>([]);
    const dprRef = useRef<number>(1);

    const fireworkImageRef = useRef<HTMLImageElement | null>(null);
    const fireworkSpritesRef = useRef<Firework[]>([]);
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
    const [santaWorthLevel, setSantaWorthLevel] = useState(0);
    const [luckyClickLevel, setLuckyClickLevel] = useState(0);
    const [goldRushLevel, setGoldRushLevel] = useState(0);
    const [clickMultiplierLevel, setClickMultiplierLevel] = useState(0);
    
    // Store prestige bonuses
    const [prestigeFireworkMultiplier, setPrestigeFireworkMultiplier] = useState(0);
    const [prestigeAutoClickerBoost, setPrestigeAutoClickerBoost] = useState(0);
    const [prestigeSpawnBoost, setPrestigeSpawnBoost] = useState(0);
    const [prestigeLuckyBoost, setPrestigeLuckyBoost] = useState(0);
    const [prestigeGoldBoost, setPrestigeGoldBoost] = useState(0);
    
    const autoClickerLevelRef = useRef(0);
    const spawnSpeedLevelRef = useRef(0);
    const santaWorthLevelRef = useRef(0);
    const luckyClickLevelRef = useRef(0);
    const goldRushLevelRef = useRef(0);
    const clickMultiplierLevelRef = useRef(0);
    
    // Refs for prestige bonuses
    const prestigeFireworkMultiplierRef = useRef(0);
    const prestigeAutoClickerBoostRef = useRef(0);
    const prestigeSpawnBoostRef = useRef(0);
    const prestigeLuckyBoostRef = useRef(0);
    const prestigeGoldBoostRef = useRef(0);
    
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
            setSantaWorthLevel(0);
            setLuckyClickLevel(0);
            setGoldRushLevel(0);
            setClickMultiplierLevel(0);
            autoClickerLevelRef.current = 0;
            spawnSpeedLevelRef.current = 0;
            santaWorthLevelRef.current = 0;
            luckyClickLevelRef.current = 0;
            goldRushLevelRef.current = 0;
            clickMultiplierLevelRef.current = 0;
        }
    }, [currentUser]);
    
    // Update refs when upgrades change
    useEffect(() => {
        autoClickerLevelRef.current = autoClickerLevel;
        spawnSpeedLevelRef.current = spawnSpeedLevel;
        santaWorthLevelRef.current = santaWorthLevel;
        luckyClickLevelRef.current = luckyClickLevel;
        goldRushLevelRef.current = goldRushLevel;
        clickMultiplierLevelRef.current = clickMultiplierLevel;
        prestigeFireworkMultiplierRef.current = prestigeFireworkMultiplier;
        prestigeAutoClickerBoostRef.current = prestigeAutoClickerBoost;
        prestigeSpawnBoostRef.current = prestigeSpawnBoost;
        prestigeLuckyBoostRef.current = prestigeLuckyBoost;
        prestigeGoldBoostRef.current = prestigeGoldBoost;
    }, [autoClickerLevel, spawnSpeedLevel, santaWorthLevel, luckyClickLevel, goldRushLevel, clickMultiplierLevel, prestigeFireworkMultiplier, prestigeAutoClickerBoost, prestigeSpawnBoost, prestigeLuckyBoost, prestigeGoldBoost]);
    
    const loadUserUpgrades = async () => {
        if (!currentUser) return;
        
        try {
            const userDocRef = doc(db, "Users", currentUser);
            const userDoc = await getDoc(userDocRef);
            
            if (userDoc.exists()) {
                const userData = userDoc.data();
                const autoLevel = userData.autoClickerLevel || 0;
                const spawnLevel = userData.spawnSpeedLevel || 0;
                const worthLevel = userData.santaWorthLevel || 0;
                const luckyLevel = userData.luckyClickLevel || 0;
                const goldLevel = userData.goldRushLevel || 0;
                const multiplierLevel = userData.clickMultiplierLevel || 0;
                
                // Load prestige bonuses
                const prestigeFirework = userData.prestigeFireworkMultiplier || 0;
                const prestigeAutoClicker = userData.prestigeAutoClickerBoost || 0;
                const prestigeSpawn = userData.prestigeSpawnBoost || 0;
                const prestigeLucky = userData.prestigeLuckyBoost || 0;
                const prestigeGold = userData.prestigeGoldBoost || 0;
                
                setAutoClickerLevel(autoLevel);
                setSpawnSpeedLevel(spawnLevel);
                setSantaWorthLevel(worthLevel);
                setLuckyClickLevel(luckyLevel);
                setGoldRushLevel(goldLevel);
                setClickMultiplierLevel(multiplierLevel);
                
                setPrestigeFireworkMultiplier(prestigeFirework);
                setPrestigeAutoClickerBoost(prestigeAutoClicker);
                setPrestigeSpawnBoost(prestigeSpawn);
                setPrestigeLuckyBoost(prestigeLucky);
                setPrestigeGoldBoost(prestigeGold);
                console.log('Loaded upgrades:', { 
                    autoLevel, 
                    spawnLevel, 
                    worthLevel,
                    luckyLevel,
                    goldLevel,
                    multiplierLevel
                });
            }
        } catch (error) {
            console.error("Error loading upgrades:", error);
        }
    };

    // Helper function to calculate points with all upgrade bonuses applied
    const calculateUpgradePoints = (basePoints: number, isGolden: boolean): { points: number, isLucky: boolean } => {
        let points = basePoints;
        let isLucky = false;
        
        // Gold Rush: Golden fireworks are worth 5x
        if (isGolden) {
            points *= GOLDEN_SANTA_MULTIPLIER;
        }
        
        // Lucky Click: Chance per level for double points
        // Add prestige lucky boost (+5% per level)
        const baseLuckyChance = luckyClickLevelRef.current * LUCKY_CLICK_CHANCE_PER_LEVEL;
        const prestigeLuckyChance = prestigeLuckyBoostRef.current * 0.05; // +5% per level
        const totalLuckyChance = baseLuckyChance + prestigeLuckyChance;
        if (Math.random() < totalLuckyChance) {
            points *= LUCKY_CLICK_MULTIPLIER;
            isLucky = true;
        }
        
        // Click Multiplier: Applies (1 + level * factor)x multiplier to all clicks
        const clickMultiplier = 1 + (clickMultiplierLevelRef.current * CLICK_MULTIPLIER_PER_LEVEL);
        points = Math.round(points * clickMultiplier);
        
        // Apply prestige firework multiplier (+10% per level)
        const prestigeMultiplier = 1 + (prestigeFireworkMultiplierRef.current * 0.10);
        points = Math.round(points * prestigeMultiplier);
        
        return { points, isLucky };
    };

    useEffect(() => {
        const canvas = canvasRef.current!;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // small inline SVG Firework to avoid external assets
        const fireworkImg = new Image();
        fireworkImg.src = `data:image/svg+xml;charset=utf-8,${fireworkSVG}`;
        fireworkImageRef.current = fireworkImg;

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
            // New Year's confetti colors
            const confettiColors = ['#FFD700', '#87CEEB', '#FFA500', '#FF69B4', '#00FF00', '#FF0000'];
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

            // draw confetti particles with rotating colors
            const confettiColors = ['#FFD700', '#87CEEB', '#FFA500', '#FF69B4', '#00FF00', '#FF0000', '#FFFFFF'];
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
                // Use confetti colors instead of white
                const confettiColor = confettiColors[i % confettiColors.length];
                const grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 1.8);
                grd.addColorStop(0, confettiColor);
                grd.addColorStop(1, "rgba(255,255,255,0)");
                ctx.fillStyle = grd;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.globalAlpha = 1;

            // draw fireworks
            const fireworks = fireworkSpritesRef.current;
            for (let i = fireworks.length - 1; i >= 0; i--) {
                const s = fireworks[i];
                s.x += s.vx * dt;
                // small bobbing
                const bob = Math.sin((time / 400) + s.x * 0.02) * 6 * s.scale;
                const drawX = s.x;
                const drawY = s.y + bob;

                if (fireworkImageRef.current && fireworkImageRef.current.complete) {
                    ctx.save();
                    ctx.translate(drawX, drawY);
                    if (s.dir === -1) {
                        ctx.scale(-1, 1);
                    }
                    
                    // Apply golden filter for golden fireworks
                    if (s.isGolden) {
                        // Add a golden glow effect
                        ctx.shadowColor = "#FFD700";
                        ctx.shadowBlur = 20;
                        ctx.globalAlpha = 1;
                        // Tint the firework golden
                        ctx.filter = "sepia(1) saturate(3) hue-rotate(10deg) brightness(1.3)";
                    }
                    
                    // draw centred
                    ctx.drawImage(fireworkImageRef.current, -s.w / 2, -s.h / 2, s.w, s.h);
                    
                    // Reset filter and shadow
                    ctx.filter = "none";
                    ctx.shadowColor = "transparent";
                    ctx.shadowBlur = 0;
                    
                    ctx.restore();
                } else {
                    // fallback: simple rectangle if image not ready
                    ctx.fillStyle = s.isGolden ? "#FFD700" : "#87CEEB";
                    ctx.fillRect(drawX - (s.w / 2), drawY - (s.h / 2), s.w, s.h);
                }

                // remove when offscreen beyond margin
                if (s.dir === 1 && s.x - s.w / 2 > w + 50) fireworks.splice(i, 1);
                if (s.dir === -1 && s.x + s.w / 2 < -50) fireworks.splice(i, 1);
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

        // spawn a firework sprite occasionally
        const spawnFirework = () => {
            const w = canvas.width / dprRef.current;
            const h = canvas.height / dprRef.current;
            const dir: 1 | -1 = Math.random() > 0.5 ? 1 : -1;
            const startX = dir === 1 ? -60 : w + 60;
            // Spawn below navbar (avoid top 100px to account for navbar height)
            const minY = 100; // Minimum Y position to avoid navbar
            const y = minY + (h - minY) * Math.random();
            const scale = 0.6 + Math.random() * 0.8;
            const baseW = 120;
            const baseH = 60;
            // velocity in logical px per frame (normalized dt). Adjust with speed prop.
            const vx = (2 + Math.random() * 2) * (dir === 1 ? 1 : -1) * Math.max(0.5, speed);
            
            // Gold Rush: Determine if this firework should be golden
            // Base: goldRushLevel * 3% chance
            // Add prestige gold boost: +5% per level
            const baseGoldChance = goldRushLevelRef.current * GOLD_RUSH_CHANCE_PER_LEVEL;
            const prestigeGoldChance = prestigeGoldBoostRef.current * 0.05;
            const totalGoldChance = baseGoldChance + prestigeGoldChance;
            const isGolden = Math.random() < totalGoldChance;
            
            const firework: Firework = {
                x: startX,
                y,
                vx,
                scale,
                dir,
                w: baseW * scale,
                h: baseH * scale,
                isGolden,
            };
            fireworkSpritesRef.current.push(firework);
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
                const c = colorHint || "#87CEEB"; // New Year's blue instead of Christmas red
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

        // click handler to explode fireworks
        const onClick = (e: MouseEvent) => {
            const rect = canvas.getBoundingClientRect();
            const x = (e.clientX - rect.left);
            const y = (e.clientY - rect.top);
            const fireworks = fireworkSpritesRef.current;
            
            // Use ref to get current user value (not closure)
            const user = currentUserRef.current;
            console.log('Firework click detected. Current user:', user);
            
            // iterate in reverse to remove hit firework
            for (let i = fireworks.length - 1; i >= 0; i--) {
                const s = fireworks[i];
                const dx = x - s.x;
                const dy = y - s.y;
                const r = Math.max(s.w, s.h) * 0.6; // hit radius
                if (dx * dx + dy * dy <= r * r) {
                    // spawn explosion using firework's position and color based on type
                    const explosionColor = s.isGolden ? "#FFD700" : "#87CEEB";
                    spawnExplosion(s.x, s.y, explosionColor);
                    fireworks.splice(i, 1);
                    
                    // Increment firework count for logged-in user (database field name stays as santasPopped)
                    if (user) {
                        console.log('User is logged in, incrementing firework count for:', user);
                        
                        // Calculate points for this firework pop using helper function
                        // Base worth is (santaWorthLevel + 1), so level 0 = 1 point, level 1 = 2 points, etc.
                        const basePoints = santaWorthLevelRef.current + 1;
                        const { points, isLucky } = calculateUpgradePoints(basePoints, s.isGolden);
                        
                        // Show visual feedback
                        if (s.isGolden) {
                            console.log('Golden firework clicked! 5x multiplier applied');
                        }
                        if (isLucky) {
                            console.log('Lucky click! 2x multiplier applied');
                            showNotification('🍀 Lucky Click! Double points!', 'success');
                        }
                        
                        console.log('Total points for this click:', points, {
                            baseWorth: basePoints,
                            isGolden: s.isGolden,
                            isLucky
                        });
                        
                        try {
                            const userDocRef = doc(db, "Users", user);
                            updateDoc(userDocRef, {
                                santasPopped: increment(points) // database field name stays same
                            }).then(() => {
                                console.log(`Firework popped! Count incremented by ${points} for ${user}`);
                                // Dispatch custom event to notify other components
                                window.dispatchEvent(new CustomEvent('santaPopped', { 
                                    detail: { increment: points } 
                                }));
                            }).catch((error) => {
                                console.error("Error updating firework count:", error);
                                showNotification(`Failed to save Firework pop. Error: ${error.message}`, "error");
                            });
                        } catch (error) {
                            console.error("Error creating update:", error);
                        }
                    } else {
                        console.log("No user logged in - firework pop not tracked");
                        // Show a one-time notification to inform user they need to login
                        if (!sessionStorage.getItem('loginReminderShown')) {
                            showNotification('🎆 Login required! Go to the Sign Up page to login or create an account, then your Firework pops will be tracked on the leaderboard!', "info");
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
        // Apply prestige spawn boost: +15% per level = multiply by (1 - 0.15 * prestigeLevel)
        const spawnSpeed = spawnSpeedLevelRef.current;
        const prestigeSpawnMultiplier = Math.pow(0.85, prestigeSpawnBoostRef.current); // 15% reduction per level
        const baseSpawnInterval = Math.max(MIN_SPAWN_INTERVAL, BASE_SPAWN_INTERVAL * Math.pow(SPAWN_SPEED_REDUCTION_FACTOR, spawnSpeed));
        const spawnInterval = Math.max(MIN_SPAWN_INTERVAL, baseSpawnInterval * prestigeSpawnMultiplier);
        console.log('Firework spawn interval:', spawnInterval, 'ms (level', spawnSpeed, ', prestige boost:', prestigeSpawnBoostRef.current, ')');

        // spawn first firework after 1s, then at calculated interval
        spawnIntervalRef.current = window.setInterval(spawnFirework, spawnInterval);
        const firstSpawn = window.setTimeout(spawnFirework, 1000);
        
        // Auto-clicker setup
        // Only start if auto-clicker level > 0
        // Interval: 10s, 8s, 6s, 4s, 2s for levels 1-5
        // Apply prestige auto-clicker boost: +20% speed = multiply by (1 - 0.20 * prestigeLevel)
        if (autoClickerLevelRef.current > 0) {
            const baseAutoClickInterval = Math.max(MIN_AUTO_CLICK_INTERVAL, BASE_AUTO_CLICK_INTERVAL - autoClickerLevelRef.current * AUTO_CLICK_LEVEL_REDUCTION);
            const prestigeAutoMultiplier = Math.pow(0.80, prestigeAutoClickerBoostRef.current); // 20% speed increase per level
            const autoClickInterval = Math.max(MIN_AUTO_CLICK_INTERVAL, baseAutoClickInterval * prestigeAutoMultiplier);
            console.log('Auto-clicker active! Interval:', autoClickInterval, 'ms (level', autoClickerLevelRef.current, ', prestige boost:', prestigeAutoClickerBoostRef.current, ')');
            
            autoClickerIntervalRef.current = window.setInterval(() => {
                // Check if multiple tabs are blocked - don't auto-click if so
                const isBlocked = localStorage.getItem('greentrails_tabs_blocked') === 'true';
                if (isBlocked) {
                    console.log('Auto-clicker paused: multiple tabs detected');
                    return;
                }
                
                const fireworks = fireworkSpritesRef.current;
                if (fireworks.length > 0 && currentUserRef.current) {
                    // Auto-click a random firework
                    const randomIndex = Math.floor(Math.random() * fireworks.length);
                    const s = fireworks[randomIndex];
                    
                    // Spawn explosion and remove firework
                    const explosionColor = s.isGolden ? "#FFD700" : "#4CAF50";
                    spawnExplosion(s.x, s.y, explosionColor); // Green for auto-click, gold for golden
                    fireworks.splice(randomIndex, 1);
                    
                    // Calculate points for auto-clicked firework using helper function
                    const user = currentUserRef.current;
                    // Base worth is (santaWorthLevel + 1), so level 0 = 1 point, level 1 = 2 points, etc.
                    const basePoints = santaWorthLevelRef.current + 1;
                    const { points } = calculateUpgradePoints(basePoints, s.isGolden);
                    
                    if (user) {
                        try {
                            const userDocRef = doc(db, "Users", user);
                            updateDoc(userDocRef, {
                                santasPopped: increment(points) // database field name stays same
                            }).then(() => {
                                console.log(`Auto-clicked firework for ${user} (worth: ${points})`);
                                // Dispatch custom event to notify other components
                                window.dispatchEvent(new CustomEvent('santaPopped', { 
                                    detail: { increment: points } 
                                }));
                            }).catch((error) => {
                                console.error("Error updating firework count:", error);
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
            // clear current fireworks so they re-enter reasonably positioned
            fireworkSpritesRef.current = [];
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
    }, [particleCount, speed, size, color, autoClickerLevel, spawnSpeedLevel, santaWorthLevel, luckyClickLevel, goldRushLevel, clickMultiplierLevel]);

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