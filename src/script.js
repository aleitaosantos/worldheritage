import * as THREE from 'three'; import { Vector3 } from 'three';
Object

import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer';

import './style.css';

let camera, scene, controls, renderer, directionalLight, earth, sun, earthRadius, id, place, sitesListSize, css2DRenderer;

const clock = new THREE.Clock();
const textureLoader = new THREE.TextureLoader();
const sites = {};

const canvas = document.querySelector( '.navigation' )

const sizes = {
    width: canvas.offsetWidth,
    height: canvas.offsetHeight,
};

init();
animate();

function init() {

    // Scene
    scene = new THREE.Scene()

    // Initial camera
    camera = new THREE.PerspectiveCamera( 60, sizes.width / sizes.height, 0.01, 20 );
    camera.position.set( 2.5, 0, 0 );
    scene.add( camera );

    // Lights
    const ambientLight = new THREE.AmbientLight( 0xffcccc, 0.5 );

    directionalLight = new THREE.DirectionalLight( 0xccffff, 0.5 );
    directionalLight.position.set( 0, 5, 10 )

    scene.add( ambientLight, directionalLight );

    //

    // Earth
    earthRadius = 1;
    const earthGeometry = new THREE.SphereGeometry( earthRadius, 180, 90 );
    const earthMaterial = new THREE.MeshStandardMaterial( {
        // color: '#444',
        map: textureLoader.load( '/textures/earth/8k_earth_map.png' ),
        roughness: 0.5,
        roughnessMap: textureLoader.load( '/textures/earth/8k_earth_specular.png' ),
        normalMap: textureLoader.load( '/textures/earth/8k_earth_normal_map.png' ),
        normalScale: new THREE.Vector2( 0.25, 0.25 ),
        metalness: 0.25,
        roughness: 0.5,
        wireframe: false,
    } );
    earth = new THREE.Mesh( earthGeometry, earthMaterial );
    scene.add( earth );


    // Sun
    const sunGeometry = new THREE.SphereGeometry( 0.1, 180, 90 );
    const sunMaterial = new THREE.MeshBasicMaterial( { color: '#fff' } )
    sun = new THREE.Mesh( sunGeometry, sunMaterial );
    sun.position.set( 0, 5, 10 )
    scene.add( sun );

    // Sites
    place = new THREE.Vector3();
    const sitesSrc = '/xml/whc-en.xml';
    // const sitesSrc = 'https://whc.unesco.org/en/list/xml';
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
                sites[ id ].danger = Boolean( row.getElementsByTagName( 'danger' )[ 0 ].innerHTML );
                sites[ id ].latitude = Number( row.getElementsByTagName( 'latitude' )[ 0 ].innerHTML );
                sites[ id ].longitude = Number( row.getElementsByTagName( 'longitude' )[ 0 ].innerHTML );
                sites[ id ].phi = ( ( -sites[ id ][ 'latitude' ] + 90 ) / 180 ) * Math.PI;
                sites[ id ].theta = ( ( sites[ id ][ 'longitude' ] + 90 ) / 180 ) * Math.PI;

                place.setFromSphericalCoords( earthRadius, sites[ id ].phi, sites[ id ].theta );

                sites[ id ].labelDiv = document.createElement( 'div' );
                sites[ id ].labelDiv.className = 'label tooltip';
                sites[ id ].labelDiv.addEventListener( 'click', () => { console.log( 'click' ) } );
                sites[ id ].label = new CSS2DObject( sites[ id ].labelDiv );
                sites[ id ].label.position.set( place.x, place.y, place.z );
                earth.add( sites[ id ].label );

                switch ( sites[ id ].category ) {
                    case 'Natural':
                        // sites[ id ][ 'siteMaterial' ].color = new THREE.Color( 0x00ff00 );
                        sites[ id ].labelDiv.innerHTML = `<i class="fa-solid fa-tree"></i><span class="tooltiptext">${ stringToHTML( sites[ id ].site ).innerText }</span>`;
                        sites[ id ].labelDiv.style.color = ( sites[ id ].danger ? '#b88181' : '#b7b7a4' )
                        break;
                    case 'Cultural':
                        // sites[ id ][ 'siteMaterial' ].color = new THREE.Color( 0xff0000 );
                        sites[ id ].labelDiv.innerHTML = `<i class="fa-solid fa-landmark"></i><span class="tooltiptext">${ stringToHTML( sites[ id ].site ).innerText }</span>`;
                        sites[ id ].labelDiv.style.color = ( sites[ id ].danger ? '#b88181' : '#ddbea9' )
                        break;
                    case 'Mixed':
                        // sites[ id ][ 'siteMaterial' ].color = new THREE.Color( 0xffff00 );
                        sites[ id ].labelDiv.innerHTML = `<i class="fa-solid fa-circle-plus"></i><span class="tooltiptext">${ stringToHTML( sites[ id ].site ).innerText }</span>`;
                        sites[ id ].labelDiv.style.color = ( sites[ id ].danger ? '#b88181' : '#ffe8d6' )
                        break;
                }
            }
        }
    };
    xhr.open( 'GET', sitesSrc );
    xhr.send();

    console.log( sites );

    //

    // WebGL Renderer
    renderer = new THREE.WebGLRenderer( { antialias: true, alpha: true } );
    renderer.setPixelRatio( Math.min( window.devicePixelRatio, 2 ) );
    renderer.setSize( sizes.width, sizes.height );
    renderer.domElement.style.zIndex = '0';
    canvas.appendChild( renderer.domElement );

    // CSS2D Renderer
    css2DRenderer = new CSS2DRenderer();
    css2DRenderer.setSize( sizes.width, sizes.height );
    css2DRenderer.domElement.style.position = 'absolute';
    css2DRenderer.domElement.style.top = '0px';
    css2DRenderer.domElement.style.zIndex = '1';
    canvas.appendChild( css2DRenderer.domElement );


    // Controls
    controls = new OrbitControls( camera, css2DRenderer.domElement );
    controls.target.set( 0, 0, 0 );
    controls.autoRotate = true;
    controls.autoRotateSpeed = 2;
    controls.enableDamping = true;
    controls.dampingFactor = 0.25;
    controls.enablePan = false;
    controls.maxDistance = 5;
    controls.minDistance = 1.10;
    controls.rotateSpeed = Math.sqrt( earth.position.distanceTo( camera.position ) - 1 );
    canvas.addEventListener(
        'click',
        () => { controls.autoRotate = false },
        { once: true }
    )

    //

    window.addEventListener( 'resize', onWindowResize );

};

