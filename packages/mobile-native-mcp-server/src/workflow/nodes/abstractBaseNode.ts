import { State } from '../metadata.js';

export abstract class BaseNode {
  public readonly name: string;

  constructor(name: string) {
    this.name = name;
  }

  abstract execute(state: State): Partial<State>;
}
