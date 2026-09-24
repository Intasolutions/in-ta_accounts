import React, { useState, useEffect } from 'react';
import { Bell, BellRing, X } from 'lucide-react';
import api from '../api';

const urlBase64ToUint8Array = (base64String) => {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) { outputArray[i] = rawData.charCodeAt(i); }
  return outputArray;
};

const styles = `
.push-setup-container {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 9999;
  max-width: 380px;
  width: calc(100% - 48px);
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(226, 232, 240, 0.8);
  border-radius: 16px;
  box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.15);
  padding: 20px;
  overflow: hidden;
  transition: all 0.5s ease;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes slideUp {
  0% { transform: translateY(100px); opacity: 0; }
  100% { transform: translateY(0); opacity: 1; }
}

.push-setup-container:hover {
  transform: translateY(-4px);
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}

.push-bg-blob {
  position: absolute;
  top: -40px;
  right: -40px;
  width: 128px;
  height: 128px;
  border-radius: 50%;
  mix-blend-mode: multiply;
  filter: blur(24px);
  opacity: 0.15;
}
.blob-indigo { background-color: #6366f1; }
.blob-emerald { background-color: #10b981; }

.push-close-btn {
  position: absolute;
  top: 12px;
  right: 12px;
  color: #94a3b8;
  background: transparent;
  border: none;
  cursor: pointer;
  transition: color 0.2s;
  padding: 4px;
}
.push-close-btn:hover { color: #475569; }

.push-content {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  position: relative;
  z-index: 10;
}

.push-icon-container {
  flex-shrink: 0;
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: inset 0 2px 4px rgba(255,255,255,0.3);
}
.icon-indigo { background: linear-gradient(135deg, #6366f1, #a855f7); }
.icon-emerald { background: linear-gradient(135deg, #10b981, #14b8a6); }

.push-text-content {
  flex: 1;
  padding-top: 4px;
}

.push-title {
  color: #0f172a;
  font-weight: 600;
  font-size: 14px;
  margin: 0 0 4px 0;
  letter-spacing: -0.02em;
}

.push-desc {
  color: #64748b;
  font-size: 13px;
  margin: 0 0 16px 0;
  line-height: 1.5;
}

.push-action-btn {
  width: 100%;
  color: white;
  font-weight: 500;
  font-size: 13px;
  padding: 10px 16px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}
.btn-indigo { background-color: #0f172a; }
.btn-indigo:hover { background-color: #4f46e5; }
.btn-emerald { background-color: #059669; }
.btn-emerald:hover { background-color: #047857; }
.push-action-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

/* Spinner */
.push-spinner {
  animation: spin 1s linear infinite;
  height: 16px;
  width: 16px;
  color: white;
}
@keyframes spin { 100% { transform: rotate(360deg); } }
`;

const PushNotificationSetup = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState('default');
  const [loading, setLoading] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
      const currentPermission = Notification.permission;
      setPermission(currentPermission);
      const isDismissed = localStorage.getItem('pushPromptDismissed');
      if (isDismissed === 'true') {
        setDismissed(true);
      }
      
      // If permission is already granted but they don't have a sub in the backend, sync it silently
      if (currentPermission === 'granted') {
        subscribeUser(true);
      }
    }
  }, []);

  const requestPermission = async () => {
    setLoading(true);
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result === 'granted') {
        await subscribeUser(false);
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error('Error asking for permission', error);
      setLoading(false);
    }
  };

  const subscribeUser = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY || 'BEDPnifWUmOclkCOi7KMfgLwErEOMUCpcdgmyYeVREZHZxikehoVTfcgJmTPn7NKn3h2p8l6PckQuRkaAYA4dtw';
      const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);

      let subscription;
      try {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedVapidKey
        });
      } catch (err) {
        // If a subscription with a different key exists, unsubscribe and try again
        console.warn("Subscribe failed, trying to clear old subscription...", err);
        const oldSubscription = await registration.pushManager.getSubscription();
        if (oldSubscription) {
          await oldSubscription.unsubscribe();
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: convertedVapidKey
          });
        } else {
          throw err;
        }
      }

      await api.post('push/subscribe/', { subscription: subscription.toJSON() });
      console.log('Successfully subscribed to push notifications');
    } catch (err) {
      console.error('Failed to subscribe the user: ', err);
      if (!silent) {
        alert("Failed to subscribe browser to push service: " + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('pushPromptDismissed', 'true');
  };

  if (!isSupported) {
    return (
      <>
        <style>{styles}</style>
        <div className="push-setup-container">
          <div className="push-bg-blob blob-indigo"></div>
          <button onClick={handleDismiss} className="push-close-btn">
            <X size={16} />
          </button>
          <div className="push-content">
            <div className="push-text-content">
              <h3 className="push-title">Push Notifications Not Supported</h3>
              <p className="push-desc">
                Your current browser or device does not support Web Push. 
                <br/><br/>
                <b>iPhone/iPad Users:</b> You must update to iOS 16.4+ and use the "Add to Home Screen" feature in Safari, then open the app from your Home Screen to enable notifications.
              </p>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (dismissed) return null;

  if (permission === 'granted') {
    return (
      <>
        <style>{styles}</style>
        <div className="push-setup-container">
          <div className="push-bg-blob blob-emerald"></div>
          <button onClick={handleDismiss} className="push-close-btn">
            <X size={16} />
          </button>
          <div className="push-content">
            <div className="push-icon-container icon-emerald">
              <Bell className="text-white" size={24} color="white" />
            </div>
            <div className="push-text-content">
              <h3 className="push-title">Push Notifications Active</h3>
              <p className="push-desc">You're all set to receive notifications.</p>
              <button
                onClick={async () => {
                  setLoading(true);
                  try {
                    await api.post('push/test/', {});
                    alert("Test Notification Sent Successfully!");
                  } catch (e) {
                    console.error(e);
                    if (e.response && e.response.data && e.response.data.details) {
                      alert("Backend Push Error: " + JSON.stringify(e.response.data.details, null, 2));
                    } else {
                      alert("Error sending push: " + e.message);
                    }
                  } finally {
                    setLoading(false);
                  }
                }}
                disabled={loading}
                className="push-action-btn btn-emerald"
              >
                {loading ? 'Sending...' : 'Send Test Notification'}
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{styles}</style>
      <div className="push-setup-container">
        <div className="push-bg-blob blob-indigo"></div>
        <button onClick={handleDismiss} className="push-close-btn">
          <X size={16} />
        </button>
        <div className="push-content">
          <div className="push-icon-container icon-indigo">
            {loading ? <BellRing size={24} color="white" /> : <Bell size={24} color="white" />}
          </div>
          <div className="push-text-content">
            <h3 className="push-title">Stay Updated Instantly</h3>
            <p className="push-desc">Get premium native notifications on your device whenever an amount is requested.</p>
            <button onClick={requestPermission} disabled={loading} className="push-action-btn btn-indigo">
              {loading ? (
                <>
                  <svg className="push-spinner" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Enabling...
                </>
              ) : (
                'Enable Push Notifications'
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default PushNotificationSetup;
