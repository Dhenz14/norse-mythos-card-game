/**
 * Push code to GitHub using Replit's GitHub integration
 * Usage: npx tsx scripts/pushToGithub.ts
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
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
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

async function main() {
  console.log('🚀 Starting GitHub push process...\n');
  
  const octokit = await getUncachableGitHubClient();
  
  // Get authenticated user
  const { data: user } = await octokit.users.getAuthenticated();
  console.log(`✅ Authenticated as: ${user.login}`);
  
  const repoName = 'norse-mythos-card-game';
  const owner = user.login;
  
  // Check if repo exists, create if not
  let repoExists = false;
  try {
    await octokit.repos.get({ owner, repo: repoName });
    repoExists = true;
    console.log(`✅ Repository ${repoName} already exists`);
  } catch (e: any) {
    if (e.status === 404) {
      console.log(`📦 Creating repository: ${repoName}...`);
      await octokit.repos.createForAuthenticatedUser({
        name: repoName,
        description: 'Norse Mythos Card Game - A multi-mythology digital collectible card game with Hearthstone-style gameplay',
        private: false,
        auto_init: false
      });
      console.log(`✅ Repository created: https://github.com/${owner}/${repoName}`);
    } else {
      throw e;
    }
  }
  
  // Get the current git remote or set it
  const { execSync } = await import('child_process');
  
  try {
    // Check if we have a git repo
    execSync('git status', { stdio: 'pipe' });
  } catch {
    console.log('📁 Initializing git repository...');
    execSync('git init', { stdio: 'inherit' });
  }
  
  // Configure git
  try {
    execSync('git config user.email "agent@replit.com"', { stdio: 'pipe' });
    execSync('git config user.name "Replit Agent"', { stdio: 'pipe' });
  } catch {}
  
  // Set remote
  const remoteUrl = `https://github.com/${owner}/${repoName}.git`;
  try {
    execSync(`git remote remove origin`, { stdio: 'pipe' });
  } catch {}
  execSync(`git remote add origin ${remoteUrl}`, { stdio: 'inherit' });
  console.log(`✅ Remote set to: ${remoteUrl}`);
  
  // Stage all files
  console.log('\n📝 Staging files...');
  execSync('git add -A', { stdio: 'inherit' });
  
  // Commit
  console.log('💾 Creating commit...');
  try {
    execSync('git commit -m "Initial commit: Norse Mythos Card Game with unified tooltip system"', { stdio: 'inherit' });
  } catch {
    console.log('ℹ️  No new changes to commit');
  }
  
  // Get access token for push
  const token = await getAccessToken();
  const pushUrl = `https://${token}@github.com/${owner}/${repoName}.git`;
  
  // Push to GitHub
  console.log('\n🚀 Pushing to GitHub...');
  try {
    execSync(`git push -u ${pushUrl} main --force`, { stdio: 'inherit' });
  } catch {
    // Try with master branch
    try {
      execSync(`git branch -M main`, { stdio: 'pipe' });
      execSync(`git push -u ${pushUrl} main --force`, { stdio: 'inherit' });
    } catch (e2) {
      console.error('Push failed, trying alternative method...');
      execSync(`git push -u ${pushUrl} HEAD:main --force`, { stdio: 'inherit' });
    }
  }
  
  console.log(`\n✅ Success! Code pushed to: https://github.com/${owner}/${repoName}`);
}

main().catch(console.error);
