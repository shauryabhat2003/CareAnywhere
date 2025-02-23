// public/scripts/medConnect.js
document.addEventListener('DOMContentLoaded', () => {
    const socket = io({
        transports: ['websocket', 'polling'],
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 60000,
    });

    let peer = null;
    let localStream = null;
    let isInitiator = false;
    let mediaRecorder = null;
    let audioContext = null;
    let audioStream = null;
    let recognizeStream = null;

    // DOM Elements
    const localVideo = document.getElementById('localVideo');
    const remoteVideo = document.getElementById('remoteVideo');
    const startCallBtn = document.getElementById('startCall');
    const endCallBtn = document.getElementById('endCall');
    const messageForm = document.getElementById('messageForm');
    const messageInput = document.getElementById('messageInput');
    const messagesDiv = document.getElementById('messages');
    const roomIdDisplay = document.getElementById('roomId');
    const connectionStatus = document.getElementById('connectionStatus');
    const toggleAudioBtn = document.getElementById('toggleAudio');
    const toggleVideoBtn = document.getElementById('toggleVideo');

    // Get room from URL or create new one
    const urlParams = new URLSearchParams(window.location.search);
    const currentRoom = urlParams.get('room') || generateRoomId();
    roomIdDisplay.textContent = currentRoom;

    // Update URL if needed
    if (!urlParams.get('room')) {
        const newUrl = `${window.location.pathname}?room=${currentRoom}`;
        window.history.pushState({ room: currentRoom }, '', newUrl);
    }

    function generateRoomId() {
        return Math.random().toString(36).substr(2, 9);
    }

    async function startCall() {
        try {
            localStream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true
            });

            localVideo.srcObject = localStream;
            console.log('Got media stream');

            await startTranscription();
            createPeerConnection();

            startCallBtn.disabled = true;
            endCallBtn.disabled = false;
            updateStatus('Connecting to peer...');
        } catch (err) {
            console.error('Failed to get media devices:', err);
            updateStatus('Camera/Microphone access denied');
            alert('Please allow camera and microphone access.');
        }
    }

    function createPeerConnection() {
        if (peer) {
            peer.destroy();
        }

        // Initialize peer with a random ID
        const peerId = generateRoomId();

        peer = new Peer(peerId, {
            host: '0.peerjs.com', // Using public PeerJS server
            port: 443,
            secure: true,
            debug: 3,
            config: {
                iceServers: [
                    { urls: 'stun:stun.l.google.com:19302' },
                    { urls: 'stun:stun1.l.google.com:19302' },
                    {
                        urls: 'turn:relay.metered.ca:80',
                        username: '52ffbd51dfea25656826e630',
                        credential: 'h/J9dKN7CMqgttLK',
                    }
                ]
            }
        });

        // Handle peer events
        peer.on('open', (id) => {
            console.log('My peer ID is: ' + id);
            socket.emit('join-room', { id, room: currentRoom });
        });

        peer.on('error', (err) => {
            console.error('Peer Error:', err);
            updateStatus(`Connection error: ${err.message}`);
        });

        peer.on('call', (call) => {
            console.log('Receiving call...');
            call.answer(localStream);

            call.on('stream', (remoteStream) => {
                console.log('Received remote stream');
                remoteVideo.srcObject = remoteStream;
                updateStatus('Video streaming', true);
            });
        });

        // Handle new user joining
        socket.on('user-joined', ({ id }) => {
            console.log('User joined, calling them:', id);
            if (localStream) {
                const call = peer.call(id, localStream);

                call.on('stream', (remoteStream) => {
                    console.log('Received remote stream from call');
                    remoteVideo.srcObject = remoteStream;
                    updateStatus('Video streaming', true);
                });

                call.on('error', (err) => {
                    console.error('Call error:', err);
                    updateStatus(`Call error: ${err.message}`);
                });
            }
        });
    }

    async function startTranscription() {
        try {
            if (!localStream) {
                throw new Error('No local stream available');
            }

            const audioTrack = localStream.getAudioTracks()[0];
            if (!audioTrack) {
                throw new Error('No audio track found');
            }

            // Create MediaRecorder with specific options
            const options = {
                mimeType: 'audio/webm;codecs=opus',
                audioBitsPerSecond: 48000
            };

            mediaRecorder = new MediaRecorder(new MediaStream([audioTrack]), options);

            // Reset any existing stream
            if (recognizeStream && !recognizeStream.destroyed) {
                recognizeStream.end();
            }

            // Notify server to start new transcription
            socket.emit('startTranscription');

            mediaRecorder.ondataavailable = async (event) => {
                if (event.data.size > 0 && socket.connected) {
                    const buffer = await event.data.arrayBuffer();
                    socket.emit('audioData', buffer);
                }
            };

            mediaRecorder.onstop = () => {
                socket.emit('endTranscription');
            };

            mediaRecorder.start(250);
            console.log('Transcription started');
        } catch (err) {
            console.error('Error starting transcription:', err);
            showTranscriptionError(err.message);
        }
    }

    function stopTranscription() {
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
        }
        if (socket.connected) {
            socket.emit('endTranscription');
        }
    }

    function updateStatus(message, connected = false) {
        console.log('Status update:', message);
        connectionStatus.textContent = message;
        connectionStatus.className = `alert ${connected ? 'alert-success' : 'alert-warning'}`;
    }

    function appendMessage(content, sender) {
        const messageEl = document.createElement('div');
        messageEl.className = `message ${sender === 'You' ? 'message-right' : 'message-left'}`;
        messageEl.innerHTML = `
            <strong>${sender}:</strong>
            <span>${content}</span>
        `;
        messagesDiv.appendChild(messageEl);
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }

    function endCall() {
        stopTranscription();
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
            localStream = null;
        }
        if (peer) {
            peer.destroy();
            peer = null;
        }
        localVideo.srcObject = null;
        remoteVideo.srcObject = null;
        startCallBtn.disabled = false;
        endCallBtn.disabled = true;
        updateStatus('Call ended');
    }

    toggleAudioBtn.addEventListener('click', () => {
        if (localStream) {
            const audioTrack = localStream.getAudioTracks()[0];
            audioTrack.enabled = !audioTrack.enabled;
            toggleAudioBtn.innerHTML = `<i class="bi bi-mic${audioTrack.enabled ? '-fill' : '-mute-fill'}"></i>`;
        }
    });

    toggleVideoBtn.addEventListener('click', () => {
        if (localStream) {
            const videoTrack = localStream.getVideoTracks()[0];
            videoTrack.enabled = !videoTrack.enabled;
            toggleVideoBtn.innerHTML = `<i class="bi bi-camera-video${videoTrack.enabled ? '-fill' : '-off-fill'}"></i>`;
        }
    });

    function appendSystemMessage(message) {
        const messageEl = document.createElement('div');
        messageEl.className = 'message message-system';
        messageEl.textContent = message;
        messagesDiv.appendChild(messageEl);
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }

    // Event Listeners
    startCallBtn.addEventListener('click', startCall);
    endCallBtn.addEventListener('click', endCall);

    messageForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const message = messageInput.value.trim();
        if (message) {
            appendMessage(message, 'You');
            socket.emit('send', { message, room: currentRoom });
            messageInput.value = '';
        }
    });

    // Socket Events
    const name = prompt('Enter your name:') || 'Anonymous';
    socket.emit('join-room', { name, room: currentRoom });

    socket.on('room-joined', ({ isInitiator: initiatorStatus }) => {
        isInitiator = initiatorStatus;
        updateStatus(`Joined room as ${isInitiator ? 'initiator' : 'participant'}`);
    });

    socket.on('user-joined', ({ name }) => {
        appendMessage(`${name} joined the room`, 'System');
        updateStatus('Peer joined');
    });

    socket.on('signal', data => {
        if (peer) {
            peer.signal(data);
        }
    });

    socket.on('receive', data => {
        appendMessage(data.message, data.name);
    });

    socket.on('user-left', ({ name }) => {
        appendMessage(`${name} left the room`, 'System');
        updateStatus('Peer disconnected');
    });

    socket.on('transcription', ({ text, isFinal }) => {
        const transcriptionDiv = document.getElementById('transcription');

        if (isFinal) {
            // Remove any existing interim text
            const interim = document.getElementById('interim');
            if (interim) interim.remove();

            // Add final transcription
            const p = document.createElement('p');
            p.textContent = text;
            transcriptionDiv.appendChild(p);
            transcriptionDiv.scrollTop = transcriptionDiv.scrollHeight;
        } else {
            // Update interim results
            let interim = document.getElementById('interim');
            if (!interim) {
                interim = document.createElement('p');
                interim.id = 'interim';
                interim.className = 'interim';
                transcriptionDiv.appendChild(interim);
            }
            interim.textContent = text;
        }
    });

    socket.on('transcriptionError', (error) => {
        console.error('Transcription error:', error);
        showTranscriptionError(error);
    });

    socket.on('disconnect', () => {
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
        }
        showTranscriptionError('Connection lost. Reconnecting...');
    });

    // Add connection event handlers
    socket.on('connect', () => {
        console.log('Connected to server');
    });

    socket.on('connect_error', (error) => {
        console.error('Connection error:', error);
        handleConnectionError();
    });

    socket.on('disconnect', (reason) => {
        console.log('Disconnected:', reason);
        handleDisconnect();
    });

    function handleConnectionError() {
        const errorDiv = document.getElementById('connectionError') || createErrorDiv();
        errorDiv.textContent = 'Connection failed. Attempting to reconnect...';
    }

    function handleDisconnect() {
        const errorDiv = document.getElementById('connectionError') || createErrorDiv();
        errorDiv.textContent = 'Disconnected from server. Reconnecting...';
    }

    function createErrorDiv() {
        const div = document.createElement('div');
        div.id = 'connectionError';
        div.className = 'alert alert-warning';
        document.body.insertBefore(div, document.body.firstChild);
        return div;
    }

    function showTranscriptionError(message) {
        const transcriptionDiv = document.getElementById('transcription');
        const errorElement = document.createElement('p');
        errorElement.className = 'error-message';
        errorElement.textContent = `Error: ${message}`;
        transcriptionDiv.appendChild(errorElement);

        // Auto-remove error message after 5 seconds
        setTimeout(() => {
            errorElement.remove();
        }, 5000);
    }
});