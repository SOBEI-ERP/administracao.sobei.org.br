import {
  OFICINAS_CONGRESSO,
  normalizarNomeUnidade,
  obterCotaUnidade,
  calcularOcupacaoUnidade,
  calcularOcupacaoOutrasOsc,
  COTA_OUTRAS_OSC_POR_OFICINA,
} from '../congressoOficinas';

describe('congressoOficinas - Regras de Cotas e Limites por Unidade', () => {
  test('deve conter as 23 oficinas cadastradas com cotas por unidade', () => {
    expect(OFICINAS_CONGRESSO.length).toBe(23);
    OFICINAS_CONGRESSO.forEach((of) => {
      expect(of.tema).toBeDefined();
      expect(of.ministrante).toBeDefined();
      expect(of.limitesPorUnidade).toBeDefined();
      expect(typeof of.limitesPorUnidade.Montanaro).toBe('number');
    });
  });

  test('normalizarNomeUnidade deve tratar prefixos e acentuação', () => {
    expect(normalizarNomeUnidade('CEI Montanaro')).toBe('Montanaro');
    expect(normalizarNomeUnidade('CEI Leblon')).toBe('Leblon');
    expect(normalizarNomeUnidade('CEI Sabiás')).toBe('Sabiás');
    expect(normalizarNomeUnidade('CEI Sabias')).toBe('Sabiás');
    expect(normalizarNomeUnidade('CEI Cerejeiras / Jacomo Tatto')).toBe('Cerejeiras');
    expect(normalizarNomeUnidade('Orquídeas')).toBe('Orquídeas');
  });

  test('obterCotaUnidade deve retornar os valores corretos da planilha', () => {
    expect(obterCotaUnidade('Quem dança seus males espanta!', 'CEI Montanaro')).toBe(8);
    expect(obterCotaUnidade('Quem dança seus males espanta!', 'CEI Leblon')).toBe(3);
    expect(obterCotaUnidade('Entre contos, brincadeiras e canções', 'CEI Montanaro')).toBe(2);
    expect(obterCotaUnidade('Entre contos, brincadeiras e canções', 'CEI Leblon')).toBe(1);
    expect(obterCotaUnidade('Entre contos, brincadeiras e canções', 'CEI Orquídeas')).toBe(6);
    expect(obterCotaUnidade('Entre contos, brincadeiras e canções', 'CEI Ipês')).toBe(2);
    expect(obterCotaUnidade('Saberes que alimentam', 'CEI Orquídeas')).toBe(9);
    expect(obterCotaUnidade('Vivências para refletir sobre cuidados corporais', 'CEI Cedro')).toBe(3);
    expect(obterCotaUnidade('Inclusão no lúdico', 'CEI Cedro')).toBe(3);
    expect(obterCotaUnidade('Rodas e brincadeiras cantadas', 'CEI Orquídeas')).toBe(3);
    expect(obterCotaUnidade('Jogos Teatrais', 'CEI Cedro')).toBe(3);
    expect(obterCotaUnidade('Jogos Teatrais', 'CEI Ipês')).toBe(2);
  });

  test('calcularOcupacaoUnidade deve calcular vagas ocupadas e bloquear se esgotada', () => {
    const inscritosMock = [
      { id: 1, tipoOsc: 'SOBEI', unidade: 'CEI Leblon', oficina: 'Entre contos, brincadeiras e canções' },
      { id: 2, tipoOsc: 'SOBEI', unidade: 'CEI Montanaro', oficina: 'Entre contos, brincadeiras e canções' },
    ];

    // Para o Leblon (limite = 1): com 1 pessoa já alocada, deve constar esgotada para uma nova participante
    const ocupLeblonNova = calcularOcupacaoUnidade(
      'Entre contos, brincadeiras e canções',
      'CEI Leblon',
      inscritosMock,
      null
    );
    expect(ocupLeblonNova.limite).toBe(1);
    expect(ocupLeblonNova.ocupadas).toBe(1);
    expect(ocupLeblonNova.disponiveis).toBe(0);
    expect(ocupLeblonNova.esgotada).toBe(true);

    // Para a própria participante que já possui a vaga (id: 1), a contagem própria é desconsiderada
    const ocupLeblonPropria = calcularOcupacaoUnidade(
      'Entre contos, brincadeiras e canções',
      'CEI Leblon',
      inscritosMock,
      1
    );
    expect(ocupLeblonPropria.ocupadas).toBe(0);
    expect(ocupLeblonPropria.esgotada).toBe(false);

    // Para Montanaro (limite = 2): com 1 pessoa alocada, ainda resta 1 vaga
    const ocupMontanaro = calcularOcupacaoUnidade(
      'Entre contos, brincadeiras e canções',
      'CEI Montanaro',
      inscritosMock,
      null
    );
    expect(ocupMontanaro.limite).toBe(2);
    expect(ocupMontanaro.ocupadas).toBe(1);
    expect(ocupMontanaro.disponiveis).toBe(1);
    expect(ocupMontanaro.esgotada).toBe(false);
  });

  test('calcularOcupacaoOutrasOsc deve respeitar cota de 10 vagas para participantes de outras OSCs', () => {
    expect(COTA_OUTRAS_OSC_POR_OFICINA).toBe(10);

    const inscritosMock = [];
    for (let i = 1; i <= 10; i++) {
      inscritosMock.push({
        id: i,
        tipoOsc: 'OUTRA',
        outraOsc: 'Instituto Esperança ' + i,
        oficina: 'Quem dança seus males espanta!',
      });
    }

    // Para nova participante de outra OSC quando já existem 10 alocadas: deve constar esgotada
    const ocupOutraNova = calcularOcupacaoOutrasOsc(
      'Quem dança seus males espanta!',
      inscritosMock,
      null
    );
    expect(ocupOutraNova.limite).toBe(10);
    expect(ocupOutraNova.ocupadas).toBe(10);
    expect(ocupOutraNova.disponiveis).toBe(0);
    expect(ocupOutraNova.esgotada).toBe(true);

    // Para a própria participante que já ocupa a vaga (id: 1): 9 restantes, não esgotada
    const ocupOutraPropria = calcularOcupacaoOutrasOsc(
      'Quem dança seus males espanta!',
      inscritosMock,
      1
    );
    expect(ocupOutraPropria.ocupadas).toBe(9);
    expect(ocupOutraPropria.disponiveis).toBe(1);
    expect(ocupOutraPropria.esgotada).toBe(false);
  });
});
