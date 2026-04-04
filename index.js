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
const http = require("http");
const fs = require("fs");
const path = require("path");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers
  ]
});

// ===================== VARIÁVEIS =====================
const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

const CANAL_PORTARIA = process.env.CANAL_PORTARIA;
const CANAL_APROVACAO = process.env.CANAL_APROVACAO;
const CANAL_PONTO = process.env.CANAL_PONTO;
const CANAL_LOGS = process.env.CANAL_LOGS || "";
const CARGO_AGUARDANDO = process.env.CARGO_AGUARDANDO || "";

const CARGO_REMOVER = process.env.CARGO_REMOVER || "1483562465823559696";

// ===================== ARQUIVOS =====================
const DATA_DIR = path.join(__dirname, "data");
const PANEL_FILE = path.join(DATA_DIR, "panel.json");
const PONTOS_FILE = path.join(DATA_DIR, "pontos.json");

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

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

// ===================== UTIL =====================
function validarEnv() {
  const faltando = [];

  if (!TOKEN) faltando.push("TOKEN");
  if (!CLIENT_ID) faltando.push("CLIENT_ID");
  if (!GUILD_ID) faltando.push("GUILD_ID");
  if (!CANAL_PORTARIA) faltando.push("CANAL_PORTARIA");
  if (!CANAL_APROVACAO) faltando.push("CANAL_APROVACAO");
  if (!CANAL_PONTO) faltando.push("CANAL_PONTO");

  if (faltando.length) {
    console.error("❌ Variáveis ausentes:", faltando.join(", "));
    return false;
  }

  return true;
}

function lerJson(file, fallback) {
  try {
    if (!fs.existsSync(file)) return fallback;
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return fallback;
  }
}

function salvarJson(file, data) {
  try {
    fs.writeFileSync(file, JSON.stringify(data, null, 2), "utf8");
  } catch (err) {
    console.log("⚠️ Erro ao salvar JSON:", err.message);
  }
}

function carregarDados() {
  const panelData = lerJson(PANEL_FILE, { mensagemPainel: "" });
  MENSAGEM_PAINEL = panelData.mensagemPainel || "";

  const pontosData = lerJson(PONTOS_FILE, {});
  for (const [userId, ponto] of Object.entries(pontosData)) {
    pontos.set(userId, ponto);
  }
}

function salvarPainel() {
  salvarJson(PANEL_FILE, { mensagemPainel: MENSAGEM_PAINEL });
}

function salvarPontos() {
  const obj = {};
  for (const [userId, ponto] of pontos.entries()) {
    obj[userId] = ponto;
  }
  salvarJson(PONTOS_FILE, obj);
}

function logConsole(txt) {
  console.log(txt);
}

async function enviarLogDiscord(titulo, descricao, cor = 0xcc0000) {
  try {
    if (!CANAL_LOGS) return;
    const canal = await client.channels.fetch(CANAL_LOGS).catch(() => null);
    if (!canal || !canal.isTextBased()) return;

    const embed = new EmbedBuilder()
      .setColor(cor)
      .setTitle(titulo)
      .setDescription(descricao)
      .setTimestamp();

    await canal.send({ embeds: [embed] }).catch(() => {});
  } catch {}
}

function extrairCampo(descricao, rotulo) {
  const linhas = String(descricao || "").split("\n");
  const alvo = linhas.find(l => l.startsWith(`**${rotulo}:**`));
  if (!alvo) return null;
  return alvo.replace(`**${rotulo}:**`, "").trim();
}

function getTodosCargosIds() {
  const ids = [];
  for (const cargo of Object.values(CARGOS)) {
    if (!ids.includes(cargo.principal)) ids.push(cargo.principal);
    for (const extra of cargo.extras || []) {
      if (!ids.includes(extra)) ids.push(extra);
    }
  }
  return ids;
}

function usuarioTemPermAdmin(interaction) {
  return interaction.memberPermissions?.has(PermissionFlagsBits.Administrator);
}

function formatarDuracao(ms) {
  const totalSegundos = Math.floor(ms / 1000);
  const horas = Math.floor(totalSegundos / 3600);
  const minutos = Math.floor((totalSegundos % 3600) / 60);
  const segundos = totalSegundos % 60;
  return `${horas}h ${minutos}m ${segundos}s`;
}

