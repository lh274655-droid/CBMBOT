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

// Depois que o bot criar o primeiro painel, copie o ID do console e cole aqui
let MENSAGEM_PAINEL = "";

const IMAGEM_PAINEL = "https://media.discordapp.net/attachments/1487903044644507902/1487903455195435081/Gemini_Generated_Image_i5bryei5bryei5br_1.png?ex=69cad593&is=69c98413&hm=8898ac5e02b3f5d45f075b9338122e0b8aa105e91d8d83778ae9ec341f3ed6fa&=&format=webp&quality=lossless";

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
      .setPlaceholder("Selecione o cargo para aprovação")
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

async function buscarOuCriarPainel(canalPortaria, payload) {
  let mensagemPainel = null;

  if (MENSAGEM_PAINEL && MENSAGEM_PAINEL.trim() !== "") {
    mensagemPainel = await canalPortaria.messages.fetch(MENSAGEM_PAINEL).catch(() => null);
  }

  if (!mensagemPainel) {
    const mensagens = await canalPortaria.messages.fetch({ limit: 30 }).catch(() => null);

    if (mensagens) {
      mensagemPainel = mensagens.find((msg) =>
        msg.author.id === client.user.id &&
        msg.embeds &&
        msg.embeds.length > 0 &&
        msg.embeds[0].title === "🚒 Sistema de Ingresso - Corpo de Bombeiros Militar"
      );
    }
  }

  if (mensagemPainel) {
    await mensagemPainel.edit(payload).catch(() => {});
    await mensagemPainel.pin().catch(() => {});
    MENSAGEM_PAINEL = mensagemPainel.id;
    console.log("✅ Painel existente encontrado e atualizado.");
    console.log("👉 ID DO PAINEL:", mensagemPainel.id);
    return mensagemPainel;
  }

  const nova = await canalPortaria.send(payload);
  await nova.pin().catch(() => {});
  MENSAGEM_PAINEL = nova.id;

  console.log("📌 Painel criado e fixado.");
  console.log("👉 ID DA MENSAGEM DO PAINEL:", nova.id);

  return nova;
}

client.once(Events.ClientReady, async () => {
  console.log(`🔥 Bot online: ${client.user.tag}`);

  const canalPortaria = await client.channels.fetch(CANAL_PORTARIA).catch(() => null);
  if (!canalPortaria) {
    console.log("❌ Canal da portaria não encontrado.");
    return;
  }

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("abrir_form")
      .setLabel("Preencher")
      .setStyle(ButtonStyle.Primary)
  );

  const embedPainel = new EmbedBuilder()
    .setColor(0xcc0000)
    .setTitle("🚒 Sistema de Ingresso - Corpo de Bombeiros Militar")
    .setDescription(
      "**Você foi aprovado na entrevista, parabéns!**\n\n" +
      "Agora basta preencher o formulário abaixo e enviar em nosso Discord."
    )
    .setImage(IMAGEM_PAINEL)
    .setFooter({ text: "18º Grupamento do Corpo de Bombeiros Militar" });

  const payload = {
    embeds: [embedPainel],
    components: [row]
  };

  try {
    await buscarOuCriarPainel(canalPortaria, payload);
  } catch (err) {
    console.log("❌ Erro ao criar/atualizar painel:", err.message);
  }
});

