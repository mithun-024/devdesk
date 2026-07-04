import { create } from 'zustand';
import { Project, MappedPort, ProjectGitSummary } from '../types';
import {
  fetchProjects,
  registerProject as apiRegisterProject,
  removeProject as apiRemoveProject,
  fetchMappedPorts,
  killProcess as apiKillProcess,
  fetchProjectGitSummary,
} from './bridge';

interface ProjectState {
  projects: Project[];
  activeProjectId: string;
  livePorts: MappedPort[];
  gitSummaries: Record<string, ProjectGitSummary>;
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
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  activeProjectId: '',
  livePorts: [],
  gitSummaries: {},
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

      // Automatically refresh live ports and git summaries
      get().refreshLivePorts();
      get().refreshAllGitSummaries();
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
      // Refresh mapped ports immediately
      await get().refreshLivePorts();
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
}));
