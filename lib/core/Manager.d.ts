import Grant from "./Grant";
import Rule from "./Rule";
import Throttling from "./throttling/Throttling";

declare interface ruleOptions {
    window: number,
    limit: number,
    throttling: string | {
        type: string,
        getStartOfNextWindow: () => number
    },
    queueing: string | {
        type: string
    },
    name?: string,
    scope?: string | string[],
    resource?: number,
    onError: (throttling: Throttling, e: Error) => void
}

declare class Manager {
    /**
     * Creates a new manager and if supplied, inherits the rules
     * of another manager.
     */
    constructor(options?: {
        backoff?: string,
        rules: (Rule | ruleOptions)[]
    }, manager?: Manager);

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
    requestQuota(managerName: string, scope?: {
        [scopeName: string]: any
    }, resources?: {
        [resourceName: string]: number
    }, options?: {
        maxWait?: number
    }): Promise<Grant>;
}

export = Manager;