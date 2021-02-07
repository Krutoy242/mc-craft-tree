import { Constituent } from './Constituent';


export class ConstituentStack {
  static sort = (a: ConstituentStack, b: ConstituentStack) => a.cuent.id.localeCompare(b.cuent.id);

  constructor(
    public cuent: Constituent,
    public amount: number
  ) {
  }

  match(cs: ConstituentStack) { return this.amount === cs.amount && this.cuent.match(cs.cuent); }
}
