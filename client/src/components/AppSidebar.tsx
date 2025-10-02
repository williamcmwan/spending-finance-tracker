import { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import QRCode from "qrcode";
import {
  Home,
  CreditCard,
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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

const menuItems = [
  { title: "Dashboard", url: "/", icon: Home },
  { title: "Transactions", url: "/transactions", icon: CreditCard },
  { title: "Import", url: "/import", icon: Upload },
  { title: "Categories", url: "/categories", icon: Settings },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const { state, toggleSidebar } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const collapsed = state === "collapsed";
  const { logout, user, refreshUser } = useAuth();
  const { toast } = useToast();

  const handleSignOut = async () => {
    try {
      logout();
      toast({ title: "Signed out" });
    } catch (e) {
      toast({ title: "Error", description: "Failed to sign out", variant: "destructive" });
    }
  };

  const handleToggleSidebar = () => {
    toggleSidebar();
  };

  const [open2fa, setOpen2fa] = useState(false);
  const [otpUrl, setOtpUrl] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [enabling, setEnabling] = useState(false);

  const startSetup2FA = async () => {
    try {
      const res = await (await import("@/integrations/api/client")).apiClient.totpSetup();
      setOtpUrl(res.otpauth_url);
      setSecret(res.secret);
      
      // Generate QR code
      if (res.otpauth_url) {
        const qrDataUrl = await QRCode.toDataURL(res.otpauth_url);
        setQrCodeDataUrl(qrDataUrl);
      }
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Failed to start 2FA setup", variant: "destructive" });
    }
  };

  const confirmEnable2FA = async () => {
    setEnabling(true);
    try {
      await (await import("@/integrations/api/client")).apiClient.totpEnable(code);
      toast({ title: "Two-factor enabled" });
      setOpen2fa(false);
      setCode("");
      setOtpUrl(null);
      setSecret(null);
      setQrCodeDataUrl(null);
      await refreshUser();
    } catch (e: any) {
      toast({ title: "Invalid code", description: e.message || "Please try again", variant: "destructive" });
    } finally {
      setEnabling(false);
    }
  };

  const isActive = (path: string) => currentPath === path;
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive 
      ? "bg-primary text-primary-foreground font-medium shadow-sm" 
      : "hover:bg-accent hover:text-accent-foreground text-sidebar-foreground transition-colors";

  return (
    <Sidebar className={collapsed ? "w-16" : "w-60"} collapsible="icon">
      <SidebarContent>
        <div className="p-3 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-6 h-6 p-0"
                onClick={handleToggleSidebar}
                title={collapsed ? "Expand sidebar" : ""}
              >
                <div className="w-6 h-6 bg-primary rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-3 h-3 text-primary-foreground" />
                </div>
              </Button>
              {!collapsed && (
                <div>
                  <h2 className="text-lg font-semibold">Finance Tracker</h2>
                </div>
              )}
            </div>
            {!collapsed && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-xs"
                onClick={handleToggleSidebar}
                title="Collapse sidebar"
              >
                ←
              </Button>
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
        <div className="p-2 space-y-2">
          {user && !collapsed && (
            <div className="text-sm text-muted-foreground truncate px-1">
              {user.email}
            </div>
          )}
          {user && !collapsed && (
            <Dialog open={open2fa} onOpenChange={(o) => { setOpen2fa(o); if (o) startSetup2FA(); }}>
              <DialogTrigger asChild>
                <Button variant="secondary" className="w-full justify-start text-xs">
                  {user && (user as any).totp_enabled ? "2FA: On" : "Enable 2FA"}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Enable Two-Factor Authentication</DialogTitle>
                  <DialogDescription>
                    Scan the QR or enter the secret in your authenticator app, then enter a code to confirm.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-3">
                  {qrCodeDataUrl && (
                    <div className="flex justify-center">
                      <img src={qrCodeDataUrl} alt="QR Code" className="w-48 h-48" />
                    </div>
                  )}
                  {secret && (
                    <div className="text-sm break-all p-2 rounded bg-muted">
                      Manual entry secret: {secret}
                    </div>
                  )}
                  <Input
                    placeholder="6-digit code"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    inputMode="numeric"
                    pattern="[0-9]{6}"
                  />
                </div>
                <DialogFooter>
                  <Button onClick={confirmEnable2FA} disabled={enabling || !code}>
                    {enabling ? "Enabling..." : "Confirm"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
          <Button 
            variant="outline" 
            className={collapsed ? "w-6 h-6 p-0 mx-auto" : "w-full justify-start"} 
            onClick={handleSignOut}
            title="Sign Out"
          >
            <LogOut className="h-3 w-3" />
            {!collapsed && <span className="ml-2">Sign Out</span>}
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}