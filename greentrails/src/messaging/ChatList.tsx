import React, { useState, useEffect } from 'react';
import { db } from '../base/firebaseConfig';
import { collection, query, where, orderBy, onSnapshot, getDocs } from 'firebase/firestore';

interface ChatListProps {
    currentUser: string;
    onSelectConversation: (id: string, type: 'dm' | 'group') => void;
}

interface Conversation {
    id: string;
    type: 'dm' | 'group';
    participants: string[];
    groupName?: string;
    lastMessage?: string;
    lastMessageTime?: any;
    unreadCount?: number;
}

const ChatList: React.FC<ChatListProps> = ({ currentUser, onSelectConversation }) => {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Query conversations where current user is a participant
        const conversationsRef = collection(db, 'conversations');
        const q = query(
            conversationsRef,
            where('participants', 'array-contains', currentUser),
            orderBy('lastMessageTime', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const convos: Conversation[] = [];
            snapshot.forEach((doc) => {
                convos.push({
                    id: doc.id,
                    ...doc.data()
                } as Conversation);
            });
            setConversations(convos);
            setLoading(false);
        }, (error) => {
            console.error('Error fetching conversations:', error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [currentUser]);

    const getConversationDisplay = (convo: Conversation) => {
        if (convo.type === 'group') {
            return {
                name: convo.groupName || 'Unnamed Group',
                icon: '👥'
            };
        } else {
            // For DM, show the other person's name
            const otherUser = convo.participants.find(p => p !== currentUser);
            return {
                name: otherUser || 'Unknown User',
                icon: '💬'
            };
        }
    };

    const formatTime = (timestamp: any) => {
        if (!timestamp) return '';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        return date.toLocaleDateString();
    };

    if (loading) {
        return <div className="chat-list-loading">Loading conversations...</div>;
    }

    if (conversations.length === 0) {
        return (
            <div className="chat-list-empty">
                <p>🌿 No conversations yet!</p>
                <p>Start a new conversation to discuss nature topics with club members.</p>
            </div>
        );
    }

    return (
        <div className="chat-list">
            {conversations.map((convo) => {
                const display = getConversationDisplay(convo);
                return (
                    <div 
                        key={convo.id}
                        className="chat-list-item"
                        onClick={() => onSelectConversation(convo.id, convo.type)}
                    >
                        <div className="chat-icon">{display.icon}</div>
                        <div className="chat-info">
                            <div className="chat-name">{display.name}</div>
                            <div className="chat-last-message">
                                {convo.lastMessage || 'No messages yet'}
                            </div>
                        </div>
                        <div className="chat-time">
                            {formatTime(convo.lastMessageTime)}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default ChatList;
