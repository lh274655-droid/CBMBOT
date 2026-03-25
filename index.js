const admin = require("firebase-admin");
const fetch = require("node-fetch");

const serviceAccount = JSON.parse(process.env.FIREBASE_KEY);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const WEBHOOK = process.env.DISCORD_WEBHOOK;

// 🧠 limpa texto bugado
function limparTexto(txt) {
  if (!txt) return "Sem informação";

  return txt
    .replace(/\[.*?\]/g, "") // remove [��]
    .replace(/\s+/g, " ")
    .trim();
}

// 🧠 formata data
function formatarData(valor) {
  if (!valor) return "N/A";
  return new Date(valor).toLocaleString("pt-BR");
}

// 🧠 define cor por tipo
function corPorTexto(txt) {
  txt = txt.toLowerCase();

  if (txt.includes("finalizou")) return 3066993; // verde
  if (txt.includes("assumiu")) return 3447003; // azul
  if (txt.includes("manutenção")) return 15844367; // amarelo
  if (txt.includes("erro")) return 15158332; // vermelho

  return 9807270; // padrão cinza
}

async function enviarLogs() {
  const snapshot = await db.collection("logs")
    .orderBy("data", "desc")
    .limit(5)
    .get();

  for (const doc of snapshot.docs) {
    const log = doc.data();

    let mensagem = limparTexto(log.txt);
    const data = formatarData(log.data);
    const cor = corPorTexto(mensagem);

    await fetch(WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        embeds: [{
          title: "🚒 CENTRAL DE OPERAÇÕES",
          description: mensagem,
          color: cor,
          footer: {
            text: "Data: " + data
          }
        }]
      })
    });
  }
}

enviarLogs().catch(console.error);
