// ============================================
// SOBEI Portal — Zod Schemas
// ============================================

import { z } from 'zod';

// Schema para denúncia anônima
export const denunciaAnonimaSchema = z.object({
  tipo: z.literal('anonima'),
  unidade: z.string().min(1, 'Selecione a unidade'),
  descricao: z.string()
    .min(10, 'Descreva os fatos com pelo menos 10 caracteres')
    .max(5000, 'A descrição não pode ter mais de 5000 caracteres'),
  envolvidos: z.string()
    .max(1000, 'O campo envolvidos não pode ter mais de 1000 caracteres')
    .optional(),
  testemunhas: z.string()
    .max(1000, 'O campo testemunhas não pode ter mais de 1000 caracteres')
    .optional(),
});

// Schema para denúncia identificada
export const denunciaIdentificadaSchema = z.object({
  tipo: z.literal('identificada'),
  nomeCompleto: z.string()
    .min(2, 'Informe seu nome completo')
    .max(150, 'O nome completo não pode ter mais de 150 caracteres'),
  email: z.string()
    .min(1, 'Informe seu email')
    .max(150, 'O email não pode ter mais de 150 caracteres')
    .email('Informe um email válido')
    .regex(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9-]{2,}\.[a-zA-Z0-9-]{2,}(\.[a-zA-Z0-9-]{2,})?$/, 'Informe um email válido com domínio existente'),
  telefone: z.string()
    .min(14, 'Informe um número de telefone válido (mínimo 14 caracteres)')
    .max(15, 'O telefone não pode ter mais de 15 caracteres')
    .regex(/^\(\d{2}\)\s\d{4,5}-\d{4}$/, 'Informe um telefone válido no formato (XX) XXXXX-XXXX'),
  unidade: z.string().min(1, 'Selecione a unidade'),
  descricao: z.string()
    .min(10, 'Descreva os fatos com pelo menos 10 caracteres')
    .max(5000, 'A descrição não pode ter mais de 5000 caracteres'),
  envolvidos: z.string()
    .max(1000, 'O campo envolvidos não pode ter mais de 1000 caracteres')
    .optional(),
  testemunhas: z.string()
    .max(1000, 'O campo testemunhas não pode ter mais de 1000 caracteres')
    .optional(),
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
