export type GroupBuff = {
  id: string
  name: string
  description: string
}

export type SpecDefinition = {
  id: string
  classId: string
  className: string
  name: string
  color: string
  icon: string
  buffs: Array<GroupBuff>
}

type ClassDefinition = {
  id: string
  name: string
  color: string
  specs: Array<Omit<SpecDefinition, 'classId' | 'className' | 'color'>>
}

const classDefinitions: Array<ClassDefinition> = [
  {
    id: 'warrior',
    name: 'Warrior',
    color: '#8f6844',
    specs: [
      {
        id: 'arms-warrior',
        name: 'Arms',
        icon: '/spec-icons/arms-warrior.jpg',
        buffs: [],
      },
      {
        id: 'fury-warrior',
        name: 'Fury',
        icon: '/spec-icons/fury-warrior.jpg',
        buffs: [],
      },
      {
        id: 'protection-warrior',
        name: 'Protection',
        icon: '/spec-icons/protection-warrior.jpg',
        buffs: [],
      },
    ],
  },
  {
    id: 'paladin',
    name: 'Paladin',
    color: '#c45587',
    specs: [
      {
        id: 'holy-paladin',
        name: 'Holy',
        icon: '/spec-icons/holy-paladin.jpg',
        buffs: [
          {
            id: 'concentration-aura',
            name: 'Concentration Aura',
            description:
              'Reduces spellcasting interruption for nearby party members.',
          },
        ],
      },
      {
        id: 'protection-paladin',
        name: 'Protection',
        icon: '/spec-icons/protection-paladin.jpg',
        buffs: [
          {
            id: 'devotion-aura',
            name: 'Devotion Aura',
            description: 'Increases armor for nearby party members.',
          },
        ],
      },
      {
        id: 'retribution-paladin',
        name: 'Retribution',
        icon: '/spec-icons/retribution-paladin.jpg',
        buffs: [
          {
            id: 'sanctity-aura',
            name: 'Sanctity Aura',
            description: 'Increases Holy damage dealt by nearby party members.',
          },
        ],
      },
    ],
  },
  {
    id: 'hunter',
    name: 'Hunter',
    color: '#5f7f39',
    specs: [
      {
        id: 'beast-mastery-hunter',
        name: 'Beast Mastery',
        icon: '/spec-icons/beast-mastery-hunter.jpg',
        buffs: [
          {
            id: 'ferocious-inspiration',
            name: 'Ferocious Inspiration',
            description:
              'Increases party damage after the hunter pet scores a critical hit.',
          },
        ],
      },
      {
        id: 'marksmanship-hunter',
        name: 'Marksmanship',
        icon: '/spec-icons/marksmanship-hunter.jpg',
        buffs: [
          {
            id: 'trueshot-aura',
            name: 'Trueshot Aura',
            description: 'Increases attack power for nearby party members.',
          },
        ],
      },
      {
        id: 'survival-hunter',
        name: 'Survival',
        icon: '/spec-icons/survival-hunter.jpg',
        buffs: [],
      },
    ],
  },
  {
    id: 'rogue',
    name: 'Rogue',
    color: '#9a842a',
    specs: [
      {
        id: 'assassination-rogue',
        name: 'Assassination',
        icon: '/spec-icons/assassination-rogue.jpg',
        buffs: [],
      },
      {
        id: 'combat-rogue',
        name: 'Combat',
        icon: '/spec-icons/combat-rogue.jpg',
        buffs: [],
      },
      {
        id: 'subtlety-rogue',
        name: 'Subtlety',
        icon: '/spec-icons/subtlety-rogue.jpg',
        buffs: [],
      },
    ],
  },
  {
    id: 'priest',
    name: 'Priest',
    color: '#747b85',
    specs: [
      {
        id: 'discipline-priest',
        name: 'Discipline',
        icon: '/spec-icons/discipline-priest.jpg',
        buffs: [],
      },
      {
        id: 'holy-priest',
        name: 'Holy',
        icon: '/spec-icons/holy-priest.jpg',
        buffs: [],
      },
      {
        id: 'shadow-priest',
        name: 'Shadow',
        icon: '/spec-icons/shadow-priest.jpg',
        buffs: [
          {
            id: 'vampiric-touch',
            name: 'Vampiric Touch',
            description:
              'Restores mana to the shadow priest’s party as damage is dealt.',
          },
        ],
      },
    ],
  },
  {
    id: 'shaman',
    name: 'Shaman',
    color: '#1769aa',
    specs: [
      {
        id: 'elemental-shaman',
        name: 'Elemental',
        icon: '/spec-icons/elemental-shaman.jpg',
        buffs: [
          {
            id: 'totem-of-wrath',
            name: 'Totem of Wrath',
            description:
              'Improves spell critical chance and spell hit for the party.',
          },
        ],
      },
      {
        id: 'enhancement-shaman',
        name: 'Enhancement',
        icon: '/spec-icons/enhancement-shaman.jpg',
        buffs: [
          {
            id: 'unleashed-rage',
            name: 'Unleashed Rage',
            description:
              'Increases party attack power after a melee critical hit.',
          },
        ],
      },
      {
        id: 'restoration-shaman',
        name: 'Restoration',
        icon: '/spec-icons/restoration-shaman.jpg',
        buffs: [
          {
            id: 'mana-tide-totem',
            name: 'Mana Tide Totem',
            description: 'Restores mana to nearby party members.',
          },
        ],
      },
    ],
  },
  {
    id: 'mage',
    name: 'Mage',
    color: '#258ca8',
    specs: [
      {
        id: 'arcane-mage',
        name: 'Arcane',
        icon: '/spec-icons/arcane-mage.jpg',
        buffs: [],
      },
      {
        id: 'fire-mage',
        name: 'Fire',
        icon: '/spec-icons/fire-mage.jpg',
        buffs: [],
      },
      {
        id: 'frost-mage',
        name: 'Frost',
        icon: '/spec-icons/frost-mage.jpg',
        buffs: [],
      },
    ],
  },
  {
    id: 'warlock',
    name: 'Warlock',
    color: '#6654a0',
    specs: [
      {
        id: 'affliction-warlock',
        name: 'Affliction',
        icon: '/spec-icons/affliction-warlock.jpg',
        buffs: [],
      },
      {
        id: 'demonology-warlock',
        name: 'Demonology',
        icon: '/spec-icons/demonology-warlock.jpg',
        buffs: [],
      },
      {
        id: 'destruction-warlock',
        name: 'Destruction',
        icon: '/spec-icons/destruction-warlock.jpg',
        buffs: [],
      },
    ],
  },
  {
    id: 'druid',
    name: 'Druid',
    color: '#b25a16',
    specs: [
      {
        id: 'balance-druid',
        name: 'Balance',
        icon: '/spec-icons/balance-druid.jpg',
        buffs: [
          {
            id: 'moonkin-aura',
            name: 'Moonkin Aura',
            description:
              'Increases spell critical chance for nearby party members.',
          },
        ],
      },
      {
        id: 'feral-druid',
        name: 'Feral',
        icon: '/spec-icons/feral-druid.jpg',
        buffs: [
          {
            id: 'leader-of-the-pack',
            name: 'Leader of the Pack',
            description:
              'Increases melee and ranged critical chance for the party.',
          },
        ],
      },
      {
        id: 'restoration-druid',
        name: 'Restoration',
        icon: '/spec-icons/restoration-druid.jpg',
        buffs: [
          {
            id: 'tree-of-life-aura',
            name: 'Tree of Life Aura',
            description: 'Increases healing received by nearby party members.',
          },
        ],
      },
    ],
  },
]

export const specClasses = classDefinitions.map((classDefinition) => ({
  ...classDefinition,
  specs: classDefinition.specs.map((spec) => ({
    ...spec,
    classId: classDefinition.id,
    className: classDefinition.name,
    color: classDefinition.color,
  })),
}))

export const specs = specClasses.flatMap(
  (classDefinition) => classDefinition.specs,
)

export const specsById = new Map(specs.map((spec) => [spec.id, spec]))
