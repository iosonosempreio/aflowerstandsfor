const fs = require('fs');
const request = require('request');
const d3 = require('d3');
const data_url = 'https://raw.githubusercontent.com/pcm-dpc/COVID-19/master/dati-regioni/dpc-covid19-ita-regioni.csv';

const Utilities = {
    map: {
        width:768,
        height:1024,
        scale:10000
    }
}

const coordinate_regioni = {
    'Abruzzo':[42.21, 13.83],
    'Basilicata':[40.5, 16.5],
    'P.A. Bolzano':[46.38, 11.42],
    'Calabria':[39, 16.5],
    'Campania':[40.75, 14.78],
    'Emilia Romagna':[44.75, 11],
    'Friuli Venezia Giulia':[46.1, 13.12],
    'Lazio':[41.9, 12.72],
    'Liguria':[44.45, 8.77],
    'Lombardia':[45.65, 9.95],
    'Marche':[43.32, 13],
    'Molise':[41.70, 14.61],
    'Piemonte':[45.25, 7.92],
    'Puglia':[41.01, 16.51],
    'Sardegna':[40.05, 9.08],
    'Sicilia':[37.60, 14.01],
    'Toscana':[43.35, 11.02],
    'P.A. Trento':[46.38, 11.42],
    'Trentino-Alto Adige':[46.38, 11.42],
    'Umbria':[42.98, 12.57],
    'Valle d\'Aosta':[45.72, 7.37],
    'Veneto':[45.73, 11.85]
}

const categories = [
    "deceduti",
    "terapia_intensiva",
    "ricoverati_con_sintomi",
    "isolamento_domiciliare",
    "dimessi_guariti"
  ]

const projection = d3.geoConicEqualArea()
    // .fitSize([Utilities.map.width-50, Utilities.map.height-50], this._rootNode)
    .translate([Utilities.map.width / 2, Utilities.map.height / 2])
    .scale(Utilities.map.scale)
    .center([12.368775000000001, 42.9451139]);

const simulation = d3.forceSimulation()
    .force("x", d3.forceX(d=>d._x))
    .force("y", d3.forceY(d=>d._y))
    // .force("charge", d3.forceManyBody().strength(-30))
    .force("collision", d3.forceCollide(5))
    .alphaDecay(0.05)
    .alphaMin(0.1)
    .stop();

console.log('UPDATING DATA FOR THE PROJECT');
console.log('Downloading data from:',data_url);

request.get(data_url, function (error, response, body) {
    if (!error && response.statusCode == 200) {
        const data = d3.csvParse(body);
        const regions = d3.nest()
            .key(d=>d.denominazione_regione)
            .entries(data);
        const dataByDates = d3.nest()
            .key(d=>d.data)
            .entries(data);
        let data_to_export = {};
        const dates = dataByDates.map(d=>d.key)//.slice(14,16);
        dates.forEach(this_date=>{
            data_to_export[this_date] = [];
            const data_day = data.filter(d=>d.data === this_date);
            data_day.forEach((region,i)=>{
                categories.forEach(c=>{
                    for (let ii=0; ii<region[c]; ii++){
                        const point = projection([coordinate_regioni[region.denominazione_regione][1],coordinate_regioni[region.denominazione_regione][0]]);
                        const obj={
                          'id': region.denominazione_regione.substring(0,4) + '-' + c.replace('P.A. ','').substring(0,4) + '-' + ii,
                          'category': c,
                          'denominazione_regione': region.denominazione_regione,
                          'date': region.data.split(' ')[0],
                          '_x': point[0],
                          '_y': point[1]
                        }
                        data_to_export[this_date].push(obj);
                      }
                })
            })
        })

        let counter = 0;
        runSimulation(counter);

        function runSimulation(index) {
            const nodes = data_to_export[dates[index]],
                width=1,
                height=1;
            function adjust_coordinates() {

                let bands_x = 0;

                categories.forEach(category=>{
                    let band_data = nodes.filter(s=>s.category===category);
                    const percentage = band_data.length/nodes.length;
                    const band_width = width*percentage;
                    bands_x += band_width;
                    band_data.forEach(n=>{
                        n.s_x = +(bands_x + d3.randomUniform(-band_width,0)()).toFixed(3);
                        n.s_y = +(d3.randomUniform(0, height)().toFixed(3));

                        n.b_x = +(n.x).toFixed(3);
                        n.b_y = +(n.y).toFixed(3);

                        n.c_x = +(n.x).toFixed(3);
                        n.c_y = +(n.y).toFixed(3);

                        n._x = +(n._x).toFixed(3);
                        n._y = +(n._y).toFixed(3);

                        n.x = n._x;
                        n.y = n._y;
                        
                        delete n.vx;
                        delete n.vy;
                        delete n.index;
                    })
                })
            }
            simulation.nodes(nodes)
                .alpha(1)
                .restart()
                .on('end',()=>{
                    console.log('simulation ended for', dates[index]);
                    adjust_coordinates();
                    counter++;
                    if (counter<dates.length){
                        runSimulation(counter);
                    } else {
                        fs.writeFileSync('public/data/covi-z-storico.json', JSON.stringify(data_to_export));  
                    }
                });
        }
    }
});