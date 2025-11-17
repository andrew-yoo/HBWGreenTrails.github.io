import '../styles/style.css'
import React from 'react';
import Navbar from '../componets/sadnavbar';
import { Link } from 'react-router-dom';
import table from './table';
import Table from './table';
import Top from '../componets/header';

    const Leaderboard: React.FC = () => {
        return (
            <div>
                <Top message="Leaderboard" shadow={true} />
                <Navbar />
                <Table />
            </div> 
        )
    }
    export default Leaderboard;