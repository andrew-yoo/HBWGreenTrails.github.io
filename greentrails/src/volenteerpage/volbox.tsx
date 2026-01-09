import React, { useState, useEffect } from "react"; 
import "../styles/style.css"; 
import "../styles/volenterpage.css"; 
import { db } from "../base/firebaseConfig"; 
import { collection, getDocs, updateDoc, doc, arrayUnion } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";


export interface Opportunity {
  id: string;
  name: string;
  description: string;
  date: string; 
  link: string;
  signups: string[];
}

interface VolboxProps {
  opportunities: any[];
  users: any[];
}

const Volbox: React.FC<VolboxProps> = ({ opportunities: allOpportunities, users: allUsers }) => {
    
    const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
    const [allopportunities, setAllopportunities] = useState<Opportunity[]>([]);
    const [loading, setLoading] = useState(false); 
    const navigate = useNavigate();
    const [Users, setUsers] = React.useState<any[]>([]);
    const { currentUser } = useAuth();

    useEffect(() => {
        // Use provided data instead of fetching
        setUsers(allUsers);
        const currentDate = new Date();
        setOpportunities(allOpportunities.filter(event => new Date(event.date) > currentDate).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())); 
    }, [allOpportunities, allUsers]);

          if (opportunities.length === 0) {
            return(
              <>
            <div className="box">
             <h1>No upcoming volunteer opportunities available we will be adding more soon.</h1>
            </div>
            <div className="trunk"></div>
          </>);
          }
          
          function addName(event: React.MouseEvent<HTMLButtonElement>) {
            let target = event.currentTarget as HTMLButtonElement;
            const curdoc = doc(db, "opportunities", target.id);
            
            // Use currentUser if logged in, otherwise check for input field
            let userName = currentUser;
            if (!userName) {
              const name = document.getElementById(target.id+'i') as HTMLInputElement;
              if(name && name.value){
                userName = name.value;
              }
            }
            
            console.log(Users);
            if(!userName || userName === ""){
              return;
            }
            
            if (userName === "editcode0"){
              console.log("edit code entered");
              navigate('/adddata');
              return;
            }
            const opportunity = opportunities.find((opportunity) => opportunity.id === target.id);
            if(opportunity && new Date(opportunity.date) < new Date()){
              console.log("Event has already passed");
              alert("This event has already passed and is no longer accepting sign-ups.");
              return;
            }

            if (!Users.some(user => user.Name === userName)){
              console.log("User not found in the list");
              alert("Your account was not found. Please try logging out and logging back in.");
              return;
            }
            try{
              updateDoc(curdoc, {
                signups: arrayUnion(userName),
            });
            document.getElementById(target.id+'d')!.textContent = "So far " + opportunities.find((opportunity) => opportunity.id === target.id)!.signups.join(", ") + ", " + userName + " will be going";
            alert("Successfully signed up for this opportunity!");
            } catch (error) {
              console.error("Error adding name to opportunity:", error);
              alert("An error occurred while signing up. Please try again.");
            }
          };

          
          
  return (
  <div>
    {opportunities.map((opportunity) => (
      <div>
      <div className="box" key={opportunity.id}>
        <h1>{opportunity.name}</h1>
        <p className="date">when: {new Date(opportunity.date).toLocaleDateString()}</p>
        <p>{opportunity.description}</p>
        
        <h4> please sign up with the host and submit your name to let us know you will be going</h4>
        <a
          href={opportunity.link}
          target="_blank"
          rel="noopener noreferrer"
        >
          Click here to sign up with the host
        </a>
        <p></p>
        <div>
            <label>Sign up here with green trails:</label>
            <p></p>
            {currentUser ? (
              <>
                <button 
                  type="submit" 
                  id={opportunity.id} 
                  className="volunteer-signup-btn" 
                  onClick={(e) => addName(e)}
                > 
                  🌲 Sign Up for This Event
                </button>
              </>
            ) : (
              <p style={{ color: '#d32f2f', fontWeight: 'bold' }}>
                Please <a href="#/signup/" style={{ color: '#4CAF50', textDecoration: 'underline' }}>sign up or login</a> to register for this opportunity.
              </p>
            )}
            <p id={opportunity.id + "d"}>So far {opportunity.signups.join(", ")} will be going</p>
          </div>
      </div>
      <div className="trunk"></div>
      </div>
    ))}
    
  </div>
    );
}; 

export default Volbox;