function limitarNickname(prefixo, nomeBase, idBase) {
  const fixo = `${prefixo}  | ${idBase}`;
  const max = 32;
  const disponivel = max - fixo.length;

  let nome = String(nomeBase || "SemNome").trim();
  if (nome.length > disponivel) {
    nome = nome.slice(0, Math.max(1, disponivel));
  }

  return `${prefixo} ${nome} | ${idBase}`.slice(0, 32);
}

async function removerCargosDePatente(membro) {
  const ids = getTodosCargosIds();
  const remover = ids.filter(id => membro.roles.cache.has(id));

  if (remover.length) {
    await membro.roles.remove(remover).catch(() => {});
  }
}

async function aplicarCargoENickname(membro, cargoNome, nomeBase, idBase) {
  const configCargo = CARGOS[cargoNome];
  if (!configCargo) throw new Error(`Cargo inválido: ${cargoNome}`);

  await removerCargosDePatente(membro);

  const cargosParaAdicionar = [configCargo.principal, ...(configCargo.extras || [])];

  for (const cargoId of cargosParaAdicionar) {
    const cargo = membro.guild.roles.cache.get(cargoId);
    if (cargo) {
      await membro.roles.add(cargo).catch((err) => {
        logConsole(`⚠️ Não foi possível adicionar cargo ${cargoId}: ${err.message}`);
      });
    }
  }

  if (CARGO_AGUARDANDO && membro.roles.cache.has(CARGO_AGUARDANDO)) {
    await membro.roles.remove(CARGO_AGUARDANDO).catch(() => {});
  }

  if (CARGO_REMOVER && membro.roles.cache.has(CARGO_REMOVER)) {
    await membro.roles.remove(CARGO_REMOVER).catch(() => {});
  }

  const prefixo = configCargo.prefixo || "[CBM]";
  const apelidoFinal = limitarNickname(prefixo, nomeBase, idBase);

  await membro.setNickname(apelidoFinal).catch((err) => {
    logConsole(`⚠️ Não consegui alterar apelido: ${err.message}`);
  });

  return { prefixo, apelidoFinal, configCargo };
}

// ===================== PONTO =====================
function calcularTempoPonto(ponto, finalizado = false) {
  const agora = Date.now();
  let tempoPausa = 0;

  for (const pausa of ponto.pausas || []) {
    tempoPausa += (pausa.fim - pausa.inicio);
  }

  if (ponto.emPausa && ponto.pausaInicio) {
    tempoPausa += (agora - ponto.pausaInicio);
  }

  const fimBase = finalizado && ponto.fim ? ponto.fim : agora;
  const tempoTotal = Math.max(0, fimBase - ponto.inicio - tempoPausa);

  return {
    tempoPausa,
    tempoTotal
  };
}

function criarEmbedPonto(user, ponto, finalizado = false) {
  const { tempoTotal } = calcularTempoPonto(ponto, finalizado);

  return new EmbedBuilder()
    .setColor(finalizado ? 0xcc0000 : ponto.emPausa ? 0xff9900 : 0x00b300)
    .setTitle(finalizado ? "📁 Ponto Finalizado" : "📂 Bate-Ponto")
    .setDescription(
      `👤 **Usuário:** ${user}\n` +
      `⏱️ **Início:** <t:${Math.floor(ponto.inicio / 1000)}:F>\n` +
      (ponto.fim ? `🏁 **Fim:** <t:${Math.floor(ponto.fim / 1000)}:F>\n` : "") +
      `📊 **Tempo:** ${formatarDuracao(tempoTotal)}\n` +
      `📌 **Status:** ${finalizado ? "FINALIZADO" : ponto.emPausa ? "PAUSADO" : "EM SERVIÇO"}`
    )
    .setFooter({ text: "Sistema de ponto • CBM BOT" })
    .setTimestamp();
}

