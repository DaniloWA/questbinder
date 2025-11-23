/**
 * Padrão de resposta para serviços e APIs simuladas.
 * @template T O tipo do dado retornado (opcional).
 */
export interface ApiResponse<T = undefined> {
  /** Indica se a operação foi bem-sucedida */
  success: boolean;
  /** O payload da resposta, presente apenas se success for true */
  data?: T;
  /** Mensagem de erro ou sucesso para exibição */
  message?: string;
}