import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin
admin.initializeApp();

// Import cloud functions
export { onUserDeleted } from './onUserDeleted';
export { sendCommunityNotification } from './sendCommunityNotification';

// You can add more cloud functions here as needed
