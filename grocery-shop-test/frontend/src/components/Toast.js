import React, { useEffect } from 'react';

const Toast = ({ message, type, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(onClose, 3000);
        return () => clearTimeout(timer);
    }, [onClose]);

    const icons = {
        success: '✓',
        error: '✗',
        warning: '⚠'
    };

    return (
        <div className={`toast ${type}`}>
            <span className="toast-icon">{icons[type]}</span>
            <span>{message}</span>
        </div>
    );
};

export default Toast;