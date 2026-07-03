#!/usr/bin/env node

import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const path = require('path');
const fs = require('fs');
const dbManager = require('../electron/db/index.cjs');

// Initialize database
dbManager.initDb();

const ProjectService = require('../electron/services/ProjectService.cjs');
const PortService = require('../electron/services/PortService.cjs');
const GitService = require('../electron/services/GitService.cjs');

const args = process.argv.slice(2);
const command = args[0] || 'help';

// Terminal ANSI colors
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  red: '\x1b[31m',
};

async function handleAdd() {
  const target = args[1] || '.';
  const customName = args[2] || '';
  const resolved = path.resolve(target);

  if (!fs.existsSync(resolved)) {
    console.error(`${colors.red}✖ Error: Path does not exist: ${resolved}${colors.reset}`);
    process.exit(1);
  }

  try {
    const project = ProjectService.registerProject(resolved, customName);
    console.log(`\n${colors.green}${colors.bold}✔ Project registered in DevDesk!${colors.reset}\n`);
    console.log(`  ${colors.bold}Name:${colors.reset}            ${colors.cyan}${project.name}${colors.reset}`);
    console.log(`  ${colors.bold}Path:${colors.reset}            ${project.path}`);
    console.log(`  ${colors.bold}Branch:${colors.reset}          ${colors.yellow}${project.activeBranch}${colors.reset}`);
    console.log(`  ${colors.bold}Package Mgr:${colors.reset}     ${project.packageManager}`);
    if (project.devCommand) {
      console.log(`  ${colors.bold}Dev Command:${colors.reset}     ${colors.magenta}${project.devCommand}${colors.reset}`);
    }
    console.log(`\n${colors.dim}Launch DevDesk GUI or run 'devdesk list' to inspect active ports.${colors.reset}\n`);
  } catch (err) {
    console.error(`${colors.red}✖ Failed to register project: ${err.message}${colors.reset}`);
    process.exit(1);
  }
}

async function handleList() {
  const projects = ProjectService.getAllProjects();
  if (projects.length === 0) {
    console.log(`\n${colors.dim}No projects registered yet. Run 'devdesk add .' to register one.${colors.reset}\n`);
    return;
  }

  console.log(`\n${colors.bold}${colors.cyan}DevDesk Tracked Projects (${projects.length})${colors.reset}\n`);

  const mappedPorts = await PortService.getLivePortsMapped();

  for (const proj of projects) {
    const git = await GitService.getProjectGitSummary(proj.path);
    const activePorts = mappedPorts.filter((p) => p.projectId === proj.id);

    console.log(`  ${colors.bold}${proj.name}${colors.reset} ${colors.dim}(${proj.id})${colors.reset}`);
    console.log(`    ${colors.dim}Path:${colors.reset}   ${proj.path}`);
    console.log(
      `    ${colors.dim}Git:${colors.reset}    ${colors.yellow}${git.currentBranch || proj.activeBranch}${colors.reset} ${
        git.isClean ? `${colors.green}(clean)${colors.reset}` : `${colors.red}(${git.dirtyCount} dirty files)${colors.reset}`
      }`
    );
    if (proj.devCommand) {
      console.log(`    ${colors.dim}Dev:${colors.reset}    ${colors.magenta}${proj.devCommand}${colors.reset}`);
    }

    if (activePorts.length > 0) {
      const portStrings = activePorts.map(
        (p) => `${colors.green}:${p.port}${colors.reset} (PID ${p.pid}, ${p.processName}, ${p.uptime})`
      );
      console.log(`    ${colors.dim}Ports:${colors.reset}  ${portStrings.join(', ')}`);
    } else {
      console.log(`    ${colors.dim}Ports:${colors.reset}  ${colors.dim}no active listening ports${colors.reset}`);
    }

    if (git.recentCommits && git.recentCommits.length > 0) {
      const last = git.recentCommits[0];
      console.log(`    ${colors.dim}Last:${colors.reset}   ${colors.dim}${last.hash}${colors.reset} - ${last.message} ${colors.dim}(${last.relativeDate})${colors.reset}`);
    }

    console.log('');
  }
}

async function handlePorts() {
  const mapped = await PortService.getLivePortsMapped();
  console.log(`\n${colors.bold}${colors.green}Live Listening Ports (${mapped.length})${colors.reset}\n`);

  if (mapped.length === 0) {
    console.log(`  ${colors.dim}No listening ports detected.${colors.reset}\n`);
    return;
  }

  for (const p of mapped) {
    const projLabel = p.projectName
      ? `${colors.cyan}${p.projectName}${colors.reset}`
      : `${colors.dim}unmapped/system${colors.reset}`;
    console.log(
      `  ${colors.bold}:${p.port}${colors.reset} [${p.protocol.toUpperCase()}] -> PID ${colors.yellow}${p.pid}${colors.reset} (${p.processName}) | Uptime: ${p.uptime} | RAM: ${p.memoryMb}MB | Project: ${projLabel}`
    );
  }
  console.log('');
}

function handleHelp() {
  console.log(`
${colors.bold}${colors.cyan}DevDesk CLI${colors.reset} - Developer Workstation HUD & Project Manager

${colors.bold}USAGE:${colors.reset}
  devdesk add [path] [name]    Register a project directory (default: '.')
  devdesk list                 List all registered projects, branches, and live ports
  devdesk ports                List all active host listening ports & mapped processes
  devdesk help                 Show this help manual

${colors.bold}EXAMPLES:${colors.reset}
  devdesk add .
  devdesk add ~/projects/my-api "Backend API"
  devdesk list
`);
}

async function main() {
  switch (command) {
    case 'add':
      await handleAdd();
      break;
    case 'list':
    case 'ls':
      await handleList();
      break;
    case 'ports':
      await handlePorts();
      break;
    case 'help':
    case '--help':
    case '-h':
    default:
      handleHelp();
      break;
  }
}

main().catch((err) => {
  console.error('Fatal CLI Error:', err);
  process.exit(1);
});
