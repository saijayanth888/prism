import { create } from "zustand";
import { persist } from "zustand/middleware";

interface TenantState {
  currentTenant: string;
  availableTenants: string[];
  setTenant: (id: string) => void;
  addTenant: (id: string) => void;
}

export const useTenantStore = create<TenantState>()(
  persist(
    (set) => ({
      currentTenant: "demo",
      availableTenants: ["demo"],
      setTenant: (id) => set({ currentTenant: id }),
      addTenant: (id) =>
        set((state) => ({
          availableTenants: state.availableTenants.includes(id)
            ? state.availableTenants
            : [...state.availableTenants, id],
        })),
    }),
    { name: "prism-tenant" }
  )
);
