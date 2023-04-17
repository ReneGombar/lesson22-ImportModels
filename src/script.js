import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import * as dat from 'lil-gui'
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js'

//using draco compression on the geometry buffer data
//and a separate worker to do the decompression
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader'
const dracoLoader = new DRACOLoader()
// after copying draco folder from node_modules to static folder
// we initiate a separate worker to do the decompresion of the files
dracoLoader.setDecoderPath('/draco/')



/**
 * Base
 */
// Debug
const gui = new dat.GUI()

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

/**Models */
const gltfLoader = new GLTFLoader()
gltfLoader.load('/models/Duck/glTF/Duck.gltf',
    (gltf)=>
    {
        console.log('success')
        console.log(gltf)

        //scene.add(gltf.scene.children[0])
    },
    ()=>{
        console.log('progress')
    },
    ()=>
    {
        console.log('error')
    }
)

/**Draco compressed file */
//tell gltfLoader to use the dracoLoader, must be used
//after const gltfLoader = new GLTFLoader()

gltfLoader.setDRACOLoader(dracoLoader)
gltfLoader.load('/models/Duck/glTF-Draco/Duck.gltf',
    (duckDraco)=>
    {
        scene.add(duckDraco.scene.children[0])
    }
)


//loading a model composed of multiple meshes
gltfLoader.load('/models/FlightHelmet/glTF/FlightHelmet.gltf',
    (helmet)=>
    {
        console.log(helmet)
        // this loops runs until all children are 
        // added to our scene. It stops when original array is emptied
        while (helmet.scene.children.length)
        {
            scene.add(helmet.scene.children[0])
        }

        
        //OR load the whole scene into our scene with
        // scene.add(helmet.scene)
    }
)

/**Load animated model */
// need to use animation mixer
let mixer = null
gltfLoader.load('/models/Fox/glTF/Fox.gltf',
    (fox)=>
    {
        mixer = new THREE.AnimationMixer(fox.scene)
        const action = mixer.clipAction(fox.animations[2])
        action.play()
        fox.scene.scale.set( 0.025,0.025,0.025)
        scene.add(fox.scene)
        console.log(action)
    }
)

/**
 * Floor
 */
const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(10, 10),
    new THREE.MeshStandardMaterial({
        color: '#444444',
        metalness: 0,
        roughness: 0.5
    })
)
floor.receiveShadow = true
floor.rotation.x = - Math.PI * 0.5
scene.add(floor)

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

    // Update animation mixer after it is loaded
    mixer ? mixer.update(deltaTime) : null

    // Update controls
    controls.update()

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()