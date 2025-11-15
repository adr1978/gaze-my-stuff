// Import icons from lucide-react library for sidebar navigation
import React from "react";
import { Landmark, Receipt, UtensilsCrossed, Home, BookOpen, TrendingUp, Image, Webhook } from "lucide-react";
import { NavLink, Link, useLocation } from "react-router-dom";
import { ThemeToggle } from "@/components/sidebar/ThemeToggle";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";


// Navigation structure: defines sidebar sections and their menu items
// Each section has a title and an array of items with title, url, and icon
const navigationItems = [
  {
    title: "Finance",
    items: [
      { title: "Bank Connections", url: "/bank-connections", icon: Landmark },
      { title: "Investments", url: "/investments", icon: TrendingUp },
    ],
  },
  {
    title: "Tools",
    items: [
      { title: "Recipe Importer", url: "/recipe-importer", icon: UtensilsCrossed },
      { title: "Notion Cover Studio", url: "/notion-cover-studio", icon: Image },
      { title: "Documentation", url: "/documentation", icon: BookOpen },
    ],
  },
  {
    title: "Monitoring",
    items: [
      { title: "Transactions Monitor", url: "/transactions-monitor", icon: Receipt },
      { title: "Webhooks Listener", url: "/webhooks-listener", icon: Webhook },
    ],
  },

];

/**
 * AppSidebar Component
 * 
 * Main navigation sidebar for the application.
 * Displays collapsible icon-based navigation with:
 * - Home link at the top (no active state)
 * - Grouped navigation items (Finance, Tools sections)
 * - Active state highlighting using NavLink for non-home items
 * - Collapsible to icon-only mode
 */
export function AppSidebar() {
  const location = useLocation();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isHovered, setIsHovered] = React.useState(false);
  const [isTransitioning, setIsTransitioning] = React.useState(false);

  // Track transition state to keep trigger visible during animation
  React.useEffect(() => {
    if (isCollapsed) {
      setIsTransitioning(true);
      const timer = setTimeout(() => setIsTransitioning(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isCollapsed]);

  return (
    <TooltipProvider>
      <Sidebar 
        className="border-r border-border" 
        collapsible="icon"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <SidebarContent>
          <div className="flex-1">
            {/* Toggle button and Home - swap positions with smooth transition */}
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  {/* Trigger button in first position when collapsed */}
                  <SidebarMenuItem className={`transition-all duration-300 ${isCollapsed ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-12 h-0 overflow-hidden'}`}>
                    <SidebarMenuButton asChild>
                      <div>
                        <SidebarTrigger />
                      </div>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  
                  {/* Home link - shifts down when collapsed */}
                  <SidebarMenuItem className={`transition-all duration-300 ${isCollapsed ? 'translate-y-0' : 'translate-y-0'}`}>
                    <div className="flex items-center justify-between w-full">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <SidebarMenuButton asChild>
                            <Link to="/">
                              <Home className="h-4 w-4" />
                              <span>Home</span>
                            </Link>
                          </SidebarMenuButton>
                        </TooltipTrigger>
                        {isCollapsed && (
                          <TooltipContent side="right" className="z-50">
                            <p>Home</p>
                          </TooltipContent>
                        )}
                      </Tooltip>
                      {!isCollapsed && (isHovered || isTransitioning) && (
                        <SidebarTrigger className="mr-2 transition-opacity duration-300" />
                      )}
                    </div>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          
            {/* Dynamic navigation sections - maps through navigationItems array */}
            {navigationItems.map((section) => (
              <SidebarGroup key={section.title}>
                <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3">
                  {section.title}
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {/* Render each item within the section */}
                    {section.items.map((item) => {
                      const isActive = location.pathname === item.url;
                      return (
                        <SidebarMenuItem key={item.title}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <SidebarMenuButton asChild isActive={isActive}>
                                <NavLink to={item.url}>
                                  <item.icon className="h-4 w-4" />
                                  <span>{item.title}</span>
                                </NavLink>
                              </SidebarMenuButton>
                            </TooltipTrigger>
                            {isCollapsed && (
                              <TooltipContent side="right">
                                <p>{item.title}</p>
                              </TooltipContent>
                            )}
                          </Tooltip>
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            ))}
          </div>
          {!isCollapsed && (
            <div className="mt-4 p-4">
              <ThemeToggle />
            </div>
          )}
        </SidebarContent>
      </Sidebar>
    </TooltipProvider>
  );
}