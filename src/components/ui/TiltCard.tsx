import React, { useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface TiltCardProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    className?: string;
    glowColor?: string;
}

const TiltCard: React.FC<TiltCardProps> = ({ children, className, glowColor = "rgba(255, 255, 255, 0.1)", ...props }) => {
    const cardRef = useRef<HTMLDivElement>(null);
    const [rotation, setRotation] = useState({ x: 0, y: 0 });
    const [glowPos, setGlowPos] = useState({ x: 50, y: 50 });
    const [opacity, setOpacity] = useState(0);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!cardRef.current) return;

        const rect = cardRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Calculate percentage for glow position
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const percentX = (x / rect.width) * 100;
        const percentY = (y / rect.height) * 100;

        // Calculate rotation (limit to +/- 10 degrees)
        const rotateX = ((y - centerY) / centerY) * -10; // Invert X for correct tilt feel
        const rotateY = ((x - centerX) / centerX) * 10;

        setRotation({ x: rotateX, y: rotateY });
        setGlowPos({ x: percentX, y: percentY });
        setOpacity(1);
    };

    const handleMouseLeave = () => {
        // Reset position smoothly
        setRotation({ x: 0, y: 0 });
        setOpacity(0);
    };

    return (
        <div
            ref={cardRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className={cn(
                "relative rounded-3xl transition-transform duration-200 ease-out transform-gpu preserve-3d",
                className
            )}
            style={{
                transform: `perspective(1000px) rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
            }}
            {...props}
        >
            {/* Glare/Shine Effect */}
            <div
                className="absolute inset-0 rounded-3xl pointer-events-none z-20 transition-opacity duration-300"
                style={{
                    background: `radial-gradient(circle at ${glowPos.x}% ${glowPos.y}%, ${glowColor}, transparent 50%)`,
                    opacity: opacity,
                    mixBlendMode: 'overlay',
                }}
            />

            {/* Content */}
            <div className="relative z-10 w-full h-full">
                {children}
            </div>
        </div>
    );
};

export default TiltCard;
