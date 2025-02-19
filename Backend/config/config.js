import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(dirname(__dirname), '.env') });

// Export configuration
export const config = {
    googleApiKey: process.env.GOOGLE_API_KEY,
    port: process.env.PORT || 3000,
};

// Validate required environment variables
if (!config.googleApiKey) {
    throw new Error('GOOGLE_API_KEY is required but not set in environment variables');
}