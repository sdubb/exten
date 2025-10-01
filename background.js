// Enhanced AutoJobr Background Service Worker
console.log('🚀 AutoJobr background service worker v2.0 loading...');

class AutoJobrBackground {
  constructor() {
    this.apiUrl = 'https://autojobr.com';
    this.cache = new Map();
    this.rateLimiter = new Map();
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.detectApiUrl();
    this.setupPeriodicTasks();
    console.log('🚀 AutoJobr background service worker v2.0 initialized');
  }

  async detectApiUrl() {
    // Use only production URL
    const url = 'https://autojobr.com';

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(`${url}/api/health`, { 
        method: 'GET',
        mode: 'cors',
        credentials: 'include',
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        if (data.status === 'ok' || data.message) {
          this.apiUrl = url;
          console.log('✅ Connected to AutoJobr server:', this.apiUrl);
          
          // Update stored API URL
          await chrome.storage.sync.set({ apiUrl: this.apiUrl });
          
          // Notify content scripts of successful connection
          chrome.tabs.query({}, (tabs) => {
            tabs.forEach(tab => {
              if (tab.id) {
                chrome.tabs.sendMessage(tab.id, {
                  action: 'apiConnected',
                  apiUrl: this.apiUrl
                }).catch(() => {}); // Ignore errors for tabs without content script
              }
            });
          });
        }
      }
    } catch (error) {
      console.log(`Failed to connect to ${url}:`, error.message);
      console.log('Extension will work in offline mode');
    }
  }

