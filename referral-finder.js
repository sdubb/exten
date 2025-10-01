// Referral Finder - Automatically find and reach out to employees
class ReferralFinder {
  constructor() {
    this.apiUrl = 'https://autojobr.com';
    this.referralTemplates = this.initializeTemplates();
  }

  initializeTemplates() {
    return {
      initial: {
        subject: 'Interested in {position} at {company}',
        body: `Hi {name},

I hope this message finds you well! I noticed you work at {company} as a {their_title}, and I'm very interested in the {position} role that's currently open.

I have {experience} years of experience in {field}, with expertise in {skills}. I believe my background aligns well with what {company} is looking for.

Would you be open to a brief chat about the role and {company}'s culture? I'd greatly appreciate any insights you could share, and if you think I'd be a good fit, I'd be grateful for a referral.

Thank you for considering my request!

Best regards,
{my_name}`
      },
      alumni: {
        subject: 'Fellow {school} Alum - {position} at {company}',
        body: `Hi {name},

I'm a fellow {school} graduate (Class of {grad_year}), and I saw you're working at {company}. I'm reaching out because I'm very interested in the {position} role.

During my time at {school}, I {school_achievement}. Since then, I've been working in {field} for {experience} years.

As a fellow {school_mascot}, I'd love to connect and learn more about your experience at {company}. If you think I'd be a good fit for the team, I'd be incredibly grateful for a referral.

Go {school_mascot}!

Best,
{my_name}`
      },
      mutual_connection: {
        subject: 'Introduction from {mutual_name} - {position} at {company}',
        body: `Hi {name},

{mutual_name} suggested I reach out to you regarding the {position} role at {company}. {mutual_name} mentioned you'd be a great person to talk to about the team and culture.

I have {experience} years of experience in {field}, specializing in {skills}. I'm particularly excited about {company}'s work on {company_product}.

Would you be available for a brief call to discuss the role? I'd love to learn from your experience, and if you think I'd be a good addition to the team, I'd appreciate your support.

Thank you!

Best regards,
{my_name}`
      }
    };
  }

  async findReferrals(jobData, userProfile) {
    try {
      // Search LinkedIn for employees at the company
      const employees = await this.searchLinkedInEmployees(jobData.company);

      // Score and rank potential referrals
      const rankedReferrals = await this.rankReferrals(employees, userProfile);

      // Get mutual connections
      const withMutuals = await this.enrichWithMutualConnections(rankedReferrals);

      return {
        success: true,
        referrals: withMutuals,
        totalFound: withMutuals.length,
        highPriority: withMutuals.filter(r => r.score >= 80),
        recommendations: this.generateRecommendations(withMutuals)
      };

    } catch (error) {
      console.error('Referral finder error:', error);
      return {
        success: false,
        error: error.message,
        referrals: []
      };
    }
  }

  async searchLinkedInEmployees(company) {
    // This would integrate with LinkedIn API or scraping
    // For now, return structure for manual implementation
    return [];
  }

  async rankReferrals(employees, userProfile) {
    return employees.map(employee => {
      let score = 50; // Base score

      // Same school bonus
      if (employee.education?.some(edu =>
        userProfile.education?.some(uEdu =>
          uEdu.school === edu.school))) {
        score += 25;
        employee.connectionType = 'alumni';
      }

      // Same previous company bonus
      if (employee.experience?.some(exp =>
        userProfile.experience?.some(uExp =>
          uExp.company === exp.company))) {
        score += 20;
        employee.connectionType = employee.connectionType || 'former_colleague';
      }

      // Similar role bonus
      if (employee.title?.toLowerCase().includes(userProfile.professionalTitle?.toLowerCase())) {
        score += 15;
      }

      // Mutual connections bonus (if available)
      if (employee.mutualConnections > 0) {
        score += Math.min(employee.mutualConnections * 5, 20);
        employee.connectionType = employee.connectionType || 'mutual_connection';
      }

      // Recruiter/HR bonus
      if (employee.title?.toLowerCase().includes('recruit') ||
          employee.title?.toLowerCase().includes('talent') ||
          employee.title?.toLowerCase().includes('hr')) {
        score += 30;
        employee.isRecruiter = true;
      }

      employee.score = Math.min(score, 100);
      employee.connectionType = employee.connectionType || 'initial';

      return employee;
    }).sort((a, b) => b.score - a.score);
  }

  async enrichWithMutualConnections(referrals) {
    // This would check for mutual LinkedIn connections
    // For now, return as-is
    return referrals;
  }

