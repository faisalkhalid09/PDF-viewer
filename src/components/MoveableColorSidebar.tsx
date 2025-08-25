import React, { useState, useRef, useEffect, useCallback } from 'react'
import { 
  Palette, 
  Move, 
  Type, 
  PenTool, 
  Highlighter, 
  Square, 
  Circle, 
  ArrowRight, 
  Minus,
  MousePointer,
  Eraser,
  Undo,
  Redo,
  Settings,
  X
} from 'lucide-react'

interface Position {
  x: number
  y: number
}

interface MoveableColorSidebarProps {
  onColorChange?: (color: string) => void
  onToolChange?: (tool: string) => void
  onStrokeWidthChange?: (width: number) => void
  onClose?: () => void
}

const predefinedColors = [
  '#000000', '#ffffff', '#ff0000', '#00ff00', '#0000ff',
  '#ffff00', '#ff00ff', '#00ffff', '#ffa500', '#800080',
  '#ffc0cb', '#a52a2a', '#808080', '#008000', '#000080'
]

const tools = [
  { id: 'select', name: 'Select', icon: MousePointer },
  { id: 'draw', name: 'Pen', icon: PenTool },
  { id: 'highlight', name: 'Highlight', icon: Highlighter },
  { id: 'text', name: 'Text', icon: Type },
  { id: 'rectangle', name: 'Rectangle', icon: Square },
  { id: 'circle', name: 'Circle', icon: Circle },
  { id: 'arrow', name: 'Arrow', icon: ArrowRight },
  { id: 'line', name: 'Line', icon: Minus },
  { id: 'eraser', name: 'Eraser', icon: Eraser }
]

const strokeWidths = [1, 2, 3, 4, 6, 8, 12, 16]

