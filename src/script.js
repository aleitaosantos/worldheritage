import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import * as dat from 'lil-gui'

/**
 * Base
 */
// // Debug
// const gui = new dat.GUI()

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

/**
 * Models
 */
const dracoLoader = new DRACOLoader()
dracoLoader.setDecoderPath('/draco/')
const gltfLoader = new GLTFLoader()
gltfLoader.setDRACOLoader(dracoLoader)

let mixer = null

let radius = 1

const globeGeometry = new THREE.SphereGeometry(radius, 72, 36)
const dirGlobeGeometry = new THREE.SphereGeometry(radius * 2, 72, 36)
const globeMaterial = new THREE.MeshStandardMaterial({
  color: '#444',
  metalness: 0,
  roughness: 0.5,
  wireframe: true
})


const globe = new THREE.Mesh (globeGeometry, globeMaterial)
const dirGlobe = new THREE.Mesh (dirGlobeGeometry, globeMaterial)

let latitude, longitude 

const location = {}
location.latitude = 30 
location.longitude = 45

const phi = (- location.latitude + 90)/180 * Math.PI
const theta = (location.longitude + 180)/180 * Math.PI

const point = new THREE.Vector3()
point.setFromSphericalCoords(radius, phi, theta)

console.log(point)
scene.add(globe)

const globeNormal = new THREE.ArrowHelper(point, point, 0.1)
scene.add(globeNormal)
console.log(globeNormal)


const planeGeometry = new THREE.PlaneGeometry(0.1, 0.1)
const planeMaterial = new THREE.MeshBasicMaterial({
  color: 0xff0,
  side: THREE.DoubleSide
})
const plane = new THREE.Mesh(planeGeometry, planeMaterial)
console.log(point)
plane.position.x = globeNormal.position.x
plane.position.y = globeNormal.position.y
plane.position.z = globeNormal.position.z
plane.quaternion.w = globeNormal.quaternion.w
plane.quaternion.x = globeNormal.quaternion.x
plane.quaternion.y = globeNormal.quaternion.y
plane.quaternion.z = globeNormal.quaternion.z
// plane.lookAt(globe)
scene.add(plane)


/**
 * Lights
 */
const ambientLight = new THREE.AmbientLight(0xffffff, 0.8)
scene.add(ambientLight)

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6)
directionalLight.castShadow = true
directionalLight.shadow.mapSize.set(1024, 1024)
directionalLight.shadow.camera.far = 15
directionalLight.shadow.camera.left = - 7
directionalLight.shadow.camera.top = 7
directionalLight.shadow.camera.right = 7
directionalLight.shadow.camera.bottom = - 7
directionalLight.position.set(5, 5, 5)
scene.add(directionalLight)

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100)
camera.position.set(2, 2, 2)
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.target.set(0, 0.75, 0)
controls.enableDamping = true

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas
})
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

/**
 * Animate
 */
const clock = new THREE.Clock()
let previousTime = 0

const tick = () =>
{
    const elapsedTime = clock.getElapsedTime()
    const deltaTime = elapsedTime - previousTime
    previousTime = elapsedTime

    // Update mixer
    if(mixer !== null) {
        mixer.update(deltaTime)
    }
    
    // Update controls
    controls.update()

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()