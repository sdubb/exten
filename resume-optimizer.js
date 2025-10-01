// Resume Optimizer with ATS Keyword Matching
class ResumeOptimizer {
  constructor() {
    this.versions = new Map();
    this.atsKeywords = [];
    this.init();
  }

  async init() {
    await this.loadVersions();
  }

  async loadVersions() {
    const result = await chrome.storage.local.get(['resumeVersions']);
    if (result.resumeVersions) {
      this.versions = new Map(Object.entries(result.resumeVersions));
    }
  }

  async saveVersions() {
    const obj = Object.fromEntries(this.versions);
    await chrome.storage.local.set({ resumeVersions: obj });
  }

  async analyzeJobDescription(jobDescription) {
    // Extract keywords from job description
    const keywords = this.extractKeywords(jobDescription);

    // Categorize keywords
    const categorized = this.categorizeKeywords(keywords);

    // Score keyword importance
    const scored = this.scoreKeywords(categorized, jobDescription);

    return {
      keywords: scored,
      categories: categorized,
      totalKeywords: keywords.length,
      criticalKeywords: scored.filter(k => k.importance === 'critical'),
      recommendedKeywords: scored.filter(k => k.importance === 'high')
    };
  }

  extractKeywords(text) {
    // Common technical skills
    const technicalSkills = [
      'javascript', 'python', 'java', 'c\\+\\+', 'c#', 'ruby', 'php', 'swift',
      'kotlin', 'typescript', 'react', 'angular', 'vue', 'node', 'express',
      'django', 'flask', 'spring', 'laravel', '.net', 'asp.net',
      'sql', 'mysql', 'postgresql', 'mongodb', 'redis', 'elasticsearch',
      'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'jenkins', 'gitlab',
      'git', 'github', 'ci/cd', 'devops', 'agile', 'scrum', 'jira',
      'rest api', 'graphql', 'microservices', 'serverless',
      'machine learning', 'deep learning', 'ai', 'nlp', 'tensorflow',
      'pytorch', 'data science', 'analytics', 'tableau', 'power bi'
    ];

    // Soft skills and qualifications
    const softSkills = [
      'leadership', 'communication', 'teamwork', 'problem solving',
      'analytical', 'creative', 'detail-oriented', 'self-motivated',
      'collaborative', 'adaptable', 'organized', 'time management'
    ];

    // Certifications and degrees
    const certifications = [
      'aws certified', 'azure certified', 'pmp', 'scrum master', 'csm',
      'bachelor', 'master', 'phd', 'mba', 'comptia', 'cisco'
    ];

    const allPatterns = [...technicalSkills, ...softSkills, ...certifications];
    const found = new Set();

    const lowerText = text.toLowerCase();

    for (const pattern of allPatterns) {
      const regex = new RegExp('\\b' + pattern + '\\b', 'gi');
      if (regex.test(lowerText)) {
        found.add(pattern.replace(/\\b|\\+/g, ''));
      }
    }

    // Also extract years of experience
    const expMatch = text.match(/(\d+)\+?\s*years?/gi);
    if (expMatch) {
      expMatch.forEach(exp => found.add(exp.toLowerCase()));
    }

    return Array.from(found);
  }

  categorizeKeywords(keywords) {
    const categories = {
      technical: [],
      soft: [],
      experience: [],
      certification: [],
      tools: []
    };

    const technicalPatterns = ['javascript', 'python', 'java', 'react', 'sql'];
    const softPatterns = ['leadership', 'communication', 'teamwork'];
    const toolPatterns = ['aws', 'docker', 'kubernetes', 'jenkins', 'git'];
    const certPatterns = ['certified', 'bachelor', 'master', 'pmp'];

    for (const kw of keywords) {
      if (kw.includes('year')) {
        categories.experience.push(kw);
      } else if (certPatterns.some(p => kw.includes(p))) {
        categories.certification.push(kw);
      } else if (technicalPatterns.some(p => kw.includes(p))) {
        categories.technical.push(kw);
      } else if (toolPatterns.some(p => kw.includes(p))) {
        categories.tools.push(kw);
      } else if (softPatterns.some(p => kw.includes(p))) {
        categories.soft.push(kw);
      } else {
        categories.technical.push(kw);
      }
    }

    return categories;
  }

