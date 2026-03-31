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
} = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers
  ]
});

const CANAL_PORTARIA = process.env.CANAL_PORTARIA;
const CANAL_APROVACAO = process.env.CANAL_APROVACAO;
const CARGO_AGUARDANDO = process.env.CARGO_AGUARDANDO;

const IMAGEM_PAINEL = "https://media.discordapp.net/attachments/1487903044644507902/1487903455195435081/Gemini_Generated_Image_i5bryei5bryei5br_1.png";

// ================= CARGOS =================
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

// ================= FUNÇÕES =================
function criarSelectCargo(userId, selecionado = null) {
  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId(`cargo_${userId}`)
      .setPlaceholder("Selecione o cargo")
      .addOptions(
        Object.keys(CARGOS).map(nome => ({
          label: nome,
          value: nome,
          default: nome === selecionado
        }))
      )
  );
}

function criarBotoesAprovacao(userId, cargo = "nenhum") {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`aprovar_${userId}_${encodeURIComponent(cargo)}`)
      .setLabel("✅ Aprovar")
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(`reprovar_${userId}`)
      .setLabel("❌ Reprovar")
      .setStyle(ButtonStyle.Danger)
  );
}

// ================= PAINEL =================
async function atualizarPainel(canal, payload) {
  const mensagens = await canal.messages.fetch({ limit: 50 }).catch(() => null);

  let painel = null;

  if (mensagens) {
    painel = mensagens.find(msg =>
      msg.author.id === client.user.id &&
      msg.embeds?.[0]?.title === "🚒 Sistema de Ingresso - Corpo de Bombeiros Militar"
    );
  }

  if (painel) {
    await painel.edit(payload);
    console.log("♻️ Painel atualizado (sem duplicar)");
  } else {
    await canal.send(payload);
    console.log("📌 Painel criado (primeira vez)");
  }
}

// ================= READY =================
client.once(Events.ClientReady, async () => {
  console.log(`🔥 Bot online: ${client.user.tag}`);

  const canal = await client.channels.fetch(CANAL_PORTARIA).catch(() => null);
  if (!canal) return console.log("❌ Canal não encontrado");

  const embed = new EmbedBuilder()
    .setColor(0xcc0000)
    .setTitle("🚒 Sistema de Ingresso - Corpo de Bombeiros Militar")
    .setDescription("Preencha o formulário para entrar no CBM.")
    .setImage(IMAGEM_PAINEL);

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("abrir_form")
      .setLabel("Preencher")
      .setStyle(ButtonStyle.Primary)
  );

  await atualizarPainel(canal, {
    embeds: [embed],
    components: [row]
  });
});

// ================= INTERAÇÕES =================
client.on(Events.InteractionCreate, async (interaction) => {
  try {
    if (interaction.isButton() && interaction.customId === "abrir_form") {
      const modal = new ModalBuilder()
        .setCustomId("form_cbm")
        .setTitle("Ingresso CBM");

      const qra = new TextInputBuilder()
        .setCustomId("qra")
        .setLabel("QRA")
        .setStyle(TextInputStyle.Short);

      modal.addComponents(new ActionRowBuilder().addComponents(qra));

      return interaction.showModal(modal);
    }

    if (interaction.isModalSubmit()) {
      const qra = interaction.fields.getTextInputValue("qra");

      const canal = await interaction.guild.channels.fetch(CANAL_APROVACAO);

      const embed = new EmbedBuilder()
        .setColor(0x2b8cff)
        .setTitle("Nova Solicitação")
        .setDescription(`QRA: ${qra}\nUsuário: ${interaction.user}`);

      await canal.send({
        embeds: [embed],
        components: [
          criarSelectCargo(interaction.user.id),
          criarBotoesAprovacao(interaction.user.id)
        ]
      });

      return interaction.reply({ content: "Enviado!", ephemeral: true });
    }

  } catch (err) {
    console.error(err);
  }
});

client.login(process.env.TOKEN);
