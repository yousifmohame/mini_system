import React, { createContext, useContext, useState, useCallback } from "react";

const PrivacyContext = createContext(null);

export function PrivacyProvider({ children }) {
  const [privacyMode, setPrivacyMode] = useState(false);

  const togglePrivacy = useCallback(() => {
    setPrivacyMode((prev) => !prev);
  }, []);

  const maskName = useCallback(
    (name) => {
      if (!privacyMode || !name) return name;
      const parts = name.trim().split(/\s+/);
      return parts.map((p) => (p.length > 0 ? p[0] + "***" : p)).join(" ");
    },
    [privacyMode]
  );

  const maskAmount = useCallback(
    (amount) => {
      if (!privacyMode) return String(amount);
      return "***";
    },
    [privacyMode]
  );

  return (
    <PrivacyContext.Provider value={{ privacyMode, togglePrivacy, maskName, maskAmount }}>
      {children}
    </PrivacyContext.Provider>
  );
}

export function usePrivacy() {
  const ctx = useContext(PrivacyContext);
  if (!ctx) throw new Error("usePrivacy must be used within PrivacyProvider");
  return ctx;
}