  setupEventListeners() {
    // Handle extension install/update
    chrome.runtime.onInstalled.addListener((details) => {
      if (details.reason === 'install') {
        this.handleInstall();
      } else if (details.reason === 'update') {
        this.handleUpdate(details.previousVersion);
      }
    });

    // Handle messages from content scripts and popup
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse);
      return true; // Indicates async response
    });

    // Handle tab updates to detect job pages
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      if (changeInfo.status === 'complete' && tab.url) {
        this.handleTabUpdate(tabId, tab);
      }
    });

    // Handle navigation completed
    if (chrome.webNavigation) {
      chrome.webNavigation.onCompleted.addListener((details) => {
        if (details.frameId === 0) {
          this.handleNavigationCompleted(details);
        }
      });
    }

    // Handle context menu clicks
    chrome.contextMenus.onClicked.addListener((info, tab) => {
      this.handleContextMenuClick(info, tab);
    });

    // Handle keyboard shortcuts
    chrome.commands.onCommand.addListener((command) => {
      this.handleCommand(command);
    });
  }

  setupPeriodicTasks() {
    // Clean cache every 5 minutes
    setInterval(() => {
      this.cleanCache();
    }, 5 * 60 * 1000);

    // Clean rate limiter every minute
    setInterval(() => {
      this.cleanRateLimiter();
    }, 60 * 1000);

    // Sync user data every 10 minutes if authenticated
    setInterval(() => {
      this.syncUserData();
    }, 10 * 60 * 1000);
  }

  async handleInstall() {
    // Set default settings
    const defaultSettings = {
      autofillEnabled: true,
      trackingEnabled: true,
      notificationsEnabled: true,
      smartAnalysis: true,
      autoSaveJobs: false,
      apiUrl: this.apiUrl,
      theme: 'light',
      shortcuts: {
        autofill: 'Ctrl+Shift+A',
        analyze: 'Ctrl+Shift+J',
        saveJob: 'Ctrl+Shift+S'
      }
    };

    await chrome.storage.sync.set(defaultSettings);

    // Create context menus
    this.createContextMenus();

    // Show welcome notification
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'AutoJobr Installed! 🎉',
      message: 'Start auto-filling job applications on 100+ job boards. Click the extension icon to get started.',
      buttons: [
        { title: 'Get Started' },
        { title: 'View Tutorial' }
      ]
    });

    // Open onboarding page
    chrome.tabs.create({
      url: `${this.apiUrl}/onboarding?source=extension&version=2.0`
    });
  }

  async handleUpdate(previousVersion) {
    console.log(`Updated from ${previousVersion} to ${chrome.runtime.getManifest().version}`);
    
    // Migration logic for different versions
    if (previousVersion < '2.0.0') {
      await this.migrateToV2();
    }

    // Show update notification
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'AutoJobr Updated! ✨',
      message: 'New features: Enhanced UI, better job matching, and improved auto-fill accuracy.',
      buttons: [
        { title: 'See What\'s New' },
        { title: 'Dismiss' }
      ]
    });
  }

  async migrateToV2() {
    // Migrate old settings to new format
    const oldSettings = await chrome.storage.sync.get();
    const newSettings = {
      ...oldSettings,
      smartAnalysis: true,
      autoSaveJobs: false,
      theme: 'light'
    };
    
    await chrome.storage.sync.set(newSettings);
    console.log('✅ Migrated settings to v2.0');
  }

  createContextMenus() {
    // Define consistent job site patterns (matches manifest.json)
    const jobSitePatterns = [
      '*://*.linkedin.com/jobs/*',
      '*://*.indeed.com/viewjob*',
      '*://*.indeed.com/jobs/*',
      '*://*.glassdoor.com/Job/*',
      '*://*.glassdoor.com/job-listing/*',
      '*://*.ziprecruiter.com/jobs/*',
      '*://*.monster.com/job-openings/*',
      '*://*.dice.com/jobs/*',
      '*://*.greenhouse.io/*/jobs/*',
      '*://*.lever.co/*/jobs/*',
      '*://*.workday.com/*/job/*',
      '*://*.myworkdayjobs.com/*/job/*',
      '*://*.naukri.com/job-listings/*',
      '*://*.naukri.com/*/jobs*',
      '*://*.shine.com/jobs/*',
      '*://*.timesjobs.com/job-detail/*',
      '*://*.freshersjobs.com/*/jobs/*',
      '*://*.instahyre.com/jobs/*',
      '*://*.angel.co/jobs/*',
      '*://*.wellfound.com/jobs/*',
      '*://*.stackoverflow.com/jobs/*',
      '*://*.remoteok.io/remote-jobs/*',
      '*://*.weworkremotely.com/remote-jobs/*'
    ];

    const applicationPatterns = [
      '*://*.linkedin.com/jobs/apply/*',
      '*://*.indeed.com/apply/*',
      '*://*.glassdoor.com/job/apply/*',
      '*://*.greenhouse.io/*/application/*',
      '*://*.lever.co/*/apply/*',
      '*://*.workday.com/*/apply/*',
      '*://*.myworkdayjobs.com/*/application/*',
      '*://*.boards.greenhouse.io/*/jobs/*/application/*',
      '*://*.jobs.lever.co/*/apply/*',
      '*://*.apply.workable.com/*/*',
      '*://*.taleo.net/careersection/*/jobapply/*',
      '*://*.icims.com/jobs/*/apply/*'
    ];

    chrome.contextMenus.create({
      id: 'autofill-form',
      title: 'Auto-fill this form',
      contexts: ['page'],
      documentUrlPatterns: [...applicationPatterns, ...jobSitePatterns]
    });

    chrome.contextMenus.create({
      id: 'analyze-job',
      title: 'Analyze job match',
      contexts: ['page'],
      documentUrlPatterns: jobSitePatterns
    });

    chrome.contextMenus.create({
      id: 'save-job',
      title: 'Save this job',
      contexts: ['page'],
      documentUrlPatterns: jobSitePatterns
    });
  }

  async handleMessage(message, sender, sendResponse) {
    try {
      // Check if sender has a valid tab (prevent errors on detached contexts)
      if (!sender || !sender.tab) {
        console.log('Message from detached context, ignoring');
        sendResponse({ success: false, error: 'Detached context' });
        return;
      }
      
      // Rate limiting
      if (!this.checkRateLimit(sender.tab?.id || 'unknown', message.action)) {
        sendResponse({ success: false, error: 'Rate limit exceeded' });
        return;
      }

      switch (message.action) {
        case 'getApiUrl':
          sendResponse({ apiUrl: this.apiUrl });
          break;

        case 'trackApplication':
          const trackResult = await this.trackApplication(message.data);
          sendResponse(trackResult);
          break;

        case 'saveJob':
          const savedJob = await this.saveJob(message.data);
          sendResponse({ success: true, job: savedJob });
          break;

        case 'generateCoverLetter':
          const coverLetter = await this.generateCoverLetter(message.data);
          sendResponse({ success: true, coverLetter });
          break;

        case 'analyzeJob':
          const analysis = await this.analyzeJob(message.data);
          sendResponse({ success: true, analysis });
          break;

        case 'getUserProfile':
          const profile = await this.getUserProfile();
          sendResponse({ success: true, profile });
          break;

        case 'testConnection':
          const connected = await this.testConnection();
          sendResponse({ success: true, connected });
          break;

        case 'showNotification':
          await this.showAdvancedNotification(message.title, message.message, message.type);
          sendResponse({ success: true });
          break;

        case 'getJobSuggestions':
          const suggestions = await this.getJobSuggestions(message.data);
          sendResponse({ success: true, suggestions });
          break;

        case 'updateUserPreferences':
          await this.updateUserPreferences(message.data);
          sendResponse({ success: true });
          break;

        case 'openPopup':
          await this.openExtensionPopup();
          sendResponse({ success: true });
          break;

        default:
          sendResponse({ success: false, error: 'Unknown action' });
      }
    } catch (error) {
      console.error('Background message handler error:', error);
      sendResponse({ success: false, error: error.message });
    }
  }

  checkRateLimit(identifier, action) {
    const key = `${identifier}_${action}`;
    const now = Date.now();
    const limit = this.rateLimiter.get(key) || { count: 0, resetTime: now + 60000 };

    if (now > limit.resetTime) {
      limit.count = 0;
      limit.resetTime = now + 60000;
    }

    if (limit.count >= 10) { // 10 requests per minute
      return false;
    }

    limit.count++;
    this.rateLimiter.set(key, limit);
    return true;
  }

  async handleTabUpdate(tabId, tab) {
    const supportedDomains = [
      'linkedin.com', 'indeed.com', 'glassdoor.com', 'ziprecruiter.com',
      'monster.com', 'careerbuilder.com', 'dice.com', 'stackoverflow.com',
      'angel.co', 'wellfound.com', 'greenhouse.io', 'lever.co',
      'workday.com', 'myworkdayjobs.com', 'icims.com', 'smartrecruiters.com',
      'bamboohr.com', 'ashbyhq.com', 'careers.google.com', 'amazon.jobs',
      'autojobr.com'
    ];

    const isJobBoard = supportedDomains.some(domain => tab.url.includes(domain));

    if (isJobBoard) {
      // Update badge with enhanced styling
      chrome.action.setBadgeText({
        tabId: tabId,
        text: '✓'
      });

      chrome.action.setBadgeBackgroundColor({
        tabId: tabId,
        color: '#22c55e'
      });

      // Inject content script if needed
      await this.ensureContentScriptInjected(tabId);

      // Auto-detect job postings
      setTimeout(() => {
        this.detectJobPosting(tabId);
      }, 2000);

    } else {
      chrome.action.setBadgeText({
        tabId: tabId,
        text: ''
      });
    }
  }

  async handleNavigationCompleted(details) {
    const { tabId, url } = details;
    
    // Delay to ensure page is fully loaded
    setTimeout(() => {
      this.handleTabUpdate(tabId, { url });
    }, 1500);
  }

  async handleContextMenuClick(info, tab) {
    switch (info.menuItemId) {
      case 'autofill-form':
        await this.triggerAutofill(tab.id);
        break;
      case 'analyze-job':
        await this.triggerJobAnalysis(tab.id);
        break;
      case 'save-job':
        await this.triggerSaveJob(tab.id);
        break;
    }
  }

  async handleCommand(command) {
    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    switch (command) {
      case 'autofill':
        await this.triggerAutofill(activeTab.id);
        break;
      case 'analyze':
        await this.triggerJobAnalysis(activeTab.id);
        break;
      case 'save-job':
        await this.triggerSaveJob(activeTab.id);
        break;
    }
  }

  async ensureContentScriptInjected(tabId) {
    try {
      await chrome.scripting.executeScript({
        target: { tabId },
        func: () => window.autojobrContentScriptLoaded
      });
    } catch (error) {
      try {
        await chrome.scripting.executeScript({
          target: { tabId },
          files: ['content-script.js']
        });

        await chrome.scripting.insertCSS({
          target: { tabId },
          files: ['popup-styles.css']
        });

        console.log('✅ Content script injected successfully');
      } catch (injectionError) {
        console.error('Failed to inject content script:', injectionError);
      }
    }
  }

  async detectJobPosting(tabId) {
    try {
      const response = await chrome.tabs.sendMessage(tabId, {
        action: 'detectJobPosting'
      });

      if (response && response.success && response.jobData) {
        // Cache job data
        this.cache.set(`job_${tabId}`, {
          data: response.jobData,
          timestamp: Date.now()
        });

        // Show smart notification if enabled
        const settings = await chrome.storage.sync.get(['smartAnalysis']);
        if (settings.smartAnalysis) {
          await this.showJobDetectedNotification(response.jobData);
        }
      }
    } catch (error) {
      console.error('Job detection failed:', error);
    }
  }

  async showJobDetectedNotification(jobData) {
    // Throttle duplicate notifications for the same job
    const jobKey = `${jobData?.title}_${jobData?.company}`.replace(/\s/g, '');
    const now = Date.now();
    
    // Initialize notifications tracker if it doesn't exist
    if (!this.lastDetectionNotifications) this.lastDetectionNotifications = {};
    const lastNotificationTime = this.lastDetectionNotifications[jobKey];
    
    // Don't show notification if same job was detected in last 60 seconds
    if (!lastNotificationTime || (now - lastNotificationTime) > 60000) { // 60 seconds throttle
      this.lastDetectionNotifications[jobKey] = now;
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: '🎯 Job Detected!',
        message: `${jobData.title} at ${jobData.company}`,
        buttons: [
          { title: 'Analyze Match' },
          { title: 'Auto-fill' }
        ]
      });
    } else {
      console.log('Skipping duplicate job detection notification for same job');
    }
  }

  async testConnection() {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(`${this.apiUrl}/api/health`, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  async getUserProfile() {
    try {
      // Check cache first to prevent excessive requests
      const cacheKey = 'user_profile';
      const cached = this.cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < 300000) { // 5 minute cache
        return cached.data;
      }
      
      // Use session-based authentication (cookies) instead of Bearer tokens
      const response = await fetch(`${this.apiUrl}/api/extension/profile`, {
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include', // This sends session cookies
        mode: 'cors'
      });

      if (response.ok) {
        const profile = await response.json();
        
        // Only cache if user is authenticated
        if (profile.authenticated) {
          this.cache.set(cacheKey, {
            data: profile,
            timestamp: Date.now()
          });
        }
        
        return profile;
      } else if (response.status === 401) {
        // Expected when user is not logged in - don't treat as error
        console.log('User not authenticated - extension will work in limited mode');
        return null;
      }
      
      console.warn('Profile fetch failed with status:', response.status);
      return null;
    } catch (error) {
      console.error('Get user profile error:', error);
      return null;
    }
  }

  async trackApplication(data) {
    try {
      // Use session-based authentication instead of Bearer tokens
      const headers = {
        'Content-Type': 'application/json'
      };
      
      // Use the main applications endpoint that updates job_applications table
      const response = await fetch(`${this.apiUrl}/api/applications`, {
        method: 'POST',
        headers,
        credentials: 'include', // Send session cookies
        mode: 'cors',
        body: JSON.stringify({
          jobTitle: data.jobTitle,
          company: data.company,
          location: data.location || '',
          jobUrl: data.jobUrl || '',
          status: 'applied',
          source: 'extension',
          notes: `Applied via ${data.platform || 'extension'} on ${new Date().toLocaleDateString()}`
        })
      });

      if (!response.ok) {
        if (response.status === 401) {
          console.log('User not authenticated - cannot track application');
          throw new Error('Please log in to AutoJobr to track applications');
        }
        const errorText = await response.text();
        throw new Error(`Failed to track application: ${errorText}`);
      }

      const application = await response.json();

      await this.showAdvancedNotification(
        'Application Tracked! 📊',
        `Tracked: ${data.jobTitle} at ${data.company}`,
        'success'
      );

      return { success: true, application };

    } catch (error) {
      console.error('Track application error:', error);
      throw error;
    }
  }

  async saveJob(data) {
    try {
      const result = await chrome.storage.local.get(['sessionToken']);
      const sessionToken = result.sessionToken;
      
      const headers = {
        'Content-Type': 'application/json'
      };
      
      if (sessionToken) {
        headers['Authorization'] = `Bearer ${sessionToken}`;
      }
      
      const response = await fetch(`${this.apiUrl}/api/saved-jobs`, {
        method: 'POST',
        headers,
        credentials: 'include',
        mode: 'cors',
        body: JSON.stringify({
          title: data.jobTitle,
          company: data.company,
          description: data.description,
          location: data.location,
          url: data.jobUrl,
          platform: data.source || 'extension_v2',
          extractedAt: new Date().toISOString()
        })
      });

      if (!response.ok) {
        if (response.status === 401) {
          await chrome.storage.local.remove(['sessionToken', 'userId']);
        }
        throw new Error('Failed to save job');
      }

      const savedJob = await response.json();

      await this.showAdvancedNotification(
        'Job Saved! 💾',
        `Saved "${data.jobTitle}" at ${data.company}`,
        'success'
      );

      return savedJob;

    } catch (error) {
      console.error('Save job error:', error);
      throw error;
    }
  }

  async generateCoverLetter(data) {
    try {
      const result = await chrome.storage.local.get(['sessionToken']);
      const sessionToken = result.sessionToken;
      
      const headers = {
        'Content-Type': 'application/json'
      };
      
      if (sessionToken) {
        headers['Authorization'] = `Bearer ${sessionToken}`;
      }
      
      const response = await fetch(`${this.apiUrl}/api/generate-cover-letter`, {
        method: 'POST',
        headers,
        credentials: 'include',
        mode: 'cors',
        body: JSON.stringify({
          ...data,
          requestedAt: new Date().toISOString(),
          source: 'extension_v2'
        })
      });

      if (!response.ok) {
        if (response.status === 401) {
          await chrome.storage.local.remove(['sessionToken', 'userId']);
        }
        throw new Error('Failed to generate cover letter');
      }

      const result_data = await response.json();

      await this.showAdvancedNotification(
        'Cover Letter Generated! 📝',
        'Cover letter has been generated and copied to clipboard',
        'success'
      );

      return result_data.coverLetter;

    } catch (error) {
      console.error('Generate cover letter error:', error);
      throw error;
    }
  }

  async analyzeJob(data) {
    try {
      // Get user profile if not provided by content script
      let userProfile = data.userProfile;
      if (!userProfile) {
        console.log('Background script: Getting user profile for job analysis');
        userProfile = await this.getUserProfile();
        if (!userProfile || !userProfile.authenticated) {
          console.log('User not authenticated - cannot analyze job');
          throw new Error('Please log in to AutoJobr to analyze jobs');
        }
      }
      
      console.log('Background script analyzing job with fresh API call:', {
        jobTitle: data.jobData?.title,
        company: data.jobData?.company,
        userSkills: userProfile?.skills?.length || 0,
        userProfessionalTitle: userProfile?.professionalTitle,
        userYearsExperience: userProfile?.yearsExperience,
        userAuthenticated: userProfile?.authenticated
      });
      
      const headers = {
        'Content-Type': 'application/json'
      };
      
      // Always make fresh API call - don't use any cached data
      const response = await fetch(`${this.apiUrl}/api/analyze-job-match`, {
        method: 'POST',
        headers,
        credentials: 'include', // Use session cookies
        mode: 'cors',
        body: JSON.stringify({
          jobData: data.jobData,
          userProfile: userProfile,
          analyzedAt: new Date().toISOString(),
          source: 'extension_automatic_popup'
        })
      });

      if (!response.ok) {
        if (response.status === 401) {
          console.log('User not authenticated - cannot analyze job');
          throw new Error('Please log in to AutoJobr to analyze jobs');
        }
        throw new Error('Failed to analyze job');
      }

      const analysis = await response.json();
      
      console.log('Background script received fresh analysis:', {
        matchScore: analysis.matchScore,
        factors: analysis.factors?.length || 0
      });

      const matchLevel = analysis.matchScore >= 80 ? 'Excellent' : 
                        analysis.matchScore >= 60 ? 'Good' : 
                        analysis.matchScore >= 40 ? 'Fair' : 'Poor';

      // Only show notification for manual analysis, not automatic ones, and throttle duplicates
      if (data.source !== 'extension_automatic_popup') {
        const jobKey = `${data.jobData?.title}_${data.jobData?.company}`.replace(/\s/g, '');
        const now = Date.now();
        
        // Don't show notification if same job was analyzed in last 30 seconds
        if (!this.lastNotifications) this.lastNotifications = {};
        const lastNotificationTime = this.lastNotifications[jobKey];
        
        if (!lastNotificationTime || (now - lastNotificationTime) > 30000) { // 30 seconds throttle
          this.lastNotifications[jobKey] = now;
          await this.showAdvancedNotification(
            'Job Analysis Complete! 🎯',
            `Match Score: ${analysis.matchScore}% (${matchLevel} match)`,
            analysis.matchScore >= 60 ? 'success' : 'warning'
          );
        } else {
          console.log('Skipping duplicate notification for same job');
        }
      }

      // Return the fresh analysis data directly from server
      return analysis;

    } catch (error) {
      console.error('Analyze job error:', error);
      throw error;
    }
  }

  async getJobSuggestions(data) {
    try {
      const result = await chrome.storage.local.get(['sessionToken']);
      const sessionToken = result.sessionToken;
      
      if (!sessionToken) return [];
      
      const headers = {
        'Authorization': `Bearer ${sessionToken}`,
        'Content-Type': 'application/json'
      };
      
      const response = await fetch(`${this.apiUrl}/api/job-suggestions`, {
        method: 'POST',
        headers,
        credentials: 'include',
        mode: 'cors',
        body: JSON.stringify(data)
      });

      if (response.ok) {
        return await response.json();
      }
      
      return [];
    } catch (error) {
      console.error('Get job suggestions error:', error);
      return [];
    }
  }

  async updateUserPreferences(data) {
    try {
      const result = await chrome.storage.local.get(['sessionToken']);
      const sessionToken = result.sessionToken;
      
      if (!sessionToken) return;
      
      const headers = {
        'Authorization': `Bearer ${sessionToken}`,
        'Content-Type': 'application/json'
      };
      
      await fetch(`${this.apiUrl}/api/user/preferences`, {
        method: 'PUT',
        headers,
        credentials: 'include',
        mode: 'cors',
        body: JSON.stringify(data)
      });

      // Clear profile cache to force refresh
      this.cache.delete('user_profile');
      
    } catch (error) {
      console.error('Update user preferences error:', error);
    }
  }

  async showAdvancedNotification(title, message, type = 'basic') {
    const iconMap = {
      success: 'icons/icon48.png',
      warning: 'icons/icon48.png',
      error: 'icons/icon48.png',
      info: 'icons/icon48.png'
    };

    chrome.notifications.create({
      type: 'basic',
      iconUrl: iconMap[type] || iconMap.basic,
      title,
      message,
      priority: type === 'error' ? 2 : 1
    });
  }

  async triggerAutofill(tabId) {
    try {
      const profile = await this.getUserProfile();
      if (!profile) {
        await this.showAdvancedNotification(
          'Authentication Required',
          'Please sign in to use auto-fill',
          'warning'
        );
        return;
      }

      await chrome.tabs.sendMessage(tabId, {
        action: 'startAutofill',
        userProfile: profile
      });
    } catch (error) {
      console.error('Trigger autofill error:', error);
    }
  }

  async triggerJobAnalysis(tabId) {
    try {
      await chrome.tabs.sendMessage(tabId, {
        action: 'analyzeJob'
      });
    } catch (error) {
      console.error('Trigger job analysis error:', error);
    }
  }

  async triggerSaveJob(tabId) {
    try {
      await chrome.tabs.sendMessage(tabId, {
        action: 'saveCurrentJob'
      });
    } catch (error) {
      console.error('Trigger save job error:', error);
    }
  }

  cleanCache() {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > 600000) { // 10 minutes
        this.cache.delete(key);
      }
    }
  }

  cleanRateLimiter() {
    const now = Date.now();
    for (const [key, value] of this.rateLimiter.entries()) {
      if (now > value.resetTime) {
        this.rateLimiter.delete(key);
      }
    }
  }

  async syncUserData() {
    try {
      const result = await chrome.storage.local.get(['sessionToken']);
      if (result.sessionToken) {
        // Refresh user profile cache
        this.cache.delete('user_profile');
        await this.getUserProfile();
      }
    } catch (error) {
      console.error('Sync user data error:', error);
    }
  }

  async openExtensionPopup() {
    try {
      // Get current active tab
      const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (activeTab) {
        // Open extension popup programmatically
        chrome.action.openPopup();
      }
    } catch (error) {
      console.error('Failed to open popup:', error);
      // Fallback: try to open popup using different method
      try {
        chrome.browserAction.openPopup();
      } catch (fallbackError) {
        console.error('Fallback popup open failed:', fallbackError);
      }
    }
  }
}

// Initialize background service
new AutoJobrBackground();