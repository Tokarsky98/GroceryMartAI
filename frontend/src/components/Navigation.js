import React, { useState } from 'react';
import { useAuth, useCart } from '../App';
import CartDropdown from './CartDropdown';

const Navigation = () => {
    const { user, logout } = useAuth();
    const { cart, toggleCartDropdown, isCartOpen } = useCart();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

    const handleLinkClick = (e, hash) => {
        e.preventDefault();
        window.location.hash = hash;
        setMobileMenuOpen(false);
    };

    return (
        <nav className="navbar">
            <div className="container">
                <div className="nav-content">
                    <a href="#" className="logo" onClick={(e) => handleLinkClick(e, '#home')}>
                        🛒 GroceryMart
                    </a>
                    
                    <div className="mobile-menu-toggle" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>

                    <ul className={`nav-menu ${mobileMenuOpen ? 'active' : ''}`}>
                        <li><a href="#home" className="nav-link" onClick={(e) => handleLinkClick(e, '#home')}>Home</a></li>
                        {user && user.role === 'admin' && (
                            <li><a href="#admin" className="nav-link" onClick={(e) => handleLinkClick(e, '#admin')}>Admin</a></li>
                        )}
                        <li>
                            <div className="cart-badge" onClick={toggleCartDropdown}>
                                🛒
                                {cartItemCount > 0 && <span className="badge">{cartItemCount}</span>}
                            </div>
                        </li>
                        {user ? (
                            <>
                                <li><span className="nav-link">Hi, {user.role === 'admin' ? 'Admin' : user.name}</span></li>
                                <li>
                                    <button onClick={logout} className="nav-link" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                                        Logout
                                    </button>
                                </li>
                            </>
                        ) : (
                            <li><a href="#login" className="nav-link" onClick={(e) => handleLinkClick(e, '#login')}>Login</a></li>
                        )}
                    </ul>
                </div>
            </div>
            {isCartOpen && <CartDropdown />}
        </nav>
    );
};

export default Navigation;