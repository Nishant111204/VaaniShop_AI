/**
 * Hands a recording or typed description from the home page hero to the create
 * page without routing it through history state. Read once, then cleared.
 */
let pending = null

export function setPendingInput(input) {
  pending = input
}

export function takePendingInput() {
  const p = pending
  pending = null
  return p
}
