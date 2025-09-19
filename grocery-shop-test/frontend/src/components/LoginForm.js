import React, { useState } from 'react';
import { useAuth } from '../App';
import { authAPI } from '../services/api';
import Toast from './Toast';

const LoginForm = () => {
    const { login } = useAuth();
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        name: '',
        acceptTerms: false
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [showToast, setShowToast] = useState(null);

    const validateEmail = (email) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    const getPasswordStrength = (password) => {
        if (password.length < 6) return 'weak';
        if (password.length < 10 && /[A-Z]/.test(password) && /[0-9]/.test(password)) return 'medium';
        if (password.length >= 10 && /[A-Z]/.test(password) && /[0-9]/.test(password) && /[!@#$%^&*]/.test(password)) return 'strong';
        return 'weak';
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const newErrors = {};

        if (!validateEmail(formData.email)) {
            newErrors.email = 'Please enter a valid email address';
        }

        if (formData.password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters';
        }

        if (!isLogin) {
            if (formData.password !== formData.confirmPassword) {
                newErrors.confirmPassword = 'Passwords do not match';
            }
            if (!formData.name) {
                newErrors.name = 'Name is required';
            }
            if (!formData.acceptTerms) {
                newErrors.acceptTerms = 'You must accept the terms and conditions';
            }
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setLoading(true);
        try {
            if (isLogin) {
                await login(formData.email, formData.password);
                setShowToast({ message: 'Login successful!', type: 'success' });
            } else {
                await authAPI.register(formData);
                setShowToast({ message: 'Registration successful!', type: 'success' });
            }
            setTimeout(() => {
                window.location.hash = '#home';
            }, 1000);
        } catch (error) {
            setShowToast({ message: error.response?.data?.error || error.message || 'An error occurred', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
            <div className="modal" style={{ position: 'static', maxWidth: '400px' }}>
                <div className="modal-header">
                    <h2 className="modal-title">{isLogin ? 'Login' : 'Sign Up'}</h2>
                </div>
                <div className="modal-body">
                    <form onSubmit={handleSubmit}>
                        {!isLogin && (
                            <div className="form-group">
                                <label className="form-label">Name</label>
                                <input
                                    type="text"
                                    className={`form-input ${errors.name ? 'error' : ''}`}
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Enter your name"
                                />
                                {errors.name && <div className="error-message">{errors.name}</div>}
                            </div>
                        )}

                        <div className="form-group">
                            <label className="form-label">Email</label>
                            <input
                                type="email"
                                className={`form-input ${errors.email ? 'error' : ''}`}
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                placeholder="Enter your email"
                            />
                            {errors.email && <div className="error-message">{errors.email}</div>}
                        </div>

                        <div className="form-group">
                            <label className="form-label">Password</label>
                            <input
                                type="password"
                                className={`form-input ${errors.password ? 'error' : ''}`}
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                placeholder="Enter your password"
                            />
                            {errors.password && <div className="error-message">{errors.password}</div>}
                            {!isLogin && formData.password && (
                                <div className="password-strength">
                                    <div className={`password-strength-bar ${getPasswordStrength(formData.password)}`}></div>
                                </div>
                            )}
                        </div>

                        {!isLogin && (
                            <>
                                <div className="form-group">
                                    <label className="form-label">Confirm Password</label>
                                    <input
                                        type="password"
                                        className={`form-input ${errors.confirmPassword ? 'error' : ''}`}
                                        value={formData.confirmPassword}
                                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                        placeholder="Confirm your password"
                                    />
                                    {errors.confirmPassword && <div className="error-message">{errors.confirmPassword}</div>}
                                </div>

                                <div className="form-group">
                                    <div className="checkbox-group">
                                        <input
                                            type="checkbox"
                                            className="checkbox"
                                            id="terms"
                                            checked={formData.acceptTerms}
                                            onChange={(e) => setFormData({ ...formData, acceptTerms: e.target.checked })}
                                        />
                                        <label htmlFor="terms">I accept the terms and conditions</label>
                                    </div>
                                    {errors.acceptTerms && <div className="error-message">{errors.acceptTerms}</div>}
                                </div>
                            </>
                        )}

                        <button type="submit" className="submit-btn" disabled={loading}>
                            {loading ? 'Loading...' : (isLogin ? 'Login' : 'Sign Up')}
                        </button>
                    </form>

                    <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                        <p>
                            {isLogin ? "Don't have an account? " : "Already have an account? "}
                            <a 
                                href="#" 
                                onClick={(e) => { e.preventDefault(); setIsLogin(!isLogin); setErrors({}); }}
                                style={{ color: '#667eea', textDecoration: 'none' }}
                            >
                                {isLogin ? 'Sign Up' : 'Login'}
                            </a>
                        </p>
                        {isLogin && (
                            <p style={{ marginTop: '0.5rem' }}>
                                <a href="#" style={{ color: '#667eea', textDecoration: 'none' }}>
                                    Forgot Password?
                                </a>
                            </p>
                        )}
                    </div>

                    {isLogin && (
                        <div style={{ marginTop: '1rem', padding: '1rem', background: '#f8f9fa', borderRadius: '8px' }}>
                            <p style={{ fontSize: '0.875rem', color: '#666' }}>
                                <strong>Test Accounts:</strong><br />
                                Admin: admin@grocery.com / Admin123!<br />
                                User: user@grocery.com / User123!
                            </p>
                        </div>
                    )}
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

export default LoginForm;