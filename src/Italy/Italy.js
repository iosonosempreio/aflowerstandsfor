import React, { Component } from 'react';
import * as d3 from 'd3';

class Italy extends Component {
  constructor(props) {
    super(props);
    this.state={};
  }
  _setRef(componentNode) {
    this._rootNode = componentNode;
  }
  async componentDidMount(){
    const fetched = await Promise.all([
      d3.csv('./data/italy/datasets.csv'),
      d3.json('./data/regioni.geojson')
    ]);
    const datasets = await Promise.all(fetched[0].map(d=>d3.csv('./data/italy/'+d.file_name)));
    const data = {};
    fetched[0].map(d=>d.date).forEach((date,i)=>{
      data[date] = datasets[i];
    })
    const map = fetched[1];
    this.setState({data:data,map:map});
  }
  render() {
    return <div ref={this._setRef.bind(this)}>
      {!this.state.data && <div>Loading data...</div>}
      {this.state.data && <div>Data is loaded</div>}
    </div>;
  }
}
export default Italy;

const country_info = {
  'regions_codes':{
    'name': 'code'
  }
}