"use client";

export default function Pending() {
  return (
    <div className="flex flex-col">
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="bg-white p-6 sm:p-10 rounded-xl shadow-xl max-w-lg w-full text-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-yellow-600 mb-4">
            Pago pendiente ⏳
          </h1>
          <p className="text-gray-700 text-base sm:text-lg mb-6">
            Estamos procesando tu pago. Te notificaremos por correo cuando se
            confirme.
          </p>
          <a
            href="/"
            className="inline-block bg-[#1f3b82] hover:bg-[#3355aa] text-white font-semibold px-4 py-2 rounded transition"
          >
            Volver al inicio
          </a>
        </div>
      </div>
    </div>
  );
}
