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

// 🔥 AGORA TUDO VEM DO RENDER
const CANAL_PORTARIA = process.env.CANAL_PORTARIA;
const CANAL_APROVACAO = process.env.CANAL_APROVACAO;
const CARGO_AGUARDANDO = process.env.CARGO_AGUARDANDO;

let MENSAGEM_PAINEL = "";

const IMAGEM_PAINEL = "https://media.discordapp.net/attachments/1487903044644507902/1487903455195435081/Gemini_Generated_Image_i5bryei5bryei5br_1.png";

// 🔥 ARRUMADO (sem IDs fake)
const CARGOS = {
  "Soldado 2ºCL": {
    principal: "1487872436975173704",
    extras: [],
    prefixo: "[•]"
  },
  "Soldado 1ºCL": {
    principal: "1483562466276282517",
    extras: [],
    prefixo: "[••]"
  },
  "Cabo": {
    principal: "1483562466276282518",
    extras: [],
    prefixo: "[•••]"
  },
  "3º Sargento": {
    principal: "1483562466289127606",
    extras: [],
    prefixo: "[✦]"
  },
  "2º Sargento": {
    principal: "1483562466289127607",
    extras: [],
    prefixo: "[✦✦]"
  },
  "1º Sargento": {
    principal: "1483562466289127608",
    extras: [],
    prefixo: "[✦✦✦]"
  },
  "Subtenente": {
    principal: "1483562466289127609",
    extras: [],
    prefixo: "[✶]"
  },
  "Aspirante a Oficial": {
    principal: "1483562466289127611",
    extras: [],
    prefixo: "[✶✶]"
  },
  "2º Tenente": {
    principal: "1483562466289127613",
    extras: [],
    prefixo: "[✶✶✶]"
  },
  "1º Tenente": {
    principal: "1483562466289127614",
    extras: [],
    prefixo: "[✷✷]"
  },
  "Capitão": {
    principal: "1483562466301579335",
    extras: [],
    prefixo: "[✷✷✷]"
  },
  "Major": {
    principal: "1483562466301579337",
    extras: [],
    prefixo: "[✹]"
  },
  "Tenente-Coronel": {
    principal: "1483562466301579338",
    extras: [],
    prefixo: "[✹✹]"
  },
  "Coronel": {
    principal: "1483562466301579339",
    extras: [],
    prefixo: "[✹✹✹]"
  },
  "Comandante Geral": {
    principal: "1483562466309837047",
    extras: [],
    prefixo: "[✪✪✪]"
  }
};

function criarSelectCargo(userId, selecionado = null) {
  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId(`cargo_${userId}`)
      .setPlaceholder("Selecione o cargo")
      .addOptions(
        Object.keys(CARGOS).map((nome) => ({
          label: nome,
          value: nome,
          default: nome === selecionado
        }))
      )
  );
}

function criarBotoesAprovacao(userId, cargoSelecionado = "nenhum") {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`aprovar_${userId}_${encodeURIComponent(cargoSelecionado)}`)
      .setLabel("✅ Aprovar")
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(`reprovar_${userId}`)
      .setLabel("❌ Reprovar")
      .setStyle(ButtonStyle.Danger)
  );
}

client.once(Events.ClientReady, async () => {
  console.log(`🔥 Bot online: ${client.user.tag}`);
});

client.on(Events.InteractionCreate, async (interaction) => {
  try {

    if (interaction.isButton() && interaction.customId.startsWith("aprovar_")) {
      const partes = interaction.customId.split("_");
      const userId = partes[1];
      const cargoNome = decodeURIComponent(partes.slice(2).join("_"));

      const configCargo = CARGOS[cargoNome];
      if (!configCargo) return;

      const membro = await interaction.guild.members.fetch(userId);

      await membro.roles.add(configCargo.principal);

      if (CARGO_AGUARDANDO) {
        const aguardando = interaction.guild.roles.cache.get(CARGO_AGUARDANDO);
        if (aguardando) await membro.roles.remove(aguardando);
      }

      await membro.setNickname(`${configCargo.prefixo} ${membro.user.username}`);

      await interaction.reply({
        content: `✅ ${membro} aprovado como ${cargoNome}`,
        ephemeral: true
      });
    }

  } catch (err) {
    console.log(err);
  }
});

// 🔥 SEM TOKEN NO CÓDIGO
client.login(process.env.TOKEN);
