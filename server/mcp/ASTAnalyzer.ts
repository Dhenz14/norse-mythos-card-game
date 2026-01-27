/**
 * ASTAnalyzer.ts
 * 
 * This module provides TypeScript AST (Abstract Syntax Tree) analysis capabilities
 * for enhanced codebase understanding and relationship mapping.
 */

import {
  Project,
  SourceFile,
  Node,
  SyntaxKind,
  ClassDeclaration,
  InterfaceDeclaration,
  FunctionDeclaration,
  VariableDeclaration,
  PropertyDeclaration,
  MethodDeclaration,
  TypeAliasDeclaration,
  EnumDeclaration,
} from 'ts-morph';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Type representing a code entity in the AST
 */
export interface CodeEntity {
  id: string;
  name: string;
  type: string;
  filePath: string;
  startLine: number;
  endLine: number;
  description?: string;
  parentId?: string;
  properties?: string[];
  methods?: string[];
  references?: string[];
}

/**
 * Type representing a relationship between code entities
 */
export interface CodeRelationship {
  id: string;
  sourceId: string;
  targetId: string;
  type: string;
  description?: string;
}

/**
 * Type representing the insights extracted from AST analysis
 */
export interface ASTInsights {
  entities: CodeEntity[];
  relationships: CodeRelationship[];
  mechanics: Map<string, any>;
  imports: any[];
  exports: any[];
}

/**
 * Class providing AST analysis capabilities
 */
export class ASTAnalyzer {
  private project: Project;
  private insights: ASTInsights;
  private baseDir: string;
  
  /**
   * Constructor
   */
  constructor(baseDir: string = '.') {
    this.baseDir = baseDir;
    this.project = new Project({
      tsConfigFilePath: path.join(baseDir, 'tsconfig.json'),
    });
    
    this.insights = {
      entities: [],
      relationships: [],
      mechanics: new Map(),
      imports: [],
      exports: [],
    };
    
    console.log('AST Analyzer initialized');
  }
  
  /**
   * Add a file to the project for analysis
   */
  public addFile(filePath: string): SourceFile | undefined {
    if (!fs.existsSync(filePath)) {
      console.error(`File not found: ${filePath}`);
      return undefined;
    }
    
    try {
      return this.project.addSourceFileAtPath(filePath);
    } catch (error) {
      console.error(`Error adding file: ${filePath}`, error);
      return undefined;
    }
  }
  
  /**
   * Add multiple files or directories to the project
   */
  public addFilesFromGlob(glob: string): SourceFile[] {
    try {
      return this.project.addSourceFilesAtPaths(glob);
    } catch (error) {
      console.error(`Error adding files from glob: ${glob}`, error);
      return [];
    }
  }
  
  /**
   * Analyze source files to extract entities and relationships
   */
  public analyze(sourceFiles?: SourceFile[]): ASTInsights {
    const filesToAnalyze = sourceFiles || this.project.getSourceFiles();
    
    // Reset insights
    this.insights = {
      entities: [],
      relationships: [],
      mechanics: new Map(),
      imports: [],
      exports: [],
    };
    
    // Process each source file
    for (const sourceFile of filesToAnalyze) {
      this.processSourceFile(sourceFile);
    }
    
    // Analyze relationships after all entities are extracted
    this.analyzeRelationships(filesToAnalyze);
    
    return this.insights;
  }
  
