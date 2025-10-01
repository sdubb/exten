import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  unique,
  serial,
  integer,
  boolean,
  date,
  numeric,
  json,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  password: varchar("password"), // For email authentication
  profileImageUrl: varchar("profile_image_url"),
  userType: varchar("user_type").default("job_seeker"), // job_seeker, recruiter
  availableRoles: text("available_roles").default("job_seeker"), // comma-separated: job_seeker,recruiter
  currentRole: varchar("current_role").default("job_seeker"), // active role for current session
  emailVerified: boolean("email_verified").default(false),
  companyName: varchar("company_name"), // For recruiters
  companyWebsite: varchar("company_website"), // For recruiters
  companyLogoUrl: varchar("company_logo_url"), // For recruiters
  stripeCustomerId: varchar("stripe_customer_id"),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  paypalSubscriptionId: varchar("paypal_subscription_id"),
  paypalOrderId: varchar("paypal_order_id"),
  amazonPayPaymentId: varchar("amazon_pay_payment_id"),
  amazonPayOrderId: varchar("amazon_pay_order_id"),
  paymentProvider: varchar("payment_provider"), // stripe, paypal, razorpay
  subscriptionStatus: varchar("subscription_status").default("free"), // free, active, canceled, past_due
  planType: varchar("plan_type").default("free"), // free, premium, enterprise
  subscriptionStartDate: timestamp("subscription_start_date"),
  subscriptionEndDate: timestamp("subscription_end_date"),
  // AI Model Access Control
  aiModelTier: varchar("ai_model_tier").default("premium"), // premium, basic
  premiumTrialStartDate: timestamp("premium_trial_start_date").defaultNow(),
  premiumTrialEndDate: timestamp("premium_trial_end_date").defaultNow(),
  hasUsedPremiumTrial: boolean("has_used_premium_trial").default(false),
  // Ranking test limits for free users
  freeRankingTestsRemaining: integer("freeRankingTestsRemaining").default(1).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
},
(table) => [
  index("idx_users_email").on(table.email),
  index("idx_users_subscription_status").on(table.subscriptionStatus),
  index("idx_users_plan_type").on(table.planType),
  index("idx_users_created_at").on(table.createdAt),
  index("idx_users_user_type").on(table.userType),
]);

// Password reset tokens table
export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  token: varchar("token").unique().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  used: boolean("used").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// User profiles with comprehensive onboarding information
export const userProfiles = pgTable("user_profiles", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),

  // Basic Information
  fullName: varchar("full_name"),
  phone: varchar("phone"),
  professionalTitle: varchar("professional_title"),
  location: varchar("location"),
  linkedinUrl: varchar("linkedin_url"),
  githubUrl: varchar("github_url"),
  portfolioUrl: varchar("portfolio_url"),

  // Personal Details (commonly asked in forms)
  dateOfBirth: varchar("date_of_birth"),
  gender: varchar("gender"),
  nationality: varchar("nationality"),

  // Additional Social Links
  twitterUrl: varchar("twitter_url"),
  personalWebsiteUrl: varchar("personal_website_url"),

  // Work Authorization
  workAuthorization: varchar("work_authorization"), // "citizen", "permanent_resident", "visa_required"
  visaStatus: varchar("visa_status"),
  requiresSponsorship: boolean("requires_sponsorship").default(false),

  // Location Preferences
  currentAddress: text("current_address"),
  city: varchar("city"),
  state: varchar("state"),
  zipCode: varchar("zip_code"),
  country: varchar("country").default("United States"),
  willingToRelocate: boolean("willing_to_relocate").default(false),

  // Work Preferences
  preferredWorkMode: varchar("preferred_work_mode"), // "remote", "hybrid", "onsite"
  desiredSalaryMin: integer("desired_salary_min"),
  desiredSalaryMax: integer("desired_salary_max"),
  salaryCurrency: varchar("salary_currency").default("USD"),
  noticePeriod: varchar("notice_period"), // "immediate", "2_weeks", "1_month", "2_months"

  // Application Screening Questions
  workedForCompanyBefore: boolean("worked_for_company_before").default(false),
  currentlyEmployed: boolean("currently_employed").default(false),
  canContactCurrentEmployer: boolean("can_contact_current_employer").default(true),
  canWorkSpecificHours: boolean("can_work_specific_hours").default(true),
  willingToWorkOvertime: boolean("willing_to_work_overtime").default(true),
  willingToTravel: boolean("willing_to_travel").default(true),
  maxTravelPercentage: integer("max_travel_percentage").default(0), // 0-100%

  // Education Summary (for quick form filling)
  highestDegree: varchar("highest_degree"),
  majorFieldOfStudy: varchar("major_field_of_study"),
  graduationYear: integer("graduation_year"),
  gpa: varchar("gpa"), // For recent graduates
  relevantCertifications: text("relevant_certifications"), // Comma-separated list

  // Professional Summary
  summary: text("summary"),
  yearsExperience: integer("years_experience"),

  // Company-Specific Questions (commonly asked)
  howDidYouHearAboutUs: varchar("how_did_you_hear_about_us"),
  whyInterestedInRole: text("why_interested_in_role"),
  whyInterestedInCompany: text("why_interested_in_company"),
  careerGoals: text("career_goals"),

  // Availability and Start Date
  preferredStartDate: varchar("preferred_start_date"), // Flexible format
  earliestStartDate: varchar("earliest_start_date"),
  interviewingElsewhere: boolean("interviewing_elsewhere").default(false),
  interviewSchedulingRestrictions: text("interview_scheduling_restrictions"),

  // Emergency Contact (sometimes required)
  emergencyContactName: varchar("emergency_contact_name"),
  emergencyContactPhone: varchar("emergency_contact_phone"),
  emergencyContactRelation: varchar("emergency_contact_relation"),

  // Military/Veteran Status (common question)
  veteranStatus: varchar("veteran_status"), // "not_veteran", "veteran", "disabled_veteran"

  // Diversity Questions (optional but commonly asked)
  ethnicity: varchar("ethnicity"),
  disabilityStatus: varchar("disability_status"),

  // Background Check Consent
  backgroundCheckConsent: boolean("background_check_consent").default(false),
  drugTestConsent: boolean("drug_test_consent").default(false),

  // Profile Status
  onboardingCompleted: boolean("onboarding_completed").default(false),
  profileCompletion: integer("profile_completion").default(0),
  lastResumeAnalysis: timestamp("last_resume_analysis"),

  // Practice Tests Quota (Free tier gets 1 free ranking test)
  freeRankingTestsRemaining: integer("free_ranking_tests_remaining").default(1),
  freeInterviewsRemaining: integer("free_interviews_remaining").default(5),
  premiumInterviewsRemaining: integer("premium_interviews_remaining").default(50),
  totalInterviewsUsed: integer("total_interviews_used").default(0),
  totalRankingTestsUsed: integer("total_ranking_tests_used").default(0),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Export alias for compatibility with server routes
export const profiles = userProfiles;

