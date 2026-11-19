---
trigger: always_on
---

# DevDesk Workstation & Roadmap Integration

This project is monitored and managed by **DevDesk**. An embedded Model Context Protocol (MCP) server runs via `devdesk mcp`.

## Agent Guidelines

1. **Context Awareness**:
   - Check project state via `devdesk_get_context` to retrieve active listening ports, Git dirty files, and previous session notes.
   - Inspect the interactive Obsidian Canvas tree via `devdesk_get_roadmap`.

2. **Real-Time Progress Updates**:
   - When beginning a task, update the matching node using `devdesk_update_node` setting `status: "in_progress"`, `agentActive: true`, and `agentSummary` to your current action.
   - The user will see this reflected live on the DevDesk Canvas Tree without needing manual refreshes.

3. **Session Completion**:
   - When finished, mark completed nodes with `status: "done"`, `agentActive: false`, and `agentSummary`.
   - Update the "Where We Left Off" notes via `devdesk_set_notes` (`lastTask`, `nextStep`, `blockers`).
