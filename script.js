const container = document.getElementById("container");
const clock = new THREE.Clock();
let scene, camera, renderer, material;
let fps30 = false;
let settings = { fps: 30, parallaxVal: 5 };

async function init() {
  renderer = new THREE.WebGLRenderer({
    antialias: false,
  });
  renderer.setSize(window.innerWidth, window.innerHeight, 2);
  container.appendChild(renderer.domElement);
  scene = new THREE.Scene();
  camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  material = new THREE.ShaderMaterial({
    uniforms: {
      u_time: { value: clock.getElapsedTime(), type: "f" },
      u_intensity: { value: 0.4, type: "f" },
      u_speed: { value: 0.25, type: "f" },
      u_brightness: { value: 0.8, type: "f" },
      u_normal: { value: 0.5, type: "f" },
      u_zoom: { value: 2.61, type: "f" },
      u_blur_intensity: { value: 0.5, type: "f" },
      u_blur_iterations: { value: 32, type: "i" },
      u_panning: { value: false, type: "b" },
      u_post_processing: { value: true, type: "b" },
      u_lightning: { value: false, type: "b" },
      u_tex0: { value: new THREE.TextureLoader().load("image.jpg"), type: "t" },
      //u_tex0: {value: new THREE.VideoTexture(createVideo("video.mp4")), type: 't'}
      u_resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
    },
    vertexShader: `
          varying vec2 vUv;        
          void main() {
              vUv = uv;
              gl_Position = vec4( position, 1.0 );    
          }
        `,
  });
  material.fragmentShader = await (await fetch("frag.glsl")).text();

  const quad = new THREE.Mesh(new THREE.PlaneBufferGeometry(2, 2, 1, 1), material);
  scene.add(quad);
}

window.addEventListener("resize", function (e) {
  renderer.setSize(window.innerWidth, window.innerHeight, 2);

  material.uniforms.u_resolution.value = new THREE.Vector2(window.innerWidth, window.innerHeight);
});

function render() {
  setTimeout(function () {
    requestAnimationFrame(render);
  }, 1000 / settings.fps);

  material.uniforms.u_time.value = clock.getElapsedTime();

  renderer.render(scene, camera);
}

init();
render();
createWebUI();

function createWebUI() {
  let gui = new dat.GUI();
  gui.add(material.uniforms.u_intensity, "value", 0, 10, 0.01).name("Intensity");
  gui.add(material.uniforms.u_speed, "value", 0, 10, 0.01).name("Speed");
  gui.add(material.uniforms.u_brightness, "value", 0, 10, 0.01).name("Brightness");
  gui.add(material.uniforms.u_normal, "value", 0, 10, 0.01).name("Normal");
  gui.add(material.uniforms.u_zoom, "value", 0.1, 3.0, 0.01).name("Zoom");
  gui.add(material.uniforms.u_blur_iterations, "value", 1, 64, 1).name("Blur Quality");
  gui.add(material.uniforms.u_blur_intensity, "value", 0, 10, 0.01).name("Blur");
  gui.add(material.uniforms.u_panning, "value").name("Panning");
  gui.add(material.uniforms.u_post_processing, "value").name("Post Porcessing");
  gui.add(material.uniforms.u_lightning, "value").name("Lightning");
  gui.add(settings, "parallaxVal", 0, 5, 1).name("Parallax");
  gui.add(settings, "fps").name("FPS");
}

function createVideo(src) {
  let htmlVideo = document.createElement("video");
  htmlVideo.src = src;
  htmlVideo.muted = true;
  htmlVideo.loop = true;
  htmlVideo.play();
  return htmlVideo;
}

document.addEventListener("mousemove", function (event) {
  if (settings.parallaxVal == 0) return;

  const x = (window.innerWidth - event.pageX * settings.parallaxVal) / 90;
  const y = (window.innerHeight - event.pageY * settings.parallaxVal) / 90;

  container.style.transform = `translateX(${x}px) translateY(${y}px) scale(1.09)`;
});
