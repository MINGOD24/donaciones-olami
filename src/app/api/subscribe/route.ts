// app/api/subscribe/route.ts
import { MercadoPagoConfig, PreApproval } from "mercadopago";
import { NextRequest, NextResponse } from "next/server";

const mp = new MercadoPagoConfig({
  accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN_SUBSCRIPTION!,
});

const preApprovalClient = new PreApproval(mp);

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const { contacto, email, rut, opcion, monto, dedicatoria } = data;
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL!;

    if (!baseUrl) {
      console.error("[MP] Falta NEXT_PUBLIC_BASE_URL");
      return NextResponse.json(
        { message: "Configuración de servidor incompleta." },
        { status: 500 }
      );
    }

    // Validar que la URL base sea válida
    try {
      new URL(baseUrl);
    } catch {
      return NextResponse.json(
        { message: "NEXT_PUBLIC_BASE_URL debe ser una URL válida" },
        { status: 500 }
      );
    }

    // Para desarrollo, no usar notification_url si es IP local
    const isLocalhost =
      baseUrl.includes("localhost") ||
      baseUrl.includes("127.0.0.1") ||
      baseUrl.includes("10.100.102.7");
    const notificationUrl = isLocalhost
      ? undefined
      : `${baseUrl}/api/mp-webhook`;
    console.log("Notification URL (subscribe):", notificationUrl);
    console.log("Is localhost (subscribe):", isLocalhost);

    // Validación básica
    if (!email || !monto || monto <= 0 || !opcion) {
      return NextResponse.json(
        { message: "Datos de suscripción inválidos." },
        { status: 400 }
      );
    }

    // Construimos el payload para MercadoPago usando el SDK
    const preApprovalBody = {
      reason: `Suscripción mensual - ${opcion}`,
      auto_recurring: {
        frequency: 1,
        frequency_type: "months" as const,
        transaction_amount: monto,
        currency_id: "CLP" as const,
      },
      payer_email: email,
      back_url: `${baseUrl}/success`,
      status: "pending" as const,
      external_reference: rut,
      ...(notificationUrl && { notification_url: notificationUrl }),
      metadata: {
        contacto,
        dedicatoria: dedicatoria || "",
        tipo: "suscripción",
      },
      // Configuración para permitir pagos con tarjeta externa
      payment_methods: {
        installments: 1, // Solo pago en una cuota
        default_payment_method_id: "master",
        default_installments: 1,
      },
      // Configuración para guest checkout
      payer: {
        name: "Donante",
        email: email,
      },
      // Configuración para checkout como invitado
      expires: true,
      expiration_date_to: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutos
    };

    console.log("Preapproval body:", preApprovalBody);

    const result = await preApprovalClient.create({
      body: preApprovalBody,
    });

    console.log("Result:", result);

    if (!result.init_point) {
      console.error("[MP] Error creando suscripción:", result);
      return NextResponse.json(
        { message: "Error creando suscripción." },
        { status: 500 }
      );
    }

    // Devolvemos el init_point al cliente
    return NextResponse.json({ init_point: result.init_point });
  } catch (err: any) {
    console.error("[MP] Excepción en subscribe:", err);

    // Manejo específico del error de países
    if (
      err.message?.includes("different countries") ||
      err.message?.includes("countries")
    ) {
      return NextResponse.json(
        {
          message:
            "Error de configuración: Verifica que la cuenta de Mercado Pago esté configurada para Chile.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: err.message || "Error inesperado." },
      { status: 500 }
    );
  }
}
