'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function DevLoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleDevLogin = async () => {
    setLoading(true);
    
    // Create a dev session
    const response = await fetch('/api/dev-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'dev@test.com',
        name: 'Dev User'
      })
    });

    if (response.ok) {
      router.push('/campaigns');
    } else {
      alert('Login failed');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Development Login</h1>
        <p className="text-gray-600 mb-6">
          Quick login for testing (development only)
        </p>
        
        <button
          onClick={handleDevLogin}
          disabled={loading}
          className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300"
        >
          {loading ? 'Logging in...' : 'Login as Dev User'}
        </button>

        <div className="mt-4 text-center">
          <a href="/login" className="text-sm text-blue-600 hover:text-blue-700">
            Use OAuth Login Instead
          </a>
        </div>
      </div>
    </div>
  );
}
