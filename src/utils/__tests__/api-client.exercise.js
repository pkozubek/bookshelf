import {queryCache} from 'react-query'
import * as auth from 'auth-provider'
import {server, rest} from 'test/server'
import {client} from '../api-client'

const apiURL = process.env.REACT_APP_API_URL

beforeAll(() => {
  server.listen()
})

afterEach(() => {
  server.resetHandlers()
})

afterAll(() => {
  server.close()
})

test('calls fetch at the endpoint with the arguments for GET requests', async () => {
  const endpoint = 'test-endpoint'
  const mockResult = {mockValue: 'VALUE'}
  server.use(
    rest.get(`${apiURL}/${endpoint}`, async (req, res, ctx) => {
      return res(ctx.json(mockResult))
    }),
  )

  const result = await client(endpoint)
  expect(result).toEqual(mockResult)
})

test('adds auth token when a token is provided', async () => {
  const token = 'FAKE_TOKEN'

  let request
  const endpoint = 'test-endpoint'
  const mockResult = {mockValue: 'VALUE'}
  server.use(
    rest.get(`${apiURL}/${endpoint}`, async (req, res, ctx) => {
      request = req
      return res(ctx.json(mockResult))
    }),
  )

  await client(endpoint, {token})

  expect(request.headers.get('Authorization')).toBe(`Bearer ${token}`)
})

test('allows for config overrides', async () => {
  const config = {
    token: 'FAKE_TOKEN',
    headers: {
      'Content-Type': 'test',
    },
  }

  let request
  const endpoint = 'test-endpoint'
  const mockResult = {mockValue: 'VALUE'}
  server.use(
    rest.get(`${apiURL}/${endpoint}`, async (req, res, ctx) => {
      request = req
      return res(ctx.json(mockResult))
    }),
  )

  await client(endpoint, config)
  expect(request.headers.get('Content-Type')).toBe(
    config.headers['Content-Type'],
  )
})

test('when data is provided, it is stringified and the method defaults to POST', async () => {
  const endpoint = 'test-endpoint'

  server.use(
    rest.post(`${apiURL}/${endpoint}`, async (req, res, ctx) => {
      return res(ctx.json(req.body))
    }),
  )

  const data = {
    test: 'test',
  }

  const result = await client(endpoint, {data})
  expect(result).toEqual(data)
})

jest.mock('react-query')
jest.mock('auth-provider')

describe('extra1', () => {
  const endpoint = 'test-endpoint'
  const error = {
    message: 'Test error',
  }

  test('response.ok is false', async () => {
    server.use(
      rest.get(`${apiURL}/${endpoint}`, async (req, res, ctx) => {
        return res(ctx.status(400), ctx.json(error))
      }),
    )

    expect(client(endpoint)).rejects.toEqual(error)
  })

  test('logout on failure', async () => {
  const mockResult = {mockValue: 'VALUE'}
  server.use(
    rest.get(`${apiURL}/${endpoint}`, async (req, res, ctx) => {
      return res(ctx.status(401), ctx.json(mockResult))
    }),
  )

    const error = await client(endpoint).catch(e => e)
    expect(error.message).toMatchInlineSnapshot(`"Please re-authenticate."`)
  
    expect(queryCache.clear).toHaveBeenCalledTimes(1)
    expect(auth.logout).toHaveBeenCalledTimes(1)
  })
})
