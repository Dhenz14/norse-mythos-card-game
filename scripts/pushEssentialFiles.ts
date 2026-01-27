/**
 * Push essential source files to GitHub using Octokit API
 * Focuses on client/server source code only
 */

import { Octokit } from '@octokit/rest';
import * as fs from 'fs';
import * as path from 'path';

let connectionSettings: any;

async function getAccessToken() {
  if (connectionSettings?.settings?.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
    return connectionSettings.settings.access_token;
  }
  
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) throw new Error('Token not found');

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=github',
    { headers: { 'Accept': 'application/json', 'X_REPLIT_TOKEN': xReplitToken } }
  ).then(res => res.json()).then(data => data.items?.[0]);

  return connectionSettings?.settings?.access_token || connectionSettings.settings?.oauth?.credentials?.access_token;
}

async function getGitHubClient() {
  return new Octokit({ auth: await getAccessToken() });
}

// Essential directories to include
const INCLUDE_DIRS = ['client/src', 'server', 'shared', 'scripts'];
const INCLUDE_ROOT_FILES = ['package.json', 'tsconfig.json', 'vite.config.ts', 'replit.md', 'README.md', 'drizzle.config.ts'];

function getAllFiles(dirPath: string, basePath: string = ''): { path: string; content: string }[] {
  const files: { path: string; content: string }[] = [];
  
  try {
    const items = fs.readdirSync(dirPath);
    
    for (const item of items) {
      if (item === 'node_modules' || item === '.git' || item === 'dist') continue;
      
      const fullPath = path.join(dirPath, item);
      const relativePath = basePath ? `${basePath}/${item}` : item;
      
      try {
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          files.push(...getAllFiles(fullPath, relativePath));
        } else if (stat.isFile() && stat.size < 500000) {
          const content = fs.readFileSync(fullPath);
          if (!content.includes(0x00)) {
            files.push({ path: relativePath, content: content.toString('base64') });
          }
        }
      } catch {}
    }
  } catch {}
  
  return files;
}

async function main() {
  console.log('🚀 Starting focused GitHub push...\n');
  
  const octokit = await getGitHubClient();
  const { data: user } = await octokit.users.getAuthenticated();
  console.log(`✅ Authenticated as: ${user.login}`);
  
  const owner = user.login;
  const repo = 'norse-mythos-card-game';
  
  // Collect files from essential directories
  console.log('\n📁 Collecting essential files...');
  let allFiles: { path: string; content: string }[] = [];
  
  for (const dir of INCLUDE_DIRS) {
    if (fs.existsSync(dir)) {
      const dirFiles = getAllFiles(dir, dir);
      console.log(`  ${dir}: ${dirFiles.length} files`);
      allFiles.push(...dirFiles);
    }
  }
  
  // Add root config files
  for (const file of INCLUDE_ROOT_FILES) {
    if (fs.existsSync(file)) {
      try {
        const content = fs.readFileSync(file);
        allFiles.push({ path: file, content: content.toString('base64') });
      } catch {}
    }
  }
  
  console.log(`\n📊 Total: ${allFiles.length} files to upload`);
  
  // Get current state
  let latestCommitSha: string | undefined;
  let treeSha: string | undefined;
  
  try {
    const { data: ref } = await octokit.git.getRef({ owner, repo, ref: 'heads/main' });
    latestCommitSha = ref.object.sha;
    const { data: commit } = await octokit.git.getCommit({ owner, repo, commit_sha: latestCommitSha });
    treeSha = commit.tree.sha;
    console.log(`📌 Base commit: ${latestCommitSha.slice(0, 7)}`);
  } catch {
    console.log('📌 Creating fresh repository');
  }
  
  // Create blobs in batches
  console.log('\n📤 Uploading files...');
  const treeItems: any[] = [];
  
  for (let i = 0; i < allFiles.length; i++) {
    const file = allFiles[i];
    try {
      const { data: blob } = await octokit.git.createBlob({
        owner, repo,
        content: file.content,
        encoding: 'base64'
      });
      
      treeItems.push({
        path: file.path,
        mode: '100644',
        type: 'blob',
        sha: blob.sha
      });
      
      if ((i + 1) % 100 === 0) {
        console.log(`  Progress: ${i + 1}/${allFiles.length}`);
      }
    } catch (e: any) {
      // Skip failed files silently
    }
  }
  
  console.log(`✅ Uploaded ${treeItems.length} files`);
  
  // Create tree and commit
  console.log('\n🌲 Creating commit...');
  const { data: tree } = await octokit.git.createTree({
    owner, repo,
    tree: treeItems,
    base_tree: treeSha
  });
  
  const { data: newCommit } = await octokit.git.createCommit({
    owner, repo,
    message: 'Update: Norse Mythos Card Game with unified tooltip system',
    tree: tree.sha,
    parents: latestCommitSha ? [latestCommitSha] : []
  });
  
  // Update branch
  try {
    await octokit.git.updateRef({ owner, repo, ref: 'heads/main', sha: newCommit.sha, force: true });
  } catch {
    await octokit.git.createRef({ owner, repo, ref: 'refs/heads/main', sha: newCommit.sha });
  }
  
  console.log(`\n✅ Success! https://github.com/${owner}/${repo}`);
}

main().catch(e => console.error('Error:', e.message));
