import React, { useState, useEffect, useRef } from 'react';
import { db } from '../base/firebaseConfig';
import { 
    collection, 
    query, 
    orderBy, 
    onSnapshot, 
    addDoc, 
    getDocs,
    doc,
    updateDoc,
    serverTimestamp,
    getDoc
} from 'firebase/firestore';

interface GroupChatProps {
    currentUser: string;
    conversationId: string | null;
    onBack: () => void;
    isNewGroup: boolean;
}

interface Message {
    id: string;
    senderId: string;
    text: string;
    timestamp: any;
}

const GroupChat: React.FC<GroupChatProps> = ({ 
    currentUser, 
    conversationId: initialConversationId,
    onBack,
    isNewGroup
}) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [conversationId, setConversationId] = useState<string | null>(initialConversationId);
    const [groupName, setGroupName] = useState('');
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
    const [allUsers, setAllUsers] = useState<string[]>([]);
    const [isCreatingGroup, setIsCreatingGroup] = useState(isNewGroup);
    const [groupInfo, setGroupInfo] = useState<any>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Fetch all users for group creation
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const usersSnapshot = await getDocs(collection(db, 'Users'));
                const users = usersSnapshot.docs
                    .map(doc => doc.id)
                    .filter(userId => userId !== currentUser);
                setAllUsers(users);
            } catch (error) {
                console.error('Error fetching users:', error);
            }
        };

        if (isCreatingGroup) {
            fetchUsers();
        }
    }, [currentUser, isCreatingGroup]);

    // Fetch group info if viewing existing group
    useEffect(() => {
        if (!conversationId || isNewGroup) return;

        const fetchGroupInfo = async () => {
            try {
                const groupDoc = await getDoc(doc(db, 'conversations', conversationId));
                if (groupDoc.exists()) {
                    setGroupInfo(groupDoc.data());
                }
            } catch (error) {
                console.error('Error fetching group info:', error);
            }
        };

        fetchGroupInfo();
    }, [conversationId, isNewGroup]);

    // Listen to messages
    useEffect(() => {
        if (!conversationId || isCreatingGroup) {
            setLoading(false);
            return;
        }

        const messagesRef = collection(db, 'conversations', conversationId, 'messages');
        const q = query(messagesRef, orderBy('timestamp', 'asc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const msgs: Message[] = [];
            snapshot.forEach((doc) => {
                msgs.push({
                    id: doc.id,
                    ...doc.data()
                } as Message);
            });
            setMessages(msgs);
            setLoading(false);
        }, (error) => {
            console.error('Error fetching messages:', error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [conversationId, isCreatingGroup]);

    const handleCreateGroup = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!groupName.trim() || selectedUsers.length === 0) return;

        try {
            const participants = [currentUser, ...selectedUsers];
            const newGroup = await addDoc(collection(db, 'conversations'), {
                type: 'group',
                groupName: groupName.trim(),
                participants,
                createdBy: currentUser,
                createdAt: serverTimestamp(),
                lastMessageTime: serverTimestamp(),
                lastMessage: 'Group created'
            });
            
            setConversationId(newGroup.id);
            setIsCreatingGroup(false);
        } catch (error) {
            console.error('Error creating group:', error);
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !conversationId) return;

        try {
            const messagesRef = collection(db, 'conversations', conversationId, 'messages');
            await addDoc(messagesRef, {
                senderId: currentUser,
                text: newMessage.trim(),
                timestamp: serverTimestamp()
            });

            const conversationRef = doc(db, 'conversations', conversationId);
            await updateDoc(conversationRef, {
                lastMessage: newMessage.trim(),
                lastMessageTime: serverTimestamp()
            });

            setNewMessage('');
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };

    const formatTimestamp = (timestamp: any) => {
        if (!timestamp) return '';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const toggleUserSelection = (userId: string) => {
        setSelectedUsers(prev => 
            prev.includes(userId) 
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
    };

    if (isCreatingGroup) {
        return (
            <div className="group-create-container">
                <div className="dm-header">
                    <button onClick={onBack} className="back-button">← Back</button>
                    <h3>👥 Create Group Chat</h3>
                </div>
                
                <form onSubmit={handleCreateGroup} className="group-create-form">
                    <div className="form-group">
                        <label>Group Name:</label>
                        <input
                            type="text"
                            value={groupName}
                            onChange={(e) => setGroupName(e.target.value)}
                            placeholder="e.g., Bird Watchers, Trail Hikers..."
                            className="group-name-input"
                            required
                        />
                    </div>
                    
                    <div className="form-group">
                        <label>Select Members ({selectedUsers.length} selected):</label>
                        <div className="user-selection-list">
                            {allUsers.map(userId => (
                                <div 
                                    key={userId}
                                    className={`user-selection-item ${selectedUsers.includes(userId) ? 'selected' : ''}`}
                                    onClick={() => toggleUserSelection(userId)}
                                >
                                    <input
                                        type="checkbox"
                                        checked={selectedUsers.includes(userId)}
                                        readOnly
                                    />
                                    <span>{userId}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    <button 
                        type="submit" 
                        className="btn-primary"
                        disabled={!groupName.trim() || selectedUsers.length === 0}
                    >
                        Create Group
                    </button>
                </form>
            </div>
        );
    }

    return (
        <div className="dm-container">
            <div className="dm-header">
                <button onClick={onBack} className="back-button">← Back</button>
                <div>
                    <h3>👥 {groupInfo?.groupName || 'Group Chat'}</h3>
                    {groupInfo && (
                        <div className="group-participants">
                            {groupInfo.participants.length} members
                        </div>
                    )}
                </div>
            </div>
            
            <div className="messages-container">
                {loading ? (
                    <div className="messages-loading">Loading messages...</div>
                ) : messages.length === 0 ? (
                    <div className="messages-empty">
                        <p>🌿 No messages yet</p>
                        <p>Start the conversation about nature!</p>
                    </div>
                ) : (
                    messages.map((msg) => (
                        <div 
                            key={msg.id}
                            className={`message ${msg.senderId === currentUser ? 'message-sent' : 'message-received'}`}
                        >
                            <div className="message-sender">
                                {msg.senderId === currentUser ? 'You' : msg.senderId}
                            </div>
                            <div className="message-text">{msg.text}</div>
                            <div className="message-time">{formatTimestamp(msg.timestamp)}</div>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="message-input-form">
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="message-input"
                />
                <button type="submit" className="send-button" disabled={!newMessage.trim()}>
                    Send
                </button>
            </form>
        </div>
    );
};

export default GroupChat;
