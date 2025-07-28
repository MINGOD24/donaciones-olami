"use client";

export default function Success() {
  return (
    <div className="flex flex-col">
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="bg-white p-6 sm:p-10 rounded-xl shadow-xl max-w-lg w-full text-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-green-600 mb-4">
            ¡Gracias por tu donación! 💙
          </h1>
          <p className="text-gray-700 text-base sm:text-lg mb-6">
            Tu aporte ha sido recibido con éxito. Gracias por ser parte de
            nuestra misión y apoyar a Olami Chile.
          </p>
          <p className="text-gray-600 text-sm mb-6">
            Pronto recibirás una confirmación por correo.
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
