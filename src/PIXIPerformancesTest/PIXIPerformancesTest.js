import React, { Component } from 'react';
import * as d3 from 'd3';
import * as PIXI from "pixi.js";
import { Viewport } from "pixi-viewport";

const dpr = window.devicePixelRatio || 1;

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

    const amount = 200000;
    const container = new PIXI.ParticleContainer(amount, {
      vertices: false,
      position: true,
      rotation: false,
      uvs: false,
      tint: false
    });

    viewport.addChild(container);
    const textures = [];
    textures.push(new PIXI.Texture.from("./textures/resized/deceduti_40x40.png"));
    textures.push(new PIXI.Texture.from("./textures/resized/dimessi_guariti_40x40.png"));
    textures.push(new PIXI.Texture.from("./textures/resized/isolamento_domiciliare_40x40.png"));
    textures.push(new PIXI.Texture.from("./textures/resized/ricoverati_con_sintomi_40x40.png"));
    textures.push(new PIXI.Texture.from("./textures/resized/terapia_intensiva_40x40.png"));

    app.loader.add('sprites', './textures/resized/deceduti_40x40.png')
      .add('sprites', './textures/resized/dimessi_guariti_40x40.png')
      .add('sprites', './textures/resized/isolamento_domiciliare_40x40.png')
      .add('sprites', './textures/resized/ricoverati_con_sintomi_40x40.png')
      .add('sprites', './textures/resized/terapia_intensiva_40x40.png')

    for (let i=0; i<amount; ++i) {
      const index_Texture = i%5;
      const sprite = new PIXI.Sprite(textures[4]);

      sprite.speedX = Math.random();
		  sprite.speedY = Math.random();
		
		  sprite.anchor.x = 0.5;
      sprite.x = width*Math.random();
      sprite.y = height*Math.random();
      sprite.scale.x = 0.125;
      sprite.scale.y = 0.125;

      container.addChild(sprite);
    }
    let updateDelta = Date.now();
    const update = function () {
      const delta = updateDelta - Date.now();
      updateDelta = Date.now();

      for (var i = 0; i < amount; i++) 
      {
        var sprite = container.children[i];
      
        // sprite.x += sprite.speedX * delta;
        // sprite.y += sprite.speedY;
        
        // if (sprite.x > width)
        // {
        //   sprite.speedX *= -1;
        //   sprite.x = width;
        // }
        // else if (sprite.x < 0)
        // {
        //   sprite.speedX *= -1;
        //   sprite.x = 0;
        // }

        // if (sprite.y > width)
        // {
        //   sprite.speedX *= -1;
        //   sprite.y = width;
        // }
        // else if (sprite.y < 0)
        // {
        //   sprite.speedX *= -1;
        //   sprite.y = 0;
        // }
      }

      app.renderer.render(viewport);
      requestAnimationFrame(update)
    }
    update();
  }
  
  _setRef(componentNode) {
    this._rootNode = componentNode;
  }
  render() {
    return <div ref={this._setRef.bind(this)}></div>;
  }
}

export default PIXIPerformancesTest;
