import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Product): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const ASYNC_STORAGE_KEY = '@GoMarketplace:products';

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const data = await AsyncStorage.getItem(ASYNC_STORAGE_KEY);

      if (data) {
        setProducts(JSON.parse(data));
      }
    }

    loadProducts();
  }, []);

  const addToCart = useCallback(
    async (product: Product) => {
      const productIndex = products.findIndex(p => p.id === product.id);

      if (productIndex < 0) {
        setProducts(oldState => [...oldState, { ...product, quantity: 1 }]);
        await AsyncStorage.setItem(
          ASYNC_STORAGE_KEY,
          JSON.stringify([...products, { ...product, quantity: 1 }]),
        );
      } else {
        increment(product.id);
      }
    },
    [increment, products],
  );

  const increment = useCallback(
    async id => {
      const newProduct = products.findIndex(product => product.id === id);
      if (newProduct >= 0) {
        const updatedProducts = [...products];
        updatedProducts[newProduct].quantity += 1;

        setProducts(updatedProducts);
      }

      await AsyncStorage.setItem(ASYNC_STORAGE_KEY, JSON.stringify(products));
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const filterProducts = products.filter(product => product.id !== id);
      const newProduct = products.findIndex(product => product.id === id);
      if (newProduct >= 0) {
        if (products[newProduct].quantity <= 1) {
          setProducts(filterProducts);
        } else {
          const updatedProducts = [...products];
          updatedProducts[newProduct].quantity -= 1;

          setProducts(updatedProducts);
        }
      }

      await AsyncStorage.setItem(ASYNC_STORAGE_KEY, JSON.stringify(products));
    },
    [products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
