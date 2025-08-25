// TEMPORARILY DISABLED DUE TO TLDRAW API ISSUES
// This file will be re-enabled once TLDraw custom shape API is stable

/*
import {
  BaseBoxShapeUtil,
  DefaultColorStyle,
  HTMLContainer,
  RecordProps,
  T,
  TLBaseShape,
  TLDefaultColorStyle,
  getDefaultColorTheme,
  resizeBox,
} from '@tldraw/tldraw'
import { PdfViewerComponent } from '../components/PdfViewerComponent'
*/

// Temporary type definition for compatibility
export type PdfViewerShape = {
  id: string
  type: 'pdf-viewer'
  props: {
    w: number
    h: number
    color: string
    imageUrls: string[]
    isMaximized: boolean
    isMinimized: boolean
    originalBounds?: { w: number; h: number; x: number; y: number }
  }
}

/*

export class PdfViewerShapeUtil extends BaseBoxShapeUtil<PdfViewerShape> {
  static override type = 'pdf-viewer' as const
  static override props: RecordProps<PdfViewerShape> = {
    w: T.number,
    h: T.number,
    color: DefaultColorStyle,
    imageUrls: T.arrayOf(T.string),
    isMaximized: T.boolean,
    isMinimized: T.boolean,
    originalBounds: T.optional(
      T.object({
        w: T.number,
        h: T.number,
        x: T.number,
        y: T.number,
      })
    ),
  }

  getDefaultProps(): PdfViewerShape['props'] {
    return {
      w: 600,
      h: 400,
      color: 'black',
      imageUrls: [],
      isMaximized: false,
      isMinimized: false,
    }
  }

  canResize = (shape: PdfViewerShape) => !shape.props.isMaximized

  canMove = (shape: PdfViewerShape) => !shape.props.isMaximized

  override onResize: T.ResizeHandler<PdfViewerShape> = (shape, info) => {
    if (shape.props.isMaximized) return shape
    return resizeBox(shape, info)
  }

  component(shape: PdfViewerShape) {
    const bounds = this.editor.getShapeGeometry(shape).bounds
    const theme = getDefaultColorTheme({ isDarkMode: this.editor.user.getIsDarkMode() })
    const props = shape.props

    return (
      <HTMLContainer
        id={shape.id}
        style={{
          border: `1px solid ${theme[props.color].solid}`,
          borderRadius: '8px',
          overflow: 'hidden',
          pointerEvents: 'all',
          backgroundColor: 'white',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        }}
      >
        <PdfViewerComponent
          shape={shape}
          bounds={bounds}
          onMaximize={this.handleMaximize}
          onMinimize={this.handleMinimize}
          onClose={this.handleClose}
          onRestore={this.handleRestore}
        />
      </HTMLContainer>
    )
  }

  indicator(shape: PdfViewerShape) {
    const props = shape.props
    if (props.isMinimized) return null

    return (
      <rect
        width={shape.props.w}
        height={shape.props.h}
        stroke="var(--color-text-1)"
        strokeWidth={2}
        fill="none"
        rx={8}
      />
    )
  }

  private handleMaximize = (shape: PdfViewerShape) => {
    const viewport = this.editor.getViewportPageBounds()
    const currentBounds = this.editor.getShapePageBounds(shape)!
    
    this.editor.updateShape({
      ...shape,
      props: {
        ...shape.props,
        isMaximized: true,
        isMinimized: false,
        originalBounds: {
          w: shape.props.w,
          h: shape.props.h,
          x: shape.x,
          y: shape.y,
        },
        w: viewport.width - 40,
        h: viewport.height - 40,
      },
      x: viewport.x + 20,
      y: viewport.y + 20,
    })
  }

  private handleMinimize = (shape: PdfViewerShape) => {
    this.editor.updateShape({
      ...shape,
      props: {
        ...shape.props,
        isMinimized: true,
        isMaximized: false,
      },
    })
  }

  private handleRestore = (shape: PdfViewerShape) => {
    const originalBounds = shape.props.originalBounds
    
    if (originalBounds && shape.props.isMaximized) {
      this.editor.updateShape({
        ...shape,
        props: {
          ...shape.props,
          isMaximized: false,
          isMinimized: false,
          w: originalBounds.w,
          h: originalBounds.h,
          originalBounds: undefined,
        },
        x: originalBounds.x,
        y: originalBounds.y,
      })
    } else {
      this.editor.updateShape({
        ...shape,
        props: {
          ...shape.props,
          isMaximized: false,
          isMinimized: false,
        },
      })
    }
  }

  private handleClose = (shape: PdfViewerShape) => {
    this.editor.deleteShape(shape)
  }
}
*/
