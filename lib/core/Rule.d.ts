import Grant from "./Grant";
import QueuedRequest from "./QueuedRequest";

declare class Rule {
    constructor(options: {
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
        resource?: string;
    });

    name: string;
    resource: string;

    limitsResource(resourceName: string): boolean;
    isAvailable(scope, resources, queuedRequest?: QueuedRequest): boolean;

    enqueue(
        managerName: string,
        scope: { [scopeName: string]: string },
        options: { maxWait?: number },
        queuedRequest?: QueuedRequest
    ): Promise<QueuedRequest>;
    reserve(scope, resources);
}

export = Rule;
