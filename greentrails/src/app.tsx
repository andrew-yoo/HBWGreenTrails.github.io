import './styles/style.css';
import React from 'react';
import Homepage from './homepage/homepage';
import Volenterpage from './volenteerpage/volenterpage';
import { HashRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Adddatapage from './adddata/adddatapage';
import Leaderboard from './leaderboard/leaderboard';
import Signup from './signup_page/signup';
import SantaUpgrades from './santa/santaupgrades';
import Icon from './componets/icon'
import Snow from './componets/snow';
import TabAlarm from './componets/tabAlarm';
import { AuthProvider } from './context/AuthContext';

const App: React.FC = () => {
    return (
        <AuthProvider>
            <div className="App">
                <Icon />
                <Snow />
                <TabAlarm />
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
                        <Route path="/santa/*" element={<SantaUpgrades />} />
                    </Routes>
                </Router>
            </div>
        </AuthProvider>
    );
};

export default App;
