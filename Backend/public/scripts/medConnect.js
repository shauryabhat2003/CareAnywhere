// public/scripts/medConnect.js
document.addEventListener('DOMContentLoaded', () => {
    const socket = io('http://localhost:3000');
    let peer = null;
    let localStream = null;
    let isInitiator = false;
    let mediaRecorder = null;
    let audioContext = null;
    let audioStream = null;

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

            // Start transcription after getting media stream
            await startTranscription();

            createPeerConnection();
            startCallBtn.disabled = true;
            endCallBtn.disabled = false;
            updateStatus('Connecting to peer...');
        } catch (err) {
            console.error('Failed to get media devices:', err);
            updateStatus('Camera/Microphone access denied');
        }
    }

    function createPeerConnection() {
        if (peer) {
            peer.destroy();
        }

        peer = new SimplePeer({
            initiator: isInitiator,
            stream: localStream,
            trickle: false,
            config: {
                iceServers: [
                    { urls: 'stun:stun.l.google.com:19302' },
                    { urls: 'stun:stun1.l.google.com:19302' }
                ]
            }
        });

        peer.on('signal', data => {
            socket.emit('signal', { data, room: currentRoom });
        });

        peer.on('connect', () => {
            updateStatus('Connected!', true);
        });

        peer.on('stream', stream => {
            remoteVideo.srcObject = stream;
            updateStatus('Video streaming');
        });

        peer.on('error', err => {
            console.error('Peer Error:', err);
            updateStatus(`Connection error: ${err.message}`);
        });

        peer.on('close', () => {
            endCall();
        });
    }

    async function startTranscription() {
        try {
            if (!localStream) {
                console.error('No local stream available');
                return;
            }

            // Get audio track
            const audioTrack = localStream.getAudioTracks()[0];
            if (!audioTrack) {
                console.error('No audio track found');
                return;
            }

            // Create audio context and source
            audioContext = new AudioContext();
            const source = audioContext.createMediaStreamSource(localStream);
            const processor = audioContext.createScriptProcessor(4096, 1, 1);

            source.connect(processor);
            processor.connect(audioContext.destination);

            // Initialize MediaRecorder
            const options = {
                mimeType: 'audio/webm;codecs=opus',
                audioBitsPerSecond: 48000
            };

            audioStream = new MediaStream([audioTrack]);
            mediaRecorder = new MediaRecorder(audioStream, options);

            // Notify server to start transcription
            socket.emit('startTranscription');

            // Handle audio data
            mediaRecorder.ondataavailable = async (event) => {
                if (event.data.size > 0) {
                    const buffer = await event.data.arrayBuffer();
                    socket.emit('audioData', buffer);
                }
            };

            // Start recording
            mediaRecorder.start(250); // Collect data every 250ms

            console.log('Transcription started');
        } catch (err) {
            console.error('Error starting transcription:', err);
        }
    }

    function stopTranscription() {
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
            socket.emit('endTranscription');
        }
        if (audioContext) {
            audioContext.close();
            audioContext = null;
        }
        if (audioStream) {
            audioStream.getTracks().forEach(track => track.stop());
            audioStream = null;
        }
    }

    function updateStatus(message, connected = false) {
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
        const transcriptionDiv = document.getElementById('transcription');
        const errorP = document.createElement('p');
        errorP.className = 'error';
        errorP.textContent = `Error: ${error}`;
        transcriptionDiv.appendChild(errorP);
    });
});