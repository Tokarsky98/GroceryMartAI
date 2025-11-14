import React, { useState, useEffect, useContext, createContext } from 'react';
import Navigation from './components/Navigation';
import ProductList from './components/ProductList';
import LoginForm from './components/LoginForm';
import AdminPanel from './components/AdminPanel';
import Checkout from './components/Checkout';
import Toast from './components/Toast';
import CartDropdown from './components/CartDropdown';
import { authAPI, cartAPI } from './services/api';

// Auth Context
const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

// Cart Context
const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};

function App() {
  const [user, setUser] = useState(null);
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState('home');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing token and restore user session
    const token = localStorage.getItem('token');
    if (token) {
      try {
        // Decode JWT token to extract user information
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));

        const decodedToken = JSON.parse(jsonPayload);

        // Check if token is expired
        if (decodedToken.exp * 1000 > Date.now()) {
          // Token is valid, restore user
          setUser({
            id: decodedToken.id,
            email: decodedToken.email,
            role: decodedToken.role,
            name: decodedToken.role === 'admin' ? 'Admin User' : 'John Doe'
          });
        } else {
          // Token expired, remove it
          localStorage.removeItem('token');
        }
      } catch (error) {
        // Invalid token, remove it
        console.error('Failed to decode token:', error);
        localStorage.removeItem('token');
      }
    }
    setLoading(false);

    const handleHashChange = () => {
      const hash = window.location.hash.slice(1) || 'home';
      setCurrentPage(hash);
      setIsCartOpen(false);
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange();

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Load cart when user logs in
  useEffect(() => {
    if (user) {
      loadCart();
    }
  }, [user]);

  const loadCart = async () => {
    try {
      const response = await cartAPI.getCart();
      setCart(response.items || []);
    } catch (error) {
      console.error('Failed to load cart:', error);
    }
  };

  const login = async (email, password) => {
    try {
      const result = await authAPI.login(email, password);
      setUser(result.user);
      return result;
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    authAPI.logout();
    setUser(null);
    setCart([]);
    window.location.hash = '#home';
  };

  const addToCart = async (product) => {
    try {
      if (user) {
        // Add to backend cart
        await cartAPI.addToCart(product.id, 1);
        await loadCart();
      } else {
        // Add to local cart with stock validation
        setCart(prevCart => {
          const existing = prevCart.find(item => item.productId === product.id);
          const currentQuantity = existing ? existing.quantity : 0;
          const newQuantity = currentQuantity + 1;

          // Check stock availability
          if (newQuantity > product.stock) {
            throw new Error(`Only ${product.stock} items available in stock`);
          }

          if (existing) {
            return prevCart.map(item =>
              item.productId === product.id
                ? { ...item, quantity: newQuantity }
                : item
            );
          }
          return [...prevCart, { productId: product.id, quantity: 1, product }];
        });
      }
    } catch (error) {
      console.error('Failed to add to cart:', error);
      throw error;
    }
  };

  const updateQuantity = async (productId, newQuantity) => {
    try {
      if (user) {
        if (newQuantity <= 0) {
          await cartAPI.removeFromCart(productId);
        } else {
          await cartAPI.updateCart(productId, newQuantity);
        }
        await loadCart();
      } else {
        if (newQuantity <= 0) {
          setCart(prevCart => prevCart.filter(item => item.productId !== productId));
        } else {
          setCart(prevCart => {
            return prevCart.map(item => {
              if (item.productId === productId) {
                // Check stock availability for local cart
                if (newQuantity > item.product.stock) {
                  throw new Error(`Only ${item.product.stock} items available in stock`);
                }
                return { ...item, quantity: newQuantity };
              }
              return item;
            });
          });
        }
      }
    } catch (error) {
      console.error('Failed to update cart:', error);
      throw error;
    }
  };

  const removeFromCart = async (productId) => {
    try {
      if (user) {
        await cartAPI.removeFromCart(productId);
        await loadCart();
      } else {
        setCart(prevCart => prevCart.filter(item => item.productId !== productId));
      }
    } catch (error) {
      console.error('Failed to remove from cart:', error);
    }
  };

  const clearCart = () => {
    setCart([]);
  };

  const getCartTotal = () => {
    return cart.reduce((sum, item) => {
      const price = item.product ? item.product.price : item.price || 0;
      return sum + (price * item.quantity);
    }, 0);
  };

  const toggleCartDropdown = () => {
    setIsCartOpen(!isCartOpen);
  };

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      <CartContext.Provider value={{ 
        cart, 
        addToCart, 
        updateQuantity, 
        removeFromCart, 
        clearCart, 
        getCartTotal,
        isCartOpen,
        toggleCartDropdown
      }}>
        {currentPage !== 'login' && currentPage !== 'checkout' && <Navigation />}
        
        {currentPage === 'home' && <ProductList />}
        {currentPage === 'login' && <LoginForm />}
        {currentPage === 'admin' && <AdminPanel />}
        {currentPage === 'checkout' && <Checkout />}
      </CartContext.Provider>
    </AuthContext.Provider>
  );
}

export default App;