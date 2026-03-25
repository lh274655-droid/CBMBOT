const admin = require("firebase-admin");
const fetch = require("node-fetch");

const serviceAccount = JSON.parse(process.env.FIREBASE_KEY);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const WEBHOOK = process.env.DISCORD_WEBHOOK;

let ultimoEnviado = 0;

// limpa texto
function limpar(txt) {
  if (!txt) return "Sem informação";

  txt = txt.replace(/\[.*?\]/g, "").trim();

  // corrige nomes em caps
  return txt.replace(/\b[A-Z]{3,}\b/g, (w) =>
    w.charAt(0) + w.slice(1).toLowerCase()
  );
}

// formata data
function formatarData(ms) {
  return new Date(ms).toLocaleString("pt-BR");
}

async function enviarLogs() {
  const snapshot = await db.collection("logs")
    .orderBy("data", "asc")
    .get();

  for (const doc of snapshot.docs) {
    const log = doc.data();

    if (!log.data || log.data <= ultimoEnviado) continue;

    ultimoEnviado = log.data;

    const mensagem = limpar(log.txt);
    const data = formatarData(log.data);

    await fetch(WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        embeds: [{
          title: "🚒 LOG OPERACIONAL",
          description: mensagem,
          color: 16711680,
          footer: {
            text: "Data: " + data
          }
        }]
      })
    });
  }
}

// loop contínuo
async function loop() {
  console.log("Sistema rodando...");

  while (true) {
    try {
      await enviarLogs();
    } catch (e) {
      console.error(e);
    }

    await new Promise(r => setTimeout(r, 60000)); // 1 minuto
  }
}

loop();