  /**
   * Process a single source file to extract entities
   */
  private processSourceFile(sourceFile: SourceFile): void {
    const filePath = sourceFile.getFilePath();
    
    // Extract classes
    sourceFile.getClasses().forEach(classDecl => {
      this.extractClassEntity(classDecl, filePath);
    });
    
    // Extract interfaces
    sourceFile.getInterfaces().forEach(interfaceDecl => {
      this.extractInterfaceEntity(interfaceDecl, filePath);
    });
    
    // Extract functions
    sourceFile.getFunctions().forEach(functionDecl => {
      this.extractFunctionEntity(functionDecl, filePath);
    });
    
    // Extract type aliases
    sourceFile.getTypeAliases().forEach(typeAliasDecl => {
      this.extractTypeAliasEntity(typeAliasDecl, filePath);
    });
    
    // Extract enums
    sourceFile.getEnums().forEach(enumDecl => {
      this.extractEnumEntity(enumDecl, filePath);
    });
    
    // Extract top-level variables
    sourceFile.getVariableDeclarations().forEach(varDecl => {
      this.extractVariableEntity(varDecl, filePath);
    });
    
    // Extract imports and exports
    this.extractImportsExports(sourceFile);
  }
  
  /**
   * Extract a class entity from AST
   */
  private extractClassEntity(classDecl: ClassDeclaration, filePath: string): void {
    const name = classDecl.getName() || 'AnonymousClass';
    const startLine = classDecl.getStartLineNumber();
    const endLine = classDecl.getEndLineNumber();
    const id = `class:${name}:${filePath}:${startLine}`;
    
    // Extract properties and methods
    const properties = classDecl.getProperties().map(prop => prop.getName());
    const methods = classDecl.getMethods().map(method => method.getName());
    
    // Create entity
    const entity: CodeEntity = {
      id,
      name,
      type: 'class',
      filePath,
      startLine,
      endLine,
      properties,
      methods,
    };
    
    // Add description from JSDoc if available
    const jsDocs = classDecl.getJsDocs();
    if (jsDocs.length > 0) {
      entity.description = jsDocs[0].getDescription().trim();
    }
    
    this.insights.entities.push(entity);
    
    // Process methods and properties separately
    classDecl.getMethods().forEach(method => {
      this.extractMethodEntity(method, filePath, id);
    });
    
    classDecl.getProperties().forEach(prop => {
      this.extractPropertyEntity(prop, filePath, id);
    });
  }
  
  /**
   * Extract an interface entity from AST
   */
  private extractInterfaceEntity(interfaceDecl: InterfaceDeclaration, filePath: string): void {
    const name = interfaceDecl.getName() || 'AnonymousInterface';
    const startLine = interfaceDecl.getStartLineNumber();
    const endLine = interfaceDecl.getEndLineNumber();
    const id = `interface:${name}:${filePath}:${startLine}`;
    
    // Extract properties and methods
    const properties = interfaceDecl.getProperties().map(prop => prop.getName());
    const methods = interfaceDecl.getMethods().map(method => method.getName());
    
    // Create entity
    const entity: CodeEntity = {
      id,
      name,
      type: 'interface',
      filePath,
      startLine,
      endLine,
      properties,
      methods,
    };
    
    // Add description from JSDoc if available
    const jsDocs = interfaceDecl.getJsDocs();
    if (jsDocs.length > 0) {
      entity.description = jsDocs[0].getDescription().trim();
    }
    
    this.insights.entities.push(entity);
  }
  
  /**
   * Extract a function entity from AST
   */
  private extractFunctionEntity(functionDecl: FunctionDeclaration, filePath: string): void {
    const name = functionDecl.getName() || 'AnonymousFunction';
    const startLine = functionDecl.getStartLineNumber();
    const endLine = functionDecl.getEndLineNumber();
    const id = `function:${name}:${filePath}:${startLine}`;
    
    // Create entity
    const entity: CodeEntity = {
      id,
      name,
      type: 'function',
      filePath,
      startLine,
      endLine,
    };
    
    // Add description from JSDoc if available
    const jsDocs = functionDecl.getJsDocs();
    if (jsDocs.length > 0) {
      entity.description = jsDocs[0].getDescription().trim();
    }
    
    this.insights.entities.push(entity);
  }
  
