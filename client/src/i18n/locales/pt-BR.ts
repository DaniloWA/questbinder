/**
 * Portuguese (Brazil) Translations
 * QuestBinder VTT - Primary Locale
 */

export default {
  common: {
    actions: {
      save: {
        label: 'Salvar',
      },
      cancel: {
        label: 'Cancelar',
      },
      confirm: {
        label: 'Confirmar',
      },
      delete: {
        label: 'Excluir',
      },
      close: {
        label: 'Fechar',
      },
      retry: {
        label: 'Tentar Novamente',
      },
      edit: {
        label: 'Editar',
      },
      create: {
        label: 'Criar',
      },
      add: {
        label: 'Adicionar',
      },
      remove: {
        label: 'Remover',
      },
      search: {
        label: 'Buscar',
      },
      clear: {
        label: 'Limpar',
      },
      reset: {
        label: 'Resetar',
      },
      apply: {
        label: 'Aplicar',
      },
    },
    undo: {
      label: 'Desfazer',
    },
    redo: {
      label: 'Refazer',
    },
    me: 'Você',
  },
  states: {
    loading: {
      message: 'Carregando...',
    },
    saving: {
      message: 'Salvando...',
    },
    error: {
      title: 'Erro',
      description: 'Algo deu errado.',
    },
    success: {
      message: 'Sucesso!',
    },
    empty: {
      message: 'Nenhum item encontrado.',
    },
    notFound: {
      message: 'Não encontrado.',
    },
  },
  validation: {
    required: {
      errorMessage: 'Este campo é obrigatório.',
    },
    email: {
      errorMessage: 'E-mail inválido.',
    },
    minLength: {
      errorMessage: 'Mínimo de :min caracteres.',
    },
    maxLength: {
      errorMessage: 'Máximo de :max caracteres.',
    },
  },
  plurals: {
    items: '{0} Nenhum item|{1} :count item|[2,*] :count itens',
    characters: '{0} Nenhum personagem|{1} :count personagem|[2,*] :count personagens',
    tokens: '{0} Nenhum token|{1} :count token|[2,*] :count tokens',
  },
  time: {
    seconds: '{1} :count segundo|[2,*] :count segundos',
    minutes: '{1} :count minuto|[2,*] :count minutos',
    hours: '{1} :count hora|[2,*] :count horas',
  },
  duration: 'Duração',
  shareTooltip: 'Compartilhar',
  hero: 'Herói',
  creature: 'Criatura',
  passivePerception: 'Percepção Passiva',
  visible: 'Visível',
  hidden: 'Oculto',
  hp: 'PV',
  resource: 'Recurso',
  unknownEffect: 'Efeito Desconhecido',
  activeEffects: 'Efeitos Ativos',
  acModifier: 'Mod CA',
  ac: 'CA',
  speedModifier: 'Mod Desl.',
  speed: 'Deslocamento',
  sheet: 'Ficha',
  cancel: 'Cancelar',
  permissions: {
    denied: 'Permissão Negada',
  },
  access: {
    restricted: 'Acesso Restrito',
    featureLocked: 'Funcionalidade Bloqueada',
    upgradeRequired: 'Upgrade Necessário',
    upgradeToAccess: 'Faça upgrade para acessar :feature',
    permissionDenied: 'Permissão Negada',
    roleRequired: 'Requer função :role',
    clickToUpgrade: 'Clique para ver planos',
  },
  vtt: {
    cursor: {
      settings: {
        title: 'Configurações de Cursor',
        editingLabel: 'Editando',
        myCursor: 'Meu Cursor',
        playersLabel: 'Jogadores',
        noPlayers: 'Nenhum jogador online',
        defaultName: 'Nome',
        setOverride: 'Definir Override',
        clearOverride: 'Limpar',
      },
      editor: {
        tabs: {
          general: 'Geral',
          animations: 'Animações',
          ping: 'Ping',
          trail: 'Rastro',
          options: 'Opções',
        },
        general: {
          shape: {
            label: 'Formato',
          },
          name: {
            label: 'Nome de Exibição',
          },
          color: {
            label: 'Cor Principal',
          },
        },
        animations: {
          style: {
            label: 'Estilo do Clique',
          },
          leftColor: {
            label: 'Botão Esquerdo',
          },
          rightColor: {
            label: 'Botão Direito',
          },
        },
        ping: {
          style: {
            label: 'Estilo do Ping',
          },
          color: {
            label: 'Cor do Ping',
          },
        },
        preview: {
          left: 'Clique Esq.',
          right: 'Clique Dir.',
          ping: 'Ping (Segurar)',
        },
        trail: {
          enable: 'Habilitar Rastro/Trilha',
          style: 'Estilo do Rastro',
          color: 'Cor do Rastro',
          length: 'Comprimento',
          thickness: 'Grossura',
          thin: 'Fino',
          thick: 'Grosso',
          short: 'Curto',
          long: 'Longo',
        },
        options: {
          showOthersTrails: 'Ver Rastros de Outros',
          showMyTrail: 'Ver Meu Rastro',
          explosionOnCollision: 'Explosão ao Colidir',
          showToolActivity: 'Mostrar Ferramentas',
          showToolActivityDesc: 'Exibir ícone da ferramenta ativa (ex: Régua, Combate) junto ao cursor.',
          showStatusActivity: 'Mostrar Status',
          showStatusActivityDesc: 'Exibir ícones de status (ex: Digitando, Em Combate).',
        },
        overrides: {
          gmSet: 'Definido pelo Mestre',
          locked: 'Bloqueado',
        },
      },
      animations: {
        ripple: 'Onda',
        burst: 'Explosão',
        sparkle: 'Brilho',
        pulse: 'Pulso',
        vortex: 'Vórtice',
        shard: 'Estilhaços',
        ring: 'Anel',
        echo: 'Eco',
        orb: 'Orbe',
      },
      pings: {
        radar: 'Radar',
        beacon: 'Farol',
        sonar: 'Sonar',
        target: 'Alvo',
        flare: 'Chama',
        diamond: 'Diamante',
        cross: 'Cruz',
      },
      trails: {
        line: 'Linha Suave',
        particles: 'Partículas',
        dice: 'Dados (D20)',
        sparkles: 'Estrelas',
        smoke: 'Fumaça',
        electric: 'Elétrico',
      },
      notifications: {
        afk: ':name está ausente (AFK)',
        active: ':name retornou',
      },
      afk: {
        title: 'Você está Ausente',
        desc: 'Mexa o mouse ou interaja com a tela para retornar.',
        warning_title: 'Inatividade Detectada!',
        warning_desc: 'Você será desconectado em :seconds segundos.',
      },
    },
    tools: {
      toolbar: {
        selectTool: {
          button: {
            label: 'Selecionar',
            tooltip: 'Ferramenta de seleção (V)',
          },
        },
        rulerTool: {
          button: {
            label: 'Régua',
            tooltip: 'Medir distâncias (M)',
          },
        },
        drawingTools: {
          group: {
            label: 'Desenhar',
          },
          brush: {
            button: {
              label: 'Pincel Livre',
              tooltip: 'Desenho à mão livre',
            },
          },
          eraser: {
            button: {
              label: 'Apagar Desenhos',
              tooltip: 'Remover desenhos',
            },
          },
        },
        cursorSettings: {
          button: {
            label: 'Cursores',
            tooltip: 'Configurações de cursor',
          },
        },
        architectureTools: {
          group: {
            label: 'Arquitetura',
          },
          wall: {
            button: {
              label: 'Parede',
              tooltip: 'Desenhar parede',
            },
          },
          freehandWall: {
            button: {
              label: 'Parede Livre (Desenho)',
              tooltip: 'Parede à mão livre',
            },
          },
          smartWall: {
            button: {
              label: 'Parede Inteligente (Magic Wand)',
              tooltip: 'Detectar paredes automaticamente',
            },
          },
          door: {
            button: {
              label: 'Porta',
              tooltip: 'Adicionar porta',
            },
          },
          window: {
            button: {
              label: 'Janela',
              tooltip: 'Adicionar janela',
            },
          },
          eraser: {
            button: {
              label: 'Borracha (Estrutura)',
              tooltip: 'Remover estruturas',
            },
          },
        },
        lightingTools: {
          group: {
            label: 'Iluminação & Neblina',
          },
          lightRect: {
            button: {
              label: 'Luz (Retângulo)',
              tooltip: 'Área de luz retangular',
            },
          },
          lightPoly: {
            button: {
              label: 'Luz (Polígono)',
              tooltip: 'Área de luz poligonal',
            },
          },
          fogOfWar: {
            submenu: {
              title: 'Neblina de Guerra',
            },
            revealPoly: {
              button: {
                label: 'Revelar (Polígono)',
              },
            },
            revealRect: {
              button: {
                label: 'Revelar (Retângulo)',
              },
            },
            reset: {
              button: {
                label: 'Resetar Neblina',
                confirmPrompt: 'Tem certeza que deseja resetar toda a neblina?',
              },
            },
          },
        },
        audioTools: {
          group: {
            label: 'Áudio',
          },
          panel: {
            button: {
              label: 'Painel de Áudio',
              tooltip: 'Abrir painel de áudio',
            },
          },
          zones: {
            submenu: {
              title: 'Zonas de Áudio',
            },
            rect: {
              button: {
                label: 'Zona (Retângulo)',
              },
            },
            poly: {
              button: {
                label: 'Zona (Polígono)',
              },
            },
            eraser: {
              button: {
                label: 'Apagar Zona de Áudio',
              },
            },
          },
        },
        triggerTools: {
          group: {
            label: 'Gatilhos',
          },
          rect: {
            button: {
              label: 'Gatilho (Retângulo)',
            },
          },
          poly: {
            button: {
              label: 'Gatilho (Polígono)',
            },
          },
          eraser: {
            button: {
              label: 'Apagar Gatilho',
            },
          },
        },
        gameplayTools: {
          attackZones: {
            button: {
              label: 'Zonas de Ataque',
              tooltip: 'Gerenciar zonas de ataque',
            },
          },
          diceRoller: {
            button: {
              label: 'Mesa de Dados',
              tooltip: 'Abrir rolador de dados',
            },
          },
          bestiary: {
            button: {
              label: 'Bestiário (Tokens)',
              tooltip: 'Biblioteca de criaturas',
            },
          },
          compendium: {
            button: {
              label: 'Grimório',
              tooltip: 'Compêndio de magias e itens',
            },
          },
          handouts: {
            button: {
              label: 'Recursos',
              tooltip: 'Gerenciar handouts',
            },
          },
          addToken: {
            button: {
              label: 'Novo Token',
              tooltip: 'Adicionar token ao mapa',
            },
          },
          startCombat: {
            button: {
              label: 'Iniciar Combate',
              tooltip: 'Começar encontro de combate',
            },
          },
          endCombat: {
            button: {
              label: 'Encerrar Combate',
              tooltip: 'Finalizar combate atual',
            },
          },
        },
        gmTools: {
          group: {
            label: 'Mestre',
          },
          viewSettings: {
            button: {
              label: 'Visualizar & Sincronizar',
            },
          },
          permissions: {
            button: {
              label: 'Permissões',
            },
          },
          gridCoords: {
            button: {
              label: 'Coordenadas da Grade',
            },
          },
          mapSettings: {
            button: {
              label: 'Configurações do Mapa',
            },
          },
        },
      },
    },
    session: {
      sidebar: {
        tabHeader: {
          chat: {
            label: 'Log & Chat',
          },
          combat: {
            label: 'Combate',
          },
          party: {
            label: 'Grupo',
          },
        },
        popoutButton: {
          tooltip: 'Desacoplar em Nova Janela',
        },
        dockButton: {
          tooltip: 'Acoplar de volta',
        },
        closeButton: {
          tooltip: 'Fechar Sidebar',
        },
        undockedPlaceholder: {
          title: 'Sidebar Desacoplada',
          description: 'A barra lateral está aberta em outra janela.',
          redockButton: {
            label: 'Reacoplar',
          },
          closeSidebarButton: {
            label: 'Fechar Sidebar',
          },
        },
        popupBlocked: {
          warningBanner: {
            title: 'Popup bloqueado!',
            message: 'Clique no ícone na barra de endereço do navegador e permita popups para este site.',
          },
          retryButton: {
            label: 'Tentar Novamente',
          },
          closeButton: {
            label: 'Fechar',
          },
        },
        popoutWindow: {
          title: 'Sidebar do QuestBinder',
        },
        languageToggle: {
          tooltip: 'Alterar Idioma',
        },
      },
    },
    common: {
      hero: 'Herói',
      creature: 'Criatura',
      object: 'Objeto',
      visible: 'Visível',
      hidden: 'Oculto',
      unknownEffect: 'Efeito desconhecido.',
      duration: 'Duração',
      shareTooltip: 'Clique para compartilhar',
      activeEffects: 'Efeitos Ativos',
      ac: 'CA',
      speed: 'Desl.',
      sheet: 'Ficha',
      hp: 'PV',
      resource: 'Recurso',
      passivePerception: 'Percepção Passiva',
      acModifier: 'Modificador de CA',
      speedModifier: 'Modificador de Deslocamento',
      all: 'Todos',
      me: 'Eu',
    },
    tokens: {
      editModal: {
        header: {
          title: {
            creating: 'Novo Token',
            editing: 'Editar Token',
          },
        },
        tabs: {
          basic: {
            label: 'Básico',
          },
          stats: {
            label: 'Atributos',
          },
          appearance: {
            label: 'Aparência',
          },
          permissions: {
            label: 'Permissões',
          },
          general: {
            label: 'Geral',
          },
          style: {
            label: 'Estilo',
          },
          status: {
            label: 'Status',
          },
          light: {
            label: 'Luz',
          },
          auras: {
            label: 'Auras',
          },
          sheet: {
            label: 'Ficha',
          },
          perms: {
            label: 'Permissões',
          },
        },
        general: {
          namePlaceholder: 'Nome do Token',
          sizeLabel: 'Tamanho (Quadrados)',
          speedLabel: 'Movimento (m)',
          dispositionLabel: 'Disposição (IA)',
          dispositions: {
            friendly: 'Aliado',
            neutral: 'Neutro',
            hostile: 'Inimigo',
          },
          vision: {
            title: 'Visão',
            normalRange: 'Alcance Normal',
            normalTooltip: 'Alcance de visão em área iluminada',
            darkvisionRange: 'Visão Escuro',
            darkvisionTooltip: 'Alcance de visão no escuro total',
            overlayGM: 'Cor da Visão (Overlay GM)',
          },
        },
        style: {
          title: 'Forma & Borda',
          positioningTitle: 'Ajuste de Imagem & Posição',
          zoomLabel: 'Zoom',
          rotationLabel: 'Rotação',
          posXLabel: 'Pos X',
          posYLabel: 'Pos Y',
          tintLabel: 'Tintura',
          effectsTitle: 'Efeitos Visuais',
          animationTitle: 'Animação Idle',
          borderStyles: {
            solid: 'Sólido',
            dashed: 'Tracejado',
            dotted: 'Pontilhado',
            double: 'Duplo',
          },
          effects: {
            none: 'Nenhum',
            ghostly: 'Fantasma',
            burning: 'Em Chamas',
            frozen: 'Congelado',
            glitch: 'Glitch',
            outline: 'Contorno',
          },
          animations: {
            none: 'Estático',
            breath: 'Respirar',
            float: 'Flutuar',
            spin: 'Girar',
            wobble: 'Balançar',
          },
        },
        footer: {
          saveToBestiary: 'Salvar no Bestiário',
          bestiaryAbbr: 'Bestiário',
          cancel: 'Cancelar',
          uploading: 'Carregando...',
          save: 'Salvar',
        },
        light: {
          title: 'Luz',
          enabledLabel: 'Emissor de Luz',
          enabledDescription: 'Token ilumina o ambiente?',
          brightRadius: 'Raio Brilhante',
          dimRadius: 'Raio Penumbra',
          colorIntensity: 'Cor e Intensidade',
          animationLabel: 'Animação da Luz',
          animations: {
            none: 'Fixo',
            torch: 'Tocha',
            pulse: 'Pulso',
          },
        },
        status: {
          title: 'Status',
          barsTitle: 'Barras de Status',
          bar1Label: 'Vida (Barra 1)',
          bar2Label: 'Recurso (Barra 2)',
          conditionsTitle: 'Condições Iniciais',
          effectsTitle: 'Efeitos Ativos',
          noEffects: 'Nenhum efeito ativo.',
          auraBadge: 'Aura',
          rounds: 'rodadas',
          removeAuraTooltip: 'Remover e Ignorar Aura',
          removeEffectTooltip: 'Remover Efeito',
        },
        types: {
          pc: 'Herói',
          npc: 'Criatura',
          object: 'Objeto',
        },
        pc: {
          linkSheet: 'Vincular Ficha',
          noLink: 'Sem Vínculo',
          selectHero: 'Selecionar Herói...',
        },
        npc: {
          searchBestiary: 'Buscar no Bestiário',
          searchPlaceholder: 'Ex: Goblin, Dragão...',
        },
        object: {
          quickPresets: 'Presets Rápidos',
          presets: {
            torch: 'Tocha',
            lantern: 'Lanterna',
            campfire: 'Fogueira',
            magic_orb: 'Orbe',
            chest: 'Baú',
            door: 'Porta',
            trap: 'Armadilha',
          },
        },
        displayMode: {
          image: 'Imagem',
          text: 'Sigla',
        },
        preview: {
          alt: 'Pré-visualização do Token',
        },
        nameField: {
          label: 'Nome',
          placeholder: 'Nome do token',
        },
        sizeField: {
          label: 'Tamanho',
        },
        healthField: {
          label: 'Pontos de Vida',
          current: {
            label: 'Atual',
          },
          max: {
            label: 'Máximo',
          },
        },
        imageField: {
          label: 'Imagem',
          placeholder: 'URL da imagem',
        },
        saveButton: {
          label: 'Salvar',
        },
        cancelButton: {
          label: 'Cancelar',
        },
        hover: {
          applyCondition: 'Aplicou **:condition** em :name.',
          shareCondition: 'Compartilhou a condição **:condition**.',
          addCondition: 'Adicionar Condição',
          rollAttribute: 'Rolar Teste de :attr (:mod)',
          testOf: 'Teste de :attr',
        },
        deleteButton: {
          label: 'Excluir Token',
          confirmPrompt: 'Tem certeza que deseja excluir este token?',
        },
        statusBar: {
          public: 'Pública',
          hidden: 'Oculta',
          currentPlaceholder: 'Atual',
          maxPlaceholder: 'Máx',
        },
        permissions: {
          title: 'Controladores do Token',
          noPlayers: 'Nenhum jogador na sessão.',
        },
        sheet: {
          typeLabel: 'Tipo/Raça',
          typePlaceholder: 'Humanoide (Goblin)',
          alignmentLabel: 'Alinhamento',
          alignmentPlaceholder: 'Neutro e Mau',
          crLabel: 'ND (CR)',
          crPlaceholder: '1/4',
          acLabel: 'CA',
          hpFormulaLabel: 'PV (Fórmula)',
          hpFormulaPlaceholder: '2d6',
          speedLabel: 'Deslocamento',
          speedPlaceholder: '9m',
          attributesTitle: 'Atributos',
          sensesLabel: 'Sentidos',
          sensesPlaceholder: 'Visão no escuro 18m...',
          languagesLabel: 'Idiomas',
          languagesPlaceholder: 'Comum, Goblin...',
          notesLabel: 'Ações e Habilidades',
          notesPlaceholder: '**Cimitarra.** +4 para acertar, 1d6+2 dano cortante...',
        },
        auras: {
          newAuraDefaultName: 'Nova Aura',
          constantTrigger: 'Constante',
          effectDefaultName: 'Efeito da Aura',
          newAuraButton: 'Nova Aura',
          customTemplate: 'Personalizada',
          categories: {
            other: 'Outros',
            offensive: 'Ofensiva',
            defensive: 'Defensiva',
            support: 'Suporte',
            control: 'Controle',
          },
          noAurasMessage: 'Nenhuma aura configurada.',
          targetsPrefix: 'Alvos: ',
          backButton: 'Voltar',
          editingTitle: 'Editando Aura',
          nameLabel: 'Nome da Aura',
          categoryLabel: 'Categoria',
          descriptionLabel: 'Descrição / Efeito Narrativo',
          descriptionPlaceholder: 'Descreva o efeito da aura...',
          triggerLabel: 'Gatilho',
          triggerPlaceholder: 'Ex: Início do turno',
          requirementsLabel: 'Requisitos',
          requirementsPlaceholder: 'Ex: Consciente',
          radiusLabel: 'Raio (metros)',
          shapeLabel: 'Formato',
          targetsLabel: 'Alvos',
          targetOptions: {
            allies: 'Aliados',
            enemies: 'Inimigos',
            all: 'Todos',
            self: 'Apenas Eu',
          },
          colorLabel: 'Cor',
          activeLabel: 'Ativa',
          visibleLabel: 'Visível (Jogadores)',
          targetsInRangeLabel: 'Alvos no Alcance',
          bulkIncludeAllies: 'Aliados',
          bulkExcludeEnemies: 'Inimigos',
          bulkIncludeAlliesTooltip: 'Forçar inclusão de todos aliados',
          bulkExcludeEnemiesTooltip: 'Forçar exclusão de todos inimigos',
          noTokensInRange: 'Nenhum token no alcance.',
          includeTooltip: 'Forçar Incluir',
          excludeTooltip: 'Forçar Excluir',
          appliedEffectsLabel: 'Efeitos Aplicados',
          addEffectButton: 'Efeito',
          effectNamePlaceholder: 'Nome do Efeito',
          noEffectsMessage: 'Nenhum efeito configurado. A aura será apenas visual.',
          selectEditMessage: 'Selecione ou crie uma aura para editar.',
        },
      },
      contextMenu: {
        size: 'Tamanho :size x :size',
        openSheet: 'Abrir Ficha',
        shareToken: 'Linkar no Chat',
        edit: 'Editar',
        duplicate: 'Duplicar',
        visible: 'Visível',
        hidden: 'Oculto',
        sendToScene: 'Enviar para Cena',
        selectDestination: 'Selecione o Destino',
        remove: 'Remover Token',
        conditions: 'Condições',
        linkTokenNotify: 'Token linkado no chat.',
        shareTokenNotify: 'Linkou o token :name no chat.',
      },
      hoverCard: {
        healthBar: {
          label: 'Vida',
        },
        conditions: {
          label: 'Condições',
        },
        notes: {
          label: 'Notas',
        },
      },
      hoverPermissions: {
        conditions: {
          label: 'Condições',
        },
      },
      notifications: {
        afk: ':name está ausente (AFK)',
        active: ':name retornou',
      },
      afk: {
        title: 'Você está Ausente',
        desc: 'Mexa o mouse ou interaja com a tela para retornar.',
        warning_title: 'Inatividade Detectada!',
        warning_desc: 'Você será desconectado em :seconds segundos.',
      },
      context_menu: {
        token: {
          move_to_front: 'Mover para Frente',
        },
        pcs: 'PCs: :count',
        npcs: 'NPCs: :count',
        rollNpcs: 'Rolar Todos os NPCs',
        rollAll: 'Rolar Todos',
        settings: 'Configurações',
      },
    },
    combat: {
      start: {
        title: 'Iniciar Combate',
        pcs: 'PCs: :count',
        npcs: 'NPCs: :count',
        rollNpcs: 'Rolar Todos os NPCs',
        rollAll: 'Rolar Todos',
        settings: 'Configurações',
        participants: 'Participantes',
        selectAll: 'Selecionar Todos',
        clear: 'Limpar',
        empty: 'Nenhum token disponível no mapa.',
        startButton: 'Iniciar Combate (:count)',
      },
      settings: {
        title: 'Configurações do Combate',
        autoRoll: 'Auto-rolar iniciativa',
        showToPlayers: 'Mostrar iniciativa aos jogadores',
        showEnemyHp: 'Mostrar HP de inimigos',
        trackConcentration: 'Rastrear concentração',
        turnTimer: 'Timer de turno',
        suggestions: 'Sugestões inteligentes',
        surprise: 'Rodada Surpresa',
      },
      labels: {
        pc: 'PC',
        invisible: 'Invisível para jogadores',
        hp: 'HP: :current/:max',
        ac: 'CA: :value',
        initiative: 'Init',
        rollInitiative: 'Rolar Iniciativa',
      },
      initiativeroller: {
        iniciarCombate: {
          text: 'Iniciar Combate (',
          title: 'Iniciar Combate',
        },
        cancelar: {
          label: 'Cancelar',
        },
        nenhumTokenDisponvel: {
          text: 'Nenhum token disponível no mapa.',
        },
        rolarIniciativa: {
          tooltip: 'Rolar Iniciativa',
        },
        ca: {
          label: '• CA:',
        },
        hp: {
          label: 'HP:',
        },
        invisvelParaJogadores: {
          tooltip: 'Invisível para jogadores',
        },
        limpar: {
          label: 'Limpar',
        },
        selecionarTodos: {
          text: 'Selecionar Todos',
        },
        participantes: {
          label: 'Participantes',
        },
        rodadaSurpresa: {
          text: 'Rodada Surpresa',
        },
        sugestesInteligentes: {
          text: 'Sugestões inteligentes',
        },
        timerDeTurno: {
          text: 'Timer de turno',
        },
        rastrearConcentrao: {
          text: 'Rastrear concentração',
        },
        autorolarIniciativa: {
          text: 'Auto-rolar iniciativa',
        },
        configuraesDoCombate: {
          text: 'Configurações do Combate',
        },
        configuraes: {
          tooltip: 'Configurações',
        },
        todos: {
          label: 'Todos',
        },
        rolarTodos: {
          tooltip: 'Rolar Todos',
        },
        npcs: {
          label: 'NPCs',
        },
        rolarTodosOs: {
          tooltip: 'Rolar Todos os NPCs',
        },
        pcs: {
          label: 'PCs:',
        },
        npc: {
          label: 'npc',
        },
        combatants: {
          label: 'combatants',
        },
      },
      tracker: {
        nenhumCombateAtivo: {
          text: 'Nenhum combate ativo.',
        },
        inicieUmCombate: {
          text: 'Inicie um combate pela barra de ferramentas do mestre.',
        },
        ordemDeTurno: {
          text: 'Ordem de Turno',
        },
        rodada: {
          text: 'Rodada',
          label: 'Rodada',
        },
        iniciativa: {
          text: 'Iniciativa: ',
          label: 'Iniciativa',
        },
        prximoTurno: {
          label: 'Próximo Turno',
          text: 'Próximo Turno',
        },
        next: {
          button: 'Próximo',
        },
        emptyState: {
          title: 'Sem Combate',
          message: 'Nenhum combate ativo. Inicie um para rastrear a iniciativa.',
        },
        header: {
          title: 'Rastreador de Combate',
        },
        turnTimer: {
          tooltip: 'Cronômetro do Turno',
        },
        roundCounter: {
          label: 'Rodada',
        },
        historyButton: {
          tooltip: 'Histórico',
        },
        settingsButton: {
          tooltip: 'Configurações',
        },
        shortcutsButton: {
          tooltip: 'Atalhos',
        },
        settingsPanel: {
          title: 'Configurações do Rastreador',
          autoRollInit: {
            label: 'Rolar Iniciativa Automaticamente',
          },
          showInit: {
            label: 'Mostrar Iniciativa',
          },
          showEnemyHP: {
            label: 'Mostrar PV do Inimigo',
          },
          concentration: {
            label: 'Rastrear Concentração',
          },
          turnTimer: {
            label: 'Cronômetro de Turno',
          },
          aiSuggestions: {
            label: 'Sugestões de IA',
          },
        },
        historyPanel: {
          title: 'Histórico de Combate',
          emptyState: {
            message: 'Nenhum histórico disponível.',
          },
        },
        turnOrder: {
          title: 'Ordem do Turno',
          damagePlaceholder: 'Dano',
          healPlaceholder: 'Cura',
          removeFromCombat: {
            confirmPrompt: 'Remover do combate?',
            label: 'Remover',
          },
        },
        controls: {
          prevTurn: {
            tooltip: 'Turno Anterior',
          },
          nextTurn: {
            label: 'Próximo Turno',
          },
          endCombat: {
            confirmPrompt: 'Encerrar combate?',
            label: 'Encerrar Combate',
          },
        },
      },
      tab: {
        nenhumAtaqueConfigurado: {
          text: 'Nenhum ataque configurado.',
        },
        alcance: {
          placeholder: 'Alcance',
        },
        nomeDoAtaque: {
          placeholder: 'Nome do ataque',
        },
        aesAtaques: {
          title: 'Ações & Ataques',
        },
        descansoLongo: {
          text: 'Descanso Longo',
        },
        dadosDeVida: {
          text: 'Dados de Vida',
        },
        exausto: {
          label: 'Exaustão',
        },
        inspirao: {
          label: 'Inspiração',
        },
        percepoPas: {
          label: 'Percepção Pas.',
        },
        proficincia: {
          label: 'Proficiência',
        },
        deslocamento: {
          label: 'Deslocamento',
        },
        iniciativa: {
          label: 'Iniciativa',
        },
        percepo: {
          label: 'Percepção',
        },
        hpTemporrio: {
          text: 'HP Temporário',
        },
        mx: {
          label: 'Máx:',
        },
        pontosDeVida: {
          text: 'Pontos de Vida',
        },
      },
      card: {
        nextTurn: {
          button: 'Próximo',
        },
        hp: {
          label: 'Pontos de Vida',
        },
        init: {
          abbr: 'Init',
        },
        ac: {
          abbr: 'CA',
        },
      },
    },
    chat: {
      title: 'Histórico',
      tabs: {
        all: 'Tudo',
        chat: 'Chat',
        roll: 'Dados',
        system: 'Sistema',
        empty: 'Sem registros visíveis.',
      },
      input: {
        placeholder: {
          global: 'Escreva sua mensagem...',
          whisper: 'Escreva seu sussurro...',
        },
      },
      menus: {
        identity: {
          title: 'Identidade',
        },
        recipient: {
          title: 'Destinatário',
          global: 'Todos (Global)',
          whisper: 'Sussurrar para :name',
        },
        ooc: 'Eu (OOC)',
        global: 'Todos (OOC)',
      },
      messages: {
        whisper: {
          toMe: 'Sussurrou para você',
          fromMe: 'Sussurrou para :name',
          other: 'Sussurro para :name',
        },
        system: {
          damage: '**:name** sofreu **:diff** de dano.',
          heal: '**:name** recuperou **:diff** de vida.',
        },
        roll: {
          label: 'Rolagem',
          hidden: 'Rolagem Oculta',
        },
      },
      tooltips: {
        dock: 'Acoplar',
        popout: 'Destacar',
        expand: 'Expandir',
        collapse: 'Reduzir',
      },
      cards: {
        compendium: {
          open: 'Abrir',
          grimoire: 'Abrir no Grimório',
          readMore: 'Ler Mais',
          collapse: 'Colapsar',
        },
        generic: {
          viewDetails: 'Ver Detalhes',
        },
        attack: {
          rollAttack: 'Rolar Ataque',
          hit: 'Acerto',
          damage: 'Dano',
        },
        spell: {
          level: 'Nível',
          cantrip: 'Truque',
          school: 'Escola',
        },
        item: {
          qty: 'Qtd',
        },
        position: {
          goTo: 'Ir para :label',
        },
      },
      labels: {
        recipient: 'Destinatário',
        identity: 'Identidade',
        private: 'Privado:',
      },
      tags: {
        ooc: '(OOC)',
      },
      badges: {
        ooc: 'OOC',
        rp: 'RP',
      },
    },
    party: {
      onlineCount: 'Online (:count)',
      playerLabel: 'Jogador',
      invite: {
        title: 'Convidar Jogadores',
        desc: 'Envie o link para seus amigos.',
        copyButton: 'Copiar Link',
        success: 'Link copiado!',
      },
    },
    maps: {
      settingsModal: {
        header: {
          title: 'Configurações do Mapa',
        },
        ambientLight: {
          label: 'Luz Ambiente Global',
          totalDarkness: 'Escuridão Total',
          desc: 'Define o brilho base do mapa. 0% é escuridão total (requer fontes de luz), 100% é luz do dia.',
        },
        background: {
          image: {
            label: 'Imagem de Fundo',
            placeholder: 'URL da imagem ou faça upload...',
            uploadTooltip: 'Fazer upload de imagem (JPG, PNG, GIF, WEBP, BMP - máx 10MB)',
            uploading: 'Fazendo upload da imagem...',
            uploadSuccess: 'Imagem carregada com sucesso!',
            error: 'Erro inesperado ao fazer upload da imagem.',
            unknownError: 'Erro desconhecido no upload.',
            formatsInfo: 'Formatos aceitos: JPG, PNG, GIF, WEBP, BMP • Tamanho máximo: 10MB',
            retry: 'Tentar novamente',
          },
        },
        audio: {
          label: 'Música de Fundo da Cena',
          placeholder: 'Selecione uma faixa...',
          noMusic: 'Nenhuma Música',
          customUrl: 'URL Personalizada',
          customUrlPlaceholder: 'Cole a URL da música aqui...',
        },
        grid: {
          dimensions: {
            title: 'Dimensões da Grade',
            size: 'Tamanho (px)',
            cols: 'Colunas (X)',
            rows: 'Linhas (Y)',
            units: 'Unidades/Q',
          },
          appearance: {
            title: 'Aparência da Grade',
            color: 'Cor da Grade',
            opacity: 'Opacidade (:percent%)',
          },
        },
        defaults: {
          title: 'Padrões de Criação',
          hiddenObstacles: 'Criar novas paredes invisíveis?',
        },
        bulkActions: {
          title: 'Ações em Massa (Estruturas)',
          hideAll: 'Ocultar Todas',
          revealAll: 'Revelar Todas',
          desc: 'Isso altera a visibilidade real para os jogadores.',
        },
        footer: {
          uploading: 'Enviando...',
          saveChanges: 'Salvar Alterações',
        },
      },
    },
    permissions: {
      modal: {
        title: 'Permissões da Sessão',
        desc: 'Controle granular do que os jogadores podem fazer.',
        tabs: {
          global: 'Global',
          logs: 'Logs & Visibilidade',
          tokenHover: 'Token Hover',
        },
        players: {
          header: 'Jogadores',
          empty: 'Nenhum jogador conectado.',
        },
        sections: {
          global: {
            title: 'Regras Globais',
            desc: 'Estas regras se aplicam a todos, a menos que substituídas.',
          },
          visibility: {
            title: 'Visibilidade & Câmera',
          },
          interaction: {
            title: 'Interação',
          },
          tools: {
            title: 'Ferramentas & Conteúdo',
          },
          access: {
            title: 'Acesso',
          },
          manipulation: {
            title: 'Criação & Manipulação',
          },
          chat: {
            title: 'Chat',
          },
          cursor: {
            title: 'Personalização de Cursor',
          },
          privacy: {
            title: 'Privacidade Global',
          },
          overrides: {
            title: 'Exceções específicas para este jogador.',
            desc: 'Exceções específicas para este jogador.',
          },
          logs: {
            title: 'Visibilidade do Log',
            desc: 'Defina quem pode ver os eventos automáticos do sistema.',
          },
          conditions: {
            title: 'Notificações de Condições',
            announce: 'Anunciar Condições no Chat',
            desc: 'Quando o GM adiciona condições, enviar mensagem no chat.',
          },
        },
        status: {
          inherit: 'Herdar Global',
          allowed: 'Permitido',
          forbidden: 'Proibido',
          inheritValue: 'Herdar (:value)',
          yes: 'Sim',
          no: 'Não',
        },
        logTypes: {
          movement: 'Movimentação',
          combat: 'Dano & Cura',
          rolls: 'Rolagens de Dados',
          system: 'Eventos de Turno',
        },
        logVisibility: {
          public: 'Público',
          gm: 'GM Only',
        },
        applyButton: 'Aplicar Regras',
      },
      definitions: {
        tokenMovement: {
          label: 'Mover Tokens',
          desc: 'Mover tokens que eles controlam.',
        },
        doorControl: {
          label: 'Usar Portas',
          desc: 'Abrir/fechar portas e janelas.',
        },
        drawings: {
          label: 'Desenhar',
          desc: 'Desenhar no mapa.',
        },
        drawingDelete: {
          label: 'Apagar (Seus)',
          desc: 'Apagar desenhos próprios.',
        },
        drawingClear: {
          label: 'Limpar Tudo',
          desc: 'Apagar todos os desenhos da camada.',
        },
        measure: {
          label: 'Régua',
          desc: 'Usar ferramenta de medição.',
        },
        pingMap: {
          label: 'Ping no Mapa',
          desc: 'Sinalizar locais para o grupo.',
        },
        diceRolling: {
          label: 'Rolagem de Dados',
          desc: 'Usar o rola-dados digital.',
        },
        initiativeRoll: {
          label: 'Rolar Iniciativa',
          desc: 'Jogadores rolam própria iniciativa.',
        },
        compendiumBrowse: {
          label: 'Acessar Grimório',
          desc: 'Consultar monstros/magias/regras.',
        },
        bestiaryBrowse: {
          label: 'Acessar Bestiário',
          desc: 'Ver lista de tokens e monstros.',
        },
        journalCreate: {
          label: 'Criar Notas',
          desc: 'Criar handouts/recursos.',
        },
        sheetEdit: {
          label: 'Editar Ficha',
          desc: 'Modificar valores da ficha de personagem.',
        },
        tokenCreate: {
          label: 'Criar Tokens',
          desc: 'Adicionar novos tokens ao mapa.',
        },
        tokenEdit: {
          label: 'Editar Tokens',
          desc: 'Alterar status e aparência de tokens.',
        },
        tokenDelete: {
          label: 'Deletar Tokens',
          desc: 'Remover tokens do mapa.',
        },
        fogReveal: {
          label: 'Revelar Neblina',
          desc: 'Remover neblina de guerra manualmente.',
        },
        cursorAllowColorChange: {
          label: 'Alterar Cor do Cursor',
          desc: 'Jogadores podem mudar a cor do cursor.',
        },
        cursorAllowShapeChange: {
          label: 'Alterar Formato do Cursor',
          desc: 'Jogadores podem mudar o formato do cursor.',
        },
        cursorAllowNameChange: {
          label: 'Alterar Nome do Cursor',
          desc: 'Jogadores podem mudar o nome exibido no cursor.',
        },
        cursorAllowAnimationChange: {
          label: 'Alterar Animação',
          desc: 'Jogadores podem mudar a animação de clique.',
        },
        cursorAllowAnimationColorChange: {
          label: 'Cor da Animação',
          desc: 'Jogadores podem mudar a cor da animação de clique.',
        },
        chatGlobalAllowed: {
          label: 'Chat Global',
          desc: 'Jogador pode enviar mensagens públicas no chat.',
        },
        chatPrivateAllowed: {
          label: 'Mensagens Privadas',
          desc: 'Jogador pode enviar mensagens privadas para outros.',
        },
        showRemoteViewports: {
          label: 'Ver Outros Jogadores',
          desc: 'Pode ver onde outros jogadores estão olhando (retângulos).',
        },
        shareViewport: {
          label: 'Compartilhar Visão',
          desc: 'Outros podem ver onde este jogador está olhando.',
        },
        shareCursor: {
          label: 'Compartilhar Ponteiro',
          desc: 'Permitir que o cursor do jogador seja visto por outros.',
        },
        allowSpectate: {
          label: 'Permitir Espectador',
          desc: 'Permitir que o Mestre veja a tela deste jogador.',
        },
      },
    },
    dice: {
      modes: {
        advantage: 'Vantagem',
        normal: 'Normal',
        disadvantage: 'Desvantagem',
        vant: 'VANT',
        desv: 'DESV',
      },
      visibility: {
        public: 'Público: Todos veem',
        gm: 'Privado: Apenas você e o Mestre',
        total: 'Resumido: Apenas total',
        publicShort: 'Público',
        gmShort: 'Secreto (GM)',
        totalShort: 'Resumido',
      },
      status: {
        rolling: 'ROLANDO...',
        result: 'RESULTADO',
        critical: 'Crítico!',
        fumble: 'Falha Crítica!',
        newRoll: 'Nova Rolagem',
        emptyTray: 'Adicione dados à mesa',
        formula: 'Fórmula: :formula',
        manual: 'Rolagem Manual',
        auto: 'Rolagem Automática',
        denied: 'Rolagem negada - sem permissão',
      },
      roller: {
        title: 'Mesa de Dados',
        character: 'Personagem Ativo',
        noCharacter: 'Nenhum Herói Selecionado',
        tabs: {
          manual: 'Mesa',
          attributes: 'Atrib',
          combat: 'Combate',
          skills: 'Perícias',
          inventory: 'Itens',
        },
        sections: {
          attributes: 'Testes de Atributo',
          saves: 'Salvaguardas (Resistência)',
          combat: 'Ataques Físicos',
          spells: 'Grimório',
          skills: 'Perícias',
          inventory: 'Itens',
        },
        labels: {
          ca: 'CA :value',
          hp: 'HP :value',
          save: ':attr Save',
          atkMod: 'ATK +:value',
          saveDc: 'CD :value',
          spellLevel: '{0} Truque|{1,*} Nível :level',
          noAttacks: 'Nenhum ataque registrado.',
          noSpells: 'Nenhuma magia preparada.',
          noItems: 'Mochila vazia.',
          emptySelect: 'Selecione um token no mapa para acessar ações rápidas.',
          genericSpell: 'Rolar Ataque Mágico Genérico',
          useItem: 'Usar',
        },
        public: {
          tooltip: 'Público: Todos veem',
        },
        private: {
          tooltip: 'Privado: Apenas você e o Mestre',
        },
      },
    },
    audio: {
      panel: {
        title: 'Painel de Áudio',
        manageTitle: 'Gerenciar Áudio',
        stopAll: 'Parar Tudo',
        shuffle: 'Aleatório',
        manage: 'Gerenciar',
        back: 'Voltar',
        save: 'Salvar Alterações',
        volumeMusic: 'Volume da Música',
        volumeSfx: 'Volume dos Efeitos',
        salvarAlteraes: {
          text: 'Salvar Alterações',
        },
        gerenciar: {
          label: 'Gerenciar',
        },
        voltar: {
          label: 'Voltar',
        },
        painelDeUdio: {
          title: 'Painel de Áudio',
        },
        gerenciarUdio: {
          title: 'Gerenciar Áudio',
        },
        efeitosSonoros: {
          text: 'Efeitos Sonoros',
        },
        aleatrio: {
          label: 'Aleatório',
        },
        pararTudo: {
          text: 'Parar Tudo',
        },
        playlists: {
          label: 'Playlists',
        },
        efeitoSonoro: {
          text: 'Efeito Sonoro',
        },
        novoEfeito: {
          label: 'Novo Efeito',
        },
        gerenciarEfeitosSonoros: {
          text: 'Gerenciar Efeitos Sonoros',
        },
        nomeDaNova: {
          placeholder: 'Nome da Nova Playlist',
        },
        faixa: {
          label: 'Faixa',
        },
        novaFaixa: {
          label: 'Nova Faixa',
        },
        gerenciarPlaylists: {
          text: 'Gerenciar Playlists',
        },
        erroNoUpload: {
          errorMessage: 'Erro no upload.',
        },
        name: {
          placeholder: 'Nome',
        },
      },
      manage: {
        playlists: 'Gerenciar Playlists',
        sfx: 'Gerenciar Efeitos Sonoros',
        newPlaylist: 'Nome da Nova Playlist',
        addTrack: 'Faixa',
        addSfx: 'Efeito Sonoro',
        uploadError: 'Erro no upload.',
        placeholderName: 'Nome',
        placeholderUrl: 'URL',
      },
    },
    navigation: {
      scenes: {
        activate: 'Ativar',
        edit: 'Editar',
        delete: 'Excluir',
      },
      map: {
        ping: 'Ping Aqui',
        move: 'Mover Seleção Aqui',
        addToken: 'Adicionar Token',
      },
    },
    drawing: {
      toolbar: {
        paredesDinmicas: {
          text: 'paredes dinâmicas',
        },
        desenhos: {
          label: 'desenhos',
        },
        temCertezaQue: {
          text: 'Tem certeza que deseja apagar',
        },
        todos: {
          label: 'todos',
        },
        destaCenaEsta: {
          text: 'desta cena? Esta ação é irreversível.',
        },
        cancelar: {
          label: 'Cancelar',
        },
        limparTudo: {
          text: 'Limpar Tudo',
        },
        limparParedes: {
          title: 'Limpar Paredes',
        },
        limparDesenhos: {
          title: 'Limpar Desenhos',
        },
        tamanho: {
          label: 'Tamanho',
        },
        opacidade: {
          label: 'Opacidade',
        },
        smartWall: {
          text: 'Smart Wall',
        },
        configuraesDaVarinha: {
          text: 'Configurações da Varinha',
        },
        tolerncia: {
          label: 'Tolerância',
        },
        simplificao: {
          label: 'Simplificação',
        },
        resoluo: {
          label: 'Resolução',
        },
        sandboxDoSmart: {
          label: 'Sandbox do Smart Wall',
        },
        preview: {
          label: 'Preview',
        },
        desfazerLtimaParede: {
          tooltip: 'Desfazer última parede',
        },
        desfazerLtimoTrao: {
          tooltip: 'Desfazer último traço',
        },
        limparTodosOs: {
          tooltip: 'Limpar TODOS os desenhos',
        },
      },
    },
    token: {
      editModal: {
        fields: {
          backgroundColor: 'Cor Fundo',
          textColor: 'Cor Texto',
          sigla: 'Sigla',
        },
        errors: {
          uploadFailed: 'Erro no upload da imagem.',
        },
        markdown: {
          actions: '### Ações',
          legendaryActions: '### Ações Lendárias',
        },
      },
    },
    character: {
      sheetviewer: {
        histrico: {
          label: 'Histórico',
        },
        bio: {
          label: 'Bio',
        },
        feitos: {
          label: 'Feitos',
        },
        combate: {
          label: 'Combate',
        },
        descansoLongo: {
          tooltip: 'Descanso Longo',
        },
        descansoCurto: {
          tooltip: 'Descanso Curto',
        },
        classe: {
          placeholder: 'Classe',
        },
        espcie: {
          placeholder: 'Espécie',
        },
        nomeDoPersonagem: {
          placeholder: 'Nome do Personagem',
        },
        avatar: {
          alt: 'Avatar',
        },
        adicioneNotasPrivadas: {
          placeholder: 'Adicione notas privadas sobre este personagem...',
        },
        estasNotasSo: {
          title: 'Estas notas são privadas e visíveis apenas para o Mestre.',
        },
        notasDoMestre: {
          title: 'Notas do Mestre',
        },
        nenhumaAlteraoRegistrada: {
          text: 'Nenhuma alteração registrada ainda.',
        },
        alterou: {
          label: 'Alterou:',
        },
        ltimas100Alteraes: {
          title: 'Últimas 100 alterações na ficha.',
        },
        histricoDeAlteraes: {
          title: 'Histórico de Alterações',
        },
        tesouroItensEspeciais: {
          text: 'Tesouro & Itens Especiais',
        },
        aliadosOrganizaes: {
          text: 'Aliados & Organizações',
        },
        notasOutros: {
          title: 'Notas & Outros',
        },
        nenhumaBiografiaDisponvel: {
          text: 'Nenhuma biografia disponível.',
        },
        escrevaAHistria: {
          placeholder: 'Escreva a história do seu personagem...',
        },
        biografia: {
          title: 'Biografia',
        },
        personalidade: {
          title: 'Personalidade',
        },
        aparncia: {
          title: 'Aparência',
        },
        descrio: {
          placeholder: 'Descrição...',
        },
        fonteExRaa: {
          placeholder: 'Fonte (ex: Raça, Classe)',
        },
        nomeDaCaracterstica: {
          placeholder: 'Nome da característica',
        },
        caractersticasETalentos: {
          title: 'Características e Talentos',
        },
        equipamento: {
          title: 'Equipamento',
        },
        truques: {
          label: 'Truques',
        },
        nvel: {
          label: 'Nível',
        },
        espaosDeMagia: {
          title: 'Espaços de Magia',
        },
        ataque: {
          label: 'Ataque',
        },
        atributo: {
          label: 'Atributo',
        },
        nenhumAtaqueConfigurado: {
          text: 'Nenhum ataque configurado.',
        },
        alcance: {
          placeholder: 'Alcance',
        },
        nomeDoAtaque: {
          placeholder: 'Nome do ataque',
        },
        aesAtaques: {
          title: 'Ações & Ataques',
        },
        dadosDeVida: {
          text: 'Dados de Vida',
        },
        exausto: {
          label: 'Exaustão',
        },
        inspirao: {
          label: 'Inspiração',
        },
        percepoPas: {
          label: 'Percepção Pas.',
        },
        proficincia: {
          label: 'Proficiência',
        },
        deslocamento: {
          label: 'Deslocamento',
        },
        iniciativa: {
          label: 'Iniciativa',
        },
        classeArmadura: {
          label: 'Classe Armadura',
        },
        percepo: {
          label: 'Percepção',
        },
        prof: {
          label: 'Prof.',
        },
        desloc: {
          label: 'Desloc.',
        },
        mx: {
          label: 'Máx:',
        },
        pontosDeVida: {
          text: 'Pontos de Vida',
        },
        percias: {
          label: 'Perícias',
        },
        atributos: {
          label: 'Atributos',
        },
      },
      combatTab: {
        noAttacks: {
          text: 'Nenhum ataque configurado.',
        },
      },
      bioTab: {
        noBio: {
          text: 'Nenhuma biografia disponível.',
        },
      },
      sheetViewer: {
        type: {
          placeholder: 'Tipo',
        },
        mastery: {
          placeholder: 'Maestria',
        },
      },
      stats: {
        hitPoints: {
          label: 'Pontos de Vida',
        },
        armorClass: {
          label: 'CA',
        },
        initiative: {
          label: 'Iniciativa',
        },
        speed: {
          label: 'Deslocamento',
        },
        proficiency: {
          label: 'Proficiência',
        },
        passivePerception: {
          label: 'Percepção Pas.',
        },
        perception: {
          label: 'Percepção',
        },
        inspiration: {
          label: 'Inspiração',
        },
        exhaustion: {
          label: 'Exaustão',
        },
        hitDice: {
          label: 'Dados de Vida',
        },
        max: {
          label: 'Máx',
        },
        tempHP: {
          label: 'HP Temporário',
        },
      },
      actions: {
        longRest: {
          button: 'Descanso Longo',
        },
      },
      combat: {
        actionsAttacks: {
          title: 'Ações & Ataques',
        },
        attackName: {
          placeholder: 'Nome do ataque',
        },
        range: {
          placeholder: 'Alcance',
        },
        type: {
          placeholder: 'Tipo',
        },
        mastery: {
          placeholder: 'Maestria',
        },
        damage: {
          label: 'Dano',
        },
        attackType: {
          placeholder: 'Tipo',
        },
      },
      bio: {
        appearance: {
          title: 'Aparência',
        },
        personality: {
          title: 'Personalidade',
        },
        biography: {
          title: 'Biografia',
          placeholder: 'Escreva a história do seu personagem...',
        },
        notesOther: {
          title: 'Notas & Outros',
        },
        alliesOrgs: {
          label: 'Aliados & Organizações',
        },
        treasure: {
          label: 'Tesouro & Itens Especiais',
        },
      },
      exhaustion: {
        penalty: 'em d20',
      },
      sheet: {
        skills: {
          title: 'Perícias',
        },
        characterName: {
          placeholder: 'Nome do Personagem',
        },
        attributes: {
          title: 'Atributos',
        },
      },
      tabs: {
        combat: {
          label: 'Combate',
        },
        biography: {
          label: 'Biografia',
        },
        gmNotes: {
          label: 'Notas GM',
        },
        features: {
          label: 'Características',
        },
        spells: {
          label: 'Magias',
        },
        inventory: {
          label: 'Inventário',
        },
      },
      features: {
        name: {
          placeholder: 'Nome da característica',
        },
        title: 'Características e Talentos',
        description: {
          placeholder: 'Descrição...',
        },
        source: {
          placeholder: 'Fonte (ex: Raça, Classe)',
        },
      },
      spells: {
        attribute: {
          label: 'Atributo',
        },
        slots: {
          title: 'Espaços de Magia',
        },
        level: {
          text: 'Nível',
        },
        cantrips: {
          label: 'Truques',
        },
        attack: {
          label: 'Ataque',
        },
      },
      header: {
        level: {
          text: 'Nível',
        },
        editMode: {
          tooltip: 'Modo Edição',
        },
        viewMode: {
          tooltip: 'Modo Visualização',
        },
      },
    },
    scene: {
      navigation: {
        gerenciarCenasandares: {
          tooltip: 'Gerenciar Cenas/Andares',
        },
        tokens: {
          label: 'tokens',
        },
        camadas: {
          label: 'Camadas',
        },
        excluirCamada: {
          title: 'Delete Layer',
          text: 'Delete Layer',
        },
        cancelar: {
          label: 'Cancelar',
        },
        temCertezaQue: {
          text: 'Tem certeza que deseja excluir esta camada? Todos os tokens e configurações nela serão perdidos permanentemente.',
        },
        newScene: {
          defaultName: 'Nova Cena',
        },
      },
    },
    attack: {
      zoneconfigmodal: {
        salvarConfigurao: {
          text: 'Salvar Configuração',
        },
        cancelar: {
          label: 'Cancelar',
        },
        ex15: {
          placeholder: 'Ex: 15',
        },
        exDex: {
          placeholder: 'Ex: DES',
        },
        savingThrow: {
          text: 'Saving Throw',
        },
        exFire: {
          placeholder: 'Ex: Fogo',
        },
        tipoDeDano: {
          text: 'Tipo de Dano',
        },
        ex8d6: {
          placeholder: 'Ex: 8d6',
        },
        frmulaDeDano: {
          text: 'Fórmula de Dano',
        },
        efeitosOpcional: {
          text: 'Efeitos (Opcional)',
        },
        corDoHighlight: {
          text: 'Cor do Highlight',
        },
        destacarTokens: {
          text: 'Destacar Tokens',
        },
        corDaBorda: {
          text: 'Cor da Borda',
        },
        corDaZona: {
          text: 'Cor da Zona',
        },
        alvos: {
          label: 'Alvos',
        },
        usaClculoDe: {
          text: 'Usa cálculo de visão para determinar área',
        },
        respeitarLinhaDe: {
          text: 'Respeitar Linha de Visão',
        },
        tipoDePropagao: {
          text: 'Tipo de Propagação',
        },
        nguloGraus: {
          text: 'Ângulo (Graus)',
        },
        larguraQuadrados: {
          text: 'Largura (Quadrados)',
        },
        comprimentoQuadrados: {
          text: 'Comprimento (Quadrados)',
        },
        raioQuadrados: {
          text: 'Raio (Quadrados)',
        },
        forma: {
          label: 'Forma',
        },
        descrioDaZona: {
          placeholder: 'Descrição da zona de ataque...',
        },
        descrioOpcional: {
          text: 'Descrição (Opcional)',
        },
        exBolaDe: {
          placeholder: 'Ex: Bola de Fogo',
        },
        nomeDaZona: {
          text: 'Nome da Zona',
        },
        objetos: {
          label: 'Objetos',
        },
        objects: {
          label: 'objects',
        },
        inimigos: {
          label: 'Inimigos',
        },
        enemies: {
          label: 'enemies',
        },
        aliados: {
          label: 'Aliados',
        },
        allies: {
          label: 'allies',
        },
        todos: {
          label: 'Todos',
        },
        contornaObstculos: {
          text: 'Contorna obstáculos',
        },
        espalhamento: {
          label: 'Espalhamento',
        },
        spreading: {
          label: 'spreading',
        },
        atravessaTudo: {
          text: 'Atravessa tudo',
        },
        penetrante: {
          label: 'Penetrante',
        },
        penetrating: {
          label: 'penetrating',
        },
        paraEmParedes: {
          text: 'Para em paredes e obstáculos',
        },
        bloqueado: {
          label: 'Bloqueado',
        },
        retngulo: {
          label: 'Retângulo',
        },
        rectangle: {
          label: 'rectangle',
        },
        quadrado: {
          label: 'Quadrado',
        },
        linha: {
          label: 'Linha',
        },
        line: {
          label: 'Linha',
        },
        cone: {
          label: 'Cone',
        },
        crculo: {
          label: 'Círculo',
        },
        configurarZonaDe: {
          title: 'Configurar Zona de Ataque',
        },
        novaZona: {
          text: 'Nova Zona',
        },
        mostrarContornoNos: {
          text: 'Mostrar contorno nos alvos',
        },
      },
      zonepanel: {
        fechar: {
          label: 'Fechar',
        },
        noMapaPara: {
          text: 'no mapa para posicionar a zona',
        },
        clique: {
          label: 'Clique',
        },
        remover: {
          title: 'Remover',
        },
        visibilidade: {
          title: 'Alternar visibilidade',
        },
        duplicar: {
          title: 'Duplicar',
        },
        editar: {
          title: 'Editar',
        },
        nenhumaZonaAtiva: {
          text: 'Nenhuma zona ativa',
        },
        zonas: {
          label: 'zonas',
        },
        zona: {
          label: 'zona',
        },
        zonasAtivas: {
          text: 'Zonas Ativas',
        },
        configureManualmente: {
          text: 'Configure manualmente todas as propriedades',
        },
        criarZonaCustomizada: {
          text: 'Criar Zona Customizada',
        },
        nenhumaZonaEncontrada: {
          text: 'Nenhuma zona encontrada.',
        },
        nvel: {
          label: 'Nível ',
        },
        buscarZonas: {
          placeholder: 'Buscar zonas...',
        },
        zonasDeAtaque: {
          text: 'Zonas de Ataque',
        },
        ambiente: {
          label: 'Ambiente',
        },
        armas: {
          label: 'Armas',
        },
        habilidades: {
          label: 'Habilidades',
        },
        todos: {
          label: 'Todos',
        },
        magias: {
          label: 'Magias',
        },
      },
    },
    compendium: {
      window: {
        oMestreBloqueou: {
          text: 'O Mestre bloqueou o acesso ao Grimório.',
        },
        acessoRestrito: {
          text: 'Acesso Restrito',
        },
        busquePorMonstros: {
          text: 'Busque por monstros, magias, itens e regras.',
        },
        selecioneUmItem: {
          text: 'Selecione um item para ler.',
        },
        erroAoCarregar: {
          text: 'Erro ao carregar dados.',
        },
        consultandoOrculosDe: {
          text: 'Consultando oráculos de tradução...',
        },
        decifrandoRunasAntigas: {
          text: 'DECIFRANDO RUNAS ANTIGAS...',
        },
        fechar: {
          label: 'Fechar',
        },
        carregarMais: {
          text: 'Carregar Mais',
        },
        carregando: {
          label: 'Carregando...',
        },
        nenhumFavoritoSalvo: {
          text: 'Nenhum favorito salvo.',
        },
        nadaEncontrado: {
          text: 'Nada encontrado.',
        },
        invocandoSabedoria: {
          text: 'Invocando sabedoria...',
        },
        search: {
          placeholder: 'Search...',
        },
        buscar: {
          placeholder: 'Buscar...',
          label: 'Buscar',
        },
        favoritos: {
          label: 'Favoritos',
        },
        regras: {
          label: 'Regras',
        },
        tesouros: {
          label: 'Tesouros',
        },
        bestirio: {
          label: 'Bestiário',
        },
        grimrioDoConhecimento: {
          title: 'Grimório do Conhecimento',
        },
        compartilharRegra: {
          title: 'Compartilhar Regra',
        },
        textoCompleto: {
          text: 'Texto Completo',
        },
        magicitems: {
          label: 'magicitems',
        },
        linkCard: {
          text: 'Link Card',
        },
        requiresAttunement: {
          text: 'Requires Attunement',
        },
        requerSintonizao: {
          text: 'Requer Sintonização',
        },
        atHigherLevels: {
          text: 'At Higher Levels',
        },
        emNveisSuperiores: {
          text: 'Em Níveis Superiores',
        },
        components: {
          label: 'Components:',
        },
        componentes: {
          label: 'Componentes:',
        },
        duration: {
          label: 'Duration:',
        },
        durao: {
          label: 'Duração:',
        },
        range: {
          label: 'Range:',
        },
        alcance: {
          label: 'Alcance:',
        },
        castingTime: {
          label: 'Casting Time:',
        },
        tempo: {
          label: 'Tempo:',
        },
        invocarToken: {
          text: 'Invocar Token',
        },
        gargantuan: {
          label: 'Gargantuan',
        },
        huge: {
          label: 'Huge',
        },
        tiny: {
          label: 'Tiny',
        },
        aesLendrias: {
          label: '### Ações Lendárias',
          title: 'Ações Lendárias',
        },
        aes: {
          label: '### Ações',
          title: 'Ações',
        },
        escalada: {
          label: 'escalada',
        },
        natao: {
          label: 'natação',
        },
        voo: {
          label: 'voo',
        },
        monsters: {
          label: 'monsters',
        },
        legendaryActions: {
          title: 'Legendary Actions',
        },
        actions: {
          title: 'Actions',
        },
        specialAbilities: {
          title: 'Special Abilities',
        },
        habilidadesEspeciais: {
          title: 'Habilidades Especiais',
        },
        charisma: {
          label: 'charisma',
        },
        wisdom: {
          label: 'wisdom',
        },
        intelligence: {
          label: 'intelligence',
        },
        constitution: {
          label: 'constitution',
        },
        dexterity: {
          label: 'dexterity',
        },
        strength: {
          label: 'strength',
        },
        cha: {
          label: 'CHA',
        },
        wis: {
          label: 'WIS',
        },
        int: {
          label: 'INT',
        },
        con: {
          label: 'CON',
        },
        dex: {
          label: 'DEX',
        },
        str: {
          label: 'STR',
        },
        walk: {
          label: 'Walk',
        },
        cho: {
          label: 'Chão',
        },
        speed: {
          label: 'Speed',
        },
        deslocamento: {
          label: 'Deslocamento',
        },
        aesn: {
          label: '### Ações\\n',
        },
        compartilharFichaInteira: {
          tooltip: 'Compartilhar Ficha Inteira',
        },
        enviadoAoChat: {
          successMessage: 'Enviado ao chat.',
        },
        salvoNosFavoritos: {
          successMessage: 'Salvo nos favoritos!',
        },
        removidoDosFavoritos: {
          text: 'Removido dos favoritos.',
        },
        failedToLoad: {
          errorMessage: 'Failed to load deep link',
        },
        itemNoEncontrado: {
          text: 'Item não encontrado.',
        },
        favorites: {
          label: 'favorites',
        },
        compartilharSeoNo: {
          tooltip: 'Compartilhar Seção no Chat',
        },
      },
      tabs: {
        spells: {
          label: 'Magias',
        },
      },
    },
    map: {
      modals: {
        audioZone: {
          zoneMusic: {
            label: 'Música da Zona',
          },
          noMusic: {
            label: 'Nenhuma Música',
          },
          customUrl: {
            label: 'URL Personalizada / Upload',
          },
          selectTrack: {
            placeholder: 'Selecione uma faixa...',
          },
          pasteUrl: {
            placeholder: 'Cole URL ou faça upload...',
          },
          saveZone: {
            button: 'Salvar Zona',
          },
          saveChanges: {
            button: 'Salvar Alterações',
          },
          deleteZone: {
            button: 'Apagar Zona',
          },
          volume: {
            label: 'Volume',
          },
          radius: {
            label: 'Raio de Efeito (Falloff)',
          },
        },
        triggerZone: {
          selectResource: {
            label: 'Recurso a Abrir',
            placeholder: 'Selecione um Recurso...',
            hint: 'Selecione o recurso...',
          },
          description: {
            text: 'Quando um jogador entrar nesta área, este recurso abrirá automaticamente na tela dele.',
          },
          saveTrigger: {
            button: 'Salvar Gatilho',
          },
        },
        configureAudioZone: {
          title: 'Configurar Zona de Áudio',
        },
        configureTrigger: {
          title: 'Configurar Gatilho',
        },
      },
      modal: {
        configureAudioZone: {
          title: 'Configurar Zona de Áudio',
        },
        configureTrigger: {
          title: 'Configurar Gatilho',
        },
      },
    },
    handouts: {
      formModal: {
        chooseTemplate: {
          title: 'Escolha um Modelo',
          subtitle: 'Comece com uma estrutura pronta ou uma página em branco.',
        },
        title: {
          label: 'Título',
          placeholder: 'Ex: Carta do Rei...',
        },
        theme: {
          label: 'Tema',
          standard: 'Padrão (Dark)',
          parchment: 'Pergaminho',
          terminal: 'Terminal',
          arcane: 'Arcano',
        },
        type: {
          text: 'Texto',
          image: 'Imagem',
          video: 'Vídeo',
        },
        content: {
          placeholder: 'Escreva aqui usando Markdown...',
        },
        urlOrUpload: {
          text: 'Insira a URL ou faça upload.',
        },
        imageInvalid: {
          text: 'URL da imagem inválida ou vazia.',
        },
        videoInvalid: {
          text: 'URL do YouTube inválida ou vazia.',
        },
        changeTemplate: {
          button: 'Mudar Modelo',
        },
        saveChanges: {
          button: 'Salvar Alterações',
        },
        createResource: {
          button: 'Criar Recurso',
        },
        uploadError: {
          text: 'Erro no upload.',
        },
      },
      shareModal: {
        sharing: {
          text: 'Salvando...',
        },
        saveSharing: {
          button: 'Salvar Compartilhamento',
        },
        noPlayers: {
          text: 'Nenhum jogador na sessão.',
        },
        selectPlayers: {
          title: 'Selecione com quem compartilhar:',
        },
        selectAll: {
          button: 'Selecionar Todos',
        },
        hideFromAll: {
          button: 'Ocultar de Todos',
        },
      },
      tray: {
        searchPlaceholder: 'Buscar recurso...',
        noResults: {
          text: 'Nenhum resultado.',
        },
        noResources: {
          text: 'Nenhum recurso criado.',
        },
        createTrigger: {
          title: 'Criar Gatilho no Mapa',
        },
        title: 'Recursos',
        newResource: {
          button: 'Novo Recurso',
        },
        trigger: {
          button: 'Gatilho',
        },
        edit: {
          tooltip: 'Editar',
        },
        share: {
          tooltip: 'Compartilhar',
        },
        triggerTool: {
          notification: 'Ferramenta de Gatilho selecionada para ":name". Desenhe no mapa.',
        },
      },
      preview: {
        edit: {
          button: 'Editar',
        },
        share: {
          button: 'Compartilhar',
        },
        invalidVideo: {
          text: 'Link de vídeo inválido.',
        },
        title: 'Pré-visualização',
      },
      shared: {
        stopSharing: {
          label: 'Parar de Compartilhar',
        },
        trigger: {
          badge: 'Gatilho',
        },
        invalidLink: {
          text: 'Link inválido.',
        },
      },
    },
    smartDice: {
      noHeroSelected: {
        text: 'Nenhum Herói Selecionado',
      },
      noAttacks: {
        text: 'Nenhum ataque registrado.',
      },
      noSpells: {
        text: 'Nenhuma magia preparada.',
      },
      freeTable: {
        label: 'Mesa Livre',
      },
      diceTable: {
        title: 'Mesa de Dados',
      },
      tab: {
        table: {
          label: 'Mesa',
        },
        attributes: {
          label: 'Atrib',
        },
        combat: {
          label: 'Combate',
        },
        skills: {
          label: 'Perícias',
        },
        items: {
          label: 'Itens',
        },
      },
      activeCharacter: {
        label: 'Personagem Ativo',
      },
      attributeTests: {
        label: 'Testes de Atributo',
      },
      savingThrows: {
        label: 'Salvaguardas (Resistência)',
      },
      physicalAttacks: {
        label: 'Ataques Físicos',
      },
      spellbook: {
        label: 'Grimório',
      },
      genericSpellAttack: {
        button: 'Rolar Ataque Mágico Genérico',
      },
      items: {
        label: 'Itens',
        title: 'Itens',
      },
      emptyBag: {
        text: 'Mochila vazia.',
      },
      useItem: {
        button: 'Usar',
      },
      selectToken: {
        text: 'Selecione um token no mapa para acessar ações rápidas.',
      },
      cantrip: {
        label: 'Truque',
      },
      level: {
        label: 'Nível',
      },
    },
    mapContext: {
      addToken: {
        label: 'Adicionar Token',
      },
      addLight: {
        label: 'Adicionar Luz',
      },
      editTrigger: {
        label: 'Editar Gatilho',
      },
      removeTrigger: {
        label: 'Remover Gatilho',
      },
      editAudioZone: {
        label: 'Editar Zona de Áudio',
      },
      removeZone: {
        label: 'Remover Zona',
      },
      structureOptions: {
        label: 'Opções de Estrutura',
      },
      triggerOptions: {
        label: 'Opções de Gatilho',
      },
      audioOptions: {
        label: 'Opções de Áudio',
      },
      mapOptions: {
        label: 'Opções de Mapa',
      },
      toggleInvisibility: {
        label: 'Alternar Invisibilidade',
      },
      destroyStructure: {
        label: 'Destruir Estrutura',
      },
      pingLocation: {
        label: 'Pingar Localização',
      },
      sharePosition: {
        label: 'Compartilhar Posição',
      },
      sharedLocation: {
        message: 'Compartilhou uma localização no mapa.',
      },
      locationSent: {
        notification: 'Localização enviada ao chat.',
      },
    },
    keyboard: {
      closePanel: {
        description: 'Fechar painéis abertos',
      },
      title: 'Atalhos de Teclado',
      tip: {
        text: '💡 Dica: Atalhos funcionam apenas quando não está digitando em campos de texto.',
      },
      nextTurn: {
        description: 'Próximo turno',
      },
      prevTurn: {
        description: 'Turno anterior',
      },
      toggleHistory: {
        description: 'Mostrar/ocultar histórico',
      },
      toggleSuggestions: {
        description: 'Mostrar/ocultar sugestões',
      },
      useShortcuts: {
        text: 'Use estes atalhos para navegar rapidamente durante o combate:',
      },
    },
    attackZone: {
      contextMenu: {
        delete: {
          label: 'Excluir Zona',
        },
        edit: {
          label: 'Editar Zona',
        },
        duplicate: {
          label: 'Duplicar Zona',
        },
        header: 'Zona de Ataque',
        shape: {
          label: 'Forma',
        },
        damage: {
          label: 'Dano',
        },
      },
    },
    tokenHover: {
      actionTooltip: {
        text: 'Clique esquerdo: Linkar no Chat | Clique direito: Remover',
      },
      permissions: {
        description: 'Controle o que os jogadores veem ao passar o mouse sobre tokens. GM sempre vê tudo.',
        name: {
          label: 'Nome',
        },
        objectName: {
          label: 'Nome do Objeto',
        },
        hpBar: {
          label: 'Barra de Vida',
        },
        resourceBar: {
          label: 'Barra de Recurso',
        },
        heroesPCs: {
          label: 'Heróis (PCs)',
        },
        enemiesNPCs: {
          label: 'Inimigos (NPCs)',
        },
        objects: {
          label: 'Objetos',
          title: 'Objetos',
        },
        attributeButtons: {
          label: 'Botões de Atributos',
        },
        inimigosNPCs: {
          label: 'Inimigos (NPCs)',
        },
        applyRulesHint: 'Clique em "Aplicar Regras" para salvar as alterações',
        title: 'Visibilidade de Token Hover',
        enabled: {
          title: 'Token Hover Habilitado',
          description: 'Permitir que jogadores vejam informações ao passar o mouse sobre tokens',
        },
        heroes: {
          title: 'Heróis (PCs)',
        },
        creatures: {
          title: 'Criaturas (NPCs)',
        },
        conditions: {
          label: 'Condições',
        },
        stats: {
          label: 'Estatísticas (CA/Desl/PP)',
        },
        attributes: {
          label: 'Botões de Atributos',
        },
        states: {
          label: 'Estados',
        },
      },
      card: {
        spellClickTooltip: 'Clique esquerdo: Linkar no Chat | Clique direito: Remover',
      },
    },
    settings: {
      view: {
        stopFollowing: {
          label: 'Parar de Seguir',
        },
        followAll: {
          label: 'Seguir Todos',
        },
        cameraControl: {
          title: 'Controle de Câmera',
        },
        controlAllPlayers: {
          text: 'Controle todos os jogadores de uma vez',
        },
        player: {
          label: 'Jogador',
        },
        forceFollow: {
          label: 'Forçar Seguir',
        },
        follow: {
          label: 'Seguir',
        },
        obscureWalls: {
          title: 'Obscurecer Paredes',
          description: 'Ocultar paredes e obstáculos na visão do Mestre para melhor visualização.',
        },
        visionRanges: {
          title: 'Alcances de Visão',
          description: 'Visualizar círculos de alcance de visão dos tokens.',
        },
        globalActions: {
          title: 'Ações Globais',
        },
        pullPlayerView: {
          tooltip: 'Puxar visão deste jogador',
        },
        permissions: {
          hint: 'Para configurar visibilidade e permissões, use o menu Permissões.',
        },
        pullAll: {
          button: 'Puxar Todos',
        },
        pull: {
          button: 'Puxar',
        },
        general: {
          tab: 'Geral',
        },
        following: {
          label: 'Seguindo',
        },
        ghostWalls: {
          title: 'Paredes Fantasmas (GM)',
        },
        gridOpacity: {
          title: 'Opacidade do Grid',
          description: 'Ajuste a intensidade das linhas da grade.',
        },
        title: 'Configurações de Visualização',
      },
    },
    spectate: {
      banner: {
        returnToGM: {
          button: 'Voltar à Visão de Mestre',
        },
        allPlayers: {
          text: 'Todos os Jogadores',
        },
        viewingAs: {
          text: 'Visualizando como:',
        },
      },
    },
    notifications: {
      pullView: {
        message: 'O Mestre puxou sua visão',
        title: 'Atenção',
      },
      followMode: {
        noTarget: 'PARA NINGUÉM',
        broadcasting: 'TRANSMITINDO VISÃO',
        followingGM: 'SEGUINDO MESTRE',
        toAll: 'PARA TODOS',
        toPlayers: 'PARA :count JOGADORES',
        toPrefix: 'PARA',
      },
    },
    smartWall: {
      preview: {
        clickInstruction: 'Clique na imagem abaixo para simular onde você clicaria no mapa. O contorno vermelho mostra como a parede será gerada.',
        clickToTest: 'Clique para testar',
        title: 'Modo de Visualização (Sandbox)',
        description: 'Clique na imagem abaixo para simular onde você clicaria no mapa. O contorno vermelho mostra como a parede será gerada.',
        loading: 'Carregando imagem de teste...',
        tolerance: 'TOLERÂNCIA',
        simplification: 'SIMPLIFICAÇÃO',
        resolution: 'RESOLUÇÃO',
        tip: {
          label: 'Dica:',
          text: 'Use tolerância baixa para cores muito específicas e alta para áreas maiores. A resolução afeta a precisão e o desempenho.',
        },
      },
    },
    gameSession: {
      library: {
        emptyTitle: 'Grimório vazio.',
        emptyDesc: 'Crie um token no mapa e salve-o como modelo para vê-lo aqui.',
        title: 'Bestiário',
        vision: ':range m Visão',
        blind: 'Cego',
      },
      modal: {
        token: {
          create: 'Invocar Criatura',
          edit: 'Editar Criatura',
        },
        handout: {
          deleteConfirm: 'Tem certeza que deseja excluir ":name"?',
          deleteTitle: 'Excluir Recurso',
          new: 'Novo Recurso',
          edit: 'Editar Recurso',
        },
        attackZone: {
          createCustom: 'Criar Zona de Ataque Customizada',
          edit: 'Editar Zona de Ataque',
        },
        triggerZone: {
          edit: 'Editar Gatilho',
        },
        audioZone: {
          edit: 'Editar Zona de Áudio',
        },
      },
      error: {
        noTokenCreatePerm: 'Você não tem permissão para criar tokens.',
        notController: 'Você não controla este token.',
        tokenEditBlocked: 'Edição de tokens bloqueada.',
        tokenCreateBlocked: 'Criação de tokens bloqueada.',
        loadCampaign: 'Falha ao carregar campanha.',
      },
      notification: {
        handoutSaved: 'Recurso salvo.',
        token_added: 'Token adicionado',
        token_removed: 'Token removido',
        active: ':name voltou',
        afk: ':name está ausente (AFK)',
        permission_denied: 'Permissão negada',
        zoneDuplicated: 'Zona duplicada!',
        zoneRemoved: 'Zona removida!',
        zoneUpdated: 'Zona atualizada!',
        zoneCreated: 'Zona de ataque criada!',
      },
      loading: {
        sync: 'SINCRONIZANDO PLANOS...',
        default: 'Carregando...',
      },
      connection: {
        lost: 'CONEXÃO PERDIDA. TENTANDO RECONECTAR...',
        lostSub: '(Suas ações serão salvas e enviadas assim que a conexão voltar)',
      },
      status: {
        connected: 'Conectado ao Servidor',
        disconnected: 'Desconectado',
        live: 'AO VIVO',
        offline: 'OFFLINE',
      },
      toolbar: {
        groupCombat: 'Grupo & Combate',
      },
      combat: {
        label: 'COMBATE',
        round: 'RODADA :round',
      },
    },
  },
  dnd: {
    attributes: {
      strength: {
        name: 'Força',
        abbreviation: 'FOR',
      },
      dexterity: {
        name: 'Destreza',
        abbreviation: 'DES',
      },
      constitution: {
        name: 'Constituição',
        abbreviation: 'CON',
      },
      intelligence: {
        name: 'Inteligência',
        abbreviation: 'INT',
      },
      wisdom: {
        name: 'Sabedoria',
        abbreviation: 'SAB',
      },
      charisma: {
        name: 'Carisma',
        abbreviation: 'CAR',
      },
    },
    sizes: {
      tiny: {
        name: 'Minúsculo',
      },
      small: {
        name: 'Pequeno',
      },
      medium: {
        name: 'Médio',
      },
      large: {
        name: 'Grande',
      },
      huge: {
        name: 'Enorme',
      },
      gargantuan: {
        name: 'Imenso',
      },
    },
    creatureTypes: {
      aberration: {
        name: 'Aberração',
      },
      beast: {
        name: 'Fera',
      },
      celestial: {
        name: 'Celestial',
      },
      construct: {
        name: 'Construto',
      },
      dragon: {
        name: 'Dragão',
      },
      elemental: {
        name: 'Elemental',
      },
      fey: {
        name: 'Fada',
      },
      fiend: {
        name: 'Corruptor',
      },
      giant: {
        name: 'Gigante',
      },
      humanoid: {
        name: 'Humanoide',
      },
      monstrosity: {
        name: 'Monstruosidade',
      },
      ooze: {
        name: 'Limo',
      },
      plant: {
        name: 'Planta',
      },
      undead: {
        name: 'Morto-vivo',
      },
    },
    alignments: {
      lawfulGood: {
        name: 'Leal e Bom',
      },
      neutralGood: {
        name: 'Neutro e Bom',
      },
      chaoticGood: {
        name: 'Caótico e Bom',
      },
      lawfulNeutral: {
        name: 'Leal e Neutro',
      },
      neutral: {
        name: 'Neutro',
      },
      chaoticNeutral: {
        name: 'Caótico e Neutro',
      },
      lawfulEvil: {
        name: 'Leal e Mau',
      },
      neutralEvil: {
        name: 'Neutro e Mau',
      },
      chaoticEvil: {
        name: 'Caótico e Mau',
      },
      unaligned: {
        name: 'Sem alinhamento',
      },
    },
    schools: {
      abjuration: {
        name: 'Abjuração',
      },
      conjuration: {
        name: 'Conjuração',
      },
      divination: {
        name: 'Adivinhação',
      },
      enchantment: {
        name: 'Encantamento',
      },
      evocation: {
        name: 'Evocação',
      },
      illusion: {
        name: 'Ilusão',
      },
      necromancy: {
        name: 'Necromancia',
      },
      transmutation: {
        name: 'Transmutação',
      },
    },
    skills: {
      acrobatics: {
        name: 'Acrobacia',
      },
      animalHandling: {
        name: 'Lidar com Animais',
      },
      arcana: {
        name: 'Arcanismo',
      },
      athletics: {
        name: 'Atletismo',
      },
      deception: {
        name: 'Enganação',
      },
      history: {
        name: 'História',
      },
      insight: {
        name: 'Intuição',
      },
      intimidation: {
        name: 'Intimidação',
      },
      investigation: {
        name: 'Investigação',
      },
      medicine: {
        name: 'Medicina',
      },
      nature: {
        name: 'Natureza',
      },
      perception: {
        name: 'Percepção',
      },
      performance: {
        name: 'Atuação',
      },
      persuasion: {
        name: 'Persuasão',
      },
      religion: {
        name: 'Religião',
      },
      sleightOfHand: {
        name: 'Prestidigitação',
      },
      stealth: {
        name: 'Furtividade',
      },
      survival: {
        name: 'Sobrevivência',
      },
    },
    damageTypes: {
      acid: {
        name: 'Ácido',
      },
      bludgeoning: {
        name: 'Contundente',
      },
      cold: {
        name: 'Frio',
      },
      fire: {
        name: 'Fogo',
      },
      force: {
        name: 'Força',
      },
      lightning: {
        name: 'Elétrico',
      },
      necrotic: {
        name: 'Necrótico',
      },
      piercing: {
        name: 'Perfurante',
      },
      poison: {
        name: 'Veneno',
      },
      psychic: {
        name: 'Psíquico',
      },
      radiant: {
        name: 'Radiante',
      },
      slashing: {
        name: 'Cortante',
      },
      thunder: {
        name: 'Trovejante',
      },
    },
    rarities: {
      common: {
        name: 'Comum',
      },
      uncommon: {
        name: 'Incomum',
      },
      rare: {
        name: 'Raro',
      },
      veryRare: {
        name: 'Muito Raro',
      },
      legendary: {
        name: 'Lendário',
      },
      artifact: {
        name: 'Artefato',
      },
    },
    itemTypes: {
      weapon: {
        name: 'Arma',
      },
      armor: {
        name: 'Armadura',
      },
      potion: {
        name: 'Poção',
      },
      ring: {
        name: 'Anel',
      },
      scroll: {
        name: 'Pergaminho',
      },
      staff: {
        name: 'Cajado',
      },
      wand: {
        name: 'Varinha',
      },
      wondrousItem: {
        name: 'Item Maravilhoso',
      },
    },
    combat: {
      meleeWeaponAttack: {
        name: 'Ataque com Arma Corpo a Corpo',
      },
      rangedWeaponAttack: {
        name: 'Ataque com Arma à Distância',
      },
      toHit: {
        name: 'para acertar',
      },
      reach: {
        name: 'alcance',
      },
      range: {
        name: 'distância',
      },
      oneTarget: {
        name: 'um alvo',
      },
      hit: {
        name: 'Acerto',
      },
      damage: {
        name: 'dano',
      },
      savingThrow: {
        name: 'salvaguarda',
      },
      difficultyClass: {
        abbreviation: 'CD',
      },
    },
    rules: {
      conditions: {
        frightened: {
          name: 'Amedrontado',
          effects: ['Desvantagem em testes de habilidade e jogadas de ataque enquanto a fonte do medo estiver à vista.', 'Não pode se aproximar voluntariamente da fonte do medo.'],
          duration: 'Até o fim do próximo turno ou removido da visão da fonte.',
        },
        grappled: {
          name: 'Agarrado',
          effects: ['Deslocamento reduzido a 0.', 'Termina se o agarrador ficar incapacitado ou se a criatura for removida do alcance.'],
          duration: 'Até o fim do agarrador ou teste de Força/Fuga.',
        },
        stunned: {
          name: 'Atordoado',
          effects: ['Incapacitado (sem ações/reações).', 'Falha automática em testes de Força e Destreza.', 'Jogadas de ataque contra a criatura têm vantagem.'],
          duration: 'Até o fim do próximo turno (geralmente).',
        },
        prone: {
          name: 'Caído',
          effects: ['Só pode rastejar ou gastar metade do movimento para levantar.', 'Desvantagem em suas jogadas de ataque.', 'Ataques corpo a corpo contra a criatura têm vantagem; à distância têm desvantagem.'],
          duration: 'Até se levantar.',
        },
        blinded: {
          name: 'Cego',
          effects: ['Falha automática em testes que dependam de visão.', 'Suas jogadas de ataque têm desvantagem.', 'Ataques contra a criatura têm vantagem.'],
          duration: 'Varia.',
        },
        charmed: {
          name: 'Enfeitiçado',
          effects: ['Não pode atacar o enfeitiçador nem mirar nele efeitos hostis.', 'O enfeitiçador tem vantagem em testes de Carisma contra a criatura.'],
          duration: '1 hora ou até sofrer dano do enfeitiçador.',
        },
        poisoned: {
          name: 'Envenenado',
          effects: ['Desvantagem em jogadas de ataque e testes de habilidade.'],
          duration: 'Varia (TS CON repetido).',
        },
        restrained: {
          name: 'Impedido',
          effects: ['Deslocamento 0.', 'Desvantagem em jogadas de ataque e testes de Destreza.', 'Ataques contra a criatura têm vantagem.'],
          duration: 'Varia.',
        },
        incapacitated: {
          name: 'Incapacitado',
          effects: ['Não pode realizar ações nem reações.'],
          duration: 'Varia.',
        },
        unconscious: {
          name: 'Inconsciente',
          effects: ['Incapacitado, não se move, não fala, sem consciência.', 'Solta itens e fica Caído.', 'Falha automática em testes de Força e Destreza.', 'Ataques contra a criatura têm vantagem e são críticos se atacante estiver a 1,5m.'],
          duration: 'Até ser curado ou estabilizado.',
        },
        invisible: {
          name: 'Invisível',
          effects: ['Impossível de ser visto sem magia/sentidos especiais.', 'Considerado muito obscurecido para esconder-se.', 'Suas jogadas de ataque têm vantagem.', 'Ataques contra a criatura têm desvantagem.'],
          duration: 'Varia (magia).',
        },
        paralyzed: {
          name: 'Paralisado',
          effects: ['Incapacitado e não pode se mover nem falar.', 'Falha automática em testes de Força e Destreza.', 'Ataques contra a criatura têm vantagem e são críticos se atacante estiver a 1,5m.'],
          duration: 'Varia.',
        },
        petrified: {
          name: 'Petrificado',
          effects: ['Transformado em substância sólida (inanimado).', 'Incapacitado, não envelhece, peso x10.', 'Resistência a todo dano, imune a veneno/doença.', 'Falha automática em testes de Força e Destreza.'],
          duration: 'Permanente até restaurado.',
        },
        deafened: {
          name: 'Surdo',
          effects: ['Falha automática em testes que dependam de audição.'],
          duration: '1 hora (típico).',
        },
        exhausted: {
          name: 'Exausto',
          effects: ['Nvl 1: Desvantagem em testes de habilidade.', 'Nvl 2: Deslocamento reduzido à metade.', 'Nvl 3: Desvantagem em ataques e testes de resistência.', 'Nvl 4: PV Máximo reduzido à metade.', 'Nvl 5: Deslocamento 0.', 'Nvl 6: Morte.'],
          duration: 'Descanso Longo reduz 1 nível.',
        },
        burning: {
          name: 'Queimando',
          effects: ['Sofre 1d6 de dano de fogo no início de cada turno.', 'Pode gastar uma ação para apagar as chamas (CD 10 Destreza).'],
          duration: '1 minuto ou até apagado.',
        },
        bleeding: {
          name: 'Sangrando',
          effects: ['Sofre 1d4 de dano necrótico/perfurante no início do turno.', 'Qualquer cura mágica encerra a condição.'],
          duration: 'Até curado (Medicina CD 10 ou Cura).',
        },
        dead: {
          name: 'Morto',
          effects: ['Personagem faleceu.'],
          duration: 'Permanente.',
        },
        bloodied: {
          name: 'Ferido (Bloodied)',
          effects: ['Abaixo da metade dos pontos de vida.'],
          duration: 'Até ser curado acima de 50%.',
        },
        shielded: {
          name: 'Protegido',
          effects: ['Possui bônus na CA ou proteção mágica.'],
          duration: 'Varia.',
        },
        alert: {
          name: 'Alerta',
          effects: ['Vantagem em iniciativa e percepção.'],
          duration: 'Varia.',
        },
      },
      weaponMasteries: {
        cleave: {
          name: 'Cleave',
          desc: 'Atinge uma segunda criatura a 1,5m.',
        },
        graze: {
          name: 'Graze',
          desc: 'Causa dano igual ao mod de atributo se errar.',
        },
        nick: {
          name: 'Nick',
          desc: 'Ataque extra da propriedade Leve não custa Ação Bônus.',
        },
        push: {
          name: 'Push',
          desc: 'Empurra a criatura 3m.',
        },
        sap: {
          name: 'Sap',
          desc: 'Desvantagem na próxima jogada de ataque do alvo.',
        },
        slow: {
          name: 'Slow',
          desc: 'Reduz o deslocamento do alvo em 3m.',
        },
        topple: {
          name: 'Topple',
          desc: 'Alvo faz salvaguarda de CON ou cai.',
        },
        vex: {
          name: 'Vex',
          desc: 'Vantagem na próxima jogada de ataque contra o alvo.',
        },
      },
    },
  },
  rules: {
    status: {
      frightened: {
        name: 'Amedrontado',
        effect: {
          '0': 'Desvantagem em testes de habilidade e jogadas de ataque enquanto a fonte do medo estiver à vista.',
          '1': 'Não pode se aproximar voluntariamente da fonte do medo.',
        },
        duration: 'Até o fim do próximo turno ou removido da visão da fonte.',
      },
      grappled: {
        name: 'Agarrado',
        effect: {
          '0': 'Deslocamento reduzido a 0.',
          '1': 'Termina se o agarrador ficar incapacitado ou se a criatura for removida do alcance.',
        },
        duration: 'Até o fim do agarrador ou teste de Força/Fuga.',
      },
      stunned: {
        name: 'Atordoado',
        effect: {
          '0': 'Incapacitado (sem ações/reações).',
          '1': 'Falha automática em testes de Força e Destreza.',
          '2': 'Jogadas de ataque contra a criatura têm vantagem.',
        },
        duration: 'Até o fim do próximo turno (geralmente).',
      },
      prone: {
        name: 'Caído',
        effect: {
          '0': 'Só pode rastejar ou gastar metade do movimento para levantar.',
          '1': 'Desvantagem em suas jogadas de ataque.',
          '2': 'Ataques corpo a corpo contra a criatura têm vantagem; à distância têm desvantagem.',
        },
        duration: 'Até se levantar.',
      },
      blinded: {
        name: 'Cego',
        effect: {
          '0': 'Falha automática em testes que dependam de visão.',
          '1': 'Suas jogadas de ataque têm desvantagem.',
          '2': 'Ataques contra a criatura têm vantagem.',
        },
        duration: 'Varia.',
      },
      charmed: {
        name: 'Enfeitiçado',
        effect: {
          '0': 'Não pode atacar o enfeitiçador nem mirar nele efeitos hostis.',
          '1': 'O enfeitiçador tem vantagem em testes de Carisma contra a criatura.',
        },
        duration: '1 hora ou até sofrer dano do enfeitiçador.',
      },
      poisoned: {
        name: 'Envenenado',
        effect: {
          '0': 'Desvantagem em jogadas de ataque e testes de habilidade.',
        },
        duration: 'Varia (TS CON repetido).',
      },
      restrained: {
        name: 'Impedido',
        effect: {
          '0': 'Deslocamento 0.',
          '1': 'Desvantagem em jogadas de ataque e testes de Destreza.',
          '2': 'Ataques contra a criatura têm vantagem.',
        },
        duration: 'Varia.',
      },
      incapacitated: {
        name: 'Incapacitado',
        effect: {
          '0': 'Não pode realizar ações nem reações.',
        },
      },
      unconscious: {
        name: 'Inconsciente',
        effect: {
          '0': 'Incapacitado, não se move, não fala, sem consciência.',
          '1': 'Solta itens e fica Caído.',
          '2': 'Falha automática em testes de Força e Destreza.',
          '3': 'Ataques contra a criatura têm vantagem e são críticos se atacante estiver a 1,5m.',
        },
        duration: 'Até ser curado ou estabilizado.',
      },
      invisible: {
        name: 'Invisível',
        effect: {
          '0': 'Impossível de ser visto sem magia/sentidos especiais.',
          '1': 'Considerado muito obscurecido para esconder-se.',
          '2': 'Suas jogadas de ataque têm vantagem.',
          '3': 'Ataques contra a criatura têm desvantagem.',
        },
      },
      paralyzed: {
        name: 'Paralisado',
        effect: {
          '0': 'Incapacitado e não pode se mover nem falar.',
          '1': 'Falha automática em testes de Força e Destreza.',
          '2': 'Ataques contra a criatura têm vantagem e são críticos se atacante estiver a 1,5m.',
        },
      },
      petrified: {
        name: 'Petrificado',
        effect: {
          '0': 'Transformado em substância sólida (inanimado).',
          '1': 'Incapacitado, não envelhece, peso x10.',
          '2': 'Resistência a todo dano, imune a veneno/doença.',
        },
        duration: 'Permanente até restaurado.',
      },
      deafened: {
        name: 'Surdo',
        effect: {
          '0': 'Falha automática em testes que dependam de audição.',
        },
        duration: '1 hora (típico).',
      },
      exhausted: {
        name: 'Exausto',
        effect: {
          '0': 'Nvl 1: Desvantagem em testes de habilidade.',
          '1': 'Nvl 2: Deslocamento reduzido à metade.',
          '2': 'Nvl 3: Desvantagem em ataques e testes de resistência.',
          '3': 'Nvl 4: PV Máximo reduzido à metade.',
          '4': 'Nvl 5: Deslocamento 0.',
          '5': 'Nvl 6: Morte.',
        },
        duration: 'Descanso Longo reduz 1 nível.',
      },
      burning: {
        name: 'Queimando',
        effect: {
          '0': 'Sofre 1d6 de dano de fogo no início de cada turno.',
          '1': 'Pode gastar uma ação para apagar as chamas (CD 10 Destreza).',
        },
        duration: '1 minuto ou até apagado.',
      },
      bleeding: {
        name: 'Sangrando',
        effect: {
          '0': 'Sofre 1d4 de dano necrótico/perfurante no início do turno.',
          '1': 'Qualquer cura mágica encerra a condição.',
        },
        duration: 'Até curado (Medicina CD 10 ou Cura).',
      },
      dead: {
        name: 'Morto',
        effect: {
          '0': 'Personagem faleceu.',
        },
        duration: 'Permanente.',
      },
      bloodied: {
        name: 'Ferido (Bloodied)',
        effect: {
          '0': 'Abaixo da metade dos pontos de vida.',
        },
        duration: 'Até ser curado acima de 50%.',
      },
      shielded: {
        name: 'Protegido',
        effect: {
          '0': 'Possui bônus na CA ou proteção mágica.',
        },
      },
      alert: {
        name: 'Alerta',
        effect: {
          '0': 'Vantagem em iniciativa e percepção.',
        },
      },
    },
    aura: {
      corrosiveAsh: {
        name: 'Aura de Cinzas Corrosivas',
        trigger: 'Início do turno',
        desc: '1d6 ácido por turno. Criaturas afetadas têm -2m de movimento.',
        effectName: 'Cinzas Corrosivas',
        effectDesc: '1d6 Ácido / -2m Movimento',
      },
      deepTerror: {
        name: 'Aura de Terror Profundo',
        trigger: 'Entrada ou Início do turno',
        desc: 'Teste de Sabedoria (CD 8+Prof+Attr). Falha: Amedrontado por 1 turno.',
        effectName: 'Terror Profundo',
        effectDesc: 'Save WIS ou Amedrontado',
      },
      etherealGuardian: {
        name: 'Aura do Guardião Etéreo',
        trigger: 'Constante',
        desc: '+1 CA para aliados. Primeiro ataque contra cada aliado tem desvantagem (1/rodada).',
        effectName: 'Guardião Etéreo',
        effectDesc: '+1 CA / Desvantagem no 1º ataque recebido',
      },
      elementalResistance: {
        name: 'Aura de Resistência Elemental',
        desc: 'Resistência a um elemento escolhido (Fogo, Frio, Ácido, etc).',
        effectName: 'Resistência Elemental',
        effectDesc: 'Resistência ao elemento escolhido',
      },
      protection: {
        name: 'Aura de Proteção',
        desc: 'Aliados adicionam modificador de Carisma aos testes de resistência.',
        effectName: 'Proteção (Carisma)',
        effectDesc: '+CHA em Saves',
      },
      courage: {
        name: 'Aura de Coragem',
        desc: 'Aliados não podem ser amedrontados.',
        effectName: 'Coragem',
        effectDesc: 'Imune a Medo',
      },
      strategist: {
        name: 'Aura do Estrategista',
        desc: 'Aliados ganham +1 em testes de ataque.',
        effectName: 'Estrategista',
        effectDesc: '+1 Ataque',
      },
      arcaneFocus: {
        name: 'Aura de Foco Arcano',
        desc: 'Aliados têm vantagem em testes de concentração.',
        effectName: 'Foco Arcano',
        effectDesc: 'Vantagem em Concentração',
      },
      vitality: {
        name: 'Aura de Vitalidade',
        trigger: 'Ação Bônus',
        desc: 'Cura 2d6 por ação em um alvo dentro da área.',
        effectName: 'Vitalidade',
        effectDesc: 'Pode ser curado (2d6)',
      },
      temporalSlow: {
        name: 'Aura de Lentidão Temporal',
        trigger: 'Entrada',
        desc: 'Criaturas têm -3m de movimento e não podem fazer Reações.',
        effectName: 'Lentidão Temporal',
        effectDesc: '-3m Movimento / Sem Reações',
      },
      windGust: {
        name: 'Aura de Rajada de Vento',
        desc: 'Criaturas que entram fazem teste de Força ou são empurradas 1,5m.',
        effectName: 'Pancada de Vento',
        effectDesc: 'Save STR ou Empurrão 1.5m',
      },
      spiritGuardians: {
        name: 'Espíritos Guardiões',
        desc: 'Dano contínuo e redução de movimento para inimigos.',
        effectName: 'Guardiões Espirituais',
        effectDesc: 'Dano / Movimento Reduzido',
      },
      fear: {
        name: 'Aura de Medo',
        desc: 'Criaturas devem passar teste ou ficam amedrontadas.',
        effectName: 'Medo',
        effectDesc: 'Teste de Sabedoria ou Amedrontado',
      },
      fire: {
        name: 'Aura de Fogo',
        desc: 'Dano de fogo ao aproximar ou iniciar turno.',
        effectName: 'Fogo',
        effectDesc: 'Dano de Fogo',
      },
    },
  },
} as const;
