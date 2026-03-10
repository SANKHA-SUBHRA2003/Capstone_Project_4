import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // null = logged out

  // Extract display name from email (part before @)
  const getDisplayName = (email) => {
    if (!email) return 'User';
    const localPart = email.split('@')[0];
    // Capitalise first letter and replace dots/underscores/hyphens with spaces
    return localPart
      .replace(/[._-]/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase());
  };

  const login = (email, password) => {
    // Accept any non-empty email + password (no real auth for now)
    if (!email || !password) return false;
    setUser({ email, displayName: getDisplayName(email) });
    return true;
  };

  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
