import React, { useEffect, useRef } from "react";

type FlowersProps = {
    children?: React.ReactNode;
    flowers?: number;
    grass?: number;
    tileSize?: number;
};

const colors = [
    "#FF69B4",
    "#FF1493",
    "#FFB6C1",
    "#FF69B4",
    "#ff6f6f",
    "#d161f7",
    "#8a61ff",
    "#61d7ff",
    "#61ff8a",
    "#ff6161",
    "#ff61d7",
    "#d7ff61",
];

export default function Flowers({
    children,
    flowers = 100,
    grass = 200,
    tileSize = 40,
}: FlowersProps) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const wrapperRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const wrapper = wrapperRef.current;
        if (!canvas || !wrapper) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // CSS-pixel sizes to use for drawing after we set a dpr transform
        let cssWidth = 0;
        let cssHeight = 0;

        function resize() {
            const rect = wrapper.getBoundingClientRect();
            const dpr = window.devicePixelRatio || 1;
            // store CSS sizes separately, set canvas device-pixel size, and scale drawing
            cssWidth = Math.max(1, Math.floor(rect.width));
            cssHeight = Math.max(1, Math.floor(rect.height));
            canvas.width = Math.max(1, Math.floor(rect.width * dpr));
            canvas.height = Math.max(1, Math.floor(rect.height * dpr));
            canvas.style.width = `${rect.width}px`;
            canvas.style.height = `${rect.height}px`;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // now draw in CSS pixels
            drawLevel();
        }

        function drawCubeGrass(x: number, y: number, r: number, color: string) {
            ctx.save();
            ctx.translate(x, y);
            const angle = Math.random() * Math.PI * 2;
            ctx.rotate(angle);
            ctx.fillStyle = color;
            ctx.fillRect(-r / 2, -r / 2, r, r);
            ctx.restore();
        }
        function randomCubes(count: number) {
            // use CSS sizes and limit cube sizes so none become huge
            for (let i = 0; i < count; i++) {
                const x = Math.random() * (cssWidth + 100) - 50;
                const y = Math.random() * (cssHeight + 100) - 50;
                // keep cubes small: between 4 and 30 CSS pixels
                const r = Math.min(Math.max(Math.random() * 26 + 4, 4), 30);
                drawCubeGrass(
                    x,
                    y,
                    r,
                    `rgb(0, ${Math.floor(Math.random() * 100 + 100)}, 0)`
                );
            }
        }

        function makeTiles(size: number) {
            const tile = size;
            for (let y = 0; y < cssHeight; y += tile) {
                for (let x = 0; x < cssWidth; x += tile) {
                    const greenValue = Math.floor(Math.random() * 100) + 100;
                    ctx.fillStyle = `rgb(0, ${greenValue}, 0)`;
                    ctx.fillRect(x, y, tile, tile);
                    ctx.strokeStyle = `rgba(0, ${greenValue - 20}, 0, 0.5)`;
                    ctx.strokeRect(x, y, tile, tile);
                }
            }
        }

        function drawGrassBlade(
            x: number,
            y: number,
            bladeLength: number,
            bladeWidth: number,
            angle: number,
            color: string
        ) {
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(angle);
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(-bladeWidth / 2, -bladeLength);
            ctx.lineTo(bladeWidth / 2, -bladeLength);
            ctx.closePath();
            ctx.fillStyle = color;
            ctx.fill();
            ctx.restore();
        }

        function drawGrassCluster(cx: number, cy: number, numBlades: number) {
            for (let i = 0; i < numBlades; i++) {
                const offsetX = (Math.random() - 0.5) * 8;
                const offsetY = (Math.random() - 0.5) * 8;
                const bladeLength = 10 + Math.random() * 8;
                const bladeWidth = 2 + Math.random() * 1.5;
                const angle = -0.2 + Math.random() * 0.4;
                const greens = ["#7CB342", "#8BC34A", "#689F38", "#76B041"];
                const color = greens[Math.floor(Math.random() * greens.length)];
                drawGrassBlade(cx + offsetX, cy + offsetY, bladeLength, bladeWidth, angle, color);
            }
        }

        function drawGrassField(numClusters: number) {
            for (let i = 0; i < numClusters; i++) {
                const cx = Math.random() * cssWidth;
                const cy = Math.random() * cssHeight;
                const numBlades = Math.floor(3 + Math.random() * 4);
                drawGrassCluster(cx, cy, numBlades);
            }
        }

        function drawFlower(x: number, y: number, size: number) {
            ctx.save();
            ctx.translate(x, y);
            ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
            const numPetals = 5;
            for (let i = 0; i < numPetals; i++) {
                const angle = i * (2 * Math.PI / numPetals);
                const petalX = Math.cos(angle) * size;
                const petalY = Math.sin(angle) * size;
                ctx.beginPath();
                ctx.arc(petalX, petalY, size / 2, 0, 2 * Math.PI);
                ctx.fill();
            }
            ctx.beginPath();
            ctx.arc(0, 0, size / 2, 0, 2 * Math.PI);
            ctx.fill();
            ctx.restore();
        }

        function drawFlowerField(numFlowers: number) {
            for (let i = 0; i < numFlowers; i++) {
                drawFlower(Math.random() * cssWidth, Math.random() * cssHeight, 4 + Math.random() * 4);
            }
        }

        function upgradeButton() {
            ctx.beginPath();
            ctx.moveTo(cssWidth / 2 + 30, 5);
            ctx.lineTo(cssWidth / 2 - 30, 5);
            ctx.lineTo(cssWidth / 2, 40);
            ctx.stroke();
            ctx.closePath();
            ctx.fill();
        }

        function drawFlowerGrassField(f: number, g: number) {
            // canvas is cleared by drawLevel; draw grass and flowers using CSS sizes
            drawGrassField(g);
            drawFlowerField(f);
        }

        function drawLevel() {
            // clear & draw using CSS sizes (ctx is scaled to CSS pixels)
            ctx.clearRect(0, 0, cssWidth, cssHeight);
            // optional tile grid base (comment out if noisy)
            // makeTiles(tileSize);
            drawFlowerGrassField(flowers, grass);
            upgradeButton();
            // add some small cubes for texture (sizes clamped)
            randomCubes(8);
        }

        // initial draw + resize observer to redraw when wrapper changes size
        resize();
        const ro = new ResizeObserver(resize);
        ro.observe(wrapper);

        return () => {
            ro.disconnect();
        };
    }, [flowers, grass, tileSize]);

    return (
        <div
            ref={wrapperRef}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
            }}
        >
            <canvas
                ref={canvasRef}
                style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    zIndex: 0,
                    pointerEvents: "none",
                }}
            />
            <div style={{ position: "relative", zIndex: 1 }}>{children}</div>
        </div>
    );
}
