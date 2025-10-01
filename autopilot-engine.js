// AutoJobr Autopilot Engine - Advanced Job Search Automation
class AutopilotEngine {
  constructor() {
    this.isActive = false;
    this.queue = [];
    this.appliedJobs = new Set();
    this.dailyLimit = 50;
    this.appliedToday = 0;
    this.matchThreshold = 60; // Minimum match score to auto-apply
    this.preferences = {};
    this.lastReset = new Date().toDateString();
    this.init();
  }

  async init() {
    await this.loadPreferences();
    await this.loadAppliedJobs();
    this.checkDailyReset();
  }

  async loadPreferences() {
    const result = await chrome.storage.sync.get(['autopilotPreferences']);
    this.preferences = result.autopilotPreferences || {
      enabled: false,
      autoApply: false,
      dailyLimit: 50,
      matchThreshold: 60,
      jobTypes: ['full-time', 'contract'],
      experienceLevels: ['entry', 'mid', 'senior'],
      locations: [],
      salaryMin: 0,
      remoteOnly: false,
      excludeCompanies: [],
      preferredCompanies: [],
      keywords: [],
      excludeKeywords: []
    };
  }

  async savePreferences() {
    await chrome.storage.sync.set({ autopilotPreferences: this.preferences });
  }

  async loadAppliedJobs() {
    const result = await chrome.storage.local.get(['appliedJobsToday', 'lastResetDate']);
    this.appliedToday = result.appliedJobsToday || 0;
    this.lastReset = result.lastResetDate || new Date().toDateString();
  }

  checkDailyReset() {
    const today = new Date().toDateString();
    if (this.lastReset !== today) {
      this.appliedToday = 0;
      this.lastReset = today;
      chrome.storage.local.set({
        appliedJobsToday: 0,
        lastResetDate: today
      });
    }
  }

  async toggleAutopilot(enabled) {
    this.isActive = enabled;
    this.preferences.enabled = enabled;
    await this.savePreferences();

    if (enabled) {
      await this.startAutopilot();
    } else {
      await this.stopAutopilot();
    }
  }

