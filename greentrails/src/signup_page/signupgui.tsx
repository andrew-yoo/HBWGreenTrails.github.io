import '../styles/style.css'
import '../styles/leaderboard.css'
import React, { use, useEffect } from 'react';
import { db } from '../base/firebaseConfig';
import { collection, getDocs, updateDoc, doc, arrayUnion, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { Button, Container } from 'react-bootstrap';
import { addDoc, setDoc } from "firebase/firestore";
import { useAuth } from '../context/AuthContext';
import { showNotification } from '../componets/Notification';


    const Signupgui: React.FC = () => {
        const [leaderboardData, setLeaderboardData] = React.useState<any[]>([]);
        const [opportunities, setOpportunities] = React.useState<any[]>([]);
        const [isLoginMode, setIsLoginMode] = React.useState(true);
        const [allUserNames, setAllUserNames] = React.useState<string[]>([]);
        const [nameInput, setNameInput] = React.useState('');
        const [selectedUser, setSelectedUser] = React.useState('');
        const { currentUser, login, logout } = useAuth();
        const navigate = useNavigate();
    
        useEffect(() => {
            // Fetch all usernames for the dropdown
            const fetchUserNames = async () => {
                try {
                    const querySnapshot = await getDocs(collection(db, "Users"));
                    const names = querySnapshot.docs.map((doc) => doc.id);
                    setAllUserNames(names.sort());
                } catch (error) {
                    console.error("Error fetching usernames:", error);
                }
            };
            fetchUserNames();
        }, []);

        function adduser(event: React.MouseEvent<HTMLButtonElement>) {
            const Name = nameInput.trim();
            
            if (Name === "") {
                showNotification("Name cannot be empty. Please enter a valid name.", "error");
                return;
            }
            
            console.log(Name);
                    const checkIdExists = async (id: string) => {
                        const querySnapshot = await getDocs(collection(db, "Users"));
                        let idExists = false;
                        querySnapshot.forEach((doc) => {
                            // Case-insensitive comparison
                            if (doc.id.toLowerCase() === id.toLowerCase()) {
                                idExists = true;
                            }
                        });
                        return idExists;
                    };

                    checkIdExists(Name).then((exists) => {
                        if (exists) {
                            showNotification("Name already in use. Please choose a different name.", "error");
                            return;
                        } else {
                            // Store name as-is but check will be case-insensitive
                            const newDocRef = doc(collection(db, "Users"), Name);
                            setDoc(newDocRef, { 
                                Name, 
                                score: 0, 
                                santasPopped: 0, 
                                isAdmin: false,
                                autoClickerLevel: 0,
                                spawnSpeedLevel: 0,
                                santaWorthLevel: 0,
                                luckyClickLevel: 0,
                                goldRushLevel: 0,
                                clickMultiplierLevel: 0
                            }).then(() => {
                                showNotification("User created successfully! You are now logged in.", "success");
                                login(Name, false);
                                // Refresh the username list
                                setAllUserNames([...allUserNames, Name].sort());
                                setNameInput('');
                            });
                        }
                    });
            
        }

        async function loginUser(event: React.MouseEvent<HTMLButtonElement>) {
            // Use selected user from dropdown or typed name
            let Name = selectedUser || nameInput;
            Name = Name.trim();
            
            if (Name === "") {
                showNotification("Name cannot be empty. Please select or enter a valid name.", "error");
                return;
            }

            try {
                // First try exact match
                let userDocRef = doc(db, "Users", Name);
                let userDoc = await getDoc(userDocRef);
                
                // If not found, try case-insensitive search
                if (!userDoc.exists()) {
                    const querySnapshot = await getDocs(collection(db, "Users"));
                    let foundName = null;
                    querySnapshot.forEach((doc) => {
                        if (doc.id.toLowerCase() === Name.toLowerCase()) {
                            foundName = doc.id;
                        }
                    });
                    
                    if (foundName) {
                        Name = foundName;
                        userDocRef = doc(db, "Users", Name);
                        userDoc = await getDoc(userDocRef);
                    }
                }
                
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    
                    // Initialize missing fields including new upgrade fields (but not coins)
                    const updates: any = {};
                    if (userData && userData.santasPopped === undefined) {
                        updates.santasPopped = 0;
                    }
                    if (userData && userData.isAdmin === undefined) {
                        updates.isAdmin = false;
                    }
                    if (userData && userData.autoClickerLevel === undefined) {
                        updates.autoClickerLevel = 0;
                    }
                    if (userData && userData.spawnSpeedLevel === undefined) {
                        updates.spawnSpeedLevel = 0;
                    }
                    if (userData && userData.santaWorthLevel === undefined) {
                        updates.santaWorthLevel = 0;
                    }
                    if (userData && userData.luckyClickLevel === undefined) {
                        updates.luckyClickLevel = 0;
                    }
                    if (userData && userData.goldRushLevel === undefined) {
                        updates.goldRushLevel = 0;
                    }
                    if (userData && userData.clickMultiplierLevel === undefined) {
                        updates.clickMultiplierLevel = 0;
                    }
                    if (Object.keys(updates).length > 0) {
                        await updateDoc(userDocRef, updates);
                    }
                    
                    // Login with admin status
                    const isAdmin = userData?.isAdmin || false;
                    login(Name, isAdmin);
                    showNotification(`Welcome back, ${Name}!`, "success");
                } else {
                    showNotification("User not found. Please sign up first.", "error");
                }
            } catch (error) {
                console.error("Error logging in:", error);
                showNotification("Error logging in. Please try again.", "error");
            }
        }

        return (
            <div>
                {currentUser ? (
                    <div className="signup signup-welcome">
                        <h3>🌲 Welcome, {currentUser}! 🌲</h3>
                        <p>You are currently logged in.</p>
                        <p style={{ fontSize: '16px', marginTop: '20px' }}>
                            🎅 <strong>Santa Tracking Active!</strong> Click flying Santas anywhere on the site to earn points and climb the leaderboard!
                        </p>
                        <button onClick={() => logout()}>Logout</button>
                    </div>
                ) : (
                    <div className="signup">
                        <h3>{isLoginMode ? '🔐 Login' : '✨ Sign Up'}</h3>
                        <p style={{ fontSize: '16px', color: '#2d5a3d', marginBottom: '20px' }}>
                            🎅 Track your Santa pops and compete on the leaderboard!
                        </p>
                        {isLoginMode && allUserNames.length > 0 ? (
                            <div>
                                <label htmlFor="userSelect" style={{ display: 'block', marginBottom: '8px', color: '#2d5a3d' }}>
                                    Select your name:
                                </label>
                                <select 
                                    id="userSelect"
                                    value={selectedUser}
                                    onChange={(e) => setSelectedUser(e.target.value)}
                                    style={{ 
                                        width: '100%', 
                                        padding: '10px', 
                                        marginBottom: '10px',
                                        borderRadius: '4px',
                                        border: '1px solid #ccc',
                                        fontSize: '16px'
                                    }}
                                >
                                    <option value="">-- Choose your name --</option>
                                    {allUserNames.map((name) => (
                                        <option key={name} value={name}>{name}</option>
                                    ))}
                                </select>
                            </div>
                        ) : (
                            <input 
                                id="name" 
                                type="text" 
                                placeholder='Enter your name'
                                value={nameInput}
                                onChange={(e) => setNameInput(e.target.value)}
                            />
                        )}
                        {isLoginMode ? (
                            <button type="submit" onClick={e => loginUser(e)}>Login</button>
                        ) : (
                            <button type="submit" onClick={e => adduser(e)}>Sign Up</button>
                        )}
                        <div className="signup-toggle">
                            <p style={{ marginBottom: '10px', color: '#666' }}>
                                {isLoginMode ? "Don't have an account?" : "Already have an account?"}
                            </p>
                            <button onClick={() => {
                                setIsLoginMode(!isLoginMode);
                                setNameInput('');
                                setSelectedUser('');
                            }}>
                                {isLoginMode ? 'Create New Account' : 'Login Instead'}
                            </button>
                        </div>
                    </div>
                )}
            </div> 
        );
    };
export default Signupgui;