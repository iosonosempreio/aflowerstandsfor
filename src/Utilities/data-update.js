const fs = require('fs');
const request = require('request');
const d3 = require('d3');
const { Parser } = require('json2csv');

console.log('\nThis scripts create spatialized data for the project.\n');

let script_arguments = {
    'dates': 'all',
    'dataset': 'remote',
    'overwrite': false
}
if (process.argv.length > 2) {
    process.argv.slice(2).forEach(arg=>{
        arg = arg.split('=');
        script_arguments[arg[0]] = arg[1].toString();
    });
}

console.log('script arguments:', script_arguments);

let data_url;
if (script_arguments.dataset==='local') {
    data_url = 'http://localhost:3000/data/dpc-covid19-ita-regioni.csv';
} else if (script_arguments.dataset==='remote') {
    data_url = 'https://raw.githubusercontent.com/pcm-dpc/COVID-19/master/dati-regioni/dpc-covid19-ita-regioni.csv';
} else {
    console.log('Unrecognized "dataset" argument:', script_arguments.dataset);
    console.log('Should be either: "remote" or "local"');
    return;
}

const daily_datasets_path = `public/data/list-daily-datasets.csv`;

const Utilities = {
    map: {
        width:768,
        height:1024,
        scale:30000
    },
    emoji: {
        size:20
    }
}

let r=1;

Utilities.clusters_centers = {
    "deceduti": [r * Math.cos(Math.PI/180*72*0),r * Math.sin(Math.PI/180*72*0)],
    "terapia_intensiva": [r * Math.cos(Math.PI/180*72*1),r * Math.sin(Math.PI/180*72*1)],
    "ricoverati_con_sintomi": [r * Math.cos(Math.PI/180*72*2),r * Math.sin(Math.PI/180*72*2)],
    "isolamento_domiciliare": [r * Math.cos(Math.PI/180*72*3),r * Math.sin(Math.PI/180*72*3)],
    "dimessi_guariti": [r * Math.cos(Math.PI/180*72*4),r * Math.sin(Math.PI/180*72*4)]
}

r = Utilities.emoji.size/9;

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

const projection = d3.geoNaturalEarth1()
    // .fitSize([Utilities.map.width-50, Utilities.map.height-50], this._rootNode)
    .translate([Utilities.map.width / 2, Utilities.map.height / 2])
    .scale(Utilities.map.scale)
    .center([12.368775000000001, 42.9451139]);

let nodes = [], links = [],clusters = {};

const simulation = d3.forceSimulation()
    .on('tick',()=>{
        let alpha = 'simulation alpha:' + simulation.alpha().toString();
        process.stdout.cursorTo(0);
        process.stdout.clearLine();
        process.stdout.write(alpha);
    })
    .force("charge", d3.forceManyBody().strength(-0.5))
    .force("link", d3.forceLink().id(d => d.id).distance(0).strength(1))
    .force("x", d3.forceX(d=>d.origin_x).strength(0.1))
    .force("y", d3.forceY(d=>d.origin_y).strength(0.1))
    .force("collision", d3.forceCollide(Utilities.emoji.size/9))
    // .alphaDecay(0.01)
    // .alphaMin(0.01)
    .stop();

console.log('Downloading data from:',data_url);

