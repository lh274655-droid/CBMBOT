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
  Events,
  REST,
  Routes,
  SlashCommandBuilder,
  PermissionFlagsBits
} = require("discord.js");

const OpenAI = require("openai");
const http = require("http");

// ===================== CLIENT =====================
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers
  ]
});

// ===================== ENV =====================
const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;
const CANAL_PORTARIA = process.env.CANAL_PORTARIA;
const CANAL_APROVACAO = process.env.CANAL_APROVACAO;
const CANAL_PONTO = process.env.CANAL_PONTO;
const OPENAI_KEY = process.env.OPENAI_KEY;
const CARGO_AGUARDANDO = process.env.CARGO_AGUARDANDO || "";

const CARGO_REMOVER = "1483562465823559696";

const openai = new OpenAI({
  apiKey: OPENAI_KEY
});

// ===================== MEMÓRIA =====================
let MENSAGEM_PAINEL = "";
const pontos = new Map();

// ===================== CONFIG =====================
const IMAGEM_PAINEL =
  "https://media.discordapp.net/attachments/1487903044644507902/1487903455195435081/Gemini_Generated_Image_i5bryei5bryei5br_1.png?ex=69cad593&is=69c98413&hm=8898ac5e02b3f5d45f075b9338122e0b8aa105e91d8d83778ae9ec341f3ed6fa&=&format=webp&quality=lossless";

const CARGOS = {
  "Soldado 2ºCL": {
    principal: "1487872436975173704",
    extras: ["1483562466276282510", "1483562466276282512"],
    prefixo: "[❯²]"
  },
  "Soldado 1ºCL": {
    principal: "1483562466276282517",
    extras: ["1483562466276282510", "1483562466276282512"],
    prefixo: "[❯¹]"
  },
  "Cabo": {
    principal: "1483562466276282518",
    extras: ["1483562466276282510", "1483562466276282512"],
    prefixo: "[❯❯]"
  },
  "3º Sargento": {
    principal: "1483562466289127606",
    extras: ["1483562466276282510", "1483562466276282512"],
    prefixo: "[❯❯❯]"
  },
  "2º Sargento": {
    principal: "1483562466289127607",
    extras: ["1483562466276282510", "1483562466276282512"],
    prefixo: "[❯ ❯❯❯]"
  },
  "1º Sargento": {
    principal: "1483562466289127608",
    extras: ["1483562466276282510", "1483562466276282512"],
    prefixo: "[❯❯ ❯❯❯]"
  },
  "Subtenente": {
    principal: "1483562466289127609",
    extras: ["1483562466276282510", "1483562466276282512"],
    prefixo: "[△]"
  },
  "Aspirante a Oficial": {
    principal: "1483562466289127611",
    extras: ["1483562466276282510", "1483562466276282512"],
    prefixo: "[✯]"
  },
  "2º Tenente": {
    principal: "1483562466289127613",
    extras: ["1483562466276282510", "1483562466276282512"],
    prefixo: "[✧]"
  },
  "1º Tenente": {
    principal: "1483562466289127614",
    extras: ["1483562466276282510", "1483562466276282512"],
    prefixo: "[✧✧]"
  },
  "Capitão": {
    principal: "1483562466301579335",
    extras: ["1483562466276282510", "1483562466276282512"],
    prefixo: "[✧✧✧]"
  },
  "Major": {
    principal: "1483562466301579337",
    extras: ["1483562466276282510", "1483562466276282512"],
    prefixo: "[✵✧✧]"
  },
  "Tenente-Coronel": {
    principal: "1483562466301579338",
    extras: ["1483562466276282510", "1483562466276282512"],
    prefixo: "[✵✵✧]"
  },
  "Coronel": {
    principal: "1483562466301579339",
    extras: ["1483562466276282510", "1483562466276282512"],
    prefixo: "[✵✵✵]"
  },
  "Comandante Geral": {
    principal: "1483562466309837047",
    extras: ["1483562466276282510", "1483562466276282512"],
    prefixo: "[✪✪✪]"
  }
};

