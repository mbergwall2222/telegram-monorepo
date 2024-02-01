const RequestV0Protocol = require('./request')

describe('Protocol > Requests > AddPartitionsToTxn > v0', () => {
  test('request', async () => {
    const { buffer } = await RequestV0Protocol({
      transactionalId: 'test-transactional-id',
      producerId: '1001',
      producerEpoch: 0,
      groupId: 'foobar',
    }).encode()

    expect(buffer).toEqual(Buffer.from(require('../fixtures/v0_request.json')))
  })
})
