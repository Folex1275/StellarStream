'use client';

import { useMemo } from 'react';
import Avatar from 'boring-avatars';

interface StellarAvatarProps {
  publicKey: string;
  size?: number;
  displayName?: string;
}

// Custom color palette matching Stellar Glass design system
const stellarColors = [
  '#00f5ff', // Stellar Cyan (Primary)
  '#8a00ff', // Hyper Violet (Secondary)
  '#0a0a14', // Deep Space
  '#1a1a2e', // Nebula Dark
  '#ffffff', // White
];

export function StellarAvatar({ publicKey, size = 120, displayName }: StellarAvatarProps) {
  // Generate a deterministic variant based on the public key
  const variant = useMemo(() => {
    const variants: Array<'marble' | 'beam' | 'pixel' | 'sunset' | 'ring' | 'bauhaus'> = 
      ['marble', 'beam', 'pixel', 'sunset', 'ring', 'bauhaus'];
    
    // Use the last character of the public key to determine variant
    const lastChar = publicKey.slice(-1).toUpperCase();
    const index = lastChar.charCodeAt(0) % variants.length;
    return variants[index];
  }, [publicKey]);

  // Generate custom colors based on the public key for uniqueness
  const customColors = useMemo(() => {
    // Create a seed from the public key
    const seed = publicKey.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    
    // Generate variations of the stellar colors
    const hue = (seed % 60) - 30; // -30 to 30 degree shift
    const saturation = 80 + (seed % 20); // 80-100%
    
    return [
      `hsl(${180 + hue}, ${saturation}%, 60%)`, // Cyan variant
      `hsl(${270 + hue}, ${saturation}%, 50%)`, // Violet variant
      '#0a0a14',
      '#1a1a2e',
      `hsl(${180 + hue}, ${saturation}%, 90%)`, // Light variant
    ];
  }, [publicKey]);

  // Use display name or public key as the seed for the avatar
  const seed = displayName?.trim() || publicKey;

  return (
    <div 
      className="relative rounded-full overflow-hidden"
      style={{ width: size, height: size }}
    >
      <Avatar
        size={size}
        variant={variant}
        name={seed}
        colors={customColors}
        square={false}
      />
      
      {/* Overlay gradient for glass effect */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.2) 0%, transparent 50%)',
        }}
      />
      
      {/* Subtle inner glow */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          boxShadow: 'inset 0 0 20px rgba(0, 245, 255, 0.1)',
          borderRadius: '50%',
        }}
      />
    </div>
  );
}

// Export a smaller version for use in headers/nav
export function StellarAvatarMini({ publicKey, displayName }: Omit<StellarAvatarProps, 'size'>) {
  return (
    <StellarAvatar 
      publicKey={publicKey} 
      size={32} 
      displayName={displayName}
    />
  );
}
