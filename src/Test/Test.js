import React, { Component } from 'react';
import * as d3 from 'd3';
import FileSaver from 'file-saver';

import Utilities from '../Utilities/Utilities';

const data_url = 'https://raw.githubusercontent.com/pcm-dpc/COVID-19/master/dati-regioni/dpc-covid19-ita-regioni.csv';
const categories = [
  "ricoverati_con_sintomi",
  "terapia_intensiva",
  // "totale_ospedalizzati",
  "isolamento_domiciliare",
  // "totale_attualmente_positivi",
  // "nuovi_attualmente_positivi",
  "dimessi_guariti",
  "deceduti",
  // "tamponi"
]

const emoji_dictionary = {
  "ricoverati_con_sintomi": '🌺',
  "terapia_intensiva": '💐',
  "isolamento_domiciliare": '🍀',
  "dimessi_guariti": '🌼',
  "deceduti": '🌸'
};

let projection;

const simulation = d3.forceSimulation()
    .stop();

class Test extends Component {
  constructor(props){
    super(props);
    this.state = {
      data: []
    }
  }
  _setRef(componentNode) {
    this._rootNode = componentNode;
  }
  componentDidMount() {
    d3.csv(data_url).then(csv=>{

      // csv = csv.filter(d=>d.denominazione_regione==='Sicilia'||d.denominazione_regione==="Valle d'Aosta"||d.denominazione_regione==="Lazio")
      // csv = csv.filter(d=>d.denominazione_regione==='Lombardia')

      const byDates = d3.nest()
        .key(d=>d.data)
        .entries(csv);
      
      const raw_data = byDates[byDates.length-1].values;
      console.log(raw_data);
      const data = [];

      projection = d3.geoConicEqualArea()
        .fitSize([window.innerWidth -200, window.innerHeight-200], this._rootNode)
        .translate([window.innerWidth / 2, window.innerHeight / 2])
        .scale(3000)
        .center([12.368775000000001, 42.9451139]);

      raw_data.forEach(r=>{
        const point = projection([r.long,r.lat]);
        r.x = point[0];
        r.y = point[1];
      })

      for(let i=0; i<raw_data.length; ++i) {
        categories.forEach(c=>{
          for (let ii=0; ii<raw_data[i][c]; ++ii){
            const obj={
              'category': c,
              'denominazione_regione': raw_data[i].denominazione_regione,
              'date': raw_data[i].data,
              'x': raw_data.find(dd=>dd.denominazione_regione===raw_data[i].denominazione_regione).x,
              'y': raw_data.find(dd=>dd.denominazione_regione===raw_data[i].denominazione_regione).y
            }
            data.push(obj);
          }
        })
      }
      this.setState({raw_data:raw_data, data:data}, ()=>{

        const svg = d3.select(this._rootNode);
        const g = svg.append('g');
          
        svg.call(d3.zoom()
          .extent([[0, 0], [window.innerWidth, window.innerHeight]])
          .scaleExtent([1, 20])
          .on("zoom", zoomed));

        function zoomed() {
          g.attr("transform", d3.event.transform);
        }

        let nodes = g.selectAll('text').data(this.state.data).enter().append('text')
          .attr('font-size',Utilities.emoji.size+'px')
          .text(d=>emoji_dictionary[d.category]);

        const alphaDecay = window.prompt('Set the alpha decay of force simulation', 0.005);

        simulation.nodes(data)
          .on('tick', ()=>{
            // console.log(simulation.alpha());
            document.title = simulation.alpha().toFixed(4);
            // nodes
            //   .attr('x',d=>d.x)
            //   .attr('y',d=>d.y);
          })
          .force("x", d3.forceX(d=>d.x))
          .force("y", d3.forceY(d=>d.y))
          .force("collision", d3.forceCollide(0.35))
          .alphaDecay(alphaDecay)
          .alpha(1)
          .on("end", () => {
            nodes
              .attr('x',d=>d.x)
              .attr('y',d=>d.y);
            console.log('ended',data);

            if (window.confirm("🌺🌿☘️🌼🌸 download spatialized data?")) {
              for (let i=0; i<data.length; ++i){
                delete data[i].index;
                delete data[i].vx;
                delete data[i].vy;
              }
              var blob = new Blob([JSON.stringify(data)], {type: "application/json;charset=utf-8"});
              FileSaver.saveAs(blob, "covi-z.json");
            }

          })
          .restart();

        // spatialization()
        // function spatialization() {
        //   if (simulation.alpha() > 0.1) {
        //     requestAnimationFrame(spatialization())
        //   }
        // }
      })
    })
  }
  render() {
    console.log(this.state.data);
    return <svg ref={this._setRef.bind(this)} style={{ width:'100%', height:'100%'}}></svg>;
  }
}

export default Test;
