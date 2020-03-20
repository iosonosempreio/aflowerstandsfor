import React, { Component } from 'react';
import * as d3 from 'd3';
import FileSaver from 'file-saver';

import Utilities from '../Utilities/Utilities';

const data_url = 'https://raw.githubusercontent.com/pcm-dpc/COVID-19/master/dati-regioni/dpc-covid19-ita-regioni.csv';
const simulation = d3.forceSimulation()
    .stop();

const size = Utilities.emoji.size/Utilities.clampZoomOptions.maxScale;

let projection;

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
      // csv = csv.filter(d=>d.denominazione_regione==='Lazio')

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
        Utilities.categories.forEach(c=>{
          for (let ii=0; ii<raw_data[i][c]; ++ii){
            const obj={
              'category': c,
              'denominazione_regione': raw_data[i].denominazione_regione,
              'date': raw_data[i].data,
              '_x': raw_data.find(dd=>dd.denominazione_regione===raw_data[i].denominazione_regione).x,
              '_y': raw_data.find(dd=>dd.denominazione_regione===raw_data[i].denominazione_regione).y,
              'x': window.innerWidth*Math.random(),
              'y': window.innerHeight*Math.random()
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
          .scaleExtent([Utilities.clampZoomOptions.minScale, Utilities.clampZoomOptions.maxScale])
          .on("zoom", zoomed));

        function zoomed() {
          g.attr("transform", d3.event.transform);
        }

        let nodes = g.selectAll('text').data(this.state.data).enter().append('text')
          .attr('font-size',size+'px')
          .text(d=>Utilities.emoji_dictionary[d.category]);

        const alphaDecay = window.prompt('Set the alpha decay of force simulation', 0.005);

        simulation.nodes(data)
          .force("x", d3.forceX(d=>d._x))
          .force("y", d3.forceY(d=>d._y))
          .force("charge", d3.forceManyBody().strength(-0.08))
          .force("collision", d3.forceCollide(size/2*0.9).iterations(4))
          .alphaDecay(alphaDecay)
          .alpha(1)
          .on("end", () => {
            nodes
              .attr('x',d=>d.x)
              .attr('y',d=>d.y);
            console.log('ended',data);

            if (window.confirm("🌺🌿☘️🌼🌸 download spatialized data?")) {
              for (let i=0; i<data.length; ++i){
                data[i]._x = data[i].x;
                data[i]._y = data[i].y;
                delete data[i].index;
                delete data[i].vx;
                delete data[i].vy;
                delete data[i].x;
                delete data[i].y;
              }
              var blob = new Blob([JSON.stringify(data)], {type: "application/json;charset=utf-8"});
              FileSaver.saveAs(blob, "covi-z.json");
            }

          })
          .restart();

        spatialization()
        function spatialization() {
          if (simulation.alpha() > 0.1) {
            document.title = simulation.alpha().toFixed(4);

            nodes
              .attr('x',d=>d.x)
              .attr('y',d=>d.y);

            requestAnimationFrame(spatialization)
          }
        }

        document.addEventListener("keypress", async function(event){
          if (event.key==='r') {
            simulation.alpha(0.5).restart();
          }
        });
      })
    })
  }
  render() {
    console.log(this.state.data);
    return <svg ref={this._setRef.bind(this)} style={{ width:'100%', height:'100%'}}></svg>;
  }
}

export default Test;
