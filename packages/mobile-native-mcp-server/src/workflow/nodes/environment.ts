import { State } from '../metadata.js';
import { BaseNode } from './abstractBaseNode.js';

export class EnvironmentValidationNode extends BaseNode {
  constructor() {
    super('validateEnvironment');
  }

  execute(_state: State): Partial<State> {
    // TODO: Implement environment validation.
    return {
      environmentValidated: true,
    };
  }
}
