import React from 'react';

interface Meeting {
    date: Date;
    id: number;
}

export function getNextThreeMeetings(startDate: Date): Meeting[] {
    const meetings: Meeting[] = [];
    // Find the next meeting date that hasn't passed
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day for comparison
    let currentDate = new Date(startDate);
    currentDate.setHours(0, 0, 0, 0);

    // If the start date has already passed, find the next future meeting
    while (currentDate < today) {
        currentDate.setDate(currentDate.getDate() + 14);
    }

    startDate = currentDate;
    for (let i = 0; i < 3; i++) {
        const meetingDate = new Date(startDate);
        meetingDate.setDate(startDate.getDate() + (i * 14)); // Add 14 days for each meeting (every other week)
        
        meetings.push({
            date: meetingDate,
            id: i + 1
        });
    }
    
    return meetings;
}

export function MeetingsList({ nextMeetingDate }: { nextMeetingDate: Date }) {
    const meetings = getNextThreeMeetings(nextMeetingDate);
    
    return (
        <div>
            {meetings.map((meeting) => (
                <p key={meeting.id}>
                    {meeting.date.toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                    })}{' '}
                    in Hang's room (510) at lunch!
                </p>
            ))}
        </div>
    );
}
