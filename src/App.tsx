import { Component, type ReactNode } from 'react';
import { HashRouter, Link, MemoryRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Compass, RotateCcw, TriangleAlert } from 'lucide-react';
import { AppProvider, useApp } from './store/AppContext';
import { Layout } from './components/Layout';
import { Button, EmptyState, ToastProvider, btnClass } from './components/ui';
import { Login } from './pages/Login';
import { Home } from './pages/Home';
import { VideoList } from './pages/VideoList';
import { VideoDetail } from './pages/VideoDetail';
import { FichaList } from './pages/FichaList';
import { FichaDetail } from './pages/FichaDetail';
import { FeedbackPage } from './pages/Feedback';
import { Avaliacao } from './pages/Avaliacao';
import { Progresso } from './pages/Progresso';
import { ProgressoDetail } from './pages/ProgressoDetail';

class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="mx-auto max-w-lg p-6 pt-24">
        <EmptyState icon={TriangleAlert} title="Esta tela não abriu como esperado"
          action={<Button icon={RotateCcw} onClick={() => window.location.reload()}>Recarregar</Button>}>
          Seus registros continuam salvos neste navegador. Recarregue para voltar ao No Ponto.
        </EmptyState>
      </div>
    );
  }
}

const Private = ({ children }: { children: ReactNode }) => {
  const { user } = useApp();
  return user ? <>{children}</> : <Navigate to="/login" replace />;
};

const NotFound = () => (
  <EmptyState icon={Compass} title="Não encontramos esta página"
    action={<Link to="/inicio" className={btnClass()}>Voltar para o início</Link>}>
    O endereço pode ter mudado. Comece pelos pratos da casa.
  </EmptyState>
);

const AppRoutes = () => (
  <Routes>
    <Route path="/login" element={<Login />} />
    <Route element={<Private><Layout /></Private>}>
      <Route index element={<Navigate to="/inicio" replace />} />
      <Route path="/inicio" element={<Home />} />
      <Route path="/videos" element={<VideoList />} />
      <Route path="/videos/:dishId" element={<VideoDetail />} />
      <Route path="/fichas" element={<FichaList />} />
      <Route path="/fichas/:dishId" element={<FichaDetail />} />
      <Route path="/feedback" element={<FeedbackPage />} />
      <Route path="/avaliacao" element={<Avaliacao />} />
      <Route path="/progresso" element={<Progresso />} />
      <Route path="/progresso/:employeeId" element={<ProgressoDetail />} />
      <Route path="*" element={<NotFound />} />
    </Route>
  </Routes>
);

// Dentro do visualizador de Artifacts o endereço não pode mudar; lá a rota fica em memória.
const Router = import.meta.env.VITE_ROUTER === 'memory' ? MemoryRouter : HashRouter;

export const App = () => (
  <ErrorBoundary>
    <AppProvider>
      <ToastProvider>
        <Router>
          <AppRoutes />
        </Router>
      </ToastProvider>
    </AppProvider>
  </ErrorBoundary>
);
