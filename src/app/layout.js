import './globals.css';
import { Inter, Montserrat } from 'next/font/google';
import QueryProvider from '@/components/QueryProvider';
import { AuthProvider } from '@/contexts/AuthContext';
import { SpeedInsights } from '@vercel/speed-insights/next';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

const montserrat = Montserrat({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-montserrat',
});

export const metadata = {
  metadataBase: new URL('https://administracao.sobei.org.br'),
  title: 'SOBEI - Painel Administrativo',
  description:
    'Painel unificado de gestão administrativa, denúncias, processos seletivos e operações da SOBEI.',
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${montserrat.variable}`} suppressHydrationWarning>
      <body suppressHydrationWarning>
        <QueryProvider>
          <AuthProvider>{children}</AuthProvider>
        </QueryProvider>
        {process.env.VERCEL ? <SpeedInsights /> : null}
      </body>
    </html>
  );
}
