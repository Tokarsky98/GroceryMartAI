import React, { useState } from 'react';
import { useCart } from '../App';
import Toast from './Toast';

const CartDropdown = () => {
    const { cart, updateQuantity, removeFromCart, getCartTotal } = useCart();
    const [showToast, setShowToast] = useState(null);

    if (cart.length === 0) {
        return (
            <div className="cart-dropdown">
                <div style={{ padding: '2rem', textAlign: 'center' }}>
                    <p>Your cart is empty</p>
                </div>
            </div>
        );
    }

    return (
        <div className="cart-dropdown">
            {cart.map(item => {
                const product = item.product || item;
                const productId = item.productId || item.id;
                
                return (
                    <div key={productId} className="cart-item">
                        <img src={product.image} alt={product.name} className="cart-item-image" />
                        <div className="cart-item-info">
                            <div className="cart-item-name">{product.name}</div>
                            <div className="cart-item-price">${product.price}</div>
                            <div className="quantity-controls">
                                <button
                                    className="quantity-btn"
                                    onClick={async () => {
                                        try {
                                            await updateQuantity(productId, item.quantity - 1);
                                        } catch (error) {
                                            setShowToast({ message: error.message, type: 'error' });
                                        }
                                    }}
                                >
                                    -
                                </button>
                                <span>{item.quantity}</span>
                                <button
                                    className="quantity-btn"
                                    onClick={async () => {
                                        try {
                                            await updateQuantity(productId, item.quantity + 1);
                                        } catch (error) {
                                            setShowToast({ message: error.message, type: 'error' });
                                        }
                                    }}
                                    disabled={item.quantity >= product.stock}
                                    style={{
                                        opacity: item.quantity >= product.stock ? 0.5 : 1,
                                        cursor: item.quantity >= product.stock ? 'not-allowed' : 'pointer'
                                    }}
                                >
                                    +
                                </button>
                            </div>
                        </div>
                        <button 
                            onClick={() => removeFromCart(productId)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}
                        >
                            ✕
                        </button>
                    </div>
                );
            })}
            <div className="cart-footer">
                <div className="cart-total">
                    <span>Total:</span>
                    <span>${getCartTotal().toFixed(2)}</span>
                </div>
                <button 
                    className="checkout-btn"
                    onClick={() => window.location.hash = '#checkout'}
                >
                    Proceed to Checkout
                </button>
            </div>
            {showToast && (
                <Toast
                    message={showToast.message}
                    type={showToast.type}
                    onClose={() => setShowToast(null)}
                />
            )}
        </div>
    );
};

export default CartDropdown;