function botoesPonto(pausa) {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("pausar")
        .setLabel("Pausar")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(pausa),
      new ButtonBuilder()
        .setCustomId("voltar")
        .setLabel("Voltar")
        .setStyle(ButtonStyle.Success)
        .setDisabled(!pausa),
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

  const embed = criarEmbedPonto(user, ponto, finalizado);
  const comps = finalizado ? [] : botoesPonto(ponto.emPausa);

  if (ponto.msg) {
    const msg = await canal.messages.fetch(ponto.msg).catch(() => null);
    if (msg) {
      await msg.edit({ embeds: [embed], components: comps }).catch(() => {});
      return;
    }
  }

  const nova = await canal.send({
    content: `${user}`,
    embeds: [embed],
    components: comps
  }).catch(() => null);

  if (nova) {
    ponto.msg = nova.id;
    salvarPontos();
  }
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
    if (!canalPortaria || !canalPortaria.isTextBased()) {
      logConsole("❌ Canal da portaria não encontrado.");
      return;
    }

    const payload = montarPayloadPainel();

    if (MENSAGEM_PAINEL) {
      const msg = await canalPortaria.messages.fetch(MENSAGEM_PAINEL).catch(() => null);
      if (msg) {
        await msg.edit(payload).catch(() => {});
        logConsole("✅ Painel atualizado pelo ID salvo.");
        return;
      }
    }

    const mensagens = await canalPortaria.messages.fetch({ limit: 30 }).catch(() => null);
    if (mensagens) {
      const antiga = mensagens.find((m) =>
        m.author?.id === client.user.id &&
        m.embeds?.[0]?.title === "🚒 Sistema de Ingresso - Corpo de Bombeiros Militar"
      );

      if (antiga) {
        await antiga.edit(payload).catch(() => {});
        MENSAGEM_PAINEL = antiga.id;
        salvarPainel();
        logConsole("✅ Painel antigo encontrado e atualizado.");
        logConsole(`👉 ID DO PAINEL: ${MENSAGEM_PAINEL}`);
        return;
      }
    }

    const nova = await canalPortaria.send(payload);
    await nova.pin().catch(() => {});
    MENSAGEM_PAINEL = nova.id;
    salvarPainel();

    logConsole("📌 Novo painel criado e fixado.");
    logConsole(`👉 ID DA MENSAGEM DO PAINEL: ${MENSAGEM_PAINEL}`);
  } catch (err) {
    logConsole(`❌ Erro ao garantir painel: ${err.message}`);
  }
}

