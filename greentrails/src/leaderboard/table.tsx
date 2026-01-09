import '../styles/style.css'
import '../styles/leaderboard.css'
import React, { use, useEffect } from 'react';
import { db } from '../base/firebaseConfig';
import { collection, getDocs, updateDoc, doc, arrayUnion } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { Button, Container } from 'react-bootstrap';

interface User {
    id: string;
    score: number;
    Name: string;
}

interface TableProps {
    usersData: any[];
    opportunitiesData: any[];
}

    
    const Table: React.FC<TableProps> = ({ usersData, opportunitiesData }) => {
        const [leaderboardData, setLeaderboardData] = React.useState<User[]>([]);
        const [opportunities, setOpportunities] = React.useState<any[]>([]);

        useEffect (() => {
            // Use provided data instead of fetching
            const fetchedData = usersData.map((user) => ({
                id: user.id,
                score: user.score || 0,
                Name: user.Name || "",
            })) as User[];
            setLeaderboardData(fetchedData.sort((a, b) => b.score - a.score));
            setOpportunities(opportunitiesData);
        }, [usersData, opportunitiesData]);

        function upl(event: React.MouseEvent<HTMLButtonElement>) {
            // Calculate scores for all users first
            const userScores = new Map<string, number>();
            
            leaderboardData.forEach(user => {
                let score = 0;
                opportunities.forEach(opertunity => {
                    if (opertunity.signups.includes(user.id)) {
                        score += 1;
                    }
                });
                userScores.set(user.id, score);
            });

            // Batch update all users with Promise.all
            const updatePromises = Array.from(userScores.entries()).map(([userId, score]) => 
                updateDoc(doc(db, "Users", userId), {
                    score: score,
                })
            );

            Promise.all(updatePromises)
                .then(() => {
                    console.log('Done updating leaderboard');
                })
                .catch((error) => {
                    console.error('Error updating leaderboard:', error);
                });
        }

        return (
        <div id='events-table'>
                <h3 id='events-title'>Events Attended</h3>
                <div id='events-leaderboard' className='boardcon'> 
                {leaderboardData.map((user, index) => (
                    <div className='lbentrie' key={user.id}>
                    <p className='place'>{index+1}.</p>
                    <p className='username'>{user.Name}</p>
                    <p className='userscore'>{user.score}</p>
                    <p className='username' >  </p>
                    </div>
                ))}
                <button onClick={(e) => upl(e)} id="">Update leaderboard</button>
                </div>
        </div>
        )
    }
    export default Table;