import '../styles/style.css'
import React from 'react';
import Navbar from '../componets/sadnavbar';
import { Link } from 'react-router-dom';
import table from './table';
import Table from './table';
import Top from '../componets/header';
import Meetingsboard from './meetingsboard';
import {Cloudfooter} from '../componets/footer';

    const Leaderboard: React.FC = () => {
        return (
            <div >
                <Top message="Leaderboards" shadow={true} />
                <Navbar />
                <div style={{ display: 'flex' , flexDirection:'row'}}>
                <Table />
                <Meetingsboard />
                </div>
                <Cloudfooter />
            </div>
        )
    }
    export default Leaderboard;