"use client";

import { useState, useEffect, useRef } from "react";

const images = [
  "/foto0.jpeg",
  "/foto1.jpeg",
  "/foto2.jpeg",
  "/foto7.jpeg",
  "/foto3.jpeg",
  "/foto4.jpeg",
  "/foto5.jpeg",
  "/foto8.jpeg",
  "/foto6.jpeg",
  "/foto9.jpeg",
];

export default function ImageCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isUserInteracting, setIsUserInteracting] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const userInteractionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Función para iniciar el timer automático
  const startAutoTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    timerRef.current = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 4000);
  };

  // Función para manejar la interacción del usuario
  const handleUserInteraction = () => {
    setIsUserInteracting(true);

    // Limpiar el timer automático
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Limpiar el timeout anterior si existe
    if (userInteractionTimeoutRef.current) {
      clearTimeout(userInteractionTimeoutRef.current);
    }

    // Reiniciar el timer automático después de 6 segundos sin interacción
    userInteractionTimeoutRef.current = setTimeout(() => {
      setIsUserInteracting(false);
      startAutoTimer();
    }, 6000);
  };

  useEffect(() => {
    // Solo iniciar el timer si el usuario no está interactuando
    if (!isUserInteracting) {
      startAutoTimer();
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (userInteractionTimeoutRef.current) {
        clearTimeout(userInteractionTimeoutRef.current);
      }
    };
  }, [isUserInteracting]);

  const goToSlide = (index: number) => {
    handleUserInteraction();
    setCurrentIndex(index);
  };

  const goToPrevious = () => {
    handleUserInteraction();
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? images.length - 1 : prevIndex - 1
    );
  };

  const goToNext = () => {
    handleUserInteraction();
    setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
  };

  return (
    <div className="relative w-full h-80 md:h-96 bg-gray-800 overflow-hidden">
      {/* Imágenes */}
      <div className="relative w-full h-full">
        {images.map((image, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              index === currentIndex ? "opacity-100" : "opacity-0"
            }`}
          >
            <img
              src={image}
              alt={`Imagen ${index + 1}`}
              className="w-full h-full object-contain"
              style={{ objectPosition: "center center" }}
            />
          </div>
        ))}
      </div>

      {/* Indicadores */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 z-10">
        {images.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              index === currentIndex
                ? "bg-white scale-125"
                : "bg-white/50 hover:bg-white/75"
            }`}
            aria-label={`Ir a imagen ${index + 1}`}
          />
        ))}
      </div>

      {/* Botones de navegación */}
      <button
        onClick={goToPrevious}
        className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full transition-all duration-300 backdrop-blur-sm z-10"
        aria-label="Imagen anterior"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
      </button>

      <button
        onClick={goToNext}
        className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full transition-all duration-300 backdrop-blur-sm z-10"
        aria-label="Siguiente imagen"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </button>

      {/* Overlay con texto */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent">
        <div className="absolute bottom-16 left-4 right-4 text-center">
          <h1 className="text-white text-2xl md:text-3xl font-bold drop-shadow-lg">
            Campaña de Donaciones
          </h1>
          <p className="text-white/90 text-sm md:text-base mt-2 drop-shadow-lg">
            Olami Chile
          </p>
        </div>
      </div>
    </div>
  );
}