// ===================== COMANDOS =====================
async function registrarComandos() {
  try {
    const comandos = [
      new SlashCommandBuilder()
        .setName("anuncio")
        .setDescription("Abrir modal para anúncio")
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

      new SlashCommandBuilder()
        .setName("painel")
        .setDescription("Atualizar ou recriar painel")
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

      new SlashCommandBuilder()
        .setName("statusbot")
        .setDescription("Ver status do bot")
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
          option.setName("nome").setDescription("Nome/QRA").setRequired(false)
        )
        .addStringOption(option =>
          option.setName("id").setDescription("ID").setRequired(false)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

      new SlashCommandBuilder()
        .setName("rebaixar")
        .setDescription("Rebaixar um militar")
        .addUserOption(option =>
          option.setName("membro").setDescription("Militar").setRequired(true)
        )
        .addStringOption(option =>
          option.setName("cargo").setDescription("Cargo destino").setRequired(true)
            .addChoices(...Object.keys(CARGOS).map(nome => ({ name: nome, value: nome })))
        )
        .addStringOption(option =>
          option.setName("nome").setDescription("Nome/QRA").setRequired(false)
        )
        .addStringOption(option =>
          option.setName("id").setDescription("ID").setRequired(false)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

      new SlashCommandBuilder()
        .setName("admitir")
        .setDescription("Admite direto um militar")
        .addUserOption(option =>
          option.setName("membro").setDescription("Militar").setRequired(true)
        )
        .addStringOption(option =>
          option.setName("cargo").setDescription("Cargo").setRequired(true)
            .addChoices(...Object.keys(CARGOS).map(nome => ({ name: nome, value: nome })))
        )
        .addStringOption(option =>
          option.setName("nome").setDescription("Nome/QRA").setRequired(true)
        )
        .addStringOption(option =>
          option.setName("id").setDescription("ID").setRequired(true)
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
          option.setName("canal").setDescription("Canal").setRequired(false)
        )
        .addStringOption(option =>
          option.setName("imagem").setDescription("Link da imagem").setRequired(false)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

      new SlashCommandBuilder()
        .setName("alerta")
        .setDescription("Enviar alerta rápido")
        .addStringOption(option =>
          option.setName("mensagem").setDescription("Mensagem").setRequired(true)
        )
        .addChannelOption(option =>
          option.setName("canal").setDescription("Canal").setRequired(false)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

      new SlashCommandBuilder()
        .setName("ponto")
        .setDescription("Abrir seu ponto eletrônico"),

      new SlashCommandBuilder()
        .setName("meuponto")
        .setDescription("Ver status do seu ponto"),

      new SlashCommandBuilder()
        .setName("pontostaff")
        .setDescription("Ver ponto de um militar")
        .addUserOption(option =>
          option.setName("membro").setDescription("Militar").setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

      new SlashCommandBuilder()
        .setName("ping")
        .setDescription("Ver latência do bot"),

      new SlashCommandBuilder()
        .setName("ajuda")
        .setDescription("Ver comandos do bot")
    ].map(c => c.toJSON());

    const rest = new REST({ version: "10" }).setToken(TOKEN);

    await rest.put(
      Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
      { body: comandos }
    );

    logConsole("✅ Slash commands registrados.");
  } catch (err) {
    console.error("❌ Erro ao registrar comandos:", err);
  }
}

// ===================== READY =====================
client.once(Events.ClientReady, async () => {
  logConsole(`🔥 Bot online: ${client.user.tag}`);

  carregarDados();
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
      if (interaction.commandName === "ping") {
        await interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor(0x2b8cff)
              .setTitle("🏓 Ping do Bot")
              .setDescription(
                `**Latência WebSocket:** ${client.ws.ping}ms`
              )
              .setTimestamp()
          ],
          ephemeral: true
        });
        return;
      }

      if (interaction.commandName === "ajuda") {
        const embed = new EmbedBuilder()
          .setColor(0xcc0000)
          .setTitle("📖 Comandos do CBM BOT")
          .setDescription(
            "**Administração**\n" +
            "`/painel`, `/statusbot`, `/anuncio`, `/promover`, `/rebaixar`, `/admitir`, `/demitir`, `/ficha`, `/operacao`, `/alerta`, `/pontostaff`\n\n" +
            "**Militar**\n" +
            "`/ponto`, `/meuponto`\n\n" +
            "**Utilitários**\n" +
            "`/ping`, `/ajuda`"
          )
          .setFooter({ text: "CBM BOT" })
          .setTimestamp();

        await interaction.reply({ embeds: [embed], ephemeral: true });
        return;
      }

      if (interaction.commandName === "statusbot") {
        if (!usuarioTemPermAdmin(interaction)) {
          await interaction.reply({ content: "❌ Você não tem permissão.", ephemeral: true });
          return;
        }

        const embed = new EmbedBuilder()
          .setColor(0x00b300)
          .setTitle("📡 Status do Bot")
          .setDescription(
            `**Bot:** Online\n` +
            `**Ping:** ${client.ws.ping}ms\n` +
            `**Guild ID:** ${GUILD_ID}\n` +
            `**Canal Portaria:** <#${CANAL_PORTARIA}>\n` +
            `**Canal Aprovação:** <#${CANAL_APROVACAO}>\n` +
            `**Canal Ponto:** <#${CANAL_PONTO}>\n` +
            `**Canal Logs:** ${CANAL_LOGS ? `<#${CANAL_LOGS}>` : "Não configurado"}\n` +
            `**Painel ID:** ${MENSAGEM_PAINEL || "Não definido"}\n` +
            `**Pontos abertos:** ${pontos.size}`
          )
          .setTimestamp();

        await interaction.reply({ embeds: [embed], ephemeral: true });
        return;
      }

      if (interaction.commandName === "painel") {
        if (!usuarioTemPermAdmin(interaction)) {
          await interaction.reply({ content: "❌ Você não tem permissão.", ephemeral: true });
          return;
        }

        await garantirPainel();

        await interaction.reply({
          content: "✅ Painel verificado/atualizado com sucesso.",
          ephemeral: true
        });
        return;
      }

      if (interaction.commandName === "anuncio") {
        if (!usuarioTemPermAdmin(interaction)) {
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

      if (["promover", "rebaixar"].includes(interaction.commandName)) {
        if (!usuarioTemPermAdmin(interaction)) {
          await interaction.reply({ content: "❌ Você não tem permissão.", ephemeral: true });
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
        const nomeAtualLimpo = partesNick[0].replace(/^\[[^\]]+\]\s*/, "").trim();
        const idAtualLimpo = partesNick[1]?.trim() || "0000";

        const nomeBase = interaction.options.getString("nome") || nomeAtualLimpo || membro.user.username;
        const idBase = interaction.options.getString("id") || idAtualLimpo;

        const { prefixo, apelidoFinal } = await aplicarCargoENickname(membro, cargoNome, nomeBase, idBase);

        const titulo = interaction.commandName === "promover"
          ? "✅ Militar Promovido"
          : "🔻 Militar Rebaixado";

        const cor = interaction.commandName === "promover" ? 0x00b300 : 0xff9900;

        const embed = new EmbedBuilder()
          .setColor(cor)
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

        await enviarLogDiscord(
          titulo,
          `**Militar:** ${membro}\n**Cargo:** ${cargoNome}\n**Executado por:** ${interaction.user}`,
          cor
        );
        return;
      }

      if (interaction.commandName === "admitir") {
        if (!usuarioTemPermAdmin(interaction)) {
          await interaction.reply({ content: "❌ Você não tem permissão.", ephemeral: true });
          return;
        }

        const membro = await interaction.guild.members.fetch(
          interaction.options.getUser("membro").id
        ).catch(() => null);

        if (!membro) {
          await interaction.reply({ content: "❌ Membro não encontrado.", ephemeral: true });
          return;
        }

        const cargoNome = interaction.options.getString("cargo");
        const nomeBase = interaction.options.getString("nome");
        const idBase = interaction.options.getString("id");

        const { prefixo, apelidoFinal } = await aplicarCargoENickname(membro, cargoNome, nomeBase, idBase);

        const embed = new EmbedBuilder()
          .setColor(0x00b300)
          .setTitle("✅ Militar Admitido")
          .setDescription(
            `**Militar:** ${membro}\n` +
            `**Cargo aplicado:** ${cargoNome}\n` +
            `**Prefixo:** ${prefixo}\n` +
            `**Nome:** ${nomeBase}\n` +
            `**ID:** ${idBase}\n` +
            `**Apelido final:** ${apelidoFinal}\n` +
            `**Executado por:** ${interaction.user}`
          )
          .setTimestamp();

        await interaction.reply({ embeds: [embed] });

        await enviarLogDiscord(
          "✅ Militar Admitido",
          `**Militar:** ${membro}\n**Cargo:** ${cargoNome}\n**Executado por:** ${interaction.user}`,
          0x00b300
        );
        return;
      }

      if (interaction.commandName === "demitir") {
        if (!usuarioTemPermAdmin(interaction)) {
          await interaction.reply({ content: "❌ Você não tem permissão.", ephemeral: true });
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

        if (CARGO_REMOVER && membro.roles.cache.has(CARGO_REMOVER)) {
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

        await enviarLogDiscord(
          "❌ Militar Demitido",
          `**Militar:** ${membro}\n**Executado por:** ${interaction.user}`,
          0xcc0000
        );
        return;
      }

      if (interaction.commandName === "ficha") {
        if (!usuarioTemPermAdmin(interaction)) {
          await interaction.reply({ content: "❌ Você não tem permissão.", ephemeral: true });
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
        if (!usuarioTemPermAdmin(interaction)) {
          await interaction.reply({ content: "❌ Você não tem permissão.", ephemeral: true });
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
        if (!usuarioTemPermAdmin(interaction)) {
          await interaction.reply({ content: "❌ Você não tem permissão.", ephemeral: true });
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
        salvarPontos();

        await atualizarPonto(interaction.guild, interaction.user, ponto, false);

        await interaction.reply({
          content: "✅ Ponto iniciado no canal de registro.",
          ephemeral: true
        });

        await enviarLogDiscord(
          "📂 Ponto iniciado",
          `**Usuário:** ${interaction.user}\n**ID:** ${interaction.user.id}`,
          0x00b300
        );
        return;
      }

      if (interaction.commandName === "meuponto") {
        const ponto = pontos.get(interaction.user.id);

        if (!ponto) {
          await interaction.reply({
            content: "❌ Você não possui ponto aberto.",
            ephemeral: true
          });
          return;
        }

        const { tempoTotal } = calcularTempoPonto(ponto, false);

        const embed = new EmbedBuilder()
          .setColor(ponto.emPausa ? 0xff9900 : 0x00b300)
          .setTitle("📂 Meu Ponto")
          .setDescription(
            `**Usuário:** ${interaction.user}\n` +
            `**Início:** <t:${Math.floor(ponto.inicio / 1000)}:F>\n` +
            `**Tempo atual:** ${formatarDuracao(tempoTotal)}\n` +
            `**Status:** ${ponto.emPausa ? "PAUSADO" : "EM SERVIÇO"}`
          )
          .setTimestamp();

        await interaction.reply({ embeds: [embed], ephemeral: true });
        return;
      }

      if (interaction.commandName === "pontostaff") {
        if (!usuarioTemPermAdmin(interaction)) {
          await interaction.reply({ content: "❌ Você não tem permissão.", ephemeral: true });
          return;
        }

        const user = interaction.options.getUser("membro");
        const ponto = pontos.get(user.id);

        if (!ponto) {
          await interaction.reply({
            content: "❌ Este militar não possui ponto aberto.",
            ephemeral: true
          });
          return;
        }

        const { tempoTotal } = calcularTempoPonto(ponto, false);

        const embed = new EmbedBuilder()
          .setColor(ponto.emPausa ? 0xff9900 : 0x2b8cff)
          .setTitle("📋 Ponto do Militar")
          .setDescription(
            `**Militar:** ${user}\n` +
            `**Início:** <t:${Math.floor(ponto.inicio / 1000)}:F>\n` +
            `**Tempo atual:** ${formatarDuracao(tempoTotal)}\n` +
            `**Status:** ${ponto.emPausa ? "PAUSADO" : "EM SERVIÇO"}\n` +
            `**Mensagem:** ${ponto.msg ? ponto.msg : "Não definida"}`
          )
          .setTimestamp();

        await interaction.reply({ embeds: [embed], ephemeral: true });
        return;
      }
    }

    // ---------- BOTÃO FORMULÁRIO ----------
    if (interaction.isButton() && interaction.customId === "abrir_form") {
      const modal = new ModalBuilder()
        .setCustomId("form_ingresso_cbm")
        .setTitle("Formulário de Ingresso");

      const qraInput = new TextInputBuilder()
        .setCustomId("qra")
        .setLabel("Nome / QRA")
        .setPlaceholder("Ex: Luiz Henrique")
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setMaxLength(25);

      const idInput = new TextInputBuilder()
        .setCustomId("id")
        .setLabel("ID")
        .setPlaceholder("Sua ID")
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setMaxLength(10);

      const cargoInput = new TextInputBuilder()
        .setCustomId("cargo")
        .setLabel("Cargo informado")
        .setPlaceholder("Ex: Soldado")
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setMaxLength(30);

      const unidadeInput = new TextInputBuilder()
        .setCustomId("unidade")
        .setLabel("Unidade informada")
        .setPlaceholder("Ex: Bombeiros / CBM")
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setMaxLength(30);

      modal.addComponents(
        new ActionRowBuilder().addComponents(qraInput),
        new ActionRowBuilder().addComponents(idInput),
        new ActionRowBuilder().addComponents(cargoInput),
        new ActionRowBuilder().addComponents(unidadeInput)
      );

      await interaction.showModal(modal);
      return;
    }

    // ---------- BOTÕES DE PONTO ----------
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
        salvarPontos();

        await atualizarPonto(interaction.guild, interaction.user, ponto, false);
        await interaction.reply({ content: "⏸️ Ponto pausado.", ephemeral: true });

        await enviarLogDiscord(
          "⏸️ Ponto pausado",
          `**Usuário:** ${interaction.user}\n**ID:** ${interaction.user.id}`,
          0xff9900
        );
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
        salvarPontos();

        await atualizarPonto(interaction.guild, interaction.user, ponto, false);
        await interaction.reply({ content: "▶️ Ponto retomado.", ephemeral: true });

        await enviarLogDiscord(
          "▶️ Ponto retomado",
          `**Usuário:** ${interaction.user}\n**ID:** ${interaction.user.id}`,
          0x00b300
        );
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

        const { tempoTotal } = calcularTempoPonto(ponto, true);

        pontos.delete(interaction.user.id);
        salvarPontos();

        await interaction.reply({ content: "📁 Ponto finalizado.", ephemeral: true });

        await enviarLogDiscord(
          "📁 Ponto finalizado",
          `**Usuário:** ${interaction.user}\n**Tempo total:** ${formatarDuracao(tempoTotal)}`,
          0xcc0000
        );
        return;
      }
    }

    // ---------- APROVAR ----------
    if (interaction.isButton() && interaction.customId.startsWith("aprovar_")) {
      if (!usuarioTemPermAdmin(interaction)) {
        await interaction.reply({
          content: "❌ Você não tem permissão para aprovar.",
          ephemeral: true
        });
        return;
      }

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

      await enviarLogDiscord(
        "✅ Solicitação Aprovada",
        `**Militar:** ${membro}\n**Cargo:** ${cargoNome}\n**Aprovado por:** ${interaction.user}`,
        0x00b300
      );
      return;
    }

    // ---------- REPROVAR ----------
    if (interaction.isButton() && interaction.customId.startsWith("reprovar_")) {
      if (!usuarioTemPermAdmin(interaction)) {
        await interaction.reply({
          content: "❌ Você não tem permissão para reprovar.",
          ephemeral: true
        });
        return;
      }

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

      await enviarLogDiscord(
        "❌ Solicitação Reprovada",
        `**Militar:** <@${userId}>\n**Reprovado por:** ${interaction.user}`,
        0xcc0000
      );
      return;
    }

    // ---------- SELECT MENU ----------
    if (interaction.isStringSelectMenu() && interaction.customId.startsWith("cargo_")) {
      if (!usuarioTemPermAdmin(interaction)) {
        await interaction.reply({
          content: "❌ Você não tem permissão para selecionar cargo.",
          ephemeral: true
        });
        return;
      }

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

    // ---------- MODAL ANÚNCIO ----------
    if (interaction.isModalSubmit() && interaction.customId === "modal_anuncio") {
      if (!usuarioTemPermAdmin(interaction)) {
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

    // ---------- MODAL FORMULÁRIO ----------
    if (interaction.isModalSubmit() && interaction.customId === "form_ingresso_cbm") {
      const qra = interaction.fields.getTextInputValue("qra").trim();
      const id = interaction.fields.getTextInputValue("id").trim();
      const cargo = interaction.fields.getTextInputValue("cargo").trim();
      const unidade = interaction.fields.getTextInputValue("unidade").trim();

      if (!/^\d+$/.test(id)) {
        await interaction.reply({
          content: "❌ O campo ID deve conter apenas números.",
          ephemeral: true
        });
        return;
      }

      const canalAprovacao = await interaction.guild.channels.fetch(CANAL_APROVACAO).catch(() => null);
      if (!canalAprovacao || !canalAprovacao.isTextBased()) {
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

      await enviarLogDiscord(
        "📥 Nova Solicitação",
        `**Solicitante:** ${interaction.user}\n**Nome/QRA:** ${qra}\n**ID:** ${id}`,
        0x2b8cff
      );
      return;
    }
  } catch (err) {
    console.error("ERRO GERAL:", err);

    await enviarLogDiscord(
      "❌ Erro no sistema",
      `\`\`\`${String(err?.message || err).slice(0, 1500)}\`\`\``,
      0xcc0000
    );

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
process.on("unhandledRejection", async (reason) => {
  console.error("❌ UNHANDLED REJECTION:", reason);
  await enviarLogDiscord(
    "❌ Unhandled Rejection",
    `\`\`\`${String(reason).slice(0, 1500)}\`\`\``,
    0xcc0000
  );
});

process.on("uncaughtException", async (error) => {
  console.error("❌ UNCAUGHT EXCEPTION:", error);
  await enviarLogDiscord(
    "❌ Uncaught Exception",
    `\`\`\`${String(error).slice(0, 1500)}\`\`\``,
    0xcc0000
  );
});

client.on("error", async (error) => {
  console.error("❌ CLIENT ERROR:", error);
  await enviarLogDiscord(
    "❌ Client Error",
    `\`\`\`${String(error).slice(0, 1500)}\`\`\``,
    0xcc0000
  );
});

client.on("warn", (info) => {
  console.warn("⚠️ WARN:", info);
});

// ===================== START =====================
if (!validarEnv()) {
  process.exit(1);
}

http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
  res.end("BOT ONLINE");
}).listen(process.env.PORT || 3000);

client.login(TOKEN);
