/**
 * English (United States) Translations
 * QuestBinder VTT - Fallback Locale
 */

export default {
  common: {
    actions: {
      save: {
        label: 'Save',
      },
      cancel: {
        label: 'Cancel',
      },
      confirm: {
        label: 'Confirm',
      },
      delete: {
        label: 'Delete',
      },
      close: {
        label: 'Close',
      },
      retry: {
        label: 'Retry',
      },
      edit: {
        label: 'Edit',
      },
      create: {
        label: 'Create',
      },
      add: {
        label: 'Add',
      },
      remove: {
        label: 'Remove',
      },
      search: {
        label: 'Search',
      },
      clear: {
        label: 'Clear',
      },
      reset: {
        label: 'Reset',
      },
      apply: {
        label: 'Apply',
      },
      undo: {
        label: 'Undo',
      },
      redo: {
        label: 'Redo',
      },
    },
    states: {
      loading: {
        message: 'Loading...',
      },
      saving: {
        message: 'Saving...',
      },
      error: {
        title: 'Error',
        description: 'Something went wrong.',
      },
      success: {
        message: 'Success!',
      },
      empty: {
        message: 'No items found.',
      },
      notFound: {
        message: 'Not found.',
      },
    },
    validation: {
      required: {
        errorMessage: 'This field is required.',
      },
      email: {
        errorMessage: 'Invalid email.',
      },
      minLength: {
        errorMessage: 'Minimum :min characters.',
      },
      maxLength: {
        errorMessage: 'Maximum :max characters.',
      },
    },
    plurals: {
      items: '{0} No items|{1} :count item|[2,*] :count items',
      characters: '{0} No characters|{1} :count character|[2,*] :count characters',
      tokens: '{0} No tokens|{1} :count token|[2,*] :count tokens',
    },
    time: {
      seconds: '{1} :count second|[2,*] :count seconds',
      minutes: '{1} :count minute|[2,*] :count minutes',
      hours: '{1} :count hour|[2,*] :count hours',
    },
    duration: 'Duration',
    shareTooltip: 'Share',
    hero: 'Hero',
    creature: 'Creature',
    passivePerception: 'Passive Perception',
    visible: 'Visible',
    hidden: 'Hidden',
    hp: 'HP',
    resource: 'Resource',
    unknownEffect: 'Unknown Effect',
    activeEffects: 'Active Effects',
    acModifier: 'AC Mod',
    ac: 'AC',
    speedModifier: 'Speed Mod',
    speed: 'Speed',
    sheet: 'Sheet',
    cancel: 'Cancel',
    permissions: {
      denied: 'Permission Denied',
    },
    me: 'You',
  },
  access: {
    restricted: 'Access Restricted',
    featureLocked: 'Feature Locked',
    upgradeRequired: 'Upgrade Required',
    upgradeToAccess: 'Upgrade to access :feature',
    permissionDenied: 'Permission Denied',
    roleRequired: 'Requires :role role',
    clickToUpgrade: 'Click to view plans',
  },
  vtt: {
    cursor: {
      settings: {
        title: 'Cursor Settings',
        editingLabel: 'Editing',
        myCursor: 'My Cursor',
        playersLabel: 'Players',
        noPlayers: 'No players online',
        defaultName: 'Name',
        setOverride: 'Set Override',
        clearOverride: 'Clear',
      },
      editor: {
        tabs: {
          general: 'General',
          animations: 'Animations',
          ping: 'Ping',
          trail: 'Trail',
          options: 'Options',
        },
        general: {
          shape: {
            label: 'Shape',
          },
          name: {
            label: 'Display Name',
          },
          color: {
            label: 'Main Color',
          },
        },
        animations: {
          style: {
            label: 'Click Style',
          },
          leftColor: {
            label: 'Left Button',
          },
          rightColor: {
            label: 'Right Button',
          },
        },
        ping: {
          style: {
            label: 'Ping Style',
          },
          color: {
            label: 'Ping Color',
          },
        },
        preview: {
          left: 'L. Click',
          right: 'R. Click',
          ping: 'Ping (Hold)',
        },
        trail: {
          enable: 'Enable Trail',
          style: 'Trail Style',
          color: 'Trail Color',
          length: 'Length',
          thickness: 'Thickness',
          thin: 'Thin',
          thick: 'Thick',
          short: 'Short',
          long: 'Long',
          size: 'Size',
          small: 'Small',
          large: 'Large',
        },
        options: {
          showOthersTrails: 'Show Others Trails',
          showMyTrail: 'Show My Trail',
          explosionOnCollision: 'Explosion on Collision',
          showToolActivity: 'Show Tool Activity',
          showToolActivityDesc: 'Display active tool icon (e.g. Ruler, Combat) next to cursor.',
          showStatusActivity: 'Show Status Activity',
          showStatusActivityDesc: 'Display status icons (e.g. Typing, In Combat).',
        },
        overrides: {
          gmSet: 'Set by GM',
          locked: 'Locked',
        },
      },
      animations: {
        ripple: 'Ripple',
        burst: 'Burst',
        sparkle: 'Sparkle',
        pulse: 'Pulse',
        vortex: 'Vortex',
        shard: 'Shards',
        ring: 'Ring',
        echo: 'Echo',
        orb: 'Orb',
      },
      pings: {
        radar: 'Radar',
        beacon: 'Beacon',
        sonar: 'Sonar',
        target: 'Target',
        flare: 'Flare',
        diamond: 'Diamond',
        cross: 'Cross',
      },
      trails: {
        line: 'Smooth Line',
        particles: 'Particles',
        dice: 'Dice (D20)',
        sparkles: 'Sparkles',
        smoke: 'Smoke',
        electric: 'Electric',
      },
      notifications: {
        afk: ':name is away (AFK)',
        active: ':name returned',
      },
      afk: {
        title: 'You are Away',
        desc: 'Move your mouse or interact with the screen to return.',
        warning_title: 'Inactivity Detected!',
        warning_desc: 'You will be disconnected in :seconds seconds.',
        fallback_kick: 'You have been disconnected due to inactivity (connection lost).',
      },
    },
    grid: {
      inspector: {
        title: 'Grid Inspector',
        cellSize: 'Cell Size',
        cellSizeUnit: 'px',
        offset: 'Grid Offset',
        offsetX: 'Offset X',
        offsetY: 'Offset Y',
        tableSize: 'Table Size',
        cols: 'Columns',
        rows: 'Rows',
        fitToImage: 'Fit to Image',
        autoDetect: 'Auto Detect Grid',
        detecting: 'Detecting...',
        confidence: 'Confidence',
        snapValues: 'Snap Values',
        lockRatio: 'Lock Aspect Ratio',
        threePointAlign: '3-Point Align',
        dragManually: 'Drag Grid Manually',
        stopDragging: 'Stop Dragging',
        draggingActive: 'Dragging Active',
        resetDefaults: 'Reset Defaults',
        keyboardHint: 'Use Arrow Keys to nudge • Hold Shift for 10px',
        threePointHint: 'Click 3 Points: Top-Left, Top-Right, Bottom-Left',
        simpleView: 'Simple View',
        advancedView: 'Advanced View',
        options: 'Options',
        recentDetections: 'Recent Detections',
        presets: 'Presets',
        readyToAlign: 'Ready to align',
      },
    },
    tools: {
      toolbar: {
        selectTool: {
          button: {
            label: 'Select',
            tooltip: 'Selection tool (V)',
          },
        },
        rulerTool: {
          button: {
            label: 'Ruler',
            tooltip: 'Measure distances (M)',
          },
        },
        drawingTools: {
          group: {
            label: 'Draw',
          },
          brush: {
            button: {
              label: 'Free Brush',
              tooltip: 'Freehand drawing',
            },
          },
          eraser: {
            button: {
              label: 'Erase Drawings',
              tooltip: 'Remove drawings',
            },
          },
        },
        cursorSettings: {
          button: {
            label: 'Cursors',
            tooltip: 'Cursor settings',
          },
        },
        architectureTools: {
          group: {
            label: 'Architecture',
          },
          wall: {
            button: {
              label: 'Wall',
              tooltip: 'Draw wall',
            },
          },
          freehandWall: {
            button: {
              label: 'Freehand Wall (Drawing)',
              tooltip: 'Freehand wall',
            },
          },
          smartWall: {
            button: {
              label: 'Smart Wall (Magic Wand)',
              tooltip: 'Auto-detect walls',
            },
          },
          door: {
            button: {
              label: 'Door',
              tooltip: 'Add door',
            },
          },
          window: {
            button: {
              label: 'Window',
              tooltip: 'Add window',
            },
          },
          eraser: {
            button: {
              label: 'Eraser (Structure)',
              tooltip: 'Remove structures',
            },
          },
        },
        lightingTools: {
          group: {
            label: 'Lighting & Fog',
          },
          lightRect: {
            button: {
              label: 'Light (Rectangle)',
              tooltip: 'Rectangular light area',
            },
          },
          lightPoly: {
            button: {
              label: 'Light (Polygon)',
              tooltip: 'Polygonal light area',
            },
          },
          fogOfWar: {
            submenu: {
              title: 'Fog of War',
            },
            revealPoly: {
              button: {
                label: 'Reveal (Polygon)',
              },
            },
            revealRect: {
              button: {
                label: 'Reveal (Rectangle)',
              },
            },
            reset: {
              button: {
                label: 'Reset Fog',
                confirmPrompt: 'Are you sure you want to reset all fog?',
              },
            },
          },
        },
        audioTools: {
          group: {
            label: 'Audio',
          },
          panel: {
            button: {
              label: 'Audio Panel',
              tooltip: 'Open audio panel',
            },
          },
          zones: {
            submenu: {
              title: 'Audio Zones',
            },
            rect: {
              button: {
                label: 'Zone (Rectangle)',
              },
            },
            poly: {
              button: {
                label: 'Zone (Polygon)',
              },
            },
            eraser: {
              button: {
                label: 'Erase Audio Zone',
              },
            },
          },
        },
        triggerTools: {
          group: {
            label: 'Triggers',
          },
          rect: {
            button: {
              label: 'Trigger (Rectangle)',
            },
          },
          poly: {
            button: {
              label: 'Trigger (Polygon)',
            },
          },
          eraser: {
            button: {
              label: 'Erase Trigger',
            },
          },
        },
        gameplayTools: {
          attackZones: {
            button: {
              label: 'Attack Zones',
              tooltip: 'Manage attack zones',
            },
          },
          diceRoller: {
            button: {
              label: 'Dice Table',
              tooltip: 'Open dice roller',
            },
          },
          bestiary: {
            button: {
              label: 'Bestiary (Tokens)',
              tooltip: 'Creature library',
            },
          },
          compendium: {
            button: {
              label: 'Compendium',
              tooltip: 'Spells and items compendium',
            },
          },
          handouts: {
            button: {
              label: 'Handouts',
              tooltip: 'Manage handouts',
            },
          },
          addToken: {
            button: {
              label: 'New Token',
              tooltip: 'Add token to map',
            },
          },
          startCombat: {
            button: {
              label: 'Start Combat',
              tooltip: 'Begin combat encounter',
            },
          },
          endCombat: {
            button: {
              label: 'End Combat',
              tooltip: 'End current combat',
            },
          },
        },
        gmTools: {
          group: {
            label: 'Game Master',
          },
          viewSettings: {
            button: {
              label: 'View & Sync',
            },
          },
          permissions: {
            button: {
              label: 'Permissions',
            },
          },
          gridCoords: {
            button: {
              label: 'Grid Coordinates',
            },
          },
          mapSettings: {
            button: {
              label: 'Map Settings',
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
            label: 'Combat',
          },
          party: {
            label: 'Party',
          },
        },
        popoutButton: {
          tooltip: 'Pop-out in New Window',
        },
        dockButton: {
          tooltip: 'Dock back',
        },
        closeButton: {
          tooltip: 'Close Sidebar',
        },
        undockedPlaceholder: {
          title: 'Sidebar Undocked',
          description: 'The sidebar is open in another window.',
          redockButton: {
            label: 'Re-dock',
          },
          closeSidebarButton: {
            label: 'Close Sidebar',
          },
        },
        popupBlocked: {
          warningBanner: {
            title: 'Popup blocked!',
            message: 'Click the icon in your browser address bar and allow popups for this site.',
          },
          retryButton: {
            label: 'Retry',
          },
          closeButton: {
            label: 'Close',
          },
        },
        popoutWindow: {
          title: 'QuestBinder Sidebar',
        },
        languageToggle: {
          tooltip: 'Change Language',
        },
      },
    },
    sidebar: {
      popout: {
        title: 'Popout',
      },
    },
    common: {
      hero: 'Hero',
      creature: 'Creature',
      object: 'Object',
      visible: 'Visible',
      hidden: 'Hidden',
      unknownEffect: 'Unknown Effect.',
      duration: 'Duration',
      shareTooltip: 'Click to share',
      activeEffects: 'Active Effects',
      ac: 'AC',
      speed: 'Speed',
      sheet: 'Sheet',
      hp: 'HP',
      resource: 'Resource',
      passivePerception: 'Passive Perception',
      acModifier: 'AC Modifier',
      speedModifier: 'Speed Modifier',
      all: 'All',
      me: 'Me',
    },
    tokens: {
      editModal: {
        header: {
          title: {
            creating: 'New Token',
            editing: 'Edit Token',
          },
        },
        tabs: {
          basic: {
            label: 'Basic',
          },
          stats: {
            label: 'Stats',
          },
          appearance: {
            label: 'Appearance',
          },
          permissions: {
            label: 'Permissions',
          },
          general: {
            label: 'General',
          },
          style: {
            label: 'Style',
          },
          status: {
            label: 'Status',
          },
          light: {
            label: 'Light',
          },
          auras: {
            label: 'Auras',
          },
          sheet: {
            label: 'Sheet',
          },
          perms: {
            label: 'Permissions',
          },
        },
        general: {
          namePlaceholder: 'Token Name',
          sizeLabel: 'Size (Squares)',
          speedLabel: 'Speed (m)',
          dispositionLabel: 'Disposition (AI)',
          dispositions: {
            friendly: 'Friendly',
            neutral: 'Neutral',
            hostile: 'Hostile',
          },
          vision: {
            title: 'Vision',
            normalRange: 'Normal Range',
            normalTooltip: 'Vision range in bright area',
            darkvisionRange: 'Darkvision',
            darkvisionTooltip: 'Vision range in total darkness',
            overlayGM: 'Vision Color (GM Overlay)',
          },
        },
        style: {
          title: 'Shape & Border',
          positioningTitle: 'Image Adjustment & Position',
          zoomLabel: 'Zoom',
          rotationLabel: 'Rotation',
          posXLabel: 'Pos X',
          posYLabel: 'Pos Y',
          tintLabel: 'Tint',
          effectsTitle: 'Visual Effects',
          animationTitle: 'Idle Animation',
          borderStyles: {
            solid: 'Solid',
            dashed: 'Dashed',
            dotted: 'Dotted',
            double: 'Double',
          },
          effects: {
            none: 'None',
            ghostly: 'Ghostly',
            burning: 'Burning',
            frozen: 'Frozen',
            glitch: 'Glitch',
            outline: 'Outline',
          },
          animations: {
            none: 'Static',
            breath: 'Breath',
            float: 'Float',
            spin: 'Spin',
            wobble: 'Wobble',
          },
        },
        footer: {
          saveToBestiary: 'Save to Bestiary',
          bestiaryAbbr: 'Bestiary',
          cancel: 'Cancel',
          uploading: 'Uploading...',
          save: 'Save Changes',
        },
        hover: {
          applyCondition: 'Applied **:condition** to :name.',
          shareCondition: 'Shared condition **:condition**.',
          addCondition: 'Add Condition',
          rollAttribute: 'Roll :attr Check (:mod)',
          testOf: ':attr Check',
        },
        light: {
          title: 'Light',
          enabledLabel: 'Light Emitter',
          enabledDescription: 'Does token illuminate surroundings?',
          brightRadius: 'Bright Radius',
          dimRadius: 'Dim Radius',
          colorIntensity: 'Color and Intensity',
          animationLabel: 'Light Animation',
          animations: {
            none: 'Static',
            torch: 'Torch',
            pulse: 'Pulse',
          },
        },
        status: {
          title: 'Status',
          barsTitle: 'Status Bars',
          bar1Label: 'Health (Bar 1)',
          bar2Label: 'Resource (Bar 2)',
          conditionsTitle: 'Initial Conditions',
          effectsTitle: 'Active Effects',
          noEffects: 'No active effects.',
          auraBadge: 'Aura',
          rounds: 'rounds',
          removeAuraTooltip: 'Remove and Ignore Aura',
          removeEffectTooltip: 'Remove Effect',
        },
        types: {
          pc: 'Hero',
          npc: 'Creature',
          object: 'Object',
        },
        pc: {
          linkSheet: 'Link Sheet',
          noLink: 'No Link',
          selectHero: 'Select Hero...',
        },
        npc: {
          searchBestiary: 'Search Bestiary',
          searchPlaceholder: 'Ex: Goblin, Dragon...',
        },
        object: {
          quickPresets: 'Quick Presets',
          presets: {
            torch: 'Torch',
            lantern: 'Lantern',
            campfire: 'Campfire',
            magic_orb: 'Orb',
            chest: 'Chest',
            door: 'Door',
            trap: 'Trap',
          },
        },
        displayMode: {
          image: 'Image',
          text: 'Acronym',
        },
        preview: {
          alt: 'Token Preview',
        },
        nameField: {
          label: 'Name',
          placeholder: 'Token name',
        },
        sizeField: {
          label: 'Size',
        },
        healthField: {
          label: 'Hit Points',
          current: {
            label: 'Current',
          },
          max: {
            label: 'Maximum',
          },
        },
        imageField: {
          label: 'Image',
          placeholder: 'Image URL',
        },
        saveButton: {
          label: 'Save',
        },
        cancelButton: {
          label: 'Cancel',
        },
        deleteButton: {
          label: 'Delete Token',
          confirmPrompt: 'Are you sure you want to delete this token?',
        },
        statusBar: {
          public: 'Public',
          hidden: 'Hidden',
          currentPlaceholder: 'Current',
          maxPlaceholder: 'Max',
        },
        permissions: {
          title: 'Token Controllers',
          noPlayers: 'No players in session.',
        },
        sheet: {
          typeLabel: 'Type/Race',
          typePlaceholder: 'Humanoid (Goblin)',
          alignmentLabel: 'Alignment',
          alignmentPlaceholder: 'Neutral Evil',
          crLabel: 'Challenge Rating (CR)',
          crPlaceholder: '1/4',
          acLabel: 'AC',
          hpFormulaLabel: 'HP (Formula)',
          hpFormulaPlaceholder: '2d6',
          speedLabel: 'Movement',
          speedPlaceholder: '9m',
          attributesTitle: 'Attributes',
          sensesLabel: 'Senses',
          sensesPlaceholder: 'Darkvision 18m...',
          languagesLabel: 'Languages',
          languagesPlaceholder: 'Common, Goblin...',
          notesLabel: 'Actions and Features',
          notesPlaceholder: '**Scimitar.** +4 to hit, 1d6+2 slashing damage...',
        },
        auras: {
          newAuraDefaultName: 'New Aura',
          constantTrigger: 'Constant',
          effectDefaultName: 'Aura Effect',
          newAuraButton: 'New Aura',
          customTemplate: 'Custom',
          categories: {
            other: 'Other',
            offensive: 'Offensive',
            defensive: 'Defensive',
            support: 'Support',
            control: 'Control',
          },
          noAurasMessage: 'No auras configured.',
          targetsPrefix: 'Targets: ',
          backButton: 'Back',
          editingTitle: 'Editing Aura',
          nameLabel: 'Aura Name',
          categoryLabel: 'Category',
          descriptionLabel: 'Description / Narrative Effect',
          descriptionPlaceholder: 'Describe the aura effect...',
          triggerLabel: 'Trigger',
          triggerPlaceholder: 'Ex: Start of turn',
          requirementsLabel: 'Requirements',
          requirementsPlaceholder: 'Ex: Conscious',
          radiusLabel: 'Radius (meters)',
          shapeLabel: 'Shape',
          targetsLabel: 'Targets',
          targetOptions: {
            allies: 'Allies',
            enemies: 'Enemies',
            all: 'All',
            self: 'Just Me',
          },
          colorLabel: 'Color',
          activeLabel: 'Active',
          visibleLabel: 'Visible (Players)',
          targetsInRangeLabel: 'Targets in Range',
          bulkIncludeAllies: 'Allies',
          bulkExcludeEnemies: 'Enemies',
          bulkIncludeAlliesTooltip: 'Force include all allies',
          bulkExcludeEnemiesTooltip: 'Force exclude all enemies',
          noTokensInRange: 'No tokens in range.',
          includeTooltip: 'Force Include',
          excludeTooltip: 'Force Exclude',
          appliedEffectsLabel: 'Applied Effects',
          addEffectButton: 'Effect',
          effectNamePlaceholder: 'Effect Name',
          noEffectsMessage: 'No effects configured. Aura will be visual only.',
          selectEditMessage: 'Select or create an aura to edit.',
        },
      },
      contextMenu: {
        size: 'Size :size x :size',
        openSheet: 'Open Sheet',
        shareToken: 'Link to Chat',
        edit: 'Edit',
        duplicate: 'Duplicate',
        visible: 'Visible',
        hidden: 'Hidden',
        sendToScene: 'Send to Scene',
        selectDestination: 'Select Destination',
        remove: 'Remove Token',
        conditions: 'Conditions',
        linkTokenNotify: 'Token linked to chat.',
        shareTokenNotify: 'Linked token :name to chat.',
      },
      hoverCard: {
        healthBar: {
          label: 'Health',
        },
        conditions: {
          label: 'Conditions',
        },
        notes: {
          label: 'Notes',
        },
      },
      hoverPermissions: {
        conditions: {
          label: 'Conditions',
        },
      },
    },
    combat: {
      start: {
        title: 'Start Combat',
        pcs: 'PCs: :count',
        npcs: 'NPCs: :count',
        rollNpcs: 'Roll All NPCs',
        rollAll: 'Roll All',
        settings: 'Settings',
        participants: 'Participants',
        selectAll: 'Select All',
        clear: 'Clear',
        empty: 'No tokens available on the map.',
        startButton: 'Start Combat (:count)',
      },
      settings: {
        title: 'Combat Settings',
        autoRoll: 'Auto-roll initiative',
        showToPlayers: 'Show initiative to players',
        showEnemyHp: 'Show enemy HP',
        trackConcentration: 'Track concentration',
        turnTimer: 'Turn timer',
        suggestions: 'Smart suggestions',
        surprise: 'Surprise Round',
      },
      labels: {
        pc: 'PC',
        invisible: 'Invisible to players',
        hp: 'HP: :current/:max',
        ac: 'AC: :value',
        initiative: 'Init',
        rollInitiative: 'Roll Initiative',
      },
      initiativeroller: {
        iniciarCombate: {
          text: 'Start Combat (',
          title: 'Start Combat',
        },
        cancelar: {
          label: 'Cancel',
        },
        nenhumTokenDisponvel: {
          text: 'No tokens available on the map.',
        },
        rolarIniciativa: {
          tooltip: 'Roll Initiative',
        },
        ca: {
          label: '• AC:',
        },
        hp: {
          label: 'HP:',
        },
        invisvelParaJogadores: {
          tooltip: 'Invisible to players',
        },
        limpar: {
          label: 'Clear',
        },
        selecionarTodos: {
          text: 'Select All',
        },
        participantes: {
          label: 'Participants',
        },
        rodadaSurpresa: {
          text: 'Surprise Round',
        },
        sugestesInteligentes: {
          text: 'Smart suggestions',
        },
        timerDeTurno: {
          text: 'Turn timer',
        },
        rastrearConcentrao: {
          text: 'Track concentration',
        },
        autorolarIniciativa: {
          text: 'Auto-roll initiative',
        },
        configuraesDoCombate: {
          text: 'Combat Settings',
        },
        configuraes: {
          tooltip: 'Settings',
        },
        todos: {
          label: 'All',
        },
        rolarTodos: {
          tooltip: 'Roll All',
        },
        npcs: {
          label: 'NPCs',
        },
        rolarTodosOs: {
          tooltip: 'Roll All NPCs',
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
          text: 'No active combat.',
        },
        inicieUmCombate: {
          text: 'Start a combat through the Game Master toolbar.',
        },
        ordemDeTurno: {
          text: 'Turn Order',
        },
        rodada: {
          text: 'Round',
          label: 'Round',
        },
        iniciativa: {
          text: 'Initiative: ',
          label: 'Initiative',
        },
        prximoTurno: {
          label: 'Next Turn',
          text: 'Next Turn',
        },
        next: {
          button: 'Next',
        },
        emptyState: {
          title: 'No Combat',
          message: 'No active combat. Start one to track initiative.',
        },
        header: {
          title: 'Combat Tracker',
        },
        turnTimer: {
          tooltip: 'Turn Timer',
        },
        roundCounter: {
          label: 'Round',
        },
        historyButton: {
          tooltip: 'History',
        },
        settingsButton: {
          tooltip: 'Settings',
        },
        shortcutsButton: {
          tooltip: 'Shortcuts',
        },
        settingsPanel: {
          title: 'Tracker Settings',
          autoRollInit: {
            label: 'Auto-roll Initiative',
          },
          showInit: {
            label: 'Show Initiative',
          },
          showEnemyHP: {
            label: 'Show Enemy HP',
          },
          concentration: {
            label: 'Concentration Tracking',
          },
          turnTimer: {
            label: 'Turn Timer',
          },
          aiSuggestions: {
            label: 'AI Suggestions',
          },
        },
        historyPanel: {
          title: 'Combat History',
          emptyState: {
            message: 'No history available.',
          },
        },
        turnOrder: {
          title: 'Turn Order',
          damagePlaceholder: 'Dmg',
          healPlaceholder: 'Heal',
          removeFromCombat: {
            confirmPrompt: 'Remove from combat?',
            label: 'Remove',
          },
        },
        controls: {
          prevTurn: {
            tooltip: 'Previous Turn',
          },
          nextTurn: {
            label: 'Next Turn',
          },
          endCombat: {
            confirmPrompt: 'End combat?',
            label: 'End Combat',
          },
        },
      },
      tab: {
        nenhumAtaqueConfigurado: {
          text: 'No attacks configured.',
        },
        alcance: {
          placeholder: 'Range',
        },
        nomeDoAtaque: {
          placeholder: 'Attack name',
        },
        aesAtaques: {
          title: 'Actions & Attacks',
        },
        descansoLongo: {
          text: 'Long Rest',
        },
        dadosDeVida: {
          text: 'Hit Dice',
        },
        exausto: {
          label: 'Exhaustion',
        },
        inspirao: {
          label: 'Inspiration',
        },
        percepoPas: {
          label: 'Passive Perception',
        },
        proficincia: {
          label: 'Proficiency',
        },
        deslocamento: {
          label: 'Movement',
        },
        iniciativa: {
          label: 'Initiative',
        },
        percepo: {
          label: 'Perception',
        },
        hpTemporrio: {
          text: 'Temporary HP',
        },
        mx: {
          label: 'Max:',
        },
        pontosDeVida: {
          text: 'Hit Points',
        },
      },
      card: {
        nextTurn: {
          button: 'Next',
        },
        hp: {
          label: 'Hit Points',
        },
        init: {
          abbr: 'Init',
        },
        ac: {
          abbr: 'AC',
        },
      },
    },
    chat: {
      title: 'History',
      tabs: {
        all: 'All',
        chat: 'Chat',
        roll: 'Rolls',
        system: 'System',
        empty: 'No visible records.',
      },
      input: {
        placeholder: {
          global: 'Write your message...',
          whisper: 'Write your whisper...',
        },
      },
      menus: {
        identity: {
          title: 'Identity',
        },
        recipient: {
          title: 'Recipient',
          global: 'All (Global)',
          whisper: 'Whisper to :name',
        },
        ooc: 'Me (OOC)',
        global: 'All (OOC)',
      },
      messages: {
        whisper: {
          toMe: 'Whispered to you',
          fromMe: 'Whispered to :name',
          other: 'Whisper for :name',
        },
        system: {
          damage: '**:name** took **:diff** damage.',
          heal: '**:name** recovered **:diff** HP.',
        },
        roll: {
          label: 'Roll',
          hidden: 'Hidden Roll',
        },
      },
      tooltips: {
        dock: 'Dock',
        popout: 'Popout',
        expand: 'Expand',
        collapse: 'Reduce',
      },
      cards: {
        compendium: {
          open: 'Open',
          grimoire: 'Open in Grimoire',
          readMore: 'Read More',
          collapse: 'Collapse',
        },
        generic: {
          viewDetails: 'View Details',
        },
        attack: {
          rollAttack: 'Roll Attack',
          hit: 'Hit',
          damage: 'Damage',
        },
        spell: {
          level: 'Level',
          cantrip: 'Cantrip',
          school: 'School',
        },
        item: {
          qty: 'Qty',
        },
        position: {
          goTo: 'Go to :label',
        },
      },
      labels: {
        recipient: 'Recipient',
        identity: 'Identity',
        private: 'Private:',
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
      playerLabel: 'Player',
      invite: {
        title: 'Invite Players',
        desc: 'Send the link to your friends.',
        copyButton: 'Copy Link',
        success: 'Link copied!',
      },
    },
    maps: {
      settingsModal: {
        header: {
          title: 'Map Settings',
        },
        ambientLight: {
          label: 'Global Ambient Light',
          totalDarkness: 'Total Darkness',
          desc: 'Sets the base brightness of the map. 0% is total darkness (requires light sources), 100% is daylight.',
        },
        background: {
          image: {
            label: 'Background Image',
            placeholder: 'Image URL or upload...',
            uploadTooltip: 'Upload image (JPG, PNG, GIF, WEBP, BMP - max 10MB)',
            uploading: 'Uploading image...',
            uploadSuccess: 'Image uploaded successfully!',
            error: 'Unexpected error uploading image.',
            unknownError: 'Unknown upload error.',
            formatsInfo: 'Accepted formats: JPG, PNG, GIF, WEBP, BMP • Max size: 10MB',
            retry: 'Try again',
          },
        },
        audio: {
          label: 'Scene Background Music',
          placeholder: 'Select a track...',
          noMusic: 'No Music',
          customUrl: 'Custom URL',
          customUrlPlaceholder: 'Paste music URL here...',
        },
        grid: {
          dimensions: {
            title: 'Grid Dimensions',
            size: 'Size (px)',
            cols: 'Columns (X)',
            rows: 'Rows (Y)',
            units: 'Units/S',
          },
          appearance: {
            title: 'Grid Appearance',
            color: 'Grid Color',
            opacity: 'Opacity (:percent%)',
          },
        },
        defaults: {
          title: 'Creation Defaults',
          hiddenObstacles: 'Create new invisible walls?',
        },
        bulkActions: {
          title: 'Bulk Actions (Structures)',
          hideAll: 'Hide All',
          revealAll: 'Reveal All',
          desc: 'This changes the actual visibility for players.',
        },
        footer: {
          uploading: 'Sending...',
          saveChanges: 'Save Changes',
        },
      },
    },
    permissions: {
      modal: {
        title: 'Session Permissions',
        desc: 'Granular control of what players can do.',
        tabs: {
          global: 'Global',
          logs: 'Logs & Visibility',
          tokenHover: 'Token Hover',
        },
        players: {
          header: 'Players',
          empty: 'No players connected.',
        },
        sections: {
          global: {
            title: 'Global Rules',
            desc: 'These rules apply to everyone unless overridden.',
          },
          visibility: {
            title: 'Visibility & Camera',
          },
          interaction: {
            title: 'Interaction',
          },
          tools: {
            title: 'Tools & Content',
          },
          access: {
            title: 'Access',
          },
          manipulation: {
            title: 'Creation & Manipulation',
          },
          chat: {
            title: 'Chat',
          },
          cursor: {
            title: 'Cursor Customization',
          },
          privacy: {
            title: 'Global Privacy',
          },
          overrides: {
            title: 'Specific exceptions for this player.',
            desc: 'Specific exceptions for this player.',
          },
          logs: {
            title: 'Log Visibility',
            desc: 'Define who can see automatic system events.',
          },
          conditions: {
            title: 'Condition Notifications',
            announce: 'Announce Conditions in Chat',
            desc: 'When the GM adds conditions, send message in chat.',
          },
        },
        status: {
          inherit: 'Inherit Global',
          allowed: 'Allowed',
          forbidden: 'Forbidden',
          inheritValue: 'Inherit (:value)',
          yes: 'Yes',
          no: 'No',
        },
        logTypes: {
          movement: 'Movement',
          combat: 'Damage & Healing',
          rolls: 'Dice Rolls',
          system: 'Turn Events',
        },
        logVisibility: {
          public: 'Public',
          gm: 'GM Only',
        },
        applyButton: 'Apply Rules',
      },
      definitions: {
        tokenMovement: {
          label: 'Move Tokens',
          desc: 'Move tokens they control.',
        },
        doorControl: {
          label: 'Use Doors',
          desc: 'Open/close doors and windows.',
        },
        drawings: {
          label: 'Draw',
          desc: 'Draw on the map.',
        },
        drawingDelete: {
          label: 'Delete (Yours)',
          desc: 'Delete own drawings.',
        },
        drawingClear: {
          label: 'Clear All',
          desc: 'Delete all drawings in the layer.',
        },
        measure: {
          label: 'Ruler',
          desc: 'Use measuring tool.',
        },
        pingMap: {
          label: 'Map Ping',
          desc: 'Signal locations to the group.',
        },
        diceRolling: {
          label: 'Dice Rolling',
          desc: 'Use digital dice roller.',
        },
        initiativeRoll: {
          label: 'Roll Initiative',
          desc: 'Players roll own initiative.',
        },
        compendiumBrowse: {
          label: 'Access Compendium',
          desc: 'Search monsters/spells/rules.',
        },
        bestiaryBrowse: {
          label: 'Access Bestiary',
          desc: 'View list of tokens and monsters.',
        },
        journalCreate: {
          label: 'Create Notes',
          desc: 'Create handouts/resources.',
        },
        sheetEdit: {
          label: 'Edit Sheet',
          desc: 'Modify character sheet values.',
        },
        tokenCreate: {
          label: 'Create Tokens',
          desc: 'Add new tokens to the map.',
        },
        tokenEdit: {
          label: 'Edit Tokens',
          desc: 'Change token status and appearance.',
        },
        tokenDelete: {
          label: 'Delete Tokens',
          desc: 'Remove tokens from the map.',
        },
        fogReveal: {
          label: 'Reveal Fog',
          desc: 'Manually remove fog of war.',
        },
        cursorAllowColorChange: {
          label: 'Change Cursor Color',
          desc: 'Players can change cursor color.',
        },
        cursorAllowShapeChange: {
          label: 'Change Cursor Shape',
          desc: 'Players can change cursor shape.',
        },
        cursorAllowNameChange: {
          label: 'Change Cursor Name',
          desc: 'Players can change cursor name.',
        },
        cursorAllowAnimationChange: {
          label: 'Change Animation',
          desc: 'Players can change click animation.',
        },
        cursorAllowAnimationColorChange: {
          label: 'Animation Color',
          desc: 'Players can change click animation color.',
        },
        chatGlobalAllowed: {
          label: 'Global Chat',
          desc: 'Player can send public messages in chat.',
        },
        chatPrivateAllowed: {
          label: 'Private Messages',
          desc: 'Player can send private messages to others.',
        },
        showRemoteViewports: {
          label: 'See Other Players',
          desc: 'Can see where other players are looking (rectangles).',
        },
        shareViewport: {
          label: 'Share Viewport',
          desc: 'Others can see where this player is looking.',
        },
        shareCursor: {
          label: 'Share Pointer',
          desc: 'Allow the player\'s cursor to be seen by others.',
        },
        allowSpectate: {
          label: 'Allow Spectator',
          desc: 'Allow the GM to see this player\'s screen.',
        },
      },
    },
    dice: {
      modes: {
        advantage: 'Advantage',
        normal: 'Normal',
        disadvantage: 'Disadvantage',
        vant: 'ADV',
        desv: 'DIS',
      },
      visibility: {
        public: 'Public: Everyone sees',
        gm: 'Private: Only you and the GM',
        total: 'Summarized: Total only',
        publicShort: 'Public',
        gmShort: 'Secret (GM)',
        totalShort: 'Summarized',
      },
      status: {
        rolling: 'ROLLING...',
        result: 'RESULT',
        critical: 'Critical!',
        fumble: 'Critical Failure!',
        newRoll: 'New Roll',
        emptyTray: 'Add dice to the table',
        formula: 'Formula: :formula',
        manual: 'Manual Roll',
        auto: 'Automatic Roll',
        denied: 'Roll denied - no permission',
      },
      roller: {
        title: 'Dice Table',
        character: 'Active Character',
        noCharacter: 'No Hero Selected',
        tabs: {
          manual: 'Table',
          attributes: 'Attr',
          combat: 'Combat',
          skills: 'Skills',
          inventory: 'Items',
        },
        sections: {
          attributes: 'Attribute Tests',
          saves: 'Saving Throws',
          combat: 'Physical Attacks',
          spells: 'Grimoire',
          skills: 'Skills',
          inventory: 'Items',
        },
        labels: {
          ca: 'AC :value',
          hp: 'HP :value',
          save: ':attr Save',
          atkMod: 'ATK +:value',
          saveDc: 'DC :value',
          spellLevel: '{0} Cantrip|{1,*} Level :level',
          noAttacks: 'No attacks recorded.',
          noSpells: 'No spells prepared.',
          noItems: 'Backpack empty.',
          emptySelect: 'Select a token on the map to access quick actions.',
          genericSpell: 'Roll Generic Spell Attack',
          useItem: 'Use',
        },
        public: {
          tooltip: 'Public: Everyone sees',
        },
        private: {
          tooltip: 'Private: Only you and the GM',
        },
      },
    },
    audio: {
      panel: {
        title: 'Audio Panel',
        manageTitle: 'Manage Audio',
        stopAll: 'Stop All',
        shuffle: 'Shuffle',
        manage: 'Manage',
        back: 'Back',
        save: 'Save Changes',
        volumeMusic: 'Music Volume',
        volumeSfx: 'SFX Volume',
        salvarAlteraes: {
          text: 'Save Changes',
        },
        gerenciar: {
          label: 'Manage',
        },
        voltar: {
          label: 'Back',
        },
        painelDeUdio: {
          title: 'Audio Panel',
        },
        gerenciarUdio: {
          title: 'Manage Audio',
        },
        efeitosSonoros: {
          text: 'Sound Effects',
        },
        aleatrio: {
          label: 'Random',
        },
        pararTudo: {
          text: 'Stop All',
        },
        playlists: {
          label: 'Playlists',
        },
        efeitoSonoro: {
          text: 'Sound Effect',
        },
        novoEfeito: {
          label: 'New Effect',
        },
        gerenciarEfeitosSonoros: {
          text: 'Manage Sound Effects',
        },
        nomeDaNova: {
          placeholder: 'New Playlist Name',
        },
        faixa: {
          label: 'Track',
        },
        novaFaixa: {
          label: 'New Track',
        },
        gerenciarPlaylists: {
          text: 'Manage Playlists',
        },
        erroNoUpload: {
          errorMessage: 'Upload error.',
        },
        name: {
          placeholder: 'Name',
        },
      },
      manage: {
        playlists: 'Manage Playlists',
        sfx: 'Manage Sound Effects',
        newPlaylist: 'New Playlist Name',
        addTrack: 'Track',
        addSfx: 'Sound Effect',
        uploadError: 'Upload error.',
        placeholderName: 'Name',
        placeholderUrl: 'URL',
      },
    },
    navigation: {
      scenes: {
        activate: 'Activate',
        edit: 'Edit',
        delete: 'Delete',
      },
      map: {
        ping: 'Ping Here',
        move: 'Move Selection Here',
        addToken: 'Add Token',
      },
    },
    definitions: {
      tokenMovement: {
        label: 'Move Tokens',
        desc: 'Move tokens they control.',
      },
      doorControl: {
        label: 'Use Doors',
        desc: 'Open/close doors and windows.',
      },
      drawings: {
        label: 'Draw',
        desc: 'Draw on the map.',
      },
      drawingDelete: {
        label: 'Delete (Yours)',
        desc: 'Delete own drawings.',
      },
      drawingClear: {
        label: 'Clear All',
        desc: 'Delete all drawings in the layer.',
      },
      measure: {
        label: 'Ruler',
        desc: 'Use measuring tool.',
      },
      pingMap: {
        label: 'Map Ping',
        desc: 'Signal locations to the group.',
      },
      diceRolling: {
        label: 'Dice Rolling',
        desc: 'Use digital dice roller.',
      },
      initiativeRoll: {
        label: 'Roll Initiative',
        desc: 'Players roll own initiative.',
      },
      compendiumBrowse: {
        label: 'Access Compendium',
        desc: 'Search monsters/spells/rules.',
      },
      bestiaryBrowse: {
        label: 'Access Bestiary',
        desc: 'View list of tokens and monsters.',
      },
      journalCreate: {
        label: 'Create Notes',
        desc: 'Create handouts/resources.',
      },
      sheetEdit: {
        label: 'Edit Sheet',
        desc: 'Modify character sheet values.',
      },
      tokenCreate: {
        label: 'Create Tokens',
        desc: 'Add new tokens to the map.',
      },
      tokenEdit: {
        label: 'Edit Tokens',
        desc: 'Change token status and appearance.',
      },
      tokenDelete: {
        label: 'Delete Tokens',
        desc: 'Remove tokens from the map.',
      },
      fogReveal: {
        label: 'Reveal Fog',
        desc: 'Manually remove fog of war.',
      },
      cursorAllowColorChange: {
        label: 'Change Cursor Color',
        desc: 'Players can change cursor color.',
      },
      cursorAllowShapeChange: {
        label: 'Change Cursor Shape',
        desc: 'Players can change cursor shape.',
      },
      cursorAllowNameChange: {
        label: 'Change Cursor Name',
        desc: 'Players can change cursor name.',
      },
      cursorAllowAnimationChange: {
        label: 'Change Animation',
        desc: 'Players can change click animation.',
      },
      cursorAllowAnimationColorChange: {
        label: 'Animation Color',
        desc: 'Players can change click animation color.',
      },
      chatGlobalAllowed: {
        label: 'Global Chat',
        desc: 'Player can send public messages in chat.',
      },
      chatPrivateAllowed: {
        label: 'Private Messages',
        desc: 'Player can send private messages to others.',
      },
      showRemoteViewports: {
        label: 'See Other Players',
        desc: 'Can see where other players are looking (rectangles).',
      },
    },
    dnd: {
      attributes: {
        strength: {
          name: 'Strength',
          abbreviation: 'STR',
        },
        dexterity: {
          name: 'Dexterity',
          abbreviation: 'DEX',
        },
        constitution: {
          name: 'Constitution',
          abbreviation: 'CON',
        },
        intelligence: {
          name: 'Intelligence',
          abbreviation: 'INT',
        },
        wisdom: {
          name: 'Wisdom',
          abbreviation: 'WIS',
        },
        charisma: {
          name: 'Charisma',
          abbreviation: 'CHA',
        },
      },
      sizes: {
        tiny: {
          name: 'Tiny',
        },
        small: {
          name: 'Small',
        },
        medium: {
          name: 'Medium',
        },
        large: {
          name: 'Large',
        },
        huge: {
          name: 'Huge',
        },
        gargantuan: {
          name: 'Gargantuan',
        },
      },
      creatureTypes: {
        celestial: {
          name: 'Celestial',
        },
        construct: {
          name: 'Construct',
        },
        dragon: {
          name: 'Dragon',
        },
        elemental: {
          name: 'Elemental',
        },
        fey: {
          name: 'Fey',
        },
        fiend: {
          name: 'Fiend',
        },
        giant: {
          name: 'Giant',
        },
        humanoid: {
          name: 'Humanoid',
        },
        monstrosity: {
          name: 'Monstrosity',
        },
        ooze: {
          name: 'Ooze',
        },
        plant: {
          name: 'Plant',
        },
        undead: {
          name: 'Undead',
        },
      },
      alignments: {
        lawfulGood: {
          name: 'Lawful Good',
        },
        neutralGood: {
          name: 'Neutral Good',
        },
        chaoticGood: {
          name: 'Chaotic Good',
        },
        lawfulNeutral: {
          name: 'Lawful Neutral',
        },
        neutral: {
          name: 'Neutral',
        },
        chaoticNeutral: {
          name: 'Chaotic Neutral',
        },
        lawfulEvil: {
          name: 'Lawful Evil',
        },
        neutralEvil: {
          name: 'Neutral Evil',
        },
        chaoticEvil: {
          name: 'Chaotic Evil',
        },
        unaligned: {
          name: 'Unaligned',
        },
      },
      schools: {
        abjuration: {
          name: 'Abjuration',
        },
        conjuration: {
          name: 'Conjuration',
        },
        divination: {
          name: 'Divination',
        },
        enchantment: {
          name: 'Enchantment',
        },
        evocation: {
          name: 'Evocation',
        },
        illusion: {
          name: 'Illusion',
        },
        necromancy: {
          name: 'Necromancy',
        },
        transmutation: {
          name: 'Transmutation',
        },
      },
      skills: {
        acrobatics: {
          name: 'Acrobatics',
        },
        animalHandling: {
          name: 'Animal Handling',
        },
        arcana: {
          name: 'Arcana',
        },
        athletics: {
          name: 'Athletics',
        },
        deception: {
          name: 'Deception',
        },
        history: {
          name: 'History',
        },
        insight: {
          name: 'Insight',
        },
        intimidation: {
          name: 'Intimidation',
        },
        investigation: {
          name: 'Investigation',
        },
        medicine: {
          name: 'Medicine',
        },
        nature: {
          name: 'Nature',
        },
        perception: {
          name: 'Perception',
        },
        performance: {
          name: 'Performance',
        },
        persuasion: {
          name: 'Persuasion',
        },
        religion: {
          name: 'Religion',
        },
        sleightOfHand: {
          name: 'Sleight of Hand',
        },
        stealth: {
          name: 'Stealth',
        },
        survival: {
          name: 'Survival',
        },
      },
      damageTypes: {
        acid: {
          name: 'Acid',
        },
        bludgeoning: {
          name: 'Bludgeoning',
        },
        cold: {
          name: 'Cold',
        },
        fire: {
          name: 'Fire',
        },
        force: {
          name: 'Force',
        },
        lightning: {
          name: 'Lightning',
        },
        necrotic: {
          name: 'Necrotic',
        },
        piercing: {
          name: 'Piercing',
        },
        poison: {
          name: 'Poison',
        },
        psychic: {
          name: 'Psychic',
        },
        radiant: {
          name: 'Radiant',
        },
        slashing: {
          name: 'Slashing',
        },
        thunder: {
          name: 'Thunder',
        },
      },
      rarities: {
        common: {
          name: 'Common',
        },
        uncommon: {
          name: 'Uncommon',
        },
        rare: {
          name: 'Rare',
        },
        veryRare: {
          name: 'Very Rare',
        },
        legendary: {
          name: 'Legendary',
        },
        artifact: {
          name: 'Artifact',
        },
      },
      itemTypes: {
        weapon: {
          name: 'Weapon',
        },
        armor: {
          name: 'Armor',
        },
        potion: {
          name: 'Potion',
        },
        ring: {
          name: 'Anel',
        },
        scroll: {
          name: 'Scroll',
        },
        staff: {
          name: 'Staff',
        },
        wand: {
          name: 'Wand',
        },
        wondrousItem: {
          name: 'Wondrous Item',
        },
      },
      combat: {
        meleeWeaponAttack: {
          name: 'Melee Weapon Attack',
        },
        rangedWeaponAttack: {
          name: 'Ranged Weapon Attack',
        },
        toHit: {
          name: 'to hit',
        },
        reach: {
          name: 'reach',
        },
        range: {
          name: 'range',
        },
        oneTarget: {
          name: 'one target',
        },
        hit: {
          name: 'Hit',
        },
        damage: {
          name: 'damage',
        },
        savingThrow: {
          name: 'saving throw',
        },
        difficultyClass: {
          abbreviation: 'DC',
        },
      },
      rules: {
        conditions: {
          frightened: {
            name: 'Frightened',
            effects: ['Disadvantage on ability checks and attack rolls while the source of fear is within sight.', 'Cannot willingly move closer to the source of fear.'],
            duration: 'Until the end of the next turn or removed from sight of the source.',
          },
          grappled: {
            name: 'Grappled',
            effects: ['Speed reduced to 0.', 'Ends if the grappler becomes incapacitated or if the creature is removed from range.'],
            duration: 'Until the end of the grappler or Strength/Escape check.',
          },
          stunned: {
            name: 'Stunned',
            effects: ['Incapacitated (no actions/reactions).', 'Automatic failure on Strength and Dexterity checks.', 'Attack rolls against the creature have advantage.'],
            duration: 'Until the end of the next turn (usually).',
          },
          prone: {
            name: 'Prone',
            effects: ['Can only crawl or spend half movement to stand up.', 'Disadvantage on attack rolls.', 'Melee attacks against the creature have advantage; ranged have disadvantage.'],
            duration: 'Until standing up.',
          },
          blinded: {
            name: 'Blinded',
            effects: ['Automatic failure on checks that depend on sight.', 'Disadvantage on attack rolls.', 'Attack rolls against the creature have advantage.'],
            duration: 'Varies.',
          },
          charmed: {
            name: 'Charmed',
            effects: ['Cannot attack the charmer or target them with hostile effects.', 'The charmer has advantage on Charisma checks against the creature.'],
            duration: '1 hour or until taking damage from the charmer.',
          },
          poisoned: {
            name: 'Poisoned',
            effects: ['Disadvantage on attack rolls and ability checks.'],
            duration: 'Varies (repeated CON save).',
          },
          restrained: {
            name: 'Restrained',
            effects: ['Speed 0.', 'Disadvantage on attack rolls and Dexterity checks.', 'Attack rolls against the creature have advantage.'],
            duration: 'Varies.',
          },
          incapacitated: {
            name: 'Incapacitated',
            effects: ['Cannot take actions or reactions.'],
            duration: 'Varies.',
          },
          unconscious: {
            name: 'Unconscious',
            effects: ['Incapacitated, cannot move, cannot speak, unaware.', 'Drops items and falls Prone.', 'Automatic failure on Strength and Dexterity checks.', 'Attack rolls against the creature have advantage and are critical hits if attacker is within 5 feet.'],
            duration: 'Until healed or stabilized.',
          },
          invisible: {
            name: 'Invisible',
            effects: ['Impossible to be seen without magic/special senses.', 'Considered heavily obscured for hiding.', 'Attack rolls have advantage.', 'Attack rolls against the creature have disadvantage.'],
            duration: 'Varies (magic).',
          },
          paralyzed: {
            name: 'Paralyzed',
            effects: ['Incapacitated and cannot move or speak.', 'Automatic failure on Strength and Dexterity checks.', 'Attack rolls against the creature have advantage and are critical hits if attacker is within 5 feet.'],
            duration: 'Varies.',
          },
          petrified: {
            name: 'Petrified',
            effects: ['Transformed into solid substance (inanimate).', 'Incapacitated, does not age, weight x10.', 'Resistance to all damage, immune to poison/disease.', 'Automatic failure on Strength and Dexterity checks.'],
            duration: 'Permanent until restored.',
          },
          deafened: {
            name: 'Deafened',
            effects: ['Automatic failure on checks that depend on hearing.'],
            duration: '1 hour (typical).',
          },
          exhausted: {
            name: 'Exhausted',
            effects: ['Lvl 1: Disadvantage on ability checks.', 'Lvl 2: Speed reduced by half.', 'Lvl 3: Disadvantage on attacks and saves.', 'Lvl 4: Max HP reduced by half.', 'Lvl 5: Speed 0.', 'Lvl 6: Death.'],
            duration: 'Long Rest reduces 1 level.',
          },
          burning: {
            name: 'Burning',
            effects: ['Takes 1d6 fire damage at the start of each turn.', 'Can spend an action to douse the flames (DC 10 Dexterity).'],
            duration: '1 minute or until doused.',
          },
          bleeding: {
            name: 'Bleeding',
            effects: ['Takes 1d4 necrotic/piercing damage at the start of turn.', 'Any magical healing ends the condition.'],
            duration: 'Until healed (Medicine DC 10 or Healing).',
          },
          dead: {
            name: 'Dead',
            effects: ['Character has passed away.'],
            duration: 'Permanent.',
          },
          bloodied: {
            name: 'Bloodied',
            effects: ['Below half hit points.'],
            duration: 'Until healed above 50%.',
          },
          shielded: {
            name: 'Shielded',
            effects: ['Has bonus to AC or magical protection.'],
            duration: 'Varies.',
          },
          alert: {
            name: 'Alert',
            effects: ['Advantage on initiative and perception.'],
            duration: 'Varies.',
          },
        },
        weaponMasteries: {
          cleave: {
            name: 'Cleave',
            desc: 'Hit a second creature within 5 feet.',
          },
          graze: {
            name: 'Graze',
            desc: 'Deal damage equal to ability mod on miss.',
          },
          nick: {
            name: 'Nick',
            desc: 'Extra attack from Light property doesn\'t cost Bonus Action.',
          },
          push: {
            name: 'Push',
            desc: 'Push creature 10 feet.',
          },
          sap: {
            name: 'Sap',
            desc: 'Disadvantage on target\'s next attack roll.',
          },
          slow: {
            name: 'Slow',
            desc: 'Reduce target\'s speed by 10 feet.',
          },
          topple: {
            name: 'Topple',
            desc: 'Target makes CON save or falls prone.',
          },
          vex: {
            name: 'Vex',
            desc: 'Advantage on next attack roll against target.',
          },
        },
      },
    },
    drawing: {
      toolbar: {
        paredesDinmicas: {
          text: 'smart walls',
        },
        desenhos: {
          label: 'drawings',
        },
        temCertezaQue: {
          text: 'Are you sure you want to delete',
        },
        todos: {
          label: 'all',
        },
        destaCenaEsta: {
          text: 'from this scene? This action is irreversible.',
        },
        cancelar: {
          label: 'Cancel',
        },
        limparTudo: {
          text: 'Clear All',
        },
        limparParedes: {
          title: 'Clear Walls',
        },
        limparDesenhos: {
          title: 'Clear Drawings',
        },
        tamanho: {
          label: 'Size',
        },
        opacidade: {
          label: 'Opacity',
        },
        smartWall: {
          text: 'Smart Wall',
        },
        configuraesDaVarinha: {
          text: 'Wand Settings',
        },
        tolerncia: {
          label: 'Tolerance',
        },
        simplificao: {
          label: 'Simplification',
        },
        resoluo: {
          label: 'Resolution',
        },
        sandboxDoSmart: {
          label: 'Smart Wall Sandbox',
        },
        preview: {
          label: 'Preview',
        },
        desfazerLtimaParede: {
          tooltip: 'Undo last wall',
        },
        desfazerLtimoTrao: {
          tooltip: 'Undo last stroke',
        },
        limparTodosOs: {
          tooltip: 'Clear ALL drawings',
        },
      },
    },
    token: {
      editModal: {
        fields: {
          backgroundColor: 'Background Color',
          textColor: 'Text Color',
          sigla: 'Label',
        },
        errors: {
          uploadFailed: 'Image upload failed.',
        },
        markdown: {
          actions: '### Actions',
          legendaryActions: '### Legendary Actions',
        },
      },
    },
    character: {
      sheetviewer: {
        histrico: {
          label: 'History',
        },
        bio: {
          label: 'Bio',
        },
        feitos: {
          label: 'Features',
        },
        combate: {
          label: 'Combat',
        },
        descansoLongo: {
          tooltip: 'Long Rest',
        },
        descansoCurto: {
          tooltip: 'Short Rest',
        },
        classe: {
          placeholder: 'Class',
        },
        espcie: {
          placeholder: 'Species',
        },
        nomeDoPersonagem: {
          placeholder: 'Character Name',
        },
        avatar: {
          alt: 'Avatar',
        },
        adicioneNotasPrivadas: {
          placeholder: 'Add private notes about this character...',
        },
        estasNotasSo: {
          title: 'These notes are private and only visible to the GM.',
        },
        notasDoMestre: {
          title: 'GM Notes',
        },
        nenhumaAlteraoRegistrada: {
          text: 'No changes recorded yet.',
        },
        alterou: {
          label: 'Changed:',
        },
        ltimas100Alteraes: {
          title: 'Last 100 changes on the sheet.',
        },
        histricoDeAlteraes: {
          title: 'Change History',
        },
        tesouroItensEspeciais: {
          text: 'Treasure & Special Items',
        },
        aliadosOrganizaes: {
          text: 'Allies & Organizations',
        },
        notasOutros: {
          title: 'Notes & Others',
        },
        nenhumaBiografiaDisponvel: {
          text: 'No biography available.',
        },
        escrevaAHistria: {
          placeholder: 'Write your character\'s history...',
        },
        biografia: {
          title: 'Biography',
        },
        personalidade: {
          title: 'Personality',
        },
        aparncia: {
          title: 'Appearance',
        },
        descrio: {
          placeholder: 'Description...',
        },
        fonteExRaa: {
          placeholder: 'Source (e.g. Race, Class)',
        },
        nomeDaCaracterstica: {
          placeholder: 'Feature Name',
        },
        caractersticasETalentos: {
          title: 'Features & Feats',
        },
        equipamento: {
          title: 'Equipment',
        },
        truques: {
          label: 'Cantrips',
        },
        nvel: {
          label: 'Level',
        },
        espaosDeMagia: {
          title: 'Spell Slots',
        },
        ataque: {
          label: 'Attack',
        },
        atributo: {
          label: 'Attribute',
        },
        nenhumAtaqueConfigurado: {
          text: 'No attack configured.',
        },
        alcance: {
          placeholder: 'Range',
        },
        nomeDoAtaque: {
          placeholder: 'Attack Name',
        },
        aesAtaques: {
          title: 'Actions & Attacks',
        },
        dadosDeVida: {
          text: 'Hit Dice',
        },
        exausto: {
          label: 'Exhaustion',
        },
        inspirao: {
          label: 'Inspiration',
        },
        percepoPas: {
          label: 'Pass. Perception',
        },
        proficincia: {
          label: 'Proficiency',
        },
        deslocamento: {
          label: 'Speed',
        },
        iniciativa: {
          label: 'Initiative',
        },
        classeArmadura: {
          label: 'Armor Class',
        },
        percepo: {
          label: 'Perception',
        },
        prof: {
          label: 'Prof.',
        },
        desloc: {
          label: 'Spd.',
        },
        mx: {
          label: 'Max:',
        },
        pontosDeVida: {
          text: 'Hit Points',
        },
        percias: {
          label: 'Skills',
        },
        atributos: {
          label: 'Attributes',
        },
      },
      combatTab: {
        noAttacks: {
          text: 'No attacks configured.',
        },
      },
      bioTab: {
        noBio: {
          text: 'No biography available.',
        },
      },
      sheetViewer: {
        type: {
          placeholder: 'Type',
        },
        mastery: {
          placeholder: 'Mastery',
        },
      },
      stats: {
        hitPoints: {
          label: 'Hit Points',
        },
        armorClass: {
          label: 'AC',
        },
        initiative: {
          label: 'Initiative',
        },
        speed: {
          label: 'Speed',
        },
        proficiency: {
          label: 'Proficiency',
        },
        passivePerception: {
          label: 'Passive Perc.',
        },
        perception: {
          label: 'Perception',
        },
        inspiration: {
          label: 'Inspiration',
        },
        exhaustion: {
          label: 'Exhaustion',
        },
        hitDice: {
          label: 'Hit Dice',
        },
        max: {
          label: 'Max',
        },
        tempHP: {
          label: 'Temporary HP',
        },
      },
      actions: {
        longRest: {
          button: 'Long Rest',
        },
      },
      combat: {
        actionsAttacks: {
          title: 'Actions & Attacks',
        },
        attackName: {
          placeholder: 'Attack name',
        },
        range: {
          placeholder: 'Range',
        },
        type: {
          placeholder: 'Type',
        },
        mastery: {
          placeholder: 'Mastery',
        },
        damage: {
          label: 'Damage',
        },
        attackType: {
          placeholder: 'Type',
        },
      },
      bio: {
        appearance: {
          title: 'Appearance',
        },
        personality: {
          title: 'Personality',
        },
        biography: {
          title: 'Biography',
          placeholder: 'Write your character\'s story...',
        },
        notesOther: {
          title: 'Notes & Other',
        },
        alliesOrgs: {
          label: 'Allies & Organizations',
        },
        treasure: {
          label: 'Treasure & Special Items',
        },
      },
      exhaustion: {
        penalty: 'on d20',
      },
      sheet: {
        skills: {
          title: 'Skills',
        },
        characterName: {
          placeholder: 'Character Name',
        },
        attributes: {
          title: 'Attributes',
        },
      },
      tabs: {
        combat: {
          label: 'Combat',
        },
        biography: {
          label: 'Biography',
        },
        gmNotes: {
          label: 'GM Notes',
        },
        features: {
          label: 'Features',
        },
        spells: {
          label: 'Spells',
        },
        inventory: {
          label: 'Inventory',
        },
      },
      features: {
        name: {
          placeholder: 'Feature name',
        },
        title: 'Features & Talents',
        description: {
          placeholder: 'Description...',
        },
        source: {
          placeholder: 'Source (e.g., Race, Class)',
        },
      },
      spells: {
        attribute: {
          label: 'Attribute',
        },
        slots: {
          title: 'Spell Slots',
        },
        level: {
          text: 'Level',
        },
        cantrips: {
          label: 'Cantrips',
        },
        attack: {
          label: 'Attack',
        },
      },
      header: {
        level: {
          text: 'Level',
        },
        editMode: {
          tooltip: 'Edit Mode',
        },
        viewMode: {
          tooltip: 'View Mode',
        },
      },
    },
    scene: {
      navigation: {
        gerenciarCenasandares: {
          tooltip: 'Manage Scenes/Floors',
        },
        tokens: {
          label: 'tokens',
        },
        camadas: {
          label: 'Layers',
        },
        excluirCamada: {
          title: 'Delete Layer',
          text: 'Delete Layer',
        },
        cancelar: {
          label: 'Cancel',
        },
        temCertezaQue: {
          text: 'Are you sure you want to delete this layer? All tokens and settings in it will be permanently lost.',
        },
        newScene: {
          defaultName: 'New Scene',
        },
      },
    },
    attack: {
      zoneconfigmodal: {
        salvarConfigurao: {
          text: 'Save Configuration',
        },
        cancelar: {
          label: 'Cancel',
        },
        ex15: {
          placeholder: 'Ex: 15',
        },
        exDex: {
          placeholder: 'Ex: DEX',
        },
        savingThrow: {
          text: 'Saving Throw',
        },
        exFire: {
          placeholder: 'Ex: Fire',
        },
        tipoDeDano: {
          text: 'Damage Type',
        },
        ex8d6: {
          placeholder: 'Ex: 8d6',
        },
        frmulaDeDano: {
          text: 'Damage Formula',
        },
        efeitosOpcional: {
          text: 'Effects (Optional)',
        },
        corDoHighlight: {
          text: 'Highlight Color',
        },
        destacarTokens: {
          text: 'Highlight Tokens',
        },
        corDaBorda: {
          text: 'Border Color',
        },
        corDaZona: {
          text: 'Zone Color',
        },
        alvos: {
          label: 'Targets',
        },
        usaClculoDe: {
          text: 'Uses vision calculation to determine area',
        },
        respeitarLinhaDe: {
          text: 'Respect Line of Sight',
        },
        tipoDePropagao: {
          text: 'Propagation Type',
        },
        nguloGraus: {
          text: 'Angle (Degrees)',
        },
        larguraQuadrados: {
          text: 'Width (Squares)',
        },
        comprimentoQuadrados: {
          text: 'Length (Squares)',
        },
        raioQuadrados: {
          text: 'Radius (Squares)',
        },
        forma: {
          label: 'Shape',
        },
        descrioDaZona: {
          placeholder: 'Attack zone description...',
        },
        descrioOpcional: {
          text: 'Description (Optional)',
        },
        exBolaDe: {
          placeholder: 'Ex: Fireball',
        },
        nomeDaZona: {
          text: 'Zone Name',
        },
        objetos: {
          label: 'Objects',
        },
        objects: {
          label: 'objects',
        },
        inimigos: {
          label: 'Enemies',
        },
        enemies: {
          label: 'enemies',
        },
        aliados: {
          label: 'Allies',
        },
        allies: {
          label: 'allies',
        },
        todos: {
          label: 'All',
        },
        contornaObstculos: {
          text: 'Wraps around obstacles',
        },
        espalhamento: {
          label: 'Spreading',
        },
        spreading: {
          label: 'spreading',
        },
        atravessaTudo: {
          text: 'Passes through everything',
        },
        penetrante: {
          label: 'Penetrating',
        },
        penetrating: {
          label: 'penetrating',
        },
        paraEmParedes: {
          text: 'Stops at walls and obstacles',
        },
        bloqueado: {
          label: 'Blocked',
        },
        retngulo: {
          label: 'Rectangle',
        },
        rectangle: {
          label: 'rectangle',
        },
        quadrado: {
          label: 'Square',
        },
        linha: {
          label: 'Line',
        },
        line: {
          label: 'Line',
        },
        cone: {
          label: 'Cone',
        },
        crculo: {
          label: 'Circle',
        },
        configurarZonaDe: {
          title: 'Configure Attack Zone',
        },
        novaZona: {
          text: 'New Zone',
        },
        mostrarContornoNos: {
          text: 'Show outline on targets',
        },
      },
      zonepanel: {
        fechar: {
          label: 'Close',
        },
        noMapaPara: {
          text: 'on the map to place the zone',
        },
        clique: {
          label: 'Click',
        },
        remover: {
          title: 'Remove',
        },
        visibilidade: {
          title: 'Toggle visibility',
        },
        duplicar: {
          title: 'Duplicate',
        },
        editar: {
          title: 'Edit',
        },
        nenhumaZonaAtiva: {
          text: 'No active zones',
        },
        zonas: {
          label: 'zones',
        },
        zona: {
          label: 'zone',
        },
        zonasAtivas: {
          text: 'Active Zones',
        },
        configureManualmente: {
          text: 'Manually configure all properties',
        },
        criarZonaCustomizada: {
          text: 'Create Custom Zone',
        },
        nenhumaZonaEncontrada: {
          text: 'No zones found.',
        },
        nvel: {
          label: 'Level ',
        },
        buscarZonas: {
          placeholder: 'Search zones...',
        },
        zonasDeAtaque: {
          text: 'Attack Zones',
        },
        ambiente: {
          label: 'Environmental',
        },
        armas: {
          label: 'Weapons',
        },
        habilidades: {
          label: 'Abilities',
        },
        todos: {
          label: 'All',
        },
        magias: {
          label: 'Spells',
        },
      },
    },
    compendium: {
      window: {
        oMestreBloqueou: {
          text: 'The Game Master has blocked access to the Compendium.',
        },
        acessoRestrito: {
          text: 'Restricted Access',
        },
        busquePorMonstros: {
          text: 'Search for monsters, spells, items, and rules.',
        },
        selecioneUmItem: {
          text: 'Select an item to read.',
        },
        erroAoCarregar: {
          text: 'Error loading data.',
        },
        consultandoOrculosDe: {
          text: 'Consulting translation oracles...',
        },
        decifrandoRunasAntigas: {
          text: 'DECIPHERING ANCIENT RUNES...',
        },
        fechar: {
          label: 'Close',
        },
        carregarMais: {
          text: 'Load More',
        },
        carregando: {
          label: 'Loading...',
        },
        nenhumFavoritoSalvo: {
          text: 'No favorites saved.',
        },
        nadaEncontrado: {
          text: 'No results found.',
        },
        invocandoSabedoria: {
          text: 'Invoking wisdom...',
        },
        search: {
          placeholder: 'Search...',
        },
        buscar: {
          placeholder: 'Search...',
          label: 'Search',
        },
        favoritos: {
          label: 'Favorites',
        },
        regras: {
          label: 'Rules',
        },
        tesouros: {
          label: 'Treasures',
        },
        bestirio: {
          label: 'Bestiary',
        },
        grimrioDoConhecimento: {
          title: 'Compendium of Knowledge',
        },
        compartilharRegra: {
          title: 'Share Rule',
        },
        textoCompleto: {
          text: 'Full Text',
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
          text: 'Requires Attunement',
        },
        atHigherLevels: {
          text: 'At Higher Levels',
        },
        emNveisSuperiores: {
          text: 'At Higher Levels',
        },
        components: {
          label: 'Components:',
        },
        componentes: {
          label: 'Components:',
        },
        duration: {
          label: 'Duration:',
        },
        durao: {
          label: 'Duration:',
        },
        range: {
          label: 'Range:',
        },
        alcance: {
          label: 'Range:',
        },
        castingTime: {
          label: 'Casting Time:',
        },
        tempo: {
          label: 'Time:',
        },
        invocarToken: {
          text: 'Summon Token',
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
          label: '### Legendary Actions',
          title: 'Legendary Actions',
        },
        aes: {
          label: '### Actions',
          title: 'Actions',
        },
        escalada: {
          label: 'climb',
        },
        natao: {
          label: 'swim',
        },
        voo: {
          label: 'fly',
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
          title: 'Special Abilities',
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
          label: 'Floor',
        },
        speed: {
          label: 'Speed',
        },
        deslocamento: {
          label: 'Movement',
        },
        aesn: {
          label: '### Actions\\n',
        },
        compartilharFichaInteira: {
          tooltip: 'Share Full Sheet',
        },
        enviadoAoChat: {
          successMessage: 'Sent to chat.',
        },
        salvoNosFavoritos: {
          successMessage: 'Saved to favorites!',
        },
        removidoDosFavoritos: {
          text: 'Removed from favorites.',
        },
        failedToLoad: {
          errorMessage: 'Failed to load deep link',
        },
        itemNoEncontrado: {
          text: 'Item not found.',
        },
        favorites: {
          label: 'favorites',
        },
        compartilharSeoNo: {
          tooltip: 'Share Section in Chat',
        },
      },
      tabs: {
        spells: {
          label: 'Spells',
        },
      },
    },
    map: {
      modals: {
        audioZone: {
          zoneMusic: {
            label: 'Zone Music',
          },
          noMusic: {
            label: 'No Music',
          },
          customUrl: {
            label: 'Custom URL / Upload',
          },
          selectTrack: {
            placeholder: 'Select a track...',
          },
          pasteUrl: {
            placeholder: 'Paste URL or upload...',
          },
          saveZone: {
            button: 'Save Zone',
          },
          saveChanges: {
            button: 'Save Changes',
          },
          deleteZone: {
            button: 'Delete Zone',
          },
          volume: {
            label: 'Volume',
          },
          radius: {
            label: 'Effect Radius (Falloff)',
          },
        },
        triggerZone: {
          selectResource: {
            label: 'Resource to Open',
            placeholder: 'Select a Resource...',
            hint: 'Select the resource...',
          },
          description: {
            text: 'When a player enters this area, this resource will automatically open on their screen.',
          },
          saveTrigger: {
            button: 'Save Trigger',
          },
        },
        configureAudioZone: {
          title: 'Configure Audio Zone',
        },
        configureTrigger: {
          title: 'Configure Trigger',
        },
      },
      modal: {
        configureAudioZone: {
          title: 'Configure Audio Zone',
        },
        configureTrigger: {
          title: 'Configure Trigger',
        },
      },
    },
    handouts: {
      formModal: {
        chooseTemplate: {
          title: 'Choose a Template',
          subtitle: 'Start with a ready structure or a blank page.',
        },
        title: {
          label: 'Title',
          placeholder: 'Ex: Letter from the King...',
        },
        theme: {
          label: 'Theme',
          standard: 'Standard (Dark)',
          parchment: 'Parchment',
          terminal: 'Terminal',
          arcane: 'Arcane',
        },
        type: {
          text: 'Text',
          image: 'Image',
          video: 'Video',
        },
        content: {
          placeholder: 'Write here using Markdown...',
        },
        urlOrUpload: {
          text: 'Enter the URL or upload.',
        },
        imageInvalid: {
          text: 'Invalid or empty image URL.',
        },
        videoInvalid: {
          text: 'Invalid or empty YouTube URL.',
        },
        changeTemplate: {
          button: 'Change Template',
        },
        saveChanges: {
          button: 'Save Changes',
        },
        createResource: {
          button: 'Create Resource',
        },
        uploadError: {
          text: 'Upload error.',
        },
      },
      shareModal: {
        sharing: {
          text: 'Saving...',
        },
        saveSharing: {
          button: 'Save Sharing',
        },
        noPlayers: {
          text: 'No players in session.',
        },
        selectPlayers: {
          title: 'Select who to share with:',
        },
        selectAll: {
          button: 'Select All',
        },
        hideFromAll: {
          button: 'Hide from All',
        },
      },
      tray: {
        searchPlaceholder: 'Search resource...',
        noResults: {
          text: 'No results.',
        },
        noResources: {
          text: 'No resources created.',
        },
        createTrigger: {
          title: 'Create Trigger on Map',
        },
        title: 'Resources',
        newResource: {
          button: 'New Resource',
        },
        trigger: {
          button: 'Trigger',
        },
        edit: {
          tooltip: 'Edit',
        },
        share: {
          tooltip: 'Share',
        },
        triggerTool: {
          notification: 'Trigger tool selected for ":name". Draw on the map.',
        },
      },
      preview: {
        edit: {
          button: 'Edit',
        },
        share: {
          button: 'Share',
        },
        invalidVideo: {
          text: 'Invalid video link.',
        },
        title: 'Preview',
      },
      shared: {
        stopSharing: {
          label: 'Stop Sharing',
        },
        trigger: {
          badge: 'Trigger',
        },
        invalidLink: {
          text: 'Invalid link.',
        },
      },
    },
    smartDice: {
      noHeroSelected: {
        text: 'No Hero Selected',
      },
      noAttacks: {
        text: 'No attacks registered.',
      },
      noSpells: {
        text: 'No spells prepared.',
      },
      freeTable: {
        label: 'Free Table',
      },
      diceTable: {
        title: 'Dice Table',
      },
      tab: {
        table: {
          label: 'Table',
        },
        attributes: {
          label: 'Attrs',
        },
        combat: {
          label: 'Combat',
        },
        skills: {
          label: 'Skills',
        },
        items: {
          label: 'Items',
        },
      },
      activeCharacter: {
        label: 'Active Character',
      },
      attributeTests: {
        label: 'Attribute Tests',
      },
      savingThrows: {
        label: 'Saving Throws (Resistance)',
      },
      physicalAttacks: {
        label: 'Physical Attacks',
      },
      spellbook: {
        label: 'Spellbook',
      },
      genericSpellAttack: {
        button: 'Roll Generic Spell Attack',
      },
      items: {
        label: 'Items',
        title: 'Items',
      },
      emptyBag: {
        text: 'Empty bag.',
      },
      useItem: {
        button: 'Use',
      },
      selectToken: {
        text: 'Select a token on the map to access quick actions.',
      },
      cantrip: {
        label: 'Cantrip',
      },
      level: {
        label: 'Level',
      },
    },
    mapContext: {
      addToken: {
        label: 'Add Token',
      },
      addLight: {
        label: 'Add Light',
      },
      editTrigger: {
        label: 'Edit Trigger',
      },
      removeTrigger: {
        label: 'Remove Trigger',
      },
      editAudioZone: {
        label: 'Edit Audio Zone',
      },
      removeZone: {
        label: 'Remove Zone',
      },
      structureOptions: {
        label: 'Structure Options',
      },
      triggerOptions: {
        label: 'Trigger Options',
      },
      audioOptions: {
        label: 'Audio Options',
      },
      mapOptions: {
        label: 'Map Options',
      },
      toggleInvisibility: {
        label: 'Toggle Invisibility',
      },
      destroyStructure: {
        label: 'Destroy Structure',
      },
      pingLocation: {
        label: 'Ping Location',
      },
      sharePosition: {
        label: 'Share Position',
      },
      sharedLocation: {
        message: 'Shared a location on the map.',
      },
      locationSent: {
        notification: 'Location sent to chat.',
      },
    },
    keyboard: {
      closePanel: {
        description: 'Close open panels',
      },
      title: 'Keyboard Shortcuts',
      tip: {
        text: '💡 Tip: Shortcuts only work when not typing in text fields.',
      },
      nextTurn: {
        description: 'Next turn',
      },
      prevTurn: {
        description: 'Previous turn',
      },
      toggleHistory: {
        description: 'Show/hide history',
      },
      toggleSuggestions: {
        description: 'Show/hide suggestions',
      },
      useShortcuts: {
        text: 'Use these shortcuts to navigate quickly during combat:',
      },
    },
    attackZone: {
      notifications: {
        afk: ':name is away (AFK)',
        active: ':name returned',
      },
      afk: {
        title: 'You are Away',
        desc: 'Move your mouse or interact with the screen to return.',
        warning_title: 'Inactivity Detected!',
        warning_desc: 'You will be disconnected in :seconds seconds.',
      },
      contextMenu: {
        token: {
          move_to_front: 'Move to Front',
        },
        delete: {
          label: 'Delete Zone',
        },
        edit: {
          label: 'Edit Zone',
        },
        duplicate: {
          label: 'Duplicate Zone',
        },
        header: 'Attack Zone',
        shape: {
          label: 'Shape',
        },
        damage: {
          label: 'Damage',
        },
      },
    },
    tokenHover: {
      actionTooltip: {
        text: 'Left click: Link in Chat | Right click: Remove',
      },
      permissions: {
        description: 'Control what players see when hovering over tokens. GM always sees everything.',
        name: {
          label: 'Name',
        },
        objectName: {
          label: 'Object Name',
        },
        hpBar: {
          label: 'HP Bar',
        },
        resourceBar: {
          label: 'Resource Bar',
        },
        heroesPCs: {
          label: 'Heroes (PCs)',
        },
        enemiesNPCs: {
          label: 'Enemies (NPCs)',
        },
        objects: {
          label: 'Objects',
          title: 'Objects',
        },
        attributeButtons: {
          label: 'Attribute Buttons',
        },
        inimigosNPCs: {
          label: 'Enemies (NPCs)',
        },
        applyRulesHint: 'Click "Apply Rules" to save changes',
        title: 'Token Hover Visibility',
        enabled: {
          title: 'Token Hover Enabled',
          description: 'Allow players to see information when hovering over tokens',
        },
        heroes: {
          title: 'Heroes (PCs)',
        },
        creatures: {
          title: 'Creatures (NPCs)',
        },
        conditions: {
          label: 'Conditions',
        },
        stats: {
          label: 'Stats (AC/Speed/PP)',
        },
        attributes: {
          label: 'Attribute Buttons',
        },
        states: {
          label: 'States',
        },
      },
      card: {
        spellClickTooltip: 'Left click: Link to Chat | Right click: Remove',
      },
    },
    settings: {
      view: {
        stopFollowing: {
          label: 'Stop Following',
        },
        followAll: {
          label: 'Follow All',
        },
        cameraControl: {
          title: 'Camera Control',
        },
        controlAllPlayers: {
          text: 'Control all players at once',
        },
        player: {
          label: 'Player',
        },
        forceFollow: {
          label: 'Force Follow',
        },
        follow: {
          label: 'Follow',
        },
        obscureWalls: {
          title: 'Obscure Walls',
          description: 'Hide walls and obstacles in GM view for better visibility.',
        },
        visionRanges: {
          title: 'Vision Ranges',
          description: 'Display token vision range circles.',
        },
        globalActions: {
          title: 'Global Actions',
        },
        pullPlayerView: {
          tooltip: 'Pull this player\'s view',
        },
        permissions: {
          hint: 'To configure visibility and permissions, use the Permissions menu.',
        },
        pullAll: {
          button: 'Pull All',
        },
        pull: {
          button: 'Pull',
        },
        general: {
          tab: 'General',
        },
        following: {
          label: 'Following',
        },
        ghostWalls: {
          title: 'Ghost Walls (GM)',
        },
        gridOpacity: {
          title: 'Grid Opacity',
          description: 'Adjust the intensity of grid lines.',
        },
        title: 'View Settings',
      },
    },
    spectate: {
      banner: {
        returnToGM: {
          button: 'Return to GM View',
        },
        allPlayers: {
          text: 'All Players',
        },
        viewingAs: {
          text: 'Viewing as:',
        },
      },
    },
    notifications: {
      token_added: 'Token added',
      token_removed: 'Token removed',
      active: ':name is back',
      afk: ':name is AFK',
      permission_denied: 'Permission denied',
      pullView: {
        message: 'The GM pulled your view',
        title: 'Attention',
      },
      followMode: {
        noTarget: 'TO NOBODY',
        broadcasting: 'BROADCASTING VIEW',
        followingGM: 'FOLLOWING GM',
        toAll: 'TO ALL',
        toPlayers: 'TO :count PLAYERS',
        toPrefix: 'TO',
      },
    },
    smartWall: {
      preview: {
        clickInstruction: 'Click on the image below to simulate where you would click on the map. The red outline shows how the wall will be generated.',
        clickToTest: 'Click to test',
        title: 'Preview Mode (Sandbox)',
        description: 'Click on the image below to simulate where you would click on the map. The red outline shows how the wall will be generated.',
        loading: 'Loading test image...',
        tolerance: 'TOLERANCE',
        simplification: 'SIMPLIFICATION',
        resolution: 'RESOLUTION',
        tip: {
          label: 'Tip:',
          text: 'Use low tolerance for very specific colors and high for larger areas. Resolution affects precision and performance.',
        },
      },
    },
    gameSession: {
      library: {
        emptyTitle: 'Empty Grimoire',
        emptyDesc: 'Create a token on the map and save it as a template to see it here.',
        title: 'Bestiary',
        vision: ':range m Vision',
        blind: 'Blind',
      },
      modal: {
        token: {
          create: 'Summon Creature',
          edit: 'Edit Creature',
        },
        handout: {
          deleteConfirm: 'Are you sure you want to delete ":name"?',
          deleteTitle: 'Delete Resource',
          new: 'New Resource',
          edit: 'Edit Resource',
        },
        attackZone: {
          createCustom: 'Create Custom Attack Zone',
          edit: 'Edit Attack Zone',
        },
        triggerZone: {
          edit: 'Edit Trigger',
        },
        audioZone: {
          edit: 'Edit Audio Zone',
        },
      },
      error: {
        noTokenCreatePerm: 'You don\'t have permission to create tokens.',
        notController: 'You do not control this token.',
        tokenEditBlocked: 'Token editing blocked.',
        tokenCreateBlocked: 'Token creation blocked.',
        loadCampaign: 'Failed to load campaign.',
      },
      notification: {
        handoutSaved: 'Resource saved.',
        zoneDuplicated: 'Zone duplicated!',
        zoneRemoved: 'Zone removed!',
        zoneUpdated: 'Zone updated!',
        zoneCreated: 'Attack zone created!',
      },
      loading: {
        sync: 'SYNCHRONIZING PLANES...',
        default: 'Loading...',
      },
      connection: {
        lost: 'CONNECTION LOST. ATTEMPTING TO RECONNECT...',
        lostSub: '(Your actions will be saved and sent as soon as the connection returns)',
      },
      status: {
        connected: 'Connected to Server',
        disconnected: 'Disconnected',
        live: 'LIVE',
        offline: 'OFFLINE',
      },
      toolbar: {
        groupCombat: 'Party & Combat',
      },
      combat: {
        label: 'COMBAT',
        round: 'ROUND :round',
      },
    },
    loading: {
      // Stage Labels
      connection: 'Establishing Connection',
      session: 'Synchronizing Session',
      assets: 'Loading Visual Resources',
      ping: 'Checking Network',
      ui: 'Preparing Interface',
      // Screen UI
      title: 'SYSTEM INITIALIZATION',
      subtitle: 'QUEST_BINDER_VTT // NEURAL_LINK_ESTABLISHED',
      version: 'v2.4.0',
      progressLabel: 'Installation Progress',
      footer: 'SECURE CONNECTION // ENCRYPTED // QUID',
      // Log Messages
      logs: {
        // Connection Stage
        connectingWebSocket: 'Establishing secure WebSocket connection...',
        handshakeComplete: 'Handshake complete. Protocol v2.0 active.',
        startingNetworkDiag: 'Starting network diagnostics...',
        // Ping Stage
        sendingTestPackets: 'Sending test packets to server...',
        latencyMeasured: 'Latency measured: :msms (:quality)',
        qualityExcellent: 'EXCELLENT',
        qualityGood: 'GOOD',
        qualityAcceptable: 'ACCEPTABLE',
        qualityHigh: 'HIGH',
        connectingToSession: 'Connecting to game session...',
        // Session Stage
        activeMapFound: 'Active map found: ":name"',
        sessionSynced: 'Session state synchronized successfully.',
        preparingModules: 'Preparing interface modules...',
        // Modules Stage
        loadingTypography: 'Loading system typography...',
        fontsLoaded: 'Fonts loaded: Inter, Mono, Icons.',
        initializingModules: 'Initializing modules: Permissions, Sheets, Maps...',
        compilingShaders: 'Pre-compiling render shaders...',
        interfaceReady: 'Interface ready. Starting asset cache...',
        // Assets Stage
        cacheComplete: 'Cache complete: :count files ready.',
        allResourcesLoaded: 'All resources loaded successfully!',
      },
      // Asset Descriptions
      assetNames: {
        mapBackground: 'Loading: Main Map Background Image',
        tokenSprite: 'Loading: Token Sprite ":name"',
        characterAvatar: 'Loading: Character Avatar ":name"',
        handoutImage: 'Loading: Handout Image ":name"',
        defaultCreature: 'Creature #:index',
      },
      // Finalization Messages
      finalization: {
        preparing: 'Preparing game environment...',
        syncing: 'Synchronizing session state...',
        optimizing: 'Optimizing rendering...',
        ready: 'Ready! Starting...',
      },
      // Status indicators
      status: {
        pending: 'Pending',
        loading: 'Loading',
        loaded: 'Complete',
        error: 'Error',
      },
      // Buttons
      buttons: {
        backToLobby: 'Back to Lobby',
        forceEntry: 'Force Entry',
        entering: 'Entering...',
      },
      // Error Modal
      errorModal: {
        title: 'Some Resources Failed to Load',
        description: 'The following resources could not be loaded. This may cause tokens without images, incomplete maps, or other visual issues.',
        consequence: 'The session will continue normally, but some elements may not display correctly.',
        autoEntering: 'Entering automatically in :seconds seconds...',
        failedAssets: 'Failed Resources:',
      },
    },
  },
  rules: {
    status: {
      frightened: {
        name: 'Frightened',
        effect: {
          '0': 'Disadvantage on ability checks and attack rolls while the source of fear is within line of sight.',
          '1': 'Cannot willingly move closer to the source of fear.',
        },
        duration: 'Until the end of next turn or removed from sight of source.',
      },
      grappled: {
        name: 'Grappled',
        effect: {
          '0': 'Speed becomes 0.',
          '1': 'Ends if the grappler is incapacitated or if the creature is removed from reach.',
        },
        duration: 'Until grappler ends it or Strength/Escape check.',
      },
      stunned: {
        name: 'Stunned',
        effect: {
          '0': 'Incapacitated (no actions/reactions).',
          '1': 'Automatically fails Strength and Dexterity saves.',
          '2': 'Attack rolls against the creature have advantage.',
        },
        duration: 'Until the end of next turn (usually).',
      },
      prone: {
        name: 'Prone',
        effect: {
          '0': 'Can only crawl or spend half movement to stand up.',
          '1': 'Disadvantage on attack rolls.',
          '2': 'Melee attacks against have advantage; ranged have disadvantage.',
        },
        duration: 'Until standing up.',
      },
      blinded: {
        name: 'Blinded',
        effect: {
          '0': 'Automatically fails checks that rely on sight.',
          '1': 'Attack rolls have disadvantage.',
          '2': 'Attack rolls against have advantage.',
        },
        duration: 'Varies.',
      },
      charmed: {
        name: 'Charmed',
        effect: {
          '0': 'Cannot attack the charmer or target them with harmful abilities.',
          '1': 'The charmer has advantage on Ability checks to interact socially.',
        },
        duration: '1 hour or until harmed by charmer.',
      },
      poisoned: {
        name: 'Poisoned',
        effect: {
          '0': 'Disadvantage on attack rolls and ability checks.',
        },
        duration: 'Varies (CON Save).',
      },
      restrained: {
        name: 'Restrained',
        effect: {
          '0': 'Speed 0.',
          '1': 'Disadvantage on attack rolls and Dexterity saves.',
          '2': 'Attack rolls against have advantage.',
        },
        duration: 'Varies.',
      },
      incapacitated: {
        name: 'Incapacitated',
        effect: {
          '0': 'Cannot take actions or reactions.',
        },
      },
      unconscious: {
        name: 'Unconscious',
        effect: {
          '0': 'Incapacitated, can\'t move or speak, unaware.',
          '1': 'Drops items and falls Prone.',
          '2': 'Automatically fails Strength and Dexterity saves.',
          '3': 'Attack rolls against have advantage and are critical hits if within 5ft.',
        },
        duration: 'Until healed or stabilized.',
      },
      invisible: {
        name: 'Invisible',
        effect: {
          '0': 'Impossible to be seen without magic/special senses.',
          '1': 'Considered heavily obscured for hiding.',
          '2': 'Attack rolls have advantage.',
          '3': 'Attack rolls against have disadvantage.',
        },
      },
      paralyzed: {
        name: 'Paralyzed',
        effect: {
          '0': 'Incapacitated and can\'t move or speak.',
          '1': 'Automatically fails Strength and Dexterity saves.',
          '2': 'Attack rolls against have advantage and are critical hits if within 5ft.',
        },
      },
      petrified: {
        name: 'Petrified',
        effect: {
          '0': 'Transformed into solid substance (inanimate).',
          '1': 'Incapacitated, doesn\'t age, weight x10.',
          '2': 'Resistance to all damage, immune to poison/disease.',
        },
        duration: 'Permanent until restored.',
      },
      deafened: {
        name: 'Deafened',
        effect: {
          '0': 'Automatically fails checks that rely on hearing.',
        },
        duration: '1 hour (typical).',
      },
      exhausted: {
        name: 'Exhausted',
        effect: {
          '0': 'Lvl 1: Disadvantage on ability checks.',
          '1': 'Lvl 2: Speed halved.',
          '2': 'Lvl 3: Disadvantage on attack rolls and saving throws.',
          '3': 'Lvl 4: Hit point maximum halved.',
          '4': 'Lvl 5: Speed 0.',
          '5': 'Lvl 6: Death.',
        },
        duration: 'Long Rest reduces 1 level.',
      },
      burning: {
        name: 'Burning',
        effect: {
          '0': 'Takes 1d6 fire damage at the start of each turn.',
          '1': 'Can spend an action to douse the fire (DC 10 Dexterity).',
        },
        duration: '1 minute or until doused.',
      },
      bleeding: {
        name: 'Bleeding',
        effect: {
          '0': 'Takes 1d4 necrotic/piercing damage at the start of turn.',
          '1': 'Any magical healing ends the condition.',
        },
        duration: 'Until healed (Medicine DC 10 or Healing).',
      },
      dead: {
        name: 'Dead',
        effect: {
          '0': 'Character has died.',
        },
        duration: 'Permanent.',
      },
      bloodied: {
        name: 'Bloodied',
        effect: {
          '0': 'Below half hit points.',
        },
        duration: 'Until healed above 50%.',
      },
      shielded: {
        name: 'Shielded',
        effect: {
          '0': 'Has AC bonus or magical protection.',
        },
      },
      alert: {
        name: 'Alert',
        effect: {
          '0': 'Advantage on initiative and perception.',
        },
      },
    },
    aura: {
      corrosiveAsh: {
        name: 'Aura of Corrosive Ash',
        trigger: 'Start of turn',
        desc: '1d6 acid per turn. Affected creatures have -2m movement.',
        effectName: 'Corrosive Ash',
        effectDesc: '1d6 Acid / -2m Movement',
      },
      deepTerror: {
        name: 'Deep Terror Aura',
        trigger: 'Enters or Start of turn',
        desc: 'Wisdom Save (DC 8+Prof+Attr). Fail: Frightened for 1 turn.',
        effectName: 'Deep Terror',
        effectDesc: 'Save WIS or Frightened',
      },
      etherealGuardian: {
        name: 'Ethereal Guardian Aura',
        trigger: 'Constant',
        desc: '+1 AC for allies. First attack against each ally has disadvantage (1/round).',
        effectName: 'Ethereal Guardian',
        effectDesc: '+1 AC / Disadvantage on 1st attack received',
      },
      elementalResistance: {
        name: 'Elemental Resistance Aura',
        desc: 'Resistance to a chosen element (Fire, Cold, Acid, etc).',
        effectName: 'Elemental Resistance',
        effectDesc: 'Resistance to chosen element',
      },
      protection: {
        name: 'Aura of Protection',
        desc: 'Allies add Charisma modifier to saving throws.',
        effectName: 'Protection (Charisma)',
        effectDesc: '+CHA on Saves',
      },
      courage: {
        name: 'Aura of Courage',
        desc: 'Allies cannot be frightened.',
        effectName: 'Courage',
        effectDesc: 'Immune to Fear',
      },
      strategist: {
        name: 'Strategist\'s Aura',
        desc: 'Allies gain +1 on attack rolls.',
        effectName: 'Strategist',
        effectDesc: '+1 Attack',
      },
      arcaneFocus: {
        name: 'Arcane Focus Aura',
        desc: 'Allies have advantage on concentration checks.',
        effectName: 'Arcane Focus',
        effectDesc: 'Advantage on Concentration',
      },
      vitality: {
        name: 'Aura of Vitality',
        trigger: 'Bonus Action',
        desc: 'Heal 2d6 per action on a target within range.',
        effectName: 'Vitality',
        effectDesc: 'Can be healed (2d6)',
      },
      temporalSlow: {
        name: 'Temporal Slow Aura',
        trigger: 'Enters',
        desc: 'Creatures have -3m speed and cannot take Reactions.',
        effectName: 'Temporal Slow',
        effectDesc: '-3m Movement / No Reactions',
      },
      windGust: {
        name: 'Wind Gust Aura',
        desc: 'Creatures entering make Strength save or are pushed 1.5m.',
        effectName: 'Wind Gust',
        effectDesc: 'Save STR or Push 1.5m',
      },
      spiritGuardians: {
        name: 'Spirit Guardians',
        desc: 'Continuous damage and speed reduction for enemies.',
        effectName: 'Spirit Guardians',
        effectDesc: 'Damage / Speed Reduced',
      },
      fear: {
        name: 'Fear Aura',
        desc: 'Creatures must pass save or become frightened.',
        effectName: 'Fear',
        effectDesc: 'Wisdom Save or Frightened',
      },
      fire: {
        name: 'Fire Aura',
        desc: 'Fire damage when approaching or starting turn.',
        effectName: 'Fire',
        effectDesc: 'Fire Damage',
      },
    },
  },
  dnd: {
    rules: {
      conditions: {
        frightened: {
          name: 'Frightened',
          effects: ['Disadvantage on ability checks and attack rolls while the source of fear is within line of sight.', 'The creature can’t willingly move closer to the source of its fear.'],
          duration: 'Until the end of next turn or removed from sight.',
        },
        grappled: {
          name: 'Grappled',
          effects: ['Speed becomes 0, and it can\'t benefit from any bonus to its speed.', 'The condition ends if the grappler is incapacitated (see the condition).'],
          duration: 'Until escape.',
        },
        stunned: {
          name: 'Stunned',
          effects: ['Incapacitated (can\'t take actions or reactions).', 'Automatically fails Strength and Dexterity saving throws.', 'Attack rolls against the creature have advantage.'],
          duration: 'Until the end of next turn (typically).',
        },
        prone: {
          name: 'Prone',
          effects: ['Can only crawl or spend half speed to stand up.', 'Disadvantage on attack rolls.', 'Attack rolls against the creature have advantage if within 5 feet, otherwise disadvantage.'],
          duration: 'Until standing up.',
        },
        blinded: {
          name: 'Blinded',
          effects: ['Automatically fails ability checks that require sight.', 'Attack rolls against the creature have advantage.', 'Attack rolls by the creature have disadvantage.'],
          duration: 'Varies.',
        },
        charmed: {
          name: 'Charmed',
          effects: ['Can\'t attack the charmer or target the charmer with harmful abilities.', 'The charmer has advantage on ability checks to interact socially with the creature.'],
          duration: '1 hour or until harmed by charmer.',
        },
        poisoned: {
          name: 'Poisoned',
          effects: ['Disadvantage on attack rolls and ability checks.'],
          duration: 'Varies (repeat CON save).',
        },
        restrained: {
          name: 'Restrained',
          effects: ['Speed becomes 0.', 'Disadvantage on attack rolls and Dexterity saving throws.', 'Attack rolls against the creature have advantage.'],
          duration: 'Varies.',
        },
        incapacitated: {
          name: 'Incapacitated',
          effects: ['Can\'t take actions or reactions.'],
          duration: 'Varies.',
        },
        unconscious: {
          name: 'Unconscious',
          effects: ['Incapacitated, can\'t move or speak, unaware of surroundings.', 'Drops whatever it\'s holding and falls prone.', 'Automatically fails Strength and Dexterity saving throws.', 'Attack rolls against the creature have advantage and are critical hits if attacker is within 5 feet.'],
          duration: 'Until healed or stabilized.',
        },
        invisible: {
          name: 'Invisible',
          effects: ['Impossible to see without magic or special sense.', 'Heavily obscured for the purpose of hiding.', 'Attack rolls by the creature have advantage.', 'Attack rolls against the creature have disadvantage.'],
          duration: 'Varies (magic).',
        },
        paralyzed: {
          name: 'Paralyzed',
          effects: ['Incapacitated and can\'t move or speak.', 'Automatically fails Strength and Dexterity saving throws.', 'Attack rolls against the creature have advantage and are critical hits if attacker is within 5 feet.'],
          duration: 'Varies.',
        },
        petrified: {
          name: 'Petrified',
          effects: ['Transformed onto a solid inanimate substance.', 'Incapacitated, unaware, stops aging, weight x10.', 'Resistance to all damage, immune to poison/disease.', 'Automatically fails Strength and Dexterity saving throws.'],
          duration: 'Permanent until restored.',
        },
        deafened: {
          name: 'Deafened',
          effects: ['Automatically fails ability checks that require hearing.'],
          duration: '1 hour (typically).',
        },
        exhausted: {
          name: 'Exhausted',
          effects: ['Lvl 1: Disadvantage on ability checks.', 'Lvl 2: Speed halved.', 'Lvl 3: Disadvantage on attack rolls and saving throws.', 'Lvl 4: Hit point maximum halved.', 'Lvl 5: Speed reduced to 0.', 'Lvl 6: Death.'],
          duration: 'Long Rest reduces 1 level.',
        },
        burning: {
          name: 'Burning',
          effects: ['Takes 1d6 fire damage at the start of each turn.', 'Can use an action to douse the fire (DC 10 Dexterity check).'],
          duration: '1 minute or until doused.',
        },
        bleeding: {
          name: 'Bleeding',
          effects: ['Takes 1d4 necrotic/piercing damage at the start of each turn.', 'Any magical healing ends the condition.'],
          duration: 'Until healed (Medicine DC 10 or Healing).',
        },
        dead: {
          name: 'Dead',
          effects: ['Character has died.'],
          duration: 'Permanent.',
        },
        bloodied: {
          name: 'Bloodied',
          effects: ['Below half hit points.'],
          duration: 'Until healed above 50%.',
        },
        shielded: {
          name: 'Shielded',
          effects: ['Has AC bonus or magical protection.'],
          duration: 'Varies.',
        },
        alert: {
          name: 'Alert',
          effects: ['Advantage on initiative and perception.'],
          duration: 'Varies.',
        },
      },
    },
  },
} as const;
