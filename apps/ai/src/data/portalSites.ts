/**
 * AI 门户 - 数据来自 aiProductsByCategory，118 格按周期表排布，按分类着色
 */

import { AI_PRODUCTS_BY_CATEGORY } from './aiProductsByCategory'

export interface PortalSite {
  symbol: string
  name: string
  url: string
  position: [number, number]
  category: string
}

const POSITIONS: [number, number][] = [
  [1, 1], [18, 1],
  [1, 2], [2, 2], [13, 2], [14, 2], [15, 2], [16, 2], [17, 2], [18, 2],
  [1, 3], [2, 3], [13, 3], [14, 3], [15, 3], [16, 3], [17, 3], [18, 3],
  [1, 4], [2, 4], [3, 4], [4, 4], [5, 4], [6, 4], [7, 4], [8, 4], [9, 4], [10, 4], [11, 4], [12, 4], [13, 4], [14, 4], [15, 4], [16, 4], [17, 4], [18, 4],
  [1, 5], [2, 5], [3, 5], [4, 5], [5, 5], [6, 5], [7, 5], [8, 5], [9, 5], [10, 5], [11, 5], [12, 5], [13, 5], [14, 5], [15, 5], [16, 5], [17, 5], [18, 5],
  [1, 6], [2, 6], [4, 9], [5, 9], [6, 9], [7, 9], [8, 9], [9, 9], [10, 9], [11, 9], [12, 9], [13, 9], [14, 9], [15, 9], [16, 9], [17, 9], [18, 9],
  [4, 6], [5, 6], [6, 6], [7, 6], [8, 6], [9, 6], [10, 6], [11, 6], [12, 6], [13, 6], [14, 6], [15, 6], [16, 6], [17, 6], [18, 6],
  [1, 7], [2, 7], [4, 10], [5, 10], [6, 10], [7, 10], [8, 10], [9, 10], [10, 10], [11, 10], [12, 10], [13, 10], [14, 10], [15, 10], [16, 10], [17, 10], [18, 10],
  [4, 7], [5, 7], [6, 7], [7, 7], [8, 7], [9, 7], [10, 7], [11, 7], [12, 7], [13, 7], [14, 7], [15, 7], [16, 7], [17, 7], [18, 7],
]

const ELEMENT_SYMBOLS = [
  'H', 'He', 'Li', 'Be', 'B', 'C', 'N', 'O', 'F', 'Ne',
  'Na', 'Mg', 'Al', 'Si', 'P', 'S', 'Cl', 'Ar',
  'K', 'Ca', 'Sc', 'Ti', 'V', 'Cr', 'Mn', 'Fe', 'Co', 'Ni', 'Cu', 'Zn', 'Ga', 'Ge', 'As', 'Se', 'Br', 'Kr',
  'Rb', 'Sr', 'Y', 'Zr', 'Nb', 'Mo', 'Tc', 'Ru', 'Rh', 'Pd', 'Ag', 'Cd', 'In', 'Sn', 'Sb', 'Te', 'I', 'Xe',
  'Cs', 'Ba', 'La', 'Ce', 'Pr', 'Nd', 'Pm', 'Sm', 'Eu', 'Gd', 'Tb', 'Dy', 'Ho', 'Er', 'Tm', 'Yb', 'Lu',
  'Hf', 'Ta', 'W', 'Re', 'Os', 'Ir', 'Pt', 'Au', 'Hg', 'Tl', 'Pb', 'Bi', 'Po', 'At', 'Rn',
  'Fr', 'Ra', 'Ac', 'Th', 'Pa', 'U', 'Np', 'Pu', 'Am', 'Cm', 'Bk', 'Cf', 'Es', 'Fm', 'Md', 'No', 'Lr',
  'Rf', 'Db', 'Sg', 'Bh', 'Hs', 'Mt', 'Ds', 'Rg', 'Cn', 'Nh', 'Fl', 'Mc', 'Lv', 'Ts', 'Og',
]

/** 按分类顺序展平的产品（name, url, category） */
function flattenProductsWithCategory(): { name: string; url: string; category: string }[] {
  const list: { name: string; url: string; category: string }[] = []
  for (const cat of AI_PRODUCTS_BY_CATEGORY) {
    for (const p of cat.products) {
      list.push({ name: p.name, url: p.url, category: cat.key })
    }
  }
  return list
}

const FLAT_PRODUCTS = flattenProductsWithCategory()

/** 门户 118 格：前 N 格为分类产品，其余占位；每项带 category 用于着色 */
export const PORTAL_SITES: PortalSite[] = POSITIONS.map((position, i) => {
  const item = FLAT_PRODUCTS[i]
  return {
    symbol: ELEMENT_SYMBOLS[i],
    name: item ? item.name : '',
    url: item ? item.url : '',
    position,
    category: item ? item.category : '',
  }
})

/** 分类颜色（一类一色），供 portal 卡片使用 */
export const CATEGORY_COLORS: Record<string, string> = {
  voice: 'rgba(0, 180, 216, 0.55)',
  design: 'rgba(255, 159, 67, 0.55)',
  music: 'rgba(156, 39, 176, 0.5)',
  '3d': 'rgba(76, 175, 80, 0.5)',
  'llm-cn': 'rgba(233, 30, 99, 0.5)',
  'llm-global': 'rgba(33, 150, 243, 0.55)',
  image: 'rgba(255, 193, 7, 0.5)',
  search: 'rgba(0, 150, 136, 0.55)',
  'digital-human': 'rgba(103, 58, 183, 0.5)',
  programming: 'rgba(244, 67, 54, 0.55)',
  video: 'rgba(0, 188, 212, 0.55)',
  peripheral: 'rgba(121, 85, 72, 0.55)',
  '': 'rgba(80, 80, 80, 0.4)',
}
