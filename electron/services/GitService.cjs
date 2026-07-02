const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

class GitService {
  /**
   * Helper to execute a git command in target working directory.
   */
  static runGit(cmd, cwd) {
    return new Promise((resolve) => {
      exec(`git ${cmd}`, { cwd, maxBuffer: 1024 * 1024 * 5 }, (err, stdout) => {
        resolve(err ? '' : stdout.trim());
      });
    });
  }

  /**
   * Retrieves comprehensive Git telemetry for a project directory:
   * - Branch name & branch list
   * - Ahead/behind upstream counts
   * - Dirty files status (staged, unstaged, untracked counts)
   * - Recent 5 commits (hash, message, author, relative date)
   */
  static async getProjectGitSummary(projectPath) {
    const resolvedPath = path.resolve(projectPath);
    if (!fs.existsSync(resolvedPath)) {
      return {
        isRepo: false,
        currentBranch: '',
        isClean: true,
        dirtyCount: 0,
        stagedCount: 0,
        unstagedCount: 0,
        untrackedCount: 0,
        ahead: 0,
        behind: 0,
        recentCommits: [],
      };
    }

    const isRepo = (await this.runGit('rev-parse --is-inside-work-tree', resolvedPath)) === 'true';
    if (!isRepo) {
      return {
        isRepo: false,
        currentBranch: '',
        isClean: true,
        dirtyCount: 0,
        stagedCount: 0,
        unstagedCount: 0,
        untrackedCount: 0,
        ahead: 0,
        behind: 0,
        recentCommits: [],
      };
    }

    // Branch
    let currentBranch = await this.runGit('branch --show-current', resolvedPath);
    if (!currentBranch) {
      const shortHead = await this.runGit('rev-parse --short HEAD', resolvedPath);
      currentBranch = shortHead ? `detached (${shortHead})` : 'main';
    }

    // Ahead/Behind upstream
    let ahead = 0;
    let behind = 0;
    const revList = await this.runGit('rev-list --left-right --count HEAD...@{upstream} 2>/dev/null', resolvedPath);
    if (revList) {
      const parts = revList.split(/\s+/);
      if (parts.length >= 2) {
        ahead = parseInt(parts[0], 10) || 0;
        behind = parseInt(parts[1], 10) || 0;
      }
    }

    // Status / porcelain
    const statusOut = await this.runGit('status --porcelain=v1', resolvedPath);
    let stagedCount = 0;
    let unstagedCount = 0;
    let untrackedCount = 0;
    const changedFiles = [];

    if (statusOut) {
      const lines = statusOut.split('\n');
      for (const line of lines) {
        if (line.length < 3) continue;
        const indexStatus = line[0];
        const workStatus = line[1];
        const file = line.substring(3).trim();

        if (indexStatus === '?' && workStatus === '?') {
          untrackedCount++;
          changedFiles.push({ file, status: 'untracked', staged: false });
        } else {
          if (indexStatus !== ' ' && indexStatus !== '?') stagedCount++;
          if (workStatus !== ' ' && workStatus !== '?') unstagedCount++;
          changedFiles.push({
            file,
            status: indexStatus !== ' ' ? 'staged' : 'modified',
            staged: indexStatus !== ' ',
          });
        }
      }
    }

    const dirtyCount = stagedCount + unstagedCount + untrackedCount;
    const isClean = dirtyCount === 0;

    // Recent 5 commits
    const logRaw = await this.runGit(
      'log -n 5 --pretty=format:"%h|%s|%an|%ar|%ad" --date=format:"%Y-%m-%d %H:%M"',
      resolvedPath
    );
    const recentCommits = [];
    if (logRaw) {
      const lines = logRaw.split('\n');
      for (const line of lines) {
        const parts = line.split('|');
        if (parts.length >= 4) {
          recentCommits.push({
            hash: parts[0],
            message: parts[1],
            author: parts[2],
            relativeDate: parts[3],
            date: parts[4] || '',
          });
        }
      }
    }

    return {
      isRepo: true,
      currentBranch,
      isClean,
      dirtyCount,
      stagedCount,
      unstagedCount,
      untrackedCount,
      changedFiles: changedFiles.slice(0, 15),
      ahead,
      behind,
      recentCommits,
    };
  }
}

module.exports = GitService;
