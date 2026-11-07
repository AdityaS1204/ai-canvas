import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://ai-canvas.vercel.app"),
  title: "AI Canvas - Infinite Creative Board",
  description: "An infinite canvas to render images, videos, audio, vector shapes, drawings, and notes.",
  icons: {
    icon: [
      { url: "/favicon.png", type: "image/png" },
    ],
    shortcut: "/favicon.png",
    apple: "/favicon.png",
  },
  openGraph: {
    title: "AI Canvas - Infinite Creative Board",
    description: "An infinite canvas to render images, videos, audio, vector shapes, drawings, and notes.",
    siteName: "AI Canvas",
    images: [
      {
        url: "/og-image-light.png",
        width: 1200,
        height: 630,
        alt: "AI Canvas - Infinite Creative Workspace",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Canvas - Infinite Creative Board",
    description: "An infinite canvas to render images, videos, audio, vector shapes, drawings, and notes.",
    images: ["/og-image-light.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased dark">
      <head>
        <link rel="icon" href="/favicon.png" type="image/png" />
        <link rel="apple-touch-icon" href="/favicon.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Varela+Round&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="h-full w-full overflow-hidden select-none bg-zinc-900 text-white font-sans">
        {children}
      </body>
    </html>
  );
}
