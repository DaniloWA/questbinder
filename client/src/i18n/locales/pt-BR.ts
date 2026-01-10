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
      undo: {
        label: 'Desfazer',
      },
      redo: {
        label: 'Refazer',
      },
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
  },
  vtt: {
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
          applyCondition: 'Aplicou **{condition}** em {name}.',
          shareCondition: 'Compartilhou a condição **{condition}**.',
          addCondition: 'Adicionar Condição',
          rollAttribute: 'Rolar Teste de {attr} ({mod})',
          testOf: 'Teste de {attr}',
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
        size: 'Tamanho {size}x{size}',
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
        shareTokenNotify: 'Linkou o token {name} no chat.',
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
          whisper: 'Sussurrar para {name}',
        },
        ooc: 'Eu (OOC)',
        global: 'Todos (OOC)',
      },
      messages: {
        whisper: {
          toMe: 'Sussurrou para você',
          fromMe: 'Sussurrou para {name}',
          other: 'Sussurro para {name}',
        },
        system: {
          damage: '**:name** sofreu **{diff}** de dano.',
          heal: '**:name** recuperou **{diff}** de vida.',
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
          goTo: 'Ir para {label}',
        },
      },
    },
    party: {
      onlineCount: 'Online ({count})',
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
            opacity: 'Opacidade ({percent}%)',
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
          inheritValue: 'Herdar ({value})',
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
} as const;
