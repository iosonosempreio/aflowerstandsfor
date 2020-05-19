import React, { Component } from 'react';
import * as PIXI from "pixi.js";

let app,
    textures,
    dpr=window.devicePixelRatio || 1,
    // rem = getComputedStyle(document.documentElement).getPropertyValue( "font-size" ).replace('px',''),
    width,
    height,
    maxItems=50,
    flowersTimeout;

class Meadow extends Component {
  _setRef(componentNode) {
    this._rootNode = componentNode;
  }
  componentDidMount() {
    width = this._rootNode.getBoundingClientRect().width;
    height = this._rootNode.getBoundingClientRect().height;
    app = new PIXI.Application({
      width: width,
      height: height,
      // backgroundColor: 0xfafafa,
      transparent:true,
      autoDensity:true,
      resolution: dpr,
      antialias:true,
      // sharedTicker: false,
      // autoStart:false
    });
    // let ticker = PIXI.Ticker.shared;
    // ticker.stop();
    this._rootNode.appendChild(app.view);

    app.loader.add('flowersTextures','./flowers-textures-1.json');

    app.loader.onComplete.add(()=>{
      textures = app.loader.resources.flowersTextures.textures;
      flowersTimeout = window.setInterval(makeFlower, 250);
    });
    app.loader.load();

    // Listen for animate update
    app.ticker.add((delta) => {
      // rotate the container!
      // use delta to create frame-independent transform
      app.stage.children.forEach((sprite)=>{
        const current_scale = sprite.transform.scale._x;
        if (current_scale > 0) {
          sprite.scale.x = sprite.scale.y = current_scale-0.0012;
        }
      })
    });

    function makeFlower() {
      const categories = Object.keys(textures);
      const category = categories[Math.floor(Math.random()*categories.length)];
      const sprite = new PIXI.Sprite(textures[category]);
      sprite.x = Math.random()*width;
      sprite.y = Math.random()*height;
      sprite.anchor.x = 0.5;
      sprite.anchor.y = 0.5;
      const pixel_size = 100;
      sprite.scaleValues = [1/textures[category].orig.width * pixel_size,1/textures[category].orig.height * pixel_size]
      // sprite.scale.x = 0.75;
      // sprite.scale.y = 0.75;
      if (app.stage.children.length === maxItems) {
        const spriteToRemove = app.stage.children[0];
        app.stage.removeChild(spriteToRemove);
      }
      app.stage.addChild(sprite);
    }

  }
  componentWillUnmount(){
    window.clearInterval(flowersTimeout);
  }
  render() {
    return <div style={this.props.style} ref={this._setRef.bind(this)}></div>;
  }
}

export default Meadow;
