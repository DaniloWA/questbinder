
import { HandoutType, HandoutTheme } from '../types';

export interface HandoutTemplate {
    id: string;
    label: string;
    description: string;
    type: HandoutType;
    theme: HandoutTheme;
    content: string;
}

export const HANDOUT_TEMPLATES: HandoutTemplate[] = [
    {
        id: 'blank',
        label: 'Em Branco',
        description: 'Comece do zero.',
        type: 'text',
        theme: 'standard',
        content: ''
    },
    {
        id: 'royal_letter',
        label: 'Carta Real',
        description: 'Um decreto oficial ou carta nobre.',
        type: 'text',
        theme: 'parchment',
        content: `# Decreto Real\n\nPor ordem de Sua Majestade, o Rei...\n\n> "Aquele que encontrar a relíquia perdida será recompensado com terras e títulos."\n\n**Assinado:**\n*Lorde Commander*`
    },
    {
        id: 'wanted_poster',
        label: 'Cartaz de Procurado',
        description: 'Recompensa por captura.',
        type: 'text',
        theme: 'parchment',
        content: `# PROCURADO\n\n## Vivo ou Morto\n\n**Nome:** O Bandido Mascarado\n\n**Crimes:** Roubo de gado, insulto à coroa.\n\n### Recompensa: 500 Peças de Ouro\n\n*Contatar a guarda local imediatamente.*`
    },
    {
        id: 'terminal_log',
        label: 'Log de Terminal',
        description: 'Registro de computador corrompido ou sci-fi.',
        type: 'text',
        theme: 'terminal',
        content: `# SYSTEM LOG 2049-10-24\n\n> ACCESS: RESTRICTED\n> USER: ADMIN\n\nConexão estabelecida...\nBaixando arquivos...\n\nERROR: Data corruption detected in sector 7.\n\n\`\`\`\nWARNING: CRITICAL FAILURE IMMINENT\n\`\`\``
    },
    {
        id: 'ancient_tome',
        label: 'Tomo Arcano',
        description: 'Páginas de um livro de magias antigo.',
        type: 'text',
        theme: 'arcane',
        content: `# O Ritual do Vazio\n\nPara invocar as sombras, deve-se primeiro extinguir a luz da esperança.\n\n*Ingredientes:*\n* Pó de Osso\n* Lágrima de Banshee\n\n> Cuidado: Não olhe diretamente para o abismo.`
    },
    {
        id: 'image_map',
        label: 'Mapa de Tesouro',
        description: 'Template para exibir uma imagem de mapa.',
        type: 'image',
        theme: 'parchment',
        content: 'https://i.imgur.com/example_map.jpg'
    }
];
