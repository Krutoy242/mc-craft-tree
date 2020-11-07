export interface JEC_RootObject {
  Default: JEC_Recipe[];
}

export interface JEC_Recipe {
  output: JEC_Ingredient[];
  input: JEC_Ingredient[];
  catalyst: JEC_Ingredient[];
}

export interface JEC_Ingredient {
  type: JEC_Types;
  content: JEC_Content;
}

interface JEC_Content {
  amount: number;
  item?: string;
  meta?: number;
  fluid?: string;
  name?: string;
  percent?: number;
  fMeta?: number;
  fCap?: number;
  fNbt?: number;
  cap?: Nbt;
  nbt?: Nbt;
}

export type JEC_Types = 'itemStack'|'fluidStack'|'oreDict'|'placeholder'

interface Nbt {
  [key: string]: any
}