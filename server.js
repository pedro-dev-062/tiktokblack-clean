import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";

dotenv.config();
const app = express();
app.use(express.json());
app.use(cors());

const __dirname = process.cwd();

// 🔹 Logger (só pra debug)
app.use((req, res, next) => {
  console.log("➡️ ROTA CHAMADA:", req.method, req.url);
  next();
});

// 🔹 Servir os arquivos estáticos da pasta public
app.use(express.static(path.join(__dirname, "public")));

// 🔹 Páginas principais
app.get("./index.html", (_, res) =>
  res.sendFile(path.join(__dirname, "public", "index.html"))
);
app.get("/public/checkout.html", (_, res) =>
  res.sendFile(path.join(__dirname, "public", "checkout.html"))
);

// -------------------- 🧠 Utilidades -------------------- //
async function gerarToken() {
  const resp = await fetch(`${process.env.BASE_URL}/api/partner/v1/auth-token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: process.env.SYNCPAY_CLIENT_ID,
      client_secret: process.env.SYNCPAY_CLIENT_SECRET,
    }),
  });

  const data = await resp.json();
  if (!resp.ok || !data.access_token)
    throw new Error("Erro ao gerar token: " + (data.message || resp.status));
  return data.access_token;
}

// 🔹 Função de busca de CEP via ViaCEP
async function buscarCEP(cep) {
  const cleanCep = cep.replace(/\D/g, "");
  const r = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
  const d = await r.json();
  if (d.erro) throw new Error("CEP não encontrado");
  return {
    street: d.logradouro || "",
    district: d.bairro || "",
    city: d.localidade || "",
    state: d.uf || "",
  };
}

// -------------------- 💳 API PIX -------------------- //
app.post("/api/syncpay/pix", async (req, res) => {
  try {
    const { amount, description, customer, shipping } = req.body;

    if (!customer?.document)
      return res.status(400).json({ ok: false, error: "CPF é obrigatório" });

    console.log("📤 Requisição PIX recebida:", req.body);

    // 🔑 Gera token de autenticação
    const token = await gerarToken();
    console.log("🔐 Token gerado com sucesso!");

    // 🔹 Garante que o valor está em centavos
    let valorEmCentavos = Number(amount);
    if (valorEmCentavos < 1000) {
      valorEmCentavos = Math.round(valorEmCentavos * 100); // converte reais → centavos
    }

    if (isNaN(valorEmCentavos) || valorEmCentavos <= 0)
      return res.status(400).json({ ok: false, error: "Valor inválido recebido" });

    // 🔹 Converte pra reais só pro log
    const valorEmReais = (valorEmCentavos / 100).toFixed(2);
    console.log(`💰 Valor total recebido (produto + frete): R$ ${valorEmReais}`);

    if (shipping) {
      console.log(
        `🚚 Frete selecionado: ${shipping.type} — R$ ${Number(shipping.value).toFixed(2)}`
      );
    }

    // 🔹 Monta o corpo no formato aceito pela SyncPay
    const body = {
      amount: valorEmCentavos, // sempre em centavos
      description: description || "Teste via Server",
      customer: {
        name: customer.name,
        document: customer.document.replace(/\D/g, ""),
        email: customer.email,
        phone: customer.phone.replace(/\D/g, ""),
      },
    };

    console.log("📦 Enviando para SyncPay:", body);

    // 🔹 Cria PIX
    const r = await fetch(`${process.env.BASE_URL}/api/partner/v1/cash-in`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    const data = await r.json();
    console.log("📦 Resposta SyncPay:", data);

    // 🔹 Verifica se o PIX foi criado com sucesso
    if (!r.ok || !data.pix_code) {
      return res
        .status(400)
        .json({ ok: false, error: "Nenhum código PIX retornado", data });
    }

    // 🔹 Retorna os dados do PIX pro front-end
    res.json({
      ok: true,
      pix_code: data.pix_code,
      identifier: data.identifier,
    });
  } catch (err) {
    console.error("💥 Erro PIX:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// -------------------- 📡 API STATUS -------------------- //
app.get("/api/syncpay/status", async (req, res) => {
  try {
    const { identifier } = req.query;
    if (!identifier)
      return res.status(400).json({ ok: false, error: "identifier ausente" });

    console.log("🔍 Consultando status do PIX:", identifier);

    const token = await gerarToken();

    const resp = await fetch(
      `${process.env.BASE_URL}/api/partner/v1/transaction/${identifier}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const text = await resp.text();
    console.log("📦 Resposta bruta SyncPay:", text);

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error("Resposta inválida da SyncPay (não é JSON).");
    }

    if (!resp.ok)
      return res.status(resp.status).json({
        ok: false,
        error: data.message || `Erro HTTP ${resp.status}`,
        data,
      });

    res.json({ ok: true, data });
  } catch (err) {
    console.error("💥 Erro status:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// -------------------- 🏠 API CEP -------------------- //
app.get("/api/cep/:cep", async (req, res) => {
  try {
    const d = await buscarCEP(req.params.cep);
    res.json({ ok: true, address: d });
  } catch (err) {
    res.status(404).json({ ok: false, error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Servidor rodando em http://0.0.0.0:${PORT}`);
});
