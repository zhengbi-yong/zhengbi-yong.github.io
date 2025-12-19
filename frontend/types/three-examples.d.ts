declare module 'three/examples/jsm/controls/OrbitControls' {
  import { Camera, EventDispatcher, Vector3 } from 'three'

  export class OrbitControls extends EventDispatcher {
    constructor(object: Camera, domElement?: HTMLElement)
    enableDamping: boolean
    dampingFactor: number
    screenSpacePanning: boolean
    minDistance: number
    maxDistance: number
    maxPolarAngle: number
    target: Vector3
    update(): void
    dispose(): void
  }

  export default OrbitControls
}