// ===================== VALIDAÇÃO =====================
function validarEnv() {
  const faltando = [];

  if (!TOKEN) faltando.push("TOKEN");
  if (!CLIENT_ID) faltando.push("CLIENT_ID");
  if (!GUILD_ID) faltando.push("GUILD_ID");
  if (!CANAL_PORTARIA) faltando.push("CANAL_PORTARIA");
  if (!CANAL_APROVACAO) faltando.push("CANAL_APROVACAO");
  if (!CANAL_PONTO) faltando.push("CANAL_PONTO");
  if (!OPENAI_KEY) faltando.push("OPENAI_KEY");

  if (faltando.length) {
    console.error("❌ Variáveis ausentes:", faltando.join(", "));
    return false;
  }

  return true;
}

// ===================== UTILS =====================
function extrairCampo(descricao, rotulo) {
  const regex = new RegExp(`\\*\\*${rotulo}:\\*\\*\\s*(.+)`);
  const match = descricao.match(regex);
  return match ? match[1].trim() : null;
}

function limparPrefixoDoNick(nome) {
  return nome.replace(/^\[[^\]]+\]\s*/, "").trim();
}

function formatarTempo(ms) {
  const totalSegundos = Math.floor(ms / 1000);
  const horas = Math.floor(totalSegundos / 3600);
  const minutos = Math.floor((totalSegundos % 3600) / 60);
  const segundos = totalSegundos % 60;

  const partes = [];
  if (horas > 0) partes.push(`${horas}h`);
  if (minutos > 0) partes.push(`${minutos}m`);
  partes.push(`${segundos}s`);

  return partes.join(" ");
}

async function removerCargosDePatente(membro) {
  for (const cargo of Object.values(CARGOS)) {
    if (membro.roles.cache.has(cargo.principal)) {
      await membro.roles.remove(cargo.principal).catch(() => {});
    }
  }
}

async function removerCargosExtrasCBM(membro) {
  const extras = new Set();
  for (const cargo of Object.values(CARGOS)) {
    for (const extra of cargo.extras || []) extras.add(extra);
  }

  for (const extraId of extras) {
    if (membro.roles.cache.has(extraId)) {
      await membro.roles.remove(extraId).catch(() => {});
    }
  }
}

async function aplicarCargoENickname(membro, cargoNome, nomeBase, idBase) {
  const configCargo = CARGOS[cargoNome];
  if (!configCargo) throw new Error(`Cargo inválido: ${cargoNome}`);

  await removerCargosDePatente(membro);
  await removerCargosExtrasCBM(membro);

  if (membro.roles.cache.has(CARGO_REMOVER)) {
    await membro.roles.remove(CARGO_REMOVER).catch(() => {});
  }

  if (CARGO_AGUARDANDO && membro.roles.cache.has(CARGO_AGUARDANDO)) {
    await membro.roles.remove(CARGO_AGUARDANDO).catch(() => {});
  }

  const cargosParaAdicionar = [configCargo.principal, ...(configCargo.extras || [])];

  for (const cargoId of cargosParaAdicionar) {
    const cargo = membro.guild.roles.cache.get(cargoId);
    if (cargo) {
      await membro.roles.add(cargo).catch((err) => {
        console.log(`⚠️ Não foi possível adicionar cargo ${cargoId}:`, err.message);
      });
    }
  }

  const prefixo = configCargo.prefixo || "[CBM]";
  let apelidoFinal = `${prefixo} ${nomeBase} | ${idBase}`;
  apelidoFinal = apelidoFinal.slice(0, 32);

  await membro.setNickname(apelidoFinal).catch((err) => {
    console.log("⚠️ Não consegui alterar apelido:", err.message);
  });

  return { prefixo, apelidoFinal, configCargo };
}

// ===================== PONTO =====================
function criarEmbedPonto(user, ponto, titulo = "📂 Bate-Ponto", cor = 0x00b300, finalizado = false) {
  const agora = Date.now();

  let tempoPausado = 0;
  for (const pausa of ponto.pausas) {
    tempoPausado += pausa.fim - pausa.inicio;
  }

  if (ponto.emPausa && ponto.pausaInicio) {
    tempoPausado += agora - ponto.pausaInicio;
  }

  const fimBase = finalizado && ponto.fim ? ponto.fim : agora;
  let tempoTotal = fimBase - ponto.inicio - tempoPausado;
  if (tempoTotal < 0) tempoTotal = 0;

  const linhas = [
    `👤 **Usuário:** ${user}`,
    `⏱️ **Início:** <t:${Math.floor(ponto.inicio / 1000)}:F>`
  ];

  if (ponto.pausaInicio && !finalizado && ponto.emPausa) {
    linhas.push(`⏸️ **Pausa:** <t:${Math.floor(ponto.pausaInicio / 1000)}:F>`);
  }

  if (ponto.fim) {
    linhas.push(`🏁 **Fim:** <t:${Math.floor(ponto.fim / 1000)}:F>`);
  }

  linhas.push(`📊 **Tempo total:** ${formatarTempo(tempoTotal)}`);
  linhas.push(`📌 **Status:** ${finalizado ? "FINALIZADO" : ponto.emPausa ? "PAUSADO" : "EM SERVIÇO"}`);

  return new EmbedBuilder()
    .setColor(cor)
    .setTitle(titulo)
    .setDescription(linhas.join("\n"))
    .setFooter({ text: "Sistema de ponto • CBM BOT" })
    .setTimestamp();
}

