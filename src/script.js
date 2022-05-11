import * as THREE from 'three'; Object

import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer';

import './style.css';

let camera, scene, controls, renderer, earth, id, place, sitesListSize, css2DRenderer;

const clock = new THREE.Clock();
const textureLoader = new THREE.TextureLoader();
const sites = {};

const sizes = { width: window.innerWidth, height: window.innerHeight, };

init();
animate();

function init() {

    // Scene
    scene = new THREE.Scene()

    // Initial camera
    camera = new THREE.PerspectiveCamera( 60, sizes.width / sizes.height, 0.01, 10 );
    camera.position.set( 2.5, 0, 0 );
    scene.add( camera );

    // Lights
    const ambientLight = new THREE.AmbientLight( 0xffcccc, 1 );

    const directionalLight = new THREE.DirectionalLight( 0xccffff, 2 );
    directionalLight.position.set( 2.5, 2.5, 2.5 )

    scene.add( ambientLight, directionalLight );

    //

    // Earth
    const earthRadius = 1;
    const earthGeometry = new THREE.SphereGeometry( earthRadius, 180, 90 );
    const earthMaterial = new THREE.MeshStandardMaterial( {
        color: '#444',
        map: textureLoader.load( '/textures/earth/8k_earth_map.png' ),
        roughness: 0.5,
        roughnessMap: textureLoader.load( '/textures/earth/8k_earth_specular.png' ),
        metalness: 0.25,
        metalness: 0,
        roughness: 0.5,
        wireframe: false,
    } );
    earth = new THREE.Mesh( earthGeometry, earthMaterial );
    scene.add( earth );

    // Sites
    place = new THREE.Vector3();
    const sitesSrc = '/xml/whc-en.xml';
    const xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function () {
        if ( xhr.readyState == XMLHttpRequest.DONE ) {
            const xmlDoc = this.responseXML;
            sitesListSize = xmlDoc.getElementsByTagName( 'row' ).length
            for ( let i = 0; i < sitesListSize; i++ ) {
                let row = xmlDoc.getElementsByTagName( 'row' )[ i ];
                id = 'id' + row.getElementsByTagName( 'id_number' )[ 0 ].innerHTML;

                sites[ id ] = {};

                sites[ id ].site = row.getElementsByTagName( 'site' )[ 0 ].innerHTML;
                sites[ id ].category = row.getElementsByTagName( 'category' )[ 0 ].innerHTML;
                sites[ id ].dateInscribed = Number( row.getElementsByTagName( 'date_inscribed' )[ 0 ].innerHTML );
                sites[ id ].latitude = Number( row.getElementsByTagName( 'latitude' )[ 0 ].innerHTML );
                sites[ id ].longitude = Number( row.getElementsByTagName( 'longitude' )[ 0 ].innerHTML );
                sites[ id ].phi = ( ( -sites[ id ][ 'latitude' ] + 90 ) / 180 ) * Math.PI;
                sites[ id ].theta = ( ( sites[ id ][ 'longitude' ] + 90 ) / 180 ) * Math.PI;

                place.setFromSphericalCoords( earthRadius, sites[ id ].phi, sites[ id ].theta );

                // sites[ id ][ 'siteGeometry' ] = new THREE.PlaneGeometry( 0.005, 0.005 );
                // sites[ id ][ 'siteMaterial' ] = new THREE.MeshBasicMaterial( {
                //     side: THREE.DoubleSide,
                //     transparent: true,
                //     alphaMap: textureLoader.load( '/textures/place.png' ),
                //     depthWrite: false,
                // } );

                // sites[ id ][ 'siteMesh' ] = new THREE.Mesh( sites[ id ][ 'siteGeometry' ], sites[ id ][ 'siteMaterial' ] );
                // sites[ id ][ 'siteMesh' ].position.set( place.x, place.y, place.z );
                // sites[ id ][ 'siteMesh' ].lookAt( 0, 0, 0 );
                // scene.add( sites[ id ][ 'siteMesh' ] );

                sites[ id ].labelDiv = document.createElement( 'div' );
                sites[ id ].labelDiv.className = 'label';
                sites[ id ].label = new CSS2DObject( sites[ id ].labelDiv );
                sites[ id ].label.position.set( place.x, place.y, place.z );
                earth.add( sites[ id ].label );

                switch ( sites[ id ].category ) {
                    case 'Natural':
                        // sites[ id ][ 'siteMaterial' ].color = new THREE.Color( 0x00ff00 );
                        sites[ id ].labelDiv.innerHTML = '<i class="fa-solid fa-tree"></i>';
                        sites[ id ].labelDiv.style.color = '#b7b7a4'
                        break;
                    case 'Cultural':
                        // sites[ id ][ 'siteMaterial' ].color = new THREE.Color( 0xff0000 );
                        sites[ id ].labelDiv.innerHTML = '<i class="fa-solid fa-landmark"></i>';
                        sites[ id ].labelDiv.style.color = '#ddbea9'
                        break;
                    case 'Mixed':
                        // sites[ id ][ 'siteMaterial' ].color = new THREE.Color( 0xffff00 );
                        sites[ id ].labelDiv.innerHTML = '<i class="fa-solid fa-circle-plus"></i>';
                        sites[ id ].labelDiv.style.color = '#ffe8d6'
                        break;
                }
            }
        }
    };
    xhr.open( 'GET', sitesSrc, true );
    xhr.send( null );

    console.log( sites );

    //

    // WebGL Renderer
    renderer = new THREE.WebGLRenderer( { antialias: true, alpha: true } );
    renderer.setPixelRatio( Math.min( window.devicePixelRatio, 2 ) );
    renderer.setSize( sizes.width, sizes.height );
    renderer.domElement.style.zIndex = '0';
    document.body.appendChild( renderer.domElement );

    // CSS2D Renderer
    css2DRenderer = new CSS2DRenderer();
    css2DRenderer.setSize( sizes.width, sizes.height );
    css2DRenderer.domElement.style.position = 'absolute';
    css2DRenderer.domElement.style.top = '0px';
    css2DRenderer.domElement.style.zIndex = '1';
    document.body.appendChild( css2DRenderer.domElement );


    // Controls
    controls = new OrbitControls( camera, css2DRenderer.domElement );
    controls.target.set( 0, 0, 0 );
    controls.autoRotate = true;
    controls.enableDamping = true;
    controls.dampingFactor = 0.25;
    controls.enablePan = false;
    controls.maxDistance = 5;
    controls.minDistance = 1.025;
    controls.rotateSpeed = Math.sqrt( earth.position.distanceTo( camera.position ) - 1 );
    window.addEventListener(
        'click',
        () => { controls.autoRotate = false },
        { once: true }
    )

    //

    window.addEventListener( 'resize', onWindowResize );

};

function labelsDistanceTest() {
    Object.keys( sites ).forEach( id => {
        if ( sites[ id ].label.position.distanceTo( camera.position ) >
            earth.position.distanceTo( camera.position ) * Math.cos( camera.fov * Math.PI / 360 ) ) {
            sites[ id ].labelDiv.style.visibility = 'hidden'
        } else {
            sites[ id ].labelDiv.style.visibility = 'visible'
        }
    } );
}

function onWindowResize() {

    // Update sizes
    sizes.width = window.innerWidth;
    sizes.height = window.innerHeight;

    // Update camera
    camera.aspect = sizes.width / sizes.height;
    camera.updateProjectionMatrix();

    // Update Renderers
    renderer.setSize( sizes.width, sizes.height );

    // Update CSS2D Renderer
    css2DRenderer.setSize( sizes.width, sizes.height );

}

function animate() {

    requestAnimationFrame( animate );
    const elapsedTime = clock.getElapsedTime();

    // Update Controls
    controls.update();
    controls.rotateSpeed = Math.sqrt( earth.position.distanceTo( camera.position ) - 1 );

    labelsDistanceTest()

    // Update Renderers
    renderer.render( scene, camera );
    css2DRenderer.render( scene, camera );

}

