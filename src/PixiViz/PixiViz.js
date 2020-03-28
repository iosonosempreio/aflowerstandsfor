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

let viewBuffer = null;

// const projection = d3.geoConicEqualArea()
// const projection = d3.geoTransverseMercator()
const projection = d3.geoNaturalEarth1()
  // .fitSize([Utilities.map.width-50, Utilities.map.height-50], this._rootNode)
  .translate([Utilities.map.width / 2, Utilities.map.height / 2])
  .scale(Utilities.map.scale)
  .center([12.368775000000001, 42.9451139]);

class PixiViz extends Component {
  constructor(props) {
    super(props);
    //this.repositionSprites=this.repositionSprites.bind(this);
    this.createSprites=this.createSprites.bind(this);
  }
  _setRef(componentNode) {
    this._rootNode = componentNode;
  }
  // repositionSprites(){
  //   // models could be stripes, bunches, clusters
  //   let simulation_is_running = true;
  //   simulation.nodes(this.props.data);
  //   if (this.props.model === 'stripes') {
  //     simulation.force('x').x(d=> margin+d[`${this.props.model}_x`]*(width-margin*2) );
  //     simulation.force('y').y(d=> margin+d[`${this.props.model}_y`]*(height-margin*2) );
  //     viewport.snap(0,0,{topLeft:true,interrupt:true,removeOnComplete:true,removeOnInterrupt:true});
  //     viewport.snapZoom({center:new PIXI.Point(width/2,height/2),width: width, interrupt:true, removeOnComplete: true, removeOnInterrupt: true});
  //     map.renderable = false;
  //   } else {
  //     simulation.force('x').x(d=>+d[`${this.props.model}_x`]);
  //     simulation.force('y').y(d=>+d[`${this.props.model}_y`]);

  //     for(let i=0; i < this.props.data.length; ++i)
  //     {
        
  //     }
  //     // const c = this.props.data.find(d=>d.denominazione_regione==='Lombardia');
  //     // console.log(c)
  //     // viewport.snap(Number(c.origin_x) - width/2, Number(c.origin_y) - height/2,{topLeft:true,interrupt:true,removeOnComplete:true,removeOnInterrupt:true});
  //     // viewport.snapZoom({center:new PIXI.Point(width/2,height/2),width: width, interrupt:true, removeOnComplete: true, removeOnInterrupt: true});
      
  //     map.renderable = true;
  //   }
  //   simulation.on("end", () => {
  //     console.log('simulation ended for', this.props.model);
  //     simulation_is_running = false;
  //   });
  //   simulation.on('end',()=>{
  //     if (this.props.play){
  //       this.props.changeDate(this.props.current_date_index+1)
  //     }
  //   })
  //   simulation.alpha(1)
  //   simulation.restart();