function botoesPonto(pausado = false, finalizado = false) {
  if (finalizado) return [];

  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("pausar")
        .setLabel("Pausar")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(pausado),
      new ButtonBuilder()
        .setCustomId("voltar")
        .setLabel("Voltar")
        .setStyle(ButtonStyle.Success)
        .setDisabled(!pausado),
      new ButtonBuilder()
        .setCustomId("finalizar")
        .setLabel("Finalizar")
        .setStyle(ButtonStyle.Danger)
    )
  ];
}

async function atualizarPonto(guild, user, ponto, finalizado = false) {
  const canal = await guild.channels.fetch(CANAL_PONTO).catch(() => null);
  if (!canal || !canal.isTextBased()) return;

  const cor = finalizado ? 0xcc0000 : ponto.emPausa ? 0xff9900 : 0x00b300;
  const titulo = finalizado ? "📁 Ponto Finalizado" : ponto.emPausa ? "⏸️ Ponto Pausado" : "📂 Bate-Ponto";

  const embed = criarEmbedPonto(user, ponto, titulo, cor, finalizado);
  const comps = finalizado ? [] : botoesPonto(ponto.emPausa, false);

  if (ponto.msg) {
    const msg = await canal.messages.fetch(ponto.msg).catch(() => null);
    if (msg) {
      await msg.edit({ content: `${user}`, embeds: [embed], components: comps }).catch(() => {});
      return;
    }
  }

  const nova = await canal.send({
    content: `${user}`,
    embeds: [embed],
    components: comps
  }).catch(() => null);

  if (nova) ponto.msg = nova.id;
}

// ===================== PAINEL =====================
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

function montarPayloadPainel() {
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

  return {
    embeds: [embedPainel],
    components: [row]
  };
}

async function garantirPainel() {
  try {
    const canalPortaria = await client.channels.fetch(CANAL_PORTARIA).catch(() => null);
    if (!canalPortaria) {
      console.log("❌ Canal da portaria não encontrado.");
      return;
    }

    const payload = montarPayloadPainel();

    if (MENSAGEM_PAINEL) {
      const msg = await canalPortaria.messages.fetch(MENSAGEM_PAINEL).catch(() => null);
      if (msg) {
        await msg.edit(payload).catch(() => {});
        console.log("✅ Painel atualizado pelo ID salvo.");
        return;
      }
    }

    const mensagens = await canalPortaria.messages.fetch({ limit: 20 }).catch(() => null);
    if (mensagens) {
      const antiga = mensagens.find((m) =>
        m.author?.id === client.user.id &&
        m.embeds?.[0]?.title === "🚒 Sistema de Ingresso - Corpo de Bombeiros Militar"
      );

      if (antiga) {
        await antiga.edit(payload).catch(() => {});
        MENSAGEM_PAINEL = antiga.id;
        console.log("✅ Painel antigo encontrado e atualizado.");
        console.log("👉 ID DO PAINEL:", MENSAGEM_PAINEL);
        return;
      }
    }

    const nova = await canalPortaria.send(payload);
    await nova.pin().catch(() => {});
    MENSAGEM_PAINEL = nova.id;

    console.log("📌 Novo painel criado e fixado.");
    console.log("👉 ID DA MENSAGEM DO PAINEL:", MENSAGEM_PAINEL);
  } catch (err) {
    console.log("❌ Erro ao garantir painel:", err.message);
  }
}

