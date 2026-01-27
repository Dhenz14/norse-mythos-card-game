import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import useSmithery from '../hooks/useSmithery';
import { routes } from '../lib/routes';
import SmitheryConfigPanel from './SmitheryConfigPanel';

export default function SmitheryIntegration() {
  const { status, tools, refreshStatus, loading, error, isConnected } = useSmithery();
  const [prompt, setPrompt] = useState<string>('');
  const [thinking, setThinking] = useState<boolean>(false);
  const [result, setResult] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || thinking || !isConnected) return;
    
    setThinking(true);
    try {
      const response = await fetch('/api/smithery/sequential-thinking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          maxSteps: 5,
          temperature: 0.7,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to process with sequential thinking');
      }
      
      const data = await response.json();
      setResult(data);
    } catch (err) {
      console.error('Error:', err);
      setResult({ error: 'Failed to process your request' });
    } finally {
      setThinking(false);
    }
  };

  // Function to format steps for display
  const formatSteps = (steps: any[]) => {
    if (!steps || !Array.isArray(steps)) return null;
    
    return (
      <div className="space-y-6">
        {steps.map((step, index) => (
          <div key={index} className="bg-gray-50 rounded-lg p-4 border">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Step {index + 1}</h3>
            <div className="mb-2">
              <span className="font-medium text-gray-700">Thought:</span>
              <p className="text-gray-800">{step.thought}</p>
            </div>
            <div>
              <span className="font-medium text-gray-700">Reasoning:</span>
              <p className="text-gray-800">{step.reasoning}</p>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Smithery Sequential Thinking</h1>
          <Link to={routes.smitheryChat} className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded transition">
            Try the Chat Interface
          </Link>
        </div>

        <div className="mb-8">
          <div className={`p-4 rounded-lg ${isConnected ? 'bg-green-100' : 'bg-red-100'}`}>
            <p className="font-medium">
              Status: {isConnected ? 'Connected' : 'Disconnected'}
            </p>
            {error && <p className="text-red-600 mt-2">{error}</p>}
            <button
              onClick={refreshStatus}
              disabled={loading}
              className="mt-2 bg-blue-500 hover:bg-blue-600 text-white py-1 px-3 rounded text-sm disabled:opacity-50"
            >
              {loading ? 'Refreshing...' : 'Refresh Status'}
            </button>
          </div>
        </div>
        
        {/* Advanced Configuration Panel */}
        <SmitheryConfigPanel />

        {isConnected && (
          <>
            <div className="mb-8">
              <h2 className="text-xl font-bold mb-4">Available Tools</h2>
              {tools && tools.length > 0 ? (
                <ul className="space-y-2 list-disc pl-5">
                  {tools.map((tool, index) => (
                    <li key={index}>
                      <span className="font-medium">{tool.name}</span>
                      <p className="text-gray-600">{tool.description}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-600">No specific tools are currently available.</p>
              )}
            </div>

            <div className="mb-8">
              <h2 className="text-xl font-bold mb-4">Try Sequential Thinking</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 mb-1">
                    Enter a prompt that requires step-by-step reasoning:
                  </label>
                  <textarea
                    id="prompt"
                    rows={4}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    disabled={thinking}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="E.g., How would you evaluate the potential outcomes of a specific card strategy in our Norse mythology card game?"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!prompt.trim() || thinking}
                  className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${
                    !prompt.trim() || thinking
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-indigo-600 hover:bg-indigo-700'
                  }`}
                >
                  {thinking ? 'Processing...' : 'Think Step by Step'}
                </button>
              </form>
            </div>

            {result && (
              <div className="border rounded-lg p-6 bg-white shadow-sm">
                <h2 className="text-xl font-bold mb-4">Results</h2>
                
                {result.error ? (
                  <div className="p-4 bg-red-50 text-red-700 rounded">
                    {result.error}
                  </div>
                ) : (
                  <>
                    {formatSteps(result.steps)}
                    
                    {result.conclusion && (
                      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                        <h3 className="text-lg font-medium text-blue-900 mb-2">Conclusion</h3>
                        <p className="text-blue-800">{result.conclusion}</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </>
        )}

        <div className="mt-12 p-4 bg-gray-50 rounded-lg border">
          <h2 className="text-xl font-bold mb-2">About Smithery Sequential Thinking</h2>
          <p className="text-gray-700 mb-4">
            Smithery Sequential Thinking is an advanced reasoning system that breaks down complex problems into clear steps. 
            This allows for more transparent, logical analysis of game strategies and card interactions.
          </p>
          <p className="text-gray-700">
            Use this tool to explore strategic options, analyze card combinations, and understand the deeper mechanics of
            the Norse mythology-themed card game.
          </p>
        </div>
      </div>
    </div>
  );
}