import React, { Component } from 'react';
import * as d3 from "d3";
import * as PIXI from "pixi.js";
import { Viewport } from "pixi-viewport";

import Utilities from '../Utilities/Utilities';

let pixiApp, viewport, container,
    width = window.innerWidth,
    height = window.innerHeight,
    dpr = window.devicePixelRatio || 1;

class PixiViz extends Component {
  constructor(props) {
    super(props);
    this.updateSprites=this.updateSprites.bind(this);
    this.bands=this.bands.bind(this);
    this.bunches=this.bunches.bind(this);
    this.clusters=this.clusters.bind(this);
    this.calculatePositionsBands=this.calculatePositionsBands.bind(this);
  }
  _setRef(componentNode) {
    this._rootNode = componentNode;
  }
  updateSprites(){
    const existing_ids = container.children.map(d=>d._data_.id);
    const incoming_ids = this.props.data.map(d=>d.id);

    const to_add = this.props.data.filter(d=>existing_ids.indexOf(d.id)===-1);
    const to_remove = container.children.filter(d=>incoming_ids.indexOf(d._data_.id)===-1);
    
    for (let i=0; i<to_add.length; ++i) {
      // create a new Sprite from an image path
      const sprite = PIXI.Sprite.from(`./${to_add[i].category}.png`);
      sprite._data_ = to_add[i];
      // center the sprite's anchor point
      sprite.anchor.set(0.5);
      // move the sprite to the center of the screen
      // sprite.x = to_add[i]._x;
      // sprite.y = to_add[i]._y;
      sprite.x = window.innerWidth/2;
      sprite.y = window.innerHeight/2;
      sprite.scale.x = 1/dpr/Utilities.clampZoomOptions.maxScale;
      sprite.scale.y = 1/dpr/Utilities.clampZoomOptions.maxScale;
      container.addChild(sprite);
    }

    for (let i=0; i<to_remove.length; ++i) {
      container.removeChild(to_remove[i]);
    }

    if (this.props.data.length!==container.children.length) {
      console.warn('Problem in sprites update');
      console.warn('total data:',this.props.data.length)
      console.warn('total sprites:',container.children.length)
    } else {
      this.repositionSprites();
    }
  }
  repositionSprites(){
    switch (this.props.model) {
      case 'bands':
        this.bands();
        break;
      case 'bunches':
        this.bunches();
        break;
      case 'clusters':
        this.clusters();
        break;
      default:
        console.warn('no matching model');
        break;
    }
  }
  calculatePositionsBands(){
    const nestedData = d3.nest()
      .key(d=>d.category)
      .entries(this.props.data);
    let center = {x:0,y:height/2};
    Utilities.categories.forEach(cat=>{
      const band_data = nestedData.find(d=>d.key===cat).values;
      const percentage = band_data.length/this.props.data.length;
      const band_width = width*percentage
      center.x += band_width;
      band_data.forEach(d=>{
        d.bands_x = center.x// + d3.randomUniform(-band_width,0)();
        d.bands_y = center.y + d3.randomUniform(-height/2,height/2)();
      })
    })
  }
  bands(){
    console.log('position in bands');
    for(let i=0; i<container.children.length; ++i){
      container.children[i].x = container.children[i]._data_.bands_x;
      container.children[i].y = container.children[i]._data_.bands_y;
    }
  }
  bunches(){
    console.log('position in bunches')
    for(let i=0; i<container.children.length; ++i){
      container.children[i].x = container.children[i]._data_.x;
      container.children[i].y = container.children[i]._data_.y;
    }
  }
  clusters(){
    console.log('position in clusters');
    for(let i=0; i<container.children.length; ++i){
      container.children[i].x = container.children[i]._data_.y;
      container.children[i].y = container.children[i]._data_.x;
    }
  }
  componentDidMount() {
    pixiApp = new PIXI.Application({
      width: width,
      height: height,
      backgroundColor: 0xfafafa,
      resolution: dpr,
      autoResize: true
    });
    this._rootNode.appendChild(pixiApp.view);

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
      .clampZoom(Utilities.clampZoomOptions)
      .drag({pressDrag:true, clampWheel:true})
      .pinch()
      .wheel()
    pixiApp.stage.addChild(viewport);

    container = new PIXI.Container();
    viewport.addChild(container);
    this.calculatePositionsBands();
    this.updateSprites();
  }
  componentDidUpdate(prevProps){
    if (prevProps.data !== this.props.data) {
      this.calculatePositionsBands();
      this.updateSprites();
    } else if (prevProps.model !== this.props.model) {
      this.repositionSprites();
    }
  }
  render() {
    return <div style={{width:'100%',height:'100%'}} ref={this._setRef.bind(this)}></div>;
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
//       center: new PIXI.Point(-window.innerWidth/2, -window.innerHeight/2),
//       passiveWheel: false,
//       stopPropagation: true,
//       divWheel: this._rootNode,
//       screenWidth: window.innerWidth,
//       screenHeight: window.innerHeight,
//       worldWidth: window.innerWidth,
//       worldHeight: window.innerHeight,
//       interaction: pixiApp.renderer.plugins.interaction // the interaction module is important for wheel to work properly when renderer.view is placed or scaled
//     });
//     viewport
//       // .moveCenter(window.innerWidth/2,window.innerHeight/2)
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