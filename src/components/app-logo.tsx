
import type { SVGProps } from 'react';
import { Trash2 } from 'lucide-react';

interface AppLogoProps extends SVGProps<SVGSVGElement> {}

export function AppLogo({ className, ...props }: AppLogoProps) {
  return (
    <Trash2
      className={`h-6 w-6 ${className || ''}`}
      strokeWidth={1.5}
      aria-hidden="true"
      {...props}
    />
  );
}
