import { describe, expect, it } from 'vitest'
import { diff } from '.'

describe('diff', () => {
  it('exported', () => {
    expect(diff(1, 2)).toEqual(1)

    const value1 = { a: 1 }
    expect(diff(value1, 2)).toEqual(value1)
    expect(diff(value1, value1)).toEqual(undefined)

    expect(diff({ a: 1, b: { b1: 2 } }, 2)).toEqual({ a: 1, b: { b1: 2 } })
    expect(diff({ a: 1, b: { b1: 2 } }, { a: 1, b: { b1: 3 } })).toEqual({ b: { b1: 2 } })
    expect(diff({ a: 1, b: { b1: 2 }, c: [1, 2, 3] }, { a: 1, b: { b1: 3 } })).toEqual({ b: { b1: 2 }, c: [1, 2, 3] })
    expect(diff({
      a: 1,
      b: { b1: 2 },
      c: [1, { d: 1, e: [1, 2] }, 3],
    }, {
      a: 1,
      b: { b1: 3 },
    })).toEqual({
      b: { b1: 2 },
      c: [1, { d: 1, e: [1, 2] }, 3],
    })
    expect(diff({
      a: 1,
      b: { b1: 2 },
      c: [1, { d: 1, e: [1, 2] }, 3],
    }, {
      a: 1,
      b: { b1: 3 },
      c: [1, { d: 1, e: [1] }, 3],
    })).toEqual({
      b: { b1: 2 },
      c: [{ e: [2] }],
    })

    expect(diff([1, 2, 3], { a: 1, b: { b1: 3 } })).toEqual([1, 2, 3])
    expect(diff([1, 2, 3], [1, 2, 3])).toEqual(undefined)
    expect(diff([1, 3, 3], [1, 2, 3, 4])).toEqual([3])
    expect(diff([1, { a: 1 }, 3], [1, 2, 3, 4])).toEqual([{ a: 1 }])

    expect(diff({
      nickname: 'asdasd',
      username: 'admin',
      email: 'admin@example.com',
      bio: null,
    }, {
      id: 1,
      createdAt: '2025-07-02T06:51:57.537037Z',
      updatedAt: '2025-07-03T02:24:34.348432Z',
      nickname: null,
      bio: null,
      username: 'admin',
      email: 'admin@example.com',
      role: 'admin',
    })).toEqual({ nickname: 'asdasd' })
  })
})
