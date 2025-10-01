// Message Handler Utility - Handles Extension Context Invalidation
class MessageHandler {
  constructor() {
    this.isContextValid = true;
    this.messageQueue = [];
    this.retryAttempts = 3;
    this.retryDelay = 1000;

    // Check context validity periodically
    this.checkContextValidity();
  }

  checkContextValidity() {
    try {
      // Test if chrome.runtime is accessible
      if (chrome.runtime?.id) {
        this.isContextValid = true;
      }
    } catch (error) {
      this.isContextValid = false;
      console.warn('Extension context invalidated - extension may have been reloaded');
    }

    // Check every 5 seconds
    setTimeout(() => this.checkContextValidity(), 5000);
  }

  async sendMessageSafe(message, options = {}) {
    const {
      timeout = 10000,
      retries = this.retryAttempts,
      onError = null
    } = options;

    // Check context before sending
    if (!this.isContextValid) {
      const error = new Error('Extension context is invalid. Please reload the page.');
      if (onError) onError(error);
      throw error;
    }

    let lastError = null;

    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        // Wrap in promise with timeout
        const result = await Promise.race([
          this.sendMessage(message),
          this.timeoutPromise(timeout)
        ]);

        return result;
      } catch (error) {
        lastError = error;

        // Check if error is due to context invalidation
        if (this.isContextInvalidatedError(error)) {
          this.isContextValid = false;
          throw new Error('Extension was reloaded. Please refresh the page to continue.');
        }

        // Check if error is connection issue
        if (this.isConnectionError(error)) {
          console.warn(`Message attempt ${attempt + 1} failed, retrying...`, error.message);

          if (attempt < retries - 1) {
            await this.delay(this.retryDelay * (attempt + 1));
            continue;
          }
        }

        throw error;
      }
    }

    throw lastError || new Error('Message sending failed after retries');
  }

  sendMessage(message) {
    return new Promise((resolve, reject) => {
      try {
        chrome.runtime.sendMessage(message, (response) => {
          const error = chrome.runtime.lastError;

          if (error) {
            reject(new Error(error.message || 'Unknown error'));
          } else if (response?.error) {
            reject(new Error(response.error));
          } else {
            resolve(response);
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  isContextInvalidatedError(error) {
    const errorMessage = error?.message?.toLowerCase() || '';
    return (
      errorMessage.includes('extension context invalidated') ||
      errorMessage.includes('context invalidated') ||
      errorMessage.includes('cannot access') && errorMessage.includes('runtime')
    );
  }

  isConnectionError(error) {
    const errorMessage = error?.message?.toLowerCase() || '';
    return (
      errorMessage.includes('could not establish connection') ||
      errorMessage.includes('receiving end does not exist') ||
      errorMessage.includes('message port closed')
    );
  }

  timeoutPromise(ms) {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Message timeout')), ms);
    });
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Queue messages for later processing if context is invalid
  queueMessage(message, callback) {
    this.messageQueue.push({ message, callback, timestamp: Date.now() });

    // Clean old messages (older than 5 minutes)
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    this.messageQueue = this.messageQueue.filter(item => item.timestamp > fiveMinutesAgo);
  }

  // Process queued messages when context becomes valid
  async processQueue() {
    if (!this.isContextValid || this.messageQueue.length === 0) return;

    const queue = [...this.messageQueue];
    this.messageQueue = [];

    for (const item of queue) {
      try {
        const result = await this.sendMessageSafe(item.message);
        if (item.callback) item.callback(result);
      } catch (error) {
        console.error('Failed to process queued message:', error);
      }
    }
  }

  // Show user-friendly error notification
  showContextInvalidatedError() {
    const notification = document.createElement('div');
    notification.className = 'autojobr-notification error';
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #ef4444;
      color: white;
      padding: 16px 20px;
      border-radius: 12px;
      font-size: 14px;
      font-weight: 500;
      box-shadow: 0 8px 25px rgba(239, 68, 68, 0.3);
      z-index: 10002;
      max-width: 320px;
      animation: slideInRight 0.3s ease-out;
    `;

    notification.innerHTML = `
      <div style="display: flex; align-items: center; gap: 12px;">
        <div style="font-size: 24px;">⚠️</div>
        <div>
          <div style="font-weight: 600; margin-bottom: 4px;">Extension Reloaded</div>
          <div style="font-size: 12px; opacity: 0.9;">Please refresh this page to continue using AutoJobr</div>
          <button onclick="location.reload()" style="
            margin-top: 8px;
            padding: 6px 12px;
            background: white;
            color: #ef4444;
            border: none;
            border-radius: 6px;
            font-size: 12px;
            font-weight: 600;
            cursor: pointer;
          ">Refresh Now</button>
        </div>
      </div>
    `;

    document.body.appendChild(notification);

    // Remove after 10 seconds
    setTimeout(() => notification.remove(), 10000);
  }
}

// Export as singleton
if (typeof window !== 'undefined') {
  window.AutoJobrMessageHandler = new MessageHandler();
}
