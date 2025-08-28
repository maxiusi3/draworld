'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { PRIVACY_POLICY, getCurrentVersion, getEffectiveDate, getTableOfContents, searchDocument } from '@/lib/legalDocuments';

export default function PrivacyPolicyPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  
  const currentVersion = getCurrentVersion(PRIVACY_POLICY);
  const effectiveDate = new Date(getEffectiveDate(PRIVACY_POLICY));
  const tableOfContents = getTableOfContents(PRIVACY_POLICY);
  const searchResults = searchTerm ? searchDocument(PRIVACY_POLICY, searchTerm) : [];

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />

      <main className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
              Privacy Policy
            </h1>
            <div className="flex items-center justify-center space-x-4 text-gray-400">
              <p>Version {currentVersion}</p>
              <span>•</span>
              <p>Last updated: {effectiveDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
          </div>

          {/* Search and Navigation */}
          <div className="mb-8 space-y-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setShowSearch(!showSearch)}
                className="flex items-center space-x-2 text-pink-400 hover:text-pink-300 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span>Search Policy</span>
              </button>
              
              <div className="text-sm text-gray-400">
                {tableOfContents.length} sections
              </div>
            </div>

            {showSearch && (
              <div className="bg-zinc-900 rounded-lg p-4 border border-zinc-800">
                <input
                  type="text"
                  placeholder="Search privacy policy..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
                
                {searchTerm && searchResults.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <p className="text-sm text-gray-400">
                      Found {searchResults.length} matching sections:
                    </p>
                    {searchResults
                      .map((result, index) => (
                        <button
                          key={index}
                          onClick={() => {
                            scrollToSection(result.id);
                            setShowSearch(false);
                          }}
                          className="block w-full text-left p-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
                        >
                          <div className="font-medium text-pink-400">{result.title}</div>
                          <div className="text-sm text-gray-300 mt-1 line-clamp-2">
                            {result.content.substring(0, 150)}...
                          </div>
                        </button>
                      ))}
                  </div>
                )}
              </div>
            )}

            {/* Table of Contents */}
            <div className="bg-zinc-900 rounded-lg p-6 border border-zinc-800">
              <h3 className="text-lg font-semibold text-white mb-4">Table of Contents</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {tableOfContents.map((item, index) => (
                  <button
                    key={index}
                    onClick={() => scrollToSection(item.id)}
                    className="text-left text-pink-400 hover:text-pink-300 transition-colors py-1"
                  >
                    {item.title}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-zinc-900 rounded-2xl p-8 border border-zinc-800">
            <div className="prose prose-invert max-w-none">
              <section className="mb-8" id="introduction">
                <h2 className="text-2xl font-semibold mb-4 text-pink-400">
                  1. Introduction
                </h2>
                <p className="text-gray-300 mb-4">
                  Draworld ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our AI-powered video generation service.
                </p>
                <p className="text-gray-300 mb-4">
                  By using our Service, you consent to the data practices described in this policy. If you do not agree with this policy, please do not use our Service.
                </p>
              </section>

              <section className="mb-8" id="information-we-collect">
                <h2 className="text-2xl font-semibold mb-4 text-pink-400">
                  2. Information We Collect
                </h2>
                <div className="text-gray-300 space-y-4">
                  <h3 className="text-lg font-medium text-white">
                    Personal Information
                  </h3>
                  <p>We collect information you provide directly to us, including:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Account information (email address, display name)</li>
                    <li>Profile information and preferences</li>
                    <li>Payment information (processed securely through Stripe)</li>
                    <li>Communications with our support team</li>
                  </ul>

                  <h3 className="text-lg font-medium text-white">
                    Content Information
                  </h3>
                  <p>When you use our Service, we collect:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Images you upload for video generation</li>
                    <li>Text prompts and generation preferences</li>
                    <li>Generated videos and associated metadata</li>
                    <li>Usage patterns and interaction data</li>
                  </ul>

                  <h3 className="text-lg font-medium text-white">
                    Technical Information
                  </h3>
                  <p>We automatically collect certain technical information:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Device information (browser type, operating system)</li>
                    <li>IP address and location data</li>
                    <li>Usage analytics and performance metrics</li>
                    <li>Cookies and similar tracking technologies</li>
                  </ul>
                </div>
              </section>

              <section className="mb-8" id="how-we-use-your-information">
                <h2 className="text-2xl font-semibold mb-4 text-pink-400">
                  3. How We Use Your Information
                </h2>
                <div className="text-gray-300 space-y-4">
                  <p>We use the information we collect to:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Provide, maintain, and improve our Service</li>
                    <li>Process your video generation requests</li>
                    <li>Manage your account and process payments</li>
                    <li>Send you technical notices and support messages</li>
                    <li>Analyze usage patterns to enhance user experience</li>
                    <li>Detect and prevent fraud or abuse</li>
                    <li>Comply with legal obligations</li>
                  </ul>
                  
                  <h3 className="text-lg font-medium text-white">
                    Legal Basis for Processing (GDPR)
                  </h3>
                  <p>We process your personal data based on:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li><strong>Contract:</strong> To provide our services and fulfill our agreement with you</li>
                    <li><strong>Consent:</strong> For marketing communications and analytics (where required)</li>
                    <li><strong>Legitimate Interests:</strong> To improve our services and prevent fraud</li>
                    <li><strong>Legal Obligation:</strong> To comply with applicable laws and regulations</li>
                  </ul>
                </div>
              </section>

              <section className="mb-8" id="information-sharing-and-disclosure">
                <h2 className="text-2xl font-semibold mb-4 text-pink-400">
                  4. Information Sharing and Disclosure
                </h2>
                <div className="text-gray-300 space-y-4">
                  <p>We do not sell, trade, or rent your personal information. We may share your information in the following circumstances:</p>
                  
                  <h3 className="text-lg font-medium text-white">
                    Service Providers
                  </h3>
                  <p>We work with trusted third-party service providers:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li><strong>Runware AI:</strong> For video generation processing</li>
                    <li><strong>Stripe:</strong> For secure payment processing</li>
                    <li><strong>Firebase/Google Cloud:</strong> For hosting and database services</li>
                    <li><strong>Vercel:</strong> For application hosting and delivery</li>
                  </ul>

                  <h3 className="text-lg font-medium text-white">
                    Legal Requirements
                  </h3>
                  <p>We may disclose your information if required by law or to:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Comply with legal processes or government requests</li>
                    <li>Protect our rights, property, or safety</li>
                    <li>Investigate potential violations of our{' '}
                      <Link href="/terms-of-service" className="text-pink-400 hover:text-pink-300 underline">
                        Terms of Service
                      </Link>
                    </li>
                    <li>Prevent fraud or other illegal activities</li>
                  </ul>
                </div>
              </section>

              <section className="mb-8" id="data-security">
                <h2 className="text-2xl font-semibold mb-4 text-pink-400">
                  5. Data Security
                </h2>
                <div className="text-gray-300 space-y-4">
                  <p>We implement appropriate technical and organizational measures to protect your information:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Encryption in transit and at rest</li>
                    <li>Regular security assessments and updates</li>
                    <li>Access controls and authentication requirements</li>
                    <li>Secure data centers and infrastructure</li>
                    <li>Employee training on data protection</li>
                  </ul>
                  <p>However, no method of transmission over the internet is 100% secure. We cannot guarantee absolute security of your information.</p>
                </div>
              </section>

              <section className="mb-8" id="data-retention">
                <h2 className="text-2xl font-semibold mb-4 text-pink-400">
                  6. Data Retention
                </h2>
                <div className="text-gray-300 space-y-4">
                  <p>We retain your information for as long as necessary to provide our services and comply with legal obligations:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li><strong>Account Data:</strong> Until you delete your account</li>
                    <li><strong>Video Creations:</strong> 2 years after last access</li>
                    <li><strong>Payment Records:</strong> 7 years for legal compliance</li>
                    <li><strong>Analytics Data:</strong> 2 years for service improvement</li>
                    <li><strong>Support Communications:</strong> 3 years for quality assurance</li>
                  </ul>
                </div>
              </section>

              <section className="mb-8" id="your-privacy-rights">
                <h2 className="text-2xl font-semibold mb-4 text-pink-400">
                  7. Your Privacy Rights
                </h2>
                <div className="text-gray-300 space-y-4">
                  <p>Depending on your location, you may have the following rights:</p>
                  
                  <h3 className="text-lg font-medium text-white">
                    GDPR Rights (EU Users)
                  </h3>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li><strong>Access:</strong> Request a copy of your personal data</li>
                    <li><strong>Rectification:</strong> Correct inaccurate or incomplete data</li>
                    <li><strong>Erasure:</strong> Request deletion of your personal data</li>
                    <li><strong>Portability:</strong> Receive your data in a structured format</li>
                    <li><strong>Restriction:</strong> Limit how we process your data</li>
                    <li><strong>Objection:</strong> Object to certain types of processing</li>
                    <li><strong>Withdraw Consent:</strong> Revoke consent for data processing</li>
                  </ul>

                  <h3 className="text-lg font-medium text-white">
                    CCPA Rights (California Users)
                  </h3>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Know what personal information we collect and how it's used</li>
                    <li>Request deletion of your personal information</li>
                    <li>Opt-out of the sale of personal information (we don't sell data)</li>
                    <li>Non-discrimination for exercising your privacy rights</li>
                  </ul>

                  <p>To exercise these rights, please contact us at privacy@draworld.com or use the privacy controls in your{' '}
                    <Link href="/account/privacy" className="text-pink-400 hover:text-pink-300 underline">
                      account settings
                    </Link>.
                  </p>
                </div>
              </section>

              <section className="mb-8" id="cookies-and-tracking-technologies">
                <h2 className="text-2xl font-semibold mb-4 text-pink-400">
                  8. Cookies and Tracking Technologies
                </h2>
                <div className="text-gray-300 space-y-4">
                  <p>We use cookies and similar technologies to:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Remember your preferences and settings</li>
                    <li>Analyze site usage and performance</li>
                    <li>Provide personalized content and features</li>
                    <li>Prevent fraud and enhance security</li>
                  </ul>
                  
                  <p>You can control cookie preferences through our cookie consent banner or your browser settings. Note that disabling certain cookies may affect service functionality.</p>
                </div>
              </section>

              <section className="mb-8" id="childrens-privacy">
                <h2 className="text-2xl font-semibold mb-4 text-pink-400">
                  9. Children's Privacy
                </h2>
                <p className="text-gray-300 mb-4">
                  Our Service is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If you are a parent or guardian and believe your child has provided us with personal information, please contact us immediately.
                </p>
              </section>

              <section className="mb-8" id="international-data-transfers">
                <h2 className="text-2xl font-semibold mb-4 text-pink-400">
                  10. International Data Transfers
                </h2>
                <p className="text-gray-300 mb-4">
                  Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place for international transfers, including standard contractual clauses and adequacy decisions where applicable.
                </p>
              </section>

              <section className="mb-8" id="changes-to-this-privacy-policy">
                <h2 className="text-2xl font-semibold mb-4 text-pink-400">
                  11. Changes to This Privacy Policy
                </h2>
                <p className="text-gray-300 mb-4">
                  We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new policy on this page and updating the "Last updated" date. We encourage you to review this policy periodically.
                </p>
              </section>

              <section className="mb-8" id="contact-us">
                <h2 className="text-2xl font-semibold mb-4 text-pink-400">
                  12. Contact Us
                </h2>
                <p className="text-gray-300 mb-4">
                  If you have any questions about this Privacy Policy or our data practices, please contact us:
                </p>
                <div className="bg-zinc-800 rounded-lg p-4">
                  <p className="text-white">Email: privacy@draworld.com</p>
                  <p className="text-white">Data Protection Officer: dpo@draworld.com</p>
                  <p className="text-white">Address: 123 Creative Street, Art City, AC 12345</p>
                </div>
              </section>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}