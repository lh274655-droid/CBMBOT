const admin = require("firebase-admin");

const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

const serviceAccount = JSON.parse(process.env.FIREBASE_KEY);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const WEBHOOK = process.env.DISCORD_WEBHOOK;

async function enviarLogs() {
  const snapshot = await db.collection("logs")
    .orderBy("data", "desc")
    .limit(5)
    .get();

  for (const doc of snapshot.docs) {
    const log = doc.data();

    await fetch(WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        embeds: [{
          title: "🚨 LOG DO SISTEMA",
          color: 15158332,
          fields: [
            { name: "Usuário", value: String(log.usuario || "N/A"), inline: true },
            { name: "Ação", value: String(log.acao || "N/A"), inline: true },
            { name: "Módulo", value: String(log.modulo || "N/A"), inline: true },
            { name: "Data", value: String(log.data || "N/A") }
          ]
        }]
      })
    });
  }
}

enviarLogs().catch(console.error);