client.on(Events.InteractionCreate, async (interaction) => {
  try {
    if (interaction.isButton() && interaction.customId === "abrir_form") {
      const modal = new ModalBuilder()
        .setCustomId("form_ingresso_cbm")
        .setTitle("Formulário de Ingresso");

      const qraInput = new TextInputBuilder()
        .setCustomId("qra")
        .setLabel("QRA")
        .setPlaceholder("Seu QRA")
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      const idInput = new TextInputBuilder()
        .setCustomId("id")
        .setLabel("ID")
        .setPlaceholder("Sua ID")
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      const cargoInput = new TextInputBuilder()
        .setCustomId("cargo")
        .setLabel("Cargo informado")
        .setPlaceholder("Ex: Soldado")
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      const unidadeInput = new TextInputBuilder()
        .setCustomId("unidade")
        .setLabel("Unidade informada")
        .setPlaceholder("Ex: Bombeiros / CBM")
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      modal.addComponents(
        new ActionRowBuilder().addComponents(qraInput),
        new ActionRowBuilder().addComponents(idInput),
        new ActionRowBuilder().addComponents(cargoInput),
        new ActionRowBuilder().addComponents(unidadeInput)
      );

      await interaction.showModal(modal);
      return;
    }

    if (interaction.isModalSubmit() && interaction.customId === "form_ingresso_cbm") {
      const qra = interaction.fields.getTextInputValue("qra");
      const id = interaction.fields.getTextInputValue("id");
      const cargo = interaction.fields.getTextInputValue("cargo");
      const unidade = interaction.fields.getTextInputValue("unidade");

      const canalAprovacao = await interaction.guild.channels.fetch(CANAL_APROVACAO).catch(() => null);
      if (!canalAprovacao) {
        await interaction.reply({
          content: "❌ Canal de aprovação não encontrado. Verifique o ID.",
          ephemeral: true
        });
        return;
      }

      const embed = new EmbedBuilder()
        .setColor(0x2b8cff)
        .setTitle("📥 Nova Solicitação")
        .setDescription(
          `**Solicitante:** ${interaction.user}\n` +
          `**Nome/QRA:** ${qra}\n` +
          `**ID:** ${id}\n` +
          `**Cargo informado:** ${cargo}\n` +
          `**Unidade informada:** ${unidade}`
        )
        .setFooter({ text: `User ID: ${interaction.user.id}` })
        .setTimestamp();

      await canalAprovacao.send({
        content: `${interaction.user}`,
        embeds: [embed],
        components: [
          criarSelectCargo(interaction.user.id),
          criarBotoesAprovacao(interaction.user.id)
        ]
      });

      await interaction.reply({
        content: "✅ Solicitação enviada com sucesso.",
        ephemeral: true
      });

      return;
    }

    if (interaction.isStringSelectMenu() && interaction.customId.startsWith("cargo_")) {
      const userId = interaction.customId.split("_")[1];
      const cargoEscolhido = interaction.values[0];

      const embedAtual = interaction.message.embeds?.[0];
      const novoEmbed = EmbedBuilder.from(embedAtual);

      await interaction.update({
        embeds: [novoEmbed],
        components: [
          criarSelectCargo(userId, cargoEscolhido),
          criarBotoesAprovacao(userId, cargoEscolhido)
        ]
      });

      await interaction.followUp({
        content: `✅ Selecionado: **${cargoEscolhido}**`,
        ephemeral: true
      }).catch(() => {});

      return;
    }

    if (interaction.isButton() && interaction.customId.startsWith("aprovar_")) {
      const partes = interaction.customId.split("_");
      const userId = partes[1];
      const cargoNome = decodeURIComponent(partes.slice(2).join("_"));

      if (!cargoNome || cargoNome === "nenhum") {
        await interaction.reply({
          content: "❌ Selecione um cargo antes de aprovar.",
          ephemeral: true
        });
        return;
      }

      const configCargo = CARGOS[cargoNome];
      if (!configCargo) {
        await interaction.reply({
          content: `❌ Cargo não encontrado: ${cargoNome}`,
          ephemeral: true
        });
        return;
      }

      const membro = await interaction.guild.members.fetch(userId).catch(() => null);
      if (!membro) {
        await interaction.reply({
          content: "❌ Não consegui encontrar o membro.",
          ephemeral: true
        });
        return;
      }

      const cargosParaAdicionar = [configCargo.principal, ...(configCargo.extras || [])];

      for (const cargoId of cargosParaAdicionar) {
        const cargoObj = interaction.guild.roles.cache.get(cargoId);
        if (cargoObj) {
          await membro.roles.add(cargoObj).catch(() => {});
        }
      }

      if (CARGO_AGUARDANDO) {
        const aguardando = interaction.guild.roles.cache.get(CARGO_AGUARDANDO);
        if (aguardando && membro.roles.cache.has(CARGO_AGUARDANDO)) {
          await membro.roles.remove(aguardando).catch(() => {});
        }
      }

      const prefixo = configCargo.prefixo || "[CBM]";
      await membro.setNickname(`${prefixo} ${membro.user.username}`).catch(() => {});

      const nomesExtras = (configCargo.extras || []).length > 0 ? " + cargos extras" : "";

      const embedAprovado = new EmbedBuilder()
        .setColor(0x00b300)
        .setTitle("✅ Solicitação Aprovada")
        .setDescription(
          `**Militar:** ${membro}\n` +
          `**Cargo aplicado:** ${cargoNome}${nomesExtras}\n` +
          `**Prefixo definido:** ${prefixo}\n` +
          `**Aprovado por:** ${interaction.user}\n` +
          `**Status:** ATIVO`
        )
        .setTimestamp();

      await interaction.update({
        content: "",
        embeds: [embedAprovado],
        components: []
      });

      return;
    }

    if (interaction.isButton() && interaction.customId.startsWith("reprovar_")) {
      const userId = interaction.customId.split("_")[1];

      const embedReprovado = new EmbedBuilder()
        .setColor(0xcc0000)
        .setTitle("❌ Solicitação Reprovada")
        .setDescription(
          `**Militar:** <@${userId}>\n` +
          `**Reprovado por:** ${interaction.user}\n` +
          `**Status:** NEGADO`
        )
        .setTimestamp();

      await interaction.update({
        content: "",
        embeds: [embedReprovado],
        components: []
      });

      return;
    }
  } catch (err) {
    console.error("ERRO GERAL:", err);

    if (interaction.isRepliable()) {
      if (interaction.deferred || interaction.replied) {
        await interaction.followUp({
          content: "❌ Ocorreu um erro no sistema.",
          ephemeral: true
        }).catch(() => {});
      } else {
        await interaction.reply({
          content: "❌ Ocorreu um erro no sistema.",
          ephemeral: true
        }).catch(() => {});
      }
    }
  }
});

client.login(process.env.TOKEN);
