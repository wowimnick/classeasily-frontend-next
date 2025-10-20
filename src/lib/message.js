// lib/message.js

// Module-level message API that can be used anywhere
let messageHandlers = null;

// Set handlers from the provider
export const setMessageHandlers = (handlers) => {
  messageHandlers = handlers;
};

// Create a proxy object that can be used directly
const message = {
  success: (content, duration, onClose) => {
    if (!messageHandlers) {
      console.warn('Toast system not initialized yet');
      return () => {};
    }
    return messageHandlers.success(content, duration, onClose);
  },
  error: (content, duration, onClose) => {
    if (!messageHandlers) {
      console.warn('Toast system not initialized yet');
      return () => {};
    }
    return messageHandlers.error(content, duration, onClose);
  },
  info: (content, duration, onClose) => {
    if (!messageHandlers) {
      console.warn('Toast system not initialized yet');
      return () => {};
    }
    return messageHandlers.info(content, duration, onClose);
  },
  warning: (content, duration, onClose) => {
    if (!messageHandlers) {
      console.warn('Toast system not initialized yet');
      return () => {};
    }
    return messageHandlers.warning(content, duration, onClose);
  },
  loading: (content, duration = 0, onClose) => {
    if (!messageHandlers) {
      console.warn('Toast system not initialized yet');
      return () => {};
    }
    return messageHandlers.loading(content, duration, onClose);
  },
  open: (config) => {
    if (!messageHandlers) {
      console.warn('Toast system not initialized yet');
      return () => {};
    }
    return messageHandlers.open(config);
  },
  destroy: (key) => {
    if (messageHandlers) {
      messageHandlers.destroy(key);
    }
  },
};

export default message;

// Also export useToast for components that prefer the hook pattern
export { useToast } from './toast/ToastContext';