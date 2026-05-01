import { create } from "zustand";
import type { GraphData, GraphNode } from "../types";

interface GraphFilters {
  platforms: string[];
  entityTypes: string[];
  environments: string[];
}

interface GraphState {
  selectedNodeId: string | null;
  selectedNode: GraphNode | null;
  graphData: GraphData;
  filters: GraphFilters;
  selectNode: (id: string | null) => void;
  clearSelection: () => void;
  setGraphData: (data: GraphData) => void;
  setFilters: (filters: Partial<GraphFilters>) => void;
  resetFilters: () => void;
}

const DEFAULT_FILTERS: GraphFilters = {
  platforms: [],
  entityTypes: [],
  environments: [],
};

export const useGraphStore = create<GraphState>((set, get) => ({
  selectedNodeId: null,
  selectedNode: null,
  graphData: { nodes: [], edges: [] },
  filters: DEFAULT_FILTERS,

  selectNode: (id) => {
    if (!id) {
      set({ selectedNodeId: null, selectedNode: null });
      return;
    }
    const node = get().graphData.nodes.find((n) => n.id === id) ?? null;
    set({ selectedNodeId: id, selectedNode: node });
  },

  clearSelection: () => set({ selectedNodeId: null, selectedNode: null }),

  setGraphData: (data) => set({ graphData: data }),

  setFilters: (filters) =>
    set((state) => ({ filters: { ...state.filters, ...filters } })),

  resetFilters: () => set({ filters: DEFAULT_FILTERS }),
}));
