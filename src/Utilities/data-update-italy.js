const fs = require('fs');
const request = require('request');
const d3 = require('d3');
const topojson = require('topojson');
const { Parser } = require('json2csv');

let script_arguments = {};
if (process.argv.length > 2) {
    process.argv.slice(2).forEach(arg=>{
        arg = arg.split('=');
        script_arguments[arg[0]] = arg[1].toString();
    });
};

console.log('This scripts updates data according to official Italian releases.');

let data_url = 'https://raw.githubusercontent.com/pcm-dpc/COVID-19/master/dati-regioni/dpc-covid19-ita-regioni.csv';
// let data_url = 'http://localhost:3000/data/italy/dpc-covid19-ita-regioni.csv';

let radius = d3.scalePow().exponent(0.5);
const simulation = d3.forceSimulation().stop();

// let countries = [], country,
//     regions = {}, region,
//     nodes = [], node;

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

const categories_codes_inverted = {
    "1":"deceduti",
    "2":"terapia_intensiva",
    "3":"ricoverati_con_sintomi",
    "4":"isolamento_domiciliare",
    "5":"dimessi_guariti"
};

let projection = d3.geoNaturalEarth1(),
    path = d3.geoPath().projection(projection);

console.log('Downloading data from: ' + data_url + '\n...');
request.get(data_url, function (error, response, body) {
    if (!error && response.statusCode == 200) {
        fs.writeFileSync('public/data/italy/dpc-covid19-ita-regioni.csv', body);
        console.log('Saved local copy of official dataset.');

        const topoWorld = JSON.parse(fs.readFileSync('public/data/world-50m.json').toString());
        // contries codes https://en.wikipedia.org/wiki/ISO_3166-1_numeric
        let world = topojson.feature(topoWorld, topoWorld.objects.countries);
        const italy = world.features.find(d=>d.id==='380') // this is italy
        projection.fitExtent([[5,5],[768-10,1024-10]], italy);
        const parsedCsv = d3.csvParse(body);
        radius.range([20,70]).domain([0,d3.max(parsedCsv, d=>Number(d.totale_casi))]);

        let dataByDates = d3.nest()
            .key(d=>d.data)
            .entries(parsedCsv);

        // let dates = dataByDates.map(d=>d.key);
        
        if (script_arguments.date) {
            if (script_arguments.date==='all'){
                dataByDates = dataByDates
            } else {
                dataByDates = dataByDates.filter(d=>d.key===script_arguments.date);
            }
        } else {
            dataByDates = dataByDates.filter(d=>d.key===dataByDates[dataByDates.length-1].key)
        }

        console.log('Dates to go:', dataByDates.map(d=>d.key));

        let flowers = [];
        let regions = [];

        let dateCounter = 0;
        doDates(dateCounter);
        function doDates(dateIndex) {
            const date = dataByDates[dateIndex];
            console.log('Processing date ' + date.key);
            regions=[];
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
                region.code = region.codice_regione;
                region.total = region.totale_casi;
                region.r=radius(Number(region.total));
                region.lon = regions_coordinates.find(d=>d.region_name === region.denominazione_regione).lon;
                region.lat = regions_coordinates.find(d=>d.region_name === region.denominazione_regione).lat;
                const point = projection([region.lon,region.lat]);
                region.center_x = point[0];
                region.center_y = point[1];
                region.r = radius(Number(region.total));
                delete region.data;
                delete region.codice_regione;
                delete region.stato;
                delete region.long;
                delete region.totale_casi;
                delete region.totale_ospedalizzati;
                delete region.totale_positivi;
                delete region.variazione_totale_positivi;
                delete region.nuovi_positivi;
                delete region.tamponi;
                delete region.note_it;
                delete region.note_en;
                regions.push(region);
            });

            let flowers_of_today = [];
            let counter = 0;        
            function regional_flowers(index){
                flowers=[];
                links=[];
                const region = regions[index];

                console.log(region.denominazione_regione + ' - total cases: ' + region.total);
                Object.keys(categories).forEach(category=>{
                    const increment = Math.ceil(region.total/1000); // create a link every x
                    for (let i=0; i<region[category]; ++i){
                        const o = { id: region.code.toString()+''+categories_codes[category]+''+i.toString().padStart(6,"0") };
                        flowers.push(o);
                        if (i===0) {
                            for (let ii=1; ii<Number(categories_codes[category]); ++ii){
                                if (region[categories_codes_inverted[ii]] > 0) {
                                    const link = {  
                                        source: region.code.toString()+''+ii+''+'0'.toString().padStart(6,"0"),
                                        target: o.id
                                    }
                                    links.push(link);
                                }
                            }
                        }
                        else {
                            const link = {
                                source: region.code.toString()+''+categories_codes[category]+''+'0'.toString().padStart(6,"0"),
                                target: o.id
                            }
                            links.push(link);
                        }
                    }
                });
                // console.log('Amount of flowers: ' + flowers.length + '. Amount of links: ' + links.length);

                shuffle(flowers);
                console.log('First simulation');
                const r = region.r
                const regional_simulation = d3.forceSimulation(flowers)
                    .force('center', d3.forceCenter(0,0))
                    .force('links', d3.forceLink([]).id(d=>d.id).distance(0).strength(0.2).iterations(4))
                    .force('charge', d3.forceManyBody().strength(-0.03))
                    .force('collision', d3.forceCollide(0.35).strength(1))
                    .force('x', d3.forceX())
                    .force('y', d3.forceY())
                    .on('tick',()=>{
                        flowers.forEach((d,i)=>{
                            const r2 = Math.hypot(d.x,d.y);
                            if (r2>r){
                                // let sine = d.y/r2;
                                let cosi = d.x/r2;
                                let tangent = d.y/d.x;
                                let angle2 = Math.atan(tangent);
                                let newX = Math.cos(angle2)*r;
                                let newY = Math.sin(angle2)*r;
                                if (cosi<0){
                                newX*=-1;
                                newY*=-1;
                                }
                                d.x = newX;
                                d.y = newY;
                            }
                        })
                    })
                    .alpha(region.total>0?1:0)
                    .alphaDecay(0.05)
                    .on('end',()=>{
                        console.log('Second simulation');
                        flowers.forEach(f=>{
                            f.bunches_x = region.x + f.x;
                            f.bunches_y = region.y + f.y;
                        })
                        regional_simulation.force('links').links(links);
                        regional_simulation.alpha(region.total>0?1:0).restart()
                            .on('end',()=>{
                                flowers.forEach(f=>{
                                    f.clusters_x = region.x + f.x;
                                    f.clusters_y = region.y + f.y;
                                });
                                console.log('ended');

                                flowers_of_today = flowers_of_today.concat(flowers);

                                counter++;
                                if (counter<regions.length){
                                    regional_flowers(counter);
                                } else {
                                    shuffle(flowers_of_today);
                                    const nestedFlowers = d3.nest()
                                        .key(d=>d.id.substring(2,3))
                                        .entries(flowers_of_today);
                                    
                                    let bands_x = 0;
                                    const cat_amount = Object.keys(categories_codes_inverted).length;
                                    for (let i=1; i<=cat_amount; ++i) {
                                        const band = nestedFlowers.find(d=>d.key===i.toString());

                                        if (band) {
                                            const percentage = band.values.length/flowers_of_today.length;
                                            const band_width = 1*percentage;
                                            bands_x += band_width;
                                            band.values.forEach(f=>{
                                                f.stripes_x = Number(bands_x + d3.randomUniform(-band_width,0)()).toFixed(3);
                                                f.stripes_y = Number(d3.randomUniform(0, 1)().toFixed(3));

                                                delete f.x;
                                                delete f.y;
                                                delete f.vx;
                                                delete f.vy;
                                                delete f.index;
                                            })
                                        }
                                    };

                                    try {
                                        let fields = Object.keys(flowers_of_today[0]);
                                        let opts = { fields, header: true };
                                        let parser = new Parser(opts);
                                        let csv = parser.parse(flowers_of_today);
                                        let daily_csv = `public/data/italy/${date.key.replace(/:/g,'-')}.csv`;
                                        fs.writeFileSync(daily_csv, csv); 
                                    } catch (err) {
                                        console.error(err);
                                    }
                                    

                                    dateCounter++
                                    if (dateCounter<dataByDates.length){
                                        doDates(dateCounter);
                                    }
                                }
                            });
                    });
            }

            console.log('Simulation is running');
            const simulation_regions = d3.forceSimulation(regions)
                .force('x', d3.forceX(d=>d.center_x).strength(0.5))
                .force('y', d3.forceY(d=>d.center_y).strength(0.5))
                .force('collision', d3.forceCollide(d=>d.r))
                .on('end',()=>{
                        console.log('Regions positioned');

                        let fields = Object.keys(regions[0]);
                        let opts = { fields, header: true };
                        let parser = new Parser(opts);
                        let csv = parser.parse(regions);
                        let fileName = `public/data/italy/${date.key.replace(/:/g,'-')}-regions.csv`;
                        fs.writeFileSync(fileName, csv);

                        regional_flowers(counter);
                })
                .alpha(1)
                .restart();
        }
    }   // request
    else {
        console.log(error, response)
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