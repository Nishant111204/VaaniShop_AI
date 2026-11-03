import React from 'react'

/**
 * A phone outline for previewing a shop page at the size customers will see it.
 * With `responsive`, small screens get a plain rounded window instead, since a
 * phone drawn inside a phone just wastes space.
 */
export default function PhoneFrame({ children, responsive = false, className = '', screenClassName = 'h-[600px] sm:h-[660px]' }) {
  if (responsive) {
    return (
      <div className={`relative mx-auto w-full max-w-[440px] overflow-hidden rounded-[28px] border border-neel-100 bg-white lg:w-[340px] lg:rounded-[46px] lg:border-0 lg:bg-neel-900 lg:p-[10px] lg:shadow-phone ${className}`}>
        <div className="absolute left-1/2 top-[10px] z-20 hidden h-6 w-28 -translate-x-1/2 rounded-b-2xl bg-neel-900 lg:block" aria-hidden="true" />
        <div className="relative h-[68vh] overflow-y-auto overflow-x-hidden bg-white scrollbar-none lg:h-[660px] lg:rounded-[36px]">
          {children}
        </div>
      </div>
    )
  }
  return (
    <div className={`relative mx-auto w-[300px] rounded-[46px] bg-neel-900 p-[10px] shadow-phone sm:w-[340px] ${className}`}>
      <div className="absolute left-1/2 top-[10px] z-20 h-6 w-28 -translate-x-1/2 rounded-b-2xl bg-neel-900" aria-hidden="true" />
      <div className={`relative overflow-y-auto overflow-x-hidden rounded-[36px] bg-white scrollbar-none ${screenClassName}`}>
        {children}
      </div>
    </div>
  )
}
