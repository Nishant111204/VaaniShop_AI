import React, { useEffect, useRef } from 'react'

const supportsClosedBy = typeof HTMLDialogElement !== 'undefined' && 'closedBy' in HTMLDialogElement.prototype

/**
 * Native modal <dialog>: the browser handles focus, Esc, the back gesture and the
 * inert page. On phones it docks to the bottom as a sheet (see dialog.sheet in styles.css).
 */
export default function Modal({ open, onClose, labelledBy, children }) {
  const ref = useRef(null)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) {
      dialog.showModal()
      dialog.querySelector('[data-autofocus]')?.focus()
    } else if (!open && dialog.open) {
      dialog.close()
    }
  }, [open])

  useEffect(() => {
    const dialog = ref.current
    const handleClose = () => onCloseRef.current?.()
    dialog.addEventListener('close', handleClose)
    if (supportsClosedBy) return () => dialog.removeEventListener('close', handleClose)

    // Light dismiss where closedby="any" is unsupported (Safari). Uses the pointer
    // position, since the <dialog> itself is the target for clicks on its padding.
    const outside = e => {
      const r = dialog.getBoundingClientRect()
      return e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom
    }
    let pressedOutside = false
    const down = e => { pressedOutside = outside(e) }
    const up = e => { if (pressedOutside && outside(e)) dialog.close() }
    dialog.addEventListener('pointerdown', down)
    dialog.addEventListener('pointerup', up)
    return () => {
      dialog.removeEventListener('close', handleClose)
      dialog.removeEventListener('pointerdown', down)
      dialog.removeEventListener('pointerup', up)
    }
  }, [])

  return (
    <dialog ref={ref} className="sheet" closedby="any" aria-labelledby={labelledBy}>
      {open && children}
    </dialog>
  )
}
