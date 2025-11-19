import './styles/style.css';
import React from 'react';
import Homepage from './homepage/homepage';
import Volenterpage from './volenteerpage/volenterpage';
import { HashRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Adddatapage from './adddata/adddatapage';
import Leaderboard from './leaderboard/leaderboard';
import Signup from './signup_page/signup';
import Icon from './componets/icon'
import Snow from './componets/snow';

const App: React.FC = () => {
    return (
        <div className="App">
            <Icon />
            <Snow />
            <Router>
                <Routes>
                    {/* Redirect any unknown path to homepage */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                    {/* Main routes */}
                    <Route path="/" element={<Homepage />} />
                    <Route path="/greentrails/*" element={<Homepage />} />
                    <Route path="/volenterpage/*" element={<Volenterpage />} />
                    <Route path="/adddata/*" element={<Adddatapage />} />
                    <Route path="/leaderboard/*" element={<Leaderboard />} />
                    <Route path="/signup/*" element={<Signup />} /> 
                </Routes>
            </Router>
        </div>
    );
};

export default App;
