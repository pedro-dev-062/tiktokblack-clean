import fetch from "node-fetch";
import qrcode from "qrcode-terminal";
import clipboardy from "clipboardy";

// token gerado anteriormente
const TOKEN = "3329760|KYnWgdYVcjepMMJC1qaxS4AMzwE3XwoATy9W7Z45a7bf095e";

async function gerarPix() {
    console.log("💸 Enviando solicitação de CashIn (PIX)...");

    const body = {
        amount: 10,
        description: "Teste de R$10 via API",
        client: {
            name: "Pedro Henrique Figueiredo de Oliveira",
            cpf: "03995117171",
            email: "pedrodev.design@gmail.com",
            phone: "62991146866"
        },
        traceable: true,
        postbackUrl: "https://webhook.site/7b6e1248-eb5d-40e0-9f8e-6eb28becd2d0"
    };

    try {
        const res = await fetch("https://api.syncpayments.com.br/api/partner/v1/cash-in", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${TOKEN}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(body)
        });

        const text = await res.text();
        let data;

        try {
            data = JSON.parse(text);
        } catch {
            console.error("❌ Resposta não é JSON:", text.substring(0, 200) + "...");
            return;
        }

        const pix = data.pix_code || data.data?.pix_code;
        if (res.ok && pix) {

            console.log("\n✅ PIX gerado com sucesso!");
            console.log("\n🔑 Código copia e cola:");
            console.log(pix);

            clipboardy.writeSync(pix);
            console.log("\n📋 Copiado para a área de transferência!");

            console.log("\n🔳 QR Code:");
            qrcode.generate(pix, { small: true });
        } else {
            console.error("\n⚠️ Erro ao gerar PIX:");
            console.error(JSON.stringify(data, null, 2));
        }
    } catch (err) {
        console.error("💥 Erro de rede:", err.message);
    }
}

gerarPix();
