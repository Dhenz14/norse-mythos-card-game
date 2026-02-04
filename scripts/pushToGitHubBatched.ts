/**
 * Batched Push to GitHub - Handles large projects with many files
 * Pushes files in batches to avoid timeout issues
 */

import { Octokit } from '@octokit/rest';
import * as fs from 'fs';
import * as path from 'path';

const FORBIDDEN_FILES = [
  '.replit', 'replit.nix', '.replit-rules.json', 'replit.md',
  'replit_push_status.json', 'log_mapping.json', 'nohup.out',
  '.env', '.env.local', '.env.production',
];

const FORBIDDEN_DIRS = [
  'node_modules', '.git', '.config', '.cache', '.replit_db', 
  '.local', '.upm', 'dist', 'build', 'attached_assets'
];

const FORBIDDEN_PATTERNS = [/\.db$/, /\.sqlite$/, /\.pem$/, /\.key$/, /\.secret$/];

function isForbidden(filePath: string): boolean {
  const fileName = path.basename(filePath);
  if (FORBIDDEN_FILES.includes(fileName)) return true;
  for (const pattern of FORBIDDEN_PATTERNS) {
    if (pattern.test(filePath)) return true;
  }
  return false;
}

function getAllFiles(dirPath: string, arrayOfFiles: string[] = []): string[] {
  const files = fs.readdirSync(dirPath);
  files.forEach((file) => {
    const fullPath = path.join(dirPath, file);
    const relativePath = path.relative(process.cwd(), fullPath);
    if (fs.statSync(fullPath).isDirectory()) {
      if (!FORBIDDEN_DIRS.includes(file)) {
        getAllFiles(fullPath, arrayOfFiles);
      }
    } else {
      if (!isForbidden(relativePath)) {
        arrayOfFiles.push(relativePath);
      }
    }
  });
  return arrayOfFiles;
}

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
  if (!xReplitToken) throw new Error('X_REPLIT_TOKEN not found');
  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=github',
    { headers: { 'Accept': 'application/json', 'X_REPLIT_TOKEN': xReplitToken } }
  ).then(res => res.json()).then(data => data.items?.[0]);
  const accessToken = connectionSettings?.settings?.access_token || connectionSettings.settings?.oauth?.credentials?.access_token;
  if (!accessToken) throw new Error('GitHub not connected');
  return accessToken;
}

const PROGRESS_FILE = 'github_push_progress.json';

function loadProgress(): number {
  try {
    if (fs.existsSync(PROGRESS_FILE)) {
      const data = JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf-8'));
      return data.lastCompletedBatch || 0;
    }
  } catch {}
  return 0;
}

function saveProgress(batchIndex: number): void {
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify({ lastCompletedBatch: batchIndex, timestamp: new Date().toISOString() }));
}

