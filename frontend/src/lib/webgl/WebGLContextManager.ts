/**
 * WebGL Context Manager with LRU Eviction
 *
 * GOLDEN_RULES 2.4: Max 6 active WebGL contexts (browser limit is 16, keeping safe margin)
 *
 * Features:
 * - LRU eviction when exceeding MAX_CONTEXTS
 * - Context lost/restored event handling
 * - Snapshot saving for Activity visibility transitions
 * - Idempotent pause/resume for Activity cleanup semantics
 */

interface ManagedContext {
  id: string
  canvas: HTMLCanvasElement
  context: WebGLRenderingContext | WebGL2RenderingContext | null
  priority: number // Higher = more recently used
  snapshot: string | null
  isLost: boolean
  lastAccessed: number
}

type ContextEventCallback = (id: string, event: Event) => void

class WebGLContextManager {
  private static instance: WebGLContextManager | null = null
  private static readonly MAX_CONTEXTS = 6

  private contexts: Map<string, ManagedContext> = new Map()
  private accessCounter = 0
  private eventCallbacks: Map<string, ContextEventCallback[]> = new Map()

  private constructor() {
    // Handle context lost at window level
    if (typeof window !== 'undefined') {
      window.addEventListener('webglcontextlost', this.handleGlobalContextLost)
      window.addEventListener('webglcontextrestored', this.handleGlobalContextRestored)
    }
  }

  static getInstance(): WebGLContextManager {
    if (!WebGLContextManager.instance) {
      WebGLContextManager.instance = new WebGLContextManager()
    }
    return WebGLContextManager.instance
  }

  /**
   * Acquire a WebGL context, evicting LRU if at capacity
   */
  acquire(
    id: string,
    canvas: HTMLCanvasElement
  ): WebGLRenderingContext | WebGL2RenderingContext | null {
    // Check if already managed
    const existing = this.contexts.get(id)
    if (existing) {
      this.touch(id)
      return existing.context
    }

    // Evict LRU if at capacity
    if (this.contexts.size >= WebGLContextManager.MAX_CONTEXTS) {
      this.evictLeastRecentlyUsed()
    }

    // Try to get WebGL2 first, fallback to WebGL1
    const gl =
      (canvas.getContext('webgl2', {
        preserveDrawingBuffer: true,
        antialias: true,
        alpha: true,
      }) as WebGL2RenderingContext | null) ||
      (canvas.getContext('webgl', {
        preserveDrawingBuffer: true,
        antialias: true,
        alpha: true,
      }) as WebGLRenderingContext | null)

    if (!gl) {
      console.warn(`[WebGLContextManager] Failed to acquire context for ${id}`)
      return null
    }

    const managedContext: ManagedContext = {
      id,
      canvas,
      context: gl,
      priority: ++this.accessCounter,
      snapshot: null,
      isLost: false,
      lastAccessed: Date.now(),
    }

    this.contexts.set(id, managedContext)
    this.setupContextHandlers(id, canvas)

    console.debug(`[WebGLContextManager] Acquired context ${id} (total: ${this.contexts.size})`)
    return gl
  }

  /**
   * Release a managed context, freeing GPU resources
   */
  release(id: string): void {
    const managed = this.contexts.get(id)
    if (!managed) return

    // Save snapshot before releasing
    if (managed.canvas && managed.context && !managed.isLost) {
      try {
        managed.snapshot = managed.canvas.toDataURL('image/png')
      } catch {
        // Ignore snapshot errors during cleanup
      }
    }

    // Remove event listeners
    this.removeContextHandlers(id, managed.canvas)

    // Free GPU resources
    if (managed.context) {
      const gl = managed.context
      // Lose context to free GPU memory
      const ext = gl.getExtension('WEBGL_lose_context')
      if (ext) {
        ext.loseContext()
      }
    }

    this.contexts.delete(id)
    this.eventCallbacks.delete(id)

    console.debug(`[WebGLContextManager] Released context ${id} (total: ${this.contexts.size})`)
  }

  /**
   * Pause rendering (for Activity hidden state)
   * Idempotent - can be called multiple times safely
   */
  pause(id: string): string | null {
    const managed = this.contexts.get(id)
    if (!managed) return null

    // Save snapshot for display while paused
    let snapshot = managed.snapshot
    if (managed.canvas && managed.context && !managed.isLost) {
      try {
        snapshot = managed.canvas.toDataURL('image/png')
        managed.snapshot = snapshot
      } catch {
        // Keep existing snapshot or null
      }
    }

    console.debug(`[WebGLContextManager] Paused context ${id}`)
    return snapshot
  }

  /**
   * Resume rendering (for Activity visible state)
   */
  resume(id: string): boolean {
    const managed = this.contexts.get(id)
    if (!managed) return false

    if (managed.isLost) {
      console.warn(`[WebGLContextManager] Cannot resume lost context ${id}`)
      return false
    }

    this.touch(id)
    console.debug(`[WebGLContextManager] Resumed context ${id}`)
    return true
  }

