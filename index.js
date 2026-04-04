// ================= IMPORT =================
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
  PermissionFlagsBits,
  ChannelType,
  PermissionsBitField
} = require("discord.js");

const http = require("http");
const fs = require("fs");
const path = require("path");

// ================= CLIENT =================
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// ================= VARIÁVEIS =================
const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

const CANAL_PORTARIA = process.env.CANAL_PORTARIA;
const CANAL_APROVACAO = process.env.CANAL_APROVACAO;
const CANAL_PONTO = process.env.CANAL_PONTO;
const CANAL_LOGS = process.env.CANAL_LOGS || "";

const CANAL_BOAS_VINDAS = process.env.CANAL_BOAS_VINDAS || "";
const CANAL_SAIDAS = process.env.CANAL_SAIDAS || "";
const CATEGORIA_TICKETS = process.env.CATEGORIA_TICKETS || "";
const CARGO_TICKET_STAFF = process.env.CARGO_TICKET_STAFF || "";

const CARGO_AGUARDANDO = process.env.CARGO_AGUARDANDO || "";
const CARGO_REMOVER = process.env.CARGO_REMOVER || "";

// ================= DATA =================
const DATA_DIR = path.join(__dirname, "data");
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);

const BANCO_FILE = path.join(DATA_DIR, "banco.json");
const AUSENCIAS_FILE = path.join(DATA_DIR, "ausencias.json");

const banco = new Map();
const ausencias = new Map();

// ================= LOAD =================
function load(file, map) {
  if (!fs.existsSync(file)) return;
  const data = JSON.parse(fs.readFileSync(file));
  for (const k in data) map.set(k, data[k]);
}
function save(file, map) {
  const obj = {};
  map.forEach((v, k) => obj[k] = v);
  fs.writeFileSync(file, JSON.stringify(obj, null, 2));
}
load(BANCO_FILE, banco);
load(AUSENCIAS_FILE, ausencias);

// ================= LOG =================
async function log(guild, msg) {
  if (!CANAL_LOGS) return;
  const c = await guild.channels.fetch(CANAL_LOGS).catch(()=>null);
  if (!c) return;

  c.send({
    embeds:[new EmbedBuilder()
      .setColor(0x2b8cff)
      .setDescription(msg)
      .setTimestamp()]
  });
}

// ================= ENTRADA =================
client.on("guildMemberAdd", async m=>{
  if (CANAL_BOAS_VINDAS) {
    const c = await m.guild.channels.fetch(CANAL_BOAS_VINDAS).catch(()=>null);
    if (c) c.send(`👋 Bem-vindo ${m}`);
  }
  log(m.guild, `📥 Entrou: ${m.user.tag}`);
});

// ================= SAIDA =================
client.on("guildMemberRemove", async m=>{
  if (CANAL_SAIDAS) {
    const c = await m.guild.channels.fetch(CANAL_SAIDAS).catch(()=>null);
    if (c) c.send(`📤 Saiu: ${m.user.tag}`);
  }
  log(m.guild, `❌ Saiu: ${m.user.tag}`);
});

// ================= ANTI LINK =================
client.on("messageCreate", async msg=>{
  if (!msg.guild || msg.author.bot) return;
  if (msg.member.permissions.has("Administrator")) return;

  if (/http|discord\.gg/i.test(msg.content)) {
    await msg.delete().catch(()=>{});
    msg.channel.send(`🚫 ${msg.author} sem links.`);
  }
});

// ================= COMANDOS =================
const comandos = [
  new SlashCommandBuilder().setName("ping").setDescription("Ping"),

  new SlashCommandBuilder().setName("ticket").setDescription("Abrir ticket"),
  new SlashCommandBuilder().setName("fecharticket").setDescription("Fechar ticket"),

  new SlashCommandBuilder().setName("saldo").setDescription("Ver saldo"),
  new SlashCommandBuilder()
    .setName("pix")
    .addUserOption(o=>o.setName("user").setRequired(true))
    .addIntegerOption(o=>o.setName("valor").setRequired(true)),

  new SlashCommandBuilder()
    .setName("ausencia")
    .addStringOption(o=>o.setName("motivo").setRequired(true)),

  new SlashCommandBuilder().setName("voltar").setDescription("Voltar")
].map(c=>c.toJSON());

// ================= READY =================
client.once("ready", async ()=>{
  console.log("🔥 BOT ONLINE");

  const rest = new REST({version:"10"}).setToken(TOKEN);
  await rest.put(Routes.applicationGuildCommands(CLIENT_ID,GUILD_ID),{body:comandos});
});

// ================= INTERAÇÃO =================
client.on("interactionCreate", async i=>{
  if (!i.isChatInputCommand()) return;

  if (i.commandName==="ping") return i.reply("🏓 Pong");

  // ===== TICKET =====
  if (i.commandName==="ticket"){
    const canal = await i.guild.channels.create({
      name:`ticket-${i.user.username}`,
      type:ChannelType.GuildText,
      parent:CATEGORIA_TICKETS,
      permissionOverwrites:[
        {id:i.guild.id,deny:[PermissionsBitField.Flags.ViewChannel]},
        {id:i.user.id,allow:[PermissionsBitField.Flags.ViewChannel]},
        {id:CARGO_TICKET_STAFF,allow:[PermissionsBitField.Flags.ViewChannel]}
      ]
    });

    canal.send(`🎫 Ticket de ${i.user}`);
    i.reply({content:`Criado: ${canal}`,ephemeral:true});
  }

  if (i.commandName==="fecharticket"){
    i.channel.delete();
  }

  // ===== BANCO =====
  if (i.commandName==="saldo"){
    return i.reply(`💰 ${banco.get(i.user.id)||0}`);
  }

  if (i.commandName==="pix"){
    const u=i.options.getUser("user");
    const v=i.options.getInteger("valor");

    if((banco.get(i.user.id)||0)<v) return i.reply("❌ Sem saldo");

    banco.set(i.user.id,(banco.get(i.user.id)||0)-v);
    banco.set(u.id,(banco.get(u.id)||0)+v);
    save(BANCO_FILE,banco);

    i.reply("💸 Enviado");
  }

  // ===== AUSENCIA =====
  if (i.commandName==="ausencia"){
    const m=i.options.getString("motivo");
    ausencias.set(i.user.id,{motivo:m});
    save(AUSENCIAS_FILE,ausencias);

    i.reply("📴 Em ausência");
  }

  if (i.commandName==="voltar"){
    ausencias.delete(i.user.id);
    save(AUSENCIAS_FILE,ausencias);
    i.reply("✅ Voltou");
  }

});

// ================= SERVER =================
http.createServer((req,res)=>res.end("ONLINE")).listen(process.env.PORT||3000);

// ================= LOGIN =================
client.login(TOKEN);
