import '../styles/style.css'
import '../styles/messaging.css'
import React, { useState, useEffect } from 'react';
import Navbar from '../componets/sadnavbar';
import Top from '../componets/header';
import { Cloudfooter } from '../componets/footer';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import ChatList from './ChatList';
import DirectMessage from './DirectMessage';
import GroupChat from './GroupChat';
import UserSelector from './UserSelector';

const MessagingPage: React.FC = () => {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [activeView, setActiveView] = useState<'list' | 'dm' | 'group' | 'newDM' | 'newGroup'>('list');
    const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

    useEffect(() => {
        if (!currentUser) {
            // Redirect to signup if not logged in
            navigate('/signup/');
        }
    }, [currentUser, navigate]);

    if (!currentUser) {
        return (
            <div>
                <Top message="Nature Discussion Zone" shadow={true} />
                <Navbar />
                <div style={{ padding: '40px', textAlign: 'center' }}>
                    <p>Please sign up or log in to access the Nature Discussion Zone.</p>
                </div>
                <Cloudfooter />
            </div>
        );
    }

    const handleStartDM = (userId: string) => {
        setSelectedUserId(userId);
        setActiveView('dm');
    };

    const handleBackToList = () => {
        setActiveView('list');
        setSelectedConversationId(null);
        setSelectedUserId(null);
    };

    return (
        <div>
            <Top message="Nature Discussion Zone 🌿" shadow={true} />
            <Navbar />
            <div className="messaging-container">
                <div className="messaging-content">
                    {activeView === 'list' && (
                        <div>
                            <div className="messaging-header">
                                <h2>Your Conversations</h2>
                                <p className="messaging-subtitle">Discuss nature and environmental topics with fellow club members</p>
                            </div>
                            <div className="messaging-actions">
                                <button 
                                    className="btn-primary" 
                                    onClick={() => setActiveView('newDM')}
                                >
                                    ✉️ New Direct Message
                                </button>
                                <button 
                                    className="btn-secondary" 
                                    onClick={() => setActiveView('newGroup')}
                                >
                                    👥 New Group Chat
                                </button>
                            </div>
                            <ChatList 
                                currentUser={currentUser}
                                onSelectConversation={(id, type) => {
                                    setSelectedConversationId(id);
                                    setActiveView(type === 'dm' ? 'dm' : 'group');
                                }}
                            />
                        </div>
                    )}
                    {activeView === 'newDM' && (
                        <UserSelector 
                            currentUser={currentUser}
                            onSelectUser={handleStartDM}
                            onBack={handleBackToList}
                        />
                    )}
                    {activeView === 'dm' && (
                        <DirectMessage 
                            currentUser={currentUser}
                            otherUserId={selectedUserId}
                            conversationId={selectedConversationId}
                            onBack={handleBackToList}
                        />
                    )}
                    {activeView === 'newGroup' && (
                        <GroupChat 
                            currentUser={currentUser}
                            conversationId={null}
                            onBack={handleBackToList}
                            isNewGroup={true}
                        />
                    )}
                    {activeView === 'group' && selectedConversationId && (
                        <GroupChat 
                            currentUser={currentUser}
                            conversationId={selectedConversationId}
                            onBack={handleBackToList}
                            isNewGroup={false}
                        />
                    )}
                </div>
            </div>
            
        </div>
    );
};

export default MessagingPage;
