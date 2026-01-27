import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useParams, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import Spinner from './ui/Spinner';
import { routes } from '../lib/routes';

interface RootCauseAnalysisResult {
  analysis: string;
  patterns: string[];
  relatedFiles: string[];
  analysisId: string;
}

export const RootCauseAnalysisPanel: React.FC = () => {
  const [issue, setIssue] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<RootCauseAnalysisResult | null>(null);
  const [recentAnalyses, setRecentAnalyses] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  
  // Load existing analysis if ID is provided
  useEffect(() => {
    if (id) {
      fetchAnalysis(id);
    } else {
      fetchRecentAnalyses();
    }
  }, [id]);
  
  const fetchAnalysis = async (analysisId: string) => {
    try {
      setIsAnalyzing(true);
      const response = await axios.get(`/api/rootcause/${analysisId}`);
      setResult({
        analysis: response.data.result,
        patterns: JSON.parse(response.data.patterns || '[]'),
        relatedFiles: [],
        analysisId: response.data.id
      });
      setIsAnalyzing(false);
    } catch (err: any) {
      setError(`Error loading analysis: ${err.message}`);
      setIsAnalyzing(false);
    }
  };
  
  const fetchRecentAnalyses = async () => {
    try {
      const response = await axios.get('/api/rootcause/recent');
      setRecentAnalyses(response.data);
    } catch (err: any) {
      console.error('Error fetching recent analyses:', err);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!issue.trim()) {
      setError('Please provide an issue description');
      return;
    }
    
    try {
      setIsAnalyzing(true);
      setError(null);
      
      const response = await axios.post('/api/rootcause/process', { issue });
      setResult(response.data);
      
      // Update URL to include analysis ID
      navigate(`/root-cause-analyzer/${response.data.analysisId}`);
      
      // Refresh recent analyses
      fetchRecentAnalyses();
      
    } catch (err: any) {
      setError(`Error performing analysis: ${err.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <header className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-4 shadow-md">
        <div className="container mx-auto">
          <h1 className="text-2xl font-bold">Root Cause Analyzer</h1>
          <p className="text-sm opacity-80">
            Find the root cause of issues with advanced pattern recognition
          </p>
        </div>
      </header>
      
      <main className="container mx-auto p-4 flex-grow">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left sidebar - Recent analyses */}
          <div className="lg:col-span-1">
            <div className="bg-white p-4 rounded-lg shadow-md">
              <h2 className="text-lg font-medium mb-4 text-gray-800">Recent Analyses</h2>
              
              {recentAnalyses.length > 0 ? (
                <ul className="space-y-2">
                  {recentAnalyses.map((analysis) => (
                    <li key={analysis.id}>
                      <button
                        onClick={() => navigate(`/root-cause-analyzer/${analysis.id}`)}
                        className={`w-full text-left p-2 rounded hover:bg-gray-100 transition-colors
                          ${analysis.id === id ? 'bg-blue-50 border-l-4 border-blue-500' : ''}
                        `}
                      >
                        <div className="font-medium text-sm truncate">
                          {analysis.issue.split('\n')[0]}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(analysis.timestamp).toLocaleString()}
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 text-sm">No recent analyses</p>
              )}
            </div>
          </div>
          
          {/* Main content area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Issue input form */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4">Analyze New Issue</h2>
              
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label 
                    htmlFor="issue" 
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Describe the issue in detail
                  </label>
                  <textarea
                    id="issue"
                    value={issue}
                    onChange={(e) => setIssue(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 h-32"
                    placeholder="Describe the issue you're experiencing... For example: 'Phantom borders appear around cards when hovering over them.'"
                    disabled={isAnalyzing}
                  />
                </div>
                
                {error && (
                  <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
                    {error}
                  </div>
                )}
                
                <button
                  type="submit"
                  disabled={isAnalyzing}
                  className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white
                    ${isAnalyzing 
                      ? 'bg-indigo-400 cursor-not-allowed' 
                      : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                    }`}
                >
                  {isAnalyzing ? 'Analyzing...' : 'Analyze Issue'}
                </button>
              </form>
            </div>
            
            {/* Analysis results */}
            {(isAnalyzing || result) && (
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-4">Analysis Results</h2>
                
                {isAnalyzing ? (
                  <div className="flex flex-col items-center py-12">
                    <Spinner 
                      size="lg" 
                      color="primary" 
                      message="Analyzing issue, please wait..." 
                    />
                    <p className="mt-4 text-gray-500 text-sm max-w-md text-center">
                      Deep analysis is in progress. This might take a minute as we search for 
                      patterns and correlations in the codebase.
                    </p>
                  </div>
                ) : result ? (
                  <div className="prose max-w-none">
                    <ReactMarkdown>
                      {result.analysis}
                    </ReactMarkdown>
                    
                    {result.relatedFiles.length > 0 && (
                      <div className="mt-6">
                        <h3>Related Files</h3>
                        <ul className="text-sm">
                          {result.relatedFiles.slice(0, 10).map((file, index) => (
                            <li key={index} className="text-gray-700">
                              {file}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </main>
      
      <footer className="bg-gray-800 text-white p-4 text-center text-sm">
        <div className="container mx-auto">
          Root Cause Analyzer – Advanced Analysis Tool
          <div className="text-gray-400 text-xs mt-1">
            Powered by Think Tools and PatternMatcher™
          </div>
          <div className="mt-2">
            <Link to={routes.performanceDashboard} className="text-green-400 hover:text-green-300 transition-colors">
              📊 View Performance Dashboard
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default RootCauseAnalysisPanel;