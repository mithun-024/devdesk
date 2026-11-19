const readline = require('readline');
const dbManager = require('../db/index.cjs');
const GitService = require('./GitService.cjs');
const PortService = require('./PortService.cjs');
const NotesService = require('./NotesService.cjs');

/**
 * Lightweight JSON-RPC Model Context Protocol (MCP) Server over stdio.
 * Spec: MCP 2024-11-05
 */
class McpService {
  static startStdioServer() {
    dbManager.initDb();

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: false,
    });

    const sendResponse = (response) => {
      process.stdout.write(JSON.stringify(response) + '\n');
    };

    rl.on('line', async (line) => {
      const trimmed = line.trim();
      if (!trimmed) return;

      let msg;
      try {
        msg = JSON.parse(trimmed);
      } catch (err) {
        sendResponse({
          jsonrpc: '2.0',
          id: null,
          error: { code: -32700, message: 'Parse error' },
        });
        return;
      }

      const { id, method, params } = msg;

      try {
        // Handle MCP Initialize
        if (method === 'initialize') {
          sendResponse({
            jsonrpc: '2.0',
            id,
            result: {
              protocolVersion: '2024-11-05',
              capabilities: {
                tools: {},
              },
              serverInfo: {
                name: 'devdesk-mcp-server',
                version: '1.0.0',
              },
            },
          });
          return;
        }

        if (method === 'notifications/initialized') {
          // No response needed for notifications
          return;
        }

        // Handle Tools List
        if (method === 'tools/list') {
          sendResponse({
            jsonrpc: '2.0',
            id,
            result: {
              tools: [
                {
                  name: 'devdesk_get_context',
                  description: 'Get DevDesk context: active Git branch, uncommitted files, live listening ports, and Where We Left Off notes.',
                  inputSchema: {
                    type: 'object',
                    properties: {
                      projectPath: {
                        type: 'string',
                        description: 'Path of the project directory (optional, defaults to current working directory).',
                      },
                    },
                  },
                },
                {
                  name: 'devdesk_get_roadmap',
                  description: 'Get the full DevDesk Obsidian Canvas Roadmap: all nodes, milestones, edges, and completion status.',
                  inputSchema: {
                    type: 'object',
                    properties: {
                      projectId: {
                        type: 'string',
                        description: 'Project ID or workspace ID (optional).',
                      },
                    },
                  },
                },
                {
                  name: 'devdesk_update_node',
                  description: 'Update a node on the DevDesk Roadmap (e.g. set status to "in_progress" or "done", and record agent summary).',
                  inputSchema: {
                    type: 'object',
                    properties: {
                      nodeId: { type: 'string', description: 'ID of the roadmap node to update.' },
                      status: { type: 'string', enum: ['todo', 'in_progress', 'done'], description: 'New status.' },
                      agentActive: { type: 'boolean', description: 'Whether the agent is actively working on this node.' },
                      agentSummary: { type: 'string', description: 'Short summary of what the agent did or is doing.' },
                    },
                    required: ['nodeId'],
                  },
                },
                {
                  name: 'devdesk_add_node',
                  description: 'Add a new subtask or feature node to the DevDesk Roadmap canvas.',
                  inputSchema: {
                    type: 'object',
                    properties: {
                      projectId: { type: 'string', description: 'Target project ID.' },
                      label: { type: 'string', description: 'Node title/label.' },
                      description: { type: 'string', description: 'Detailed specification or description.' },
                      type: { type: 'string', enum: ['milestone', 'feature', 'task'], description: 'Type of node.' },
                      parentNodeId: { type: 'string', description: 'Optional parent node ID to link with an edge.' },
                    },
                    required: ['projectId', 'label'],
                  },
                },
                {
                  name: 'devdesk_set_notes',
                  description: 'Update the "Where We Left Off" daily session notes for a project in DevDesk.',
                  inputSchema: {
                    type: 'object',
                    properties: {
                      projectId: { type: 'string', description: 'Target project ID.' },
                      lastTask: { type: 'string', description: 'Summary of the task just completed.' },
                      nextStep: { type: 'string', description: 'Recommended next step.' },
                      blockers: { type: 'string', description: 'Any active blockers or None.' },
                    },
                    required: ['projectId'],
                  },
                },
              ],
            },
          });
          return;
        }

        // Handle Tools Call
        if (method === 'tools/call') {
          const { name, arguments: toolArgs = {} } = params || {};

          if (name === 'devdesk_get_context') {
            const projects = dbManager.getAllProjects();
            const targetPath = toolArgs.projectPath || process.cwd();
            const project = projects.find((p) => p.path === targetPath) || projects[0];

            if (!project) {
              sendResponse({
                jsonrpc: '2.0',
                id,
                result: {
                  content: [{ type: 'text', text: JSON.stringify({ error: 'No project registered for path ' + targetPath }) }],
                },
              });
              return;
            }

            const git = await GitService.getProjectGitSummary(project.path);
            const notes = NotesService.getProjectNotes(project.id);
            const allPorts = await PortService.getLivePortsMapped();
            const projectPorts = allPorts.filter((p) => p.projectId === project.id);

            const context = {
              project: { id: project.id, name: project.name, path: project.path },
              git: {
                branch: git.currentBranch,
                isClean: git.isClean,
                dirtyCount: git.dirtyCount,
                recentCommits: git.recentCommits?.slice(0, 3),
              },
              notes: {
                lastTask: notes.lastTask,
                nextStep: notes.nextStep,
                blockers: notes.blockers,
              },
              activePorts: projectPorts.map((p) => ({ port: p.port, pid: p.pid, processName: p.processName })),
            };

            sendResponse({
              jsonrpc: '2.0',
              id,
              result: {
                content: [{ type: 'text', text: JSON.stringify(context, null, 2) }],
              },
            });
            return;
          }

          if (name === 'devdesk_get_roadmap') {
            const projects = dbManager.getAllProjects();
            const project = (toolArgs.projectId ? projects.find((p) => p.id === toolArgs.projectId) : null) || projects[0];

            if (!project) {
              sendResponse({
                jsonrpc: '2.0',
                id,
                result: {
                  content: [{ type: 'text', text: JSON.stringify({ error: 'No project found' }) }],
                },
              });
              return;
            }

            const nodes = dbManager.getRoadmapNodes(project.id);
            const edges = dbManager.getRoadmapEdges(project.id);
            const doneCount = nodes.filter((n) => n.status === 'done').length;
            const progressPercent = nodes.length > 0 ? Math.round((doneCount / nodes.length) * 100) : 0;

            sendResponse({
              jsonrpc: '2.0',
              id,
              result: {
                content: [
                  {
                    type: 'text',
                    text: JSON.stringify({
                      projectId: project.id,
                      projectName: project.name,
                      totalNodes: nodes.length,
                      progressPercent,
                      nodes,
                      edges,
                    }, null, 2),
                  },
                ],
              },
            });
            return;
          }

          if (name === 'devdesk_update_node') {
            const { nodeId, status, agentActive, agentSummary } = toolArgs;
            const updates = {};
            if (status) updates.status = status;
            if (agentActive !== undefined) updates.agentActive = agentActive ? 1 : 0;
            if (agentSummary !== undefined) updates.agentSummary = agentSummary;

            const updated = dbManager.updateRoadmapNode(nodeId, updates);
            sendResponse({
              jsonrpc: '2.0',
              id,
              result: {
                content: [{ type: 'text', text: JSON.stringify({ success: true, node: updated }) }],
              },
            });
            return;
          }

          if (name === 'devdesk_add_node') {
            const { projectId, label, description = '', type = 'task', parentNodeId } = toolArgs;
            const newNodeId = `node-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
            const nodes = dbManager.getRoadmapNodes(projectId);

            // Compute default position
            let posX = 400;
            let posY = 500;
            if (parentNodeId) {
              const parent = nodes.find((n) => n.id === parentNodeId);
              if (parent) {
                posX = parent.positionX + 50;
                posY = parent.positionY + 160;
              }
            }

            const node = dbManager.upsertRoadmapNode({
              id: newNodeId,
              projectId,
              label,
              description,
              type,
              status: 'todo',
              agentActive: 0,
              agentSummary: '',
              positionX: posX,
              positionY: posY,
              tags: ['agent-created'],
            });

            if (parentNodeId) {
              const edges = dbManager.getRoadmapEdges(projectId);
              edges.push({
                id: `edge-${Date.now()}`,
                projectId,
                source: parentNodeId,
                target: newNodeId,
                label: '',
              });
              dbManager.saveRoadmapEdges(projectId, edges);
            }

            sendResponse({
              jsonrpc: '2.0',
              id,
              result: {
                content: [{ type: 'text', text: JSON.stringify({ success: true, node }) }],
              },
            });
            return;
          }

          if (name === 'devdesk_set_notes') {
            const { projectId, lastTask, nextStep, blockers } = toolArgs;
            const saved = dbManager.saveProjectNotes(projectId, { lastTask, nextStep, blockers });
            sendResponse({
              jsonrpc: '2.0',
              id,
              result: {
                content: [{ type: 'text', text: JSON.stringify({ success: true, notes: saved }) }],
              },
            });
            return;
          }

          sendResponse({
            jsonrpc: '2.0',
            id,
            error: { code: -32601, message: `Tool not found: ${name}` },
          });
          return;
        }

        // Unknown method
        sendResponse({
          jsonrpc: '2.0',
          id,
          error: { code: -32601, message: `Method not supported: ${method}` },
        });
      } catch (err) {
        sendResponse({
          jsonrpc: '2.0',
          id,
          error: { code: -32603, message: `Internal error: ${err.message}` },
        });
      }
    });
  }
}

module.exports = McpService;
