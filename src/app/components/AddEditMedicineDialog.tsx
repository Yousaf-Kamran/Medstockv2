import { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { Medicine, DoseTime } from '../hooks/useMedicineStore';

interface AddEditMedicineDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (medicine: Omit<Medicine, 'id' | 'createdAt' | 'notificationSent'>) => void;
  medicine?: Medicine | null;
}

export function AddEditMedicineDialog({ isOpen, onClose, onSave, medicine }: AddEditMedicineDialogProps) {
  const [name, setName] = useState('');
  const [currentStock, setCurrentStock] = useState('');
  const [pillsPerDose, setPillsPerDose] = useState('1');
  const [lowStockThreshold, setLowStockThreshold] = useState('10');
  const [doseTimes, setDoseTimes] = useState<DoseTime[]>([
    { id: Date.now().toString(), time: '08:00', taken: false, lastTakenDate: null }
  ]);

  useEffect(() => {
    if (medicine) {
      setName(medicine.name);
      setCurrentStock(medicine.currentStock.toString());
      setPillsPerDose(medicine.pillsPerDose.toString());
      setLowStockThreshold(medicine.lowStockThreshold.toString());
      setDoseTimes(medicine.dosesPerDay);
    } else {
      resetForm();
    }
  }, [medicine, isOpen]);

  const resetForm = () => {
    setName('');
    setCurrentStock('');
    setPillsPerDose('1');
    setLowStockThreshold('10');
    setDoseTimes([
      { id: Date.now().toString(), time: '08:00', taken: false, lastTakenDate: null }
    ]);
  };

  const addDoseTime = () => {
    setDoseTimes([
      ...doseTimes,
      { id: Date.now().toString(), time: '12:00', taken: false, lastTakenDate: null }
    ]);
  };

  const removeDoseTime = (id: string) => {
    if (doseTimes.length > 1) {
      setDoseTimes(doseTimes.filter(dose => dose.id !== id));
    }
  };

  const updateDoseTime = (id: string, time: string) => {
    setDoseTimes(doseTimes.map(dose => 
      dose.id === id ? { ...dose, time } : dose
    ));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !currentStock || !pillsPerDose) {
      return;
    }

    const medicineData = {
      name: name.trim(),
      currentStock: parseInt(currentStock),
      pillsPerDose: parseInt(pillsPerDose),
      lowStockThreshold: parseInt(lowStockThreshold),
      dosesPerDay: doseTimes.sort((a, b) => a.time.localeCompare(b.time))
    };

    onSave(medicineData);
    onClose();
    resetForm();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
            {medicine ? 'Edit Medicine' : 'Add New Medicine'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Medicine Name */}
          <div>
            <label htmlFor="medicine-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Medicine Name *
            </label>
            <input
              id="medicine-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 dark:focus:ring-teal-400 focus:border-transparent outline-none"
              placeholder="e.g., Aspirin"
              required
            />
          </div>

          {/* Current Stock */}
          <div>
            <label htmlFor="current-stock" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Current Stock (pills) *
            </label>
            <input
              id="current-stock"
              type="number"
              min="0"
              value={currentStock}
              onChange={(e) => setCurrentStock(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 dark:focus:ring-teal-400 focus:border-transparent outline-none"
              placeholder="e.g., 30"
              required
            />
          </div>

          {/* Pills Per Dose */}
          <div>
            <label htmlFor="pills-per-dose" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Pills Per Dose *
            </label>
            <input
              id="pills-per-dose"
              type="number"
              min="1"
              value={pillsPerDose}
              onChange={(e) => setPillsPerDose(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 dark:focus:ring-teal-400 focus:border-transparent outline-none"
              placeholder="e.g., 1"
              required
            />
          </div>

          {/* Low Stock Threshold */}
          <div>
            <label htmlFor="low-stock" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Low Stock Alert Threshold (pills) *
            </label>
            <input
              id="low-stock"
              type="number"
              min="0"
              value={lowStockThreshold}
              onChange={(e) => setLowStockThreshold(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 dark:focus:ring-teal-400 focus:border-transparent outline-none"
              placeholder="e.g., 10"
              required
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              You'll be notified when stock reaches this level
            </p>
          </div>

          {/* Dose Times */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Daily Dose Times *
              </label>
              <button
                type="button"
                onClick={addDoseTime}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 hover:bg-teal-200 dark:hover:bg-teal-900/50 transition-colors text-sm"
              >
                <Plus className="w-4 h-4" />
                Add Time
              </button>
            </div>
            <div className="space-y-2">
              {doseTimes.map((dose, index) => (
                <div key={dose.id} className="flex items-center gap-2">
                  <input
                    type="time"
                    value={dose.time}
                    onChange={(e) => updateDoseTime(dose.id, e.target.value)}
                    className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 dark:focus:ring-teal-400 focus:border-transparent outline-none"
                    required
                  />
                  {doseTimes.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeDoseTime(dose.id)}
                      className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                      aria-label="Remove dose time"
                    >
                      <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Stock will automatically decrease at these times each day
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 rounded-lg bg-teal-600 text-white hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600 transition-colors font-medium"
            >
              {medicine ? 'Update Medicine' : 'Add Medicine'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}