import { create } from "zustand";
import { persist } from "zustand/middleware";

// ── 유저 모드 타입 ──
export type UserMode = "consumer" | "contractor";

// ── 스토어 상태 ──
interface UserState {
  userMode: UserMode;
  businessProfileId: string | null;
  isHydrated: boolean;
}

// ── 스토어 액션 ──
interface UserActions {
  setUserMode: (mode: UserMode) => void;
  toggleMode: () => void;
  setBusinessProfileId: (id: string | null) => void;
  hydrate: (state: Partial<UserState>) => void;
}

const initialState: UserState = {
  userMode: "consumer",
  businessProfileId: null,
  isHydrated: false,
};

export const useUserStore = create<UserState & UserActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      setUserMode: (mode) => set({ userMode: mode }),

      toggleMode: () => {
        const { userMode, businessProfileId } = get();
        // 시공사 모드 전환 시 businessProfileId 없으면 전환 불가
        if (userMode === "consumer" && !businessProfileId) return;
        set({ userMode: userMode === "consumer" ? "contractor" : "consumer" });
      },

      setBusinessProfileId: (id) => set({ businessProfileId: id }),

      hydrate: (state) => set({ ...state, isHydrated: true }),
    }),
    {
      name: "ggaba-user",
      partialize: (state) => ({
        userMode: state.userMode,
        businessProfileId: state.businessProfileId,
      }),
    }
  )
);
