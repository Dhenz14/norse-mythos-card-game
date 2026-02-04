const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'client/src/game/components/AnimationLayer.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Fix all animation.position.x and animation.position.y references
content = content.replace(/animation\.position\.x/g, 'animation.position?.x');
content = content.replace(/animation\.position\.y/g, 'animation.position?.y');

// Fix all animation.targetPosition.x and animation.targetPosition.y references without optional chaining
// but only those not already fixed
content = content.replace(/animation\.targetPosition\.x/g, 'animation.targetPosition?.x');
content = content.replace(/animation\.targetPosition\.y/g, 'animation.targetPosition?.y');

// Write the changes back to the file
fs.writeFileSync(filePath, content, 'utf8');

console.log('Fixed all animation position references in AnimationLayer.tsx');
