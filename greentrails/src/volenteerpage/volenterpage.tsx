import '../styles/style.css'
import React, { useState, useEffect } from 'react';
import Navbar from'../componets/sadnavbar';
import { Regfooter } from '../componets/footer';
import Road from '../componets/road';
import Top from '../componets/header';
import Volbox from './volbox';
import Volboxall from './volboxallshown';
import { Button } from 'react-bootstrap';
import { db } from '../base/firebaseConfig';
import { collection, getDocs } from "firebase/firestore";


    const Volenterpage: React.FC = () => {
        const [past, setPast] = useState(true);
        const [opportunities, setOpportunities] = useState<any[]>([]);
        const [users, setUsers] = useState<any[]>([]);
        const [loading, setLoading] = useState(true);

        useEffect(() => {
            const fetchData = async () => {
                setLoading(true);
                try {
                    // Fetch both collections in parallel
                    const [opportunitiesSnapshot, usersSnapshot] = await Promise.all([
                        getDocs(collection(db, "opportunities")),
                        getDocs(collection(db, "Users"))
                    ]);

                    const fetchedOpportunities = opportunitiesSnapshot.docs.map((doc) => ({
                        id: doc.id,
                        ...doc.data(),
                    }));
                    setOpportunities(fetchedOpportunities);

                    const fetchedUsers = usersSnapshot.docs.map((doc) => ({
                        id: doc.id,
                        ...doc.data(),
                    }));
                    setUsers(fetchedUsers);
                } catch (error) {
                    console.error("Error fetching volunteer data:", error);
                } finally {
                    setLoading(false);
                }
            };

            fetchData();
        }, []);

        function showPast() {
            console.log('show past');
            setPast(!past);
        }

        if (loading) {
            return (
                <div id='page'>
                    <Navbar />
                    <Top message="Upcoming Volunteer Opportunities" shadow={true} />
                    <div className="box">
                        <p>Loading opportunities...</p>
                    </div>
                    <Regfooter />
                    <Road />
                </div>
            );
        }

        return (
            <div id='page'>
                <Navbar />
                <Top message="Upcoming Volunteer Opportunities" shadow={true} />
                <button id='showpastbutton' onClick={showPast}>{past ? "Show past opportunities" : "Hide past opportunities"}</button>
                {past ? <Volbox opportunities={opportunities} users={users} /> : <Volboxall opportunities={opportunities} users={users} />}
                <Regfooter />
                <Road />
            </div>
        )
    }
    
    export default Volenterpage;