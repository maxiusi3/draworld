export interface LegalDocument {
  id: string;
  title: string;
  lastUpdated: string;
  version: string;
  content: LegalSection[];
}

export interface LegalSection {
  id: string;
  title: string;
  content: string;
  subsections?: LegalSection[];
}

export const TERMS_OF_SERVICE: LegalDocument = {
  id: 'terms-of-service',
  title: 'Terms of Service',
  lastUpdated: '2024-01-01',
  version: '1.0',
  content: [
    {
      id: 'acceptance',
      title: '1. Acceptance of Terms',
      content: `By accessing and using Draworld ("the Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.`,
    },
    {
      id: 'description',
      title: '2. Service Description',
      content: `Draworld is an AI-powered platform that transforms children's drawings into animated videos. Our service allows users to upload artwork, add descriptive prompts, and generate animated content using artificial intelligence technology.`,
    },
    {
      id: 'user-accounts',
      title: '3. User Accounts',
      content: `To access certain features of the Service, you must register for an account. You agree to provide accurate, current, and complete information during the registration process and to update such information to keep it accurate, current, and complete.`,
      subsections: [
        {
          id: 'account-security',
          title: '3.1 Account Security',
          content: `You are responsible for safeguarding the password and for maintaining the confidentiality of your account. You agree not to disclose your password to any third party and to take sole responsibility for activities that occur under your account.`,
        },
        {
          id: 'account-termination',
          title: '3.2 Account Termination',
          content: `We reserve the right to terminate or suspend your account at any time for violations of these Terms of Service or for any other reason at our sole discretion.`,
        },
      ],
    },
    {
      id: 'credit-system',
      title: '4. Credit System and Payments',
      content: `Draworld operates on a credit-based system. Credits are required to generate videos and can be purchased through our platform or earned through various activities.`,
      subsections: [
        {
          id: 'credit-purchases',
          title: '4.1 Credit Purchases',
          content: `Credits can be purchased using valid payment methods. All purchases are final and non-refundable unless required by applicable law. Prices are subject to change without notice.`,
        },
        {
          id: 'credit-usage',
          title: '4.2 Credit Usage',
          content: `Credits are consumed when generating videos. The number of credits required may vary based on video complexity and length. Credits do not expire but may be forfeited upon account termination.`,
        },
        {
          id: 'refund-policy',
          title: '4.3 Refund Policy',
          content: `Refunds are generally not provided for credit purchases. In exceptional circumstances, refunds may be considered at our sole discretion. Contact support for refund requests.`,
        },
      ],
    },
    {
      id: 'content-policy',
      title: '5. Content Policy',
      content: `Users are responsible for all content they upload to the Service. By uploading content, you represent that you have the right to use such content and that it does not violate any third-party rights.`,
      subsections: [
        {
          id: 'prohibited-content',
          title: '5.1 Prohibited Content',
          content: `You may not upload content that is illegal, harmful, threatening, abusive, harassing, defamatory, vulgar, obscene, or otherwise objectionable. We reserve the right to remove any content that violates this policy.`,
        },
        {
          id: 'content-moderation',
          title: '5.2 Content Moderation',
          content: `We use automated systems and human review to moderate content. Content may be rejected or removed if it violates our content policy or community guidelines.`,
        },
        {
          id: 'intellectual-property',
          title: '5.3 Intellectual Property',
          content: `You retain ownership of your original artwork. By using our Service, you grant us a license to process your content for the purpose of providing the Service. Generated videos remain your property.`,
        },
      ],
    },
    {
      id: 'privacy',
      title: '6. Privacy',
      content: `Your privacy is important to us. Please review our Privacy Policy, which also governs your use of the Service, to understand our practices regarding the collection and use of your information.`,
    },
    {
      id: 'disclaimers',
      title: '7. Disclaimers',
      content: `The Service is provided "as is" without any warranties, express or implied. We do not guarantee that the Service will be uninterrupted, secure, or error-free.`,
      subsections: [
        {
          id: 'ai-limitations',
          title: '7.1 AI Technology Limitations',
          content: `Our AI technology may not always produce expected results. Generated content quality may vary, and we do not guarantee specific outcomes or satisfaction with generated videos.`,
        },
        {
          id: 'service-availability',
          title: '7.2 Service Availability',
          content: `We strive to maintain high service availability but do not guarantee uninterrupted access. The Service may be temporarily unavailable due to maintenance, updates, or technical issues.`,
        },
      ],
    },
    {
      id: 'limitation-liability',
      title: '8. Limitation of Liability',
      content: `In no event shall Draworld be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses.`,
    },
    {
      id: 'changes-terms',
      title: '9. Changes to Terms',
      content: `We reserve the right to modify these Terms of Service at any time. Changes will be effective immediately upon posting. Your continued use of the Service after changes constitutes acceptance of the new terms.`,
    },
    {
      id: 'contact',
      title: '10. Contact Information',
      content: `If you have any questions about these Terms of Service, please contact us at legal@draworld.com.`,
    },
  ],
};

