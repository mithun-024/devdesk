import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
  MarkerType,
  Node,
  Edge,
  NodeProps,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  GitBranch,
  CheckCircle2,
  Circle,
  Clock,
  Sparkles,
  Bot,
  Plus,
  RefreshCw,
  X,
  Trash2,
  Check,
  Copy,
  ExternalLink,
  Layers,
  ChevronRight,
  Terminal,
} from 'lucide-react';
import { Project, RoadmapNode, RoadmapEdge, AgentStatus } from '../../types';
import {
  fetchRoadmapNodes,
  upsertRoadmapNode,
  updateRoadmapNode,
  deleteRoadmapNode,
  fetchRoadmapEdges,
  saveRoadmapEdges,
  fetchAgentStatus,
  syncAgentRoadmap,
} from '../../services/bridge';

// ==========================================
// Custom Obsidian Canvas Nodes
// ==========================================

const MilestoneNode: React.FC<NodeProps> = ({ data, selected }) => {
  const node = data.node as RoadmapNode;
  const isDone = node.status === 'done';
  const isInProgress = node.status === 'in_progress';

  return (
    <div
      className={`relative px-4 py-3 rounded-lg bg-[#1a1a1a] border transition-all duration-150 text-left min-w-[250px] max-w-[300px] shadow-sm select-none ${
        selected
          ? 'border-[#7aa2f7] ring-1 ring-[#7aa2f7]/30'
          : 'border-[#333333] hover:border-[#4f4f4f]'
      }`}
    >
      <Handle type="target" position={Position.Top} className="!bg-[#444] !w-2 !h-2 !border-none" />
      <Handle type="target" position={Position.Left} className="!bg-[#444] !w-2 !h-2 !border-none" />

      <div className="flex items-center justify-between gap-2 mb-1.5">
        <span className="text-[10px] font-mono tracking-wider uppercase text-[#888888] flex items-center gap-1">
          <Layers className="w-3 h-3" /> Milestone
        </span>
        <div className="flex items-center gap-1.5">
          {isDone ? (
            <span className="flex items-center gap-1 text-[11px] text-[#9ece6a] font-mono">
              <CheckCircle2 className="w-3.5 h-3.5" /> Done
            </span>
          ) : isInProgress ? (
            <span className="flex items-center gap-1 text-[11px] text-[#7aa2f7] font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-[#7aa2f7] animate-pulse" /> Active
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[11px] text-[#666] font-mono">
              <Circle className="w-3.5 h-3.5" /> Queued
            </span>
          )}
        </div>
      </div>

      <div className="text-sm font-medium text-[#e5e5e5] mb-1 leading-snug">{node.label}</div>
      {node.description && (
        <div className="text-xs text-[#8c8c8c] line-clamp-2 leading-relaxed">
          {node.description}
        </div>
      )}

      {node.agentActive === 1 && (
        <div className="mt-2.5 pt-2 border-t border-[#262626] flex items-center justify-between text-[11px] text-[#7aa2f7] font-mono">
          <span className="flex items-center gap-1">
            <Bot className="w-3.5 h-3.5" /> Antigravity active
          </span>
          <span className="text-[10px] text-[#888] truncate max-w-[140px]">
            {node.agentSummary || 'Working...'}
          </span>
        </div>
      )}

      <Handle type="source" position={Position.Bottom} className="!bg-[#444] !w-2 !h-2 !border-none" />
      <Handle type="source" position={Position.Right} className="!bg-[#444] !w-2 !h-2 !border-none" />
    </div>
  );
};

const TaskNode: React.FC<NodeProps> = ({ data, selected }) => {
  const node = data.node as RoadmapNode;
  const isDone = node.status === 'done';
  const isInProgress = node.status === 'in_progress';

  return (
    <div
      className={`relative px-3.5 py-2.5 rounded-md bg-[#161616] border transition-all duration-150 text-left min-w-[210px] max-w-[260px] shadow-sm select-none ${
        selected
          ? 'border-[#7aa2f7] ring-1 ring-[#7aa2f7]/30'
          : 'border-[#262626] hover:border-[#383838]'
      }`}
    >
      <Handle type="target" position={Position.Top} className="!bg-[#333] !w-2 !h-2 !border-none" />
      <Handle type="target" position={Position.Left} className="!bg-[#333] !w-2 !h-2 !border-none" />

      <div className="flex items-start gap-2">
        <div className="mt-0.5 shrink-0">
          {isDone ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-[#9ece6a]" />
          ) : isInProgress ? (
            <div className="w-3.5 h-3.5 rounded-full border border-[#7aa2f7] flex items-center justify-center">
              <span className="w-1.5 h-1.5 rounded-full bg-[#7aa2f7] animate-pulse" />
            </div>
          ) : (
            <Circle className="w-3.5 h-3.5 text-[#555]" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div
            className={`text-xs font-medium leading-snug ${
              isDone ? 'text-[#888] line-through' : 'text-[#d4d4d4]'
            }`}
          >
            {node.label}
          </div>
          {node.agentActive === 1 && (
            <div className="mt-1 flex items-center gap-1 text-[10px] text-[#7aa2f7] font-mono">
              <Bot className="w-3 h-3" />
              <span className="truncate">{node.agentSummary || 'In Progress'}</span>
            </div>
          )}
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} className="!bg-[#333] !w-2 !h-2 !border-none" />
      <Handle type="source" position={Position.Right} className="!bg-[#333] !w-2 !h-2 !border-none" />
    </div>
  );
};

const nodeTypes = {
  milestone: MilestoneNode,
  task: TaskNode,
  feature: TaskNode,
};

// ==========================================
// Main Roadmap Canvas View Component
// ==========================================

interface RoadmapCanvasViewProps {
  projects: Project[];
  activeProjectId?: string;
  onSelectProject: (id: string) => void;
  onOpenTerminalInProject?: (proj: Project) => void;
  onShowToast: (title: string, desc?: string, type?: 'success' | 'error' | 'info') => void;
}

export const RoadmapCanvasView: React.FC<RoadmapCanvasViewProps> = ({
  projects,
  activeProjectId,
  onSelectProject,
  onOpenTerminalInProject,
  onShowToast,
}) => {
  const currentProject = projects.find((p) => p.id === activeProjectId) || projects[0];

  const [roadmapNodesList, setRoadmapNodesList] = useState<RoadmapNode[]>([]);
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [selectedNode, setSelectedNode] = useState<RoadmapNode | null>(null);
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);
  const [agentStatus, setAgentStatus] = useState<AgentStatus | null>(null);
  const [filterMode, setFilterMode] = useState<'all' | 'active' | 'milestones'>('all');
  const [isCopiedPrompt, setIsCopiedPrompt] = useState(false);

  // Load project roadmap & agent telemetry
  const loadRoadmap = useCallback(async () => {
    if (!currentProject) return;
    try {
      const dbNodes = await fetchRoadmapNodes(currentProject.id);
      const dbEdges = await fetchRoadmapEdges(currentProject.id);
      setRoadmapNodesList(dbNodes);

      // Map to xyflow nodes
      const flowNodes: Node[] = dbNodes.map((n) => ({
        id: n.id,
        type: n.type === 'milestone' ? 'milestone' : 'task',
        position: { x: n.positionX, y: n.positionY },
        data: { node: n },
      }));

      // Map to xyflow edges with minimalist Obsidian line styling
      const flowEdges: Edge[] = dbEdges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        type: 'smoothstep',
        style: { stroke: '#383838', strokeWidth: 1.5 },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 12,
          height: 12,
          color: '#383838',
        },
      }));

      setNodes(flowNodes);
      setEdges(flowEdges);

      // Check agent telemetry
      const agyStatus = await fetchAgentStatus(currentProject.path);
      setAgentStatus(agyStatus);

      // Sync active state if agent is currently working
      if (agyStatus.isActive) {
        await syncAgentRoadmap(currentProject.id);
      }
    } catch (e) {
      console.error('Failed to load roadmap:', e);
    }
  }, [currentProject]);

  useEffect(() => {
    loadRoadmap();
    const interval = setInterval(loadRoadmap, 5000);
    return () => clearInterval(interval);
  }, [loadRoadmap]);

  // Handle Node selection
  const handleNodeClick = (_event: any, node: Node) => {
    const raw = roadmapNodesList.find((n) => n.id === node.id);
    if (raw) {
      setSelectedNode(raw);
      setIsInspectorOpen(true);
    }
  };

  // Drag stop -> persist coordinates
  const handleNodeDragStop = async (_event: any, node: Node) => {
    await updateRoadmapNode(node.id, {
      positionX: Math.round(node.position.x),
      positionY: Math.round(node.position.y),
    });
  };

  // Node Status Update
  const handleStatusChange = async (newStatus: 'todo' | 'in_progress' | 'done') => {
    if (!selectedNode) return;
    const updated = await updateRoadmapNode(selectedNode.id, {
      status: newStatus,
      agentActive: newStatus === 'in_progress' ? 1 : 0,
    });
    if (updated) {
      setSelectedNode(updated);
      await loadRoadmap();
      onShowToast('Status Updated', `Node set to ${newStatus}`, 'success');
    }
  };

  // Delete Node
  const handleDeleteNode = async () => {
    if (!selectedNode) return;
    await deleteRoadmapNode(selectedNode.id);
    setIsInspectorOpen(false);
    setSelectedNode(null);
    await loadRoadmap();
    onShowToast('Node Removed', 'Card deleted from canvas', 'info');
  };

  // Add Card
  const handleAddCard = async () => {
    if (!currentProject) return;
    const id = `node-${Date.now()}`;
    const newNode = await upsertRoadmapNode({
      id,
      projectId: currentProject.id,
      label: 'New Task Card',
      description: 'Write task specifications here...',
      type: 'task',
      status: 'todo',
      agentActive: 0,
      agentSummary: '',
      positionX: 300 + Math.random() * 80,
      positionY: 300 + Math.random() * 80,
      tags: ['task'],
    });

    if (newNode) {
      await loadRoadmap();
      setSelectedNode(newNode);
      setIsInspectorOpen(true);
      onShowToast('Card Created', 'New node added to Obsidian Canvas', 'success');
    }
  };

  // Copy Prompt to run in Antigravity
  const handleCopyAgyPrompt = () => {
    if (!selectedNode || !currentProject) return;
    const prompt = `devdesk run\n# Or dispatch to Antigravity CLI:\nagy "Work on task '${selectedNode.label}': ${selectedNode.description}"`;
    navigator.clipboard.writeText(prompt);
    setIsCopiedPrompt(true);
    setTimeout(() => setIsCopiedPrompt(false), 2000);
    onShowToast('Prompt Copied', 'Paste into Antigravity CLI or terminal drawer', 'success');
  };

  // Compute metrics
  const totalNodes = roadmapNodesList.length;
  const doneNodes = roadmapNodesList.filter((n) => n.status === 'done').length;
  const progressPercent = totalNodes > 0 ? Math.round((doneNodes / totalNodes) * 100) : 0;

  return (
    <div className="relative w-full h-full flex flex-col bg-[#141414] text-[#d4d4d4] overflow-hidden select-none font-sans">
      {/* Minimalist Obsidian Top Bar */}
      <header className="h-12 border-b border-[#222222] bg-[#171717] px-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          {/* Project Switcher */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#777] font-mono uppercase tracking-wider">Project</span>
            <select
              value={currentProject?.id}
              onChange={(e) => onSelectProject(e.target.value)}
              className="bg-[#1f1f1f] text-xs text-[#e5e5e5] px-2.5 py-1 rounded border border-[#2f2f2f] hover:border-[#444] focus:outline-none"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="h-4 w-[1px] bg-[#2a2a2a]" />

          {/* Progress Bar & Counter */}
          <div className="flex items-center gap-2 text-xs font-mono text-[#888]">
            <span className="text-[#e5e5e5] font-semibold">{progressPercent}%</span>
            <span>({doneNodes}/{totalNodes} nodes)</span>
            <div className="w-20 h-1.5 bg-[#262626] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#9ece6a] transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Right Actions & Antigravity Telemetry Pill */}
        <div className="flex items-center gap-3">
          {/* Antigravity CLI Status Pill */}
          <div className="flex items-center gap-2 px-2.5 py-1 rounded bg-[#1c1c1c] border border-[#282828] text-xs font-mono">
            {agentStatus?.isActive ? (
              <>
                <span className="w-2 h-2 rounded-full bg-[#7aa2f7] animate-pulse" />
                <span className="text-[#7aa2f7]">agy active</span>
                <span className="text-[#666] truncate max-w-[120px]">
                  {agentStatus.lastToolAction}
                </span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-[#444]" />
                <span className="text-[#888]">agy idle</span>
              </>
            )}
          </div>

          <button
            onClick={handleAddCard}
            className="flex items-center gap-1.5 px-3 py-1 rounded bg-[#222222] hover:bg-[#2c2c2c] text-xs text-[#e5e5e5] border border-[#333333] transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Card</span>
          </button>

          <button
            onClick={loadRoadmap}
            title="Reload canvas state"
            className="p-1.5 rounded hover:bg-[#262626] text-[#888] hover:text-[#ccc] transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* React Flow Obsidian Canvas */}
      <div className="flex-1 w-full h-full relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={handleNodeClick}
          onNodeDragStop={handleNodeDragStop}
          nodeTypes={nodeTypes}
          fitView
          minZoom={0.2}
          maxZoom={1.8}
          proOptions={{ hideAttribution: true }}
          className="bg-[#121212]"
        >
          {/* Subtle Obsidian Dot Grid */}
          <Background color="#242424" gap={20} size={1} />
          <Controls
            className="!bg-[#1c1c1c] !border-[#2c2c2c] !shadow-none [&>button]:!bg-[#1c1c1c] [&>button]:!border-[#2c2c2c] [&>button]:!text-[#aaa] [&>button:hover]:!bg-[#262626]"
            showInteractive={false}
          />
          <MiniMap
            className="!bg-[#171717] !border-[#2a2a2a] !rounded-md"
            nodeColor={(n) => (n.type === 'milestone' ? '#2f2f2f' : '#222222')}
            maskColor="rgba(0, 0, 0, 0.6)"
          />
        </ReactFlow>

        {/* Slide-out Obsidian Markdown Inspector */}
        {isInspectorOpen && selectedNode && (
          <aside className="absolute top-0 right-0 h-full w-[360px] bg-[#181818] border-l border-[#262626] shadow-xl z-20 flex flex-col animate-in slide-in-from-right duration-200">
            {/* Inspector Header */}
            <div className="p-4 border-b border-[#262626] flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#888] flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" /> {selectedNode.type} Inspector
              </span>
              <button
                onClick={() => setIsInspectorOpen(false)}
                className="p-1 rounded hover:bg-[#262626] text-[#777] hover:text-[#ccc]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Inspector Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Title Input */}
              <div>
                <label className="text-[11px] font-mono text-[#777] block mb-1">Title</label>
                <input
                  type="text"
                  value={selectedNode.label}
                  onChange={(e) => {
                    const label = e.target.value;
                    setSelectedNode({ ...selectedNode, label });
                    updateRoadmapNode(selectedNode.id, { label });
                  }}
                  className="w-full bg-[#1e1e1e] border border-[#2e2e2e] rounded px-3 py-1.5 text-xs text-[#e5e5e5] focus:outline-none focus:border-[#444]"
                />
              </div>

              {/* Status Segmented Control */}
              <div>
                <label className="text-[11px] font-mono text-[#777] block mb-1.5">Status</label>
                <div className="grid grid-cols-3 gap-1 p-1 bg-[#141414] rounded border border-[#262626]">
                  {(['todo', 'in_progress', 'done'] as const).map((st) => (
                    <button
                      key={st}
                      onClick={() => handleStatusChange(st)}
                      className={`text-[11px] py-1 rounded transition-colors ${
                        selectedNode.status === st
                          ? 'bg-[#262626] text-[#e5e5e5] font-medium'
                          : 'text-[#777] hover:text-[#aaa]'
                      }`}
                    >
                      {st === 'todo' ? 'Todo' : st === 'in_progress' ? 'Active' : 'Done'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description (Markdown notes) */}
              <div>
                <label className="text-[11px] font-mono text-[#777] block mb-1">
                  Markdown Specification
                </label>
                <textarea
                  rows={5}
                  value={selectedNode.description}
                  onChange={(e) => {
                    const description = e.target.value;
                    setSelectedNode({ ...selectedNode, description });
                    updateRoadmapNode(selectedNode.id, { description });
                  }}
                  placeholder="Task specifications, checklist, or context notes..."
                  className="w-full bg-[#1e1e1e] border border-[#2e2e2e] rounded p-2.5 text-xs text-[#d4d4d4] font-mono focus:outline-none focus:border-[#444] resize-none"
                />
              </div>

              {/* Antigravity CLI Integration Section */}
              <div className="p-3 bg-[#141414] rounded border border-[#262626] space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono text-[#7aa2f7] flex items-center gap-1.5">
                    <Bot className="w-3.5 h-3.5" /> Antigravity Agent
                  </span>
                  {selectedNode.agentActive === 1 ? (
                    <span className="text-[10px] text-[#9ece6a] font-mono">Linked</span>
                  ) : (
                    <span className="text-[10px] text-[#666] font-mono">Idle</span>
                  )}
                </div>

                {selectedNode.agentSummary && (
                  <p className="text-xs text-[#8c8c8c] font-mono bg-[#1a1a1a] p-2 rounded border border-[#222]">
                    {selectedNode.agentSummary}
                  </p>
                )}

                <button
                  onClick={handleCopyAgyPrompt}
                  className="w-full py-1.5 px-3 rounded bg-[#202020] hover:bg-[#282828] border border-[#303030] text-xs text-[#ccc] flex items-center justify-center gap-1.5 transition-colors"
                >
                  {isCopiedPrompt ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-[#9ece6a]" />
                      <span>Copied AGY Command</span>
                    </>
                  ) : (
                    <>
                      <Terminal className="w-3.5 h-3.5" />
                      <span>Copy Task Prompt for AGY</span>
                    </>
                  )}
                </button>
              </div>

              {/* Tags */}
              <div>
                <label className="text-[11px] font-mono text-[#777] block mb-1">Tags</label>
                <div className="flex flex-wrap gap-1.5">
                  {selectedNode.tags?.map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#1f1f1f] border border-[#2d2d2d] text-[#888]"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Inspector Footer Actions */}
            <div className="p-3 border-t border-[#262626] bg-[#161616] flex items-center justify-between">
              <button
                onClick={handleDeleteNode}
                className="flex items-center gap-1 text-xs text-[#e06c75] hover:text-[#f7768e] transition-colors p-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Node</span>
              </button>

              <button
                onClick={() => setIsInspectorOpen(false)}
                className="px-3 py-1 bg-[#242424] hover:bg-[#2c2c2c] rounded text-xs text-[#d4d4d4] transition-colors"
              >
                Close
              </button>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
};
