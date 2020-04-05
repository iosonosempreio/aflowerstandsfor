import React, { Component } from 'react';
import * as PIXI from "pixi.js";
import * as d3 from 'd3';
import * as topojson from 'topojson';
import { Viewport } from "pixi-viewport";
import Utilities from '../Utilities/Utilities';

let app, viewport, flowersContainer, geography, regionsInfo, textures,
    dpr=window.devicePixelRatio || 1,
    width=window.innerWidth,
    height=window.innerHeight,
    available_dates,
    projection = d3.geoNaturalEarth1(),
    path = d3.geoPath(),
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
      backgroundColor: 0xfafafa,
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
      .clampZoom({minScale:0.75,maxScale:5})
      .drag({pressDrag:true, clampWheel:true})
      .pinch()
      .wheel();
    app.stage.addChild(viewport);

    // Initialize containers
    geography = new PIXI.Container();
    viewport.addChild(geography);
    const topoWorld = this.props.topojson;
    // contries codes https://en.wikipedia.org/wiki/ISO_3166-1_numeric
    let world = topojson.feature(topoWorld, topoWorld.objects.countries);
    const country = world.features.find(d=>d.id===this.props.country_info.country_code)
    projection.fitExtent([[5,5],[768-10,1024-10]], country);
    world.features.filter(d=>d.id===this.props.country_info.country_code).forEach(feature=>{
      const this_graphic = new PIXI.Graphics();
      path.projection(projection).context(this_graphic);
      this_graphic.beginFill(0xdfffd6, 1);
      this_graphic.lineStyle(1, 0xfafafa, 0.5);
      path(feature);
      this_graphic.endFill();
      geography.addChild(this_graphic);
    });
    regionsInfo = new PIXI.Container();
    regionsInfo.renderable=false;
    viewport.addChild(regionsInfo);
    flowersContainer = new PIXI.ParticleContainer(unique_IDS.length, {
      scale:true,
      vertices: false,
      position: true,
      rotation: false,
      uvs: false,
      tint: false
    });
    // flowersContainer.renderable=false;
    viewport.addChild(flowersContainer);

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
          const pixel_size = 13;
          sprite.scaleValues = [1/textures[category].orig.width * pixel_size,1/textures[category].orig.height * pixel_size]
          sprite.scale.x = sprite.scaleValues[0];
          sprite.scale.y = sprite.scaleValues[1];
          tempSpritesList[flower_id]=sprite;
        }

        const viewBuffer = new ViewBuffer(tempSpritesList, flowersContainer);
        const index = available_dates.length-1
        this.setState({day:available_dates[index], day_index:index, viewBuffer:viewBuffer});
        viewport.on('zoomed',()=>{viewBuffer.rescaleObjects(viewport.transform.scale._x)})

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
  componentDidUpdate(prevProps, prevState){
    if (prevState.day_index !== this.state.day_index) {
      //update draw list
      this.state.viewBuffer.drawRegionsInfo(this.props.regionsInfo[available_dates[this.state.day_index]]);
      this.state.viewBuffer.clearObjects();
      this.state.viewBuffer.setDrawList(this.props.data[available_dates[this.state.day_index]], this.state.model);
      this.state.viewBuffer.drawObjects();
    } else if (prevState.model !== this.state.model) {
      //animate moveto see ViewBuffer startAnimation()
      this.state.viewBuffer.model = this.state.model;
      this.state.viewBuffer.startAnimation(5, app);
    }
    // if (this.state.model === 'stripes') {
    //   geography.renderable = false;
    //   viewport.snap(0, 0, {topLeft:true,interrupt:true,removeOnComplete:true,removeOnInterrupt:true});
    //   viewport.snapZoom({width: width, interrupt:true, removeOnComplete: true, removeOnInterrupt: true});
    // } else {
    //   geography.renderable = true;
    // }
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
    return <div style={{width:'100%',height:'100%'}} ref={this._setRef.bind(this)}>
      <div id="visualization"></div>
      <div id="controls" style={{position:'fixed', top:0}}>
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
      const margin = 20;
      for(let i=0; i < this.drawList.length; ++i)
      {
        this.master[this.drawList[i].id].position.x = Number(this.drawList[i][this.model+"_x"]) * (width-margin*2)+margin;
        this.master[this.drawList[i].id].position.y = Number(this.drawList[i][this.model+"_y"]) * (height-margin*2)+margin;
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
  rescaleObjects(k){
    for(let i=0; i < this.drawList.length; ++i)
    {
      const flower = this.master[this.drawList[i].id];
      flower.scale.x = flower.scaleValues[0]/k;
      flower.scale.y = flower.scaleValues[1]/k;
    }
  }
  drawRegionsInfo(regions){
    regionsInfo.removeChildren();
    regions.forEach(region=>{
      const this_graphic = new PIXI.Graphics();
      this_graphic.lineStyle(1, 0xff0000, 0.5);
      this_graphic.drawCircle(Number(region.x),Number(region.y),Number(region.r))
      regionsInfo.addChild(this_graphic);
      const text = new PIXI.Text(region.denominazione_regione+'-'+region.total,{fontFamily : 'Arial', fontSize: 10, fill : 0xff1010, align : 'left'});
      text.x=Number(region.x);
      text.y=Number(region.y);
      regionsInfo.addChild(text);
    })
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
      const margin = 20;
      for(let i=0; i < this.drawList.length; ++i)
      {
        let point = new PIXI.Point();
        point.x = Number(this.drawList[i][this.model+"_x"]) * (width-margin*2)+margin;
        point.y = Number(this.drawList[i][this.model+"_y"]) * (height-margin*2)+margin;
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
  originalScale=null;
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