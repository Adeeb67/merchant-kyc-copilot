import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'KycCopilot | Autonomous Merchant KYC & Document Verification',
  description: 'Production-grade Indian FinTech onboarding copilot with OpenCV quality gate, Gemini 2.5 Flash extraction, and compliance cross-match engine.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased selection:bg-blue-600 selection:text-white">
        {children}
      </body>
    </html>
  );
}
