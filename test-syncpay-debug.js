import fetch from "node-fetch";
import qrcode from "qrcode-terminal";
import clipboardy from "clipboardy";

const BASE_URL = "https://api.syncpayments.com.br";
const CLIENT_ID = "7850c977-433e-4e7f-a375-657f0f4f10cd";
const CLIENT_SECRET = "a5a12e28-fca6-4b9b-84db-3dd4eb4f84b0";

async function gerarToken() {
  console.log("🔑 Gerando novo token...");

  const res = await fetch(`${BASE_URL}/api/auth`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
    }),
  });

  const raw = await res.text();
  if (!res.ok) {
    throw new Error(`Erro HTTP ${res.status}: ${raw}`);
  }

  try {
    const json = JSON.parse(raw);
    if (!json.access_token) throw new Error("Token não retornado.");
    console.log("✅ Token recebido!");
    return json.access_token;
  } catch {
    throw new Error("Resposta inesperada da API: " + raw);
  }
}

async function criarPix(token) {
  console.log("\n💸 Criando PIX...");

  const headers = {
    "Authorization": `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  const body = {
    amount: 10,
    description: "Teste de R$10 via API",
    client: {
      name: "Pedro Henrique Figueiredo de Oliveira",
      cpf: "03995117171",
      email: "pedrodev.design@gmail.com",
      phone: "62991146866",
    },
    traceable: true,
    postbackUrl: "https://webhook.site/7b6e1248-eb5d-40e0-9f8e-6eb28becd2d0",
  };

  const res = await fetch(`${BASE_URL}/api/partner/v1/cash-in`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  const raw = await res.text();
  console.log("\n📦 Status HTTP:", res.status, res.statusText);

  if (raw.startsWith("<!DOCTYPE") || raw.startsWith("<html")) {
    console.error("⚠️ API retornou HTML (erro no servidor ou rota errada).");
    return;
  }

  let json;
  try {
    json = JSON.parse(raw);
  } catch {
    console.error("⚠️ Resposta não é JSON:", raw);
    return;
  }

  const pix_code = json?.data?.pix_code || json?.pix_code;
  if (pix_code) {
    console.log("\n✅ PIX criado com sucesso!");
    console.log("\n🔑 COPIA E COLA DO PIX:\n");
    console.log(pix_code);

    try {
      clipboardy.writeSync(pix_code);
      console.log("\n📋 Código copiado para a área de transferência!");
    } catch (err) {
      console.warn("\n⚠️ Não foi possível copiar:", err.message);
    }

    console.log("\n🔳 QR Code PIX:");
    qrcode.generate(pix_code, { small: true });
  } else {
    console.error("❌ Falha ao criar PIX:", JSON.stringify(json, null, 2));
  }
}

(async () => {
  try {
    const token = await gerarToken();
    await criarPix(token);
  } catch (err) {
    console.error("\n💥 ERRO GERAL:", err.message || err);
  }
})();