export const MoveableColorSidebar: React.FC<MoveableColorSidebarProps> = ({
  onColorChange,
  onToolChange,
  onStrokeWidthChange,
  onClose
}) => {
  const [position, setPosition] = useState<Position>({ x: 20, y: 100 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState<Position>({ x: 0, y: 0 })
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [selectedColor, setSelectedColor] = useState('#000000')
  const [selectedTool, setSelectedTool] = useState('select')
  const [selectedStrokeWidth, setSelectedStrokeWidth] = useState(2)
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [customColor, setCustomColor] = useState('#000000')

  const sidebarRef = useRef<HTMLDivElement>(null)
  const colorPickerRef = useRef<HTMLInputElement>(null)

  // Load saved position from localStorage
  useEffect(() => {
    const savedPosition = localStorage.getItem('colorSidebar-position')
    if (savedPosition) {
      try {
        const parsed = JSON.parse(savedPosition)
        setPosition(parsed)
      } catch (e) {
        console.warn('Failed to parse saved position:', e)
      }
    }
  }, [])

  // Save position to localStorage
  const savePosition = useCallback((newPosition: Position) => {
    localStorage.setItem('colorSidebar-position', JSON.stringify(newPosition))
  }, [])

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target !== e.currentTarget) return // Only drag from the header
    
    setIsDragging(true)
    const rect = sidebarRef.current?.getBoundingClientRect()
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      })
    }
  }

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return

    const newPosition = {
      x: e.clientX - dragOffset.x,
      y: e.clientY - dragOffset.y
    }

    // Keep within viewport bounds
    const maxX = window.innerWidth - (sidebarRef.current?.offsetWidth || 200)
    const maxY = window.innerHeight - (sidebarRef.current?.offsetHeight || 400)

    newPosition.x = Math.max(0, Math.min(maxX, newPosition.x))
    newPosition.y = Math.max(0, Math.min(maxY, newPosition.y))

    setPosition(newPosition)
  }, [isDragging, dragOffset])

  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      setIsDragging(false)
      savePosition(position)
    }
  }, [isDragging, position, savePosition])

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  const handleColorSelect = (color: string) => {
    setSelectedColor(color)
    onColorChange?.(color)
    setShowColorPicker(false)
  }

  const handleToolSelect = (tool: string) => {
    setSelectedTool(tool)
    onToolChange?.(tool)
  }

  const handleStrokeWidthSelect = (width: number) => {
    setSelectedStrokeWidth(width)
    onStrokeWidthChange?.(width)
  }

  const handleCustomColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const color = e.target.value
    setCustomColor(color)
    handleColorSelect(color)
  }

  if (isCollapsed) {
    return (
      <div
        ref={sidebarRef}
        style={{
          position: 'fixed',
          left: position.x,
          top: position.y,
          zIndex: 1000,
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          borderRadius: '8px',
          padding: '8px',
          cursor: isDragging ? 'grabbing' : 'grab',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
        }}
        onMouseDown={handleMouseDown}
      >
        <button
          onClick={() => setIsCollapsed(false)}
          style={{
            background: 'none',
            border: 'none',
            color: 'white',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Palette size={20} />
        </button>
      </div>
    )
  }

  return (
    <div
      ref={sidebarRef}
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        width: '240px',
        zIndex: 1000,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        borderRadius: '12px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '12px',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          cursor: isDragging ? 'grabbing' : 'grab',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        }}
        onMouseDown={handleMouseDown}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Move size={16} color="white" />
          <span style={{ color: 'white', fontSize: '14px', fontWeight: '500' }}>
            Tools & Colors
          </span>
        </div>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            onClick={() => setIsCollapsed(true)}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Minus size={12} />
          </button>
          {onClose && (
            <button
              onClick={onClose}
              style={{
                background: 'rgba(255, 0, 0, 0.3)',
                border: 'none',
                color: 'white',
                cursor: 'pointer',
                padding: '4px',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '16px' }}>
        {/* Tools Section */}
        <div style={{ marginBottom: '20px' }}>
          <h4 style={{ 
            color: 'white', 
            fontSize: '12px', 
            textTransform: 'uppercase', 
            letterSpacing: '0.5px',
            marginBottom: '12px',
            opacity: 0.8
          }}>
            Tools
          </h4>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(3, 1fr)', 
            gap: '8px' 
          }}>
            {tools.map(tool => {
              const Icon = tool.icon
              const isSelected = selectedTool === tool.id
              return (
                <button
                  key={tool.id}
                  onClick={() => handleToolSelect(tool.id)}
                  title={tool.name}
                  style={{
                    background: isSelected 
                      ? 'rgba(37, 99, 235, 0.8)' 
                      : 'rgba(255, 255, 255, 0.1)',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '10px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease',
                    backdropFilter: 'blur(5px)',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
                    }
                  }}
                >
                  <Icon size={16} color="white" />
                </button>
              )
            })}
          </div>
        </div>

        {/* Colors Section */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            marginBottom: '12px' 
          }}>
            <h4 style={{ 
              color: 'white', 
              fontSize: '12px', 
              textTransform: 'uppercase', 
              letterSpacing: '0.5px',
              margin: 0,
              opacity: 0.8
            }}>
              Colors
            </h4>
            <button
              onClick={() => setShowColorPicker(!showColorPicker)}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: 'none',
                color: 'white',
                cursor: 'pointer',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '10px',
              }}
            >
              Custom
            </button>
          </div>
          
          {showColorPicker && (
            <div style={{ marginBottom: '12px' }}>
              <input
                ref={colorPickerRef}
                type="color"
                value={customColor}
                onChange={handleCustomColorChange}
                style={{
                  width: '100%',
                  height: '32px',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              />
            </div>
          )}
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(5, 1fr)', 
            gap: '8px' 
          }}>
            {predefinedColors.map(color => (
              <button
                key={color}
                onClick={() => handleColorSelect(color)}
                style={{
                  width: '32px',
                  height: '32px',
                  backgroundColor: color,
                  border: selectedColor === color ? '3px solid white' : '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: selectedColor === color ? '0 0 0 1px rgba(37, 99, 235, 0.5)' : 'none',
                }}
              />
            ))}
          </div>
        </div>

        {/* Stroke Width Section */}
        <div>
          <h4 style={{ 
            color: 'white', 
            fontSize: '12px', 
            textTransform: 'uppercase', 
            letterSpacing: '0.5px',
            marginBottom: '12px',
            opacity: 0.8
          }}>
            Stroke Width
          </h4>
          <div style={{ 
            display: 'flex', 
            flexWrap: 'wrap',
            gap: '6px' 
          }}>
            {strokeWidths.map(width => (
              <button
                key={width}
                onClick={() => handleStrokeWidthSelect(width)}
                style={{
                  background: selectedStrokeWidth === width 
                    ? 'rgba(37, 99, 235, 0.8)' 
                    : 'rgba(255, 255, 255, 0.1)',
                  border: 'none',
                  color: 'white',
                  borderRadius: '4px',
                  padding: '6px 10px',
                  fontSize: '11px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                {width}px
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
