# Admin Access Setup Guide

## Overview
This application now supports admin users who have access to the "Add Event" page for creating new volunteer opportunities.

## Setting Up Admin Users in Firebase

To grant admin access to a user, you need to update their user document in the Firebase Firestore database.

### Steps:

1. Go to your Firebase Console: https://console.firebase.google.com/
2. Select your project (greentrails-d6c2d)
3. Navigate to Firestore Database in the left sidebar
4. Find the "Users" collection
5. Locate the user document you want to make an admin (the document ID is the username)
6. Click on the document to edit it
7. Add or update the `isAdmin` field:
   - Field name: `isAdmin`
   - Field type: `boolean`
   - Value: `true`
8. Save the changes

### User Document Structure

After setting up an admin user, their document should look like this:

```
Users/{username}
  ├── Name: "username"
  ├── score: 0
  ├── santasPopped: 0
  ├── isAdmin: true  ← This field grants admin access
  └── meetingsAttended: 0 (optional)
```

### For Regular Users

Regular users will have `isAdmin: false` or the field may not exist (defaults to false).

## How Admin Access Works

1. When a user logs in, the application checks the `isAdmin` field in their Firebase user document
2. If `isAdmin` is `true`, the user will see an "Add Event" link in the navigation bar
3. Only admin users can access the `/adddata` page
4. Non-admin users who try to access `/adddata` directly will be redirected to the homepage with an access denied message

## Testing Admin Access

1. Create or login with a test user account
2. Verify you don't see the "Add Event" link in the navbar
3. Set `isAdmin: true` for that user in Firebase Firestore
4. Logout and login again
5. You should now see the "Add Event" link in the navbar
6. Click the link to access the event creation page

## Notes

- Admin status is checked at login time and stored in localStorage
- Users need to logout and login again after their admin status is changed in Firebase
- The `isAdmin` field is automatically set to `false` for all new user signups
