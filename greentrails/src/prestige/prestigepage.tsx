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

interface UserData {
    santasPopped: number;
    prestigeLevel: number;
    prestigePoints: number;
    totalFireworksAllTime: number;
    autoClickerLevel: number;
    spawnSpeedLevel: number;
    santaWorthLevel: number;
    luckyClickLevel: number;
    goldRushLevel: number;
    clickMultiplierLevel: number;
    prestigeStartingBonus: number;
}

const PrestigePage: React.FC = () => {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [userData, setUserData] = useState<UserData | null>(null);
    const [loading, setLoading] = useState(true);
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [processing, setProcessing] = useState(false);

    // Prestige requirements
    const PRESTIGE_REQUIREMENT = 10000; // Need 10,000 fireworks to prestige
    const PRESTIGE_POINTS_PER_10K = 1; // Get 1 prestige point per 10k fireworks

    useEffect(() => {
        if (currentUser) {
            loadUserData();
        } else {
            setLoading(false);
        }
    }, [currentUser]);

    const loadUserData = async () => {
        if (!currentUser) return;
        
        try {
            const userDocRef = doc(db, "Users", currentUser);
            const userDoc = await getDoc(userDocRef);
            
            if (userDoc.exists()) {
                const data = userDoc.data();
                setUserData({
                    santasPopped: data.santasPopped || 0,
                    prestigeLevel: data.prestigeLevel || 0,
                    prestigePoints: data.prestigePoints || 0,
                    totalFireworksAllTime: data.totalFireworksAllTime || 0,
                    autoClickerLevel: data.autoClickerLevel || 0,
                    spawnSpeedLevel: data.spawnSpeedLevel || 0,
                    santaWorthLevel: data.santaWorthLevel || 0,
                    luckyClickLevel: data.luckyClickLevel || 0,
                    goldRushLevel: data.goldRushLevel || 0,
                    clickMultiplierLevel: data.clickMultiplierLevel || 0,
                    prestigeStartingBonus: data.prestigeStartingBonus || 0
                });
            }
        } catch (error) {
            console.error("Error loading user data:", error);
            showNotification("Error loading user data", "error");
        } finally {
            setLoading(false);
        }
    };

    const calculatePrestigePoints = (fireworks: number): number => {
        return Math.floor(fireworks / 10000) * PRESTIGE_POINTS_PER_10K;
    };

    const canPrestige = (): boolean => {
        return userData !== null && userData.santasPopped >= PRESTIGE_REQUIREMENT;
    };

    const handlePrestige = async () => {
        if (!currentUser || !userData || !canPrestige()) {
            showNotification("Cannot prestige yet!", "error");
            return;
        }

        setProcessing(true);
        
        try {
            const userDocRef = doc(db, "Users", currentUser);
            
            await runTransaction(db, async (transaction) => {
                const userDoc = await transaction.get(userDocRef);
                
                if (!userDoc.exists()) {
                    throw new Error("User document does not exist");
                }

                const currentData = userDoc.data();
                const currentFireworks = currentData.santasPopped || 0;
                
                if (currentFireworks < PRESTIGE_REQUIREMENT) {
                    throw new Error("Not enough fireworks to prestige");
                }

                // Calculate prestige points to gain
                const newPrestigePoints = calculatePrestigePoints(currentFireworks);
                const totalPrestigePoints = (currentData.prestigePoints || 0) + newPrestigePoints;
                const newPrestigeLevel = (currentData.prestigeLevel || 0) + 1;
                const newTotalAllTime = (currentData.totalFireworksAllTime || 0) + currentFireworks;
                
                // Get starting bonus level (free upgrade levels after prestige)
                const startingBonusLevel = currentData.prestigeStartingBonus || 0;

                // Update user document - reset upgrades to starting bonus level, keep prestige
                transaction.update(userDocRef, {
                    prestigeLevel: newPrestigeLevel,
                    prestigePoints: totalPrestigePoints,
                    totalFireworksAllTime: newTotalAllTime,
                    santasPopped: 0,
                    autoClickerLevel: startingBonusLevel,
                    spawnSpeedLevel: startingBonusLevel,
                    santaWorthLevel: startingBonusLevel,
                    luckyClickLevel: startingBonusLevel,
                    goldRushLevel: startingBonusLevel,
                    clickMultiplierLevel: startingBonusLevel
                });

                // Update local state
                setUserData({
                    santasPopped: 0,
                    prestigeLevel: newPrestigeLevel,
                    prestigePoints: totalPrestigePoints,
                    totalFireworksAllTime: newTotalAllTime,
                    autoClickerLevel: startingBonusLevel,
                    spawnSpeedLevel: startingBonusLevel,
                    santaWorthLevel: startingBonusLevel,
                    luckyClickLevel: startingBonusLevel,
                    goldRushLevel: startingBonusLevel,
                    clickMultiplierLevel: startingBonusLevel
                });
            });

            showNotification(`Prestige successful! You are now Prestige Level ${newPrestigeLevel}!`, "success");
            setShowConfirmation(false);
        } catch (error) {
            console.error("Error prestiging:", error);
            showNotification("Failed to prestige. Please try again.", "error");
        } finally {
            setProcessing(false);
        }
    };

    if (!currentUser) {
        return (
            <div>
                <Top message="Prestige System" shadow={true} />
                <Navbar />
                <div style={{ 
                    padding: '40px', 
                    textAlign: 'center',
                    minHeight: '60vh',
                    backgroundColor: '#f5f5f5'
                }}>
                    <h2 style={{ color: '#1976d2', marginBottom: '20px' }}>🌟 Prestige System</h2>
                    <p style={{ fontSize: '18px', color: '#666' }}>
                        Please login to access the Prestige System!
                    </p>
                </div>
                <Cloudfooter />
            </div>
        );
    }

    if (loading) {
        return (
            <div>
                <Top message="Prestige System" shadow={true} />
                <Navbar />
                <div style={{ padding: '40px', textAlign: 'center' }}>
                    <p>Loading...</p>
                </div>
                <Cloudfooter />
            </div>
        );
    }

    const prestigePointsToGain = calculatePrestigePoints(userData?.santasPopped || 0);

    return (
        <div>
            <Top message="Prestige System" shadow={true} />
            <Navbar />
            <div style={{ 
                padding: '40px',
                maxWidth: '1200px',
                margin: '0 auto',
                minHeight: '60vh',
                marginTop: '20px',
                marginBottom: '20px'
            }}>
                {/* Header Section */}
                <div style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    padding: '40px',
                    borderRadius: '20px',
                    marginBottom: '30px',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
                    textAlign: 'center'
                }}>
                    <h2 style={{ 
                        color: '#ffffff', 
                        fontSize: '48px',
                        fontWeight: 'bold',
                        marginBottom: '10px',
                        textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
                    }}>
                        🌟 Prestige System 🌟
                    </h2>
                    <p style={{ 
                        color: '#f0f0f0', 
                        fontSize: '20px',
                        fontStyle: 'italic'
                    }}>
                        Reset your progress for permanent bonuses!
                    </p>
                </div>

                {/* Current Stats Section */}
                <div style={{
                    backgroundColor: 'white',
                    padding: '30px',
                    borderRadius: '15px',
                    marginBottom: '30px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    border: '3px solid #667eea'
                }}>
                    <h3 style={{ 
                        color: '#667eea', 
                        marginBottom: '25px',
                        fontSize: '28px',
                        textAlign: 'center'
                    }}>
                        📊 Your Current Status
                    </h3>
                    <div style={{ 
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: '20px'
                    }}>
                        <div style={{ 
                            textAlign: 'center',
                            padding: '20px',
                            backgroundColor: '#f3e5f5',
                            borderRadius: '10px',
                            border: '2px solid #9c27b0'
                        }}>
                            <p style={{ fontSize: '16px', marginBottom: '8px', color: '#666' }}>Prestige Level</p>
                            <p style={{ fontSize: '36px', fontWeight: 'bold', color: '#9c27b0', margin: 0 }}>
                                {userData?.prestigeLevel || 0}
                            </p>
                        </div>
                        <div style={{ 
                            textAlign: 'center',
                            padding: '20px',
                            backgroundColor: '#e3f2fd',
                            borderRadius: '10px',
                            border: '2px solid #1976d2'
                        }}>
                            <p style={{ fontSize: '16px', marginBottom: '8px', color: '#666' }}>Prestige Points</p>
                            <p style={{ fontSize: '36px', fontWeight: 'bold', color: '#1976d2', margin: 0 }}>
                                {userData?.prestigePoints || 0}
                            </p>
                        </div>
                        <div style={{ 
                            textAlign: 'center',
                            padding: '20px',
                            backgroundColor: '#fff3e0',
                            borderRadius: '10px',
                            border: '2px solid #f57c00'
                        }}>
                            <p style={{ fontSize: '16px', marginBottom: '8px', color: '#666' }}>Current Fireworks</p>
                            <p style={{ fontSize: '36px', fontWeight: 'bold', color: '#f57c00', margin: 0 }}>
                                {userData?.santasPopped || 0}
                            </p>
                        </div>
                        <div style={{ 
                            textAlign: 'center',
                            padding: '20px',
                            backgroundColor: '#e8f5e9',
                            borderRadius: '10px',
                            border: '2px solid #388e3c'
                        }}>
                            <p style={{ fontSize: '16px', marginBottom: '8px', color: '#666' }}>Total All-Time</p>
                            <p style={{ fontSize: '36px', fontWeight: 'bold', color: '#388e3c', margin: 0 }}>
                                {userData?.totalFireworksAllTime || 0}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Prestige Information */}
                <div style={{
                    backgroundColor: 'white',
                    padding: '30px',
                    borderRadius: '15px',
                    marginBottom: '30px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    border: '3px solid #ffd700'
                }}>
                    <h3 style={{ 
                        color: '#f57c00', 
                        marginBottom: '20px',
                        fontSize: '28px',
                        textAlign: 'center'
                    }}>
                        ℹ️ What is Prestige?
                    </h3>
                    <div style={{ lineHeight: '1.8', color: '#555', fontSize: '16px' }}>
                        <p><strong>🔄 How it works:</strong></p>
                        <ul style={{ paddingLeft: '30px', marginBottom: '20px' }}>
                            <li>Requires <strong>{PRESTIGE_REQUIREMENT.toLocaleString()}</strong> fireworks to prestige</li>
                            <li>Earn <strong>1 Prestige Point</strong> per 10,000 fireworks</li>
                            <li>All shop upgrades are reset to level 0</li>
                            <li>Your fireworks are reset to 0</li>
                            <li>Prestige Level and Prestige Points are permanent</li>
                        </ul>
                        
                        <p><strong>✨ Benefits:</strong></p>
                        <ul style={{ paddingLeft: '30px', marginBottom: '20px' }}>
                            <li>Spend Prestige Points in the <strong>Prestige Shop</strong></li>
                            <li>Unlock powerful permanent upgrades</li>
                            <li>Gain multipliers that apply to ALL future runs</li>
                            <li>Show off your Prestige Level on leaderboards</li>
                        </ul>

                        {canPrestige() && (
                            <div style={{
                                backgroundColor: '#e8f5e9',
                                padding: '20px',
                                borderRadius: '10px',
                                marginTop: '20px',
                                border: '2px solid #4caf50'
                            }}>
                                <p style={{ color: '#2e7d32', fontWeight: 'bold', fontSize: '18px', marginBottom: '10px' }}>
                                    ✅ You can prestige now!
                                </p>
                                <p style={{ color: '#555', marginBottom: '10px' }}>
                                    You will gain: <strong style={{ color: '#1976d2', fontSize: '20px' }}>{prestigePointsToGain} Prestige Point{prestigePointsToGain !== 1 ? 's' : ''}</strong>
                                </p>
                            </div>
                        )}

                        {!canPrestige() && (
                            <div style={{
                                backgroundColor: '#fff3e0',
                                padding: '20px',
                                borderRadius: '10px',
                                marginTop: '20px',
                                border: '2px solid #ff9800'
                            }}>
                                <p style={{ color: '#e65100', fontWeight: 'bold', fontSize: '18px', marginBottom: '10px' }}>
                                    ⚠️ Not ready to prestige yet
                                </p>
                                <p style={{ color: '#555' }}>
                                    You need <strong>{(PRESTIGE_REQUIREMENT - (userData?.santasPopped || 0)).toLocaleString()}</strong> more fireworks to prestige.
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Prestige Button */}
                <div style={{ textAlign: 'center' }}>
                    <button
                        onClick={() => setShowConfirmation(true)}
                        disabled={!canPrestige() || processing}
                        style={{
                            padding: '20px 60px',
                            fontSize: '24px',
                            fontWeight: 'bold',
                            backgroundColor: canPrestige() ? '#9c27b0' : '#ccc',
                            color: 'white',
                            border: 'none',
                            borderRadius: '15px',
                            cursor: canPrestige() ? 'pointer' : 'not-allowed',
                            transition: 'all 0.3s',
                            boxShadow: canPrestige() ? '0 8px 16px rgba(156, 39, 176, 0.4)' : 'none',
                            marginBottom: '20px'
                        }}
                        onMouseEnter={(e) => {
                            if (canPrestige()) {
                                e.currentTarget.style.transform = 'scale(1.05)';
                            }
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'scale(1)';
                        }}
                    >
                        {processing ? '⏳ Processing...' : '🌟 PRESTIGE NOW'}
                    </button>
                    
                    <div style={{ marginTop: '20px' }}>
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
                            🎆 Back to Shop
                        </button>
                        
                        <button
                            onClick={() => navigate('/prestigeshop')}
                            style={{
                                padding: '15px 40px',
                                fontSize: '18px',
                                fontWeight: 'bold',
                                backgroundColor: '#f57c00',
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
                            💎 Prestige Shop
                        </button>
                    </div>
                </div>

                {/* Confirmation Modal */}
                {showConfirmation && (
                    <div style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.7)',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        zIndex: 1000
                    }}>
                        <div style={{
                            backgroundColor: 'white',
                            padding: '40px',
                            borderRadius: '20px',
                            maxWidth: '500px',
                            boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
                            border: '3px solid #9c27b0'
                        }}>
                            <h3 style={{ color: '#9c27b0', marginBottom: '20px', fontSize: '28px', textAlign: 'center' }}>
                                ⚠️ Confirm Prestige
                            </h3>
                            <p style={{ fontSize: '18px', color: '#555', marginBottom: '20px', lineHeight: '1.6' }}>
                                Are you sure you want to prestige? This will:
                            </p>
                            <ul style={{ color: '#d32f2f', fontSize: '16px', marginBottom: '20px', paddingLeft: '30px' }}>
                                {(userData?.prestigeStartingBonus || 0) > 0 ? (
                                    <li>Reset all shop upgrades to level {userData?.prestigeStartingBonus || 0} (Starting Bonus)</li>
                                ) : (
                                    <li>Reset all shop upgrades to level 0</li>
                                )}
                                <li>Reset your fireworks to 0</li>
                            </ul>
                            <p style={{ fontSize: '18px', color: '#2e7d32', marginBottom: '30px', fontWeight: 'bold' }}>
                                You will gain: {prestigePointsToGain} Prestige Point{prestigePointsToGain !== 1 ? 's' : ''}
                            </p>
                            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
                                <button
                                    onClick={() => setShowConfirmation(false)}
                                    disabled={processing}
                                    style={{
                                        padding: '15px 30px',
                                        fontSize: '18px',
                                        fontWeight: 'bold',
                                        backgroundColor: '#757575',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '10px',
                                        cursor: 'pointer',
                                        transition: 'all 0.3s'
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handlePrestige}
                                    disabled={processing}
                                    style={{
                                        padding: '15px 30px',
                                        fontSize: '18px',
                                        fontWeight: 'bold',
                                        backgroundColor: processing ? '#ccc' : '#9c27b0',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '10px',
                                        cursor: processing ? 'not-allowed' : 'pointer',
                                        transition: 'all 0.3s'
                                    }}
                                >
                                    {processing ? 'Processing...' : 'Confirm Prestige'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            <Cloudfooter />
        </div>
    );
};

export default PrestigePage;