  /**
   * Extract a method entity from AST
   */
  private extractMethodEntity(methodDecl: MethodDeclaration, filePath: string, parentId: string): void {
    const name = methodDecl.getName();
    const startLine = methodDecl.getStartLineNumber();
    const endLine = methodDecl.getEndLineNumber();
    const id = `method:${name}:${filePath}:${startLine}`;
    
    // Create entity
    const entity: CodeEntity = {
      id,
      name,
      type: 'method',
      filePath,
      startLine,
      endLine,
      parentId,
    };
    
    // Add description from JSDoc if available
    const jsDocs = methodDecl.getJsDocs();
    if (jsDocs.length > 0) {
      entity.description = jsDocs[0].getDescription().trim();
    }
    
    this.insights.entities.push(entity);
    
    // Add relationship to parent
    this.insights.relationships.push({
      id: `rel:${id}:${parentId}`,
      sourceId: id,
      targetId: parentId,
      type: 'member-of',
    });
  }
  
  /**
   * Extract a property entity from AST
   */
  private extractPropertyEntity(propertyDecl: PropertyDeclaration, filePath: string, parentId: string): void {
    const name = propertyDecl.getName();
    const startLine = propertyDecl.getStartLineNumber();
    const endLine = propertyDecl.getEndLineNumber();
    const id = `property:${name}:${filePath}:${startLine}`;
    
    // Create entity
    const entity: CodeEntity = {
      id,
      name,
      type: 'property',
      filePath,
      startLine,
      endLine,
      parentId,
    };
    
    // Add description from JSDoc if available
    const jsDocs = propertyDecl.getJsDocs();
    if (jsDocs.length > 0) {
      entity.description = jsDocs[0].getDescription().trim();
    }
    
    this.insights.entities.push(entity);
    
    // Add relationship to parent
    this.insights.relationships.push({
      id: `rel:${id}:${parentId}`,
      sourceId: id,
      targetId: parentId,
      type: 'member-of',
    });
  }
  
  /**
   * Extract a variable entity from AST
   */
  private extractVariableEntity(varDecl: VariableDeclaration, filePath: string): void {
    const name = varDecl.getName();
    const startLine = varDecl.getStartLineNumber();
    const endLine = varDecl.getEndLineNumber();
    const id = `variable:${name}:${filePath}:${startLine}`;
    
    // Create entity
    const entity: CodeEntity = {
      id,
      name,
      type: 'variable',
      filePath,
      startLine,
      endLine,
    };
    
    // Add description from JSDoc if available
    const parent = varDecl.getParent().getParent();
    if (Node.isVariableStatement(parent)) {
      const jsDocs = parent.getJsDocs();
      if (jsDocs.length > 0) {
        entity.description = jsDocs[0].getDescription().trim();
      }
    }
    
    this.insights.entities.push(entity);
  }
  
  /**
   * Extract a type alias entity from AST
   */
  private extractTypeAliasEntity(typeAliasDecl: TypeAliasDeclaration, filePath: string): void {
    const name = typeAliasDecl.getName();
    const startLine = typeAliasDecl.getStartLineNumber();
    const endLine = typeAliasDecl.getEndLineNumber();
    const id = `type:${name}:${filePath}:${startLine}`;
    
    // Create entity
    const entity: CodeEntity = {
      id,
      name,
      type: 'type',
      filePath,
      startLine,
      endLine,
    };
    
    // Add description from JSDoc if available
    const jsDocs = typeAliasDecl.getJsDocs();
    if (jsDocs.length > 0) {
      entity.description = jsDocs[0].getDescription().trim();
    }
    
    this.insights.entities.push(entity);
  }
  
  /**
   * Extract an enum entity from AST
   */
  private extractEnumEntity(enumDecl: EnumDeclaration, filePath: string): void {
    const name = enumDecl.getName();
    const startLine = enumDecl.getStartLineNumber();
    const endLine = enumDecl.getEndLineNumber();
    const id = `enum:${name}:${filePath}:${startLine}`;
    
    // Extract members
    const properties = enumDecl.getMembers().map(member => member.getName());
    
    // Create entity
    const entity: CodeEntity = {
      id,
      name,
      type: 'enum',
      filePath,
      startLine,
      endLine,
      properties,
    };
    
    // Add description from JSDoc if available
    const jsDocs = enumDecl.getJsDocs();
    if (jsDocs.length > 0) {
      entity.description = jsDocs[0].getDescription().trim();
    }
    
    this.insights.entities.push(entity);
  }
  