export const PRIVACY_POLICY: LegalDocument = {
  id: 'privacy-policy',
  title: 'Privacy Policy',
  lastUpdated: '2024-01-01',
  version: '1.0',
  content: [
    {
      id: 'introduction',
      title: '1. Introduction',
      content: `This Privacy Policy describes how Draworld ("we," "our," or "us") collects, uses, and shares your personal information when you use our service. We are committed to protecting your privacy and handling your data responsibly.`,
    },
    {
      id: 'information-collection',
      title: '2. Information We Collect',
      content: `We collect information you provide directly to us, information we obtain automatically when you use our Service, and information from third parties.`,
      subsections: [
        {
          id: 'account-information',
          title: '2.1 Account Information',
          content: `When you create an account, we collect your email address, display name, and authentication information. If you sign up using social media accounts, we may receive additional profile information.`,
        },
        {
          id: 'content-information',
          title: '2.2 Content Information',
          content: `We collect the images you upload, prompts you provide, and videos you generate. This content is necessary to provide our AI video generation service.`,
        },
        {
          id: 'usage-information',
          title: '2.3 Usage Information',
          content: `We automatically collect information about how you use our Service, including your IP address, browser type, device information, and usage patterns.`,
        },
        {
          id: 'payment-information',
          title: '2.4 Payment Information',
          content: `When you make purchases, we collect payment information through secure third-party payment processors. We do not store complete credit card information on our servers.`,
        },
      ],
    },
    {
      id: 'information-use',
      title: '3. How We Use Your Information',
      content: `We use the information we collect to provide, maintain, and improve our Service, process transactions, and communicate with you.`,
      subsections: [
        {
          id: 'service-provision',
          title: '3.1 Service Provision',
          content: `We use your content and account information to generate videos, manage your account, and provide customer support.`,
        },
        {
          id: 'communication',
          title: '3.2 Communication',
          content: `We may use your email address to send you service-related notifications, updates, and promotional materials (which you can opt out of).`,
        },
        {
          id: 'analytics',
          title: '3.3 Analytics and Improvement',
          content: `We use usage information to analyze how our Service is used, identify trends, and improve our features and user experience.`,
        },
      ],
    },
    {
      id: 'information-sharing',
      title: '4. Information Sharing',
      content: `We do not sell your personal information. We may share your information in limited circumstances as described below.`,
      subsections: [
        {
          id: 'service-providers',
          title: '4.1 Service Providers',
          content: `We may share information with third-party service providers who help us operate our Service, such as cloud hosting, payment processing, and analytics providers.`,
        },
        {
          id: 'legal-requirements',
          title: '4.2 Legal Requirements',
          content: `We may disclose information if required by law, regulation, or legal process, or to protect the rights, property, or safety of our users or others.`,
        },
        {
          id: 'business-transfers',
          title: '4.3 Business Transfers',
          content: `In the event of a merger, acquisition, or sale of assets, your information may be transferred as part of the transaction.`,
        },
      ],
    },
    {
      id: 'data-security',
      title: '5. Data Security',
      content: `We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.`,
    },
    {
      id: 'data-retention',
      title: '6. Data Retention',
      content: `We retain your information for as long as necessary to provide our Service and fulfill the purposes outlined in this Privacy Policy, unless a longer retention period is required by law.`,
    },
    {
      id: 'your-rights',
      title: '7. Your Rights',
      content: `Depending on your location, you may have certain rights regarding your personal information, including the right to access, update, or delete your data.`,
      subsections: [
        {
          id: 'access-rights',
          title: '7.1 Access and Portability',
          content: `You can access and download your account information and generated content through your account settings or by contacting us.`,
        },
        {
          id: 'correction-rights',
          title: '7.2 Correction',
          content: `You can update your account information at any time through your account settings.`,
        },
        {
          id: 'deletion-rights',
          title: '7.3 Deletion',
          content: `You can request deletion of your account and associated data. Some information may be retained for legal or legitimate business purposes.`,
        },
      ],
    },
    {
      id: 'international-transfers',
      title: '8. International Data Transfers',
      content: `Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place for such transfers.`,
    },
    {
      id: 'children-privacy',
      title: '9. Children\'s Privacy',
      content: `Our Service is designed for use by parents and guardians to create content featuring children's artwork. We do not knowingly collect personal information directly from children under 13.`,
    },
    {
      id: 'policy-changes',
      title: '10. Changes to This Policy',
      content: `We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new policy on our website and updating the "Last Updated" date.`,
    },
    {
      id: 'contact-privacy',
      title: '11. Contact Us',
      content: `If you have any questions about this Privacy Policy or our privacy practices, please contact us at privacy@draworld.com.`,
    },
  ],
};

export const getLegalDocument = (id: string): LegalDocument | undefined => {
  if (id === 'terms-of-service') {
    return TERMS_OF_SERVICE;
  }
  if (id === 'privacy-policy') {
    return PRIVACY_POLICY;
  }
  return undefined;
};

export const getCurrentVersion = (doc: LegalDocument): string => {
  return doc.version;
};

export const getEffectiveDate = (doc: LegalDocument): string => {
  return doc.lastUpdated;
};

export const getTableOfContents = (doc: LegalDocument): LegalSection[] => {
  return doc.content;
};

export const searchDocument = (
  doc: LegalDocument,
  query: string,
): LegalSection[] => {
  const results: LegalSection[] = [];
  const lowerCaseQuery = query.toLowerCase();

  const searchSections = (sections: LegalSection[]) => {
    for (const section of sections) {
      if (section.title.toLowerCase().includes(lowerCaseQuery) || section.content.toLowerCase().includes(lowerCaseQuery)) {
        results.push(section);
      }
      if (section.subsections) {
        searchSections(section.subsections);
      }
    }
  };

  searchSections(doc.content);
  return results;
};