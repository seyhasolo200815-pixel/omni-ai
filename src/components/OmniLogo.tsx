import React from 'react';

interface OmniLogoProps {
  className?: string;
  size?: number;
  animated?: boolean;
}

export const OmniLogo: React.FC<OmniLogoProps> = ({
  className = 'w-6 h-6',
  size = 24,
  animated = false,
}) => {
  const gradientId = React.useId();

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${className} ${animated ? 'animate-[spin_4s_linear_infinite]' : ''}`}
      aria-label="Omni AI Logo"
    >
      <defs>
        {/* Dynamic Multi-stop Vibrant Gradients matching official Omni AI branding */}
        <linearGradient id={`${gradientId}-swirl1`} x1="15%" y1="10%" x2="85%" y2="90%">
          <stop offset="0%" stopColor="#38bdf8" />    {/* Sky Blue */}
          <stop offset="35%" stopColor="#2563eb" />   {/* Royal Blue */}
          <stop offset="70%" stopColor="#4f46e5" />   {/* Indigo */}
          <stop offset="100%" stopColor="#c084fc" />  {/* Vibrant Purple */}
        </linearGradient>

        <linearGradient id={`${gradientId}-swirl2`} x1="85%" y1="15%" x2="20%" y2="85%">
          <stop offset="0%" stopColor="#00f0ff" />
          <stop offset="50%" stopColor="#0070f3" />
          <stop offset="100%" stopColor="#a855f7" />
        </linearGradient>

        <linearGradient id={`${gradientId}-orbit`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.9" />
          <stop offset="50%" stopColor="#60a5fa" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#c084fc" stopOpacity="0.9" />
        </linearGradient>
      </defs>

      {/* Outer Orbital Rings & Satellite Nodes */}
      <ellipse
        cx="50"
        cy="50"
        rx="40"
        ry="23"
        transform="rotate(-28 50 50)"
        stroke={`url(#${gradientId}-orbit)`}
        strokeWidth="2.2"
        strokeDasharray="6 2"
        fill="none"
      />
      <ellipse
        cx="50"
        cy="50"
        rx="38"
        ry="20"
        transform="rotate(35 50 50)"
        stroke={`url(#${gradientId}-orbit)`}
        strokeWidth="2"
        fill="none"
        opacity="0.85"
      />

      {/* Orbital Satellite Spheres */}
      <circle cx="86" cy="38" r="4.2" fill="#38bdf8" />
      <circle cx="86" cy="38" r="6" fill="#38bdf8" opacity="0.3" />

      <circle cx="21" cy="35" r="3.8" fill="#00f0ff" />
      <circle cx="21" cy="35" r="5.5" fill="#00f0ff" opacity="0.3" />

      <circle cx="24" cy="67" r="4" fill="#c084fc" />
      <circle cx="24" cy="67" r="6" fill="#c084fc" opacity="0.3" />

      {/* Main Core Vortex Swirl (The Iconic Omni Torus) */}
      <path
        d="M 50 16 
           C 68.78 16 84 31.22 84 50 
           C 84 68.78 68.78 84 50 84 
           C 31.22 84 16 68.78 16 50 
           C 16 41 19.5 32.8 25.2 26.8
           C 28 24 33 24 35 27
           C 37 30 36 34 33 37
           C 29.5 40.5 27.5 45 27.5 50
           C 27.5 62.43 37.57 72.5 50 72.5
           C 62.43 72.5 72.5 62.43 72.5 50
           C 72.5 37.57 62.43 27.5 50 27.5
           C 44.5 27.5 39.5 29.5 35.8 33
           C 32 37 26 34 27.5 29
           C 33 21 41 16 50 16 Z"
        fill={`url(#${gradientId}-swirl1)`}
      />

      {/* Inner Fluid Vortex Ribbon */}
      <path
        d="M 50 24
           C 64.36 24 76 35.64 76 50
           C 76 64.36 64.36 76 50 76
           C 40.5 76 32.2 70.9 27.8 63.3
           C 33.5 66 40 67 46 65
           C 56 61.5 62.5 52 62.5 42
           C 62.5 32 54 25.5 45 25.5
           C 47.5 24.5 48.7 24 50 24 Z"
        fill={`url(#${gradientId}-swirl2)`}
        opacity="0.95"
      />

      {/* Center Void / Pupil Core */}
      <circle cx="50" cy="50" r="14.5" fill="#ffffff" />
      <circle cx="50" cy="50" r="12" fill={`url(#${gradientId}-swirl1)`} opacity="0.15" />
    </svg>
  );
};
