import React, { useState, useEffect } from 'react';
import { getSequentialThought } from '../lib/smitheryUtils';
import useSmithery from '../hooks/useSmithery';

interface ChatMessage {
  id: string;
  role: 'user' | 'smithery';
  content: string;
  timestamp: Date;
}

export default function SmitheryChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [processing, setProcessing] = useState(false);
  const { status, isConnected, error: smitheryError } = useSmithery();

  // Add initial system message
  useEffect(() => {
    if (status) {
      const initialMessage: ChatMessage = {
        id: 'welcome',
        role: 'smithery',
        content: isConnected 
          ? 'Welcome to Smithery Sequential Thinking! You can:\n\n' +
            '1. Ask any question for step-by-step reasoning\n' +
            '2. Use commands like **"use sequential thinking: [your question]"** to activate the advanced Norse mythology analysis\n\n' +
            'Try asking about card strategies, deck building, or mythological entities like Thor, Odin, or Loki!'
          : 'Smithery Sequential Thinking is not available right now. Please check the connection.',
        timestamp: new Date()
      };
      setMessages([initialMessage]);
    }
  }, [status, isConnected]);

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputValue.trim() || processing || !isConnected) return;
    
    // Add user message
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: inputValue,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setProcessing(true);
    
    try {
      // Check if this is a sequential thinking command
      const inputLower = userMessage.content.toLowerCase();
      const isSequentialThinkingCommand = 
        inputLower.startsWith('use sequential thinking') || 
        inputLower.startsWith('use step by step thinking') ||
        inputLower.includes('think step by step about') ||
        inputLower.includes('analyze step by step');
      
      // Extract the actual prompt from the command if needed
      let prompt = userMessage.content;
      if (isSequentialThinkingCommand) {
        // Try to extract the prompt after the command
        const commandPatterns = [
          /use sequential thinking(?: about)?\s*:?\s*(.*)/i,
          /use step by step thinking(?: about)?\s*:?\s*(.*)/i,
          /think step by step about\s*:?\s*(.*)/i,
          /analyze step by step\s*:?\s*(.*)/i
        ];
        
        for (const pattern of commandPatterns) {
          const match = userMessage.content.match(pattern);
          if (match && match[1] && match[1].trim()) {
            prompt = match[1].trim();
            break;
          }
        }
        
        // If no valid prompt was extracted, use the full message
        if (prompt === userMessage.content && isSequentialThinkingCommand) {
          // Add special feedback message when no prompt is provided
          const feedbackMessage: ChatMessage = {
            id: `smithery-feedback-${Date.now()}`,
            role: 'smithery',
            content: 'I understand you want to use sequential thinking. Please provide a question or topic after the command. For example: "use sequential thinking: What strategy should I use with Thor cards?"',
            timestamp: new Date()
          };
          setMessages(prev => [...prev, feedbackMessage]);
          setProcessing(false);
          return;
        }
      }
      
      // Placeholder response while processing
      const placeholderMessage: ChatMessage = {
        id: `smithery-placeholder-${Date.now()}`,
        role: 'smithery',
        content: 'Thinking step by step...',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, placeholderMessage]);
      
      // Get sequential thinking response
      const response = await getSequentialThought(prompt);
      
      // Add a prefix for command-based activations
      let responseContent = response;
      if (isSequentialThinkingCommand) {
        responseContent = "**Advanced Norse Sequential Thinking Analysis**\n\n" + response;
      }
      
      // Replace placeholder with actual response
      setMessages(prev => prev.map(msg => 
        msg.id === placeholderMessage.id 
          ? {
              id: `smithery-${Date.now()}`,
              role: 'smithery',
              content: responseContent,
              timestamp: new Date()
            }
          : msg
      ));
    } catch (error: any) {
      // Replace placeholder with error message
      setMessages(prev => prev.map(msg => 
        msg.id === `smithery-placeholder-${Date.now() - 100}` // approximate match
          ? {
              id: `smithery-error-${Date.now()}`,
              role: 'smithery',
              content: `Error: ${error.message || 'Failed to process your request'}`,
              timestamp: new Date()
            }
          : msg
      ));
    } finally {
      setProcessing(false);
    }
  };

  // Format message content for display (convert markdown-like syntax)
  const formatContent = (content: string) => {
    // Simple markdown-like formatting
    return content
      .replace(/## (.*)/g, '<h2>$1</h2>')
      .replace(/### (.*)/g, '<h3>$1</h3>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n\n/g, '<br><br>')
      .replace(/\n/g, '<br>');
  };

  return (
    <div className="flex flex-col max-w-4xl mx-auto p-4 h-screen">
      <h1 className="text-2xl font-bold mb-4">Smithery Sequential Thinking Chat</h1>
      
      {/* Connection status */}
      <div className={`p-2 mb-4 rounded ${isConnected ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
        Status: {isConnected ? 'Connected' : 'Disconnected'}
        {smitheryError && <p className="text-red-600 text-sm">{smitheryError}</p>}
      </div>
      
      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto mb-4 border rounded p-4 bg-gray-50">
        {messages.map(message => (
          <div 
            key={message.id} 
            className={`mb-4 p-3 rounded-lg ${
              message.role === 'user' 
                ? 'bg-blue-50 ml-8' 
                : 'bg-green-50 mr-8'
            }`}
          >
            <div className="font-bold mb-1">
              {message.role === 'user' ? 'You' : 'Smithery AI'}
              <span className="text-xs text-gray-500 ml-2">
                {message.timestamp.toLocaleTimeString()}
              </span>
            </div>
            <div 
              className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: formatContent(message.content) }}
            />
          </div>
        ))}
        
        {/* Auto-scroll to bottom */}
        <div id="chat-end" />
      </div>
      
      {/* Input form */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          disabled={processing || !isConnected}
          placeholder={isConnected ? "Ask something that requires step-by-step reasoning..." : "Smithery is disconnected"}
          className="flex-1 px-4 py-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
        />
        <button
          type="submit"
          disabled={processing || !inputValue.trim() || !isConnected}
          className={`px-4 py-2 rounded text-white font-medium ${
            processing || !inputValue.trim() || !isConnected
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {processing ? 'Processing...' : 'Send'}
        </button>
      </form>
    </div>
  );
}