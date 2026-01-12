import '../styles/style.css'
import React, { useEffect, useState } from 'react';
import Navbar from '../componets/sadnavbar';
import { Link } from 'react-router-dom';
import table from './table';
import Table from './table';
import Top from '../componets/header';
import Meetingsboard from './meetingsboard';
import SantaLeaderboard from './santaboard';
import {Cloudfooter} from '../componets/footer';
import { db } from '../base/firebaseConfig';
import { collection, getDocs } from "firebase/firestore";

    const Leaderboard: React.FC = () => {
        const [usersData, setUsersData] = useState<any[]>([]);
        const [opportunitiesData, setOpportunitiesData] = useState<any[]>([]);
        const [meetingsData, setMeetingsData] = useState<any[]>([]);
        const [loading, setLoading] = useState(true);

        useEffect(() => {
            const fetchAllData = async () => {
                try {
                    // Fetch all collections in parallel
                    const [usersSnapshot, opportunitiesSnapshot, meetingsSnapshot] = await Promise.all([
                        getDocs(collection(db, "Users")),
                        getDocs(collection(db, "opportunities")),
                        getDocs(collection(db, "meetings"))
                    ]);

                    // Process Users data
                    const users = usersSnapshot.docs.map((doc) => ({
                        id: doc.id,
                        ...doc.data()
                    }));
                    setUsersData(users);

                    // Process opportunities data
                    const opportunities = opportunitiesSnapshot.docs.map((doc) => ({
                        id: doc.id,
                        ...doc.data()
                    }));
                    setOpportunitiesData(opportunities);

                    // Process meetings data
                    const meetings = meetingsSnapshot.docs.map((doc) => ({
                        id: doc.id,
                        ...doc.data()
                    }));
                    setMeetingsData(meetings);

                } catch (error) {
                    console.error("Error fetching leaderboard data:", error);
                } finally {
                    setLoading(false);
                }
            };

            fetchAllData();
        }, []);

        if (loading) {
            return (
                <div>
                    <Top message="Leaderboards" shadow={true} />
                    <Navbar />
                    <div style={{ padding: '40px', textAlign: 'center' }}>
                        <p>Loading leaderboards...</p>
                    </div>
                    <Cloudfooter />
                </div>
            );
        }

        return (
            <div >
                <Top message="Leaderboards" shadow={true} />
                
                <Navbar />
                <div className="leaderboards-container">
                <Table usersData={usersData} opportunitiesData={opportunitiesData} />
                <Meetingsboard usersData={usersData} meetingsData={meetingsData} />
                <SantaLeaderboard usersData={usersData} />
                </div>
                <Cloudfooter />
            </div>
        )
    }
    export default Leaderboard;