const fs = require('fs');
const path = require('path');
const os = require('os');
const dbManager = require('../db/index.cjs');

class AgentService {
  /**
   * Returns the path to the Antigravity CLI brain directory.
   */
  static getBrainDir() {
    return path.join(os.homedir(), '.gemini', 'antigravity-cli', 'brain');
  }

  /**
   * Scans Antigravity conversation logs and extracts real-time agent telemetry.
   */
  static getAgentStatus(workspacePath) {
    const brainDir = this.getBrainDir();
    if (!fs.existsSync(brainDir)) {
      return {
        hasSession: false,
        isActive: false,
        conversationId: null,
        lastTool: null,
        lastToolAction: 'Idle',
        summary: 'No Antigravity CLI sessions found.',
        touchedFiles: [],
        lastUpdated: null,
      };
    }

    try {
      const entries = fs.readdirSync(brainDir, { withFileTypes: true });
      const convDirs = entries
        .filter((e) => e.isDirectory() && e.name.length > 20)
        .map((e) => {
          const logDir = path.join(brainDir, e.name, '.system_generated', 'logs');
          const transcriptPath = path.join(logDir, 'transcript.jsonl');
          let mtime = 0;
          try {
            if (fs.existsSync(transcriptPath)) {
              mtime = fs.statSync(transcriptPath).mtimeMs;
            }
          } catch (err) {}
          return { id: e.name, transcriptPath, mtime };
        })
        .filter((c) => c.mtime > 0)
        .sort((a, b) => b.mtime - a.mtime);

      if (convDirs.length === 0) {
        return {
          hasSession: false,
          isActive: false,
          conversationId: null,
          lastTool: null,
          lastToolAction: 'Idle',
          summary: 'No recent agent transcripts.',
          touchedFiles: [],
          lastUpdated: null,
        };
      }

      const latest = convDirs[0];
      const now = Date.now();
      const ageMs = now - latest.mtime;
      const isActive = ageMs < 1000 * 60 * 5; // active if updated within 5 minutes

      // Parse the last ~64KB of the transcript
      const stats = fs.statSync(latest.transcriptPath);
      const readSize = Math.min(stats.size, 65536);
      const buffer = Buffer.alloc(readSize);
      const fd = fs.openSync(latest.transcriptPath, 'r');
      fs.readSync(fd, buffer, 0, readSize, stats.size - readSize);
      fs.closeSync(fd);

      const text = buffer.toString('utf8');
      const lines = text.trim().split('\n').filter(Boolean);

      let lastTool = null;
      let lastToolAction = 'Working';
      let summary = '';
      const touchedFilesSet = new Set();
      let lastTimestamp = null;

      // Scan backwards from the most recent steps
      for (let i = lines.length - 1; i >= 0; i--) {
        try {
          const step = JSON.parse(lines[i]);
          if (!lastTimestamp && step.created_at) {
            lastTimestamp = step.created_at;
          }

          if (step.tool_calls && Array.isArray(step.tool_calls) && step.tool_calls.length > 0) {
            for (const call of step.tool_calls) {
              if (!lastTool && call.function) {
                lastTool = call.function.name;
                const args = call.function.arguments || {};
                lastToolAction = args.toolAction || call.function.name;
                if (args.toolSummary) {
                  summary = args.toolSummary;
                }
              }

              // Collect touched files
              if (call.function && call.function.arguments) {
                const args = call.function.arguments;
                const filePath = args.TargetFile || args.AbsolutePath || args.SearchPath;
                if (filePath && typeof filePath === 'string') {
                  touchedFilesSet.add(path.basename(filePath));
                }
              }
            }
          }

          if (!summary && step.type === 'PLANNER_RESPONSE' && step.content) {
            summary = step.content.slice(0, 150).replace(/\n/g, ' ');
          }
        } catch (e) {}
      }

      const touchedFiles = Array.from(touchedFilesSet).slice(0, 8);

      return {
        hasSession: true,
        isActive,
        conversationId: latest.id,
        lastTool: lastTool || 'thinking',
        lastToolAction: lastToolAction || (isActive ? 'Thinking' : 'Idle'),
        summary: summary || (isActive ? 'Antigravity is processing...' : 'Agent session completed.'),
        touchedFiles,
        lastUpdated: new Date(latest.mtime).toISOString(),
      };
    } catch (e) {
      return {
        hasSession: false,
        isActive: false,
        conversationId: null,
        lastTool: null,
        lastToolAction: 'Idle',
        summary: `Error reading telemetry: ${e.message}`,
        touchedFiles: [],
        lastUpdated: null,
      };
    }
  }

  /**
   * Syncs the latest Antigravity action into the active node of a project's roadmap.
   */
  static syncToActiveRoadmapNode(projectId) {
    const status = this.getAgentStatus();
    if (!status.hasSession) return;

    const nodes = dbManager.getRoadmapNodes(projectId);
    const activeNode = nodes.find((n) => n.agentActive === 1 || n.status === 'in_progress');

    if (activeNode && status.summary) {
      dbManager.updateRoadmapNode(activeNode.id, {
        agentActive: status.isActive ? 1 : 0,
        agentSummary: `${status.lastToolAction}: ${status.summary.slice(0, 80)}`,
      });
    }
  }
}

module.exports = AgentService;
