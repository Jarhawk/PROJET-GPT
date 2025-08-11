export const makeId = (prefix='fld') =>
  `${prefix}-${Math.random().toString(36).slice(2,6)}`;
