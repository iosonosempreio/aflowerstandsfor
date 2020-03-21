import React, { Component } from 'react';
import * as d3 from 'd3';
import FileSaver from 'file-saver';

import Utilities from '../Utilities/Utilities';

const data_url = 'https://raw.githubusercontent.com/pcm-dpc/COVID-19/master/dati-regioni/dpc-covid19-ita-regioni.csv';
const simulation = d3.forceSimulation().stop();
const size = Utilities.emoji.size/Utilities.clampZoomOptions.maxScale;

let nodes = [], categories = JSON.parse(JSON.stringify(Utilities.categories)),
    node,
    projection,
    simulationIsRunning = true;

class Test extends Component {
  constructor(props){
    super(props);
    this.state = {
      data: []
    }
  }
  _setRef(componentNode) {
    this._rootNode = componentNode;

    projection = d3.geoConicEqualArea()
        .fitSize([Utilities.map.width-50, Utilities.map.height-50], this._rootNode)
        .translate([Utilities.map.width / 2, Utilities.map.height / 2])
        .scale(Utilities.map.scale)
        .center([12.368775000000001, 42.9451139]);
  }
  componentDidMount() {

    d3.csv(data_url).then(csv=>{

      // csv = csv.filter(d=>d.denominazione_regione==='Sicilia'||d.denominazione_regione==="Valle d'Aosta"||d.denominazione_regione==="Lazio")
      // csv = csv.filter(d=>d.denominazione_regione==='Lombardia'||d.denominazione_regione==="Piemonte"||d.denominazione_regione==="Emilia Romagna")
      // csv = csv.filter(d=>d.denominazione_regione==='Lazio'||d.denominazione_regione==="Abruzzo"||d.denominazione_regione==="Umbria")
      // csv = csv.filter(d=>d.denominazione_regione==='Lombardia')
      // csv = csv.filter(d=>d.denominazione_regione==='Piemonte')

      const dataByDates = d3.nest()
        .key(d=>d.data)
        .entries(csv);

      console.log(dataByDates);
      
      const data = {};

      // generating data
      dataByDates.forEach(date=>{

        const this_date = date.key
        const raw_data = date.values;
        raw_data.forEach(r=>{
          const point = projection([r.long,r.lat]);
          r.x = point[0];
          r.y = point[1];
        })

        data[this_date] = [];

        raw_data.forEach((region,i)=>{
          Utilities.categories.forEach((c)=>{
            for (let ii=0; ii<region[c]; ++ii){
              const obj={
                'id': region.denominazione_regione + '-' + c + '-' + ii+1,
                'category': c,
                'denominazione_regione': region.denominazione_regione,
                'date': region.data,
                '_x': region.x,
                '_y': region.y,
                'x': region.x,
                'y': region.y
              }
              data[this_date].push(obj);
            }
          })
        })

      })
      
      this.setState({data:data}, ()=>{

        const svg = d3.select(this._rootNode);
        const g = svg.append('g');
        
        function zoomed() {
          g.attr("transform", d3.event.transform);
        }
  
        const zoom = d3.zoom()
          .extent([[0, 0], [window.innerWidth, window.innerHeight]])
          .scaleExtent([Utilities.clampZoomOptions.minScale, Utilities.clampZoomOptions.maxScale*2])
          .on("zoom", zoomed);
        
        svg.call(zoom);
        svg.call(zoom.transform, d3.zoomIdentity
            .translate(-5, -340)
            .scale(5)
          );
        
        node = g.selectAll('text')
        simulation.nodes(nodes)
          .tick(1000)
          .on("tick", ()=>{
            document.title = simulation.alpha();
            node.attr('x',d=>d.x).attr('y',d=>d.y);
          })
          .force("x", d3.forceX(d=>d._x))
          .force("y", d3.forceY(d=>d._y))
          .force("charge", d3.forceManyBody().strength(-0.05))
          .alphaDecay(0.9)
          .alphaMin(0.1)

          let dates = Object.keys(this.state.data);
          
          const runAllDates = ()=>{
            let date = dates.shift();
            console.log(date);
            let data_to_use = this.state.data[date];
            console.log(data_to_use);

            categories = JSON.parse(JSON.stringify(Utilities.categories));
            nodes = addNodes(nodes, data_to_use, categories.shift());
            updateForceLayout();

            simulation.force("collision", null)

            simulation.on("end", () => {
              document.title = 'simulation ended';
              if (categories.length>0) {
                nodes = addNodes(nodes, data_to_use, categories.shift());
                updateForceLayout();
              } else {
                document.title = 'running anticollision';
                console.log('running anticollision');

                simulation.force("collision",
                  d3.forceCollide( (Utilities.emoji.size/Utilities.clampZoomOptions.maxScale/2)*0.9 )
                    .strength(0.1)
                );

                simulation
                  .alpha(1)
                  .restart()
                  .on('end',()=>{
                    console.log('done anticollision, missing', dates.length)
                    if (dates.length>0) {
                      nodes.forEach(n=>{
                        delete n.x;
                        delete n.y;
                        delete n.index;
                        delete n.vx;
                        delete n.vy;
                        delete n.fx;
                        delete n.fy;
                      })
                      nodes = [];
                      runAllDates();
                    } else {
                      downloadSpatializedData(this.state.data)
                    }
                  });
              }
            })
          }
          runAllDates();
      })
    })

    document.addEventListener('keypress', (e)=>{
      if (e.key==='r'){
        simulation.alpha(1).restart();
      } else if (e.key==='\\'){
        simulation.alpha(0.00001).restart();
      } else if (e.key==='c' || e.keyCode===99){
        nodes.forEach(n=>{
          n.fx=null;
          n.fy=null
        })
        simulation.force("collision",
          d3.forceCollide( (Utilities.emoji.size/Utilities.clampZoomOptions.maxScale/2)*0.9 )
            .strength(0.1)
        );
        simulation
          .alpha(1)
          .restart();

      } else if (e.key==='d') {
        downloadSpatializedData(nodes);
      }
    })
  }
  render() {
    return <svg ref={this._setRef.bind(this)} style={{ width:'100%', height:'100%'}}></svg>;
  }
}

