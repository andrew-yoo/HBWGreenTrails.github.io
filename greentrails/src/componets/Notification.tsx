import React, { useEffect, useState } from 'react';

interface NotificationProps {
    message: string;
    type?: 'success' | 'error' | 'info';
    duration?: number;
    onClose: () => void;
}

const Notification: React.FC<NotificationProps> = ({ 
    message, 
    type = 'info', 
    duration = 3000, 
    onClose 
}) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, duration);

        return () => clearTimeout(timer);
    }, [duration, onClose]);

    const getBackgroundColor = () => {
        switch (type) {
            case 'success':
                return '#4CAF50';
            case 'error':
                return '#f44336';
            case 'info':
            default:
                return '#2196F3';
        }
    };

    return (
        <div style={{
            position: 'fixed',
            top: '80px',
            right: '20px',
            backgroundColor: getBackgroundColor(),
            color: 'white',
            padding: '16px 24px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            zIndex: 10000,
            maxWidth: '400px',
            fontSize: '16px',
            fontWeight: '500',
            animation: 'slideIn 0.3s ease-out',
            cursor: 'pointer'
        }}
        onClick={onClose}
        >
            {message}
            <style>
                {`
                    @keyframes slideIn {
                        from {
                            transform: translateX(400px);
                            opacity: 0;
                        }
                        to {
                            transform: translateX(0);
                            opacity: 1;
                        }
                    }
                `}
            </style>
        </div>
    );
};

// Notification manager component
interface NotificationData {
    id: number;
    message: string;
    type: 'success' | 'error' | 'info';
}

export const NotificationContainer: React.FC = () => {
    const [notifications, setNotifications] = useState<NotificationData[]>([]);

    useEffect(() => {
        // Listen for custom notification events
        const handleNotification = (event: CustomEvent) => {
            const { message, type } = event.detail;
            const id = Date.now();
            setNotifications(prev => [...prev, { id, message, type }]);
        };

        window.addEventListener('show-notification' as any, handleNotification);

        return () => {
            window.removeEventListener('show-notification' as any, handleNotification);
        };
    }, []);

    const removeNotification = (id: number) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    return (
        <>
            {notifications.map((notification, index) => (
                <div key={notification.id} style={{ 
                    position: 'fixed',
                    top: `${80 + index * 80}px`,
                    right: '20px',
                    zIndex: 10000 + index
                }}>
                    <Notification
                        message={notification.message}
                        type={notification.type}
                        onClose={() => removeNotification(notification.id)}
                    />
                </div>
            ))}
        </>
    );
};

// Helper function to show notifications
export const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const event = new CustomEvent('show-notification', {
        detail: { message, type }
    });
    window.dispatchEvent(event);
};

export default Notification;
