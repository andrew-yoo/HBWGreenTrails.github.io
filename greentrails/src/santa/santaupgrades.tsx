import '../styles/style.css'
import '../styles/leaderboard.css'
import React, { useEffect, useState } from 'react';
import { db } from '../base/firebaseConfig';
import { doc, getDoc, updateDoc, increment } from "firebase/firestore";
import { useAuth } from '../context/AuthContext';
import Navbar from '../componets/sadnavbar';
import Top from '../componets/header';
import { Cloudfooter } from '../componets/footer';

interface UserUpgrades {
    coins: number;
    autoClickerLevel: number;
    spawnSpeedLevel: number;
    santasPopped: number;
}

const SantaUpgrades: React.FC = () => {
    const { currentUser } = useAuth();
    const [upgrades, setUpgrades] = useState<UserUpgrades>({
        coins: 0,
        autoClickerLevel: 0,
        spawnSpeedLevel: 0,
        santasPopped: 0
    });
    const [loading, setLoading] = useState(true);

    // Auto-clicker costs: 10, 25, 50, 100, 200 coins
    const autoClickerCosts = [10, 25, 50, 100, 200];
    // Spawn speed costs: 15, 30, 60, 120, 240 coins
    const spawnSpeedCosts = [15, 30, 60, 120, 240];

    useEffect(() => {
        if (currentUser) {
            loadUserUpgrades();
        } else {
            setLoading(false);
        }
    }, [currentUser]);

    const loadUserUpgrades = async () => {
        if (!currentUser) return;
        
        try {
            const userDocRef = doc(db, "Users", currentUser);
            const userDoc = await getDoc(userDocRef);
            
            if (userDoc.exists()) {
                const userData = userDoc.data();
                setUpgrades({
                    coins: userData.coins || 0,
                    autoClickerLevel: userData.autoClickerLevel || 0,
                    spawnSpeedLevel: userData.spawnSpeedLevel || 0,
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
            alert("Please login to purchase upgrades!");
            return;
        }

        const level = upgrades.autoClickerLevel;
        if (level >= autoClickerCosts.length) {
            alert("Max level reached!");
            return;
        }

        const cost = autoClickerCosts[level];
        if (upgrades.coins < cost) {
            alert(\`Not enough coins! You need \${cost} coins but only have \${upgrades.coins}.\`);
            return;
        }

        try {
            const userDocRef = doc(db, "Users", currentUser);
            await updateDoc(userDocRef, {
                coins: increment(-cost),
                autoClickerLevel: increment(1)
            });
            
            // Update local state
            setUpgrades({
                ...upgrades,
                coins: upgrades.coins - cost,
                autoClickerLevel: upgrades.autoClickerLevel + 1
            });
            
            alert(\`Auto-clicker upgraded to level \${level + 1}!\`);
        } catch (error) {
            console.error("Error purchasing upgrade:", error);
            alert("Failed to purchase upgrade. Please try again.");
        }
    };

    const purchaseSpawnSpeed = async () => {
        if (!currentUser) {
            alert("Please login to purchase upgrades!");
            return;
        }

        const level = upgrades.spawnSpeedLevel;
        if (level >= spawnSpeedCosts.length) {
            alert("Max level reached!");
            return;
        }

        const cost = spawnSpeedCosts[level];
        if (upgrades.coins < cost) {
            alert(\`Not enough coins! You need \${cost} coins but only have \${upgrades.coins}.\`);
            return;
        }

        try {
            const userDocRef = doc(db, "Users", currentUser);
            await updateDoc(userDocRef, {
                coins: increment(-cost),
                spawnSpeedLevel: increment(1)
            });
            
            // Update local state
            setUpgrades({
                ...upgrades,
                coins: upgrades.coins - cost,
                spawnSpeedLevel: upgrades.spawnSpeedLevel + 1
            });
            
            alert(\`Spawn speed upgraded to level \${level + 1}!\`);
        } catch (error) {
            console.error("Error purchasing upgrade:", error);
            alert("Failed to purchase upgrade. Please try again.");
        }
    };

    const convertSantasToCoins = async () => {
        if (!currentUser) {
            alert("Please login!");
            return;
        }

        if (upgrades.santasPopped < 1) {
            alert("You need at least 1 santa popped to convert to coins!");
            return;
        }

        try {
            const userDocRef = doc(db, "Users", currentUser);
            const coinsToAdd = upgrades.santasPopped;
            
            await updateDoc(userDocRef, {
                coins: increment(coinsToAdd)
            });
            
            // Update local state
            setUpgrades({
                ...upgrades,
                coins: upgrades.coins + coinsToAdd
            });
            
            alert(\`Converted \${coinsToAdd} santa pops to \${coinsToAdd} coins!\`);
        } catch (error) {
            console.error("Error converting santas:", error);
            alert("Failed to convert. Please try again.");
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
                maxWidth: '1200px',
                margin: '0 auto',
                minHeight: '60vh',
                backgroundColor: '#f5f5f5'
            }}>
                <h2 style={{ 
                    textAlign: 'center', 
                    color: '#d32f2f', 
                    marginBottom: '30px',
                    fontSize: '36px'
                }}>
                    🎅 Santa Shop 🎅
                </h2>

                {/* Stats Section */}
                <div style={{
                    backgroundColor: 'white',
                    padding: '20px',
                    borderRadius: '8px',
                    marginBottom: '30px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}>
                    <h3 style={{ color: '#2d5a3d', marginBottom: '15px' }}>Your Stats</h3>
                    <div style={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap' }}>
                        <div style={{ margin: '10px' }}>
                            <p style={{ fontSize: '18px', marginBottom: '5px' }}>💰 Coins:</p>
                            <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#FFD700' }}>{upgrades.coins}</p>
                        </div>
                        <div style={{ margin: '10px' }}>
                            <p style={{ fontSize: '18px', marginBottom: '5px' }}>🎅 Santas Popped:</p>
                            <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#d32f2f' }}>{upgrades.santasPopped}</p>
                        </div>
                    </div>
                    <div style={{ textAlign: 'center', marginTop: '15px' }}>
                        <button 
                            onClick={convertSantasToCoins}
                            style={{
                                padding: '10px 20px',
                                fontSize: '16px',
                                backgroundColor: '#4CAF50',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer'
                            }}
                        >
                            💱 Get Coins (1 Santa = 1 Coin)
                        </button>
                    </div>
                </div>

                {/* Upgrades Section */}
                <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                    gap: '20px'
                }}>
                    {/* Auto-Clicker Upgrade */}
                    <div style={{
                        backgroundColor: 'white',
                        padding: '20px',
                        borderRadius: '8px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        border: '2px solid #4CAF50'
                    }}>
                        <h3 style={{ color: '#4CAF50', marginBottom: '15px' }}>🖱️ Auto-Clicker</h3>
                        <p style={{ marginBottom: '10px' }}>
                            Current Level: <strong>{upgrades.autoClickerLevel}</strong>
                        </p>
                        <p style={{ marginBottom: '15px', color: '#666' }}>
                            Automatically clicks santas for you every few seconds!
                            {upgrades.autoClickerLevel > 0 && (
                                <span style={{ display: 'block', marginTop: '5px', color: '#4CAF50' }}>
                                    ✓ Active: Clicking every {Math.max(10 - upgrades.autoClickerLevel * 2, 2)}s
                                </span>
                            )}
                        </p>
                        {upgrades.autoClickerLevel < autoClickerCosts.length ? (
                            <>
                                <p style={{ fontSize: '18px', marginBottom: '15px' }}>
                                    Next level cost: <strong style={{ color: '#FFD700' }}>{autoClickerCosts[upgrades.autoClickerLevel]} coins</strong>
                                </p>
                                <button 
                                    onClick={purchaseAutoClicker}
                                    disabled={upgrades.coins < autoClickerCosts[upgrades.autoClickerLevel]}
                                    style={{
                                        padding: '10px 20px',
                                        fontSize: '16px',
                                        backgroundColor: upgrades.coins >= autoClickerCosts[upgrades.autoClickerLevel] ? '#4CAF50' : '#ccc',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: upgrades.coins >= autoClickerCosts[upgrades.autoClickerLevel] ? 'pointer' : 'not-allowed',
                                        width: '100%'
                                    }}
                                >
                                    Upgrade
                                </button>
                            </>
                        ) : (
                            <p style={{ color: '#4CAF50', fontWeight: 'bold' }}>✓ MAX LEVEL</p>
                        )}
                    </div>

                    {/* Spawn Speed Upgrade */}
                    <div style={{
                        backgroundColor: 'white',
                        padding: '20px',
                        borderRadius: '8px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        border: '2px solid #2196F3'
                    }}>
                        <h3 style={{ color: '#2196F3', marginBottom: '15px' }}>⚡ Spawn Speed</h3>
                        <p style={{ marginBottom: '10px' }}>
                            Current Level: <strong>{upgrades.spawnSpeedLevel}</strong>
                        </p>
                        <p style={{ marginBottom: '15px', color: '#666' }}>
                            Increases how often santas appear!
                            {upgrades.spawnSpeedLevel > 0 && (
                                <span style={{ display: 'block', marginTop: '5px', color: '#2196F3' }}>
                                    ✓ Active: Spawn time reduced by {upgrades.spawnSpeedLevel * 20}%
                                </span>
                            )}
                        </p>
                        {upgrades.spawnSpeedLevel < spawnSpeedCosts.length ? (
                            <>
                                <p style={{ fontSize: '18px', marginBottom: '15px' }}>
                                    Next level cost: <strong style={{ color: '#FFD700' }}>{spawnSpeedCosts[upgrades.spawnSpeedLevel]} coins</strong>
                                </p>
                                <button 
                                    onClick={purchaseSpawnSpeed}
                                    disabled={upgrades.coins < spawnSpeedCosts[upgrades.spawnSpeedLevel]}
                                    style={{
                                        padding: '10px 20px',
                                        fontSize: '16px',
                                        backgroundColor: upgrades.coins >= spawnSpeedCosts[upgrades.spawnSpeedLevel] ? '#2196F3' : '#ccc',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: upgrades.coins >= spawnSpeedCosts[upgrades.spawnSpeedLevel] ? 'pointer' : 'not-allowed',
                                        width: '100%'
                                    }}
                                >
                                    Upgrade
                                </button>
                            </>
                        ) : (
                            <p style={{ color: '#2196F3', fontWeight: 'bold' }}>✓ MAX LEVEL</p>
                        )}
                    </div>
                </div>

                {/* Instructions */}
                <div style={{
                    backgroundColor: 'white',
                    padding: '20px',
                    borderRadius: '8px',
                    marginTop: '30px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}>
                    <h3 style={{ color: '#2d5a3d', marginBottom: '15px' }}>ℹ️ How to Play</h3>
                    <ol style={{ lineHeight: '1.8', color: '#666' }}>
                        <li>Click flying Santas anywhere on the site to pop them and earn points!</li>
                        <li>Convert your Santa pops to coins using the button above</li>
                        <li>Purchase upgrades to pop more Santas automatically</li>
                        <li>Auto-clicker will work on ALL pages across the site</li>
                        <li>Spawn speed increases how often Santas appear</li>
                    </ol>
                </div>
            </div>
            <Cloudfooter />
        </div>
    );
};

export default SantaUpgrades;
