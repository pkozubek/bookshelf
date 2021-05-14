import * as auth from 'auth-provider'
const apiURL = process.env.REACT_APP_API_URL

function client(endpoint, {data, token, headers: customHeaders, ...customConfig} = {}) {
  const config = {
    headers: {
      Authorization: token ? `Bearer ${token}` : undefined,
      'Content-Type': data ? 'application/json' : undefined,
      ...customHeaders,
    },
    method: data ? 'POST' : 'GET',
    body: data ? JSON.stringify(data) : undefined,
    ...customConfig,
  }

  return window.fetch(`${apiURL}/${endpoint}`, config).then(async response => {
    const data = await response.json()
    if (response.ok) {
      return data
    } else if(response.status === 401) {
      await auth.logout()
      window.location.assign(window.location)
      return Promise.reject({message: 'Please re-authenticate.'})
    } else {
      return Promise.reject(data)
    }
  })
}

export {client}
