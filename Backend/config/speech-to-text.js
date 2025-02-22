import { SpeechClient } from '@google-cloud/speech';
import dotenv from 'dotenv';

dotenv.config();

const speechClient = new SpeechClient({
    credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n')
    },
    projectId: process.env.GOOGLE_PROJECT_ID
});

export default speechClient;