import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("🔔 Webhook recibido:", JSON.stringify(body, null, 2));

    // ✅ One-time payment (checkout)
    if (body.type === "payment" && body.data?.id) {
      const paymentId = body.data.id;

      const mpRes = await fetch(
        `https://api.mercadopago.com/v1/payments/${paymentId}`,
        {
          headers: {
            Authorization: `Bearer ${process.env
              .MERCADO_PAGO_ACCESS_TOKEN_CHECKOUT!}`,
          },
        }
      );

      if (!mpRes.ok) {
        console.error(
          "Error consultando pago en Mercado Pago:",
          mpRes.statusText
        );
        return NextResponse.json(
          { error: "Error consultando pago" },
          { status: 500 }
        );
      }

      const payment = await mpRes.json();
      console.log("💳 Detalle del pago:", JSON.stringify(payment, null, 2));

      if (payment.status === "approved") {
        await guardarEnGoogleSheets(
          payment.metadata,
          payment.transaction_amount,
          "único"
        );
      }
    }

    // ✅ Subscription approval
    if (body.type === "preapproval" && body.data?.id) {
      const subscriptionId = body.data.id;

      const res = await fetch(
        `https://api.mercadopago.com/preapproval/${subscriptionId}`,
        {
          headers: {
            Authorization: `Bearer ${process.env
              .MERCADO_PAGO_ACCESS_TOKEN_SUBSCRIPTION!}`,
          },
        }
      );

      if (!res.ok) {
        console.error("Error consultando preapproval:", res.statusText);
        return NextResponse.json(
          { error: "Error consultando preapproval" },
          { status: 500 }
        );
      }

      const subscription = await res.json();
      console.log(
        "🔁 Detalle de suscripción:",
        JSON.stringify(subscription, null, 2)
      );

      if (subscription.status === "authorized") {
        const metadata = subscription.metadata || {};
        await guardarEnGoogleSheets(
          metadata,
          subscription.auto_recurring.transaction_amount,
          "mensual"
        );
      }
    }

    // ✅ Manual entry (free donation fallback)
    if (body.type === "manual_free") {
      await guardarEnGoogleSheets(body.metadata, 0, "manual");
    }

    return NextResponse.json({ status: "ok" });
  } catch (err) {
    console.error("❌ Error en el webhook:", err);
    return NextResponse.json(
      { error: "Error procesando webhook" },
      { status: 500 }
    );
  }
}

async function guardarEnGoogleSheets(
  metadata: any,
  totalPagado: number,
  tipo: "único" | "mensual" | "manual"
) {
  console.log("🔍 Guardando en Google Sheets");

  const GOOGLE_PRIVATE_KEY =
    "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDP3Ym1X9KaFlIg\nigW44si1KxOaKSj4Rk3wgAH8hk1AEOM1VlFQDPNYUIeJ8RCjhzU+oseO2tjjhBO7\nexUYxJUrawzGFnDIXqz/dPho2lj9W1+k9zuFNwPU37eXXpBoaL8kKB3JRpm6kAC2\nqwDvr4lKIbo93dePCuM/6/pkm561RKMF3s39S1RBR9O+Fsw1K5y21xzBhNpQb33R\nLV1533C4zlAX9kDvDHBhNlCdukeiS+fN5YOVZsKQAEWjQ2P45Och8zn8YmHwaRHk\nfBeicb21wZsxPXJoTU4KXXNST5fiQ2Ijaop7NJEhLfy/iSnsfes4KKhrO2U2hnI6\nt5TB2qijAgMBAAECggEAX1hh6yUZ5/3nC+/jcgvsPlWU9zh8B23QIEnHH3rHAmT8\noyGFyK84C8FcemRt2mSRgrqNyLQPmkSh/HQXmDXLqo++2zm939q1hbO0ofvNp+D6\nvSN+VLuIcWNwxejlWk75pe8Uwpc0uoOFIETN+CNPWQahc/FHB+DZnh9yyiUrpj8S\n2IhRN2fJ/CEgEbiXMY4s0CTtbbMLiJFI7WedOiUFyv2c8jRY6M0Y16M7mPOhCdwL\njclbwHlnxb9DmX4Nn4LSbLM3iX6WEBs8yigISjq0Kdo+sniDn6nZvUuSdDnLPI0g\nWEfXX5/9IK0OUnsAYwZ4w2/AjgluC1U4m1dA1UqCCQKBgQDpbOz3J/D/hs5+SqNB\nm3N1SfoUcFoBrtR2fcyiFCU/ZAT3gTsG9nmnF+g8ooonw0Tm3cSwa4w1jZ8JSh/H\nS67gXDXoek/fLMDGMridJGkq3MzSd/R7YnoQPrMMjLYCVuQZ/5b/ZlPLUC5ow82M\nJvzFxxDiT/Z0nJ9S27NX949SDQKBgQDj982fad0XUfKKY0pzzUWttivnKKtvo/3a\nUAsh1IBlICDmVua72yRYVzYEr1NLtR6MA7c/SMYnIYFsX0GuXAyy4pyj8hLsX8Dh\n3voFEA7FGrJE8Nmo52BZLo0MgyfmYCIe4ohOpd5fkUNOU4WQ9pMxiQkXodS9mcxh\n/LekllopbwKBgQCPg1XJuzfTkqlAQllPS+jXksz7ZfwgjsG3vC5k8+fWqoLXPQ/y\nfvVagztYlEJGoiqpmm2EXgsNHe5KgtU47dItxOOr9A9JUjWPZb3Vd35lSO1w9SlN\n9sS/Wh0xOQ3qMEv7pAXNLreUB88QwFmOsqW0X2iFC86l8WmPQt5n1h+6vQKBgCmk\n5wcsC5tq+OeW487rvMLS+Iotv8ORLZpn7OCtNRdEGz54uYWvrqAErnWEoa6+02m4\ndA03ehtD36Swcgsr/ZXgF8VLP3G2vEGGvh2WpVwUWGSHqvtT6SHhgxq6Ctvmy9Tg\nhQ349vp2StlQIKIuqQzvf521jmtkYRW1WMbUQHw5AoGANWdAZZG+dI5PD0OFbiLq\nKNDKopHMMhL//bTifERGXgFoL+jywSjwd5BTlszYth2sEIBsAkvpT/4wr4XDEV6a\ninS3zKz9iNMdfIyKIMVLdb6HT5YVGDiHRNCGhtdxyB5eZ/nOcN2D5R8G/tpYD78O\naIdU7OXoDuMSRMzhQyyxhHo=\n-----END PRIVATE KEY-----\n";

  const auth = new google.auth.JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL!,
    key: GOOGLE_PRIVATE_KEY,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  const sheets = google.sheets({ version: "v4", auth });
  const spreadsheetId = process.env.GOOGLE_SHEET_ID!;

  const values = [
    [
      new Date().toLocaleString("es-CL"),
      metadata.email,
      metadata.contacto,
      metadata.rut || "",
      metadata.opcion || "",
      `$${
        metadata.monto?.toLocaleString?.() || totalPagado.toLocaleString()
      } CLP`,
      metadata.dedicatoria || "",
      `$${totalPagado.toLocaleString()} CLP`,
      tipo,
    ],
  ];

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: "Donaciones!A1",
    valueInputOption: "USER_ENTERED",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values },
  });

  console.log(`✅ Donación (${tipo}) registrada en Google Sheets`);
}
