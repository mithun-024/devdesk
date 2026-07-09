import { create } from 'zustand';
import {
  Project,
  MappedPort,
  ProjectGitSummary,
  ProjectNotes,
  Snapshot,
  DevServerStatus,
} from '../types';
import {
  fetchProjects,
  registerProject as apiRegisterProject,
  removeProject as apiRemoveProject,
  fetchMappedPorts,
  killProcess as apiKillProcess,
  fetchProjectGitSummary,
  fetchProjectNotes,
  saveProjectNotes as apiSaveProjectNotes,
  takeSnapshot as apiTakeSnapshot,
  fetchLatestSnapshot,
  startDevServer as apiStartDevServer,
  stopDevServer as apiStopDevServer,
  fetchAllRunningDevServers,
} from './bridge';

interface ProjectState {
  projects: Project[];
  activeProjectId: string;
  livePorts: MappedPort[];
  gitSummaries: Record<string, ProjectGitSummary>;
  notesMap: Record<string, ProjectNotes>;
  snapshotsMap: Record<string, Snapshot | null>;
  devServersMap: Record<string, DevServerStatus>;
  isLoading: boolean;
  searchQuery: string;

  // Actions
  loadProjects: () => Promise<void>;
  registerNewProject: (path: string, name?: string) => Promise<Project | null>;
  removeProject: (id: string) => Promise<boolean>;
  setActiveProjectId: (id: string) => void;
  refreshLivePorts: () => Promise<void>;
  killProcess: (pid: number) => Promise<{ success: boolean; message: string }>;
  refreshGitSummary: (projectId: string) => Promise<void>;
  refreshAllGitSummaries: () => Promise<void>;
  setSearchQuery: (query: string) => void;

  // Phase 2 Actions
  loadProjectNotes: (projectId: string) => Promise<void>;
  saveNotes: (projectId: string, notes: Partial<ProjectNotes>) => Promise<void>;
  takeProjectSnapshot: (projectId: string) => Promise<Snapshot | null>;
  loadLatestSnapshot: (projectId: string) => Promise<void>;
  startProjectDevServer: (projectId: string) => Promise<{ success: boolean; pid?: number }>;
  stopProjectDevServer: (projectId: string) => Promise<{ success: boolean; message: string }>;
  refreshDevServers: () => Promise<void>;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  activeProjectId: '',
  livePorts: [],
  gitSummaries: {},
  notesMap: {},
  snapshotsMap: {},
  devServersMap: {},
  isLoading: false,
  searchQuery: '',

  loadProjects: async () => {
    set({ isLoading: true });
    try {
      const list = await fetchProjects();
      const currentActive = get().activeProjectId;
      let newActive = currentActive;

      if (!currentActive || !list.find((p) => p.id === currentActive)) {
        const defaultProj = list.find((p) => p.isDefault) || list[0];
        newActive = defaultProj ? defaultProj.id : '';
      }

      set({ projects: list, activeProjectId: newActive, isLoading: false });

      // Automatically refresh live ports, git summaries, notes, and snapshots
      get().refreshLivePorts();
      get().refreshAllGitSummaries();
      get().refreshDevServers();

      for (const proj of list) {
        get().loadProjectNotes(proj.id);
        get().loadLatestSnapshot(proj.id);
      }
    } catch (e) {
      console.error('Failed to load projects into store:', e);
      set({ isLoading: false });
    }
  },

  registerNewProject: async (path: string, name?: string) => {
    try {
      const proj = await apiRegisterProject(path, name);
      if (proj) {
        await get().loadProjects();
        set({ activeProjectId: proj.id });
        return proj;
      }
    } catch (e) {
      console.error('Failed to register project in store:', e);
    }
    return null;
  },

  removeProject: async (id: string) => {
    try {
      const success = await apiRemoveProject(id);
      if (success) {
        await get().loadProjects();
        return true;
      }
    } catch (e) {
      console.error('Failed to remove project in store:', e);
    }
    return false;
  },

  setActiveProjectId: (id: string) => {
    set({ activeProjectId: id });
  },

  refreshLivePorts: async () => {
    try {
      const ports = await fetchMappedPorts();
      set({ livePorts: ports });
    } catch (e) {
      console.error('Failed to refresh live ports:', e);
    }
  },

  killProcess: async (pid: number) => {
    const res = await apiKillProcess(pid);
    if (res.success) {
      await get().refreshLivePorts();
      await get().refreshDevServers();
    }
    return res;
  },

  refreshGitSummary: async (projectId: string) => {
    const proj = get().projects.find((p) => p.id === projectId);
    if (!proj || !proj.path) return;

    try {
      const summary = await fetchProjectGitSummary(proj.path);
      if (summary) {
        set((state) => ({
          gitSummaries: {
            ...state.gitSummaries,
            [projectId]: summary,
          },
        }));
      }
    } catch (e) {
      console.error(`Failed to refresh git summary for ${proj.name}:`, e);
    }
  },

  refreshAllGitSummaries: async () => {
    const list = get().projects;
    for (const proj of list) {
      get().refreshGitSummary(proj.id);
    }
  },

  setSearchQuery: (query: string) => {
    set({ searchQuery: query });
  },

  // Phase 2 Implementation
  loadProjectNotes: async (projectId: string) => {
    try {
      const notes = await fetchProjectNotes(projectId);
      if (notes) {
        set((state) => ({
          notesMap: {
            ...state.notesMap,
            [projectId]: notes,
          },
        }));
      }
    } catch (e) {
      console.error(`Failed to load notes for ${projectId}:`, e);
    }
  },

  saveNotes: async (projectId: string, notes: Partial<ProjectNotes>) => {
    try {
      const saved = await apiSaveProjectNotes(projectId, notes);
      if (saved) {
        set((state) => ({
          notesMap: {
            ...state.notesMap,
            [projectId]: saved,
          },
        }));
      }
    } catch (e) {
      console.error(`Failed to save notes for ${projectId}:`, e);
    }
  },

  takeProjectSnapshot: async (projectId: string) => {
    try {
      const snap = await apiTakeSnapshot(projectId);
      if (snap) {
        set((state) => ({
          snapshotsMap: {
            ...state.snapshotsMap,
            [projectId]: snap,
          },
        }));
        return snap;
      }
    } catch (e) {
      console.error(`Failed to take snapshot for ${projectId}:`, e);
    }
    return null;
  },

  loadLatestSnapshot: async (projectId: string) => {
    try {
      const snap = await fetchLatestSnapshot(projectId);
      set((state) => ({
        snapshotsMap: {
          ...state.snapshotsMap,
          [projectId]: snap,
        },
      }));
    } catch (e) {
      console.error(`Failed to load snapshot for ${projectId}:`, e);
    }
  },

  startProjectDevServer: async (projectId: string) => {
    const res = await apiStartDevServer(projectId);
    if (res.success) {
      await get().refreshDevServers();
      // Also rescan ports shortly after
      setTimeout(() => {
        get().refreshLivePorts();
      }, 1500);
    }
    return res;
  },

  stopProjectDevServer: async (projectId: string) => {
    const res = await apiStopDevServer(projectId);
    if (res.success) {
      await get().refreshDevServers();
      get().refreshLivePorts();
    }
    return res;
  },

  refreshDevServers: async () => {
    try {
      const servers = await fetchAllRunningDevServers();
      set({ devServersMap: servers });
    } catch (e) {
      console.error('Failed to refresh dev servers:', e);
    }
  },
}));
