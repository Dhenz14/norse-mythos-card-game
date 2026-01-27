import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ThinkToolsWidget.css';

interface ThinkToolsWidgetProps {
  initialQuery?: string;
  allowToolExecution?: boolean;
  theme?: 'light' | 'dark';
}

interface ThinkToolsResponse {
  result: string;
  components?: any[];
  error?: string;
}

/**
 * ThinkToolsWidget - A React component for integrating Think Tools into the UI
 * 
 * This widget provides an interface for querying the enhanced Think Tools system
 * and displaying the formatted results with interactive components.
 */
const ThinkToolsWidget: React.FC<ThinkToolsWidgetProps> = ({
  initialQuery = '',
  allowToolExecution = false,
  theme = 'light'
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [response, setResponse] = useState<ThinkToolsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Process the query when submitted
  const handleQuerySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await axios.post('/api/mcp/think-tools', {
        query,
        allowToolExecution,
        theme
      });
      
      setResponse(result.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error processing query');
      console.error('Think Tools query error:', err);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle component action clicks
  const handleComponentAction = async (action: string, data?: any) => {
    if (!allowToolExecution) {
      console.warn('Tool execution is disabled');
      return;
    }
    
    try {
      const result = await axios.post('/api/mcp/think-tools/action', {
        action,
        data,
        previousQuery: query
      });
      
      // Update response with action result
      setResponse(prev => prev ? {
        ...prev,
        result: result.data.result || prev.result,
        components: result.data.components || prev.components
      } : result.data);
      
    } catch (err: any) {
      console.error('Error executing component action:', err);
    }
  };
  
  // Render markdown content with components
  const renderMarkdown = (content: string) => {
    // In a real implementation, this would use a markdown library
    // For now, just doing basic formatting
    return (
      <div className="think-tools-markdown">
        {content.split('\n').map((line, i) => {
          // Format headlines
          if (line.startsWith('# ')) {
            return <h1 key={i}>{line.substring(2)}</h1>;
          } else if (line.startsWith('## ')) {
            return <h2 key={i}>{line.substring(3)}</h2>;
          } else if (line.startsWith('### ')) {
            return <h3 key={i}>{line.substring(4)}</h3>;
          }
          
          // Format bullet points
          if (line.startsWith('• ')) {
            return <li key={i}>{line.substring(2)}</li>;
          }
          
          // Format check marks
          if (line.startsWith('✓ ')) {
            return <div key={i} className="checkmark-item">{line}</div>;
          }
          
          // Format arrows
          if (line.startsWith('→ ')) {
            return <div key={i} className="arrow-item">{line}</div>;
          }
          
          // Format emoji headers
          if (line.includes('THINK TOOLS ACTIVATED') || 
              line.includes('SEQUENTIAL THINKING ACTIVATED') || 
              line.includes('THINK TOOL ACTIVATED')) {
            return <div key={i} className="emoji-header">{line}</div>;
          }
          
          // Default formatting
          return line.trim() ? <p key={i}>{line}</p> : <br key={i} />;
        })}
      </div>
    );
  };
  
  // Render interactive components
  const renderComponents = (components: any[] = []) => {
    return (
      <div className="think-tools-components">
        {components.map((component, index) => {
          const { type, id, label, action, data } = component;
          
          switch (type) {
            case 'button':
              return (
                <button 
                  key={id || index}
                  className="tt-button"
                  onClick={() => handleComponentAction(action, data)}
                >
                  {label}
                </button>
              );
              
            case 'codeBlock':
              return (
                <div key={id || index} className="tt-code-block">
                  <h4>{label}</h4>
                  <pre>{data}</pre>
                </div>
              );
              
            case 'table':
              return (
                <div key={id || index} className="tt-table">
                  <h4>{label}</h4>
                  <table>
                    <thead>
                      <tr>
                        {data.headers.map((header: string, i: number) => (
                          <th key={i}>{header}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {data.rows.map((row: any[], i: number) => (
                        <tr key={i}>
                          {row.map((cell, j) => (
                            <td key={j}>{cell}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
              
            case 'cardList':
              return (
                <div key={id || index} className="tt-card-list">
                  <h4>{label}</h4>
                  <div className="cards-container">
                    {data.map((card: any, i: number) => (
                      <div key={i} className="tt-card">
                        <h5>{card.title}</h5>
                        <p>{card.description}</p>
                        {card.action && (
                          <button 
                            className="tt-card-action"
                            onClick={() => handleComponentAction(card.action, card)}
                          >
                            {card.actionLabel || 'Action'}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
              
            default:
              return (
                <div key={id || index} className="tt-generic">
                  <h4>{label}</h4>
                  <pre>{JSON.stringify(data, null, 2)}</pre>
                </div>
              );
          }
        })}
      </div>
    );
  };
  
  return (
    <div className={`think-tools-widget ${theme}`}>
      <h2>Enhanced Think Tools</h2>
      
      <form onSubmit={handleQuerySubmit} className="think-tools-form">
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Enter your query for Think Tools analysis..."
          rows={4}
          className="think-tools-input"
        />
        <button 
          type="submit" 
          className="think-tools-submit"
          disabled={loading}
        >
          {loading ? 'Processing...' : 'Analyze'}
        </button>
      </form>
      
      {error && (
        <div className="think-tools-error">
          Error: {error}
        </div>
      )}
      
      {response && (
        <div className="think-tools-response">
          {renderMarkdown(response.result)}
          {response.components && renderComponents(response.components)}
        </div>
      )}
    </div>
  );
};

export default ThinkToolsWidget;