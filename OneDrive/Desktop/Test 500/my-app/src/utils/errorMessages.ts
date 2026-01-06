// Utility to convert technical error messages to user-friendly ones

export function getUserFriendlyError(error: any): { title: string; message: string } {
    const errorMessage = error?.message || error?.toString() || '';
    const errorCode = error?.code || '';

    // Firebase Auth Errors
    if (errorCode === 'auth/invalid-email' || errorMessage.includes('invalid-email')) {
        return { title: 'Invalid Email', message: 'Please enter a valid email address.' };
    }

    if (errorCode === 'auth/user-not-found' || errorMessage.includes('user-not-found')) {
        return { title: 'Account Not Found', message: 'No account exists with this email.' };
    }

    if (errorCode === 'auth/wrong-password' || errorMessage.includes('wrong-password') || errorMessage.includes('Invalid email or PIN')) {
        return { title: 'Incorrect Details', message: 'The email or PIN you entered is incorrect.' };
    }

    if (errorCode === 'auth/email-already-in-use' || errorMessage.includes('email-already-in-use')) {
        return { title: 'Email Already Used', message: 'An account with this email already exists.' };
    }

    if (errorCode === 'auth/weak-password' || errorMessage.includes('weak-password')) {
        return { title: 'Weak Password', message: 'Please choose a stronger password.' };
    }

    if (errorCode === 'auth/too-many-requests' || errorMessage.includes('too-many-requests')) {
        return { title: 'Too Many Attempts', message: 'Too many failed attempts. Please try again later.' };
    }

    // Firebase Firestore Errors
    if (errorMessage.includes('permission-denied') || errorMessage.includes('PERMISSION_DENIED')) {
        return { title: 'Access Denied', message: 'You don\'t have permission to do this.' };
    }

    if (errorMessage.includes('not-found') || errorMessage.includes('NOT_FOUND')) {
        return { title: 'Not Found', message: 'The item you\'re looking for could not be found.' };
    }

    if (errorMessage.includes('already-exists') || errorMessage.includes('ALREADY_EXISTS')) {
        return { title: 'Already Exists', message: 'This item already exists.' };
    }

    if (errorMessage.includes('unavailable') || errorMessage.includes('UNAVAILABLE')) {
        return { title: 'Service Unavailable', message: 'The service is temporarily unavailable. Please try again.' };
    }

    // Network Errors
    if (errorMessage.includes('network') || errorMessage.includes('Network') || errorMessage.includes('offline')) {
        return { title: 'Connection Error', message: 'Please check your internet connection and try again.' };
    }

    if (errorMessage.includes('timeout') || errorMessage.includes('TIMEOUT')) {
        return { title: 'Request Timeout', message: 'The request took too long. Please try again.' };
    }

    // Validation Errors
    if (errorMessage.includes('required') || errorMessage.includes('Required')) {
        return { title: 'Missing Information', message: 'Please fill in all required fields.' };
    }

    if (errorMessage.includes('invalid') || errorMessage.includes('Invalid')) {
        return { title: 'Invalid Input', message: 'Please check your input and try again.' };
    }

    // Default fallback
    return {
        title: 'Something Went Wrong',
        message: 'An unexpected error occurred. Please try again.'
    };
}

// Shorthand for common scenarios
export const ErrorMessages = {
    // Auth
    LOGIN_FAILED: { title: 'Login Failed', message: 'The email or PIN you entered is incorrect.' },
    REGISTRATION_FAILED: { title: 'Registration Failed', message: 'Could not create your account. Please try again.' },
    LOGOUT_FAILED: { title: 'Logout Failed', message: 'Could not log you out. Please try again.' },

    // Network
    NO_CONNECTION: { title: 'No Connection', message: 'Please check your internet connection and try again.' },
    TIMEOUT: { title: 'Request Timeout', message: 'This is taking longer than expected. Please try again.' },

    // Data
    LOAD_FAILED: { title: 'Loading Failed', message: 'Could not load the data. Please try again.' },
    SAVE_FAILED: { title: 'Save Failed', message: 'Could not save your changes. Please try again.' },
    DELETE_FAILED: { title: 'Delete Failed', message: 'Could not delete this item. Please try again.' },

    // Messaging
    SEND_MESSAGE_FAILED: { title: 'Send Failed', message: 'Could not send your message. Please try again.' },
    LOAD_MESSAGES_FAILED: { title: 'Loading Failed', message: 'Could not load messages. Please try again.' },

    // Posts & Replies
    POST_NOT_FOUND: { title: 'Post Not Found', message: 'This post could not be found. It may have been deleted.' },
    CREATE_POST_FAILED: { title: 'Post Failed', message: 'Could not create your post. Please try again.' },
    CREATE_REPLY_FAILED: { title: 'Reply Failed', message: 'Could not post your reply. Please try again.' },
    DELETE_POST_FAILED: { title: 'Delete Failed', message: 'Could not delete this post. Please try again.' },
    DELETE_REPLY_FAILED: { title: 'Delete Failed', message: 'Could not delete this reply. Please try again.' },
    
    // Profile
    UPDATE_PROFILE_FAILED: { title: 'Update Failed', message: 'Could not update your profile. Please try again.' },
    USERNAME_TAKEN: { title: 'Username Taken', message: 'This username is already in use. Please choose another.' },

    // Generic
    UNKNOWN_ERROR: { title: 'Something Went Wrong', message: 'An unexpected error occurred. Please try again.' },
};
