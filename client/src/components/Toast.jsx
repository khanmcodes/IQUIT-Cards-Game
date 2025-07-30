import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const Toast = ({ message, type = 'info', onClose, duration = 3000 }) => {
  React.useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const getToastStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-neon-green/90 text-white border-neon-green';
      case 'error':
        return 'bg-neon-red/90 text-white border-neon-red';
      case 'warning':
        return 'bg-neon-orange/90 text-white border-neon-orange';
      case 'info':
      default:
        return 'bg-neon-blue/90 text-white border-neon-blue';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'info':
      default:
        return 'ℹ️';
    }
  };

  return (
    <motion.div
      className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-xl border shadow-lg backdrop-blur-sm ${getToastStyles()}`}
      initial={{ x: 100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 100, opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center space-x-3">
        <span className="text-lg">{getIcon()}</span>
        <span className="font-semibold">{message}</span>
        <button
          onClick={onClose}
          className="ml-2 text-white/60 hover:text-white"
        >
          ×
        </button>
      </div>
    </motion.div>
  );
};

// Toast Container
export const ToastContainer = ({ toasts, removeToast }) => {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      <AnimatePresence>
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={() => removeToast(toast.id)}
            duration={toast.duration}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};

export default Toast; 