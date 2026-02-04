const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'client/src/game/components/AnimationLayer.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// This pattern fixes the incorrect operator precedence in expressions like:
// animation.position?.x || 0 - 30  -->  (animation.position?.x - 30) || 0
content = content.replace(/animation\.position\?\.x\s*\|\|\s*0\s*-\s*(\d+)/g, '(animation.position?.x - $1) || 0');
content = content.replace(/animation\.position\?\.y\s*\|\|\s*0\s*-\s*(\d+)/g, '(animation.position?.y - $1) || 0');
content = content.replace(/animation\.targetPosition\?\.x\s*\|\|\s*0\s*-\s*(\d+)/g, '(animation.targetPosition?.x - $1) || 0');
content = content.replace(/animation\.targetPosition\?\.y\s*\|\|\s*0\s*-\s*(\d+)/g, '(animation.targetPosition?.y - $1) || 0');

// Fix the double pipe issue in expressions like:
// animation.position?.x || 0 || 0  -->  animation.position?.x || 0
content = content.replace(/animation\.position\?\.x\s*\|\|\s*0\s*\|\|\s*0/g, 'animation.position?.x || 0');
content = content.replace(/animation\.position\?\.y\s*\|\|\s*0\s*\|\|\s*0/g, 'animation.position?.y || 0');

// Write the changes back to the file
fs.writeFileSync(filePath, content, 'utf8');

console.log('Fixed animation position references in AnimationLayer.tsx');
