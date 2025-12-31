import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { projectId, publicAnonKey } from '../../../utils/supabase/info';

export interface DoseTime {
  id: string;
  time: string; // HH:MM format
  taken: boolean;
  lastTakenDate: string | null;
}

export interface Medicine {
  id: string;
  name: string;
  currentStock: number;
  dosesPerDay: DoseTime[];
  pillsPerDose: number;
  createdAt: string;
  lowStockThreshold: number;
  notificationSent: boolean;
}

const STORAGE_KEY = 'medstock_medicines';
const LAST_CHECK_KEY = 'medstock_last_check';
const API_URL = `https://${projectId}.supabase.co/functions/v1/make-server-56eb46ed`;

export function useMedicineStore() {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const [isLoading, setIsLoading] = useState(true);

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
      if (Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
          setNotificationPermission(permission);
        });
      }
    }
  }, []);

  // Load medicines from Supabase
  useEffect(() => {
    const loadMedicines = async () => {
      try {
        const response = await fetch(`${API_URL}/medicines`, {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch medicines');
        }
        
        const data = await response.json();
        setMedicines(data.medicines || []);
      } catch (error) {
        console.error('Error loading medicines from server:', error);
        // Fallback to localStorage
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          setMedicines(JSON.parse(stored));
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    loadMedicines();
  }, []);

  // Save medicines to localStorage as backup
  useEffect(() => {
    if (!isLoading && medicines.length >= 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(medicines));
    }
  }, [medicines, isLoading]);

  // Check for missed doses and decrement stock
  useEffect(() => {
    if (isLoading) return;

    const checkDoses = async () => {
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      const currentDate = now.toISOString().split('T')[0];
      
      const lastCheck = localStorage.getItem(LAST_CHECK_KEY) || currentTime;
      
      let updated = false;
      const updatedMedicines: Medicine[] = [];
      
      for (const medicine of medicines) {
        let medicineUpdated = false;
        const updatedDoses = medicine.dosesPerDay.map(dose => {
          // Check if dose time has passed and hasn't been taken today
          if (dose.time <= currentTime && dose.lastTakenDate !== currentDate) {
            // Check if this dose wasn't already processed
            if (dose.time > lastCheck || dose.lastTakenDate !== currentDate) {
              medicineUpdated = true;
              return {
                ...dose,
                taken: true,
                lastTakenDate: currentDate
              };
            }
          }
          return dose;
        });

        if (medicineUpdated) {
          updated = true;
          const newStock = Math.max(0, medicine.currentStock - medicine.pillsPerDose);
          
          // Check if stock is low
          const shouldNotify = newStock <= medicine.lowStockThreshold && !medicine.notificationSent;
          
          if (shouldNotify) {
            toast.error(`Low stock alert: ${medicine.name} is running low!`, {
              duration: 5000,
            });
            
            // Send browser notification
            if (notificationPermission === 'granted') {
              new Notification('MedStock Alert', {
                body: `${medicine.name} is running low. Current stock: ${newStock} pills.`,
                icon: '/favicon.ico',
              });
            }
            
            // Send push notification to all subscribers
            try {
              await fetch(`${API_URL}/send-notification`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${publicAnonKey}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  title: 'MedStock Alert',
                  body: `${medicine.name} is running low. Current stock: ${newStock} pills.`,
                  tag: `low-stock-${medicine.id}`,
                }),
              });
            } catch (error) {
              console.error('Error sending push notification:', error);
            }
          }
          
          updatedMedicines.push({
            ...medicine,
            currentStock: newStock,
            dosesPerDay: updatedDoses,
            notificationSent: shouldNotify ? true : medicine.notificationSent
          });
        } else {
          updatedMedicines.push(medicine);
        }
      }

      if (updated) {
        localStorage.setItem(LAST_CHECK_KEY, currentTime);
        setMedicines(updatedMedicines);
        
        // Sync to server
        try {
          await fetch(`${API_URL}/medicines/batch-update`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${publicAnonKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ medicines: updatedMedicines }),
          });
        } catch (error) {
          console.error('Error syncing medicines to server:', error);
        }
      }
    };

    // Check immediately
    checkDoses();

    // Check every minute
    const interval = setInterval(checkDoses, 60000);

    return () => clearInterval(interval);
  }, [medicines, notificationPermission, isLoading]);

  const addMedicine = async (medicine: Omit<Medicine, 'id' | 'createdAt' | 'notificationSent'>) => {
    try {
      const response = await fetch(`${API_URL}/medicines`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(medicine),
      });
      
      if (!response.ok) {
        throw new Error('Failed to add medicine');
      }
      
      const data = await response.json();
      setMedicines(prev => [...prev, data.medicine]);
      toast.success('Medicine added successfully!');
    } catch (error) {
      console.error('Error adding medicine:', error);
      toast.error('Failed to add medicine. Please try again.');
    }
  };

  const updateMedicine = async (id: string, updates: Partial<Medicine>) => {
    try {
      const response = await fetch(`${API_URL}/medicines/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update medicine');
      }
      
      const data = await response.json();
      setMedicines(prev =>
        prev.map(med => med.id === id ? data.medicine : med)
      );
      toast.success('Medicine updated successfully!');
    } catch (error) {
      console.error('Error updating medicine:', error);
      toast.error('Failed to update medicine. Please try again.');
    }
  };

  const deleteMedicine = async (id: string) => {
    try {
      const response = await fetch(`${API_URL}/medicines/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete medicine');
      }
      
      setMedicines(prev => prev.filter(med => med.id !== id));
      toast.success('Medicine deleted successfully!');
    } catch (error) {
      console.error('Error deleting medicine:', error);
      toast.error('Failed to delete medicine. Please try again.');
    }
  };

  const calculateRunOutDate = (medicine: Medicine): Date | null => {
    if (medicine.currentStock <= 0) return null;
    
    const totalPillsPerDay = medicine.dosesPerDay.length * medicine.pillsPerDose;
    if (totalPillsPerDay === 0) return null;
    
    const daysRemaining = Math.floor(medicine.currentStock / totalPillsPerDay);
    const runOutDate = new Date();
    runOutDate.setDate(runOutDate.getDate() + daysRemaining);
    
    return runOutDate;
  };

  return {
    medicines,
    addMedicine,
    updateMedicine,
    deleteMedicine,
    calculateRunOutDate,
    isLoading,
  };
}