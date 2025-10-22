import fetch from "node-fetch";

const BASE_URL = "https://api.syncpayments.com.br";
const CLIENT_ID = "7850c977-433e-4e7f-a375-657f0f4f10cd";
const CLIENT_SECRET = "a5a12e28-fca6-4b9b-84db-3dd4eb4f84b0";

async function gerarToken() {
  const r = await fetch(`${BASE_URL}/api/partner/v1/auth-token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
    }),
  });
  const data = await r.json();
  return data.access_token;
}

async function registrarWebhook() {
  const token = await gerarToken();

  const payload = {
    title: "Webhook de Transações",
    url: "https://webhook.site/7b6e1248-eb5d-40e0-9f8e-6eb28becd2d0", // troque por sua URL real se quiser
    event: "cashin",
    trigger_all_products: true,
  };

  console.log("📤 Registrando webhook...");
  const r = await fetch(`${BASE_URL}/api/partner/v1/webhooks`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const text = await r.text();
  console.log("📦 STATUS:", r.status);
  console.log("📦 RESPOSTA COMPLETA:", text);
}

registrarWebhook();