// ===================== COMANDOS =====================
async function registrarComandos() {
  try {
    const comandos = [
      new SlashCommandBuilder()
        .setName("anuncio")
        .setDescription("Abrir painel de anúncio")
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

      new SlashCommandBuilder()
        .setName("promover")
        .setDescription("Promover um militar")
        .addUserOption(option =>
          option.setName("membro").setDescription("Militar").setRequired(true)
        )
        .addStringOption(option =>
          option.setName("cargo").setDescription("Novo cargo").setRequired(true)
            .addChoices(...Object.keys(CARGOS).map(nome => ({ name: nome, value: nome })))
        )
        .addStringOption(option =>
          option.setName("nome").setDescription("Nome/QRA para o apelido").setRequired(false)
        )
        .addStringOption(option =>
          option.setName("id").setDescription("ID para o apelido").setRequired(false)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

      new SlashCommandBuilder()
        .setName("rebaixar")
        .setDescription("Rebaixar um militar")
        .addUserOption(option =>
          option.setName("membro").setDescription("Militar").setRequired(true)
        )
        .addStringOption(option =>
          option.setName("cargo").setDescription("Cargo de destino").setRequired(true)
            .addChoices(...Object.keys(CARGOS).map(nome => ({ name: nome, value: nome })))
        )
        .addStringOption(option =>
          option.setName("nome").setDescription("Nome/QRA para o apelido").setRequired(false)
        )
        .addStringOption(option =>
          option.setName("id").setDescription("ID para o apelido").setRequired(false)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

      new SlashCommandBuilder()
        .setName("demitir")
        .setDescription("Demitir um militar")
        .addUserOption(option =>
          option.setName("membro").setDescription("Militar").setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

      new SlashCommandBuilder()
        .setName("ficha")
        .setDescription("Ver ficha de um militar")
        .addUserOption(option =>
          option.setName("membro").setDescription("Militar").setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

      new SlashCommandBuilder()
        .setName("operacao")
        .setDescription("Criar anúncio de operação")
        .addStringOption(option =>
          option.setName("nome").setDescription("Nome da operação").setRequired(true)
        )
        .addChannelOption(option =>
          option.setName("canal").setDescription("Canal do anúncio").setRequired(false)
        )
        .addStringOption(option =>
          option.setName("imagem").setDescription("Link da imagem (opcional)").setRequired(false)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

      new SlashCommandBuilder()
        .setName("alerta")
        .setDescription("Enviar alerta rápido")
        .addStringOption(option =>
          option.setName("mensagem").setDescription("Mensagem do alerta").setRequired(true)
        )
        .addChannelOption(option =>
          option.setName("canal").setDescription("Canal do alerta").setRequired(false)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

      new SlashCommandBuilder()
        .setName("ponto")
        .setDescription("Abrir seu ponto eletrônico"),

      new SlashCommandBuilder()
        .setName("ia")
        .setDescription("Perguntar para a IA do CBM")
        .addStringOption(option =>
          option
            .setName("pergunta")
            .setDescription("Pergunta para a IA")
            .setRequired(true)
        ),

      new SlashCommandBuilder()
        .setName("relatorio")
        .setDescription("Criar relatório de ocorrência")
        .addStringOption(option =>
          option
            .setName("titulo")
            .setDescription("Título do relatório")
            .setRequired(true)
        )
        .addStringOption(option =>
          option
            .setName("tipo")
            .setDescription("Tipo da ocorrência")
            .setRequired(true)
        )
        .addStringOption(option =>
          option
            .setName("local")
            .setDescription("Local da ocorrência")
            .setRequired(true)
        )
        .addStringOption(option =>
          option
            .setName("descricao")
            .setDescription("Descrição completa")
            .setRequired(true)
        )
        .addStringOption(option =>
          option
            .setName("envolvidos")
            .setDescription("Envolvidos na ocorrência")
            .setRequired(false)
        )
        .addChannelOption(option =>
          option
            .setName("canal")
            .setDescription("Canal onde enviar o relatório")
            .setRequired(false)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    ].map(c => c.toJSON());

    const rest = new REST({ version: "10" }).setToken(TOKEN);

    await rest.put(
      Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
      { body: comandos }
    );

    console.log("✅ Slash commands registrados.");
  } catch (err) {
    console.error("❌ Erro ao registrar comandos:", err);
  }
}

// ===================== READY =====================
client.once(Events.ClientReady, async () => {
  console.log(`🔥 Bot online: ${client.user.tag}`);

  await registrarComandos();
  await garantirPainel();

  setInterval(async () => {
    await garantirPainel();
  }, 5 * 60 * 1000);
});

// ===================== INTERAÇÕES =====================
client.on(Events.InteractionCreate, async (interaction) => {
  try {
    // ---------- SLASH COMMANDS ----------
    if (interaction.isChatInputCommand()) {
      if (interaction.commandName === "anuncio") {
        if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
          await interaction.reply({
            content: "❌ Você não tem permissão para usar este comando.",
            ephemeral: true
          });
          return;
        }

        const modal = new ModalBuilder()
          .setCustomId("modal_anuncio")
          .setTitle("Criar Anúncio");

        const tituloInput = new TextInputBuilder()
          .setCustomId("titulo")
          .setLabel("Título do anúncio")
          .setPlaceholder("Ex: Operação Fênix")
          .setStyle(TextInputStyle.Short)
          .setRequired(true);

        const mensagemInput = new TextInputBuilder()
          .setCustomId("mensagem")
          .setLabel("Mensagem")
          .setPlaceholder("Use \\n para quebrar linha")
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(true);

        const canalInput = new TextInputBuilder()
          .setCustomId("canal")
          .setLabel("ID do canal")
          .setPlaceholder("Cole o ID do canal")
          .setStyle(TextInputStyle.Short)
          .setRequired(true);

        const imagemInput = new TextInputBuilder()
          .setCustomId("imagem")
          .setLabel("Link da imagem (opcional)")
          .setPlaceholder("https://...")
          .setStyle(TextInputStyle.Short)
          .setRequired(false);

        modal.addComponents(
          new ActionRowBuilder().addComponents(tituloInput),
          new ActionRowBuilder().addComponents(mensagemInput),
          new ActionRowBuilder().addComponents(canalInput),
          new ActionRowBuilder().addComponents(imagemInput)
        );

        await interaction.showModal(modal);
        return;
      }

      if (interaction.commandName === "promover" || interaction.commandName === "rebaixar") {
        if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
          await interaction.reply({
            content: "❌ Você não tem permissão.",
            ephemeral: true
          });
          return;
        }

        const membro = await interaction.guild.members.fetch(
          interaction.options.getUser("membro").id
        ).catch(() => null);

        const cargoNome = interaction.options.getString("cargo");
        if (!membro) {
          await interaction.reply({ content: "❌ Membro não encontrado.", ephemeral: true });
          return;
        }

        const partesNick = (membro.displayName || membro.user.username).split("|");
        const nomeAtualLimpo = limparPrefixoDoNick(partesNick[0]).trim();
        const idAtualLimpo = partesNick[1]?.trim() || "0000";

        const nomeBase = interaction.options.getString("nome") || nomeAtualLimpo || membro.user.username;
        const idBase = interaction.options.getString("id") || idAtualLimpo;

        const { prefixo, apelidoFinal } = await aplicarCargoENickname(
          membro,
          cargoNome,
          nomeBase,
          idBase
        );

        const titulo = interaction.commandName === "promover" ? "✅ Militar Promovido" : "🔻 Militar Rebaixado";

        const embed = new EmbedBuilder()
          .setColor(interaction.commandName === "promover" ? 0x00b300 : 0xff9900)
          .setTitle(titulo)
          .setDescription(
            `**Militar:** ${membro}\n` +
            `**Novo cargo:** ${cargoNome}\n` +
            `**Prefixo:** ${prefixo}\n` +
            `**Nome:** ${nomeBase}\n` +
            `**ID:** ${idBase}\n` +
            `**Apelido final:** ${apelidoFinal}\n` +
            `**Executado por:** ${interaction.user}`
          )
          .setTimestamp();

        await interaction.reply({ embeds: [embed] });
        return;
      }

      if (interaction.commandName === "demitir") {
        if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
          await interaction.reply({
            content: "❌ Você não tem permissão.",
            ephemeral: true
          });
          return;
        }

        const membro = await interaction.guild.members.fetch(
          interaction.options.getUser("membro").id
        ).catch(() => null);

        if (!membro) {
          await interaction.reply({ content: "❌ Membro não encontrado.", ephemeral: true });
          return;
        }

        await removerCargosDePatente(membro);
        await removerCargosExtrasCBM(membro);

        if (membro.roles.cache.has(CARGO_REMOVER)) {
          await membro.roles.remove(CARGO_REMOVER).catch(() => {});
        }

        await membro.setNickname(null).catch(() => {});

        const embed = new EmbedBuilder()
          .setColor(0xcc0000)
          .setTitle("❌ Militar Demitido")
          .setDescription(
            `**Militar:** ${membro}\n` +
            `**Executado por:** ${interaction.user}\n` +
            `**Status:** DESLIGADO`
          )
          .setTimestamp();

        await interaction.reply({ embeds: [embed] });
        return;
      }

      if (interaction.commandName === "ficha") {
        if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
          await interaction.reply({
            content: "❌ Você não tem permissão.",
            ephemeral: true
          });
          return;
        }

        const membro = await interaction.guild.members.fetch(
          interaction.options.getUser("membro").id
        ).catch(() => null);

        if (!membro) {
          await interaction.reply({ content: "❌ Membro não encontrado.", ephemeral: true });
          return;
        }

        const cargosVisiveis = membro.roles.cache
          .filter(r => r.id !== interaction.guild.id)
          .map(r => r.name)
          .reverse()
          .join(", ") || "Nenhum";

        const embed = new EmbedBuilder()
          .setColor(0x2b8cff)
          .setTitle("🪪 Ficha Militar")
          .setDescription(
            `**Militar:** ${membro}\n` +
            `**Apelido:** ${membro.displayName}\n` +
            `**ID Discord:** ${membro.id}\n` +
            `**Cargos:** ${cargosVisiveis}`
          )
          .setThumbnail(membro.user.displayAvatarURL())
          .setTimestamp();

        await interaction.reply({ embeds: [embed], ephemeral: true });
        return;
      }

      if (interaction.commandName === "operacao") {
        if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
          await interaction.reply({
            content: "❌ Você não tem permissão.",
            ephemeral: true
          });
          return;
        }

        const nome = interaction.options.getString("nome");
        const canal = interaction.options.getChannel("canal") || interaction.channel;
        const imagem = interaction.options.getString("imagem");

        if (!canal || !canal.isTextBased()) {
          await interaction.reply({ content: "❌ Canal inválido.", ephemeral: true });
          return;
        }

        const embed = new EmbedBuilder()
          .setColor(0xff0000)
          .setTitle("🚨 NOVA OPERAÇÃO")
          .setDescription(
            `━━━━━━━━━━━━━━━━━━━━\n\n` +
            `**${nome.toUpperCase()}**\n\n` +
            `Todas as unidades deverão comparecer.\n\n` +
            `━━━━━━━━━━━━━━━━━━━━`
          )
          .setFooter({ text: `Operação criada por ${interaction.user.username}` })
          .setTimestamp();

        if (imagem && imagem.startsWith("http")) {
          embed.setImage(imagem);
        }

        await canal.send({ embeds: [embed] });
        await interaction.reply({ content: `✅ Operação enviada em ${canal}.`, ephemeral: true });
        return;
      }

      if (interaction.commandName === "alerta") {
        if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
          await interaction.reply({
            content: "❌ Você não tem permissão.",
            ephemeral: true
          });
          return;
        }

        const msg = interaction.options.getString("mensagem").replace(/\\n/g, "\n");
        const canal = interaction.options.getChannel("canal") || interaction.channel;

        if (!canal || !canal.isTextBased()) {
          await interaction.reply({ content: "❌ Canal inválido.", ephemeral: true });
          return;
        }

        const embed = new EmbedBuilder()
          .setColor(0xff9900)
          .setTitle("⚠️ ALERTA")
          .setDescription(`━━━━━━━━━━━━━━━━━━━━\n\n${msg}\n\n━━━━━━━━━━━━━━━━━━━━`)
          .setFooter({ text: `Alerta enviado por ${interaction.user.username}` })
          .setTimestamp();

        await canal.send({ embeds: [embed] });
        await interaction.reply({ content: `✅ Alerta enviado em ${canal}.`, ephemeral: true });
        return;
      }

      if (interaction.commandName === "ponto") {
        const id = interaction.user.id;

        if (pontos.has(id)) {
          await interaction.reply({
            content: "⚠️ Você já tem um ponto aberto.",
            ephemeral: true
          });
          return;
        }

        const ponto = {
          inicio: Date.now(),
          pausas: [],
          emPausa: false,
          pausaInicio: null,
          fim: null,
          msg: null
        };

        pontos.set(id, ponto);

        await atualizarPonto(interaction.guild, interaction.user, ponto, false);

        await interaction.reply({
          content: "✅ Ponto iniciado no canal de registro.",
          ephemeral: true
        });
        return;
      }

      if (interaction.commandName === "ia") {
        const pergunta = interaction.options.getString("pergunta");

        await interaction.deferReply();

        try {
          const resposta = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
              {
                role: "system",
                content:
                  "Você é um instrutor profissional do Corpo de Bombeiros Militar. Responda em português do Brasil, de forma clara, objetiva, profissional e útil para ambiente operacional e roleplay."
              },
              {
                role: "user",
                content: pergunta
              }
            ]
          });

          const texto = resposta.choices[0]?.message?.content || "Sem resposta.";

          const embed = new EmbedBuilder()
            .setColor(0xcc0000)
            .setTitle("🚒 CENTRAL DE INTELIGÊNCIA CBM")
            .setDescription(
              `**Pergunta:** ${pergunta}\n\n` +
              `**Resposta:**\n${texto.slice(0, 3500)}`
            )
            .setTimestamp();

          await interaction.editReply({ embeds: [embed] });
        } catch (error) {
          console.error("Erro na IA:", error);
          await interaction.editReply("❌ Erro ao consultar a IA.");
        }

        return;
      }

      if (interaction.commandName === "relatorio") {
        if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
          await interaction.reply({
            content: "❌ Você não tem permissão.",
            ephemeral: true
          });
          return;
        }

        const titulo = interaction.options.getString("titulo");
        const tipo = interaction.options.getString("tipo");
        const local = interaction.options.getString("local");
        const descricao = interaction.options.getString("descricao");
        const envolvidos = interaction.options.getString("envolvidos") || "Não informado";
        const canal = interaction.options.getChannel("canal") || interaction.channel;

        if (!canal || !canal.isTextBased()) {
          await interaction.reply({
            content: "❌ Canal inválido.",
            ephemeral: true
          });
          return;
        }

        const embed = new EmbedBuilder()
          .setColor(0x2b8cff)
          .setTitle(`📋 RELATÓRIO • ${titulo.toUpperCase()}`)
          .setDescription(
            `**Tipo:** ${tipo}\n` +
            `**Local:** ${local}\n` +
            `**Envolvidos:** ${envolvidos}\n\n` +
            `**Descrição da ocorrência:**\n${descricao}`
          )
          .setFooter({
            text: `Relatório enviado por ${interaction.user.username}`
          })
          .setTimestamp();

        await canal.send({ embeds: [embed] });

        await interaction.reply({
          content: `✅ Relatório enviado em ${canal}.`,
          ephemeral: true
        });

        return;
      }
    }

    // ---------- BOTÕES ----------
    if (interaction.isButton() && interaction.customId === "abrir_form") {
      const modal = new ModalBuilder()
        .setCustomId("form_ingresso_cbm")
        .setTitle("Formulário de Ingresso");

      const qraInput = new TextInputBuilder()
        .setCustomId("qra")
        .setLabel("Nome / QRA")
        .setPlaceholder("Ex: Luiz Henrique")
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

    if (interaction.isButton() && ["pausar", "voltar", "finalizar"].includes(interaction.customId)) {
      const ponto = pontos.get(interaction.user.id);
      if (!ponto) {
        await interaction.reply({ content: "❌ Você não possui ponto aberto.", ephemeral: true });
        return;
      }

      if (interaction.customId === "pausar") {
        if (ponto.emPausa) {
          await interaction.reply({ content: "⚠️ Já está pausado.", ephemeral: true });
          return;
        }

        ponto.emPausa = true;
        ponto.pausaInicio = Date.now();

        await atualizarPonto(interaction.guild, interaction.user, ponto, false);
        await interaction.reply({ content: "⏸️ Ponto pausado.", ephemeral: true });
        return;
      }

      if (interaction.customId === "voltar") {
        if (!ponto.emPausa || !ponto.pausaInicio) {
          await interaction.reply({ content: "⚠️ Seu ponto não está pausado.", ephemeral: true });
          return;
        }

        ponto.pausas.push({
          inicio: ponto.pausaInicio,
          fim: Date.now()
        });

        ponto.emPausa = false;
        ponto.pausaInicio = null;

        await atualizarPonto(interaction.guild, interaction.user, ponto, false);
        await interaction.reply({ content: "▶️ Ponto retomado.", ephemeral: true });
        return;
      }

      if (interaction.customId === "finalizar") {
        if (ponto.emPausa && ponto.pausaInicio) {
          ponto.pausas.push({
            inicio: ponto.pausaInicio,
            fim: Date.now()
          });
          ponto.emPausa = false;
          ponto.pausaInicio = null;
        }

        ponto.fim = Date.now();

        await atualizarPonto(interaction.guild, interaction.user, ponto, true);
        pontos.delete(interaction.user.id);

        await interaction.reply({ content: "📁 Ponto finalizado.", ephemeral: true });
        return;
      }
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

      const membro = await interaction.guild.members.fetch(userId).catch(() => null);
      if (!membro) {
        await interaction.reply({
          content: "❌ Não consegui encontrar o membro.",
          ephemeral: true
        });
        return;
      }

      const embedAtual = interaction.message.embeds?.[0];
      const descricao = embedAtual?.data?.description || embedAtual?.description || "";

      const nomeFormulario = extrairCampo(descricao, "Nome/QRA") || membro.user.username;
      const idFormulario = extrairCampo(descricao, "ID") || "0000";

      const { prefixo, apelidoFinal, configCargo } = await aplicarCargoENickname(
        membro,
        cargoNome,
        nomeFormulario,
        idFormulario
      );

      const nomesExtras = (configCargo.extras || []).length > 0 ? " + cargos extras" : "";

      const embedAprovado = new EmbedBuilder()
        .setColor(0x00b300)
        .setTitle("✅ Solicitação Aprovada")
        .setDescription(
          `**Militar:** ${membro}\n` +
          `**Cargo aplicado:** ${cargoNome}${nomesExtras}\n` +
          `**Prefixo definido:** ${prefixo}\n` +
          `**Nome aplicado:** ${nomeFormulario}\n` +
          `**ID aplicado:** ${idFormulario}\n` +
          `**Apelido final:** ${apelidoFinal}\n` +
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

    // ---------- SELECT MENU ----------
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

    // ---------- MODAIS ----------
    if (interaction.isModalSubmit() && interaction.customId === "modal_anuncio") {
      if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
        await interaction.reply({
          content: "❌ Você não tem permissão para usar este comando.",
          ephemeral: true
        });
        return;
      }

      const titulo = interaction.fields.getTextInputValue("titulo");
      const mensagemBruta = interaction.fields.getTextInputValue("mensagem");
      const canalId = interaction.fields.getTextInputValue("canal");
      const imagem = interaction.fields.getTextInputValue("imagem");

      const canal = await interaction.guild.channels.fetch(canalId).catch(() => null);
      if (!canal || !canal.isTextBased()) {
        await interaction.reply({
          content: "❌ Canal inválido. Verifique o ID do canal.",
          ephemeral: true
        });
        return;
      }

      const mensagem = mensagemBruta.replace(/\\n/g, "\n");

      const embed = new EmbedBuilder()
        .setColor(0xcc0000)
        .setTitle(`🚒 ${titulo.toUpperCase()}`)
        .setDescription(`━━━━━━━━━━━━━━━━━━━━\n\n${mensagem}\n\n━━━━━━━━━━━━━━━━━━━━`)
        .setFooter({ text: `CBM • Anúncio enviado por ${interaction.user.username}` })
        .setTimestamp();

      if (imagem && imagem.startsWith("http")) {
        embed.setImage(imagem);
      }

      await canal.send({ embeds: [embed] });

      await interaction.reply({
        content: `✅ Anúncio enviado em ${canal}.`,
        ephemeral: true
      });
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

// ===================== ERROS =====================
process.on("unhandledRejection", (reason) => {
  console.error("❌ UNHANDLED REJECTION:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("❌ UNCAUGHT EXCEPTION:", error);
});

client.on("error", (error) => {
  console.error("❌ CLIENT ERROR:", error);
});

client.on("warn", (info) => {
  console.warn("⚠️ WARN:", info);
});

// ===================== START =====================
if (!validarEnv()) {
  process.exit(1);
}

http.createServer((req, res) => {
  res.end("BOT ONLINE");
}).listen(process.env.PORT || 3000, () => {
  console.log("🌐 Servidor web ativo");
});

client.login(TOKEN);
