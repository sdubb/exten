// Content Script Fixes - Inject these fixes into content-script.js

// Fix 1: Add message handler at the top of the class
// Add this after line 18 in content-script.js constructor:
const messageHandlerInit = `
    this.messageHandler = window.AutoJobrMessageHandler || new MessageHandler();
    this.contextInvalidated = false;
`;

// Fix 2: Replace all chrome.runtime.sendMessage calls with safe wrapper
// Replace the getUserProfile method (around line 2767)
const getUserProfileFixed = `
  async getUserProfile() {
    try {
      // Return cached profile if valid (less than 5 minutes old)
      if (this.cachedProfile && (Date.now() - this.cachedProfile.timestamp < 300000)) {
        return this.cachedProfile.data;
      }

      // Use safe message handler
      const result = await this.messageHandler.sendMessageSafe({
        action: 'getUserProfile'
      }, {
        timeout: 10000,
        retries: 2,
        onError: (error) => {
          if (this.messageHandler.isContextInvalidatedError(error)) {
            this.contextInvalidated = true;
            this.messageHandler.showContextInvalidatedError();
          }
        }
      });

      if (result?.profile) {
        // Cache the profile
        this.cachedProfile = {
          data: result.profile,
          timestamp: Date.now()
        };
        return result.profile;
      }

      return null;
    } catch (error) {
      console.error('Get user profile error:', error);

      // Show user-friendly error if context is invalidated
      if (this.contextInvalidated) {
        return null;
      }

      throw error;
    }
  }
`;

// Fix 3: Fix the startSmartAutofill method to handle errors gracefully
const startSmartAutofillFixed = `
  async startSmartAutofill(userProfile) {
    if (this.fillInProgress) {
      return { success: false, error: 'Auto-fill already in progress' };
    }

    // Check if context is invalidated
    if (this.contextInvalidated) {
      this.messageHandler.showContextInvalidatedError();
      return { success: false, error: 'Extension context invalidated - please refresh page' };
    }

    // Prevent infinite loops by tracking attempts
    this.autoFillAttempts = (this.autoFillAttempts || 0) + 1;
    if (this.autoFillAttempts > 3) {
      console.log('Max auto-fill attempts reached, stopping to prevent loops');
      setTimeout(() => { this.autoFillAttempts = 0; }, 5000); // Reset after 5 seconds
      return { success: false, error: 'Max auto-fill attempts reached' };
    }

    this.fillInProgress = true;

    console.log('AutoJobr Extension - Starting smart auto-fill with profile:', {
      skills: userProfile?.skills?.length || 0,
      workExperience: userProfile?.workExperience?.length || 0,
      education: userProfile?.education?.length || 0
    });

    try {
      // Get settings with fallbacks
      let settings = { smartFillMode: true, autoSubmitMode: false };
      try {
        settings = await chrome.storage.sync.get(['smartFillMode', 'autoSubmitMode']);
        if (settings.smartFillMode === undefined) settings.smartFillMode = true;
        if (settings.autoSubmitMode === undefined) settings.autoSubmitMode = false;
      } catch (error) {
        console.warn('Failed to load settings, using defaults:', error);
      }

      const smartMode = settings.smartFillMode !== false;
      const autoSubmit = settings.autoSubmitMode === true;

      // Rest of the method continues...
      // (keep existing implementation)

    } catch (error) {
      console.error('Smart auto-fill error:', error);

      if (this.messageHandler.isContextInvalidatedError(error)) {
        this.contextInvalidated = true;
        this.messageHandler.showContextInvalidatedError();
      }

      return {
        success: false,
        error: error.message || 'Auto-fill failed'
      };
    } finally {
      this.fillInProgress = false;
    }
  }
`;

// Fix 4: Add debouncing to prevent duplicate job detection
const detectJobPostingFixed = `
  async detectJobPosting() {
    // Debounce to prevent duplicate calls
    const currentUrl = window.location.href;
    const now = Date.now();

    if (this.lastDetectionUrl === currentUrl && (now - this.lastDetectionTime) < 3000) {
      console.log('Skipping duplicate job detection (debounced)');
      return { success: true, jobData: this.lastDetectedJob };
    }

    this.lastDetectionUrl = currentUrl;
    this.lastDetectionTime = now;

    try {
      const jobData = await this.extractJobDetails();

      if (jobData?.success && jobData?.jobData) {
        this.lastDetectedJob = jobData.jobData;
        this.currentJobData = jobData.jobData;

        console.log('✅ Job detected:', {
          title: jobData.jobData.title,
          company: jobData.jobData.company
        });

        return { success: true, jobData: jobData.jobData };
      }

      return { success: false, error: 'No job data found' };
    } catch (error) {
      console.error('Job detection failed:', error);
      return { success: false, error: error.message };
    }
  }
`;

// Fix 5: Safe message sending wrapper for analyzeJob
const analyzeCurrentJobFixed = `
  async analyzeCurrentJob() {
    if (this.analysisInProgress) {
      console.log('Analysis already in progress, skipping...');
      return { success: false, error: 'Analysis in progress' };
    }

    if (this.contextInvalidated) {
      return { success: false, error: 'Extension context invalidated' };
    }

    try {
      this.analysisInProgress = true;

      // Extract job data if not already available
      if (!this.currentJobData) {
        const extraction = await this.detectJobPosting();
        if (!extraction?.success) {
          return { success: false, error: 'Failed to extract job data' };
        }
      }

      const jobData = {
        jobData: this.currentJobData
      };

      // Send to background for analysis using safe handler
      const result = await this.messageHandler.sendMessageSafe({
        action: 'analyzeJob',
        data: jobData
      }, {
        timeout: 15000,
        retries: 1,
        onError: (error) => {
          if (this.messageHandler.isContextInvalidatedError(error)) {
            this.contextInvalidated = true;
          }
        }
      });

      if (result?.success && result?.analysis) {
        console.log('✅ Job analysis completed:', {
          matchScore: result.analysis.matchScore,
          recommendation: result.analysis.recommendation
        });

        return {
          success: true,
          analysis: result.analysis,
          jobData: this.currentJobData
        };
      }

      return { success: false, error: result?.error || 'Analysis failed' };

    } catch (error) {
      console.error('Job analysis error:', error);
      return { success: false, error: error.message };
    } finally {
      this.analysisInProgress = false;
    }
  }
`;

// Export fixes for manual application
console.log('Content Script Fixes Ready');
console.log('Apply these fixes to content-script.js to resolve:');
console.log('1. Extension context invalidation errors');
console.log('2. Connection errors during message passing');
console.log('3. Duplicate job detection');
console.log('4. Auto-fill loop prevention');
