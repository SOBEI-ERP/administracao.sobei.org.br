export default function AdminFooter() {
  return (
    <footer className="admin-footer">
      <div className="admin-footer__inner">
        <p className="admin-footer__copyright">
          &copy; {new Date().getFullYear()} SOBEI — Sociedade Beneficente Equilíbrio de Interlagos. Todos os direitos reservados.
        </p>
        <p className="admin-footer__meta">
          Ambiente Administrativo Seguro • Versão 2.4.0 (Stateless JWT)
        </p>
      </div>
    </footer>
  );
}
