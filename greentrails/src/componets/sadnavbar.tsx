import '../styles/style.css'
import '../styles/sadnavbar.css'
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

    interface NavbarProps {
        bgcolor?: string;
        boxShadow?: boolean;
    }

    const Navbar: React.FC<NavbarProps> = ({ bgcolor = 'rgb(94, 136, 94, 0)', boxShadow = false }) => {
        const { currentUser, isAdmin } = useAuth();
        
        return (
            <div id='navbar' style={{ backgroundColor: bgcolor, boxShadow: boxShadow ? '0 4px 8px -2px #222' : 'none' }}>
                <div className='link' id='homepage'><Link className="a" to="/HBWGreentrails/">Home</Link></div>
                <div className='link' id='volunteer'><Link className="a" to="/volenterpage/">Volunteer!!</Link></div>
                <div className='link' id='leaderboard'><Link className="a" to="/leaderboard/">Leaderboards</Link></div>
                <div className='link' id='santa'><Link className="a" to="/santa/">🎆 New Year's</Link></div>
                {isAdmin && (
                    <div className='link' id='adddata'><Link className="a" to="/adddata/">Add Event</Link></div>
                )}
                <div className='link' id='Signup'>
                    <Link className="a" to="/signup/">
                        {currentUser ? `👤 ${currentUser}` : 'Sign up'}
                    </Link>
                </div>
            </div> 
        )
    }
    export default Navbar;
