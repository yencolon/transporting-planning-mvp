import { Navigate, Route, Routes } from 'react-router-dom';
import { Empty } from './components/StatusMessage';
import { RouteDetailPage } from './routes/routes/RouteDetailPage';
import { RouteFormPage } from './routes/routes/RouteFormPage';
import { RoutesListPage } from './routes/routes/RoutesListPage';

export default function App() {
  return (
    <main className="mx-auto max-w-4xl px-5 pt-8 pb-16">
      <Routes>
        <Route path="/" element={<Navigate to="/routes" replace />} />
        <Route path="/routes" element={<RoutesListPage />} />
        <Route path="/routes/new" element={<RouteFormPage />} />
        <Route path="/routes/:id" element={<RouteDetailPage />} />
        <Route path="/routes/:id/edit" element={<RouteFormPage />} />
        <Route path="*" element={<Empty>Página no encontrada.</Empty>} />
      </Routes>
    </main>
  );
}
