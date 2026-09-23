import React, { useState, useEffect } from 'react';
import { Bell, BellRing, X } from 'lucide-react';
import axios from 'axios';

// Utility to convert VAPID public key
const urlBase64ToUint8Array = (base64String) => {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

const PushNotificationSetup = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState('default');
  const [loading, setLoading] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
      setPermission(Notification.permission);
      
      const isDismissed = localStorage.getItem('pushPromptDismissed');
      if (isDismissed === 'true') {
        setDismissed(true);
      }
    }
  }, []);

  const requestPermission = async () => {
    setLoading(true);
    try {
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result === 'granted') {
        subscribeUser();
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error('Error asking for permission', error);
      setLoading(false);
    }
  };

  const subscribeUser = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      
      // Get the VAPID Public Key from environment variables (vite)
      const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY || 'BEDPnifWUmOclkCOi7KMfgLwErEOMUCpcdgmyYeVREZHZxikehoVTfcgJmTPn7NKn3h2p8l6PckQuRkaAYA4dtw';
      const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey
      });

      // Send to backend
      const token = sessionStorage.getItem('access_token');
      await axios.post(
        `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/push/subscribe/`,
        { subscription: subscription.toJSON() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      console.log('Successfully subscribed to push notifications');
    } catch (err) {
      console.error('Failed to subscribe the user: ', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('pushPromptDismissed', 'true');
  };

  if (!isSupported || dismissed) {
    return null;
  }

  // If permission is already granted, show a test button
  if (permission === 'granted') {
    return (
      <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full bg-white/80 backdrop-blur-xl border border-emerald-100 rounded-2xl shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] p-5 overflow-hidden transition-all duration-500 transform hover:-translate-y-1">
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-500 rounded-full mix-blend-multiply filter blur-2xl opacity-20 animate-blob"></div>
        
        <button 
          onClick={handleDismiss}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X size={16} />
        </button>

        <div className="flex items-start gap-4 relative z-10">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-gradient-to-tr from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center shadow-inner shadow-emerald-300">
              <Bell className="text-white" size={24} />
            </div>
          </div>
          
          <div className="flex-1 pt-1">
            <h3 className="text-gray-900 font-semibold text-sm mb-1 tracking-tight">Push Notifications Active</h3>
            <p className="text-gray-500 text-xs mb-3 leading-relaxed">
              You're all set to receive notifications.
            </p>
            
            <button
              onClick={async () => {
                setLoading(true);
                try {
                  const token = sessionStorage.getItem('access_token');
                  await axios.post(
                    `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/push/test/`,
                    {},
                    { headers: { Authorization: `Bearer ${token}` } }
                  );
                } catch (e) {
                  console.error(e);
                } finally {
                  setLoading(false);
                }
              }}
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs px-4 py-2.5 rounded-lg transition-all duration-300 shadow-sm disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? 'Sending...' : 'Send Test Notification'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full bg-white/80 backdrop-blur-xl border border-indigo-100 rounded-2xl shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] p-5 overflow-hidden transition-all duration-500 transform hover:-translate-y-1">
      {/* Decorative background blur */}
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-500 rounded-full mix-blend-multiply filter blur-2xl opacity-20 animate-blob"></div>
      
      <button 
        onClick={handleDismiss}
        className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors"
      >
        <X size={16} />
      </button>

      <div className="flex items-start gap-4 relative z-10">
        <div className="flex-shrink-0">
          <div className="w-12 h-12 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center shadow-inner shadow-indigo-300">
            {loading ? (
              <BellRing className="text-white animate-pulse" size={24} />
            ) : (
              <Bell className="text-white animate-bounce" size={24} />
            )}
          </div>
        </div>
        
        <div className="flex-1 pt-1">
          <h3 className="text-gray-900 font-semibold text-sm mb-1 tracking-tight">Stay Updated Instantly</h3>
          <p className="text-gray-500 text-xs mb-3 leading-relaxed">
            Get premium native notifications on your device whenever an amount is requested.
          </p>
          
          <button
            onClick={requestPermission}
            disabled={loading}
            className="w-full bg-gray-900 hover:bg-indigo-600 text-white font-medium text-xs px-4 py-2.5 rounded-lg transition-all duration-300 shadow-sm disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
  );
};

export default PushNotificationSetup;
