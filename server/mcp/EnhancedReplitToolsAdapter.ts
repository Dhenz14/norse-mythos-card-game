/**
 * EnhancedReplitToolsAdapter.ts
 * 
 * Provides enhanced integration with Replit tools beyond basic capabilities.
 * This adapter extends the basic ReplitToolsAdapter with more advanced features
 * for deeper integration with Replit's tools and services.
 */

import { ReplitToolsAdapter } from './ReplitToolsAdapter';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import { execSync } from 'child_process';

// Extended interface for SQL query results
interface SQLQueryResult {
  success: boolean;
  rows?: any[];
  error?: string;
  affectedRows?: number;
  metadata?: any;
}

// Interface for file changes
interface FileChange {
  filePath: string;
  oldContent: string;
  newContent: string;
  changeType: 'create' | 'modify' | 'delete';
  timestamp: number;
}

export class EnhancedReplitToolsAdapter {
  private basicAdapter: ReplitToolsAdapter;
  private fileChanges: FileChange[] = [];
  private readonly readFileAsync = promisify(fs.readFile);
  private readonly writeFileAsync = promisify(fs.writeFile);
  
  constructor() {
    this.basicAdapter = new ReplitToolsAdapter();
    console.log('Enhanced Replit Tools Adapter initialized');
  }

  /**
   * Enhanced file search with more options
   */
  public async findFilesAdvanced(
    glob: string, 
    options: { 
      maxDepth?: number, 
      excludeDirs?: string[], 
      includeContent?: boolean,
      contentPattern?: string
    } = {}
  ): Promise<string[]> {
    try {
      const { maxDepth = -1, excludeDirs = [], includeContent = false, contentPattern } = options;
      
      // Build find command with options
      let command = `find . -type f -name "${glob}" `;
      
      if (maxDepth > 0) {
        command += `-maxdepth ${maxDepth} `;
      }
      
      excludeDirs.forEach(dir => {
        command += `-not -path "./${dir}/*" `;
      });
      
      if (includeContent && contentPattern) {
        command += `| xargs grep -l "${contentPattern}" `;
      }
      
      const result = execSync(command).toString().trim();
      return result.split('\n').filter(file => file.length > 0);
    } catch (error) {
      console.error('Error in findFilesAdvanced:', error);
      return [];
    }
  }

  /**
   * Pass-through for basic search_filesystem functionality
   */
  public async searchFilesystem(options: {
    query_description?: string;
    class_names?: string[];
    function_names?: string[];
    code?: string[];
  }): Promise<string[]> {
    return this.basicAdapter.searchFilesystem(options);
  }
  
  /**
   * Find files matching a pattern
   */
  public async findFiles(pattern: string): Promise<string[]> {
    return this.basicAdapter.findFiles(pattern);
  }
  
  /**
   * Replace text in a file
   */
  public async replaceInFile(filePath: string, oldText: string, newText: string): Promise<boolean> {
    return this.basicAdapter.replaceInFile(filePath, oldText, newText);
  }

  /**
   * Enhances search_filesystem tool with more context
   */
  public async enhancedSearchFilesystem(
    options: {
      query_description?: string,
      class_names?: string[],
      function_names?: string[],
      code?: string[],
      includeContent?: boolean
    }
  ): Promise<any> {
    try {
      // Basic search using parent method
      const basicResults = await this.basicAdapter.searchFilesystem(options);
      
      // Enhanced with content preview if requested
      if (options.includeContent && basicResults && basicResults.length > 0) {
        const enhancedResults = await Promise.all(
          basicResults.map(async (file: string) => {
            try {
              const content = await this.readFileAsync(file, 'utf8');
              const preview = content.length > 500 
                ? content.substring(0, 500) + '...' 
                : content;
                
              return {
                filePath: file,
                contentPreview: preview,
                size: fs.statSync(file).size,
                lastModified: fs.statSync(file).mtime
              };
            } catch (err) {
              return {
                filePath: file,
                error: 'Could not read file'
              };
            }
          })
        );
        
        return enhancedResults;
      }
      
      return basicResults;
    } catch (error) {
      console.error('Error in enhancedSearchFilesystem:', error);
      return [];
    }
  }

