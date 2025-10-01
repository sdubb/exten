// Enhanced AutoJobr Popup with Advanced Features
const API_BASE_URL = 'https://autojobr.com';

class AutoJobrPopup {
  constructor() {
    this.currentTab = null;
    this.userProfile = null;
    this.jobData = null;
    this.isConnected = false;
    this.isAuthenticated = false;
    this.cache = new Map();
    this.init();
  }

  async init() {
    try {
      // Get current tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      this.currentTab = tab;
      
      // Initialize UI
      this.initializeEventListeners();
      this.showLoading(true);
      
      // Check connection and authentication
      await this.checkConnection();
      await this.loadUserProfile();
      await this.analyzeCurrentPage();
      await this.loadTasks();
      
      this.showLoading(false);
      
    } catch (error) {
      console.error('Popup initialization error:', error);
      this.showError('Failed to initialize extension');
      this.showLoading(false);
    }
  }

  initializeEventListeners() {
    // Close popup button
    document.getElementById('closePopup')?.addEventListener('click', () => {
      window.close();
    });
    
    // Action buttons
    document.getElementById('autofillBtn').addEventListener('click', () => this.handleAutofill());
    document.getElementById('analyzeBtn').addEventListener('click', () => this.handleAnalyze());
    document.getElementById('saveJobBtn').addEventListener('click', () => this.handleSaveJob());
    document.getElementById('coverLetterBtn').addEventListener('click', () => this.handleGenerateCoverLetter());
    
    // Quick action buttons
    document.getElementById('resumeBtn').addEventListener('click', () => this.handleResumeAction());
    document.getElementById('profileBtn').addEventListener('click', () => this.handleProfileAction());
    document.getElementById('historyBtn').addEventListener('click', () => this.handleHistoryAction());
    
    // Footer actions
    document.getElementById('openDashboard').addEventListener('click', () => this.openDashboard());

    // Task management
    document.getElementById('addTaskBtn').addEventListener('click', () => this.handleAddTask());
    this.initializeTaskModal();

    // Settings toggles
    this.initializeToggle('autofillToggle', 'autofillEnabled');
    this.initializeToggle('trackingToggle', 'trackingEnabled');
    this.initializeToggle('notificationsToggle', 'notificationsEnabled');

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));
    
    // ESC key to close popup (only when modal is not open)
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const modal = document.getElementById('taskModal');
        if (!modal || !modal.classList.contains('show')) {
          window.close();
        }
      }
    });
  }

  initializeToggle(elementId, storageKey) {
    const toggle = document.getElementById(elementId);
    
    // Load current state
    chrome.storage.sync.get([storageKey], (result) => {
      const isEnabled = result[storageKey] !== false;
      toggle.classList.toggle('active', isEnabled);
    });

    // Handle clicks with animation
    toggle.addEventListener('click', () => {
      const isActive = toggle.classList.contains('active');
      const newState = !isActive;
      
      toggle.classList.toggle('active', newState);
      chrome.storage.sync.set({ [storageKey]: newState });
      
      // Show feedback
      this.showNotification(
        `${storageKey.replace('Enabled', '')} ${newState ? 'enabled' : 'disabled'}`,
        newState ? 'success' : 'info'
      );
    });
  }

  async checkConnection() {
    try {
      // Check server health
      const healthResponse = await this.makeApiRequest('/api/health', {
        method: 'GET',
        timeout: 5000
      });
      
      if (!healthResponse) {
        throw new Error('Server not reachable');
      }
      
      // Check authentication
      const authResponse = await this.makeApiRequest('/api/user', {
        method: 'GET'
      });
      
      this.isConnected = !!healthResponse;
      this.isAuthenticated = !!authResponse && !authResponse.error;
      
      this.updateConnectionStatus(this.isConnected, this.isAuthenticated);
      
    } catch (error) {
      console.error('Connection check failed:', error);
      this.isConnected = false;
      this.isAuthenticated = false;
      this.updateConnectionStatus(false, false);
    }
  }

  async makeApiRequest(endpoint, options = {}) {
    try {
      // Check cache first for GET requests
      const cacheKey = `${endpoint}_${JSON.stringify(options)}`;
      if (options.method === 'GET' && this.cache.has(cacheKey)) {
        const cached = this.cache.get(cacheKey);
        if (Date.now() - cached.timestamp < 30000) { // 30 second cache
          return cached.data;
        }
      }

      // Get stored session token
      const result = await chrome.storage.local.get(['sessionToken', 'userId']);
      const sessionToken = result.sessionToken;
      
      const headers = {
        'Content-Type': 'application/json',
        ...options.headers
      };
      
      if (sessionToken) {
        headers['Authorization'] = `Bearer ${sessionToken}`;
      }
      
      // Add timeout handling
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), options.timeout || 10000);
      
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
        credentials: 'include',
        mode: 'cors',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.status === 401) {
        await chrome.storage.local.remove(['sessionToken', 'userId']);
        this.isAuthenticated = false;
        this.updateConnectionStatus(this.isConnected, false);
        return { error: 'Authentication required' };
      }
      
      // Extract session token from response headers
      const newToken = response.headers.get('X-Session-Token');
      if (newToken) {
        await chrome.storage.local.set({ sessionToken: newToken });
      }
      
      const data = await response.json();
      
      if (!response.ok) {
        // Throw error with server's message and status if available
        const errorMessage = data?.error || data?.message || `HTTP ${response.status}: ${response.statusText}`;
        const error = new Error(errorMessage);
        error.status = response.status;
        error.data = data;
        throw error;
      }
      
      // Cache GET responses
      if (options.method === 'GET') {
        this.cache.set(cacheKey, {
          data,
          timestamp: Date.now()
        });
      }
      
      return data;
      
    } catch (error) {
      if (error.name === 'AbortError') {
        console.error(`Request timeout for ${endpoint}`);
        return { error: 'Request timeout' };
      }
      
      // Re-throw HTTP errors so calling code can handle them properly
      if (error.status) {
        throw error;
      }
      
      console.error(`API request failed for ${endpoint}:`, error);
      return null;
    }
  }

  updateConnectionStatus(connected, authenticated = false) {
    const statusDot = document.getElementById('statusDot');
    const statusText = document.getElementById('connectionStatus');
    
    if (connected && authenticated) {
      statusDot.classList.remove('disconnected');
      statusText.textContent = 'Connected & Authenticated';
      this.enableActionButtons();
    } else if (connected && !authenticated) {
      statusDot.classList.add('disconnected');
      statusText.innerHTML = 'Not authenticated - <button class="login-btn" id="loginBtn">Sign In</button>';
      this.disableActionButtons();
      
      // Add login button handler
      setTimeout(() => {
        document.getElementById('loginBtn')?.addEventListener('click', () => this.handleLogin());
      }, 100);
    } else {
      statusDot.classList.add('disconnected');
      statusText.textContent = 'Server unreachable';
      this.disableActionButtons();
    }
  }

  async handleLogin() {
    try {
      this.showNotification('Opening login page...', 'info');
      
      const loginUrl = `${API_BASE_URL}/auth/extension-login`;
      const tab = await chrome.tabs.create({ url: loginUrl });
      
      // Listen for successful authentication
      const listener = (tabId, changeInfo, updatedTab) => {
        if (tabId === tab.id && changeInfo.url) {
          if (changeInfo.url.includes('/auth/extension-success')) {
            const url = new URL(changeInfo.url);
            const token = url.searchParams.get('token');
            const userId = url.searchParams.get('userId');
            
            if (token && userId) {
              chrome.storage.local.set({ 
                sessionToken: token, 
                userId: userId 
              }).then(() => {
                chrome.tabs.remove(tab.id);
                this.checkConnection();
                this.loadUserProfile();
                this.showNotification('Successfully authenticated!', 'success');
              });
            }
            
            chrome.tabs.onUpdated.removeListener(listener);
          }
        }
      };
      
      chrome.tabs.onUpdated.addListener(listener);
      
      // Cleanup after 5 minutes
      setTimeout(() => {
        chrome.tabs.onUpdated.removeListener(listener);
      }, 300000);
      
    } catch (error) {
      console.error('Login error:', error);
      this.showError('Failed to open login page');
    }
  }

  async analyzeCurrentPage() {
    const pageInfo = document.getElementById('pageInfo');
    const url = this.currentTab?.url || '';
    
    // First, try to get analysis data from content script (if auto-analysis was performed)
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const analysisData = await chrome.tabs.sendMessage(tab.id, { action: 'getCurrentAnalysis' }).catch(() => null);
      
      if (analysisData && analysisData.success && analysisData.analysis) {
        // Use data from automatic analysis
        this.jobData = analysisData.jobData;
        this.displayUnifiedAnalysis(analysisData.analysis, analysisData.jobData);
        this.updatePageInfoWithJob(analysisData.jobData);
        return;
      }
    } catch (error) {
      console.log('No auto-analysis data available, proceeding with manual detection');
    }
    
    // Fallback to manual site detection and analysis
    const supportedSites = [
      { domain: 'autojobr.com', name: 'AutoJobr', icon: '🚀' },
      { domain: 'linkedin.com', name: 'LinkedIn', icon: '💼' },
      { domain: 'indeed.com', name: 'Indeed', icon: '🔍' },
      { domain: 'glassdoor.com', name: 'Glassdoor', icon: '🏢' },
      { domain: 'ziprecruiter.com', name: 'ZipRecruiter', icon: '⚡' },
      { domain: 'monster.com', name: 'Monster', icon: '👹' },
      { domain: 'dice.com', name: 'Dice', icon: '🎲' },
      { domain: 'stackoverflow.com', name: 'Stack Overflow', icon: '💻' },
      { domain: 'greenhouse.io', name: 'Greenhouse', icon: '🌱' },
      { domain: 'lever.co', name: 'Lever', icon: '⚖️' },
      { domain: 'workday.com', name: 'Workday', icon: '📅' },
      { domain: 'myworkdayjobs.com', name: 'Workday', icon: '📅' }
    ];

    const detectedSite = supportedSites.find(site => url.includes(site.domain));
    
    if (detectedSite) {
      pageInfo.className = 'page-info supported';
      pageInfo.innerHTML = `
        <div class="page-info-header">
          <div class="page-info-icon" style="background: #22c55e; color: white;">✓</div>
          <strong>${detectedSite.icon} ${detectedSite.name} detected</strong>
        </div>
        <div style="font-size: 12px; opacity: 0.8;">Auto-fill and job analysis available</div>
      `;
      
      // Try to detect job details manually
      await this.detectJobDetails();
      
    } else {
      pageInfo.className = 'page-info unsupported';
      pageInfo.innerHTML = `
        <div class="page-info-header">
          <div class="page-info-icon" style="background: #ef4444; color: white;">!</div>
          <strong>Unsupported job board</strong>
        </div>
        <div style="font-size: 12px; opacity: 0.8;">Navigate to a supported job board to enable auto-fill</div>
      `;
      
      this.disableActionButtons();
    }
  }

  updatePageInfoWithJob(jobData) {
    const pageInfo = document.getElementById('pageInfo');
    pageInfo.className = 'page-info supported';
    pageInfo.innerHTML = `
      <div class="page-info-header">
        <div class="page-info-icon" style="background: #22c55e; color: white;">✓</div>
        <strong>Job Detected & Analyzed</strong>
      </div>
      <div style="font-size: 12px; opacity: 0.8;">${jobData.title} at ${jobData.company}</div>
    `;
  }

  displayUnifiedAnalysis(analysis, jobData) {
    // Show job info
    const jobInfo = document.getElementById('jobInfo');
    const jobTitle = document.getElementById('jobTitle');
    const jobCompany = document.getElementById('jobCompany');
    
    jobTitle.textContent = jobData.title || 'Job Position';
    jobCompany.textContent = jobData.company || 'Company';
    jobInfo.style.display = 'block';
    
    // Display enhanced analysis results
    this.displayEnhancedAnalysisResults(analysis);
  }

  displayEnhancedAnalysisResults(analysis) {
    const scoreSection = document.getElementById('scoreSection');
    const matchScore = document.getElementById('matchScore');
    const scoreFill = document.getElementById('scoreFill');

    const score = analysis.matchScore || analysis.analysis?.matchScore || 0;
    matchScore.textContent = `${Math.round(score)}%`;
    
    // Animate score fill
    setTimeout(() => {
      scoreFill.style.width = `${score}%`;
    }, 100);
    
    scoreSection.style.display = 'block';

    // Update colors based on score
    let color = '#ef4444';
    if (score >= 80) color = '#22c55e';
    else if (score >= 60) color = '#f59e0b';
    else if (score >= 40) color = '#f97316';

    scoreFill.style.background = `linear-gradient(90deg, ${color}, ${color}cc)`;
    matchScore.style.background = `linear-gradient(135deg, ${color}, ${color}dd)`;
    matchScore.style.webkitBackgroundClip = 'text';
    matchScore.style.webkitTextFillColor = 'transparent';
    
    // Show detailed score explanations
    this.displayScoreExplanations(analysis);
    
    // Log analysis for debugging
    console.log('Enhanced Analysis Results:', analysis);
  }

  async detectJobDetails() {
    try {
      const response = await chrome.tabs.sendMessage(this.currentTab.id, {
        action: 'extractJobDetails'
      });

      if (response && response.success && response.jobData) {
        this.jobData = response.jobData;
        
        // Show job info
        if (this.jobData.title) {
          const jobInfo = document.getElementById('jobInfo');
          const jobTitle = document.getElementById('jobTitle');
          const jobCompany = document.getElementById('jobCompany');
          
          jobTitle.textContent = this.jobData.title;
          jobCompany.textContent = this.jobData.company || 'Company not detected';
          jobInfo.style.display = 'block';
          
          // Analyze job match if user is authenticated
          if (this.isAuthenticated && this.userProfile) {
            await this.showJobAnalysis();
          }
        }
      }
    } catch (error) {
      console.error('Failed to detect job details:', error);
    }
  }

  async showJobAnalysis() {
    if (!this.jobData || !this.userProfile) return;

    try {
      // Clear ALL cache to ensure completely fresh calculation
      this.cache.clear();
      
      console.log('Analyzing job with user profile:', {
        jobTitle: this.jobData.title,
        userTitle: this.userProfile.professionalTitle,
        userSkills: this.userProfile.skills?.length || 0,
        userExperience: this.userProfile.yearsExperience
      });
      
      const analysis = await this.makeApiRequest('/api/analyze-job-match', {
        method: 'POST',
        body: JSON.stringify({
          jobData: this.jobData,
          userProfile: this.userProfile
        })
      });

      console.log('Fresh job analysis received:', analysis);

      if (analysis && !analysis.error) {
        const scoreSection = document.getElementById('scoreSection');
        const matchScore = document.getElementById('matchScore');
        const scoreFill = document.getElementById('scoreFill');

        // Use the server-calculated score directly without any local modifications
        const score = analysis.matchScore || 0;
        console.log('Using server-calculated match score:', score);
        
        matchScore.textContent = `${score}%`;
        
        // Animate score fill
        setTimeout(() => {
          scoreFill.style.width = `${score}%`;
        }, 100);
        
        scoreSection.style.display = 'block';

        // Update colors based on score (consistent with dashboard)
        let color = '#ef4444';
        if (score >= 80) color = '#22c55e';
        else if (score >= 60) color = '#f59e0b';
        else if (score >= 40) color = '#f97316';

        scoreFill.style.background = `linear-gradient(90deg, ${color}, ${color}cc)`;
        matchScore.style.background = `linear-gradient(135deg, ${color}, ${color}dd)`;
        matchScore.style.webkitBackgroundClip = 'text';
        matchScore.style.webkitTextFillColor = 'transparent';
        
        // Show detailed score explanations using consistent server data
        this.displayScoreExplanations(analysis);
        
        // Log detailed analysis for debugging
        console.log('Job Analysis Results:', {
          matchScore: analysis.matchScore,
          factors: analysis.factors,
          recommendation: analysis.recommendation,
          userSkillsCount: analysis.userProfile?.skillsCount,
          userTitle: analysis.userProfile?.professionalTitle,
          jobTitle: this.jobData.title,
          jobCompany: this.jobData.company
        });
      }
    } catch (error) {
      console.error('Job analysis failed:', error);
    }
  }

  displayScoreExplanations(analysis) {
    // Create or update score explanation section
    let explanationSection = document.getElementById('scoreExplanation');
    if (!explanationSection) {
      explanationSection = document.createElement('div');
      explanationSection.id = 'scoreExplanation';
      explanationSection.style.cssText = `
        margin-top: 12px;
        padding: 12px;
        background: rgba(255,255,255,0.05);
        border-radius: 8px;
        border: 1px solid rgba(255,255,255,0.1);
        font-size: 12px;
        display: none;
      `;
      document.getElementById('scoreSection').appendChild(explanationSection);
    }

    const score = analysis.matchScore || analysis.analysis?.matchScore || 0;
    const matchingSkills = analysis.matchingSkills || analysis.analysis?.matchingSkills || [];
    const missingSkills = analysis.missingSkills || analysis.analysis?.missingSkills || [];
    const recommendation = analysis.applicationRecommendation || analysis.recommendation || 'review_required';
    
    explanationSection.innerHTML = `
      <div style="margin-bottom: 8px; font-weight: 600; color: #e5e7eb;">
        📊 Score Breakdown
      </div>
      
      ${matchingSkills.length > 0 ? `
        <div style="margin-bottom: 8px;">
          <div style="color: #22c55e; font-weight: 500; margin-bottom: 4px;">
            ✅ Matching Skills (${matchingSkills.length})
          </div>
          <div style="color: #d1d5db; font-size: 11px;">
            ${matchingSkills.slice(0, 5).join(', ')}${matchingSkills.length > 5 ? '...' : ''}
          </div>
        </div>
      ` : ''}
      
      ${missingSkills.length > 0 ? `
        <div style="margin-bottom: 8px;">
          <div style="color: #f59e0b; font-weight: 500; margin-bottom: 4px;">
            ⚠️ Missing Skills (${missingSkills.length})
          </div>
          <div style="color: #d1d5db; font-size: 11px;">
            ${missingSkills.slice(0, 5).join(', ')}${missingSkills.length > 5 ? '...' : ''}
          </div>
        </div>
      ` : ''}
      
      <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.1);">
        <div style="color: #e5e7eb; font-weight: 500; margin-bottom: 4px;">
          💡 Recommendation
        </div>
        <div style="color: #d1d5db; font-size: 11px;">
          ${this.getRecommendationText(recommendation, score)}
        </div>
      </div>
      
      <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.1);">
        <button id="viewDetailedAnalysis" style="
          background: rgba(255,255,255,0.1);
          border: 1px solid rgba(255,255,255,0.2);
          color: #e5e7eb;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 11px;
          cursor: pointer;
          width: 100%;
        ">
          View Detailed Analysis
        </button>
      </div>
    `;

    // Add event listener for detailed analysis
    document.getElementById('viewDetailedAnalysis')?.addEventListener('click', () => {
      this.showDetailedAnalysisModal(analysis);
    });

    explanationSection.style.display = 'block';
  }

  getRecommendationText(recommendation, score) {
    switch (recommendation) {
      case 'strongly_recommended':
        return 'Excellent match! Your profile aligns very well with this role. Apply with confidence.';
      case 'recommended':
        return 'Good match! You meet most requirements. Consider applying with a tailored resume.';
      case 'consider_with_preparation':
        return 'Moderate match. Review missing skills and consider highlighting transferable experience.';
      case 'needs_development':
        return 'Skills gap identified. Consider developing key missing skills before applying.';
      case 'not_recommended':
        return 'Limited match. This role may require significant additional preparation.';
      default:
        if (score >= 70) return 'Strong match - apply now!';
        if (score >= 50) return 'Good match - consider applying';
        return 'Consider tailoring your application';
    }
  }

  showDetailedAnalysisModal(analysis) {
    // Create detailed analysis modal
    const modal = document.createElement('div');
    modal.id = 'detailedAnalysisModal';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10001;
      backdrop-filter: blur(5px);
    `;

    const content = this.buildDetailedAnalysisContent(analysis);
    modal.innerHTML = `
      <div style="
        background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
        border-radius: 12px;
        padding: 20px;
        max-width: 400px;
        width: 90%;
        max-height: 80vh;
        overflow-y: auto;
        border: 1px solid rgba(255,255,255,0.1);
        box-shadow: 0 20px 40px rgba(0,0,0,0.5);
      ">
        <div style="display: flex; justify-content: between; align-items: center; margin-bottom: 16px;">
          <h3 style="color: #e5e7eb; margin: 0; font-size: 16px;">Detailed Job Analysis</h3>
          <button id="closeModal" style="
            background: none;
            border: none;
            color: #9ca3af;
            font-size: 20px;
            cursor: pointer;
            padding: 0;
            margin-left: auto;
          ">×</button>
        </div>
        ${content}
      </div>
    `;

    document.body.appendChild(modal);

    // Add close functionality
    document.getElementById('closeModal').addEventListener('click', () => {
      modal.remove();
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
  }

  buildDetailedAnalysisContent(analysis) {
    const score = analysis.matchScore || analysis.analysis?.matchScore || 0;
    const skillGaps = analysis.skillGaps || {};
    const seniorityLevel = analysis.seniorityLevel || 'Not specified';
    const workMode = analysis.workMode || 'Not specified';
    const tailoringAdvice = analysis.tailoringAdvice || 'Review job requirements carefully';
    const interviewTips = analysis.interviewPrepTips || 'Prepare for standard interview questions';

    return `
      <div style="color: #e5e7eb; font-size: 13px; line-height: 1.5;">
        <div style="text-align: center; margin-bottom: 16px;">
          <div style="
            width: 60px;
            height: 60px;
            border-radius: 50%;
            background: linear-gradient(135deg, ${this.getScoreColor(score)}, ${this.getScoreColor(score)}dd);
            margin: 0 auto 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
            font-weight: bold;
            color: white;
          ">
            ${Math.round(score)}%
          </div>
          <div style="font-weight: 600; margin-bottom: 4px;">Overall Match Score</div>
          <div style="font-size: 11px; opacity: 0.8;">Based on comprehensive analysis</div>
        </div>

        ${skillGaps.critical && skillGaps.critical.length > 0 ? `
          <div style="margin-bottom: 12px; padding: 8px; background: rgba(239,68,68,0.1); border-radius: 6px; border-left: 3px solid #ef4444;">
            <div style="font-weight: 600; color: #ef4444; margin-bottom: 4px;">🚨 Critical Skills Gap</div>
            <div style="font-size: 11px; opacity: 0.9;">${skillGaps.critical.join(', ')}</div>
          </div>
        ` : ''}

        ${skillGaps.important && skillGaps.important.length > 0 ? `
          <div style="margin-bottom: 12px; padding: 8px; background: rgba(245,158,11,0.1); border-radius: 6px; border-left: 3px solid #f59e0b;">
            <div style="font-weight: 600; color: #f59e0b; margin-bottom: 4px;">⚠️ Important Skills</div>
            <div style="font-size: 11px; opacity: 0.9;">${skillGaps.important.join(', ')}</div>
          </div>
        ` : ''}

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px;">
          <div style="padding: 8px; background: rgba(255,255,255,0.05); border-radius: 6px;">
            <div style="font-size: 10px; opacity: 0.7; margin-bottom: 2px;">Seniority Level</div>
            <div style="font-weight: 500;">${seniorityLevel}</div>
          </div>
          <div style="padding: 8px; background: rgba(255,255,255,0.05); border-radius: 6px;">
            <div style="font-size: 10px; opacity: 0.7; margin-bottom: 2px;">Work Mode</div>
            <div style="font-weight: 500;">${workMode}</div>
          </div>
        </div>

        <div style="margin-bottom: 12px; padding: 8px; background: rgba(34,197,94,0.1); border-radius: 6px; border-left: 3px solid #22c55e;">
          <div style="font-weight: 600; color: #22c55e; margin-bottom: 4px;">💡 Tailoring Advice</div>
          <div style="font-size: 11px; opacity: 0.9;">${tailoringAdvice}</div>
        </div>

        <div style="margin-bottom: 12px; padding: 8px; background: rgba(59,130,246,0.1); border-radius: 6px; border-left: 3px solid #3b82f6;">
          <div style="font-weight: 600; color: #3b82f6; margin-bottom: 4px;">🎯 Interview Tips</div>
          <div style="font-size: 11px; opacity: 0.9;">${interviewTips}</div>
        </div>
      </div>
    `;
  }

  getScoreColor(score) {
    if (score >= 80) return '#22c55e';
    if (score >= 60) return '#f59e0b';
    if (score >= 40) return '#f97316';
    return '#ef4444';
  }

  async loadUserProfile() {
    if (!this.isAuthenticated) return;

    try {
      const profile = await this.makeApiRequest('/api/extension/profile');
      if (profile && !profile.error) {
        this.userProfile = profile;
      }
    } catch (error) {
      console.error('Failed to load user profile:', error);
    }
  }

  async handleAutofill() {
    if (!this.isAuthenticated) {
      this.showError('Please sign in to use auto-fill');
      return;
    }

    if (!this.userProfile) {
      this.showError('User profile not loaded');
      return;
    }

    this.showLoading(true);

    try {
      const response = await chrome.tabs.sendMessage(this.currentTab.id, {
        action: 'startAutofill',
        userProfile: this.userProfile
      });

      if (response && response.success) {
        this.showNotification(
          `✅ Auto-filled ${response.fieldsFilled}/${response.fieldsFound} fields!`,
          'success'
        );
        
        // Track the application
        await this.trackApplication();
      } else {
        throw new Error(response?.error || 'Auto-fill failed');
      }
    } catch (error) {
      console.error('Auto-fill error:', error);
      this.showError('Auto-fill failed. Please try again.');
    } finally {
      this.showLoading(false);
    }
  }

  async handleAnalyze() {
    if (!this.isAuthenticated) {
      this.showError('Please sign in to analyze jobs');
      return;
    }

    this.showLoading(true);

    try {
      await this.detectJobDetails();
      await this.showJobAnalysis();
      this.showNotification('✅ Job analysis completed!', 'success');
    } catch (error) {
      console.error('Analysis error:', error);
      this.showError('Job analysis failed. Please try again.');
    } finally {
      this.showLoading(false);
    }
  }

  async handleSaveJob() {
    if (!this.isAuthenticated) {
      this.showError('Please sign in to save jobs');
      return;
    }

    this.showLoading(true);

    try {
      // If job data is not available, try to extract it first
      if (!this.jobData) {
        console.log('Job data not available, attempting to extract...');
        await this.detectJobDetails();
      }

      // If still no job data, try to extract basic info from page
      if (!this.jobData || !this.jobData.title) {
        console.log('Extracting basic job info from page...');
        const pageTitle = document.title || this.currentTab.title || '';
        const pageUrl = this.currentTab.url || '';
        
        // Basic fallback job data from page title and URL
        this.jobData = {
          title: pageTitle.split(' - ')[0] || pageTitle.split(' | ')[0] || 'Job Position',
          company: pageTitle.split(' - ')[1] || pageTitle.split(' | ')[1] || 'Company',
          location: 'Location not specified',
          description: `Job posting from ${new URL(pageUrl).hostname}`,
          url: pageUrl
        };
      }

      const result = await this.makeApiRequest('/api/saved-jobs', {
        method: 'POST',
        body: JSON.stringify({
          title: this.jobData.title,
          company: this.jobData.company,
          location: this.jobData.location,
          url: this.currentTab.url,
          description: this.jobData.description,
          platform: 'extension'
        })
      });

      if (result && !result.error) {
        this.showNotification('✅ Job saved successfully!', 'success');
      } else {
        throw new Error(result?.error || 'Failed to save job');
      }
    } catch (error) {
      console.error('Save job error:', error);
      this.showError('Failed to save job. Please try again.');
    } finally {
      this.showLoading(false);
    }
  }

  async handleGenerateCoverLetter() {
    if (!this.isAuthenticated || !this.jobData) {
      this.showError('Please ensure you\'re authenticated and on a job page');
      return;
    }

    // Check daily usage limit for free users
    try {
      const usageCheck = await this.makeApiRequest('/api/cover-letter/usage-check', {
        method: 'GET'
      });

      if (usageCheck.limitReached) {
        this.showError('You have used your daily limit of 2 cover letters. Please upgrade to Premium for unlimited access.');
        return;
      }
    } catch (error) {
      console.warn('Failed to check usage limits:', error);
    }

    this.showLoading(true);

    try {
      // Enhanced cover letter generation with extracted job data
      const coverLetterData = {
        jobData: {
          ...this.jobData,
          // Ensure we're using the extracted company and role
          company: this.jobData.company || this.jobData.companyName || 'the company',
          title: this.jobData.title || this.jobData.role || this.jobData.position || 'this position',
          location: this.jobData.location,
          description: this.jobData.description,
          requirements: this.jobData.requirements,
          url: window.location.href
        },
        userProfile: this.userProfile,
        extractedData: {
          company: this.jobData.company,
          role: this.jobData.title,
          extractedAt: new Date().toISOString()
        }
      };

      const result = await this.makeApiRequest('/api/generate-cover-letter', {
        method: 'POST',
        body: JSON.stringify(coverLetterData)
      });

      if (result && !result.error) {
        await navigator.clipboard.writeText(result.coverLetter);
        this.showNotification('✅ Cover letter generated and copied!', 'success');
        
        // Show usage information
        if (result.usageInfo) {
          setTimeout(() => {
            this.showNotification(`Daily usage: ${result.usageInfo.used}/${result.usageInfo.limit}`, 'info');
          }, 2000);
        }
        
        // Try to fill cover letter field
        chrome.tabs.sendMessage(this.currentTab.id, {
          action: 'fillCoverLetter',
          coverLetter: result.coverLetter
        });
        
      } else {
        throw new Error(result?.error || 'Failed to generate cover letter');
      }
    } catch (error) {
      console.error('Cover letter error:', error);
      
      // Handle specific error cases - check status and message from server
      if (error.status === 429 || 
          (error.message && (error.message.includes('daily limit') || error.message.includes('upgrade to Premium')))) {
        // Show the exact server error message if available, otherwise use a default premium upgrade message
        const message = (error.message && error.message.includes('daily limit')) ? 
          error.message : 
          'You have used your daily cover letter generation. Please upgrade to Premium for unlimited access.';
        this.showError(message);
      } else {
        this.showError('Failed to generate cover letter. Please try again.');
      }
    } finally {
      this.showLoading(false);
    }
  }

  async handleResumeAction() {
    this.showNotification('Resume optimization coming soon!', 'info');
  }

  async handleProfileAction() {
    chrome.tabs.create({
      url: `${API_BASE_URL}/profile`
    });
  }

  async handleHistoryAction() {
    chrome.tabs.create({
      url: `${API_BASE_URL}/applications`
    });
  }

  async trackApplication() {
    if (!this.jobData) return;

    try {
      await this.makeApiRequest('/api/extension/applications', {
        method: 'POST',
        body: JSON.stringify({
          jobTitle: this.jobData.title,
          company: this.jobData.company,
          location: this.jobData.location,
          jobUrl: this.currentTab.url,
          source: 'extension',
          status: 'applied'
        })
      });
    } catch (error) {
      console.error('Failed to track application:', error);
    }
  }

  handleKeyboardShortcuts(e) {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case '1':
          e.preventDefault();
          this.handleAutofill();
          break;
        case '2':
          e.preventDefault();
          this.handleAnalyze();
          break;
        case '3':
          e.preventDefault();
          this.handleSaveJob();
          break;
        case '4':
          e.preventDefault();
          this.handleGenerateCoverLetter();
          break;
      }
    }
  }

  enableActionButtons() {
    const buttons = ['autofillBtn', 'analyzeBtn', 'saveJobBtn', 'coverLetterBtn'];
    buttons.forEach(id => {
      const btn = document.getElementById(id);
      if (btn) {
        btn.disabled = false;
        btn.style.opacity = '1';
        btn.style.cursor = 'pointer';
      }
    });
  }

  disableActionButtons() {
    const buttons = ['autofillBtn', 'analyzeBtn', 'saveJobBtn', 'coverLetterBtn'];
    buttons.forEach(id => {
      const btn = document.getElementById(id);
      if (btn) {
        btn.disabled = true;
        btn.style.opacity = '0.5';
        btn.style.cursor = 'not-allowed';
      }
    });
  }

  // Task Management Methods
  async loadTasks() {
    if (!this.isAuthenticated) return;
    
    try {
      const response = await this.makeApiRequest('/api/tasks?limit=5&status=pending');
      const data = await response.json();
      
      if (data.success) {
        this.displayTasks(data.tasks);
        this.updateTasksCount(data.tasks.length);
      }
    } catch (error) {
      console.error('Failed to load tasks:', error);
    }
  }

  displayTasks(tasks) {
    const tasksList = document.getElementById('tasksList');
    const tasksSection = document.getElementById('tasksSection');
    
    if (!tasks || tasks.length === 0) {
      tasksList.innerHTML = '<div class="no-tasks">No pending tasks</div>';
      tasksSection.style.display = 'block';
      return;
    }

    tasksList.innerHTML = tasks.map(task => `
      <div class="task-item" data-task-id="${task.id}">
        <div class="task-checkbox ${task.status === 'completed' ? 'checked' : ''}" 
             onclick="autojobr.toggleTaskStatus(${task.id}, '${task.status === 'completed' ? 'pending' : 'completed'}')">
          ${task.status === 'completed' ? '✓' : ''}
        </div>
        <div class="task-text">${task.title}</div>
        <div class="task-priority ${task.priority || 'medium'}"></div>
      </div>
    `).join('');
    
    tasksSection.style.display = 'block';
  }

  updateTasksCount(count) {
    const tasksCount = document.getElementById('tasksCount');
    if (tasksCount) {
      tasksCount.textContent = count;
    }
  }

  async toggleTaskStatus(taskId, newStatus) {
    try {
      const response = await this.makeApiRequest(`/api/tasks/${taskId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus })
      });

      if (response && response.success) {
        await this.loadTasks(); // Refresh tasks
        this.showNotification(`Task ${newStatus === 'completed' ? 'completed' : 'reopened'}!`, 'success');
      }
    } catch (error) {
      console.error('Failed to update task:', error);
      this.showNotification('Failed to update task', 'error');
    }
  }

  async handleAddTask() {
    this.showTaskModal();
  }

  initializeTaskModal() {
    const modal = document.getElementById('taskModal');
    const closeBtn = document.getElementById('closeTaskModal');
    const cancelBtn = document.getElementById('cancelTaskModal');
    const submitBtn = document.getElementById('submitTask');
    const form = document.getElementById('taskForm');
    const priorityBtns = document.querySelectorAll('.priority-btn');
    const templateBtns = document.querySelectorAll('.template-btn');

    // Close modal handlers
    closeBtn.addEventListener('click', () => this.hideTaskModal());
    cancelBtn.addEventListener('click', () => this.hideTaskModal());
    
    // Click outside to close
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        this.hideTaskModal();
      }
    });

    // ESC key to close
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('show')) {
        this.hideTaskModal();
      }
    });

    // Priority selection
    priorityBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        priorityBtns.forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
      });
    });

    // Form submission
    submitBtn.addEventListener('click', () => this.submitTaskForm());
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.submitTaskForm();
    });

    // Real-time title validation
    const titleInput = document.getElementById('taskTitle');
    titleInput.addEventListener('input', () => this.validateTaskTitle());

    // Template selection
    templateBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        templateBtns.forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        this.applyTemplate(btn.dataset.template);
      });
    });
  }

  getTaskTemplates() {
    return {
      follow_up: {
        title: 'Follow up on application at {company}',
        description: 'Send a polite follow-up email to check on application status. Include specific details about the role and express continued interest.',
        priority: 'medium',
        category: 'job_application',
        taskType: 'followup',
        daysOffset: 3
      },
      interview_prep: {
        title: 'Prepare for interview at {company}',
        description: 'Research the company, review job requirements, prepare answers for common questions, and practice technical skills if needed.',
        priority: 'high',
        category: 'interview',
        taskType: 'interview_prep',
        daysOffset: 1
      },
      thank_you: {
        title: 'Send thank you note after interview',
        description: 'Send a personalized thank you email within 24 hours of the interview. Reference specific discussion points and reiterate interest.',
        priority: 'high',
        category: 'job_application',
        taskType: 'followup',
        daysOffset: 0,
        hoursOffset: 2
      },
      research: {
        title: 'Research {company} before applying',
        description: 'Research company culture, recent news, products/services, competitors, and key team members. Prepare thoughtful questions.',
        priority: 'medium',
        category: 'career_planning',
        taskType: 'reminder',
        daysOffset: 0,
        hoursOffset: 2
      },
      custom: {
        title: '',
        description: '',
        priority: 'medium',
        category: 'general',
        taskType: 'reminder',
        daysOffset: 1
      }
    };
  }

  async applyTemplate(templateKey) {
    const templates = this.getTaskTemplates();
    const template = templates[templateKey];
    
    if (!template) return;

    // Try to extract company name from current page
    let companyName = await this.extractCompanyName();
    
    // Populate form fields
    const titleInput = document.getElementById('taskTitle');
    const descriptionInput = document.getElementById('taskDescription');
    const categorySelect = document.getElementById('taskCategory');
    const dueDateInput = document.getElementById('taskDueDate');

    // Set title and description
    titleInput.value = template.title.replace('{company}', companyName || '[Company Name]');
    descriptionInput.value = template.description;

    // Set priority
    document.querySelectorAll('.priority-btn').forEach(btn => {
      btn.classList.remove('selected');
    });
    const priorityBtn = document.querySelector(`.priority-btn.${template.priority}`);
    if (priorityBtn) {
      priorityBtn.classList.add('selected');
    }

    // Set category
    categorySelect.value = template.category;

    // Set due date based on template
    const dueDate = new Date();
    if (template.daysOffset) {
      dueDate.setDate(dueDate.getDate() + template.daysOffset);
    }
    if (template.hoursOffset) {
      dueDate.setHours(dueDate.getHours() + template.hoursOffset);
    } else {
      dueDate.setHours(9, 0, 0, 0); // Default to 9 AM
    }

    const year = dueDate.getFullYear();
    const month = String(dueDate.getMonth() + 1).padStart(2, '0');
    const day = String(dueDate.getDate()).padStart(2, '0');
    const hours = String(dueDate.getHours()).padStart(2, '0');
    const minutes = String(dueDate.getMinutes()).padStart(2, '0');
    dueDateInput.value = `${year}-${month}-${day}T${hours}:${minutes}`;

    // Trigger validation
    this.validateTaskTitle();

    // Focus on title for editing if it contains placeholder
    if (titleInput.value.includes('[Company Name]')) {
      titleInput.focus();
      titleInput.select();
    }
  }

  async extractCompanyName() {
    try {
      // Try to get company name from page title or meta tags
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab) return null;

      // Execute script to extract company name
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: () => {
          // Try multiple methods to extract company name
          
          // Method 1: LinkedIn job posts
          const linkedinCompany = document.querySelector('.job-details-jobs-unified-top-card__company-name a')?.textContent?.trim();
          if (linkedinCompany) return linkedinCompany;

          // Method 2: Indeed job posts
          const indeedCompany = document.querySelector('[data-testid="inlineHeader-companyName"] a')?.textContent?.trim();
          if (indeedCompany) return indeedCompany;

          // Method 3: Glassdoor
          const glassdoorCompany = document.querySelector('.employer-name')?.textContent?.trim();
          if (glassdoorCompany) return glassdoorCompany;

          // Method 4: Company career pages (look for common patterns)
          const metaTitle = document.querySelector('meta[property="og:site_name"]')?.content?.trim();
          if (metaTitle && !metaTitle.includes('job') && !metaTitle.includes('career')) return metaTitle;

          // Method 5: Page title extraction
          const title = document.title;
          const titleParts = title.split(' - ');
          if (titleParts.length > 1) {
            const potentialCompany = titleParts[titleParts.length - 1];
            if (!potentialCompany.includes('job') && !potentialCompany.includes('career')) {
              return potentialCompany;
            }
          }

          // Method 6: URL hostname as fallback
          const hostname = window.location.hostname.replace('www.', '');
          const domainParts = hostname.split('.');
          if (domainParts.length >= 2) {
            return domainParts[domainParts.length - 2];
          }

          return null;
        }
      });

      return results[0]?.result || null;
    } catch (error) {
      console.error('Failed to extract company name:', error);
      return null;
    }
  }

  showTaskModal() {
    const modal = document.getElementById('taskModal');
    const form = document.getElementById('taskForm');
    
    // Reset form
    form.reset();
    
    // Reset templates to custom
    document.querySelectorAll('.template-btn').forEach(btn => {
      btn.classList.remove('selected');
    });
    const customBtn = document.querySelector('.template-btn[data-template="custom"]');
    if (customBtn) {
      customBtn.classList.add('selected');
    }
    
    // Reset priority to medium
    document.querySelectorAll('.priority-btn').forEach(btn => {
      btn.classList.remove('selected');
    });
    const mediumBtn = document.querySelector('.priority-btn.medium');
    if (mediumBtn) {
      mediumBtn.classList.add('selected');
    }
    
    // Clear any errors and initialize submit button as disabled
    this.clearTaskFormErrors();
    document.getElementById('submitTask').disabled = true;
    
    // Set default due date to tomorrow at 9 AM (local time)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);
    const year = tomorrow.getFullYear();
    const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const day = String(tomorrow.getDate()).padStart(2, '0');
    const hours = String(tomorrow.getHours()).padStart(2, '0');
    const minutes = String(tomorrow.getMinutes()).padStart(2, '0');
    document.getElementById('taskDueDate').value = `${year}-${month}-${day}T${hours}:${minutes}`;
    
    // Show modal
    modal.classList.add('show');
    
    // Focus title input
    setTimeout(() => {
      document.getElementById('taskTitle').focus();
    }, 200);
  }

  hideTaskModal() {
    const modal = document.getElementById('taskModal');
    modal.classList.remove('show');
  }

  validateTaskTitle() {
    const titleInput = document.getElementById('taskTitle');
    const titleError = document.getElementById('titleError');
    const submitBtn = document.getElementById('submitTask');
    
    const isValid = titleInput.value.trim().length > 0;
    
    if (!isValid && titleInput.value.length > 0) {
      titleError.style.display = 'block';
      titleInput.style.borderColor = '#ef4444';
    } else {
      titleError.style.display = 'none';
      titleInput.style.borderColor = isValid ? '#22c55e' : '#e5e7eb';
    }
    
    submitBtn.disabled = !isValid;
    return isValid;
  }

  clearTaskFormErrors() {
    document.getElementById('titleError').style.display = 'none';
    document.getElementById('taskTitle').style.borderColor = '#e5e7eb';
    document.getElementById('submitTask').disabled = false;
  }

  getSelectedPriority() {
    const selected = document.querySelector('.priority-btn.selected');
    return selected ? selected.dataset.priority : 'medium';
  }

  async submitTaskForm() {
    const titleInput = document.getElementById('taskTitle');
    const descriptionInput = document.getElementById('taskDescription');
    const categorySelect = document.getElementById('taskCategory');
    const dueDateInput = document.getElementById('taskDueDate');
    const submitBtn = document.getElementById('submitTask');

    // Validate form
    if (!this.validateTaskTitle()) {
      titleInput.focus();
      return;
    }

    // Get selected template to determine taskType
    const selectedTemplate = document.querySelector('.template-btn.selected');
    const templateKey = selectedTemplate ? selectedTemplate.dataset.template : 'custom';
    const templates = this.getTaskTemplates();
    const template = templates[templateKey] || templates.custom;

    const taskData = {
      title: titleInput.value.trim(),
      description: descriptionInput.value.trim() || null,
      priority: this.getSelectedPriority(),
      category: categorySelect.value,
      taskType: template.taskType,
      dueDateTime: dueDateInput.value ? new Date(dueDateInput.value).toISOString() : null,
      reminderEnabled: !!dueDateInput.value
    };

    try {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Creating...';

      const response = await this.makeApiRequest('/api/tasks', {
        method: 'POST',
        body: JSON.stringify(taskData)
      });

      if (response && response.success) {
        await this.loadTasks(); // Refresh tasks
        this.hideTaskModal();
        this.showNotification(`✨ Task "${taskData.title}" created successfully!`, 'success');
      } else {
        throw new Error(response?.message || 'Failed to create task');
      }
    } catch (error) {
      console.error('Failed to create task:', error);
      this.showNotification('Failed to create task', 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Create Task';
    }
  }

  showLoading(show = true) {
    const content = document.querySelector('.content');
    const loading = document.getElementById('loading');
    
    if (show) {
      content.style.display = 'none';
      loading.style.display = 'block';
    } else {
      content.style.display = 'block';
      loading.style.display = 'none';
    }
  }

  showNotification(message, type = 'success') {
    // Remove existing notifications
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => notification.classList.add('show'), 100);
    
    // Remove after 3 seconds
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  showError(message) {
    this.showNotification(`❌ ${message}`, 'error');
  }

  openDashboard() {
    chrome.tabs.create({
      url: `${API_BASE_URL}/applications`
    });
  }
}

// Make popup instance globally accessible for task management
let autojobr;

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  autojobr = new AutoJobrPopup();
  
  // Make methods globally accessible for onclick handlers
  window.autojobr = autojobr;
});