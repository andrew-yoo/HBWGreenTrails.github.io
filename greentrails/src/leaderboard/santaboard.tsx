import '../styles/style.css'
import '../styles/leaderboard.css'
import React, { useEffect } from 'react';
import { db } from '../base/firebaseConfig';
import { collection, getDocs } from "firebase/firestore";

const SantaLeaderboard: React.FC = () => {
    interface User {
        id: string;
        santasPopped: number;
        Name: string;
    }

    const [leaderboardData, setLeaderboardData] = React.useState<User[]>([]);

    useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                const querySnapshot = await getDocs(collection(db, "Users"));
                const fetchedData = querySnapshot.docs.map((doc) => ({
                    id: doc.id,
                    santasPopped: doc.data().santasPopped || 0,
                    Name: doc.data().Name,
                })) as User[];
                setLeaderboardData(fetchedData.sort((a, b) => b.santasPopped - a.santasPopped));
            } catch (error) {
                console.error("Error fetching santa leaderboard:", error);
            }
        };
        fetchLeaderboard();

        // Refresh leaderboard every 5 seconds
        const interval = setInterval(fetchLeaderboard, 5000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div id='santa-table'>
            <h3 id='santa-title'>Fireworks Popped</h3>
            <div id='santa-leaderboard' className='boardcon'> 
                {leaderboardData.map((user, index) => (
                    <div className='lbentrie' key={user.id}>
                        <p className='place'>{index+1}.</p>
                        <p className='username'>{user.Name}</p>
                        <p className='userscore'>{user.santasPopped}</p>
                        <p className='username'>  </p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SantaLeaderboard;
