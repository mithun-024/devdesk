const dbManager = require('../db/index.cjs');
const GitService = require('./GitService.cjs');
const PortService = require('./PortService.cjs');

class NotesService {
  /**
   * Retrieves notes for a given project.
   */
  static getProjectNotes(projectId) {
    return dbManager.getProjectNotes(projectId);
  }

  /**
   * Saves "Where we left off" notes for a project.
   */
  static saveProjectNotes(projectId, { lastTask, nextStep, blockers }) {
    return dbManager.saveProjectNotes(projectId, { lastTask, nextStep, blockers });
  }

  /**
   * Takes an instant snapshot of a project state:
   * - HEAD commit hash & commit message
   * - Active branch
   * - Count of uncommitted files
   * - Active listening ports mapped to this project
   */
  static async createSnapshot(projectId) {
    const projects = dbManager.getAllProjects();
    const project = projects.find((p) => p.id === projectId);
    if (!project) {
      throw new Error(`Project ${projectId} not found`);
    }

    const git = await GitService.getProjectGitSummary(project.path);
    const allPorts = await PortService.getLivePortsMapped();
    const projectPorts = allPorts.filter((p) => p.projectId === project.id);

    const snapshotData = {
      projectId: project.id,
      commitHash: git.recentCommits && git.recentCommits[0] ? git.recentCommits[0].hash : '',
      commitMessage: git.recentCommits && git.recentCommits[0] ? git.recentCommits[0].message : '',
      branch: git.currentBranch || project.activeBranch || 'main',
      uncommittedCount: git.dirtyCount || 0,
      activePorts: projectPorts.map((p) => ({
        port: p.port,
        pid: p.pid,
        processName: p.processName,
        uptime: p.uptime,
      })),
      createdAt: new Date().toISOString(),
    };

    return dbManager.insertSnapshot(snapshotData);
  }

  /**
   * Retrieves the latest snapshot for a project.
   */
  static getLatestSnapshot(projectId) {
    return dbManager.getLatestSnapshot(projectId);
  }

  /**
   * Retrieves snapshot history for a project.
   */
  static getSnapshots(projectId, limit = 10) {
    return dbManager.getProjectSnapshots(projectId, limit);
  }

  /**
   * Auto-snapshots all registered projects when closing or switching.
   */
  static async autoSnapshotAll() {
    const projects = dbManager.getAllProjects();
    const results = [];
    for (const proj of projects) {
      try {
        const snap = await this.createSnapshot(proj.id);
        results.push(snap);
      } catch (e) {
        // Ignore single project errors
      }
    }
    return results;
  }
}

module.exports = NotesService;
