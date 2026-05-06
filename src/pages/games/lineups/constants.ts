export const UNIT_GROUPS = [
  {
    label: 'Forwards',
    units: ['Line 1', 'Line 2', 'Line 3', 'Line 4']
  },
  {
    label: 'Defense',
    units: ['D-Pair 1', 'D-Pair 2', 'D-Pair 3']
  },
  {
    label: 'Special Teams',
    units: ['PP1', 'PP2', 'PK1', 'PK2']
  },
  {
    label: 'Goaltenders',
    units: ['Goalies']
  }
]

export const UNITS = UNIT_GROUPS.flatMap(g => g.units)
