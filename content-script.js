// Enhanced AutoJobr Content Script v2.0 - Advanced Job Board Auto-Fill System
class AutoJobrContentScript {
  constructor() {
    this.isInitialized = false;
    this.currentJobData = null;
    this.fillInProgress = false;
    this.currentSite = this.detectSite();
    this.fieldMappings = this.initializeFieldMappings();
    this.observers = [];
    this.fillHistory = [];
    this.smartSelectors = new Map();
    this.filledFields = new Set(); // Track filled fields to prevent loops
    this.formState = { currentPage: 1, hasNextPage: false, hasSubmit: false };
    this.analysisInProgress = false; // Prevent duplicate analysis
    this.lastAnalysisUrl = null; // Track last analyzed URL
    this.analysisDebounceTimer = null; // Debounce analysis calls
    this.cachedProfile = null; // Cache profile to prevent excessive requests
    this.lastAuthCheck = 0; // Track last authentication check
    this.init();
  }

  init() {
    if (this.isInitialized) return;
    
    try {
      this.injectEnhancedUI();
      this.setupMessageListener();
      this.observePageChanges();
      this.setupKeyboardShortcuts();
      this.initializeSmartSelectors();
      this.setupApplicationTracking(); // Setup tracking once during initialization
      
      // Setup automatic job analysis with debouncing
      this.setupAutoAnalysis();
      this.isInitialized = true;
      
      // Mark as loaded for background script
      window.autojobrContentScriptLoaded = true;
      
      console.log('🚀 AutoJobr extension v2.0 initialized on:', this.currentSite);
    } catch (error) {
      console.error('AutoJobr initialization error:', error);
    }
  }

  detectSite() {
    const hostname = window.location.hostname.toLowerCase();
    const pathname = window.location.pathname.toLowerCase();
    
    const siteMap = {
      'linkedin.com': 'linkedin',
      'indeed.com': 'indeed',
      'glassdoor.com': 'glassdoor',
      'ziprecruiter.com': 'ziprecruiter',
      'monster.com': 'monster',
      'careerbuilder.com': 'careerbuilder',
      'dice.com': 'dice',
      'stackoverflow.com': 'stackoverflow',
      'angel.co': 'angel',
      'wellfound.com': 'wellfound',
      'greenhouse.io': 'greenhouse',
      'lever.co': 'lever',
      'workday.com': 'workday',
      'myworkdayjobs.com': 'workday',
      'icims.com': 'icims',
      'smartrecruiters.com': 'smartrecruiters',
      'bamboohr.com': 'bamboohr',
      'ashbyhq.com': 'ashby',
      'careers.google.com': 'google',
      'amazon.jobs': 'amazon',
      'microsoft.com': 'microsoft',
      'apple.com': 'apple',
      'meta.com': 'meta',
      'autojobr.com': 'autojobr',
      'naukri.com': 'naukri',
      'shine.com': 'shine',
      'timesjobs.com': 'timesjobs',
      'freshersjobs.com': 'freshersjobs',
      'instahyre.com': 'instahyre'
    };

    for (const [domain, site] of Object.entries(siteMap)) {
      if (hostname.includes(domain)) {
        return site;
      }
    }
    
    return 'generic';
  }

  initializeFieldMappings() {
    return {
      // Personal Information
      firstName: {
        patterns: ['firstName', 'first_name', 'fname', 'first-name', 'given-name', 'forename', 'given name', 'legal first name', 'first legal name', 'givenname', 'firstname', 'first name', 'name_first', 'applicant_first_name', 'candidate-first-name'],
        types: ['text'],
        priority: 10
      },
      lastName: {
        patterns: ['lastName', 'last_name', 'lname', 'last-name', 'family-name', 'surname', 'family name', 'legal last name', 'last legal name', 'familyname', 'lastname', 'last name', 'name_last', 'applicant_last_name', 'candidate-last-name'],
        types: ['text'],
        priority: 10
      },
      fullName: {
        patterns: ['fullName', 'full_name', 'name', 'full-name', 'candidate-name', 'applicant-name', 'legal name', 'legal full name', 'full legal name'],
        types: ['text'],
        priority: 9
      },
      email: {
        patterns: ['email', 'emailAddress', 'email_address', 'email-address', 'e-mail', 'mail'],
        types: ['email', 'text'],
        priority: 10
      },
      phone: {
        patterns: ['phone', 'phoneNumber', 'phone_number', 'phone-number', 'telephone', 'mobile', 'cell', 'phonenumber', 'mobilephone', 'mobile_phone', 'contact_phone', 'applicant_phone', 'home_phone', 'work_phone', 'primary_phone', 'contact_number', 'tel'],
        types: ['tel', 'text'],
        priority: 9
      },
      
      // Address
      address: {
        patterns: ['address', 'street', 'streetAddress', 'street_address', 'address1', 'addr1'],
        types: ['text'],
        priority: 8
      },
      city: {
        patterns: ['city', 'locality', 'town'],
        types: ['text'],
        priority: 8
      },
      state: {
        patterns: ['state', 'region', 'province', 'st'],
        types: ['text', 'select-one'],
        priority: 8
      },
      zipCode: {
        patterns: ['zipCode', 'zip', 'postalCode', 'postal_code', 'postal-code', 'postcode'],
        types: ['text'],
        priority: 8
      },
      country: {
        patterns: ['country', 'nation'],
        types: ['text', 'select-one'],
        priority: 7
      },
      
      // Professional
      currentTitle: {
        patterns: ['currentTitle', 'title', 'jobTitle', 'job_title', 'position', 'role', 'current-position', 'job-title'],
        types: ['text'],
        priority: 9
      },
      company: {
        patterns: ['company', 'employer', 'organization', 'current_company', 'currentCompany', 'current-employer', 'company_name'],
        types: ['text'],
        priority: 8
      },
      experience: {
        patterns: ['experience', 'yearsExperience', 'years_experience', 'years-experience', 'exp', 'experience_level', 'years-experience'],
        types: ['text', 'number', 'select-one'],
        priority: 7
      },
      
      // Education
      university: {
        patterns: ['university', 'school', 'college', 'education', 'institution'],
        types: ['text'],
        priority: 7
      },
      degree: {
        patterns: ['degree', 'education_level', 'qualification', 'degree_type', 'education-level'],
        types: ['text', 'select-one'],
        priority: 7
      },
      major: {
        patterns: ['major', 'field', 'study', 'specialization', 'concentration'],
        types: ['text'],
        priority: 7
      },
      
      // Links
      linkedin: {
        patterns: ['linkedin', 'linkedinUrl', 'linkedin_url', 'linkedin-url', 'li-url'],
        types: ['url', 'text'],
        priority: 6
      },
      github: {
        patterns: ['github', 'githubUrl', 'github_url', 'github-url'],
        types: ['url', 'text'],
        priority: 6
      },
      portfolio: {
        patterns: ['portfolio', 'website', 'portfolioUrl', 'personal_website'],
        types: ['url', 'text'],
        priority: 6
      },
      
      // Work Screening Questions
      currentlyEmployed: {
        patterns: ['currentlyEmployed', 'currently_employed', 'employment_status', 'employed', 'currently-employed'],
        types: ['select-one', 'radio', 'checkbox'],
        priority: 7
      },
      canContactEmployer: {
        patterns: ['canContactEmployer', 'contact_employer', 'employer_contact', 'employer_contact_permission', 'contact-current-employer'],
        types: ['select-one', 'radio', 'checkbox'],
        priority: 7
      },
      willingToTravel: {
        patterns: ['willingToTravel', 'willing_to_travel', 'travel_willingness', 'travel-willing', 'can-travel'],
        types: ['select-one', 'radio', 'checkbox'],
        priority: 7
      },
      
      // Work Authorization
      workAuth: {
        patterns: ['workAuthorization', 'work_authorization', 'eligible', 'authorized', 'legal', 'work_eligibility', 'employment_eligibility'],
        types: ['select-one', 'radio', 'checkbox'],
        priority: 8
      },
      visa: {
        patterns: ['visa', 'visaStatus', 'visa_status', 'immigration', 'sponsor'],
        types: ['select-one', 'radio', 'checkbox'],
        priority: 7
      },
      
      // Skills and Technical
      skills: {
        patterns: ['skills', 'technical_skills', 'technologies', 'programming', 'tech_stack', 'competencies'],
        types: ['text', 'textarea'],
        priority: 7
      },
      
      // Salary and Compensation
      salary: {
        patterns: ['salary', 'compensation', 'expected_salary', 'desired_salary', 'pay_rate', 'wage', 'salary_expectation'],
        types: ['text', 'number'],
        priority: 6
      },
      
      // Additional fields
      description: {
        patterns: ['description', 'summary', 'about', 'bio', 'overview', 'profile_summary', 'personal_statement'],
        types: ['textarea', 'text'],
        priority: 6
      },
      
      // Resume/Cover Letter
      resume: {
        patterns: ['resume', 'cv', 'resumeUpload', 'resume_upload', 'curriculum', 'attachment', 'document', 'file'],
        types: ['file'],
        priority: 9,
        autoFill: true
      },
      coverLetter: {
        patterns: ['coverLetter', 'cover_letter', 'covering_letter', 'motivation'],
        types: ['textarea', 'text'],
        priority: 8
      },
      
      // Personal Details
      gender: {
        patterns: ['gender', 'sex', 'gender_identity', 'genderIdentity', 'gender-identity'],
        types: ['radio', 'select-one'],
        priority: 6,
        values: {
          male: ['male', 'man', 'm'],
          female: ['female', 'woman', 'f'], 
          other: ['other', 'non-binary', 'nonbinary', 'prefer-not-to-say', 'decline']
        }
      },
      
      veteranStatus: {
        patterns: ['veteran', 'veteran_status', 'veteranStatus', 'military', 'armed_forces', 'service_member'],
        types: ['radio', 'select-one'],
        priority: 7,
        values: {
          not_veteran: ['no', 'not-veteran', 'not_veteran', 'civilian', 'none'],
          veteran: ['yes', 'veteran', 'military-veteran'],
          disabled_veteran: ['disabled-veteran', 'disabled_veteran', 'disabled']
        }
      },
      
      // Additional Social Links
      twitter: {
        patterns: ['twitter', 'twitterUrl', 'twitter_url', 'twitter-url', 'twitter_handle'],
        types: ['url', 'text'],
        priority: 5
      },
      
      personalWebsite: {
        patterns: ['personalWebsite', 'personal_website', 'website', 'homepage', 'blog', 'personal_site'],
        types: ['url', 'text'],
        priority: 5
      },
      
      // Work Screening Questions (Boolean responses)
      currentlyEmployed: {
        patterns: ['currently_employed', 'currentlyEmployed', 'employed', 'current_job', 'working'],
        types: ['radio', 'select-one', 'checkbox'],
        priority: 8,
        values: {
          yes: ['yes', 'true', 'currently-employed', 'employed'],
          no: ['no', 'false', 'unemployed', 'not-employed']
        }
      },
      
      canContactEmployer: {
        patterns: ['contact_employer', 'contactEmployer', 'current_employer', 'employer_contact', 'reference_check'],
        types: ['radio', 'select-one', 'checkbox'],
        priority: 7,
        values: {
          yes: ['yes', 'true', 'authorized', 'allowed'],
          no: ['no', 'false', 'not-authorized', 'do-not-contact']
        }
      },
      
      willingToWorkOvertime: {
        patterns: ['overtime', 'work_overtime', 'extra_hours', 'extended_hours', 'flexible_hours'],
        types: ['radio', 'select-one', 'checkbox'],
        priority: 6,
        values: {
          yes: ['yes', 'true', 'willing', 'available'],
          no: ['no', 'false', 'not-willing', 'unavailable']
        }
      },
      
      willingToTravel: {
        patterns: ['travel', 'willing_to_travel', 'business_travel', 'travel_required', 'relocation'],
        types: ['radio', 'select-one', 'checkbox'],
        priority: 6,
        values: {
          yes: ['yes', 'true', 'willing', 'available'],
          no: ['no', 'false', 'not-willing', 'unavailable']
        }
      },
      
      travelPercentage: {
        patterns: ['travel_percentage', 'travel_percent', 'travel_amount', 'travel_frequency'],
        types: ['text', 'number', 'select-one'],
        priority: 5
      },
      
      // Application-Specific Questions
      howDidYouHear: {
        patterns: ['hear_about', 'how_did_you_hear', 'referral_source', 'source', 'where_did_you_hear', 'how_heard_about_us'],
        types: ['radio', 'select-one'],
        priority: 7,
        values: {
          linkedin: ['linkedin', 'linked-in'],
          indeed: ['indeed'],
          company_website: ['company-website', 'website', 'company_site'],
          referral: ['referral', 'employee-referral', 'friend', 'colleague'],
          job_board: ['job-board', 'job_site', 'job_portal'],
          social_media: ['social-media', 'facebook', 'twitter'],
          search_engine: ['google', 'search', 'search-engine'],
          other: ['other']
        }
      },
      
      whyInterestedRole: {
        patterns: ['why_interested', 'interest_reason', 'motivation', 'why_apply', 'reason_applying', 'position_interest'],
        types: ['textarea', 'text'],
        priority: 6
      },
      
      whyInterestedCompany: {
        patterns: ['why_company', 'company_interest', 'company_motivation', 'why_work_here'],
        types: ['textarea', 'text'],
        priority: 6
      },
      
      careerGoals: {
        patterns: ['career_goals', 'future_goals', 'aspirations', 'career_objectives', 'long_term_goals'],
        types: ['textarea', 'text'],
        priority: 5
      },
      
      startDate: {
        patterns: ['start_date', 'startDate', 'available_date', 'availability', 'when_can_start'],
        types: ['date', 'text'],
        priority: 7
      },
      
      gpa: {
        patterns: ['gpa', 'grade_point', 'academic_record', 'grades'],
        types: ['text', 'number'],
        priority: 5
      },
      
      // Professional References
      referenceName: {
        patterns: ['reference_name', 'referenceName', 'ref_name', 'contact_name', 'reference_1_name'],
        types: ['text'],
        priority: 7
      },
      
      referenceTitle: {
        patterns: ['reference_title', 'referenceTitle', 'ref_title', 'contact_title'],
        types: ['text'],
        priority: 6
      },
      
      referenceCompany: {
        patterns: ['reference_company', 'referenceCompany', 'ref_company', 'contact_company'],
        types: ['text'],
        priority: 6
      },
      
      referenceEmail: {
        patterns: ['reference_email', 'referenceEmail', 'ref_email', 'contact_email'],
        types: ['email', 'text'],
        priority: 7
      },
      
      referencePhone: {
        patterns: ['reference_phone', 'referencePhone', 'ref_phone', 'contact_phone'],
        types: ['tel', 'text'],
        priority: 6
      },
      
      referenceRelationship: {
        patterns: ['reference_relationship', 'relationship', 'how_do_you_know', 'connection', 'reference_1_relationship'],
        types: ['select-one', 'text'],
        priority: 6,
        values: {
          supervisor: ['supervisor', 'manager', 'boss'],
          colleague: ['colleague', 'coworker', 'peer'],
          client: ['client', 'customer'],
          mentor: ['mentor', 'advisor'],
          other: ['other']
        }
      }
    };
  }

