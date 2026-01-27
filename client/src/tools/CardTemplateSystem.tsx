import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select } from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { CardData } from '../game/types';
import { ScrollArea } from '../components/ui/scroll-area';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Checkbox } from '../components/ui/checkbox';
import { Textarea } from '../components/ui/textarea';
import { Switch } from '../components/ui/switch';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../components/ui/accordion';

interface CardTemplateSystemProps {
  cards: CardData[];
  onCardsSave: (cards: CardData[]) => void;
}

interface CardTemplate {
  id: string;
  name: string;
  description: string;
  baseCard: CardData;
  variables: TemplateVariable[];
  createdCards: CardData[];
}

interface TemplateVariable {
  id: string;
  name: string;
  description: string;
  type: 'number' | 'text' | 'select' | 'boolean';
  defaultValue: any;
  options?: string[];
  min?: number;
  max?: number;
  affectsFields: string[];
}

export default function CardTemplateSystem({ cards, onCardsSave }: CardTemplateSystemProps) {
  const [templates, setTemplates] = useState<CardTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<CardTemplate | null>(null);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredCards, setFilteredCards] = useState<CardData[]>([]);
  const [selectedBaseCard, setSelectedBaseCard] = useState<CardData | null>(null);
  const [variableValues, setVariableValues] = useState<Record<string, any>>({});
  const [previewCard, setPreviewCard] = useState<CardData | null>(null);
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);
  const [newVariable, setNewVariable] = useState<Partial<TemplateVariable>>({
    id: '',
    name: '',
    description: '',
    type: 'number',
    defaultValue: 0,
    affectsFields: [],
  });
  const [selectedEditVariable, setSelectedEditVariable] = useState<TemplateVariable | null>(null);
  const [cardBatchSize, setCardBatchSize] = useState(1);
  const [batchSettings, setBatchSettings] = useState<{
    incrementField: string;
    startValue: number;
    stepSize: number;
    namingPattern: string;
  }>({
    incrementField: '',
    startValue: 0,
    stepSize: 1,
    namingPattern: '{name} {num}',
  });
  const [batchPreview, setBatchPreview] = useState<CardData[]>([]);
  const [activeTab, setActiveTab] = useState('template-selection');

  useEffect(() => {
    let filtered = [...cards];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (card) =>
          card.name.toLowerCase().includes(term) ||
          card.description.toLowerCase().includes(term) ||
          (card.type && card.type.toLowerCase().includes(term)) ||
          (card.heroClass && card.heroClass.toLowerCase().includes(term))
      );
    }

    // Only show collectible cards as base cards
    filtered = filtered.filter((card) => card.collectible);

    setFilteredCards(filtered);
  }, [cards, searchTerm]);

  useEffect(() => {
    if (selectedTemplate) {
      // Initialize variable values with defaults
      const initialValues: Record<string, any> = {};
      selectedTemplate.variables.forEach((variable) => {
        initialValues[variable.id] = variable.defaultValue;
      });
      setVariableValues(initialValues);
      updatePreviewCard(selectedTemplate, initialValues);
    }
  }, [selectedTemplate]);

  useEffect(() => {
    if (selectedTemplate && Object.keys(variableValues).length > 0) {
      updatePreviewCard(selectedTemplate, variableValues);
      if (cardBatchSize > 1) {
        generateBatchPreview();
      }
    }
  }, [variableValues, cardBatchSize, batchSettings]);

  const createNewTemplate = () => {
    if (!newTemplateName.trim() || !selectedBaseCard) return;

    const template: CardTemplate = {
      id: `template-${Date.now()}`,
      name: newTemplateName,
      description: '',
      baseCard: { ...selectedBaseCard },
      variables: [],
      createdCards: [],
    };

    setTemplates([...templates, template]);
    setSelectedTemplate(template);
    setNewTemplateName('');
    setSelectedBaseCard(null);
    setShowTemplateEditor(true);
    setActiveTab('template-editor');
  };

  const saveTemplate = () => {
    if (!selectedTemplate) return;

    const updatedTemplates = templates.map((template) =>
      template.id === selectedTemplate.id ? selectedTemplate : template
    );

    setTemplates(updatedTemplates);
  };

  const addVariable = () => {
    if (!selectedTemplate || !newVariable.name || !newVariable.id) return;

    const variable: TemplateVariable = {
      id: newVariable.id,
      name: newVariable.name,
      description: newVariable.description || '',
      type: newVariable.type as 'number' | 'text' | 'select' | 'boolean',
      defaultValue: newVariable.defaultValue,
      options: newVariable.type === 'select' ? newVariable.options || [] : undefined,
      min: newVariable.type === 'number' ? newVariable.min : undefined,
      max: newVariable.type === 'number' ? newVariable.max : undefined,
      affectsFields: newVariable.affectsFields as string[] || [],
    };

    const updatedTemplate = {
      ...selectedTemplate,
      variables: [...selectedTemplate.variables, variable],
    };

    setSelectedTemplate(updatedTemplate);
    setNewVariable({
      id: '',
      name: '',
      description: '',
      type: 'number',
      defaultValue: 0,
      affectsFields: [],
    });
    setVariableValues({
      ...variableValues,
      [variable.id]: variable.defaultValue,
    });
  };

  const updateVariable = () => {
    if (!selectedTemplate || !selectedEditVariable) return;

    const updatedVariables = selectedTemplate.variables.map((variable) =>
      variable.id === selectedEditVariable.id ? selectedEditVariable : variable
    );

    const updatedTemplate = {
      ...selectedTemplate,
      variables: updatedVariables,
    };

    setSelectedTemplate(updatedTemplate);
    setSelectedEditVariable(null);
    
    // Update variable values if the default changed
    setVariableValues({
      ...variableValues,
      [selectedEditVariable.id]: selectedEditVariable.defaultValue,
    });
  };

  const removeVariable = (variableId: string) => {
    if (!selectedTemplate) return;

    const updatedVariables = selectedTemplate.variables.filter(
      (variable) => variable.id !== variableId
    );

    const updatedTemplate = {
      ...selectedTemplate,
      variables: updatedVariables,
    };

    setSelectedTemplate(updatedTemplate);
    
    // Remove from variable values
    const updatedValues = { ...variableValues };
    delete updatedValues[variableId];
    setVariableValues(updatedValues);
  };

  const handleVariableValueChange = (variableId: string, value: any) => {
    setVariableValues({
      ...variableValues,
      [variableId]: value,
    });
  };

  const updatePreviewCard = (template: CardTemplate, values: Record<string, any>) => {
    const baseCard = template.baseCard;
    const newCard = { ...baseCard };
    let modified = false;

    // Process each variable and apply it to the appropriate card fields
    template.variables.forEach((variable) => {
      const value = values[variable.id];
      if (value === undefined) return;

      // Apply the variable to each affected field
      variable.affectsFields.forEach((field) => {
        // Handle nested fields with dot notation (e.g., "spellEffect.value")
        if (field.includes('.')) {
          const [parent, child] = field.split('.');
          if (!newCard[parent]) {
            newCard[parent] = {};
          }
          
          if (typeof value === 'number' && variable.type === 'number') {
            newCard[parent][child] = value;
            modified = true;
          } else if (typeof value === 'string' && variable.type === 'text') {
            // Replace placeholders in string values
            if (typeof newCard[parent][child] === 'string') {
              newCard[parent][child] = newCard[parent][child].replace(`{${variable.id}}`, value);
              modified = true;
            } else {
              newCard[parent][child] = value;
              modified = true;
            }
          } else if (variable.type === 'boolean') {
            newCard[parent][child] = value;
            modified = true;
          } else if (variable.type === 'select') {
            newCard[parent][child] = value;
            modified = true;
          }
        } else {
          // Direct field
          if (typeof value === 'number' && variable.type === 'number') {
            newCard[field] = value;
            modified = true;
          } else if (typeof value === 'string' && variable.type === 'text') {
            // Replace placeholders in string values
            if (typeof newCard[field] === 'string') {
              newCard[field] = newCard[field].replace(`{${variable.id}}`, value);
              modified = true;
            } else {
              newCard[field] = value;
              modified = true;
            }
          } else if (variable.type === 'boolean') {
            newCard[field] = value;
            modified = true;
          } else if (variable.type === 'select') {
            newCard[field] = value;
            modified = true;
          }
        }
      });
    });

    // Only update if something was actually modified
    if (modified) {
      // Make sure ID is unique
      newCard.id = baseCard.id + '_preview';
      setPreviewCard(newCard);
    }
  };

  const generateBatchPreview = () => {
    if (!selectedTemplate || cardBatchSize <= 1) {
      setBatchPreview([]);
      return;
    }

    const batchCards: CardData[] = [];
    const { incrementField, startValue, stepSize, namingPattern } = batchSettings;

    for (let i = 0; i < cardBatchSize; i++) {
      // Create a modified variable value object with the incremented field
      const modifiedValues = { ...variableValues };
      
      if (incrementField && incrementField in variableValues) {
        const variableType = selectedTemplate.variables.find(v => v.id === incrementField)?.type;
        
        if (variableType === 'number') {
          modifiedValues[incrementField] = startValue + (i * stepSize);
        }
      }
      
      // Create a base card for this batch item
      const baseCard = { ...selectedTemplate.baseCard };
      
      // Apply the naming pattern for this item
      if (namingPattern && baseCard.name) {
        baseCard.name = namingPattern
          .replace('{name}', selectedTemplate.baseCard.name)
          .replace('{num}', (i + 1).toString());
      }
      
      // Create a unique id for this batch item
      baseCard.id = selectedTemplate.baseCard.id + '_batch_' + i;
      
      // Apply variables to the card
      const newCard = { ...baseCard };
      
      // Process each variable and apply it to the appropriate card fields
      selectedTemplate.variables.forEach((variable) => {
        const value = modifiedValues[variable.id];
        if (value === undefined) return;
        
        // Apply the variable to each affected field
        variable.affectsFields.forEach((field) => {
          // Handle nested fields with dot notation (e.g., "spellEffect.value")
          if (field.includes('.')) {
            const [parent, child] = field.split('.');
            if (!newCard[parent]) {
              newCard[parent] = {};
            }
            
            newCard[parent][child] = value;
          } else {
            // Direct field
            newCard[field] = value;
          }
        });
      });
      
      batchCards.push(newCard);
    }
    
    setBatchPreview(batchCards);
  };

  const createCards = () => {
    if (!selectedTemplate || !previewCard) return;

    // If it's a batch creation, use the batch preview cards
    if (cardBatchSize > 1 && batchPreview.length > 0) {
      // Create actual cards with real IDs
      const newCards = batchPreview.map((card, index) => {
        // Generate a new unique ID that doesn't conflict with existing cards
        const highestId = Math.max(...cards.map(c => c.id), 0);
        return {
          ...card,
          id: highestId + 1 + index
        };
      });
      
      // Add cards to the template's created cards list
      const updatedTemplate = {
        ...selectedTemplate,
        createdCards: [...selectedTemplate.createdCards, ...newCards]
      };
      
      setSelectedTemplate(updatedTemplate);
      
      // Save the template
      const updatedTemplates = templates.map(template =>
        template.id === updatedTemplate.id ? updatedTemplate : template
      );
      setTemplates(updatedTemplates);
      
      // Send all the new cards to the parent component
      onCardsSave([...cards, ...newCards]);
      
      // Show success message
      alert(`Successfully created ${newCards.length} cards from template!`);
    } else {
      // Single card creation
      // Generate a new unique ID that doesn't conflict with existing cards
      const highestId = Math.max(...cards.map(c => c.id), 0);
      const newCard = {
        ...previewCard,
        id: highestId + 1
      };
      
      // Add card to the template's created cards list
      const updatedTemplate = {
        ...selectedTemplate,
        createdCards: [...selectedTemplate.createdCards, newCard]
      };
      
      setSelectedTemplate(updatedTemplate);
      
      // Save the template
      const updatedTemplates = templates.map(template =>
        template.id === updatedTemplate.id ? updatedTemplate : template
      );
      setTemplates(updatedTemplates);
      
      // Send the new card to the parent component
      onCardsSave([...cards, newCard]);
      
      // Show success message
      alert(`Successfully created card "${newCard.name}" from template!`);
    }
  };

  const getCardFieldOptions = () => {
    if (!selectedBaseCard) return [];
    
    // Get all possible fields and nested fields from the base card
    const fields: string[] = [];
    
    // Helper function to recursively find all paths in an object
    const findPaths = (obj: any, currentPath: string = '') => {
      if (!obj || typeof obj !== 'object') return;
      
      Object.keys(obj).forEach(key => {
        const newPath = currentPath ? `${currentPath}.${key}` : key;
        
        // Add path to fields (only include certain types that make sense to template)
        const value = obj[key];
        if (
          typeof value === 'string' || 
          typeof value === 'number' || 
          typeof value === 'boolean'
        ) {
          fields.push(newPath);
        }
        
        // Recurse for nested objects, but only go one level deep
        if (typeof value === 'object' && value !== null && !currentPath) {
          findPaths(value, key);
        }
      });
    };
    
    findPaths(selectedBaseCard);
    
    // Add common fields that should always be available
    const commonFields = [
      'name', 'manaCost', 'attack', 'health',
      'description', 'spellEffect.value', 'battlecry.value'
    ];
    
    return [...new Set([...fields, ...commonFields])].sort();
  };
  
  return (
    <div className="grid grid-cols-12 gap-4 p-4 h-screen">
      {/* Left sidebar - Template management */}
      <div className="col-span-3 bg-gray-100 rounded-lg p-4 flex flex-col">
        <h2 className="text-lg font-bold mb-4">Card Templates</h2>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="mb-4">
            <TabsTrigger value="template-selection">
              Templates
            </TabsTrigger>
            {selectedTemplate && (
              <TabsTrigger value="template-editor">
                Editor
              </TabsTrigger>
            )}
          </TabsList>
          
          <TabsContent value="template-selection" className="flex-1 flex flex-col">
            {templates.length > 0 ? (
              <ScrollArea className="flex-1 -mx-2">
                <div className="space-y-2 p-2">
                  {templates.map((template) => (
                    <div
                      key={template.id}
                      className={`p-3 border rounded cursor-pointer hover:bg-gray-200 ${
                        selectedTemplate?.id === template.id ? 'bg-blue-100 border-blue-500' : 'border-gray-200'
                      }`}
                      onClick={() => setSelectedTemplate(template)}
                    >
                      <div className="font-medium">{template.name}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        Base Card: {template.baseCard.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        Variables: {template.variables.length} • 
                        Created Cards: {template.createdCards.length}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
                <p className="text-center mb-4">No templates yet</p>
              </div>
            )}
            
            <div className="mt-4 pt-4 border-t border-gray-200">
              <h3 className="font-semibold mb-2">Create New Template</h3>
              <Input
                placeholder="Template Name"
                value={newTemplateName}
                onChange={(e) => setNewTemplateName(e.target.value)}
                className="mb-2"
              />
              <p className="text-xs text-gray-500 mb-2">
                Select a base card from your collection:
              </p>
              <Input
                placeholder="Search cards..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="mb-2"
              />
              
              <div className="max-h-40 overflow-y-auto border rounded bg-white mb-3">
                {filteredCards.length > 0 ? (
                  filteredCards.map((card) => (
                    <div
                      key={card.id}
                      className={`p-2 border-b text-sm cursor-pointer hover:bg-gray-100 ${
                        selectedBaseCard?.id === card.id ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => setSelectedBaseCard(card)}
                    >
                      <div className="flex justify-between">
                        <span>{card.name}</span>
                        <span>{card.manaCost}</span>
                      </div>
                      <div className="text-xs text-gray-500">
                        {card.type} • {card.heroClass}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-3 text-center text-gray-500">
                    No cards match your search
                  </div>
                )}
              </div>
              
              <Button
                onClick={createNewTemplate}
                disabled={!newTemplateName.trim() || !selectedBaseCard}
                className="w-full"
              >
                Create Template
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="template-editor" className="flex-1 flex flex-col">
            {selectedTemplate && (
              <>
                <div className="mb-4">
                  <h3 className="font-semibold text-lg">{selectedTemplate.name}</h3>
                  <div className="text-sm text-gray-500">
                    Based on: {selectedTemplate.baseCard.name}
                  </div>
                </div>
                
                <div className="mb-4">
                  <Label>Template Description</Label>
                  <Textarea
                    className="mt-1"
                    value={selectedTemplate.description}
                    onChange={(e) => setSelectedTemplate({
                      ...selectedTemplate,
                      description: e.target.value
                    })}
                    rows={2}
                  />
                </div>
                
                <div className="mb-4">
                  <h4 className="font-medium mb-2">Template Variables</h4>
                  
                  {selectedTemplate.variables.length > 0 ? (
                    <div className="space-y-2">
                      {selectedTemplate.variables.map((variable) => (
                        <div
                          key={variable.id}
                          className="border rounded p-2 bg-white"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-medium">{variable.name}</div>
                              <div className="text-xs text-gray-500">{variable.description}</div>
                            </div>
                            <Badge>{variable.type}</Badge>
                          </div>
                          
                          <div className="mt-2 flex justify-between text-xs text-gray-600">
                            <div>Default: {variable.defaultValue.toString()}</div>
                            <div>
                              Affects: {variable.affectsFields.join(', ')}
                            </div>
                          </div>
                          
                          <div className="mt-2 flex justify-end space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedEditVariable(variable)}
                            >
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => removeVariable(variable.id)}
                            >
                              Remove
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-gray-500 border rounded bg-gray-50">
                      No variables defined yet
                    </div>
                  )}
                </div>
                
                <Accordion type="single" collapsible className="mb-4">
                  <AccordionItem value="add-variable">
                    <AccordionTrigger>Add New Variable</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-3 mt-2">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label htmlFor="variable-id">Variable ID</Label>
                            <Input
                              id="variable-id"
                              placeholder="e.g., damageAmount"
                              value={newVariable.id}
                              onChange={(e) => setNewVariable({
                                ...newVariable,
                                id: e.target.value
                              })}
                            />
                          </div>
                          <div>
                            <Label htmlFor="variable-name">Display Name</Label>
                            <Input
                              id="variable-name"
                              placeholder="e.g., Damage Amount"
                              value={newVariable.name}
                              onChange={(e) => setNewVariable({
                                ...newVariable,
                                name: e.target.value
                              })}
                            />
                          </div>
                        </div>
                        
                        <div>
                          <Label htmlFor="variable-desc">Description</Label>
                          <Input
                            id="variable-desc"
                            placeholder="Brief description of what this variable does"
                            value={newVariable.description}
                            onChange={(e) => setNewVariable({
                              ...newVariable,
                              description: e.target.value
                            })}
                          />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label htmlFor="variable-type">Type</Label>
                            <Select
                              value={newVariable.type}
                              onValueChange={(value) => setNewVariable({
                                ...newVariable,
                                type: value,
                                defaultValue: value === 'number' ? 0 : 
                                             value === 'boolean' ? false : 
                                             value === 'select' ? '' : ''
                              })}
                            >
                              <option value="number">Number</option>
                              <option value="text">Text</option>
                              <option value="select">Select</option>
                              <option value="boolean">Boolean</option>
                            </Select>
                          </div>
                          
                          <div>
                            <Label htmlFor="variable-default">Default Value</Label>
                            {newVariable.type === 'number' && (
                              <Input
                                id="variable-default"
                                type="number"
                                value={newVariable.defaultValue || 0}
                                onChange={(e) => setNewVariable({
                                  ...newVariable,
                                  defaultValue: parseInt(e.target.value)
                                })}
                              />
                            )}
                            {newVariable.type === 'text' && (
                              <Input
                                id="variable-default"
                                value={newVariable.defaultValue || ''}
                                onChange={(e) => setNewVariable({
                                  ...newVariable,
                                  defaultValue: e.target.value
                                })}
                              />
                            )}
                            {newVariable.type === 'select' && (
                              <Input
                                id="variable-default"
                                value={newVariable.defaultValue || ''}
                                onChange={(e) => setNewVariable({
                                  ...newVariable,
                                  defaultValue: e.target.value
                                })}
                              />
                            )}
                            {newVariable.type === 'boolean' && (
                              <div className="flex items-center space-x-2 h-10 mt-1">
                                <Switch
                                  id="variable-default"
                                  checked={!!newVariable.defaultValue}
                                  onCheckedChange={(checked) => setNewVariable({
                                    ...newVariable,
                                    defaultValue: checked
                                  })}
                                />
                                <Label htmlFor="variable-default">
                                  {newVariable.defaultValue ? 'True' : 'False'}
                                </Label>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {newVariable.type === 'number' && (
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label htmlFor="variable-min">Min Value</Label>
                              <Input
                                id="variable-min"
                                type="number"
                                value={newVariable.min || 0}
                                onChange={(e) => setNewVariable({
                                  ...newVariable,
                                  min: parseInt(e.target.value)
                                })}
                              />
                            </div>
                            <div>
                              <Label htmlFor="variable-max">Max Value</Label>
                              <Input
                                id="variable-max"
                                type="number"
                                value={newVariable.max || 10}
                                onChange={(e) => setNewVariable({
                                  ...newVariable,
                                  max: parseInt(e.target.value)
                                })}
                              />
                            </div>
                          </div>
                        )}
                        
                        {newVariable.type === 'select' && (
                          <div>
                            <Label htmlFor="variable-options">Options (comma-separated)</Label>
                            <Input
                              id="variable-options"
                              placeholder="option1, option2, option3"
                              value={newVariable.options?.join(', ') || ''}
                              onChange={(e) => setNewVariable({
                                ...newVariable,
                                options: e.target.value.split(',').map(o => o.trim())
                              })}
                            />
                          </div>
                        )}
                        
                        <div>
                          <Label htmlFor="variable-fields">Affected Card Fields</Label>
                          <div className="mt-1 grid grid-cols-2 gap-1 max-h-40 overflow-y-auto border rounded p-2">
                            {getCardFieldOptions().map((field) => (
                              <div key={field} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`field-${field}`}
                                  checked={(newVariable.affectsFields as string[])?.includes(field)}
                                  onCheckedChange={(checked) => {
                                    const currentFields = newVariable.affectsFields as string[] || [];
                                    const updatedFields = checked 
                                      ? [...currentFields, field]
                                      : currentFields.filter(f => f !== field);
                                    
                                    setNewVariable({
                                      ...newVariable,
                                      affectsFields: updatedFields
                                    });
                                  }}
                                />
                                <Label htmlFor={`field-${field}`} className="text-xs">
                                  {field}
                                </Label>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        <Button
                          onClick={addVariable}
                          disabled={
                            !newVariable.id || 
                            !newVariable.name || 
                            (newVariable.affectsFields as string[])?.length === 0
                          }
                        >
                          Add Variable
                        </Button>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
                
                <div className="mt-auto pt-4 border-t border-gray-200">
                  <Button onClick={saveTemplate} className="w-full">
                    Save Template
                  </Button>
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Middle content - Variable controls and card preview */}
      <div className="col-span-5 bg-white rounded-lg p-4 flex flex-col">
        <h2 className="text-lg font-bold mb-4">Card Generator</h2>
        
        {selectedTemplate ? (
          <>
            <div className="mb-4 p-3 bg-blue-50 rounded">
              <h3 className="font-semibold">{selectedTemplate.name}</h3>
              {selectedTemplate.description && (
                <p className="mt-1 text-sm">{selectedTemplate.description}</p>
              )}
              <div className="text-xs text-gray-500 mt-2">
                Base Card: {selectedTemplate.baseCard.name} • 
                Variables: {selectedTemplate.variables.length}
              </div>
            </div>
            
            {selectedTemplate.variables.length > 0 ? (
              <div className="space-y-4 mb-6">
                <h3 className="font-semibold">Adjust Variables</h3>
                
                {selectedTemplate.variables.map((variable) => (
                  <div key={variable.id} className="p-3 border rounded">
                    <Label htmlFor={`var-${variable.id}`}>{variable.name}</Label>
                    {variable.description && (
                      <p className="text-xs text-gray-500 mb-2">{variable.description}</p>
                    )}
                    
                    {variable.type === 'number' && (
                      <Input
                        id={`var-${variable.id}`}
                        type="number"
                        min={variable.min}
                        max={variable.max}
                        value={variableValues[variable.id] || 0}
                        onChange={(e) => 
                          handleVariableValueChange(variable.id, parseInt(e.target.value))
                        }
                      />
                    )}
                    
                    {variable.type === 'text' && (
                      <Input
                        id={`var-${variable.id}`}
                        value={variableValues[variable.id] || ''}
                        onChange={(e) => 
                          handleVariableValueChange(variable.id, e.target.value)
                        }
                      />
                    )}
                    
                    {variable.type === 'select' && variable.options && (
                      <Select
                        value={variableValues[variable.id] || ''}
                        onValueChange={(value) => 
                          handleVariableValueChange(variable.id, value)
                        }
                      >
                        {variable.options.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </Select>
                    )}
                    
                    {variable.type === 'boolean' && (
                      <div className="flex items-center space-x-2 mt-1">
                        <Switch
                          id={`var-${variable.id}`}
                          checked={!!variableValues[variable.id]}
                          onCheckedChange={(checked) => 
                            handleVariableValueChange(variable.id, checked)
                          }
                        />
                        <Label htmlFor={`var-${variable.id}`}>
                          {variableValues[variable.id] ? 'True' : 'False'}
                        </Label>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 bg-gray-50 rounded mb-6">
                <p className="text-gray-500">
                  This template has no variables. Add some variables to make it useful!
                </p>
              </div>
            )}
            
            <div className="mb-4">
              <h3 className="font-semibold mb-2">Batch Creation Settings</h3>
              <div className="grid grid-cols-2 gap-4 p-3 border rounded">
                <div>
                  <Label htmlFor="batch-size">Number of Cards to Create</Label>
                  <Input
                    id="batch-size"
                    type="number"
                    min="1"
                    max="20"
                    value={cardBatchSize}
                    onChange={(e) => setCardBatchSize(parseInt(e.target.value) || 1)}
                  />
                </div>
                
                {cardBatchSize > 1 && (
                  <>
                    <div>
                      <Label htmlFor="increment-field">Variable to Increment</Label>
                      <Select
                        id="increment-field"
                        value={batchSettings.incrementField}
                        onValueChange={(value) => setBatchSettings({
                          ...batchSettings,
                          incrementField: value
                        })}
                      >
                        <option value="">None</option>
                        {selectedTemplate.variables
                          .filter(v => v.type === 'number')
                          .map(v => (
                            <option key={v.id} value={v.id}>
                              {v.name}
                            </option>
                          ))
                        }
                      </Select>
                    </div>
                    
                    {batchSettings.incrementField && (
                      <>
                        <div>
                          <Label htmlFor="start-value">Start Value</Label>
                          <Input
                            id="start-value"
                            type="number"
                            value={batchSettings.startValue}
                            onChange={(e) => setBatchSettings({
                              ...batchSettings,
                              startValue: parseInt(e.target.value) || 0
                            })}
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="step-size">Step Size</Label>
                          <Input
                            id="step-size"
                            type="number"
                            value={batchSettings.stepSize}
                            onChange={(e) => setBatchSettings({
                              ...batchSettings,
                              stepSize: parseInt(e.target.value) || 1
                            })}
                          />
                        </div>
                      </>
                    )}
                    
                    <div className="col-span-2">
                      <Label htmlFor="naming-pattern">Naming Pattern</Label>
                      <Input
                        id="naming-pattern"
                        value={batchSettings.namingPattern}
                        onChange={(e) => setBatchSettings({
                          ...batchSettings,
                          namingPattern: e.target.value
                        })}
                        placeholder="{name} {num}"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Use {'{name}'} for base name and {'{num}'} for number
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
            
            <div className="mt-auto">
              <Button 
                onClick={createCards} 
                disabled={!previewCard}
                size="lg"
                className="w-full"
              >
                {cardBatchSize > 1 
                  ? `Create ${cardBatchSize} Cards` 
                  : 'Create Card'
                }
              </Button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
            <p className="text-xl">Select a template to begin</p>
            <p className="text-sm mt-2">
              Use the left panel to select or create a card template
            </p>
          </div>
        )}
      </div>

      {/* Right sidebar - Preview */}
      <div className="col-span-4 bg-gray-100 rounded-lg p-4 flex flex-col">
        <h2 className="text-lg font-bold mb-4">Card Preview</h2>
        
        {previewCard ? (
          <>
            {cardBatchSize <= 1 ? (
              // Single card preview
              <Card className="mb-4">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>{previewCard.name}</CardTitle>
                    <Badge>{previewCard.manaCost} Mana</Badge>
                  </div>
                  <CardDescription>
                    {previewCard.type} • {previewCard.heroClass} • {previewCard.rarity}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {previewCard.type === 'minion' && (
                      <div className="flex justify-between">
                        <div>
                          <span className="text-sm font-semibold">Attack:</span>{' '}
                          <span>{previewCard.attack}</span>
                        </div>
                        <div>
                          <span className="text-sm font-semibold">Health:</span>{' '}
                          <span>{previewCard.health}</span>
                        </div>
                      </div>
                    )}
                    
                    <div>
                      <span className="text-sm font-semibold">Description:</span>
                      <p className="mt-1 p-2 bg-gray-50 rounded">{previewCard.description}</p>
                    </div>
                    
                    {previewCard.keywords && previewCard.keywords.length > 0 && (
                      <div>
                        <span className="text-sm font-semibold">Keywords:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {previewCard.keywords.map((keyword) => (
                            <Badge key={keyword} variant="secondary">
                              {keyword
                                .split('_')
                                .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                                .join(' ')}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Render effects based on type */}
                    {previewCard.battlecry && (
                      <div>
                        <span className="text-sm font-semibold">Battlecry:</span>
                        <div className="mt-1 text-sm">
                          <pre className="whitespace-pre-wrap bg-gray-50 p-2 rounded text-xs">
                            {JSON.stringify(previewCard.battlecry, null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}
                    
                    {previewCard.deathrattle && (
                      <div>
                        <span className="text-sm font-semibold">Deathrattle:</span>
                        <div className="mt-1 text-sm">
                          <pre className="whitespace-pre-wrap bg-gray-50 p-2 rounded text-xs">
                            {JSON.stringify(previewCard.deathrattle, null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}
                    
                    {previewCard.spellEffect && (
                      <div>
                        <span className="text-sm font-semibold">Spell Effect:</span>
                        <div className="mt-1 text-sm">
                          <pre className="whitespace-pre-wrap bg-gray-50 p-2 rounded text-xs">
                            {JSON.stringify(previewCard.spellEffect, null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter>
                  <div className="w-full flex justify-between text-sm text-gray-500">
                    <div>ID: {previewCard.id}</div>
                    <div>Collectible: {previewCard.collectible ? 'Yes' : 'No'}</div>
                  </div>
                </CardFooter>
              </Card>
            ) : (
              // Batch preview
              <div className="mb-4">
                <h3 className="font-semibold mb-2">Batch Preview ({batchPreview.length} cards)</h3>
                <ScrollArea className="h-[200px] border rounded bg-white p-2">
                  <div className="space-y-2">
                    {batchPreview.map((card, index) => (
                      <div key={index} className="border-b pb-2">
                        <div className="flex justify-between">
                          <span className="font-medium">{card.name}</span>
                          <span className="text-gray-500">{card.manaCost} Mana</span>
                        </div>
                        <div className="text-sm">{card.description}</div>
                        
                        {card.type === 'minion' && (
                          <div className="text-xs text-gray-600 mt-1">
                            {card.attack}/{card.health}
                          </div>
                        )}
                        
                        {card.type === 'spell' && card.spellEffect && 'value' in card.spellEffect && (
                          <div className="text-xs text-gray-600 mt-1">
                            Effect Value: {card.spellEffect.value}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}
            
            <div>
              <h3 className="font-semibold mb-2">Card JSON</h3>
              <Card>
                <ScrollArea className="h-[300px]">
                  <pre className="p-4 text-xs font-mono">
                    {JSON.stringify(previewCard, null, 2)}
                  </pre>
                </ScrollArea>
              </Card>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
            <p>No preview available</p>
            <p className="text-sm mt-1">
              Select a template and adjust variables to see the card preview
            </p>
          </div>
        )}
      </div>
    </div>
  );
}