import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ButtonProps } from '@/components/ui/button';

interface MagneticButtonProps extends ButtonProps {
    children: React.ReactNode;
    strength?: number; // How strong the magnetic pull is (default 0.5)
}

const MagneticButton: React.FC<MagneticButtonProps> = ({
    children,
    className,
    strength = 0.3,
    ...props
}) => {
    const btnRef = useRef<HTMLButtonElement>(null);
    const [position, setPosition] = useState({ x: 0, y: 0 });

    const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
        if (!btnRef.current) return;

        const rect = btnRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        // Calculate distance from center
        // We multiply by strength to control how "loose" the button feels
        const x = (e.clientX - centerX) * strength;
        const y = (e.clientY - centerY) * strength;

        setPosition({ x, y });
    };

    const handleMouseLeave = () => {
        setPosition({ x: 0, y: 0 });
    };

    return (
        <Button
            ref={btnRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className={cn(
                "transition-transform duration-150 ease-out will-change-transform",
                className
            )}
            style={{
                transform: `translate(${position.x}px, ${position.y}px)`,
            }}
            {...props}
        >
            <span className="relative z-10 flex items-center justify-center pointer-events-none">
                {children}
            </span>
        </Button>
    );
};

export default MagneticButton;
