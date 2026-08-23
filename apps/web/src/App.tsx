import { Navigate, Route, Routes } from "react-router-dom";
import { Sidebar } from "./components/Sidebar";
import { Empty } from "./components/StatusMessage";
import { RouteDetailPage } from "./routes/routes/RouteDetailPage";
import { RouteFormPage } from "./routes/routes/RouteFormPage";
import { RoutesListPage } from "./routes/routes/RoutesListPage";
import { UnitsPage } from "./routes/units/UnitsPage";

export default function App() {
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <Sidebar />
      <main className="min-w-0 flex-1 px-5 py-8 sm:px-8 md:py-10 lg:px-12">
        <div className="mx-auto w-full max-w-5xl">
          <Routes>
            <Route path="/" element={<Navigate to="/routes" replace />} />
            <Route path="/routes" element={<RoutesListPage />} />
            <Route path="/routes/new" element={<RouteFormPage />} />
            <Route path="/routes/:id" element={<RouteDetailPage />} />
            <Route path="/routes/:id/edit" element={<RouteFormPage />} />
            <Route path="/units" element={<UnitsPage />} />
            <Route path="*" element={<Empty>Página no encontrada.</Empty>} />
          </Routes>
        </div>
      </main>
    </div>
  );
}
