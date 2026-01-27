import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { routes } from '../lib/routes';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent 
} from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Switch } from '../components/ui/switch';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '../components/ui/select';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Alert, AlertDescription } from '../components/ui/alert';

interface SearchConfig {
  isEnabled: boolean;
  preferredEngine: string;
  cacheEnabled: boolean;
  apiKeys: {
    google: string;
    googleCx: string;
    bing: string;
    serper: string;
    brave: string;
  };
}

const SearchConfigPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [config, setConfig] = useState<SearchConfig | null>(null);
  const [testQuery, setTestQuery] = useState('');
  const [testResults, setTestResults] = useState<any>(null);
  const [testLoading, setTestLoading] = useState(false);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.get('/api/search/config');
      setConfig(response.data.config);
    } catch (err: any) {
      setError('Failed to load search configuration. Please try again.');
      console.error('Error fetching search config:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSearch = async (enabled: boolean) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      await axios.post('/api/search/enabled', { enabled });
      
      // Update local state
      if (config) {
        setConfig({
          ...config,
          isEnabled: enabled
        });
      }
      
      setSuccess(`Search is now ${enabled ? 'enabled' : 'disabled'}`);
    } catch (err: any) {
      setError('Failed to update search status. Please try again.');
      console.error('Error toggling search:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEngineChange = async (engine: string) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      await axios.post('/api/search/engine', { engine });
      
      // Update local state
      if (config) {
        setConfig({
          ...config,
          preferredEngine: engine
        });
      }
      
      setSuccess(`Search engine updated to ${engine}`);
    } catch (err: any) {
      setError('Failed to update search engine. Please try again.');
      console.error('Error changing search engine:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApiKeyChange = async (engine: string, key: string) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      await axios.post('/api/search/api-key', { engine, key });
      
      // Update local state
      if (config) {
        setConfig({
          ...config,
          apiKeys: {
            ...config.apiKeys,
            [engine]: key
          }
        });
      }
      
      setSuccess(`API key for ${engine} updated successfully`);
    } catch (err: any) {
      setError('Failed to update API key. Please try again.');
      console.error('Error updating API key:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTestSearch = async () => {
    if (!testQuery.trim()) {
      setError('Please enter a search query');
      return;
    }

    try {
      setTestLoading(true);
      setError(null);
      setSuccess(null);
      setTestResults(null);

      const response = await axios.post('/api/search/test', { query: testQuery });
      setTestResults(response.data);
      
      if (response.data.enhancedWithSearch) {
        setSuccess('Search test completed successfully');
      } else {
        setError(response.data.error || 'Search test failed without specific error');
      }
    } catch (err: any) {
      setError('Failed to run search test. Please try again.');
      console.error('Error testing search:', err);
    } finally {
      setTestLoading(false);
    }
  };

  if (loading && !config) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading search configuration...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Think Tools Search Configuration</h1>
        <Link to={routes.home} className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md flex items-center">
          <span className="mr-1">←</span> Back to Home
        </Link>
      </div>
      
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {success && (
        <Alert className="mb-4 bg-green-50 text-green-800 border-green-200">
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {config && (
        <>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>
                Configure search capabilities for Think Tools
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="search-enabled" className="text-base">
                      Enable Internet Search
                    </Label>
                    <p className="text-sm text-gray-500">
                      Enable or disable internet search capabilities
                    </p>
                  </div>
                  <Switch
                    id="search-enabled"
                    checked={config.isEnabled}
                    onCheckedChange={handleToggleSearch}
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="search-engine" className="text-base">
                    Preferred Search Engine
                  </Label>
                  <Select
                    value={config.preferredEngine}
                    onValueChange={handleEngineChange}
                    disabled={loading || !config.isEnabled}
                  >
                    <SelectTrigger id="search-engine">
                      <SelectValue placeholder="Select search engine" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="google">Google</SelectItem>
                      <SelectItem value="bing">Bing</SelectItem>
                      <SelectItem value="serper">Serper</SelectItem>
                      <SelectItem value="brave">Brave Search</SelectItem>
                      <SelectItem value="fallback">Fallback (DDG)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-gray-500">
                    Select your preferred search engine
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>API Keys</CardTitle>
              <CardDescription>
                Configure API keys for search engines
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 p-3 bg-blue-50 text-blue-800 rounded-md border border-blue-200">
                <h3 className="text-sm font-medium mb-1">How to get API keys:</h3>
                <ul className="text-xs space-y-1">
                  <li><strong>Google Search:</strong> Get an API key from <a href="https://developers.google.com/custom-search/v1/overview" target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">Google Custom Search API</a> and create a Custom Search Engine ID</li>
                  <li><strong>Bing Search:</strong> Get an API key from the <a href="https://www.microsoft.com/en-us/bing/apis/bing-web-search-api" target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">Bing Web Search API</a></li>
                  <li><strong>Serper:</strong> Get an API key from <a href="https://serper.dev/" target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">Serper.dev</a></li>
                  <li><strong>Brave Search:</strong> Get an API key from <a href="https://brave.com/search/api/" target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">Brave Search API</a></li>
                  <li><strong>Fallback:</strong> No API key needed (uses web scraping as fallback)</li>
                </ul>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="google-api-key">Google API Key</Label>
                  <Input
                    id="google-api-key"
                    type="password"
                    value={config.apiKeys.google}
                    onChange={(e) => handleApiKeyChange('google', e.target.value)}
                    disabled={loading || !config.isEnabled}
                    placeholder="Enter Google API Key"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="google-cx">Google Custom Search Engine ID</Label>
                  <Input
                    id="google-cx"
                    type="password"
                    value={config.apiKeys.googleCx}
                    onChange={(e) => handleApiKeyChange('googleCx', e.target.value)}
                    disabled={loading || !config.isEnabled}
                    placeholder="Enter Google Custom Search Engine ID"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bing-api-key">Bing API Key</Label>
                  <Input
                    id="bing-api-key"
                    type="password"
                    value={config.apiKeys.bing}
                    onChange={(e) => handleApiKeyChange('bing', e.target.value)}
                    disabled={loading || !config.isEnabled}
                    placeholder="Enter Bing API Key"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="serper-api-key">Serper API Key</Label>
                  <Input
                    id="serper-api-key"
                    type="password"
                    value={config.apiKeys.serper}
                    onChange={(e) => handleApiKeyChange('serper', e.target.value)}
                    disabled={loading || !config.isEnabled}
                    placeholder="Enter Serper API Key"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="brave-api-key">Brave Search API Key</Label>
                  <Input
                    id="brave-api-key"
                    type="password"
                    value={config.apiKeys.brave}
                    onChange={(e) => handleApiKeyChange('brave', e.target.value)}
                    disabled={loading || !config.isEnabled}
                    placeholder="Enter Brave Search API Key"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Test Search</CardTitle>
              <CardDescription>
                Test your search configuration with a query
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="test-query">Test Query</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="test-query"
                      value={testQuery}
                      onChange={(e) => setTestQuery(e.target.value)}
                      disabled={testLoading || !config.isEnabled}
                      placeholder="Enter a search query to test"
                    />
                    <Button 
                      onClick={handleTestSearch} 
                      disabled={testLoading || !testQuery.trim() || !config.isEnabled}
                    >
                      {testLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Testing...
                        </>
                      ) : (
                        'Test'
                      )}
                    </Button>
                  </div>
                </div>

                {testResults && (
                  <div className="mt-4 border p-4 rounded-md max-h-80 overflow-auto">
                    <h3 className="font-medium mb-2">
                      {testResults.enhancedWithSearch
                        ? 'Search Results'
                        : 'Search Failed'}
                    </h3>
                    
                    {testResults.enhancedWithSearch ? (
                      <>
                        <div className="mb-4">
                          <Label className="block mb-1">Search Engine:</Label>
                          <span className="text-sm">
                            {testResults.searchResults.searchEngine}
                          </span>
                        </div>
                        
                        <div className="mb-4">
                          <Label className="block mb-1">Summary:</Label>
                          <p className="text-sm whitespace-pre-wrap">
                            {testResults.contextualizationSummary}
                          </p>
                        </div>
                        
                        <div>
                          <Label className="block mb-1">Results:</Label>
                          <ul className="list-disc pl-5 text-sm">
                            {testResults.searchResults.results.map((result: any, index: number) => (
                              <li key={index} className="mb-2">
                                <a 
                                  href={result.url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="font-medium text-blue-600 hover:underline"
                                >
                                  {result.title}
                                </a>
                                <p className="text-sm">{result.snippet}</p>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </>
                    ) : (
                      <p className="text-sm text-red-500">
                        {testResults.error || 'No results found'}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default SearchConfigPage;