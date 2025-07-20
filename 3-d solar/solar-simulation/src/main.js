let scene, camera, renderer, clock;
let sun, planets = [];
let controls, raycaster, mouse;
let isPaused = false;
let isDarkTheme = true;
let stars;
let globalSpeedMultiplier = 1.0;

const planetData = [
            { name: 'Mercury', size: 0.4, distance: 15, speed: 4.74, color: 0x8c7853, info: 'Closest planet to the Sun' },
            { name: 'Venus', size: 0.9, distance: 20, speed: 3.50, color: 0xffc649, info: 'Hottest planet in our solar system' },
            { name: 'Earth', size: 1.0, distance: 25, speed: 2.98, color: 0x6b93d6, info: 'Our home planet with life' },
            { name: 'Mars', size: 0.5, distance: 30, speed: 2.41, color: 0xc1440e, info: 'The Red Planet' },
            { name: 'Jupiter', size: 2.5, distance: 40, speed: 1.31, color: 0xd8ca9d, info: 'Largest planet in our solar system' },
            { name: 'Saturn', size: 2.1, distance: 50, speed: 0.97, color: 0xfad5a5, info: 'Famous for its beautiful rings' },
            { name: 'Uranus', size: 1.6, distance: 60, speed: 0.68, color: 0x4fd0e7, info: 'Tilted on its side' },
            { name: 'Neptune', size: 1.5, distance: 70, speed: 0.54, color: 0x4b70dd, info: 'Windiest planet in our solar system' }
];

function init() {
            // Create scene
            scene = new THREE.Scene();
            
            // Create camera
            camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
            camera.position.set(0, 50, 80);
            
            // Create renderer
            renderer = new THREE.WebGLRenderer({ antialias: true });
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.shadowMap.enabled = true;
            renderer.shadowMap.type = THREE.PCFSoftShadowMap;
            document.getElementById('canvas-container').appendChild(renderer.domElement);
            
            // Initialize clock
            clock = new THREE.Clock();
            
            // Create controls
            setupControls();
            
            // Create lighting
            setupLighting();
            
            // Create background stars
            createStars();
            
            // Create sun
            createSun();
            
            // Create planets
            createPlanets();
            
            // Setup mouse interaction
            setupMouseInteraction();
            
            // Create control panel
            createControlPanel();
            
            // Setup event listeners
            setupEventListeners();
            
            // Hide loading screen
            document.getElementById('loading').style.display = 'none';
            
            // Start animation
            animate();
}

function setupControls() {
            let isMouseDown = false;
            let mouseX = 0, mouseY = 0;
            let targetRotationX = 0, targetRotationY = 0;
            let rotationX = 0, rotationY = 0;

            renderer.domElement.addEventListener('mousedown', (e) => {
                isMouseDown = true;
                mouseX = e.clientX;
                mouseY = e.clientY;
            });

            renderer.domElement.addEventListener('mouseup', () => {
                isMouseDown = false;
            });

            renderer.domElement.addEventListener('mousemove', (e) => {
                if (isMouseDown) {
                    const deltaX = e.clientX - mouseX;
                    const deltaY = e.clientY - mouseY;
                    
                    targetRotationY += deltaX * 0.01;
                    targetRotationX += deltaY * 0.01;
                    
                    mouseX = e.clientX;
                    mouseY = e.clientY;
                }
            });

            renderer.domElement.addEventListener('wheel', (e) => {
                e.preventDefault();
                camera.position.multiplyScalar(e.deltaY > 0 ? 1.1 : 0.9);
                camera.position.clampLength(30, 200);
            });

            function updateControls() {
                rotationX += (targetRotationX - rotationX) * 0.05;
                rotationY += (targetRotationY - rotationY) * 0.05;
                
                const radius = camera.position.length();
                camera.position.x = Math.sin(rotationY) * Math.cos(rotationX) * radius;
                camera.position.y = Math.sin(rotationX) * radius;
                camera.position.z = Math.cos(rotationY) * Math.cos(rotationX) * radius;
                camera.lookAt(0, 0, 0);
            }

            controls = { update: updateControls };
}

function setupLighting() {
            const ambientLight = new THREE.AmbientLight(0x404040, 0.1);
            scene.add(ambientLight);
            
            const sunLight = new THREE.PointLight(0xffffff, 2, 1000);
            sunLight.position.set(0, 0, 0);
            sunLight.castShadow = true;
            sunLight.shadow.mapSize.width = 2048;
            sunLight.shadow.mapSize.height = 2048;
            scene.add(sunLight);
}

