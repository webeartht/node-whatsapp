const { Client, MessageMedia, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode");
const express = require("express");

const app = express();
app.use(express.json());

// WhatsApp client with session persistence
const client = new Client({
    authStrategy: new LocalAuth({ clientId: "render-client" })
});

let qrCodeDataURL = "";

// QR event
client.on("qr", async (qr) => {
    qrCodeDataURL = await qrcode.toDataURL(qr);
    console.log("QR generated → visit /qr to scan");
});

// Ready event
client.on("ready", () => {
    console.log("✅ WhatsApp client is ready!");
    qrCodeDataURL = "";
});

// Serve QR code in browser
app.get("/qr", (req, res) => {
    if (qrCodeDataURL) {
        res.send(`
            <h2>Scan this QR with WhatsApp</h2>
            <img src="${qrCodeDataURL}" />
        `);
    } else {
        res.send("<h2>✅ WhatsApp client is ready (no QR needed).</h2>");
    }
});

// Status endpoint
app.get("/status", (req, res) => {
    if (client.info) {
        res.json({ status: "ready", message: "WhatsApp client is ready!" });
    } else {
        res.json({ status: "not_ready", message: "Client not ready yet" });
    }
});

// 🚀 New endpoint: send PDF via base64 (from PHP)
app.post("/send-pdf-base64", async (req, res) => {
    const { number, fileData, fileName } = req.body;

    try {
        if (!number || !fileData) {
            return res
                .status(400)
                .json({ status: "error", message: "Missing number or fileData" });
        }

        const media = new MessageMedia(
            "application/pdf",
            fileData,
            `${fileName || "document"}.pdf`
        );

        await client.sendMessage(`${number}@c.us`, media, {
            caption: fileName || "Document"
        });

        res.json({ status: "success", message: `PDF sent to ${number}` });
    } catch (err) {
        console.error("Error sending PDF:", err);
        res.status(500).json({ status: "error", message: err.message });
    }
});

// Start server
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 API server running on ${PORT}`));

client.initialize();
