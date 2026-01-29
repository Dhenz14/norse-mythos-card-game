/**
 * GitHub API Push Script - Changed Files Only
 * 
 * Pushes only recently modified files to GitHub.
 * Usage: npx tsx scripts/github-push-changes.ts
 */

import * as fs from 'fs';
import * as path from 'path';

const OWNER = 'Dhenz14';
const REPO = 'norse-mythos-card-game';
const BRANCH = 'main';

// Files that were recently changed - add files here manually
const CHANGED_FILES = [
  // Config files
  'tailwind.config.ts',
  'vercel.json',
  'replit.md',
  
  // CSS files
  'client/src/game/combat/RagnarokCombatArena.css',
  'client/src/game/combat/GameViewport.css',
  'client/src/game/combat/styles/zones.css',
  'client/src/game/combat/styles/tokens.css',
  'client/src/game/combat/styles/index.css',
  
  // Effect handlers
  'client/src/game/effects/handlers/battlecryBridge.ts',
  'client/src/game/effects/handlers/combo/buffSelfHandler.ts',
  'client/src/game/effects/handlers/spellEffect/armorHandler.ts',
  'client/src/game/effects/handlers/spellEffect/summonHandler.ts',
  
  // Modular structure files
  'client/src/game/utils/game/types.ts',
  'client/src/game/utils/game/index.ts',
  'client/src/game/utils/game/README.md',
  'client/src/game/utils/battlecry/types.ts',
  'client/src/game/utils/battlecry/index.ts',
  'client/src/game/utils/battlecry/README.md',
  'client/src/game/utils/spells/types.ts',
  'client/src/game/utils/spells/index.ts',
  'client/src/game/utils/spells/README.md',
  
  // Scripts
  'scripts/github-push.ts',
  'scripts/github-push-changes.ts'
];

async function getAccessToken(): Promise<string> {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken || !hostname) {
    throw new Error('Replit environment variables not found.');
  }

  const response = await fetch(
    `https://${hostname}/api/v2/connection?include_secrets=true&connector_names=github`,
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  );
  
  const data = await response.json();
  const settings = data.items?.[0];
  const token = settings?.settings?.access_token || settings?.settings?.oauth?.credentials?.access_token;

  if (!token) {
    throw new Error('GitHub not connected.');
  }
  
  return token;
}

async function createBlob(token: string, content: string, headers: any): Promise<string> {
  const response = await fetch(
    `https://api.github.com/repos/${OWNER}/${REPO}/git/blobs`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify({
        content,
        encoding: 'base64'
      })
    }
  );
  
  const data = await response.json();
  if (!data.sha) {
    throw new Error(`Failed to create blob: ${JSON.stringify(data)}`);
  }
  return data.sha;
}

async function pushToGitHub() {
  console.log('🚀 Pushing changed files to GitHub...\n');
  
  const token = await getAccessToken();
  console.log('✅ Got GitHub access token');
  
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/vnd.github.v3+json',
    'Content-Type': 'application/json'
  };
  
  // Get current branch ref
  const refRes = await fetch(
    `https://api.github.com/repos/${OWNER}/${REPO}/git/ref/heads/${BRANCH}`,
    { headers }
  );
  const refData = await refRes.json();
  const currentSha = refData.object.sha;
  console.log(`✅ Current ${BRANCH} SHA: ${currentSha}`);
  
  // Create tree entries for changed files
  const treeEntries: any[] = [];
  const workspaceDir = '/home/runner/workspace';
  
  for (const relativePath of CHANGED_FILES) {
    const fullPath = path.join(workspaceDir, relativePath);
    
    if (!fs.existsSync(fullPath)) {
      console.log(`  ⚠️ Skipped (not found): ${relativePath}`);
      continue;
    }
    
    try {
      const content = fs.readFileSync(fullPath);
      const base64Content = content.toString('base64');
      const sha = await createBlob(token, base64Content, headers);
      
      treeEntries.push({
        path: relativePath,
        mode: '100644',
        type: 'blob',
        sha
      });
      
      console.log(`  📤 Uploaded: ${relativePath}`);
    } catch (e: any) {
      console.log(`  ❌ Failed: ${relativePath} - ${e.message}`);
    }
  }
  
  console.log(`\n✅ Uploaded ${treeEntries.length} files`);
  
  // Create new tree
  const newTreeRes = await fetch(
    `https://api.github.com/repos/${OWNER}/${REPO}/git/trees`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify({ 
        base_tree: currentSha,
        tree: treeEntries 
      })
    }
  );
  const newTreeData = await newTreeRes.json();
  
  if (!newTreeData.sha) {
    console.error('❌ Failed to create tree:', JSON.stringify(newTreeData));
    throw new Error('Failed to create tree');
  }
  console.log(`✅ Created new tree: ${newTreeData.sha}`);
  
  // Create new commit
  const commitMessage = `Update: ${new Date().toISOString().split('T')[0]} - CSS positioning fix for community cards`;
  const newCommitRes = await fetch(
    `https://api.github.com/repos/${OWNER}/${REPO}/git/commits`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify({
        message: commitMessage,
        tree: newTreeData.sha,
        parents: [currentSha]
      })
    }
  );
  const newCommitData = await newCommitRes.json();
  
  if (!newCommitData.sha) {
    console.error('❌ Failed to create commit:', JSON.stringify(newCommitData));
    throw new Error('Failed to create commit');
  }
  console.log(`✅ Created new commit: ${newCommitData.sha}`);
  
  // Update branch ref
  const updateRefRes = await fetch(
    `https://api.github.com/repos/${OWNER}/${REPO}/git/refs/heads/${BRANCH}`,
    {
      method: 'PATCH',
      headers,
      body: JSON.stringify({
        sha: newCommitData.sha,
        force: true
      })
    }
  );
  const updateRefData = await updateRefRes.json();
  
  if (!updateRefData.object?.sha) {
    console.error('❌ Failed to update ref:', JSON.stringify(updateRefData));
    throw new Error('Failed to update branch ref');
  }
  
  console.log(`\n🎉 SUCCESS! GitHub updated to: ${updateRefData.object.sha}`);
  console.log(`📎 View at: https://github.com/${OWNER}/${REPO}`);
}

pushToGitHub().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