  /**
   * Get snapshot for a context (for display during pause)
   */
  getSnapshot(id: string): string | null {
    return this.contexts.get(id)?.snapshot ?? null
  }

  /**
   * Check if context is lost
   */
  isContextLost(id: string): boolean {
    return this.contexts.get(id)?.isLost ?? true
  }

  /**
   * Update priority (mark as recently used)
   */
  private touch(id: string): void {
    const managed = this.contexts.get(id)
    if (managed) {
      managed.priority = ++this.accessCounter
      managed.lastAccessed = Date.now()
    }
  }

  /**
   * Evict the least recently used context
   */
  private evictLeastRecentlyUsed(): void {
    let oldestId: string | null = null
    let oldestPriority = Infinity
    let oldestTime = Infinity

    for (const [id, ctx] of this.contexts) {
      if (
        ctx.priority < oldestPriority ||
        (ctx.priority === oldestPriority && ctx.lastAccessed < oldestTime)
      ) {
        oldestId = id
        oldestPriority = ctx.priority
        oldestTime = ctx.lastAccessed
      }
    }

    if (oldestId) {
      console.debug(`[WebGLContextManager] Evicting LRU context ${oldestId}`)
      this.release(oldestId)
    }
  }

  /**
   * Setup context lost/restored handlers for a canvas
   */
  private setupContextHandlers(id: string, canvas: HTMLCanvasElement): void {
    const handleContextLost = (event: Event) => {
      event.preventDefault()
      const managed = this.contexts.get(id)
      if (managed) {
        managed.isLost = true
        console.warn(`[WebGLContextManager] Context ${id} lost`)
      }
      this.notifyCallbacks(id, event)
    }

    const handleContextRestored = (event: Event) => {
      const managed = this.contexts.get(id)
      if (managed) {
        managed.isLost = false
        console.info(`[WebGLContextManager] Context ${id} restored`)
      }
      this.notifyCallbacks(id, event)
    }

    canvas.addEventListener('webglcontextlost', handleContextLost)
    canvas.addEventListener('webglcontextrestored', handleContextRestored)

    // Store handlers for cleanup
    const handlers = { handleContextLost, handleContextRestored }
    ;(canvas as any)._webglHandlers = handlers
  }

  /**
   * Remove context handlers from canvas
   */
  private removeContextHandlers(_id: string, canvas: HTMLCanvasElement): void {
    const handlers = (canvas as any)._webglHandlers
    if (handlers) {
      canvas.removeEventListener('webglcontextlost', handlers.handleContextLost)
      canvas.removeEventListener('webglcontextrestored', handlers.handleContextRestored)
      delete (canvas as any)._webglHandlers
    }
  }

  /**
   * Global context lost handler
   */
  private handleGlobalContextLost = (event: Event): void => {
    console.warn('[WebGLContextManager] Global webglcontextlost event')
    // Mark all contexts as lost
    for (const [id, managed] of this.contexts) {
      managed.isLost = true
      this.notifyCallbacks(id, event)
    }
  }

  /**
   * Global context restored handler
   */
  private handleGlobalContextRestored = (_event: Event): void => {
    console.info('[WebGLContextManager] Global webglcontextrestored event')
    // Note: Individual contexts may still be lost
    // Each context needs individual restoration
  }

  /**
   * Register callback for context events
   */
  onContextEvent(id: string, callback: ContextEventCallback): () => void {
    const callbacks = this.eventCallbacks.get(id) || []
    callbacks.push(callback)
    this.eventCallbacks.set(id, callbacks)

    // Return unsubscribe function
    return () => {
      const cbs = this.eventCallbacks.get(id) || []
      const index = cbs.indexOf(callback)
      if (index > -1) {
        cbs.splice(index, 1)
      }
    }
  }

  /**
   * Notify callbacks of context event
   */
  private notifyCallbacks(id: string, event: Event): void {
    const callbacks = this.eventCallbacks.get(id) || []
    for (const callback of callbacks) {
      try {
        callback(id, event)
      } catch (e) {
        console.error(`[WebGLContextManager] Callback error for ${id}:`, e)
      }
    }
  }

  /**
   * Get current context count
   */
  getContextCount(): number {
    return this.contexts.size
  }

  /**
   * Check if a context is managed
   */
  has(id: string): boolean {
    return this.contexts.has(id)
  }

  /**
   * Cleanup all contexts (for app shutdown)
   */
  dispose(): void {
    for (const id of this.contexts.keys()) {
      this.release(id)
    }
    this.contexts.clear()
    this.eventCallbacks.clear()

    if (typeof window !== 'undefined') {
      window.removeEventListener('webglcontextlost', this.handleGlobalContextLost)
      window.removeEventListener('webglcontextrestored', this.handleGlobalContextRestored)
    }

    WebGLContextManager.instance = null
    console.debug('[WebGLContextManager] Disposed')
  }
}

// Export singleton getter
export const webGLContextManager = WebGLContextManager.getInstance()

// Export class for type usage
export type { ManagedContext, ContextEventCallback }
export default WebGLContextManager
