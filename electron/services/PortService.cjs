const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const ProjectService = require('./ProjectService.cjs');

class PortService {
  /**
   * Reads process RSS memory in MB from /proc/<pid>/status.
   */
  static getProcessMemoryMb(pid) {
    try {
      const status = fs.readFileSync(`/proc/${pid}/status`, 'utf8');
      const match = status.match(/VmRSS:\s+(\d+)\s+kB/);
      if (match) {
        return parseFloat((parseInt(match[1], 10) / 1024).toFixed(1));
      }
    } catch (e) {}
    return 0;
  }

  /**
   * Reads process uptime from ps command.
   * Returns human-readable string like '12m 30s' or '01:23:45'.
   */
  static async getProcessUptime(pid) {
    return new Promise((resolve) => {
      exec(`ps -o etime= -p ${pid} 2>/dev/null`, (err, stdout) => {
        if (!err && stdout && stdout.trim()) {
          resolve(stdout.trim());
        } else {
          resolve('< 1m');
        }
      });
    });
  }

  /**
   * Resolves process working directory from /proc/<pid>/cwd or cmdline.
   */
  static getProcessCwd(pid) {
    try {
      if (fs.existsSync(`/proc/${pid}/cwd`)) {
        return fs.realpathSync(`/proc/${pid}/cwd`);
      }
    } catch (e) {}

    // Fallback: check command line arguments for project paths
    try {
      if (fs.existsSync(`/proc/${pid}/cmdline`)) {
        const cmdline = fs.readFileSync(`/proc/${pid}/cmdline`, 'utf8').replace(/\0/g, ' ');
        return cmdline;
      }
    } catch (e) {}

    return '';
  }

  /**
   * Scans all listening TCP/UDP ports on the host system.
   */
  static async scanListeningPorts() {
    return new Promise((resolve) => {
      exec('lsof -iTCP -sTCP:LISTEN -P -n 2>/dev/null', (err, stdout) => {
        const ports = [];
        const seenPorts = new Set();

        if (!err && stdout) {
          const lines = stdout.trim().split('\n').slice(1);
          for (const line of lines) {
            const parts = line.trim().split(/\s+/);
            if (parts.length >= 9) {
              const processName = parts[0];
              const pid = parseInt(parts[1], 10);
              const nameField = parts[8];
              const portMatch = nameField.match(/:(\d+)$/);
              if (portMatch) {
                const port = parseInt(portMatch[1], 10);
                if (!seenPorts.has(port)) {
                  seenPorts.add(port);
                  ports.push({
                    port,
                    pid,
                    processName,
                    protocol: 'tcp',
                    status: 'LISTEN',
                  });
                }
              }
            }
          }
        }

        exec('ss -tulpn 2>/dev/null', (err2, stdout2) => {
          if (!err2 && stdout2) {
            const lines = stdout2.trim().split('\n').slice(1);
            for (const line of lines) {
              const parts = line.trim().split(/\s+/);
              if (parts.length >= 5) {
                const protocol = parts[0].toLowerCase();
                const state = parts[1];
                if (state === 'LISTEN' || protocol.startsWith('udp')) {
                  const localAddr = parts[4];
                  const portMatch = localAddr.match(/:(\d+)$/);
                  if (portMatch) {
                    const port = parseInt(portMatch[1], 10);
                    if (!seenPorts.has(port)) {
                      seenPorts.add(port);
                      let pid = 0;
                      let processName = 'system';
                      const procField = parts.slice(6).join(' ');
                      const pidMatch = procField.match(/pid=(\d+)/);
                      const nameMatch = procField.match(/"([^"]+)"/);
                      if (pidMatch) pid = parseInt(pidMatch[1], 10);
                      if (nameMatch) processName = nameMatch[1];

                      ports.push({
                        port,
                        pid,
                        processName,
                        protocol: protocol.includes('udp') ? 'udp' : 'tcp',
                        status: state || 'LISTEN',
                      });
                    }
                  }
                }
              }
            }
          }

          resolve(ports);
        });
      });
    });
  }

  /**
   * Scans live ports and maps each port to a registered project and process.
   */
  static async getLivePortsMapped() {
    const rawPorts = await this.scanListeningPorts();
    const projects = ProjectService.getAllProjects();

    const mapped = await Promise.all(
      rawPorts.map(async (p) => {
        let projectId = null;
        let projectName = null;
        let projectPath = null;
        let uptime = '< 1m';
        let memoryMb = 0;

        if (p.pid > 0) {
          memoryMb = this.getProcessMemoryMb(p.pid);
          uptime = await this.getProcessUptime(p.pid);
          const procCwd = this.getProcessCwd(p.pid);

          if (procCwd) {
            // Check direct path match or child path
            for (const proj of projects) {
              if (
                procCwd === proj.path ||
                procCwd.startsWith(proj.path + path.sep) ||
                (typeof procCwd === 'string' && procCwd.includes(proj.path))
              ) {
                projectId = proj.id;
                projectName = proj.name;
                projectPath = proj.path;
                break;
              }
            }
          }
        }

        return {
          ...p,
          memoryMb,
          uptime,
          projectId,
          projectName,
          projectPath,
          isProjectMapped: Boolean(projectId),
        };
      })
    );

    // Sort: mapped projects first, then by port ascending
    return mapped.sort((a, b) => {
      if (a.isProjectMapped && !b.isProjectMapped) return -1;
      if (!a.isProjectMapped && b.isProjectMapped) return 1;
      return a.port - b.port;
    });
  }

  /**
   * Terminate a process by PID with SIGTERM then SIGKILL.
   */
  static async killProcess(pid) {
    if (!pid || pid <= 1) {
      return { success: false, message: 'Invalid or protected PID' };
    }

    try {
      process.kill(pid, 'SIGTERM');
      // Verify if process still alive after 300ms
      await new Promise((r) => setTimeout(r, 300));
      try {
        process.kill(pid, 0); // test if still exists
        process.kill(pid, 'SIGKILL');
        return { success: true, message: `Terminated process PID ${pid} with SIGKILL` };
      } catch {
        return { success: true, message: `Terminated process PID ${pid} with SIGTERM` };
      }
    } catch (err) {
      return { success: false, message: `Failed to terminate PID ${pid}: ${err.message}` };
    }
  }
}

module.exports = PortService;
