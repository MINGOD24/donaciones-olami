import "./globals.css";
import ImageCarousel from "@/components/ImageCarousel";

export const metadata = {
  title: "Donaciones Olami Chile 2025",
  description: "Donaciones Olami Chile 2025",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="min-h-screen flex flex-col">
        <header className="shadow bg-white w-full">
          <ImageCarousel />
        </header>
        <main className="flex-1 flex items-center justify-center bg-gradient-to-br from-green-100 via-blue-100 to-indigo-100 p-4">
          <div className="w-full max-w-5xl">{children}</div>
        </main>
      </body>
    </html>
  );
}