  async startAutopilot() {
    console.log('🚀 AutoJobr Autopilot started');

    // Show notification
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'AutoJobr Autopilot Active',
      message: `Searching for jobs matching your criteria. Daily limit: ${this.preferences.dailyLimit - this.appliedToday} remaining.`
    });

    // Start scanning for jobs
    await this.scanAndApply();
  }

  async stopAutopilot() {
    this.isActive = false;
    console.log('⏸️ AutoJobr Autopilot stopped');

    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'AutoJobr Autopilot Paused',
      message: `Applied to ${this.appliedToday} jobs today.`
    });
  }

  async scanAndApply() {
    if (!this.isActive || this.appliedToday >= this.preferences.dailyLimit) {
      return;
    }

    try {
      // Get user profile
      const profile = await this.getUserProfile();
      if (!profile) {
        console.error('User profile not available');
        return;
      }

      // Get current tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      // Check if on supported job board
      if (!this.isSupportedJobBoard(tab.url)) {
        console.log('Not on a supported job board');
        return;
      }

      // Extract jobs from page
      const jobs = await this.extractJobsFromPage(tab.id);

      // Filter and score jobs
      const qualifiedJobs = await this.filterAndScoreJobs(jobs, profile);

      // Add to queue
      this.queue.push(...qualifiedJobs);

      // Process queue
      await this.processQueue(tab.id);

    } catch (error) {
      console.error('Autopilot scan error:', error);
    }
  }

  async extractJobsFromPage(tabId) {
    try {
      const response = await chrome.tabs.sendMessage(tabId, {
        action: 'extractAllJobs'
      });

      return response?.jobs || [];
    } catch (error) {
      console.error('Failed to extract jobs:', error);
      return [];
    }
  }

  async filterAndScoreJobs(jobs, profile) {
    const qualified = [];

    for (const job of jobs) {
      // Skip already applied
      if (this.appliedJobs.has(job.id || job.url)) {
        continue;
      }

      // Check company filters
      if (this.preferences.excludeCompanies.some(c =>
        job.company.toLowerCase().includes(c.toLowerCase()))) {
        continue;
      }

      // Check keywords
      if (this.preferences.excludeKeywords.length > 0) {
        const hasExcludedKeyword = this.preferences.excludeKeywords.some(kw =>
          job.title.toLowerCase().includes(kw.toLowerCase()) ||
          job.description?.toLowerCase().includes(kw.toLowerCase())
        );
        if (hasExcludedKeyword) continue;
      }

      // Score job match
      const matchScore = await this.scoreJobMatch(job, profile);

      if (matchScore >= this.preferences.matchThreshold) {
        qualified.push({
          ...job,
          matchScore,
          timestamp: Date.now()
        });
      }
    }

    // Sort by match score
    return qualified.sort((a, b) => b.matchScore - a.matchScore);
  }

  async scoreJobMatch(job, profile) {
    let score = 0;

    // Skills match (40 points)
    const jobSkills = this.extractSkills(job.description || job.requirements || '');
    const userSkills = profile.skills || [];
    const matchingSkills = jobSkills.filter(js =>
      userSkills.some(us => us.toLowerCase().includes(js.toLowerCase()))
    );
    score += (matchingSkills.length / Math.max(jobSkills.length, 1)) * 40;

    // Experience level match (20 points)
    const requiredExp = this.extractExperienceLevel(job.description || '');
    const userExp = profile.yearsExperience || 0;
    if (this.matchesExperience(requiredExp, userExp)) {
      score += 20;
    }

    // Location match (15 points)
    if (this.preferences.remoteOnly && job.location?.toLowerCase().includes('remote')) {
      score += 15;
    } else if (this.preferences.locations.length === 0 ||
               this.preferences.locations.some(loc =>
                 job.location?.toLowerCase().includes(loc.toLowerCase()))) {
      score += 15;
    }

    // Job type match (10 points)
    if (this.preferences.jobTypes.some(type =>
      job.type?.toLowerCase().includes(type.toLowerCase()))) {
      score += 10;
    }

    // Preferred company boost (15 points)
    if (this.preferences.preferredCompanies.some(c =>
      job.company.toLowerCase().includes(c.toLowerCase()))) {
      score += 15;
    }

    return Math.min(Math.round(score), 100);
  }

  extractSkills(text) {
    const commonSkills = [
      'javascript', 'python', 'java', 'react', 'node', 'sql', 'aws',
      'docker', 'kubernetes', 'typescript', 'angular', 'vue', 'css',
      'html', 'git', 'agile', 'scrum', 'rest', 'api', 'mongodb',
      'postgresql', 'redis', 'graphql', 'jenkins', 'ci/cd', 'testing',
      'machine learning', 'ai', 'data science', 'analytics'
    ];

    const lowerText = text.toLowerCase();
    return commonSkills.filter(skill => lowerText.includes(skill));
  }

  extractExperienceLevel(text) {
    const lowerText = text.toLowerCase();
    if (lowerText.includes('entry') || lowerText.includes('junior') || lowerText.includes('0-2 years')) {
      return 'entry';
    } else if (lowerText.includes('senior') || lowerText.includes('5+ years') || lowerText.includes('7+ years')) {
      return 'senior';
    } else if (lowerText.includes('lead') || lowerText.includes('principal') || lowerText.includes('staff')) {
      return 'lead';
    }
    return 'mid';
  }

  matchesExperience(required, userYears) {
    const map = { entry: [0, 2], mid: [2, 5], senior: [5, 10], lead: [7, 20] };
    const range = map[required] || [0, 100];
    return userYears >= range[0] && userYears <= range[1];
  }

  async processQueue(tabId) {
    if (this.queue.length === 0) return;

    const batch = this.queue.splice(0, 5); // Process 5 at a time

    for (const job of batch) {
      if (this.appliedToday >= this.preferences.dailyLimit) {
        console.log('Daily limit reached');
        await this.stopAutopilot();
        return;
      }

      if (!this.isActive) return;

      try {
        // Navigate to job and apply
        await this.applyToJob(tabId, job);

        // Track application
        this.appliedJobs.add(job.id || job.url);
        this.appliedToday++;

        await chrome.storage.local.set({
          appliedJobsToday: this.appliedToday
        });

        // Wait between applications
        await this.sleep(5000);

      } catch (error) {
        console.error('Failed to apply to job:', error);
      }
    }

    // Continue processing if more in queue
    if (this.queue.length > 0 && this.isActive) {
      setTimeout(() => this.processQueue(tabId), 10000);
    }
  }

  async applyToJob(tabId, job) {
    // Send message to content script to apply
    const response = await chrome.tabs.sendMessage(tabId, {
      action: 'applyToJob',
      jobData: job
    });

    if (response?.success) {
      // Notify user
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: `Applied: ${job.title}`,
        message: `${job.company} - Match: ${job.matchScore}%`
      });

      // Track in background
      chrome.runtime.sendMessage({
        action: 'trackApplication',
        data: {
          jobTitle: job.title,
          company: job.company,
          location: job.location,
          jobUrl: job.url,
          matchScore: job.matchScore,
          platform: 'autopilot'
        }
      });
    }

    return response;
  }

  isSupportedJobBoard(url) {
    const supported = [
      'linkedin.com', 'indeed.com', 'glassdoor.com', 'ziprecruiter.com',
      'monster.com', 'dice.com', 'greenhouse.io', 'lever.co', 'workday.com'
    ];
    return supported.some(domain => url.includes(domain));
  }

  async getUserProfile() {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ action: 'getUserProfile' }, (response) => {
        resolve(response?.profile);
      });
    });
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async updatePreferences(newPrefs) {
    this.preferences = { ...this.preferences, ...newPrefs };
    await this.savePreferences();
  }

  getStatus() {
    return {
      isActive: this.isActive,
      appliedToday: this.appliedToday,
      dailyLimit: this.preferences.dailyLimit,
      queueLength: this.queue.length,
      matchThreshold: this.preferences.matchThreshold
    };
  }
}

// Initialize autopilot engine
const autopilot = new AutopilotEngine();

// Listen for messages
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'toggleAutopilot') {
    autopilot.toggleAutopilot(message.enabled).then(() => {
      sendResponse({ success: true });
    });
    return true;
  }

  if (message.action === 'getAutopilotStatus') {
    sendResponse(autopilot.getStatus());
    return true;
  }

  if (message.action === 'updateAutopilotPreferences') {
    autopilot.updatePreferences(message.preferences).then(() => {
      sendResponse({ success: true });
    });
    return true;
  }
});
