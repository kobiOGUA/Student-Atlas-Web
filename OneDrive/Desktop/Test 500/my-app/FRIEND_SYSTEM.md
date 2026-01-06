# Friend System Implementation

## Overview
The friend system allows users to send friend requests, accept/reject them, and view their friends.

## Features
1.  **Send Friend Request**: Users can send requests from another user's profile.
2.  **Accept/Reject Request**: Users can accept or reject pending requests.
3.  **Remove Friend**: Users can unfriend existing friends.
4.  **Friend Status**: The profile button dynamically changes based on status:
    *   `Add Friend` (None)
    *   `Sent` (Pending Sent)
    *   `Accept` (Pending Received)
    *   `Unfriend` (Friends)

## Data Structure
### FriendRequest Collection
*   `id`: string (auto-generated)
*   `fromUserId`: string
*   `toUserId`: string
*   `status`: 'pending' | 'accepted' | 'rejected' | 'blocked'
*   `timestamp`: number

### User Collection Updates
*   `friends`: string[] (Array of user IDs)
*   `friendRequests`: string[] (Optional, denormalized list of request IDs)

## Services
*   `src/services/friendService.ts`: Handles all Firestore operations for friends.

## UI Components
*   `UserProfileScreen.tsx`: Displays the friend action button and handles the logic.

## Future Improvements
*   **Friends List Screen**: A dedicated screen to view all friends.
*   **Notifications**: Push notifications for new friend requests.
*   **Blocking**: Ability to block users.
