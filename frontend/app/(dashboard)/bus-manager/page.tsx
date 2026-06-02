'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import KpiCard from '@/components/ui/KpiCard';
import StatusBadge from '@/components/ui/StatusBadge';

interface Bus {
  id: string;
  busNumber: string;
  busType: string;
  capacity: number;
  driverId: string | null;
  driverName: string | null;
}

interface BusRoute {
  id: string;
  busNumber: string;
  routeName: string;
  driverName: string | null;
  startTime: string;
  endTime: string;
  routeDate: string;
}

interface Driver {
  id: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  isActive: boolean;
}

export default function BusManagerPage() {
  const [buses, setBuses] = useState<Bus[]>([]);
  const [routes, setRoutes] = useState<BusRoute[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [showRouteModal, setShowRouteModal] = useState(false);
  const [showDriverModal, setShowDriverModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [selectedDate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [busesRes, routesRes, driversRes] = await Promise.all([
        fetch('/api/v1/buses'),
        fetch(`/api/v1/routes?date=${selectedDate}`),
        fetch('/api/v1/drivers/active'),
      ]);

      if (busesRes.ok) setBuses(await busesRes.json());
      if (routesRes.ok) setRoutes(await routesRes.json());
      if (driversRes.ok) setDrivers(await driversRes.json());
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const activeRoutesCount = routes.length;
  const busesInUse = buses.filter(b => b.driverId).length;
  const availableBuses = buses.length - busesInUse;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Usar Bus Manager</h1>
        <p className="text-gray-600">Управление автопарком и рейсами</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KpiCard
          title="Всего автобусов"
          value={buses.length.toString()}
          subtitle={`${buses.filter(b => b.busType === 'BUS').length} стандартных`}
        />
        <KpiCard
          title="В пути"
          value={activeRoutesCount.toString()}
          subtitle="рейсов сегодня"
        />
        <KpiCard
          title="Водители"
          value={drivers.length.toString()}
          subtitle="активные"
        />
        <KpiCard
          title="Свободно"
          value={availableBuses.toString()}
          subtitle="автобусов"
        />
      </div>

      {/* Date Picker and Controls */}
      <div className="flex gap-4 items-center">
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg"
        />
        <button
          onClick={() => setShowRouteModal(true)}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          + Новый рейс
        </button>
        <button
          onClick={() => setShowDriverModal(true)}
          className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          + Новый водитель
        </button>
      </div>

      {/* Routes Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b">
          <h2 className="text-xl font-semibold">Рейсы на {selectedDate}</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold">Номер</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Рейс</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Водитель</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Время</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Статус</th>
              </tr>
            </thead>
            <tbody>
              {routes.map((route) => (
                <tr key={route.id} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-3 font-medium">{route.busNumber}</td>
                  <td className="px-6 py-3">{route.routeName}</td>
                  <td className="px-6 py-3">{route.driverName || 'Не назначен'}</td>
                  <td className="px-6 py-3 text-sm text-gray-600">
                    {route.startTime} - {route.endTime}
                  </td>
                  <td className="px-6 py-3">
                    <StatusBadge status="active" />
                  </td>
                </tr>
              ))}
              {routes.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                    Нет рейсов на эту дату
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Buses Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b">
          <h2 className="text-xl font-semibold">Автопарк</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold">Номер</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Тип</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Вместимость</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Водитель</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Статус</th>
              </tr>
            </thead>
            <tbody>
              {buses.map((bus) => (
                <tr key={bus.id} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-3 font-medium">{bus.busNumber}</td>
                  <td className="px-6 py-3 text-sm">
                    {bus.busType === 'BUS' ? '🚌 Автобус' : '🚐 Микроавтобус'}
                  </td>
                  <td className="px-6 py-3 text-sm">{bus.capacity} мест</td>
                  <td className="px-6 py-3 text-sm">{bus.driverName || 'Не назначен'}</td>
                  <td className="px-6 py-3">
                    <StatusBadge status={bus.driverId ? 'active' : 'inactive'} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Route Modal */}
      {showRouteModal && (
        <RouteModal onClose={() => setShowRouteModal(false)} onRefresh={fetchData} buses={buses} drivers={drivers} selectedDate={selectedDate} />
      )}

      {/* Driver Modal */}
      {showDriverModal && <DriverModal onClose={() => setShowDriverModal(false)} onRefresh={fetchData} />}
    </div>
  );
}

function RouteModal({ onClose, onRefresh, buses, drivers, selectedDate }: any) {
  const [formData, setFormData] = useState({
    busId: '',
    routeName: '',
    driverId: '',
    startTime: '09:00',
    endTime: '18:00',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/v1/routes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          routeDate: selectedDate,
        }),
      });
      if (response.ok) {
        onRefresh();
        onClose();
      }
    } catch (error) {
      console.error('Error creating route:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-2xl font-bold mb-4">Новый рейс</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Автобус</label>
            <select
              value={formData.busId}
              onChange={(e) => setFormData({ ...formData, busId: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
              required
            >
              <option value="">Выберите автобус</option>
              {buses.map((bus: Bus) => (
                <option key={bus.id} value={bus.id}>
                  {bus.busNumber} ({bus.busType})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Название рейса</label>
            <input
              type="text"
              value={formData.routeName}
              onChange={(e) => setFormData({ ...formData, routeName: e.target.value })}
              placeholder="например: Тур в горы"
              className="w-full px-3 py-2 border rounded-lg"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Водитель</label>
            <select
              value={formData.driverId}
              onChange={(e) => setFormData({ ...formData, driverId: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="">Не назначен</option>
              {drivers.map((driver: Driver) => (
                <option key={driver.id} value={driver.id}>
                  {driver.firstName} {driver.lastName}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Начало</label>
              <input
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Конец</label>
              <input
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                required
              />
            </div>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50">
              Отмена
            </button>
            <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Создать
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DriverModal({ onClose, onRefresh }: any) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/v1/drivers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (response.ok) {
        onRefresh();
        onClose();
      }
    } catch (error) {
      console.error('Error creating driver:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-2xl font-bold mb-4">Новый водитель</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Имя</label>
            <input
              type="text"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Фамилия</label>
            <input
              type="text"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Телефон</label>
            <input
              type="tel"
              value={formData.phoneNumber}
              onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50">
              Отмена
            </button>
            <button type="submit" className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
              Создать
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
