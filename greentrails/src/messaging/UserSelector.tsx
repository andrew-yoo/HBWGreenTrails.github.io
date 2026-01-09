import React, { useState, useEffect } from 'react';
import { db } from '../base/firebaseConfig';
import { collection, getDocs } from 'firebase/firestore';

interface UserSelectorProps {
    currentUser: string;
    onSelectUser: (userId: string) => void;
    onBack: () => void;
}

const UserSelector: React.FC<UserSelectorProps> = ({ currentUser, onSelectUser, onBack }) => {
    const [allUsers, setAllUsers] = useState<string[]>([]);
    const [filteredUsers, setFilteredUsers] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const usersSnapshot = await getDocs(collection(db, 'Users'));
                const users = usersSnapshot.docs
                    .map(doc => doc.id)
                    .filter(userId => userId !== currentUser)
                    .sort();
                setAllUsers(users);
                setFilteredUsers(users);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching users:', error);
                setLoading(false);
            }
        };

        fetchUsers();
    }, [currentUser]);

    useEffect(() => {
        if (searchQuery.trim() === '') {
            setFilteredUsers(allUsers);
        } else {
            const query = searchQuery.toLowerCase();
            setFilteredUsers(
                allUsers.filter(user => user.toLowerCase().includes(query))
            );
        }
    }, [searchQuery, allUsers]);

    if (loading) {
        return (
            <div className="user-selector-container">
                <div className="dm-header">
                    <button onClick={onBack} className="back-button">← Back</button>
                    <h3>Select User</h3>
                </div>
                <div className="user-selector-loading">Loading users...</div>
            </div>
        );
    }

    return (
        <div className="user-selector-container">
            <div className="dm-header">
                <button onClick={onBack} className="back-button">← Back</button>
                <h3>Select User to Message</h3>
            </div>
            
            <div className="user-selector-search">
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search users..."
                    className="search-input"
                />
            </div>

            <div className="user-selector-list">
                {filteredUsers.length === 0 ? (
                    <div className="user-selector-empty">
                        {searchQuery ? 'No users found matching your search.' : 'No other users available.'}
                    </div>
                ) : (
                    filteredUsers.map(userId => (
                        <div 
                            key={userId}
                            className="user-selector-item"
                            onClick={() => onSelectUser(userId)}
                        >
                            <div className="user-icon">👤</div>
                            <div className="user-name">{userId}</div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default UserSelector;
