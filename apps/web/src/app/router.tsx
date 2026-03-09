import { Navigate, Route, Routes } from 'react-router-dom';
import { Shell } from '../components/shell';
import { useAuth } from './state/auth-state';
import { LoginPage } from '../features/auth/login-page';
import { AssistantPage } from '../features/assistant/page';
import { CalendarPage } from '../features/calendar/page';
import { DashboardPage } from '../features/dashboard/page';
import { DocumentsPage } from '../features/documents/page';
import { EvolutionPage } from '../features/evolution/page';
import { PatientsPage } from '../features/patients/page';
import { PortalAccessPage } from '../features/portal/access-page';
import { PortalPage } from '../features/portal/page';
import { RecordsPage } from '../features/records/page';
import { SettingsPage } from '../features/settings/page';

function ProtectedLayout() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div className="grid min-h-screen place-items-center bg-mesh text-sm text-slate-500">Carregando sessão...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Shell />;
}

export function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/portal/acesso" element={<PortalAccessPage />} />
      <Route element={<ProtectedLayout />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/agenda" element={<CalendarPage />} />
        <Route path="/evolucao" element={<EvolutionPage />} />
        <Route path="/pacientes" element={<PatientsPage />} />
        <Route path="/documentos" element={<DocumentsPage />} />
        <Route path="/sigilo" element={<RecordsPage />} />
        <Route path="/assistente" element={<AssistantPage />} />
        <Route path="/configuracoes" element={<SettingsPage />} />
        <Route path="/portal" element={<PortalPage />} />
      </Route>
    </Routes>
  );
}
