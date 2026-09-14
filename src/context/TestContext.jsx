import React, { createContext, useContext, useState } from "react";

const ThemeContext = createContext();

export function ThemeProvider({ children }){
  const [theme, setTheme] = useState("Dark");

  const toggle = () => setTheme((prev) => prev == 'Dark' ? 'Light': 'Dark');

  return (
    <ThemeContext.Provider value={{ theme, toggle}}>
      {children}
    </ThemeContext.Provider>
  );
};

export function useTheme(){
  return useContext(ThemeContext);
}
