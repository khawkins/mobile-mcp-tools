import { State } from '../metadata.js';
import { BaseNode } from './abstractBaseNode.js';

export class EnvironmentValidationNode extends BaseNode {
  readonly name = 'validateEnvironment';

  execute(_state: State): Partial<State> {
    return {
      platform: 'iOS', // TODO: Implement platform validation. See "initialInputNode" note in graph.ts.
      environmentValidated: true,
    };
  }
}