async function pushFiles() {
  const owner = 'Dhenz14';
  const repo = 'norse-mythos-card-game';
  const branch = 'main';
  const commitMessage = process.argv[2] || 'Full project sync';
  const BATCH_SIZE = 50;

  console.log('🚀 Batched Push to GitHub...');
  console.log(`   Repository: ${owner}/${repo}`);
  console.log(`   Batch size: ${BATCH_SIZE} files per commit`);

  try {
    const octokit = new Octokit({ auth: await getAccessToken() });
    const allFiles = getAllFiles(process.cwd());
    console.log(`   Total files to push: ${allFiles.length}`);

    // Split into batches
    const batches: string[][] = [];
    for (let i = 0; i < allFiles.length; i += BATCH_SIZE) {
      batches.push(allFiles.slice(i, i + BATCH_SIZE));
    }
    console.log(`   Total batches: ${batches.length}`);

    // Resume from last completed batch
    const startBatch = loadProgress();
    if (startBatch > 0) {
      console.log(`   Resuming from batch ${startBatch + 1}`);
    }

    for (let batchIndex = startBatch; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];
      console.log(`\n📦 Batch ${batchIndex + 1}/${batches.length} (${batch.length} files)`);

      // Get current commit
      const { data: refData } = await octokit.git.getRef({ owner, repo, ref: `heads/${branch}` });
      const currentCommitSha = refData.object.sha;
      const { data: commitData } = await octokit.git.getCommit({ owner, repo, commit_sha: currentCommitSha });
      const treeSha = commitData.tree.sha;

      const treeItems: any[] = [];

      for (const filePath of batch) {
        const fullPath = path.join(process.cwd(), filePath);
        if (!fs.existsSync(fullPath)) continue;

        try {
          const isText = !filePath.match(/\.(webp|png|jpg|jpeg|gif|ico|woff|woff2|ttf|eot|mp3|wav|ogg|mp4|webm)$/i);
          
          if (isText) {
            const content = fs.readFileSync(fullPath, 'utf-8');
            const { data: blob } = await octokit.git.createBlob({ owner, repo, content, encoding: 'utf-8' });
            treeItems.push({ path: filePath, mode: '100644', type: 'blob', sha: blob.sha });
          } else {
            const content = fs.readFileSync(fullPath).toString('base64');
            const { data: blob } = await octokit.git.createBlob({ owner, repo, content, encoding: 'base64' });
            treeItems.push({ path: filePath, mode: '100644', type: 'blob', sha: blob.sha });
          }
          process.stdout.write('.');
          // Small delay to avoid hitting rate limits
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (err: any) {
          if (err.message?.includes('rate limit')) {
            console.log(`\n   ⏳ Rate limited, waiting 60s...`);
            await new Promise(resolve => setTimeout(resolve, 60000));
            // Retry the file
            try {
              const isText = !filePath.match(/\.(webp|png|jpg|jpeg|gif|ico|woff|woff2|ttf|eot|mp3|wav|ogg|mp4|webm)$/i);
              if (isText) {
                const content = fs.readFileSync(fullPath, 'utf-8');
                const { data: blob } = await octokit.git.createBlob({ owner, repo, content, encoding: 'utf-8' });
                treeItems.push({ path: filePath, mode: '100644', type: 'blob', sha: blob.sha });
              } else {
                const content = fs.readFileSync(fullPath).toString('base64');
                const { data: blob } = await octokit.git.createBlob({ owner, repo, content, encoding: 'base64' });
                treeItems.push({ path: filePath, mode: '100644', type: 'blob', sha: blob.sha });
              }
              process.stdout.write('.');
            } catch (retryErr: any) {
              console.log(`\n   ⚠️ Skipped after retry: ${filePath}`);
            }
          } else {
            console.log(`\n   ⚠️ Skipped: ${filePath} (${err.message?.substring(0, 50)}...)`);
          }
        }
      }

      if (treeItems.length === 0) {
        console.log('\n   No files in this batch.');
        continue;
      }

      console.log(`\n   Creating tree with ${treeItems.length} files...`);
      const { data: newTree } = await octokit.git.createTree({ owner, repo, base_tree: treeSha, tree: treeItems });
      
      const batchMessage = `${commitMessage} (batch ${batchIndex + 1}/${batches.length})`;
      const { data: newCommit } = await octokit.git.createCommit({
        owner, repo, message: batchMessage, tree: newTree.sha, parents: [currentCommitSha]
      });

      await octokit.git.updateRef({ owner, repo, ref: `heads/${branch}`, sha: newCommit.sha, force: true });
      console.log(`   ✅ Batch ${batchIndex + 1} committed: ${newCommit.sha.substring(0, 7)}`);
      
      // Save progress after each successful batch
      saveProgress(batchIndex + 1);
    }

    // Clear progress file when complete
    if (fs.existsSync(PROGRESS_FILE)) {
      fs.unlinkSync(PROGRESS_FILE);
    }
    console.log('\n✅ All batches pushed successfully!');
    console.log(`   View at: https://github.com/${owner}/${repo}`);

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

pushFiles();
