import {
  OFICINAS_CONGRESSO,
  normalizarNomeUnidade,
  obterCotaUnidade,
  calcularOcupacaoUnidade,
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
    expect(obterCotaUnidade('Saberes que alimentam', 'CEI Orquídeas')).toBe(9);
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
});
