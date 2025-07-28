"use client";

import { useState } from "react";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";

// const opcionesDonacion = [
//   { label: "Mentoría personalizada (1 sesión)", monto: 20000 },
//   { label: "Set de libros para novios", monto: 30000 },
//   { label: "Grupo de estudio", monto: 50000 },
//   { label: "Clase Especial de Olami Infinity", monto: 80000 },
//   { label: "Evento general (charlas, encuentros…)", monto: 100000 },
//   { label: "Adoptar un grupo mensual de estudio", monto: 200000 },
//   { label: "Evento Jbiz", monto: 250000 },
//   { label: "Olami Infinity (Programa mensual de inclusión)", monto: 320000 },
//   { label: "Patrocinador cena de Shabat", monto: 350000 },
//   { label: "Shabatón", monto: 1000000 },
//   { label: "Otro monto", monto: 0 },
// ];

const opcionesDonacion = [
  { label: "Mentoría personalizada (1 sesión)", monto: 1000 },
  { label: "Set de libros para novios", monto: 1000 },
  { label: "Grupo de estudio", monto: 1000 },
  { label: "Clase Especial de Olami Infinity", monto: 1000 },
  { label: "Evento general (charlas, encuentros…)", monto: 1000 },
  { label: "Adoptar un grupo mensual de estudio", monto: 1000 },
  { label: "Evento Jbiz", monto: 1000 },
  { label: "Olami Infinity (Programa mensual de inclusión)", monto: 1000 },
  { label: "Patrocinador cena de Shabat", monto: 1000 },
  { label: "Shabatón", monto: 1000 },
  { label: "Otro monto", monto: 0 },
];

export default function Home() {
  const [form, setForm] = useState({
    contacto: "",
    email: "",
    rut: "",
    opcion: "",
    monto: 0,
    otroMonto: "",
    dedicatoria: "",
  });

  const [isOneTime, setIsOneTime] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    setError("");

    if (!form.opcion || form.monto <= 0) {
      setError("Selecciona una opción y monto válido.");
      return;
    }

    if (!form.contacto || !form.email.trim() || !form.rut.trim()) {
      setError("Teléfono, correo y RUT son obligatorios.");
      return;
    }

    setLoading(true);

    const payload = { ...form };

    const endpoint = isOneTime ? "/api/checkout" : "/api/subscribe";

    const res = await fetch(endpoint, {
      method: "POST",
      body: JSON.stringify(payload),
    });

    const result = await res.json();

    if (res.ok && result.init_point) {
      window.location.href = result.init_point;
    } else {
      setError(result.message || "Error procesando la donación.");
    }

    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-green-100 via-blue-100 to-indigo-100 flex flex-col items-center">
      <section className="w-full max-w-xl bg-white p-6 rounded-2xl shadow-lg mt-6">
        <h2 className="text-2xl font-semibold text-[#1f3b82] mb-4 text-center">
          Campaña de Donaciones – Olami Chile
        </h2>

        {error && (
          <div className="bg-red-100 text-red-700 p-2 mb-4 rounded">
            {error}
          </div>
        )}

        <div className="grid gap-4 text-sm">
          {/* Opciones de donación */}
          <div className="flex flex-col gap-2">
            {opcionesDonacion.map((op, i) => (
              <label key={i} className="flex items-center gap-2">
                <input
                  type="radio"
                  name="opcion"
                  value={op.label}
                  checked={form.opcion === op.label}
                  onChange={() =>
                    setForm({ ...form, opcion: op.label, monto: op.monto })
                  }
                />
                <span>
                  {op.label}
                  {op.monto > 0 ? ` – $${op.monto.toLocaleString()} CLP` : ""}
                </span>
              </label>
            ))}
          </div>

          {/* Otro monto */}
          {form.opcion === "Otro monto" && (
            <input
              type="number"
              placeholder="Monto personalizado"
              className="p-2 border rounded"
              value={form.otroMonto}
              onChange={(e) =>
                setForm({
                  ...form,
                  monto: Number(e.target.value) || 0,
                  otroMonto: e.target.value,
                })
              }
            />
          )}

          {/* Datos de contacto */}
          <PhoneInput
            international
            defaultCountry="CL"
            value={form.contacto}
            onChange={(val) => setForm({ ...form, contacto: val || "" })}
            className="w-full p-2 border border-gray-300 rounded"
          />

          <input
            type="email"
            placeholder="Correo electrónico"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full p-2 border border-gray-300 rounded"
          />

          <input
            type="text"
            placeholder="RUT"
            value={form.rut}
            onChange={(e) => setForm({ ...form, rut: e.target.value })}
            className="w-full p-2 border border-gray-300 rounded"
          />

          <textarea
            placeholder="Dedicatoria (opcional)"
            value={form.dedicatoria}
            onChange={(e) => setForm({ ...form, dedicatoria: e.target.value })}
            className="w-full p-2 border border-gray-300 rounded"
          />

          {/* Toggle donación única */}
          <div className="mt-4 flex items-center gap-2 bg-blue-50 border border-blue-200 p-3 rounded">
            <input
              type="checkbox"
              id="one-time"
              checked={isOneTime}
              onChange={() => setIsOneTime((prev) => !prev)}
              className="w-4 h-4"
            />
            <label htmlFor="one-time" className="text-sm text-blue-800">
              Deseo donar <strong>solo una vez</strong> (por defecto se
              realizará mensualmente)
            </label>
          </div>
        </div>

        {/* Total */}
        <div className="mt-6 text-center">
          <div className="inline-block bg-yellow-300 text-yellow-900 font-bold text-lg px-4 py-2 rounded shadow">
            Total a donar: ${form.monto.toLocaleString()} CLP
          </div>
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          className={`mt-6 w-full py-3 rounded-lg font-semibold transition-colors ${
            loading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-[#1f3b82] text-white hover:bg-[#3355aa]"
          }`}
        >
          {loading
            ? "Procesando..."
            : isOneTime
            ? "Donar una vez"
            : "Suscribirme mensualmente"}
        </button>
      </section>
    </main>
  );
}
