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
      notification_url: `${baseUrl}/api/mp-webhook`,
      external_reference: data.email,
    };

    const { init_point } = await preferenceClient.create({
      body: preferenceBody,
    });

    return NextResponse.json({ init_point });
  } catch (err: any) {
    console.error("Mercado Pago error:", err);
    return NextResponse.json(
      { message: err.message ?? "Error inesperado" },
      { status: 500 }
    );
  }
}
