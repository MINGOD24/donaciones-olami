import { MercadoPagoConfig, Preference } from "mercadopago";
import { NextRequest, NextResponse } from "next/server";

const mp = new MercadoPagoConfig({
  accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN_CHECKOUT!,
});

const preferenceClient = new Preference(mp);

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL!;
    if (!baseUrl) throw new Error("NEXT_PUBLIC_BASE_URL no está definido");

    // Validar que la URL base sea válida
    try {
      new URL(baseUrl);
    } catch {
      throw new Error("NEXT_PUBLIC_BASE_URL debe ser una URL válida");
    }

    // Para desarrollo, no usar notification_url si es IP local
    const isLocalhost =
      baseUrl.includes("localhost") ||
      baseUrl.includes("127.0.0.1") ||
      baseUrl.includes("10.100.102.7");
    const notificationUrl = isLocalhost
      ? undefined
      : `${baseUrl}/api/mp-webhook`;
    console.log("Notification URL:", notificationUrl);
    console.log("Is localhost:", isLocalhost);

    if (!data.opcion || !data.monto || data.monto <= 0) {
      return NextResponse.json(
        { message: "Opción y monto válidos son requeridos." },
        { status: 400 }
      );
    }

    const items = [
      {
        id: "donacion",
        title: data.opcion,
        unit_price: data.monto,
        quantity: 1,
        currency_id: "CLP",
      },
    ];

    const preferenceBody = {
      items,
      back_urls: {
        success: `${baseUrl}/success`,
        failure: `${baseUrl}/failure`,
        pending: `${baseUrl}/pending`,
      },
      //auto_return: 'approved' as const,
      metadata: {
        contacto: data.contacto,
        email: data.email,
        rut: data.rut,
        opcion: data.opcion,
        monto: data.monto,
        dedicatoria: data.dedicatoria || "",
      },
      ...(notificationUrl && { notification_url: notificationUrl }),
      external_reference: data.email,
      // Configuración para permitir pagos con tarjeta externa
      payment_methods: {
        installments: 1, // Solo pago en una cuota
        default_payment_method_id: "master",
        default_installments: 1,
      },
      // Configuración para guest checkout
      payer: {
        name: "Donante",
        email: data.email,
      },
      // Configuración para checkout como invitado
      expires: true,
      expiration_date_to: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutos
    };

    console.log("Preference body:", preferenceBody);

    const { init_point } = await preferenceClient.create({
      body: preferenceBody,
    });

    console.log("Init point:", init_point);

    return NextResponse.json({ init_point });
  } catch (err: any) {
    console.error("Mercado Pago error:", err);
    return NextResponse.json(
      { message: err.message ?? "Error inesperado" },
      { status: 500 }
    );
  }
}
