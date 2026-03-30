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

const IMAGEM_PAINEL = "https://media.discordapp.net/attachments/1487903044644507902/1487903455195435081/Gemini_Generated_Image_i5bryei5bryei5br_1.png?ex=69cad593&is=69c98413&hm=8898ac5e02b3f5d45f075b9338122e0b8aa105e91d8d83778ae9ec341f3ed6fa&=&format=webp&quality=lossless";

const EXTRA_OFICIAL = "1483562466276282510";

const CARGOS = {
  "Soldado 2ºCL": {
    principal: "1487872436975173704",
    extras: [],
    prefixo: "[❯²]"
  },
  "Soldado 1ºCL": {
    principal: "1483562466276282517",
    extras: [],
    prefixo: "[❯¹]"
  },
  "Cabo": {
    principal: "1483562466276282518",
    extras: [],
    prefixo: "[❯❯]"
  },
  "3º Sargento": {
    principal: "1483562466289127606",
    extras: [],
    prefixo: "[❯❯❯]"
  },
  "2º Sargento": {
    principal: "1483562466289127607",
    extras: [],
    prefixo: "[❯❯❯❯]"
  },
  "1º Sargento": {
    principal: "1483562466289127608",
    extras: [],
    prefixo: "[❯❯❯❯❯]"
  },
  "Subtenente": {
    principal: "1483562466289127609",
    extras: [],
    prefixo: "[△]"
  },
  "Aspirante a Oficial": {
    principal: "1483562466289127611",
    extras: [],
    prefixo: "[✯]"
  },
  "2º Tenente": {
    principal: "1483562466289127613",
    extras: [],
    prefixo: "[✧]"
  },
  "1º Tenente": {
    principal: "1483562466289127614",
    extras: [],
    prefixo: "[✧✧]"
  },
  "Capitão": {
    principal: "1483562466301579335",
    extras: [EXTRA_OFICIAL],
    prefixo: "[✧✧✧]"
  },
  "Major": {
    principal: "1483562466301579337",
    extras: [EXTRA_OFICIAL],
    prefixo: "[✵✧✧]"
  },
  "Tenente-Coronel": {
    principal: "1483562466301579338",
    extras: [EXTRA_OFICIAL],
    prefixo: "[✵✵✧]"
  },
  "Coronel": {
    principal: "1483562466301579339",
    extras: [EXTRA_OFICIAL],
    prefixo: "[✵✵✵]"
  },
  "Comandante Geral": {
    principal: "1483562466309837047",
    extras: [EXTRA_OFICIAL],
    prefixo: "[☫∗⁑]"
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

async function criarOuAtualizarPainel() {
  const canal = await client.channels.fetch(CANAL_PORTARIA).catch(() => null);

  if (!canal) {
    console.log("❌ Canal da portaria não encontrado.");
    return;
  }

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("abrir_form")
      .setLabel("📋 Preencher")
      .setStyle(ButtonStyle.Primary)
  );

  const embed = new EmbedBuilder()
    .setColor(0xb30000)
    .setTitle("🚒 Sistema de Ingresso - Corpo de Bombeiros Militar")
    .setDescription(
      "**Você foi aprovado na entrevista, parabéns!**\n\n" +
      "Agora basta preencher o formulário abaixo e enviar em nosso Discord."
    )
    .setImage(IMAGEM_PAINEL)
    .setFooter({ text: "18º Grupamento do Corpo de Bombeiros Militar" });

  try {
    const mensagens = await canal.messages.fetch({ limit: 20 }).catch(() => null);

    const existente = mensagens?.find(
      (m) =>
        m.author.id === client.user.id &&
        m.embeds?.[0]?.title === "🚒 Sistema de Ingresso - Corpo de Bombeiros Militar"
    );

    if (existente) {
      await existente.edit({
        embeds: [embed],
        components: [row]
      });
      await existente.pin().catch(() => {});
      console.log("✅ Painel atualizado.");
    } else {
      const msg = await canal.send({
        embeds: [embed],
        components: [row]
      });
      await msg.pin().catch(() => {});
      console.log("📌 Painel criado e fixado.");
    }
  } catch (err) {
    console.log("❌ Erro ao criar painel:", err.message);
  }
}

client.once(Events.ClientReady, async () => {
  console.log(`🔥 Bot online: ${client.user.tag}`);
  await criarOuAtualizarPainel();
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
        const cargo = interaction.guild.roles.cache.get(cargoId);
        if (cargo) {
          await membro.roles.add(cargo).catch(() => {});
        }
      }

      if (CARGO_AGUARDANDO) {
        const aguardando = interaction.guild.roles.cache.get(CARGO_AGUARDANDO);
        if (aguardando && membro.roles.cache.has(CARGO_AGUARDANDO)) {
          await membro.roles.remove(aguardando).catch(() => {});
        }
      }

      const prefixo = configCargo.prefixo || "[CBM]";
      const nomeBase = membro.displayName.replace(/^\[.*?\]\s*/, "").trim();

      await membro.setNickname(`${prefixo} ${nomeBase}`).catch(() => {});

      const embedAprovado = new EmbedBuilder()
        .setColor(0x00b300)
        .setTitle("✅ Solicitação Aprovada")
        .setDescription(
          `**Militar:** ${membro}\n` +
          `**Cargo aplicado:** ${cargoNome}\n` +
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
