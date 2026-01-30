import React from 'react';
import { Link } from 'react-router-dom';

const Planes: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto py-12 px-6">
      <h1 className="text-2xl font-bold mb-4">Planes & Precios</h1>
      <p className="mb-6 text-slate-700">Elige el plan que mejor se adapte al tamaño y necesidades de tu flota.</p>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="bg-white p-6 rounded-lg shadow text-center">
          <h3 className="font-semibold mb-2">Básico</h3>
          <p className="text-3xl font-bold mb-4">€29</p>
          <p className="text-sm text-slate-600 mb-4">Por mes - hasta 10 vehículos</p>
          <ul className="text-sm text-slate-700 mb-4 space-y-1">
            <li>• Gestión de vehículos</li>
            <li>• Registro de gastos</li>
            <li>• Reportes básicos</li>
          </ul>
          <Link to="/contacto" className="px-4 py-2 bg-indigo-600 text-white rounded">Contactar</Link>
        </div>

        <div className="bg-white p-6 rounded-lg shadow text-center">
          <h3 className="font-semibold mb-2">Pro</h3>
          <p className="text-3xl font-bold mb-4">€79</p>
          <p className="text-sm text-slate-600 mb-4">Por mes - hasta 50 vehículos</p>
          <ul className="text-sm text-slate-700 mb-4 space-y-1">
            <li>• Todo de Básico</li>
            <li>• Gestión de conductores</li>
            <li>• Cobros y pagos</li>
          </ul>
          <Link to="/contacto" className="px-4 py-2 bg-indigo-600 text-white rounded">Contactar</Link>
        </div>

        <div className="bg-white p-6 rounded-lg shadow text-center">
          <h3 className="font-semibold mb-2">Enterprise</h3>
          <p className="text-3xl font-bold mb-4">A medida</p>
          <p className="text-sm text-slate-600 mb-4">Soporte avanzado y personalización</p>
          <ul className="text-sm text-slate-700 mb-4 space-y-1">
            <li>• Integraciones</li>
            <li>• Reportes y paneles personalizados</li>
            <li>• SLA y soporte dedicado</li>
          </ul>
          <Link to="/contacto" className="px-4 py-2 bg-indigo-600 text-white rounded">Hablar con Ventas</Link>
        </div>
      </div>
    </div>
  );
};

export default Planes;
