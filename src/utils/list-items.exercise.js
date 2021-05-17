import { queryCache, useMutation, useQuery } from "react-query";
import { client } from "./api-client.exercise";
import { setQueryDataForBook } from "./books.exercise";

export function useListItems(user){
    const {data} = useQuery({
        queryKey: 'list-items',
        queryFn: () =>
          client(`list-items`, {token: user.token}),
        config: {
            onSuccess(lists = {}) {
                const {listItems} = lists;
                for(const list of listItems) {
                    setQueryDataForBook(list.book)
                }
            }
        }
    })

    const {listItems} = data || {}
    return listItems ?? [];
}

export function useListItem(bookId, user) {
    const listItems = useListItems(user)
    const listItem = listItems?.find(li => li.bookId === bookId) ?? null;
    return listItem;
}

const defaultMutationOptions = {
    onError: (err, variables, recover) =>
    typeof recover === 'function' ? recover() : null,
    onSettled: () => queryCache.invalidateQueries('list-items'),

}

export function useUpdateListItem(user, options) {
    return useMutation(
        (updateData) => client(`list-items/${updateData.id}`, { token: user.token, data: updateData, method: 'PUT'}),
        {onMutate(newItem) {
            const previousItems = queryCache.getQueryData('list-items')
    
            queryCache.setQueryData('list-items', old => {
              return old.map(item => {
                return item.id === newItem.id ? {...item, ...newItem} : item
              })
            })
    
            return () => queryCache.setQueryData('list-items', previousItems)
        },...defaultMutationOptions, ...options},
    )
}

export function useCreateListItem(user, options) {
    return useMutation(
        ({bookId}) => client(`list-items`, {data: {bookId}, token: user.token}),
        {...defaultMutationOptions, ...options},
    )
}

export function useRemoveListItem(user, options) {
    return useMutation(
        ({id}) => client(`list-items/${id}`, { token: user.token, method: 'DELETE'}),
        {onMutate(removedItem) {
            const previousItems = queryCache.getQueryData('list-items')
    
            queryCache.setQueryData('list-items', old => {
              return old.filter(listItem => listItem.id !== removedItem.id)
            })
    
            return () => queryCache.setQueryData('list-items', previousItems)
        },...defaultMutationOptions, ...options},
    )
}