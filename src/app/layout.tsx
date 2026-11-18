import type { Metadata } from "next";
import { Provider } from "./provider";

export const metadata: Metadata = {
  title: "Shrawasti desk",
  description: "Manage Shrawasti bookings, crew, and catalog.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
        <body style={{ margin: 0, padding: 0, fontFamily: "'Inter', sans-serif", backgroundColor: "#0B1712", color: "#F4FBF6" }}>
        <style>{`
          .dark {
            color-scheme: dark;
            --chakra-colors-fg: #F4FBF6;
            --chakra-colors-fg-muted: #D5E8DC;
            --chakra-colors-fg-subtle: #9BB5A6;
          }
          .dark .chakra-button,
          .dark .chakra-button :where(p, span, svg) {
            color: #F4FBF6 !important;
          }
          .dark .desk-keep,
          .dark .desk-keep :where(p, span, svg) {
            color: #FCA5A5 !important;
          }
          .dark .chakra-button,
          .dark .chakra-badge {
            --chakra-colors-color-palette-fg: #F4FBF6 !important;
            --chakra-colors-color-palette-contrast: #FFFFFF !important;
            --chakra-colors-color-palette-subtle: #173528 !important;
            --chakra-colors-color-palette-muted: #1F4A38 !important;
            --chakra-colors-color-palette-border: #8FBC9A !important;
          }
          .dark input, .dark textarea, .dark select { color: #F4FBF6; font-size: 16px; }
          .dark input::placeholder, .dark textarea::placeholder { color: #9BB5A6; }
          .dark option { background: #143024; color: #F4FBF6; }
          table, thead, tbody, tr, th, td { background: transparent; color: inherit; }
          thead th {
            background: #173528 !important;
            color: #D5E8DC !important;
            font-size: 12px !important;
            font-weight: 650 !important;
            white-space: nowrap;
          }
          tbody td { border-color: rgba(200, 230, 210, 0.12) !important; vertical-align: top; }
        `}</style>
        <Provider>{children}</Provider>
      </body>
    </html>
  );
}
