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


    const Signupgui: React.FC = () => {
        const [leaderboardData, setLeaderboardData] = React.useState<any[]>([]);
        const [opportunities, setOpportunities] = React.useState<any[]>([]);
        const [isLoginMode, setIsLoginMode] = React.useState(false);
        const { currentUser, login, logout } = useAuth();
        const navigate = useNavigate();
    
        useEffect(() => {
            
        }, []);

        function adduser(event: React.MouseEvent<HTMLButtonElement>) {
            
            const Name = (document.getElementById('name') as HTMLInputElement).value;
            console.log(Name);
                    const checkIdExists = async (id: string) => {
                        const querySnapshot = await getDocs(collection(db, "Users"));
                        let idExists = false;
                        querySnapshot.forEach((doc) => {
                            if (doc.id === id) {
                                idExists = true;
                            }
                        });
                        return idExists;
                    };

                    checkIdExists(Name).then((exists) => {
                        if (exists) {
                            alert("name already in use. Please choose a different name.");
                            return;
                        } else {
                            if (Name.trim() !== "") {
                                const newDocRef = doc(collection(db, "Users"), Name);
                                setDoc(newDocRef, { Name , score: 0, santasPopped: 0, isAdmin: false }).then(() => {
                                    alert("User created successfully! You are now logged in.");
                                    login(Name, false);
                                });
                            } else {
                                alert("Name cannot be empty. Please enter a valid name.");
                            }
                        }
                    });
            
        }

        async function loginUser(event: React.MouseEvent<HTMLButtonElement>) {
            const Name = (document.getElementById('name') as HTMLInputElement).value;
            
            if (Name.trim() === "") {
                alert("Name cannot be empty. Please enter a valid name.");
                return;
            }

            try {
                const userDocRef = doc(db, "Users", Name);
                const userDoc = await getDoc(userDocRef);
                
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    
                    // Initialize missing fields
                    const updates: any = {};
                    if (userData && userData.santasPopped === undefined) {
                        updates.santasPopped = 0;
                    }
                    if (userData && userData.isAdmin === undefined) {
                        updates.isAdmin = false;
                    }
                    if (Object.keys(updates).length > 0) {
                        await updateDoc(userDocRef, updates);
                    }
                    
                    // Login with admin status
                    const isAdmin = userData?.isAdmin || false;
                    login(Name, isAdmin);
                    alert(`Welcome back, ${Name}!`);
                } else {
                    alert("User not found. Please sign up first.");
                }
            } catch (error) {
                console.error("Error logging in:", error);
                alert("Error logging in. Please try again.");
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
                        <input id="name" type="text" placeholder='Enter your name' />
                        {isLoginMode ? (
                            <button type="submit" onClick={e => loginUser(e)}>Login</button>
                        ) : (
                            <button type="submit" onClick={e => adduser(e)}>Sign Up</button>
                        )}
                        <div className="signup-toggle">
                            <p style={{ marginBottom: '10px', color: '#666' }}>
                                {isLoginMode ? "Don't have an account?" : "Already have an account?"}
                            </p>
                            <button onClick={() => setIsLoginMode(!isLoginMode)}>
                                {isLoginMode ? 'Create New Account' : 'Login Instead'}
                            </button>
                        </div>
                    </div>
                )}
            </div> 
        );
    };
export default Signupgui;