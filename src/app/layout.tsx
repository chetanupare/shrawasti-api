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
        <body style={{ margin: 0, padding: 0, fontFamily: "'Inter', sans-serif", backgroundColor: "#0E1626", color: "#F8FAFC" }}>
        <style>{`
          table, thead, tbody, tr, th, td { background: transparent; color: inherit; }
          thead th {
            background: #152033 !important;
            color: #C5D0DC !important;
            font-size: 12px !important;
            font-weight: 650 !important;
            white-space: nowrap;
          }
          tbody td { border-color: rgba(255,255,255,0.08) !important; vertical-align: top; }
        `}</style>
        <Provider>{children}</Provider>
      </body>
    </html>
  );
}
