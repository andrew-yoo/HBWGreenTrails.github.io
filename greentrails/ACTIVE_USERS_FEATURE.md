# Active Users Feature

## Overview
This feature displays a list of users who are currently active on the HBW Green Trails website. The implementation prioritizes minimal database requests while still providing useful real-time presence information.

## How It Works

### User Presence Tracking
When a user logs in or is already logged in (via localStorage), the system automatically tracks their presence:

1. **Initial Update**: When a user logs in, their `lastActive` timestamp is immediately updated in Firestore
2. **Periodic Updates**: While the user remains logged in, their `lastActive` timestamp is updated every 5 minutes
3. **Storage**: The timestamp is stored in the user's document in the `Users` collection as a Firestore Timestamp

### Active Users Display
The ActiveUsers component shows who is currently online:

1. **Fetching**: Queries the Users collection every 2 minutes
2. **Filtering**: Shows users whose `lastActive` timestamp is within the last 10 minutes
3. **Display**: Shows usernames with a pulsing green indicator, sorted by most recently active
4. **Location**: Appears on the Leaderboards page alongside other leaderboards

## Database Impact (Minimal)

### Write Operations
- **Per logged-in user**: 1 write every 5 minutes (12 writes/hour per active user)
- **Cost**: Minimal - only updates a single timestamp field

### Read Operations
- **Per viewer**: 1 read of Users collection every 2 minutes
- **Note**: The leaderboard already reads all users, so this adds no additional cost when viewing the leaderboard

### No Real-Time Listeners
- **Benefit**: No expensive real-time listeners that would continuously consume resources
- **Trade-off**: Updates happen every 2 minutes instead of instantly, which is acceptable for presence information

## User Experience

### What Users See
- **🟢 Active Now** section on the Leaderboards page
- List of currently active users with pulsing green indicators
- Count of total users online
- "No users active right now" message when no one is online

### Design
- Clean card-based UI that matches the site's aesthetic
- Responsive design that works on mobile devices
- Pulsing animation for the active indicator
- Sorted by most recently active

## Technical Details

### Files Modified
1. **src/context/AuthContext.tsx**: Added presence tracking logic
2. **src/leaderboard/leaderboard.tsx**: Added ActiveUsers component to page
3. **src/componets/ActiveUsers.tsx**: New component for displaying active users
4. **src/styles/activeusers.css**: Styling for the active users component

### Database Schema Addition
New field in Users collection documents:
- `lastActive`: Firestore Timestamp - updated every 5 minutes while user is logged in

### Configuration
- **Active threshold**: 10 minutes (users shown if active within last 10 minutes)
- **Presence update interval**: 5 minutes (how often timestamps are updated)
- **Display refresh interval**: 2 minutes (how often the list refreshes)

These values can be adjusted in the code if needed to balance freshness vs. database costs.
