/**
 * ReasoningContext
 * 
 * Maintains state during the reasoning process, tracking the current mode
 * and storing extracted sections for reference across process steps.
 */

import { ReasoningMode } from './reasoningModes';

export class ReasoningContext {
  mode: ReasoningMode;
  sections: Map<string, string>;
  private originalContent: string = '';
  
  constructor(mode: ReasoningMode = ReasoningMode.SEQUENTIAL, originalContent: string = '') {
    this.mode = mode;
    this.sections = new Map<string, string>();
    this.originalContent = originalContent;
  }
  
  /**
   * Add a section to the context
   */
  addSection(name: string, content: string): void {
    this.sections.set(name, content);
  }
  
  /**
   * Get a section from the context
   */
  getSection(name: string): string | undefined {
    return this.sections.get(name);
  }
  
  /**
   * Check if a section exists in the context
   */
  hasSection(name: string): boolean {
    return this.sections.has(name);
  }
  
  /**
   * Change the current reasoning mode
   */
  setMode(mode: ReasoningMode): void {
    this.mode = mode;
  }
  
  /**
   * Get all sections as an object
   */
  getAllSections(): Record<string, string> {
    const result: Record<string, string> = {};
    this.sections.forEach((value, key) => {
      result[key] = value;
    });
    return result;
  }
  
  /**
   * Create a new context with the same sections but a different mode
   */
  withMode(mode: ReasoningMode): ReasoningContext {
    const newContext = new ReasoningContext(mode, this.originalContent);
    this.sections.forEach((value, key) => {
      newContext.addSection(key, value);
    });
    return newContext;
  }
  
  /**
   * Set the original content
   */
  setOriginalContent(content: string): void {
    this.originalContent = content;
  }
  
  /**
   * Get the original content
   */
  getOriginalContent(): string {
    return this.originalContent;
  }
}