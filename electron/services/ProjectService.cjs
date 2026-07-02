const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const dbManager = require('../db/index.cjs');

class ProjectService {
  /**
   * Inspects a directory to determine project metadata, package manager, dev command, and git state.
   */
  static inspectDirectory(targetPath) {
    const resolvedPath = path.resolve(targetPath);
    if (!fs.existsSync(resolvedPath)) {
      throw new Error(`Directory does not exist: ${resolvedPath}`);
    }

    const stat = fs.statSync(resolvedPath);
    if (!stat.isDirectory()) {
      throw new Error(`Path is not a directory: ${resolvedPath}`);
    }

    let name = path.basename(resolvedPath);
    let devCommand = '';
    let packageManager = 'npm';
    let isGit = false;
    let activeBranch = 'main';
    let gitRemote = '';

    // Check package manager lockfiles
    if (fs.existsSync(path.join(resolvedPath, 'bun.lockb')) || fs.existsSync(path.join(resolvedPath, 'bun.lock'))) {
      packageManager = 'bun';
    } else if (fs.existsSync(path.join(resolvedPath, 'pnpm-lock.yaml'))) {
      packageManager = 'pnpm';
    } else if (fs.existsSync(path.join(resolvedPath, 'yarn.lock'))) {
      packageManager = 'yarn';
    } else if (fs.existsSync(path.join(resolvedPath, 'package-lock.json'))) {
      packageManager = 'npm';
    }

    // Inspect package.json
    const pkgPath = path.join(resolvedPath, 'package.json');
    if (fs.existsSync(pkgPath)) {
      try {
        const pkgRaw = fs.readFileSync(pkgPath, 'utf8');
        const pkg = JSON.parse(pkgRaw);
        if (pkg.name) name = pkg.name;

        if (pkg.scripts) {
          if (pkg.scripts.dev) {
            devCommand = packageManager === 'npm' ? 'npm run dev' : `${packageManager} dev`;
          } else if (pkg.scripts.start) {
            devCommand = packageManager === 'npm' ? 'npm start' : `${packageManager} start`;
          } else if (pkg.scripts.serve) {
            devCommand = packageManager === 'npm' ? 'npm run serve' : `${packageManager} serve`;
          } else if (pkg.scripts.build) {
            devCommand = packageManager === 'npm' ? 'npm run build' : `${packageManager} build`;
          }
        }
      } catch (e) {
        // malformed package.json
      }
    } else if (fs.existsSync(path.join(resolvedPath, 'Cargo.toml'))) {
      packageManager = 'cargo';
      devCommand = 'cargo run';
    } else if (fs.existsSync(path.join(resolvedPath, 'pyproject.toml')) || fs.existsSync(path.join(resolvedPath, 'requirements.txt'))) {
      packageManager = 'python';
      devCommand = 'python main.py';
    } else if (fs.existsSync(path.join(resolvedPath, 'go.mod'))) {
      packageManager = 'go';
      devCommand = 'go run .';
    }

    // Check Git
    const gitDir = path.join(resolvedPath, '.git');
    if (fs.existsSync(gitDir)) {
      isGit = true;
      try {
        const branchOut = execSync('git branch --show-current', {
          cwd: resolvedPath,
          encoding: 'utf8',
          timeout: 2000,
        }).trim();
        if (branchOut) activeBranch = branchOut;
      } catch (e) {
        try {
          const revOut = execSync('git rev-parse --short HEAD', {
            cwd: resolvedPath,
            encoding: 'utf8',
            timeout: 2000,
          }).trim();
          if (revOut) activeBranch = `HEAD (${revOut})`;
        } catch (e2) {}
      }

      try {
        const remoteOut = execSync('git remote get-url origin', {
          cwd: resolvedPath,
          encoding: 'utf8',
          timeout: 2000,
        }).trim();
        if (remoteOut) gitRemote = remoteOut;
      } catch (e) {}
    }

    return {
      path: resolvedPath,
      name,
      devCommand,
      packageManager,
      isGit,
      activeBranch,
      gitRemote,
    };
  }

  /**
   * Registers a project directory into DevDesk SQLite.
   */
  static registerProject(targetPath, customName = '') {
    const info = this.inspectDirectory(targetPath);
    const projectName = customName.trim() || info.name;

    const all = dbManager.getAllProjects();
    const existing = all.find((p) => p.path === info.path);

    if (existing) {
      // Update existing record
      return dbManager.updateProject(existing.id, {
        name: projectName,
        activeBranch: info.activeBranch,
        devCommand: info.devCommand || existing.devCommand,
        packageManager: info.packageManager,
        gitRemote: info.gitRemote || existing.gitRemote,
      });
    }

    // Create new record
    const isFirst = all.length === 0;
    return dbManager.createProject({
      name: projectName,
      path: info.path,
      activeBranch: info.activeBranch,
      devCommand: info.devCommand,
      packageManager: info.packageManager,
      gitRemote: info.gitRemote,
      isDefault: isFirst,
    });
  }

  /**
   * Retrieves all registered projects, dynamically refreshing current Git branch.
   */
  static getAllProjects() {
    const list = dbManager.getAllProjects();
    return list.map((project) => {
      let activeBranch = project.activeBranch;
      let pathExists = fs.existsSync(project.path);

      if (pathExists && fs.existsSync(path.join(project.path, '.git'))) {
        try {
          const branchOut = execSync('git branch --show-current', {
            cwd: project.path,
            encoding: 'utf8',
            timeout: 1000,
          }).trim();
          if (branchOut) activeBranch = branchOut;
        } catch (e) {}
      }

      return {
        ...project,
        activeBranch,
        pathExists,
      };
    });
  }

  /**
   * Deletes a project by ID.
   */
  static deleteProject(id) {
    return dbManager.deleteProject(id);
  }
}

module.exports = ProjectService;
