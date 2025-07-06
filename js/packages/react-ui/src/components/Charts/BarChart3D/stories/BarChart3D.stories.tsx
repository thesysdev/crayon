import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import { BarChart3D } from '../BarChart3D'

// Data generation and variations
interface Value {
  Year: number
  Count: number
}

interface DataItem {
  Country: string
  Values: Value[]
}

const generateMockData = (
  numCountries: number,
  startYear = 1960,
  endYear = 2020,
) => {
  const data: DataItem[] = []
  for (let i = 0; i < numCountries; i++) {
    const values: Value[] = []
    for (let year = startYear; year <= endYear; year++) {
      const count =
        Math.floor(Math.random() * 1000000000) + i * 50000000 + (year - 1960) * 1000000
      values.push({ Year: year, Count: count })
    }
    data.push({
      Country: `Country ${i + 1}`,
      Values: values,
    })
  }
  return data
}

const dataVariations = {
  default: generateMockData(10),
  small: generateMockData(3),
  large: generateMockData(18),
  single: [
    {
      Country: 'Single Nation',
      Values: (() => {
        const values: Value[] = []
        for (let year = 1960; year <= 2020; year++) {
          const count = Math.floor(Math.random() * 500000000) + 100000000
          values.push({ Year: year, Count: count })
        }
        return values
      })(),
    },
  ],
  longNames: [
    ...generateMockData(2),
    {
      Country: 'The Democratic Republic of Long Name',
      Values: (() => {
        const values: Value[] = []
        for (let year = 1960; year <= 2020; year++) {
          const count = Math.floor(Math.random() * 800000000) + 200000000
          values.push({ Year: year, Count: count })
        }
        return values
      })(),
    }
  ],
}
// End of data generation

const meta: Meta<typeof BarChart3D> = {
  title: 'Charts/BarChart3D',
  component: BarChart3D,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['dev', 'autodocs'],
  argTypes: {
    data: {
      description: 'The dataset for the 3D bar chart.',
      control: false,
    },
    width: {
      description: 'The width of the chart canvas.',
      control: 'text',
      table: {
        defaultValue: { summary: '100%' },
      },
    },
    height: {
      description: 'The height of the chart canvas.',
      control: 'text',
      table: {
        defaultValue: { summary: '100%' },
      },
    },
  },
}

export default meta

type Story = StoryObj<typeof BarChart3D>

export const DataExplorer: Story = {
    name: '🎛️ Comprehensive Data Explorer',
    render: (args: any) => {
      const [selectedDataType, setSelectedDataType] =
        useState<keyof typeof dataVariations>('default')
  
      const currentData = dataVariations[selectedDataType]
  
      const buttonStyle = {
        margin: '2px',
        padding: '6px 12px',
        fontSize: '12px',
        border: '1px solid #ddd',
        borderRadius: '4px',
        cursor: 'pointer',
        background: '#fff',
      }
  
      const activeButtonStyle = {
        ...buttonStyle,
        background: '#007acc',
        color: 'white',
        border: '1px solid #007acc',
      }
  
      return (
        <div style={{ position: 'relative', width: '100vw', height: '100vh' }}>
          <div
            style={{
              position: 'absolute',
              top: '20px',
              left: '20px',
              zIndex: 10,
              padding: '12px',
              background: 'rgba(40, 40, 40, 0.8)',
              borderRadius: '8px',
              border: '1px solid #444',
              color: 'white',
              width: '300px'
            }}
          >
            <strong>💡 Quick Data Switch:</strong>
            <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
              <button
                onClick={() => setSelectedDataType('default')}
                style={selectedDataType === 'default' ? activeButtonStyle : buttonStyle}
              >
                🌍 Default
              </button>
              <button
                onClick={() => setSelectedDataType('small')}
                style={selectedDataType === 'small' ? activeButtonStyle : buttonStyle}
              >
                📦 Small
              </button>
              <button
                onClick={() => setSelectedDataType('large')}
                style={selectedDataType === 'large' ? activeButtonStyle : buttonStyle}
              >
                📚 Large
              </button>
              <button
                onClick={() => setSelectedDataType('single')}
                style={selectedDataType === 'single' ? activeButtonStyle : buttonStyle}
              >
                🎯 Single
              </button>
              <button
                onClick={() => setSelectedDataType('longNames')}
                style={selectedDataType === 'longNames' ? activeButtonStyle : buttonStyle}
              >
                🏷️ Long Names
              </button>
            </div>
            <div style={{ marginTop: '8px', fontSize: '12px', color: '#ccc' }}>
              <strong>Current:</strong> {selectedDataType} | <strong>Items:</strong>{' '}
              {currentData.length}
            </div>
          </div>
          <BarChart3D {...args} data={currentData} />
        </div>
      )
    },
  }

export const Default: Story = {
  args: {
    data: dataVariations.default,
    width: '100vw',
    height: '100vh',
  },
}

export const Small: Story = {
    args: {
      data: dataVariations.small,
      width: '100vw',
      height: '100vh',
    },
  }
  
  export const Large: Story = {
    args: {
      data: dataVariations.large,
      width: '100vw',
      height: '100vh',
    },
  }
  
  export const LongNames: Story = {
    args: {
      data: dataVariations.longNames,
      width: '100vw',
      height: '100vh',
    },
  }
  
  export const SingleItem: Story = {
    args: {
      data: dataVariations.single,
      width: '100vw',
      height: '100vh',
    },
  } 