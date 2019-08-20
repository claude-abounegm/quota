'use strict';

const _ = require('lodash');

const { expect } = require('chai');

const quota = require('../../../lib');

describe('Queueing Fifo', function() {
    it('1 request', function() {
        const quotaServer = new quota.Server({
            test: {
                rules: [
                    {
                        limit: 1,
                        throttling: 'limit-concurrency',
                        queueing: 'fifo'
                    }
                ]
            }
        });

        const quotaClient = new quota.Client(quotaServer);

        return Promise.resolve()
            .then(function() {
                return quotaClient.requestQuota('test').then(function(grant) {
                    return grant;
                });
            })
            .then(function(firstGrant) {
                setTimeout(function() {
                    firstGrant.dismiss();
                }, 10);

                return quotaClient.requestQuota('test').then(function(grant) {
                    grant.dismiss();
                });
            });
    });

    it('2 requests', function() {
        const quotaServer = new quota.Server({
            test: {
                rules: [
                    {
                        limit: 2,
                        throttling: 'limit-concurrency',
                        queueing: 'fifo'
                    }
                ]
            }
        });

        const quotaClient = new quota.Client(quotaServer);

        let grant1,
            grant2,
            counter = 0;

        return Promise.resolve()
            .then(function() {
                return quotaClient.requestQuota('test').then(function(grant) {
                    grant1 = grant;
                });
            })
            .then(function() {
                return quotaClient.requestQuota('test').then(function(grant) {
                    grant2 = grant;
                });
            })
            .then(function(firstGrant) {
                setTimeout(function() {
                    grant1.dismiss();
                }, 10);

                return Promise.all([
                    quotaClient.requestQuota('test').then(function(grant) {
                        counter += 1;
                        expect(counter).to.eql(1);
                        grant.dismiss();
                    }),
                    quotaClient.requestQuota('test').then(function(grant) {
                        counter += 1;
                        expect(counter).to.eql(2);
                        grant.dismiss();
                    })
                ]);
            })
            .then(function() {
                grant2.dismiss();
            });
    });

    it('waiting again for second resource', async function() {
        const quotaServer = new quota.Server({
            test: {
                rules: [
                    {
                        limit: 1,
                        throttling: 'limit-concurrency',
                        queueing: 'fifo',
                        resource: 'res1'
                    },
                    {
                        limit: 1,
                        throttling: 'limit-concurrency',
                        queueing: 'fifo',
                        resource: 'res2'
                    }
                ]
            }
        });

        const quotaClient = new quota.Client(quotaServer);

        const grant1 = await quotaClient.requestQuota(
            'test',
            {},
            {
                res1: 1
            }
        );

        const grant2 = await quotaClient.requestQuota(
            'test',
            {},
            {
                res2: 1
            }
        );

        setTimeout(() => {
            grant1.dismiss();
        }, 10);

        setTimeout(() => {
            grant2.dismiss();
        }, 20);

        await Promise.all([
            quotaClient
                .requestQuota(
                    'test',
                    {},
                    {
                        res1: 1,
                        res2: 1
                    }
                )
                .then(grant => {
                    grant.dismiss();
                }),
            quotaClient
                .requestQuota(
                    'test',
                    {},
                    {
                        res1: 1
                    }
                )
                .then(grant => {
                    grant.dismiss();
                })
        ]);
    });

    it('no overtaking', function() {
        const quotaServer = new quota.Server({
            test: {
                rules: [
                    {
                        limit: 1,
                        throttling: 'limit-concurrency',
                        queueing: 'fifo'
                    }
                ]
            }
        });

        const quotaClient = new quota.Client(quotaServer);

        let grant1,
            counter = 0;

        return Promise.resolve()
            .then(function() {
                return quotaClient
                    .requestQuota('test', undefined, 0.5)
                    .then(function(grant) {
                        grant1 = grant;
                    });
            })
            .then(function() {
                setTimeout(function() {
                    counter += 1;
                    grant1.dismiss();
                }, 10);

                return Promise.all([
                    quotaClient
                        .requestQuota('test', undefined, 1)
                        .then(function(grant) {
                            counter += 1;
                            expect(counter).to.eql(2);
                            grant.dismiss();
                        }),
                    quotaClient
                        .requestQuota('test', undefined, 0.5)
                        .then(function(grant) {
                            counter += 1;
                            expect(counter).to.eql(3);
                            grant.dismiss();
                        })
                ]);
            });
    });

    it('no overtaking when not enough available at first', async function() {
        const quotaServer = new quota.Server({
            test: {
                rules: [
                    {
                        limit: 3,
                        throttling: 'limit-concurrency',
                        queueing: 'fifo'
                    }
                ]
            }
        });

        const quotaClient = new quota.Client(quotaServer);

        let counter = 0;

        const grant1 = await quotaClient.requestQuota('test');
        const grant2 = await quotaClient.requestQuota('test');
        const grant3 = await quotaClient.requestQuota('test');
        setTimeout(function() {
            ++counter;
            grant1.dismiss();
        });

        setTimeout(function() {
            ++counter;
            grant2.dismiss();
        }, 5);

        setTimeout(function() {
            ++counter;
            grant3.dismiss();
        }, 10);

        return Promise.all([
            quotaClient
                .requestQuota('test', undefined, 2, {
                    maxWait: 10
                })
                .then(function(grant) {
                    counter += 1;
                    expect(counter).to.eql(3);
                    grant.dismiss();
                }),
            quotaClient
                .requestQuota('test', undefined, 1, {
                    maxWait: 10
                })
                .then(function(grant) {
                    counter += 1;
                    expect(counter).to.eql(4);
                    grant.dismiss();
                })
        ]);
    });

    it('granting as many as possible when more available', function() {
        const quotaServer = new quota.Server({
            test: {
                rules: [
                    {
                        limit: 2,
                        throttling: 'limit-concurrency',
                        queueing: 'fifo'
                    }
                ]
            }
        });

        const quotaClient = new quota.Client(quotaServer);

        return quotaClient
            .requestQuota('test', undefined, 2)
            .then(function(firstGrant) {
                setImmediate(function() {
                    firstGrant.dismiss();
                });

                let errors = 0;

                return Promise.all([
                    quotaClient
                        .requestQuota('test', undefined, undefined, {
                            maxWait: 10
                        })
                        .catch(e => ++errors),
                    quotaClient
                        .requestQuota('test', undefined, undefined, {
                            maxWait: 10
                        })
                        .catch(e => ++errors),
                    quotaClient
                        .requestQuota('test', undefined, undefined, {
                            maxWait: 10
                        })
                        .catch(e => ++errors)
                ]).then(() => {
                    console.log(errors);
                    if (errors !== 1) {
                        throw new Error();
                    }
                });
            });
    });

    it('granting second in line after first in line timed out', function() {
        const quotaServer = new quota.Server({
            test: {
                rules: [
                    {
                        limit: 2,
                        throttling: 'limit-concurrency',
                        queueing: 'fifo'
                    }
                ]
            }
        });

        const quotaClient = new quota.Client(quotaServer);

        let grant1,
            counter = 0;

        return Promise.resolve()
            .then(function() {
                return quotaClient.requestQuota('test').then(function(grant) {
                    grant1 = grant;
                });
            })
            .then(function() {
                setTimeout(function() {
                    counter += 1;
                    grant1.dismiss();
                }, 10);

                return Promise.all([
                    quotaClient
                        .requestQuota('test', undefined, 2, {
                            maxWait: 5
                        })
                        .then(function() {
                            throw new Error('Expected OutOfQuotaError');
                        })
                        .catch(function(err) {
                            if (!(err instanceof quota.OutOfQuotaError)) {
                                throw e;
                            }
                        }),
                    quotaClient.requestQuota('test').then(function(grant) {
                        counter += 1;
                        expect(counter).to.eql(1);
                        grant.dismiss();
                    })
                ]);
            });
    });
});
