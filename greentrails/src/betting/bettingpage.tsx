import '../styles/style.css'
import '../styles/betting.css'
import React, { useEffect, useState } from 'react';
import { db } from '../base/firebaseConfig';
import { collection, getDocs, addDoc, doc, getDoc, updateDoc, increment, query, where, orderBy } from "firebase/firestore";
import { useAuth } from '../context/AuthContext';
import Navbar from '../componets/sadnavbar';
import Top from '../componets/header';
import { Cloudfooter } from '../componets/footer';
import { showNotification } from '../componets/Notification';

interface Bet {
    id: string;
    creator: string;
    description: string;
    wager: number;
    status: 'open' | 'accepted' | 'completed';
    opponent?: string;
    winner?: string;
    createdAt: Date;
    acceptedAt?: Date;
    completedAt?: Date;
}

const BettingPage: React.FC = () => {
    const { currentUser } = useAuth();
    const [bets, setBets] = useState<Bet[]>([]);
    const [loading, setLoading] = useState(true);
    const [userFireworks, setUserFireworks] = useState(0);
    
    // Create bet form state
    const [newBetDescription, setNewBetDescription] = useState('');
    const [newBetWager, setNewBetWager] = useState('');

    useEffect(() => {
        loadBets();
        if (currentUser) {
            loadUserFireworks();
        }
    }, [currentUser]);

    const loadUserFireworks = async () => {
        if (!currentUser) return;
        
        try {
            const userDocRef = doc(db, "Users", currentUser);
            const userDoc = await getDoc(userDocRef);
            
            if (userDoc.exists()) {
                const userData = userDoc.data();
                setUserFireworks(userData.santasPopped || 0);
            }
        } catch (error) {
            console.error("Error loading user fireworks:", error);
        }
    };

    const loadBets = async () => {
        try {
            const betsCollection = collection(db, "bets");
            const betsQuery = query(betsCollection, orderBy("createdAt", "desc"));
            const querySnapshot = await getDocs(betsQuery);
            
            const loadedBets: Bet[] = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                loadedBets.push({
                    id: doc.id,
                    creator: data.creator,
                    description: data.description,
                    wager: data.wager,
                    status: data.status,
                    opponent: data.opponent,
                    winner: data.winner,
                    createdAt: data.createdAt?.toDate(),
                    acceptedAt: data.acceptedAt?.toDate(),
                    completedAt: data.completedAt?.toDate()
                });
            });
            
            setBets(loadedBets);
        } catch (error) {
            console.error("Error loading bets:", error);
            showNotification("Error loading bets", "error");
        } finally {
            setLoading(false);
        }
    };

    const createBet = async () => {
        if (!currentUser) {
            showNotification("Please login to create a bet!", "error");
            return;
        }

        const wager = parseInt(newBetWager);
        
        if (!newBetDescription.trim()) {
            showNotification("Please enter a bet description!", "error");
            return;
        }

        if (isNaN(wager) || wager <= 0) {
            showNotification("Please enter a valid wager amount!", "error");
            return;
        }

        if (wager > userFireworks) {
            showNotification(`Not enough fireworks! You have ${userFireworks} but need ${wager}.`, "error");
            return;
        }

        try {
            // Deduct fireworks from creator
            const userDocRef = doc(db, "Users", currentUser);
            await updateDoc(userDocRef, {
                santasPopped: increment(-wager)
            });

            // Create bet document
            await addDoc(collection(db, "bets"), {
                creator: currentUser,
                description: newBetDescription.trim(),
                wager: wager,
                status: 'open',
                createdAt: new Date()
            });

            showNotification(`Bet created! ${wager} fireworks wagered.`, "success");
            setNewBetDescription('');
            setNewBetWager('');
            loadBets();
            loadUserFireworks();
        } catch (error) {
            console.error("Error creating bet:", error);
            showNotification("Error creating bet", "error");
        }
    };

    const acceptBet = async (bet: Bet) => {
        if (!currentUser) {
            showNotification("Please login to accept a bet!", "error");
            return;
        }

        if (currentUser === bet.creator) {
            showNotification("You cannot accept your own bet!", "error");
            return;
        }

        if (bet.wager > userFireworks) {
            showNotification(`Not enough fireworks! You have ${userFireworks} but need ${bet.wager}.`, "error");
            return;
        }

        try {
            // Deduct fireworks from opponent
            const userDocRef = doc(db, "Users", currentUser);
            await updateDoc(userDocRef, {
                santasPopped: increment(-bet.wager)
            });

            // Update bet document
            const betDocRef = doc(db, "bets", bet.id);
            await updateDoc(betDocRef, {
                opponent: currentUser,
                status: 'accepted',
                acceptedAt: new Date()
            });

            showNotification(`Bet accepted! ${bet.wager} fireworks wagered.`, "success");
            loadBets();
            loadUserFireworks();
        } catch (error) {
            console.error("Error accepting bet:", error);
            showNotification("Error accepting bet", "error");
        }
    };

    const declareSelfWinner = async (bet: Bet) => {
        if (!currentUser) {
            showNotification("Please login!", "error");
            return;
        }

        if (currentUser !== bet.creator && currentUser !== bet.opponent) {
            showNotification("You are not part of this bet!", "error");
            return;
        }

        try {
            // Award winnings (2x wager to winner)
            const winnerDocRef = doc(db, "Users", currentUser);
            await updateDoc(winnerDocRef, {
                santasPopped: increment(bet.wager * 2)
            });

            // Update bet document
            const betDocRef = doc(db, "bets", bet.id);
            await updateDoc(betDocRef, {
                winner: currentUser,
                status: 'completed',
                completedAt: new Date()
            });

            showNotification(`You won ${bet.wager * 2} fireworks!`, "success");
            loadBets();
            loadUserFireworks();
        } catch (error) {
            console.error("Error declaring winner:", error);
            showNotification("Error declaring winner", "error");
        }
    };

    const cancelBet = async (bet: Bet) => {
        if (!currentUser) {
            showNotification("Please login!", "error");
            return;
        }

        if (currentUser !== bet.creator) {
            showNotification("Only the creator can cancel this bet!", "error");
            return;
        }

        if (bet.status !== 'open') {
            showNotification("Can only cancel open bets!", "error");
            return;
        }

        try {
            // Refund fireworks to creator
            const userDocRef = doc(db, "Users", bet.creator);
            await updateDoc(userDocRef, {
                santasPopped: increment(bet.wager)
            });

            // Update bet document
            const betDocRef = doc(db, "bets", bet.id);
            await updateDoc(betDocRef, {
                status: 'completed',
                winner: 'cancelled',
                completedAt: new Date()
            });

            showNotification("Bet cancelled and fireworks refunded", "success");
            loadBets();
            loadUserFireworks();
        } catch (error) {
            console.error("Error cancelling bet:", error);
            showNotification("Error cancelling bet", "error");
        }
    };

    const getBetStatusClass = (status: string) => {
        switch (status) {
            case 'open': return 'bet-status-open';
            case 'accepted': return 'bet-status-accepted';
            case 'completed': return 'bet-status-completed';
            default: return '';
        }
    };

    if (loading) {
        return (
            <div>
                <Top message="Betting Arena" shadow={true} />
                <Navbar />
                <div className="betting-container">
                    <p>Loading bets...</p>
                </div>
            </div>
        );
    }

    return (
        <div>
            <Top message="Betting Arena" shadow={true} />
            <Navbar />
            
            <div className="betting-container">
                <div className="betting-header">
                    <h2>🎲 Place Your Bets! 🎲</h2>
                    {currentUser && (
                        <div className="user-fireworks">
                            <span>🎆 Your Fireworks: <strong>{userFireworks}</strong></span>
                        </div>
                    )}
                </div>

                {!currentUser && (
                    <div className="login-message">
                        <p>⚠️ Please login to create or accept bets!</p>
                    </div>
                )}

                {currentUser && (
                    <div className="create-bet-section">
                        <h3>Create New Bet</h3>
                        <div className="create-bet-form">
                            <input
                                type="text"
                                className="bet-input"
                                placeholder="What are you betting on? (e.g., 'I can do 50 pushups')"
                                value={newBetDescription}
                                onChange={(e) => setNewBetDescription(e.target.value)}
                                maxLength={200}
                            />
                            <input
                                type="number"
                                className="bet-input"
                                placeholder="Fireworks to wager"
                                value={newBetWager}
                                onChange={(e) => setNewBetWager(e.target.value)}
                                min="1"
                            />
                            <button 
                                className="btn-create-bet"
                                onClick={createBet}
                            >
                                Create Bet
                            </button>
                        </div>
                    </div>
                )}

                <div className="bets-section">
                    <h3>Active & Recent Bets</h3>
                    
                    {bets.length === 0 ? (
                        <div className="no-bets">
                            <p>No bets yet! Be the first to create one!</p>
                        </div>
                    ) : (
                        <div className="bets-list">
                            {bets.map((bet) => (
                                <div key={bet.id} className={`bet-card ${getBetStatusClass(bet.status)}`}>
                                    <div className="bet-header-row">
                                        <span className="bet-creator">👤 {bet.creator}</span>
                                        <span className={`bet-status ${getBetStatusClass(bet.status)}`}>
                                            {bet.status.toUpperCase()}
                                        </span>
                                    </div>
                                    
                                    <div className="bet-description">
                                        <p>{bet.description}</p>
                                    </div>
                                    
                                    <div className="bet-wager">
                                        <span>🎆 Wager: <strong>{bet.wager}</strong> fireworks each</span>
                                        <span className="bet-total">💰 Total pot: <strong>{bet.wager * 2}</strong></span>
                                    </div>

                                    {bet.opponent && (
                                        <div className="bet-opponent">
                                            <span>vs 👤 {bet.opponent}</span>
                                        </div>
                                    )}

                                    {bet.winner && bet.winner !== 'cancelled' && (
                                        <div className="bet-winner">
                                            <span>🏆 Winner: {bet.winner}</span>
                                        </div>
                                    )}

                                    {bet.winner === 'cancelled' && (
                                        <div className="bet-cancelled">
                                            <span>❌ Cancelled</span>
                                        </div>
                                    )}

                                    <div className="bet-actions">
                                        {currentUser && bet.status === 'open' && bet.creator !== currentUser && (
                                            <button 
                                                className="btn-accept-bet"
                                                onClick={() => acceptBet(bet)}
                                            >
                                                Accept Bet
                                            </button>
                                        )}

                                        {currentUser && bet.status === 'open' && bet.creator === currentUser && (
                                            <button 
                                                className="btn-cancel-bet"
                                                onClick={() => cancelBet(bet)}
                                            >
                                                Cancel Bet
                                            </button>
                                        )}

                                        {currentUser && bet.status === 'accepted' && 
                                         (currentUser === bet.creator || currentUser === bet.opponent) && (
                                            <button 
                                                className="btn-declare-winner"
                                                onClick={() => declareSelfWinner(bet)}
                                            >
                                                I Won!
                                            </button>
                                        )}
                                    </div>

                                    <div className="bet-timestamp">
                                        <small>Created: {bet.createdAt?.toLocaleDateString()} {bet.createdAt?.toLocaleTimeString()}</small>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="betting-info">
                    <h3>How Betting Works</h3>
                    <ul>
                        <li>🎯 Create a bet with a description and fireworks wager</li>
                        <li>🤝 Other users can accept your bet by matching the wager</li>
                        <li>🏆 When the bet is decided, the winner claims the full pot (2x wager)</li>
                        <li>⚠️ Both parties must agree on who won - use honor system!</li>
                        <li>💡 You can cancel open bets to get your fireworks back</li>
                    </ul>
                </div>
            </div>
            
            <Cloudfooter />
        </div>
    );
};

export default BettingPage;
