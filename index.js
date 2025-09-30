const { Client, MessageMedia, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const express = require('express');
const app = express();

app.use(express.json());

// Use LocalAuth to persist session (avoids generating QR every restart)
const client = new Client({
    authStrategy: new LocalAuth({ clientId: "render-client" })
});

let whatsappQRLink = ''; 

client.on('qr', async (qr) => {
    try {
        const qrDataURL = await qrcode.toDataURL(qr);
        whatsappQRLink = `<img src="${qrDataURL}" alt="WhatsApp QR Code" /><br/>
                          <p>Scan this QR with your WhatsApp</p>`;
        console.log('QR generated. Visit /get-qr to scan.');
    } catch (err) {
        console.error('Error generating QR code:', err);
    }
});

client.on('ready', () => {
    console.log('WhatsApp client is ready!');
    whatsappQRLink = `<p>WhatsApp client is ready! No QR needed.</p>`;
});

// GET endpoint to view QR
app.get('/get-qr', (req, res) => {
    res.send(whatsappQRLink || 'QR not generated yet. Please wait...');
});

// API endpoint to send PDF
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

client.initialize();
app.listen(10000, () => console.log('API server running on port 10000'));
