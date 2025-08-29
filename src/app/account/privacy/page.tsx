'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { CookieConsent as CookieConsentManager } from '@/lib/compliance';

export default function PrivacySettingsPage() {
  const { user } = useAuth();
  const [exportLoading, setExportLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');
  const [keepAnonymizedData, setKeepAnonymizedData] = useState(true);

  const currentConsent = CookieConsentManager.getConsent();

  const handleExportData = async () => {
    setExportLoading(true);
    try {
      const response = await fetch('/api/privacy/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        
        // Create and download JSON file
        const blob = new Blob([JSON.stringify(data.data, null, 2)], {
          type: 'application/json',
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `draworld-data-export-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        alert('Your data has been exported and downloaded successfully.');
      } else {
        throw new Error('Export failed');
      }
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export data. Please try again.');
    } finally {
      setExportLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleteLoading(true);
    try {
      const response = await fetch('/api/privacy/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reason: deleteReason,
          keepAnonymizedData,
        }),
      });

      if (response.ok) {
        alert('Your account deletion request has been processed. You will be logged out shortly.');
        // Redirect to homepage after a delay
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
      } else {
        throw new Error('Deletion failed');
      }
    } catch (error) {
      console.error('Deletion error:', error);
      alert('Failed to delete account. Please try again.');
    } finally {
      setDeleteLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleRevokeCookieConsent = () => {
    CookieConsentManager.revokeConsent();
    alert('Cookie consent has been revoked. The page will reload to apply changes.');
    window.location.reload();
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <Header />
        <div className="container mx-auto px-4 py-20">
          <div className="text-center text-white">
            <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
            <p>Please log in to access privacy settings.</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-8">Privacy Settings</h1>
          
          <div className="space-y-6">
            {/* Cookie Preferences */}
            <div className="bg-white rounded-2xl p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Cookie Preferences</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">Current Cookie Settings</h3>
                    <p className="text-sm text-gray-600">
                      {currentConsent ? (
                        <>
                          Analytics: {currentConsent.analytics ? 'Enabled' : 'Disabled'} | 
                          Marketing: {currentConsent.marketing ? 'Enabled' : 'Disabled'}
                        </>
                      ) : (
                        'No consent given yet'
                      )}
                    </p>
                  </div>
                  <Button
                    variant="secondary"
                    onClick={handleRevokeCookieConsent}
                  >
                    Update Preferences
                  </Button>
                </div>
              </div>
            </div>

            {/* Data Export */}
            <div className="bg-white rounded-2xl p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Data Export</h2>
              <p className="text-gray-600 mb-4">
                Download a copy of all your personal data stored in our system, including your profile, 
                creations, transaction history, and payment records.
              </p>
              <Button
                onClick={handleExportData}
                disabled={exportLoading}
                className="w-full sm:w-auto"
              >
                {exportLoading ? 'Exporting...' : 'Export My Data'}
              </Button>
            </div>

            {/* Account Deletion */}
            <div className="bg-white rounded-2xl p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Delete Account</h2>
              <p className="text-gray-600 mb-4">
                Permanently delete your account and all associated data. This action cannot be undone.
              </p>
              
              {!showDeleteConfirm ? (
                <Button
                  variant="destructive"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full sm:w-auto"
                >
                  Delete My Account
                </Button>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Reason for deletion (optional)
                    </label>
                    <textarea
                      value={deleteReason}
                      onChange={(e) => setDeleteReason(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      rows={3}
                      placeholder="Help us improve by sharing why you're leaving..."
                    />
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="keepAnonymized"
                      checked={keepAnonymizedData}
                      onChange={(e) => setKeepAnonymizedData(e.target.checked)}
                      className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
                    />
                    <label htmlFor="keepAnonymized" className="ml-2 text-sm text-gray-700">
                      Keep anonymized payment data for legal compliance (recommended)
                    </label>
                  </div>
                  
                  <div className="flex gap-3">
                    <Button
                      variant="secondary"
                      onClick={() => setShowDeleteConfirm(false)}
                      disabled={deleteLoading}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleDeleteAccount}
                      disabled={deleteLoading}
                    >
                      {deleteLoading ? 'Deleting...' : 'Confirm Deletion'}
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Privacy Rights */}
            <div className="bg-white rounded-2xl p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Privacy Rights</h2>
              <div className="space-y-3 text-sm text-gray-600">
                <p><strong>Right to Access:</strong> You can request access to your personal data at any time.</p>
                <p><strong>Right to Rectification:</strong> You can update your personal information in your profile settings.</p>
                <p><strong>Right to Erasure:</strong> You can request deletion of your personal data using the option above.</p>
                <p><strong>Right to Data Portability:</strong> You can export your data in a machine-readable format.</p>
                <p><strong>Right to Object:</strong> You can object to certain types of data processing by updating your cookie preferences.</p>
              </div>
              <p className="text-sm text-gray-500 mt-4">
                For additional privacy requests or questions, please contact us at privacy@draworld.com
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}