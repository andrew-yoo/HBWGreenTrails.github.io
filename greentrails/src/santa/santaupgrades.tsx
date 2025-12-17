import '../styles/style.css'
import '../styles/leaderboard.css'
import React, { useEffect, useState } from 'react';
import { db } from '../base/firebaseConfig';
import { doc, getDoc, updateDoc, increment } from "firebase/firestore";
import { useAuth } from '../context/AuthContext';
import Navbar from '../componets/sadnavbar';
import Top from '../componets/header';
import { Cloudfooter } from '../componets/footer';
import { showNotification } from '../componets/Notification';

interface UserUpgrades {
    autoClickerLevel: number;
    spawnSpeedLevel: number;
    santaWorthLevel: number;
    santasPopped: number;
}

const SantaUpgrades: React.FC = () => {
    const { currentUser } = useAuth();
    const [upgrades, setUpgrades] = useState<UserUpgrades>({
        autoClickerLevel: 0,
        spawnSpeedLevel: 0,
        santaWorthLevel: 0,
        santasPopped: 0
    });
    const [loading, setLoading] = useState(true);

    // Auto-clicker costs: 10, 25, 50, 100, 200 santas
    const autoClickerCosts = [10, 25, 50, 100, 200];
    // Spawn speed costs: 15, 30, 60, 120, 240 santas
    const spawnSpeedCosts = [15, 30, 60, 120, 240];
    // Santa worth costs: 20, 40, 80, 160, 320 santas
    const santaWorthCosts = [20, 40, 80, 160, 320];

    useEffect(() => {
        if (currentUser) {
            loadUserUpgrades();
        } else {
            setLoading(false);
        }
        
        // Listen for santa pop events to update count in real-time
        const handleSantaPopped = (event: Event) => {
            const customEvent = event as CustomEvent;
            const increment = customEvent.detail?.increment || 1;
            setUpgrades(prev => ({
                ...prev,
                santasPopped: prev.santasPopped + increment
            }));
        };
        
        window.addEventListener('santaPopped', handleSantaPopped);
        
        return () => {
            window.removeEventListener('santaPopped', handleSantaPopped);
        };
    }, [currentUser]);

    const loadUserUpgrades = async () => {
        if (!currentUser) return;
        
        try {
            const userDocRef = doc(db, "Users", currentUser);
            const userDoc = await getDoc(userDocRef);
            
            if (userDoc.exists()) {
                const userData = userDoc.data();
                setUpgrades({
                    autoClickerLevel: userData.autoClickerLevel || 0,
                    spawnSpeedLevel: userData.spawnSpeedLevel || 0,
                    santaWorthLevel: userData.santaWorthLevel || 0,
                    santasPopped: userData.santasPopped || 0
                });
            }
        } catch (error) {
            console.error("Error loading upgrades:", error);
        } finally {
            setLoading(false);
        }
    };

    const purchaseAutoClicker = async () => {
        if (!currentUser) {
            showNotification("Please login to purchase upgrades!", "error");
            return;
        }

        const level = upgrades.autoClickerLevel;
        if (level >= autoClickerCosts.length) {
            showNotification("Max level reached!", "info");
            return;
        }

        const cost = autoClickerCosts[level];
        if (upgrades.santasPopped < cost) {
            showNotification(`Not enough santas! You need ${cost} santas but only have ${upgrades.santasPopped}.`, "error");
            return;
        }

        try {
            const userDocRef = doc(db, "Users", currentUser);
            await updateDoc(userDocRef, {
                santasPopped: increment(-cost),
                autoClickerLevel: increment(1)
            });
            
            // Update local state
            setUpgrades({
                ...upgrades,
                santasPopped: upgrades.santasPopped - cost,
                autoClickerLevel: upgrades.autoClickerLevel + 1
            });
            
            showNotification(`Auto-clicker upgraded to level ${level + 1}!`, "success");
        } catch (error) {
            console.error("Error purchasing upgrade:", error);
            showNotification("Failed to purchase upgrade. Please try again.", "error");
        }
    };

    const purchaseSpawnSpeed = async () => {
        if (!currentUser) {
            showNotification("Please login to purchase upgrades!", "error");
            return;
        }

        const level = upgrades.spawnSpeedLevel;
        if (level >= spawnSpeedCosts.length) {
            showNotification("Max level reached!", "info");
            return;
        }

        const cost = spawnSpeedCosts[level];
        if (upgrades.santasPopped < cost) {
            showNotification(`Not enough santas! You need ${cost} santas but only have ${upgrades.santasPopped}.`, "error");
            return;
        }

        try {
            const userDocRef = doc(db, "Users", currentUser);
            await updateDoc(userDocRef, {
                santasPopped: increment(-cost),
                spawnSpeedLevel: increment(1)
            });
            
            // Update local state
            setUpgrades({
                ...upgrades,
                santasPopped: upgrades.santasPopped - cost,
                spawnSpeedLevel: upgrades.spawnSpeedLevel + 1
            });
            
            showNotification(`Spawn speed upgraded to level ${level + 1}!`, "success");
        } catch (error) {
            console.error("Error purchasing upgrade:", error);
            showNotification("Failed to purchase upgrade. Please try again.", "error");
        }
    };

    const purchaseSantaWorth = async () => {
        if (!currentUser) {
            showNotification("Please login to purchase upgrades!", "error");
            return;
        }

        const level = upgrades.santaWorthLevel;
        if (level >= santaWorthCosts.length) {
            showNotification("Max level reached!", "info");
            return;
        }

        const cost = santaWorthCosts[level];
        if (upgrades.santasPopped < cost) {
            showNotification(`Not enough santas! You need ${cost} santas but only have ${upgrades.santasPopped}.`, "error");
            return;
        }

        try {
            const userDocRef = doc(db, "Users", currentUser);
            await updateDoc(userDocRef, {
                santasPopped: increment(-cost),
                santaWorthLevel: increment(1)
            });
            
            // Update local state
            setUpgrades({
                ...upgrades,
                santasPopped: upgrades.santasPopped - cost,
                santaWorthLevel: upgrades.santaWorthLevel + 1
            });
            
            showNotification(`Santa worth upgraded to level ${level + 1}!`, "success");
        } catch (error) {
            console.error("Error purchasing upgrade:", error);
            showNotification("Failed to purchase upgrade. Please try again.", "error");
        }
    };

    if (!currentUser) {
        return (
            <div>
                <Top message="Santa Shop" shadow={true} />
                <Navbar />
                <div style={{ 
                    padding: '40px', 
                    textAlign: 'center',
                    minHeight: '60vh',
                    backgroundColor: '#f5f5f5'
                }}>
                    <h2 style={{ color: '#d32f2f', marginBottom: '20px' }}>🎅 Santa Shop</h2>
                    <p style={{ fontSize: '18px', color: '#666' }}>
                        Please login to access the Santa Shop!
                    </p>
                </div>
                <Cloudfooter />
            </div>
        );
    }

    if (loading) {
        return (
            <div>
                <Top message="Santa Shop" shadow={true} />
                <Navbar />
                <div style={{ padding: '40px', textAlign: 'center' }}>
                    <p>Loading...</p>
                </div>
                <Cloudfooter />
            </div>
        );
    }

    return (
        <div>
            <Top message="Santa Shop" shadow={true} />
            <Navbar />
            <div style={{ 
                padding: '40px',
                maxWidth: '1400px',
                margin: '0 auto',
                minHeight: '60vh',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '20px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
                marginTop: '20px',
                marginBottom: '20px'
            }}>
                <h2 style={{ 
                    textAlign: 'center', 
                    color: '#ffffff', 
                    marginBottom: '10px',
                    fontSize: '48px',
                    fontWeight: 'bold',
                    textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
                }}>
                    🎅 Santa Shop 🎅
                </h2>
                <p style={{
                    textAlign: 'center',
                    color: '#f0f0f0',
                    fontSize: '18px',
                    marginBottom: '30px',
                    fontStyle: 'italic'
                }}>
                    Upgrade your Santa-catching abilities!
                </p>

                {/* Stats Section */}
                <div style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    padding: '30px',
                    borderRadius: '15px',
                    marginBottom: '30px',
                    boxShadow: '0 8px 16px rgba(0,0,0,0.2)',
                    border: '3px solid #ffd700'
                }}>
                    <h3 style={{ 
                        color: '#d32f2f', 
                        marginBottom: '20px',
                        textAlign: 'center',
                        fontSize: '28px',
                        fontWeight: 'bold'
                    }}>
                        💰 Your Stats
                    </h3>
                    <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '30px' }}>
                        <div style={{ 
                            textAlign: 'center',
                            padding: '15px 30px',
                            backgroundColor: '#fff5f5',
                            borderRadius: '10px',
                            border: '2px solid #d32f2f'
                        }}>
                            <p style={{ fontSize: '20px', marginBottom: '8px', color: '#666' }}>🎅 Santas Available</p>
                            <p style={{ fontSize: '36px', fontWeight: 'bold', color: '#d32f2f', margin: 0 }}>
                                {upgrades.santasPopped}
                            </p>
                        </div>
                        <div style={{ 
                            textAlign: 'center',
                            padding: '15px 30px',
                            backgroundColor: '#f0f8ff',
                            borderRadius: '10px',
                            border: '2px solid #2196F3'
                        }}>
                            <p style={{ fontSize: '20px', marginBottom: '8px', color: '#666' }}>💎 Santa Value</p>
                            <p style={{ fontSize: '36px', fontWeight: 'bold', color: '#2196F3', margin: 0 }}>
                                {upgrades.santaWorthLevel + 1}x
                            </p>
                        </div>
                    </div>
                </div>

                {/* Upgrades Section */}
                <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                    gap: '25px'
                }}>
                    {/* Auto-Clicker Upgrade */}
                    <div style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        padding: '25px',
                        borderRadius: '15px',
                        boxShadow: '0 8px 16px rgba(0,0,0,0.2)',
                        border: '3px solid #4CAF50',
                        transition: 'transform 0.2s',
                        position: 'relative',
                        overflow: 'hidden'
                    }}>
                        <div style={{
                            position: 'absolute',
                            top: '10px',
                            right: '10px',
                            backgroundColor: '#4CAF50',
                            color: 'white',
                            padding: '5px 15px',
                            borderRadius: '20px',
                            fontSize: '14px',
                            fontWeight: 'bold'
                        }}>
                            Level {upgrades.autoClickerLevel}
                        </div>
                        <h3 style={{ color: '#4CAF50', marginBottom: '15px', fontSize: '28px', fontWeight: 'bold' }}>
                            🖱️ Auto-Clicker
                        </h3>
                        <p style={{ marginBottom: '15px', color: '#555', lineHeight: '1.6', minHeight: '80px' }}>
                            Automatically clicks santas for you every few seconds! The ultimate passive income for lazy elves.
                            {upgrades.autoClickerLevel > 0 && (
                                <span style={{ display: 'block', marginTop: '10px', color: '#4CAF50', fontWeight: 'bold' }}>
                                    ✓ Active: Clicking every {Math.max(2, 10 - upgrades.autoClickerLevel * 2)}s
                                </span>
                            )}
                        </p>
                        {upgrades.autoClickerLevel < autoClickerCosts.length ? (
                            <>
                                <p style={{ fontSize: '20px', marginBottom: '20px', textAlign: 'center' }}>
                                    Cost: <strong style={{ color: '#d32f2f', fontSize: '24px' }}>
                                        {autoClickerCosts[upgrades.autoClickerLevel]} 🎅
                                    </strong>
                                </p>
                                <button 
                                    onClick={purchaseAutoClicker}
                                    disabled={upgrades.santasPopped < autoClickerCosts[upgrades.autoClickerLevel]}
                                    style={{
                                        padding: '15px 25px',
                                        fontSize: '18px',
                                        fontWeight: 'bold',
                                        backgroundColor: upgrades.santasPopped >= autoClickerCosts[upgrades.autoClickerLevel] ? '#4CAF50' : '#ccc',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '8px',
                                        cursor: upgrades.santasPopped >= autoClickerCosts[upgrades.autoClickerLevel] ? 'pointer' : 'not-allowed',
                                        width: '100%',
                                        transition: 'all 0.3s',
                                        boxShadow: upgrades.santasPopped >= autoClickerCosts[upgrades.autoClickerLevel] ? '0 4px 8px rgba(76, 175, 80, 0.3)' : 'none'
                                    }}
                                    onMouseOver={(e) => {
                                        if (upgrades.santasPopped >= autoClickerCosts[upgrades.autoClickerLevel]) {
                                            e.currentTarget.style.transform = 'scale(1.05)';
                                        }
                                    }}
                                    onMouseOut={(e) => {
                                        e.currentTarget.style.transform = 'scale(1)';
                                    }}
                                >
                                    ⬆️ Upgrade Now
                                </button>
                            </>
                        ) : (
                            <div style={{ 
                                textAlign: 'center',
                                padding: '20px',
                                backgroundColor: '#e8f5e9',
                                borderRadius: '8px'
                            }}>
                                <p style={{ color: '#4CAF50', fontWeight: 'bold', fontSize: '20px', margin: 0 }}>
                                    ✓ MAX LEVEL REACHED!
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Spawn Speed Upgrade */}
                    <div style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        padding: '25px',
                        borderRadius: '15px',
                        boxShadow: '0 8px 16px rgba(0,0,0,0.2)',
                        border: '3px solid #2196F3',
                        transition: 'transform 0.2s',
                        position: 'relative',
                        overflow: 'hidden'
                    }}>
                        <div style={{
                            position: 'absolute',
                            top: '10px',
                            right: '10px',
                            backgroundColor: '#2196F3',
                            color: 'white',
                            padding: '5px 15px',
                            borderRadius: '20px',
                            fontSize: '14px',
                            fontWeight: 'bold'
                        }}>
                            Level {upgrades.spawnSpeedLevel}
                        </div>
                        <h3 style={{ color: '#2196F3', marginBottom: '15px', fontSize: '28px', fontWeight: 'bold' }}>
                            ⚡ Spawn Speed
                        </h3>
                        <p style={{ marginBottom: '15px', color: '#555', lineHeight: '1.6', minHeight: '80px' }}>
                            Increases how often santas appear on your screen! More santas = more opportunities to click.
                            {upgrades.spawnSpeedLevel > 0 && (
                                <span style={{ display: 'block', marginTop: '10px', color: '#2196F3', fontWeight: 'bold' }}>
                                    ✓ Active: Spawn time reduced by {upgrades.spawnSpeedLevel * 20}%
                                </span>
                            )}
                        </p>
                        {upgrades.spawnSpeedLevel < spawnSpeedCosts.length ? (
                            <>
                                <p style={{ fontSize: '20px', marginBottom: '20px', textAlign: 'center' }}>
                                    Cost: <strong style={{ color: '#d32f2f', fontSize: '24px' }}>
                                        {spawnSpeedCosts[upgrades.spawnSpeedLevel]} 🎅
                                    </strong>
                                </p>
                                <button 
                                    onClick={purchaseSpawnSpeed}
                                    disabled={upgrades.santasPopped < spawnSpeedCosts[upgrades.spawnSpeedLevel]}
                                    style={{
                                        padding: '15px 25px',
                                        fontSize: '18px',
                                        fontWeight: 'bold',
                                        backgroundColor: upgrades.santasPopped >= spawnSpeedCosts[upgrades.spawnSpeedLevel] ? '#2196F3' : '#ccc',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '8px',
                                        cursor: upgrades.santasPopped >= spawnSpeedCosts[upgrades.spawnSpeedLevel] ? 'pointer' : 'not-allowed',
                                        width: '100%',
                                        transition: 'all 0.3s',
                                        boxShadow: upgrades.santasPopped >= spawnSpeedCosts[upgrades.spawnSpeedLevel] ? '0 4px 8px rgba(33, 150, 243, 0.3)' : 'none'
                                    }}
                                    onMouseOver={(e) => {
                                        if (upgrades.santasPopped >= spawnSpeedCosts[upgrades.spawnSpeedLevel]) {
                                            e.currentTarget.style.transform = 'scale(1.05)';
                                        }
                                    }}
                                    onMouseOut={(e) => {
                                        e.currentTarget.style.transform = 'scale(1)';
                                    }}
                                >
                                    ⬆️ Upgrade Now
                                </button>
                            </>
                        ) : (
                            <div style={{ 
                                textAlign: 'center',
                                padding: '20px',
                                backgroundColor: '#e3f2fd',
                                borderRadius: '8px'
                            }}>
                                <p style={{ color: '#2196F3', fontWeight: 'bold', fontSize: '20px', margin: 0 }}>
                                    ✓ MAX LEVEL REACHED!
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Santa Worth Upgrade - NEW */}
                    <div style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        padding: '25px',
                        borderRadius: '15px',
                        boxShadow: '0 8px 16px rgba(0,0,0,0.2)',
                        border: '3px solid #FF9800',
                        transition: 'transform 0.2s',
                        position: 'relative',
                        overflow: 'hidden'
                    }}>
                        <div style={{
                            position: 'absolute',
                            top: '10px',
                            right: '10px',
                            backgroundColor: '#FF9800',
                            color: 'white',
                            padding: '5px 15px',
                            borderRadius: '20px',
                            fontSize: '14px',
                            fontWeight: 'bold'
                        }}>
                            Level {upgrades.santaWorthLevel}
                        </div>
                        <h3 style={{ color: '#FF9800', marginBottom: '15px', fontSize: '28px', fontWeight: 'bold' }}>
                            💎 Santa Worth
                        </h3>
                        <p style={{ marginBottom: '15px', color: '#555', lineHeight: '1.6', minHeight: '80px' }}>
                            Increases the value of each Santa you pop! Each level adds +1 to your score per click.
                            {upgrades.santaWorthLevel > 0 && (
                                <span style={{ display: 'block', marginTop: '10px', color: '#FF9800', fontWeight: 'bold' }}>
                                    ✓ Active: Each santa worth {upgrades.santaWorthLevel + 1} points
                                </span>
                            )}
                        </p>
                        {upgrades.santaWorthLevel < santaWorthCosts.length ? (
                            <>
                                <p style={{ fontSize: '20px', marginBottom: '20px', textAlign: 'center' }}>
                                    Cost: <strong style={{ color: '#d32f2f', fontSize: '24px' }}>
                                        {santaWorthCosts[upgrades.santaWorthLevel]} 🎅
                                    </strong>
                                </p>
                                <button 
                                    onClick={purchaseSantaWorth}
                                    disabled={upgrades.santasPopped < santaWorthCosts[upgrades.santaWorthLevel]}
                                    style={{
                                        padding: '15px 25px',
                                        fontSize: '18px',
                                        fontWeight: 'bold',
                                        backgroundColor: upgrades.santasPopped >= santaWorthCosts[upgrades.santaWorthLevel] ? '#FF9800' : '#ccc',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '8px',
                                        cursor: upgrades.santasPopped >= santaWorthCosts[upgrades.santaWorthLevel] ? 'pointer' : 'not-allowed',
                                        width: '100%',
                                        transition: 'all 0.3s',
                                        boxShadow: upgrades.santasPopped >= santaWorthCosts[upgrades.santaWorthLevel] ? '0 4px 8px rgba(255, 152, 0, 0.3)' : 'none'
                                    }}
                                    onMouseOver={(e) => {
                                        if (upgrades.santasPopped >= santaWorthCosts[upgrades.santaWorthLevel]) {
                                            e.currentTarget.style.transform = 'scale(1.05)';
                                        }
                                    }}
                                    onMouseOut={(e) => {
                                        e.currentTarget.style.transform = 'scale(1)';
                                    }}
                                >
                                    ⬆️ Upgrade Now
                                </button>
                            </>
                        ) : (
                            <div style={{ 
                                textAlign: 'center',
                                padding: '20px',
                                backgroundColor: '#fff3e0',
                                borderRadius: '8px'
                            }}>
                                <p style={{ color: '#FF9800', fontWeight: 'bold', fontSize: '20px', margin: 0 }}>
                                    ✓ MAX LEVEL REACHED!
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Instructions */}
                <div style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    padding: '25px',
                    borderRadius: '15px',
                    marginTop: '30px',
                    boxShadow: '0 8px 16px rgba(0,0,0,0.2)',
                    border: '3px solid #ffd700'
                }}>
                    <h3 style={{ 
                        color: '#d32f2f', 
                        marginBottom: '20px',
                        fontSize: '24px',
                        fontWeight: 'bold',
                        textAlign: 'center'
                    }}>
                        ℹ️ How to Play
                    </h3>
                    <ol style={{ lineHeight: '2', color: '#555', fontSize: '16px', paddingLeft: '30px' }}>
                        <li><strong>Click flying Santas</strong> anywhere on the site to pop them and earn points!</li>
                        <li><strong>Spend your points</strong> on upgrades to become more efficient</li>
                        <li><strong>Auto-clicker</strong> works on ALL pages across the site automatically</li>
                        <li><strong>Spawn speed</strong> increases how often Santas appear</li>
                        <li><strong>Santa worth</strong> makes each click more valuable</li>
                        <li><strong>Pro tip:</strong> Combine all three upgrades for maximum efficiency!</li>
                    </ol>
                </div>
            </div>
            <Cloudfooter />
        </div>
    );
};

export default SantaUpgrades;
