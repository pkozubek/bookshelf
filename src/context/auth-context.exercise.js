import React from "react";
import { useAsync } from "utils/hooks";
import * as auth from 'auth-provider'
import { queryCache } from "react-query";
import { FullPageErrorFallback, FullPageSpinner } from "components/lib";
import { client } from "utils/api-client";

export const AuthContext = React.createContext(null);

export function useAuth() {
    const context = React.useContext(AuthContext)
    if (context === undefined) {
      throw new Error(`useAuth must be used within a AuthContext provider`)
    }
    return context
}

export function AuthProvider(props) {
  const {
    data: user,
    error,
    isLoading,
    isIdle,
    isError,
    isSuccess,
    run,
    setData,
    status,
  } = useAsync()

  React.useEffect(() => {
    run(getUser())
  }, [run])

  const login = form => auth.login(form).then(user => setData(user))
  const register = form => auth.register(form).then(user => setData(user))
  const logout = () => {
    auth.logout()
    queryCache.clear()
    setData(null)
  }

  if (isLoading || isIdle) {
    return <FullPageSpinner />
  }

  if (isError) {
    return <FullPageErrorFallback error={error} />
  }

  if (isSuccess) {
    const value = {user, login, register, logout}
    return <AuthContext.Provider value={value} {...props} />
  }

  throw new Error(`Unhandled status: ${status}`)
}

async function getUser() {
  let user = null

  const token = await auth.getToken()
  if (token) {
    const data = await client('me', {token})
    user = data.user
  }

  return user
}

export function useClient() {
  const {
    user: {token},
  } = useAuth()
  return React.useCallback(
    (endpoint, config) => client(endpoint, {...config, token}),
    [token],
  )
}