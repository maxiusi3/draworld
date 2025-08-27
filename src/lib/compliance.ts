/**
 * GDPR/CCPA Compliance utilities
 */

export interface UserDataExport {
  profile: {
    id: string;
    email: string;
    displayName: string;
    createdAt: string;
    credits: number;
    referralCode: string;
  };
  creations: Array<{
    id: string;
    title: string;
    prompt: string;
    createdAt: string;
    isPublic: boolean;
  }>;
  transactions: Array<{
    id: string;
    type: string;
    amount: number;
    description: string;
    createdAt: string;
  }>;
  payments: Array<{
    id: string;
    amount: number;
    status: string;
    createdAt: string;
  }>;
}

export interface DataDeletionRequest {
  userId: string;
  requestedAt: Date;
  reason?: string;
  keepAnonymizedData?: boolean;
}

/**
 * Cookie consent management
 */
export class CookieConsent {
  private static CONSENT_KEY = 'draworld_cookie_consent';
  private static CONSENT_VERSION = '1.0';

  static getConsent(): {
    necessary: boolean;
    analytics: boolean;
    marketing: boolean;
    version: string;
  } | null {
    if (typeof window === 'undefined') return null;
    
    try {
      const consent = localStorage.getItem(this.CONSENT_KEY);
      return consent ? JSON.parse(consent) : null;
    } catch {
      return null;
    }
  }

  static setConsent(consent: {
    necessary: boolean;
    analytics: boolean;
    marketing: boolean;
  }) {
    if (typeof window === 'undefined') return;
    
    const consentData = {
      ...consent,
      version: this.CONSENT_VERSION,
      timestamp: new Date().toISOString(),
    };
    
    localStorage.setItem(this.CONSENT_KEY, JSON.stringify(consentData));
    
    // Trigger consent change event
    window.dispatchEvent(new CustomEvent('cookieConsentChange', {
      detail: consentData
    }));
  }

  static hasConsent(): boolean {
    return this.getConsent() !== null;
  }

  static hasAnalyticsConsent(): boolean {
    const consent = this.getConsent();
    return consent?.analytics === true;
  }

  static hasMarketingConsent(): boolean {
    const consent = this.getConsent();
    return consent?.marketing === true;
  }

  static revokeConsent() {
    if (typeof window === 'undefined') return;
    
    localStorage.removeItem(this.CONSENT_KEY);
    
    // Clear analytics cookies if they exist
    this.clearAnalyticsCookies();
    
    window.dispatchEvent(new CustomEvent('cookieConsentRevoked'));
  }

  private static clearAnalyticsCookies() {
    // Clear Google Analytics cookies
    const gaCookies = ['_ga', '_ga_', '_gid', '_gat'];
    gaCookies.forEach(cookie => {
      document.cookie = `${cookie}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    });
  }
}

/**
 * Data retention policies
 */
export const DATA_RETENTION = {
  // User accounts - kept until deletion request
  USER_ACCOUNTS: 'indefinite',
  // Video creations - kept for 2 years after last access
  VIDEO_CREATIONS: 2 * 365 * 24 * 60 * 60 * 1000, // 2 years in ms
  // Payment records - kept for 7 years (legal requirement)
  PAYMENT_RECORDS: 7 * 365 * 24 * 60 * 60 * 1000, // 7 years in ms
  // Analytics data - kept for 2 years
  ANALYTICS_DATA: 2 * 365 * 24 * 60 * 60 * 1000, // 2 years in ms
  // Logs - kept for 90 days
  LOGS: 90 * 24 * 60 * 60 * 1000, // 90 days in ms
} as const;

/**
 * Privacy rights under GDPR/CCPA
 */
export const PRIVACY_RIGHTS = {
  ACCESS: 'right_to_access',
  RECTIFICATION: 'right_to_rectification',
  ERASURE: 'right_to_erasure',
  PORTABILITY: 'right_to_portability',
  RESTRICT_PROCESSING: 'right_to_restrict_processing',
  OBJECT_PROCESSING: 'right_to_object_processing',
  WITHDRAW_CONSENT: 'right_to_withdraw_consent',
} as const;

/**
 * Legal basis for data processing under GDPR
 */
export const LEGAL_BASIS = {
  CONSENT: 'consent',
  CONTRACT: 'contract',
  LEGAL_OBLIGATION: 'legal_obligation',
  VITAL_INTERESTS: 'vital_interests',
  PUBLIC_TASK: 'public_task',
  LEGITIMATE_INTERESTS: 'legitimate_interests',
} as const;

/**
 * Data processing purposes
 */
export const PROCESSING_PURPOSES = {
  SERVICE_PROVISION: {
    purpose: 'Providing the video generation service',
    legalBasis: LEGAL_BASIS.CONTRACT,
    dataTypes: ['profile', 'creations', 'usage'],
  },
  PAYMENT_PROCESSING: {
    purpose: 'Processing payments and billing',
    legalBasis: LEGAL_BASIS.CONTRACT,
    dataTypes: ['profile', 'payment_info'],
  },
  ANALYTICS: {
    purpose: 'Improving service quality and user experience',
    legalBasis: LEGAL_BASIS.CONSENT,
    dataTypes: ['usage', 'analytics'],
  },
  MARKETING: {
    purpose: 'Sending promotional communications',
    legalBasis: LEGAL_BASIS.CONSENT,
    dataTypes: ['profile', 'preferences'],
  },
  LEGAL_COMPLIANCE: {
    purpose: 'Complying with legal obligations',
    legalBasis: LEGAL_BASIS.LEGAL_OBLIGATION,
    dataTypes: ['profile', 'transactions'],
  },
} as const;

/**
 * Utility functions for compliance
 */
export function isEUUser(request?: Request): boolean {
  // Simple IP-based detection (in production, use a proper geolocation service)
  if (!request) return false;
  
  const country = request.headers.get('cf-ipcountry') || 
                 request.headers.get('x-country-code');
  
  const euCountries = [
    'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR',
    'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL',
    'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE'
  ];
  
  return country ? euCountries.includes(country) : false;
}

export function isCaliforniaUser(request?: Request): boolean {
  // Simple detection for CCPA compliance
  if (!request) return false;
  
  const region = request.headers.get('cf-region') || 
                request.headers.get('x-region');
  
  return region === 'CA' || region === 'California';
}

export function requiresGDPRCompliance(request?: Request): boolean {
  return isEUUser(request);
}

export function requiresCCPACompliance(request?: Request): boolean {
  return isCaliforniaUser(request);
}