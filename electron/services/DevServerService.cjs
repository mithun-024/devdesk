const { spawn } = require('child_process');
const dbManager = require('../db/index.cjs');
const ProjectService = require('./ProjectService.cjs');

class DevServerService {
  static runningServers = new Map(); // projectId -> { child, pid, devCommand, startedAt }

  /**
   * Starts the dev server for a project using its detected devCommand.
   */
  static startDevServer(projectId) {
    if (this.runningServers.has(projectId)) {
      const existing = this.runningServers.get(projectId);
      return {
        success: true,
        alreadyRunning: true,
        pid: existing.pid,
        devCommand: existing.devCommand,
        startedAt: existing.startedAt,
      };
    }

    const projects = dbManager.getAllProjects();
    const project = projects.find((p) => p.id === projectId);
    if (!project) {
      throw new Error(`Project ${projectId} not found`);
    }

    let devCommand = project.devCommand;
    if (!devCommand) {
      const inspected = ProjectService.inspectDirectory(project.path);
      devCommand = inspected.devCommand || 'npm run dev';
      dbManager.updateProject(project.id, { devCommand });
    }

    // Spawn managed child process
    const child = spawn(devCommand, {
      cwd: project.path,
      shell: true,
      env: {
        ...process.env,
        ...project.envVars,
      },
      detached: true,
    });

    const info = {
      child,
      pid: child.pid,
      devCommand,
      startedAt: new Date().toISOString(),
    };

    this.runningServers.set(projectId, info);

    child.on('exit', () => {
      this.runningServers.delete(projectId);
    });

    child.on('error', () => {
      this.runningServers.delete(projectId);
    });

    return {
      success: true,
      alreadyRunning: false,
      pid: child.pid,
      devCommand,
      startedAt: info.startedAt,
    };
  }

  /**
   * Stops a running dev server for a project.
   */
  static stopDevServer(projectId) {
    const running = this.runningServers.get(projectId);
    if (!running) {
      return { success: true, message: 'Server not running' };
    }

    try {
      // Kill process group
      process.kill(-running.pid, 'SIGTERM');
    } catch (e) {
      try {
        running.child.kill('SIGTERM');
      } catch (err) {}
    }

    this.runningServers.delete(projectId);
    return { success: true, message: 'Dev server stopped' };
  }

  /**
   * Gets running status of dev server for a project.
   */
  static getDevServerStatus(projectId) {
    const running = this.runningServers.get(projectId);
    if (!running) {
      return { isRunning: false };
    }
    return {
      isRunning: true,
      pid: running.pid,
      devCommand: running.devCommand,
      startedAt: running.startedAt,
    };
  }

  /**
   * Returns a map of all currently running dev servers.
   */
  static getAllRunningDevServers() {
    const result = {};
    for (const [id, info] of this.runningServers.entries()) {
      result[id] = {
        isRunning: true,
        pid: info.pid,
        devCommand: info.devCommand,
        startedAt: info.startedAt,
      };
    }
    return result;
  }

  /**
   * Terminates all running dev servers on application shutdown.
   */
  static stopAll() {
    for (const [id, info] of this.runningServers.entries()) {
      try {
        process.kill(-info.pid, 'SIGKILL');
      } catch (e) {
        try {
          info.child.kill('SIGKILL');
        } catch (err) {}
      }
    }
    this.runningServers.clear();
  }
}

module.exports = DevServerService;
