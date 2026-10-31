// Johen Arte Gráfica — recebe os arquivos do editor do site ("Personalize sem sair do site")
// e guarda numa pasta por pedido, dentro de "Pedidos do site" no seu Google Drive.
// Como ligar: veja drive/COMO-LIGAR.md. Depois de colar, Implantar > Nova implantação > App da Web.

const PASTA = "Pedidos do site";
const LIMITE_MB = 45;   // trava contra envio gigante

function doPost(e) {
  const corpo = e && e.postData ? e.postData.contents : "";
  if (corpo.length > LIMITE_MB * 1024 * 1024 * 1.4) return resposta_({ ok: false, erro: "grande demais" });
  const d = JSON.parse(corpo);
  if (!/^J\d{6}-[A-Z0-9]{4}$/.test(d.codigo || "")) return resposta_({ ok: false, erro: "código inválido" });

  const trava = LockService.getScriptLock(); trava.waitLock(30000);
  try {
    const raiz = pasta_(DriveApp.getRootFolder(), PASTA);
    const nome = (d.codigo + " · " + (d.produto || "")).slice(0, 120);
    const p = pasta_(raiz, nome);
    (d.arquivos || []).slice(0, 30).forEach(a => {
      p.createFile(Utilities.newBlob(Utilities.base64Decode(a.dados), a.tipo, String(a.nome).replace(/[\/\\]/g, "-")));
    });
    const info = [
      "Pedido: " + d.codigo,
      "Produto: " + (d.produto || ""),
      "Detalhes: " + (d.desc || ""),
      "Quantidade: " + (d.qtd || ""),
      "Valor: " + (d.total || ""),
      (d.textos || []).length ? "Textos: " + d.textos.join(" | ") : "",
      "Recebido em: " + Utilities.formatDate(new Date(), "America/Sao_Paulo", "dd/MM/yyyy HH:mm"),
    ].filter(String).join("\n");
    p.createFile("pedido.txt", info, MimeType.PLAIN_TEXT);
    return resposta_({ ok: true, pasta: p.getUrl() });
  } finally {
    trava.releaseLock();
  }
}

// abrir o endereço no navegador mostra que está funcionando
function doGet() { return resposta_({ ok: true, msg: "Recebendo arquivos do site da Johen." }); }

function pasta_(mae, nome) {
  const it = mae.getFoldersByName(nome);
  return it.hasNext() ? it.next() : mae.createFolder(nome);
}
function resposta_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
