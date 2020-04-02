import React, { Component } from 'react';
import * as d3 from 'd3';
import Visualization from '../Visualization/Visualization';

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
    return <div className="italy" ref={this._setRef.bind(this)}>
      {!this.state.data && <div>Loading data...</div>}
      {this.state.data && <Visualization data={this.state.data} map={this.state.map} country_info={country_info}/>}
    </div>;
  }
}
export default Italy;

const country_info = {
  'regions_codes':{
    '13':'Abruzzo',
    '17':'Basilicata',
    '18':'Calabria',
    '15':'Campania',
    '08':'Emilia-Romagna',
    '06':'Friuli Venezia Giulia',
    '12':'Lazio',
    '07':'Liguria',
    '03':'Lombardia',
    '11':'Marche',
    '14':'Molise',
    '01':'Piemonte',
    '16':'Puglia',
    '20':'Sardegna',
    '19':'Sicilia',
    '09':'Toscana',
    '04':'Trentino-Alto Adige',
    '10':'Umbria',
    '02':'Valle d\'Aosta',
    '05':'Veneto'
  },
  'categories_codes':{
    "1":"deceased",
    "2":"intensive_cares",
    "3":"hospitalized",
    "4":"home_isolation",
    "5":"recovered"
  }
};