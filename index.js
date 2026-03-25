const admin = require("firebase-admin");
const fetch = require("node-fetch");

const serviceAccount = JSON.parse(process.env.FIREBASE_KEY);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const WEBHOOK = process.env.DISCORD_WEBHOOK;

function formatarData(valor) {
  if (!valor) return "N/A";
  return new Date(valor).toLocaleString("pt-BR");
}

async function enviarLogs() {
  const snapshot = await db.collection("logs")
    .orderBy("data", "desc")
    .limit(5)
    .get();

  for (const doc of snapshot.docs) {
    const log = doc.data();

    const mensagem = log.txt || "Sem mensagem";
    const data = formatarData(log.data);

    await fetch(WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        embeds: [{
          title: "🚒 LOG OPERACIONAL",
          color: 16711680,
          description: mensagem,
          footer: {
            text: "Data: " + data
          }
        }]
      })
    });
  }
}

enviarLogs().catch(console.error);
