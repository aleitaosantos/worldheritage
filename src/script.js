import './style.css'
import * as THREE from 'three'
import { ArcballControls } from 'three/examples/jsm/controls/ArcballControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import * as dat from 'lil-gui'




// fetch('/xml/whc-en.xml')
// .then((r) => {
//     console.log('Resolved', r)
//     return r.()
// })
// .then((data) => {
//     console.log(data)
// })
// .catch((e) => {
//     console.log('Error!', e)
// })


// Textures
const textureLoader = new THREE.TextureLoader()
const earthColorTexture = textureLoader.load('/textures/earth/8k_earth_daymap.jpg')



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

const earthGeometry = new THREE.SphereGeometry(radius, 72, 36)
const dirEarthGeometry = new THREE.SphereGeometry(radius * 2, 72, 36)
const earthMaterial = new THREE.MeshStandardMaterial({
  color: '#444',
  metalness: 0,
  roughness: 0.5,
  wireframe: false,
  map: earthColorTexture,
})


const earth = new THREE.Mesh (earthGeometry, earthMaterial)
const point = new THREE.Vector3()

scene.add(earth)


const sites = {}
const url = '/xml/whc-en.xml';
const xhr = new XMLHttpRequest();
xhr.onreadystatechange = function() {
    if (xhr.readyState == XMLHttpRequest.DONE) {
        const xmlDoc = this.responseXML;
        for(let i = 0; i < xmlDoc.getElementsByTagName('row').length; i++) {
            let row = xmlDoc.getElementsByTagName('row')[i]        
            let id = 'id' + row.getElementsByTagName('id_number')[0].innerHTML
            sites[id] = {}
            sites[id]['site'] = row.getElementsByTagName('site')[0].innerHTML
            sites[id]['category'] = row.getElementsByTagName('category')[0].innerHTML
            sites[id]['dateInscribed'] = Number(row.getElementsByTagName('date_inscribed')[0].innerHTML)
            sites[id]['latitude'] = Number(row.getElementsByTagName('latitude')[0].innerHTML)
            sites[id]['longitude'] = Number(row.getElementsByTagName('longitude')[0].innerHTML)
            sites[id]['phi'] = (- sites[id]['latitude'] + 90)/180 * Math.PI
            sites[id]['theta'] = (sites[id]['longitude'] + 90)/180 * Math.PI
            point.setFromSphericalCoords(radius, sites[id]['phi'], sites[id]['theta'])
            sites[id]['pointGeometry'] = new THREE.SphereGeometry(0.0025, 36, 18)
            sites[id]['pointMaterial'] = new THREE.MeshBasicMaterial()
            switch (sites[id]['category']) {
                case 'Natural':
                    sites[id]['pointMaterial'].color = new THREE.Color(0x00ff00)
                    break
                case 'Cultural':
                    sites[id]['pointMaterial'].color = new THREE.Color(0xff0000)
                    break
                case 'Mixed':
                    sites[id]['pointMaterial'].color = new THREE.Color(0xffff00)
                    break
            }
            sites[id]['pointMesh'] = new THREE.Mesh(sites[id]['pointGeometry'], sites[id]['pointMaterial'])
            sites[id]['pointMesh'].position.set(point.x, point.y, point.z)
            scene.add(sites[id]['pointMesh'])
        }
    }
}
xhr.open('GET', url, true);
xhr.send(null);    

console.log(sites)


// for (let i = 0; i < Object.keys(sites).length; i++) {
    //     let phi = (- Object.keys(sites)[i].latitude + 90)/180 * Math.PI
    //     let theta = (location.longitude + 90)/180 * Math.PI
    // }
    



/**
 * Lights
 */
const ambientLight = new THREE.AmbientLight(0xffffff, 2)
scene.add(ambientLight)

// const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6)
// directionalLight.castShadow = true
// directionalLight.shadow.mapSize.set(1024, 1024)
// directionalLight.shadow.camera.far = 15
// directionalLight.shadow.camera.left = - 7
// directionalLight.shadow.camera.top = 7
// directionalLight.shadow.camera.right = 7
// directionalLight.shadow.camera.bottom = - 7
// directionalLight.position.set(5, 5, 5)
// scene.add(directionalLight)

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(60, sizes.width / sizes.height, 0.1, 100)
camera.position.set(0, 0, 2)
scene.add(camera)


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

// Controls
const controls = new ArcballControls( camera, renderer.domElement, scene )
controls.target.set(0, 0, 0)
controls.dampingFactor = 2.5
controls.enablePan = false
controls.maxDistance = 2.5
controls.minDistance = 1.25

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