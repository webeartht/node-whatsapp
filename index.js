const { Client, MessageMedia, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const express = require('express');
const app = express();
const path = require('path');

app.use(express.json());

// Use LocalAuth to persist session across restarts
const client = new Client({
    authStrategy: new LocalAuth({ clientId: "render-client" })
});

let qrCodeDataURL = ''; // store QR code data URL

// QR event: generate data URL for browser display
client.on('qr', async (qr) => {
    try {
        qrCodeDataURL = await qrcode.toDataURL(qr);
        console.log('QR code generated. Visit /qr to scan.');
    } catch (err) {
        console.error('Error generating QR code:', err);
    }
});

// Ready event
client.on('ready', () => {
    console.log('WhatsApp client is ready!');
    qrCodeDataURL = ''; // no QR needed anymore
});

// Serve QR code in browser
app.get('/qr', (req, res) => {
    if (qrCodeDataURL) {
        res.send(`
            <h2>Scan this QR with WhatsApp</h2>
            <img src="${qrCodeDataURL}" alt="WhatsApp QR" />
        `);
    } else {
        res.send('<h2>WhatsApp client is ready! ✅ No QR needed.</h2>');
    }
});

// Endpoint to check status
app.get('/status', (req, res) => {
    if (client.info) {
        res.json({ status: 'ready', message: 'WhatsApp client is ready!' });
    } else {
        res.json({ status: 'not_ready', message: 'WhatsApp client not ready yet.' });
    }
});

// API endpoint to send PDF via URL
app.post('/send-pdf', async (req, res) => {
    const { number, fileUrl, fileName } = req.body;
    try {
        const media = await MessageMedia.fromUrl(fileUrl, { unsafeMime: true });
        await client.sendMessage(`${number}@c.us`, media, { caption: fileName || "Document" });
        res.json({ status: 'success', message: `PDF sent to ${number}` });
    } catch (err) {
        console.error(err);
        res.json({ status: 'error', message: err.message });
    }
});

// API endpoint to send PDF from local file (inside container)
app.post('/send-pdf-local', async (req, res) => {
    const { number, filePath, fileName } = req.body;
    try {
        const fullPath = path.resolve(filePath);
        const media = MessageMedia.fromFilePath(fullPath);
        await client.sendMessage(`${number}@c.us`, media, { caption: fileName || "Document" });
        res.json({ status: 'success', message: `PDF sent to ${number}` });
    } catch (err) {
        console.error(err);
        res.json({ status: 'error', message: err.message });
    }
});

client.initialize();

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`API server running on port ${PORT}`));