// Professional References
export const professionalReferences = pgTable("professional_references", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),

  // Reference Details
  fullName: varchar("full_name").notNull(),
  jobTitle: varchar("job_title").notNull(),
  company: varchar("company").notNull(),
  email: varchar("email").notNull(),
  phone: varchar("phone").notNull(),
  relationship: varchar("relationship").notNull(), // supervisor, colleague, client, mentor
  yearsKnown: integer("years_known"),

  // Permissions
  canContact: boolean("can_contact").default(true),
  isPrimary: boolean("is_primary").default(false), // Mark one as primary reference

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User skills
export const userSkills = pgTable("user_skills", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  skillName: varchar("skill_name").notNull(),
  proficiencyLevel: varchar("proficiency_level"), // beginner, intermediate, advanced, expert
  yearsExperience: integer("years_experience"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Work experience
export const workExperience = pgTable("work_experience", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  company: varchar("company").notNull(),
  position: varchar("position").notNull(),
  location: varchar("location"),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  isCurrent: boolean("is_current").default(false),
  description: text("description"),
  achievements: text("achievements").array(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Education
export const education = pgTable("education", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  institution: varchar("institution").notNull(),
  degree: varchar("degree").notNull(),
  fieldOfStudy: varchar("field_of_study"),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  graduationYear: integer("graduation_year"),
  gpa: varchar("gpa"),
  achievements: text("achievements").array(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Resumes - stores multiple resumes per user
export const resumes = pgTable("resumes", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  name: varchar("name").notNull(), // User-given name like "Software Engineer Resume"
  fileName: varchar("file_name").notNull(), // Original file name
  filePath: varchar("file_path"), // Local file system path (optional for file storage)
  fileData: text("file_data"), // Base64 encoded file data (optional for database storage)
  resumeText: text("resume_text"), // Extracted text content for analysis
  isActive: boolean("is_active").default(false), // Which resume to use for applications

  // ATS Analysis
  atsScore: integer("ats_score"), // 0-100 ATS compatibility score
  analysisData: jsonb("analysis_data"), // Full Groq analysis results
  recommendations: text("recommendations").array(), // ATS improvement suggestions

  // Metadata
  fileSize: integer("file_size"), // File size in bytes
  mimeType: varchar("mime_type"), // application/pdf, etc.
  lastAnalyzed: timestamp("last_analyzed"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Job applications
export const jobApplications = pgTable("job_applications", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  jobTitle: varchar("job_title").notNull(),
  company: varchar("company").notNull(),
  jobUrl: varchar("job_url"),
  applicationUrl: varchar("application_url"),
  location: varchar("location"),
  jobType: varchar("job_type"), // full-time, part-time, contract, internship
  workMode: varchar("work_mode"), // remote, hybrid, onsite
  salaryRange: varchar("salary_range"),
  status: varchar("status").notNull().default("applied"), // applied, under_review, interview, offer, rejected
  appliedDate: timestamp("applied_date").defaultNow(),
  lastUpdated: timestamp("last_updated").defaultNow(),
  jobDescription: text("job_description"),
  requiredSkills: text("required_skills").array(),
  matchScore: integer("match_score"), // 0-100
  analysisData: jsonb("analysis_data"), // AI analysis data
  notes: text("notes"),
  source: varchar("source"), // linkedin, indeed, company_website, etc.
  createdAt: timestamp("created_at").defaultNow(),
},
(table) => [
  index("idx_job_applications_user_id").on(table.userId),
  index("idx_job_applications_status").on(table.status),
  index("idx_job_applications_applied_date").on(table.appliedDate),
  index("idx_job_applications_match_score").on(table.matchScore),
  index("idx_job_applications_user_status").on(table.userId, table.status),
]);

// Job recommendations
export const jobRecommendations = pgTable("job_recommendations", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  jobTitle: varchar("job_title").notNull(),
  company: varchar("company").notNull(),
  location: varchar("location"),
  jobUrl: varchar("job_url"),
  salary: varchar("salary"),
  jobType: varchar("job_type"),
  workMode: varchar("work_mode"),
  matchScore: integer("match_score"),
  matchingSkills: text("matching_skills").array(),
  missingSkills: text("missing_skills").array(),
  jobDescription: text("job_description"),
  requiredSkills: text("required_skills").array(),
  isBookmarked: boolean("is_bookmarked").default(false),
  isApplied: boolean("is_applied").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Enhanced Task management for all users (job seekers and recruiters)
export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(), // Task owner
  title: varchar("title").notNull(),
  description: text("description"),
  status: varchar("status").notNull().default("pending"), // pending, in_progress, completed, overdue, cancelled
  taskType: varchar("task_type").notNull(), // interview, meeting, followup, reminder, document_review, background_check, application_deadline, skill_practice
  priority: varchar("priority").notNull().default("medium"), // low, medium, high, urgent
  category: varchar("category").default("general"), // job_application, interview, networking, skill_development, career_planning

  // Reminder and scheduling
  dueDateTime: timestamp("due_date_time"),
  reminderDateTime: timestamp("reminder_date_time"), // When to show reminder popup
  reminderEnabled: boolean("reminder_enabled").default(true),
  reminderShown: boolean("reminder_shown").default(false), // Whether reminder popup was already shown
  recurrence: varchar("recurrence"), // none, daily, weekly, monthly for recurring tasks

  // Related entities
  relatedTo: varchar("related_to"), // what the task is related to (candidate name, job title, etc.)
  relatedId: integer("related_id"), // ID of related entity (job posting, application, etc.)
  relatedUrl: varchar("related_url"), // Job posting URL, LinkedIn profile, etc.

  // Additional metadata
  tags: text("tags").array(), // Custom user tags for organization
  notes: text("notes"), // Private notes
  completedAt: timestamp("completed_at"),

  // For recruiter tasks
  candidateName: varchar("candidate_name"),
  candidateEmail: varchar("candidate_email"),
  meetingLink: varchar("meeting_link"), // Zoom, Teams, etc.
  calendlyLink: varchar("calendly_link"), // Calendly scheduling link
  emailSent: boolean("email_sent").default(false), // whether invitation email was sent

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User resume storage with cloud sync capabilities
export const userResumes = pgTable("user_resumes", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),

  // Resume metadata
  name: varchar("name").notNull(), // User-given name like "Software Engineer Resume"
  fileName: varchar("file_name").notNull(), // Original file name
  fileSize: integer("file_size"), // File size in bytes
  mimeType: varchar("mime_type"), // application/pdf, application/msword, etc.

  // Storage options
  fileData: text("file_data"), // Base64 encoded file data for database storage (legacy)
  filePath: varchar("file_path"), // Local/cloud file system path
  cloudUrl: varchar("cloud_url"), // Cloud storage URL (S3, CloudFlare, etc.)
  storedFileId: varchar("stored_file_id"), // FileStorageService ID for secure filesystem storage
  storageMethod: varchar("storage_method").default("filesystem"), // database, filesystem, cloud

  // Resume content and analysis
  resumeText: text("resume_text"), // Extracted text content for analysis
  isActive: boolean("is_active").default(false), // Which resume to use for applications
  isDefault: boolean("is_default").default(false), // Default resume for extension auto-upload

  // AI Analysis and optimization
  atsScore: integer("ats_score"), // 0-100 ATS compatibility score
  analysisData: jsonb("analysis_data"), // Full AI analysis results
  recommendations: text("recommendations").array(), // ATS improvement suggestions
  keySkills: text("key_skills").array(), // Extracted skills from resume
  experience: jsonb("experience"), // Structured work experience data
  education: jsonb("education"), // Structured education data

  // Usage tracking
  timesUsed: integer("times_used").default(0), // How many times applied with this resume
  lastUsed: timestamp("last_used"), // When this resume was last used for an application
  lastAnalyzed: timestamp("last_analyzed"), // When this resume was last analyzed by AI

  // Version control
  version: integer("version").default(1), // Resume version for change tracking
  previousVersionId: integer("previous_version_id"), // Link to previous version

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Task reminders for Chrome extension popup notifications
export const taskReminders = pgTable("task_reminders", {
  id: serial("id").primaryKey(),
  taskId: integer("task_id").references(() => tasks.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),

  // Reminder timing
  triggerDateTime: timestamp("trigger_date_time").notNull(),
  reminderType: varchar("reminder_type").default("popup"), // popup, notification, email

  // Reminder status
  isTriggered: boolean("is_triggered").default(false),
  triggeredAt: timestamp("triggered_at"),
  userResponse: varchar("user_response"), // dismissed, snoozed, completed
  snoozeUntil: timestamp("snooze_until"), // If user snoozed the reminder

  createdAt: timestamp("created_at").defaultNow(),
});

// AI Job Analysis - stores detailed AI analysis of job postings
export const aiJobAnalyses = pgTable("ai_job_analyses", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  jobUrl: varchar("job_url").notNull(),
  jobTitle: varchar("job_title").notNull(),
  company: varchar("company").notNull(),

  // Raw job data
  jobDescription: text("job_description"),
  requirements: text("requirements"),
  qualifications: text("qualifications"),
  benefits: text("benefits"),

  // AI Analysis Results
  matchScore: integer("match_score"), // 0-100
  matchingSkills: text("matching_skills").array(),
  missingSkills: text("missing_skills").array(),
  skillGaps: jsonb("skill_gaps"), // detailed analysis of missing skills

  // Job characteristics extracted by AI
  seniorityLevel: varchar("seniority_level"), // entry, mid, senior, lead, principal
  workMode: varchar("work_mode"), // remote, hybrid, onsite
  jobType: varchar("job_type"), // full-time, part-time, contract, internship
  salaryRange: varchar("salary_range"),
  location: varchar("location"),

  // AI-generated insights
  roleComplexity: varchar("role_complexity"), // low, medium, high
  careerProgression: varchar("career_progression"), // lateral, step-up, stretch
  industryFit: varchar("industry_fit"), // perfect, good, acceptable, poor
  cultureFit: varchar("culture_fit"), // strong, moderate, weak

  // Recommendations
  applicationRecommendation: varchar("application_recommendation"), // strongly_recommended, recommended, consider, not_recommended
  tailoringAdvice: text("tailoring_advice"), // AI advice on how to tailor application
  interviewPrepTips: text("interview_prep_tips"),

  // Metadata
  analysisVersion: varchar("analysis_version").default("1.0"),
  processingTime: integer("processing_time"), // milliseconds
  createdAt: timestamp("created_at").defaultNow(),
});

// Daily usage tracking table for premium limits
export const dailyUsage = pgTable("daily_usage", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  date: varchar("date").notNull(), // YYYY-MM-DD format
  jobAnalysesCount: integer("job_analyses_count").default(0),
  resumeAnalysesCount: integer("resume_analyses_count").default(0),
  applicationsCount: integer("applications_count").default(0),
  autoFillsCount: integer("auto_fills_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("daily_usage_user_date_idx").on(table.userId, table.date),
]);

// Job postings created by recruiters
export const jobPostings = pgTable("job_postings", {
  id: serial("id").primaryKey(),
  recruiterId: varchar("recruiter_id").references(() => users.id).notNull(),
  title: varchar("title").notNull(),
  description: text("description").notNull(),
  companyName: varchar("company_name").notNull(),
  companyLogo: varchar("company_logo"), // URL to company logo
  location: varchar("location"),
  workMode: varchar("work_mode"), // remote, hybrid, onsite
  jobType: varchar("job_type"), // full-time, part-time, contract, internship
  experienceLevel: varchar("experience_level"), // entry, mid, senior, lead
  skills: text("skills").array(), // Required skills
  qualifications: text("qualifications"), // Required qualifications
  minSalary: integer("min_salary"),
  maxSalary: integer("max_salary"),
  salaryRange: varchar("salary_range"), // text representation
  currency: varchar("currency").default("USD"),
  benefits: text("benefits"),
  requirements: text("requirements"),
  responsibilities: text("responsibilities"),

  // Promotion and sharing features
  isPromoted: boolean("is_promoted").default(false),
  promotedUntil: timestamp("promoted_until"),
  shareableLink: varchar("shareable_link"),

  isActive: boolean("is_active").default(true),
  applicationsCount: integer("applications_count").default(0),
  viewsCount: integer("views_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Enhanced job postings with targeting features
export const jobTargeting = pgTable("job_targeting", {
  id: serial("id").primaryKey(),
  jobPostingId: integer("job_posting_id").references(() => jobPostings.id).notNull(),

  // Targeting criteria
  targetEducationLevel: text("target_education_level").array(), // bachelor, master, phd, etc.
  targetSchools: text("target_schools").array(), // specific universities/colleges
  targetMajors: text("target_majors").array(), // Computer Science, Engineering, etc.
  targetSkills: text("target_skills").array(), // Required or preferred skills
  targetExperienceMin: integer("target_experience_min"),
  targetExperienceMax: integer("target_experience_max"),
  targetLocation: text("target_location").array(), // Specific cities/regions
  targetClubs: text("target_clubs").array(), // Professional organizations, clubs
  targetCertifications: text("target_certifications").array(),
  targetCompanies: text("target_companies").array(), // Previous companies

  // Premium features
  isPremiumTargeted: boolean("is_premium_targeted").default(false),
  targetingBudget: integer("targeting_budget"), // Cost in credits/dollars
  targetingStartDate: timestamp("targeting_start_date"),
  targetingEndDate: timestamp("targeting_end_date"),

  createdAt: timestamp("created_at").defaultNow(),
});

// Scraped jobs from external sources (Spotify-like playlists)
export const scrapedJobs = pgTable("scraped_jobs", {
  id: serial("id").primaryKey(),

  // Job details
  title: varchar("title").notNull(),
  company: varchar("company").notNull(),
  description: text("description"),
  location: varchar("location"),
  workMode: varchar("work_mode"), // remote, hybrid, onsite
  jobType: varchar("job_type"), // full-time, part-time, contract, internship, temporary
  experienceLevel: varchar("experience_level"), // entry-level, mid-level, senior, executive, internship
  salaryRange: varchar("salary_range"),
  skills: text("skills").array(),

  // Location details for international support
  countryCode: varchar("country_code"), // ISO country codes (IN, GB, DE, AU, FR, ES, AE, US)
  region: varchar("region"), // State/province/region
  city: varchar("city"), // City name
  latitude: numeric("latitude"), // For location-based search
  longitude: numeric("longitude"), // For location-based search

  // Salary details
  salaryMin: integer("salary_min"), // Salary range in base currency units
  salaryMax: integer("salary_max"), // Salary range in base currency units
  currency: varchar("currency"), // USD, EUR, GBP, INR, AUD, etc.
  salaryPeriod: varchar("salary_period"), // yearly, monthly, hourly, daily

  // Source information
  sourceUrl: varchar("source_url").notNull(),
  sourcePlatform: varchar("source_platform").notNull(), // indeed, linkedin, glassdoor, google_jobs, etc.
  externalId: varchar("external_id"), // Platform-specific job ID for deduplication
  language: varchar("language"), // Job posting language (en, es, fr, de, etc.)

  // Playlist categorization
  category: varchar("category"), // technology, sales, marketing, business, finance, hr, operations, design, product, customer-success
  subcategory: varchar("subcategory"), // More specific role categories
  tags: text("tags").array(), // Searchable job tags array

  // Engagement metrics
  viewsCount: integer("views_count").default(0),
  appliedCount: integer("applied_count").default(0),
  savedCount: integer("saved_count").default(0),

  // Status and freshness
  isActive: boolean("is_active").default(true),
  lastScraped: timestamp("last_scraped").defaultNow(),
  postedAt: timestamp("posted_at"), // When job was originally posted
  expiresAt: timestamp("expires_at"), // Job expiration date

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  // Performance indexes
  index("scraped_jobs_category_idx").on(table.category),
  index("scraped_jobs_category_subcategory_idx").on(table.category, table.subcategory),
  index("scraped_jobs_source_idx").on(table.sourcePlatform),
  index("scraped_jobs_location_idx").on(table.location),
  index("scraped_jobs_country_city_idx").on(table.countryCode, table.city),
  index("scraped_jobs_job_type_idx").on(table.jobType),
  index("scraped_jobs_experience_level_idx").on(table.experienceLevel),
  index("scraped_jobs_work_mode_idx").on(table.workMode),
  index("scraped_jobs_posted_at_idx").on(table.postedAt),
  // GIN indexes for advanced search
  index("scraped_jobs_text_search_idx").using("gin", sql`to_tsvector('simple', ${table.title} || ' ' || coalesce(${table.description}, ''))`),
  index("scraped_jobs_tags_idx").using("gin", table.tags),
  // Unique constraint for deduplication
  unique("scraped_jobs_source_external_unique").on(table.sourcePlatform, table.externalId),
]);

// Job playlists (Spotify-like collections)
export const jobPlaylists = pgTable("job_playlists", {
  id: serial("id").primaryKey(),

  // Playlist metadata
  name: varchar("name").notNull(), // "Remote Frontend Jobs", "AI/ML Opportunities"
  description: text("description"),
  coverImage: varchar("cover_image"), // Playlist thumbnail

  // Curation
  curatorId: varchar("curator_id").references(() => users.id), // System or user curated
  isSystemGenerated: boolean("is_system_generated").default(true),
  category: varchar("category").notNull(), // tech, design, marketing, etc.

  // Filtering criteria for auto-curation
  autoFilters: jsonb("auto_filters"), // Skills, location, experience criteria

  // Engagement
  followersCount: integer("followers_count").default(0),
  jobsCount: integer("jobs_count").default(0),

  // Visibility
  isPublic: boolean("is_public").default(true),
  isFeatured: boolean("is_featured").default(false),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("job_playlists_category_idx").on(table.category),
  index("job_playlists_featured_idx").on(table.isFeatured),
]);

// Jobs in playlists (many-to-many relationship)
export const playlistJobs = pgTable("playlist_jobs", {
  id: serial("id").primaryKey(),
  playlistId: integer("playlist_id").references(() => jobPlaylists.id).notNull(),
  scrapedJobId: integer("scraped_job_id").references(() => scrapedJobs.id),
  jobPostingId: integer("job_posting_id").references(() => jobPostings.id), // Include company posts

  // Position in playlist
  order: integer("order").default(0),
  addedAt: timestamp("added_at").defaultNow(),
}, (table) => [
  index("playlist_jobs_playlist_idx").on(table.playlistId),
  index("playlist_jobs_scraped_idx").on(table.scrapedJobId),
]);

// User playlist follows (like Spotify follows)
export const userPlaylistFollows = pgTable("user_playlist_follows", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  playlistId: integer("playlist_id").references(() => jobPlaylists.id).notNull(),
  followedAt: timestamp("followed_at").defaultNow(),
}, (table) => [
  index("user_playlist_follows_user_idx").on(table.userId),
]);

// User saved/bookmarked jobs
export const userSavedJobs = pgTable("user_saved_jobs", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  scrapedJobId: integer("scraped_job_id").references(() => scrapedJobs.id),
  jobPostingId: integer("job_posting_id").references(() => jobPostings.id),
  savedAt: timestamp("saved_at").defaultNow(),
}, (table) => [
  index("user_saved_jobs_user_idx").on(table.userId),
]);

// Applications to job postings from job seekers
export const jobPostingApplications = pgTable("job_posting_applications", {
  id: serial("id").primaryKey(),
  jobPostingId: integer("job_posting_id").references(() => jobPostings.id).notNull(),
  applicantId: varchar("applicant_id").references(() => users.id).notNull(),
  resumeId: integer("resume_id").references(() => resumes.id), // Which resume was used
  resumeData: jsonb("resume_data"), // Complete resume data for recruiter access
  coverLetter: text("cover_letter"), // Custom cover letter for this application
  status: varchar("status").default("applied"), // applied, reviewed, shortlisted, interviewed, hired, rejected
  matchScore: integer("match_score"), // AI-calculated compatibility score
  recruiterNotes: text("recruiter_notes"), // Private notes from recruiter
  appliedAt: timestamp("applied_at").defaultNow(),
  reviewedAt: timestamp("reviewed_at"),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("job_posting_applications_job_idx").on(table.jobPostingId),
  index("job_posting_applications_applicant_idx").on(table.applicantId),
]);

// Simple LinkedIn-style Chat System - All users can chat with each other
export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  // Participants - any two users can chat
  participant1Id: varchar("participant1_id").references(() => users.id).notNull(),
  participant2Id: varchar("participant2_id").references(() => users.id).notNull(),

  // Conversation metadata
  lastMessageAt: timestamp("last_message_at").defaultNow(),
  lastMessagePreview: text("last_message_preview"), // Encrypted preview for list view

  // Status
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("conversations_participant1_idx").on(table.participant1Id),
  index("conversations_participant2_idx").on(table.participant2Id),
  index("conversations_last_message_idx").on(table.lastMessageAt),
]);

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").references(() => conversations.id).notNull(),
  senderId: varchar("sender_id").references(() => users.id).notNull(),

  // Encrypted and compressed content
  encryptedContent: text("encrypted_content").notNull(), // AES-256 encrypted message
  messageHash: varchar("message_hash").notNull(), // SHA-256 hash for integrity
  compressionType: varchar("compression_type").default("gzip"), // gzip, deflate, none

  // Message metadata
  messageType: varchar("message_type").default("text"), // text, file, system
  isRead: boolean("is_read").default(false),
  readAt: timestamp("read_at"),

  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("messages_conversation_idx").on(table.conversationId),
  index("messages_sender_idx").on(table.senderId),
  index("messages_created_at_idx").on(table.createdAt),
]);

// Email verification tokens for users
export const emailVerificationTokens = pgTable("email_verification_tokens", {
  id: serial("id").primaryKey(),
  token: varchar("token").notNull().unique(),
  email: varchar("email").notNull(),
  userId: varchar("user_id").notNull(),
  userType: varchar("user_type").default("job_seeker"), // 'job_seeker' or 'recruiter'
  companyName: varchar("company_name"), // Optional: for recruiter verification
  companyWebsite: varchar("company_website"), // Optional: for recruiter verification
  verified: boolean("verified").default(false),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("email_verification_tokens_token_idx").on(table.token),
  index("email_verification_tokens_email_idx").on(table.email),
  index("email_verification_tokens_user_id_idx").on(table.userId),
]);

// Company email verification tracking
export const companyEmailVerifications = pgTable("company_email_verifications", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  email: varchar("email").notNull(),
  companyName: varchar("company_name").notNull(),
  companyWebsite: varchar("company_website"),
  verificationToken: varchar("verification_token").notNull().unique(),
  isVerified: boolean("is_verified").default(false),
  verifiedAt: timestamp("verified_at"),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("company_email_verifications_user_idx").on(table.userId),
  index("company_email_verifications_email_idx").on(table.email),
  index("company_email_verifications_token_idx").on(table.verificationToken),
]);

// Advanced Assessment Tables
export const videoInterviews = pgTable("video_interviews", {
  id: serial("id").primaryKey(),
  candidateId: text("candidate_id").notNull(),
  recruiterId: text("recruiter_id").notNull(),
  jobId: integer("job_id"),
  questions: text("questions").notNull(), // JSON string
  totalTimeLimit: integer("total_time_limit").notNull(), // minutes
  status: text("status").notNull().default("pending"),
  sessionId: text("session_id"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  expiryDate: timestamp("expiry_date").notNull(),
  score: integer("score"),
  overallScore: integer("overall_score"),
  feedback: text("feedback"),
  createdAt: timestamp("created_at").defaultNow()
});

export const videoResponses = pgTable("video_responses", {
  id: serial("id").primaryKey(),
  interviewId: integer("interview_id").notNull().references(() => videoInterviews.id),
  questionId: text("question_id").notNull(),
  videoPath: text("video_path").notNull(),
  duration: integer("duration").notNull(), // seconds
  attempts: integer("attempts").notNull().default(1),
  deviceInfo: text("device_info"), // JSON string
  analysis: text("analysis"), // JSON string
  score: integer("score"),
  processedAt: timestamp("processed_at"),
  uploadedAt: timestamp("uploaded_at").defaultNow()
});

export const simulationAssessments = pgTable("simulation_assessments", {
  id: serial("id").primaryKey(),
  candidateId: text("candidate_id").notNull(),
  recruiterId: text("recruiter_id").notNull(),
  jobId: integer("job_id"),
  scenarioId: text("scenario_id").notNull(),
  scenario: text("scenario").notNull(), // JSON string
  sessionId: text("session_id"),
  status: text("status").notNull().default("created"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  result: text("result"), // JSON string
  score: integer("score"),
  overallScore: integer("overall_score"),
  expiryDate: timestamp("expiry_date").notNull(),
  createdAt: timestamp("created_at").defaultNow()
});

export const personalityAssessments = pgTable("personality_assessments", {
  id: serial("id").primaryKey(),
  candidateId: text("candidate_id").notNull(),
  recruiterId: text("recruiter_id").notNull(),
  jobId: integer("job_id"),
  assessmentType: text("assessment_type").notNull(),
  questions: text("questions").notNull(), // JSON string
  responses: text("responses"), // JSON string
  results: text("results"), // JSON string
  status: text("status").notNull().default("created"),
  timeLimit: integer("time_limit"), // minutes
  jobRole: text("job_role"),
  industry: text("industry"),
  overallScore: integer("overall_score"),
  completedAt: timestamp("completed_at"),
  expiryDate: timestamp("expiry_date").notNull(),
  createdAt: timestamp("created_at").defaultNow()
});

export const skillsVerifications = pgTable("skills_verifications", {
  id: serial("id").primaryKey(),
  candidateId: text("candidate_id").notNull(),
  recruiterId: text("recruiter_id").notNull(),
  jobId: integer("job_id"),
  projectTemplateId: text("project_template_id").notNull(),
  projectTemplate: text("project_template").notNull(), // JSON string
  submissions: text("submissions"), // JSON string
  results: text("results"), // JSON string
  status: text("status").notNull().default("assigned"),
  timeLimit: integer("time_limit"), // hours
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  score: integer("score"),
  overallScore: integer("overall_score"),
  expiryDate: timestamp("expiry_date").notNull(),
  customizations: text("customizations"), // JSON string
  createdAt: timestamp("created_at").defaultNow()
});

// Interview invitation links for external candidates
export const interviewInvitations = pgTable("interview_invitations", {
  id: serial("id").primaryKey(),
  token: varchar("token").notNull().unique(),
  recruiterId: text("recruiter_id").notNull(),
  jobPostingId: integer("job_posting_id"), // Optional - can be null for generic interview links
  interviewType: text("interview_type").notNull(), // virtual, mock, skills-verification, personality, simulation, video-interview
  interviewConfig: text("interview_config").notNull(), // JSON string with interview-specific settings
  role: text("role").notNull(), // Job role/title for the interview
  company: text("company"), // Company name (optional)
  difficulty: text("difficulty").notNull(), // Interview difficulty level
  expiryDate: timestamp("expiry_date").notNull(),
  isUsed: boolean("is_used").default(false),
  candidateId: text("candidate_id"), // Set after candidate signs up
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").defaultNow()
}, (table) => [
  index("interview_invitations_token_idx").on(table.token),
  index("interview_invitations_recruiter_idx").on(table.recruiterId),
  index("interview_invitations_job_idx").on(table.jobPostingId),
]);

// Advanced recruiter features - Job templates for faster posting
export const jobTemplates = pgTable("job_templates", {
  id: serial("id").primaryKey(),
  recruiterId: varchar("recruiter_id").references(() => users.id).notNull(),
  templateName: varchar("template_name").notNull(),
  title: varchar("title").notNull(),
  description: text("description").notNull(),
  requirements: text("requirements"),
  responsibilities: text("responsibilities"),
  benefits: text("benefits"),
  skills: text("skills").array(),
  experienceLevel: varchar("experience_level"),
  workMode: varchar("work_mode"),
  jobType: varchar("job_type"),
  isActive: boolean("is_active").default(true),
  usageCount: integer("usage_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Smart candidate matching and AI insights
export const candidateMatches = pgTable("candidate_matches", {
  id: serial("id").primaryKey(),
  jobPostingId: integer("job_posting_id").references(() => jobPostings.id).notNull(),
  candidateId: varchar("candidate_id").references(() => users.id).notNull(),
  matchScore: integer("match_score").notNull(), // 0-100
  skillMatchScore: integer("skill_match_score").notNull(),
  experienceMatchScore: integer("experience_match_score").notNull(),
  locationMatchScore: integer("location_match_score").notNull(),
  salaryMatchScore: integer("salary_match_score").notNull(),

  // AI insights
  joinProbability: integer("join_probability"), // 0-100
  engagementScore: integer("engagement_score"), // 0-100
  flightRisk: varchar("flight_risk"), // low, medium, high

  // Matching details
  matchingSkills: text("matching_skills").array(),
  missingSkills: text("missing_skills").array(),
  skillGaps: jsonb("skill_gaps"),

  // Recommendations
  approachRecommendation: text("approach_recommendation"),
  personalizedMessage: text("personalized_message"),
  salaryBenchmark: jsonb("salary_benchmark"),

  // Status
  isViewed: boolean("is_viewed").default(false),
  isContacted: boolean("is_contacted").default(false),
  recruiterRating: integer("recruiter_rating"), // 1-5 stars
  recruiterNotes: text("recruiter_notes"),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("candidate_matches_job_idx").on(table.jobPostingId),
  index("candidate_matches_candidate_idx").on(table.candidateId),
  index("candidate_matches_score_idx").on(table.matchScore),
]);

// Interview scheduling and management
export const interviews = pgTable("interviews", {
  id: serial("id").primaryKey(),
  applicationId: integer("application_id").references(() => jobPostingApplications.id).notNull(),
  recruiterId: varchar("recruiter_id").references(() => users.id).notNull(),
  candidateId: varchar("candidate_id").references(() => users.id).notNull(),
  interviewType: varchar("interview_type").notNull(), // phone, video, onsite, technical
  scheduledDate: timestamp("scheduled_date").notNull(),
  duration: integer("duration").default(60), // minutes
  meetingLink: varchar("meeting_link"),
  location: varchar("location"),

  // Interview details
  interviewerName: varchar("interviewer_name"),
  interviewerEmail: varchar("interviewer_email"),
  instructions: text("instructions"),
  questionsTemplate: text("questions_template"),

  // Status and results
  status: varchar("status").default("scheduled"), // scheduled, confirmed, completed, cancelled, no_show
  candidateConfirmed: boolean("candidate_confirmed").default(false),
  recruiterNotes: text("recruiter_notes"),
  candidateFeedback: text("candidate_feedback"),
  score: integer("score"), // 1-10
  recommendation: varchar("recommendation"), // hire, maybe, no_hire

  // Notifications
  reminderSent: boolean("reminder_sent").default(false),
  confirmationSent: boolean("confirmation_sent").default(false),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("interviews_application_idx").on(table.applicationId),
  index("interviews_recruiter_idx").on(table.recruiterId),
  index("interviews_candidate_idx").on(table.candidateId),
  index("interviews_date_idx").on(table.scheduledDate),
]);

// Team collaboration and permissions
export const recruiterTeams = pgTable("recruiter_teams", {
  id: serial("id").primaryKey(),
  companyId: varchar("company_id").notNull(), // Company identifier
  teamName: varchar("team_name").notNull(),
  teamLead: varchar("team_lead").references(() => users.id).notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("recruiter_teams_company_idx").on(table.companyId),
  index("recruiter_teams_lead_idx").on(table.teamLead),
]);

export const teamMembers = pgTable("team_members", {
  id: serial("id").primaryKey(),
  teamId: integer("team_id").references(() => recruiterTeams.id).notNull(),
  recruiterId: varchar("recruiter_id").references(() => users.id).notNull(),
  role: varchar("role").notNull(), // admin, recruiter, viewer
  permissions: text("permissions").array(), // view_jobs, edit_jobs, view_applications, edit_applications, etc.
  addedBy: varchar("added_by").references(() => users.id).notNull(),
  joinedAt: timestamp("joined_at").defaultNow(),
  isActive: boolean("is_active").default(true),
}, (table) => [
  index("team_members_team_idx").on(table.teamId),
  index("team_members_recruiter_idx").on(table.recruiterId),
]);

// Shared notes and collaboration
export const sharedNotes = pgTable("shared_notes", {
  id: serial("id").primaryKey(),
  applicationId: integer("application_id").references(() => jobPostingApplications.id).notNull(),
  authorId: varchar("author_id").references(() => users.id).notNull(),
  note: text("note").notNull(),
  noteType: varchar("note_type").default("general"), // general, interview, technical, cultural
  isPrivate: boolean("is_private").default(false),
  taggedUsers: text("tagged_users").array(), // user IDs who should be notified
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("shared_notes_application_idx").on(table.applicationId),
  index("shared_notes_author_idx").on(table.authorId),
]);

// ATS/CRM integrations
export const atsIntegrations = pgTable("ats_integrations", {
  id: serial("id").primaryKey(),
  recruiterId: varchar("recruiter_id").references(() => users.id).notNull(),
  platformName: varchar("platform_name").notNull(), // greenhouse, workday, lever, etc.
  apiKey: varchar("api_key"),
  apiSecret: varchar("api_secret"),
  webhookUrl: varchar("webhook_url"),
  isActive: boolean("is_active").default(true),
  lastSync: timestamp("last_sync"),
  syncStatus: varchar("sync_status"), // success, failed, pending
  syncErrors: text("sync_errors"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("ats_integrations_recruiter_idx").on(table.recruiterId),
  index("ats_integrations_platform_idx").on(table.platformName),
]);

// Employer branding and career pages
export const careerPages = pgTable("career_pages", {
  id: serial("id").primaryKey(),
  recruiterId: varchar("recruiter_id").references(() => users.id).notNull(),
  companyName: varchar("company_name").notNull(),
  pageName: varchar("page_name").notNull(),
  customUrl: varchar("custom_url").unique(),

  // Branding
  logo: varchar("logo"),
  coverImage: varchar("cover_image"),
  brandColors: jsonb("brand_colors"),
  companyDescription: text("company_description"),
  mission: text("mission"),
  values: text("values").array(),

  // Content
  videoIntro: varchar("video_intro"),
  teamPhotos: text("team_photos").array(),
  officePhotos: text("office_photos").array(),
  testimonials: jsonb("testimonials"),
  perks: text("perks").array(),

  // Settings
  isPublic: boolean("is_public").default(true),
  allowApplications: boolean("allow_applications").default(true),
  customDomain: varchar("custom_domain"),

  // Analytics
  viewsCount: integer("views_count").default(0),
  applicationsCount: integer("applications_count").default(0),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("career_pages_recruiter_idx").on(table.recruiterId),
  index("career_pages_url_idx").on(table.customUrl),
]);

// Candidate feedback and surveys
export const candidateFeedback = pgTable("candidate_feedback", {
  id: serial("id").primaryKey(),
  applicationId: integer("application_id").references(() => jobPostingApplications.id).notNull(),
  candidateId: varchar("candidate_id").references(() => users.id).notNull(),
  recruiterId: varchar("recruiter_id").references(() => users.id).notNull(),

  // Feedback scores (1-5)
  applicationProcessRating: integer("application_process_rating"),
  communicationRating: integer("communication_rating"),
  interviewExperienceRating: integer("interview_experience_rating"),
  overallExperienceRating: integer("overall_experience_rating"),

  // Feedback details
  whatWorkedWell: text("what_worked_well"),
  whatCouldImprove: text("what_could_improve"),
  wouldRecommend: boolean("would_recommend"),
  additionalComments: text("additional_comments"),

  // Status
  surveyCompleted: boolean("survey_completed").default(false),
  feedbackPublic: boolean("feedback_public").default(false),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("candidate_feedback_application_idx").on(table.applicationId),
  index("candidate_feedback_candidate_idx").on(table.candidateId),
  index("candidate_feedback_recruiter_idx").on(table.recruiterId),
]);

// Security and verification
export const securityVerifications = pgTable("security_verifications", {
  id: serial("id").primaryKey(),
  applicationId: integer("application_id").references(() => jobPostingApplications.id).notNull(),
  candidateId: varchar("candidate_id").references(() => users.id).notNull(),
  verificationType: varchar("verification_type").notNull(), // identity, employment, education, background

  // Verification details
  documentType: varchar("document_type"),
  documentUrl: varchar("document_url"),
  verificationStatus: varchar("verification_status").default("pending"), // pending, verified, failed, expired
  verificationProvider: varchar("verification_provider"),
  verificationId: varchar("verification_id"),

  // Results
  verificationScore: integer("verification_score"), // 0-100
  riskLevel: varchar("risk_level"), // low, medium, high
  flaggedReasons: text("flagged_reasons").array(),
  verificationReport: jsonb("verification_report"),

  // Metadata
  requestedBy: varchar("requested_by").references(() => users.id).notNull(),
  verifiedAt: timestamp("verified_at"),
  expiresAt: timestamp("expires_at"),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("security_verifications_application_idx").on(table.applicationId),
  index("security_verifications_candidate_idx").on(table.candidateId),
  index("security_verifications_type_idx").on(table.verificationType),
]);

// Performance metrics and analytics
export const recruiterAnalytics = pgTable("recruiter_analytics", {
  id: serial("id").primaryKey(),
  recruiterId: varchar("recruiter_id").references(() => users.id).notNull(),
  date: date("date").notNull(),

  // Job posting metrics
  jobsPosted: integer("jobs_posted").default(0),
  jobsActive: integer("jobs_active").default(0),
  jobViews: integer("job_views").default(0),
  jobApplications: integer("job_applications").default(0),

  // Application metrics
  applicationsReviewed: integer("applications_reviewed").default(0),
  applicationsShortlisted: integer("applications_shortlisted").default(0),
  interviewsScheduled: integer("interviews_scheduled").default(0),
  interviewsCompleted: integer("interviews_completed").default(0),
  offersExtended: integer("offers_extended").default(0),
  hires: integer("hires").default(0),

  // Performance metrics
  averageTimeToReview: integer("average_time_to_review"), // hours
  averageTimeToInterview: integer("average_time_to_interview"), // hours
  averageTimeToHire: integer("average_time_to_hire"), // hours
  conversionRate: integer("conversion_rate"), // percentage

  // Candidate experience
  averageCandidateRating: integer("average_candidate_rating"), // 1-5
  responseRate: integer("response_rate"), // percentage

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("recruiter_analytics_recruiter_idx").on(table.recruiterId),
  index("recruiter_analytics_date_idx").on(table.date),
]);

// Test system tables
export const testTemplates = pgTable("test_templates", {
  id: serial("id").primaryKey(),
  title: varchar("title").notNull(),
  description: text("description"),
  category: varchar("category").notNull(), // "technical", "behavioral", "general"
  jobProfile: varchar("job_profile").notNull(), // "software_engineer", "data_scientist", "marketing", etc.
  difficultyLevel: varchar("difficulty_level").notNull(), // "beginner", "intermediate", "advanced", "expert"
  timeLimit: integer("time_limit").notNull(), // in minutes
  passingScore: integer("passing_score").notNull(), // percentage (0-100)
  questions: jsonb("questions").notNull(), // array of question objects
  createdBy: varchar("created_by").references(() => users.id), // null for platform templates
  isGlobal: boolean("is_global").default(false), // platform-wide templates
  isActive: boolean("is_active").default(true),

  // Question bank integration
  useQuestionBank: boolean("use_question_bank").default(false), // Auto-generate from question bank
  tags: text("tags").array(), // job profile tags for question selection
  aptitudeQuestions: integer("aptitude_questions").default(15), // 50%
  englishQuestions: integer("english_questions").default(6), // 20%
  domainQuestions: integer("domain_questions").default(9), // 30%
  includeExtremeQuestions: boolean("include_extreme_questions").default(true),
  customQuestions: jsonb("custom_questions").default("[]"), // Manual questions

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("test_templates_job_profile_idx").on(table.jobProfile),
  index("test_templates_difficulty_idx").on(table.difficultyLevel),
  index("test_templates_category_idx").on(table.category),
  index("test_templates_created_by_idx").on(table.createdBy),
]);

// Question bank table for storing pre-built questions
export const questionBank = pgTable("question_bank", {
  id: serial("id").primaryKey(),
  questionId: varchar("question_id").unique().notNull(), // unique identifier from question bank
  type: varchar("type").notNull(), // multiple_choice, coding, etc.
  category: varchar("category").notNull(), // general_aptitude, english, domain_specific
  domain: varchar("domain").notNull(), // general, technical, finance, marketing, etc.
  subCategory: varchar("sub_category").notNull(),
  difficulty: varchar("difficulty").notNull(), // easy, medium, hard, extreme
  question: text("question").notNull(),
  options: text("options").array(),
  correctAnswer: text("correct_answer"),
  explanation: text("explanation"),
  points: integer("points").default(5),
  timeLimit: integer("time_limit").default(2), // in minutes
  tags: text("tags").array(),
  keywords: text("keywords").array(),

  // Coding question specific fields
  testCases: text("test_cases"),
  boilerplate: text("boilerplate"),
  language: varchar("language"),

  // Metadata
  isActive: boolean("is_active").default(true),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("question_bank_category_idx").on(table.category),
  index("question_bank_domain_idx").on(table.domain),
  index("question_bank_difficulty_idx").on(table.difficulty),
  index("question_bank_tags_idx").on(table.tags),
]);

// Test generation logs for tracking auto-generated tests
export const testGenerationLogs = pgTable("test_generation_logs", {
  id: serial("id").primaryKey(),
  testTemplateId: integer("test_template_id").references(() => testTemplates.id),
  assignmentId: integer("assignment_id").references(() => testAssignments.id),
  generatedQuestions: jsonb("generated_questions").notNull(), // Questions selected from bank
  generationParams: jsonb("generation_params").notNull(), // Parameters used for generation
  totalQuestions: integer("total_questions").notNull(),
  aptitudeCount: integer("aptitude_count").default(0),
  englishCount: integer("english_count").default(0),
  domainCount: integer("domain_count").default(0),
  extremeCount: integer("extreme_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("test_generation_logs_template_idx").on(table.testTemplateId),
  index("test_generation_logs_assignment_idx").on(table.assignmentId),
]);

export const testAssignments = pgTable("test_assignments", {
  id: serial("id").primaryKey(),
  testTemplateId: integer("test_template_id").references(() => testTemplates.id).notNull(),
  recruiterId: varchar("recruiter_id").references(() => users.id).notNull(),
  jobSeekerId: varchar("job_seeker_id").references(() => users.id).notNull(),
  jobPostingId: integer("job_posting_id").references(() => jobPostings.id), // optional link to job

  // Assignment details
  assignedAt: timestamp("assigned_at").defaultNow(),
  dueDate: timestamp("due_date").notNull(),
  status: varchar("status").default("assigned"), // "assigned", "started", "completed", "expired"

  // Test taking details
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  score: integer("score"), // percentage (0-100)
  answers: jsonb("answers"), // user's answers
  timeSpent: integer("time_spent"), // in seconds

  // Retake system
  retakeAllowed: boolean("retake_allowed").default(false),
  retakePaymentId: varchar("retake_payment_id"), // payment for retake
  retakeCount: integer("retake_count").default(0),
  maxRetakes: integer("max_retakes").default(1),

  // Notifications
  emailSent: boolean("email_sent").default(false),
  remindersSent: integer("reminders_sent").default(0),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("test_assignments_recruiter_idx").on(table.recruiterId),
  index("test_assignments_job_seeker_idx").on(table.jobSeekerId),
  index("test_assignments_job_posting_idx").on(table.jobPostingId),
  index("test_assignments_status_idx").on(table.status),
  index("test_assignments_due_date_idx").on(table.dueDate),
]);

export const testRetakePayments = pgTable("test_retake_payments", {
  id: serial("id").primaryKey(),
  testAssignmentId: integer("test_assignment_id").references(() => testAssignments.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),

  // Payment details
  amount: integer("amount").notNull(), // in cents ($5 = 500)
  currency: varchar("currency").default("USD"),
  paymentProvider: varchar("payment_provider").notNull(), // "stripe", "paypal", "razorpay"
  paymentIntentId: varchar("payment_intent_id"),
  paymentStatus: varchar("payment_status").default("pending"), // "pending", "completed", "failed"

  // Metadata
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("test_retake_payments_assignment_idx").on(table.testAssignmentId),
  index("test_retake_payments_user_idx").on(table.userId),
  index("test_retake_payments_status_idx").on(table.paymentStatus),
]);

// Subscription management for premium plans
export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  tier: varchar("tier").notNull(), // subscription tier ID
  tierId: varchar("tier_id"), // alias for compatibility
  status: varchar("status").notNull(), // 'pending', 'active', 'cancelled', 'expired'
  paymentMethod: varchar("payment_method").notNull(), // 'paypal', 'razorpay'
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency").notNull().default('USD'),
  billingCycle: varchar("billing_cycle").notNull(), // 'monthly', 'yearly'
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  nextBillingDate: timestamp("next_billing_date"),
  paymentId: varchar("payment_id"),
  paypalSubscriptionId: varchar("paypal_subscription_id"),
  razorpaySubscriptionId: varchar("razorpay_subscription_id"),
  razorpayCustomerId: varchar("razorpay_customer_id"),
  razorpayPlanId: varchar("razorpay_plan_id"),
  autoRenew: boolean("auto_renew").default(true),
  activatedAt: timestamp("activated_at"),
  cancelledAt: timestamp("cancelled_at"),
  renewedAt: timestamp("renewed_at"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("subscriptions_user_idx").on(table.userId),
  index("subscriptions_status_idx").on(table.status),
  index("subscriptions_tier_idx").on(table.tier),
]);

// Career AI Analysis storage for persistence
export const careerAiAnalyses = pgTable("career_ai_analyses", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  careerGoal: varchar("career_goal").notNull(),
  location: varchar("location"),
  timeframe: varchar("timeframe"),
  progressUpdate: text("progress_update"),
  completedTasks: text("completed_tasks").array(),
  analysisData: jsonb("analysis_data").notNull(), // Full AI response
  insights: jsonb("insights"), // Structured insights array
  careerPath: jsonb("career_path"), // Career path object
  skillGaps: jsonb("skill_gaps"), // Skill gaps array
  networkingOpportunities: jsonb("networking_opportunities"), // Networking data
  marketTiming: jsonb("market_timing"), // Market timing insights
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("career_ai_analyses_user_idx").on(table.userId),
  index("career_ai_analyses_active_idx").on(table.isActive),
]);

export const careerAiAnalysesRelations = relations(careerAiAnalyses, ({ one }) => ({
  user: one(users, {
    fields: [careerAiAnalyses.userId],
    references: [users.id],
  }),
}));


// One-time payments table (for mock interviews, virtual interviews, ranking tests, retakes, premium targeting)
export const oneTimePayments = pgTable("one_time_payments", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  serviceType: varchar("service_type").notNull(), // mock_interview, virtual_interview, ranking_test, test_retake, premium_targeting
  serviceId: varchar("service_id"), // ID of the specific service instance
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency").default("USD").notNull(),
  paymentProvider: varchar("payment_provider").notNull(), // paypal, amazon_pay
  paymentId: varchar("payment_id").notNull(), // Provider's payment/order ID
  status: varchar("status").default("pending").notNull(), // pending, completed, failed, cancelled
  description: text("description"),
  transactionData: jsonb("transaction_data"), // Provider-specific transaction details
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
}, (table) => [
  index("one_time_payments_user_idx").on(table.userId),
  index("one_time_payments_service_idx").on(table.serviceType, table.serviceId),
  index("one_time_payments_payment_idx").on(table.paymentId),
]);

// Insert schemas
export const insertUserProfileSchema = createInsertSchema(userProfiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserSkillSchema = createInsertSchema(userSkills).omit({
  id: true,
  createdAt: true,
});

export const insertWorkExperienceSchema = createInsertSchema(workExperience).omit({
  id: true,
  createdAt: true,
});

export const insertEducationSchema = createInsertSchema(education).omit({
  id: true,
  createdAt: true,
});

export const insertJobApplicationSchema = createInsertSchema(jobApplications).omit({
  id: true,
  createdAt: true,
  appliedDate: true,
  lastUpdated: true,
});

export const insertJobRecommendationSchema = createInsertSchema(jobRecommendations).omit({
  id: true,
  createdAt: true,
});

export const insertAiJobAnalysisSchema = createInsertSchema(aiJobAnalyses).omit({
  id: true,
  createdAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertUserProfile = z.infer<typeof insertUserProfileSchema>;
export type UserProfile = typeof userProfiles.$inferSelect;
export type InsertUserSkill = z.infer<typeof insertUserSkillSchema>;
export type UserSkill = typeof userSkills.$inferSelect;
export type InsertWorkExperience = z.infer<typeof insertWorkExperienceSchema>;
export type WorkExperience = typeof workExperience.$inferSelect;
export type InsertEducation = z.infer<typeof insertEducationSchema>;
export type Education = typeof education.$inferSelect;

export const insertResumeSchema = createInsertSchema(resumes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertResume = z.infer<typeof insertResumeSchema>;
export type Resume = typeof resumes.$inferSelect;
export type InsertJobApplication = z.infer<typeof insertJobApplicationSchema>;
export type JobApplication = typeof jobApplications.$inferSelect;
export type InsertJobRecommendation = z.infer<typeof insertJobRecommendationSchema>;
export type JobRecommendation = typeof jobRecommendations.$inferSelect;
export type InsertAiJobAnalysis = z.infer<typeof insertAiJobAnalysisSchema>;
export type AiJobAnalysis = typeof aiJobAnalyses.$inferSelect;

export const insertDailyUsageSchema = createInsertSchema(dailyUsage).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// New insert schemas for recruiter functionality
export const insertJobPostingSchema = createInsertSchema(jobPostings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  applicationsCount: true,
  viewsCount: true,
});

export const insertJobPostingApplicationSchema = createInsertSchema(jobPostingApplications).omit({
  id: true,
  appliedAt: true,
  updatedAt: true,
});

export const insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastMessageAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEmailVerificationTokenSchema = createInsertSchema(emailVerificationTokens).omit({
  id: true,
  createdAt: true,
});

export const insertPasswordResetTokenSchema = createInsertSchema(passwordResetTokens).omit({
  id: true,
  createdAt: true,
});

// Test system insert schemas
export const insertTestTemplateSchema = createInsertSchema(testTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTestAssignmentSchema = createInsertSchema(testAssignments).omit({
  id: true,
  assignedAt: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTestRetakePaymentSchema = createInsertSchema(testRetakePayments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCareerAiAnalysisSchema = createInsertSchema(careerAiAnalyses).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Test system types
export type TestTemplate = typeof testTemplates.$inferSelect;
export type InsertTestTemplate = z.infer<typeof insertTestTemplateSchema>;
export type TestAssignment = typeof testAssignments.$inferSelect;
export type InsertTestAssignment = z.infer<typeof insertTestAssignmentSchema>;
export type TestRetakePayment = typeof testRetakePayments.$inferSelect;
export type InsertTestRetakePayment = z.infer<typeof insertTestRetakePaymentSchema>;

// Career AI Analysis types
export type CareerAiAnalysis = typeof careerAiAnalyses.$inferSelect;
export type InsertCareerAiAnalysis = z.infer<typeof insertCareerAiAnalysisSchema>;

// Ranking Tests - Premium feature for users to compete in skill-based tests
export const rankingTests = pgTable("ranking_tests", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  testTitle: varchar("test_title").notNull(),
  category: varchar("category").notNull(), // technical, behavioral, general
  domain: varchar("domain").notNull(), // general, technical, finance, marketing, etc.
  difficultyLevel: varchar("difficulty_level").notNull(), // beginner, intermediate, advanced
  totalQuestions: integer("total_questions").notNull(),
  correctAnswers: integer("correct_answers").default(0),
  totalScore: integer("total_score").default(0),
  maxScore: integer("max_score").notNull(),
  percentageScore: integer("percentage_score").default(0),
  timeSpent: integer("time_spent").default(0), // in seconds
  answers: jsonb("answers").default("[]"),
  questions: jsonb("questions").notNull(),
  status: varchar("status").default("in_progress"), // in_progress, completed, expired

  // Ranking data
  rank: integer("rank"), // Global rank in category
  weeklyRank: integer("weekly_rank"),
  monthlyRank: integer("monthly_rank"),
  categoryRank: integer("category_rank"),

  // Payment tracking
  paymentStatus: varchar("payment_status").default("pending"), // pending, completed, failed
  paymentId: varchar("payment_id"), // Payment transaction ID

  // Recruiter sharing
  isSharedToRecruiters: boolean("is_shared_to_recruiters").default(false),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("ranking_tests_user_idx").on(table.userId),
  index("ranking_tests_category_idx").on(table.category),
  index("ranking_tests_domain_idx").on(table.domain),
  index("ranking_tests_status_idx").on(table.status),
  index("ranking_tests_rank_idx").on(table.rank),
  index("ranking_tests_weekly_rank_idx").on(table.weeklyRank),
  index("ranking_tests_monthly_rank_idx").on(table.monthlyRank),
]);

// Weekly Rankings - Top performers each week
export const weeklyRankings = pgTable("weekly_rankings", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  testId: integer("test_id").references(() => rankingTests.id).notNull(),
  weekStart: varchar("week_start").notNull(), // YYYY-MM-DD format
  weekEnd: varchar("week_end").notNull(),
  rank: integer("rank").notNull(),
  category: varchar("category").notNull(),
  domain: varchar("domain").notNull(),
  totalScore: integer("total_score").notNull(),
  percentageScore: integer("percentage_score").notNull(),
  isTopPerformer: boolean("is_top_performer").default(false), // Top 10 weekly
  resumeSharedToRecruiters: boolean("resume_shared_to_recruiters").default(false),
  shareCount: integer("share_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("weekly_rankings_user_idx").on(table.userId),
  index("weekly_rankings_week_idx").on(table.weekStart),
  index("weekly_rankings_category_domain_idx").on(table.category, table.domain),
  index("weekly_rankings_rank_idx").on(table.rank),
  index("weekly_rankings_top_performer_idx").on(table.isTopPerformer),
]);

// Monthly Rankings - Aggregate monthly performance
export const monthlyRankings = pgTable("monthly_rankings", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  month: integer("month").notNull(),
  year: integer("year").notNull(),
  rank: integer("rank").notNull(),
  category: varchar("category").notNull(),
  domain: varchar("domain").notNull(),
  totalTests: integer("total_tests").default(1),
  averageScore: integer("average_score").notNull(),
  bestScore: integer("best_score").notNull(),
  profileSharedCount: integer("profile_shared_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("monthly_rankings_user_idx").on(table.userId),
  index("monthly_rankings_month_year_idx").on(table.month, table.year),
  index("monthly_rankings_category_domain_idx").on(table.category, table.domain),
  index("monthly_rankings_rank_idx").on(table.rank),
]);

// Recruiter Ranking Access - Recruiters get access to top performers
export const recruiterRankingAccess = pgTable("recruiter_ranking_access", {
  id: serial("id").primaryKey(),
  recruiterId: varchar("recruiter_id").references(() => users.id).notNull(),
  candidateId: varchar("candidate_id").references(() => users.id).notNull(),
  accessType: varchar("access_type").notNull(), // weekly_top, monthly_share, premium_feature
  rankingType: varchar("ranking_type").notNull(), // weekly, monthly
  category: varchar("category").notNull(),
  domain: varchar("domain").notNull(),
  candidateRank: integer("candidate_rank").notNull(),
  candidateScore: integer("candidate_score").notNull(),
  testDetails: jsonb("test_details"), // Test performance details
  viewed: boolean("viewed").default(false),
  contacted: boolean("contacted").default(false),
  sharedAt: timestamp("shared_at").defaultNow(),
  viewedAt: timestamp("viewed_at"),
  contactedAt: timestamp("contacted_at"),
  notes: text("notes"),
}, (table) => [
  index("recruiter_ranking_access_recruiter_idx").on(table.recruiterId),
  index("recruiter_ranking_access_candidate_idx").on(table.candidateId),
  index("recruiter_ranking_access_type_idx").on(table.accessType),
  index("recruiter_ranking_access_viewed_idx").on(table.viewed),
  index("recruiter_ranking_access_shared_idx").on(table.sharedAt),
]);

// Insert schemas for ranking system
export const insertRankingTestSchema = createInsertSchema(rankingTests).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWeeklyRankingSchema = createInsertSchema(weeklyRankings).omit({
  id: true,
  createdAt: true,
});

export const insertMonthlyRankingSchema = createInsertSchema(monthlyRankings).omit({
  id: true,
  createdAt: true,
});

export const insertRecruiterRankingAccessSchema = createInsertSchema(recruiterRankingAccess).omit({
  id: true,
  sharedAt: true,
});

// Ranking system types
export type RankingTest = typeof rankingTests.$inferSelect;
export type InsertRankingTest = z.infer<typeof insertRankingTestSchema>;
export type WeeklyRanking = typeof weeklyRankings.$inferSelect;
export type InsertWeeklyRanking = z.infer<typeof insertWeeklyRankingSchema>;
export type MonthlyRanking = typeof monthlyRankings.$inferSelect;
export type InsertMonthlyRanking = z.infer<typeof insertMonthlyRankingSchema>;
export type RecruiterRankingAccess = typeof recruiterRankingAccess.$inferSelect;
export type InsertRecruiterRankingAccess = z.infer<typeof insertRecruiterRankingAccessSchema>;

// Mock Interview Sessions
export const mockInterviews = pgTable("mock_interviews", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  sessionId: varchar("session_id").unique().notNull(),
  interviewType: varchar("interview_type").default("technical"), // technical, behavioral, system_design
  difficulty: varchar("difficulty").default("medium"), // easy, medium, hard
  role: varchar("role").default("software_engineer"), // role being interviewed for
  company: varchar("company"), // optional company context
  language: varchar("language").default("javascript"), // programming language
  status: varchar("status").default("active"), // active, completed, abandoned
  currentQuestion: integer("current_question").default(1),
  totalQuestions: integer("total_questions").default(3),
  timeRemaining: integer("time_remaining").default(3600), // in seconds
  startTime: timestamp("start_time").defaultNow(),
  endTime: timestamp("end_time"),
  score: integer("score"), // overall score 0-100
  feedback: text("feedback"), // AI generated feedback
  isPaid: boolean("is_paid").default(false), // whether this interview was paid for
  paymentId: varchar("payment_id"), // reference to payment transaction

  // Recruiter assignment system
  assignedBy: varchar("assigned_by").references(() => users.id), // recruiter who assigned this interview
  assignmentType: varchar("assignment_type").default("self"), // self, recruiter_assigned
  jobPostingId: integer("job_posting_id").references(() => jobPostings.id), // linked job posting
  assignedAt: timestamp("assigned_at"),
  dueDate: timestamp("due_date"),
  emailSent: boolean("email_sent").default(false),

  // Result sharing control
  resultsSharedWithRecruiter: boolean("results_shared_with_recruiter").default(false),
  partialResultsOnly: boolean("partial_results_only").default(true), // only show summary to recruiter
  retakeCount: integer("retake_count").default(0),
  maxRetakes: integer("max_retakes").default(2),
  bestAttemptId: integer("best_attempt_id"), // ID of best scoring attempt

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("mock_interviews_user_idx").on(table.userId),
  index("mock_interviews_status_idx").on(table.status),
  index("mock_interviews_assigned_by_idx").on(table.assignedBy),
  index("mock_interviews_assignment_type_idx").on(table.assignmentType),
  index("mock_interviews_job_posting_idx").on(table.jobPostingId),
]);

// Mock Interview Questions
export const mockInterviewQuestions = pgTable("mock_interview_questions", {
  id: serial("id").primaryKey(),
  interviewId: integer("interview_id").references(() => mockInterviews.id).notNull(),
  questionNumber: integer("question_number").notNull(),
  question: text("question").notNull(),
  questionType: varchar("question_type").default("coding"), // coding, behavioral, system_design
  difficulty: varchar("difficulty").default("medium"),
  hints: jsonb("hints").default("[]"), // Array of hints
  testCases: jsonb("test_cases").default("[]"), // For coding questions
  sampleAnswer: text("sample_answer"), // Expected answer/solution
  userAnswer: text("user_answer"), // User's submitted answer
  userCode: text("user_code"), // User's code submission
  score: integer("score"), // question score 0-100
  timeSpent: integer("time_spent"), // time spent in seconds
  feedback: text("feedback"), // AI feedback for this question
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Payment transactions for mock interviews
export const interviewPayments = pgTable("interview_payments", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  interviewId: integer("interview_id").references(() => mockInterviews.id),
  amount: integer("amount").notNull(), // in cents
  currency: varchar("currency").default("USD"),
  paymentProvider: varchar("payment_provider").notNull(), // stripe, paypal, razorpay
  paymentIntentId: varchar("payment_intent_id"), // Stripe payment intent ID
  paypalOrderId: varchar("paypal_order_id"), // PayPal order ID
  razorpayPaymentId: varchar("razorpay_payment_id"), // Razorpay payment ID
  razorpayOrderId: varchar("razorpay_order_id"), // Razorpay order ID
  status: varchar("status").default("pending"), // pending, completed, failed, refunded
  metadata: jsonb("metadata"), // Additional payment metadata
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Retake payments for both mock and virtual interviews
export const interviewRetakePayments = pgTable("interview_retake_payments", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  interviewType: varchar("interview_type").notNull(), // mock, virtual
  interviewId: integer("interview_id").notNull(), // references either mock or virtual interview

  // Payment details
  amount: integer("amount").notNull().default(500), // $5 in cents
  currency: varchar("currency").default("USD"),
  paymentProvider: varchar("payment_provider").notNull(), // stripe, paypal, razorpay
  paymentIntentId: varchar("payment_intent_id"), // Stripe payment intent ID
  paypalOrderId: varchar("paypal_order_id"), // PayPal order ID
  razorpayPaymentId: varchar("razorpay_payment_id"), // Razorpay payment ID
  razorpayOrderId: varchar("razorpay_order_id"), // Razorpay order ID
  status: varchar("status").default("pending"), // pending, completed, failed, refunded

  // Retake info
  retakeNumber: integer("retake_number").notNull(),
  previousScore: integer("previous_score"),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("interview_retake_payments_user_idx").on(table.userId),
  index("interview_retake_payments_interview_idx").on(table.interviewId, table.interviewType),
  index("interview_retake_payments_status_idx").on(table.status),
]);

// User interview statistics
export const userInterviewStats = pgTable("user_interview_stats", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull().unique(),
  totalInterviews: integer("total_interviews").default(0),
  freeInterviewsUsed: integer("free_interviews_used").default(0),
  paidInterviews: integer("paid_interviews").default(0),
  averageScore: integer("average_score").default(0),
  bestScore: integer("best_score").default(0),
  totalTimeSpent: integer("total_time_spent").default(0), // in seconds
  lastInterviewDate: timestamp("last_interview_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Mock Interview Relations
export const mockInterviewsRelations = relations(mockInterviews, ({ one, many }) => ({
  user: one(users, {
    fields: [mockInterviews.userId],
    references: [users.id],
  }),
  questions: many(mockInterviewQuestions),
  payment: one(interviewPayments, {
    fields: [mockInterviews.paymentId],
    references: [interviewPayments.id],
  }),
}));

export const mockInterviewQuestionsRelations = relations(mockInterviewQuestions, ({ one }) => ({
  interview: one(mockInterviews, {
    fields: [mockInterviewQuestions.interviewId],
    references: [mockInterviews.id],
  }),
}));

export const interviewPaymentsRelations = relations(interviewPayments, ({ one }) => ({
  user: one(users, {
    fields: [interviewPayments.userId],
    references: [users.id],
  }),
  interview: one(mockInterviews, {
    fields: [interviewPayments.interviewId],
    references: [mockInterviews.id],
  }),
}));

export const userInterviewStatsRelations = relations(userInterviewStats, ({ one }) => ({
  user: one(users, {
    fields: [userInterviewStats.userId],
    references: [users.id],
  }),
}));

// Mock Interview Insert Schemas
export const insertMockInterviewSchema = createInsertSchema(mockInterviews).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMockInterviewQuestionSchema = createInsertSchema(mockInterviewQuestions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertInterviewPaymentSchema = createInsertSchema(interviewPayments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertInterviewRetakePaymentSchema = createInsertSchema(interviewRetakePayments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserInterviewStatsSchema = createInsertSchema(userInterviewStats).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Virtual AI Interview System - Conversational interview experience
export const virtualInterviews = pgTable("virtual_interviews", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  sessionId: varchar("session_id").unique().notNull(),

  // Interview configuration
  interviewType: varchar("interview_type").default("technical"), // technical, behavioral, mixed, system_design
  role: varchar("role").default("software_engineer"), // role being interviewed for
  company: varchar("company"), // optional company context
  difficulty: varchar("difficulty").default("medium"), // easy, medium, hard
  duration: integer("duration").default(30), // in minutes

  // AI interviewer configuration
  interviewerPersonality: varchar("interviewer_personality").default("professional"), // friendly, professional, challenging
  interviewStyle: varchar("interview_style").default("conversational"), // conversational, structured, adaptive

  // Session state
  status: varchar("status").default("active"), // active, completed, paused, abandoned
  currentStep: varchar("current_step").default("introduction"), // introduction, main_questions, follow_ups, conclusion
  questionsAsked: integer("questions_asked").default(0),
  totalQuestions: integer("total_questions").default(5),

  // Timing
  startTime: timestamp("start_time").defaultNow(),
  endTime: timestamp("end_time"),
  timeRemaining: integer("time_remaining"), // in seconds
  pausedTime: integer("paused_time").default(0), // total time paused

  // Performance metrics
  overallScore: integer("overall_score"), // 0-100
  technicalScore: integer("technical_score"), // 0-100
  communicationScore: integer("communication_score"), // 0-100
  confidenceScore: integer("confidence_score"), // 0-100

  // AI feedback
  strengths: text("strengths").array(),
  weaknesses: text("weaknesses").array(),
  recommendations: text("recommendations").array(),
  detailedFeedback: text("detailed_feedback"),

  // Interview context
  jobDescription: text("job_description"), // context for tailored questions
  resumeContext: text("resume_context"), // user's background for personalized questions

  // Analytics data for enhanced chat interviews
  analytics: text("analytics"), // JSON string containing advanced analytics data
  lastResponseQuality: numeric("last_response_quality"), // 0-1 score for last response quality

  // Payment and access
  isPaid: boolean("is_paid").default(false),
  paymentId: varchar("payment_id"),

  // Recruiter assignment system
  assignedBy: varchar("assigned_by").references(() => users.id), // recruiter who assigned this interview
  assignmentType: varchar("assignment_type").default("self"), // self, recruiter_assigned
  jobPostingId: integer("job_posting_id").references(() => jobPostings.id), // linked job posting
  assignedAt: timestamp("assigned_at"),
  dueDate: timestamp("due_date"),
  emailSent: boolean("email_sent").default(false),

  // Result sharing control
  resultsSharedWithRecruiter: boolean("results_shared_with_recruiter").default(false),
  partialResultsOnly: boolean("partial_results_only").default(true), // only show summary to recruiter
  retakeCount: integer("retake_count").default(0),
  maxRetakes: integer("max_retakes").default(2),
  bestAttemptId: integer("best_attempt_id"), // ID of best scoring attempt

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("virtual_interviews_user_idx").on(table.userId),
  index("virtual_interviews_status_idx").on(table.status),
  index("virtual_interviews_type_idx").on(table.interviewType),
  index("virtual_interviews_created_idx").on(table.createdAt),
  index("virtual_interviews_assigned_by_idx").on(table.assignedBy),
  index("virtual_interviews_assignment_type_idx").on(table.assignmentType),
  index("virtual_interviews_job_posting_idx").on(table.jobPostingId),
]);

// Virtual interview messages - Chat-like conversation log
export const virtualInterviewMessages = pgTable("virtual_interview_messages", {
  id: serial("id").primaryKey(),
  interviewId: integer("interview_id").references(() => virtualInterviews.id).notNull(),

  // Message details
  sender: varchar("sender").notNull(), // "interviewer", "candidate"
  messageType: varchar("message_type").default("text"), // text, question, answer, feedback, system
  content: text("content").notNull(),

  // Question-specific data
  questionCategory: varchar("question_category"), // technical, behavioral, follow_up
  difficulty: varchar("difficulty"), // easy, medium, hard
  expectedAnswer: text("expected_answer"), // AI's expected response for scoring

  // Response analysis
  responseTime: integer("response_time"), // time taken to respond in seconds (not milliseconds)
  responseQuality: integer("response_quality"), // 1-10 AI assessment
  keywordsMatched: text("keywords_matched").array(),
  sentiment: varchar("sentiment"), // positive, neutral, negative
  confidence: integer("confidence"), // 1-100 AI confidence in assessment

  // AI scoring for this exchange
  technicalAccuracy: integer("technical_accuracy"), // 0-100
  clarityScore: integer("clarity_score"), // 0-100
  depthScore: integer("depth_score"), // 0-100

  // Metadata
  timestamp: timestamp("timestamp").defaultNow(),
  messageIndex: integer("message_index").notNull(), // order in conversation

  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("virtual_interview_messages_interview_idx").on(table.interviewId),
  index("virtual_interview_messages_sender_idx").on(table.sender),
  index("virtual_interview_messages_type_idx").on(table.messageType),
  index("virtual_interview_messages_order_idx").on(table.interviewId, table.messageIndex),
]);

// Virtual interview feedback sessions - Post-interview detailed analysis
export const virtualInterviewFeedback = pgTable("virtual_interview_feedback", {
  id: serial("id").primaryKey(),
  interviewId: integer("interview_id").references(() => virtualInterviews.id).notNull(),

  // Overall performance analysis
  performanceSummary: text("performance_summary").notNull(),
  keyStrengths: text("key_strengths").array().notNull(),
  areasForImprovement: text("areas_for_improvement").array().notNull(),

  // Detailed scoring breakdown
  technicalSkillsScore: integer("technical_skills_score").notNull(), // 0-100
  problemSolvingScore: integer("problem_solving_score").notNull(), // 0-100
  communicationScore: integer("communication_score").notNull(), // 0-100
  teamworkScore: integer("teamwork_score"), // 0-100 (if applicable)
  leadershipScore: integer("leadership_score"), // 0-100 (if applicable)

  // Interview-specific metrics
  responseConsistency: integer("response_consistency").notNull(), // 0-100
  adaptabilityScore: integer("adaptability_score").notNull(), // 0-100
  stressHandling: integer("stress_handling").notNull(), // 0-100

  // Personalized recommendations
  skillGaps: text("skill_gaps").array(),
  recommendedResources: jsonb("recommended_resources"), // Learning resources
  practiceAreas: text("practice_areas").array(),
  nextSteps: text("next_steps").array(),

  // Market insights
  marketComparison: text("market_comparison"), // How they compare to others
  salaryInsights: text("salary_insights"), // Based on performance
  roleReadiness: varchar("role_readiness").notNull(), // ready, needs_practice, significant_gaps

  // AI confidence and methodology
  aiConfidenceScore: integer("ai_confidence_score").notNull(), // 0-100
  analysisMethod: varchar("analysis_method").default("groq_ai"), // AI model used
  feedbackVersion: varchar("feedback_version").default("1.0"),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("virtual_interview_feedback_interview_idx").on(table.interviewId),
  index("virtual_interview_feedback_role_readiness_idx").on(table.roleReadiness),
  index("virtual_interview_feedback_created_idx").on(table.createdAt),
]);

// Virtual interview user stats and progress tracking
export const virtualInterviewStats = pgTable("virtual_interview_stats", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),

  // Usage statistics
  totalInterviews: integer("total_interviews").default(0),
  completedInterviews: integer("completed_interviews").default(0),
  freeInterviewsUsed: integer("free_interviews_used").default(0),
  monthlyInterviewsUsed: integer("monthly_interviews_used").default(0),
  lastMonthlyReset: timestamp("last_monthly_reset").defaultNow(),
  averageScore: integer("average_score").default(0),
  bestScore: integer("best_score").default(0),

  // Progress tracking
  improvementRate: integer("improvement_rate").default(0), // percentage improvement over time
  consistencyScore: integer("consistency_score").default(0), // performance consistency

  // Interview type performance
  technicalInterviewAvg: integer("technical_interview_avg").default(0),
  behavioralInterviewAvg: integer("behavioral_interview_avg").default(0),
  systemDesignAvg: integer("system_design_avg").default(0),

  // Skill development
  strongestSkills: text("strongest_skills").array(),
  improvingSkills: text("improving_skills").array(),
  needsWorkSkills: text("needs_work_skills").array(),

  // Engagement metrics
  totalTimeSpent: integer("total_time_spent").default(0), // in minutes
  averageSessionLength: integer("average_session_length").default(0), // in minutes
  lastInterviewDate: timestamp("last_interview_date"),

  // Milestone tracking
  milestonesAchieved: text("milestones_achieved").array(),
  nextMilestone: varchar("next_milestone"),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("virtual_interview_stats_user_idx").on(table.userId),
  index("virtual_interview_stats_score_idx").on(table.bestScore),
  index("virtual_interview_stats_last_interview_idx").on(table.lastInterviewDate),
]);

// Virtual interview insert schemas
export const insertVirtualInterviewSchema = createInsertSchema(virtualInterviews).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertVirtualInterviewMessageSchema = createInsertSchema(virtualInterviewMessages).omit({
  id: true,
  createdAt: true,
});

export const insertVirtualInterviewFeedbackSchema = createInsertSchema(virtualInterviewFeedback).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertVirtualInterviewStatsSchema = createInsertSchema(virtualInterviewStats).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Mock Interview Types
export type MockInterview = typeof mockInterviews.$inferSelect;
export type InsertMockInterview = z.infer<typeof insertMockInterviewSchema>;
export type MockInterviewQuestion = typeof mockInterviewQuestions.$inferSelect;
export type InsertMockInterviewQuestion = z.infer<typeof insertMockInterviewQuestionSchema>;
export type InterviewPayment = typeof interviewPayments.$inferSelect;
export type InsertInterviewPayment = z.infer<typeof insertInterviewPaymentSchema>;
export type InterviewRetakePayment = typeof interviewRetakePayments.$inferSelect;
export type InsertInterviewRetakePayment = z.infer<typeof insertInterviewRetakePaymentSchema>;
export type UserInterviewStats = typeof userInterviewStats.$inferSelect;
export type InsertUserInterviewStats = z.infer<typeof insertUserInterviewStatsSchema>;

// Virtual AI Interview Types
export type VirtualInterview = typeof virtualInterviews.$inferSelect;
export type InsertVirtualInterview = z.infer<typeof insertVirtualInterviewSchema>;
export type VirtualInterviewMessage = typeof virtualInterviewMessages.$inferSelect;
export type InsertVirtualInterviewMessage = z.infer<typeof insertVirtualInterviewMessageSchema>;
export type VirtualInterviewFeedback = typeof virtualInterviewFeedback.$inferSelect;
export type InsertVirtualInterviewFeedback = z.infer<typeof insertVirtualInterviewFeedbackSchema>;
export type VirtualInterviewStats = typeof virtualInterviewStats.$inferSelect;
export type InsertVirtualInterviewStats = z.infer<typeof insertVirtualInterviewStatsSchema>;


// Scraped internships from external sources (specifically GitHub SimplifyJobs repo)
export const scrapedInternships = pgTable("scraped_internships", {
  id: serial("id").primaryKey(),

  // Basic job info
  company: varchar("company").notNull(),
  role: varchar("role").notNull(), // Position title
  location: varchar("location"),

  // Application details
  applicationUrl: varchar("application_url"), // Direct application link
  applicationStatus: varchar("application_status").default("open"), // open, closed

  // Internship-specific fields
  category: varchar("category"), // Software Engineering, Data Science, etc.
  requirements: text("requirements").array(), // US Citizenship, sponsorship, etc.
  season: varchar("season"), // Summer 2026, Fall 2025, etc. - no default to avoid aging

  // Scraping metadata
  sourcePlatform: varchar("source_platform").default("github_simplifyjobs"),
  sourceUrl: varchar("source_url").notNull(), // GitHub repo URL
  externalId: varchar("external_id"), // Platform-specific job ID

  // Tracking and status
  datePosted: timestamp("date_posted"),
  lastUpdated: timestamp("last_updated").defaultNow(),
  isActive: boolean("is_active").default(true),

  // Analytics
  viewsCount: integer("views_count").default(0),
  clicksCount: integer("clicks_count").default(0),

  // Raw data from GitHub
  rawMarkdownData: text("raw_markdown_data"), // Original markdown row
  simplifyApplyUrl: varchar("simplify_apply_url"), // Simplify's autofill link

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  // Unique constraint to prevent duplicates from same source
  unique("scraped_internships_source_unique").on(table.sourcePlatform, table.externalId),

  // Performance indexes
  index("scraped_internships_company_idx").on(table.company),
  index("scraped_internships_category_idx").on(table.category),
  index("scraped_internships_location_idx").on(table.location),
  index("scraped_internships_season_idx").on(table.season),
  index("scraped_internships_active_idx").on(table.isActive),
  index("scraped_internships_date_idx").on(table.datePosted),
  index("scraped_internships_composite_filter_idx").on(table.company, table.category, table.location, table.isActive),
]);

// User saved/bookmarked internships
export const userSavedInternships = pgTable("user_saved_internships", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  internshipId: integer("internship_id").notNull().references(() => scrapedInternships.id),
  savedAt: timestamp("saved_at").defaultNow().notNull(),
});

// Internship applications tracking
export const internshipApplications = pgTable("internship_applications", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  internshipId: integer("internship_id").references(() => scrapedInternships.id, { onDelete: "cascade" }).notNull(),

  // Application status
  status: varchar("status").default("applied"), // applied, in_review, rejected, accepted, withdrawn
  appliedAt: timestamp("applied_at").defaultNow(),
  statusUpdatedAt: timestamp("status_updated_at").defaultNow(),

  // Application details
  resumeUsed: varchar("resume_used"), // Which resume was used
  coverLetter: text("cover_letter"), // AI-generated or custom cover letter
  applicationNotes: text("application_notes"), // User notes

  // Tracking
  applicationMethod: varchar("application_method").default("manual"), // manual, autofill, bulk

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  // Performance indexes for dashboard queries
  index("internship_applications_user_idx").on(table.userId),
  index("internship_applications_user_status_idx").on(table.userId, table.status),
  index("internship_applications_internship_idx").on(table.internshipId),
  index("internship_applications_status_idx").on(table.status),
  index("internship_applications_date_idx").on(table.appliedAt),
]);

// Daily sync tracking for GitHub repository
export const internshipSyncLog = pgTable("internship_sync_log", {
  id: serial("id").primaryKey(),
  syncDate: date("sync_date").notNull(),

  // Sync statistics
  totalInternshipsFound: integer("total_internships_found").default(0),
  newInternshipsAdded: integer("new_internships_added").default(0),
  internshipsUpdated: integer("internships_updated").default(0),
  internshipsDeactivated: integer("internships_deactivated").default(0),

  // Sync metadata
  githubCommitHash: varchar("github_commit_hash"), // Last processed commit
  processingTimeMs: integer("processing_time_ms"),
  syncStatus: varchar("sync_status").default("success"), // success, failed, partial
  errorMessage: text("error_message"),

  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("internship_sync_log_date_idx").on(table.syncDate),
]);

// Internship relations
export const scrapedInternshipsRelations = relations(scrapedInternships, ({ many }) => ({
  savedBy: many(userSavedInternships),
  applications: many(internshipApplications),
}));

export const userSavedInternshipsRelations = relations(userSavedInternships, ({ one }) => ({
  user: one(users, {
    fields: [userSavedInternships.userId],
    references: [users.id],
  }),
  internship: one(scrapedInternships, {
    fields: [userSavedInternships.internshipId],
    references: [scrapedInternships.id],
  }),
}));

export const internshipApplicationsRelations = relations(internshipApplications, ({ one }) => ({
  user: one(users, {
    fields: [internshipApplications.userId],
    references: [users.id],
  }),
  internship: one(scrapedInternships, {
    fields: [internshipApplications.internshipId],
    references: [scrapedInternships.id],
  }),
}));

// Premium targeting jobs table for B2B features
export const premiumTargetingJobs = pgTable("premium_targeting_jobs", {
  id: serial("id").primaryKey(),
  title: varchar("title").notNull(),
  description: text("description"),
  companyName: varchar("company_name"),
  recruiterId: varchar("recruiter_id").references(() => users.id).notNull(),
  location: varchar("location"),
  salaryRange: varchar("salary_range"),
  jobType: varchar("job_type"),
  workMode: varchar("work_mode"),
  isPremiumTargeted: boolean("is_premium_targeted").default(true),
  isActive: boolean("is_active").default(false),
  estimatedCost: integer("estimated_cost"),
  targetingCriteria: jsonb("targeting_criteria"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Create aliases for missing exports to fix import errors
export const educations = education;

// Task management insert schemas
export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserResumeSchema = createInsertSchema(userResumes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTaskReminderSchema = createInsertSchema(taskReminders).omit({
  id: true,
  createdAt: true,
});

// Task management types
export type Task = typeof tasks.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type UserResume = typeof userResumes.$inferSelect;
export type InsertUserResume = z.infer<typeof insertUserResumeSchema>;
export type TaskReminder = typeof taskReminders.$inferSelect;
export type InsertTaskReminder = z.infer<typeof insertTaskReminderSchema>;

// REFERRAL MARKETPLACE SYSTEM

// Referrers table - Employee profiles offering referral services
export const referrers = pgTable("referrers", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),

  // Verification details
  companyEmail: varchar("company_email").notNull(),
  companyName: varchar("company_name").notNull(),
  companyLogoUrl: varchar("company_logo_url"),
  jobTitle: varchar("job_title").notNull(),
  department: varchar("department"),
  linkedinProfile: varchar("linkedin_url"),

  // Verification status
  isEmailVerified: boolean("is_email_verified").default(false),
  verificationToken: varchar("verification_token"),
  verificationTokenExpiry: timestamp("verification_token_expiry"),
  verificationLevel: varchar("verification_level").default("basic"), // basic, verified, premium

  // Privacy settings
  isAnonymous: boolean("is_anonymous").default(false),
  displayName: varchar("display_name"), // Custom display name if anonymous

  // Profile information
  yearsAtCompany: integer("years_at_company"),
  bio: text("bio"),
  specialties: text("specialties").array(),
  availableRoles: text("available_roles").array(), // Roles they can refer for

  // Reputation system
  totalServices: integer("total_services").default(0),
  completedServices: integer("completed_services").default(0),
  totalReferrals: integer("total_referrals").default(0),
  successfulReferrals: integer("successful_referrals").default(0),
  averageRating: numeric("average_rating", { precision: 3, scale: 2 }).default("0.00"),
  totalReviews: integer("total_reviews").default(0),

  // Meeting scheduling
  meetingScheduleLink: varchar("meeting_schedule_link"),
  emailTemplate: text("email_template"),

  // Status
  isActive: boolean("is_active").default(true),
  acceptingBookings: boolean("accepting_bookings").default(true),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("referrers_user_idx").on(table.userId),
  index("referrers_company_idx").on(table.companyName),
  index("referrers_verified_idx").on(table.isEmailVerified),
  index("referrers_active_idx").on(table.isActive),
  index("referrers_rating_idx").on(table.averageRating),
]);

// Referral Services - The bundles/packages offered by referrers
export const referralServices = pgTable("referral_services", {
  id: serial("id").primaryKey(),
  referrerId: integer("referrer_id").references(() => referrers.id).notNull(),

  // Service details
  serviceType: varchar("service_type").notNull(), // intro_meeting, interview_prep, ongoing_mentorship
  title: varchar("title").notNull(),
  description: text("description").notNull(),

  // Pricing
  basePrice: numeric("base_price", { precision: 10, scale: 2 }).notNull(),
  referralBonusPrice: numeric("referral_bonus_price", { precision: 10, scale: 2 }).default("0.00"),
  currency: varchar("currency").default("USD"),

  // Service specifics
  sessionDuration: integer("session_duration"), // in minutes
  sessionsIncluded: integer("sessions_included").default(1),
  includesReferral: boolean("includes_referral").default(false),

  // Features included
  features: text("features").array(),
  deliverables: text("deliverables").array(),

  // Availability
  isActive: boolean("is_active").default(true),
  availableSlots: integer("available_slots").default(10),
  bookedSlots: integer("booked_slots").default(0),

  // Requirements
  requirements: text("requirements").array(), // What job seeker needs to provide
  targetRoles: text("target_roles").array(), // Which roles this service helps with

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("referral_services_referrer_idx").on(table.referrerId),
  index("referral_services_type_idx").on(table.serviceType),
  index("referral_services_active_idx").on(table.isActive),
  index("referral_services_price_idx").on(table.basePrice),
]);

// Referral Bookings - Sessions booked between job seekers and referrers
export const referralBookings = pgTable("referral_bookings", {
  id: serial("id").primaryKey(),
  serviceId: integer("service_id").references(() => referralServices.id).notNull(),
  referrerId: integer("referrer_id").references(() => referrers.id).notNull(),
  jobSeekerId: varchar("job_seeker_id").references(() => users.id).notNull(),

  // Booking details
  status: varchar("status").default("pending"), // pending, confirmed, in_progress, completed, cancelled, refunded
  scheduledAt: timestamp("scheduled_at"),
  actualStartTime: timestamp("actual_start_time"),
  actualEndTime: timestamp("actual_end_time"),

  // Communication
  conversationId: integer("conversation_id").references(() => conversations.id),
  meetingLink: varchar("meeting_link"),
  notes: text("notes"),

  // Payment information
  totalAmount: numeric("total_amount", { precision: 10, scale: 2 }).notNull(),
  baseAmount: numeric("base_amount", { precision: 10, scale: 2 }).notNull(),
  referralBonusAmount: numeric("referral_bonus_amount", { precision: 10, scale: 2 }).default("0.00"),
  paymentStatus: varchar("payment_status").default("pending"), // pending, escrowed, released, refunded
  paymentId: varchar("payment_id"),

  // Escrow system
  escrowStatus: varchar("escrow_status").default("held"), // held, released_base, released_bonus, refunded
  baseAmountReleased: boolean("base_amount_released").default(false),
  bonusAmountReleased: boolean("bonus_amount_released").default(false),
  escrowReleaseDate: timestamp("escrow_release_date"),

  // Referral tracking
  referralSubmitted: boolean("referral_submitted").default(false),
  referralProofUrl: varchar("referral_proof_url"),
  referralSubmittedAt: timestamp("referral_submitted_at"),
  interviewScheduled: boolean("interview_scheduled").default(false),
  interviewCompletedAt: timestamp("interview_completed_at"),

  // Service delivery tracking
  deliverables: jsonb("deliverables"), // What was delivered during the session
  sessionSummary: text("session_summary"),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("referral_bookings_service_idx").on(table.serviceId),
  index("referral_bookings_referrer_idx").on(table.referrerId),
  index("referral_bookings_job_seeker_idx").on(table.jobSeekerId),
  index("referral_bookings_status_idx").on(table.status),
  index("referral_bookings_payment_idx").on(table.paymentStatus),
  index("referral_bookings_scheduled_idx").on(table.scheduledAt),
]);

// Referral Feedback - Reviews and ratings for referrers
export const referralFeedback = pgTable("referral_feedback", {
  id: serial("id").primaryKey(),
  bookingId: integer("booking_id").references(() => referralBookings.id).notNull(),
  referrerId: integer("referrer_id").references(() => referrers.id).notNull(),
  jobSeekerId: varchar("job_seeker_id").references(() => users.id).notNull(),

  // Rating system
  overallRating: integer("overall_rating").notNull(), // 1-5 stars
  communicationRating: integer("communication_rating").notNull(),
  helpfulnessRating: integer("helpfulness_rating").notNull(),
  professionalismRating: integer("professionalism_rating").notNull(),
  valueRating: integer("value_rating").notNull(),

  // Written feedback
  reviewTitle: varchar("review_title"),
  reviewText: text("review_text"),
  pros: text("pros").array(),
  cons: text("cons").array(),

  // Service specific feedback
  referralLikelihood: varchar("referral_likelihood"), // very_likely, likely, unlikely, very_unlikely
  wouldBookAgain: boolean("would_book_again").default(false),
  recommendToOthers: boolean("recommend_to_others").default(false),

  // Verification
  isVerified: boolean("is_verified").default(true), // Verified as genuine booking
  moderationStatus: varchar("moderation_status").default("approved"), // pending, approved, rejected

  // Public display
  isPublic: boolean("is_public").default(true),
  displayName: varchar("display_name"), // How reviewer wants to be shown

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("referral_feedback_booking_idx").on(table.bookingId),
  index("referral_feedback_referrer_idx").on(table.referrerId),
  index("referral_feedback_rating_idx").on(table.overallRating),
  index("referral_feedback_public_idx").on(table.isPublic),
  index("referral_feedback_created_idx").on(table.createdAt),
]);

// Referral Payment Transactions - Detailed payment tracking for escrow
export const referralPayments = pgTable("referral_payments", {
  id: serial("id").primaryKey(),
  bookingId: integer("booking_id").references(() => referralBookings.id).notNull(),

  // Payment details
  paymentProvider: varchar("payment_provider").notNull(), // paypal, stripe
  paymentIntentId: varchar("payment_intent_id"),
  paypalOrderId: varchar("paypal_order_id"),

  // Amount breakdown
  totalAmount: numeric("total_amount", { precision: 10, scale: 2 }).notNull(),
  baseAmount: numeric("base_amount", { precision: 10, scale: 2 }).notNull(),
  referralBonusAmount: numeric("referral_bonus_amount", { precision: 10, scale: 2 }).default("0.00"),
  platformFee: numeric("platform_fee", { precision: 10, scale: 2 }).default("0.00"),
  currency: varchar("currency").default("USD"),

  // Transaction status
  transactionType: varchar("transaction_type").notNull(), // charge, refund, payout
  transactionStatus: varchar("transaction_status").default("pending"), // pending, completed, failed, cancelled

  // Escrow management
  escrowHoldUntil: timestamp("escrow_hold_until"),
  baseAmountReleaseStatus: varchar("base_amount_release_status").default("held"), // held, released, failed
  bonusAmountReleaseStatus: varchar("bonus_amount_release_status").default("held"),

  // Metadata
  metadata: jsonb("metadata"), // Additional payment provider data

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("referral_payments_booking_idx").on(table.bookingId),
  index("referral_payments_provider_idx").on(table.paymentProvider),
  index("referral_payments_status_idx").on(table.transactionStatus),
  index("referral_payments_type_idx").on(table.transactionType),
]);

// Insert schemas for referral system
export const insertReferrerSchema = createInsertSchema(referrers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertReferralServiceSchema = createInsertSchema(referralServices).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertReferralBookingSchema = createInsertSchema(referralBookings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertReferralFeedbackSchema = createInsertSchema(referralFeedback).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertReferralPaymentSchema = createInsertSchema(referralPayments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Referral system types
export type Referrer = typeof referrers.$inferSelect;
export type InsertReferrer = z.infer<typeof insertReferrerSchema>;
export type ReferralService = typeof referralServices.$inferSelect;
export type InsertReferralService = z.infer<typeof insertReferralServiceSchema>;
export type ReferralBooking = typeof referralBookings.$inferSelect;
export type InsertReferralBooking = z.infer<typeof insertReferralBookingSchema>;
export type ReferralFeedback = typeof referralFeedback.$inferSelect;
export type InsertReferralFeedback = z.infer<typeof insertReferralFeedbackSchema>;
export type ReferralPayment = typeof referralPayments.$inferSelect;
export type InsertReferralPayment = z.infer<typeof insertReferralPaymentSchema>;

// REFERRAL MARKETPLACE TABLES (Simple Listings & Requests System)

// Referral Listings - User-created listings offering referrals at their companies
export const referralListings = pgTable("referral_listings", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),

  // Company details
  companyName: varchar("company_name").notNull(),
  companyDomain: varchar("company_domain").notNull(),
  description: text("description").notNull(),

  // Pricing and compensation
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  compensationType: varchar("compensation_type").notNull(), // fixed, percentage, hourly

  // Availability
  slotsAvailable: integer("slots_available").default(1).notNull(),

  // Status
  status: varchar("status").default("active").notNull(), // active, paused, closed, expired

  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("referral_listings_user_idx").on(table.userId),
  index("referral_listings_company_domain_idx").on(table.companyDomain),
  index("referral_listings_status_idx").on(table.status),
  index("referral_listings_price_idx").on(table.price),
]);

// Referral Requests - Job seekers' requests for specific referral listings
export const referralRequests = pgTable("referral_requests", {
  id: serial("id").primaryKey(),
  seekerId: varchar("seeker_id").references(() => users.id).notNull(),
  listingId: integer("listing_id").references(() => referralListings.id).notNull(),

  // Request details
  notes: text("notes"),
  status: varchar("status").default("pending").notNull(), // pending, accepted, rejected, completed

  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("referral_requests_seeker_idx").on(table.seekerId),
  index("referral_requests_listing_idx").on(table.listingId),
  index("referral_requests_listing_seeker_idx").on(table.listingId, table.seekerId),
  index("referral_requests_status_idx").on(table.status),
]);

// Insert schemas for referral marketplace tables
export const insertReferralListingSchema = createInsertSchema(referralListings).omit({
  id: true,
  createdAt: true,
});

export const insertReferralRequestSchema = createInsertSchema(referralRequests).omit({
  id: true,
  createdAt: true,
});

// Referral marketplace types
export type ReferralListing = typeof referralListings.$inferSelect;
export type InsertReferralListing = z.infer<typeof insertReferralListingSchema>;
export type ReferralRequest = typeof referralRequests.$inferSelect;
export type InsertReferralRequest = z.infer<typeof insertReferralRequestSchema>;

// Internship insert schemas and types
export const insertScrapedInternshipSchema = createInsertSchema(scrapedInternships).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  viewsCount: true,
  clicksCount: true,
});

export const insertUserSavedInternshipSchema = createInsertSchema(userSavedInternships).omit({
  id: true,
  savedAt: true,
});

export const insertInternshipApplicationSchema = createInsertSchema(internshipApplications).omit({
  id: true,
  appliedAt: true,
  statusUpdatedAt: true,
  createdAt: true,
  updatedAt: true,
});

export const insertInternshipSyncLogSchema = createInsertSchema(internshipSyncLog).omit({
  id: true,
  createdAt: true,
});

// Internship types
export type ScrapedInternship = typeof scrapedInternships.$inferSelect;
export type InsertScrapedInternship = z.infer<typeof insertScrapedInternshipSchema>;
export type UserSavedInternship = typeof userSavedInternships.$inferSelect;
export type InsertUserSavedInternship = z.infer<typeof insertUserSavedInternshipSchema>;
export type InternshipApplication = typeof internshipApplications.$inferSelect;
export type InsertInternshipApplication = z.infer<typeof insertInternshipApplicationSchema>;
export type InternshipSyncLog = typeof internshipSyncLog.$inferSelect;
export type InsertInternshipSyncLog = z.infer<typeof insertInternshipSyncLogSchema>;

// ====== BIDDER SYSTEM TABLES ======

// Bidder registrations - Users can register as bidders to post/bid on projects
export const bidderRegistrations = pgTable("bidder_registrations", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  businessName: varchar("business_name"), // Optional for freelancers
  skills: text("skills"), // Comma-separated skills
  hourlyRate: integer("hourly_rate"), // Rate in cents
  portfolioUrl: varchar("portfolio_url"),
  bio: text("bio"),
  profilePhotoUrl: varchar("profile_photo_url"), // Profile photo/logo
  businessLogoUrl: varchar("business_logo_url"), // Business logo
  preferredPaymentMethod: varchar("preferred_payment_method"), // paypal, stripe, bank_transfer
  paypalEmail: varchar("paypal_email"), // PayPal email for payments
  stripeAccountId: varchar("stripe_account_id"), // Stripe connect account ID
  bankAccountInfo: jsonb("bank_account_info"), // Encrypted bank details for direct transfer
  taxId: varchar("tax_id"), // Business tax ID
  address: text("address"), // Business address
  phone: varchar("phone"), // Contact phone
  websiteUrl: varchar("website_url"), // Business website
  socialLinks: jsonb("social_links"), // LinkedIn, Twitter, etc.
  verified: boolean("verified").default(false),
  rating: numeric("rating", { precision: 3, scale: 2 }).default("0.00"),
  completedProjects: integer("completed_projects").default(0),
  totalEarnings: integer("total_earnings").default(0), // In cents
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Projects - Both Track A (short-term) and Track B (long-term) projects
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(), // Project poster
  title: varchar("title").notNull(),
  description: text("description").notNull(),
  type: varchar("type").notNull(), // 'short_term' or 'long_term'
  category: varchar("category").notNull(), // 'web_development', 'design', 'marketing', etc.
  budget: integer("budget").notNull(), // In cents
  timeline: varchar("timeline").notNull(), // '1 week', '2 months', etc.
  skillsRequired: text("skills_required"), // Comma-separated
  status: varchar("status").default("open").notNull(), // open, in_progress, completed, cancelled
  selectedBidderId: varchar("selected_bidder_id").references(() => users.id),
  selectedBidAmount: integer("selected_bid_amount"), // In cents
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  completionDate: timestamp("completion_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
},
(table) => [
  index("idx_projects_status").on(table.status),
  index("idx_projects_type").on(table.type),
  index("idx_projects_category").on(table.category),
  index("idx_projects_user_id").on(table.userId),
]);

// Bids - Bidder proposals for projects
export const bids = pgTable("bids", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id).notNull(),
  bidderId: varchar("bidder_id").references(() => users.id).notNull(),
  amount: integer("amount").notNull(), // In cents
  timeline: varchar("timeline").notNull(),
  proposal: text("proposal").notNull(),
  status: varchar("status").default("pending").notNull(), // pending, accepted, rejected
  submittedAt: timestamp("submitted_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
},
(table) => [
  index("idx_bids_project_id").on(table.projectId),
  index("idx_bids_bidder_id").on(table.bidderId),
  index("idx_bids_status").on(table.status),
]);

// Project payments - PayPal escrow functionality
export const projectPayments = pgTable("project_payments", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id).notNull(),
  amount: integer("amount").notNull(), // In cents
  commission: integer("commission").notNull(), // Platform commission in cents
  paypalOrderId: varchar("paypal_order_id"),
  paypalPaymentId: varchar("paypal_payment_id"),
  status: varchar("status").default("pending").notNull(), // pending, escrowed, released, refunded
  escrowedAt: timestamp("escrowed_at"),
  releasedAt: timestamp("released_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
},
(table) => [
  index("idx_project_payments_project_id").on(table.projectId),
  index("idx_project_payments_status").on(table.status),
]);

// Project milestones - For tracking progress
export const projectMilestones = pgTable("project_milestones", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id).notNull(),
  title: varchar("title").notNull(),
  description: text("description"),
  amount: integer("amount").notNull(), // In cents
  status: varchar("status").default("pending").notNull(), // pending, completed, approved, paid
  dueDate: timestamp("due_date"),
  completedAt: timestamp("completed_at"),
  approvedAt: timestamp("approved_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
},
(table) => [
  index("idx_project_milestones_project_id").on(table.projectId),
  index("idx_project_milestones_status").on(table.status),
]);

// Relations
export const bidderRegistrationsRelations = relations(bidderRegistrations, ({ one }) => ({
  user: one(users, {
    fields: [bidderRegistrations.userId],
    references: [users.id],
  }),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  user: one(users, {
    fields: [projects.userId],
    references: [users.id],
  }),
  selectedBidder: one(users, {
    fields: [projects.selectedBidderId],
    references: [users.id],
  }),
  bids: many(bids),
  payments: many(projectPayments),
  milestones: many(projectMilestones),
}));

export const bidsRelations = relations(bids, ({ one }) => ({
  project: one(projects, {
    fields: [bids.projectId],
    references: [projects.id],
  }),
  bidder: one(users, {
    fields: [bids.bidderId],
    references: [users.id],
  }),
}));

export const projectPaymentsRelations = relations(projectPayments, ({ one }) => ({
  project: one(projects, {
    fields: [projectPayments.projectId],
    references: [projects.id],
  }),
}));

export const projectMilestonesRelations = relations(projectMilestones, ({ one }) => ({
  project: one(projects, {
    fields: [projectMilestones.projectId],
    references: [projects.id],
  }),
}));

// Insert schemas for bidder system
export const insertBidderRegistrationSchema = createInsertSchema(bidderRegistrations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertBidderRegistration = z.infer<typeof insertBidderRegistrationSchema>;
export type SelectBidderRegistration = typeof bidderRegistrations.$inferSelect;

export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type SelectProject = typeof projects.$inferSelect;

export const insertBidSchema = createInsertSchema(bids).omit({
  id: true,
  submittedAt: true,
  updatedAt: true,
});
export type InsertBid = z.infer<typeof insertBidSchema>;
export type SelectBid = typeof bids.$inferSelect;

export const insertProjectPaymentSchema = createInsertSchema(projectPayments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertProjectPayment = z.infer<typeof insertProjectPaymentSchema>;
export type SelectProjectPayment = typeof projectPayments.$inferSelect;

export const insertProjectMilestoneSchema = createInsertSchema(projectMilestones).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertProjectMilestone = z.infer<typeof insertProjectMilestoneSchema>;
export type SelectProjectMilestone = typeof projectMilestones.$inferSelect;

// CAREER AI ASSISTANT ENHANCEMENT SYSTEM

// Skill Progress Logs - tracks skill development over time
export const skillProgressLogs = pgTable("skill_progress_logs", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  skill: varchar("skill").notNull(),
  level: integer("level").notNull(), // 1-10 scale
  source: varchar("source").notNull(), // manual, course_completion, assessment, ai_analysis
  recordedAt: timestamp("recorded_at").defaultNow(),
}, (table) => [
  index("skill_progress_logs_user_idx").on(table.userId),
  index("skill_progress_logs_skill_idx").on(table.skill),
  index("skill_progress_logs_recorded_idx").on(table.recordedAt),
]);

// Achievements Catalog - predefined achievements
export const achievementsCatalog = pgTable("achievements_catalog", {
  id: serial("id").primaryKey(),
  key: varchar("key").unique().notNull(), // unique identifier like "first_analysis"
  name: varchar("name").notNull(),
  description: text("description").notNull(),
  icon: varchar("icon").notNull(), // lucide icon name
  points: integer("points").default(0),
  category: varchar("category").notNull(), // career_progress, learning, networking, achievement
  isActive: boolean("is_active").default(true),
}, (table) => [
  index("achievements_catalog_category_idx").on(table.category),
]);

// User Achievements - tracks user's earned achievements
export const userAchievements = pgTable("user_achievements", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  achievementId: integer("achievement_id").references(() => achievementsCatalog.id).notNull(),
  earnedAt: timestamp("earned_at").defaultNow(),
}, (table) => [
  unique("user_achievements_unique").on(table.userId, table.achievementId),
  index("user_achievements_user_idx").on(table.userId),
  index("user_achievements_earned_idx").on(table.earnedAt),
]);

// Learning Resources - curated learning materials
export const learningResources = pgTable("learning_resources", {
  id: serial("id").primaryKey(),
  skill: varchar("skill").notNull(),
  title: varchar("title").notNull(),
  url: varchar("url").notNull(),
  source: varchar("source").notNull(), // coursera, udemy, youtube, article, documentation
  cost: varchar("cost").default("free"), // free, paid, subscription
  difficulty: varchar("difficulty").notNull(), // beginner, intermediate, advanced
  estimatedHours: integer("estimated_hours"),
  rating: integer("rating"), // 1-5 stars
  tags: text("tags").array(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("learning_resources_skill_idx").on(table.skill),
  index("learning_resources_difficulty_idx").on(table.difficulty),
  index("learning_resources_cost_idx").on(table.cost),
]);

// User Learning Plan - tracks user's learning journey
export const userLearningPlan = pgTable("user_learning_plan", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  resourceId: integer("resource_id").references(() => learningResources.id).notNull(),
  status: varchar("status").default("planned"), // planned, in_progress, completed, skipped
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  progress: integer("progress").default(0), // 0-100 percentage
  notes: text("notes"),
  addedAt: timestamp("added_at").defaultNow(),
}, (table) => [
  unique("user_learning_plan_unique").on(table.userId, table.resourceId),
  index("user_learning_plan_user_idx").on(table.userId),
  index("user_learning_plan_status_idx").on(table.status),
]);

// Interview Preparations - AI-generated interview questions and practice
export const interviewPreps = pgTable("interview_preps", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  targetRole: varchar("target_role").notNull(),
  company: varchar("company"), // optional company-specific prep
  difficulty: varchar("difficulty").default("medium"), // easy, medium, hard

  // Generated content
  questions: jsonb("questions").notNull(), // Array of question objects with answers and tips
  practiceAreas: text("practice_areas").array(),

  // Usage tracking
  timesUsed: integer("times_used").default(0),
  lastUsed: timestamp("last_used"),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("interview_preps_user_idx").on(table.userId),
  index("interview_preps_role_idx").on(table.targetRole),
]);

// Notifications - smart notification system
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  type: varchar("type").notNull(), // career_milestone, skill_reminder, job_opportunity, community_update
  title: varchar("title").notNull(),
  message: text("message").notNull(),
  payload: jsonb("payload"), // additional data for the notification

  // Status
  isRead: boolean("is_read").default(false),
  priority: varchar("priority").default("medium"), // low, medium, high, urgent

  // Timing
  scheduledFor: timestamp("scheduled_for"), // for scheduled notifications
  expiresAt: timestamp("expires_at"), // when notification becomes irrelevant

  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("notifications_user_idx").on(table.userId),
  index("notifications_type_idx").on(table.type),
  index("notifications_read_idx").on(table.isRead),
  index("notifications_scheduled_idx").on(table.scheduledFor),
]);

// COMMUNITY FEATURES

// Mentor Profiles - mentors offering guidance
export const mentorProfiles = pgTable("mentor_profiles", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),

  // Professional details
  currentRole: varchar("current_role").notNull(),
  company: varchar("company").notNull(),
  yearsExperience: integer("years_experience").notNull(),
  expertiseSkills: text("expertise_skills").array().notNull(),

  // Mentoring preferences
  availability: varchar("availability").notNull(), // weekdays, weekends, flexible, limited
  sessionType: varchar("session_type").default("both"), // video, chat, both
  maxMentees: integer("max_mentees").default(5),

  // Profile
  bio: text("bio").notNull(),
  linkedinUrl: varchar("linkedin_url"),
  hourlyRate: integer("hourly_rate"), // optional paid mentoring

  // Status
  isActive: boolean("is_active").default(true),
  isVerified: boolean("is_verified").default(false),
  rating: numeric("rating", { precision: 3, scale: 2 }), // average rating
  totalSessions: integer("total_sessions").default(0),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  unique("mentor_profiles_user_unique").on(table.userId),
  index("mentor_profiles_skills_idx").on(table.expertiseSkills),
  index("mentor_profiles_active_idx").on(table.isActive),
  index("mentor_profiles_rating_idx").on(table.rating),
]);

// Mentorship Requests - connection between mentors and mentees
export const mentorshipRequests = pgTable("mentorship_requests", {
  id: serial("id").primaryKey(),
  menteeId: varchar("mentee_id").references(() => users.id).notNull(),
  mentorId: varchar("mentor_id").references(() => users.id).notNull(),

  // Request details
  message: text("message").notNull(),
  areasOfFocus: text("areas_of_focus").array().notNull(),
  preferredSchedule: varchar("preferred_schedule"),

  // Status
  status: varchar("status").default("pending"), // pending, accepted, declined, completed

  // Session details (if accepted)
  sessionScheduled: timestamp("session_scheduled"),
  sessionCompleted: timestamp("session_completed"),
  menteeRating: integer("mentee_rating"), // 1-5 rating by mentee
  mentorRating: integer("mentor_rating"), // 1-5 rating by mentor
  sessionNotes: text("session_notes"),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("mentorship_requests_mentee_idx").on(table.menteeId),
  index("mentorship_requests_mentor_idx").on(table.mentorId),
  index("mentorship_requests_status_idx").on(table.status),
]);

// Shared Career Journeys - users can share their career progression stories
export const sharedJourneys = pgTable("shared_journeys", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),

  // Journey details
  title: varchar("title").notNull(),
  content: jsonb("content").notNull(), // Rich content including timeline, milestones, lessons
  careerPath: varchar("career_path").notNull(), // e.g., "Junior Dev to Senior Engineer"
  yearsSpan: integer("years_span").notNull(),

  // Metadata
  tags: text("tags").array(),
  visibility: varchar("visibility").default("public"), // public, community, private
  likes: integer("likes").default(0),
  views: integer("views").default(0),

  // Moderation
  isApproved: boolean("is_approved").default(false),
  isFeatured: boolean("is_featured").default(false),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("shared_journeys_user_idx").on(table.userId),
  index("shared_journeys_visibility_idx").on(table.visibility),
  index("shared_journeys_approved_idx").on(table.isApproved),
  index("shared_journeys_featured_idx").on(table.isFeatured),
]);

// Challenges - group challenges for career development
export const challenges = pgTable("challenges", {
  id: serial("id").primaryKey(),
  title: varchar("title").notNull(),
  description: text("description").notNull(),
  category: varchar("category").notNull(), // skill_building, networking, job_search, interview_prep

  // Challenge configuration
  targetCount: integer("target_count"), // e.g., "Apply to 10 jobs", "Learn 3 new skills"
  targetUnit: varchar("target_unit"), // jobs, skills, connections, interviews

  // Timing
  startAt: timestamp("start_at").notNull(),
  endAt: timestamp("end_at").notNull(),

  // Rewards
  badge: varchar("badge"), // badge awarded to participants
  points: integer("points").default(0),

  // Status
  isActive: boolean("is_active").default(true),
  maxParticipants: integer("max_participants"),
  currentParticipants: integer("current_participants").default(0),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("challenges_category_idx").on(table.category),
  index("challenges_active_idx").on(table.isActive),
  index("challenges_dates_idx").on(table.startAt, table.endAt),
]);

// Challenge Participants - tracks user participation in challenges
export const challengeParticipants = pgTable("challenge_participants", {
  id: serial("id").primaryKey(),
  challengeId: integer("challenge_id").references(() => challenges.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),

  // Progress tracking
  progress: jsonb("progress").default("{}"), // flexible progress data
  currentCount: integer("current_count").default(0),
  isCompleted: boolean("is_completed").default(false),
  completedAt: timestamp("completed_at"),

  // Ranking
  rank: integer("rank"),
  points: integer("points").default(0),

  joinedAt: timestamp("joined_at").defaultNow(),
}, (table) => [
  unique("challenge_participants_unique").on(table.challengeId, table.userId),
  index("challenge_participants_challenge_idx").on(table.challengeId),
  index("challenge_participants_user_idx").on(table.userId),
  index("challenge_participants_completed_idx").on(table.isCompleted),
  index("challenge_participants_rank_idx").on(table.rank),
]);

// RELATIONS FOR CAREER AI ENHANCEMENT SYSTEM

export const skillProgressLogsRelations = relations(skillProgressLogs, ({ one }) => ({
  user: one(users, {
    fields: [skillProgressLogs.userId],
    references: [users.id],
  }),
}));

export const userAchievementsRelations = relations(userAchievements, ({ one }) => ({
  user: one(users, {
    fields: [userAchievements.userId],
    references: [users.id],
  }),
  achievement: one(achievementsCatalog, {
    fields: [userAchievements.achievementId],
    references: [achievementsCatalog.id],
  }),
}));

export const achievementsCatalogRelations = relations(achievementsCatalog, ({ many }) => ({
  userAchievements: many(userAchievements),
}));

export const userLearningPlanRelations = relations(userLearningPlan, ({ one }) => ({
  user: one(users, {
    fields: [userLearningPlan.userId],
    references: [users.id],
  }),
  resource: one(learningResources, {
    fields: [userLearningPlan.resourceId],
    references: [learningResources.id],
  }),
}));

export const learningResourcesRelations = relations(learningResources, ({ many }) => ({
  userPlans: many(userLearningPlan),
}));

export const interviewPrepsRelations = relations(interviewPreps, ({ one }) => ({
  user: one(users, {
    fields: [interviewPreps.userId],
    references: [users.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

export const mentorProfilesRelations = relations(mentorProfiles, ({ one, many }) => ({
  user: one(users, {
    fields: [mentorProfiles.userId],
    references: [users.id],
  }),
  mentorshipRequests: many(mentorshipRequests, { relationName: "mentorRequests" }),
}));

export const mentorshipRequestsRelations = relations(mentorshipRequests, ({ one }) => ({
  mentee: one(users, {
    fields: [mentorshipRequests.menteeId],
    references: [users.id],
    relationName: "menteeRequests",
  }),
  mentor: one(users, {
    fields: [mentorshipRequests.mentorId],
    references: [users.id],
    relationName: "mentorRequests",
  }),
}));

export const sharedJourneysRelations = relations(sharedJourneys, ({ one }) => ({
  user: one(users, {
    fields: [sharedJourneys.userId],
    references: [users.id],
  }),
}));

export const challengeParticipantsRelations = relations(challengeParticipants, ({ one }) => ({
  challenge: one(challenges, {
    fields: [challengeParticipants.challengeId],
    references: [challenges.id],
  }),
  user: one(users, {
    fields: [challengeParticipants.userId],
    references: [users.id],
  }),
}));

export const challengesRelations = relations(challenges, ({ many }) => ({
  participants: many(challengeParticipants),
}));

// INSERT SCHEMAS FOR CAREER AI ENHANCEMENT SYSTEM

export const insertSkillProgressLogSchema = createInsertSchema(skillProgressLogs).omit({
  id: true,
  recordedAt: true,
});

export const insertAchievementsCatalogSchema = createInsertSchema(achievementsCatalog).omit({
  id: true,
});

export const insertUserAchievementSchema = createInsertSchema(userAchievements).omit({
  id: true,
  earnedAt: true,
});

export const insertLearningResourceSchema = createInsertSchema(learningResources).omit({
  id: true,
  createdAt: true,
});

export const insertUserLearningPlanSchema = createInsertSchema(userLearningPlan).omit({
  id: true,
  addedAt: true,
});

export const insertInterviewPrepSchema = createInsertSchema(interviewPreps).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

export const insertMentorProfileSchema = createInsertSchema(mentorProfiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMentorshipRequestSchema = createInsertSchema(mentorshipRequests).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSharedJourneySchema = createInsertSchema(sharedJourneys).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertChallengeSchema = createInsertSchema(challenges).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertChallengeParticipantSchema = createInsertSchema(challengeParticipants).omit({
  id: true,
  joinedAt: true,
});

// TYPES FOR CAREER AI ENHANCEMENT SYSTEM

export type SkillProgressLog = typeof skillProgressLogs.$inferSelect;
export type InsertSkillProgressLog = z.infer<typeof insertSkillProgressLogSchema>;

export type AchievementsCatalog = typeof achievementsCatalog.$inferSelect;
export type InsertAchievementsCatalog = z.infer<typeof insertAchievementsCatalogSchema>;

export type UserAchievement = typeof userAchievements.$inferSelect;
export type InsertUserAchievement = z.infer<typeof insertUserAchievementSchema>;

export type LearningResource = typeof learningResources.$inferSelect;
export type InsertLearningResource = z.infer<typeof insertLearningResourceSchema>;

export type UserLearningPlan = typeof userLearningPlan.$inferSelect;
export type InsertUserLearningPlan = z.infer<typeof insertUserLearningPlanSchema>;

export type InterviewPrep = typeof interviewPreps.$inferSelect;
export type InsertInterviewPrep = z.infer<typeof insertInterviewPrepSchema>;

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

export type MentorProfile = typeof mentorProfiles.$inferSelect;
export type InsertMentorProfile = z.infer<typeof insertMentorProfileSchema>;

export type MentorshipRequest = typeof mentorshipRequests.$inferSelect;
export type InsertMentorshipRequest = z.infer<typeof insertMentorshipRequestSchema>;

export type SharedJourney = typeof sharedJourneys.$inferSelect;
export type InsertSharedJourney = z.infer<typeof insertSharedJourneySchema>;

export type Challenge = typeof challenges.$inferSelect;
export type InsertChallenge = z.infer<typeof insertChallengeSchema>;

export type ChallengeParticipant = typeof challengeParticipants.$inferSelect;
export type InsertChallengeParticipant = z.infer<typeof insertChallengeParticipantSchema>;

// ADVANCED ASSESSMENT SYSTEM SCHEMAS AND TYPES

// Video Interview insert schemas
export const insertVideoInterviewSchema = createInsertSchema(videoInterviews).omit({
  id: true,
  createdAt: true,
});

export const insertVideoResponseSchema = createInsertSchema(videoResponses).omit({
  id: true,
  uploadedAt: true,
});

// Simulation Assessment insert schema
export const insertSimulationAssessmentSchema = createInsertSchema(simulationAssessments).omit({
  id: true,
  createdAt: true,
});

// Personality Assessment insert schema
export const insertPersonalityAssessmentSchema = createInsertSchema(personalityAssessments).omit({
  id: true,
  createdAt: true,
});

// Skills Verification insert schema
export const insertSkillsVerificationSchema = createInsertSchema(skillsVerifications).omit({
  id: true,
  createdAt: true,
});

// Advanced Assessment Types
export type VideoInterview = typeof videoInterviews.$inferSelect;
export type InsertVideoInterview = z.infer<typeof insertVideoInterviewSchema>;

export type VideoResponse = typeof videoResponses.$inferSelect;
export type InsertVideoResponse = z.infer<typeof insertVideoResponseSchema>;

export type SimulationAssessment = typeof simulationAssessments.$inferSelect;
export type InsertSimulationAssessment = z.infer<typeof insertSimulationAssessmentSchema>;

export type PersonalityAssessment = typeof personalityAssessments.$inferSelect;
export type InsertPersonalityAssessment = z.infer<typeof insertPersonalityAssessmentSchema>;

export type SkillsVerification = typeof skillsVerifications.$inferSelect;
export type InsertSkillsVerification = z.infer<typeof insertSkillsVerificationSchema>;

// Interview Invitations insert schema
export const insertInterviewInvitationSchema = createInsertSchema(interviewInvitations).omit({
  id: true,
  createdAt: true,
  isUsed: true,
  candidateId: true,
  usedAt: true,
});

export type InterviewInvitation = typeof interviewInvitations.$inferSelect;
export type InsertInterviewInvitation = z.infer<typeof insertInterviewInvitationSchema>;

// ACE FEATURES SCHEMAS

// Job Intelligence - crowd-sourced job insights
export const jobIntelligence = pgTable("job_intelligence", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  jobUrl: varchar("job_url").notNull(),
  company: varchar("company").notNull(),
  salaryInfo: text("salary_info"),
  interviewExperience: text("interview_experience"),
  companyTips: text("company_tips"),
  applicationTips: text("application_tips"),
  helpfulnessScore: integer("helpfulness_score").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Viral Referrals - referral tracking and rewards
export const viralReferrals = pgTable("viral_referrals", {
  id: serial("id").primaryKey(),
  referrerId: varchar("referrer_id").notNull(),
  jobUrl: varchar("job_url").notNull(),
  referralCode: varchar("referral_code").notNull().unique(),
  referralsCount: integer("referrals_count").default(0),
  successfulReferrals: integer("successful_referrals").default(0),
  pointsEarned: integer("points_earned").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at"),
});

// Success Predictions - AI prediction tracking
export const successPredictions = pgTable("success_predictions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  jobId: integer("job_id"),
  jobUrl: varchar("job_url"),
  predictedProbability: integer("predicted_probability").notNull(),
  confidenceLevel: varchar("confidence_level").notNull(),
  factors: json("factors"),
  actualOutcome: varchar("actual_outcome"),
  predictionAccuracy: integer("prediction_accuracy"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  outcomeRecordedAt: timestamp("outcome_recorded_at"),
});

// Viral User Stats - user viral activity tracking
export const viralUserStats = pgTable("viral_user_stats", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().unique(),
  totalPoints: integer("total_points").default(0),
  referralCount: integer("referral_count").default(0),
  intelContributions: integer("intel_contributions").default(0),
  helpfulnessScore: numeric("helpfulness_score", { precision: 3, scale: 2 }).default("0"),
  viralRank: integer("viral_rank").default(0),
  badgesEarned: varchar("badges_earned").array().default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Extension Applications - tracking extension usage
export const extensionApplications = pgTable("extension_applications", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  jobUrl: varchar("job_url").notNull(),
  company: varchar("company"),
  applicationMethod: varchar("application_method").default("auto_fill"),
  timeToComplete: integer("time_to_complete"),
  fieldsAutoFilled: integer("fields_auto_filled"),
  successBoostType: varchar("success_boost_type"),
  viralData: json("viral_data"),
  appliedAt: timestamp("applied_at").defaultNow().notNull(),
});

// Job Application Stats - aggregated job statistics
export const jobApplicationStats = pgTable("job_application_stats", {
  id: serial("id").primaryKey(),
  jobUrl: varchar("job_url").notNull().unique(),
  company: varchar("company"),
  totalApplicants: integer("total_applicants").default(0),
  autojobrApplicants: integer("autojobr_applicants").default(0),
  successRate: numeric("success_rate", { precision: 5, scale: 2 }).default("0"),
  averageSalary: integer("average_salary"),
  competitionLevel: varchar("competition_level").default("medium"),
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
});

// Insert schemas for ACE features
export const insertJobIntelligenceSchema = createInsertSchema(jobIntelligence);
export const insertViralReferralSchema = createInsertSchema(viralReferrals);
export const insertSuccessPredictionSchema = createInsertSchema(successPredictions);
export const insertViralUserStatsSchema = createInsertSchema(viralUserStats);
export const insertExtensionApplicationSchema = createInsertSchema(extensionApplications);
export const insertJobApplicationStatsSchema = createInsertSchema(jobApplicationStats);