import type { Metadata } from "next";
import { Provider } from "./provider";

export const metadata: Metadata = {
  title: "Shrawasti Admin Portal & API | Chakra UI Enterprise Edition",
  description: "Management portal and backend services for Shrawasti Mobile App powered by Chakra UI",
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
      <body style={{ margin: 0, padding: 0, fontFamily: "'Inter', sans-serif", backgroundColor: "#090D16", color: "#F8FAFC" }}>
        <Provider>{children}</Provider>
      </body>
    </html>
  );
}
