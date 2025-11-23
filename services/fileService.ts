
import { ApiResponse } from '../types';

/**
 * Serviço de Gerenciamento de Arquivos
 * 
 * ATENÇÃO PARA MIGRAÇÃO DE BACKEND:
 * Atualmente, este serviço converte arquivos para Base64 para armazenar no LocalStorage.
 * 
 * Quando mover para o servidor:
 * 1. Altere o método `upload` para enviar um FormData para seu endpoint (ex: /api/upload).
 * 2. O servidor deve retornar a URL pública do arquivo (S3, Cloudinary, etc).
 * 3. O Frontend não precisará de alterações, pois espera uma Promise<string> (a URL).
 */

export const fileService = {
  /**
   * Realiza o upload de um arquivo e retorna sua URL.
   * @param file O arquivo vindo do input type="file"
   */
  upload: async (file: File): Promise<ApiResponse<string>> => {
    // VALIDAÇÃO 1: Verificar se o arquivo existe
    if (!file) {
      return {
        success: false,
        message: '❌ Nenhum arquivo selecionado.'
      };
    }

    // VALIDAÇÃO 2: Verificar tipo de arquivo (imagens e áudio)
    const ALLOWED_TYPES = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/bmp',
      'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/aac', 'audio/flac', 'audio/mp4', 'audio/x-m4a'
    ];
    if (!ALLOWED_TYPES.includes(file.type)) {
      return {
        success: false,
        message: `❌ Tipo de arquivo inválido: ${file.type || 'desconhecido'}.\nPermitido: Imagens (JPG, PNG, GIF, WEBP) e Áudio (MP3, WAV, OGG, AAC, FLAC).`
      };
    }

    // VALIDAÇÃO 3: Verificar tamanho do arquivo
    const MAX_SIZE_MB = 10;
    const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);

    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      return {
        success: false,
        message: `❌ Arquivo muito grande: ${fileSizeMB}MB.\nO limite máximo é ${MAX_SIZE_MB}MB.`
      };
    }

    // VALIDAÇÃO 4: Verificar tamanho mínimo (evitar arquivos corrompidos)
    const MIN_SIZE_KB = 1;
    if (file.size < MIN_SIZE_KB * 1024) {
      return {
        success: false,
        message: `❌ Arquivo muito pequeno ou corrompido.\nTamanho mínimo: ${MIN_SIZE_KB}KB.`
      };
    }

    // VALIDAÇÃO 5: Verificar extensão do arquivo
    const fileName = file.name.toLowerCase();
    const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.mp3', '.wav', '.ogg', '.aac', '.flac', '.m4a'];
    const hasValidExtension = validExtensions.some(ext => fileName.endsWith(ext));

    if (!hasValidExtension) {
      return {
        success: false,
        message: `❌ Extensão de arquivo inválida.\nExtensões permitidas: ${validExtensions.join(', ')}`
      };
    }

    console.log(`[FileService] Uploading: ${file.name} (${fileSizeMB}MB, ${file.type})`);

    // SIMULAÇÃO (MOCK): Converte para Base64
    return new Promise((resolve) => {
      const reader = new FileReader();

      reader.onloadend = () => {
        const result = reader.result as string;

        // Validar se o resultado é válido
        if (!result || (!result.startsWith('data:image/') && !result.startsWith('data:audio/'))) {
          resolve({
            success: false,
            message: '❌ Erro ao processar a imagem.\nO arquivo pode estar corrompido.'
          });
          return;
        }

        console.log(`[FileService] Upload successful: ${file.name}`);

        // Simula um delay de rede
        setTimeout(() => {
          resolve({
            success: true,
            data: result,
            message: `✅ Upload concluído: ${file.name} (${fileSizeMB}MB)`
          });
        }, 500);
      };

      reader.onerror = (error) => {
        console.error('[FileService] Upload error:', error);
        resolve({
          success: false,
          message: '❌ Erro ao ler o arquivo.\nTente novamente ou escolha outro arquivo.'
        });
      };

      reader.onabort = () => {
        console.warn('[FileService] Upload aborted');
        resolve({
          success: false,
          message: '⚠️ Upload cancelado pelo usuário.'
        });
      };

      try {
        reader.readAsDataURL(file);
      } catch (error) {
        console.error('[FileService] Exception during upload:', error);
        resolve({
          success: false,
          message: '❌ Erro inesperado ao processar o arquivo.'
        });
      }
    });

    // --- IMPLEMENTAÇÃO FUTURA (EXEMPLO) ---
    /*
    const formData = new FormData();
    formData.append('file', file);
    
    try {
        const token = localStorage.getItem('auth_token');
        const res = await fetch('https://api.questbinder.com/upload', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });
        const data = await res.json();
        return { success: true, data: data.url };
    } catch (e) {
        return { success: false, message: 'Falha no upload.' };
    }
    */
  }
};
