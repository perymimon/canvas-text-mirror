import { Injectable, ElementRef } from '@angular/core'
import { CanvasMirror } from './core'

/**
 * Angular injectable service — wrap CanvasMirror for use in components.
 *
 * Declare in the component's `providers` array so each component gets
 * its own instance (avoid singleton scope for multiple mirrors on one page).
 *
 * @example
 * // my.component.ts
 * import { CanvasMirrorService } from 'canvas-text-mirror/angular'
 *
 * @Component({
 *   templateUrl: './my.component.html',
 *   providers: [CanvasMirrorService],   // <-- scoped per component
 * })
 * export class MyComponent implements AfterViewInit, OnDestroy {
 *   @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>
 *   @ViewChild('root')   rootRef!:   ElementRef<HTMLElement>
 *
 *   constructor(private mirror: CanvasMirrorService) {}
 *
 *   async ngAfterViewInit() {
 *     this.mirror.init(this.canvasRef, this.rootRef)
 *     await this.mirror.draw()
 *   }
 *
 *   ngOnDestroy() { this.mirror.destroy() }
 * }
 *
 * // my.component.html
 * // <canvas #canvas class="mirror-canvas"></canvas>
 * // <main #root>...</main>
 */
@Injectable()
export class CanvasMirrorService {
  private instance: CanvasMirror | null = null

  /**
   * Initialize with Angular ElementRefs. Call in ngAfterViewInit so
   * the native elements are available.
   */
  init(
    canvasRef: ElementRef<HTMLCanvasElement>,
    rootRef: ElementRef<HTMLElement>,
  ): void {
    this.instance = new CanvasMirror({
      canvas: canvasRef.nativeElement,
      root: rootRef.nativeElement,
    })
  }

  /** Full draw: walk DOM, cache styles, render */
  async draw(): Promise<void> {
    await this.instance?.draw()
  }

  /** Cheap redraw on resize — no re-walk */
  update(): void {
    this.instance?.update()
  }

  /** Re-walk the DOM (call when content changes) */
  async reprepare(): Promise<void> {
    await this.instance?.reprepare()
  }

  /** Clear the canvas and discard the cache */
  clear(): void {
    this.instance?.clear()
  }

  /** Clear and release the CanvasMirror instance */
  destroy(): void {
    this.clear()
    this.instance = null
  }
}