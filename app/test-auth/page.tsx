'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';

export default function TestAuthPage() {
  const { data: session, status } = useSession();
  const [apiTest, setApiTest] = useState<any>(null);

  useEffect(() => {
    // Test API call
    fetch('/api/contacts')
      .then(res => res.json())
      .then(data => setApiTest(data))
      .catch(err => setApiTest({ error: err.message }));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Authentication Test</h1>

        {/* Session Status */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Session Status</h2>
          <div className="space-y-2">
            <div>
              <span className="font-medium">Status:</span>{' '}
              <span className={`px-2 py-1 rounded ${
                status === 'authenticated' ? 'bg-green-100 text-green-800' :
                status === 'loading' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {status}
              </span>
            </div>
            {session?.user && (
              <>
                <div><span className="font-medium">Email:</span> {session.user.email}</div>
                <div><span className="font-medium">Name:</span> {session.user.name}</div>
                <div><span className="font-medium">User ID:</span> {session.user.id}</div>
              </>
            )}
          </div>
        </div>

        {/* API Test */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">API Test (/api/contacts)</h2>
          {apiTest ? (
            <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
              {JSON.stringify(apiTest, null, 2)}
            </pre>
          ) : (
            <div>Loading...</div>
          )}
        </div>

        {/* Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="space-x-4">
            <a href="/dashboard" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Go to Dashboard
            </a>
            <a href="/campaigns" className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
              Go to Campaigns
            </a>
            <a href="/contacts" className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
              Go to Contacts
            </a>
          </div>
        </div>

        {/* Debug Info */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Full Session Data</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
            {JSON.stringify(session, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}
