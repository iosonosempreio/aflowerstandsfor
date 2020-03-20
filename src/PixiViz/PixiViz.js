import React, { Component } from 'react';
import * as d3 from "d3";
import * as PIXI from "pixi.js";
import { Viewport } from "pixi-viewport";
import html2canvas from 'html2canvas';

import Utilities from '../Utilities/Utilities';

let pixiApp, viewport, container, width = window.innerWidth, height = window.innerHeight, dpr = window.devicePixelRatio || 1;

class PixiViz extends Component {
  constructor(props) {
    super(props);
    this.loadData = this.loadData.bind(this);

    this.state = {
      textures: {}
    }
  }

  loadData(){
    return d3.json('./data/covi-z.json')
  }

  componentDidMount() {
    const initPixiApp = () => {
      console.log(this.state)
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
  
      container = new PIXI.Container();
      viewport.addChild(container);
  
      this.loadData().then( data =>{

        for (let i=0; i<data.length; ++i) {

          // create a new Sprite from an image path
          const sprite = PIXI.Sprite.from(this.state.textures[data[i].category]);

          // center the sprite's anchor point
          sprite.anchor.set(0.5);

          // move the sprite to the center of the screen
          sprite.x = data[i].x;
          sprite.y = data[i].y;
          sprite.scale.x = 0.05;
          sprite.scale.y = 0.05;

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
      {Object.keys(this.state.textures).length===0 && 
        <div id="textures-generation" style={{fontSize:Utilities.emoji.size+'px',position:'absolute', top:'-100px'}}>
          { Object.keys(Utilities.emoji_dictionary).map(d=>{
            return <span id={d} key={`emoji-${d}`}>{Utilities.emoji_dictionary[d]}</span>
          }) }
        </div>
      }
    </div>;
  }
}

export default PixiViz;
