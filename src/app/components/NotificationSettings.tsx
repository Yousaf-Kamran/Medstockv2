import { Bell, BellOff, Info } from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';

export function NotificationSettings() {
  const {
    isSupported,
    isSubscribed,
    permission,
    subscribeToPush,
    unsubscribeFromPush,
    sendTestNotification,
  } = useNotifications();

  if (!isSupported) {
    return (
      <div className="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
        <div className="flex gap-3">
          <Info className="w-5 h-5 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-yellow-800 dark:text-yellow-200 font-medium mb-1">
              Push notifications not supported
            </p>
            <p className="text-xs text-yellow-700 dark:text-yellow-300">
              Your browser doesn't support background push notifications. You'll only receive alerts when the app is open.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="p-4 rounded-lg bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-teal-600 dark:text-teal-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-teal-800 dark:text-teal-200 font-medium mb-2">
              Enable Background Notifications
            </p>
            <p className="text-xs text-teal-700 dark:text-teal-300 mb-3">
              Get medication reminders even when the app is closed. We'll notify you when it's time to take your medicine and when stock is running low.
            </p>
            
            {permission === 'denied' && (
              <div className="mb-3 p-3 rounded bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800">
                <p className="text-xs text-red-800 dark:text-red-200">
                  ⚠️ Notifications are blocked. Please enable them in your browser settings and refresh the page.
                </p>
              </div>
            )}
            
            <div className="flex flex-wrap gap-2">
              {!isSubscribed ? (
                <button
                  onClick={subscribeToPush}
                  disabled={permission === 'denied'}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-600 text-white hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                >
                  <Bell className="w-4 h-4" />
                  Enable Push Notifications
                </button>
              ) : (
                <>
                  <button
                    onClick={unsubscribeFromPush}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-600 text-white hover:bg-gray-700 dark:bg-gray-500 dark:hover:bg-gray-600 transition-colors text-sm"
                  >
                    <BellOff className="w-4 h-4" />
                    Disable Push Notifications
                  </button>
                  <button
                    onClick={sendTestNotification}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg border border-teal-300 dark:border-teal-700 text-teal-700 dark:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-900/30 transition-colors text-sm"
                  >
                    Send Test Notification
                  </button>
                </>
              )}
            </div>
            
            {isSubscribed && (
              <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-3 flex items-center gap-1">
                <Bell className="w-3.5 h-3.5" />
                Push notifications are active
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}