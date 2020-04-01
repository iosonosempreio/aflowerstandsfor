import React, { Component } from 'react';
import * as d3 from 'd3';
import * as topojson from 'topojson';

import FileSaver from 'file-saver';
import Utilities from '../Utilities/Utilities';

// const data_url = 'https://raw.githubusercontent.com/pcm-dpc/COVID-19/master/dati-regioni/dpc-covid19-ita-regioni.csv';
const data_url = './data/dpc-covid19-ita-regioni.csv';


const regions_coordinates = [
  {
      "region_name": "Abruzzo",
      "lat": "42.216666666667",
      "lon": "13.833333333333",
  },
  {
      "region_name": "Valle d'Aosta",
      "lat": "45.716666666667",
      "lon": "7.3666666666667",
  },
  {
      "region_name": "Puglia",
      "lat": "41.008611111111",
      "lon": "16.512777777778",
  },
  {
      "region_name": "Basilicata",
      "lat": "40.5",
      "lon": "16.5",
  },
  {
      "region_name": "Calabria",
      "lat": "39",
      "lon": "16.5",
  },
  {
      "region_name": "Campania",
      "lat": "40.75",
      "lon": "14.783333333333",
  },
  {
      "region_name": "Emilia-Romagna",
      "lat": "44.75",
      "lon": "11",
  },
  {
      "region_name": "Friuli Venezia Giulia",
      "lat": "46.1",
      "lon": "13.116666666667",
  },
  {
      "region_name": "Lazio",
      "lat": "41.9",
      "lon": "12.716666666667",
  },
  {
      "region_name": "Liguria",
      "lat": "44.45",
      "lon": "8.7666666666667",
  },
  {
      "region_name": "Lombardia",
      "lat": "45.65",
      "lon": "9.95",
  },
  {
      "region_name": "Marche",
      "lat": "43.316666666667",
      "lon": "13",
  },
  {
      "region_name": "Molise",
      "lat": "41.6997",
      "lon": "14.6111",
  },
  {
      "region_name": "Piemonte",
      "lat": "45.25",
      "lon": "7.9166666666667",
  },
  {
      "region_name": "Sardegna",
      "lat": "40.05",
      "lon": "9.0833333333333",
  },
  {
      "region_name": "Sicilia",
      "lat": "37.599958333333",
      "lon": "14.015377777778",
  },
  {
      "region_name": "Trentino-Alto Adige",
      "lat": "46.383333333333",
      "lon": "11.416666666667",
  },
  {
      "region_name": "Toscana",
      "lat": "43.35",
      "lon": "11.016666666667",
  },
  {
      "region_name": "Umbria",
      "lat": "42.983333333333",
      "lon": "12.566666666667",
  },
  {
      "region_name": "Veneto",
      "lat": "45.733333333333",
      "lon": "11.85",
  }
];

const categories = {
  "deceduti":"deceased",
  "terapia_intensiva":"intensive_cares",
  "ricoverati_con_sintomi":"hospitalized",
  "isolamento_domiciliare":"home_isolation",
  "dimessi_guariti":"recovered"
};

const categories_codes = {
  "deceduti":"1",
  "terapia_intensiva":"2",
  "ricoverati_con_sintomi":"3",
  "isolamento_domiciliare":"4",
  "dimessi_guariti":"5"
};

const simulation = d3.forceSimulation().stop();

let countries = [], country,
    regions = {}, region,
    nodes = [], node,
    projection = d3.geoNaturalEarth1(),
    path = d3.geoPath().projection(projection);

let radius = d3.scalePow()
  .exponent(0.5);
let color = d3.scaleOrdinal(d3.schemeCategory10);

class Test extends Component {
  constructor(props){
    super(props);
  }
  _setRef(componentNode) {
    this._rootNode = componentNode;
  }

