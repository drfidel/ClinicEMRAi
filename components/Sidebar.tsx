import React from 'react';
import { LucideIcon, LayoutDashboard, Users, Calendar, Stethoscope, FlaskConical, Pill, Receipt, BarChart3, Settings, LogOut, Camera, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/src/lib/store';
import { Button } from '@/components/ui/button';

interface SidebarItemProps {
  icon: any;
  label: string;
  active?: boolean;
  onClick?: () => void;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ icon: Icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    className={cn(
      "flex items-center w-full gap-3 px-4 py-2.5 text-sm transition-all duration-200 rounded-lg group relative",
      active 
        ? "bg-primary text-primary-foreground font-bold shadow-sm" 
        : "text-muted-foreground font-medium hover:bg-accent hover:text-accent-foreground"
    )}
  >
    {active && (
      <div className="absolute left-0 w-1 h-6 bg-primary-foreground rounded-r-full" />
    )}
    <div className="flex items-center justify-center w-5 h-5 shrink-0">
      <Icon className={cn("w-5 h-5 transition-transform", active ? "scale-110" : "group-hover:scale-110")} />
    </div>
    <span className="truncate">{label}</span>
  </button>
);

export const Sidebar = ({ currentTab, setTab }: { currentTab: string, setTab: (tab: string) => void }) => {
  const { user, logout } = useAuthStore();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST'] },
    { id: 'patients', label: 'Patients', icon: Users, roles: ['ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST'] },
    { id: 'appointments', label: 'Appointments', icon: Calendar, roles: ['ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST'] },
    { id: 'clinical', label: 'Clinical', icon: Stethoscope, roles: ['ADMIN', 'DOCTOR', 'NURSE'] },
    { id: 'lab', label: 'Laboratory', icon: FlaskConical, roles: ['ADMIN', 'LAB_TECH', 'DOCTOR'] },
    { id: 'imaging', label: 'Imaging', icon: Camera, roles: ['ADMIN', 'LAB_TECH', 'DOCTOR'] },
    { id: 'pharmacy', label: 'Pharmacy', icon: Pill, roles: ['ADMIN', 'PHARMACIST', 'DOCTOR'] },
    { id: 'billing', label: 'Billing', icon: Receipt, roles: ['ADMIN', 'RECEPTIONIST'] },
    { id: 'reports', label: 'Reports', icon: BarChart3, roles: ['ADMIN'] },
    { id: 'audit', label: 'Audit Trail', icon: ShieldAlert, roles: ['ADMIN'] },
  ];

  const filteredItems = menuItems.filter(item => user && item.roles.includes(user.role));

  return (
    <div className="flex flex-col h-screen border-r bg-card w-64">
      <div className="p-6">
        <h1 className="text-xl font-bold text-primary tracking-tight">ClinicEMR</h1>
        <p className="text-xs text-muted-foreground">Uganda Health Center</p>
      </div>

      <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
        {filteredItems.map((item) => (
          <SidebarItem
            key={item.id}
            icon={item.icon}
            label={item.label}
            active={currentTab === item.id}
            onClick={() => setTab(item.id)}
          />
        ))}
      </nav>

      <div className="p-4 mt-auto border-t">
        <div className="flex items-center gap-3 mb-4 px-2">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
            {user?.fullName.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.fullName}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.role}</p>
          </div>
        </div>
        <Button 
          variant="ghost" 
          className="w-full justify-start gap-3 px-4 py-2.5 text-sm font-medium text-destructive hover:text-destructive hover:bg-destructive/10 transition-all duration-200 group"
          onClick={logout}
        >
          <div className="flex items-center justify-center w-5 h-5 shrink-0">
            <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform" />
          </div>
          Logout
        </Button>
      </div>
    </div>
  );
};
