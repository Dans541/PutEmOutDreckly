import * as React from "react";
import type { SVGProps } from "react";

// Simple placeholder SVG mimicking the BinDays illustration style
export function PostcodeIllustration(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 200 150"
      aria-hidden="true"
      {...props}
    >
      {/* Background circle (simplified globe) */}
      <circle cx="100" cy="75" r="60" fill="#e0f2f7" /> {/* Light blue-grey */}

      {/* Simplified map pin */}
      <path
        d="M130 45 A15 15 0 1 0 130 75 A15 15 0 0 0 130 45 Z M130 65 L130 85 L125 80 L135 80 Z"
        fill="#FFD700" /* Gold */
      />
      <circle cx="130" cy="60" r="5" fill="#fff" />

      {/* Simplified character */}
      <rect x="60" y="90" width="30" height="40" rx="5" fill="#a5d6a7" /> {/* Light green body */}
      <circle cx="75" cy="80" r="10" fill="#ffccbc" /> {/* Head */}
      <rect x="70" y="130" width="10" height="15" fill="#81c784" /> {/* Legs */}
      <rect x="45" y="95" width="15" height="5" rx="2" fill="#ffe0b2" /> {/* Map */}

      {/* Simple stool */}
       <rect x="65" y="145" width="20" height="5" rx="2" fill="#a1887f" />
       <rect x="72" y="130" width="6" height="15" fill="#a1887f" />
    </svg>
  );
}
