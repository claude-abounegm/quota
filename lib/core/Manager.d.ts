import Grant from './Grant';
import Rule from './Rule';
import Backoff from '../common/Backoff';
import Throttling from '../common/Throttling';

declare interface ruleOptions {
    window: number;
    limit: number;
    throttling:
        | string
        | {
              type: string;
              getStartOfNextWindow: () => number;
          };
    queueing:
        | string
        | {
              type: string;
          };
    name?: string;
    scope?: string | string[];
    resource?: number;
    onError: (throttling: Throttling, e: Error) => void;
}

declare class Manager {
    /**
     * Creates a new manager and if supplied, inherits the rules
     * of another manager.
     */
    constructor(
        options?: {
            name: string;
            backoff?:
                | string
                | { type: string; shouldBackoff: (e?: Error) => boolean };
            rules: (Rule | ruleOptions)[];
        },
        manager?: Manager
    );

    rules: Rule[];

    getRule(name: string): Rule;

    /**
     * Adds the rule to this manager.
     */
    addRule(options: ruleOptions): Rule;

    /**
     * Adds the rule to this manager.
     */
    addRule(rule: Rule): Rule;

    /**
     * Request quota
     */
    requestQuota(
        scope?: {
            [scopeName: string]: any;
        },
        resources?: {
            [resourceName: string]: number;
        },
        options?: {
            maxWait?: number;
        }
    ): Promise<Grant>;

    backoff: Backoff;
    name: string;
}

export = Manager;
