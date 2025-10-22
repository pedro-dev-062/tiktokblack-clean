import fetch from "node-fetch";

const client_id = "7850c977-433e-4e7f-a375-657f0f4f10cd";
const client_secret = "a5a12e28-fca6-4b9b-84db-3dd4eb4f84b0";

(async () => {
  try {
    const res = await fetch("https://api.syncpayments.com.br/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify({ client_id, client_secret }),
    });

    const text = await res.text();
    console.log("Status:", res.status);
    console.log("Resposta bruta:", text);
  } catch (err) {
    console.error("Erro ao testar:", err.message);
  }
})();