  initializeSmartSelectors() {
    // Site-specific smart selectors for better accuracy
    const siteSelectors = {
      linkedin: {
        forms: ['.jobs-apply-form', '.application-outlet', '.jobs-easy-apply-modal'],
        skipButtons: ['.artdeco-button--secondary', '[data-test-modal-close-btn]'],
        nextButtons: ['.artdeco-button--primary', '[aria-label*="Continue"]'],
        submitButtons: ['.artdeco-button--primary', '[aria-label*="Submit"]']
      },
      indeed: {
        forms: ['.ia-BasePage-content form', '.jobsearch-ApplyIndeed-content form'],
        skipButtons: ['.ia-continueButton--secondary'],
        nextButtons: ['.ia-continueButton', '.np-button'],
        submitButtons: ['.ia-continueButton--primary']
      },
      workday: {
        forms: ['[data-automation-id="jobApplication"]', '.css-1hwfws3'],
        skipButtons: ['[data-automation-id="cancelButton"]'],
        nextButtons: ['[data-automation-id="continueButton"]'],
        submitButtons: ['[data-automation-id="submitButton"]']
      }
    };

    this.smartSelectors = siteSelectors[this.currentSite] || siteSelectors.generic || {};
  }

  injectEnhancedUI() {
    if (document.getElementById('autojobr-overlay')) return;

    const overlay = document.createElement('div');
    overlay.id = 'autojobr-overlay';
    overlay.innerHTML = `
      <div class="autojobr-widget" style="display: none;">
        <div class="autojobr-header">
          <div class="autojobr-logo">
            <div class="autojobr-icon">A</div>
            <span>AutoJobr v2.0</span>
          </div>
          <div class="autojobr-controls">
            <button class="autojobr-minimize" title="Minimize">−</button>
            <button class="autojobr-close" title="Close">×</button>
          </div>
        </div>
        
        <div class="autojobr-content">
          <div class="autojobr-status" id="autojobr-status">
            <div class="status-icon">🎯</div>
            <div class="status-text">Job detected - Ready to auto-fill</div>
            <div class="status-progress" id="autojobr-progress" style="display: none;">
              <div class="progress-bar"></div>
            </div>
          </div>
          
          <div class="autojobr-job-info" id="autojobr-job-info" style="display: none;">
            <div class="job-title" id="autojobr-job-title"></div>
            <div class="job-company" id="autojobr-job-company"></div>
            <div class="job-match" id="autojobr-job-match"></div>
          </div>
          
          <div class="autojobr-actions">
            <button class="autojobr-btn primary" id="autojobr-autofill">
              <span class="btn-icon">⚡</span>
              <span class="btn-text">Smart Auto-fill</span>
              <span class="btn-shortcut">Ctrl+A</span>
            </button>
            
            <div class="action-row">
              <button class="autojobr-btn secondary" id="autojobr-analyze">
                <span class="btn-icon">📊</span>
                <span>Analyze</span>
              </button>
              <button class="autojobr-btn secondary" id="autojobr-save-job">
                <span class="btn-icon">💾</span>
                <span>Save</span>
              </button>
              <button class="autojobr-btn secondary" id="autojobr-cover-letter">
                <span class="btn-icon">📝</span>
                <span>Cover Letter</span>
              </button>
              <button class="autojobr-btn secondary" id="autojobr-upload-resume">
                <span class="btn-icon">📄</span>
                <span>Upload Resume</span>
              </button>
            </div>
          </div>
          
          <div class="autojobr-features">
            <div class="feature-toggle">
              <input type="checkbox" id="smart-fill" checked>
              <label for="smart-fill">Smart Fill Mode</label>
            </div>
            <div class="feature-toggle">
              <input type="checkbox" id="auto-submit">
              <label for="auto-submit">Auto Submit</label>
            </div>
            <div class="feature-toggle">
              <input type="checkbox" id="auto-resume" checked>
              <label for="auto-resume">Auto Resume Upload</label>
            </div>
          </div>
          
          <div class="autojobr-tasks" id="autojobr-tasks" style="display: none;">
            <div class="tasks-header">
              <span class="tasks-title">📋 Pending Tasks</span>
              <span class="tasks-count" id="tasks-count">0</span>
            </div>
            <div class="tasks-list" id="tasks-list"></div>
          </div>
          
          <div class="autojobr-stats" id="autojobr-stats" style="display: none;">
            <div class="stat-item">
              <span class="stat-label">Fields Found:</span>
              <span class="stat-value" id="fields-found">0</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Fields Filled:</span>
              <span class="stat-value" id="fields-filled">0</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Success Rate:</span>
              <span class="stat-value" id="success-rate">0%</span>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    this.attachEnhancedUIEventListeners();
    this.makeWidgetDraggable();
    
    // Load user tasks when widget is displayed
    this.loadUserTasks();
  }

  attachEnhancedUIEventListeners() {
    // Main action buttons
    document.getElementById('autojobr-autofill')?.addEventListener('click', () => this.handleSmartAutofill());
    document.getElementById('autojobr-analyze')?.addEventListener('click', () => this.handleAnalyze());
    document.getElementById('autojobr-save-job')?.addEventListener('click', () => this.handleSaveJob());
    document.getElementById('autojobr-cover-letter')?.addEventListener('click', () => this.handleCoverLetter());
    document.getElementById('autojobr-upload-resume')?.addEventListener('click', () => this.handleResumeUpload());

    // Widget controls
    // Enhanced close button with better event handling
    const closeBtn = document.querySelector('.autojobr-close');
    const minimizeBtn = document.querySelector('.autojobr-minimize');
    
    if (closeBtn) {
      closeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.hideWidget();
      });
      // Add touch event for mobile
      closeBtn.addEventListener('touchend', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.hideWidget();
      });
    }
    
    if (minimizeBtn) {
      minimizeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.minimizeWidget();
      });
      minimizeBtn.addEventListener('touchend', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.minimizeWidget();
      });
    }

    // Feature toggles
    document.getElementById('smart-fill')?.addEventListener('change', (e) => {
      chrome.storage.sync.set({ smartFillMode: e.target.checked });
    });

    document.getElementById('auto-submit')?.addEventListener('change', (e) => {
      chrome.storage.sync.set({ autoSubmitMode: e.target.checked });
    });
    
    document.getElementById('auto-resume')?.addEventListener('change', (e) => {
      chrome.storage.sync.set({ autoResumeMode: e.target.checked });
    });
  }

  makeWidgetDraggable() {
    const widget = document.querySelector('.autojobr-widget');
    const header = document.querySelector('.autojobr-header');
    
    if (!widget || !header) return;

    let isDragging = false;
    let currentX;
    let currentY;
    let initialX;
    let initialY;
    let xOffset = 0;
    let yOffset = 0;

    header.addEventListener('mousedown', dragStart);
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', dragEnd);

    function dragStart(e) {
      initialX = e.clientX - xOffset;
      initialY = e.clientY - yOffset;

      if (e.target === header || header.contains(e.target)) {
        isDragging = true;
        widget.style.cursor = 'grabbing';
      }
    }

    function drag(e) {
      if (isDragging) {
        e.preventDefault();
        currentX = e.clientX - initialX;
        currentY = e.clientY - initialY;

        xOffset = currentX;
        yOffset = currentY;

        widget.style.transform = `translate(${currentX}px, ${currentY}px)`;
      }
    }

    function dragEnd() {
      initialX = currentX;
      initialY = currentY;
      isDragging = false;
      widget.style.cursor = 'default';
    }
  }

  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 'a':
            if (e.shiftKey) {
              e.preventDefault();
              this.handleSmartAutofill();
            }
            break;
          case 'j':
            if (e.shiftKey) {
              e.preventDefault();
              this.handleAnalyze();
            }
            break;
          case 's':
            if (e.shiftKey) {
              e.preventDefault();
              this.handleSaveJob();
            }
            break;
        }
      }
    });
  }

  setupMessageListener() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      switch (message.action) {
        case 'extractJobDetails':
          this.extractJobDetails().then(sendResponse);
          return true;
          
        case 'detectJobPosting':
          this.detectJobPosting().then(sendResponse);
          return true;
          
        case 'startAutofill':
          this.startSmartAutofill(message.userProfile).then(sendResponse);
          return true;
          
        case 'fillCoverLetter':
          this.fillCoverLetter(message.coverLetter).then(sendResponse);
          return true;
          
        case 'analyzeJob':
          this.analyzeCurrentJob().then(sendResponse);
          return true;

        case 'saveCurrentJob':
          this.saveCurrentJob().then(sendResponse);
          return true;
          
        default:
          sendResponse({ success: false, error: 'Unknown action' });
      }
    });
  }

  observePageChanges() {
    // Enhanced mutation observer for SPA navigation
    let currentUrl = window.location.href;
    
    const observer = new MutationObserver((mutations) => {
      // URL changes are now handled by setupAutoAnalysis debounced function
      // No need for additional URL change detection here

      // Check for form changes
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const forms = node.querySelectorAll ? node.querySelectorAll('form') : [];
              if (forms.length > 0 || node.tagName === 'FORM') {
                setTimeout(() => this.analyzeNewForms(), 500);
              }
            }
          });
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'id']
    });

    this.observers.push(observer);

    // URL changes are now handled by setupAutoAnalysis debounced function
    // Removed duplicate event listeners to prevent multiple analysis calls
  }

  async detectJobPosting() {
    try {
      // First check if this is actually a job page
      if (!this.isJobPage()) {
        this.hideWidget();
        return { success: false, reason: 'Not a job page' };
      }

      const jobData = await this.extractJobDetails();
      
      if (jobData.success && jobData.jobData.title) {
        this.currentJobData = jobData.jobData;
        // Widget should already be visible from setupAutoAnalysis
        this.updateJobInfo(jobData.jobData);
        
        return { success: true, jobData: jobData.jobData };
      } else {
        // Don't hide widget if job extraction fails - keep it visible
        console.log('Job extraction failed, but keeping widget visible for manual use');
        return { success: false, reason: 'Job extraction failed' };
      }
    } catch (error) {
      console.error('Job detection error:', error);
      return { success: false, error: error.message };
    }
  }

  isJobPage() {
    const url = window.location.href.toLowerCase();
    const hostname = window.location.hostname.toLowerCase();
    const pathname = window.location.pathname.toLowerCase();
    
    // Enhanced site-specific job page detection including Indian job sites
    const jobPagePatterns = {
      'linkedin.com': ['/jobs/', '/job/', '/jobs/view/', '/jobs/search/', 'jobs/collections/'],
      'indeed.com': ['/job/', '/viewjob', '/jobs/', '/job-'],
      'glassdoor.com': ['/job/', '/jobs/', '/job-listing/'],
      'ziprecruiter.com': ['/jobs/', '/job/', '/c/'],
      'monster.com': ['/job/', '/jobs/', '/job-openings/'],
      'careerbuilder.com': ['/job/', '/jobs/', '/job-'],
      'dice.com': ['/jobs/', '/job/', '/job-detail/'],
      'stackoverflow.com': ['/jobs/', '/job/'],
      'angel.co': ['/job/', '/jobs/', '/company/', '/job-'],
      'wellfound.com': ['/job/', '/jobs/', '/company/', '/job-'],
      'greenhouse.io': ['/job/', '/jobs/', '/job_app/'],
      'lever.co': ['/jobs/', '/job/', '/postings/'],
      'workday.com': ['/job/', '/jobs/', '/en-us/job/', '/job_', '/job-', '/jobs/', '/job_app', '/apply', '/careers/job/', '/en/job/', '/job_detail'],
      'myworkdayjobs.com': ['/job/', '/jobs/', '/job_', '/job-', '/apply', '/job_detail', '/job_app'],
      'icims.com': ['/job/', '/jobs/', '/job_', '/apply'],
      'smartrecruiters.com': ['/job/', '/jobs/', '/postings/'],
      'bamboohr.com': ['/job/', '/jobs/', '/careers/'],
      'ashbyhq.com': ['/job/', '/jobs/', '/posting/'],
      'careers.google.com': ['/job/', '/jobs/', '/careers/'],
      'amazon.jobs': ['/job/', '/jobs/', '/en/'],
      'microsoft.com': ['/job/', '/jobs/', '/careers/job-search/', '/careers/us/'],
      'apple.com': ['/job/', '/jobs/', '/careers/'],
      'meta.com': ['/job/', '/jobs/', '/careers/'],
      'autojobr.com': ['/jobs/', '/job/', '/applications/', '/dashboard', '/job-discovery/', '/view-job/', '/post-job'],
      // Indian job sites
      'naukri.com': ['/job-listings/', '/jobs/', '/job/', '/job-detail/', '/jobdetail/', '/job_detail', '/recruiter/job/', '/jobs-listings/'],
      'shine.com': ['/job/', '/jobs/', '/job-detail/', '/job-listing/', '/job_detail'],
      'timesjobs.com': ['/job/', '/jobs/', '/job-detail/', '/job-listing/', '/candidatejobs/'],
      'freshersjobs.com': ['/job/', '/jobs/', '/job-detail/', '/job-posting/'],
      'instahyre.com': ['/job/', '/jobs/', '/job-detail/', '/job/', '/posting/']
    };

    // Check if hostname matches and URL contains job pattern
    for (const [domain, patterns] of Object.entries(jobPagePatterns)) {
      if (hostname.includes(domain)) {
        const isJobPage = patterns.some(pattern => url.includes(pattern) || pathname.includes(pattern));
        if (isJobPage) {
          console.log(`📍 Job page detected on ${domain} with pattern match`);
          return true;
        }
      }
    }

    // Enhanced fallback: check for generic job indicators in URL and DOM
    const genericJobIndicators = ['/job/', '/jobs/', '/career/', '/careers/', '/position/', '/apply/', '/posting/', '/job_', '/job-'];
    const hasJobPattern = genericJobIndicators.some(indicator => url.includes(indicator) || pathname.includes(indicator));
    
    if (hasJobPattern) {
      console.log(`📍 Generic job page detected with pattern: ${pathname}`);
      return true;
    }
    
    // DOM-based detection for dynamic job pages
    const jobIndicatorSelectors = [
      '[data-automation-id*="job"]',
      '[class*="job-details"]',
      '[class*="job-posting"]',
      '[class*="job-application"]',
      '[id*="job-details"]',
      '.job-view',
      '.job-detail',
      '.apply-button',
      '.job-description'
    ];
    
    const hasJobElements = jobIndicatorSelectors.some(selector => {
      return document.querySelector(selector) !== null;
    });
    
    if (hasJobElements) {
      console.log(`📍 Job page detected via DOM elements`);
      return true;
    }
    
    return false;
  }

  updateJobInfo(jobData) {
    const jobInfo = document.getElementById('autojobr-job-info');
    const jobTitle = document.getElementById('autojobr-job-title');
    const jobCompany = document.getElementById('autojobr-job-company');
    
    if (jobInfo && jobTitle && jobCompany) {
      // Use extracted data with better fallbacks
      const title = jobData.title || jobData.role || jobData.position || 'Job detected';
      const company = jobData.company || jobData.companyName || jobData.employer || 'Company detected';
      
      jobTitle.textContent = title;
      jobCompany.textContent = company;
      jobInfo.style.display = 'block';
      
      // Store the enhanced data for cover letter generation
      this.currentJobData = {
        ...jobData,
        title: title,
        company: company,
        extractedAt: new Date().toISOString()
      };
      
      console.log('Updated job info with extracted data:', { title, company });
    }
  }

  showWidget() {
    let widget = document.querySelector('.autojobr-widget');
    
    // If widget doesn't exist, create it
    if (!widget) {
      console.log('🔧 AutoJobr widget not found - creating fresh UI');
      this.injectEnhancedUI();
      widget = document.querySelector('.autojobr-widget');
    }
    
    if (widget) {
      // Ensure widget is visible and properly positioned
      widget.style.display = 'block';
      widget.style.position = 'fixed';
      widget.style.top = '20px';
      widget.style.right = '20px';
      widget.style.zIndex = '10000';
      widget.style.boxShadow = '0 10px 25px rgba(0,0,0,0.1)';
      
      // Reset any previous transforms
      widget.style.opacity = '0';
      widget.style.transform = 'translateX(100%)';
      widget.style.transition = 'none';
      
      // Trigger reflow and animate in
      widget.offsetHeight;
      setTimeout(() => {
        widget.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
        widget.style.opacity = '1';
        widget.style.transform = 'translateX(0)';
      }, 100);
      
      console.log('✅ AutoJobr popup widget displayed automatically');
      
      // Force re-attach event listeners in case they were lost
      this.attachEnhancedUIEventListeners();
    } else {
      console.error('❌ Failed to create AutoJobr widget');
    }
  }

  hideWidget() {
    const widget = document.querySelector('.autojobr-widget');
    if (widget) {
      widget.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
      widget.style.opacity = '0';
      widget.style.transform = 'translateX(100%)';
      
      setTimeout(() => {
        widget.style.display = 'none'; // Hide instead of removing from DOM
      }, 300);
    }
  }

  minimizeWidget() {
    const widget = document.querySelector('.autojobr-widget');
    const content = document.querySelector('.autojobr-content');
    
    if (widget && content) {
      const isMinimized = content.style.display === 'none';
      
      if (isMinimized) {
        content.style.display = 'block';
        widget.style.height = 'auto';
      } else {
        content.style.display = 'none';
        widget.style.height = '60px';
      }
    }
  }

  async extractJobDetails() {
    try {
      const selectors = this.getJobSelectors();
      
      const jobData = {
        title: this.extractText(selectors.title),
        company: this.extractText(selectors.company),
        location: this.extractText(selectors.location),
        description: this.extractText(selectors.description),
        requirements: this.extractText(selectors.requirements),
        salary: this.extractText(selectors.salary),
        type: this.extractText(selectors.type),
        url: window.location.href,
        site: this.currentSite,
        extractedAt: new Date().toISOString()
      };

      // Enhanced data cleaning
      Object.keys(jobData).forEach(key => {
        if (typeof jobData[key] === 'string') {
          jobData[key] = jobData[key]
            .trim()
            .replace(/\s+/g, ' ')
            .replace(/[\r\n\t]/g, ' ')
            .substring(0, key === 'description' ? 5000 : 500); // Limit lengths
        }
      });

      // Validate required fields
      const isValid = jobData.title && jobData.title.length > 2;

      return { 
        success: isValid, 
        jobData: isValid ? jobData : null,
        confidence: this.calculateExtractionConfidence(jobData)
      };
    } catch (error) {
      console.error('Job extraction error:', error);
      return { success: false, error: error.message };
    }
  }

  calculateExtractionConfidence(jobData) {
    let score = 0;
    const weights = {
      title: 30,
      company: 25,
      location: 15,
      description: 20,
      salary: 10
    };

    Object.keys(weights).forEach(key => {
      if (jobData[key] && jobData[key].length > 2) {
        score += weights[key];
      }
    });

    return Math.min(100, score);
  }

  getJobSelectors() {
    const siteSelectors = {
      linkedin: {
        title: [
          '.top-card-layout__title h1',
          '.job-details-jobs-unified-top-card__job-title h1',
          'h1.t-24',
          '.jobs-unified-top-card__job-title h1'
        ],
        company: [
          '.topcard__org-name-link',
          '.job-details-jobs-unified-top-card__company-name a',
          '.topcard__flavor--black-link',
          '.jobs-unified-top-card__company-name a'
        ],
        location: [
          '.topcard__flavor--bullet',
          '.job-details-jobs-unified-top-card__bullet',
          '.topcard__flavor',
          '.jobs-unified-top-card__bullet'
        ],
        description: [
          '.description__text',
          '.jobs-description-content__text',
          '.jobs-description .t-14',
          '.jobs-box__html-content'
        ],
        requirements: [
          '.description__text',
          '.jobs-description-content__text'
        ],
        salary: [
          '.salary',
          '.compensation',
          '.pay-range'
        ],
        type: [
          '.job-criteria__text',
          '.job-details-preferences-and-skills'
        ]
      },
      indeed: {
        title: [
          '[data-testid="jobsearch-JobInfoHeader-title"] h1',
          '.jobsearch-JobInfoHeader-title h1',
          'h1[data-testid="job-title"]',
          '.jobsearch-JobInfoHeader-title span'
        ],
        company: [
          '[data-testid="inlineHeader-companyName"] a',
          '.jobsearch-InlineCompanyRating-companyHeader a',
          'a[data-testid="company-name"]',
          '.jobsearch-CompanyReview--heading'
        ],
        location: [
          '[data-testid="job-location"]',
          '.jobsearch-JobInfoHeader-subtitle div',
          '.companyLocation',
          '[data-testid="job-location"] div'
        ],
        description: [
          '#jobDescriptionText',
          '.jobsearch-jobDescriptionText',
          '.jobsearch-JobComponent-description',
          '.jobsearch-JobComponent-description div'
        ],
        requirements: [
          '#jobDescriptionText',
          '.jobsearch-jobDescriptionText'
        ],
        salary: [
          '.attribute_snippet',
          '.salary-snippet',
          '.estimated-salary',
          '.jobsearch-SalaryGuide-module'
        ],
        type: [
          '.jobsearch-JobDescriptionSection-section',
          '.job-snippet'
        ]
      },
      workday: {
        title: [
          '.css-1id67r3',
          '[data-automation-id="jobPostingHeader"]',
          '.WDKN_PositionTitle',
          'h1[data-automation-id="jobPostingHeader"]',
          '[data-automation-id="jobPostingHeader"] h1'
        ],
        company: [
          '[data-automation-id="company"]',
          '.css-1x9zq2f',
          '.WDKN_CompanyName',
          '[data-automation-id="company"] div'
        ],
        location: [
          '[data-automation-id="locations"]',
          '.css-129m7dg',
          '.WDKN_Location',
          '[data-automation-id="locations"] div'
        ],
        description: [
          '[data-automation-id="jobPostingDescription"]',
          '.css-1t3of01',
          '.WDKN_JobDescription',
          '[data-automation-id="jobPostingDescription"] div'
        ],
        requirements: [
          '[data-automation-id="jobPostingDescription"]',
          '.css-1t3of01'
        ],
        salary: [
          '.css-salary',
          '.compensation-section'
        ],
        type: [
          '[data-automation-id="employmentType"]',
          '.employment-type'
        ]
      },
      greenhouse: {
        title: [
          '.header--title',
          '.app-title',
          'h1.header-title',
          '.posting-headline h2'
        ],
        company: [
          '.header--company',
          '.company-name',
          '.header-company',
          '.posting-company'
        ],
        location: [
          '.header--location',
          '.location',
          '.job-location',
          '.posting-categories .location'
        ],
        description: [
          '.body--text',
          '.section--text',
          '.job-post-content',
          '.posting-description .section-wrapper'
        ],
        requirements: [
          '.body--text',
          '.section--text'
        ],
        salary: [
          '.salary',
          '.compensation'
        ],
        type: [
          '.employment-type',
          '.job-type'
        ]
      },
      lever: {
        title: [
          '.posting-headline h2',
          '.template-job-page h1',
          '.job-title'
        ],
        company: [
          '.posting-company',
          '.company-name',
          '.lever-company'
        ],
        location: [
          '.posting-categories .location',
          '.job-location',
          '.posting-location'
        ],
        description: [
          '.posting-description .section-wrapper',
          '.job-description'
        ],
        requirements: [
          '.posting-description .section-wrapper',
          '.job-description'
        ],
        salary: [
          '.salary',
          '.compensation'
        ],
        type: [
          '.posting-categories .commitment',
          '.employment-type'
        ]
      },
      microsoft: {
        title: [
          'h1[data-test-id="job-title"]',
          '.ms-JobDetailHeader-title h1',
          '.ms-JobTitle',
          'h1.c-heading-3',
          '[data-automation-id="jobTitle"]',
          '.job-detail-title h1'
        ],
        company: [
          '.ms-JobDetailHeader-company',
          '.ms-CompanyName',
          '.company-name',
          '[data-automation-id="company"]'
        ],
        location: [
          '.ms-JobDetailHeader-location',
          '.ms-Location',
          '.job-location',
          '[data-automation-id="location"]'
        ],
        description: [
          '.ms-JobDescription',
          '.job-description-content',
          '.job-detail-description',
          '[data-automation-id="jobDescription"]'
        ],
        requirements: [
          '.ms-JobRequirements',
          '.job-requirements',
          '.qualifications'
        ],
        salary: [
          '.ms-Salary',
          '.salary-range',
          '.compensation'
        ],
        type: [
          '.ms-JobType',
          '.employment-type',
          '.job-type'
        ]
      },
      generic: {
        title: [
          'h1',
          '.job-title',
          '.position-title',
          '[class*="title"]',
          '[class*="job"]',
          '[class*="position"]',
          'h1[class*="job"]',
          'h2[class*="job"]'
        ],
        company: [
          '.company',
          '.employer',
          '.organization',
          '[class*="company"]',
          '[class*="employer"]',
          '[class*="org"]'
        ],
        location: [
          '.location',
          '.address',
          '.city',
          '[class*="location"]',
          '[class*="address"]',
          '[class*="city"]'
        ],
        description: [
          '.description',
          '.job-desc',
          '.content',
          '[class*="description"]',
          '[class*="content"]',
          '[class*="detail"]'
        ],
        requirements: [
          '.requirements',
          '.qualifications',
          '[class*="requirements"]',
          '[class*="qualifications"]',
          '[class*="skills"]'
        ],
        salary: [
          '.salary',
          '.compensation',
          '.pay',
          '[class*="salary"]',
          '[class*="compensation"]',
          '[class*="pay"]'
        ],
        type: [
          '.job-type',
          '.employment-type',
          '[class*="type"]',
          '[class*="employment"]'
        ]
      }
    };

    return siteSelectors[this.currentSite] || siteSelectors.generic;
  }

  extractText(selectors) {
    if (!selectors) return '';
    
    for (const selector of selectors) {
      try {
        const element = document.querySelector(selector);
        if (element) {
          const text = element.innerText || element.textContent || '';
          if (text.trim().length > 0) {
            return text.trim();
          }
        }
      } catch (error) {
        console.warn(`Selector error: ${selector}`, error);
      }
    }
    
    return '';
  }

  async startSmartAutofill(userProfile) {
    if (this.fillInProgress) {
      return { success: false, error: 'Auto-fill already in progress' };
    }

    // Prevent infinite loops by tracking attempts
    this.autoFillAttempts = (this.autoFillAttempts || 0) + 1;
    if (this.autoFillAttempts > 2) {
      console.log('Max auto-fill attempts reached, stopping to prevent loops');
      this.autoFillAttempts = 0; // Reset counter
      return { success: false, error: 'Max auto-fill attempts reached' };
    }

    // Reset filled fields tracking for new session
    this.filledFields.clear();

    this.fillInProgress = true;
    this.showProgress(true);

    // Debug: Log profile data to help diagnose field mapping issues
    console.log('AutoJobr Extension - Profile data received:', {
      firstName: userProfile?.firstName,
      lastName: userProfile?.lastName,
      fullName: userProfile?.fullName,
      email: userProfile?.email,
      phone: userProfile?.phone,
      professionalTitle: userProfile?.professionalTitle,
      workAuthorization: userProfile?.workAuthorization,
      skills: userProfile?.skills,
      workExperience: userProfile?.workExperience?.length || 0,
      education: userProfile?.education?.length || 0
    });

    try {
      // Get settings
      const settings = await chrome.storage.sync.get(['smartFillMode', 'autoSubmitMode']);
      const smartMode = settings.smartFillMode !== false;
      const autoSubmit = settings.autoSubmitMode === true;

      // Find all forms with enhanced detection
      const forms = this.findAllForms();
      let totalFieldsFound = 0;
      let totalFieldsFilled = 0;
      const fillResults = [];

      for (const form of forms) {
        const result = await this.fillForm(form, userProfile, smartMode);
        totalFieldsFound += result.fieldsFound;
        totalFieldsFilled += result.fieldsFilled;
        fillResults.push(result);
        
        // Update progress
        this.updateProgress(totalFieldsFilled, totalFieldsFound);
        
        // Delay between forms
        await this.delay(500);
      }

      // Handle file uploads
      const fileResults = await this.handleAdvancedFileUploads(userProfile);
      totalFieldsFound += fileResults.filesFound;
      totalFieldsFilled += fileResults.filesUploaded;

      // Update statistics
      this.updateStats(totalFieldsFound, totalFieldsFilled);

      // Detect form navigation buttons after filling
      this.detectFormNavigation();

      // Auto-submit if enabled
      if (autoSubmit && totalFieldsFilled > 0) {
        await this.attemptAutoSubmit();
      }

      this.fillInProgress = false;
      this.showProgress(false);
      
      // Reset attempts counter after successful completion
      setTimeout(() => {
        this.autoFillAttempts = 0;
      }, 5000);
      
      return {
        success: true,
        fieldsFound: totalFieldsFound,
        fieldsFilled: totalFieldsFilled,
        successRate: totalFieldsFound > 0 ? Math.round((totalFieldsFilled / totalFieldsFound) * 100) : 0,
        message: `Successfully filled ${totalFieldsFilled} out of ${totalFieldsFound} fields`,
        results: fillResults
      };

    } catch (error) {
      this.fillInProgress = false;
      this.showProgress(false);
      // Reset attempts counter on error
      setTimeout(() => {
        this.autoFillAttempts = 0;
      }, 5000);
      console.error('Smart auto-fill error:', error);
      return { success: false, error: error.message };
    }
  }

  findAllForms() {
    const forms = [];
    
    // Standard form detection
    document.querySelectorAll('form').forEach(form => {
      if (this.isRelevantForm(form)) {
        forms.push(form);
      }
    });

    // Site-specific form detection
    if (this.smartSelectors.forms) {
      this.smartSelectors.forms.forEach(selector => {
        document.querySelectorAll(selector).forEach(form => {
          if (!forms.includes(form) && this.isRelevantForm(form)) {
            forms.push(form);
          }
        });
      });
    }

    // Fallback: look for containers with form fields
    if (forms.length === 0) {
      const containers = document.querySelectorAll('div, section, main');
      containers.forEach(container => {
        const fields = container.querySelectorAll('input, select, textarea');
        if (fields.length >= 3) { // Minimum threshold
          forms.push(container);
        }
      });
    }

    return forms;
  }

  isRelevantForm(form) {
    // Skip forms that are clearly not job applications
    const skipPatterns = [
      'search', 'login', 'signin', 'signup', 'newsletter', 
      'subscribe', 'comment', 'review', 'feedback'
    ];

    const formText = (form.textContent || '').toLowerCase();
    const formClass = (form.className || '').toLowerCase();
    const formId = (form.id || '').toLowerCase();

    return !skipPatterns.some(pattern => 
      formText.includes(pattern) || 
      formClass.includes(pattern) || 
      formId.includes(pattern)
    );
  }

  async fillForm(form, userProfile, smartMode) {
    const fields = form.querySelectorAll('input, select, textarea');
    let fieldsFound = 0;
    let fieldsFilled = 0;

    for (const field of fields) {
      if (this.shouldSkipField(field)) continue;
      
      fieldsFound++;
      
      try {
        const filled = await this.fillFieldSmart(field, userProfile, smartMode);
        if (filled) {
          fieldsFilled++;
          
          // Add visual feedback
          this.addFieldFeedback(field, true);
          
          // Human-like delay
          await this.delay(150 + Math.random() * 200);
        }
      } catch (error) {
        console.warn('Field fill error:', error);
        this.addFieldFeedback(field, false);
      }
    }

    return { fieldsFound, fieldsFilled };
  }

  shouldSkipField(field) {
    // Skip hidden, disabled, or readonly fields
    if (field.type === 'hidden' || field.disabled || field.readOnly) {
      return true;
    }

    // Skip fields that are not visible
    const style = window.getComputedStyle(field);
    if (style.display === 'none' || style.visibility === 'hidden') {
      return true;
    }

    // Skip certain input types
    const skipTypes = ['submit', 'button', 'reset', 'image'];
    if (skipTypes.includes(field.type)) {
      return true;
    }

    return false;
  }

  getFieldIdentifier(field) {
    // Create unique identifier for field to prevent duplicate filling
    return `${field.tagName}_${field.type}_${field.name}_${field.id}_${field.placeholder}`.toLowerCase().replace(/\s+/g, '_');
  }

  async fillFieldSmart(field, userProfile, smartMode) {
    try {
      // Generate unique field identifier to prevent loops
      const fieldId = this.getFieldIdentifier(field);
      
      // Skip if already filled to prevent infinite loops
      if (this.filledFields.has(fieldId)) {
        return false;
      }

      // Scroll field into view smoothly
      field.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center',
        inline: 'nearest'
      });
      await this.delay(100);

      // Focus the field with animation
      field.focus();
      await this.delay(50);

      const fieldInfo = this.analyzeFieldAdvanced(field);
      const value = this.getValueForFieldSmart(fieldInfo, userProfile, smartMode);

      if (!value) return false;

      // Fill based on field type
      let success = false;
      switch (field.tagName.toLowerCase()) {
        case 'select':
          success = await this.fillSelectFieldSmart(field, value);
          break;
        case 'textarea':
          success = await this.fillTextAreaSmart(field, value);
          break;
        case 'input':
          switch (field.type.toLowerCase()) {
            case 'checkbox':
            case 'radio':
              success = await this.fillChoiceFieldSmart(field, value);
              break;
            case 'file':
              success = await this.fillFileFieldSmart(field, value, userProfile);
              break;
            default:
              success = await this.fillTextFieldSmart(field, value);
              break;
          }
          break;
        default:
          success = await this.fillTextFieldSmart(field, value);
          break;
      }

      // Mark field as filled if successful
      if (success) {
        this.filledFields.add(fieldId);
      }

      return success;

    } catch (error) {
      console.error('Smart field fill error:', error);
      return false;
    }
  }

  analyzeFieldAdvanced(field) {
    const info = {
      name: field.name?.toLowerCase() || '',
      id: field.id?.toLowerCase() || '',
      placeholder: field.placeholder?.toLowerCase() || '',
      label: '',
      type: field.type?.toLowerCase() || 'text',
      className: field.className?.toLowerCase() || '',
      automationId: field.getAttribute('data-automation-id')?.toLowerCase() || '',
      ariaLabel: field.getAttribute('aria-label')?.toLowerCase() || '',
      title: field.title?.toLowerCase() || '',
      required: field.required || false,
      maxLength: field.maxLength || null,
      pattern: field.pattern || null
    };

    // Find associated label with multiple strategies
    let label = field.closest('label') || 
                document.querySelector(`label[for="${field.id}"]`);
    
    if (!label) {
      // Look for nearby text
      const parent = field.parentElement;
      const siblings = parent ? Array.from(parent.children) : [];
      const fieldIndex = siblings.indexOf(field);
      
      // Check previous siblings
      for (let i = fieldIndex - 1; i >= 0; i--) {
        const sibling = siblings[i];
        if (sibling.tagName === 'LABEL' || sibling.textContent?.trim()) {
          label = sibling;
          break;
        }
      }
    }
    
    if (label) {
      info.label = (label.innerText || label.textContent || '').toLowerCase();
    }

    // Combine all identifiers for matching
    info.combined = `${info.name} ${info.id} ${info.placeholder} ${info.label} ${info.className} ${info.automationId} ${info.ariaLabel} ${info.title}`;

    // Calculate confidence score
    info.confidence = this.calculateFieldConfidence(info);

    return info;
  }

  calculateFieldConfidence(fieldInfo) {
    let confidence = 0;
    
    // Higher confidence for specific identifiers
    if (fieldInfo.name) confidence += 30;
    if (fieldInfo.id) confidence += 25;
    if (fieldInfo.label) confidence += 20;
    if (fieldInfo.placeholder) confidence += 15;
    if (fieldInfo.automationId) confidence += 10;

    return Math.min(100, confidence);
  }

  getValueForFieldSmart(fieldInfo, userProfile, smartMode) {
    if (!userProfile) return null;

    // Enhanced field matching with priority scoring
    let bestMatch = null;
    let bestScore = 0;

    for (const [profileKey, mapping] of Object.entries(this.fieldMappings)) {
      for (const pattern of mapping.patterns) {
        if (fieldInfo.combined.includes(pattern)) {
          let score = mapping.priority || 1;
          
          // Boost score for exact matches
          if (fieldInfo.name === pattern || fieldInfo.id === pattern) {
            score += 20;
          }
          
          // Boost score for type compatibility
          if (mapping.types.includes(fieldInfo.type)) {
            score += 10;
          }
          
          // Debug: Log field matching for name fields
          if (profileKey === 'firstName' || profileKey === 'lastName' || profileKey === 'fullName') {
            console.log(`AutoJobr Extension - Name field match:`, {
              fieldPattern: pattern,
              profileKey: profileKey,
              fieldInfo: fieldInfo.combined,
              score: score,
              userProfileValue: this.getProfileValueSmart(profileKey, userProfile, fieldInfo)
            });
          }
          
          // Boost score for required fields
          if (fieldInfo.required) {
            score += 5;
          }

          if (score > bestScore) {
            bestScore = score;
            bestMatch = profileKey;
          }
        }
      }
    }

    if (bestMatch) {
      return this.getProfileValueSmart(bestMatch, userProfile, fieldInfo);
    }

    // Fallback pattern matching
    return this.getFallbackValue(fieldInfo, userProfile);
  }

  getProfileValueSmart(key, profile, fieldInfo) {
    const valueMap = {
      firstName: profile.firstName || profile.user?.firstName || (profile.fullName || '').split(' ')[0] || '',
      lastName: profile.lastName || profile.user?.lastName || (profile.fullName || '').split(' ').slice(1).join(' ') || '',
      fullName: profile.fullName || `${profile.firstName || profile.user?.firstName || ''} ${profile.lastName || profile.user?.lastName || ''}`.trim(),
      email: profile.email || profile.user?.email || '',
      phone: this.formatPhone(profile.phone || profile.profile?.phone, fieldInfo),
      address: profile.currentAddress || profile.profile?.currentAddress || '',
      city: this.extractCity(profile.location || profile.profile?.city),
      state: this.extractState(profile.location || profile.profile?.state),
      zipCode: profile.zipCode || profile.profile?.zipCode || '',
      country: profile.country || 'United States',
      currentTitle: profile.professionalTitle || profile.workExperience?.[0]?.position || '',
      company: profile.currentCompany || profile.workExperience?.[0]?.company || '',
      experience: this.formatExperience(profile.yearsExperience, fieldInfo),
      university: profile.education?.[0]?.institution || '',
      degree: profile.education?.[0]?.degree || '',
      major: profile.education?.[0]?.fieldOfStudy || profile.education?.[0]?.field_of_study || '',
      linkedin: profile.linkedinUrl || '',
      github: profile.githubUrl || '',
      portfolio: profile.portfolioUrl || '',
      workAuth: this.formatWorkAuth(profile.workAuthorization, fieldInfo),
      visa: this.formatVisa(profile.visaStatus || profile.workAuthorization, fieldInfo),
      coverLetter: profile.defaultCoverLetter || '',
      skills: Array.isArray(profile.skills) ? profile.skills.join(', ') : (profile.skills || ''),
      salary: profile.desiredSalaryMin ? `${profile.desiredSalaryMin}-${profile.desiredSalaryMax || profile.desiredSalaryMin}` : '',
      description: profile.summary || '',
      
      // New Personal Details Fields
      gender: this.mapValueWithOptions('gender', profile.gender, fieldInfo),
      veteranStatus: this.mapValueWithOptions('veteranStatus', profile.veteranStatus, fieldInfo),
      twitter: profile.twitterUrl || '',
      personalWebsite: profile.personalWebsiteUrl || '',
      
      // Work Screening Questions (Boolean responses)
      currentlyEmployed: this.mapBooleanValue(profile.currentlyEmployed, fieldInfo),
      canContactEmployer: this.mapBooleanValue(profile.canContactCurrentEmployer, fieldInfo), 
      willingToWorkOvertime: this.mapBooleanValue(profile.willingToWorkOvertime, fieldInfo),
      willingToTravel: this.mapBooleanValue(profile.willingToTravel, fieldInfo),
      travelPercentage: profile.maxTravelPercentage ? `${profile.maxTravelPercentage}%` : '',
      
      // Application-Specific Questions
      howDidYouHear: this.mapValueWithOptions('howDidYouHear', profile.howDidYouHearAboutUs, fieldInfo),
      whyInterestedRole: profile.whyInterestedInRole || '',
      whyInterestedCompany: profile.whyInterestedInCompany || '',
      careerGoals: profile.careerGoals || '',
      startDate: profile.preferredStartDate || profile.earliestStartDate || 'Flexible',
      gpa: profile.gpa || '',
      
      // Professional References (use first reference if available)
      referenceName: profile.references?.[0]?.fullName || '',
      referenceTitle: profile.references?.[0]?.jobTitle || '',
      referenceCompany: profile.references?.[0]?.company || '',
      referenceEmail: profile.references?.[0]?.email || '',
      referencePhone: profile.references?.[0]?.phone || '',
      referenceRelationship: this.mapValueWithOptions('referenceRelationship', profile.references?.[0]?.relationship, fieldInfo)
    };

    return valueMap[key] || null;
  }

  // Enhanced value mapping for fields with predefined options
  mapValueWithOptions(fieldType, userValue, fieldInfo) {
    if (!userValue) return null;
    
    const mapping = this.fieldMappings[fieldType];
    if (!mapping || !mapping.values) return userValue;
    
    // Find matching value from our predefined options
    for (const [ourValue, possibleMatches] of Object.entries(mapping.values)) {
      if (ourValue === userValue || possibleMatches.includes(userValue.toLowerCase())) {
        // Check if field is radio/select and try to match exact option text
        if (fieldInfo.type === 'radio' || fieldInfo.type === 'select-one') {
          return this.findBestOptionMatch(possibleMatches, fieldInfo);
        }
        return ourValue;
      }
    }
    
    return userValue;
  }

  // Map boolean values to appropriate yes/no responses based on field context
  mapBooleanValue(boolValue, fieldInfo) {
    if (boolValue === null || boolValue === undefined) return null;
    
    if (fieldInfo.type === 'radio' || fieldInfo.type === 'select-one') {
      // Try to find actual option values in the form
      const form = fieldInfo.element?.closest('form');
      if (form) {
        const options = form.querySelectorAll(`input[name="${fieldInfo.name}"], option`);
        for (const option of options) {
          const value = (option.value || option.textContent || '').toLowerCase();
          if (boolValue && (value.includes('yes') || value.includes('true') || value.includes('authorized'))) {
            return option.value || 'yes';
          }
          if (!boolValue && (value.includes('no') || value.includes('false') || value.includes('not'))) {
            return option.value || 'no';
          }
        }
      }
    }
    
    return boolValue ? 'yes' : 'no';
  }

  // Find the best matching option text from available form options
  findBestOptionMatch(possibleMatches, fieldInfo) {
    const form = fieldInfo.element?.closest('form');
    if (!form) return possibleMatches[0]; // Return first match if no form context
    
    const options = form.querySelectorAll(`input[name="${fieldInfo.name}"], option`);
    for (const option of options) {
      const optionText = (option.value || option.textContent || '').toLowerCase();
      for (const match of possibleMatches) {
        if (optionText.includes(match) || match.includes(optionText)) {
          return option.value || optionText;
        }
      }
    }
    
    return possibleMatches[0]; // Fallback to first match
  }

  formatPhone(phone, fieldInfo) {
    if (!phone) return null;
    
    // Remove all non-digits
    const digits = phone.replace(/\D/g, '');
    
    // Format based on field pattern or maxLength
    if (fieldInfo.pattern?.includes('(') || fieldInfo.maxLength === 14) {
      return `(${digits.slice(0,3)}) ${digits.slice(3,6)}-${digits.slice(6,10)}`;
    } else if (fieldInfo.maxLength === 12) {
      return `${digits.slice(0,3)}-${digits.slice(3,6)}-${digits.slice(6,10)}`;
    } else {
      return digits.slice(0, 10);
    }
  }

  formatExperience(years, fieldInfo) {
    if (!years) return null;
    
    if (fieldInfo.type === 'select-one') {
      // Return appropriate range for select fields
      if (years < 1) return '0-1 years';
      if (years < 3) return '1-3 years';
      if (years < 5) return '3-5 years';
      if (years < 10) return '5-10 years';
      return '10+ years';
    }
    
    return years.toString();
  }

  formatWorkAuth(workAuth, fieldInfo) {
    if (!workAuth) return 'Yes'; // Default assumption for US-based applications
    
    if (fieldInfo.type === 'select-one') {
      // Handle various work authorization values from database
      if (workAuth === 'authorized' || workAuth === 'citizen' || workAuth === 'permanent_resident') {
        return 'Yes';
      } else if (workAuth === 'visa_required' || workAuth === 'not_authorized') {
        return 'No';
      }
      return workAuth === 'authorized' ? 'Yes' : 'No';
    }
    
    return workAuth;
  }

  formatVisa(visaStatus, fieldInfo) {
    if (!visaStatus) return 'No'; // Default assumption
    
    if (fieldInfo.type === 'select-one') {
      // Handle various visa status values from database
      if (visaStatus === 'visa_required' || visaStatus === 'required') {
        return 'Yes';
      } else if (visaStatus === 'authorized' || visaStatus === 'citizen' || visaStatus === 'permanent_resident') {
        return 'No';
      }
      return visaStatus === 'required' ? 'Yes' : 'No';
    }
    
    return visaStatus;
  }

  extractCity(location) {
    if (!location) return null;
    return location.split(',')[0]?.trim();
  }

  extractState(location) {
    if (!location) return null;
    const parts = location.split(',');
    return parts[1]?.trim();
  }

  getFallbackValue(fieldInfo, userProfile) {
    // Smart fallback based on common patterns
    const combined = fieldInfo.combined;
    
    if (combined.includes('name') && !combined.includes('company')) {
      if (combined.includes('first') || combined.includes('given')) {
        return userProfile.firstName || userProfile.user?.firstName || (userProfile.fullName || '').split(' ')[0] || '';
      } else if (combined.includes('last') || combined.includes('family')) {
        return userProfile.lastName || userProfile.user?.lastName || (userProfile.fullName || '').split(' ').slice(1).join(' ') || '';
      } else {
        return userProfile.fullName || `${userProfile.firstName || userProfile.user?.firstName || ''} ${userProfile.lastName || userProfile.user?.lastName || ''}`.trim();
      }
    }
    
    return null;
  }

  async fillTextFieldSmart(field, value) {
    try {
      // Skip if field already has correct value
      if (field.value === value) {
        return true;
      }

      // Focus field first
      field.focus();
      await this.delay(100);

      // Clear field more efficiently
      field.value = '';
      field.dispatchEvent(new Event('input', { bubbles: true }));
      
      // Use faster typing for better performance
      const chunkSize = Math.max(1, Math.floor(value.length / 10));
      for (let i = 0; i < value.length; i += chunkSize) {
        const chunk = value.substring(i, i + chunkSize);
        field.value = value.substring(0, i + chunk.length);
        
        // Dispatch events for framework compatibility
        field.dispatchEvent(new Event('input', { bubbles: true }));
        
        // Shorter delay for better UX
        await this.delay(50);
      }

      // Final events
      field.dispatchEvent(new Event('change', { bubbles: true }));
      field.dispatchEvent(new Event('blur', { bubbles: true }));
      
      return true;
    } catch (error) {
      console.error('Text field fill error:', error);
      return false;
    }
  }

  async fillSelectFieldSmart(field, value) {
    try {
      const options = Array.from(field.options);
      
      // Try exact match first
      let option = options.find(opt => 
        opt.text.toLowerCase() === value.toLowerCase() ||
        opt.value.toLowerCase() === value.toLowerCase()
      );

      // Try partial match
      if (!option) {
        option = options.find(opt => 
          opt.text.toLowerCase().includes(value.toLowerCase()) ||
          value.toLowerCase().includes(opt.text.toLowerCase())
        );
      }

      // Try fuzzy match for common variations
      if (!option) {
        option = this.findFuzzyMatch(options, value);
      }

      if (option) {
        field.value = option.value;
        field.dispatchEvent(new Event('change', { bubbles: true }));
        field.dispatchEvent(new Event('blur', { bubbles: true }));
        return true;
      }

      return false;
    } catch (error) {
      console.error('Select field fill error:', error);
      return false;
    }
  }

  findFuzzyMatch(options, value) {
    const normalizedValue = value.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    for (const option of options) {
      const normalizedOption = option.text.toLowerCase().replace(/[^a-z0-9]/g, '');
      
      // Check for common abbreviations and variations
      if (this.isFuzzyMatch(normalizedValue, normalizedOption)) {
        return option;
      }
    }
    
    return null;
  }

  isFuzzyMatch(value1, value2) {
    // Simple fuzzy matching logic
    const minLength = Math.min(value1.length, value2.length);
    const maxLength = Math.max(value1.length, value2.length);
    
    if (minLength < 3) return false;
    
    // Check if one contains the other
    if (value1.includes(value2) || value2.includes(value1)) {
      return true;
    }
    
    // Check similarity ratio
    let matches = 0;
    for (let i = 0; i < minLength; i++) {
      if (value1[i] === value2[i]) {
        matches++;
      }
    }
    
    return (matches / maxLength) > 0.7;
  }

  async fillTextAreaSmart(field, value) {
    try {
      // For cover letters and long text, use a different approach
      field.focus();
      await this.delay(100);
      
      // Clear existing content
      field.value = '';
      field.dispatchEvent(new Event('input', { bubbles: true }));
      
      // Insert text in chunks for better performance
      const chunkSize = 50;
      for (let i = 0; i < value.length; i += chunkSize) {
        const chunk = value.substring(i, i + chunkSize);
        field.value += chunk;
        field.dispatchEvent(new Event('input', { bubbles: true }));
        await this.delay(100);
      }
      
      field.dispatchEvent(new Event('change', { bubbles: true }));
      field.dispatchEvent(new Event('blur', { bubbles: true }));
      
      return true;
    } catch (error) {
      console.error('Textarea fill error:', error);
      return false;
    }
  }

  async fillChoiceFieldSmart(field, value) {
    try {
      const shouldCheck = this.interpretBooleanValue(value);
      
      if (field.type === 'radio') {
        // For radio buttons, find the appropriate option
        const radioGroup = document.querySelectorAll(`input[name="${field.name}"]`);
        for (const radio of radioGroup) {
          const radioInfo = this.analyzeFieldAdvanced(radio);
          if (this.shouldSelectRadio(radioInfo, value)) {
            radio.checked = true;
            radio.dispatchEvent(new Event('change', { bubbles: true }));
            return true;
          }
        }
      } else {
        // Checkbox
        if (field.checked !== shouldCheck) {
          field.checked = shouldCheck;
          field.dispatchEvent(new Event('change', { bubbles: true }));
        }
        return true;
      }

      return false;
    } catch (error) {
      console.error('Choice field fill error:', error);
      return false;
    }
  }

  interpretBooleanValue(value) {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
      const lower = value.toLowerCase();
      return ['yes', 'true', '1', 'on', 'enabled', 'authorized'].includes(lower);
    }
    return false;
  }

  shouldSelectRadio(radioInfo, value) {
    const combined = radioInfo.combined;
    const valueLower = value.toLowerCase();
    
    // Match based on value content
    if (valueLower === 'yes' && (combined.includes('yes') || combined.includes('authorized'))) {
      return true;
    }
    if (valueLower === 'no' && (combined.includes('no') || combined.includes('not authorized'))) {
      return true;
    }
    
    return combined.includes(valueLower);
  }

  async fillFileFieldSmart(field, value, userProfile) {
    try {
      // Attempt to inject resume from server
      console.log('File field detected, attempting resume upload:', field);
      
      // Get user's active resume from server
      const apiUrl = await this.getApiUrl();
      const response = await fetch(`${apiUrl}/api/resumes/active`, {
        credentials: 'include',
        headers: { 'Accept': 'application/octet-stream' }
      });

      if (response.ok) {
        const resumeBlob = await response.blob();
        const fileName = response.headers.get('Content-Disposition')?.match(/filename="(.+)"/)?.[1] || 'resume.pdf';
        
        // Create a File object from the blob
        const resumeFile = new File([resumeBlob], fileName, { type: resumeBlob.type });
        
        // Create a new DataTransfer to simulate file selection
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(resumeFile);
        
        // Set the files property
        field.files = dataTransfer.files;
        
        // Trigger change event
        field.dispatchEvent(new Event('change', { bubbles: true }));
        
        console.log('✅ Resume uploaded successfully:', fileName);
        return true;
      } else {
        console.log('❌ No active resume found on server');
        return false;
      }
    } catch (error) {
      console.error('File field fill error:', error);
      return false;
    }
  }

  addFieldFeedback(field, success) {
    // Add visual feedback to filled fields
    const indicator = document.createElement('div');
    indicator.className = `autojobr-field-indicator ${success ? 'success' : 'error'}`;
    indicator.innerHTML = success ? '✓' : '✗';
    indicator.style.cssText = `
      position: absolute;
      top: -8px;
      right: -8px;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: ${success ? '#22c55e' : '#ef4444'};
      color: white;
      font-size: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      animation: fadeInScale 0.3s ease-out;
    `;

    // Position relative to field
    const rect = field.getBoundingClientRect();
    indicator.style.position = 'fixed';
    indicator.style.left = `${rect.right - 8}px`;
    indicator.style.top = `${rect.top - 8}px`;

    document.body.appendChild(indicator);

    // Remove after 2 seconds
    setTimeout(() => {
      indicator.remove();
    }, 2000);
  }

  showProgress(show) {
    const progress = document.getElementById('autojobr-progress');
    if (progress) {
      progress.style.display = show ? 'block' : 'none';
    }
  }

  updateProgress(filled, total) {
    const progress = document.querySelector('#autojobr-progress .progress-bar');
    if (progress && total > 0) {
      const percentage = (filled / total) * 100;
      progress.style.width = `${percentage}%`;
    }
  }

  updateStats(found, filled) {
    const fieldsFoundEl = document.getElementById('fields-found');
    const fieldsFilledEl = document.getElementById('fields-filled');
    const successRateEl = document.getElementById('success-rate');
    const statsEl = document.getElementById('autojobr-stats');

    if (fieldsFoundEl) fieldsFoundEl.textContent = found;
    if (fieldsFilledEl) fieldsFilledEl.textContent = filled;
    if (successRateEl) {
      const rate = found > 0 ? Math.round((filled / found) * 100) : 0;
      successRateEl.textContent = `${rate}%`;
    }
    if (statsEl) statsEl.style.display = 'block';
  }

  async handleAdvancedFileUploads(userProfile) {
    const fileInputs = document.querySelectorAll('input[type="file"]');
    let filesFound = fileInputs.length;
    let filesUploaded = 0;

    for (const input of fileInputs) {
      try {
        if (await this.handleFileUpload(input, userProfile)) {
          filesUploaded++;
        }
      } catch (error) {
        console.error('File upload error:', error);
      }
    }

    return { filesFound, filesUploaded };
  }

  async handleFileUpload(input, userProfile) {
    // This would need actual file handling implementation
    // For now, we'll return false as we can't upload actual files
    return false;
  }

  async attemptAutoSubmit() {
    // Look for submit buttons
    const submitSelectors = [
      'input[type="submit"]',
      'button[type="submit"]',
      'button:contains("Submit")',
      'button:contains("Apply")',
      '.submit-btn',
      '.apply-btn'
    ];

    if (this.smartSelectors.submitButtons) {
      submitSelectors.push(...this.smartSelectors.submitButtons);
    }

    for (const selector of submitSelectors) {
      const button = document.querySelector(selector);
      if (button && !button.disabled) {
        // Add confirmation
        if (confirm('Auto-submit is enabled. Submit the application now?')) {
          button.click();
          return true;
        }
        break;
      }
    }

    return false;
  }

  detectFormNavigation() {
    // Detect next page and submit buttons
    const nextButtons = this.findNextPageButtons();
    const submitButtons = this.findSubmitButtons();
    
    this.formState.hasNextPage = nextButtons.length > 0;
    this.formState.hasSubmit = submitButtons.length > 0;
    
    // Update widget UI to show navigation buttons
    this.updateNavigationUI(nextButtons, submitButtons);
    
    console.log('Form navigation detected:', {
      nextButtons: nextButtons.length,
      submitButtons: submitButtons.length,
      formState: this.formState
    });
  }

  findNextPageButtons() {
    const nextButtonSelectors = [
      // Generic next/continue buttons
      'button[type="button"]:contains("Next")',
      'button[type="button"]:contains("Continue")',
      'input[type="button"][value*="Next"]',
      'input[type="button"][value*="Continue"]',
      'input[type="submit"][value*="Next"]',
      'input[type="submit"][value*="Continue"]',
      
      // Site-specific selectors
      ...this.smartSelectors.nextButtons || [],
      
      // Common classes and IDs
      '.next-button', '.continue-button', '.btn-next', '.btn-continue',
      '#next-button', '#continue-button', '#btn-next', '#btn-continue',
      
      // Data attributes
      '[data-automation-id*="next"]', '[data-automation-id*="continue"]',
      '[data-test*="next"]', '[data-test*="continue"]',
      
      // Text-based detection
      'button:not([type="submit"])', 'input[type="button"]'
    ];

    const buttons = [];
    
    nextButtonSelectors.forEach(selector => {
      try {
        document.querySelectorAll(selector).forEach(button => {
          if (this.isNextButton(button) && !buttons.includes(button)) {
            buttons.push(button);
          }
        });
      } catch (e) {
        // Skip invalid selectors
      }
    });

    return buttons;
  }

  findSubmitButtons() {
    const submitButtonSelectors = [
      // Standard submit buttons
      'button[type="submit"]',
      'input[type="submit"]',
      
      // Site-specific selectors
      ...this.smartSelectors.submitButtons || [],
      
      // Common submit button patterns
      'button:contains("Submit")', 'button:contains("Apply")',
      'button:contains("Send Application")', 'button:contains("Complete Application")',
      '.submit-button', '.apply-button', '.btn-submit', '.btn-apply',
      '#submit-button', '#apply-button', '#btn-submit', '#btn-apply',
      
      // Data attributes
      '[data-automation-id*="submit"]', '[data-automation-id*="apply"]',
      '[data-test*="submit"]', '[data-test*="apply"]'
    ];

    const buttons = [];
    
    submitButtonSelectors.forEach(selector => {
      try {
        document.querySelectorAll(selector).forEach(button => {
          if (this.isSubmitButton(button) && !buttons.includes(button)) {
            buttons.push(button);
          }
        });
      } catch (e) {
        // Skip invalid selectors
      }
    });

    return buttons;
  }

  isNextButton(button) {
    const text = (button.textContent || button.value || '').toLowerCase();
    const nextKeywords = ['next', 'continue', 'proceed', 'forward', 'step', '→', '»'];
    const submitKeywords = ['submit', 'apply', 'send', 'complete', 'finish'];
    
    // Must contain next keywords but not submit keywords
    return nextKeywords.some(keyword => text.includes(keyword)) && 
           !submitKeywords.some(keyword => text.includes(keyword)) &&
           !button.disabled;
  }

  isSubmitButton(button) {
    const text = (button.textContent || button.value || '').toLowerCase();
    const submitKeywords = ['submit', 'apply', 'send application', 'complete application', 'finish application', 'send my application'];
    
    return submitKeywords.some(keyword => text.includes(keyword)) && !button.disabled;
  }

  updateNavigationUI(nextButtons, submitButtons) {
    // Remove existing navigation buttons
    const existingNav = document.getElementById('autojobr-navigation');
    if (existingNav) existingNav.remove();

    if (nextButtons.length === 0 && submitButtons.length === 0) return;

    // Create navigation section
    const navigationHTML = `
      <div class="autojobr-navigation" id="autojobr-navigation">
        <div class="nav-header">
          <span class="nav-title">📋 Form Navigation</span>
        </div>
        <div class="nav-buttons">
          ${nextButtons.length > 0 ? `
            <button class="autojobr-btn secondary" id="autojobr-next-page">
              <span class="btn-icon">➡️</span>
              <span>Next Page (${nextButtons.length})</span>
            </button>
          ` : ''}
          ${submitButtons.length > 0 ? `
            <button class="autojobr-btn primary" id="autojobr-submit-form">
              <span class="btn-icon">✅</span>
              <span>Submit Application (${submitButtons.length})</span>
            </button>
          ` : ''}
        </div>
      </div>
    `;

    // Insert navigation after actions
    const actionsDiv = document.querySelector('.autojobr-actions');
    if (actionsDiv) {
      actionsDiv.insertAdjacentHTML('afterend', navigationHTML);

      // Add event listeners
      document.getElementById('autojobr-next-page')?.addEventListener('click', () => {
        this.handleNextPage(nextButtons);
      });

      document.getElementById('autojobr-submit-form')?.addEventListener('click', () => {
        this.handleSubmitForm(submitButtons);
      });
    }
  }

  async handleNextPage(nextButtons) {
    if (nextButtons.length === 0) return;

    try {
      this.updateStatus('🔄 Moving to next page...', 'loading');

      // Click the most appropriate next button
      const bestButton = this.selectBestButton(nextButtons, 'next');
      if (bestButton) {
        bestButton.scrollIntoView({ behavior: 'smooth', block: 'center' });
        await this.delay(500);
        
        bestButton.click();
        this.formState.currentPage++;
        
        this.updateStatus('✅ Moved to next page', 'success');
        
        // Wait for page to load then re-detect navigation
        setTimeout(() => {
          this.detectFormNavigation();
        }, 2000);
      }
    } catch (error) {
      console.error('Next page error:', error);
      this.updateStatus('❌ Failed to move to next page', 'error');
    }
  }

  async handleSubmitForm(submitButtons) {
    if (submitButtons.length === 0) return;

    try {
      // Confirm before submitting
      if (!confirm('Submit the application now? This action cannot be undone.')) {
        return;
      }

      this.updateStatus('🔄 Submitting application...', 'loading');

      // Click the most appropriate submit button
      const bestButton = this.selectBestButton(submitButtons, 'submit');
      if (bestButton) {
        bestButton.scrollIntoView({ behavior: 'smooth', block: 'center' });
        await this.delay(500);
        
        bestButton.click();
        
        this.updateStatus('✅ Application submitted!', 'success');
        
        // Track application submission
        this.trackApplicationSubmission();
      }
    } catch (error) {
      console.error('Submit form error:', error);
      this.updateStatus('❌ Failed to submit application', 'error');
    }
  }

  selectBestButton(buttons, type) {
    if (buttons.length === 1) return buttons[0];

    // Score buttons based on various criteria
    let bestButton = null;
    let bestScore = 0;

    for (const button of buttons) {
      let score = 0;
      const text = (button.textContent || button.value || '').toLowerCase();

      // Prefer buttons with clear text
      if (type === 'next') {
        if (text.includes('next')) score += 20;
        if (text.includes('continue')) score += 15;
      } else if (type === 'submit') {
        if (text.includes('submit')) score += 20;
        if (text.includes('apply')) score += 15;
      }

      // Prefer visible buttons
      const style = window.getComputedStyle(button);
      if (style.display !== 'none' && style.visibility !== 'hidden') {
        score += 10;
      }

      // Prefer primary/styled buttons
      if (button.className.includes('primary') || button.className.includes('btn-primary')) {
        score += 5;
      }

      if (score > bestScore) {
        bestScore = score;
        bestButton = button;
      }
    }

    return bestButton;
  }

  async analyzeNewForms() {
    // Analyze newly added forms for auto-fill opportunities
    const forms = this.findAllForms();
    if (forms.length > 0) {
      console.log('New forms detected:', forms.length);
      // Could trigger auto-analysis here
    }
  }

  // Enhanced UI event handlers
  async handleSmartAutofill() {
    const userProfile = await this.getUserProfile();
    if (!userProfile) {
      this.showNotification('Please sign in to use auto-fill', 'error');
      return;
    }

    const result = await this.startSmartAutofill(userProfile);
    if (result.success) {
      this.showNotification(
        `✅ Filled ${result.fieldsFilled}/${result.fieldsFound} fields (${result.successRate}% success)`,
        'success'
      );
    } else {
      this.showNotification(`❌ Auto-fill failed: ${result.error}`, 'error');
    }
  }

  async handleAnalyze() {
    const result = await this.analyzeCurrentJob();
    if (result.success) {
      this.showNotification('✅ Job analysis completed!', 'success');
    } else {
      this.showNotification('❌ Job analysis failed', 'error');
    }
  }

  async handleSaveJob() {
    if (!this.currentJobData) {
      this.showNotification('No job data found on this page', 'error');
      return;
    }

    try {
      const result = await chrome.runtime.sendMessage({
        action: 'saveJob',
        data: {
          jobTitle: this.currentJobData.title,
          company: this.currentJobData.company,
          location: this.currentJobData.location,
          jobUrl: window.location.href,
          description: this.currentJobData.description,
          source: 'extension_v2'
        }
      });

      if (result.success) {
        this.showNotification('✅ Job saved successfully!', 'success');
      } else {
        throw new Error('Failed to save job');
      }
    } catch (error) {
      console.error('Save job error:', error);
      this.showNotification('❌ Failed to save job', 'error');
    }
  }

  async handleCoverLetter() {
    if (!this.currentJobData) {
      this.showNotification('No job data found on this page', 'error');
      return;
    }

    try {
      const userProfile = await this.getUserProfile();
      const result = await chrome.runtime.sendMessage({
        action: 'generateCoverLetter',
        data: {
          jobData: this.currentJobData,
          userProfile: userProfile
        }
      });

      if (result.success) {
        await navigator.clipboard.writeText(result.coverLetter);
        this.showNotification('✅ Cover letter generated and copied!', 'success');
        
        // Try to fill cover letter field
        await this.fillCoverLetter(result.coverLetter);
      } else {
        throw new Error('Failed to generate cover letter');
      }
    } catch (error) {
      console.error('Cover letter error:', error);
      this.showNotification('❌ Failed to generate cover letter', 'error');
    }
  }

  async fillCoverLetter(coverLetter) {
    try {
      const textAreas = document.querySelectorAll('textarea');
      
      for (const textarea of textAreas) {
        const fieldInfo = this.analyzeFieldAdvanced(textarea);
        
        if (fieldInfo.combined.includes('cover') || 
            fieldInfo.combined.includes('letter') || 
            fieldInfo.combined.includes('motivation') ||
            fieldInfo.combined.includes('message')) {
          
          await this.fillTextAreaSmart(textarea, coverLetter);
          return { success: true };
        }
      }

      return { success: false, error: 'Cover letter field not found' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async analyzeCurrentJob() {
    const jobData = await this.extractJobDetails();
    
    if (jobData.success) {
      // Update UI with job info
      this.updateJobInfo(jobData.jobData);
      
      // Send to background for analysis - background script handles authentication
      try {
        const result = await chrome.runtime.sendMessage({
          action: 'analyzeJob',
          data: {
            jobData: jobData.jobData,
            userProfile: null, // Let background script get profile with proper auth
            source: 'manual_analysis' // Mark as manual to allow notifications
          }
        });

        if (result.success) {
          this.updateJobMatch(result.analysis);
        }

        return { success: true, analysis: result.analysis };
      } catch (error) {
        console.error('Job analysis error:', error);
        return { success: false, error: error.message };
      }
    }
    
    return jobData;
  }

  updateJobMatch(analysis) {
    const matchEl = document.getElementById('autojobr-job-match');
    if (matchEl && analysis) {
      // Use the exact same score from server response without any local modifications
      const score = analysis.matchScore || 0;
      console.log('Content script updating job match with server score:', score);
      
      const level = score >= 80 ? 'Excellent' : 
                   score >= 60 ? 'Good' : 
                   score >= 40 ? 'Fair' : 'Poor';
      
      matchEl.innerHTML = `
        <div class="match-score ${level.toLowerCase()}">
          ${score}% Match (${level})
        </div>
      `;
      
      console.log('Updated automatic popup with match score:', score, level);
    }
  }

  async saveCurrentJob() {
    return await this.handleSaveJob();
  }

  async getUserProfile() {
    try {
      // Check cache first to prevent excessive requests
      if (this.cachedProfile && Date.now() - this.cachedProfile.timestamp < 300000) { // 5 minutes
        return this.cachedProfile.data;
      }
      
      const result = await chrome.runtime.sendMessage({
        action: 'getUserProfile'
      });

      if (result.success && result.profile) {
        console.log('Extension received user profile:', {
          firstName: result.profile.firstName,
          lastName: result.profile.lastName,
          fullName: result.profile.fullName,
          skillsCount: result.profile.skills?.length || 0
        });
        
        // Cache successful profile
        this.cachedProfile = { data: result.profile, timestamp: Date.now() };
        return result.profile;
      }

      // Handle authentication errors gracefully
      if (result.error && result.error.includes('401')) {
        console.log('User not authenticated - skipping profile fetch');
        return null;
      }

      return null;
    } catch (error) {
      console.error('Failed to get user profile:', error);
      return null;
    }
  }

  showNotification(message, type = 'success') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `autojobr-notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${type === 'success' ? '#22c55e' : type === 'error' ? '#ef4444' : '#3b82f6'};
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      box-shadow: 0 8px 25px rgba(0,0,0,0.2);
      z-index: 10001;
      transform: translateX(100%);
      transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      max-width: 300px;
      word-wrap: break-word;
    `;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
      notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Remove after 4 seconds
    setTimeout(() => {
      notification.style.transform = 'translateX(100%)';
      setTimeout(() => notification.remove(), 300);
    }, 4000);
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Application tracking system - Only tracks actual form submissions
  async setupApplicationTracking() {
    console.log('Setting up application tracking for form submissions only...');
    
    // Only track actual form submissions - not page visits
    document.addEventListener('submit', async (e) => {
      if (this.isJobApplicationForm(e.target)) {
        console.log('Job application form submitted - tracking application');
        // Only track if form actually submitted successfully
        setTimeout(() => this.trackApplicationSubmission(), 3000);
      }
    });

    // Track confirmation pages only when navigating FROM a form submission
    let lastFormSubmissionTime = 0;
    let currentUrl = window.location.href;
    
    // Enhanced form submission tracking
    document.addEventListener('submit', (e) => {
      if (this.isJobApplicationForm(e.target)) {
        lastFormSubmissionTime = Date.now();
        console.log('Form submitted, will monitor for confirmation page');
      }
    });

    // Only check for confirmation if we recently submitted a form (within 30 seconds)
    setInterval(() => {
      if (window.location.href !== currentUrl) {
        currentUrl = window.location.href;
        
        // Only check for confirmation within 30 seconds of form submission
        if (Date.now() - lastFormSubmissionTime < 30000 && lastFormSubmissionTime > 0) {
          this.checkForSubmissionConfirmation();
        }
      }
    }, 2000);
  }

  isJobApplicationForm(form) {
    if (!form || form.tagName !== 'FORM') return false;
    
    const formText = form.textContent.toLowerCase();
    const actionUrl = form.action?.toLowerCase() || '';
    
    return formText.includes('apply') || 
           formText.includes('application') || 
           formText.includes('submit') ||
           actionUrl.includes('apply') ||
           actionUrl.includes('application');
  }

  isSubmissionButton(button) {
    if (!button) return false;
    
    const buttonText = button.textContent?.toLowerCase() || '';
    const buttonValue = button.value?.toLowerCase() || '';
    const buttonClass = button.className?.toLowerCase() || '';
    const buttonId = button.id?.toLowerCase() || '';
    
    const submitKeywords = [
      'submit application', 'apply now', 'submit', 'apply', 'send application',
      'continue to apply', 'review and submit', 'complete application'
    ];
    
    return submitKeywords.some(keyword => 
      buttonText.includes(keyword) || 
      buttonValue.includes(keyword) ||
      buttonClass.includes(keyword.replace(' ', '-')) ||
      buttonId.includes(keyword.replace(' ', '-'))
    );
  }

  async trackApplicationSubmission() {
    try {
      // Double-check this is actually a job application submission
      if (!this.isJobApplicationPage()) {
        console.log('Not a job application page - skipping tracking');
        return;
      }

      const jobData = await this.extractJobDetails();
      
      if (jobData.success && jobData.jobData && jobData.jobData.title) {
        console.log('Tracking confirmed application submission:', jobData.jobData);
        
        const response = await chrome.runtime.sendMessage({
          action: 'trackApplication',
          data: {
            jobTitle: jobData.jobData.title,
            company: jobData.jobData.company,
            location: jobData.jobData.location || '',
            jobUrl: window.location.href,
            status: 'applied',
            source: 'extension',
            platform: this.detectPlatform(window.location.hostname),
            appliedDate: new Date().toISOString()
          }
        });

        if (response && response.success) {
          this.showNotification('✅ Application submitted & tracked!', 'success');
        } else {
          console.log('Application tracking failed:', response);
        }
      } else {
        console.log('No valid job data found - skipping tracking');
      }
    } catch (error) {
      console.error('Failed to track application:', error);
    }
  }

  checkForSubmissionConfirmation() {
    const confirmationPatterns = [
      /thank.*you.*for.*your.*application/i,
      /application.*successfully.*submitted/i,
      /application.*has.*been.*received/i,
      /we.*have.*received.*your.*application/i,
      /application.*confirmation/i
    ];

    const pageText = document.body.textContent.toLowerCase();
    const currentUrl = window.location.href.toLowerCase();
    
    // More strict confirmation detection - must have strong confirmation text
    const hasStrongConfirmation = confirmationPatterns.some(pattern => pattern.test(pageText));
    const hasConfirmationUrl = currentUrl.includes('confirmation') || 
                               currentUrl.includes('thank-you') ||
                               currentUrl.includes('application-submitted');
    
    // Only track if we have BOTH strong text confirmation AND confirmation URL
    if (hasStrongConfirmation && hasConfirmationUrl) {
      console.log('Strong confirmation detected - tracking application');
      this.trackApplicationSubmission();
    }
  }

  detectPlatform(hostname) {
    const platformMap = {
      'linkedin.com': 'LinkedIn',
      'myworkdayjobs.com': 'Workday',
      'indeed.com': 'Indeed',
      'glassdoor.com': 'Glassdoor',
      'lever.co': 'Lever',
      'greenhouse.io': 'Greenhouse',
      'ashbyhq.com': 'AshbyHQ'
    };

    for (const [domain, platform] of Object.entries(platformMap)) {
      if (hostname.includes(domain)) {
        return platform;
      }
    }
    return 'Unknown';
  }

  // Create floating button that opens extension popup
  createFloatingButton() {
    // Show on any job page, not just application forms
    if (!this.isJobPage()) {
      return;
    }

    // Don't create multiple buttons
    if (document.getElementById('autojobr-floating-button')) {
      return;
    }

    const button = document.createElement('div');
    button.id = 'autojobr-floating-button';
    button.innerHTML = `
      <div style="
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 60px;
        height: 60px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border-radius: 50%;
        box-shadow: 0 4px 20px rgba(102, 126, 234, 0.4);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        transition: all 0.3s ease;
        animation: pulse 2s infinite;
      " title="Open AutoJobr Extension">
        <span style="color: white; font-weight: bold; font-size: 18px;">AJ</span>
      </div>
      <style>
        @keyframes pulse {
          0% { box-shadow: 0 4px 20px rgba(102, 126, 234, 0.4); }
          50% { box-shadow: 0 4px 20px rgba(102, 126, 234, 0.8); }
          100% { box-shadow: 0 4px 20px rgba(102, 126, 234, 0.4); }
        }
        #autojobr-floating-button:hover > div {
          transform: scale(1.1);
          box-shadow: 0 6px 25px rgba(102, 126, 234, 0.6);
        }
      </style>
    `;

    document.body.appendChild(button);

    // Open extension popup when clicked
    button.addEventListener('click', () => {
      chrome.runtime.sendMessage({ action: 'openPopup' });
    });

    // Auto-fade after 30 seconds
    setTimeout(() => {
      if (button.parentNode) {
        button.style.opacity = '0.3';
      }
    }, 30000);

    // Reappear on scroll
    let scrollTimeout;
    window.addEventListener('scroll', () => {
      if (button.parentNode) {
        button.style.opacity = '1';
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
          button.style.opacity = '0.3';
        }, 5000);
      }
    });
  }

  isJobApplicationPage() {
    const url = window.location.href.toLowerCase();
    const hostname = window.location.hostname.toLowerCase();
    
    // LinkedIn specific detection - avoid feeds, home, search pages
    if (hostname.includes('linkedin.com')) {
      // Must be jobs page AND have easy apply or application form
      const isJobsPage = url.includes('/jobs/view/') || url.includes('/jobs/collections/');
      const hasEasyApply = document.querySelector('[data-test-modal="jobs-easy-apply-modal"], .jobs-easy-apply-content, .jobs-apply-button');
      const isFeedPage = url.includes('/feed/') || url.includes('/mynetwork/') || url === 'https://www.linkedin.com/';
      
      return isJobsPage && hasEasyApply && !isFeedPage;
    }
    
    // Workday specific detection
    if (hostname.includes('myworkdayjobs.com')) {
      return url.includes('/job/') && document.querySelector('form[data-automation-id="jobApplicationForm"], .css-1x9zq2f');
    }
    
    // Indeed specific detection
    if (hostname.includes('indeed.com')) {
      return url.includes('/viewjob') && document.querySelector('.indeed-apply-button, .ia-IndeedApplyButton');
    }
    
    // Generic detection for other sites
    const pageText = document.body.textContent.toLowerCase();
    const hasStrictJobForm = document.querySelectorAll('input[type="file"][accept*="pdf"], textarea[name*="cover"], input[name*="resume"]').length > 0;
    const hasApplyButton = document.querySelector('[class*="apply"], [id*="apply"], button[data-test*="apply"]');
    
    return hasStrictJobForm && hasApplyButton;
  }

  // Setup automatic job analysis when new pages load - prevent duplicates
  setupAutoAnalysis() {
    console.log('🎯 Setting up automatic job analysis with debouncing');
    
    // Debounced analysis function to prevent multiple calls
    this.debouncedAnalysis = this.debounce(() => {
      const currentUrl = window.location.href;
      
      // Skip if already analyzing this URL
      if (this.analysisInProgress || this.lastAnalysisUrl === currentUrl) {
        console.log('🔄 Skipping duplicate analysis for:', currentUrl);
        return;
      }
      
      this.lastAnalysisUrl = currentUrl;
      this.analysisInProgress = true;
      
      // Clear any cached job data first
      this.currentJobData = null;
      
      // Check if this is a job page
      if (this.isJobPage()) {
        console.log('📍 Job page detected - showing widget immediately:', currentUrl);
        // Show widget immediately on job pages
        this.showWidget();
        
        // Then start job detection and analysis
        this.detectJobPosting().then((result) => {
          if (result && result.success) {
            console.log('✅ Job detected successfully, updating widget with job info');
            this.updateJobInfo(result.jobData);
            // Perform auto-analysis after successful detection
            setTimeout(() => {
              this.performAutoAnalysis().finally(() => {
                this.analysisInProgress = false;
              });
            }, 1000);
          } else {
            console.log('⚠️ Job detection failed, but keeping widget visible');
            // Keep widget visible even if job detection fails
            this.analysisInProgress = false;
          }
        }).catch((error) => {
          console.log('❌ Job detection error, but keeping widget visible:', error);
          this.analysisInProgress = false;
        });
      } else {
        this.hideWidget();
        this.analysisInProgress = false;
      }
    }, 2000); // 2 second debounce
    
    // Initial analysis
    setTimeout(() => {
      this.debouncedAnalysis();
    }, 1500);
    
    // Watch for URL changes (SPA navigation)
    let currentUrl = window.location.href;
    const urlObserver = new MutationObserver(() => {
      if (window.location.href !== currentUrl) {
        currentUrl = window.location.href;
        console.log('🔄 URL changed to:', currentUrl);
        this.debouncedAnalysis();
      }
    });
    
    urlObserver.observe(document.body, { childList: true, subtree: true });
    this.observers.push(urlObserver);
  }

  // Debounce utility function
  debounce(func, wait) {
    return (...args) => {
      clearTimeout(this.analysisDebounceTimer);
      this.analysisDebounceTimer = setTimeout(() => func.apply(this, args), wait);
    };
  }

  async performAutoAnalysis() {
    try {
      console.log('🎯 Starting fresh automatic job analysis');
      
      // Always extract fresh job data
      const jobData = this.extractJobData();
      if (!jobData || !jobData.title) {
        console.log('No job data found for analysis');
        return;
      }

      console.log('📋 Fresh job data extracted:', {
        title: jobData.title,
        company: jobData.company,
        hasDescription: !!jobData.description
      });

      // Get fresh user profile with auth caching
      const now = Date.now();
      if (now - this.lastAuthCheck < 60000 && !this.cachedProfile) { // 1 minute cooldown
        console.log('User not authenticated - skipping auto analysis (cached)');
        return;
      }
      
      const profile = await this.getUserProfile();
      if (!profile || !profile.authenticated) {
        console.log('User not authenticated - skipping auto analysis');
        this.lastAuthCheck = now; // Cache auth check to prevent spam
        return;
      }

      console.log('👤 Fresh user profile retrieved:', {
        skillsCount: profile.skills?.length || 0,
        title: profile.professionalTitle
      });

      // Perform enhanced job analysis with fresh data (automatic - no notifications)
      const analysis = await this.analyzeJobWithAPI(jobData, profile, true); // Pass true for automatic
      if (analysis) {
        console.log('✅ Fresh analysis completed - match score:', analysis.matchScore);
        
        // Update floating button with fresh analysis results
        this.updateFloatingButtonWithAnalysis(analysis);
        console.log('Updated automatic popup with fresh analysis:', analysis.matchScore);
      }
    } catch (error) {
      console.error('Auto-analysis failed:', error);
    }
  }

  extractJobData() {
    const url = window.location.href;
    const hostname = window.location.hostname.toLowerCase();
    
    let jobData = {
      title: '',
      company: '',
      description: '',
      location: '',
      salary: '',
      url: url
    };

    // LinkedIn job extraction
    if (hostname.includes('linkedin.com')) {
      jobData.title = document.querySelector('.job-details-jobs-unified-top-card__job-title, .job-title')?.textContent?.trim() || '';
      jobData.company = document.querySelector('.job-details-jobs-unified-top-card__company-name, .company-name')?.textContent?.trim() || '';
      jobData.location = document.querySelector('.job-details-jobs-unified-top-card__bullet, .job-location')?.textContent?.trim() || '';
      jobData.description = document.querySelector('.job-details__description-text, .job-view-description')?.textContent?.trim() || '';
    }
    
    // Workday job extraction
    else if (hostname.includes('myworkdayjobs.com')) {
      jobData.title = document.querySelector('[data-automation-id="jobPostingHeader"], .css-1id67r3')?.textContent?.trim() || '';
      jobData.company = document.querySelector('[data-automation-id="jobPostingCompany"], .css-1x9zq2f')?.textContent?.trim() || '';
      jobData.location = document.querySelector('[data-automation-id="jobPostingLocation"]')?.textContent?.trim() || '';
      jobData.description = document.querySelector('[data-automation-id="jobPostingDescription"]')?.textContent?.trim() || '';
    }
    
    // Indeed job extraction
    else if (hostname.includes('indeed.com')) {
      jobData.title = document.querySelector('[data-jk] h1, .jobsearch-JobInfoHeader-title')?.textContent?.trim() || '';
      jobData.company = document.querySelector('[data-testid="inlineHeader-companyName"]')?.textContent?.trim() || '';
      jobData.location = document.querySelector('[data-testid="job-location"]')?.textContent?.trim() || '';
      jobData.description = document.querySelector('#jobDescriptionText, .jobsearch-jobDescriptionText')?.textContent?.trim() || '';
    }
    
    // Generic extraction for other sites
    else {
      jobData.title = document.querySelector('h1, .job-title, [class*="title"]')?.textContent?.trim() || '';
      jobData.company = document.querySelector('.company, [class*="company"]')?.textContent?.trim() || '';
      jobData.description = document.querySelector('.description, .job-description, [class*="description"]')?.textContent?.trim() || '';
    }

    return jobData.title ? jobData : null;
  }

  async analyzeJobWithAPI(jobData, userProfile, isAutomatic = false) {
    try {
      // Use background script for authentication instead of direct API calls
      const result = await chrome.runtime.sendMessage({
        action: 'analyzeJob',
        data: {
          jobData: {
            title: jobData.title,
            company: jobData.company,
            description: jobData.description,
            requirements: jobData.description,
            qualifications: jobData.description,
            benefits: jobData.description,
            location: jobData.location,
            salary: jobData.salary,
            url: jobData.url
          },
          userProfile,
          source: isAutomatic ? 'extension_automatic_popup' : 'manual_analysis'
        }
      });

      if (result && result.success) {
        return result.analysis;
      } else {
        console.error('Job analysis failed:', result?.error || 'Unknown error');
        return null;
      }
    } catch (error) {
      console.error('Job analysis API error:', error);
      return null;
    }
  }

  updateFloatingButtonWithAnalysis(analysis) {
    const button = document.getElementById('autojobr-floating-button');
    if (!button) return;

    const score = analysis.matchScore || analysis.analysis?.matchScore || 0;
    const scoreText = `${Math.round(score)}%`;
    
    // Update button with score and click handler to open extension popup
    button.innerHTML = `
      <div style="
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 60px;
        height: 60px;
        background: linear-gradient(135deg, ${this.getScoreColor(score)} 0%, ${this.getScoreColor(score)}dd 100%);
        border-radius: 50%;
        box-shadow: 0 4px 20px rgba(102, 126, 234, 0.4);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        transition: all 0.3s ease;
        animation: pulse 2s infinite;
      " title="Job Match: ${scoreText} - Click to open AutoJobr extension">
        <span style="color: white; font-weight: bold; font-size: 12px; text-align: center;">
          ${scoreText}
        </span>
      </div>
      <style>
        @keyframes pulse {
          0% { box-shadow: 0 4px 20px rgba(102, 126, 234, 0.4); }
          50% { box-shadow: 0 4px 20px rgba(102, 126, 234, 0.8); }
          100% { box-shadow: 0 4px 20px rgba(102, 126, 234, 0.4); }
        }
        #autojobr-floating-button:hover > div {
          transform: scale(1.1);
          box-shadow: 0 6px 25px rgba(102, 126, 234, 0.6);
        }
      </style>
    `;

    // Add click handler to open extension popup
    button.onclick = () => {
      // Try to open popup, fallback to notification
      chrome.runtime.sendMessage({ action: 'openPopup' }, (response) => {
        if (!response?.success) {
          // Show notification if popup couldn't be opened
          const notification = document.createElement('div');
          notification.style.cssText = `
            position: fixed;
            bottom: 90px;
            right: 20px;
            background: rgba(0,0,0,0.9);
            color: white;
            padding: 8px 12px;
            border-radius: 6px;
            font-size: 12px;
            z-index: 10001;
            animation: fadeInUp 0.3s ease;
          `;
          notification.textContent = 'Click the AutoJobr extension icon in your toolbar to view details';
          document.body.appendChild(notification);
          
          // Remove notification after 3 seconds
          setTimeout(() => notification.remove(), 3000);
        }
      });
    };

    // Store analysis data for popup use
    this.currentAnalysis = analysis;
  }

  getScoreColor(score) {
    if (score >= 80) return '#22c55e';
    if (score >= 60) return '#f59e0b';
    if (score >= 40) return '#f97316';
    return '#ef4444';
  }

  // Removed duplicate getUserProfile method - using the background script version instead

  async getApiUrl() {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ action: 'getApiUrl' }, (response) => {
        resolve(response?.apiUrl || 'https://autojobr.com');
      });
    });
  }

  // Handle resume upload functionality
  async handleResumeUpload() {
    try {
      const status = document.getElementById('autojobr-status');
      this.updateStatus('🔄 Fetching your resume...', 'loading');
      
      // Get user's active resume from server
      const apiUrl = await this.getApiUrl();
      const response = await fetch(`${apiUrl}/api/resumes/active`, {
        method: 'GET',
        credentials: 'include'
      });
      
      if (!response.ok) {
        this.updateStatus('❌ No resume found. Please upload one in your dashboard.', 'error');
        return;
      }
      
      // Get the resume as blob
      const resumeBlob = await response.blob();
      const fileName = response.headers.get('Content-Disposition')?.match(/filename="(.+)"/)?.[1] || 'resume.pdf';
      
      // Find file input fields on the page
      const fileInputs = this.findResumeFields();
      
      if (fileInputs.length === 0) {
        this.updateStatus('❌ No file upload fields found on this page.', 'error');
        return;
      }
      
      // Create File object from blob
      const resumeFile = new File([resumeBlob], fileName, { type: resumeBlob.type });
      
      // Upload to all found file inputs
      let uploadCount = 0;
      for (const input of fileInputs) {
        try {
          const dataTransfer = new DataTransfer();
          dataTransfer.items.add(resumeFile);
          input.files = dataTransfer.files;
          
          // Trigger change event
          input.dispatchEvent(new Event('change', { bubbles: true }));
          uploadCount++;
        } catch (error) {
          console.error('Failed to upload to input:', error);
        }
      }
      
      if (uploadCount > 0) {
        this.updateStatus(`✅ Resume uploaded to ${uploadCount} field(s)`, 'success');
      } else {
        this.updateStatus('❌ Failed to upload resume to any fields', 'error');
      }
      
    } catch (error) {
      console.error('Resume upload error:', error);
      this.updateStatus('❌ Resume upload failed', 'error');
    }
  }
  
  // Find resume/file upload fields
  findResumeFields() {
    const fileInputs = [];
    
    // Look for file inputs with resume-related attributes
    const inputs = document.querySelectorAll('input[type="file"]');
    
    inputs.forEach(input => {
      const inputText = (
        input.name + ' ' + 
        input.id + ' ' + 
        input.className + ' ' + 
        (input.placeholder || '') + ' ' +
        (input.getAttribute('aria-label') || '') + ' ' +
        (input.getAttribute('data-automation-id') || '')
      ).toLowerCase();
      
      const resumeKeywords = ['resume', 'cv', 'curriculum', 'document', 'file', 'attachment', 'upload'];
      
      if (resumeKeywords.some(keyword => inputText.includes(keyword))) {
        fileInputs.push(input);
      }
    });
    
    // If no specific resume fields found, return all file inputs
    if (fileInputs.length === 0) {
      return Array.from(inputs);
    }
    
    return fileInputs;
  }
  
  // Load and display user tasks
  async loadUserTasks() {
    try {
      const apiUrl = await this.getApiUrl();
      const response = await fetch(`${apiUrl}/api/reminders/pending`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          console.log('User not authenticated - skipping task load');
          return;
        }
        console.error('Task API error:', response.status, response.statusText);
        return;
      }
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error('Expected JSON response but got:', contentType);
        return;
      }
      
      const data = await response.json();
      if (data.success && data.reminders && data.reminders.length > 0) {
        this.displayTasks(data.reminders);
      }
    } catch (error) {
      console.error('Failed to load tasks:', error);
    }
  }
  
  // Display tasks in the widget
  displayTasks(reminders) {
    const tasksSection = document.getElementById('autojobr-tasks');
    const tasksCount = document.getElementById('tasks-count');
    const tasksList = document.getElementById('tasks-list');
    
    if (!tasksSection || !tasksCount || !tasksList) return;
    
    tasksCount.textContent = reminders.length;
    tasksSection.style.display = 'block';
    
    tasksList.innerHTML = '';
    
    reminders.forEach(reminder => {
      const taskElement = document.createElement('div');
      taskElement.className = 'task-item';
      taskElement.innerHTML = `
        <div class="task-content">
          <div class="task-title">${reminder.taskTitle}</div>
          <div class="task-time">${this.formatRelativeTime(reminder.triggerDateTime)}</div>
        </div>
        <div class="task-actions">
          <button class="task-complete" data-task-id="${reminder.taskId}" title="Mark Complete">✓</button>
          <button class="task-snooze" data-reminder-id="${reminder.reminderId}" title="Snooze 15 min">💤</button>
        </div>
      `;
      
      // Add event listeners
      taskElement.querySelector('.task-complete')?.addEventListener('click', (e) => {
        this.markTaskComplete(reminder.taskId);
        taskElement.remove();
      });
      
      taskElement.querySelector('.task-snooze')?.addEventListener('click', (e) => {
        this.snoozeReminder(reminder.reminderId);
        taskElement.remove();
      });
      
      tasksList.appendChild(taskElement);
    });
  }
  
  // Mark task as complete
  async markTaskComplete(taskId) {
    try {
      const apiUrl = await this.getApiUrl();
      const response = await fetch(`${apiUrl}/api/tasks/${taskId}/status`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ status: 'completed' })
      });
      
      if (response.ok) {
        this.updateTaskCount(-1);
      } else {
        console.error('Failed to mark task complete:', response.status);
      }
    } catch (error) {
      console.error('Failed to mark task complete:', error);
    }
  }
  
  // Snooze reminder
  async snoozeReminder(reminderId) {
    try {
      const apiUrl = await this.getApiUrl();
      const response = await fetch(`${apiUrl}/api/reminders/${reminderId}/snooze`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ snoozeMinutes: 15 })
      });
      
      if (response.ok) {
        this.updateTaskCount(-1);
      } else {
        console.error('Failed to snooze reminder:', response.status);
      }
    } catch (error) {
      console.error('Failed to snooze reminder:', error);
    }
  }
  
  // Update task count
  updateTaskCount(delta) {
    const tasksCount = document.getElementById('tasks-count');
    if (tasksCount) {
      const current = parseInt(tasksCount.textContent) || 0;
      const newCount = Math.max(0, current + delta);
      tasksCount.textContent = newCount;
      
      if (newCount === 0) {
        document.getElementById('autojobr-tasks').style.display = 'none';
      }
    }
  }
  
  // Format relative time
  formatRelativeTime(dateTimeString) {
    const date = new Date(dateTimeString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return `${Math.floor(diffMins / 1440)}d ago`;
  }

  // Cleanup method
  destroy() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    
    const overlay = document.getElementById('autojobr-overlay');
    const button = document.getElementById('autojobr-floating-button');
    if (overlay) overlay.remove();
    if (button) button.remove();
  }
}

// Add message listener for getting current analysis data
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'getCurrentAnalysis') {
    const extension = window.autojobrExtension;
    if (extension && extension.currentAnalysis) {
      sendResponse({
        success: true,
        analysis: extension.currentAnalysis,
        jobData: extension.extractJobData()
      });
    } else {
      sendResponse({ success: false });
    }
  }
  return true;
});

// Initialize content script
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    const extension = new AutoJobrContentScript();
    window.autojobrExtension = extension; // Store reference for message handling
    // Show floating button on job pages after a delay
    setTimeout(() => extension.createFloatingButton(), 1000);
  });
} else {
  const extension = new AutoJobrContentScript();
  window.autojobrExtension = extension; // Store reference for message handling
  // Show floating button on job pages after a delay  
  setTimeout(() => extension.createFloatingButton(), 1000);
}