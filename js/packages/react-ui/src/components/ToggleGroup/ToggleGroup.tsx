import React from 'react'
import * as ToggleGroupPrimitive from '@radix-ui/react-toggle-group'

interface ToggleGroupProps {
    children: React.ReactNode
}

const ToggleGroup = ({ children }: ToggleGroupProps) => {
  return (
    <ToggleGroupPrimitive.Root type="single">
      <ToggleGroupPrimitive.Item value="1">1</ToggleGroupPrimitive.Item>
    </ToggleGroupPrimitive.Root>
  )
}

export default ToggleGroup