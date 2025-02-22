/**
 * Main Server Configuration File
 * This file sets up the Express server, Socket.IO, and Google Cloud Speech-to-Text
 * for the CareAnywhere healthcare platform.
 */

import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import mainRoutes from './routes/index.js';
import connectDB from './config/database.js';
import bodyParser from 'body-parser';
import ss from 'socket.io-stream';
import speechClient from './config/speech-to-text.js';

// Initialize directory paths for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '.env') });

// Verify environment variables are loaded
console.log('Environment variables loaded:', {
  GOOGLE_API_KEY_EXISTS: !!process.env.GOOGLE_API_KEY,
  ENV_PATH: join(__dirname, '.env')
});

// Connect to MongoDB
connectDB();

// Speech recognition configuration
const recognitionConfig = {
  encoding: 'WEBM_OPUS',
  sampleRateHertz: 48000,
  languageCode: 'en-US',
  enableAutomaticPunctuation: true,
  model: 'default'
};

// Initialize Express app and create HTTP server
const app = express();
const server = createServer(app);

// Configure Socket.IO with proper CORS and error handling
const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production'
      ? 'https://careanywhere.onrender.com'
      : 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  reconnection: true,
  reconnectionAttempts: 5
});

// Error handling for Socket.IO
io.engine.on('connection_error', (err) => {
  console.log('Connection error:', err);
});

const PORT = process.env.PORT || 3000;

// Middleware setup
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({ origin: true }));
app.use(express.static('public'));

// View engine setup
app.set('view engine', 'ejs');

// Routes
app.use('/', mainRoutes);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', socketIO: io.engine.clientsCount });
});

// Store room and user information
const rooms = {};
const users = {};

/**
 * Socket.IO Event Handlers
 * Manages real-time communication for video consultations
 */
io.on('connection', socket => {
  let recognizeStream = null;

  // Handle user joining a room
  socket.on('join-room', ({ name, room }) => {
    console.log('New User', name, 'joining room', room);

    // Store user information
    users[socket.id] = { name, room };
    socket.join(room);

    // Initialize room if it doesn't exist
    if (!rooms[room]) {
      rooms[room] = {
        users: [],
        initiator: socket.id
      };
    }
    rooms[room].users.push(socket.id);

    // Notify others in room
    socket.broadcast.to(room).emit('user-joined', {
      name,
      isInitiator: rooms[room].initiator === socket.id
    });

    // Tell the joining user if they're the initiator
    socket.emit('room-joined', {
      isInitiator: rooms[room].initiator === socket.id,
      users: rooms[room].users.length
    });
  });

  // Handle WebRTC signaling
  socket.on('signal', ({ data, room }) => {
    console.log('Signal received for room:', room);
    socket.broadcast.to(room).emit('signal', data);
  });

  // Handle chat messages
  socket.on('send', ({ message, room }) => {
    const user = users[socket.id];
    if (user) {
      socket.broadcast.to(room).emit('receive', {
        message,
        name: user.name
      });
    }
  });

  // Handle audio streaming for transcription
  ss(socket).on('audio-stream', (stream, data) => {
    const room = users[socket.id]?.room;
    if (!room) return;

    let recognizeStream = null;

    stream.on('data', chunk => {
      if (!recognizeStream) {
        recognizeStream = speechClient
          .streamingRecognize(request)
          .on('error', console.error)
          .on('data', data => {
            const transcript = data.results[0].alternatives[0].transcript;
            socket.emit('transcription', {
              text: transcript,
              isFinal: data.results[0].isFinal
            });
          });
      }
      recognizeStream.write(chunk);
    });

    stream.on('end', () => {
      if (recognizeStream) {
        recognizeStream.end();
      }
    });
  });

  /**
   * Speech-to-Text Transcription Handlers
   */
  socket.on('startTranscription', () => {
    try {
      // Close existing stream if any
      if (recognizeStream) {
        recognizeStream.end();
        recognizeStream = null;
      }

      const request = {
        config: {
          encoding: 'WEBM_OPUS',
          sampleRateHertz: 48000,
          languageCode: 'en-US',
          enableAutomaticPunctuation: true
        },
        interimResults: true
      };

      recognizeStream = speechClient
        .streamingRecognize(request)
        .on('error', (error) => {
          console.error('Transcription error:', error);
          socket.emit('transcriptionError', error.message);
          if (recognizeStream) {
            recognizeStream.end();
            recognizeStream = null;
          }
        })
        .on('data', (data) => {
          const result = data.results[0];
          if (result && result.alternatives[0]) {
            socket.emit('transcription', {
              text: result.alternatives[0].transcript,
              isFinal: result.isFinal
            });
          }
        });

    } catch (error) {
      console.error('Error starting transcription:', error);
      socket.emit('transcriptionError', error.message);
    }
  });

  // Process audio data
  socket.on('audioData', (data) => {
    if (recognizeStream && !recognizeStream.destroyed) {
      try {
        recognizeStream.write(data);
      } catch (error) {
        console.error('Error writing to stream:', error);
        socket.emit('transcriptionError', error.message);
      }
    }
  });

  // End transcription session
  socket.on('endTranscription', () => {
    if (recognizeStream) {
      recognizeStream.end();
      recognizeStream = null;
    }
  });

  // Handle disconnections
  socket.on('disconnect', () => {
    const user = users[socket.id];
    if (user) {
      const room = rooms[user.room];
      if (room) {
        room.users = room.users.filter(id => id !== socket.id);
        if (room.users.length === 0) {
          delete rooms[user.room];
        } else if (room.initiator === socket.id) {
          // Assign new initiator if the initiator left
          room.initiator = room.users[0];
          socket.broadcast.to(user.room).emit('new-initiator', {
            id: room.initiator
          });
        }
      }
      socket.broadcast.to(user.room).emit('user-left', {
        name: user.name
      });
      delete users[socket.id];
    }
    if (recognizeStream) {
      recognizeStream.end();
      recognizeStream = null;
    }
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

/**
 * Error Handling
 */
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  // Prevent server crash but log the error
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  // Log error and gracefully shutdown
  process.exit(1);
});