import test from 'node:test'
import assert from 'node:assert/strict'
import { NextRequest } from 'next/server'
import { POST as placeOrder } from '../app/api/orders/route'
import { POST as pay } from '../app/api/orders/[id]/payment/route'
import { POST as feedback } from '../app/api/orders/[id]/feedback/route'
import { PATCH as changeOrder } from '../app/api/orders/[id]/route'
import { POST as identify } from '../app/api/customers/route'
import { apiError, AppError } from '../lib/errors'
import { cartLines, ratingScore } from '../lib/validation'
import { nextId } from '../lib/ids'

function request(body: string) {
  return new NextRequest('http://localhost/api/orders', {
    method: 'POST', headers: { 'content-type': 'application/json' }, body,
  })
}
const params = { params: Promise.resolve({ id: 'ORD_TEST' }) }

for (const body of ['{', 'null', '[]', '42']) {
  test(`invalid JSON object ${body} returns 400`, async () => {
    const response = await placeOrder(request(body))
    assert.equal(response.status, 400)
    assert.equal(typeof (await response.json()).error, 'string')
  })
}
for (const cart of [null, {}, [], [{ menuItemId: 'MIT001', quantity: 1.5 }],
  [{ menuItemId: 'MIT001', quantity: '2' }], [{ menuItemId: 'MIT001', quantity: 0 }]]) {
  test(`invalid cart ${JSON.stringify(cart)} returns 400 without a database`, async () => {
    const response = await placeOrder(request(JSON.stringify({ customerId: 'CUS_TEST', cart })))
    assert.equal(response.status, 400)
  })
}
test('missing or nonnumeric payment amount returns 400', async () => {
  for (const amount of [null, '14700', undefined]) {
    assert.equal((await pay(request(JSON.stringify({ amount })), params)).status, 400)
  }
})
test('incomplete feedback is rejected before a database write', async () => {
  const response = await feedback(request(JSON.stringify({ customerId: 'CUS_TEST', complaintType: 'Delay', description: 'Late', ratingScore: 1.5 })), params)
  assert.equal(response.status, 400)
})
test('missing first name returns 400 rather than a trim runtime exception', async () => {
  const response = await identify(request('{}'))
  assert.equal(response.status, 400)
  assert.equal((await response.json()).error, 'First name is required')
})
test('invalid cancellation role and unknown action return 400', async () => {
  assert.equal((await changeOrder(request('{"action":"cancel","cancelledBy":"admin"}'), params)).status, 400)
  assert.equal((await changeOrder(request('{"action":"anything"}'), params)).status, 400)
})
test('malformed assignment is rejected before the database call', async () => {
  assert.equal((await changeOrder(request('{"action":"assign","orderItemId":"OIT_TEST"}'), params)).status, 400)
})
test('SQL not-found and conflict errors have distinct HTTP status codes', async () => {
  assert.equal(apiError({ code: 'P0002', message: 'Order not found' }).status, 404)
  assert.equal(apiError({ code: 'P0001', message: 'Only pending orders can be cancelled' }).status, 409)
  assert.equal(apiError({ code: '22023', message: 'Wrong amount' }).status, 400)
  assert.equal(apiError(new AppError(400, 'Invalid JSON')).status, 400)
})
test('database details are not returned in unexpected error responses', async () => {
  const log = console.error
  console.error = () => {}
  try {
    const response = apiError({ code: 'XX000', message: 'private database internals' })
    assert.equal(response.status, 500)
    assert.doesNotMatch(JSON.stringify(await response.json()), /private database internals/)
  } finally { console.error = log }
})
test('quantities and ratings reject non-finite and fractional numbers', () => {
  for (const value of [NaN, Infinity, -Infinity, 1.1, null, '5']) {
    assert.throws(() => ratingScore(value))
  }
  assert.deepEqual(cartLines([{ menuItemId: 'MIT001', quantity: 2 }]), [{ menuItemId: 'MIT001', quantity: 2 }])
})
test('IDs remain unique beyond the old three-digit sequence range', async () => {
  const ids = await Promise.all(Array.from({ length: 1100 }, () => nextId('CUS')))
  assert.equal(new Set(ids).size, 1100)
  assert.ok(ids.every(id => /^CUS[0-9a-f]{32}$/.test(id)))
})
