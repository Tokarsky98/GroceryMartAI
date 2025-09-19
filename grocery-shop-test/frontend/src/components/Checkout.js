import React, { useState } from 'react';
import { useAuth, useCart } from '../App';
import { ordersAPI } from '../services/api';
import Toast from './Toast';

const Checkout = () => {
    const { cart, clearCart, getCartTotal } = useCart();
    const { user } = useAuth();
    const [step, setStep] = useState(1);
    const [showToast, setShowToast] = useState(null);
    const [formData, setFormData] = useState({
        // Shipping
        fullName: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        zipCode: '',
        // Payment
        cardNumber: '',
        cardName: '',
        expiryDate: '',
        cvv: '',
        // Options
        deliveryOption: 'standard',
        newsletter: false
    });

    const [errors, setErrors] = useState({});

    if (!user) {
        window.location.hash = '#login';
        return null;
    }

    if (cart.length === 0) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                    <h2>Your cart is empty</h2>
                    <button 
                        className="submit-btn" 
                        style={{ width: 'auto', marginTop: '1rem' }}
                        onClick={() => window.location.hash = '#products'}
                    >
                        Continue Shopping
                    </button>
                </div>
            </div>
        );
    }

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validate current step
        let stepErrors = {};

        if (step === 1) {
            if (!formData.fullName.trim()) stepErrors.fullName = 'Full name is required';
            if (!formData.email.trim()) stepErrors.email = 'Email is required';
            if (!formData.phone.trim()) stepErrors.phone = 'Phone is required';
            else if (!validatePhone(formData.phone)) stepErrors.phone = 'Please enter a valid phone number';
            if (!formData.address.trim()) stepErrors.address = 'Address is required';
            if (!formData.city.trim()) stepErrors.city = 'City is required';
            if (!formData.zipCode.trim()) stepErrors.zipCode = 'ZIP code is required';
        }

        if (step === 2) {
            if (!formData.cardNumber.trim()) stepErrors.cardNumber = 'Card number is required';
            else if (!validateCardNumber(formData.cardNumber)) stepErrors.cardNumber = 'Please enter a valid card number';
            if (!formData.cardName.trim()) stepErrors.cardName = 'Cardholder name is required';
            if (!formData.expiryDate.trim()) stepErrors.expiryDate = 'Expiry date is required';
            else if (!validateExpiryDate(formData.expiryDate)) stepErrors.expiryDate = 'Please enter a valid expiry date';
            if (!formData.cvv.trim()) stepErrors.cvv = 'CVV is required';
            else if (!validateCVV(formData.cvv)) stepErrors.cvv = 'Please enter a valid CVV';
        }

        if (Object.keys(stepErrors).length > 0) {
            setErrors(stepErrors);
            return;
        }

        if (step < 3) {
            setStep(step + 1);
        } else {
            // Process order
            try {
                const orderData = {
                    items: cart,
                    shippingAddress: {
                        fullName: formData.fullName,
                        email: formData.email,
                        phone: formData.phone,
                        address: formData.address,
                        city: formData.city,
                        zipCode: formData.zipCode
                    },
                    paymentMethod: {
                        cardNumber: formData.cardNumber,
                        cardName: formData.cardName,
                        expiryDate: formData.expiryDate
                    },
                    deliveryOption: formData.deliveryOption
                };

                await ordersAPI.createOrder(orderData);
                setShowToast({ message: 'Order placed successfully!', type: 'success' });
                clearCart();
                setTimeout(() => {
                    window.location.hash = '#home';
                }, 2000);
            } catch (error) {
                console.error('Failed to place order:', error);
                setShowToast({ message: error.response?.data?.error || 'Failed to place order', type: 'error' });
            }
        }
    };

    const getDeliveryPrice = () => {
        switch (formData.deliveryOption) {
            case 'express': return 9.99;
            case 'overnight': return 19.99;
            default: return 0;
        }
    };

    const getTotalWithDelivery = () => {
        return getCartTotal() + getDeliveryPrice();
    };

    // Validation functions
    const validatePhone = (phone) => {
        const digitsOnly = phone.replace(/\D/g, '');
        return digitsOnly.length >= 7 && digitsOnly.length <= 9;
    };

    const validateCardNumber = (cardNumber) => {
        const digitsOnly = cardNumber.replace(/\s/g, '');
        return /^[0-9]{13,19}$/.test(digitsOnly);
    };

    const validateExpiryDate = (expiryDate) => {
        if (!/^\d{2}\/\d{2}$/.test(expiryDate)) return false;
        const [month, year] = expiryDate.split('/');
        const monthNum = parseInt(month, 10);
        const yearNum = parseInt('20' + year, 10);
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1;

        if (monthNum < 1 || monthNum > 12) return false;
        if (yearNum < currentYear) return false;
        if (yearNum === currentYear && monthNum < currentMonth) return false;
        return true;
    };

    const validateCVV = (cvv) => {
        return /^[0-9]{3}$/.test(cvv);
    };

    // Format functions
    const formatCardNumber = (value) => {
        const digitsOnly = value.replace(/\D/g, '');
        const formatted = digitsOnly.replace(/(\d{4})(?=\d)/g, '$1 ');
        return formatted.substring(0, 19); // 16 digits + 3 spaces
    };

    const formatExpiryDate = (value) => {
        const digitsOnly = value.replace(/\D/g, '');
        if (digitsOnly.length >= 2) {
            return digitsOnly.substring(0, 2) + '/' + digitsOnly.substring(2, 4);
        }
        return digitsOnly;
    };

    const formatPhone = (value) => {
        const digitsOnly = value.replace(/\D/g, '').substring(0, 9);
        if (digitsOnly.length <= 3) {
            return digitsOnly;
        } else if (digitsOnly.length <= 6) {
            return digitsOnly.substring(0, 3) + ' ' + digitsOnly.substring(3);
        } else {
            return digitsOnly.substring(0, 3) + ' ' + digitsOnly.substring(3, 6) + ' ' + digitsOnly.substring(6);
        }
    };

    // Handle input changes with validation
    const handleInputChange = (field, value) => {
        let formattedValue = value;
        let fieldErrors = { ...errors };

        switch (field) {
            case 'phone':
                formattedValue = formatPhone(value);
                if (formattedValue && !validatePhone(formattedValue)) {
                    fieldErrors.phone = 'Please enter a valid phone number (7-9 digits)';
                } else {
                    delete fieldErrors.phone;
                }
                break;
            case 'cardNumber':
                formattedValue = formatCardNumber(value);
                if (formattedValue && !validateCardNumber(formattedValue)) {
                    fieldErrors.cardNumber = 'Please enter a valid card number (13-19 digits)';
                } else {
                    delete fieldErrors.cardNumber;
                }
                break;
            case 'expiryDate':
                formattedValue = formatExpiryDate(value);
                if (formattedValue && !validateExpiryDate(formattedValue)) {
                    fieldErrors.expiryDate = 'Please enter a valid expiry date (MM/YY)';
                } else {
                    delete fieldErrors.expiryDate;
                }
                break;
            case 'cvv':
                formattedValue = value.replace(/\D/g, '').substring(0, 3);
                if (formattedValue && !validateCVV(formattedValue)) {
                    fieldErrors.cvv = 'Please enter a valid CVV (3 digits)';
                } else {
                    delete fieldErrors.cvv;
                }
                break;
            default:
                break;
        }

        setErrors(fieldErrors);
        setFormData({ ...formData, [field]: formattedValue });
    };

    return (
        <div style={{ minHeight: '100vh', padding: '2rem' }}>
            <div className="container">
                <div className="modal" style={{ position: 'static', maxWidth: '800px', margin: '0 auto' }}>
                    <div className="modal-header">
                        <h2 className="modal-title">Checkout</h2>
                    </div>
                    <div className="modal-body">
                        {/* Progress Steps */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
                            {['Shipping', 'Payment', 'Review'].map((label, index) => (
                                <div key={label} style={{ flex: 1, textAlign: 'center' }}>
                                    <div style={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '50%',
                                        background: step > index ? '#26de81' : step === index + 1 ? '#667eea' : '#e0e0e0',
                                        color: 'white',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        margin: '0 auto 0.5rem',
                                        fontWeight: 'bold'
                                    }}>
                                        {step > index ? '✓' : index + 1}
                                    </div>
                                    <div style={{ color: step >= index + 1 ? '#333' : '#999' }}>{label}</div>
                                </div>
                            ))}
                        </div>

                        <form onSubmit={handleSubmit}>
                            {step === 1 && (
                                <>
                                    <h3>Shipping Information</h3>
                                    <div className="form-group">
                                        <label className="form-label">Full Name</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={formData.fullName}
                                            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Email</label>
                                        <input
                                            type="email"
                                            className="form-input"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Phone</label>
                                        <input
                                            type="tel"
                                            className={`form-input ${errors.phone ? 'error' : ''}`}
                                            value={formData.phone}
                                            onChange={(e) => handleInputChange('phone', e.target.value)}
                                            placeholder="123 456 789"
                                            required
                                        />
                                        {errors.phone && <div className="error-message">{errors.phone}</div>}
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Address</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={formData.address}
                                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                        <div className="form-group">
                                            <label className="form-label">City</label>
                                            <input
                                                type="text"
                                                className="form-input"
                                                value={formData.city}
                                                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">ZIP Code</label>
                                            <input
                                                type="text"
                                                className="form-input"
                                                value={formData.zipCode}
                                                onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Delivery Option</label>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <input
                                                    type="radio"
                                                    name="delivery"
                                                    value="standard"
                                                    checked={formData.deliveryOption === 'standard'}
                                                    onChange={(e) => setFormData({ ...formData, deliveryOption: e.target.value })}
                                                />
                                                Standard Delivery (5-7 days) - Free
                                            </label>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <input
                                                    type="radio"
                                                    name="delivery"
                                                    value="express"
                                                    checked={formData.deliveryOption === 'express'}
                                                    onChange={(e) => setFormData({ ...formData, deliveryOption: e.target.value })}
                                                />
                                                Express Delivery (2-3 days) - $9.99
                                            </label>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <input
                                                    type="radio"
                                                    name="delivery"
                                                    value="overnight"
                                                    checked={formData.deliveryOption === 'overnight'}
                                                    onChange={(e) => setFormData({ ...formData, deliveryOption: e.target.value })}
                                                />
                                                Overnight Delivery - $19.99
                                            </label>
                                        </div>
                                    </div>
                                </>
                            )}

                            {step === 2 && (
                                <>
                                    <h3>Payment Information</h3>
                                    <div className="form-group">
                                        <label className="form-label">Card Number</label>
                                        <input
                                            type="text"
                                            className={`form-input ${errors.cardNumber ? 'error' : ''}`}
                                            placeholder="1234 5678 9012 3456"
                                            value={formData.cardNumber}
                                            onChange={(e) => handleInputChange('cardNumber', e.target.value)}
                                            maxLength="19"
                                            required
                                        />
                                        {errors.cardNumber && <div className="error-message">{errors.cardNumber}</div>}
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Cardholder Name</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={formData.cardName}
                                            onChange={(e) => setFormData({ ...formData, cardName: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                        <div className="form-group">
                                            <label className="form-label">Expiry Date</label>
                                            <input
                                                type="text"
                                                className={`form-input ${errors.expiryDate ? 'error' : ''}`}
                                                placeholder="MM/YY"
                                                value={formData.expiryDate}
                                                onChange={(e) => handleInputChange('expiryDate', e.target.value)}
                                                maxLength="5"
                                                required
                                            />
                                            {errors.expiryDate && <div className="error-message">{errors.expiryDate}</div>}
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">CVV</label>
                                            <input
                                                type="text"
                                                className={`form-input ${errors.cvv ? 'error' : ''}`}
                                                placeholder="123"
                                                value={formData.cvv}
                                                onChange={(e) => handleInputChange('cvv', e.target.value)}
                                                maxLength="3"
                                                required
                                            />
                                            {errors.cvv && <div className="error-message">{errors.cvv}</div>}
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <div className="checkbox-group">
                                            <input
                                                type="checkbox"
                                                className="checkbox"
                                                id="newsletter"
                                                checked={formData.newsletter}
                                                onChange={(e) => setFormData({ ...formData, newsletter: e.target.checked })}
                                            />
                                            <label htmlFor="newsletter">Subscribe to our newsletter for special offers</label>
                                        </div>
                                    </div>
                                </>
                            )}

                            {step === 3 && (
                                <>
                                    <h3>Order Review</h3>
                                    <div style={{ background: '#f8f9fa', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
                                        <h4>Order Summary</h4>
                                        {cart.map(item => {
                                            const product = item.product || item;
                                            const price = product.price || 0;
                                            return (
                                                <div key={item.productId || item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0' }}>
                                                    <span>{product.name} x {item.quantity}</span>
                                                    <span>${(price * item.quantity).toFixed(2)}</span>
                                                </div>
                                            );
                                        })}
                                        <div style={{ borderTop: '1px solid #e0e0e0', marginTop: '0.5rem', paddingTop: '0.5rem' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0' }}>
                                                <span>Subtotal:</span>
                                                <span>${getCartTotal().toFixed(2)}</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0' }}>
                                                <span>Delivery:</span>
                                                <span>${getDeliveryPrice().toFixed(2)}</span>
                                            </div>
                                            <div style={{ fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0' }}>
                                                <span>Total:</span>
                                                <span>${getTotalWithDelivery().toFixed(2)}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ marginBottom: '1rem' }}>
                                        <h4>Shipping Address</h4>
                                        <p>{formData.fullName}<br />
                                        {formData.address}<br />
                                        {formData.city}, {formData.zipCode}<br />
                                        {formData.phone}</p>
                                    </div>
                                    <div>
                                        <h4>Payment Method</h4>
                                        <p>Card ending in {formData.cardNumber.slice(-4)}</p>
                                    </div>
                                </>
                            )}

                            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                                {step > 1 && (
                                    <button
                                        type="button"
                                        className="submit-btn"
                                        style={{ background: '#999' }}
                                        onClick={() => setStep(step - 1)}
                                    >
                                        Previous
                                    </button>
                                )}
                                <button type="submit" className="submit-btn" style={{ flex: 1 }}>
                                    {step === 3 ? 'Place Order' : 'Next'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
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

export default Checkout;