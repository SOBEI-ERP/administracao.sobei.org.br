import './globals.css';
import QueryProvider from '@/components/QueryProvider';
import { AuthProvider } from '@/contexts/AuthContext';

export const metadata = {
  title: 'SOBEI - Portal de Denúncias',
  description:
    'Canal de comunicação e denúncias da Sociedade Beneficente Equilíbrio de Interlagos. Relatar condutas inadequadas, violações éticas ou irregularidades de forma segura e confidencial.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <QueryProvider>
          <AuthProvider>{children}</AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
