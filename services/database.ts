
/**
 * @deprecated
 * Este arquivo foi substituído por 'data/api.ts' e 'services/apiService.ts'.
 * Por favor, migre as importações para usar os novos serviços.
 * A lógica aqui foi removida para garantir consistência com a nova arquitetura.
 */
import { apiService } from './apiService';

// Re-exportação legada para compatibilidade temporária, se necessário.
// O ideal é remover o uso de 'db' diretamente nos componentes.
export const db = {
  find: (c: any, p?: any) => apiService.get(c, p).then(r => r.data || []),
  findOne: (c: any, p: any) => apiService.get(c, p).then(r => r.data?.[0]),
  create: (c: any, d: any) => apiService.post(c, d).then(r => r.data),
  update: (c: any, id: any, d: any) => apiService.put(c, id, d).then(r => r.data),
  delete: (c: any, id: any) => apiService.delete(c, id).then(r => r.success),
};
