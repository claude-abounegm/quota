import Manager from "../core/Manager";
import BaseServer from "../server/BaseServer";
import Grant from "../common/Grant";
import SocketIO from "socket.io";

declare class Client {
    /**
     * Creates a new Quota Client. The client is responsible
     * to communicate with different servers: remote and local.
     *  
     * @param uri The URI of the server's socket.io
     */
    constructor(uri: string);
    constructor(server: BaseServer);
    constructor(servers: (string | BaseServer)[]);

    servers: BaseServer[];

    /**
     * Adds a server to be used by this client.
     */
    addServer(server: BaseServer): BaseServer;
    addServer(uri: string): BaseServer;

    /**
     * Disposes of resources such as open connections
     */
    dispose(): Promise<void>;

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

export = Client;