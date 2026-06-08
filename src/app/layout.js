import './globals.css';
import '../styles/components.css';
import '../styles/landing.css';
import '../styles/forms.css';
import '../styles/sidebar.css';
import '../styles/admin.css';
import '../styles/cards.css';
import '../styles/modal.css';
import '../styles/consulta-modal.css';
import '../styles/statistics.css';
import QueryProvider from '@/components/QueryProvider';
import { AuthProvider } from '@/contexts/AuthContext';

export const metadata = {
  title: 'SOBEI - Portal de Denúncias',
  description:
    'Canal de comunicação e denúncias da Sociedade Beneficente Equilíbrio de Interlagos. Relatar condutas inadequadas, violações éticas ou irregularidades de forma segura e confidencial.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>
        <QueryProvider>
          <AuthProvider>{children}</AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
