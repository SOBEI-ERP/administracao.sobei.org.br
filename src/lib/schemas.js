// ============================================
// SOBEI Portal — Zod Schemas
// ============================================

import { z } from 'zod';

// Schema para denúncia anônima
export const denunciaAnonimaSchema = z.object({
  tipo: z.literal('anonima'),
  unidade: z.string().min(1, 'Selecione a unidade'),
  descricao: z.string().min(10, 'Descreva os fatos com pelo menos 10 caracteres'),
  envolvidos: z.string().optional(),
  testemunhas: z.string().optional(),
});

// Schema para denúncia identificada
export const denunciaIdentificadaSchema = z.object({
  tipo: z.literal('identificada'),
  nomeCompleto: z.string().min(2, 'Informe seu nome completo'),
  email: z.string().email('Informe um email válido'),
  telefone: z.string().min(8, 'Informe um número de telefone válido'),
  unidade: z.string().min(1, 'Selecione a unidade'),
  descricao: z.string().min(10, 'Descreva os fatos com pelo menos 10 caracteres'),
  envolvidos: z.string().optional(),
  testemunhas: z.string().optional(),
});

// Schema discriminado para o formulário
export const denunciaSchema = z.discriminatedUnion('tipo', [
  denunciaAnonimaSchema,
  denunciaIdentificadaSchema,
]);

// Schema para login
export const loginSchema = z.object({
  login: z.string().min(1, 'Informe seu login'),
  senha: z.string().min(1, 'Informe sua senha'),
});

// Schema para medidas adotadas (modal em andamento)
export const medidasSchema = z.object({
  medidasAdotadas: z.string().optional(),
});

// Schema para fechar denúncia
export const fecharDenunciaSchema = z.object({
  relatorioFinal: z.string().min(1, 'O relatório final é obrigatório para fechar a denúncia'),
});
