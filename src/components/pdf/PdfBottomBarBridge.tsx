import React, { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Highlighter, Underline as UnderlineIcon } from 'lucide-react'
import type { Editor } from '@tldraw/tldraw'

interface PdfBottomBarBridgeProps {
  active: boolean
  editor: Editor | null
}

// Map TLDraw tool ids to our PDF tools
function mapTldrawToolToPdfTool(id: string | undefined): string | null {
  switch (id) {
    case 'select':
    case 'hand':
    case 'pan':
      // Neutral tool: do not capture pointer in PDF viewer
      return 'none'
    case 'draw':
      return 'draw'
    case 'eraser':
      return 'erase'
    case 'text':
      return 'text'
    case 'note':
      return 'comment'
    case 'geo':
      return 'shape'
    case 'highlight':
      return 'highlight'
    default:
      return null
  }
}

export const PdfBottomBarBridge: React.FC<PdfBottomBarBridgeProps> = ({ active, editor }) => {
  const [container, setContainer] = useState<HTMLElement | null>(null)
  const prevToolRef = useRef<string | undefined>(undefined)
  const [pdfTool, setPdfTool] = useState<string | null>(null)

  // Reflect external tool changes (from TLDraw or our buttons)
  useEffect(() => {
    const onSet = (e: Event) => {
      const ce = e as CustomEvent
      const t = ce?.detail?.tool as string | undefined
      if (!t) return
      setPdfTool(t)
    }
    window.addEventListener('pdf-set-tool', onSet as EventListener)
    return () => window.removeEventListener('pdf-set-tool', onSet as EventListener)
  }, [])

  // Find TLDraw toolbar list container once mounted
  useEffect(() => {
    if (!active) {
      setContainer(null)
      return
    }
    const find = () => document.querySelector<HTMLElement>('.tlui-toolbar__tools__list')
    const el = find()
    if (el) {
      setContainer(el)
      return
    }
    const i = window.setInterval(() => {
      const el2 = find()
      if (el2) {
        window.clearInterval(i)
        setContainer(el2)
      }
    }, 200)
    return () => window.clearInterval(i)
  }, [active])

  // Poll TLDraw current tool and forward to PDF when viewer is active
  useEffect(() => {
    if (!active || !editor) return
    const timer = window.setInterval(() => {
      try {
        const id = (editor as any).getCurrentToolId?.() as string | undefined
        if (prevToolRef.current !== id) {
          prevToolRef.current = id
          const mapped = mapTldrawToolToPdfTool(id)
          if (mapped) {
            window.dispatchEvent(new CustomEvent('pdf-set-tool', { detail: { tool: mapped } }))
          }
        }
      } catch {}
    }, 250)
    return () => window.clearInterval(timer)
  }, [active, editor])

  const Buttons = useMemo(() => {
    if (!active) return null
    const btnBase: React.CSSProperties = {
      height: 48,
      width: 48,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: -2,
      marginRight: -2,
      cursor: 'pointer',
      borderRadius: 8,
    }

    const Button: React.FC<{ title: string; onClick: () => void; selected?: boolean; children: React.ReactNode }>
      = ({ title, onClick, selected, children }) => (
        <button
          className="tlui-button tlui-button__tool"
          title={title}
          aria-pressed={selected}
          onClick={(e) => { e.stopPropagation(); onClick() }}
          style={{
            ...btnBase,
            background: selected ? 'rgba(0,0,0,0.08)' : undefined,
          }}
        >
          {children}
        </button>
      )

    const setTool = (tool: string) => window.dispatchEvent(new CustomEvent('pdf-set-tool', { detail: { tool } }))

    return (
      <div style={{ display: 'flex', alignItems: 'center' }} data-pdf-tools>
        <Button title="Highlight" selected={pdfTool==='highlight'} onClick={() => setTool('highlight')}>
          <Highlighter size={18} />
        </Button>
        <Button title="Underline" selected={pdfTool==='underline'} onClick={() => setTool('underline')}>
          <UnderlineIcon size={18} />
        </Button>
      </div>
    )
  }, [active, pdfTool])

  if (!active || !container) return null
  return createPortal(Buttons, container)
}

