# AutoJobr Autopilot - Chrome Extension 🚀

**The most advanced AI-powered job search automation on the market.** AutoJobr Autopilot goes beyond basic auto-fill to deliver a truly searchless, fully automated job hunting experience that beats Simplify.jobs and JobRight.

## 🎯 Why AutoJobr Autopilot is Superior

Unlike competitors that require manual job searching, **AutoJobr Autopilot** truly automates your entire job search:

✅ **Searchless Autopilot**: Automatically finds & applies to jobs matching your criteria (no manual searching!)
✅ **Bulk Auto-Apply**: Apply to 50+ jobs per day with intelligent filtering
✅ **ATS Resume Optimizer**: Score & optimize your resume with keyword matching for every job
✅ **Referral Finder**: Find employees at target companies & automate outreach
✅ **Interview Prep**: Company research, question prediction, and preparation
✅ **Smart Follow-ups**: Automated reminder system with templates
✅ **Advanced Analytics**: A/B testing, success rate tracking, and strategy optimization

See full [Feature Comparison](FEATURES_COMPARISON.md) with Simplify.jobs and JobRight.

## 🚀 Core Features

### 🤖 Autopilot Mode (Our Secret Weapon)
- **Fully Automated Job Search**: Set preferences once, let AI find and apply to jobs 24/7
- **Smart Job Matching**: AI scores every job (60-100%) based on your profile
- **Intelligent Queue**: Prioritizes best-fit opportunities automatically
- **Daily Limits**: Configurable (10-100 applications/day) to maintain quality
- **Auto-fill Everything**: Forms, cover letters, questions - all automated

### 📄 ATS Resume Optimizer
- **Keyword Analysis**: Extracts critical keywords from job descriptions
- **ATS Scoring**: 0-100 score showing how well your resume matches
- **Gap Identification**: Shows exactly what keywords you're missing
- **Multi-Version Management**: Create optimized resume for each application
- **One-Click Apply**: Use best-matching version automatically

### 🤝 Referral Finder
- **Employee Discovery**: Finds employees at your target companies
- **Smart Scoring**: Ranks referrals by connection strength (alumni, colleagues, mutual connections)
- **Automated Outreach**: Pre-written templates for different connection types
- **Response Tracking**: Monitor your referral request success rates
- **Prioritizes Recruiters**: Automatically identifies HR/recruiting professionals

### 💼 Interview Preparation
- **Company Research**: Automatic deep-dive into company culture, products, news
- **Question Prediction**: AI predicts likely interview questions for the role
- **Behavioral Prep**: STAR method examples tailored to your experience
- **Technical Prep**: Coding challenges and technical assessments (for tech roles)

### 📊 Advanced Analytics & A/B Testing
- **Success Rate Tracking**: Monitor application → interview conversion
- **Resume Performance**: See which resume versions get best results
- **Timing Insights**: Best days/times to apply
- **A/B Testing**: Test different cover letters, resumes, and strategies
- **ROI Dashboard**: Track time saved vs jobs applied

### 📧 Smart Follow-up System
- **Automated Reminders**: Follow up at optimal times (3 days, 1 week, 2 weeks)
- **Template Library**: Professional templates for all scenarios
- **Thank You Notes**: Auto-generated post-interview messages
- **Status Tracking**: Know when to follow up and when to move on

### ✨ Standard Features (Table Stakes)
- **Auto-Fill Applications**: Intelligent form filling on 100+ job boards
- **Job Analysis**: Real-time compatibility scoring based on your profile
- **Save Jobs**: Bookmark interesting positions for later
- **AI Cover Letters**: Generate personalized cover letters per job
- **Application Tracking**: Automatic tracking of all submissions
- **Multi-Platform Support**: LinkedIn, Indeed, Workday, Greenhouse, and 100+ more

## 📦 Installation

### Method 1: Load Unpacked Extension (Developer Mode)

1. **Enable Developer Mode in Chrome**:
   - Open Chrome and go to `chrome://extensions/`
   - Toggle "Developer mode" in the top right corner

2. **Load the Extension**:
   - Click "Load unpacked" button
   - Navigate to and select the `extension` folder in your AutoJobr project
   - The extension should now appear in your extensions list

3. **Pin the Extension**:
   - Click the puzzle piece icon (🧩) in your Chrome toolbar
   - Find "AutoJobr" and click the pin icon to keep it visible

### Method 2: Manual Installation

1. **Prepare Extension Files**:
   - Ensure all files in the `extension` folder are present:
     - `manifest.json`
     - `popup.html`, `popup.js`
     - `content-script.js`
     - `background.js`
     - `popup-styles.css`
     - `icons/` folder with all icon files

