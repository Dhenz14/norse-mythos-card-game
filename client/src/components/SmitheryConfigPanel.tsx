import React, { useState } from 'react';
import useSmithery from '../hooks/useSmithery';

/**
 * Configuration panel for Smithery settings
 * Allows toggling between mock modes and advanced options
 */
export default function SmitheryConfigPanel() {
  const { 
    status, 
    mockFallbackEnabled, 
    advancedMockEnabled,
    setMockFallback,
    setAdvancedMock,
    refreshStatus 
  } = useSmithery();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const handleToggleMockFallback = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      await setMockFallback(!mockFallbackEnabled);
      await refreshStatus();
      setSuccess(`Mock fallback ${!mockFallbackEnabled ? 'enabled' : 'disabled'} successfully`);
    } catch (err: any) {
      setError(err.message || 'Failed to toggle mock fallback');
    } finally {
      setLoading(false);
    }
  };
  
  const handleToggleAdvancedMock = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      await setAdvancedMock(!advancedMockEnabled);
      await refreshStatus();
      setSuccess(`Advanced Norse mock ${!advancedMockEnabled ? 'enabled' : 'disabled'} successfully`);
    } catch (err: any) {
      setError(err.message || 'Failed to toggle advanced mock');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg mt-8 mb-8">
      <div className="px-4 py-5 sm:px-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900">Smithery Configuration</h3>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">
          Configure how Sequential Thinking operates in your game
        </p>
      </div>
      
      <div className="border-t border-gray-200">
        <dl>
          <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">Connection Status</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
              <span className={`inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium ${status?.status === 'connected' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {status?.status === 'connected' ? 'Connected' : 'Disconnected'}
              </span>
            </dd>
          </div>
          
          <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">Mock Fallback</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
              <div className="flex items-center gap-4">
                <span className={`inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium ${mockFallbackEnabled ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                  {mockFallbackEnabled ? 'Enabled' : 'Disabled'}
                </span>
                <button
                  onClick={handleToggleMockFallback}
                  disabled={loading}
                  className={`px-4 py-2 text-sm rounded-md transition ${loading ? 'bg-gray-300 text-gray-500' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                >
                  {loading ? 'Updating...' : mockFallbackEnabled ? 'Disable' : 'Enable'}
                </button>
              </div>
              <p className="mt-2 text-sm text-gray-500">
                When enabled, the system will use a mock implementation when the real Smithery service is unavailable.
              </p>
            </dd>
          </div>
          
          <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">Advanced Norse Mock</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
              <div className="flex items-center gap-4">
                <span className={`inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium ${advancedMockEnabled ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'}`}>
                  {advancedMockEnabled ? 'Enabled' : 'Disabled'}
                </span>
                <button
                  onClick={handleToggleAdvancedMock}
                  disabled={loading}
                  className={`px-4 py-2 text-sm rounded-md transition ${loading ? 'bg-gray-300 text-gray-500' : 'bg-purple-600 text-white hover:bg-purple-700'}`}
                >
                  {loading ? 'Updating...' : advancedMockEnabled ? 'Disable' : 'Enable'}
                </button>
              </div>
              <p className="mt-2 text-sm text-gray-500">
                The enhanced Norse-themed sequential thinking implementation provides deeper analysis of card strategies and mythological synergies.
              </p>
            </dd>
          </div>
        </dl>
      </div>
      
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}
      
      {success && (
        <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-700">{success}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}