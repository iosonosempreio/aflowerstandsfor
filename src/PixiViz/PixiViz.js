import React, { Component } from 'react';
import * as d3 from "d3";
import * as PIXI from "pixi.js";
import { Viewport } from "pixi-viewport";

import Utilities from '../Utilities/Utilities';

let pixiApp, viewport, container, textures = {},
    width,
    height,
    dpr = window.devicePixelRatio || 1;

const simulation = d3.forceSimulation()
  .force("x", d3.forceX(d=>d.x))
  .force("y", d3.forceY(d=>d.y))
  .stop();

class PixiViz extends Component {
  constructor(props) {
    super(props);
    this.updateSprites=this.updateSprites.bind(this);
  }
  _setRef(componentNode) {
    this._rootNode = componentNode;
  }

  updateSprites(){
    const existing_ids = container.children.map(d=>d._data_.id);
    const incoming_ids = this.props.data.map(d=>d.id);

    let to_add = this.props.data.filter(d=>existing_ids.indexOf(d.id)===-1);
    let to_update = this.props.data.filter(d=>existing_ids.indexOf(d.id)!==-1);
    
    let to_remove = container.children.filter(d=>incoming_ids.indexOf(d._data_.id)===-1);

    console.log(this.props.data.length, to_add.length, to_remove.length);
    
    for (let i=0; i<to_add.length; ++i) {
      // create a new Sprite from an image path
      const sprite = PIXI.Sprite.from(textures[to_add[i].category]);
      // center the sprite's anchor point
      sprite.anchor.set(0.5);
      // move the sprite to the center of the screen
      // sprite.scale.x = 1/dpr/Utilities.clampZoomOptions.maxScale;
      // sprite.scale.y = 1/dpr/Utilities.clampZoomOptions.maxScale;
      sprite.scale.x = 0.35;
      sprite.scale.y = 0.35;
      sprite._data_ = to_add[i];
      sprite.interactive = true;
      sprite.on('mousedown', ()=>console.log(sprite));
      container.addChild(sprite);
    }
    
    for (let i=0; i<to_update.length; ++i) {
      const index = existing_ids.indexOf(to_update[i].id);
      const sprite = container.children[index];
      sprite._data_ = to_update[i];
    }

    for (let i=0; i<to_remove.length; ++i) {
      container.removeChild(to_remove[i]);
    }

    if (this.props.data.length!==container.children.length) {
      console.warn('Problem in sprites update');
      console.warn('total data:',this.props.data.length)
      console.warn('total sprites:',container.children.length)
    }
    this.repositionSprites();
  }
  repositionSprites(){
    // models could be stripes, bunches, clusters
    let simulation_is_running = true;
    simulation.nodes(this.props.data);
    if (this.props.model === 'stripes') {
      simulation.force('x').x(d=>d[`${this.props.model.charAt(0)}_x`]*width);
      simulation.force('y').y(d=>d[`${this.props.model.charAt(0)}_y`]*height);
    } else {
      simulation.force('x').x(d=>d[`${this.props.model.charAt(0)}_x`]);
      simulation.force('y').y(d=>d[`${this.props.model.charAt(0)}_y`]);
    }
    simulation.on("end", () => {
      console.log('simulation ended for', this.props.model);
      simulation_is_running = false;
    });
    simulation.alpha(1)
    simulation.restart();

    reposition();
    function reposition(){
      for(let i=0; i<container.children.length; i++){
        container.children[i].x = container.children[i]._data_.x;
        container.children[i].y = container.children[i]._data_.y;
      }
      if (simulation_is_running){
        requestAnimationFrame(reposition);
      }
    }
  }
  componentDidMount() {
    width = this._rootNode.getBoundingClientRect().width;
    height = this._rootNode.getBoundingClientRect().height;

    pixiApp = new PIXI.Application({
      width: width,
      height: height,
      backgroundColor: 0xfafafa,
      resolution: dpr,
      autoResize: true
    });
    this._rootNode.appendChild(pixiApp.view);

    viewport = new Viewport({
      center: new PIXI.Point(-width/2, -height/2),
      passiveWheel: false,
      stopPropagation: true,
      divWheel: this._rootNode,
      screenWidth: width,
      screenHeight: height,
      worldWidth: width,
      worldHeight: height,
      interaction: pixiApp.renderer.plugins.interaction // the interaction module is important for wheel to work properly when renderer.view is placed or scaled
    });
    viewport
      .clampZoom(Utilities.clampZoomOptions)
      .drag({pressDrag:true, clampWheel:true})
      .pinch()
      .wheel()
    pixiApp.stage.addChild(viewport);

    container = new PIXI.Container();
    viewport.addChild(container);

    Utilities.categories.forEach(category=>{
      const texture = PIXI.Texture.from(`./${category}.png`);
      textures[category] = texture;
    })

    this.updateSprites();
  }
  componentDidUpdate(prevProps){
    if (prevProps.data !== this.props.data) {
      this.updateSprites();
    } else if (prevProps.model !== this.props.model) {
      this.repositionSprites();
    }
  }
  render() {
    return <div style={{width:'100vw',height:'100vh'}} ref={this._setRef.bind(this)}></div>;
  }
}