  /**
   * Extract imports and exports from a source file
   */
  private extractImportsExports(sourceFile: SourceFile): void {
    // Extract imports
    const imports = sourceFile.getImportDeclarations().map(importDecl => {
      return {
        moduleSpecifier: importDecl.getModuleSpecifierValue(),
        isTypeOnly: importDecl.isTypeOnly(),
        namedImports: importDecl.getNamedImports().map(named => named.getName()),
        defaultImport: importDecl.getDefaultImport()?.getText(),
        filePath: sourceFile.getFilePath(),
      };
    });
    
    // Extract exports
    const exports = sourceFile.getExportDeclarations().map(exportDecl => {
      return {
        moduleSpecifier: exportDecl.getModuleSpecifierValue(),
        isTypeOnly: exportDecl.isTypeOnly(),
        namedExports: exportDecl.getNamedExports().map(named => named.getName()),
        filePath: sourceFile.getFilePath(),
      };
    });
    
    this.insights.imports.push(...imports);
    this.insights.exports.push(...exports);
  }
  
  /**
   * Analyze relationships between entities
   */
  private analyzeRelationships(sourceFiles: SourceFile[]): void {
    // Find inheritance relationships (extends/implements)
    sourceFiles.forEach(sourceFile => {
      // Analyze class inheritance
      sourceFile.getClasses().forEach(classDecl => {
        // Check 'extends' clause
        const extendsClauses = classDecl.getExtends();
        if (extendsClauses) {
          const className = classDecl.getName() || 'AnonymousClass';
          const classId = `class:${className}:${sourceFile.getFilePath()}:${classDecl.getStartLineNumber()}`;
          
          const extendsName = extendsClauses.getText();
          const targetEntity = this.findEntityByName(extendsName);
          
          if (targetEntity) {
            this.insights.relationships.push({
              id: `rel:extends:${classId}:${targetEntity.id}`,
              sourceId: classId,
              targetId: targetEntity.id,
              type: 'extends',
              description: `${className} extends ${extendsName}`,
            });
          }
        }
        
        // Check 'implements' clauses
        const implementsClauses = classDecl.getImplements();
        if (implementsClauses.length > 0) {
          const className = classDecl.getName() || 'AnonymousClass';
          const classId = `class:${className}:${sourceFile.getFilePath()}:${classDecl.getStartLineNumber()}`;
          
          implementsClauses.forEach(implementsClause => {
            const interfaceName = implementsClause.getText();
            const targetEntity = this.findEntityByName(interfaceName);
            
            if (targetEntity) {
              this.insights.relationships.push({
                id: `rel:implements:${classId}:${targetEntity.id}`,
                sourceId: classId,
                targetId: targetEntity.id,
                type: 'implements',
                description: `${className} implements ${interfaceName}`,
              });
            }
          });
        }
      });
      
      // Analyze interface inheritance
      sourceFile.getInterfaces().forEach(interfaceDecl => {
        // Check 'extends' clauses
        const extendsClauses = interfaceDecl.getExtends();
        if (extendsClauses.length > 0) {
          const interfaceName = interfaceDecl.getName() || 'AnonymousInterface';
          const interfaceId = `interface:${interfaceName}:${sourceFile.getFilePath()}:${interfaceDecl.getStartLineNumber()}`;
          
          extendsClauses.forEach(extendsClause => {
            const parentName = extendsClause.getText();
            const targetEntity = this.findEntityByName(parentName);
            
            if (targetEntity) {
              this.insights.relationships.push({
                id: `rel:extends:${interfaceId}:${targetEntity.id}`,
                sourceId: interfaceId,
                targetId: targetEntity.id,
                type: 'extends',
                description: `${interfaceName} extends ${parentName}`,
              });
            }
          });
        }
      });
    });
    
    // Extract method calls and references
    sourceFiles.forEach(sourceFile => {
      sourceFile.forEachDescendant(node => {
        if (Node.isCallExpression(node)) {
          const expression = node.getExpression();
          const expressionText = expression.getText();
          
          // Find the entity being called
          const targetEntity = this.findEntityByName(expressionText);
          if (targetEntity) {
            // Find the containing entity
            const containingEntity = this.findContainingEntity(node);
            if (containingEntity) {
              this.insights.relationships.push({
                id: `rel:calls:${containingEntity.id}:${targetEntity.id}:${node.getStartLineNumber()}`,
                sourceId: containingEntity.id,
                targetId: targetEntity.id,
                type: 'calls',
                description: `${containingEntity.name} calls ${targetEntity.name}`,
              });
            }
          }
        }
      });
    });
  }
  