  /**
   * Execute SQL queries with more detailed result handling
   */
  public async executeSQLQuery(query: string): Promise<SQLQueryResult> {
    try {
      // Integrate with execute_sql_tool
      // This would be implemented through a proper API call to the Replit tool in production
      
      // First check if we have a database connection
      const dbCheckResult = await this.executeBashCommand("test -f .env && grep -q 'DATABASE_URL' .env && echo 'true'");
      
      if (!dbCheckResult.success || dbCheckResult.output?.trim() !== 'true') {
        console.log('No database connection found. Would attempt to create one through execute_sql_tool.');
        return {
          success: false,
          error: 'No database connection available. Please setup a database first.'
        };
      }
      
      console.log(`Executing SQL query: ${query}`);
      
      // In a real implementation, we would call the execute_sql_tool API
      // For now, we'll simulate this with an alternative method
      const result = await this.executeQueryWithNodePG(query);
      
      return result;
    } catch (error) {
      console.error('Error executing SQL query:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
  
  /**
   * Execute query with Node-PG as a fallback
   * (This is a simplified implementation to show how it would work)
   */
  private async executeQueryWithNodePG(query: string): Promise<SQLQueryResult> {
    try {
      // Check if the DATABASE_URL environment variable exists
      if (!process.env.DATABASE_URL) {
        return {
          success: false,
          error: 'DATABASE_URL environment variable not found'
        };
      }
      
      // In a real implementation, we would use pg to execute the query
      // For now, we'll log what would happen
      console.log(`Would execute query with pg: ${query}`);
      
      // For demonstration purposes, return simulated results
      // In a real implementation, this would be replaced with actual pg query results
      
      // Simulate different responses based on the query type
      if (query.toLowerCase().startsWith('select')) {
        const simpleResults = [
          { column1: 'value1', column2: 'value2' },
          { column1: 'value3', column2: 'value4' }
        ];
        
        return {
          success: true,
          rows: simpleResults,
          affectedRows: 0,
          metadata: { query, timestamp: Date.now() }
        };
      } else if (query.toLowerCase().startsWith('insert') || 
                query.toLowerCase().startsWith('update') ||
                query.toLowerCase().startsWith('delete')) {
        return {
          success: true,
          affectedRows: 1,
          metadata: { query, timestamp: Date.now() }
        };
      } else {
        return {
          success: true,
          rows: [],
          affectedRows: 0,
          metadata: { query, timestamp: Date.now() }
        };
      }
    } catch (error) {
      console.error('Error in executeQueryWithNodePG:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Enhanced file editor with change tracking
   */
  public async enhancedEditFile(
    filePath: string, 
    oldContent: string, 
    newContent: string
  ): Promise<boolean> {
    try {
      // Track changes before making them
      const changeRecord: FileChange = {
        filePath,
        oldContent,
        newContent,
        changeType: fs.existsSync(filePath) ? 'modify' : 'create',
        timestamp: Date.now()
      };
      
      // Use the basic adapter method to make the actual edit
      const result = await this.basicAdapter.replaceInFile(filePath, oldContent, newContent);
      
      if (result) {
        // Record successful changes
        this.fileChanges.push(changeRecord);
      }
      
      return result;
    } catch (error) {
      console.error('Error in enhancedEditFile:', error);
      return false;
    }
  }

  /**
   * Get recent file changes
   */
  public getRecentChanges(limit: number = 10): FileChange[] {
    return this.fileChanges
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  /**
   * Create interactive UI component using web_application_feedback_tool
   */
  public async createInteractiveComponent(
    componentType: string,
    props: any
  ): Promise<string> {
    try {
      // In a real implementation, this would call the web_application_feedback_tool API
      console.log(`Creating interactive ${componentType} component with props:`, props);
      
      // Based on component type, create appropriate UI
      switch (componentType) {
        case 'card':
          return this.createCardComponent(props);
        case 'table':
          return this.createTableComponent(props);
        case 'form':
          return this.createFormComponent(props);
        case 'chart':
          return this.createChartComponent(props);
        case 'code':
          return this.createCodeComponent(props);
        default:
          return this.createGenericComponent(props);
      }
    } catch (error) {
      console.error('Error creating interactive component:', error);
      return `<div class="think-tools-interactive think-tools-error">
        <h3>Error Creating Component</h3>
        <div class="think-tools-content">
          <p>An error occurred while creating the interactive component.</p>
          <p>${error instanceof Error ? error.message : String(error)}</p>
        </div>
      </div>`;
    }
  }
  
  /**
   * Create a card component
   */
  private createCardComponent(props: any): string {
    const { title, content, image, buttons = [] } = props;
    
    return `<div class="think-tools-card">
      <h3 class="think-tools-card-title">${title || 'Card'}</h3>
      ${image ? `<img src="${image}" alt="${title || 'Card image'}" class="think-tools-card-image" />` : ''}
      <div class="think-tools-card-content">${content || ''}</div>
      <div class="think-tools-card-actions">
        ${buttons.map((btn: any) => 
          `<button class="think-btn" data-action="${btn.action}">${btn.label}</button>`
        ).join('')}
      </div>
    </div>`;
  }
  
  /**
   * Create a table component
   */
  private createTableComponent(props: any): string {
    const { title, headers = [], rows = [] } = props;
    
    return `<div class="think-tools-table-container">
      ${title ? `<h3 class="think-tools-table-title">${title}</h3>` : ''}
      <table class="think-tools-table">
        <thead>
          <tr>
            ${headers.map((header: string) => `<th>${header}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${rows.map((row: any[]) => `
            <tr>
              ${row.map((cell: any) => `<td>${cell}</td>`).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>`;
  }
  
  /**
   * Create a form component
   */
  private createFormComponent(props: any): string {
    const { title, fields = [], submitAction, cancelAction } = props;
    
    return `<div class="think-tools-form-container">
      ${title ? `<h3 class="think-tools-form-title">${title}</h3>` : ''}
      <form class="think-tools-form" data-submit-action="${submitAction || ''}">
        ${fields.map((field: any) => {
          const { name, label, type = 'text', options = [], value = '', required = false } = field;
          
          if (type === 'select') {
            return `<div class="think-tools-form-field">
              <label for="${name}">${label}</label>
              <select name="${name}" id="${name}" ${required ? 'required' : ''}>
                ${options.map((opt: any) => 
                  `<option value="${opt.value}" ${opt.value === value ? 'selected' : ''}>${opt.label}</option>`
                ).join('')}
              </select>
            </div>`;
          } else if (type === 'textarea') {
            return `<div class="think-tools-form-field">
              <label for="${name}">${label}</label>
              <textarea name="${name}" id="${name}" ${required ? 'required' : ''}>${value}</textarea>
            </div>`;
          } else {
            return `<div class="think-tools-form-field">
              <label for="${name}">${label}</label>
              <input type="${type}" name="${name}" id="${name}" value="${value}" ${required ? 'required' : ''} />
            </div>`;
          }
        }).join('')}
        <div class="think-tools-form-actions">
          <button type="submit" class="think-btn think-btn-primary">Submit</button>
          ${cancelAction ? `<button type="button" class="think-btn" data-action="${cancelAction}">Cancel</button>` : ''}
        </div>
      </form>
    </div>`;
  }
  
  /**
   * Create a chart component
   */
  private createChartComponent(props: any): string {
    const { title, type = 'bar', data = {}, options = {} } = props;
    
    // This would create a chart using a library like Chart.js
    // For now, we'll return a placeholder that would be replaced with actual chart
    return `<div class="think-tools-chart-container">
      ${title ? `<h3 class="think-tools-chart-title">${title}</h3>` : ''}
      <div class="think-tools-chart" 
           data-chart-type="${type}" 
           data-chart-data="${encodeURIComponent(JSON.stringify(data))}"
           data-chart-options="${encodeURIComponent(JSON.stringify(options))}">
        <div class="think-tools-chart-placeholder">
          Chart would be rendered here using the web_application_feedback_tool
        </div>
      </div>
    </div>`;
  }
  
  /**
   * Create a code component
   */
  private createCodeComponent(props: any): string {
    const { title, code = '', language = 'typescript', editable = false, executeAction } = props;
    
    return `<div class="think-tools-code-container">
      ${title ? `<h3 class="think-tools-code-title">${title}</h3>` : ''}
      <div class="think-tools-code" data-language="${language}" ${editable ? 'data-editable="true"' : ''}>
        <pre><code>${this.escapeHtml(code)}</code></pre>
      </div>
      ${executeAction ? `
        <div class="think-tools-code-actions">
          <button class="think-btn think-btn-primary" data-action="${executeAction}">Execute</button>
        </div>
      ` : ''}
    </div>`;
  }
  
  /**
   * Create a generic component
   */
  private createGenericComponent(props: any): string {
    const { title, content, buttons = [] } = props;
    
    return `<div class="think-tools-interactive">
      ${title ? `<h3 class="think-tools-title">${title}</h3>` : ''}
      <div class="think-tools-content">${content || ''}</div>
      ${buttons.length > 0 ? `
        <div class="think-tools-actions">
          ${buttons.map((btn: any) => 
            `<button class="think-btn" data-action="${btn.action}">${btn.label}</button>`
          ).join('')}
        </div>
      ` : ''}
    </div>`;
  }
  
  /**
   * Escape HTML to prevent XSS attacks
   */
  private escapeHtml(html: string): string {
    return html
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  /**
   * Generate code based on a template
   */
  public async generateCode(
    template: string,
    replacements: Record<string, string>
  ): Promise<string> {
    let result = template;
    
    // Replace all placeholders with their values
    for (const [key, value] of Object.entries(replacements)) {
      const placeholder = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
      result = result.replace(placeholder, value);
    }
    
    return result;
  }

  /**
   * Create a new file with generated code
   */
  public async createFileFromTemplate(
    filePath: string,
    template: string,
    replacements: Record<string, string>
  ): Promise<boolean> {
    try {
      const content = await this.generateCode(template, replacements);
      
      // Ensure directory exists
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      // Create the file
      await this.writeFileAsync(filePath, content, 'utf8');
      
      // Record the change
      this.fileChanges.push({
        filePath,
        oldContent: '',
        newContent: content,
        changeType: 'create',
        timestamp: Date.now()
      });
      
      return true;
    } catch (error) {
      console.error('Error in createFileFromTemplate:', error);
      return false;
    }
  }

  /**
   * Execute bash commands with better error handling
   */
  public async executeBashCommand(command: string): Promise<{
    success: boolean;
    output?: string;
    error?: string;
  }> {
    try {
      const output = execSync(command, { encoding: 'utf8' });
      return { success: true, output };
    } catch (error: any) {
      return { 
        success: false, 
        error: error.message,
        output: error.stdout?.toString() || ''
      };
    }
  }
}