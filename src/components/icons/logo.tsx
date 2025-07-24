
import React from 'react';
import { FlameSolidIcon } from './flame-solid';

export function Logo({ streak, ...props }: React.SVGProps<SVGSVGElement> & { streak?: number }) {
  const showStreak = streak && streak > 0;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 220 50"
      width="165"
      height="37.5"
      {...props}
    >
      <defs>
        <linearGradient id="logo-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style={{ stopColor: 'hsl(var(--primary))', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: 'hsl(var(--accent))', stopOpacity: 1 }} />
        </linearGradient>
      </defs>
      <text
        x="0"
        y="35"
        fontFamily="'PT Sans', sans-serif"
        fontSize="32"
        fontWeight="bold"
        fill="url(#logo-gradient)"
      >
        Day Streak
      </text>
      {showStreak && (
        <>
          <g transform="translate(170, 8)">
            <FlameSolidIcon style={{ color: 'hsl(var(--primary))' }} width="24" height="24" />
          </g>
          <text
            x="198"
            y="35"
            fontFamily="'PT Sans', sans-serif"
            fontSize="32"
            fontWeight="bold"
            fill="hsl(var(--primary))"
          >
            {streak}
          </text>
        </>
      )}
    </svg>
  );
}
