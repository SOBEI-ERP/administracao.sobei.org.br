export default function AdminDashboardPage() {
  return (
    <div>
      <h1 className="dashboard-home__title">Painel de administração de denúncias</h1>

      <div className="dashboard-home__content">
        <p className="dashboard-home__text">
          Bem-vindo ao painel de administração de denúncias. Este painel foi desenvolvido para
          fornecer à equipe de conformidade e auditoria uma visão centralizada, segura e eficiente
          de todos os relatos registrados, permitindo um fluxo de trabalho estruturado e análises
          orientadas a dados.
        </p>

        <p className="dashboard-home__text">
          Abaixo estão descritas as páginas que compõem o sistema e como utilizá-las através da
          barra lateral de navegação:
        </p>

        <h2 className="dashboard-home__subtitle">Gestão de Demandas (Menu Lateral)</h2>

        <p className="dashboard-home__text">
          A triagem, o andamento e o histórico das denúncias são gerenciados diretamente pelas
          seleções da sua barra lateral. Ao clicar em uma das categorias, a tela principal listará
          apenas os registros pertencentes àquele status específico, permitindo uma navegação
          rápida e focada. A barra lateral organiza o fluxo de trabalho nas seguintes páginas:
        </p>

        <ul className="dashboard-home__list">
          <li>
            <strong>Na Fila:</strong> Central de recebimento. Exibe todos os novos relatos que
            deram entrada no sistema e que ainda aguardam a triagem inicial e a primeira análise
            da equipe.
          </li>
          <li>
            <strong>Em Aberto (Em Andamento):</strong> Mostra os casos que já foram validados,
            receberam uma categoria e estão em fase ativa de investigação, apuração interna ou
            coleta de evidências.
          </li>
          <li>
            <strong>Finalizadas:</strong> Lista todos os processos que tiveram sua investigação
            concluída, com o parecer técnico definitivo emitido e as devidas resoluções aplicadas.
          </li>
          <li>
            <strong>Arquivadas:</strong> Reúne os relatos que foram encerrados sem a necessidade
            de uma investigação profunda (como casos duplicados ou relatos com informações
            insuficientes) e as denúncias identificadas como Falsas, isolando-as para o histórico
            institucional.
          </li>
        </ul>

        <p className="dashboard-home__text">
          <strong>Visualização e Ações:</strong> Ao selecionar qualquer denúncia na lista da
          página ativa, o painel expande os detalhes completos do caso: unidade do ocorrido,
          descrição factual, envolvidos e testemunhas. Nesta mesma área, o administrador pode
          definir a categoria do chamado e protocolar as respostas oficiais que o denunciante
          visualizará ao consultar o status.
        </p>
      </div>
    </div>
  );
}
