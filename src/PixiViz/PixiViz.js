import React, { Component } from 'react';
import * as d3 from "d3";
import * as PIXI from "pixi.js";
import { Viewport } from "pixi-viewport";

import Utilities from '../Utilities/Utilities';

let container,
    dpr = window.devicePixelRatio || 1;

let width, height, app;
let updateQueue=[];
let prevTime=0;
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
    this.state = {viewBuffer:null};
  }
  _setRef(componentNode) {
    this._rootNode = componentNode;
  }

  componentDidMount(){
    width = window.innerWidth / dpr;
    height = window.innerHeight / dpr;
    const amount=Object.keys(this.props.unique_IDS).length;
    console.log("amount:", amount);
    //let ticker = PIXI.Ticker.shared;
    //ticker.stop();

    app = new PIXI.Application({
      width: width,
      height: height,
      backgroundColor: 0xf4fff1,
      resolution: dpr,
      powerPreference: 'high-performance',
      //sharedTicker: false,
     // autoStart:false
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

    const textures = {};
    
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
        textures[texture_name.replace('.png','')] = texture;
      }
      const tempSpritesList={};
      for (const entity in this.props.unique_IDS) {
        const sprite = new Flower(textures[this.props.unique_IDS[entity].category]);
        sprite.x = Number(this.props.unique_IDS[entity].position.x);
        sprite.y = Number(this.props.unique_IDS[entity].position.y);
        sprite.anchor.x = 0.5;
        sprite.anchor.y = 0.5;
        sprite.scale.x = 1/2/2/2;
        sprite.scale.y = 1/2/2/2;
  
        tempSpritesList[entity]=sprite;
      }
      this.state.viewBuffer = new ViewBuffer(tempSpritesList, container);
      this.state.viewBuffer.setDrawList(this.props.data, this.props.model);
      this.state.viewBuffer.drawObjects();
      prevTime = Date.now();
      const update = function () {    
        const toSeconds=1000;
        const deltaTime = (Date.now() - prevTime) / toSeconds;
        prevTime = Date.now();
        for(let i=0; i < updateQueue.length;++i)
        {
          updateQueue[i](deltaTime);
        }      
        app.renderer.render(viewport);
        requestAnimationFrame(update);
      }
      update();

    })
    app.loader.load();
  }
  componentDidUpdate(prevProps){
    if (prevProps.data !== this.props.data) {
      //update draw list
      this.state.viewBuffer.clearObjects();
      this.state.viewBuffer.setDrawList(this.props.data, this.props.model);
      this.state.viewBuffer.drawObjects();
    } else if (prevProps.model !== this.props.model) {
      //animate moveto see ViewBuffer startAnimation()
      this.state.viewBuffer.model = this.props.model;
      this.state.viewBuffer.startAnimation(5, app);
    }
    // console.log(container);
  }
  render() {
    return <div style={{width:'100vw',height:'100vh'}} ref={this._setRef.bind(this)}></div>;
  }
}


class ViewBuffer{
  /**
   * 
   * @param {{id:Flower}} Sprites 
   * @param {PIXI.ParticleContainer} container
   */
  constructor(Sprites, container)
  {
    this.master=Sprites;
    this.container = container;
  }
  master={};
  drawList=[];
  animationTime=0;
  timeLeft=0;
  app=null;
  container=null;
  model=null;
  setDrawList(drawList, model){
    this.drawList = drawList;
    this.model = model;
  }
  clearObjects(){
      this.container.removeChildren();
  }
  drawObjects(){
    if(this.model === "stripes")
    {
      for(let i=0; i < this.drawList.length; ++i)
      {
        this.master[this.drawList[i].id].position.x = Number(this.drawList[i][this.model+"_x"]) * width;
        this.master[this.drawList[i].id].position.y = Number(this.drawList[i][this.model+"_y"]) * height;
        this.container.addChild(this.master[this.drawList[i].id]);
      }
      return;
    }
    for(let i=0; i < this.drawList.length; ++i)
    {
      this.master[this.drawList[i].id].position.x = Number(this.drawList[i][this.model+"_x"]);
      this.master[this.drawList[i].id].position.y = Number(this.drawList[i][this.model+"_y"]);
      this.container.addChild(this.master[this.drawList[i].id]);
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
    if(this.model==="stripes")
    {
      for(let i=0; i < this.drawList.length; ++i)
      {
        let point = new PIXI.Point();
        point.x = Number(this.drawList[i][this.model+"_x"]) * width;
        point.y = Number(this.drawList[i][this.model+"_y"]) * height;
        this.master[this.drawList[i].id].setLastPoint();
        this.master[this.drawList[i].id].setNextPoint(point);
      }
    }
    else{
    for(let i=0; i < this.drawList.length; ++i)
    {
      let point = new PIXI.Point();
      point.x = Number(this.drawList[i][this.model+"_x"]);
      point.y = Number(this.drawList[i][this.model+"_y"]);
      this.master[this.drawList[i].id].setLastPoint();
      this.master[this.drawList[i].id].setNextPoint(point);
    }
  }
    updateQueue.push(this.animate.bind(this));
  }
  animate(delta){
    this.timeLeft += delta;
    if(this.timeLeft >= this.animationTime)
    {
      updateQueue.pop();
    }
    else
    {
      const currentTime = Utilities.easeInOutCubic(this.timeLeft / this.animationTime);
      for(let i=0; i < this.drawList.length; ++i)
      {
        this.master[this.drawList[i].id].moveToNextPoint(currentTime);
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
    this.position.x = (1-t) * this.lastPoint.x + t * this.nextPoint.x;
    this.position.y = (1-t) * this.lastPoint.y + t * this.nextPoint.y; 
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