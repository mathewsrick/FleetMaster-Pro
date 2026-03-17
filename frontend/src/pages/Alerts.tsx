import React, { useState, useEffect } from 'react';
import { db } from '@/services/db';
import { Vehicle } from '@/types/types';
import Swal from 'sweetalert2';

const Alerts: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');

  const alertTypeLabels: Record<string, string> = {
    soat: 'SOAT',
    tecno: 'Tecnomecánica',
    fullCoverage: 'Seguro Todo Riesgo',
    license: 'Licencia de Conducción',
    oilChange: 'Cambio de Aceite',
    tireChange: 'Cambio de Llantas'
  };

  const alertTypeIcons: Record<string, string> = {
    soat: 'fa-file-contract',
    tecno: 'fa-wrench',
    fullCoverage: 'fa-shield-halved',
    license: 'fa-id-card',
    oilChange: 'fa-oil-can',
    tireChange: 'fa-circle-dot'
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [vehiclesRes, alertsRes] = await Promise.all([
        db.getVehicles(1, 1000),
        db.getUserAlerts()
      ]);
      setVehicles(vehiclesRes.data);
      setAlerts(alertsRes);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAlert = async (vehicleId: string, alertType: string, currentEnabled: boolean) => {
    try {
      await db.upsertAlert(vehicleId, alertType, { 
        isEnabled: !currentEnabled,
        frequencyDays: 30
      });
      await loadData();
      Swal.fire({
        icon: 'success',
        title: 'Alerta actualizada',
        showConfirmButton: false,
        timer: 1500
      });
    } catch (err) {
      Swal.fire('Error', 'No se pudo actualizar la alerta', 'error');
    }
  };

  const handleUpdateFrequency = async (vehicleId: string, alertType: string, frequencyDays: number) => {
    try {
      await db.upsertAlert(vehicleId, alertType, {
        isEnabled: true,
        frequencyDays
      });
      await loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredAlerts = selectedVehicleId 
    ? alerts.filter((a: any) => a.vehicleId === selectedVehicleId)
    : alerts;

  const groupedAlerts = filteredAlerts.reduce((acc: any, alert: any) => {
    if (!acc[alert.vehicleId]) {
      acc[alert.vehicleId] = [];
    }
    acc[alert.vehicleId].push(alert);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Alertas de Vehículos</h1>
          <p className="text-slate-500 text-sm font-medium">Configura las notificaciones para cada vehículo</p>
        </div>
        
        <select
          value={selectedVehicleId}
          onChange={(e) => setSelectedVehicleId(e.target.value)}
          className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-bold shadow-sm"
        >
          <option value="">Todos los vehículos</option>
          {vehicles.map(v => (
            <option key={v.id} value={v.id}>{v.licensePlate} — {v.model}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <i className="fa-solid fa-spinner fa-spin text-4xl text-indigo-600"></i>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedAlerts).map(([vehicleId, vehicleAlertsList]: [string, any]) => {
            const vehicle = vehicles.find(v => v.id === vehicleId);
            if (!vehicle) return null;

            return (
              <div key={vehicleId} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 sm:p-6">
                  <h2 className="text-xl font-black text-white flex items-center gap-3">
                    <i className="fa-solid fa-car"></i>
                    {vehicle.licensePlate}
                    <span className="text-sm font-medium opacity-80">— {vehicle.model}</span>
                  </h2>
                </div>

                <div className="p-4 sm:p-6 space-y-4">
                  {vehicleAlertsList.length === 0 ? (
                    <p className="text-center py-8 text-slate-400 italic">No hay alertas configuradas</p>
                  ) : (
                    vehicleAlertsList.map((alert: any) => (
                      <div key={alert.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="flex items-center gap-4 flex-1">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${alert.isEnabled ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-200 text-slate-400'}`}>
                            <i className={`fa-solid ${alertTypeIcons[alert.alertType]} text-xl`}></i>
                          </div>
                          
                          <div className="flex-1">
                            <h3 className="font-black text-slate-800">{alertTypeLabels[alert.alertType]}</h3>
                            <p className="text-xs text-slate-500 font-medium">
                              {alert.isEnabled ? `Notificar ${alert.frequencyDays} días antes` : 'Desactivada'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 w-full sm:w-auto">
                          {alert.isEnabled && (
                            <select
                              value={alert.frequencyDays}
                              onChange={(e) => handleUpdateFrequency(vehicleId, alert.alertType, Number(e.target.value))}
                              className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                              <option value={7}>7 días antes</option>
                              <option value={15}>15 días antes</option>
                              <option value={30}>30 días antes</option>
                              <option value={60}>60 días antes</option>
                            </select>
                          )}

                          <button
                            onClick={() => handleToggleAlert(vehicleId, alert.alertType, alert.isEnabled)}
                            className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${
                              alert.isEnabled
                                ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                                : 'bg-slate-200 text-slate-500 hover:bg-slate-300'
                            }`}
                          >
                            {alert.isEnabled ? 'Activada' : 'Desactivada'}
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}

          {Object.keys(groupedAlerts).length === 0 && (
            <div className="text-center py-20 text-slate-400">
              <i className="fa-solid fa-bell-slash text-5xl mb-4 opacity-20"></i>
              <p className="font-bold">No hay alertas configuradas aún</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Alerts;
