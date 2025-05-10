
import type { SVGProps } from 'react';
import { Trash2, Recycle, Utensils, Package } from 'lucide-react'; // Package as a fallback

interface BinIconProps extends SVGProps<SVGSVGElement> {
  binType: 'generalWaste' | 'recycling' | 'foodWaste' | string; // Allow any string for potential future types
  colorClass?: string; // Allow passing Tailwind color classes
}

// Map bin types to colors and icons
const binStyles = {
  generalWaste: { icon: Trash2, colorClass: 'text-gray-500 dark:text-white', label: 'Rubbish Bin' },
  recycling: { icon: Recycle, colorClass: 'text-blue-500 dark:text-white', label: 'Recycling Bin' },
  foodWaste: { icon: Utensils, colorClass: 'text-orange-600 dark:text-white', label: 'Food Waste Bin' },
  // Add more types if necessary
  default: { icon: Package, colorClass: 'text-muted-foreground', label: 'Bin' }, // Fallback
};

export function BinIcon({ binType, className, colorClass, ...props }: BinIconProps) {
  const styles = binStyles[binType as keyof typeof binStyles] || binStyles.default;
  const IconComponent = styles.icon;
  const effectiveColorClass = colorClass || styles.colorClass;

  return (
    <IconComponent
      className={`h-6 w-6 shrink-0 ${effectiveColorClass} ${className || ''}`}
      aria-label={styles.label}
      {...props}
    />
  );
}

