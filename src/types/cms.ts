export type AppStatus = 'published' | 'coming_soon' | 'draft';

export interface AppFaq {
  question: string;
  answer: string;
}

export interface AppItem {
  id: number;
  slug: string;
  name: string;
  short_description: string;
  full_description: string;
  category: string;
  status: AppStatus;
  is_featured: boolean;
  icon_url: string;
  screenshots: string[];
  features: string[];
  supported_platforms: string[];
  version: string;
  play_store_url: string;
  privacy_policy_content: string;
  faqs: AppFaq[];
  admob_configured: boolean;
  analytics_configured: boolean;
  created_at: string;
  updated_at: string;
}

export type PostStatus = 'published' | 'draft' | 'scheduled';

export interface BlogPost {
  id: number;
  slug: string;
  title: string;
  seo_title: string;
  seo_description: string;
  excerpt: string;
  content: string;
  category: string;
  featured_image: string;
  author: string;
  status: PostStatus;
  scheduled_at: string | null;
  published_at: string;
  updated_at: string;
  is_demo: boolean;
  faqs: AppFaq[];
}

export interface SiteSettings {
  company_name: string;
  tagline: string;
  alt_statement: string;
  hero_headline: string;
  hero_subheadline: string;
  intro_title: string;
  intro_body: string;
  mission_text: string;
  vision_text: string;
  future_solutions_notice: string;
  contact_email: string;
  contact_phone: string;
  office_address: string;
  lead_forward_email?: string;
  web3forms_access_key?: string;
  social_github: string;
  social_x: string;
  social_linkedin: string;
  social_playstore_dev: string;
  future_services: FutureServiceItem[];
  analytics_measurement_id: string;
  admob_publisher_note: string;
  updated_at: string;
}

export interface FutureServiceItem {
  id: string;
  title: string;
  description: string;
  status: 'coming_soon' | 'available';
}

export interface LegalPage {
  slug: string;
  title: string;
  seo_title: string;
  seo_description: string;
  content: string;
  updated_at: string;
}

export interface ContactMessage {
  id: number;
  inquiry_type: 'general' | 'business' | 'app' | 'partnership';
  name: string;
  email: string;
  subject: string;
  message: string;
  status: 'new' | 'reviewed' | 'archived';
  created_at: string;
}

export const APP_CATEGORIES = [
  'Daily Utility',
  'Productivity',
  'AI-Powered',
  'PDF & Document',
  'Calculators & Converters',
  'Personal Utility',
  'Educational',
  'Business Utility',
  'Lifestyle',
] as const;

export const BLOG_CATEGORIES = [
  'Mobile Applications',
  'Android Apps',
  'AI Technology',
  'Productivity',
  'Software Development',
  'Technology Updates',
  'Digital Innovation',
  'App Guides',
] as const;
