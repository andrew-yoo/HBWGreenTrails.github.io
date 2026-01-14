import '../styles/style.css'
import '../styles/leaderboard.css'
import React, { useEffect, useState } from 'react';
import { db } from '../base/firebaseConfig';
import { doc, getDoc, runTransaction } from "firebase/firestore";
import { useAuth } from '../context/AuthContext';
import Navbar from '../componets/sadnavbar';
import Top from '../componets/header';
import { Cloudfooter } from '../componets/footer';
import { showNotification } from '../componets/Notification';
import { useNavigate } from 'react-router-dom';

interface PrestigeUpgrades {
    prestigePoints: number;
    prestigeLevel: number;
    // Permanent multipliers
    prestigeFireworkMultiplier: number; // +10% firework gain per level
    prestigeAutoClickerBoost: number; // +20% auto-clicker speed per level
    prestigeSpawnBoost: number; // +15% spawn rate per level
    prestigeStartingBonus: number; // Start with upgrades after prestige
    prestigeLuckyBoost: number; // +5% luck chance per level
    prestigeGoldBoost: number; // +5% gold spawn chance per level
}

const PrestigeShop: React.FC = () => {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [upgrades, setUpgrades] = useState<PrestigeUpgrades | null>(null);
    const [loading, setLoading] = useState(true);

    // Prestige upgrade costs (each level costs more)
    const getFireworkMultiplierCost = (level: number) => 1 + level * 2; // 1, 3, 5, 7, 9...
    const getAutoClickerBoostCost = (level: number) => 2 + level * 2; // 2, 4, 6, 8, 10...
    const getSpawnBoostCost = (level: number) => 2 + level * 2; // 2, 4, 6, 8, 10...
    const getStartingBonusCost = (level: number) => 3 + level * 3; // 3, 6, 9, 12, 15...
    const getLuckyBoostCost = (level: number) => 2 + level * 3; // 2, 5, 8, 11, 14...
    const getGoldBoostCost = (level: number) => 3 + level * 3; // 3, 6, 9, 12, 15...

    // Max levels
    const MAX_FIREWORK_MULTIPLIER = 10;
    const MAX_AUTO_CLICKER_BOOST = 10;
    const MAX_SPAWN_BOOST = 10;
    const MAX_STARTING_BONUS = 5;
    const MAX_LUCKY_BOOST = 10;
    const MAX_GOLD_BOOST = 10;

    useEffect(() => {
        if (currentUser) {
            loadPrestigeUpgrades();
        } else {
            setLoading(false);
        }
    }, [currentUser]);

    const loadPrestigeUpgrades = async () => {
        if (!currentUser) return;
        
        try {
            const userDocRef = doc(db, "Users", currentUser);
            const userDoc = await getDoc(userDocRef);
            
            if (userDoc.exists()) {
                const data = userDoc.data();
                setUpgrades({
                    prestigePoints: data.prestigePoints || 0,
                    prestigeLevel: data.prestigeLevel || 0,
                    prestigeFireworkMultiplier: data.prestigeFireworkMultiplier || 0,
                    prestigeAutoClickerBoost: data.prestigeAutoClickerBoost || 0,
                    prestigeSpawnBoost: data.prestigeSpawnBoost || 0,
                    prestigeStartingBonus: data.prestigeStartingBonus || 0,
                    prestigeLuckyBoost: data.prestigeLuckyBoost || 0,
                    prestigeGoldBoost: data.prestigeGoldBoost || 0
                });
            }
        } catch (error) {
            console.error("Error loading prestige upgrades:", error);
            showNotification("Error loading prestige upgrades", "error");
        } finally {
            setLoading(false);
        }
    };

    const purchaseUpgrade = async (upgradeType: string, cost: number, maxLevel: number, currentLevel: number) => {
        if (!currentUser || !upgrades) {
            showNotification("Please login to purchase upgrades!", "error");
            return;
        }

        if (currentLevel >= maxLevel) {
            showNotification("Max level reached!", "info");
            return;
        }

        if (upgrades.prestigePoints < cost) {
            showNotification(`Not enough prestige points! You need ${cost} but only have ${upgrades.prestigePoints}.`, "error");
            return;
        }

        try {
            const userDocRef = doc(db, "Users", currentUser);
            
            await runTransaction(db, async (transaction) => {
                const userDoc = await transaction.get(userDocRef);
                
                if (!userDoc.exists()) {
                    throw new Error("User document does not exist");
                }

                const currentData = userDoc.data();
                const currentPoints = currentData.prestigePoints || 0;
                
                if (currentPoints < cost) {
                    throw new Error("Not enough prestige points");
                }

                // Update the specific upgrade
                const updateData: any = {
                    prestigePoints: currentPoints - cost,
                    [upgradeType]: currentLevel + 1
                };

                transaction.update(userDocRef, updateData);

                // Update local state using fresh transaction data
                setUpgrades({
                    prestigePoints: currentPoints - cost,
                    prestigeLevel: currentData.prestigeLevel || 0,
                    prestigeFireworkMultiplier: upgradeType === 'prestigeFireworkMultiplier' ? currentLevel + 1 : currentData.prestigeFireworkMultiplier || 0,
                    prestigeAutoClickerBoost: upgradeType === 'prestigeAutoClickerBoost' ? currentLevel + 1 : currentData.prestigeAutoClickerBoost || 0,
                    prestigeSpawnBoost: upgradeType === 'prestigeSpawnBoost' ? currentLevel + 1 : currentData.prestigeSpawnBoost || 0,
                    prestigeStartingBonus: upgradeType === 'prestigeStartingBonus' ? currentLevel + 1 : currentData.prestigeStartingBonus || 0,
                    prestigeLuckyBoost: upgradeType === 'prestigeLuckyBoost' ? currentLevel + 1 : currentData.prestigeLuckyBoost || 0,
                    prestigeGoldBoost: upgradeType === 'prestigeGoldBoost' ? currentLevel + 1 : currentData.prestigeGoldBoost || 0
                } as PrestigeUpgrades);
            });
            
            showNotification(`Upgrade purchased successfully!`, "success");
        } catch (error) {
            console.error("Error purchasing upgrade:", error);
            showNotification("Failed to purchase upgrade. Please try again.", "error");
        }
    };

    if (!currentUser) {
        return (
            <div>
                <Top message="Prestige Shop" shadow={true} />
                <Navbar />
                <div style={{ 
                    padding: '40px', 
                    textAlign: 'center',
                    minHeight: '60vh',
                    backgroundColor: '#f5f5f5'
                }}>
                    <h2 style={{ color: '#1976d2', marginBottom: '20px' }}>💎 Prestige Shop</h2>
                    <p style={{ fontSize: '18px', color: '#666' }}>
                        Please login to access the Prestige Shop!
                    </p>
                </div>
                <Cloudfooter />
            </div>
        );
    }

    if (loading) {
        return (
            <div>
                <Top message="Prestige Shop" shadow={true} />
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
            <Top message="Prestige Shop" shadow={true} />
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
                    💎 Prestige Shop 💎
                </h2>
                <p style={{
                    textAlign: 'center',
                    color: '#f0f0f0',
                    fontSize: '18px',
                    marginBottom: '30px',
                    fontStyle: 'italic'
                }}>
                    Permanent upgrades that persist through prestige!
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
                        color: '#9c27b0', 
                        marginBottom: '20px',
                        textAlign: 'center',
                        fontSize: '28px',
                        fontWeight: 'bold'
                    }}>
                        💰 Your Prestige Stats
                    </h3>
                    <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '30px' }}>
                        <div style={{ 
                            textAlign: 'center',
                            padding: '15px 30px',
                            backgroundColor: '#f3e5f5',
                            borderRadius: '10px',
                            border: '2px solid #9c27b0'
                        }}>
                            <p style={{ fontSize: '20px', marginBottom: '8px', color: '#666' }}>Prestige Level</p>
                            <p style={{ fontSize: '36px', fontWeight: 'bold', color: '#9c27b0', margin: 0 }}>
                                {upgrades?.prestigeLevel || 0}
                            </p>
                        </div>
                        <div style={{ 
                            textAlign: 'center',
                            padding: '15px 30px',
                            backgroundColor: '#e3f2fd',
                            borderRadius: '10px',
                            border: '2px solid #1976d2'
                        }}>
                            <p style={{ fontSize: '20px', marginBottom: '8px', color: '#666' }}>💎 Prestige Points Available</p>
                            <p style={{ fontSize: '36px', fontWeight: 'bold', color: '#1976d2', margin: 0 }}>
                                {upgrades?.prestigePoints || 0}
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
                    {/* Firework Multiplier */}
                    <div style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        padding: '25px',
                        borderRadius: '15px',
                        boxShadow: '0 8px 16px rgba(0,0,0,0.2)',
                        border: '3px solid #4CAF50',
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
                            Level {upgrades?.prestigeFireworkMultiplier || 0}/{MAX_FIREWORK_MULTIPLIER}
                        </div>
                        <h3 style={{ color: '#4CAF50', marginBottom: '15px', fontSize: '28px', fontWeight: 'bold' }}>
                            🎯 Firework Multiplier
                        </h3>
                        <p style={{ marginBottom: '15px', color: '#555', lineHeight: '1.6', minHeight: '80px' }}>
                            Permanently increases all firework gains by 10% per level. Stacks with everything!
                            {(upgrades?.prestigeFireworkMultiplier || 0) > 0 && (
                                <span style={{ display: 'block', marginTop: '10px', color: '#4CAF50', fontWeight: 'bold' }}>
                                    ✓ Active: +{(upgrades?.prestigeFireworkMultiplier || 0) * 10}% firework gain
                                </span>
                            )}
                        </p>
                        {(upgrades?.prestigeFireworkMultiplier || 0) < MAX_FIREWORK_MULTIPLIER ? (
                            <>
                                <p style={{ fontSize: '20px', marginBottom: '20px', textAlign: 'center' }}>
                                    Cost: <strong style={{ color: '#9c27b0', fontSize: '24px' }}>
                                        {getFireworkMultiplierCost(upgrades?.prestigeFireworkMultiplier || 0)} 💎
                                    </strong>
                                </p>
                                <button 
                                    onClick={() => purchaseUpgrade(
                                        'prestigeFireworkMultiplier',
                                        getFireworkMultiplierCost(upgrades?.prestigeFireworkMultiplier || 0),
                                        MAX_FIREWORK_MULTIPLIER,
                                        upgrades?.prestigeFireworkMultiplier || 0
                                    )}
                                    disabled={(upgrades?.prestigePoints || 0) < getFireworkMultiplierCost(upgrades?.prestigeFireworkMultiplier || 0)}
                                    style={{
                                        padding: '15px 25px',
                                        fontSize: '18px',
                                        fontWeight: 'bold',
                                        backgroundColor: (upgrades?.prestigePoints || 0) >= getFireworkMultiplierCost(upgrades?.prestigeFireworkMultiplier || 0) ? '#4CAF50' : '#ccc',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '8px',
                                        cursor: (upgrades?.prestigePoints || 0) >= getFireworkMultiplierCost(upgrades?.prestigeFireworkMultiplier || 0) ? 'pointer' : 'not-allowed',
                                        width: '100%',
                                        transition: 'all 0.3s'
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

                    {/* Auto-Clicker Boost */}
                    <div style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        padding: '25px',
                        borderRadius: '15px',
                        boxShadow: '0 8px 16px rgba(0,0,0,0.2)',
                        border: '3px solid #2196F3',
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
                            Level {upgrades?.prestigeAutoClickerBoost || 0}/{MAX_AUTO_CLICKER_BOOST}
                        </div>
                        <h3 style={{ color: '#2196F3', marginBottom: '15px', fontSize: '28px', fontWeight: 'bold' }}>
                            🤖 Auto-Clicker Boost
                        </h3>
                        <p style={{ marginBottom: '15px', color: '#555', lineHeight: '1.6', minHeight: '80px' }}>
                            Makes your auto-clicker 20% faster per level. More clicks = more fireworks!
                            {(upgrades?.prestigeAutoClickerBoost || 0) > 0 && (
                                <span style={{ display: 'block', marginTop: '10px', color: '#2196F3', fontWeight: 'bold' }}>
                                    ✓ Active: +{(upgrades?.prestigeAutoClickerBoost || 0) * 20}% auto-clicker speed
                                </span>
                            )}
                        </p>
                        {(upgrades?.prestigeAutoClickerBoost || 0) < MAX_AUTO_CLICKER_BOOST ? (
                            <>
                                <p style={{ fontSize: '20px', marginBottom: '20px', textAlign: 'center' }}>
                                    Cost: <strong style={{ color: '#9c27b0', fontSize: '24px' }}>
                                        {getAutoClickerBoostCost(upgrades?.prestigeAutoClickerBoost || 0)} 💎
                                    </strong>
                                </p>
                                <button 
                                    onClick={() => purchaseUpgrade(
                                        'prestigeAutoClickerBoost',
                                        getAutoClickerBoostCost(upgrades?.prestigeAutoClickerBoost || 0),
                                        MAX_AUTO_CLICKER_BOOST,
                                        upgrades?.prestigeAutoClickerBoost || 0
                                    )}
                                    disabled={(upgrades?.prestigePoints || 0) < getAutoClickerBoostCost(upgrades?.prestigeAutoClickerBoost || 0)}
                                    style={{
                                        padding: '15px 25px',
                                        fontSize: '18px',
                                        fontWeight: 'bold',
                                        backgroundColor: (upgrades?.prestigePoints || 0) >= getAutoClickerBoostCost(upgrades?.prestigeAutoClickerBoost || 0) ? '#2196F3' : '#ccc',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '8px',
                                        cursor: (upgrades?.prestigePoints || 0) >= getAutoClickerBoostCost(upgrades?.prestigeAutoClickerBoost || 0) ? 'pointer' : 'not-allowed',
                                        width: '100%',
                                        transition: 'all 0.3s'
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

                    {/* Spawn Boost */}
                    <div style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        padding: '25px',
                        borderRadius: '15px',
                        boxShadow: '0 8px 16px rgba(0,0,0,0.2)',
                        border: '3px solid #FF9800',
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
                            Level {upgrades?.prestigeSpawnBoost || 0}/{MAX_SPAWN_BOOST}
                        </div>
                        <h3 style={{ color: '#FF9800', marginBottom: '15px', fontSize: '28px', fontWeight: 'bold' }}>
                            ⚡ Spawn Rate Boost
                        </h3>
                        <p style={{ marginBottom: '15px', color: '#555', lineHeight: '1.6', minHeight: '80px' }}>
                            Increases firework spawn rate by 15% per level. More fireworks on screen!
                            {(upgrades?.prestigeSpawnBoost || 0) > 0 && (
                                <span style={{ display: 'block', marginTop: '10px', color: '#FF9800', fontWeight: 'bold' }}>
                                    ✓ Active: +{(upgrades?.prestigeSpawnBoost || 0) * 15}% spawn rate
                                </span>
                            )}
                        </p>
                        {(upgrades?.prestigeSpawnBoost || 0) < MAX_SPAWN_BOOST ? (
                            <>
                                <p style={{ fontSize: '20px', marginBottom: '20px', textAlign: 'center' }}>
                                    Cost: <strong style={{ color: '#9c27b0', fontSize: '24px' }}>
                                        {getSpawnBoostCost(upgrades?.prestigeSpawnBoost || 0)} 💎
                                    </strong>
                                </p>
                                <button 
                                    onClick={() => purchaseUpgrade(
                                        'prestigeSpawnBoost',
                                        getSpawnBoostCost(upgrades?.prestigeSpawnBoost || 0),
                                        MAX_SPAWN_BOOST,
                                        upgrades?.prestigeSpawnBoost || 0
                                    )}
                                    disabled={(upgrades?.prestigePoints || 0) < getSpawnBoostCost(upgrades?.prestigeSpawnBoost || 0)}
                                    style={{
                                        padding: '15px 25px',
                                        fontSize: '18px',
                                        fontWeight: 'bold',
                                        backgroundColor: (upgrades?.prestigePoints || 0) >= getSpawnBoostCost(upgrades?.prestigeSpawnBoost || 0) ? '#FF9800' : '#ccc',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '8px',
                                        cursor: (upgrades?.prestigePoints || 0) >= getSpawnBoostCost(upgrades?.prestigeSpawnBoost || 0) ? 'pointer' : 'not-allowed',
                                        width: '100%',
                                        transition: 'all 0.3s'
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

                    {/* Starting Bonus */}
                    <div style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        padding: '25px',
                        borderRadius: '15px',
                        boxShadow: '0 8px 16px rgba(0,0,0,0.2)',
                        border: '3px solid #9C27B0',
                        position: 'relative',
                        overflow: 'hidden'
                    }}>
                        <div style={{
                            position: 'absolute',
                            top: '10px',
                            right: '10px',
                            backgroundColor: '#9C27B0',
                            color: 'white',
                            padding: '5px 15px',
                            borderRadius: '20px',
                            fontSize: '14px',
                            fontWeight: 'bold'
                        }}>
                            Level {upgrades?.prestigeStartingBonus || 0}/{MAX_STARTING_BONUS}
                        </div>
                        <h3 style={{ color: '#9C27B0', marginBottom: '15px', fontSize: '28px', fontWeight: 'bold' }}>
                            🚀 Starting Bonus
                        </h3>
                        <p style={{ marginBottom: '15px', color: '#555', lineHeight: '1.6', minHeight: '80px' }}>
                            Start each prestige with free upgrade levels! Skip the grind.
                            {(upgrades?.prestigeStartingBonus || 0) > 0 && (
                                <span style={{ display: 'block', marginTop: '10px', color: '#9C27B0', fontWeight: 'bold' }}>
                                    ✓ Active: Start with {upgrades?.prestigeStartingBonus || 0} free levels
                                </span>
                            )}
                        </p>
                        {(upgrades?.prestigeStartingBonus || 0) < MAX_STARTING_BONUS ? (
                            <>
                                <p style={{ fontSize: '20px', marginBottom: '20px', textAlign: 'center' }}>
                                    Cost: <strong style={{ color: '#9c27b0', fontSize: '24px' }}>
                                        {getStartingBonusCost(upgrades?.prestigeStartingBonus || 0)} 💎
                                    </strong>
                                </p>
                                <button 
                                    onClick={() => purchaseUpgrade(
                                        'prestigeStartingBonus',
                                        getStartingBonusCost(upgrades?.prestigeStartingBonus || 0),
                                        MAX_STARTING_BONUS,
                                        upgrades?.prestigeStartingBonus || 0
                                    )}
                                    disabled={(upgrades?.prestigePoints || 0) < getStartingBonusCost(upgrades?.prestigeStartingBonus || 0)}
                                    style={{
                                        padding: '15px 25px',
                                        fontSize: '18px',
                                        fontWeight: 'bold',
                                        backgroundColor: (upgrades?.prestigePoints || 0) >= getStartingBonusCost(upgrades?.prestigeStartingBonus || 0) ? '#9C27B0' : '#ccc',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '8px',
                                        cursor: (upgrades?.prestigePoints || 0) >= getStartingBonusCost(upgrades?.prestigeStartingBonus || 0) ? 'pointer' : 'not-allowed',
                                        width: '100%',
                                        transition: 'all 0.3s'
                                    }}
                                >
                                    ⬆️ Upgrade Now
                                </button>
                            </>
                        ) : (
                            <div style={{ 
                                textAlign: 'center',
                                padding: '20px',
                                backgroundColor: '#f3e5f5',
                                borderRadius: '8px'
                            }}>
                                <p style={{ color: '#9C27B0', fontWeight: 'bold', fontSize: '20px', margin: 0 }}>
                                    ✓ MAX LEVEL REACHED!
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Lucky Boost */}
                    <div style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        padding: '25px',
                        borderRadius: '15px',
                        boxShadow: '0 8px 16px rgba(0,0,0,0.2)',
                        border: '3px solid #FFD700',
                        position: 'relative',
                        overflow: 'hidden'
                    }}>
                        <div style={{
                            position: 'absolute',
                            top: '10px',
                            right: '10px',
                            backgroundColor: '#FFD700',
                            color: '#333',
                            padding: '5px 15px',
                            borderRadius: '20px',
                            fontSize: '14px',
                            fontWeight: 'bold'
                        }}>
                            Level {upgrades?.prestigeLuckyBoost || 0}/{MAX_LUCKY_BOOST}
                        </div>
                        <h3 style={{ color: '#DAA520', marginBottom: '15px', fontSize: '28px', fontWeight: 'bold' }}>
                            🍀 Lucky Boost
                        </h3>
                        <p style={{ marginBottom: '15px', color: '#555', lineHeight: '1.6', minHeight: '80px' }}>
                            Increases lucky click chance by 5% per level. More double rewards!
                            {(upgrades?.prestigeLuckyBoost || 0) > 0 && (
                                <span style={{ display: 'block', marginTop: '10px', color: '#DAA520', fontWeight: 'bold' }}>
                                    ✓ Active: +{(upgrades?.prestigeLuckyBoost || 0) * 5}% lucky chance
                                </span>
                            )}
                        </p>
                        {(upgrades?.prestigeLuckyBoost || 0) < MAX_LUCKY_BOOST ? (
                            <>
                                <p style={{ fontSize: '20px', marginBottom: '20px', textAlign: 'center' }}>
                                    Cost: <strong style={{ color: '#9c27b0', fontSize: '24px' }}>
                                        {getLuckyBoostCost(upgrades?.prestigeLuckyBoost || 0)} 💎
                                    </strong>
                                </p>
                                <button 
                                    onClick={() => purchaseUpgrade(
                                        'prestigeLuckyBoost',
                                        getLuckyBoostCost(upgrades?.prestigeLuckyBoost || 0),
                                        MAX_LUCKY_BOOST,
                                        upgrades?.prestigeLuckyBoost || 0
                                    )}
                                    disabled={(upgrades?.prestigePoints || 0) < getLuckyBoostCost(upgrades?.prestigeLuckyBoost || 0)}
                                    style={{
                                        padding: '15px 25px',
                                        fontSize: '18px',
                                        fontWeight: 'bold',
                                        backgroundColor: (upgrades?.prestigePoints || 0) >= getLuckyBoostCost(upgrades?.prestigeLuckyBoost || 0) ? '#FFD700' : '#ccc',
                                        color: '#333',
                                        border: 'none',
                                        borderRadius: '8px',
                                        cursor: (upgrades?.prestigePoints || 0) >= getLuckyBoostCost(upgrades?.prestigeLuckyBoost || 0) ? 'pointer' : 'not-allowed',
                                        width: '100%',
                                        transition: 'all 0.3s'
                                    }}
                                >
                                    ⬆️ Upgrade Now
                                </button>
                            </>
                        ) : (
                            <div style={{ 
                                textAlign: 'center',
                                padding: '20px',
                                backgroundColor: '#fffbea',
                                borderRadius: '8px'
                            }}>
                                <p style={{ color: '#DAA520', fontWeight: 'bold', fontSize: '20px', margin: 0 }}>
                                    ✓ MAX LEVEL REACHED!
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Gold Boost */}
                    <div style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        padding: '25px',
                        borderRadius: '15px',
                        boxShadow: '0 8px 16px rgba(0,0,0,0.2)',
                        border: '3px solid #E91E63',
                        position: 'relative',
                        overflow: 'hidden'
                    }}>
                        <div style={{
                            position: 'absolute',
                            top: '10px',
                            right: '10px',
                            backgroundColor: '#E91E63',
                            color: 'white',
                            padding: '5px 15px',
                            borderRadius: '20px',
                            fontSize: '14px',
                            fontWeight: 'bold'
                        }}>
                            Level {upgrades?.prestigeGoldBoost || 0}/{MAX_GOLD_BOOST}
                        </div>
                        <h3 style={{ color: '#E91E63', marginBottom: '15px', fontSize: '28px', fontWeight: 'bold' }}>
                            🌟 Gold Rush Boost
                        </h3>
                        <p style={{ marginBottom: '15px', color: '#555', lineHeight: '1.6', minHeight: '80px' }}>
                            Increases golden firework spawn chance by 5% per level. Strike gold more often!
                            {(upgrades?.prestigeGoldBoost || 0) > 0 && (
                                <span style={{ display: 'block', marginTop: '10px', color: '#E91E63', fontWeight: 'bold' }}>
                                    ✓ Active: +{(upgrades?.prestigeGoldBoost || 0) * 5}% gold spawn chance
                                </span>
                            )}
                        </p>
                        {(upgrades?.prestigeGoldBoost || 0) < MAX_GOLD_BOOST ? (
                            <>
                                <p style={{ fontSize: '20px', marginBottom: '20px', textAlign: 'center' }}>
                                    Cost: <strong style={{ color: '#9c27b0', fontSize: '24px' }}>
                                        {getGoldBoostCost(upgrades?.prestigeGoldBoost || 0)} 💎
                                    </strong>
                                </p>
                                <button 
                                    onClick={() => purchaseUpgrade(
                                        'prestigeGoldBoost',
                                        getGoldBoostCost(upgrades?.prestigeGoldBoost || 0),
                                        MAX_GOLD_BOOST,
                                        upgrades?.prestigeGoldBoost || 0
                                    )}
                                    disabled={(upgrades?.prestigePoints || 0) < getGoldBoostCost(upgrades?.prestigeGoldBoost || 0)}
                                    style={{
                                        padding: '15px 25px',
                                        fontSize: '18px',
                                        fontWeight: 'bold',
                                        backgroundColor: (upgrades?.prestigePoints || 0) >= getGoldBoostCost(upgrades?.prestigeGoldBoost || 0) ? '#E91E63' : '#ccc',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '8px',
                                        cursor: (upgrades?.prestigePoints || 0) >= getGoldBoostCost(upgrades?.prestigeGoldBoost || 0) ? 'pointer' : 'not-allowed',
                                        width: '100%',
                                        transition: 'all 0.3s'
                                    }}
                                >
                                    ⬆️ Upgrade Now
                                </button>
                            </>
                        ) : (
                            <div style={{ 
                                textAlign: 'center',
                                padding: '20px',
                                backgroundColor: '#fce4ec',
                                borderRadius: '8px'
                            }}>
                                <p style={{ color: '#E91E63', fontWeight: 'bold', fontSize: '20px', margin: 0 }}>
                                    ✓ MAX LEVEL REACHED!
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Navigation Buttons */}
                <div style={{ textAlign: 'center', marginTop: '40px' }}>
                    <button
                        onClick={() => navigate('/prestige')}
                        style={{
                            padding: '15px 40px',
                            fontSize: '18px',
                            fontWeight: 'bold',
                            backgroundColor: '#9c27b0',
                            color: 'white',
                            border: 'none',
                            borderRadius: '10px',
                            cursor: 'pointer',
                            marginRight: '15px',
                            transition: 'all 0.3s'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'scale(1.05)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'scale(1)';
                        }}
                    >
                        🌟 Prestige Page
                    </button>
                    
                    <button
                        onClick={() => navigate('/santa')}
                        style={{
                            padding: '15px 40px',
                            fontSize: '18px',
                            fontWeight: 'bold',
                            backgroundColor: '#1976d2',
                            color: 'white',
                            border: 'none',
                            borderRadius: '10px',
                            cursor: 'pointer',
                            transition: 'all 0.3s'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'scale(1.05)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'scale(1)';
                        }}
                    >
                        🎆 Regular Shop
                    </button>
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
                        color: '#9c27b0', 
                        marginBottom: '20px',
                        fontSize: '24px',
                        fontWeight: 'bold',
                        textAlign: 'center'
                    }}>
                        ℹ️ About Prestige Upgrades
                    </h3>
                    <ul style={{ lineHeight: '2', color: '#555', fontSize: '16px', paddingLeft: '30px' }}>
                        <li><strong>Permanent:</strong> These upgrades never reset, even when you prestige</li>
                        <li><strong>Multiplicative:</strong> All bonuses stack with regular shop upgrades</li>
                        <li><strong>Expensive:</strong> Prestige points are rare, so choose wisely</li>
                        <li><strong>Progressive:</strong> Each level costs more prestige points than the last</li>
                        <li><strong>Powerful:</strong> These are the key to long-term progression</li>
                    </ul>
                </div>
            </div>
            <Cloudfooter />
        </div>
    );
};

export default PrestigeShop;
