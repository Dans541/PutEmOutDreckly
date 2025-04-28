import * as React from "react";
import type { SVGProps } from "react";

// Simple placeholder SVG mimicking the BinDays dashboard illustration
export function DashboardIllustration(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 200 100" // Adjusted viewBox for potentially wider aspect ratio
      aria-hidden="true"
      {...props}
    >
      {/* Simplified character */}
      <rect x="70" y="30" width="30" height="50" rx="5" fill="#a5d6a7" /> {/* Light green body */}
      <circle cx="85" cy="25" r="10" fill="#ffccbc" /> {/* Head */}
      <rect x="60" y="40" width="10" height="15" transform="rotate(-20 65 47.5)" fill="#a5d6a7" /> {/* Arm */}
      <rect x="55" y="45" width="15" height="15" rx="3" fill="#607d8b" /> {/* Bin Bag */}

      {/* Simplified bin */}
      <rect x="110" y="40" width="40" height="50" rx="4" fill="#FFEB3B" /> {/* Yellow bin */}
      <rect x="105" y="35" width="50" height="10" rx="3" fill="#FBC02D" /> {/* Lid */}
    </svg>
  );
}
