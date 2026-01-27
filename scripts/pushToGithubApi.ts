/**
 * Push code to GitHub using Octokit API directly (no git commands)
 * Usage: npx tsx scripts/pushToGithubApi.ts
 */

import { Octokit } from '@octokit/rest';
import * as fs from 'fs';
import * as path from 'path';

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

async function getUncachableGitHubClient() {
  const accessToken = await getAccessToken();
  return new Octokit({ auth: accessToken });
}

// Files/directories to ignore
const IGNORE_PATTERNS = [
  'node_modules',
  '.git',
  '.cache',
  '.upm',
  '.config',
  'dist',
  '.replit',
  'replit.nix',
  '.breakpoints',
  'generated-icon.png',
  '*.log',
  '.env',
  '.env.local'
];

function shouldIgnore(filePath: string): boolean {
  const parts = filePath.split('/');
  for (const pattern of IGNORE_PATTERNS) {
    if (pattern.includes('*')) {
      const ext = pattern.replace('*', '');
      if (filePath.endsWith(ext)) return true;
    } else {
      if (parts.includes(pattern)) return true;
    }
  }
  return false;
}

function getAllFiles(dirPath: string, basePath: string = ''): { path: string; content: string }[] {
  const files: { path: string; content: string }[] = [];
  
  try {
    const items = fs.readdirSync(dirPath);
    
    for (const item of items) {
      const fullPath = path.join(dirPath, item);
      const relativePath = basePath ? `${basePath}/${item}` : item;
      
      if (shouldIgnore(relativePath)) continue;
      
      try {
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          files.push(...getAllFiles(fullPath, relativePath));
        } else if (stat.isFile() && stat.size < 1000000) { // Skip files > 1MB
          try {
            const content = fs.readFileSync(fullPath);
            // Check if binary
            const isBinary = content.includes(0x00);
            if (!isBinary) {
              files.push({
                path: relativePath,
                content: content.toString('base64')
              });
            }
          } catch {}
        }
      } catch {}
    }
  } catch {}
  
  return files;
}

async function main() {
  console.log('🚀 Starting GitHub API push process...\n');
  
  const octokit = await getUncachableGitHubClient();
  
  const { data: user } = await octokit.users.getAuthenticated();
  console.log(`✅ Authenticated as: ${user.login}`);
  
  const owner = user.login;
  const repo = 'norse-mythos-card-game';
  
  // Check if repo exists
  let repoExists = false;
  try {
    await octokit.repos.get({ owner, repo });
    repoExists = true;
    console.log(`✅ Repository exists: ${repo}`);
  } catch (e: any) {
    if (e.status === 404) {
      console.log(`📦 Creating repository: ${repo}...`);
      await octokit.repos.createForAuthenticatedUser({
        name: repo,
        description: 'Norse Mythos Card Game - A multi-mythology digital collectible card game with Hearthstone-style gameplay',
        private: false,
        auto_init: true
      });
      console.log(`✅ Repository created`);
      // Wait for repo to be ready
      await new Promise(r => setTimeout(r, 2000));
    } else {
      throw e;
    }
  }
  
  console.log('\n📁 Collecting files...');
  const files = getAllFiles('.');
  console.log(`Found ${files.length} files to upload`);
  
  // Get current commit SHA (if exists)
  let latestCommitSha: string | undefined;
  let treeSha: string | undefined;
  
  try {
    const { data: ref } = await octokit.git.getRef({
      owner,
      repo,
      ref: 'heads/main'
    });
    latestCommitSha = ref.object.sha;
    
    const { data: commit } = await octokit.git.getCommit({
      owner,
      repo,
      commit_sha: latestCommitSha
    });
    treeSha = commit.tree.sha;
    console.log(`📌 Latest commit: ${latestCommitSha.slice(0, 7)}`);
  } catch {
    console.log('📌 No existing commits found, will create initial commit');
  }
  
  // Create blobs for all files
  console.log('\n📤 Creating file blobs...');
  const treeItems: any[] = [];
  let uploaded = 0;
  
  for (const file of files) {
    try {
      const { data: blob } = await octokit.git.createBlob({
        owner,
        repo,
        content: file.content,
        encoding: 'base64'
      });
      
      treeItems.push({
        path: file.path,
        mode: '100644',
        type: 'blob',
        sha: blob.sha
      });
      
      uploaded++;
      if (uploaded % 50 === 0) {
        console.log(`  Uploaded ${uploaded}/${files.length} files...`);
      }
    } catch (e: any) {
      console.log(`  ⚠️ Skipped: ${file.path} (${e.message})`);
    }
  }
  
  console.log(`✅ Uploaded ${uploaded} files`);
  
  // Create tree
  console.log('\n🌲 Creating tree...');
  const { data: tree } = await octokit.git.createTree({
    owner,
    repo,
    tree: treeItems,
    base_tree: treeSha
  });
  
  // Create commit
  console.log('💾 Creating commit...');
  const { data: newCommit } = await octokit.git.createCommit({
    owner,
    repo,
    message: 'Norse Mythos Card Game - Full codebase with unified tooltip system',
    tree: tree.sha,
    parents: latestCommitSha ? [latestCommitSha] : []
  });
  
  // Update reference
  console.log('🔄 Updating branch reference...');
  try {
    await octokit.git.updateRef({
      owner,
      repo,
      ref: 'heads/main',
      sha: newCommit.sha,
      force: true
    });
  } catch {
    // Create the ref if it doesn't exist
    await octokit.git.createRef({
      owner,
      repo,
      ref: 'refs/heads/main',
      sha: newCommit.sha
    });
  }
  
  console.log(`\n✅ Success! Code pushed to: https://github.com/${owner}/${repo}`);
  console.log(`   Commit: ${newCommit.sha.slice(0, 7)}`);
}

main().catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
});
