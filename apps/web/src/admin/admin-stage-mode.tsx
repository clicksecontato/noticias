"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

interface AdminStageModeValue {
  active: boolean;
  setActive: (next: boolean) => void;
}

const AdminStageModeContext = createContext<AdminStageModeValue | null>(null);

export function AdminStageModeProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState(false);
  const value = useMemo(() => ({ active, setActive }), [active]);
  return <AdminStageModeContext.Provider value={value}>{children}</AdminStageModeContext.Provider>;
}

export function useAdminStageMode(): AdminStageModeValue {
  const ctx = useContext(AdminStageModeContext);
  if (!ctx) {
    throw new Error("useAdminStageMode exige AdminStageModeProvider");
  }
  return ctx;
}

/** Liga o modo palco enquanto o componente estiver na tela. Fora do admin, não faz nada. */
export function useRegisterAdminStage() {
  const ctx = useContext(AdminStageModeContext);
  useEffect(() => {
    if (!ctx) return;
    ctx.setActive(true);
    return () => ctx.setActive(false);
  }, [ctx]);
}
