import React, { createContext, useContext, useEffect, useState } from "react";

type User = {
  _id: string;
  nom: string;
  prenom: string;
  email: string;
  // ...autres champs utilisateur...
};

type AuthContextType = {
  user: User | null;
  setUser: (user: User | null) => void;
  logout: () => void;
  isAuthenticated: boolean;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  setUser: () => {},
  logout: () => {},
  isAuthenticated: false,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Ici, tu peux charger l'utilisateur depuis le stockage local ou une API si besoin
    // Exemple fictif :
    // const storedUser = ...;
    // if (storedUser) setUser(storedUser);
  }, []);

  const logout = () => {
    setUser(null);
    // Tu peux aussi nettoyer le stockage local ici
  };

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{ user, setUser, logout, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
