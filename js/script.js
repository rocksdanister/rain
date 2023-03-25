const container = document.getElementById("container");
let clock = new THREE.Clock();
const gui = new dat.GUI();

let scene, camera, renderer, material;
let fps30 = false;
let settings = { fps: 30, parallaxVal: 1 };

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
      u_time: { value: 0, type: "f" },
      u_intensity: { value: 0.4, type: "f" },
      u_speed: { value: 0.25, type: "f" },
      u_brightness: { value: 0.8, type: "f" },
      u_normal: { value: 0.5, type: "f" },
      u_zoom: { value: 2.61, type: "f" },
      u_blur_intensity: { value: 0.5, type: "f" },
      u_blur_iterations: { value: 16, type: "i" },
      u_panning: { value: false, type: "b" },
      u_post_processing: { value: true, type: "b" },
      u_lightning: { value: false, type: "b" },
      u_tex0: { value: new THREE.TextureLoader().load("media/image.jpg"), type: "t" },
      //u_tex0: { value: new THREE.VideoTexture(createVideo("media/video.mp4")), type: "t" },
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
  material.fragmentShader = await (await fetch("shaders/rain.frag")).text();

  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2, 1, 1), material);
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

  //reset every 6hr
  if (clock.getElapsedTime() > 21600) clock = new THREE.Clock();
  material.uniforms.u_time.value = clock.getElapsedTime().toFixed(2);

  renderer.render(scene, camera);
}

init();
render();
createWebUI();

//lively
function livelyPropertyListener(name, val) {
  switch (name) {
    case "blurIntensity":
      material.uniforms.u_blur_intensity.value = val / 100;
      break;
    case "blurQuality":
      material.uniforms.u_blur_iterations.value = [1, 16, 32, 64][val];
      break;
    case "rainIntensity":
      material.uniforms.u_intensity.value = val / 100;
      break;
    case "rainSpeed":
      material.uniforms.u_speed.value = val / 100;
      break;
    case "brightness":
      material.uniforms.u_brightness.value = val / 100;
      break;
    case "rainNormal":
      material.uniforms.u_normal.value = val / 100;
      break;
    case "rainZoom":
      material.uniforms.u_zoom.value = val / 100;
      break;
    case "mediaSelect":
      {
        let ext = getExtension(val);
        if (ext == "jpg" || ext == "jpeg" || ext == "png")
          material.uniforms.u_tex0.value = new THREE.TextureLoader().load(val);
        else if (ext == "webm") material.uniforms.u_tex0.value = new THREE.VideoTexture(createHtmlVideo(val));
      }
      break;
    case "animateChk":
      material.uniforms.u_panning.value = val;
      break;
    case "lightningChk":
      material.uniforms.u_lightning.value = val;
      break;
    case "postProcessingChk":
      material.uniforms.u_post_processing.value = val;
      break;
    case "parallaxIntensity":
      settings.parallaxVal = val;
      break;
    case "fpsLock":
      settings.fps = val ? 30 : 60;
      break;
    case "debug":
      if (val) gui.show();
      else gui.hide();
      break;
  }
}

//web
function createWebUI() {
  gui.add(material.uniforms.u_intensity, "value", 0, 10, 0.01).name("Intensity");
  gui.add(material.uniforms.u_speed, "value", 0, 10, 0.01).name("Speed");
  gui.add(material.uniforms.u_brightness, "value", 0, 10, 0.01).name("Brightness");
  gui.add(material.uniforms.u_normal, "value", 0, 10, 0.01).name("Normal");
  gui.add(material.uniforms.u_zoom, "value", 0.1, 3.0, 0.01).name("Zoom");
  gui.add(material.uniforms.u_blur_iterations, "value", 1, 64, 1).name("Blur Quality");
  gui.add(material.uniforms.u_blur_intensity, "value", 0, 10, 0.01).name("Blur");
  gui.add(settings, "parallaxVal", 0, 5, 1).name("Parallax");
  gui
    .add(
      {
        picker: function () {
          document.getElementById("filePicker").click();
        },
      },
      "picker"
    )
    .name("Change background");
  gui.add(material.uniforms.u_panning, "value").name("Panning");
  gui.add(material.uniforms.u_post_processing, "value").name("Post Porcessing");
  gui.add(material.uniforms.u_lightning, "value").name("Lightning");
  gui.add(settings, "fps", 15, 120, 15).name("Fps");
  gui
  .add(
    {
      lively: function () {
        window.open("https://www.rocksdanister.com/lively");
      },
    },
    "lively"
  )
  .name("Try it on your desktop");
  gui
    .add(
      {
        source: function () {
          window.open("https://github.com/rocksdanister/rain");
        },
      },
      "source"
    )
    .name("Source code");
  gui.close();
}

document.getElementById("filePicker").addEventListener("change", function () {
  let file = this.files[0];
  if (file.type == "image/jpg" || file.type == "image/jpeg" || file.type == "image/png") {
    material.uniforms.u_tex0.value = new THREE.TextureLoader().load(URL.createObjectURL(file));
  } else if (file.type == "video/mp4" || file.type == "video/webm") {
    material.uniforms.u_tex0.value = new THREE.VideoTexture(createHtmlVideo(URL.createObjectURL(file)));
  }
});

//parallax
document.addEventListener("mousemove", function (event) {
  if (settings.parallaxVal == 0) return;

  const x = (window.innerWidth - event.pageX * settings.parallaxVal) / 90;
  const y = (window.innerHeight - event.pageY * settings.parallaxVal) / 90;

  container.style.transform = `translateX(${x}px) translateY(${y}px) scale(1.09)`;
});

//helpers
function getExtension(filePath) {
  return filePath.substring(filePath.lastIndexOf(".") + 1, filePath.length) || filePath;
}

function createHtmlVideo(src) {
  let htmlVideo = document.createElement("video");
  htmlVideo.src = src;
  htmlVideo.muted = true;
  htmlVideo.loop = true;
  htmlVideo.play();
  return htmlVideo;
}
