import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

/**
 * Sonner Toast Component with Enhanced Styling
 * 
 * Provides toast notifications with:
 * - Enhanced shadow and contrast for better visibility
 * - Improved dark mode styling
 * - Consistent spacing and typography
 * 
 * Used by the showToast helper in @/lib/toast-helper for variant-specific toasts
 */
const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-card group-[.toaster]:text-card-foreground group-[.toaster]:border-border group-[.toaster]:shadow-2xl group-[.toaster]:border",
          description: "group-[.toast]:text-muted-foreground group-[.toast]:mt-1",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground group-[.toast]:shadow-sm",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          icon: "group-[.toast]:mr-3",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
