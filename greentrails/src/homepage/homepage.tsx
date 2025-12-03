import '../styles/style.css'
import React from 'react';
import Top from '../componets/header';
import Treefooter from '../componets/footer';
import Navbar from'../componets/sadnavbar';
import groupmeImage from '../pictures/groupme.png';
import { MeetingsList } from './meetings';

const Homepage: React.FC = () => {  
        return (
                <div style={{backgroundColor: "rgb(17, 69, 59)"}}>
                    <Navbar bgcolor='#00000000' boxShadow={false} />
                    <div className="header">
                    <h1 className='first'>HBW Green Trails Club</h1>
                    </div>
                    <div className='importantinfo'>
                    <div className="groupme">
                    <a href="https://groupme.com/join_group/103922254/4v3j7TI7"><img src={groupmeImage} alt="Join our GroupMe!" width="200px" /></a>
                    <p>Click here to join our GroupMe for updates on meetings and events!!</p>
                    </div>
                    <div className='nextmeeting'>
                        <h2>Upcoming Meetings:</h2>

                        <MeetingsList nextMeetingDate={new Date('2025-12-04T12:35:00')} />
                        
                    </div>
                    </div>
                </div>
            // <div className="App-header">
            //     
            //     <Top message="HBW Green Trails" />
            //     <Treefooter />
            // </div>
        )
    }
    
    export default Homepage;