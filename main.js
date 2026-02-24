// Main game script using Three.js
(function(){
  const TARGET_SCORE = 1000;
  let score = 0;
  let gameActive = false;

  const container = document.getElementById('container');
  const scoreEl = document.getElementById('score');
  const startBtn = document.getElementById('startBtn');
  const restartBtn = document.getElementById('restartBtn');
  const welcome = document.getElementById('overlay-welcome');
  const endOverlay = document.getElementById('overlay-end');
  const endTitle = document.getElementById('end-title');
  const endScore = document.getElementById('end-score');

  // Three.js setup
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, window.innerWidth/window.innerHeight, 0.1, 1000);
  camera.position.set(0, 6, 12);

  const renderer = new THREE.WebGLRenderer({ antialias:true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x202025);
  container.appendChild(renderer.domElement);

  window.addEventListener('resize', ()=>{
    camera.aspect = window.innerWidth/window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  const light = new THREE.DirectionalLight(0xffffff, 1.0);
  light.position.set(5,10,7);
  scene.add(light);
  scene.add(new THREE.AmbientLight(0xffffff, 0.3));

  // Desk
  const deskGeo = new THREE.BoxGeometry(14, 1, 6);
  const deskMat = new THREE.MeshStandardMaterial({ color:0x59310f });
  const desk = new THREE.Mesh(deskGeo, deskMat);
  desk.position.set(0, 0.5, 0);
  scene.add(desk);

  // Shooter: create a human-like shooter (procedural)
  function createHuman(){
    const human = new THREE.Group();
    const skinMat = new THREE.MeshStandardMaterial({ color:0xffd8c4, metalness:0, roughness:0.7 });
    const clothMat = new THREE.MeshStandardMaterial({ color:0x3b6, metalness:0.1, roughness:0.6 });
    const pantsMat = new THREE.MeshStandardMaterial({ color:0x223344, metalness:0.1, roughness:0.6 });

    const pelvis = new THREE.Mesh(new THREE.BoxGeometry(0.6,0.3,0.4), pantsMat);
    pelvis.position.y = 0.9; human.add(pelvis);

    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.7,1.0,0.4), clothMat);
    torso.position.y = 1.4; human.add(torso);

    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.09,0.09,0.14,12), skinMat);
    neck.position.y = 1.95; human.add(neck);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.28,16,16), skinMat);
    head.position.y = 2.4; human.add(head);

    const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.05,8,8), new THREE.MeshStandardMaterial({ color:0x111111 }));
    const eyeR = eyeL.clone(); eyeL.position.set(-0.08,2.45,0.24); eyeR.position.set(0.08,2.45,0.24);
    human.add(eyeL, eyeR);

    const armL = new THREE.Mesh(new THREE.CylinderGeometry(0.08,0.08,0.9,12), skinMat);
    armL.position.set(-0.55,1.45,0); armL.rotation.z = Math.PI/9; human.add(armL);
    const armR = armL.clone(); armR.position.x = 0.55; armR.rotation.z = -Math.PI/9; human.add(armR);

    const legL = new THREE.Mesh(new THREE.CylinderGeometry(0.10,0.10,1.0,12), pantsMat);
    legL.position.set(-0.18,0.2,0); human.add(legL);
    const legR = legL.clone(); legR.position.x = 0.18; human.add(legR);

    // attach a procedural gun to right hand area
    const gun = new THREE.Group();
    const gunMat = new THREE.MeshStandardMaterial({ color:0x222233, metalness:0.9, roughness:0.15 });
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.06,0.06,1.2,12), gunMat);
    barrel.rotation.z = Math.PI/2; barrel.position.set(0.6, -0.15, 0.12);
    const bodyG = new THREE.Mesh(new THREE.BoxGeometry(0.5,0.18,0.25), gunMat);
    bodyG.position.set(0.1, -0.15, 0.12);
    const muzzle = new THREE.Mesh(new THREE.CylinderGeometry(0.08,0.08,0.12,12), new THREE.MeshStandardMaterial({ color:0xffaa88, emissive:0xffaa88, emissiveIntensity:0.0 }));
    muzzle.rotation.z = Math.PI/2; muzzle.position.set(1.2, -0.15, 0.12);
    gun.add(barrel, bodyG, muzzle);
    gun.position.set(0.9, 2.0, 0.0);
    gun.rotation.z = -Math.PI/12;
    human.add(gun);
    human.userData.gun = { group: gun, muzzle: muzzle };

    human.position.set(-6,0,0);
    return human;
  }

  const body = createHuman();
  scene.add(body);

  // Bottles group
  const bottles = new THREE.Group();
  scene.add(bottles);

  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  const bullets = [];
  // aim state
  const aimBtn = document.getElementById('aimBtn');
  let aiming = false;

  function setAiming(state){
    aiming = state;
    if(aiming){
      camera.fov = 30;
      container.classList.add('aiming');
      aimBtn.classList.add('aiming');
    } else {
      camera.fov = 55;
      container.classList.remove('aiming');
      aimBtn.classList.remove('aiming');
    }
    camera.updateProjectionMatrix();
  }

  aimBtn.addEventListener('click', ()=> setAiming(!aiming));

  // (removed custom gun cursor)

  function spawnBottle(x,z){
    // humanoid target made from primitives
    const target = new THREE.Group();
    const skin = new THREE.MeshStandardMaterial({ color:0xffd8c4, metalness:0.0, roughness:0.7 });
    const clothes = new THREE.MeshStandardMaterial({ color:0x2ecc71, metalness:0.2, roughness:0.4 });

    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.6,0.9,0.35), clothes);
    torso.position.y = 1.05;
    target.add(torso);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.22,12,12), skin);
    head.position.y = 1.65;
    target.add(head);

    const armL = new THREE.Mesh(new THREE.CylinderGeometry(0.08,0.08,0.7,10), skin);
    armL.position.set(-0.44,1.05,0);
    armL.rotation.z = Math.PI/12;
    const armR = armL.clone(); armR.position.x = 0.44; armR.rotation.z = -Math.PI/12;
    target.add(armL, armR);

    const legL = new THREE.Mesh(new THREE.CylinderGeometry(0.09,0.09,0.8,10), clothes);
    legL.position.set(-0.16,0.4,0);
    const legR = legL.clone(); legR.position.x = 0.16;
    target.add(legL, legR);

    target.position.set(x,0,z);
    // store base for movement and current position for smooth movement
    target.userData.baseX = x;
    target.userData.baseZ = z;
    target.userData.currentX = x;
    target.userData.currentZ = z;
    target.userData.isBottle = true;
    bottles.add(target);
    return target;
  }

  // fill initial bottles across desk
  function populateBottles(){
    bottles.clear();
    // spawn only a single target
    const x = 0;
    const z = 0;
    spawnBottle(x,z);
  }

  populateBottles();

  function updateHUD(){ scoreEl.textContent = `Score: ${score}` }

  function endGame(win){
    gameActive = false;
    endOverlay.classList.remove('hidden');
    welcome.classList.add('hidden');
    endTitle.textContent = win ? 'You Win!' : 'You Lose!';
    endScore.textContent = `Final score: ${score}`;
    leavePlayState();
  }

  function restart(){
    score = 0;
    updateHUD();
    bottles.clear();
    populateBottles();
    endOverlay.classList.add('hidden');
    welcome.classList.add('hidden');
    gameActive = true;
    enterPlayState();
  }

  // shoot from center crosshair regardless of pointer location
  function onShoot(){
    if(!gameActive) return;
    raycaster.setFromCamera({ x:0, y:0 }, camera);
    const intersects = raycaster.intersectObjects(bottles.children, true);

    let hit = false;
    let targetPoint;
    let targetBottle = null;
    if(intersects.length>0){
      const hitObj = intersects[0].object;
      function findAncestorBottle(o){
        let cur = o;
        while(cur){ if(cur.userData && cur.userData.isBottle) return cur; cur = cur.parent; }
        return null;
      }
      targetBottle = findAncestorBottle(hitObj);
      if(targetBottle){ hit = true; targetPoint = intersects[0].point.clone(); }
    }
    if(!hit){ const origin = raycaster.ray.origin.clone(); const dir = raycaster.ray.direction.clone(); targetPoint = origin.add(dir.multiplyScalar(80)); }

    // muzzle world position
    let muzzleWorld = new THREE.Vector3();
    if(body && body.userData && body.userData.gun){ body.userData.gun.muzzle.getWorldPosition(muzzleWorld); }
    else { muzzleWorld.set(body.position.x + 0.9, body.position.y + 0.15, body.position.z); }

    spawnBullet(muzzleWorld.clone(), targetPoint.clone(), ()=>{
      if(hit && targetBottle){
        const tb = bottles.getObjectByProperty('uuid', targetBottle.uuid);
        if(tb){
          const nx = (Math.random()*8)-4;
          const nz = (Math.random()*3)-1.5;
          // set new base center; do not teleport — smooth movement will move there
          tb.userData.baseX = nx;
          tb.userData.baseZ = nz;
          score += 1;
          updateHUD();
          if(score>=TARGET_SCORE) endGame(true);
        }
      } else if(!hit){ endGame(false); }
    }, null);

    // recoil and muzzle flash
    body.position.x -= 0.12; setTimeout(()=> body.position.x += 0.12, 80);
    if(body && body.userData && body.userData.gun){ const mu = body.userData.gun.muzzle; const mat = mu.material; const prev = mat.emissiveIntensity || 0; mat.emissiveIntensity = 2.2; setTimeout(()=>{ mat.emissiveIntensity = prev; }, 90); const flash = new THREE.PointLight(0xffaa66,1.2,6,2); const worldPos = new THREE.Vector3(); mu.getWorldPosition(worldPos); flash.position.copy(worldPos); scene.add(flash); setTimeout(()=> scene.remove(flash), 120); }
  }

  // pointer support: shoot from center crosshair
  window.addEventListener('pointerdown', ()=>{ onShoot(); });

  // spawnBullet: create a small projectile that moves toward target and calls onArrive
  // spawnBullet now accepts optional targetUUID as 4th parameter
  function spawnBullet(origin, target, onArrive, targetUUID){
    const geom = new THREE.SphereGeometry(0.06,8,8);
    const mat = new THREE.MeshStandardMaterial({ color:0xdddddd, metalness:0.8, roughness:0.2 });
    const b = new THREE.Mesh(geom, mat);
    b.position.copy(origin);
    scene.add(b);
    const dir = target.clone().sub(origin).normalize();
    const speed = 80; // units per second
    bullets.push({ mesh: b, dir, speed, target, onArrive, targetUUID });
  }

  // explodeTarget removed: targets are repositioned on hit instead of exploding

  // Start / restart handlers
  startBtn.addEventListener('click', ()=>{
    welcome.classList.add('hidden');
    endOverlay.classList.add('hidden');
    score = 0; updateHUD();
    populateBottles();
    gameActive = true;
    container.classList.add('playing');
  });
  restartBtn.addEventListener('click', ()=>{ restart(); });

  function enterPlayState(){ container.classList.add('playing'); }
  function leavePlayState(){ container.classList.remove('playing'); }

  // minimal floor/ground
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(80,80), new THREE.MeshStandardMaterial({color:0x222, side:THREE.DoubleSide}));
  floor.rotation.x = -Math.PI/2; floor.position.y = 0;
  scene.add(floor);

  // small camera orbit
  const clock = new THREE.Clock();
  function animate(){
    requestAnimationFrame(animate);
    const delta = clock.getDelta();
    const t = clock.getElapsedTime();
    camera.position.x = Math.sin(t*0.1)*2;
    camera.lookAt(0,1.2,0);
    // simple idle: slight breathing/shift for human shooter
    if(body){
      const bob = Math.sin(t*1.2) * 0.02;
      body.position.y = bob;
    }

    // move single target slowly while game active (smoothly lerp toward base)
    if(gameActive && bottles.children.length>0){
      const tgt = bottles.children[0];
      if(tgt && tgt.userData){
        const baseX = (typeof tgt.userData.baseX === 'number') ? tgt.userData.baseX : tgt.userData.currentX || tgt.position.x;
        const baseZ = (typeof tgt.userData.baseZ === 'number') ? tgt.userData.baseZ : tgt.userData.currentZ || tgt.position.z;
        tgt.userData.currentX = (typeof tgt.userData.currentX === 'number') ? tgt.userData.currentX : baseX;
        tgt.userData.currentZ = (typeof tgt.userData.currentZ === 'number') ? tgt.userData.currentZ : baseZ;
        // lerp current toward base slowly
        const lerpFactor = Math.min(1, 0.6 * delta);
        tgt.userData.currentX = THREE.MathUtils.lerp(tgt.userData.currentX, baseX, lerpFactor);
        tgt.userData.currentZ = THREE.MathUtils.lerp(tgt.userData.currentZ, baseZ, lerpFactor);
        // small oscillation on table only
        const ox = Math.sin(t*0.6) * 0.12; // slow small sway
        const oz = Math.cos(t*0.45) * 0.08;
        tgt.position.x = tgt.userData.currentX + ox;
        tgt.position.z = tgt.userData.currentZ + oz;
      }
    }

    // update bullets
    if(bullets.length){
      for(let i=bullets.length-1;i>=0;i--){
        const item = bullets[i];
        const move = item.dir.clone().multiplyScalar(item.speed * delta);
        item.mesh.position.add(move);
        if(item.mesh.position.distanceTo(item.target) < 0.2){
          // arrive
          try{ item.onArrive && item.onArrive(); }catch(e){}
          scene.remove(item.mesh);
          bullets.splice(i,1);
        }
      }
    }

    // fragments removed — targets are repositioned instead of exploding

    renderer.render(scene,camera);
  }
  animate();

})();
