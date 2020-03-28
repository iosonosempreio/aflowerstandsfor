import React, { Component } from 'react';
import * as d3 from 'd3';
import PixiViz from '../PixiViz/PixiViz';

const initialModel="bunches";
// import Utilities from '../Utilities/Utilities';
class VizView extends Component {
  constructor(props) {
    super(props);
    this.state = {
      data: null,
      play:false,
      unique_IDS:{}
    }
    this.changeDate = this.changeDate.bind(this);
  }
  _setRef(componentNode) {
    this._rootNode = componentNode;
  }
  changeDate(index){
    if (index<0) {
      index = this.state.dates.length-1
    } else if (index>this.state.dates.length-1) {
      index = 0
    }
    const newDate = this.state.dates[index];
    this.setState({current_date:newDate, current_date_index:index, data_day:this.state.data[newDate]});
  }
  changeModel(newModel){
    this.setState({model:newModel});
  }
  async componentDidMount() {
    // init interface and things
    // ...
    // load data
    const fetched = await Promise.all([
          d3.csv('./data/list-daily-datasets.csv'),
          d3.json('./data/regioni.geojson'),
        ])
        
    const dates = fetched[0].map(d=>d.date);

    let data = {};
    const dailyDatasets = await Promise.all(fetched[0].map(d=>d3.csv('./data/'+d.file_name)))
    for (let i=0; i<dates.length; i++) {
      for (let ii=0; ii<dailyDatasets[i].length; ii++){
        const elm = dailyDatasets[i][ii];
        elm.x=Number(elm.origin_x);
        elm.y=Number(elm.origin_y);
        if(!(elm.id in this.state.unique_IDS))
        {
          this.state.unique_IDS[elm.id] = {category: elm.category, position: {x:elm[initialModel+"_x"], y:elm[initialModel+"_y"]}};
        }
      }
      console.log(Object.keys(this.state.unique_IDS).length);
      data[dates[i]] = dailyDatasets[i];
    }
    
    let index = dates.length-1;
    index = 0;
    const data_day = data[dates[index]];

    await this.setState({data:data, dates:dates, current_date:dates[index], current_date_index:index, data_day:data_day, model:initialModel, mapGeometries:fetched[1]});
  }
  render() {
    return  <div ref={this._setRef.bind(this)}>
              <header>
                header
                <p>
                  <input type="button" name="prev-date" value="⏪" onClick={ ()=>this.changeDate(this.state.current_date_index-1) } />
                  <input type="button" name="prev-date" value="▶️" onClick={ ()=>this.setState({play:!this.state.play}, this.changeDate(this.state.current_date_index+1)) } />
                  <input type="button" name="prev-date" value="⏩" onClick={ ()=>this.changeDate(this.state.current_date_index+1) } />
                  <input type="button" name="bands" value="🖼" onClick={ ()=>this.changeModel('stripes') } />
                  <input type="button" name="bunch" value="💐" onClick={ ()=>this.changeModel('bunches') } />
                  <input type="button" name="clusters" value="🎯" onClick={ ()=>this.changeModel('clusters') } />
                  {this.state.current_date}
                </p>
              </header>
              
              {this.state.data &&
                <PixiViz
                  data={this.state.data_day.reverse()}
                  model={this.state.model}
                  mapGeometries={this.state.mapGeometries}
                  play={this.state.play}
                  current_date_index={this.state.current_date_index}
                  changeDate={this.changeDate}
                  unique_IDS = {this.state.unique_IDS}
                />
              }
              <footer>
                footer
              </footer>
            </div>;
  }
}

export default VizView;
