import React, { Component } from 'react';
import * as d3 from "d3";
import * as PIXI from "pixi.js";
import { Viewport } from "pixi-viewport";

import Utilities from '../Utilities/Utilities';

let pixiApp, viewport, container, map, textures = {},
    flowers = {},
    width,
    height,
    margin=15,
    dpr = window.devicePixelRatio || 1;

// const projection = d3.geoConicEqualArea()
// const projection = d3.geoTransverseMercator()
const projection = d3.geoNaturalEarth1()
  // .fitSize([Utilities.map.width-50, Utilities.map.height-50], this._rootNode)
  .translate([Utilities.map.width / 2, Utilities.map.height / 2])
  .scale(Utilities.map.scale)
  .center([12.368775000000001, 42.9451139]);

const simulation = d3.forceSimulation()
  .force("x", d3.forceX())
  .force("y", d3.forceY())
  .alphaMin(0.01)
  .stop();

class PixiViz extends Component {
  constructor(props) {
    super(props);
    this.updateSprites=this.updateSprites.bind(this);
    this.repositionSprites=this.repositionSprites.bind(this);
  }
  _setRef(componentNode) {
    this._rootNode = componentNode;
  }
  updateSprites(){
    const to_remove = {...flowers};
    for (let i=0; i<this.props.data.length; ++i) {
      const d = this.props.data[i];
      delete d.date;
      const id = d.id;
      if (!flowers[id]) {
        const sprite = PIXI.Sprite.from(textures[d.category]);
        sprite.anchor.set(0.5);
        sprite.scale.x = 1/7;
        sprite.scale.y = 1/7;
        sprite._data_ = d;
        sprite.interactive = true;
        sprite.buttonMode = true;
        sprite.on('click',()=>console.log(d));
        flowers[this.props.data[i].id] = sprite;
        container.addChild(sprite);
        
      } else {
        const current_x = flowers[id]._data_.x;
        const current_y = flowers[id]._data_.y;
        d.x = current_x;
        d.y = current_y;
        flowers[id]._data_ = d;
      }
      delete to_remove[id];
    }

    for (let id in to_remove) {
      delete flowers[id];
      container.removeChild(to_remove[id]);
    }

    if (this.props.data.length!==container.children.length) {
      console.warn('Problem in sprites update:\ntotal data:',this.props.data.length,'total sprites:',container.children.length);
    }
    this.repositionSprites();
  }
  repositionSprites(){
    // models could be stripes, bunches, clusters
    let simulation_is_running = true;
    simulation.nodes(this.props.data);
    if (this.props.model === 'stripes') {
      simulation.force('x').x(d=> margin+d[`${this.props.model}_x`]*(width-margin*2) );
      simulation.force('y').y(d=> margin+d[`${this.props.model}_y`]*(height-margin*2) );
      viewport.snap(0,0,{topLeft:true,interrupt:true,removeOnComplete:true,removeOnInterrupt:true});
      viewport.snapZoom({center:new PIXI.Point(width/2,height/2),width: width, interrupt:true, removeOnComplete: true, removeOnInterrupt: true});
      map.renderable = false;
    } else {
      simulation.force('x').x(d=>+d[`${this.props.model}_x`]);
      simulation.force('y').y(d=>+d[`${this.props.model}_y`]);
      map.renderable = true;
    }
    simulation.on("end", () => {
      console.log('simulation ended for', this.props.model);
      simulation_is_running = false;
    });
    simulation.on('end',()=>{
      if (this.props.play){
        this.props.changeDate(this.props.current_date_index+1)
      }
    })
    simulation.alpha(1)
    simulation.restart();

    reposition();
    function reposition(){
      for(let i=0; i<container.children.length; i++){
        container.children[i].x = container.children[i]._data_.x;
        container.children[i].y = container.children[i]._data_.y;
      }
      if (simulation_is_running || simulation.alpha()>0.05){
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
      backgroundColor: 0xf4fff1,
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

    map = new PIXI.Container();
    map.renderable = false;
    viewport.addChild(map);

    for (let i=0; i<this.props.mapGeometries.features.length; i++) {
      const region = this.props.mapGeometries.features[i];
      const this_graphics = new PIXI.Graphics();
      const path = d3.geoPath()
        .projection(projection)
        .context(this_graphics);
      this_graphics.beginFill(0xffffff, 1);
      this_graphics.lineStyle(1, 0x333333);
        path(region);
      this_graphics.endFill();
      map.addChild(this_graphics);
    }

    container = new PIXI.Container();
    viewport.addChild(container);

    Utilities.categories.forEach(category=>{
      // source, frame, orig, trim, rotate
      const texture = PIXI.Texture.from(`./${category}_40x40.png`);
      textures[category] = texture;
    })

    this.updateSprites();
  }
  componentDidUpdate(prevProps){
    simulation.stop();
    if (prevProps.data !== this.props.data) {
      this.updateSprites();
    } else if (prevProps.model !== this.props.model) {
      this.repositionSprites();
    }
  }
  render() {
    return <div style={{width:'100vw',height:'calc(100vh - 144px)'}} ref={this._setRef.bind(this)}></div>;
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