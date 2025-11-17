import React, { useState, useEffect } from "react"; 
import "../styles/style.css"; 
import "../styles/volenterpage.css"; 
import { db } from "../base/firebaseConfig"; 
import { collection, getDocs, updateDoc, doc, arrayUnion } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";


export interface Opportunity {
  id: string;
  name: string;
  description: string;
  date: string; 
  link: string;
  signups: string[];
}

const Volbox: React.FC = () => {
    
    const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
    const [allopportunities, setAllopportunities] = useState<Opportunity[]>([]);
    const [loading, setLoading] = useState(true); 
    const navigate = useNavigate();
    const [Users, setUsers] = React.useState<any[]>([]);

    useEffect(() => {
        const fetchOpportunities = async () => {
          setLoading(true); 
          try {
            const querySnapshot = await getDocs(collection(db, "opportunities")); 
            const fetchedData = querySnapshot.docs.map((doc) => ({
              id: doc.id, 
              ...doc.data(), 
            }));
            
            const UserQ = await getDocs(collection(db, "Users")); 
            const UserF = UserQ.docs.map((doc) => ({
              id: doc.id, 
              ...doc.data(), 
            }));
            console.log(UserF);
            setUsers(UserF);
            const currentDate = new Date();
            // setOpportunities(fetchedData);
            setOpportunities(fetchedData.filter(event => new Date(event.date) > currentDate).sort((a, b) => new Date(a.date) - new Date(b.date))); 
          } catch (error) {
            console.error("Error fetching opportunities:", error); 
          }
          setLoading(false); 
        };
        fetchOpportunities();

        
    }, []);

        if (loading) {
            return (
            <div className="box">
            <p>Loading opportunities...</p>
            </div>);
          }
          
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
            const name = document.getElementById(target.id+'i') as HTMLInputElement;
            console.log(Users);
            if(name === null || name.value === ""){
              return;
            }
            
            if (name.value === "editcode0"){
              console.log("edit code entered");
              navigate('/adddata');
              return;
            }
            const opportunity = opportunities.find((opportunity) => opportunity.id === target.id);
            if(opportunity && new Date(opportunity.date) < new Date()){
              console.log("Event has already passed");
              return;
            }

            if (!Users.some(user => user.Name === name.value)){
              console.log("User not found in the list");
              name.placeholder = "Please use signup";
              name.value = "";
              return;
            }
            console.log(document.getElementById(target.id+'i'));
            try{
              updateDoc(curdoc, {
                signups: arrayUnion(name.value),
            });
            document.getElementById(target.id+'d')!.textContent = "So far " + opportunities.find((opportunity) => opportunity.id === target.id)!.signups.join(", ") + ", " + name.value + " will be going";
            } catch (error) {
              console.error("Error adding name to opportunity:", error);
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
            {/* <input className="nameinput" type="text" placeholder="Enter name here" id={opportunity.id + "i"}/> */}
            <input className="nameinput" list={`dropdown-${opportunity.id}`} id={opportunity.id + "i"} name="options" />
              <datalist id={`dropdown-${opportunity.id}`}>
                {Users.map((user) => (
                  <option key={user.id} value={user.Name}>{user.Name}</option>
                ))}
              </datalist>
            <button  type="submit" id={opportunity.id} className="button nameinput" onClick={(e) => addName(e)}> 
              Add Name
            </button>
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
