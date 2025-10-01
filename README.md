# AutoJobr Chrome Extension

The AutoJobr Chrome Extension is a smart job application assistant that automatically detects job boards, analyzes job postings, and helps you apply faster with AI-powered features.

## 🚀 Features

- **Auto-Fill Applications**: Intelligent form filling on 100+ job boards including LinkedIn, Indeed, Workday, Greenhouse, and more
- **Job Analysis**: Real-time job compatibility scoring based on your profile
- **Save Jobs**: Save interesting positions for later application
- **AI Cover Letters**: Generate personalized cover letters using AI
- **Application Tracking**: Automatic tracking of submitted applications
- **Multi-Platform Support**: Works on major job boards and company career pages

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

1. **Sign in to AutoJobr**: Make sure you're logged into your AutoJobr account on the main website
2. **Navigate to a job board**: Visit LinkedIn, Indeed, or any supported job platform
3. **Click the AutoJobr icon**: The extension popup will show your connection status

### Core Functions

#### 🔍 Job Analysis
- Automatically analyzes job postings for compatibility with your profile
- Shows match score based on skills, experience, and location
- Provides recommendations for application strategy

#### ✏️ Auto-Fill Applications
- Click "Autofill Application" to automatically fill form fields
- Uses your AutoJobr profile data (skills, experience, education)
- Handles multi-step application forms intelligently
- Works with file uploads and dropdown selections

#### 💾 Save Jobs
- Save interesting positions to review later
- Automatically syncs with your AutoJobr dashboard
- Access saved jobs from the main application

#### 📝 Generate Cover Letters
- AI-powered cover letter generation
- Personalized based on your profile and the specific job
- Automatically fills cover letter fields when detected

#### 📊 Application Tracking
- Automatically tracks when you submit applications
- Syncs with your AutoJobr applications dashboard
- Maintains comprehensive application history

### Supported Job Boards

- **Major Platforms**: LinkedIn, Indeed, Glassdoor, ZipRecruiter, Monster
- **Tech-Focused**: Stack Overflow Jobs, AngelList, Dice
- **ATS Systems**: Workday, Greenhouse, Lever, iCIMS, SmartRecruiters
- **Company Sites**: Google Careers, Amazon Jobs, Microsoft, Apple, Meta
- **And 90+ more platforms**

## ⚙️ Settings

Access settings through the extension popup:

- **Auto-fill enabled**: Toggle automatic form filling
- **Job tracking**: Enable/disable application tracking
- **Notifications**: Control browser notifications

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

## 🔄 Updates

The extension will automatically use the latest API endpoints from your AutoJobr server. No manual updates required for API changes.

---

**Note**: This extension requires an active AutoJobr account and works in conjunction with the main AutoJobr web application.