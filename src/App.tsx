import { useState } from 'react';
import { useAuthStore } from '@/src/lib/store';
import { Sidebar } from '@/components/Sidebar';
import { Dashboard } from '@/components/Dashboard';
import { Patients } from '@/components/Patients';
import { Appointments } from '@/components/Appointments';
import { Clinical } from '@/components/Clinical';
import { Laboratory } from '@/components/Laboratory';
import { Imaging } from '@/components/Imaging';
import { Pharmacy } from '@/components/Pharmacy';
import { Billing } from '@/components/Billing';
import { Reports } from '@/components/Reports';
import { Finance } from '@/components/Finance';
import { UserAdmin } from '@/components/UserAdmin';
import { AuditLogs } from '@/components/AuditLogs';
import { Login } from '@/components/Login';
import { Toaster } from '@/components/ui/sonner';

export default function App() {
  const { user, token } = useAuthStore();
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [targetPatientId, setTargetPatientId] = useState<string | null>(null);

  const navigateToPatientChart = (patientId: string) => {
    setTargetPatientId(patientId);
    setCurrentTab('patients');
  };

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
        return <Patients initialPatientId={targetPatientId} onClearInitialPatient={() => setTargetPatientId(null)} />;
      case 'appointments':
        return <Appointments onViewChart={navigateToPatientChart} />;
      case 'clinical':
        return <Clinical />;
      case 'lab':
        return <Laboratory />;
      case 'imaging':
        return <Imaging />;
      case 'pharmacy':
        return <Pharmacy />;
      case 'billing':
        return <Billing />;
      case 'reports':
        return <Reports />;
      case 'finance':
        return <Finance />;
      case 'users':
        return <UserAdmin />;
      case 'audit':
        return <AuditLogs />;
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