  /**
   * Find an entity by name
   */
  private findEntityByName(name: string): CodeEntity | undefined {
    // Remove any generic parameters
    const simpleName = name.split('<')[0].trim();
    
    // Handle property access expressions (e.g., this.something)
    const parts = simpleName.split('.');
    const lastName = parts[parts.length - 1];
    
    return this.insights.entities.find(entity => 
      entity.name === simpleName || entity.name === lastName);
  }
  
  /**
   * Find the entity containing a node
   */
  private findContainingEntity(node: Node): CodeEntity | undefined {
    let current: Node | undefined = node;
    
    while (current) {
      if (Node.isClassDeclaration(current) || 
          Node.isMethodDeclaration(current) || 
          Node.isFunctionDeclaration(current)) {
        const name = current.getName() || 'Anonymous';
        const filePath = current.getSourceFile().getFilePath();
        const startLine = current.getStartLineNumber();
        
        const type = Node.isClassDeclaration(current) ? 'class' : 
                   Node.isMethodDeclaration(current) ? 'method' : 'function';
        
        const id = `${type}:${name}:${filePath}:${startLine}`;
        
        return this.insights.entities.find(entity => entity.id === id);
      }
      
      current = current.getParent();
    }
    
    return undefined;
  }
  
  /**
   * Analyze card game mechanics specifically
   */
  public analyzeCardMechanics(): void {
    const entities = this.insights.entities;
    const mechanics = new Map<string, any>();
    
    // Look for card-related classes
    const cardClasses = entities.filter(entity => 
      entity.type === 'class' && 
      (entity.name.includes('Card') || 
       entity.name.includes('Deck') || 
       entity.name.includes('Game'))
    );
    
    // Extract mechanic-related methods and properties
    cardClasses.forEach(cardClass => {
      // Find all methods of this class
      const methods = entities.filter(entity => 
        entity.type === 'method' && entity.parentId === cardClass.id);
      
      // Find methods related to game mechanics
      const mechanicMethods = methods.filter(method => 
        method.name.includes('play') || 
        method.name.includes('draw') || 
        method.name.includes('attack') || 
        method.name.includes('damage') || 
        method.name.includes('heal') || 
        method.name.includes('summon') || 
        method.name.includes('destroy') || 
        method.name.includes('discard') || 
        method.name.includes('discover')
      );
      
      // Create mechanics map
      mechanicMethods.forEach(method => {
        mechanics.set(method.name, {
          class: cardClass.name,
          methodName: method.name,
          description: method.description || `Method ${method.name} in class ${cardClass.name}`,
          filePath: method.filePath,
          startLine: method.startLine,
          endLine: method.endLine,
        });
      });
    });
    
    this.insights.mechanics = mechanics;
  }
  
  /**
   * Get the extracted insights
   */
  public getInsights(): ASTInsights {
    return this.insights;
  }
}

export default ASTAnalyzer;