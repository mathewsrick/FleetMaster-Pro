import React from 'react';
import { Link } from 'react-router-dom';

const Landing: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto py-16 px-6">
      <header className="text-center mb-12">
        <div className="inline-flex items-center gap-3 bg-indigo-600 text-white px-3 py-2 rounded-md">
          <i className="fa-solid fa-truck-fast"></i>
          <h1 className="text-2xl font-bold">FleetMaster — Administración de Flotas</h1>
        </div>
        <p className="mt-4 text-slate-600">Solución para gestionar vehículos, conductores, pagos y reportes en una sola plataforma.</p>
      </header>

      <section className="grid gap-8 md:grid-cols-2 mb-12">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-3">Qué maneja FleetMaster</h2>
          <ul className="space-y-2 text-slate-700">
            <li>• Gestión de Vehículos: mantenimiento, estado y kilometraje.</li>
            <li>• Conductores: asignaciones, licencias y rendimiento.</li>
            <li>• Pagos y Cobros: registrar y conciliar pagos.</li>
            <li>• Gastos: control y categorización de gastos operativos.</li>
            <li>• Morosidad (Arrears): seguimiento y recordatorios.</li>
            <li>• Suscripciones y Planes: facturación y renovación.</li>
            <li>• Reportes: métricas para optimizar la flota.</li>
          </ul>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-3">Beneficios para tu empresa</h2>
          <ul className="space-y-2 text-slate-700">
            <li>• Centraliza toda la información de la flota en un solo lugar.</li>
            <li>• Reduce costos y tiempos con mejores rutas y mantenimiento.</li>
            <li>• Mejora la gestión de cobros y flujo de caja.</li>
            <li>• Control y rendimiento de conductores para mayor seguridad.</li>
            <li>• Reportes accionables para decisiones operativas rápidas.</li>
          </ul>
        </div>
      </section>

      <section className="bg-white p-6 rounded-lg shadow mb-12">
        <h2 className="text-xl font-semibold mb-4">Empezar</h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link to="/planes" className="px-4 py-3 bg-indigo-600 text-white rounded-md text-center">Planes & Precios</Link>
          <Link to="/contacto" className="px-4 py-3 border border-indigo-600 text-indigo-600 rounded-md text-center">Contactanos</Link>
          <Link to="/login" className="px-4 py-3 bg-slate-100 text-slate-800 rounded-md text-center">Iniciar Sesión</Link>
        </div>
      </section>

      <footer className="text-sm text-slate-500 text-center">
        <p>FleetMaster — Administración de flotas. Optimiza operaciones y reduce costos.</p>
      </footer>
    </div>
  );
};

export default Landing;
