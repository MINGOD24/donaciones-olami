// app/api/mp-webhook/route.ts
import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";

export async function POST(req: NextRequest) {
  console.log("🔔 Webhook POST recibido en:", new Date().toISOString());
  const body = await req.json();
  console.log("🔔 Webhook recibido:", JSON.stringify(body, null, 2));

  try {
    // 1) Pago único y recargos de suscripción detectados como pagos
    if (body.type === "payment" && body.data?.id) {
      await handlePayment(body.data.id);
    }

    // 2) Suscripción aprobada por el cliente
    else if (body.type === "subscription_preapproval" && body.data?.id) {
      console.log("🔁 Suscripción aprobada por el cliente");
      await handlePreapproval(body.data.id);
    }

    // 3) Cobro mensual de suscripción
    else if (body.type === "subscription_authorized_payment" && body.data?.id) {
      console.log("🔄 Cobro mensual de suscripción");
      await handleSubscriptionCharge(body.data.id);
    }

    // 4) Donación manual (fallback gratuito)
    else if (body.type === "manual_free") {
      console.log("🎁 Procesando donación manual");
      await guardarEnGoogleSheets({}, 0, "manual");
    } else {
      console.warn("⚠️ Evento no gestionado:", body.type);
    }

    return NextResponse.json({ status: "ok" });
  } catch (err: any) {
    console.error("❌ Error procesando webhook:", err);
    return NextResponse.json(
      { error: err.message || "Error desconocido" },
      { status: 500 }
    );
  }
}

// Maneja un pago o cobro recurrente
async function handlePayment(paymentId: string) {
  const mpRes = await fetch(
    `https://api.mercadopago.com/v1/payments/${paymentId}`,
    {
      headers: {
        Authorization: `Bearer ${process.env
          .MERCADO_PAGO_ACCESS_TOKEN_CHECKOUT!}`,
      },
    }
  );
  if (!mpRes.ok) throw new Error(`Error consultando pago: ${mpRes.statusText}`);

  const payment = await mpRes.json();
  console.log("💳 Detalle del pago:", JSON.stringify(payment, null, 2));

  // Decidir tipo según descripción
  const desc = payment.description || "";
  const isSub = desc.startsWith("Suscripción mensual");
  let tipo = isSub ? "mensual" : "único";

  // Si es suscripción, extraer cuota
  if (isSub) {
    const period =
      payment.point_of_interaction?.transaction_data?.invoice_period?.period;
    tipo = period ? `mensual Cuota ${period}` : "mensual";
  }

  await guardarEnGoogleSheets(
    payment.metadata,
    payment.transaction_amount,
    tipo
  );
}

// Maneja la aprobación inicial de suscripción
async function handlePreapproval(preapprovalId: string) {
  const res = await fetch(
    `https://api.mercadopago.com/v1/preapproval/${preapprovalId}`,
    {
      headers: {
        Authorization: `Bearer ${process.env
          .MERCADO_PAGO_ACCESS_TOKEN_SUBSCRIPTION!}`,
      },
    }
  );
  if (!res.ok) throw new Error(`Error en preapproval: ${res.statusText}`);

  const sub = await res.json();
  console.log("🔁 Detalle de preapproval:", JSON.stringify(sub, null, 2));

  // Guardar datos de suscripción
  await guardarEnGoogleSheets(
    sub.metadata || {},
    sub.auto_recurring.transaction_amount,
    "suscripción aprobada"
  );
}

// Maneja el cobro mensual de suscripción (invoice)
async function handleSubscriptionCharge(subscriptionId: string) {
  // 1) Buscar la factura más reciente
  const searchRes = await fetch(
    `https://api.mercadopago.com/v1/preapproval/${subscriptionId}/authorized_payments/search?limit=1`,
    {
      headers: {
        Authorization: `Bearer ${process.env
          .MERCADO_PAGO_ACCESS_TOKEN_SUBSCRIPTION!}`,
      },
    }
  );
  if (!searchRes.ok)
    throw new Error(
      `Error buscando authorized_payments: ${searchRes.statusText}`
    );

  const { results } = (await searchRes.json()) as {
    results: Array<{ id: string }>;
  };
  if (!results?.length)
    throw new Error("No se encontró ninguna factura de suscripción.");

  const invoiceId = results[0].id;

  // 2) Obtener detalle de la factura
  const invRes = await fetch(
    `https://api.mercadopago.com/v1/preapproval/${subscriptionId}/authorized_payments/${invoiceId}`,
    {
      headers: {
        Authorization: `Bearer ${process.env
          .MERCADO_PAGO_ACCESS_TOKEN_SUBSCRIPTION!}`,
      },
    }
  );
  if (!invRes.ok)
    throw new Error(`Error obteniendo datos de factura: ${invRes.statusText}`);

  const invoice = await invRes.json();
  console.log("🔄 Detalle de invoice:", JSON.stringify(invoice, null, 2));

  if (invoice.status === "approved") {
    // Extraer número de cuota
    const period = invoice.invoice_period?.period;
    const tipo = period ? `mensual Cuota ${period}` : "mensual";

    await guardarEnGoogleSheets(
      invoice.metadata || {},
      invoice.transaction_amount,
      tipo
    );
  }
}

