import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import mainRoutes from './routes/index.js';

// Get the directory path
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configure dotenv with the absolute path to .env
dotenv.config({ path: join(__dirname, '.env') });

// Verify environment variables are loaded
console.log('Environment variables loaded:', {
  GOOGLE_API_KEY_EXISTS: !!process.env.GOOGLE_API_KEY,
  ENV_PATH: join(__dirname, '.env')
});

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
  },
});

const PORT = 3000;

app.use(express.json());
app.use(cors({ origin: true }));

app.set('view engine', 'ejs');
app.use(express.static('public'));

app.use('/', mainRoutes);

// Med-Connect
const users = {}; // to handle the users
io.on('connection', socket => {
  socket.on('new-user-joined', name => {
    console.log('New User ', name)
    users[socket.id] = name;
    socket.broadcast.emit('user-joined', name);
  });
  socket.on('send', message => {
    socket.broadcast.emit('receive', {
      message: message,
      name: users[socket.id]
    })
  });
  socket.on('disconnect', message => {
    socket.broadcast.emit('left', {
      message: message,
      name: users[socket.id]
    });
    delete users[socket.id];
  });
});

server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});