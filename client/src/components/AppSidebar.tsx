import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Home,
  CreditCard,
  PieChart,
  Upload,
  Settings,
  TrendingUp,
  Calculator,
  FileText,
  LogOut,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const menuItems = [
  { title: "Dashboard", url: "/", icon: Home },
  { title: "Transactions", url: "/transactions", icon: CreditCard },
  { title: "Analytics", url: "/analytics", icon: PieChart },
  { title: "Import", url: "/import", icon: Upload },
  { title: "Categories", url: "/categories", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const collapsed = state === "collapsed";
  const { signOut, user } = useAuth();
  const { toast } = useToast();

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast({
        title: "Error",
        description: "Failed to sign out",
        variant: "destructive"
      });
    }
  };

  const isActive = (path: string) => currentPath === path;
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive 
      ? "bg-primary text-primary-foreground font-medium shadow-sm" 
      : "hover:bg-accent hover:text-accent-foreground text-sidebar-foreground transition-colors";

  return (
    <Sidebar className={collapsed ? "w-14" : "w-60"} collapsible="icon">
      <SidebarContent>
        <div className="p-4 border-b">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-primary-foreground" />
            </div>
            {!collapsed && (
              <div>
                <h2 className="text-lg font-semibold">FinanceTracker</h2>
              </div>
            )}
          </div>
        </div>

        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end className={getNavCls}>
                      <item.icon className="w-4 h-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <div className="p-2">
          {user && !collapsed && (
            <div className="mb-3 text-sm text-muted-foreground truncate">
              {user.email}
            </div>
          )}
          <Button 
            variant="outline" 
            className={collapsed ? "w-10 h-10 p-0" : "w-full justify-start"} 
            onClick={handleSignOut}
            title="Sign Out"
          >
            <LogOut className={collapsed ? "h-4 w-4" : "mr-2 h-4 w-4"} />
            {!collapsed && "Sign Out"}
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}