// Guarda cualquier evento en Google Sheets
async function guardarEnGoogleSheets(
  metadata: any,
  totalPagado: number,
  tipo: string
) {
  console.log("🔍 Guardando en Google Sheets:", {
    metadata,
    totalPagado,
    tipo,
  });
  const GOOGLE_PRIVATE_KEY =
    "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDP3Ym1X9KaFlIg\nigW44si1KxOaKSj4Rk3wgAH8hk1AEOM1VlFQDPNYUIeJ8RCjhzU+oseO2tjjhBO7\nexUYxJUrawzGFnDIXqz/dPho2lj9W1+k9zuFNwPU37eXXpBoaL8kKB3JRpm6kAC2\nqwDvr4lKIbo93dePCuM/6/pkm561RKMF3s39S1RBR9O+Fsw1K5y21xzBhNpQb33R\nLV1533C4zlAX9kDvDHBhNlCdukeiS+fN5YOVZsKQAEWjQ2P45Och8zn8YmHwaRHk\nfBeicb21wZsxPXJoTU4KXXNST5fiQ2Ijaop7NJEhLfy/iSnsfes4KKhrO2U2hnI6\nt5TB2qijAgMBAAECggEAX1hh6yUZ5/3nC+/jcgvsPlWU9zh8B23QIEnHH3rHAmT8\noyGFyK84C8FcemRt2mSRgrqNyLQPmkSh/HQXmDXLqo++2zm939q1hbO0ofvNp+D6\nvSN+VLuIcWNwxejlWk75pe8Uwpc0uoOFIETN+CNPWQahc/FHB+DZnh9yyiUrpj8S\n2IhRN2fJ/CEgEbiXMY4s0CTtbbMLiJFI7WedOiUFyv2c8jRY6M0Y16M7mPOhCdwL\njclbwHlnxb9DmX4Nn4LSbLM3iX6WEBs8yigISjq0Kdo+sniDn6nZvUuSdDnLPI0g\nWEfXX5/9IK0OUnsAYwZ4w2/AjgluC1U4m1dA1UqCCQKBgQDpbOz3J/D/hs5+SqNB\nm3N1SfoUcFoBrtR2fcyiFCU/ZAT3gTsG9nmnF+g8ooonw0Tm3cSwa4w1jZ8JSh/H\nS67gXDXoek/fLMDGMridJGkq3MzSd/R7YnoQPrMMjLYCVuQZ/5b/ZlPLUC5ow82M\nJvzFxxDiT/Z0nJ9S27NX949SDQKBgQDj982fad0XUfKKY0pzzUWttivnKKtvo/3a\nUAsh1IBlICDmVua72yRYVzYEr1NLtR6MA7c/SMYnIYFsX0GuXAyy4pyj8hLsX8Dh\n3voFEA7FGrJE8Nmo52BZLo0MgyfmYCIe4ohOpd5fkUNOU4WQ9pMxiQkXodS9mcxh\n/LekllopbwKBgQCPg1XJuzfTkqlAQllPS+jXksz7ZfwgjsG3vC5k8+fWqoLXPQ/y\nfvVagztYlEJGoiqpmm2EXgsNHe5KgtU47dItxOOr9A9JUjWPZb3Vd35lSO1w9SlN\n9sS/Wh0xOQ3qMEv7pAXNLreUB88QwFmOsqW0X2iFC86l8WmPQt5n1h+6vQKBgCmk\n5wcsC5tq+OeW487rvMLS+Iotv8ORLZpn7OCtNRdEGz54uYWvrqAErnWEoa6+02m4\ndA03ehtD36Swcgsr/ZXgF8VLP3G2vEGGvh2WpVwUWGSHqvtT6SHhgxq6Ctvmy9Tg\nhQ349vp2StlQIKIuqQzvf521jmtkYRW1WMbUQHw5AoGANWdAZZG+dI5PD0OFbiLq\nKNDKopHMMhL//bTifERGXgFoL+jywSjwd5BTlszYth2sEIBsAkvpT/4wr4XDEV6a\ninS3zKz9iNMdfIyKIMVLdb6HT5YVGDiHRNCGhtdxyB5eZ/nOcN2D5R8G/tpYD78O\naIdU7OXoDuMSRMzhQyyxhHo=\n-----END PRIVATE KEY-----\n";

  const jwt = new google.auth.JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL!,
    key: GOOGLE_PRIVATE_KEY,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  const sheets = google.sheets({ version: "v4", auth: jwt });
  const spreadsheetId = process.env.GOOGLE_SHEET_ID!;

  const values = [
    [
      new Date().toLocaleString("es-CL"),
      tipo,
      (metadata.email as string) || "",
      (metadata.contacto as string) || "",
      (metadata.rut as string) || "",
      (metadata.opcion as string) || "",
      `$${(metadata.monto || totalPagado).toLocaleString()} CLP`,
      metadata.dedicatoria || "",
    ],
  ];

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: "Donaciones!A1",
    valueInputOption: "USER_ENTERED",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values },
  });
  console.log(`✅ Registro guardado: tipo=${tipo}`);
}
