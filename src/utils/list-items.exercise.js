import { queryCache, useMutation, useQuery } from "react-query";
import { client } from "./api-client.exercise";

export function useListItems(user){
    const {data} = useQuery({
        queryKey: 'list-items',
        queryFn: () =>
          client(`list-items`, {token: user.token})
    })

    const {listItems} = data || {}
    return listItems ?? [];
}

export function useListItem(bookId, user) {
    const listItems = useListItems(user)
    const listItem = listItems?.find(li => li.bookId === bookId) ?? null;
    return listItem;
}

export function useUpdateListItem(user) {
    return useMutation(
        (updateData) => client(`list-items/${updateData.id}`, { token: user.token, data: updateData, method: 'PUT'}),
        {onSettled: () => queryCache.invalidateQueries('list-items')},
    )
}

export function useCreateListItem(user) {
    return useMutation(
        ({bookId}) => client(`list-items`, {data: {bookId}, token: user.token}),
        {onSettled: () => queryCache.invalidateQueries('list-items')},
    )
}

export function useRemoveListItem(user) {
    return useMutation(
        ({id}) => client(`list-items/${id}`, { token: user.token, method: 'DELETE'}),
        {onSettled: () => queryCache.invalidateQueries('list-items')},
    )
}