/**
 * Enhanced ToggleGroup Component with Animated Sliding Indicator
 * 
 * Features:
 * - Animated sliding background indicator that moves when selection changes
 * - Smooth transitions using Tailwind's transition utilities
 * - Consistent styling with subtle blue theme
 * - Supports both single and multiple selection modes
 * 
 * Usage:
 *   <ToggleGroup type="single" value={selected} onValueChange={setSelected}>
 *     <ToggleGroupItem value="option1">Option 1</ToggleGroupItem>
 *     <ToggleGroupItem value="option2">Option 2</ToggleGroupItem>
 *   </ToggleGroup>
 */

import * as React from "react";
import * as ToggleGroupPrimitive from "@radix-ui/react-toggle-group";
import { type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";
import { toggleVariants } from "@/components/ui/toggle";

const ToggleGroupContext = React.createContext<VariantProps<typeof toggleVariants>>({
  size: "default",
  variant: "default",
});

/**
 * ToggleGroup Root Component
 * 
 * Wraps toggle items and provides animated selection indicator
 * The indicator is positioned absolutely and moves smoothly between items
 */
const ToggleGroup = React.forwardRef<
  React.ElementRef<typeof ToggleGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Root> & VariantProps<typeof toggleVariants>
>(({ className, variant, size, children, ...props }, ref) => {
  // Track selected value to position indicator
  const [indicatorStyle, setIndicatorStyle] = React.useState<React.CSSProperties>({});
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Update indicator position when value changes
  React.useEffect(() => {
    if (!containerRef.current) return;
    
    // Find the active toggle item
    const activeItem = containerRef.current.querySelector('[data-state="on"]') as HTMLElement;
    if (activeItem) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const itemRect = activeItem.getBoundingClientRect();
      
      // Calculate indicator position relative to container
      setIndicatorStyle({
        left: itemRect.left - containerRect.left,
        width: itemRect.width,
      });
    }
  }, [props.value]);

  return (
    <ToggleGroupPrimitive.Root 
      ref={containerRef}
      className={cn("relative flex items-center justify-center gap-1 bg-muted/70 rounded-md p-1", className)} 
      {...props}
    >
      {/* Animated sliding background indicator */}
      <div
        className="absolute top-1 h-[calc(100%-0.5rem)] bg-primary rounded transition-all duration-200 ease-out pointer-events-none"
        style={indicatorStyle}
      />
      
      <ToggleGroupContext.Provider value={{ variant, size }}>{children}</ToggleGroupContext.Provider>
    </ToggleGroupPrimitive.Root>
  );
});

ToggleGroup.displayName = ToggleGroupPrimitive.Root.displayName;

/**
 * ToggleGroupItem Component
 * 
 * Individual toggle item within a group
 * Styles change based on selected state, with the animated indicator providing visual feedback
 */
const ToggleGroupItem = React.forwardRef<
  React.ElementRef<typeof ToggleGroupPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Item> & VariantProps<typeof toggleVariants>
>(({ className, children, variant, size, ...props }, ref) => {
  const context = React.useContext(ToggleGroupContext);
  const itemSize = size ?? context.size;

  // Define size-specific classes
  const sizeClasses = {
    default: "px-3 py-2",
    sm: "px-2.5 py-1.5 text-xs",
    lg: "px-4 py-2.5",
  };

  return (
    <ToggleGroupPrimitive.Item
      ref={ref}
      className={cn(
        "relative z-10 flex items-center justify-center gap-2 font-medium rounded transition-all",
        "data-[state=on]:text-primary-foreground data-[state=off]:text-muted-foreground",
        "hover:text-foreground hover:bg-muted/50",
        sizeClasses[itemSize || "default"],
        itemSize === "sm" ? "text-xs" : "text-sm",
        className,
      )}
      {...props}
    >
      {children}
    </ToggleGroupPrimitive.Item>
  );
});

ToggleGroupItem.displayName = ToggleGroupPrimitive.Item.displayName;

export { ToggleGroup, ToggleGroupItem };