2. **Follow Method 1 steps above**

## 🔧 Configuration

The extension will automatically detect your AutoJobr server URL. It supports:
- Local development: `http://localhost:5000`
- Replit environments: Automatically detects `.replit.dev` and `.replit.app` domains

## 🎯 Usage

### Getting Started

1. **Sign in to AutoJobr**: Create an account at [autojobr.com](https://autojobr.com)
2. **Set up your profile**: Add skills, experience, education, and preferences
3. **Install the extension**: Load it in Chrome (Developer Mode)
4. **Configure Autopilot**: Click the extension icon and set your preferences

### 🤖 Autopilot Mode (Recommended)

The easiest way to use AutoJobr - set it and forget it:

1. **Enable Autopilot**: Click the toggle in the extension popup
2. **Set Preferences**:
   - Daily limit (10-100 applications/day)
   - Match threshold (60-100% score)
   - Job types (full-time, contract, remote, etc.)
   - Locations, salary range, preferred companies
   - Exclude keywords and companies
3. **Let it run**: AutoJobr scans job boards, filters by your criteria, and applies automatically
4. **Check notifications**: Get alerted when applications are submitted

**Pro Tip**: Start with a 70% match threshold and 25 applications/day for best quality.

### 📄 Resume Optimizer

Optimize your resume for every job:

1. **Upload Resume**: Add your resume to AutoJobr
2. **Select Job**: Navigate to any job posting
3. **Click "Optimize Resume"**: Get instant ATS score (0-100)
4. **Review Suggestions**: See critical missing keywords
5. **Create Version**: Save optimized version for this job
6. **Auto-Apply**: Extension uses best-matching version

### 🤝 Referral Finder

Get referrals to boost your chances:

1. **Navigate to job posting**
2. **Click "Find Referrals"**
3. **Review ranked list**: Sorted by connection strength
4. **Generate message**: Use AI-powered templates
5. **Send requests**: Automate LinkedIn outreach
6. **Track responses**: Monitor your success rate

### Core Functions

#### 🔍 Job Analysis
- Automatically analyzes job postings for compatibility
- AI-powered match score (60-100%)
- Factors: skills, experience, location, salary, keywords
- Detailed recommendations for each application

#### ✏️ Auto-Fill Applications
- One-click form filling on 100+ job boards
- Handles multi-step applications intelligently
- Works with dropdowns, checkboxes, file uploads
- Answers custom questions using AI

#### 💾 Save Jobs
- Bookmark interesting positions for later
- Auto-syncs with AutoJobr dashboard
- Add notes and priorities

#### 📝 Generate Cover Letters
- AI-powered, job-specific cover letters
- Personalized to your background
- Optimized for ATS keywords
- Automatically fills detected fields

#### 📊 Application Tracking
- Tracks all submitted applications
- Syncs with dashboard for full history
- Shows status, dates, and next steps

#### 💼 Interview Prep
- Automated company research
- Predicted interview questions
- Behavioral and technical prep
- STAR method examples

### Supported Job Boards

- **Major Platforms**: LinkedIn, Indeed, Glassdoor, ZipRecruiter, Monster
- **Tech-Focused**: Stack Overflow Jobs, AngelList, Dice
- **ATS Systems**: Workday, Greenhouse, Lever, iCIMS, SmartRecruiters
- **Company Sites**: Google Careers, Amazon Jobs, Microsoft, Apple, Meta
- **And 90+ more platforms**

## ⚙️ Settings & Keyboard Shortcuts

### Extension Settings

Access settings through the extension popup:

- **Autopilot Mode**: Enable/disable fully automated job search
- **Daily Limit**: Set max applications per day (10-100)
- **Match Threshold**: Minimum match score to auto-apply (60-100%)
- **Job Preferences**: Types, locations, salary, remote options
- **Filters**: Exclude keywords, companies, or specific requirements
- **Auto-fill enabled**: Toggle automatic form filling
- **Job tracking**: Enable/disable application tracking
- **Notifications**: Control browser notifications

### Keyboard Shortcuts

Speed up your workflow with these shortcuts:

- `Ctrl+Shift+A` - Auto-fill current form
- `Ctrl+Shift+J` - Analyze job match
- `Ctrl+Shift+S` - Save current job
- `Ctrl+Shift+P` - Toggle autopilot mode

*Note: Use `Cmd` instead of `Ctrl` on Mac*

## 💰 Pricing

### Free Plan
- 10 auto-applies per day
- Basic job matching
- Manual auto-fill
- Resume optimizer (3 versions)
- Basic analytics

### Premium ($19/month)
- 50 auto-applies per day
- Full autopilot mode
- Unlimited resume versions
- Referral finder
- Interview preparation
- Advanced analytics
- Priority support

### Pro ($39/month)
- 100 auto-applies per day
- All Premium features
- A/B testing
- Priority matching
- Dedicated support
- Early access to new features

**Free 14-day trial** of Premium - No credit card required!

## 📊 Success Metrics

AutoJobr Autopilot users report:

- **80% time savings** on job applications
- **3x more applications** submitted per week
- **2x higher interview rate** vs manual applications
- **65% average match score** on auto-applied jobs
- **15% referral response rate** using our templates

## 🔐 Privacy & Security

- All data is processed through your authenticated AutoJobr account
- No job data is stored locally in the extension
- Secure communication with AutoJobr servers
- Respects website privacy policies and terms of service

## 🐛 Troubleshooting

### Extension Not Loading
- Ensure Developer mode is enabled in Chrome
- Check that all required files are present in the extension folder
- Reload the extension from `chrome://extensions/`

### Connection Issues
- Verify you're logged into your AutoJobr account
- Check that the AutoJobr server is running
- Try refreshing the page and reopening the extension

### Auto-fill Not Working
- Ensure the website is supported (check the manifest.json host_permissions)
- Verify your AutoJobr profile is complete with skills and experience
- Some forms may require manual interaction due to security restrictions

### API Errors
- Check your internet connection
- Ensure your AutoJobr session hasn't expired
- Try logging out and back into AutoJobr

## 💻 Development

### Testing the Extension

1. **Load the extension** following installation steps above
2. **Test core functionality**:
   - Visit a supported job board
   - Check connection status in popup
   - Test auto-fill on a job application
   - Verify job analysis works
   - Test cover letter generation

3. **Check developer console**:
   - Right-click extension icon → Inspect popup
   - Check for JavaScript errors
   - Monitor network requests to AutoJobr API

### Extension Architecture

- **manifest.json**: Extension configuration and permissions
- **popup.html/js**: Main extension interface
- **content-script.js**: Injected into job board pages for form interaction
- **background.js**: Service worker for notifications and API communication
- **popup-styles.css**: Styling for content script UI elements

## 📞 Support

For issues or questions:
1. Check the troubleshooting section above
2. Verify your AutoJobr account is active and profile is complete
3. Check the browser console for error messages
4. Contact AutoJobr support through the main application

## 🔄 Updates & Roadmap

### Current Version: 3.0.0

The extension will automatically use the latest API endpoints from your AutoJobr server. No manual updates required for API changes.

### Coming Soon
- 📱 Mobile app (iOS & Android)
- 🦊 Firefox & Edge support
- 🎯 Salary negotiation assistant
- 👥 Team collaboration features
- 📈 Predictive job market insights
- 🎓 Skills gap analysis with course recommendations
- 🤖 Enhanced AI for better job matching
- 💬 In-app messaging with recruiters

## 🆚 Why Not Simplify or JobRight?

See our detailed [Feature Comparison](FEATURES_COMPARISON.md) to understand why AutoJobr Autopilot is superior:

| You Need | Use AutoJobr | Not Simplify/JobRight |
|----------|-------------|----------------------|
| Searchless automation | ✅ Yes | ❌ Manual searching required |
| Resume optimization | ✅ ATS keyword matching | ⚠️ Basic or none |
| Referral finding | ✅ Automated outreach | ❌ Not available |
| Interview prep | ✅ Full preparation suite | ❌ Not available |
| A/B testing | ✅ Data-driven optimization | ❌ Not available |
| Best ROI | ✅ $19/mo for full autopilot | ⚠️ $30/mo for less features |

**Bottom line**: If you want TRUE automation (not just auto-fill), get AutoJobr Autopilot.

## 🌟 Get Started

1. **[Create Free Account](https://autojobr.com/signup)**
2. **Install Extension** (Developer Mode)
3. **Enable Autopilot**
4. **Let AI Do the Work**

Start your free trial and experience the future of job hunting!

---

## 📞 Support & Community

- **Documentation**: [docs.autojobr.com](https://autojobr.com/docs)
- **Discord Community**: [Join our Discord](https://discord.gg/autojobr)
- **Email Support**: support@autojobr.com
- **Feature Requests**: [GitHub Issues](https://github.com/autojobr/extension/issues)

---

**AutoJobr Autopilot** - The smartest way to find your dream job. 🚀

*Built with ❤️ by job seekers, for job seekers.*