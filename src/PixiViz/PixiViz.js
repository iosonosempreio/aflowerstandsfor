import React, { Component } from 'react';
import * as d3 from "d3";
import * as PIXI from "pixi.js";
import { Viewport } from "pixi-viewport";
import html2canvas from 'html2canvas';

import Utilities from '../Utilities/Utilities';

let pixiApp, viewport, container, graphics,
    width = window.innerWidth,
    height = window.innerHeight,
    dpr = window.devicePixelRatio || 1,
    size = Utilities.emoji.size,
    projection;

class PixiViz extends Component {
  constructor(props) {
    super(props);
    this.loadData = this.loadData.bind(this);

    this.state = {
      textures: {}
    }
  }

  loadData(){
    return Promise.all([
      d3.json('./data/covi-z.json'),
      d3.json('./data/regioni.geojson'),
    ])
  }

  componentDidMount() {
    const initPixiApp = () => {
      
      this.loadData().then( files => {
        let data = files[0];
        let mapData = files[1];

        pixiApp = new PIXI.Application({
          width: width,
          height: height,
          backgroundColor: 0xfafafa,
          resolution: dpr,
          autoResize: true
        });
        this._rootNode.appendChild(pixiApp.view);
    
        // create viewport and add it to the stage
        viewport = new Viewport({
          center: new PIXI.Point(-window.innerWidth/2, -window.innerHeight/2),
          passiveWheel: false,
          stopPropagation: true,
          divWheel: this._rootNode,
          screenWidth: window.innerWidth,
          screenHeight: window.innerHeight,
          worldWidth: window.innerWidth,
          worldHeight: window.innerHeight,
          interaction: pixiApp.renderer.plugins.interaction // the interaction module is important for wheel to work properly when renderer.view is placed or scaled
        });
        viewport
          // .moveCenter(window.innerWidth/2,window.innerHeight/2)
          .clampZoom(Utilities.clampZoomOptions)
          .drag({pressDrag:true, clampWheel:true})
          .pinch()
          .wheel()
        pixiApp.stage.addChild(viewport);
        
        // Draw Italy
        // adapted from https://gist.github.com/armollica/3598b8c89e1f18ea453231da41c7c3bc
        projection = d3.geoConicEqualArea()
          .fitSize([window.innerWidth -200, window.innerHeight-200], this._rootNode)
          .translate([window.innerWidth / 2, window.innerHeight / 2])
          .scale(3000)
          .center([12.368775000000001, 42.9451139]);


        for (let i=0; i<mapData.features.length; i++) {
          const region = mapData.features[i];

          const this_graphics = new PIXI.Graphics();

          const path = d3.geoPath()
            .projection(projection)
            .context(this_graphics);

          this_graphics.beginFill(0xffffff, 1);
          this_graphics.lineStyle(0.25, 0xcccccc);
            path(region);
          this_graphics.endFill();

          viewport.addChild(this_graphics);
        }

        // Sprites for emoji
        container = new PIXI.Container();
        viewport.addChild(container);

        for (let i=0; i<data.length; ++i) {
          // create a new Sprite from an image path
          const sprite = PIXI.Sprite.from(this.state.textures[data[i].category]);
          // center the sprite's anchor point
          sprite.anchor.set(0.5);
          // move the sprite to the center of the screen
          sprite.x = data[i]._x;
          sprite.y = data[i]._y;
          sprite.scale.x = 1/dpr/Utilities.clampZoomOptions.maxScale;
          sprite.scale.y = 1/dpr/Utilities.clampZoomOptions.maxScale;

          container.addChild(sprite);
        }
      });
    }

    const icons = document.querySelectorAll('#textures-generation>span');
    const textures = {};
    for (let i=0; i<icons.length; ++i) {
      html2canvas(icons[i],{backgroundColor:null}).then((canvas)=>{
        textures[icons[i].id] = canvas.toDataURL("image/png");
        if (Object.keys(textures).length === Object.keys(Utilities.emoji_dictionary).length) {
          this.setState({textures:textures},()=>{
            initPixiApp();
          })
        }
      });
    }

  }
  _setRef(componentNode) {
    this._rootNode = componentNode;
  }
  render() {
    return <div style={{width:'100%',height:'100%'}} ref={this._setRef.bind(this)}>
      {true && 
        //Object.keys(this.state.textures).length===0
        <div id="textures-generation" style={{fontSize:size+'px',position:'absolute', top:'10px'}}>
          { Object.keys(Utilities.emoji_dictionary).map(d=>{
            return <span id={d} key={`emoji-${d}`}>{Utilities.emoji_dictionary[d]}</span>
          }) }
        </div>
      }
    </div>;
  }
}

export default PixiViz;