function createStars() {
            const starsGeometry = new THREE.BufferGeometry();
            const starsMaterial = new THREE.PointsMaterial({
                color: 0xffffff,
                size: 1,
                sizeAttenuation: true
            });

            const starsVertices = [];
            for (let i = 0; i < 10000; i++) {
                const x = (Math.random() - 0.5) * 2000;
                const y = (Math.random() - 0.5) * 2000;
                const z = (Math.random() - 0.5) * 2000;
                starsVertices.push(x, y, z);
            }

            starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starsVertices, 3));
            stars = new THREE.Points(starsGeometry, starsMaterial);
            scene.add(stars);
}

function createSun() {
            const sunGeometry = new THREE.SphereGeometry(5, 32, 32);
            const sunMaterial = new THREE.MeshBasicMaterial({
                color: 0xffff00,
                emissive: 0xffaa00,
                emissiveIntensity: 0.3
            });
            sun = new THREE.Mesh(sunGeometry, sunMaterial);
            scene.add(sun);
}

function createPlanets() {
            planetData.forEach((data, index) => {
                const planetGeometry = new THREE.SphereGeometry(data.size, 32, 32);
                const planetMaterial = new THREE.MeshLambertMaterial({ color: data.color });
                const planet = new THREE.Mesh(planetGeometry, planetMaterial);
                
                planet.castShadow = true;
                planet.receiveShadow = true;
                planet.userData = { ...data };
                planet.userData.angle = Math.random() * Math.PI * 2;
                planet.userData.currentSpeed = data.speed;
                planet.userData.originalSpeed = data.speed;
                
                planet.position.x = Math.cos(planet.userData.angle) * data.distance;
                planet.position.z = Math.sin(planet.userData.angle) * data.distance;
                
                planets.push(planet);
                scene.add(planet);

                // Create orbit line
                const orbitGeometry = new THREE.RingGeometry(data.distance - 0.1, data.distance + 0.1, 64);
                const orbitMaterial = new THREE.MeshBasicMaterial({
                    color: 0x333333,
                    side: THREE.DoubleSide,
                    transparent: true,
                    opacity: 0.3
                });
                const orbit = new THREE.Mesh(orbitGeometry, orbitMaterial);
                orbit.rotation.x = -Math.PI / 2;
                scene.add(orbit);
            });
}

function setupMouseInteraction() {
            raycaster = new THREE.Raycaster();
            mouse = new THREE.Vector2();

            function onMouseMove(event) {
                mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
                mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

                raycaster.setFromCamera(mouse, camera);
                const intersects = raycaster.intersectObjects(planets);

                if (intersects.length > 0) {
                    const planet = intersects[0].object;
                    const data = planet.userData;
                    document.getElementById('planet-info').innerHTML = `
                        <div class="planet-name">${data.name}</div>
                        <div>${data.info}</div>
                        <div>Size: ${data.size} Earth radii</div>
                        <div>Distance: ${data.distance} AU</div>
                        <div>Current Speed: ${data.currentSpeed.toFixed(2)}x</div>
                        <div>Global Multiplier: ${globalSpeedMultiplier.toFixed(1)}x</div>
                    `;
                } else {
                    document.getElementById('planet-info').innerHTML = `
                        <div class="planet-name">Solar System</div>
                        <div>Hover over planets to see details</div>
                        <div>Use mouse to rotate view</div>
                        <div>Scroll to zoom in/out</div>
                        <div>Global Speed: ${globalSpeedMultiplier.toFixed(1)}x</div>
                    `;
                }
            }

            renderer.domElement.addEventListener('mousemove', onMouseMove);
}

