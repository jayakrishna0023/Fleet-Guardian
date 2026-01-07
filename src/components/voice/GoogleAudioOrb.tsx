import React, { useEffect, useRef } from 'react';
import './audio-orb/visual-3d';

// Extend JSX to include our custom element
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'gdm-live-audio-visuals-3d': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          inputNode?: AudioNode;
          outputNode?: AudioNode;
        },
        HTMLElement
      >;
    }
  }
}

interface GoogleAudioOrbProps {
  inputNode?: AudioNode;
  outputNode?: AudioNode;
  className?: string;
}

/**
 * React wrapper for Google's audio-orb web component
 * This is the actual Google audio orb with Lit elements and Three.js
 */
export const GoogleAudioOrb: React.FC<GoogleAudioOrbProps> = ({
  inputNode,
  outputNode,
  className,
}) => {
  const orbRef = useRef<any>(null);

  useEffect(() => {
    if (orbRef.current && inputNode) {
      orbRef.current.inputNode = inputNode;
    }
  }, [inputNode]);

  useEffect(() => {
    if (orbRef.current && outputNode) {
      orbRef.current.outputNode = outputNode;
    }
  }, [outputNode]);

  return (
    <div className={className} style={{ width: '100%', height: '100%', position: 'relative' }}>
      <gdm-live-audio-visuals-3d ref={orbRef} />
    </div>
  );
};
