import * as React from 'react'
import {render, screen, waitForElementToBeRemoved} from '@testing-library/react'
import {queryCache} from 'react-query'
import {buildUser, buildBook, buildListItem} from 'test/generate'
import * as auth from 'auth-provider'
import {AppProviders} from 'context'
import {App} from 'app'
import * as usersDB from 'test/data/users'
import * as booksDB from 'test/data/books'
import * as listItemsDB from 'test/data/list-items'
import userEvent from '@testing-library/user-event'
import {formatDate} from 'utils/misc'
import faker from 'faker'
import {server, rest} from 'test/server'

const apiURL = process.env.REACT_APP_API_URL
jest.mock('components/profiler')
beforeEach(() => jest.useRealTimers())

afterEach(async () => {
  queryCache.clear()
  await Promise.all([
    auth.logout(),
    usersDB.reset(),
    booksDB.reset(),
    listItemsDB.reset(),
  ])
})

async function renderBookScreen({user, book, listItem} = {}) {
  if (user === undefined) {
    user = await loginAsUser()
  }
  if (book === undefined) {
    book = await booksDB.create(buildBook())
  }
  if (listItem === undefined) {
    listItem = await listItemsDB.create(buildListItem({owner: user, book}))
  }
  const route = `/book/${book.id}`

  window.history.pushState({}, 'page title', route)

  const utils = render(<App />, {wrapper: AppProviders})

  await waitForLoadingToFinish()

  return {
    ...utils,
    book,
    user,
    listItem,
  }
}

const loginAsUser = async userProperties => {
  const user = buildUser(userProperties)
  await usersDB.create(user)
  const authUser = await usersDB.authenticate(user)
  window.localStorage.setItem(auth.localStorageKey, authUser.token)

  return authUser
}

const waitForLoadingToFinish = () => {
  return waitForElementToBeRemoved(() => [
    ...screen.queryAllByLabelText(/loading/i),
    ...screen.queryAllByText(/loading/i),
  ])
}

test('renders all the book information', async () => {
  const {book} = await renderBookScreen({listItem: null})

  expect(screen.queryByLabelText(/loading/i)).toBe(null)
  expect(screen.getByRole('heading', {name: book.title})).toBeInTheDocument()
  expect(screen.getByText(book.author)).toBeInTheDocument()
  expect(screen.getByText(book.publisher)).toBeInTheDocument()
  expect(screen.getByText(book.synopsis)).toBeInTheDocument()
  expect(screen.getByRole('img', {name: /book cover/i})).toHaveAttribute(
    'src',
    book.coverImageUrl,
  )

  expect(screen.getByRole('button', {name: /add to list/i})).toBeInTheDocument()
  expect(
    screen.queryByRole('button', {name: /remove from list/i}),
  ).not.toBeInTheDocument()
})

test('can create a list item for the book', async () => {
  await renderBookScreen({listItem: null})

  userEvent.click(screen.getByRole('button', {name: /add to list/i}))
  expect(screen.getByRole('button', {name: /add to list/i})).toBeDisabled()
  expect(
    screen.queryByRole('button', {name: /mark as read/i}),
  ).not.toBeInTheDocument()

  await waitForLoadingToFinish()

  expect(
    screen.queryByRole('button', {name: /remove from list/i}),
  ).toBeInTheDocument()
  expect(
    screen.queryByRole('button', {name: /mark as read/i}),
  ).toBeInTheDocument()

  expect(screen.queryByRole('radio', {name: /star/i})).not.toBeInTheDocument()
  const startDateNode = screen.getByLabelText(/start date/i)
  expect(startDateNode).toHaveTextContent(formatDate(Date.now()))
})

test('can mark a list item as read', async () => {
  const {listItem} = await renderBookScreen()

  // set the listItem to be unread in the DB
  await listItemsDB.update(listItem.id, {finishDate: null})

  const markAsRead = screen.getByRole('button', {name: /mark as read/i})
  expect(markAsRead).toBeInTheDocument()
  expect(markAsRead).toBeInTheDocument()

  userEvent.click(markAsRead)
  expect(markAsRead).toBeDisabled()
  await waitForLoadingToFinish()

  expect(
    screen.getByRole('button', {name: /mark as unread/i}),
  ).toBeInTheDocument()
  expect(screen.getAllByRole('radio', {name: /star/i})).toHaveLength(5)

  const startAndFinishDateNode = screen.getByLabelText(/start and finish date/i)
  expect(startAndFinishDateNode).toHaveTextContent(
    `${formatDate(listItem.startDate)} — ${formatDate(Date.now())}`,
  )
})

test('can edit a note', async () => {
  jest.useFakeTimers()
  const {listItem} = await renderBookScreen()

  const markAsRead = screen.getByRole('button', {name: /mark as read/i})
  expect(markAsRead).toBeInTheDocument()
  expect(markAsRead).toBeInTheDocument()

  const newNotes = faker.lorem.words()
  const notesTextarea = screen.getByRole('textbox', {name: /notes/i})
  userEvent.clear(notesTextarea)
  userEvent.type(notesTextarea, newNotes)

  await screen.findByLabelText(/loading/i)
  await waitForLoadingToFinish()

  expect(screen.getByRole('textbox', {name: /notes/i})).toHaveTextContent(
    newNotes,
  )
  expect(await listItemsDB.read(listItem.id)).toMatchObject({
    notes: newNotes,
  })
})

describe('console mock', () => {
  beforeAll(() => {
    jest
      .spyOn(console, 'error')
      .mockImplementation(() => console.log('well known error\n'))
  })

  afterAll(() => {
    console.error.mockRestore()
  })

  test('shows an error message when the book fails to load', async () => {
    jest.useFakeTimers()
    const book = {id: 'not_existing'}
    await renderBookScreen({listItem: null, book})
    expect(screen.getByRole('alert').textContent).toMatchInlineSnapshot(
      `"There was an error: Book not found"`,
    )
  })

  test('note update failures are displayed', async () => {
    jest.useFakeTimers()
    const {listItem} = await renderBookScreen()

    const markAsRead = screen.getByRole('button', {name: /mark as read/i})
    expect(markAsRead).toBeInTheDocument()
    expect(markAsRead).toBeInTheDocument()

    const newNotes = faker.lorem.words()
    const notesTextarea = screen.getByRole('textbox', {name: /notes/i})

    const testErrorMessage = '__test_error_message__'
    server.use(
      rest.put(`${apiURL}/list-items/:listItemId`, async (req, res, ctx) => {
        return res(
          ctx.status(400),
          ctx.json({status: 400, message: testErrorMessage}),
        )
      }),
    )

    userEvent.clear(notesTextarea)
    userEvent.type(notesTextarea, newNotes)

    await screen.findByLabelText(/loading/i)
    await waitForLoadingToFinish()

    expect(screen.getByRole('alert').textContent).toMatchInlineSnapshot(
      `"There was an error: __test_error_message__"`,
    )
    expect(await listItemsDB.read(listItem.id)).not.toMatchObject({
      notes: newNotes,
    })
  })
})
