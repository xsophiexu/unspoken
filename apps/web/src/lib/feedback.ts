import { createFeedbackClient, type FeedbackClient } from '@unspoken/firebase';
import { firebaseAdapter } from '@unspoken/firebase/sdk';

import { config } from './config';

// Send feedback goes to Firestore, or nowhere when the NEXT_PUBLIC_FIREBASE_* values are not all
// set (the site still works; Send feedback shows its inline error). Firebase starts on first send.
export const feedbackClient: FeedbackClient | null = config.firebase ? createFeedbackClient(firebaseAdapter(config.firebase)) : null;