function createControlPanel() {
            const controlsContainer = document.getElementById('planet-controls');
            
            planetData.forEach((data, index) => {
                const controlDiv = document.createElement('div');
                controlDiv.className = `planet-control ${data.name.toLowerCase()}`;
                
                controlDiv.innerHTML = `
                    <label for="speed-${index}">${data.name}</label>
                    <div class="control-row">
                        <input type="range" id="speed-${index}" min="0" max="10" step="0.1" value="${data.speed}">
                        <div class="speed-display" id="display-${index}">${data.speed.toFixed(1)}x</div>
                        <button class="reset-btn" data-index="${index}">Reset</button>
                    </div>
                `;
                
                controlsContainer.appendChild(controlDiv);
                
                // Add event listeners
                const slider = controlDiv.querySelector('input');
                const display = controlDiv.querySelector('.speed-display');
                const resetBtn = controlDiv.querySelector('.reset-btn');
                
                slider.addEventListener('input', (e) => {
                    const speed = parseFloat(e.target.value);
                    planets[index].userData.currentSpeed = speed;
                    display.textContent = speed.toFixed(1) + 'x';
                });

                resetBtn.addEventListener('click', () => {
                    const originalSpeed = planets[index].userData.originalSpeed;
                    slider.value = originalSpeed;
                    planets[index].userData.currentSpeed = originalSpeed;
                    display.textContent = originalSpeed.toFixed(1) + 'x';
                });
            });
}

function setupEventListeners() {
            // Minimize/Maximize panel
            document.getElementById('minimize-btn').addEventListener('click', () => {
                const panel = document.getElementById('control-panel');
                const btn = document.getElementById('minimize-btn');
                
                if (panel.classList.contains('minimized')) {
                    panel.classList.remove('minimized');
                    btn.textContent = '−';
                } else {
                    panel.classList.add('minimized');
                    btn.textContent = '+';
                }
            });

            // Click on minimized panel to maximize
            document.getElementById('control-panel').addEventListener('click', (e) => {
                const panel = document.getElementById('control-panel');
                if (panel.classList.contains('minimized') && e.target === panel) {
                    panel.classList.remove('minimized');
                    document.getElementById('minimize-btn').textContent = '−';
                }
            });

            // Global speed control
            document.getElementById('global-speed').addEventListener('input', (e) => {
                globalSpeedMultiplier = parseFloat(e.target.value);
                document.getElementById('global-speed-display').textContent = globalSpeedMultiplier.toFixed(1) + 'x';
            });

            // Reset global speed
            document.getElementById('reset-global').addEventListener('click', () => {
                globalSpeedMultiplier = 1.0;
                document.getElementById('global-speed').value = 1.0;
                document.getElementById('global-speed-display').textContent = '1.0x';
            });

            // Reset all speeds
            document.getElementById('reset-all').addEventListener('click', () => {
                planets.forEach((planet, index) => {
                    const originalSpeed = planet.userData.originalSpeed;
                    planet.userData.currentSpeed = originalSpeed;
                    document.getElementById(`speed-${index}`).value = originalSpeed;
                    document.getElementById(`display-${index}`).textContent = originalSpeed.toFixed(1) + 'x';
                });
                
                globalSpeedMultiplier = 1.0;
                document.getElementById('global-speed').value = 1.0;
                document.getElementById('global-speed-display').textContent = '1.0x';
            });

            // Pause/Resume button
            document.getElementById('pause-btn').addEventListener('click', () => {
                isPaused = !isPaused;
                document.getElementById('pause-btn').textContent = isPaused ? '▶️ Play' : '⏸️ Pause';
            });

            // Theme toggle
            document.getElementById('theme-toggle').addEventListener('click', () => {
                isDarkTheme = !isDarkTheme;
                document.body.style.background = isDarkTheme ? '#0a0a0a' : '#87CEEB';
                stars.material.color.setHex(isDarkTheme ? 0xffffff : 0x000000);
            });

            // Window resize
            window.addEventListener('resize', () => {
                camera.aspect = window.innerWidth / window.innerHeight;
                camera.updateProjectionMatrix();
                renderer.setSize(window.innerWidth, window.innerHeight);
            });
}

function animate() {
    requestAnimationFrame(animate);
    if (!isPaused) {
    const deltaTime = clock.getDelta();
    // Rotate sun
    sun.rotation.y += deltaTime * 0.5;
    // Animate planets
    planets.forEach((planet, index) => {
        const data = planet.userData;
        // Update orbit position with global speed multiplier
        data.angle += deltaTime * data.currentSpeed * globalSpeedMultiplier * 0.1;
        planet.position.x = Math.cos(data.angle) * planetData[index].distance;
        planet.position.z = Math.sin(data.angle) * planetData[index].distance;
        // Rotate planet
        planet.rotation.y += deltaTime * 2;
        });
    // Animate stars
    stars.rotation.y += deltaTime * 0.02;
    }
    // Update controls
    controls.update();
    // Render scene
    renderer.render(scene, camera);
}

init();