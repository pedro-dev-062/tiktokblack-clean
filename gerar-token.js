import 'dotenv/config';
import fetch from "node-fetch";

const BASE_URL = process.env.BASE_URL;
const CLIENT_ID = process.env.SYNCPAY_CLIENT_ID;
const CLIENT_SECRET = process.env.SYNCPAY_CLIENT_SECRET;

async function gerarToken() {
  console.log("🔑 Gerando token com SyncPay...");
  const url = `${BASE_URL}/api/partner/v1/auth-token`;
  console.log(`🌐 Endpoint: ${url}\n`);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
      }),
    });

    console.log(`📦 Status HTTP: ${response.status} ${response.statusText}`);
    const text = await response.text();

    // tenta parsear JSON
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      console.error("\n⚠️ A resposta não é JSON (possível erro HTML):\n");
      console.error(text.substring(0, 300) + "...");
      return;
    }

    if (response.ok && data.access_token) {
      console.log("\n✅ Token gerado com sucesso!");
      console.log(JSON.stringify(data, null, 2));
      console.log(`\n🔐 TOKEN: ${data.access_token}\n`);
    } else {
      console.error("\n⚠️ Erro na resposta da API:");
      console.error(JSON.stringify(data, null, 2));
    }
  } catch (err) {
    console.error("\n💥 Erro ao gerar token:");
    console.error(err.message);
  }
}

gerarToken();
