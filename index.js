const {
  Client,
  GatewayIntentBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  EmbedBuilder,
  StringSelectMenuBuilder,
  Events
} = require("discord.js");

const http = require("http");

// ================== CLIENT ==================
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers
  ]
});

// ================== ENV ==================
const CANAL_PORTARIA = process.env.CANAL_PORTARIA;
const CANAL_APROVACAO = process.env.CANAL_APROVACAO;
const CARGO_AGUARDANDO = process.env.CARGO_AGUARDANDO;

let MENSAGEM_PAINEL = "";

// ================== CONFIG ==================
const IMAGEM_PAINEL =
  "https://media.discordapp.net/attachments/1487903044644507902/1487903455195435081/Gemini_Generated_Image_i5bryei5bryei5br_1.png";

const CARGOS = {
  "Soldado 2ºCL": { principal: "1487872436975173704", extras: [], prefixo: "[•]" },
  "Soldado 1ºCL": { principal: "1483562466276282517", extras: [], prefixo: "[••]" },
  "Cabo": { principal: "1483562466276282518", extras: [], prefixo: "[•••]" },
  "3º Sargento": { principal: "1483562466289127606", extras: [], prefixo: "[✦]" },
  "2º Sargento": { principal: "1483562466289127607", extras: [], prefixo: "[✦✦]" },
  "1º Sargento": { principal: "1483562466289127608", extras: [], prefixo: "[✦✦✦]" },
  "Subtenente": { principal: "1483562466289127609", extras: [], prefixo: "[✶]" },
  "Aspirante a Oficial": { principal: "1483562466289127611", extras: [], prefixo: "[✶✶]" },
  "2º Tenente": { principal: "1483562466289127613", extras: [], prefixo: "[✶✶✶]" },
  "1º Tenente": { principal: "1483562466289127614", extras: [], prefixo: "[✷✷]" },
  "Capitão": { principal: "1483562466301579335", extras: [], prefixo: "[✷✷✷]" },
  "Major": { principal: "1483562466301579337", extras: [], prefixo: "[✹]" },
  "Tenente-Coronel": { principal: "1483562466301579338", extras: [], prefixo: "[✹✹]" },
  "Coronel": { principal: "1483562466301579339", extras: [], prefixo: "[✹✹✹]" },
  "Comandante Geral": { principal: "1483562466309837047", extras: [], prefixo: "[✪✪✪]" }
};

// ================== FUNÇÕES ==================
function validarEnv() {
  const faltando = [];
  if (!process.env.TOKEN) faltando.push("TOKEN");
  if (!CANAL_PORTARIA) faltando.push("CANAL_PORTARIA");
  if (!CANAL_APROVACAO) faltando.push("CANAL_APROVACAO");

  if (faltando.length) {
    console.error("❌ Variáveis faltando:", faltando.join(", "));
    return false;
  }
  return true;
}

function montarPainel() {
  return {
    embeds: [
      new EmbedBuilder()
        .setColor(0xcc0000)
        .setTitle("🚒 Sistema de Ingresso - CBM")
        .setDescription("Preencha o formulário para ingressar.")
        .setImage(IMAGEM_PAINEL)
    ],
    components: [
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("abrir_form")
          .setLabel("📋 Preencher")
          .setStyle(ButtonStyle.Primary)
      )
    ]
  };
}

async function garantirPainel() {
  const canal = await client.channels.fetch(CANAL_PORTARIA).catch(() => null);
  if (!canal) return;

  const payload = montarPainel();

  const msgs = await canal.messages.fetch({ limit: 10 }).catch(() => null);
  const antiga = msgs?.find(m => m.author.id === client.user.id);

  if (antiga) {
    await antiga.edit(payload).catch(() => {});
  } else {
    const nova = await canal.send(payload);
    await nova.pin().catch(() => {});
  }
}

// ================== READY ==================
client.once(Events.ClientReady, async () => {
  console.log(`🔥 Bot online: ${client.user.tag}`);

  await garantirPainel();

  setInterval(garantirPainel, 5 * 60 * 1000);
});

// ================== INTERAÇÕES ==================
client.on(Events.InteractionCreate, async (interaction) => {
  if (interaction.isButton() && interaction.customId === "abrir_form") {
    const modal = new ModalBuilder()
      .setCustomId("form")
      .setTitle("Formulário");

    const input = new TextInputBuilder()
      .setCustomId("qra")
      .setLabel("QRA")
      .setStyle(TextInputStyle.Short);

    modal.addComponents(new ActionRowBuilder().addComponents(input));

    await interaction.showModal(modal);
  }
});

// ================== ERROS ==================
process.on("unhandledRejection", console.error);
process.on("uncaughtException", console.error);

// ================== INICIAR ==================
if (!validarEnv()) process.exit(1);

client.login(process.env.TOKEN);

// ================== SERVIDOR WEB (ANTI-SLEEP) ==================
const PORT = process.env.PORT || 3000;

http.createServer((req, res) => {
  res.writeHead(200);
  res.end("🔥 CBM BOT ONLINE");
}).listen(PORT, () => {
  console.log("🌐 Web ativo");
});
