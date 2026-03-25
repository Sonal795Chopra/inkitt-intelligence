const SESSION_KEY = 'inkitt_anthropic_key'

export function getApiKey(): string | null {
  return sessionStorage.getItem(SESSION_KEY)
}

export function setApiKey(key: string) {
  sessionStorage.setItem(SESSION_KEY, key.trim())
}

export function clearApiKey() {
  sessionStorage.removeItem(SESSION_KEY)
}
