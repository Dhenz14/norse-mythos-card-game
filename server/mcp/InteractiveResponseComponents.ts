/**
 * InteractiveResponseComponents.ts
 * 
 * This module provides interactive UI components for Think Tools responses,
 * including buttons, selects, tables, and more.
 */

type ComponentType = 'button' | 'select' | 'table' | 'chart' | 'codeBlock' | 'cardList';

interface Component {
  id: string;
  type: ComponentType;
  label: string;
  description?: string;
  action?: string;
  data?: any;
  options?: any[];
}

interface FormatOptions {
  includeComponents?: boolean;
  allowExecutableComponents?: boolean;
  theme?: 'light' | 'dark';
  maxComponents?: number;
}

export class InteractiveResponseComponents {
  constructor() {
    console.log('Interactive Response Components initialized');
  }
  
  /**
   * Format a Think Tools response with interactive components
   */
  public formatResponse(
    response: string,
    components: Component[],
    options: FormatOptions = {}
  ): string {
    const {
      includeComponents = true,
      allowExecutableComponents = false,
      theme = 'light',
      maxComponents = 5
    } = options;
    
    if (!includeComponents || components.length === 0) {
      return response;
    }
    
    // Limit the number of components
    const limitedComponents = components.slice(0, maxComponents);
    
    // Add components to the response
    let formattedResponse = response;
    
    // Add interactive components section
    formattedResponse += '\n\n---\n\n';
    formattedResponse += '## Interactive Components\n\n';
    
    // Add each component
    limitedComponents.forEach(component => {
      formattedResponse += this.renderComponent(component, allowExecutableComponents, theme);
      formattedResponse += '\n\n';
    });
    
    return formattedResponse;
  }
  
  /**
   * Render a component as markdown/HTML
   */
  private renderComponent(
    component: Component,
    allowExecutable: boolean,
    theme: 'light' | 'dark'
  ): string {
    const { type, label, description, action, data, options } = component;
    
    switch (type) {
      case 'button':
        return this.renderButton(label, description, action, allowExecutable, theme);
        
      case 'select':
        return this.renderSelect(label, description, options, allowExecutable, theme);
        
      case 'table':
        return this.renderTable(label, description, data, theme);
        
      case 'chart':
        return this.renderChart(label, description, data, theme);
        
      case 'codeBlock':
        return this.renderCodeBlock(label, description, data, theme);
        
      case 'cardList':
        return this.renderCardList(label, description, data, allowExecutable, theme);
        
      default:
        return `**${label}**\n${description || ''}`;
    }
  }
  
  /**
   * Render a button component
   */
  private renderButton(
    label: string,
    description?: string,
    action?: string,
    allowExecutable?: boolean,
    theme?: 'light' | 'dark'
  ): string {
    const buttonStyle = theme === 'dark' 
      ? 'background-color: #333; color: white; border: 1px solid #555;'
      : 'background-color: #f0f0f0; color: #333; border: 1px solid #ccc;';
    
    const buttonHtml = allowExecutable
      ? `<button style="padding: 8px 16px; border-radius: 4px; cursor: pointer; ${buttonStyle}" data-action="${action}">${label}</button>`
      : `**[${label}]**`;
    
    return `### ${label}\n${description || ''}\n\n${buttonHtml}`;
  }
  
  /**
   * Render a select component
   */
  private renderSelect(
    label: string,
    description?: string,
    options?: any[],
    allowExecutable?: boolean,
    theme?: 'light' | 'dark'
  ): string {
    const selectStyle = theme === 'dark'
      ? 'background-color: #333; color: white; border: 1px solid #555;'
      : 'background-color: #f0f0f0; color: #333; border: 1px solid #ccc;';
    
    if (!options || options.length === 0) {
      return `### ${label}\n${description || ''}\n\n*No options available*`;
    }
    
    const optionsText = options.map(option => 
      `- ${option.label || option.value}`
    ).join('\n');
    
    const selectHtml = allowExecutable
      ? `<select style="padding: 8px 16px; border-radius: 4px; ${selectStyle}">${
          options.map(option => `<option value="${option.value}">${option.label || option.value}</option>`).join('')
        }</select>`
      : optionsText;
    
    return `### ${label}\n${description || ''}\n\n${selectHtml}`;
  }
  
  /**
   * Render a table component
   */
  private renderTable(
    label: string,
    description?: string,
    data?: any,
    theme?: 'light' | 'dark'
  ): string {
    if (!data || !data.headers || !data.rows || data.rows.length === 0) {
      return `### ${label}\n${description || ''}\n\n*No data available*`;
    }
    
    // Create table header
    let tableText = `### ${label}\n${description || ''}\n\n`;
    tableText += '| ' + data.headers.map((header: string) => header).join(' | ') + ' |\n';
    tableText += '| ' + data.headers.map(() => '---').join(' | ') + ' |\n';
    
    // Add table rows
    data.rows.forEach((row: any[]) => {
      tableText += '| ' + row.map((cell: any) => cell).join(' | ') + ' |\n';
    });
    
    return tableText;
  }
  
  /**
   * Render a chart component (as placeholder text)
   */
  private renderChart(
    label: string,
    description?: string,
    data?: any,
    theme?: 'light' | 'dark'
  ): string {
    return `### ${label}\n${description || ''}\n\n*Chart visualization would appear here*`;
  }
  
  /**
   * Render a code block component
   */
  private renderCodeBlock(
    label: string,
    description?: string,
    data?: string,
    theme?: 'light' | 'dark'
  ): string {
    if (!data) {
      return `### ${label}\n${description || ''}\n\n*No code available*`;
    }
    
    return `### ${label}\n${description || ''}\n\n\`\`\`typescript\n${data}\n\`\`\``;
  }
  
  /**
   * Render a card list component
   */
  private renderCardList(
    label: string,
    description?: string,
    cards?: any[],
    allowExecutable?: boolean,
    theme?: 'light' | 'dark'
  ): string {
    if (!cards || cards.length === 0) {
      return `### ${label}\n${description || ''}\n\n*No cards available*`;
    }
    
    let cardListText = `### ${label}\n${description || ''}\n\n`;
    
    cards.forEach((card) => {
      const cardTitle = card.title || 'Card';
      const cardDescription = card.description || '';
      const actionButton = allowExecutable && card.action
        ? `<button style="padding: 4px 8px; border-radius: 4px; cursor: pointer;" data-action="${card.action}" data-id="${card.id || ''}">${card.actionLabel || 'View'}</button>`
        : '';
      
      cardListText += `**${cardTitle}**  \n${cardDescription}  \n${actionButton ? actionButton + '  \n' : ''}\n`;
    });
    
    return cardListText;
  }
}