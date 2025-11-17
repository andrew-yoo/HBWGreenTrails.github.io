import '../styles/style.css'
import React, { useState } from 'react';
import Navbar from'../componets/sadnavbar';
import { Regfooter } from '../componets/footer';
import Road from '../componets/road';
import Top from '../componets/header';
import Volbox from './volbox';
import Volboxall from './volboxallshown';
import { Button } from 'react-bootstrap';


    const Volenterpage: React.FC = () => {
        const [past, setPast] = useState(true);
        function showPast() {
            console.log('show past');
            setPast(!past);
        }
        return (
            <div id='page'>
                <Navbar />
                <Top message="Upcoming Volunteer Opportunities" shadow={true} />
                <button id='showpastbutton' onClick={showPast}>{past ? "Show past opportunities" : "Hide past opportunities"}</button>
                {past ? <Volbox /> : <Volboxall />}
                <Regfooter />
                <Road />
            </div>
        )
    }
    
    export default Volenterpage;