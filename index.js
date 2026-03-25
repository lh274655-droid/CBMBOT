async function loop() {
  console.log("Iniciando loop de logs...");

  while (true) {
    try {
      await enviarLogs();
    } catch (e) {
      console.error(e);
    }

    // espera 39 segundos
    await new Promise(r => setTimeout(r, 39000));
  }
}

loop();
