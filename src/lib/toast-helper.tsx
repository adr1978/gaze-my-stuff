/**
 * Enhanced Toast Helper Utility
 * 
 * Centralised toast notification system using sonner with:
 * - Variant-specific icons (success, warning, info, error)
 * - Consistent styling across light and dark themes
 * - Enhanced shadows and contrast for better visibility
 * - UK English messaging support
 * 
 * Usage:
 *   import { showToast } from '@/lib/toast-helper';
 *   showToast.success('Operation completed successfully');
 *   showToast.error('An error occurred', 'Please try again later');
 */

import { toast } from 'sonner';
import { CheckCircle2, AlertTriangle, Info, XCircle } from 'lucide-react';

/**
 * Toast variant types
 */
export type ToastVariant = 'success' | 'warning' | 'info' | 'error';

/**
 * Toast options interface
 */
interface ToastOptions {
  duration?: number;
  description?: string;
}

/**
 * Get icon component for toast variant
 * Maps each variant to its corresponding lucide-react icon
 */
const getIconForVariant = (variant: ToastVariant) => {
  const iconProps = { className: 'h-5 w-5' };
  
  switch (variant) {
    case 'success':
      return <CheckCircle2 {...iconProps} />;
    case 'warning':
      return <AlertTriangle {...iconProps} />;
    case 'info':
      return <Info {...iconProps} />;
    case 'error':
      return <XCircle {...iconProps} />;
  }
};

/**
 * Get CSS classes for toast variant
 * Applies variant-specific colours and enhanced shadows
 */
const getClassesForVariant = (variant: ToastVariant): string => {
  const baseClasses = 'shadow-xl border-2';
  
  switch (variant) {
    case 'success':
      return `${baseClasses} !bg-success/10 !border-success/30 !text-success-foreground dark:!bg-success/15 dark:!border-success/40`;
    case 'warning':
      return `${baseClasses} !bg-warning/10 !border-warning/30 !text-warning-foreground dark:!bg-warning/15 dark:!border-warning/40`;
    case 'info':
      return `${baseClasses} !bg-info/10 !border-info/30 !text-info-foreground dark:!bg-info/15 dark:!border-info/40`;
    case 'error':
      return `${baseClasses} !bg-destructive/10 !border-destructive/30 !text-destructive-foreground dark:!bg-destructive/15 dark:!border-destructive/40`;
  }
};

/**
 * Show a toast notification with variant-specific styling
 * 
 * @param variant - Toast type (success, warning, info, error)
 * @param title - Main toast message
 * @param description - Optional detailed description
 * @param options - Additional toast options (duration, etc.)
 */
const showToastWithVariant = (
  variant: ToastVariant,
  title: string,
  description?: string,
  options?: ToastOptions
) => {
  const icon = getIconForVariant(variant);
  const classes = getClassesForVariant(variant);
  
  toast(title, {
    description,
    duration: options?.duration || 4000,
    icon,
    className: classes,
  });
};

/**
 * Toast helper object with convenience methods for each variant
 * Provides a clean API for showing notifications throughout the app
 */
export const showToast = {
  /**
   * Show success toast (green with tick icon)
   */
  success: (title: string, description?: string, options?: ToastOptions) => {
    showToastWithVariant('success', title, description, options);
  },
  
  /**
   * Show warning toast (amber/yellow with warning icon)
   */
  warning: (title: string, description?: string, options?: ToastOptions) => {
    showToastWithVariant('warning', title, description, options);
  },
  
  /**
   * Show info toast (blue with information icon)
   */
  info: (title: string, description?: string, options?: ToastOptions) => {
    showToastWithVariant('info', title, description, options);
  },
  
  /**
   * Show error toast (red with exclamation icon)
   */
  error: (title: string, description?: string, options?: ToastOptions) => {
    showToastWithVariant('error', title, description, options);
  },
};
