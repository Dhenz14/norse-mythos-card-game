/**
 * ReplitToolsAdapter.ts
 * 
 * This module provides integration with Replit tools for use in the Think Tools system.
 * It handles file searching, editing, and executing commands through the Replit tools.
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

export class ReplitToolsAdapter {
  constructor() {
    console.log('ReplitToolsAdapter initialized');
  }
  
  /**
   * Search filesystem using Replit search_filesystem tool
   */
  public async searchFilesystem(options: {
    query_description?: string;
    class_names?: string[];
    function_names?: string[];
    code?: string[];
  }): Promise<string[]> {
    try {
      const { query_description, class_names, function_names, code } = options;
      
      // For now we'll use a simple implementation that uses grep
      if (query_description) {
        const words = query_description.split(/\s+/).filter(word => word.length > 3);
        if (words.length === 0) return [];
        
        const pattern = words.join('|');
        const result = execSync(`find . -type f -name "*.ts" -o -name "*.tsx" | xargs grep -l "${pattern}" 2>/dev/null || true`).toString();
        return result.split('\n').filter(file => file.trim().length > 0);
      }
      
      if (class_names && class_names.length > 0) {
        const pattern = class_names.join('|');
        const result = execSync(`find . -type f -name "*.ts" -o -name "*.tsx" | xargs grep -l "class\\s\\+(${pattern})" 2>/dev/null || true`).toString();
        return result.split('\n').filter(file => file.trim().length > 0);
      }
      
      if (function_names && function_names.length > 0) {
        const pattern = function_names.join('|');
        const result = execSync(`find . -type f -name "*.ts" -o -name "*.tsx" | xargs grep -l "function\\s\\+(${pattern})" 2>/dev/null || true`).toString();
        return result.split('\n').filter(file => file.trim().length > 0);
      }
      
      if (code && code.length > 0) {
        const results: string[] = [];
        
        for (const codeSnippet of code) {
          const escapedSnippet = codeSnippet.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/'/g, "\\'");
          const result = execSync(`find . -type f -name "*.ts" -o -name "*.tsx" | xargs grep -l "${escapedSnippet}" 2>/dev/null || true`).toString();
          results.push(...result.split('\n').filter(file => file.trim().length > 0));
        }
        
        return Array.from(new Set(results)); // Remove duplicates
      }
      
      return [];
    } catch (error) {
      console.error('Error in searchFilesystem:', error);
      return [];
    }
  }
  
  /**
   * Search for files matching a pattern
   */
  public async findFiles(pattern: string): Promise<string[]> {
    try {
      const result = execSync(`find . -type f -name "${pattern}" | grep -v "node_modules"`).toString();
      return result.split('\n').filter(file => file.trim().length > 0);
    } catch (error) {
      console.error('Error in findFiles:', error);
      return [];
    }
  }
  
  /**
   * Replace text in a file
   */
  public async replaceInFile(
    filePath: string,
    oldText: string,
    newText: string
  ): Promise<boolean> {
    try {
      if (!fs.existsSync(filePath)) {
        console.error(`File ${filePath} does not exist`);
        return false;
      }
      
      const content = fs.readFileSync(filePath, 'utf8');
      if (!content.includes(oldText)) {
        console.error(`File ${filePath} does not contain the specified text`);
        return false;
      }
      
      const newContent = content.replace(oldText, newText);
      fs.writeFileSync(filePath, newContent, 'utf8');
      
      return true;
    } catch (error) {
      console.error('Error in replaceInFile:', error);
      return false;
    }
  }
  
  /**
   * Execute a bash command
   */
  public async executeBashCommand(command: string): Promise<string> {
    try {
      const result = execSync(command).toString();
      return result;
    } catch (error) {
      console.error('Error executing bash command:', error);
      return `Error: ${error instanceof Error ? error.message : String(error)}`;
    }
  }
}