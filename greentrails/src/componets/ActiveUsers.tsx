import React, { useEffect, useState } from 'react';
import { db } from '../base/firebaseConfig';
import { collection, getDocs } from 'firebase/firestore';
import '../styles/activeusers.css';

interface ActiveUser {
    name: string;
    lastActive: Date;
}

const ActiveUsers: React.FC = () => {
    const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchActiveUsers = async () => {
        try {
            // Consider users active if they've been active in the last 10 minutes
            const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
            
            // Note: We fetch all users to avoid needing a Firestore index on lastActive
            // This is acceptable since the leaderboard already fetches all users
            const usersSnapshot = await getDocs(collection(db, "Users"));
            
            const active: ActiveUser[] = [];
            usersSnapshot.forEach((doc) => {
                const data = doc.data();
                if (data.lastActive) {
                    const lastActiveDate = data.lastActive.toDate();
                    if (lastActiveDate > tenMinutesAgo) {
                        active.push({
                            name: data.Name || doc.id,
                            lastActive: lastActiveDate
                        });
                    }
                }
            });

            // Sort by most recently active
            active.sort((a, b) => b.lastActive.getTime() - a.lastActive.getTime());
            setActiveUsers(active);
        } catch (error) {
            console.error("Error fetching active users:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Fetch initially
        fetchActiveUsers();

        // Refresh every 2 minutes to keep data fresh without too many requests
        const interval = setInterval(fetchActiveUsers, 2 * 60 * 1000);

        return () => clearInterval(interval);
    }, []);

    if (loading) {
        return (
            <div className="active-users-container">
                <h3 className="active-users-title">🟢 Active Now</h3>
                <p className="active-users-loading">Loading...</p>
            </div>
        );
    }

    return (
        <div className="active-users-container">
            <h3 className="active-users-title">🟢 Active Now</h3>
            {activeUsers.length === 0 ? (
                <p className="active-users-empty">No users active right now</p>
            ) : (
                <div className="active-users-list">
                    {activeUsers.map((user, index) => (
                        <div key={index} className="active-user-item">
                            <span className="active-user-indicator">●</span>
                            <span className="active-user-name">{user.name}</span>
                        </div>
                    ))}
                    <div className="active-users-count">
                        {activeUsers.length} {activeUsers.length === 1 ? 'user' : 'users'} online
                    </div>
                </div>
            )}
        </div>
    );
};

export default ActiveUsers;
