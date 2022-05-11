import * as THREE from 'three';

import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer';

import './style.css';

let camera, scene, canvas, controls, renderer, css2DRenderer;

const clock = new THREE.Clock();
const textureLoader = new THREE.TextureLoader();

const sizes = { width: window.innerWidth, height: window.innerHeight, };

init();
animate();

function init() {

    // Scene
    scene = new THREE.Scene()

    // Initial camera
    camera = new THREE.PerspectiveCamera( 60, sizes.width / sizes.height, 0.1, 100 );
    camera.position.set( 2.5, 0, 0 );
    scene.add( camera );

    // Canvas
    canvas = document.querySelector( 'canvas.webgl' );

    // Lights
    const ambientLight = new THREE.AmbientLight( 0xffffff, 5 );
    scene.add( ambientLight );

    //

    // Textures
    const placeTexture = textureLoader.load( '/textures/place.png' );

    // Earth
    const earthRadius = 1;
    const earthGeometry = new THREE.SphereGeometry( earthRadius, 180, 90 );
    const earthMaterial = new THREE.MeshStandardMaterial( {
        color: '#444',
        map: textureLoader.load( '/textures/earth/8k_earth_daymap.jpg' ),
        metalness: 0,
        roughness: 0.5,
        wireframe: false,
    } );
    const earth = new THREE.Mesh( earthGeometry, earthMaterial );
    scene.add( earth );

    const earthDiv = document.createElement( 'div' );
    earthDiv.className = 'label';
    earthDiv.textContent = 'Earth';
    earthDiv.style.marginTop = '-1em';
    const earthLabel = new CSS2DObject( earthDiv );
    earthLabel.position.set( 0, earthRadius, 0 );
    earth.add( earthLabel );
    earthLabel.layers.set( 0 )


    // Sites
    const place = new THREE.Vector3();
    const sites = {};
    const sitesSrc = '/xml/whc-en.xml';
    const xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function () {
        if ( xhr.readyState == XMLHttpRequest.DONE ) {
            const xmlDoc = this.responseXML;
            for ( let i = 0; i < xmlDoc.getElementsByTagName( 'row' ).length; i++ ) {
                let row = xmlDoc.getElementsByTagName( 'row' )[ i ];
                let id = 'id' + row.getElementsByTagName( 'id_number' )[ 0 ].innerHTML;

                sites[ id ] = {};

                sites[ id ][ 'site' ] = row.getElementsByTagName( 'site' )[ 0 ].innerHTML;
                sites[ id ][ 'category' ] = row.getElementsByTagName( 'category' )[ 0 ].innerHTML;
                sites[ id ][ 'dateInscribed' ] = Number( row.getElementsByTagName( 'date_inscribed' )[ 0 ].innerHTML );
                sites[ id ][ 'latitude' ] = Number( row.getElementsByTagName( 'latitude' )[ 0 ].innerHTML );
                sites[ id ][ 'longitude' ] = Number( row.getElementsByTagName( 'longitude' )[ 0 ].innerHTML );
                sites[ id ][ 'phi' ] = ( ( -sites[ id ][ 'latitude' ] + 90 ) / 180 ) * Math.PI;
                sites[ id ][ 'theta' ] = ( ( sites[ id ][ 'longitude' ] + 90 ) / 180 ) * Math.PI;

                place.setFromSphericalCoords( earthRadius, sites[ id ][ 'phi' ], sites[ id ][ 'theta' ] );

                sites[ id ][ 'siteGeometry' ] = new THREE.PlaneGeometry( 0.005, 0.005 );
                sites[ id ][ 'siteMaterial' ] = new THREE.MeshBasicMaterial( {
                    side: THREE.DoubleSide,
                    transparent: true,
                    alphaMap: placeTexture,
                    depthWrite: false,
                } );

                switch ( sites[ id ][ 'category' ] ) {
                    case 'Natural':
                        sites[ id ][ 'siteMaterial' ].color = new THREE.Color( 0x00ff00 );
                        break;
                    case 'Cultural':
                        sites[ id ][ 'siteMaterial' ].color = new THREE.Color( 0xff0000 );
                        break;
                    case 'Mixed':
                        sites[ id ][ 'siteMaterial' ].color = new THREE.Color( 0xffff00 );
                        break;
                }

                sites[ id ][ 'siteMesh' ] = new THREE.Mesh( sites[ id ][ 'siteGeometry' ], sites[ id ][ 'siteMaterial' ] );
                sites[ id ][ 'siteMesh' ].position.set( place.x, place.y, place.z );
                sites[ id ][ 'siteMesh' ].lookAt( 0, 0, 0 );
                scene.add( sites[ id ][ 'siteMesh' ] );
            }
        }
    };
    xhr.open( 'GET', sitesSrc, true );
    xhr.send( null );

    console.log( sites );

    //

    // WebGL Renderer
    renderer = new THREE.WebGLRenderer( {
        canvas: canvas,
        antialias: true,
        alpha: true,
    } );
    renderer.setPixelRatio( Math.min( window.devicePixelRatio, 2 ) );
    renderer.setSize( sizes.width, sizes.height );

    // CSS2D Renderer
    css2DRenderer = new CSS2DRenderer();
    css2DRenderer.setSize( sizes.width, sizes.height );

    // Controls
    controls = new OrbitControls( camera, renderer.domElement );
    controls.target.set( 0, 0, 0 );
    controls.autoRotate = true;
    controls.enableDamping = false;
    controls.enablePan = false;
    controls.maxDistance = 5;
    controls.minDistance = 1.25;
    controls.rotateSpeed = 0.5;
    window.addEventListener(
        'click',
        () => { controls.autoRotate = false },
        { once: true }
    )

    //

    window.addEventListener( 'resize', onWindowResize );

};

function onWindowResize() {

    // Update sizes
    sizes.width = window.innerWidth;
    sizes.height = window.innerHeight;

    // Update camera
    camera.aspect = sizes.width / sizes.height;
    camera.updateProjectionMatrix();

    // Update WebGL Renderer
    renderer.setSize( sizes.width, sizes.height );

    // Update CSS2D Renderer
    css2DRenderer.setSize( sizes.width, sizes.height );

}

function animate() {

    requestAnimationFrame( animate );

    const elapsedTime = clock.getElapsedTime();

    controls.update();

    renderer.render( scene, camera );
    css2DRenderer.render( scene, camera );

}

