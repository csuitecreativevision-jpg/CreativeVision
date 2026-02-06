import React, { useEffect, useRef } from 'react';

interface Fish {
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    color: string;
    speed: number;
    angle: number;
    hunger: number; // 0-100, seek food when high
}

interface Food {
    x: number;
    y: number;
    vy: number;
    id: number;
}

interface Seaweed {
    x: number;
    height: number;
    width: number;
    segments: number;
    color: string;
    offset: number;
}

interface Coral {
    x: number;
    height: number;
    width: number;
    color: string;
    shape: 'round' | 'branch';
}

export const FishTank = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const mouseRef = useRef({ x: 0, y: 0, active: false });
    const foodsRef = useRef<Food[]>([]);

    useEffect(() => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let width = container.clientWidth;
        let height = container.clientHeight;
        const fishArray: Fish[] = [];
        const seaweeds: Seaweed[] = [];
        const corals: Coral[] = [];
        let foodCounter = 0;

        const resize = () => {
            // Resize logic
            width = container.clientWidth;
            height = container.clientHeight;
            canvas.width = width;
            canvas.height = height;

            // Re-generate environment on resize
            seaweeds.length = 0;
            const numSeaweed = Math.floor(width / 60);
            for (let i = 0; i < numSeaweed; i++) {
                seaweeds.push({
                    x: Math.random() * width,
                    height: 100 + Math.random() * 150,
                    width: 5 + Math.random() * 5,
                    segments: 5 + Math.floor(Math.random() * 5),
                    color: `rgba(20, ${150 + Math.random() * 50}, ${100 + Math.random() * 50}, 0.6)`,
                    offset: Math.random() * Math.PI * 2
                });
            }

            corals.length = 0;
            const numCoral = Math.floor(width / 150);
            const coralColors = ['#F87171', '#F472B6', '#34D399', '#60A5FA', '#A78BFA'];
            for (let i = 0; i < numCoral; i++) {
                corals.push({
                    x: Math.random() * width,
                    height: 60 + Math.random() * 60,
                    width: 40 + Math.random() * 40,
                    color: coralColors[Math.floor(Math.random() * coralColors.length)],
                    shape: Math.random() > 0.5 ? 'round' : 'branch'
                });
            }
        };

        // Initialize Fish
        const colors = ['#818CF8', '#A78BFA', '#34D399', '#60A5FA', '#F472B6'];
        const numFish = 30;

        for (let i = 0; i < numFish; i++) {
            fishArray.push({
                x: Math.random() * width,
                y: Math.random() * height,
                vx: (Math.random() - 0.5) * 1,
                vy: (Math.random() - 0.5) * 1,
                size: Math.random() * 3 + 2,
                color: colors[Math.floor(Math.random() * colors.length)],
                speed: Math.random() * 0.8 + 0.5,
                angle: Math.random() * Math.PI * 2,
                hunger: 0
            });
        }

        let frame = 0;

        const animate = () => {
            frame++;
            ctx.clearRect(0, 0, width, height);

            // Draw Corals (Background)
            corals.forEach(coral => {
                ctx.save();
                ctx.translate(coral.x, height);
                ctx.fillStyle = coral.color + '40'; // Low opacity
                ctx.shadowBlur = 20;
                ctx.shadowColor = coral.color;

                if (coral.shape === 'round') {
                    ctx.beginPath();
                    ctx.arc(0, 0, coral.width, Math.PI, 0);
                    ctx.fill();
                } else {
                    ctx.beginPath();
                    ctx.moveTo(-coral.width / 2, 0);
                    ctx.bezierCurveTo(-coral.width / 2, -coral.height / 2, 0, -coral.height, 0, -coral.height);
                    ctx.bezierCurveTo(0, -coral.height, coral.width / 2, -coral.height / 2, coral.width / 2, 0);
                    ctx.fill();
                }
                ctx.restore();
            });

            // Draw Seaweed
            seaweeds.forEach(weed => {
                ctx.save();
                ctx.translate(weed.x, height);
                ctx.strokeStyle = weed.color;
                ctx.lineWidth = weed.width;
                ctx.lineCap = 'round';
                ctx.shadowBlur = 5;
                ctx.shadowColor = weed.color;

                const sway = Math.sin(frame * 0.02 + weed.offset) * 20;

                ctx.beginPath();
                ctx.moveTo(0, 0);
                // Simple quadratic bezier for swaying
                ctx.quadraticCurveTo(sway, -weed.height / 2, sway / 2, -weed.height);
                ctx.stroke();
                ctx.restore();
            });


            // Food Logic
            foodsRef.current.forEach((food, index) => {
                food.y += food.vy;
                if (food.y > height) {
                    foodsRef.current.splice(index, 1);
                }

                // Draw Food
                ctx.fillStyle = '#FCD34D'; // Amber
                ctx.beginPath();
                ctx.arc(food.x, food.y, 3, 0, Math.PI * 2);
                ctx.fill();
            });

            // Fish Logic
            fishArray.forEach(fish => {
                // Determine Target
                let targetX: number | null = null;
                let targetY: number | null = null;
                let seekingFood = false;

                // 1. Mouse Fear (Priority 1)
                if (mouseRef.current.active) {
                    const dx = fish.x - mouseRef.current.x;
                    const dy = fish.y - mouseRef.current.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < 150) {
                        fish.angle = Math.atan2(dy, dx);
                        fish.speed += 0.1; // Panic boost
                    }
                }
                // 2. Food Attraction (Priority 2)
                else if (foodsRef.current.length > 0) {
                    // Find closest food
                    let minDist = Infinity;
                    let closestFoodIndex = -1;

                    foodsRef.current.forEach((food, idx) => {
                        const dx = food.x - fish.x;
                        const dy = food.y - fish.y;
                        const d = Math.sqrt(dx * dx + dy * dy);
                        if (d < minDist) {
                            minDist = d;
                            closestFoodIndex = idx;
                        }
                    });

                    if (closestFoodIndex !== -1 && minDist < 300) {
                        const food = foodsRef.current[closestFoodIndex];
                        targetX = food.x;
                        targetY = food.y;
                        seekingFood = true;

                        // Eat food
                        if (minDist < 10) {
                            foodsRef.current.splice(closestFoodIndex, 1);
                            fish.size += 0.5; // Grow slightly
                            if (fish.size > 8) fish.size = 8;
                        }
                    }
                }

                // Update Movement Angle
                if (seekingFood && targetX !== null && targetY !== null) {
                    const dx = targetX - fish.x;
                    const dy = targetY - fish.y;
                    const targetAngle = Math.atan2(dy, dx);

                    // Smoothly turn towards food
                    let diff = targetAngle - fish.angle;
                    while (diff < -Math.PI) diff += Math.PI * 2;
                    while (diff > Math.PI) diff -= Math.PI * 2;
                    fish.angle += diff * 0.05;
                } else {
                    fish.angle += (Math.random() - 0.5) * 0.1; // Random wander
                }

                // Apply Velocity
                fish.speed = Math.max(0.5, Math.min(fish.speed, 3)); // Clamp speed
                fish.speed *= 0.99; // Friction

                fish.vx = Math.cos(fish.angle) * fish.speed;
                fish.vy = Math.sin(fish.angle) * fish.speed;

                fish.x += fish.vx;
                fish.y += fish.vy;

                // Wall Wrap
                if (fish.x < -10) fish.x = width + 10;
                if (fish.x > width + 10) fish.x = -10;
                if (fish.y < -10) fish.y = height + 10;
                if (fish.y > height + 10) fish.y = -10;

                // Draw Fish
                ctx.save();
                ctx.translate(fish.x, fish.y);
                ctx.rotate(Math.atan2(fish.vy, fish.vx));

                // Glow
                ctx.shadowBlur = 15;
                ctx.shadowColor = fish.color;

                // Body
                ctx.fillStyle = fish.color;
                ctx.beginPath();
                ctx.ellipse(0, 0, fish.size * 3, fish.size, 0, 0, Math.PI * 2);
                ctx.fill();

                // Tail
                ctx.beginPath();
                ctx.moveTo(-fish.size * 2, 0);
                ctx.lineTo(-fish.size * 4, -fish.size);
                ctx.lineTo(-fish.size * 4, fish.size);
                ctx.closePath();
                ctx.fillStyle = fish.color;
                ctx.fill();

                ctx.restore();
            });

            requestAnimationFrame(animate);
        };

        const handleMouseMove = (e: MouseEvent) => {
            const rect = canvas.getBoundingClientRect();
            mouseRef.current = {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top,
                active: true
            };
        };

        const handleMouseLeave = () => {
            mouseRef.current.active = false;
        };

        const handleClick = (e: MouseEvent) => {
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            // Drop food
            foodsRef.current.push({
                x,
                y,
                vy: 1 + Math.random(),
                id: foodCounter++
            });
        };


        window.addEventListener('resize', resize);
        resize(); // Initial sizing
        animate();

        canvas.addEventListener('mousemove', handleMouseMove);
        canvas.addEventListener('mouseleave', handleMouseLeave);
        canvas.addEventListener('click', handleClick);

        return () => {
            window.removeEventListener('resize', resize);
            canvas.removeEventListener('mousemove', handleMouseMove);
            canvas.removeEventListener('mouseleave', handleMouseLeave);
            canvas.removeEventListener('click', handleClick);
        };
    }, []);

    return (
        <div ref={containerRef} className="absolute inset-0 w-full h-full bg-[#020617] overflow-hidden group cursor-crosshair">
            {/* Ambient Deep Sea Gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#0f172a] to-[#020617] opacity-80" />

            {/* Light Rays (CSS Animation) - Keeping these as they add great atmosphere */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-1/2 left-1/4 w-1/2 h-[200%] bg-blue-500/5 rotate-12 blur-[100px] animate-pulse" />
                <div className="absolute -top-1/2 right-1/4 w-1/3 h-[200%] bg-indigo-500/5 -rotate-12 blur-[80px] animate-pulse duration-[4000ms]" />
            </div>

            <canvas
                ref={canvasRef}
                className="relative z-10 w-full h-full"
            />

            {/* Instruction Overlay on Hover */}
            <div className="absolute bottom-4 right-4 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <span className="text-[10px] text-white/30 uppercase tracking-widest font-bold">Click to Feed</span>
            </div>
        </div>
    );
};
