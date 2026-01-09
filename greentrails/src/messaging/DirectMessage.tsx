import React, { useState, useEffect, useRef } from 'react';
import { db } from '../base/firebaseConfig';
import { 
    collection, 
    query, 
    where, 
    orderBy, 
    onSnapshot, 
    addDoc,
    getDocs,
    doc,
    updateDoc,
    serverTimestamp
} from 'firebase/firestore';

interface DirectMessageProps {
    currentUser: string;
    otherUserId: string | null;
    conversationId: string | null;
    onBack: () => void;
}

interface Message {
    id: string;
    senderId: string;
    text: string;
    timestamp: any;
}

const DirectMessage: React.FC<DirectMessageProps> = ({ 
    currentUser, 
    otherUserId, 
    conversationId: initialConversationId,
    onBack 
}) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [conversationId, setConversationId] = useState<string | null>(initialConversationId);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Get or create conversation
    useEffect(() => {
        if (!otherUserId) return;

        const setupConversation = async () => {
            if (conversationId) {
                // Use existing conversation
                return;
            }

            // Check if conversation already exists
            const conversationsRef = collection(db, 'conversations');
            const q = query(
                conversationsRef,
                where('type', '==', 'dm'),
                where('participants', 'array-contains', currentUser)
            );

            const snapshot = await getDocs(q);
            let existingConvo = null;

            snapshot.forEach((doc) => {
                const data = doc.data();
                if (data.participants.includes(otherUserId) && data.participants.length === 2) {
                    existingConvo = doc.id;
                }
            });

            if (existingConvo) {
                setConversationId(existingConvo);
            } else {
                // Create new conversation
                const newConvo = await addDoc(collection(db, 'conversations'), {
                    type: 'dm',
                    participants: [currentUser, otherUserId],
                    createdAt: serverTimestamp(),
                    lastMessageTime: serverTimestamp(),
                    lastMessage: ''
                });
                setConversationId(newConvo.id);
            }
        };

        setupConversation();
    }, [currentUser, otherUserId, conversationId]);

    // Listen to messages
    useEffect(() => {
        if (!conversationId) {
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
    }, [conversationId]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !conversationId) return;

        try {
            // Add message to conversation
            const messagesRef = collection(db, 'conversations', conversationId, 'messages');
            await addDoc(messagesRef, {
                senderId: currentUser,
                text: newMessage.trim(),
                timestamp: serverTimestamp()
            });

            // Update conversation last message
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

    if (!otherUserId) {
        return (
            <div className="dm-container">
                <div className="dm-header">
                    <button onClick={onBack} className="back-button">← Back</button>
                    <h3>Select a user to message</h3>
                </div>
            </div>
        );
    }

    return (
        <div className="dm-container">
            <div className="dm-header">
                <button onClick={onBack} className="back-button">← Back</button>
                <h3>💬 {otherUserId}</h3>
            </div>
            
            <div className="messages-container">
                {loading ? (
                    <div className="messages-loading">Loading messages...</div>
                ) : messages.length === 0 ? (
                    <div className="messages-empty">
                        <p>🌿 No messages yet</p>
                        <p>Start a conversation about nature!</p>
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
                    placeholder="Type a message about nature..."
                    className="message-input"
                />
                <button type="submit" className="send-button" disabled={!newMessage.trim()}>
                    Send
                </button>
            </form>
        </div>
    );
};

export default DirectMessage;