export default Test;

const addNodes = (nodes, data, category)=>{
  nodes.forEach(n=>{
    n.fx=n.x;
    n.fy=n.y
  })
  const newNodes = data.filter(d=>d.category===category);
  const a = 360/newNodes.length * 20;
  const r = Math.sqrt((newNodes.length+nodes.length)/Math.PI)*2;
  newNodes.forEach((d,i)=>{
    d.x=d._x + Math.cos(Math.PI/180*i*a) * (r+i/80) + d3.randomUniform(-5,5)();
    d.y=d._y + Math.sin(Math.PI/180*i*a) * (r+i/80) + d3.randomUniform(-5,5)();
  })
  return nodes.concat(newNodes);
}

const updateForceLayout = () => {
  node = node.data(nodes, d=>d.id)
  node.exit().remove();

  node = node.enter().append('text')
    .classed('node', true)
    .attr('font-size',size+'px')
    .text(d=>Utilities.emoji_dictionary[d.category])
    .attr('x',d=>d.x)
    .attr('y',d=>d.y)
    .call(d3.drag()
          .on("start", dragstarted)
          .on("drag", dragged)
          .on("end", dragended))
    .merge(node);

  simulation.nodes(nodes)
    .alpha(1)
    .restart();
}

function dragstarted(d) {
  if (!d3.event.active) simulation.alphaTarget(0.3).restart();
  d.fx = d.x;
  d.fy = d.y;
}

function dragged(d) {
  d.fx = d3.event.x;
  d.fy = d3.event.y;
}

function dragended(d) {
  if (!d3.event.active) simulation.alphaTarget(0);
  d.fx = null;
  d.fy = null;
}

function downloadSpatializedData(data) {
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
  FileSaver.saveAs(blob, "covi-z 2020-02-24 18:00:00.json");
}

// spatialization()
// function spatialization() {
//   if (simulationIsRunning) {
//     document.title = 'a = ' + simulation.alpha();
//     // node
//     //   .attr('x',d=>d.x)
//     //   .attr('y',d=>d.y);
//     requestAnimationFrame(spatialization)
//   }
// }

// node = node.data(nodes, (d,i)=>'node-'+i).enter().append('text').merge(node)
//   .attr('font-size',size+'px')
//   .text(d=>Utilities.emoji_dictionary[d.category])
//   .attr('x',d=>d.x)
//   .attr('y',d=>d.y);

// for (let i=0; i<data.length; ++i){
//   data[i]._x = data[i].x;
//   data[i]._y = data[i].y;
//   delete data[i].index;
//   delete data[i].vx;
//   delete data[i].vy;
//   delete data[i].x;
//   delete data[i].y;
// }
// var blob = new Blob([JSON.stringify(data)], {type: "application/json;charset=utf-8"});
// FileSaver.saveAs(blob, "covi-z.json");