'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { getCurrentVersion, getEffectiveDate, getTableOfContents, searchDocument } from '@/lib/legalDocuments';

export default function TermsOfServicePage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  
  const currentVersion = getCurrentVersion('terms');
  const effectiveDate = getEffectiveDate('terms');
  const tableOfContents = getTableOfContents('terms');
  const searchResults = searchTerm ? searchDocument('terms', searchTerm) : [];

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
              Terms of Service
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
                <span>Search Terms</span>
              </button>
              
              <div className="text-sm text-gray-400">
                {tableOfContents.length} sections
              </div>
            </div>

            {showSearch && (
              <div className="bg-zinc-900 rounded-lg p-4 border border-zinc-800">
                <input
                  type="text"
                  placeholder="Search terms and conditions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
                
                {searchTerm && searchResults.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <p className="text-sm text-gray-400">
                      Found {searchResults.filter(r => r.match).length} matching sections:
                    </p>
                    {searchResults
                      .filter(result => result.match)
                      .map((result, index) => (
                        <button
                          key={index}
                          onClick={() => {
                            const sectionId = result.section.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
                            scrollToSection(sectionId);
                            setShowSearch(false);
                          }}
                          className="block w-full text-left p-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
                        >
                          <div className="font-medium text-pink-400">{result.section}</div>
                          <div className="text-sm text-gray-300 mt-1 line-clamp-2">
                            {result.content.substring(0, 150)}...
                          </div>
                        </button>
                      ))
                    }
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
              <section className="mb-8" id="acceptance-of-terms">
                <h2 className="text-2xl font-semibold mb-4 text-pink-400">
                  1. Acceptance of Terms
                </h2>
                <p className="text-gray-300 mb-4">
                  By accessing and using Draworld ("the Service"), you accept
                  and agree to be bound by the terms and provision of this
                  agreement. If you do not agree to abide by the above, please
                  do not use this service.
                </p>
              </section>

              <section className="mb-8" id="description-of-service">
                <h2 className="text-2xl font-semibold mb-4 text-pink-400">
                  2. Description of Service
                </h2>
                <p className="text-gray-300 mb-4">
                  Draworld is a web-based platform that uses artificial
                  intelligence to transform static drawings into animated
                  videos. Users can upload images of artwork, provide text
                  prompts, and generate animated content.
                </p>
              </section>

              <section className="mb-8" id="user-accounts-and-registration">
                <h2 className="text-2xl font-semibold mb-4 text-pink-400">
                  3. User Accounts and Registration
                </h2>
                <div className="text-gray-300 space-y-4">
                  <p>
                    To access certain features of the Service, you must register
                    for an account. You agree to:
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>
                      Provide accurate, current, and complete information during
                      registration
                    </li>
                    <li>
                      Maintain and update your account information
                    </li>
                    <li>
                      Keep your password secure and confidential
                    </li>
                    <li>
                      Accept responsibility for all activities under your
                      account
                    </li>
                  </ul>
                </div>
              </section>

              <section className="mb-8" id="content-and-intellectual-property">
                <h2 className="text-2xl font-semibold mb-4 text-pink-400">
                  4. Content and Intellectual Property
                </h2>
                <div className="text-gray-300 space-y-4">
                  <h3 className="text-lg font-medium text-white">
                    Your Content
                  </h3>
                  <p>
                    You retain ownership of the original artwork you upload to
                    our Service. By uploading content, you grant Draworld a
                    non-exclusive license to:
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>
                      Process your images to create animated videos
                    </li>
                    <li>
                      Store your content on our servers
                    </li>
                    <li>
                      Display your creations in your personal gallery
                    </li>
                  </ul>

                  <h3 className="text-lg font-medium text-white">
                    Generated Content
                  </h3>
                  <p>
                    AI-generated videos created through our Service are owned by
                    you. However, you acknowledge that similar outputs may be
                    generated for other users using similar inputs.
                  </p>
                </div>
              </section>

              <section className="mb-8" id="credits-and-payment">
                <h2 className="text-2xl font-semibold mb-4 text-pink-400">
                  5. Credits and Payment
                </h2>
                <div className="text-gray-300 space-y-4">
                  <p>
                    Our Service operates on a credit-based system:
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>
                      Credits are required to generate animated videos (60 credits per video)
                    </li>
                    <li>
                      Credits can be purchased or earned through various
                      activities including daily check-ins and referrals
                    </li>
                    <li>Credits do not expire</li>
                    <li>
                      Credits are non-transferable and non-refundable except as
                      required by law
                    </li>
                    <li>
                      New users receive 150 credits as a welcome bonus
                    </li>
                  </ul>
                </div>
              </section>

              <section className="mb-8" id="prohibited-uses">
                <h2 className="text-2xl font-semibold mb-4 text-pink-400">
                  6. Prohibited Uses
                </h2>
                <div className="text-gray-300 space-y-4">
                  <p>You agree not to use the Service to:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>
                      Upload inappropriate, offensive, or copyrighted content
                    </li>
                    <li>
                      Violate any applicable laws or regulations
                    </li>
                    <li>
                      Attempt to reverse engineer or hack the Service
                    </li>
                    <li>
                      Use the Service for commercial purposes without permission
                    </li>
                    <li>
                      Share your account credentials with others
                    </li>
                    <li>
                      Generate content that violates our community guidelines
                    </li>
                  </ul>
                </div>
              </section>

              <section className="mb-8" id="privacy-and-data-protection">
                <h2 className="text-2xl font-semibold mb-4 text-pink-400">
                  7. Privacy and Data Protection
                </h2>
                <p className="text-gray-300 mb-4">
                  Your privacy is important to us. Please review our{' '}
                  <Link href="/privacy-policy" className="text-pink-400 hover:text-pink-300 underline">
                    Privacy Policy
                  </Link>
                  , which also governs your use of the Service, to
                  understand our practices.
                </p>
              </section>

              <section className="mb-8" id="limitation-of-liability">
                <h2 className="text-2xl font-semibold mb-4 text-pink-400">
                  8. Limitation of Liability
                </h2>
                <p className="text-gray-300 mb-4">
                  Draworld shall not be liable for any indirect, incidental,
                  special, consequential, or punitive damages, including without
                  limitation, loss of profits, data, use, goodwill, or other
                  intangible losses, resulting from your use of the Service.
                </p>
              </section>

              <section className="mb-8" id="termination">
                <h2 className="text-2xl font-semibold mb-4 text-pink-400">
                  9. Termination
                </h2>
                <p className="text-gray-300 mb-4">
                  We may terminate or suspend your account and bar access to the
                  Service immediately, without prior notice or liability, under
                  our sole discretion, for any reason whatsoever, including
                  without limitation if you breach the Terms.
                </p>
              </section>

              <section className="mb-8" id="changes-to-terms">
                <h2 className="text-2xl font-semibold mb-4 text-pink-400">
                  10. Changes to Terms
                </h2>
                <p className="text-gray-300 mb-4">
                  We reserve the right to modify or replace these Terms at any
                  time. If a revision is material, we will provide at least 30
                  days notice prior to any new terms taking effect. What
                  constitutes a material change will be determined at our sole
                  discretion.
                </p>
              </section>

              <section className="mb-8" id="contact-information">
                <h2 className="text-2xl font-semibold mb-4 text-pink-400">
                  11. Contact Information
                </h2>
                <p className="text-gray-300 mb-4">
                  If you have any questions about these Terms of Service, please
                  contact us at:
                </p>
                <div className="bg-zinc-800 rounded-lg p-4">
                  <p className="text-white">
                    Email: legal@draworld.com
                  </p>
                  <p className="text-white">
                    Address: 123 Creative Street, Art City, AC 12345
                  </p>
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