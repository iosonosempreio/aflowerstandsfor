import React, { Component } from 'react';
import * as PIXI from "pixi.js";
import { Viewport } from "pixi-viewport";
import Utilities from '../Utilities/Utilities';

let app, viewport, flowersContainer, geographyContainer, textures,
    dpr=window.devicePixelRatio || 1,
    width=window.innerWidth,
    height=window.innerHeight,
    available_dates,
    projection,
    updateQueue=[],
    prevTime=0;

class Visualization extends Component {
  constructor(props){
    super(props);
    this.state = {
      'model':'bunches',
      'viewBuffer':null,
      'day':'none',
      'day_index':-1
    };
  }
  _setRef(componentNode) {
    this._rootNode = componentNode;
  }
  componentDidMount(){
    // Handle unique IDS
    const unique_IDS_dictionary = {};
    available_dates = Object.keys(this.props.data);
    available_dates.forEach(date=>{
      for (let i=0; i<this.props.data[date].length; ++i){
        const elm = this.props.data[date][i];
        if (!(elm.id in unique_IDS_dictionary)){
          // every ID is a string of 9 numbers:
          // 121000001 > 12=code of region, 1=code of category, 000001=index
          // the combination of those digits makes unique IDS
          unique_IDS_dictionary[elm.id]={};
        }
      }
    })
    const unique_IDS = Object.keys(unique_IDS_dictionary);

    // Init app
    app = new PIXI.Application({
      width: width,
      height: height,
      backgroundColor: 0xf4fff1,
      autoDensity:true,
      resolution: dpr,
      powerPreference: 'high-performance',
      antialias:false,
      sharedTicker: false,
      autoStart:false
    });
    let ticker = PIXI.Ticker.shared;
    ticker.stop();
    this._rootNode.querySelector('#visualization').appendChild(app.view);

    // Init viewport
    viewport = new Viewport({
      // center: new PIXI.Point(-width/2, -height/2),
      passiveWheel: false,
      stopPropagation: true,
      divWheel: this._rootNode,
      screenWidth: width,
      screenHeight: height,
      worldWidth: width,
      worldHeight: height,
      interaction: app.renderer.plugins.interaction
    });
    viewport
      // .clampZoom(Utilities.clampZoomOptions)
      .drag({pressDrag:true, clampWheel:true})
      .pinch()
      .wheel();
    app.stage.addChild(viewport);

    // Initialize containers
    geographyContainer = new PIXI.Container();
    const shapes = new PIXI.Graphics();
    viewport.addChild(shapes);
    shapes.beginFill(0x000000,1)
    shapes.drawCircle(0,0,10);
    shapes.endFill();
    viewport.addChild(geographyContainer);
    flowersContainer = new PIXI.ParticleContainer(unique_IDS.length, {
      vertices: false,
      position: true,
      rotation: false,
      uvs: false,
      tint: false
    });
    viewport.addChild(flowersContainer);
    app.renderer.render(viewport);

    app.loader.add('flowersTextures','./flowers-textures-1.json');
    app.loader.onComplete.add(()=>{
        textures = app.loader.resources.flowersTextures.textures;
        const tempSpritesList={};
        for (let i=0; i<unique_IDS.length; ++i) {
          const flower_id=unique_IDS[i];
          const category = this.props.country_info.categories_codes[flower_id.substring(2,3)]+'.png';
          const sprite = new Flower(textures[category]);
          sprite.x = 50;
          sprite.y = 50;
          sprite.anchor.x = 0.5;
          sprite.anchor.y = 0.5;
          sprite.scale.x = 1/40;
          sprite.scale.y = 1/40;
          tempSpritesList[flower_id]=sprite;
        }

        const viewBuffer = new ViewBuffer(tempSpritesList, flowersContainer);
        this.setState({day:available_dates[0], day_index:0, viewBuffer:viewBuffer});

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
      });
    app.loader.load();
  }
  componentDidUpdate(prevProps,prevState){
    if (prevProps.day_index !== this.state.day_index) {
      //update draw list
      this.state.viewBuffer.clearObjects();
      this.state.viewBuffer.setDrawList(this.props.data[available_dates[this.state.day_index]], this.state.model);
      this.state.viewBuffer.drawObjects();
    } else if (prevState.model !== this.state.model) {
      //animate moveto see ViewBuffer startAnimation()
      this.state.viewBuffer.model = this.props.model;
      this.state.viewBuffer.startAnimation(5, app);
    }
    // console.log(container);
  }
  changeDate(index){
    if (index<0) {
      index = available_dates.length-1
    } else if (index>available_dates.length-1) {
      index = 0
    }
    const newDate = available_dates[index];
    this.setState({day:newDate, day_index:index});
  }
  changeModel(newModel){
    this.setState({model:newModel});
  }
  render() {
    return <div style={{width:'100vw',height:'100vh'}} ref={this._setRef.bind(this)}>
      <div id="visualization"></div>
      <div id="controls" style={{position:'fixed', bottom:0}}>
        <p>
          <input type="button" name="prev-date" value="previous day" onClick={ ()=>this.changeDate(this.state.day_index-1) } />
          {this.state.day && <span>{this.state.day}</span>}
          <input type="button" name="prev-date" value="next day" onClick={ ()=>this.changeDate(this.state.day_index+1) } />
          <input type="button" name="bands" value="stripes" onClick={ ()=>this.changeModel('stripes') } />
          <input type="button" name="bunch" value="bunches" onClick={ ()=>this.changeModel('bunches') } />
          <input type="button" name="clusters" value="clusters" onClick={ ()=>this.changeModel('clusters') } />
        </p>
      </div>
    </div>;
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

export default Visualization;