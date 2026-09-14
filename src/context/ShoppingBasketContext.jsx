import react, { useState, createContext, useContext } from "react";

const ShoppingContext = createContext();

export function ShoppingProvider({ children }) {
  const [items, setItems] = useState([]);

  const addItem = (itm) => setItems([...items, itm]);

  return (
    <ShoppingContext.Provider value={{ items, addItem }}>
      {children}
    </ShoppingContext.Provider>
  );
}

export function useShopping() {
  return useContext(ShoppingContext);
}
