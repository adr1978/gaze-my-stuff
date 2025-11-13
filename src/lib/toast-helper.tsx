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
 * Matches the exact styling used in Notion Cover Studio
 */
const getIconForVariant = (variant: ToastVariant) => {
  switch (variant) {
    case 'success':
      return <CheckCircle2 className="h-5 w-5 text-green-400" />;
    case 'warning':
      return <AlertTriangle className="h-5 w-5 text-yellow-400" />;
    case 'info':
      return <Info className="h-5 w-5 text-blue-400" />;
    case 'error':
      return <XCircle className="h-5 w-5 text-red-400" />;
  }
};

/**
 * Show a toast notification with variant-specific styling
 * Matches the exact pattern used in Notion Cover Studio
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
  
  // Use description as the message if provided, otherwise use title
  const message = description || title;
  
  toast[variant](message, {
    duration: options?.duration || 4000,
    icon,
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
