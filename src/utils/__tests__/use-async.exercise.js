import {renderHook, act} from '@testing-library/react-hooks'
import {useAsync} from '../hooks'

beforeEach(() => {
  jest.spyOn(console, 'error')
})

afterEach(() => {
  console.error.mockRestore()
})

function deferred() {
  let resolve, reject
  const promise = new Promise((res, rej) => {
    resolve = res
    reject = rej
  })
  return {promise, resolve, reject}
}

function getAsyncState(overrides) {
  return {
    data: null,
    isIdle: true,
    isLoading: false,
    isError: false,
    isSuccess: false,

    error: null,
    status: 'idle',
    run: expect.any(Function),
    reset: expect.any(Function),
    setData: expect.any(Function),
    setError: expect.any(Function),
    ...overrides,
  }
}

const idleState = getAsyncState()
const pendingState = getAsyncState({
  status: 'pending',
  isIdle: false,
  isLoading: true,
})
const resolvedState = getAsyncState({
  status: 'resolved',
  isIdle: false,
  isSuccess: true,
})
const rejectedState = getAsyncState({
  status: 'rejected',
  isIdle: false,
  isError: true,
})

test('calling run with a promise which resolves', async () => {
    const {promise, resolve} = deferred()
    const {result} = renderHook(() => useAsync())
    
    const resolvedValue = {
      test: 'test'
    }

    expect(result.current).toEqual(idleState)

    let p;
    act(() => {
      p = result.current.run(promise);
    })

    expect(result.current).toEqual(pendingState)

    await act(async () => {
      resolve(resolvedValue)
      await p
    })

    expect(result.current).toEqual({
      ...resolvedState,
      data: resolvedValue,
    })

  act(() => {
    result.current.reset()
  })

  expect(result.current).toEqual(idleState)
})

test('calling run with a promise which rejects', async () => {
  const {promise, reject} = deferred()
  const {result} = renderHook(() => useAsync())
  
  expect(result.current).toEqual(idleState)

  let p;
  act(() => {
    p = result.current.run(promise)
  })

  expect(result.current).toEqual(pendingState)

  const rejectedValue = Symbol('rejected value')
  await act(async () => {
    reject(rejectedValue)
    await p.catch(() => {
    })
  })

  expect(result.current).toEqual({
    ...rejectedState,
    error: rejectedValue,
  })
})

test('can specify an initial state', async () => {
  const predefinedData = {
    status: 'resolved',
    data: {
      test: 'test'
    }
  }

  const {result} = renderHook(() => useAsync(predefinedData))

  expect(result.current).toEqual({
    ...resolvedState,
    data: predefinedData.data,
    status: predefinedData.status,
  })
})

test('can set the data', () => {
  const data = {
      test: 'test'
  }

  const {result} = renderHook(() => useAsync())
  act(() => {
    result.current.setData(data)
  })
  expect(result.current).toEqual({
    ...resolvedState,
    data: data,
  })
})

test('can set the error', () => {
  const rejectedValue = Symbol('rejected value')
  const {result} = renderHook(() => useAsync())
  act(() => {
    result.current.setError(rejectedValue)
  })
  expect(result.current).toEqual({
    ...rejectedState,
    error: rejectedValue,
  })
})

test('No state updates happen if the component is unmounted while pending', async () => {
  const {promise, resolve} = deferred()
  const {result, unmount} = renderHook(() => useAsync())
  let p
  act(() => {
    p = result.current.run(promise)
  })
  unmount()
  await act(async () => {
    resolve()
    await p
  })
  expect(console.error).not.toHaveBeenCalled()
})

test('calling "run" without a promise results in an early error', () => {
  const {result} = renderHook(() => useAsync())

  expect(() => result.current.run({})).toThrowError()
})
