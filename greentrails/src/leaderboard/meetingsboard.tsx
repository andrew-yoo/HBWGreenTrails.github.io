import '../styles/style.css'
import '../styles/leaderboard.css'
import React, { useEffect } from 'react';
import { db } from '../base/firebaseConfig';
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";
import { Button, Container } from 'react-bootstrap';

const Meetingsboard: React.FC = () => {
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

    const [leaderboardData, setLeaderboardData] = React.useState<User[]>([]);
    const [meetings, setMeetings] = React.useState<Meeting[]>([]);
    const [isUpdating, setIsUpdating] = React.useState(false);

    useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                const querySnapshot = await getDocs(collection(db, "Users"));
                const fetchedData = querySnapshot.docs.map((d) => {
                    const data = d.data() as any;
                    return {
                        id: d.id,
                        score: data.score ?? 0,
                        Name: data.Name ?? "",
                        meetingsAttended: data.meetingsAttended ?? 0,
                    } as User;
                });

                // sort by meetingsAttended desc, fallback to score desc
                fetchedData.sort((a, b) => {
                    const ma = a.meetingsAttended ?? 0;
                    const mb = b.meetingsAttended ?? 0;
                    if (mb !== ma) return mb - ma;
                    return (b.score ?? 0) - (a.score ?? 0);
                });
                setLeaderboardData(fetchedData);

                const ms = await getDocs(collection(db, "meetings"));
                const meetingsData = ms.docs.map((d) => ({
                    id: d.id,
                    ...(d.data() as any),
                })) as Meeting[];
                setMeetings(meetingsData);
            } catch (error) {
                console.error("Error fetching leaderboard/meetings:", error);
            }
        };
        fetchLeaderboard();
    }, []);

    async function upl(event: React.MouseEvent<HTMLButtonElement>) {
        try {
            setIsUpdating(true);

            const updatedUsers: User[] = await Promise.all(
                leaderboardData.map(async (user) => {
                    // count meetings where attendees includes the user name
                    const count = meetings.reduce((acc, meeting) => {
                        const attendees = Array.isArray(meeting.attendees) ? meeting.attendees : [];
                        if (attendees.includes(user.Name)) {
                            return acc + 1;
                        }
                        return acc;
                    }, 0);

                    await updateDoc(doc(db, "Users", user.id), {
                        meetingsAttended: count,
                    });

                    return { ...user, meetingsAttended: count };
                })
            );

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
