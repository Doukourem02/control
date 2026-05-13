import { createContext, ReactNode, useContext, useMemo, useState } from 'react';

export type ControlRole = 'employee' | 'owner';

type ControlRoleContextValue = {
  role: ControlRole;
  setRole: (role: ControlRole) => void;
};

const ControlRoleContext = createContext<ControlRoleContextValue | null>(null);

export function ControlRoleProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<ControlRole>('employee');
  const value = useMemo(() => ({ role, setRole }), [role]);

  return <ControlRoleContext.Provider value={value}>{children}</ControlRoleContext.Provider>;
}

export function useControlRole() {
  const value = useContext(ControlRoleContext);

  if (!value) {
    throw new Error('useControlRole must be used inside ControlRoleProvider');
  }

  return value;
}
