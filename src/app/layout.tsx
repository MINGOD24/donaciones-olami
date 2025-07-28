import './globals.css';

export const metadata = {
  title: 'Makom Tickets 2025',
  description: 'Compra de entradas para los Yamim Noraim',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen flex flex-col">
        <header className="shadow bg-white w-full">
          <img
            src="https://ecopass-static-temporal.s3.amazonaws.com/6fa2dcb8-ca3e-48e3-9ac1-c547bd32c2f4"
            alt="Campaña de Olami Chile"
            className="block w-full h-auto object-cover"
          />
        </header>
        <main className="flex-1 flex items-center justify-center bg-gradient-to-br from-green-100 via-blue-100 to-indigo-100 p-4">
          <div className="w-full max-w-5xl">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
