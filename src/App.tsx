import { useState } from 'react';
import { useAuthStore } from '@/src/lib/store';
import { Sidebar } from '@/components/Sidebar';
import { Dashboard } from '@/components/Dashboard';
import { Patients } from '@/components/Patients';
import { Appointments } from '@/components/Appointments';
import { Clinical } from '@/components/Clinical';
import { Billing } from '@/components/Billing';
import { Login } from '@/components/Login';
import { Toaster } from '@/components/ui/sonner';

export default function App() {
  const { user, token } = useAuthStore();
  const [currentTab, setCurrentTab] = useState('dashboard');

  if (!token || !user) {
    return (
      <>
        <Login />
        <Toaster position="top-right" />
      </>
    );
  }

  const renderContent = () => {
    switch (currentTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'patients':
        return <Patients />;
      case 'appointments':
        return <Appointments />;
      case 'clinical':
        return <Clinical />;
      case 'billing':
        return <Billing />;
      default:
        return (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <h2 className="text-2xl font-bold">Module Under Construction</h2>
            <p className="text-muted-foreground">The {currentTab} module is coming soon.</p>
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar currentTab={currentTab} setTab={setCurrentTab} />
      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-6xl mx-auto">
          {renderContent()}
        </div>
      </main>
      <Toaster position="top-right" />
    </div>
  );
}
