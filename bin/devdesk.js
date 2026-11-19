#!/usr/bin/env node

import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const dbManager = require('../electron/db/index.cjs');

// Initialize database
dbManager.initDb();

const ProjectService = require('../electron/services/ProjectService.cjs');
const PortService = require('../electron/services/PortService.cjs');
const GitService = require('../electron/services/GitService.cjs');
const NotesService = require('../electron/services/NotesService.cjs');
const McpService = require('../electron/services/McpService.cjs');

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
    console.log(`\n${colors.dim}Run 'devdesk resume' to see where you left off or 'devdesk run' to launch.${colors.reset}\n`);
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

async function handleResume() {
  const target = args[1] || '.';
  const resolved = path.resolve(target);
  const projects = ProjectService.getAllProjects();

  let project = projects.find((p) => p.path === resolved);
  if (!project && args[1]) {
    project = projects.find((p) => p.name.toLowerCase() === args[1].toLowerCase() || p.id === args[1]);
  }
  if (!project) {
    project = projects.find((p) => p.isDefault) || projects[0];
  }

  if (!project) {
    console.error(`${colors.red}✖ No registered projects found. Run 'devdesk add .' to register one.${colors.reset}`);
    process.exit(1);
  }

  // Auto-snapshot on resume
  try {
    await NotesService.createSnapshot(project.id);
  } catch (e) {}

  const notes = NotesService.getProjectNotes(project.id);
  const git = await GitService.getProjectGitSummary(project.path);
  const allPorts = await PortService.getLivePortsMapped();
  const projectPorts = allPorts.filter((p) => p.projectId === project.id);

  console.log(`\n${colors.bold}${colors.cyan}══════════════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}  DEVDESK RESUME SUMMARY ⚡${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}══════════════════════════════════════════════════════════════════${colors.reset}\n`);

  console.log(`  ${colors.bold}Project:${colors.reset}       ${colors.green}${colors.bold}${project.name}${colors.reset} ${colors.dim}(${project.path})${colors.reset}`);
  console.log(`  ${colors.bold}Branch:${colors.reset}        ${colors.yellow}${git.currentBranch || project.activeBranch}${colors.reset}`);

  if (git.recentCommits && git.recentCommits.length > 0) {
    const last = git.recentCommits[0];
    console.log(`  ${colors.bold}Last Commit:${colors.reset}   ${colors.dim}${last.hash}${colors.reset} - ${last.message} ${colors.dim}(${last.relativeDate})${colors.reset}`);
  }

  const statusText = git.isClean
    ? `${colors.green}Clean working tree${colors.reset}`
    : `${colors.red}${git.dirtyCount} uncommitted files (${git.stagedCount} staged, ${git.unstagedCount} unstaged, ${git.untrackedCount} untracked)${colors.reset}`;
  console.log(`  ${colors.bold}Git Status:${colors.reset}    ${statusText}`);

  if (projectPorts.length > 0) {
    const portsStr = projectPorts.map((p) => `${colors.green}:${p.port}${colors.reset} (PID ${p.pid}, ${p.processName}, ${p.uptime})`).join(', ');
    console.log(`  ${colors.bold}Live Ports:${colors.reset}    ${portsStr}`);
  } else {
    console.log(`  ${colors.bold}Live Ports:${colors.reset}    ${colors.dim}No processes currently listening${colors.reset}`);
  }

  console.log(`\n  ${colors.bold}${colors.blue}── WHERE WE LEFT OFF ───────────────────────────────────────────${colors.reset}`);
  console.log(`  ${colors.bold}• Last Task:${colors.reset}   ${notes.lastTask ? `${colors.bold}${notes.lastTask}${colors.reset}` : `${colors.dim}None recorded${colors.reset}`}`);
  console.log(`  ${colors.bold}• Next Step:${colors.reset}   ${notes.nextStep ? `${colors.yellow}${colors.bold}${notes.nextStep}${colors.reset}` : `${colors.dim}None recorded${colors.reset}`}`);
  console.log(`  ${colors.bold}• Blockers:${colors.reset}    ${notes.blockers ? `${colors.red}${colors.bold}${notes.blockers}${colors.reset}` : `${colors.green}None${colors.reset}`}`);

  if (project.devCommand) {
    console.log(`\n  ${colors.bold}${colors.magenta}── QUICK START ─────────────────────────────────────────────────${colors.reset}`);
    console.log(`  Run ${colors.cyan}${project.devCommand}${colors.reset} or ${colors.cyan}devdesk run${colors.reset} to spin up dev server.\n`);
  } else {
    console.log('');
  }
}

async function handleRun() {
  const target = args[1] || '.';
  const resolved = path.resolve(target);
  const projects = ProjectService.getAllProjects();
  const project = projects.find((p) => p.path === resolved) || projects.find((p) => p.isDefault) || projects[0];

  if (!project) {
    console.error(`${colors.red}✖ No registered projects found. Run 'devdesk add .' first.${colors.reset}`);
    process.exit(1);
  }

  const cmd = project.devCommand || 'npm run dev';
  console.log(`\n${colors.green}▶ Starting dev server:${colors.reset} ${colors.bold}${cmd}${colors.reset} in ${colors.dim}${project.path}${colors.reset}\n`);

  const child = spawn(cmd, {
    cwd: project.path,
    shell: true,
    stdio: 'inherit',
    env: { ...process.env, ...project.envVars },
  });

  child.on('exit', (code) => {
    process.exit(code || 0);
  });
}

function handleHelp() {
  console.log(`
${colors.bold}${colors.cyan}DevDesk CLI${colors.reset} - Developer Workstation HUD & Project Manager

${colors.bold}USAGE:${colors.reset}
  devdesk add [path] [name]    Register a project directory (default: '.')
  devdesk resume [project]     Print summary of where you stopped & what's next
  devdesk run [project]        Run project dev server command in foreground
  devdesk list                 List all registered projects, branches, and live ports
  devdesk ports                List all active host listening ports & mapped processes
  devdesk mcp                  Launch Model Context Protocol (MCP) server over stdio
  devdesk help                 Show this help manual

${colors.bold}EXAMPLES:${colors.reset}
  devdesk resume
  devdesk add .
  devdesk run
  devdesk mcp
`);
}

async function main() {
  switch (command) {
    case 'add':
      await handleAdd();
      break;
    case 'resume':
      await handleResume();
      break;
    case 'run':
      await handleRun();
      break;
    case 'list':
    case 'ls':
      await handleList();
      break;
    case 'ports':
      await handlePorts();
      break;
    case 'mcp':
      McpService.startStdioServer();
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
