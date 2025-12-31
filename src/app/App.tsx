import { useState } from 'react';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'sonner';
import { Plus, Pill, Settings } from 'lucide-react';
import { useMedicineStore, Medicine } from './hooks/useMedicineStore';
import { MedicineCard } from './components/MedicineCard';
import { AddEditMedicineDialog } from './components/AddEditMedicineDialog';
import { ThemeToggle } from './components/ThemeToggle';
import { NotificationSettings } from './components/NotificationSettings';

function AppContent() {
  const { medicines, addMedicine, updateMedicine, deleteMedicine, calculateRunOutDate, isLoading } = useMedicineStore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState<Medicine | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  const handleSave = (medicineData: Omit<Medicine, 'id' | 'createdAt' | 'notificationSent'>) => {
    if (editingMedicine) {
      updateMedicine(editingMedicine.id, medicineData);
      setEditingMedicine(null);
    } else {
      addMedicine(medicineData);
    }
  };

  const handleEdit = (medicine: Medicine) => {
    setEditingMedicine(medicine);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingMedicine(null);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this medicine?')) {
      deleteMedicine(id);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <Toaster position="top-right" richColors />
      
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-teal-100 dark:bg-teal-900/30">
                <Pill className="w-6 h-6 text-teal-600 dark:text-teal-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  MedStock
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Track your medicine inventory
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="Settings"
              >
                <Settings className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
              <ThemeToggle />
              <button
                onClick={() => {
                  setEditingMedicine(null);
                  setIsDialogOpen(true);
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-600 text-white hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600 transition-colors font-medium shadow-sm"
              >
                <Plus className="w-5 h-5" />
                <span className="hidden sm:inline">Add Medicine</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Notification Settings */}
        {showSettings && (
          <div className="mb-6">
            <NotificationSettings />
          </div>
        )}

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 dark:border-teal-400 mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading medicines...</p>
          </div>
        ) : medicines.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="p-6 rounded-full bg-gray-100 dark:bg-gray-800 mb-6">
              <Pill className="w-16 h-16 text-gray-400 dark:text-gray-600" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
              No medicines yet
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6 text-center max-w-md">
              Start tracking your medicine inventory by adding your first medicine.
              Set up automatic stock tracking and get notified when supplies run low.
            </p>
            <button
              onClick={() => {
                setEditingMedicine(null);
                setIsDialogOpen(true);
              }}
              className="flex items-center gap-2 px-6 py-3 rounded-lg bg-teal-600 text-white hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600 transition-colors font-medium shadow-sm"
            >
              <Plus className="w-5 h-5" />
              Add Your First Medicine
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {medicines.map(medicine => (
              <MedicineCard
                key={medicine.id}
                medicine={medicine}
                runOutDate={calculateRunOutDate(medicine)}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </main>

      {/* Dialog */}
      <AddEditMedicineDialog
        isOpen={isDialogOpen}
        onClose={handleCloseDialog}
        onSave={handleSave}
        medicine={editingMedicine}
      />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <AppContent />
    </ThemeProvider>
  );
}