  //   reposition();
  //   function reposition(){
  //     for(let i=0; i<container.children.length; i++){
  //       container.children[i].x = container.children[i]._data_.x;
  //       container.children[i].y = container.children[i]._data_.y;
  //     }
  //     if (simulation_is_running || simulation.alpha()>0.05){
  //       requestAnimationFrame(reposition);
  //     }
  //   }
  // }
  createSprites(){
    if(this.props.unique_IDS == null)
    {
      throw new Error("Error - props.unique_IDS is null");
    }
    const tempSpriteList={};
    for(const entity in this.props.unique_IDS)
    {
      const flower = new Flower(textures[this.props.unique_IDS[entity].category]);
      flower.x = this.props.unique_IDS[entity].position.x;
      flower.y = this.props.unique_IDS[entity].position.y;
      //flower.alpha = 0.0;
      flower.scale.x = 1/7;
      flower.scale.y = 1/7;
      tempSpriteList[entity] = flower;
      container.addChild(flower);
    }
    viewBuffer = new ViewBuffer(tempSpriteList);
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

    //viewport = new Viewport({
    //  center: new PIXI.Point(-width/2, -height/2),
    //  passiveWheel: false,
    //  stopPropagation: true,
    //  divWheel: this._rootNode,
    //  screenWidth: width,
    //  screenHeight: height,
    //  worldWidth: width,
    //  worldHeight: height,
    //  interaction: pixiApp.renderer.plugins.interaction // the interaction module is important for wheel to work properly when renderer.view is placed or scaled
    //});
    //viewport
    //  .clampZoom(Utilities.clampZoomOptions)
    //  .drag({pressDrag:true, clampWheel:true})
    //  .pinch()
    //  .wheel()
    //pixiApp.stage.addChild(viewport);

    map = new PIXI.Container();
    map.renderable = false;
    //viewport.addChild(map);

    for (let i=0; i<this.props.mapGeometries.features.length; i++) {
      const region = this.props.mapGeometries.features[i];
      const this_graphics = new PIXI.Graphics();
      const path = d3.geoPath()
        .projection(projection)
        .context(this_graphics);
      this_graphics.beginFill(0xffffff, 1);
      this_graphics.lineStyle(1, 0x333333, 0.5);
        path(region);
      this_graphics.endFill();
      map.addChild(this_graphics);
    }
    container = new PIXI.ParticleContainer(Object.keys(this.props.unique_IDS).length, {
      scale: false,
      position: true,
      rotation: false,
      uvs: false,
      alpha: false,
      tint: false,

  });
    //viewport.addChild(container);
    pixiApp.stage.addChild(container);
    pixiApp.loader.add('sprites', './flowers-textures-1.png');
    pixiApp.loader.onProgress.add((e)=>{
      console.log(e.progress+'%');
    })
    pixiApp.loader.onComplete.add(async ()=>{
      const baseTexture = pixiApp.loader.resources.sprites.texture.baseTexture;
      const flowers_textures_info = await d3.json('./flowers-textures-1.json');
      for (let texture_name in flowers_textures_info.frames) {
        const frame = flowers_textures_info.frames[texture_name].frame;
        const texture = new PIXI.Texture(
          baseTexture,
          new PIXI.Rectangle(frame.x, frame.y, frame.w, frame.h)
        );
        textures[texture_name.replace('.png','')] = texture;
      }
      this.createSprites();
      viewBuffer.setDrawList(this.props.data);
      viewBuffer.drawObjects(container);
    })
    pixiApp.loader.load();
  }
  componentDidUpdate(prevProps){
    if (prevProps.data !== this.props.data) {
      //update draw list
      viewBuffer.clearObjects(container);
      viewBuffer.setDrawList(this.props.data);
      viewBuffer.drawObjects(container);
    } else if (prevProps.model !== this.props.model) {
      //animate moveto see ViewBuffer startAnimation()
    }
    // console.log(container);
  }
  render() {
    return <div style={{width:'100vw',height:'calc(100vh - 144px)'}} ref={this._setRef.bind(this)}></div>;
  }
}


class ViewBuffer{
  /**
   * 
   * @param {{id:Flower}} Sprites 
   */
  constructor(Sprites)
  {
    this.master=Sprites;
  }
  master={};
  drawList=[];
  animationTime=0;
  timeLeft=0;
  app=null;

  setDrawList(drawList){
    this.drawList = drawList;
  }
  /**
   * 
   * @param {PIXI.ParticleContainer} container 
   */
  clearObjects(container){
      container.removeChildren();
  }
    /**
   * 
   * @param {PIXI.ParticleContainer} container 
   */
  drawObjects(container){
    for(let i=0; i < this.drawList.length; ++i)
    {
      this.master[this.drawList[i].id].position.x = this.drawList[i].bunches_x;
      this.master[this.drawList[i].id].position.y = this.drawList[i].bunches_y;
      container.addChild(this.master[this.drawList[i].id]);
    }
  }
  /**
   * 
   * @param {Number} animationTime - in seconds 
   * @param {PIXI.Application} app 
   */
  startAnimation(animationTime, app){
    this.animationTime = animationTime;
    this.timeLeft = 0;
    this.app = app;
    app.ticker.add(this.animate.bind(this));
  }
  animate(delta){
    const FRAMES_PER_SECOND=60;
    this.timeLeft += delta / FRAMES_PER_SECOND;
    if(this.timeLeft >= this.animationTime)
    {
      //remove animation function from update
      //set last position
      this.app.ticker.remove(this.animate);
    }
    else
    {
      const currentTime = Utilities.easeInOutCubic(this.timeLeft / this.animationTime);
      for(const entity in this.drawList)
      {
        this.master[entity].moveToNextPoint(currentTime);
      }
    }

  }
}

class Flower extends PIXI.Sprite{
  constructor(texture){
    super(texture);
  }
  nextPoint=new PIXI.Point();
  lastPoint=new PIXI.Point();
  setNextPoint(point){
    this.nextPoint = point;
  }
  setLastPoint(){
    this.lastPoint = this.position;
  }
  moveToNextPoint(t){
    this.position.x = (1-t) * this.lastPoint.x + t * this.nextPoint;
    this.position.y = (1-t) * this.lastPoint.y + t * this.nextPoint; 
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