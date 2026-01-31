/**
 * Remove sensitive files from GitHub repository
 * Run with: npx tsx scripts/cleanupGitHub.ts
 * 
 * This script removes Replit internal files and test scripts from GitHub
 * Uses individual file deletions to handle large repositories
 */

import { Octokit } from '@octokit/rest';

let connectionSettings: any;

async function getAccessToken() {
  if (connectionSettings && connectionSettings.settings.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
    return connectionSettings.settings.access_token;
  }
  
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=github',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  const accessToken = connectionSettings?.settings?.access_token || connectionSettings.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings || !accessToken) {
    throw new Error('GitHub not connected');
  }
  return accessToken;
}

function shouldRemove(path: string): boolean {
  // Replit internal files
  if (path === '.replit' || 
      path === 'replit.nix' || 
      path === '.replit-rules.json' || 
      path === 'replit.md' ||
      path === 'log_mapping.json' ||
      path === 'nohup.out') {
    return true;
  }
  
  // Root-level .cjs files (test scripts)
  if (path.endsWith('.cjs') && !path.includes('/')) {
    return true;
  }
  
  // Root-level .js files that are test/utility scripts (not config)
  if (!path.includes('/') && path.endsWith('.js')) {
    const configFiles = ['vite.config.js', 'postcss.config.js', 'tailwind.config.js', 
                         'drizzle.config.js', 'eslint.config.js', '.eslintrc.js'];
    if (!configFiles.includes(path)) {
      return true;
    }
  }
  
  // Database files
  if (path.endsWith('.db') || path.endsWith('.sqlite')) {
    return true;
  }
  
  // Attached assets with Replit content
  if (path.startsWith('attached_assets/Pasted--Coframe-')) {
    return true;
  }
  
  return false;
}

async function cleanupFiles() {
  const owner = 'Dhenz14';
  const repo = 'norse-mythos-card-game';
  const branch = 'main';

  console.log('🧹 Cleaning up GitHub repository...');
  console.log(`   Repository: ${owner}/${repo}`);
  console.log('');

  try {
    const accessToken = await getAccessToken();
    const octokit = new Octokit({ auth: accessToken });

    // Get current commit
    const { data: refData } = await octokit.git.getRef({
      owner,
      repo,
      ref: `heads/${branch}`,
    });
    const currentCommitSha = refData.object.sha;

    // Get the tree recursively
    const { data: commitData } = await octokit.git.getCommit({
      owner,
      repo,
      commit_sha: currentCommitSha,
    });

    const { data: treeData } = await octokit.git.getTree({
      owner,
      repo,
      tree_sha: commitData.tree.sha,
      recursive: 'true',
    });

    // Find files to remove
    const filesToRemove: string[] = [];
    
    for (const item of treeData.tree) {
      if (item.type !== 'blob' || !item.path) continue;
      if (shouldRemove(item.path)) {
        filesToRemove.push(item.path);
      }
    }

    if (filesToRemove.length === 0) {
      console.log('✅ No files to remove - repository is clean!');
      return;
    }

    console.log(`📋 Files to remove (${filesToRemove.length}):`);
    filesToRemove.slice(0, 20).forEach(f => console.log(`   - ${f}`));
    if (filesToRemove.length > 20) {
      console.log(`   ... and ${filesToRemove.length - 20} more`);
    }
    console.log('');

    // Delete files one by one
    let deleted = 0;
    let errors = 0;
    
    for (const filePath of filesToRemove) {
      try {
        // Get file SHA
        const { data: fileData } = await octokit.repos.getContent({
          owner,
          repo,
          path: filePath,
          ref: branch,
        });
        
        if (!('sha' in fileData)) continue;
        
        // Delete the file
        await octokit.repos.deleteFile({
          owner,
          repo,
          path: filePath,
          message: `Security cleanup: Remove ${filePath}`,
          sha: fileData.sha,
          branch,
        });
        
        deleted++;
        console.log(`   ✓ Deleted: ${filePath}`);
        
        // Rate limiting - small delay between deletes
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error: any) {
        errors++;
        console.log(`   ✗ Failed: ${filePath} - ${error.message}`);
      }
    }

    console.log('');
    console.log(`✅ Cleanup complete!`);
    console.log(`   Deleted: ${deleted} files`);
    if (errors > 0) {
      console.log(`   Errors: ${errors} files`);
    }
    console.log(`   URL: https://github.com/${owner}/${repo}`);

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

cleanupFiles();
