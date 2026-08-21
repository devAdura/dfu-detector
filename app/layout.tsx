import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

const title = "DFU Explain — Explainable diabetic foot screening";
const description =
  "An explainable deep-learning research prototype for diabetic foot ulcer screening using ResNet50 and Grad-CAM.";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") || requestHeaders.get("host") || "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") || (host.startsWith("localhost") ? "http" : "https");
  const socialImage = `${protocol}://${host}/og.png`;

  return {
    title,
    description,
    openGraph: {
      type: "website",
      title,
      description,
      images: [{ url: socialImage, width: 1536, height: 1024, alt: "DFU Explain social preview" }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [socialImage],
    },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
