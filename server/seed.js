export const SEED_DATA = {
  users: [
    {
      id: 'u-alice',
      name: 'Alice Guerreira',
      email: 'alice@exemplo.com',
      password: 'password', // Em produção, use hash!
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alice',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'u-bob',
      name: 'Bob o Mago',
      email: 'bob@exemplo.com',
      password: 'password',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bob',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'u-demo',
      name: 'Mestre da Masmorra',
      email: 'demo@demo.com',
      password: 'password',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
      createdAt: new Date().toISOString(),
    },
  ],
  campaigns: [
    {
      id: 'c-mock-1',
      ownerId: 'u-demo',
      name: 'A Lenda do Dragão de Aço',
      system: 'dnd5e',
      description: 'Uma aventura épica...',
      coverUrl: 'https://images.unsplash.com/photo-1519074069444-1ba4fff66d16?q=80&w=1000&auto=format&fit=crop',
      theme: 'heroic',
      status: 'active',
      schedule: { frequency: 'weekly', day: 'Sábado', time: '19:00' },
      players: { current: 5, max: 6, list: ['u-alice', 'u-bob', 'u-charlie', 'u-diana', 'u-evan'] },
      lore: { worldName: 'Nortúndria', hooks: '...' },
      scenes: [
        {
          id: 'scene-initial',
          name: 'Taverna do Javali Caolho',
          imageUrl: 'https://cdn.builder.io/api/v1/image/assets%2F3926222235484de6a54f738596b4317f%2F7f1a3962b9a74284812f864e43f110c9',
          grid: { size: 70, color: '#FFFFFF', alpha: 0.2, cols: 40, rows: 30, unitsPerSquare: 1.5 },
          ambientLight: 0.4,
          fogPath: '',
          obstacles: [],
          lightZones: [],
          audioZones: [],
          triggerZones: [],
          drawings: [],
          tokens: []
        }
      ],
      activeSceneId: 'scene-initial',
      audioSettings: { playlists: [], soundboard: [] },
      createdAt: new Date().toISOString(),
    }
  ],
  characters: [],
  token_templates: [],
  handouts: [],
  chat_messages: [],
  journal_entries: [],
  projects: [],
  translations: []
};
