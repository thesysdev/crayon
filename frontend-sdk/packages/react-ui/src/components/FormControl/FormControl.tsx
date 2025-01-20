import React, { forwardRef } from 'react'

interface FormControlProps {
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
}

const FormControl = forwardRef<HTMLDivElement, FormControlProps>((props, ref) => {
  return (
    <div ref={ref} className={props.className} style={props.style}>
      {props.children}
    </div>
  )
})

FormControl.displayName = 'FormControl'

export default FormControl