// This script modifies the vite.config.ts file to disable the Replit-specific plugin
// Run it in the project root directory to patch the configuration for VSCode use

const fs = require('fs');
const path = require('path');

// Path to Vite config file
const configPath = path.join(__dirname, 'vite.config.ts');

try {
  // Read the existing config file
  let configContent = fs.readFileSync(configPath, 'utf8');
  
  // Check if the file contains the Replit plugin
  if (configContent.includes('@replit/vite-plugin-runtime-error-modal')) {
    console.log('Patching vite.config.ts to work in VSCode...');
    
    // Replace the import line
    configContent = configContent.replace(
      "import runtimeErrorOverlay from \"@replit/vite-plugin-runtime-error-modal\";", 
      "// import runtimeErrorOverlay from \"@replit/vite-plugin-runtime-error-modal\";"
    );
    
    // Replace the plugin usage
    configContent = configContent.replace(
      "runtimeErrorOverlay(),", 
      "// runtimeErrorOverlay(),"
    );
    
    // Write the updated config
    fs.writeFileSync(configPath, configContent);
    console.log('Successfully patched vite.config.ts!');
    console.log('You can now run the project with: npm run dev');
  } else {
    console.log('No Replit plugin found in vite.config.ts, no changes needed.');
  }
} catch (error) {
  console.error('Error patching vite.config.ts:', error.message);
  console.error('You may need to manually modify the file.');
  console.error('Remove or comment out any references to "@replit/vite-plugin-runtime-error-modal"');
}