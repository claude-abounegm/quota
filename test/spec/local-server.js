'use strict';
const _ = require('lodash');

const quota = require('../../lib');

const { expect } = require('chai');

async function shouldThrowOutOfQuota(fn) {
    try {
        await fn();
        throw new Error('Expected OutOfQuotaError');
    } catch (e) {
        if (!(e instanceof quota.OutOfQuotaError)) {
            throw e;
        }
    }
}

async function expectScopeError(fn) {
    try {
        await fn();
        throw new Error('Expected scope error');
    } catch (e) {
        expect(e.message).to.eql(
            'Please pass a value for the "id" scope with your quota request'
        );
    }
}

describe('Local Server', function() {
    describe('with a single manager', function() {
        it('with 1 rule', async function() {
            const quotaManager = new quota.Manager();
            quotaManager.addRule({
                limit: 1,
                throttling: 'limit-absolute'
            });

            const quotaServer = new quota.Server();
            quotaServer.addManager('test', quotaManager);

            const quotaClient = new quota.Client(quotaServer);

            await quotaClient.requestQuota('test');
            await shouldThrowOutOfQuota(() => quotaClient.requestQuota('test'));
        });

        it('with 2 rules', async function() {
            const quotaManager = new quota.Manager();
            quotaManager.addRule({
                limit: 2,
                throttling: 'limit-absolute'
            });
            quotaManager.addRule({
                limit: 1,
                throttling: 'limit-absolute'
            });

            const quotaServer = new quota.Server();
            quotaServer.addManager('test', quotaManager);

            const quotaClient = new quota.Client(quotaServer);

            await quotaClient.requestQuota('test');
            await shouldThrowOutOfQuota(() => quotaClient.requestQuota('test'));
        });

        it('with 1 rule and scope', async function() {
            const quotaManager = new quota.Manager();
            quotaManager.addRule({
                limit: 1,
                throttling: 'limit-absolute',
                scope: 'id'
            });

            const quotaServer = new quota.Server();
            quotaServer.addManager('test', quotaManager);

            const quotaClient = new quota.Client(quotaServer);

            await quotaClient.requestQuota('test', {
                id: 1,
                notRelevant: true
            });

            await quotaClient.requestQuota('test', {
                id: 2
            });

            await shouldThrowOutOfQuota(() =>
                quotaClient.requestQuota('test', {
                    id: 1
                })
            );

            await shouldThrowOutOfQuota(() =>
                quotaClient.requestQuota('test', {
                    id: 2
                })
            );
        });

        it('should reject not properly set scope parameters', async function() {
            const quotaManager = new quota.Manager();
            quotaManager.addRule({
                limit: 1,
                throttling: 'limit-absolute',
                scope: 'id'
            });

            const quotaServer = new quota.Server();
            quotaServer.addManager('test', quotaManager);

            const quotaClient = new quota.Client(quotaServer);

            await expectScopeError(() =>
                quotaClient.requestQuota('test', undefined)
            );
            await expectScopeError(() => quotaClient.requestQuota('test', {}));
            await expectScopeError(() =>
                quotaClient.requestQuota('test', {
                    id: undefined
                })
            );

            await quotaClient.requestQuota('test', {
                id: null
            });

            await shouldThrowOutOfQuota(() =>
                quotaClient.requestQuota('test', {
                    id: 'null'
                })
            );
        });

        it('with 1 rule and complex scope', function() {
            const quotaServer = new quota.Server({
                test: new quota.Manager({
                    rules: [
                        {
                            limit: 1,
                            throttling: 'limit-absolute',
                            scope: ['id', 'id2']
                        }
                    ]
                })
            });

            const quotaClient = new quota.Client(quotaServer);

            return Promise.resolve()
                .then(function() {
                    return quotaClient.requestQuota('test', {
                        id: 1,
                        id2: 1
                    });
                })
                .then(function() {
                    return quotaClient.requestQuota('test', {
                        id: 1,
                        id2: 2
                    });
                })
                .then(function() {
                    return quotaClient.requestQuota('test', {
                        id: 2,
                        id2: 1
                    });
                })
                .then(function() {
                    return quotaClient.requestQuota('test', {
                        id: 1,
                        id2: null
                    });
                })
                .then(function() {
                    return quotaClient
                        .requestQuota('test', {
                            id: 1,
                            id2: 1
                        })
                        .then(function() {
                            throw new Error('Expected OutOfQuotaError');
                        })
                        .catch(function(err) {
                            if (!(err instanceof quota.OutOfQuotaError)) {
                                throw new Error();
                            }
                            return; // Expected
                        });
                })
                .then(function() {
                    return quotaClient
                        .requestQuota('test', {
                            id: 1,
                            id2: 2
                        })
                        .then(function() {
                            throw new Error('Expected OutOfQuotaError');
                        })
                        .catch(function(err) {
                            if (!(err instanceof quota.OutOfQuotaError)) {
                                throw new Error();
                            }
                            return; // Expected
                        });
                })
                .then(function() {
                    return quotaClient
                        .requestQuota('test', {
                            id: 2,
                            id2: 1
                        })
                        .then(function() {
                            throw new Error('Expected OutOfQuotaError');
                        })
                        .catch(function(err) {
                            if (!(err instanceof quota.OutOfQuotaError)) {
                                throw new Error();
                            }
                            return; // Expected
                        });
                })
                .then(function() {
                    return quotaClient
                        .requestQuota('test', {
                            id: 1,
                            id2: null
                        })
                        .then(function() {
                            throw new Error('Expected OutOfQuotaError');
                        })
                        .catch(function(err) {
                            if (!(err instanceof quota.OutOfQuotaError)) {
                                throw new Error();
                            }
                            return; // Expected
                        });
                });
        });

        //     it('with 3 rules and complex scope (1)', function () {

        //         var quotaManager = new quota.Manager();
        //         quotaManager.addRule({
        //             limit: 3,
        //             throttling: 'limit-absolute'
        //         });
        //         quotaManager.addRule({
        //             limit: 3,
        //             throttling: 'limit-absolute',
        //             scope: 'id'
        //         });
        //         quotaManager.addRule({
        //             limit: 1, // <-- This one will be out of quota
        //             throttling: 'limit-absolute',
        //             scope: ['id', 'id2']
        //         });

        //         var quotaServer = new quota.Server();
        //         quotaServer.addManager('test', quotaManager);

        //         var quotaClient = new quota.Client(quotaServer);

        //         return Promise.resolve()
        //             .then(function () {
        //                 return quotaClient.requestQuota('test', { id: 1, id2: 1 });
        //             })
        //             .then(function () {
        //                 return quotaClient.requestQuota('test', { id: 1, id2: 2 });
        //             })
        //             .then(function () {

        //                 return quotaClient.requestQuota('test', { id: 1, id2: 1 })
        //                     .then(function () {
        //                         throw new Error('Expected OutOfQuotaError');
        //                     })
        //                     .catch(quota.OutOfQuotaError, function (err) {
        //                         return; // Expected
        //                     });

        //             })
        //             .then(function () {

        //                 return quotaClient.requestQuota('test', { id: 1, id2: 2 })
        //                     .then(function () {
        //                         throw new Error('Expected OutOfQuotaError');
        //                     })
        //                     .catch(quota.OutOfQuotaError, function (err) {
        //                         return; // Expected
        //                     });

        //             });

        //     });

        //     it('with 3 rules and complex scope (2)', function () {

        //         var quotaManager = new quota.Manager();
        //         quotaManager.addRule({
        //             limit: 3,
        //             throttling: 'limit-absolute'
        //         });
        //         quotaManager.addRule({
        //             limit: 2, // <-- This one will be out of quota
        //             throttling: 'limit-absolute',
        //             scope: 'id'
        //         });
        //         quotaManager.addRule({
        //             limit: 2,
        //             throttling: 'limit-absolute',
        //             scope: ['id', 'id2']
        //         });

        //         var quotaServer = new quota.Server();
        //         quotaServer.addManager('test', quotaManager);

        //         var quotaClient = new quota.Client(quotaServer);

        //         return Promise.resolve()
        //             .then(function () {
        //                 return quotaClient.requestQuota('test', { id: 1, id2: 1 });
        //             })
        //             .then(function () {
        //                 return quotaClient.requestQuota('test', { id: 1, id2: 2 });
        //             })
        //             .then(function () {

        //                 return quotaClient.requestQuota('test', { id: 1, id2: 1 })
        //                     .then(function () {
        //                         throw new Error('Expected OutOfQuotaError');
        //                     })
        //                     .catch(quota.OutOfQuotaError, function (err) {
        //                         return; // Expected
        //                     });

        //             })
        //             .then(function () {

        //                 return quotaClient.requestQuota('test', { id: 1, id2: 2 })
        //                     .then(function () {
        //                         throw new Error('Expected OutOfQuotaError');
        //                     })
        //                     .catch(quota.OutOfQuotaError, function (err) {
        //                         return; // Expected
        //                     });

        //             });

        //     });

        //     it('with 3 rules and complex scope (3)', function () {

        //         var quotaManager = new quota.Manager();
        //         quotaManager.addRule({
        //             limit: 2, // <-- This one will be out of quota
        //             throttling: 'limit-absolute'
        //         });
        //         quotaManager.addRule({
        //             limit: 3,
        //             throttling: 'limit-absolute',
        //             scope: 'id'
        //         });
        //         quotaManager.addRule({
        //             limit: 2,
        //             throttling: 'limit-absolute',
        //             scope: ['id', 'id2']
        //         });

        //         var quotaServer = new quota.Server();
        //         quotaServer.addManager('test', quotaManager);

        //         var quotaClient = new quota.Client(quotaServer);

        //         return Promise.resolve()
        //             .then(function () {
        //                 return quotaClient.requestQuota('test', { id: 1, id2: 1 });
        //             })
        //             .then(function () {
        //                 return quotaClient.requestQuota('test', { id: 1, id2: 2 });
        //             })
        //             .then(function () {

        //                 return quotaClient.requestQuota('test', { id: 1, id2: 1 })
        //                     .then(function () {
        //                         throw new Error('Expected OutOfQuotaError');
        //                     })
        //                     .catch(quota.OutOfQuotaError, function (err) {
        //                         return; // Expected
        //                     });

        //             })
        //             .then(function () {

        //                 return quotaClient.requestQuota('test', { id: 1, id2: 2 })
        //                     .then(function () {
        //                         throw new Error('Expected OutOfQuotaError');
        //                     })
        //                     .catch(quota.OutOfQuotaError, function (err) {
        //                         return; // Expected
        //                     });

        //             });

        //     });

        //     it('with 2 rules and 2 resources', function () {

        //         var quotaManager = new quota.Manager();
        //         quotaManager.addRule({
        //             limit: 1,
        //             throttling: 'limit-absolute',
        //             resource: 'resA'
        //         });
        //         quotaManager.addRule({
        //             limit: 3,
        //             throttling: 'limit-absolute',
        //             resource: 'resB'
        //         });

        //         var quotaServer = new quota.Server();
        //         quotaServer.addManager('test', quotaManager);

        //         var quotaClient = new quota.Client(quotaServer);

        //         return Promise.resolve()
        //             .then(function () {
        //                 return quotaClient.requestQuota('test', undefined, { 'resA': 1 });
        //             })
        //             .then(function () {

        //                 return quotaClient.requestQuota('test', undefined, { 'resA': 1 })
        //                     .then(function () {
        //                         throw new Error('Expected OutOfQuotaError');
        //                     })
        //                     .catch(quota.OutOfQuotaError, function (err) {
        //                         return; // Expected
        //                     });

        //             })
        //             .then(function () {
        //                 return quotaClient.requestQuota('test', undefined, { 'resB': 3 });
        //             })
        //             .then(function () {

        //                 return quotaClient.requestQuota('test', undefined, { 'resB': 1 })
        //                     .then(function () {
        //                         throw new Error('Expected OutOfQuotaError');
        //                     })
        //                     .catch(quota.OutOfQuotaError, function (err) {
        //                         return; // Expected
        //                     });

        //             });

        //     });

        //     it('with 2 rules and 2 resources using joint requests', function () {

        //         var quotaManager = new quota.Manager();
        //         quotaManager.addRule({
        //             limit: 2,
        //             throttling: 'limit-absolute',
        //             resource: 'resA'
        //         });
        //         quotaManager.addRule({
        //             limit: 5,
        //             throttling: 'limit-absolute',
        //             resource: 'resB'
        //         });

        //         var quotaServer = new quota.Server();
        //         quotaServer.addManager('test', quotaManager);

        //         var quotaClient = new quota.Client(quotaServer);

        //         return Promise.resolve()
        //             .then(function () {
        //                 return quotaClient.requestQuota('test', undefined, { 'resA': 1, 'resB': 1 });
        //             })
        //             .then(function () {
        //                 return quotaClient.requestQuota('test', undefined, { 'resA': 1, 'resB': 3 });
        //             })
        //             .then(function () {

        //                 return quotaClient.requestQuota('test', undefined, { 'resA': 1, 'resB': 1 })
        //                     .then(function () {
        //                         throw new Error('Expected OutOfQuotaError');
        //                     })
        //                     .catch(quota.OutOfQuotaError, function (err) {
        //                         return; // Expected
        //                     });

        //             })
        //             .then(function () {
        //                 return quotaClient.requestQuota('test', undefined, { 'resB': 1 });
        //             })
        //             .then(function () {

        //                 return quotaClient.requestQuota('test', undefined, { 'resB': 1 })
        //                     .then(function () {
        //                         throw new Error('Expected OutOfQuotaError');
        //                     })
        //                     .catch(quota.OutOfQuotaError, function (err) {
        //                         return; // Expected
        //                     });

        //             });

        //     });

        //     it('should limit all resources with a rule that defines none', function () {

        //         var quotaManager = new quota.Manager();
        //         quotaManager.addRule({
        //             limit: 2,
        //             throttling: 'limit-absolute',
        //             resource: 'resA'
        //         });
        //         quotaManager.addRule({
        //             limit: 2,
        //             throttling: 'limit-absolute',
        //             resource: 'resB'
        //         });
        //         quotaManager.addRule({
        //             limit: 1,
        //             throttling: 'limit-absolute'
        //         });

        //         var quotaServer = new quota.Server();
        //         quotaServer.addManager('test', quotaManager);

        //         var quotaClient = new quota.Client(quotaServer);

        //         return Promise.resolve()
        //             .then(function () {
        //                 return quotaClient.requestQuota('test', undefined, { 'resA': 1 });
        //             })
        //             .then(function () {

        //                 return quotaClient.requestQuota('test', undefined, { 'resA': 1 })
        //                     .then(function () {
        //                         throw new Error('Expected OutOfQuotaError');
        //                     })
        //                     .catch(quota.OutOfQuotaError, function (err) {
        //                         return; // Expected
        //                     });

        //             })
        //             .then(function () {

        //                 return quotaClient.requestQuota('test', undefined, { 'resB': 1 })
        //                     .then(function () {
        //                         throw new Error('Expected OutOfQuotaError');
        //                     })
        //                     .catch(quota.OutOfQuotaError, function (err) {
        //                         return; // Expected
        //                     });

        //             });

        //     });

        //     it('should not grant request for unknown resource', function () {

        //         var quotaManager = new quota.Manager();
        //         quotaManager.addRule({
        //             limit: 1,
        //             throttling: 'limit-absolute',
        //             resource: 'known'
        //         });

        //         var quotaServer = new quota.Server();
        //         quotaServer.addManager('test', quotaManager);

        //         var quotaClient = new quota.Client(quotaServer);

        //         return quotaClient.requestQuota('test', undefined, { unknownResource: 1 })
        //             .then(function () {
        //                 throw new Error('Expected Error');
        //             })
        //             .catch(function (err) {
        //                 return; // Expected
        //             });

        //     });

        //     it('should not grant request for empty resource object', function () {

        //         var quotaManager = new quota.Manager();
        //         quotaManager.addRule({
        //             limit: 1,
        //             throttling: 'limit-absolute',
        //             resource: 'known'
        //         });

        //         var quotaServer = new quota.Server();
        //         quotaServer.addManager('test', quotaManager);

        //         var quotaClient = new quota.Client(quotaServer);

        //         return quotaClient.requestQuota('test', undefined, { })
        //             .then(function () {
        //                 throw new Error('Expected Error');
        //             })
        //             .catch(function (err) {
        //                 return; // Expected
        //             });

        //     });

        //     it('should not grant request without explicitly selecting from multiple resources', function () {

        //         var quotaManager = new quota.Manager();
        //         quotaManager.addRule({
        //             limit: 1,
        //             throttling: 'limit-absolute',
        //             resource: 'res1'
        //         });
        //         quotaManager.addRule({
        //             limit: 1,
        //             throttling: 'limit-absolute',
        //             resource: 'res2'
        //         });

        //         var quotaServer = new quota.Server();
        //         quotaServer.addManager('test', quotaManager);

        //         var quotaClient = new quota.Client(quotaServer);

        //         return quotaClient.requestQuota('test')
        //             .then(function () {
        //                 throw new Error('Expected Error');
        //             })
        //             .catch(function (err) {
        //                 return; // Expected
        //             });

        //     });

        // });

        // describe('with two managers', function () {

        //     it('should find the right manager', function () {

        //         var quotaManager1 = new quota.Manager();
        //         quotaManager1.addRule({
        //             limit: 1,
        //             throttling: 'limit-absolute'
        //         });

        //         var quotaManager2 = new quota.Manager();
        //         quotaManager2.addRule({
        //             limit: 1,
        //             throttling: 'limit-absolute'
        //         });

        //         var quotaServer = new quota.Server();
        //         quotaServer.addManager('man1', quotaManager1);
        //         quotaServer.addManager('man2', quotaManager2);

        //         var quotaClient = new quota.Client(quotaServer);

        //         return Promise.resolve()
        //             .then(function () {
        //                 return quotaClient.requestQuota('man1');
        //             })
        //             .then(function () {
        //                 return quotaClient.requestQuota('man1')
        //                     .then(function () {
        //                         throw new Error('Expected OutOfQuotaError');
        //                     })
        //                     .catch(quota.OutOfQuotaError, function (err) {
        //                         return; // Expected
        //                     });
        //             })
        //             .then(function () {
        //                 return quotaClient.requestQuota('man2');
        //             })
        //             .then(function () {
        //                 return quotaClient.requestQuota('man2')
        //                     .then(function () {
        //                         throw new Error('Expected OutOfQuotaError');
        //                     })
        //                     .catch(quota.OutOfQuotaError, function (err) {
        //                         return; // Expected
        //                     });
        //             });

        //     });

        //     it('should find the right manager even after the first one got used', function () {

        //         var quotaManager1 = new quota.Manager();
        //         quotaManager1.addRule({
        //             limit: 1,
        //             throttling: 'limit-absolute'
        //         });

        //         var quotaServer = new quota.Server();
        //         quotaServer.addManager('man1', quotaManager1);

        //         var quotaClient = new quota.Client(quotaServer);

        //         return Promise.resolve()
        //             .then(function () {
        //                 return quotaClient.requestQuota('man1');
        //             })
        //             .then(function () {
        //                 return quotaClient.requestQuota('man1')
        //                     .then(function () {
        //                         throw new Error('Expected OutOfQuotaError');
        //                     })
        //                     .catch(quota.OutOfQuotaError, function (err) {
        //                         return; // Expected
        //                     });
        //             })
        //             .then(function () {

        //                 var quotaManager2 = new quota.Manager();
        //                 quotaManager2.addRule({
        //                     limit: 1,
        //                     throttling: 'limit-absolute'
        //                 });

        //                 quotaServer.addManager('man2', quotaManager2);

        //             })
        //             .then(function () {
        //                 return quotaClient.requestQuota('man2');
        //             })
        //             .then(function () {
        //                 return quotaClient.requestQuota('man2')
        //                     .then(function () {
        //                         throw new Error('Expected OutOfQuotaError');
        //                     })
        //                     .catch(quota.OutOfQuotaError, function (err) {
        //                         return; // Expected
        //                     });
        //             });

        //     });
    });
});
