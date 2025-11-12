// Import icons from lucide-react library for sidebar navigation
import { Landmark, Receipt, UtensilsCrossed, Home, BookOpen, TrendingUp, Image } from "lucide-react";
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


// Navigation structure: defines sidebar sections and their menu items
// Each section has a title and an array of items with title, url, and icon
const navigationItems = [
  {
    title: "Finance",
    items: [
      { title: "Bank Connections", url: "/bank-connections", icon: Landmark },
      { title: "Transactions", url: "/transactions", icon: Receipt },
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

  return (
    <Sidebar className="border-r border-border" collapsible="icon">
      <SidebarContent>
        <div className="flex-1">
          {/* Home navigation item - always at the top, no active state */}
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <div className="flex items-center justify-between">
                    <SidebarMenuButton asChild className="flex-1">
                      <Link to="/">
                        <Home className="h-4 w-4" />
                        <span>Home</span>
                      </Link>
                    </SidebarMenuButton>
                    {!isCollapsed && (
                      <SidebarTrigger className="ml-2" />
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
                        <SidebarMenuButton asChild isActive={isActive}>
                          <NavLink to={item.url}>
                            <item.icon className="h-4 w-4" />
                            <span>{item.title}</span>
                          </NavLink>
                        </SidebarMenuButton>
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
  );
}