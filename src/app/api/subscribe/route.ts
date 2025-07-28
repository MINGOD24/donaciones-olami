// app/api/subscribe/route.ts
import { NextRequest, NextResponse } from "next/server";

const MP_API_URL = "https://api.mercadopago.com/preapproval";

export async function POST(req: NextRequest) {
  // Parseamos el body
  const data = await req.json();
  const { contacto, email, rut, opcion, monto, dedicatoria } = data;

  // Variables de entorno
  const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN_SUBSCRIPTION;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

  if (!accessToken) {
    console.error("[MP] Falta MERCADO_PAGO_ACCESS_TOKEN_SUBSCRIPTION");
    return NextResponse.json(
      { message: "Configuración de servidor incompleta." },
      { status: 500 }
    );
  }
  if (!baseUrl) {
    console.error("[MP] Falta NEXT_PUBLIC_BASE_URL");
    return NextResponse.json(
      { message: "Configuración de servidor incompleta." },
      { status: 500 }
    );
  }

  // Validación básica
  if (!email || !monto || monto <= 0 || !opcion) {
    return NextResponse.json(
      { message: "Datos de suscripción inválidos." },
      { status: 400 }
    );
  }

  // Construimos el payload para MercadoPago
  const body = {
    reason: `Suscripción mensual – ${opcion}`,
    auto_recurring: {
      frequency: 1,
      frequency_type: "months",
      transaction_amount: monto,
      currency_id: "CLP",
    },
    payer_email: email,
    back_url: `${baseUrl}/success`,
    status: "pending",
    external_reference: rut, // puedes usar email o rut según prefieras
    metadata: {
      contacto,
      dedicatoria: dedicatoria || "",
      tipo: "suscripción",
    },
  };

  try {
    const response = await fetch(MP_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const result = await response.json();
    if (!response.ok || !result.init_point) {
      console.error("[MP] Error creando suscripción:", result);
      return NextResponse.json(
        { message: result.message || "Error creando suscripción." },
        { status: 500 }
      );
    }

    // Devolvemos el init_point al cliente
    return NextResponse.json({ init_point: result.init_point });
  } catch (err: any) {
    console.error("[MP] Excepción en subscribe:", err);
    return NextResponse.json(
      { message: err.message || "Error inesperado." },
      { status: 500 }
    );
  }
}
