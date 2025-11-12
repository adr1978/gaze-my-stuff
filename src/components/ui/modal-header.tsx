/**
 * ModalHeader Component
 * 
 * Provides consistent heading and subheading hierarchy for all modals.
 * Ensures headings are visibly larger than subheadings with proper spacing.
 * 
 * Features:
 * - Clear visual hierarchy (heading is significantly larger than subheading)
 * - Consistent spacing between heading and subheading
 * - Optional icon support for headings
 * - Proper semantic HTML structure
 * 
 * Usage:
 *   <ModalHeader
 *     title="Edit Recipe"
 *     description="Update the recipe details below"
 *     icon={<Pencil className="h-5 w-5" />}
 *   />
 */

import * as React from "react";
import { cn } from "@/lib/utils";

interface ModalHeaderProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  className?: string;
}

/**
 * Reusable modal header component with consistent styling
 * 
 * @param title - Main heading text (rendered larger and bolder)
 * @param description - Optional subheading text (rendered smaller with muted colour)
 * @param icon - Optional icon to display before the title
 * @param className - Additional CSS classes for customisation
 */
export function ModalHeader({ title, description, icon, className }: ModalHeaderProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {/* Main heading with optional icon */}
      <div className="flex items-center gap-2">
        {icon && <div className="text-primary">{icon}</div>}
        <h2 className="text-xl font-semibold tracking-tight text-foreground">
          {title}
        </h2>
      </div>
      
      {/* Optional description/subheading */}
      {description && (
        <p className="text-sm text-muted-foreground leading-relaxed">
          {description}
        </p>
      )}
    </div>
  );
}
