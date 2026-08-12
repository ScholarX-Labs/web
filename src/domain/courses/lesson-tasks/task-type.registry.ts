import { ITaskTypeStrategy } from './contracts/task-type.strategy';
import { McqStrategy } from './strategies/mcq.strategy';
import { WrittenStrategy } from './strategies/written.strategy';
import { SwotStrategy } from './strategies/swot.strategy';

export class TaskTypeRegistry {
  private strategies: Map<string, ITaskTypeStrategy> = new Map();

  constructor() {
    this.registerStrategy(new McqStrategy());
    this.registerStrategy(new WrittenStrategy());
    this.registerStrategy(new SwotStrategy());
  }

  registerStrategy(strategy: ITaskTypeStrategy): void {
    this.strategies.set(strategy.getType(), strategy);
  }

  getStrategy(type: string): ITaskTypeStrategy {
    const strategy = this.strategies.get(type);
    if (!strategy) {
      throw new Error(`Task strategy for type '${type}' not found.`);
    }
    return strategy;
  }
}

// Export a singleton instance
export const taskTypeRegistry = new TaskTypeRegistry();
