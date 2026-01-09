import '../styles/style.css'
import '../styles/betting.css'
import React, { useEffect, useState } from 'react';
import { db } from '../base/firebaseConfig';
import { collection, getDocs, addDoc, doc, getDoc, updateDoc, increment, query, where, orderBy, runTransaction } from "firebase/firestore";
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
    creatorOdds: number; // Multiplier for creator (e.g., 2 means 2:1 odds)
    opponentOdds: number; // Multiplier for opponent
    betType: 'fireworks_race' | 'leaderboard_position' | 'score_milestone';
    targetValue?: number; // Target for milestone bets
    deadline?: Date; // When to check the result
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
    const [newBetType, setNewBetType] = useState<'fireworks_race' | 'leaderboard_position' | 'score_milestone'>('fireworks_race');
    const [creatorOdds, setCreatorOdds] = useState('2');
    const [opponentOdds, setOpponentOdds] = useState('2');
    const [targetValue, setTargetValue] = useState('');
    const [deadline, setDeadline] = useState('');

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
                    creatorOdds: data.creatorOdds || 2,
                    opponentOdds: data.opponentOdds || 2,
                    betType: data.betType || 'fireworks_race',
                    targetValue: data.targetValue,
                    deadline: data.deadline?.toDate(),
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
        const creatorOddsNum = parseFloat(creatorOdds);
        const opponentOddsNum = parseFloat(opponentOdds);
        
        if (!newBetDescription.trim()) {
            showNotification("Please enter a bet description!", "error");
            return;
        }

        if (isNaN(wager) || wager <= 0) {
            showNotification("Please enter a valid wager amount!", "error");
            return;
        }

        if (isNaN(creatorOddsNum) || creatorOddsNum <= 0 || isNaN(opponentOddsNum) || opponentOddsNum <= 0) {
            showNotification("Please enter valid odds!", "error");
            return;
        }

        if (wager > userFireworks) {
            showNotification(`Not enough fireworks! You have ${userFireworks} but need ${wager}.`, "error");
            return;
        }

        if (newBetType === 'score_milestone' && (!targetValue || parseInt(targetValue) <= 0)) {
            showNotification("Please enter a target value for milestone bets!", "error");
            return;
        }

        if (!deadline) {
            showNotification("Please set a deadline for the bet!", "error");
            return;
        }

        try {
            // Use transaction to ensure atomicity
            await runTransaction(db, async (transaction) => {
                const userDocRef = doc(db, "Users", currentUser);
                const userDoc = await transaction.get(userDocRef);
                
                if (!userDoc.exists()) {
                    throw new Error("User not found");
                }
                
                const currentFireworks = userDoc.data().santasPopped || 0;
                if (currentFireworks < wager) {
                    throw new Error("Insufficient fireworks");
                }
                
                // Deduct fireworks from creator
                transaction.update(userDocRef, {
                    santasPopped: increment(-wager)
                });
                
                // Create bet document
                const betDocRef = doc(collection(db, "bets"));
                transaction.set(betDocRef, {
                    creator: currentUser,
                    description: newBetDescription.trim(),
                    wager: wager,
                    creatorOdds: creatorOddsNum,
                    opponentOdds: opponentOddsNum,
                    betType: newBetType,
                    targetValue: targetValue ? parseInt(targetValue) : undefined,
                    deadline: new Date(deadline),
                    status: 'open',
                    createdAt: new Date()
                });
            });

            showNotification(`Bet created with ${creatorOddsNum}:${opponentOddsNum} odds!`, "success");
            setNewBetDescription('');
            setNewBetWager('');
            setCreatorOdds('2');
            setOpponentOdds('2');
            setTargetValue('');
            setDeadline('');
            loadBets();
            loadUserFireworks();
        } catch (error) {
            console.error("Error creating bet:", error);
            if (error instanceof Error && error.message === "Insufficient fireworks") {
                showNotification("Not enough fireworks!", "error");
            } else {
                showNotification("Error creating bet", "error");
            }
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
            // Use transaction to ensure atomicity
            await runTransaction(db, async (transaction) => {
                const userDocRef = doc(db, "Users", currentUser);
                const betDocRef = doc(db, "bets", bet.id);
                
                const userDoc = await transaction.get(userDocRef);
                const betDoc = await transaction.get(betDocRef);
                
                if (!userDoc.exists()) {
                    throw new Error("User not found");
                }
                
                if (!betDoc.exists()) {
                    throw new Error("Bet not found");
                }
                
                const betData = betDoc.data();
                if (betData.status !== 'open') {
                    throw new Error("Bet is no longer open");
                }
                
                const currentFireworks = userDoc.data().santasPopped || 0;
                if (currentFireworks < bet.wager) {
                    throw new Error("Insufficient fireworks");
                }
                
                // Deduct fireworks from opponent
                transaction.update(userDocRef, {
                    santasPopped: increment(-bet.wager)
                });
                
                // Update bet document
                transaction.update(betDocRef, {
                    opponent: currentUser,
                    status: 'accepted',
                    acceptedAt: new Date()
                });
            });

            showNotification(`Bet accepted! ${bet.wager} fireworks wagered.`, "success");
            loadBets();
            loadUserFireworks();
        } catch (error) {
            console.error("Error accepting bet:", error);
            if (error instanceof Error) {
                if (error.message === "Insufficient fireworks") {
                    showNotification("Not enough fireworks!", "error");
                } else if (error.message === "Bet is no longer open") {
                    showNotification("This bet is no longer available", "error");
                } else {
                    showNotification("Error accepting bet", "error");
                }
            } else {
                showNotification("Error accepting bet", "error");
            }
        }
    };

    const resolveBet = async (bet: Bet) => {
        if (!currentUser) {
            showNotification("Please login!", "error");
            return;
        }

        if (currentUser !== bet.creator && currentUser !== bet.opponent) {
            showNotification("You are not part of this bet!", "error");
            return;
        }

        if (!bet.opponent) {
            showNotification("Bet has not been accepted yet!", "error");
            return;
        }

        try {
            // Get current stats for both users
            const creatorDocRef = doc(db, "Users", bet.creator);
            const opponentDocRef = doc(db, "Users", bet.opponent);
            
            const [creatorDoc, opponentDoc] = await Promise.all([
                getDoc(creatorDocRef),
                getDoc(opponentDocRef)
            ]);

            if (!creatorDoc.exists() || !opponentDoc.exists()) {
                showNotification("Error loading user data", "error");
                return;
            }

            const creatorData = creatorDoc.data();
            const opponentData = opponentDoc.data();

            let winner = '';
            let payout = 0;

            // Determine winner based on bet type
            if (bet.betType === 'fireworks_race') {
                // Most fireworks wins
                const creatorFireworks = creatorData.santasPopped || 0;
                const opponentFireworks = opponentData.santasPopped || 0;
                
                if (creatorFireworks > opponentFireworks) {
                    winner = bet.creator;
                    payout = bet.wager * (1 + bet.creatorOdds);
                } else if (opponentFireworks > creatorFireworks) {
                    winner = bet.opponent;
                    payout = bet.wager * (1 + bet.opponentOdds);
                } else {
                    // Tie - refund both
                    showNotification("It's a tie! Both users refunded.", "info");
                    await runTransaction(db, async (transaction) => {
                        transaction.update(creatorDocRef, { santasPopped: increment(bet.wager) });
                        transaction.update(opponentDocRef, { santasPopped: increment(bet.wager) });
                        transaction.update(doc(db, "bets", bet.id), {
                            status: 'completed',
                            winner: 'tie',
                            completedAt: new Date()
                        });
                    });
                    loadBets();
                    loadUserFireworks();
                    return;
                }
            } else if (bet.betType === 'leaderboard_position') {
                // Higher score wins
                const creatorScore = creatorData.score || 0;
                const opponentScore = opponentData.score || 0;
                
                if (creatorScore > opponentScore) {
                    winner = bet.creator;
                    payout = bet.wager * (1 + bet.creatorOdds);
                } else if (opponentScore > creatorScore) {
                    winner = bet.opponent;
                    payout = bet.wager * (1 + bet.opponentOdds);
                } else {
                    // Tie - refund both
                    showNotification("It's a tie! Both users refunded.", "info");
                    await runTransaction(db, async (transaction) => {
                        transaction.update(creatorDocRef, { santasPopped: increment(bet.wager) });
                        transaction.update(opponentDocRef, { santasPopped: increment(bet.wager) });
                        transaction.update(doc(db, "bets", bet.id), {
                            status: 'completed',
                            winner: 'tie',
                            completedAt: new Date()
                        });
                    });
                    loadBets();
                    loadUserFireworks();
                    return;
                }
            } else if (bet.betType === 'score_milestone') {
                // First to reach target wins
                const creatorScore = creatorData.score || 0;
                const opponentScore = opponentData.score || 0;
                const target = bet.targetValue || 0;
                
                const creatorReached = creatorScore >= target;
                const opponentReached = opponentScore >= target;
                
                if (creatorReached && !opponentReached) {
                    winner = bet.creator;
                    payout = bet.wager * (1 + bet.creatorOdds);
                } else if (opponentReached && !creatorReached) {
                    winner = bet.opponent;
                    payout = bet.wager * (1 + bet.opponentOdds);
                } else if (creatorReached && opponentReached) {
                    // Both reached - tie
                    showNotification("Both reached the milestone! Refunded.", "info");
                    await runTransaction(db, async (transaction) => {
                        transaction.update(creatorDocRef, { santasPopped: increment(bet.wager) });
                        transaction.update(opponentDocRef, { santasPopped: increment(bet.wager) });
                        transaction.update(doc(db, "bets", bet.id), {
                            status: 'completed',
                            winner: 'tie',
                            completedAt: new Date()
                        });
                    });
                    loadBets();
                    loadUserFireworks();
                    return;
                } else {
                    showNotification("Neither user has reached the milestone yet!", "error");
                    return;
                }
            }

            // Award winnings using transaction
            await runTransaction(db, async (transaction) => {
                const betDocRef = doc(db, "bets", bet.id);
                const betDoc = await transaction.get(betDocRef);
                
                if (!betDoc.exists()) {
                    throw new Error("Bet not found");
                }
                
                const betData = betDoc.data();
                if (betData.status !== 'accepted') {
                    throw new Error("Bet must be accepted before resolving");
                }
                
                if (betData.winner) {
                    throw new Error("Winner already declared");
                }
                
                const winnerDocRef = doc(db, "Users", winner);
                
                // Award winnings to winner
                transaction.update(winnerDocRef, {
                    santasPopped: increment(payout)
                });
                
                // Update bet document
                transaction.update(betDocRef, {
                    winner: winner,
                    status: 'completed',
                    completedAt: new Date()
                });
            });

            showNotification(`${winner} won ${payout} fireworks!`, "success");
            loadBets();
            loadUserFireworks();
        } catch (error) {
            console.error("Error resolving bet:", error);
            if (error instanceof Error) {
                if (error.message === "Bet must be accepted before resolving") {
                    showNotification("Bet must be accepted first", "error");
                } else if (error.message === "Winner already declared") {
                    showNotification("Winner already declared for this bet", "error");
                } else {
                    showNotification("Error resolving bet", "error");
                }
            } else {
                showNotification("Error resolving bet", "error");
            }
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
            // Use transaction to ensure atomicity
            await runTransaction(db, async (transaction) => {
                const userDocRef = doc(db, "Users", bet.creator);
                const betDocRef = doc(db, "bets", bet.id);
                
                const betDoc = await transaction.get(betDocRef);
                
                if (!betDoc.exists()) {
                    throw new Error("Bet not found");
                }
                
                const betData = betDoc.data();
                if (betData.status !== 'open') {
                    throw new Error("Can only cancel open bets");
                }
                
                // Refund fireworks to creator
                transaction.update(userDocRef, {
                    santasPopped: increment(bet.wager)
                });
                
                // Update bet document
                transaction.update(betDocRef, {
                    status: 'completed',
                    winner: 'cancelled',
                    completedAt: new Date()
                });
            });

            showNotification("Bet cancelled and fireworks refunded", "success");
            loadBets();
            loadUserFireworks();
        } catch (error) {
            console.error("Error cancelling bet:", error);
            if (error instanceof Error && error.message === "Can only cancel open bets") {
                showNotification("This bet can no longer be cancelled", "error");
            } else {
                showNotification("Error cancelling bet", "error");
            }
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
                                placeholder="Bet description (e.g., 'Race to 1000 fireworks')"
                                value={newBetDescription}
                                onChange={(e) => setNewBetDescription(e.target.value)}
                                maxLength={200}
                            />
                            
                            <select 
                                className="bet-input"
                                value={newBetType}
                                onChange={(e) => setNewBetType(e.target.value as any)}
                            >
                                <option value="fireworks_race">Fireworks Race (Most Fireworks Wins)</option>
                                <option value="leaderboard_position">Leaderboard Position (Highest Score)</option>
                                <option value="score_milestone">Score Milestone (First to Reach Target)</option>
                            </select>

                            {newBetType === 'score_milestone' && (
                                <input
                                    type="number"
                                    className="bet-input"
                                    placeholder="Target value (e.g., 1000)"
                                    value={targetValue}
                                    onChange={(e) => setTargetValue(e.target.value)}
                                    min="1"
                                />
                            )}

                            <input
                                type="number"
                                className="bet-input bet-input-small"
                                placeholder="Your wager"
                                value={newBetWager}
                                onChange={(e) => setNewBetWager(e.target.value)}
                                min="1"
                            />

                            <div className="odds-container">
                                <label>
                                    Your Odds:
                                    <input
                                        type="number"
                                        className="bet-input bet-input-small"
                                        placeholder="2.0"
                                        value={creatorOdds}
                                        onChange={(e) => setCreatorOdds(e.target.value)}
                                        min="0.1"
                                        step="0.1"
                                    />
                                </label>
                                <label>
                                    Opponent Odds:
                                    <input
                                        type="number"
                                        className="bet-input bet-input-small"
                                        placeholder="2.0"
                                        value={opponentOdds}
                                        onChange={(e) => setOpponentOdds(e.target.value)}
                                        min="0.1"
                                        step="0.1"
                                    />
                                </label>
                            </div>

                            <input
                                type="datetime-local"
                                className="bet-input"
                                placeholder="Deadline"
                                value={deadline}
                                onChange={(e) => setDeadline(e.target.value)}
                            />

                            <button 
                                className="btn-create-bet"
                                onClick={createBet}
                            >
                                Create Odds-Based Bet
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
                                        <div className="bet-type">
                                            <strong>Type:</strong> {bet.betType?.replace('_', ' ').toUpperCase()}
                                            {bet.targetValue && <span> (Target: {bet.targetValue})</span>}
                                        </div>
                                        {bet.deadline && (
                                            <div className="bet-deadline">
                                                <strong>Deadline:</strong> {bet.deadline.toLocaleString()}
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="bet-odds">
                                        <span>📊 Odds - {bet.creator}: <strong>{bet.creatorOdds}x</strong></span>
                                        {bet.opponent && (
                                            <span>📊 {bet.opponent}: <strong>{bet.opponentOdds}x</strong></span>
                                        )}
                                    </div>

                                    <div className="bet-wager">
                                        <span>🎆 Wager: <strong>{bet.wager}</strong> fireworks each</span>
                                        <span className="bet-potential">
                                            💰 Win: <strong>{Math.floor(bet.wager * (1 + (currentUser === bet.creator ? bet.creatorOdds : bet.opponentOdds)))}</strong>
                                        </span>
                                    </div>

                                    {bet.opponent && (
                                        <div className="bet-opponent">
                                            <span>vs 👤 {bet.opponent}</span>
                                        </div>
                                    )}

                                    {bet.winner && bet.winner !== 'cancelled' && bet.winner !== 'tie' && (
                                        <div className="bet-winner">
                                            <span>🏆 Winner: {bet.winner}</span>
                                        </div>
                                    )}

                                    {bet.winner === 'tie' && (
                                        <div className="bet-cancelled">
                                            <span>🤝 Tie - Both Refunded</span>
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
                                                Accept Bet ({bet.opponentOdds}x odds)
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
                                                onClick={() => resolveBet(bet)}
                                            >
                                                Resolve Bet (Check Winner)
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
                    <h3>How Odds-Based Betting Works</h3>
                    <ul>
                        <li>🎯 Create a bet with odds (e.g., 2:1, 3:1) - higher odds mean bigger potential payout</li>
                        <li>📊 Choose bet type: Fireworks Race, Leaderboard Position, or Score Milestone</li>
                        <li>🤝 Other users accept bets by matching the wager at your offered odds</li>
                        <li>🏆 Winners are determined automatically based on verifiable game stats</li>
                        <li>⚡ No honor system - the code calculates winners objectively!</li>
                        <li>💡 Cancel open bets anytime to get your fireworks back</li>
                        <li>🎲 Example: Bet 100 fireworks at 2x odds = win 300 if you win (100 + 200)</li>
                    </ul>
                </div>
            </div>
            
            <Cloudfooter />
        </div>
    );
};

export default BettingPage;
