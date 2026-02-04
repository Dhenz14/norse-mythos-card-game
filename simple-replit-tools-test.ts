/**
 * Simple Replit Tools Adapter Test
 */

import { EnhancedReplitToolsAdapter } from './server/mcp/EnhancedReplitToolsAdapter';

async function testReplitTools() {
  try {
    // Create adapter instance
    const adapter = new EnhancedReplitToolsAdapter();
    console.log('EnhancedReplitToolsAdapter initialized');
    
    // Test bash command execution
    console.log('\nTesting bash command execution:');
    const lsResult = await adapter.executeBashCommand('ls -la');
    console.log(`Command executed successfully: ${lsResult.success}`);
    console.log(`Output lines: ${lsResult.output?.split('\n').length}`);
    
    // Test code generation
    console.log('\nTesting code generation:');
    const template = 'function {{ name }}() {\n  return {{ value }};\n}';
    const replacements = {
      name: 'testFunction',
      value: '42'
    };
    
    const generatedCode = await adapter.generateCode(template, replacements);
    console.log('Generated code:');
    console.log(generatedCode);
    
    // Test interactive component creation
    console.log('\nTesting interactive component creation:');
    const cardProps = {
      title: 'Test Card',
      content: 'This is a test card content',
      buttons: [
        { label: 'OK', action: 'confirm' }
      ]
    };
    
    // We're calling the private method via any type assertion
    const cardComponent = (adapter as any).createCardComponent(cardProps);
    console.log('Card component created successfully, length:', cardComponent.length);
    
    // Test form component
    const formProps = {
      title: 'Test Form',
      fields: [
        { name: 'username', label: 'Username', type: 'text', required: true },
        { name: 'password', label: 'Password', type: 'password', required: true }
      ],
      submitAction: 'submit-form'
    };
    
    // We're calling the private method via any type assertion
    const formComponent = (adapter as any).createFormComponent(formProps);
    console.log('Form component created successfully, length:', formComponent.length);
    
    console.log('\nAll tests completed successfully!');
  } catch (error) {
    console.error('Error during testing:', error);
  }
}

console.log('Starting Replit Tools Adapter test...');
testReplitTools().catch(console.error);