  async componentDidMount() {
    const svg = d3.select(this._rootNode);
    const g = svg.append('g');
    const zoom = d3.zoom().on("zoom", ()=>{g.attr("transform", d3.event.transform);});
    
    svg.call(zoom);
    // svg.call(zoom.transform, d3.zoomIdentity
    //   .translate(-265, -178)
    //   .scale(3)
    // );

    const topoWorld = await d3.json('./data/world-50m.json');
    // contries codes https://en.wikipedia.org/wiki/ISO_3166-1_numeric
    let world = topojson.feature(topoWorld, topoWorld.objects.countries);
    const italy = world.features.find(d=>d.id==='380') // this is italy
    projection.fitExtent([[5,5],[768-10,1024-10]], italy)
    // projection.scale(10000)
    country = g.append('g').attr('class','countries').selectAll('.country');

    country = country.data(world.features);
    country.exit().remove();
    country.enter().append('path')
        .classed('country', true)
        .merge(country)
        .attr('d', path)
        .attr('fill','#fafafa')
        .attr('stroke','#eef3bd')
        .attr('stroke-width','0.5px');

    const csv = await d3.csv(data_url);
    let flowers = {};
    let links = {};
    let dataByDates = d3.nest()
      .key(d=>d.data)
      .entries(csv);

    let selected_day
    selected_day = '2020-03-01T17:00:00';
    // selected_day = '2020-03-10T18:00:00';
    // selected_day = '2020-02-24T18:00:00';
    // selected_day = '2020-03-20T17:00:00';
    // selected_day = '2020-03-29T17:00:00';
    // selected_day = '2020-03-31T17:00:00';

    dataByDates = dataByDates.filter(d=>d.key===selected_day)

    dataByDates.forEach(date=>{
      flowers[date.key] = [];
      links[date.key] = [];
      regions[date.key] = [];
      let data_regions = date.values//.filter(d=>d.denominazione_regione==='Piemonte'||d.denominazione_regione==='Lombardia');
      let trentino_elements = data_regions.filter(d=>d.codice_regione==="04") // Bolzano and Trento are different elements with same region code
      const trentino = {
        data: date.key,
        stato: "ITA",
        codice_regione: "04",
        denominazione_regione: "Trentino-Alto Adige",
        lat: "46.49933453",
        long: "11.35662422",
        ricoverati_con_sintomi: Number(trentino_elements[0].ricoverati_con_sintomi) + Number(trentino_elements[1].ricoverati_con_sintomi),
        terapia_intensiva: Number(trentino_elements[0].terapia_intensiva) + Number(trentino_elements[1].terapia_intensiva),
        totale_ospedalizzati: Number(trentino_elements[0].totale_ospedalizzati) + Number(trentino_elements[1].totale_ospedalizzati),
        isolamento_domiciliare: Number(trentino_elements[0].isolamento_domiciliare) + Number(trentino_elements[1].isolamento_domiciliare),
        totale_positivi: Number(trentino_elements[0].totale_positivi) + Number(trentino_elements[1].totale_positivi),
        variazione_totale_positivi: Number(trentino_elements[0].variazione_totale_positivi) + Number(trentino_elements[1].variazione_totale_positivi),
        nuovi_positivi: Number(trentino_elements[0].nuovi_positivi) + Number(trentino_elements[1].nuovi_positivi),
        dimessi_guariti: Number(trentino_elements[0].dimessi_guariti) + Number(trentino_elements[1].dimessi_guariti),
        deceduti: Number(trentino_elements[0].deceduti) + Number(trentino_elements[1].deceduti),
        totale_casi: Number(trentino_elements[0].totale_casi) + Number(trentino_elements[1].totale_casi),
        tamponi: Number(trentino_elements[0].tamponi) + Number(trentino_elements[1].tamponi),
        note_it: "",
        note_en: ""
      };
      const index_of_bolzano = data_regions.indexOf(trentino_elements[0]);
      data_regions.splice(index_of_bolzano,1);
      const index_of_trento = data_regions.indexOf(trentino_elements[1]);
      data_regions.splice(index_of_trento,1);
      data_regions.push(trentino);
      data_regions.forEach(region=>{
        // if(date.key===selected_day) {
        //   console.log(region);
        // };
        region.code = region.codice_regione;
        region.total = region.totale_casi;
        region.center_x = regions_coordinates.find(d=>d.region_name === region.denominazione_regione).lon;
        region.center_y = regions_coordinates.find(d=>d.region_name === region.denominazione_regione).lat;
        const point = projection([region.center_x,region.center_y]);
        region.x = point[0];
        region.y = point[1];
        delete region.data;
        delete region.codice_regione;
        delete region.stato;
        delete region.lat;
        delete region.long;
        delete region.totale_casi;
        delete region.totale_ospedalizzati;
        delete region.totale_positivi;
        delete region.variazione_totale_positivi;
        delete region.nuovi_positivi;
        delete region.tamponi;
        delete region.note_it;
        delete region.note_en;
        regions[date.key].push(region);
        Object.keys(categories).forEach(category=>{
          for (let i=0; i<region[category]; ++i){
            const o = { id: region.code.toString()+''+categories_codes[category]+''+i.toString().padStart(6,"0") };
            flowers[date.key].push(o);
            if (i===0) {
              for (let ii=1; ii<Number(categories_codes[category]); ++ii){
                const link = {
                  source: region.code.toString()+''+ii+''+'0'.toString().padStart(6,"0"),
                  target: o.id
                }
                links[date.key].push(link);
              }
            }
            else {
              const link = {
                source: region.code.toString()+''+categories_codes[category]+''+'0'.toString().padStart(6,"0"),
                target: o.id
              }
              links[date.key].push(link);
            }
          }
        })
      })
      // if(date.key===selected_day) {
      //   console.log(flowers[date.key]);
      //   console.log(links[date.key]);
      // };
    });

    

    radius.range([0,35]).domain([0,d3.max(regions[selected_day], d=>d.total)]);
    region = g.selectAll('.region');
    region = region.data(regions[selected_day], d=>d.code)
      .enter().append('circle')
        .attr('class',d=>d.denominazione_regione)
        .attr('fill','white')
        .attr('stroke','#cccccc')
        .classed('region',true)
        .attr('r', d=>radius(+d.total));

    const simulation_regions = d3.forceSimulation(regions[selected_day])
      .force('x', d3.forceX(d=>d.x))
      .force('y', d3.forceY(d=>d.y))
      .force('collision', d3.forceCollide(d=>radius(d.total)))
      .on('tick', ()=>{
        region.attr('cx',d=>d.x)
          .attr('cy',d=>d.y);
      })
      .on('end',()=>{
        flowers_simulations(selected_day);
      })
      .alpha(1)
      .restart();
    
    let g_flowers = g.append('g').classed('flowers', true);

    function flowers_simulations(date) {
      regions[date]
      .filter(d=>d.denominazione_regione==='Lombardia')
      .forEach(region=>{
        let regional_flowers = flowers[date].filter(d=>d.id.toString().substring(0,2)===region.code);
        console.log(regional_flowers.length);
        // .filter(d=>d.denominazione_regione==='Lombardia')
        shuffle(regional_flowers);
        const regional_links = links[date].filter(d=>d.source.toString().substring(0,2)===region.code);
        // console.log(regional_flowers)
        // console.log(regional_links)

        const regional_simulation = d3.forceSimulation(regional_flowers)
          .force('center', d3.forceCenter(0,0))
          .force('links', d3.forceLink([]).id(d=>d.id).distance(0))
          .force('collision', d3.forceCollide(0.45))
          .force('x', d3.forceX().strength(.09))
          .force('y', d3.forceY().strength(.09))
          .on('tick',()=>{
            document.title = regional_simulation.alpha();
            flower
              .attr('cx',d=>d.x)
              .attr('cy',d=>d.y);
          })
          .alpha(1)
          .on('end',()=>{
            console.log(region.denominazione_regione, 'simulation ended')
            flower
                  .attr('cx',d=>d.x)
                  .attr('cy',d=>d.y);
            regional_flowers.forEach(f=>{
              f.bunches_x = f.x;
              f.bunches_y = f.y;
            })
            regional_simulation.force('links').links(regional_links);
            regional_simulation
              .alpha(1)
              .restart()
              .on('tick',()=>{
                document.title = regional_simulation.alpha();
                flower
                  .attr('cx',d=>d.x)
                  .attr('cy',d=>d.y);
              })
              .on('end',()=>{
                document.title = 'simulation ended';
                flower
                  .attr('cx',d=>d.x)
                  .attr('cy',d=>d.y);
                regional_flowers.forEach(f=>{
                  f.clusters_x = f.x;
                  f.clusters_y = f.y;
                });
                console.log(region.denominazione_regione, 'simulation clusters ended')
              });
          });
        
        let flower = g_flowers.append('g').attr('transform','translate('+region.x+','+region.y+')').attr('class',region.code).selectAll('.flower');
        flower = flower.data(regional_flowers, d=>d.id).enter().append('circle')
          .classed('flower', true)
          .attr('r', 0.5)
          .attr('fill', d=>color(d.id.toString().substring(2,4)))
          .style('opacity',.7)
          .attr('cx', region.x)
          .attr('cy', region.y);
      })
    }

    /**
     * Shuffles array in place. ES6 version
     * @param {Array} a items An array containing the items.
     */
    function shuffle(a) {
      for (let i = a.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    }

    // .then(csv=>{

    //   // csv = csv.filter(d=>d.denominazione_regione==='Sicilia'||d.denominazione_regione==="Valle d'Aosta"||d.denominazione_regione==="Lazio")
    //   // csv = csv.filter(d=>d.denominazione_regione==='Lombardia'||d.denominazione_regione==="Piemonte"||d.denominazione_regione==="Emilia Romagna")
    //   // csv = csv.filter(d=>d.denominazione_regione==='Lazio'||d.denominazione_regione==="Abruzzo"||d.denominazione_regione==="Umbria")
    //   // csv = csv.filter(d=>d.denominazione_regione==='Lombardia')
    //   // csv = csv.filter(d=>d.denominazione_regione==='Piemonte')

    //   const dataByDates = d3.nest()
    //     .key(d=>d.data)
    //     .entries(csv);

    //   console.log(dataByDates);
      
    //   const data = {};

    //   // generating data
    //   dataByDates.forEach(date=>{

    //     const this_date = date.key
    //     const raw_data = date.values;
    //     raw_data.forEach(r=>{
    //       const point = projection([r.long,r.lat]);
    //       r.x = point[0];
    //       r.y = point[1];
    //     })

    //     data[this_date] = [];

    //     raw_data.forEach((region,i)=>{
    //       Utilities.categories.forEach((c)=>{
    //         for (let ii=0; ii<region[c]; ++ii){
    //           const obj={
    //             'id': region.denominazione_regione + '-' + c + '-' + ii+1,
    //             'category': c,
    //             'denominazione_regione': region.denominazione_regione,
    //             'date': region.data,
    //             '_x': region.x,
    //             '_y': region.y,
    //             'x': region.x,
    //             'y': region.y
    //           }
    //           data[this_date].push(obj);
    //         }
    //       })
    //     })

    //   })
      
    //   this.setState({data:data}, ()=>{

    //     const svg = d3.select(this._rootNode);
    //     const g = svg.append('g');
        
    //     function zoomed() {
    //       g.attr("transform", d3.event.transform);
    //     }
  
    //     const zoom = d3.zoom()
    //       .extent([[0, 0], [window.innerWidth, window.innerHeight]])
    //       .scaleExtent([Utilities.clampZoomOptions.minScale, Utilities.clampZoomOptions.maxScale*2])
    //       .on("zoom", zoomed);
        
    //     svg.call(zoom);
    //     svg.call(zoom.transform, d3.zoomIdentity
    //         .translate(-5, -340)
    //         .scale(5)
    //       );
        
    //     node = g.selectAll('text')
    //     simulation.nodes(nodes)
    //       .tick(1000)
    //       .on("tick", ()=>{
    //         document.title = simulation.alpha();
    //         node.attr('x',d=>d.x).attr('y',d=>d.y);
    //       })
    //       .force("x", d3.forceX(d=>d._x))
    //       .force("y", d3.forceY(d=>d._y))
    //       .force("charge", d3.forceManyBody().strength(-0.05))
    //       .alphaDecay(0.1)
    //       .alphaMin(0.1)

    //       let dates = Object.keys(this.state.data);

    //       dates = dates.slice(0,5);
          
    //       const runAllDates = ()=>{
    //         let date = dates.shift();
    //         console.log(date);
    //         let data_to_use = this.state.data[date];
    //         console.log(data_to_use);

    //         categories = JSON.parse(JSON.stringify(Utilities.categories));
    //         nodes = addNodes(nodes, data_to_use, categories.shift());
    //         updateForceLayout();

    //         simulation.force("collision", null)

    //         simulation.on("end", () => {
    //           document.title = 'simulation ended';
    //           if (categories.length>0) {
    //             nodes = addNodes(nodes, data_to_use, categories.shift());
    //             updateForceLayout();
    //           } else {
    //             document.title = 'running anticollision';
    //             console.log('running anticollision');

    //             simulation.force("collision",
    //               d3.forceCollide( (Utilities.emoji.size/Utilities.clampZoomOptions.maxScale/2)*0.9 )
    //                 .strength(0.1)
    //             );

    //             simulation
    //               .alpha(1)
    //               .restart()
    //               .on('end',()=>{
    //                 console.log('done anticollision, missing', dates.length)
    //                 if (dates.length>0) {
    //                   nodes.forEach(n=>{
    //                     delete n.x;
    //                     delete n.y;
    //                     delete n.index;
    //                     delete n.vx;
    //                     delete n.vy;
    //                     delete n.fx;
    //                     delete n.fy;
    //                   })
    //                   nodes = [];
    //                   runAllDates();
    //                 } else {
    //                   downloadSpatializedData(this.state.data)
    //                 }
    //               });
    //           }
    //         })
    //       }
    //       runAllDates();
    //   })
    // })
  }
  render() {
    return <svg ref={this._setRef.bind(this)} style={{ width:'768px', height:'1024px', backgroundColor:'#eef3bd'}}></svg>;
  }
}

export default Test;

// const addNodes = (nodes, data, category)=>{
//   nodes.forEach(n=>{
//     n.fx=n.x;
//     n.fy=n.y
//   })
//   const newNodes = data.filter(d=>d.category===category);
//   const a = 360/newNodes.length * 20;
//   const r = Math.sqrt((newNodes.length+nodes.length)/Math.PI)*2;
//   newNodes.forEach((d,i)=>{
//     d.x=d._x + Math.cos(Math.PI/180*i*a) * (r+i/80) + d3.randomUniform(-5,5)();
//     d.y=d._y + Math.sin(Math.PI/180*i*a) * (r+i/80) + d3.randomUniform(-5,5)();
//   })
//   return nodes.concat(newNodes);
// }

// const updateForceLayout = () => {
//   node = node.data(nodes, d=>d.id)
//   node.exit().remove();

//   node = node.enter().append('text')
//     .classed('node', true)
//     .attr('font-size',size+'px')
//     .text(d=>Utilities.emoji_dictionary[d.category])
//     .attr('x',d=>d.x)
//     .attr('y',d=>d.y)
//     .call(d3.drag()
//           .on("start", dragstarted)
//           .on("drag", dragged)
//           .on("end", dragended))
//     .merge(node);

//   simulation.nodes(nodes)
//     .alpha(1)
//     .restart();
// }

// function dragstarted(d) {
//   if (!d3.event.active) simulation.alphaTarget(0.3).restart();
//   d.fx = d.x;
//   d.fy = d.y;
// }

// function dragged(d) {
//   d.fx = d3.event.x;
//   d.fy = d3.event.y;
// }

// function dragended(d) {
//   if (!d3.event.active) simulation.alphaTarget(0);
//   d.fx = null;
//   d.fy = null;
// }

// function downloadSpatializedData(data) {
//   // for (let i=0; i<data.length; ++i){
//   //   data[i]._x = data[i].x;
//   //   data[i]._y = data[i].y;
//   //   delete data[i].index;
//   //   delete data[i].vx;
//   //   delete data[i].vy;
//   //   delete data[i].x;
//   //   delete data[i].y;
//   // }
//   var blob = new Blob([JSON.stringify(data)], {type: "application/json;charset=utf-8"});
//   FileSaver.saveAs(blob, "covi-z-storico.json");
// }

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


    // projection = d3.geoConicEqualArea()
    //     .fitSize([Utilities.map.width-50, Utilities.map.height-50], this._rootNode)
    //     .translate([Utilities.map.width / 2, Utilities.map.height / 2])
    //     .scale(Utilities.map.scale)
    //     .center([12.368775000000001, 42.9451139]);



    // document.addEventListener('keypress', (e)=>{
    //   if (e.key==='r'){
    //     simulation.alpha(1).restart();
    //   } else if (e.key==='\\'){
    //     simulation.alpha(0.00001).restart();
    //   } else if (e.key==='c' || e.keyCode===99){
    //     nodes.forEach(n=>{
    //       n.fx=null;
    //       n.fy=null
    //     })
    //     simulation.force("collision",
    //       d3.forceCollide( (Utilities.emoji.size/Utilities.clampZoomOptions.maxScale/2)*0.9 )
    //         .strength(0.1)
    //     );
    //     simulation
    //       .alpha(1)
    //       .restart();

    //   } else if (e.key==='d') {
    //     downloadSpatializedData(nodes);
    //   }
    // })