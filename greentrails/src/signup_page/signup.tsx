import '../styles/style.css'
import React from 'react';
import Navbar from '../componets/sadnavbar';
import { Link } from 'react-router-dom';
import Top from '../componets/header';
import Signupgui from './signupgui';

    const Signup: React.FC = () => {
        return (
            <div>
                <Top message="Sign Up!!" shadow={true} />
                <Navbar />
                <Signupgui />
            </div> 
        )
    }
    export default Signup;