  generateMessage(referral, jobData, userProfile) {
    const template = this.referralTemplates[referral.connectionType] ||
                    this.referralTemplates.initial;

    let message = template.body;

    // Replace placeholders
    const replacements = {
      '{name}': referral.firstName || referral.name?.split(' ')[0] || 'there',
      '{company}': jobData.company,
      '{position}': jobData.title,
      '{their_title}': referral.title || 'your role',
      '{experience}': userProfile.yearsExperience || 'several',
      '{field}': userProfile.professionalTitle || 'my field',
      '{skills}': userProfile.skills?.slice(0, 3).join(', ') || 'relevant skills',
      '{my_name}': userProfile.fullName || userProfile.name || 'Your name',
      '{school}': referral.sharedSchool || 'our school',
      '{grad_year}': userProfile.graduationYear || 'XXXX',
      '{school_achievement}': 'focused on relevant coursework',
      '{school_mascot}': 'team',
      '{mutual_name}': referral.mutualConnection?.name || 'our mutual connection',
      '{company_product}': jobData.companyProduct || jobData.company + "'s mission"
    };

    for (const [key, value] of Object.entries(replacements)) {
      message = message.replace(new RegExp(key.replace(/[{}]/g, '\\$&'), 'g'), value);
    }

    return {
      subject: template.subject.replace(/\{[^}]+\}/g, (match) =>
        replacements[match] || match),
      body: message,
      template: referral.connectionType
    };
  }

  generateRecommendations(referrals) {
    const recommendations = [];

    const recruiters = referrals.filter(r => r.isRecruiter);
    if (recruiters.length > 0) {
      recommendations.push({
        priority: 'high',
        type: 'recruiter',
        title: 'Reach out to recruiters first',
        description: `Found ${recruiters.length} recruiters/HR professionals who can directly help with your application.`,
        referrals: recruiters.slice(0, 3)
      });
    }

    const alumni = referrals.filter(r => r.connectionType === 'alumni');
    if (alumni.length > 0) {
      recommendations.push({
        priority: 'high',
        type: 'alumni',
        title: 'Connect with alumni',
        description: `${alumni.length} employees from your school. Alumni connections often lead to strong referrals.`,
        referrals: alumni.slice(0, 3)
      });
    }

    const mutual = referrals.filter(r => r.connectionType === 'mutual_connection');
    if (mutual.length > 0) {
      recommendations.push({
        priority: 'medium',
        type: 'mutual',
        title: 'Leverage mutual connections',
        description: `${mutual.length} employees have mutual connections with you. Ask for warm introductions.`,
        referrals: mutual.slice(0, 3)
      });
    }

    return recommendations;
  }

  async sendReferralRequest(referral, message, jobData) {
    try {
      // This would integrate with LinkedIn messaging API
      // For now, return structure for implementation

      // Track the outreach
      await this.trackOutreach(referral, jobData);

      return {
        success: true,
        referralId: referral.id,
        message: 'Referral request queued for sending',
        scheduledFor: new Date().toISOString()
      };

    } catch (error) {
      console.error('Failed to send referral request:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async trackOutreach(referral, jobData) {
    const outreach = {
      referralId: referral.id,
      referralName: referral.name,
      company: jobData.company,
      jobTitle: jobData.title,
      connectionType: referral.connectionType,
      sentAt: new Date().toISOString(),
      status: 'sent'
    };

    // Store in chrome storage
    const result = await chrome.storage.local.get(['referralOutreach']);
    const outreaches = result.referralOutreach || [];
    outreaches.push(outreach);
    await chrome.storage.local.set({ referralOutreach: outreaches });
  }

  async getOutreachHistory() {
    const result = await chrome.storage.local.get(['referralOutreach']);
    return result.referralOutreach || [];
  }

  async updateOutreachStatus(referralId, status) {
    const result = await chrome.storage.local.get(['referralOutreach']);
    const outreaches = result.referralOutreach || [];

    const outreach = outreaches.find(o => o.referralId === referralId);
    if (outreach) {
      outreach.status = status;
      outreach.updatedAt = new Date().toISOString();
      await chrome.storage.local.set({ referralOutreach: outreaches });
    }
  }

  async getReferralAnalytics() {
    const history = await this.getOutreachHistory();

    return {
      total: history.length,
      byStatus: {
        sent: history.filter(h => h.status === 'sent').length,
        responded: history.filter(h => h.status === 'responded').length,
        referred: history.filter(h => h.status === 'referred').length,
        noResponse: history.filter(h => h.status === 'no_response').length
      },
      responseRate: history.length > 0
        ? (history.filter(h => h.status === 'responded').length / history.length * 100).toFixed(1)
        : 0,
      referralRate: history.length > 0
        ? (history.filter(h => h.status === 'referred').length / history.length * 100).toFixed(1)
        : 0,
      recentOutreach: history.slice(-10).reverse()
    };
  }
}

// Export for use in background script
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ReferralFinder;
}