request.get(data_url, function (error, response, body) {
    if (!error && response.statusCode == 200) {
        fs.writeFileSync('public/data/dpc-covid19-ita-regioni.csv', body);
        const data = d3.csvParse(body);
        // const regions = d3.nest()
        //     .key(d=>d.denominazione_regione)
        //     .entries(data);
        const dataByDates = d3.nest()
            .key(d=>d.data)
            .entries(data);
        let data_to_spatialize = {};

        let dates = dataByDates.map(d=>d.key);

        const header_data_list = 'date,file_name\n';
        if (script_arguments.dates==='all') {
            fs.writeFileSync(daily_datasets_path, header_data_list);
        } else if (script_arguments.dates==='latest') {
            if (!fs.existsSync(daily_datasets_path)) {
                fs.writeFileSync(daily_datasets_path, header_data_list);   
            }
            dates = dates.slice(dates.length-1, dates.length); 
        }  else if (script_arguments.dates.includes('[')) {
            script_arguments.dates = JSON.parse(script_arguments.dates);
            console.log('\nYou passed an array of dates.\nThe script will replace existing data with dates from');
            console.log(dates[script_arguments.dates[0]], 'to', dates[script_arguments.dates[script_arguments.dates.length-1]]);
            if (!fs.existsSync(daily_datasets_path)) {
                fs.writeFileSync(daily_datasets_path, header_data_list);
            }
            dates = dates.slice(script_arguments.dates[0], script_arguments.dates[script_arguments.dates.length-1]);
        } else {
            console.log('Unrecognized "dates" argument:', script_arguments.dates);
            console.log('Should be either: "all", "latest" or a 2 elements array (e.g. [3,9])');
            return;
        }

        console.log('\nspatialise for the following dates:')
        console.log(dates);

        dates.forEach(this_date=>{
            data_to_spatialize[this_date] = [];
            let data_day = data.filter(d=>d.data === this_date);
            const bolzano = data_day.find(d=>d.denominazione_regione==='P.A. Bolzano');
            const trento = data_day.find(d=>d.denominazione_regione==='P.A. Trento');
            const trentino = {
                data: bolzano.data,
                stato: bolzano.stato,
                codice_regione: bolzano.codice_regione,
                denominazione_regione: 'Trentino-Alto Adige',
                lat: '46.38',
                long: '11.42',
                ricoverati_con_sintomi: Number(bolzano.ricoverati_con_sintomi)+Number(trento.ricoverati_con_sintomi),
                terapia_intensiva: Number(bolzano.terapia_intensiva)+Number(trento.terapia_intensiva),
                totale_ospedalizzati: Number(bolzano.totale_ospedalizzati)+Number(trento.totale_ospedalizzati),
                isolamento_domiciliare: Number(bolzano.isolamento_domiciliare)+Number(trento.isolamento_domiciliare),
                totale_attualmente_positivi: Number(bolzano.totale_attualmente_positivi)+Number(trento.totale_attualmente_positivi),
                nuovi_attualmente_positivi: Number(bolzano.nuovi_attualmente_positivi)+Number(trento.nuovi_attualmente_positivi),
                dimessi_guariti: Number(bolzano.dimessi_guariti)+Number(trento.dimessi_guariti),
                deceduti: Number(bolzano.deceduti)+Number(trento.deceduti),
                totale_casi: Number(bolzano.totale_casi)+Number(trento.totale_casi),
                tamponi: Number(bolzano.tamponi)+Number(trento.tamponi)
            }
            data_day.splice(data_day.indexOf(bolzano),1);
            data_day.splice(data_day.indexOf(trento),1, trentino);
            // One element for each category for each region
            clusters = {};
            data_day.forEach((region,i)=>{
                categories.forEach(c=>{
                    for (let ii=0; ii<region[c]; ii++){
                        const point = projection([coordinate_regioni[region.denominazione_regione][1],coordinate_regioni[region.denominazione_regione][0]]);
                        const obj={
                          'id': region.denominazione_regione.substring(0,4) + '-' + c.replace('P.A. ','').substring(0,4) + '-' + ii,
                          'category': c,
                          'denominazione_regione': region.denominazione_regione,
                          'date': region.data.split(' ')[0],
                          'origin_x': point[0],
                          'origin_y': point[1]
                        }
                        if (ii===0) {
	                        let r_unit = Math.sqrt(Number(region[c])/Math.PI)*2;
	                        obj.fx = Number(obj.origin_x) + r_unit*r*Utilities.clusters_centers[c][0];
	                        obj.fy = Number(obj.origin_y) + r_unit*r*Utilities.clusters_centers[c][1];
                            clusters[`${region.denominazione_regione}_${c}`] = obj;
                        } else {
                           obj.cluster = clusters[`${region.denominazione_regione}_${c}`];  
                        }     
                        data_to_spatialize[this_date].push(obj);
                      }
                })
            shuffle(data_to_spatialize[this_date]);
            })
        })

        let counter = 0;
        runSimulation(counter);
        function runSimulation(index) {
            console.log('\nspatializing data from', dates[index]);
            nodes = data_to_spatialize[dates[index]],
                    width=1,
                    height=1;
            links = [];
            for (let i=0, link; i<nodes.length; i++){
                if (nodes[i].cluster){
                    link = {source:nodes[i].cluster.id, target: nodes[i].id}
                    links.push(link);
                }
            }
            console.log('nodes amount:', nodes.length);
            console.log('clusterss amount:', Object.keys(clusters).length)
            function adjust_coordinates() {
                let bands_x = 0;
                categories.forEach(category=>{
                    let band_data = nodes.filter(s=>s.category===category);
                    const percentage = band_data.length/nodes.length;
                    const band_width = width*percentage;
                    bands_x += band_width;
                    band_data.forEach(n=>{
                        n.stripes_x = Number(bands_x + d3.randomUniform(-band_width,0)()).toFixed(3);
                        n.stripes_y = Number(d3.randomUniform(0, height)().toFixed(3));

                        n.origin_x = Number(n.origin_x).toFixed(3);
                        n.origin_y = Number(n.origin_y).toFixed(3);
                        
                        delete n.fx;
                        delete n.fy;
                        delete n.vx;
                        delete n.vy;
                        delete n.x;
                        delete n.y;
                        delete n.index;
                        delete n.cluster;
                    })
                })
            }
            simulation.nodes(nodes);
            simulation.force("link").links([]).strength(1);
            simulation
                .alpha(1)
                .restart()
                .on('end',()=>{
                    process.stdout.cursorTo(0);
                    process.stdout.clearLine();
                    process.stdout.write('simulation for bunches is ended\n');
                    nodes.forEach(n=>{
                        n.bunches_x = Number(n.x).toFixed(3);
                        n.bunches_y = Number(n.y).toFixed(3);
                    });
                    // remove links and run the simulation for bunches
                    simulation.force("link").links(links);
                    simulation.alpha(1).restart().on('end',()=>{
                        process.stdout.cursorTo(0);
                        process.stdout.clearLine();
                        process.stdout.write('simulation for clusters is ended\n');
                        nodes.forEach(n=>{
                            n.clusters_x = Number(n.x).toFixed(3);
                            n.clusters_y = Number(n.y).toFixed(3);
                        });
                        adjust_coordinates();
                    
                        const new_dataset = `${dates[index]},${dates[index].replace(/:/g,'-')}.csv\n`
                        fs.appendFileSync(daily_datasets_path, new_dataset);
    
                        const fields = Object.keys(nodes[0]);
                        const opts = { fields };
    
                        try {
                            const parser = new Parser(opts);
                            const csv = parser.parse(nodes);
                            fs.writeFileSync(`public/data/${dates[index].replace(/:/g,'-')}.csv`, csv);
                        } catch (err) {
                            console.error(err);
                        }
    
                        counter++;
                        if (counter<dates.length){
                            runSimulation(counter);
                        } else {
                            console.log('all calculated')
                            // fs.writeFileSync('public/data/covi-z-storico.json', JSON.stringify(data_to_spatialize)); 
                        }
                    })
                });
        }
    }
});


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