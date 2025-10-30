'use client';

import { useEffect, useState } from 'react';

export default function OAuthSetupPage() {
  const [currentUrl, setCurrentUrl] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setCurrentUrl(window.location.origin);
  }, []);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const googleCallbackUrl = `${currentUrl}/api/auth/callback/google`;
  const microsoftCallbackUrl = `${currentUrl}/api/auth/callback/azure-ad`;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            OAuth Configuration Setup
          </h1>

          <div className="space-y-8">
            {/* Current URL */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Step 1: Your Current Workspace URL
              </h2>
              <div className="bg-white rounded p-4 font-mono text-sm break-all">
                {currentUrl || 'Loading...'}
              </div>
              <button
                onClick={() => copyToClipboard(currentUrl)}
                className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {copied ? '✓ Copied!' : 'Copy URL'}
              </button>
            </div>

            {/* Update .env */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Step 2: Update Your .env File
              </h2>
              <p className="text-gray-700 mb-4">
                Open your <code className="bg-gray-200 px-2 py-1 rounded">.env</code> file and update this line:
              </p>
              <div className="bg-white rounded p-4 font-mono text-sm">
                NEXTAUTH_URL={currentUrl}
              </div>
              <button
                onClick={() => copyToClipboard(`NEXTAUTH_URL=${currentUrl}`)}
                className="mt-3 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
              >
                Copy .env Line
              </button>
            </div>

            {/* Google OAuth */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Step 3: Configure Google OAuth
              </h2>
              <ol className="list-decimal list-inside space-y-3 text-gray-700 mb-4">
                <li>Go to <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Google Cloud Console</a></li>
                <li>Select your project (or create one)</li>
                <li>Click on your OAuth 2.0 Client ID</li>
                <li>Under "Authorized redirect URIs", add this URL:</li>
              </ol>
              <div className="bg-white rounded p-4 font-mono text-sm break-all mb-3">
                {googleCallbackUrl}
              </div>
              <button
                onClick={() => copyToClipboard(googleCallbackUrl)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Copy Google Callback URL
              </button>
            </div>

            {/* Microsoft OAuth */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Step 4: Configure Microsoft OAuth
              </h2>
              <ol className="list-decimal list-inside space-y-3 text-gray-700 mb-4">
                <li>Go to <a href="https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationsListBlade" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Azure Portal - App Registrations</a></li>
                <li>Select your app registration</li>
                <li>Go to "Authentication" in the left menu</li>
                <li>Under "Redirect URIs", add this URL:</li>
              </ol>
              <div className="bg-white rounded p-4 font-mono text-sm break-all mb-3">
                {microsoftCallbackUrl}
              </div>
              <button
                onClick={() => copyToClipboard(microsoftCallbackUrl)}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Copy Microsoft Callback URL
              </button>
            </div>

            {/* Final Step */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Step 5: Restart Your Dev Server
              </h2>
              <p className="text-gray-700 mb-4">
                After updating the .env file and OAuth providers:
              </p>
              <ol className="list-decimal list-inside space-y-2 text-gray-700">
                <li>Stop your dev server (Ctrl+C in terminal)</li>
                <li>Run: <code className="bg-gray-200 px-2 py-1 rounded">npm run dev</code></li>
                <li>Try logging in again!</li>
              </ol>
            </div>

            {/* Current Config */}
            <div className="bg-gray-100 border border-gray-300 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Current Configuration
              </h2>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-semibold">Google Client ID:</span>{' '}
                  <code className="bg-white px-2 py-1 rounded">
                    {process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || 'Set in .env'}
                  </code>
                </div>
                <div>
                  <span className="font-semibold">Microsoft Client ID:</span>{' '}
                  <code className="bg-white px-2 py-1 rounded">
                    {process.env.NEXT_PUBLIC_MICROSOFT_CLIENT_ID || 'Set in .env'}
                  </code>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-gray-200">
            <a
              href="/login"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              ← Back to Login
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
