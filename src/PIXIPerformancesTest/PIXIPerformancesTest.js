import React, { Component } from 'react';
import * as d3 from 'd3';
import * as PIXI from "pixi.js";
import { Viewport } from "pixi-viewport";

// https://github.com/gpujs/gpu.js
import { GPU } from 'gpu.js';
const gpu = new GPU();

const dpr = window.devicePixelRatio || 1;
const amount = window.prompt("how many flowers do you want to see?", 200000);;
let test_with_gpu = window.confirm("Use the GPU for incrementing x and y positions?\nLooks like it causes a loss in performance.");

class PIXIPerformancesTest extends Component {

  componentDidMount(){
    const width = window.innerWidth / dpr;
    const height = window.innerHeight / dpr;

    let ticker = PIXI.Ticker.shared;
    ticker.stop();

    const app = new PIXI.Application({
      autoStart:false,
      width: width,
      height: height,
      backgroundColor: 0xf4fff1,
      resolution: dpr,
      powerPreference: 'high-performance',
      sharedTicker: false
    });
    this._rootNode.appendChild(app.view);

    const viewport = new Viewport({
      // center: new PIXI.Point(-width/2, -height/2),
      passiveWheel: false,
      stopPropagation: true,
      divWheel: this._rootNode,
      screenWidth: width,
      screenHeight: height,
      worldWidth: width,
      worldHeight: height,
      interaction: app.renderer.plugins.interaction // the interaction module is important for wheel to work properly when renderer.view is placed or scaled
    });
    viewport
      // .clampZoom(Utilities.clampZoomOptions)
      .drag({pressDrag:true, clampWheel:true})
      .pinch()
      .wheel()
    app.stage.addChild(viewport);

    const container = new PIXI.ParticleContainer(amount, {
      vertices: false,
      position: true,
      rotation: false,
      uvs: false,
      tint: false
    });

    viewport.addChild(container);

    const textures = []
    
    app.loader.add('sprites', './flowers-textures-1.png');
    app.loader.onProgress.add((e)=>{
      console.log(e.progress+'%');
    })
    app.loader.onComplete.add(async ()=>{
      console.log('loader completed')
      const baseTexture = app.loader.resources.sprites.texture.baseTexture;

      const flowers_textures_info = await d3.json('./flowers-textures-1.json');

      for (let texture_name in flowers_textures_info.frames) {
        const frame = flowers_textures_info.frames[texture_name].frame;
        const texture = new PIXI.Texture(
          baseTexture,
          new PIXI.Rectangle(frame.x, frame.y, frame.w, frame.h)
        );
        textures.push(texture);
      }

      let flowers_matrix = [
        // [x, y, speedX, speedY]
      ];

      const x_flowers = [];
      const speed_x_flowers = [];

      for (let i=0; i<amount; ++i) {
        const index_texture = i%5;
        const sprite = new PIXI.Sprite(textures[index_texture]);

        const x = width*Math.random();
        const y = height*Math.random();
        const speedX = (-0.5 + Math.random());
        const speedY = (-0.5 + Math.random());
        
        sprite.x = x;
        sprite.y = y;
        sprite.speedX = speedX;
        sprite.speedY = speedY;

        const flower = [x,y,speedX,speedY];
        flowers_matrix.push(flower);
        
        sprite.anchor.x = 0.5;
        sprite.anchor.y = 0.5;
        sprite.scale.x = 1/2/2/2;
        sprite.scale.y = 1/2/2/2;
  
        container.addChild(sprite);
      }

      // console.log('flowers matrix', flowers_matrix);

      const kernel = gpu.createKernel(function(arr,box) {
        let speed_x = arr[this.thread.x][2];
        let new_x = arr[this.thread.x][0] + speed_x;
        if (new_x < 0) {
          new_x = 0;
          speed_x *= -1
        } else if (new_x > box[0]) {
          new_x = box[0];
          speed_x *= -1
        }
        
        let speed_y = arr[this.thread.x][3];
        let new_y = arr[this.thread.x][1] + speed_y;
        if (new_y < 0) {
          new_y = 0;
          speed_y *= -1
        } else if (new_y > box[1]) {
          new_y = box[1];
          speed_y *= -1
        }

        return [new_x, new_y, speed_x, speed_y];
      }).setOutput([amount]);

      let counter = 0;
      const update = function () {          
        if (counter < 1000 || true) {
          counter++;
          if (test_with_gpu) {
            flowers_matrix = kernel(flowers_matrix, [width, height]);
            // console.log('kernel result',flowers_matrix[0][0]);
          }
          for (var i = 0; i < amount; i++) 
          {
            var sprite = container.children[i];

            if (test_with_gpu) {
              sprite.x = flowers_matrix[i][0];
              sprite.y = flowers_matrix[i][1];
            } else {
              // x
              sprite.x += sprite.speedX;
              if (sprite.x > width)
              {
                sprite.speedX *= -1;
                sprite.x = width;
              }
              else if (sprite.x < 0)
              {
                sprite.speedX *= -1;
                sprite.x = 0;
              }
              // y
              sprite.y += sprite.speedY;
              if (sprite.y > height)
              {
                sprite.speedY *= -1;
                sprite.y = height;
              }
              else if (sprite.y < 0)
              {
                sprite.speedY *= -1;
                sprite.y = 0;
              }
            }
          }
        };
        
        app.renderer.render(viewport);
        requestAnimationFrame(update);
      }
      update();

    })
    app.loader.load();
  }
  
  _setRef(componentNode) {
    this._rootNode = componentNode;
  }
  render() {
    return <div ref={this._setRef.bind(this)}></div>;
  }
}

export default PIXIPerformancesTest;
