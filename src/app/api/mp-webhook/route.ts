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

  const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY!.replace(
    /\\n/g,
    "\n"
  );

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
