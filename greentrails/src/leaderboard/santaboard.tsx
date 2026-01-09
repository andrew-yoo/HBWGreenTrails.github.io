import '../styles/style.css'
import '../styles/leaderboard.css'
import React, { useEffect } from 'react';
import { db } from '../base/firebaseConfig';
import { collection, getDocs } from "firebase/firestore";

interface User {
    id: string;
    santasPopped: number;
    Name: string;
}

interface SantaLeaderboardProps {
    usersData: any[];
}

const SantaLeaderboard: React.FC<SantaLeaderboardProps> = ({ usersData }) => {
    const [leaderboardData, setLeaderboardData] = React.useState<User[]>([]);

    useEffect(() => {
        // Use provided data instead of fetching
        const fetchedData = usersData.map((user) => ({
            id: user.id,
            santasPopped: user.santasPopped || 0,
            Name: user.Name || "",
        })) as User[];
        setLeaderboardData(fetchedData.sort((a, b) => b.santasPopped - a.santasPopped));
    }, [usersData]);

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
