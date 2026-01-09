import '../styles/style.css'
import '../styles/leaderboard.css'
import React, { useEffect } from 'react';
import { db } from '../base/firebaseConfig';
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";
import { Button, Container } from 'react-bootstrap';

interface User {
    id: string;
    score: number;
    Name: string;
    meetingsAttended?: number;
}

interface Meeting {
    id: string;
    attendees?: string[];
    [key: string]: any;
}

interface MeetingsboardProps {
    usersData: any[];
    meetingsData: any[];
}

const Meetingsboard: React.FC<MeetingsboardProps> = ({ usersData, meetingsData }) => {
    const [leaderboardData, setLeaderboardData] = React.useState<User[]>([]);
    const [meetings, setMeetings] = React.useState<Meeting[]>([]);
    const [isUpdating, setIsUpdating] = React.useState(false);

    useEffect(() => {
        // Use provided data instead of fetching
        const fetchedData = usersData.map((user) => ({
            id: user.id,
            score: user.score ?? 0,
            Name: user.Name ?? "",
            meetingsAttended: user.meetingsAttended ?? 0,
        })) as User[];

        // sort by meetingsAttended desc, fallback to score desc
        fetchedData.sort((a, b) => {
            const ma = a.meetingsAttended ?? 0;
            const mb = b.meetingsAttended ?? 0;
            if (mb !== ma) return mb - ma;
            return (b.score ?? 0) - (a.score ?? 0);
        });
        setLeaderboardData(fetchedData);

        const meetingsData2 = meetingsData.map((meeting) => ({
            id: meeting.id,
            ...meeting,
        })) as Meeting[];
        setMeetings(meetingsData2);
    }, [usersData, meetingsData]);

    async function upl(event: React.MouseEvent<HTMLButtonElement>) {
        try {
            setIsUpdating(true);

            // Calculate counts for all users first
            const userUpdates = leaderboardData.map((user) => {
                // count meetings where attendees includes the user name
                const count = meetings.reduce((acc, meeting) => {
                    const attendees = Array.isArray(meeting.attendees) ? meeting.attendees : [];
                    if (attendees.includes(user.Name)) {
                        return acc + 1;
                    }
                    return acc;
                }, 0);

                return { user, count };
            });

            // Batch update all users with Promise.all
            await Promise.all(
                userUpdates.map(({ user, count }) =>
                    updateDoc(doc(db, "Users", user.id), {
                        meetingsAttended: count,
                    })
                )
            );

            // Update local state with new counts
            const updatedUsers = userUpdates.map(({ user, count }) => ({
                ...user,
                meetingsAttended: count
            }));

            // sort updated users by meetingsAttended desc, fallback to score desc
            updatedUsers.sort((a, b) => {
                const ma = a.meetingsAttended ?? 0;
                const mb = b.meetingsAttended ?? 0;
                if (mb !== ma) return mb - ma;
                return (b.score ?? 0) - (a.score ?? 0);
            });

            setLeaderboardData(updatedUsers);

            console.log("Done updating meetingsAttended for all users");
        } catch (err) {
            console.error("Error updating meetingsAttended:", err);
        } finally {
            setIsUpdating(false);
        }
    }

    return (
        <div id='events-table'>
            <h3 id='events-title'>Meetings Attended (after 11/12)</h3>
            <div id='events-leaderboard' className='boardcon'>
                {leaderboardData.map((user, index) => (
                    <div className='lbentrie' key={user.id}>
                        <p className='place'>{index + 1}.</p>
                        <p className='username'>{user.Name}</p>
                        <p className='userscore'>{user.meetingsAttended ?? 0}</p>
                    </div>
                ))}
                <button onClick={(e) => upl(e)} id="" disabled={isUpdating}>
                    {isUpdating ? 'Updating…' : 'Update meetings attendance'}
                </button>
            </div>
        </div>
    )
}
export default Meetingsboard;
