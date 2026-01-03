import { Playlist, SoundEffect } from '../types';

export const PLAYLISTS: Playlist[] = [
    {
        id: 'combat',
        name: 'Combate Intenso',
        tracks: [
            { name: 'A Batalha Final', url: 'https://cdn.pixabay.com/audio/2022/08/18/audio_2430a6c374.mp3' },
            { name: 'Luta Épica', url: 'https://cdn.pixabay.com/audio/2023/08/03/audio_eb3893c563.mp3' },
        ]
    },
    {
        id: 'exploration',
        name: 'Exploração Misteriosa',
        tracks: [
            { name: 'Perdido na Floresta', url: 'https://cdn.pixabay.com/audio/2022/10/25/audio_51b585790c.mp3' },
            { name: 'Ambiente de Caverna', url: 'https://cdn.pixabay.com/audio/2022/02/07/audio_c3b999c07a.mp3' },
        ]
    },
    {
        id: 'tavern',
        name: 'Taverna Aconchegante',
        tracks: [
            { name: 'Música de Taverna', url: 'https://cdn.pixabay.com/audio/2022/05/29/audio_671775d7e4.mp3' },
            { name: 'O Conto do Bardo', url: 'https://cdn.pixabay.com/audio/2022/05/29/audio_d08d249257.mp3' },
        ]
    }
];

export const SOUND_EFFECTS: SoundEffect[] = [
    { id: 'wolf-howl', name: 'Uivo de Lobo', url: 'https://cdn.pixabay.com/audio/2022/02/10/audio_f25492d11c.mp3' },
    { id: 'thunder', name: 'Trovão', url: 'https://cdn.pixabay.com/audio/2022/04/04/audio_998122340b.mp3' },
    { id: 'swords-clash', name: 'Espadas', url: 'https://cdn.pixabay.com/audio/2023/04/03/audio_5d2e09b307.mp3' },
    { id: 'creepy-door', name: 'Porta Rangendo', url: 'https://cdn.pixabay.com/audio/2022/03/24/audio_382352fa61.mp3' },
    { id: 'scream', name: 'Grito', url: 'https://cdn.pixabay.com/audio/2022/08/16/audio_f13905c128.mp3' },
    { id: 'wind', name: 'Vento', url: 'https://cdn.pixabay.com/audio/2022/05/17/audio_e290f6556e.mp3' },
];