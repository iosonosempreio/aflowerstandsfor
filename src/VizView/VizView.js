import React, { Component } from 'react';
import * as d3 from 'd3';
import PixiViz from '../PixiViz/PixiViz';
// import Utilities from '../Utilities/Utilities';
class VizView extends Component {
  constructor(props) {
    super(props);
    this.state = {
      data: null
    }
    this.changeDate = this.changeDate.bind(this);
  }
  _setRef(componentNode) {
    this._rootNode = componentNode;
  }
  changeDate(index){
    if (index<0||index>this.state.dates.length-1) return;
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
    const data = await d3.json('./data/covi-z-storico.json');
    const dates = Object.keys(data);
    const data_day = data[dates[0]];
    await this.setState({data:data, dates:dates, current_date:dates[0], current_date_index:0, data_day:data_day, model:'bands'});
  }
  render() {
    return  <div ref={this._setRef.bind(this)}>
              <p>
                <input type="button" name="prev-date" value="⏪" onClick={ ()=>this.changeDate(this.state.current_date_index-1) } />
                <input type="button" name="prev-date" value="⏩" onClick={ ()=>this.changeDate(this.state.current_date_index+1) } />
                <input type="button" name="bands" value="🖼" onClick={ ()=>this.changeModel('bands') } />
                <input type="button" name="bunch" value="💐" onClick={ ()=>this.changeModel('bunches') } />
                <input type="button" name="clusters" value="🎯" onClick={ ()=>this.changeModel('clusters') } />
              </p>
              {this.state.data && <PixiViz data={this.state.data_day} model={this.state.model} />}
            </div>;
  }
}

export default VizView;