  scoreKeywords(categorized, jobDescription) {
    const scored = [];
    const lowerDesc = jobDescription.toLowerCase();

    const allKeywords = [
      ...categorized.technical,
      ...categorized.soft,
      ...categorized.experience,
      ...categorized.certification,
      ...categorized.tools
    ];

    for (const keyword of allKeywords) {
      // Count occurrences
      const regex = new RegExp('\\b' + keyword + '\\b', 'gi');
      const matches = lowerDesc.match(regex);
      const count = matches ? matches.length : 0;

      // Check if in title or early in description
      const titleMatch = lowerDesc.substring(0, 200).includes(keyword);

      // Determine importance
      let importance = 'low';
      if (count >= 3 || titleMatch) {
        importance = 'critical';
      } else if (count >= 2) {
        importance = 'high';
      } else if (count >= 1) {
        importance = 'medium';
      }

      scored.push({
        keyword,
        count,
        importance,
        inTitle: titleMatch,
        category: this.getKeywordCategory(keyword, categorized)
      });
    }

    return scored.sort((a, b) => {
      const importanceOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return importanceOrder[a.importance] - importanceOrder[b.importance];
    });
  }

  getKeywordCategory(keyword, categorized) {
    for (const [cat, keywords] of Object.entries(categorized)) {
      if (keywords.includes(keyword)) return cat;
    }
    return 'other';
  }

  async optimizeResume(resume, jobDescription) {
    const analysis = await this.analyzeJobDescription(jobDescription);

    // Parse resume content
    const resumeData = this.parseResume(resume);

    // Check which keywords are missing
    const missingKeywords = analysis.keywords.filter(kw => {
      const kwLower = kw.keyword.toLowerCase();
      return !resumeData.content.toLowerCase().includes(kwLower);
    });

    // Generate suggestions
    const suggestions = this.generateSuggestions(missingKeywords, resumeData);

    // Calculate ATS score
    const atsScore = this.calculateATSScore(resumeData, analysis);

    return {
      atsScore,
      missingKeywords: missingKeywords.filter(k => k.importance !== 'low'),
      suggestions,
      analysis
    };
  }

  parseResume(resume) {
    // Simple resume parser
    return {
      content: resume.text || resume,
      sections: {
        skills: this.extractSection(resume, 'skills'),
        experience: this.extractSection(resume, 'experience'),
        education: this.extractSection(resume, 'education')
      }
    };
  }

  extractSection(text, section) {
    const sectionRegex = new RegExp(`${section}[:\\s]*(.*?)(?=\\n\\n|$)`, 'is');
    const match = text.match(sectionRegex);
    return match ? match[1].trim() : '';
  }

  generateSuggestions(missingKeywords, resumeData) {
    const suggestions = [];

    const critical = missingKeywords.filter(k => k.importance === 'critical');
    const high = missingKeywords.filter(k => k.importance === 'high');

    if (critical.length > 0) {
      suggestions.push({
        type: 'critical',
        title: 'Add Critical Keywords',
        description: `Your resume is missing ${critical.length} critical keywords that appear frequently in the job description.`,
        keywords: critical.map(k => k.keyword),
        action: 'Add these to your skills section or work experience descriptions'
      });
    }

    if (high.length > 0) {
      suggestions.push({
        type: 'high',
        title: 'Recommended Keywords',
        description: `Consider adding these ${high.length} important keywords to strengthen your match.`,
        keywords: high.map(k => k.keyword),
        action: 'Incorporate naturally into your experience bullet points'
      });
    }

    return suggestions;
  }

  calculateATSScore(resumeData, analysis) {
    const totalKeywords = analysis.keywords.length;
    const matchedKeywords = analysis.keywords.filter(kw => {
      const kwLower = kw.keyword.toLowerCase();
      return resumeData.content.toLowerCase().includes(kwLower);
    }).length;

    const criticalMatches = analysis.criticalKeywords.filter(kw => {
      const kwLower = kw.keyword.toLowerCase();
      return resumeData.content.toLowerCase().includes(kwLower);
    }).length;

    // Weight critical keywords more heavily
    const criticalWeight = 0.6;
    const overallWeight = 0.4;

    const criticalScore = (criticalMatches / Math.max(analysis.criticalKeywords.length, 1)) * 100 * criticalWeight;
    const overallScore = (matchedKeywords / Math.max(totalKeywords, 1)) * 100 * overallWeight;

    return Math.round(criticalScore + overallScore);
  }

  async createOptimizedVersion(resume, jobTitle, company, optimizations) {
    const versionId = `${company}_${jobTitle}_${Date.now()}`.replace(/\s/g, '_');

    const version = {
      id: versionId,
      originalResume: resume,
      jobTitle,
      company,
      optimizations,
      createdAt: new Date().toISOString(),
      atsScore: optimizations.atsScore
    };

    this.versions.set(versionId, version);
    await this.saveVersions();

    return version;
  }

  async getVersions() {
    return Array.from(this.versions.values());
  }

  async getVersion(versionId) {
    return this.versions.get(versionId);
  }

  async deleteVersion(versionId) {
    this.versions.delete(versionId);
    await this.saveVersions();
  }
}

// Export for use in background script
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ResumeOptimizer;
}
