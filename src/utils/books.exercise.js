import { queryCache, useQuery } from "react-query";
import { client } from "./api-client.exercise";
import bookPlaceholderSvg from 'assets/book-placeholder.svg'

const loadingBook = {
    title: 'Loading...',
    author: 'loading...',
    coverImageUrl: bookPlaceholderSvg,
    publisher: 'Loading Publishing',
    synopsis: 'Loading...',
    loadingBook: true,
  }

export function useBook(bookId, user) {
    const {data} = useQuery(['book', {bookId}], () => client(`books/${bookId}`, {token: user.token}).then(data => data.book))
  
    return data || loadingBook;
}

const loadingBooks = Array.from({length: 10}, (v, index) => ({
    id: `loading-book-${index}`,
    ...loadingBook,
}))

export function setQueryDataForBook(book) {
    queryCache.setQueryData(['book', {bookId: book.id}], book)
}

const getBookSearchConfig = (query, user) => ({
    queryKey: ['bookSearch', {query}],
    queryFn: () =>
      client(`books?query=${encodeURIComponent(query)}`, {
        token: user.token,
      }).then(data => data.books),
    config: {
       onSuccess(books) {
        for(const book of books) {
            setQueryDataForBook(book)
        }
       }
    }
  })

export function useBookSearch(query, user) {
    const result = useQuery(getBookSearchConfig(query, user))

    return {...result, books: result.data ?? loadingBooks }
}

export async function refetchBookSearchQuery(user) {
    queryCache.removeQueries('bookSearch')
    await queryCache.prefetchQuery(getBookSearchConfig('', user))
}