export default PixiViz;



// loadData(){
//   return Promise.all([
//     d3.json('./data/covi-z.json'),
//     d3.json('./data/regioni.geojson'),
//   ])
// }
// initPixiApp() {
//   this.loadData().then( files => {
//     let data = files[0];
//     let mapData = files[1];

//     pixiApp = new PIXI.Application({
//       width: width,
//       height: height,
//       backgroundColor: 0xfafafa,
//       resolution: dpr,
//       autoResize: true
//     });
//     this._rootNode.appendChild(pixiApp.view);

//     // create viewport and add it to the stage
//     viewport = new Viewport({
//       center: new PIXI.Point(-width/2, -height/2),
//       passiveWheel: false,
//       stopPropagation: true,
//       divWheel: this._rootNode,
//       screenWidth: width,
//       screenHeight: height,
//       worldWidth: width,
//       worldHeight: height,
//       interaction: pixiApp.renderer.plugins.interaction // the interaction module is important for wheel to work properly when renderer.view is placed or scaled
//     });
//     viewport
//       // .moveCenter(width/2,height/2)
//       .clampZoom(Utilities.clampZoomOptions)
//       .drag({pressDrag:true, clampWheel:true})
//       .pinch()
//       .wheel()
//     pixiApp.stage.addChild(viewport);
    
//     // Draw Italy
//     // adapted from https://gist.github.com/armollica/3598b8c89e1f18ea453231da41c7c3bc
//     projection = d3.geoConicEqualArea()
//       .fitSize([Utilities.map.width-50, Utilities.map.height-50], this._rootNode)
//       .translate([Utilities.map.width / 2, Utilities.map.height / 2])
//       .scale(Utilities.map.scale)
//       .center([12.368775000000001, 42.9451139]);


//     for (let i=0; i<mapData.features.length; i++) {
//       const region = mapData.features[i];

//       const this_graphics = new PIXI.Graphics();

//       const path = d3.geoPath()
//         .projection(projection)
//         .context(this_graphics);

//       this_graphics.beginFill(0xffffff, 1);
//       this_graphics.lineStyle(0.25, 0xcccccc);
//         path(region);
//       this_graphics.endFill();

//       viewport.addChild(this_graphics);
//     }

//     // Sprites for emoji
//     container = new PIXI.Container();
//     viewport.addChild(container);


//   });
// }
// componentDidMount() {
  
// }
// loadEmoji(){
//   emojiCounter++;
//   if (emojiCounter === Object.keys(Utilities.emoji_images_dictionary).length) {
//     const icons = document.querySelectorAll('#textures-generation>*');
//     const textures = {};
//     for (let i=0; i<icons.length; ++i) {
//       html2canvas(icons[i],{backgroundColor:null}).then((canvas)=>{
//         textures[icons[i].id] = canvas.toDataURL("image/png");
//         if (Object.keys(textures).length === Object.keys(Utilities.emoji_dictionary).length) {
//           this.setState({textures:textures},()=>{
//             this.initPixiApp();
//           })
//         }
//       });
//     }
//   }
// }