function labelsUpdate() {
    Object.keys( sites ).forEach( id => {
        if ( sites[ id ].label.position.distanceTo( camera.position ) >
            Math.sqrt( ( earth.position.distanceTo( camera.position ) ** 2 ) - ( earthRadius ** 2 ) )
            || sites[ id ].dateInscribed > slider.value
        ) {
            sites[ id ].labelDiv.style.visibility = 'hidden'
        } else {
            sites[ id ].labelDiv.style.visibility = 'visible'
        }
    } );
}



function onWindowResize() {

    // Update sizes
    sizes.width = canvas.offsetWidth,
        sizes.height = canvas.offsetHeight,

        // Update camera
        camera.aspect = sizes.width / sizes.height;
    camera.updateProjectionMatrix();

    // Update Labels
    labelsUpdate()

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

    // Update Labels
    labelsUpdate()

    // Update objects
    directionalLight.position.z = Math.sin( ( elapsedTime + 25 ) / 25 ) * 10
    directionalLight.position.x = Math.cos( ( elapsedTime + 25 ) / 25 ) * 10
    // directionalLight.lookAt( earth.position )

    sun.position.z = Math.sin( ( elapsedTime + 25 ) / 25 ) * 10
    sun.position.x = Math.cos( ( elapsedTime + 25 ) / 25 ) * 10

    // Update Renderers
    renderer.render( scene, camera );
    css2DRenderer.render( scene, camera );

}

// Current Year
let currentYear = new Date().getFullYear();
document.getElementById( "currentYear" ).innerHTML = currentYear;

// Slider
var slider = document.getElementById( "yearRange" );
var output = document.getElementById( "demo" );
output.innerHTML = slider.value;

slider.oninput = function () {
    output.innerHTML = this.value;
}

// Site Interaction
function siteClick() {
    console.log( 'clicked' )
}

function stringToHTML( str ) {
    var dom = document.createElement( 'div' );
    dom.innerHTML = str;
    return dom;
};

