import { Pill, Clock, Calendar, AlertTriangle, Pencil, Trash2 } from 'lucide-react';
import { Medicine } from '../hooks/useMedicineStore';
import { format } from 'date-fns';

interface MedicineCardProps {
  medicine: Medicine;
  runOutDate: Date | null;
  onEdit: (medicine: Medicine) => void;
  onDelete: (id: string) => void;
}

export function MedicineCard({ medicine, runOutDate, onEdit, onDelete }: MedicineCardProps) {
  const stockPercentage = (medicine.currentStock / (medicine.currentStock + 50)) * 100;
  const isLowStock = medicine.currentStock <= medicine.lowStockThreshold;
  const isOutOfStock = medicine.currentStock <= 0;

  return (
    <div className={`rounded-xl border p-6 transition-all hover:shadow-lg ${
      isOutOfStock 
        ? 'border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/20' 
        : isLowStock 
        ? 'border-orange-300 dark:border-orange-800 bg-orange-50 dark:bg-orange-950/20'
        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
    }`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-lg ${
            isOutOfStock 
              ? 'bg-red-100 dark:bg-red-900/30' 
              : isLowStock 
              ? 'bg-orange-100 dark:bg-orange-900/30'
              : 'bg-teal-100 dark:bg-teal-900/30'
          }`}>
            <Pill className={`w-6 h-6 ${
              isOutOfStock 
                ? 'text-red-600 dark:text-red-400' 
                : isLowStock 
                ? 'text-orange-600 dark:text-orange-400'
                : 'text-teal-600 dark:text-teal-400'
            }`} />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              {medicine.name}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {medicine.pillsPerDose} pill{medicine.pillsPerDose > 1 ? 's' : ''} per dose
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onEdit(medicine)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Edit medicine"
          >
            <Pencil className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </button>
          <button
            onClick={() => onDelete(medicine.id)}
            className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
            aria-label="Delete medicine"
          >
            <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
          </button>
        </div>
      </div>

      {/* Stock Display */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">Current Stock</span>
          <span className={`font-semibold ${
            isOutOfStock 
              ? 'text-red-600 dark:text-red-400' 
              : isLowStock 
              ? 'text-orange-600 dark:text-orange-400'
              : 'text-green-600 dark:text-green-400'
          }`}>
            {medicine.currentStock} pills
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all ${
              isOutOfStock 
                ? 'bg-red-600 dark:bg-red-500' 
                : isLowStock 
                ? 'bg-orange-500 dark:bg-orange-400'
                : 'bg-teal-500 dark:bg-teal-400'
            }`}
            style={{ width: `${Math.min(stockPercentage, 100)}%` }}
          />
        </div>
      </div>

      {/* Low Stock Warning */}
      {isLowStock && !isOutOfStock && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-orange-100 dark:bg-orange-900/30 mb-4">
          <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0" />
          <p className="text-sm text-orange-800 dark:text-orange-300">
            Low stock! Please refill soon.
          </p>
        </div>
      )}

      {/* Out of Stock Warning */}
      {isOutOfStock && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-100 dark:bg-red-900/30 mb-4">
          <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
          <p className="text-sm text-red-800 dark:text-red-300">
            Out of stock! Please refill immediately.
          </p>
        </div>
      )}

      {/* Run Out Date */}
      {runOutDate && !isOutOfStock && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-gray-100 dark:bg-gray-700/50 mb-4">
          <Calendar className="w-5 h-5 text-gray-600 dark:text-gray-400 flex-shrink-0" />
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Estimated run out:</p>
            <p className="font-medium text-gray-900 dark:text-white">
              {format(runOutDate, 'MMM dd, yyyy')} at{' '}
              {medicine.dosesPerDay.length > 0 && medicine.dosesPerDay[0].time}
            </p>
          </div>
        </div>
      )}

      {/* Dose Schedule */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Clock className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Daily Schedule ({medicine.dosesPerDay.length} dose{medicine.dosesPerDay.length > 1 ? 's' : ''})
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {medicine.dosesPerDay.map(dose => {
            const now = new Date();
            const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
            const currentDate = now.toISOString().split('T')[0];
            const isTakenToday = dose.lastTakenDate === currentDate;
            
            return (
              <div
                key={dose.id}
                className={`px-3 py-2 rounded-lg text-center text-sm transition-colors ${
                  isTakenToday
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-300 dark:border-green-700'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600'
                }`}
              >
                {dose.time}
                {isTakenToday && (
                  <span className="block text-xs mt-0.5">Taken</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}