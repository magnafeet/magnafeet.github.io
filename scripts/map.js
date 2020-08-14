require([
    "esri/Map",
    "esri/views/SceneView",
    "esri/layers/FeatureLayer",
    "esri/widgets/Legend",
    "esri/renderers/SimpleRenderer",
    "esri/views/MapView",
    'esri/layers/VectorTileLayer'

], function(Map, SceneView, FeatureLayer, Legend, SimpleRenderer, MapView, VectorTileLayer) {


    let lyrs = document.querySelector('#layers')

    const lyrItem = document.querySelector('template')

    function addLyrToggle(layer) {
        lyrName = layer.title;
        let container = document.createElement('div');
        let vis = layer.visible ? 'checked' : null;
        console.log(vis)
        container.innerHTML =
            `
        <input type = 'checkbox' ${vis} id = ${lyrName} name = ${lyrName}>
        <label for = '${lyrName}'>${lyrName}</label>
        `
        lyrs.append(container);
        container.addEventListener('change', (event) => {
            layer.visible = event.target.checked;
        })
        if (lyrName == 'Instantaneous position of cars (sample day)') {
            let info = document.querySelector('#info')
            container.addEventListener('change', (event) => {
                if (event.target.checked) { info.style.display = 'block'; } else {
                    info.style.display = 'none';
                }
            })

        }
    }



    let vectLayer = new VectorTileLayer({
        url: './styles/root.json'
    });

    let codeViolations = new FeatureLayer({
        url: 'https://services.arcgis.com/uDTUpUPbk8X8mXwl/arcgis/rest/services/code/FeatureServer',
        title: 'Building Code Violations',
        renderer: {
            type: 'simple',
            symbol: {
                type: 'simple-marker',
                size: 3,
                color: [0, 255, 255],
                opacity: 0.5,
                outline: null
            }
        },
        popupTemplate: {
            title: 'Code Violations',
            type: 'fields',
            fieldInfos: [{
                fieldName: 'property_a',
                label: 'Address'
            }, {
                fieldName: 'violatio_1',
                label: 'Violation'
            }]
        },
        elevationInfo: { mode: "relativeToGround", offset: 200, unit: 'foot' },
    })
    let buildingRenderer = {
        type: "simple",
        //field: "Total_Cost",
        symbol: {
            type: "polygon-3d", // autocasts as new PolygonSymbol3D()
            symbolLayers: [{
                type: "extrude", // autocasts as new ExtrudeSymbol3DLayer()
                /*material: {
                    color: '#8c92ac'
                },*/
                edges: {
                    type: "solid",
                    color: [50, 50, 50, 0.5],
                    size: .5
                }
            }]
        },

        visualVariables: [{
            legendOptions: { 'title': 'Total Cost of Electricity (Yearly)' },
            type: "size",
            field: "MEAN_Z", //Currently only computed for western half of Onondaga County.
            //valueUnit: "px" // Converts and extrudes all data values in feet
            valueUnit: "feet",
            valueExpression: `IIf($feature.MEAN_Z>0, $feature.MEAN_Z, 24)` //This is actually kind of bullshit, so I'll fix it when we have heights for the whole county.
        }, {
            type: 'color',
            field: 'Total_Cost',
            stops: [{
                    value: 0,
                    color: '#c9f2f0',
                    opacity: 0.2
                },
                {
                    value: 30000000,
                    color: '#af9af5',
                    opacity: 0.2
                }
            ]
        }]
    };

    var parcelRenderer = {
            type: "simple", // autocasts as new UniqueValueRenderer()
            symbol: {
                type: "simple-fill", // autocasts as new PolygonSymbol3D()
                outline: { width: 0 }
            },
            visualVariables: [{
                    type: "color",
                    legendOptions: { 'title': 'Assessed Value' },
                    field: "AssessedVa",
                    //valueUnit: "px" // Converts and extrudes all data values in feet
                    stops: [{
                            value: 0,
                            color: "#e8e7c5",
                            opacity: 0.2
                        },
                        {
                            value: 1000000,
                            color: "#ff8575",
                            opacity: 0.2
                        }
                    ]
                },
                {
                    type: "opacity",
                    field: "Shape_Are",
                    legendOptions: { 'showLegend': false },
                    // maps data values to opacity values
                    stops: [
                        { value: 0, opacity: 0.1 },
                        { value: 1400000, opacity: 0.5 }
                    ]
                }
            ]

        }
        // Set the renderer on the layer
    var parcelsLayer = new FeatureLayer({
        url: "https://services.arcgis.com/uDTUpUPbk8X8mXwl/arcgis/rest/services/parcel_data_april_2018_shp/FeatureServer",
        title: 'Tax Parcels',
        renderer: parcelRenderer,
        elevationInfo: "on-the-ground",
        popupTemplate: {
            title: 'Property Value',
            content: [{
                type: 'fields',
                fieldInfos: [{
                    fieldName: "AssessedVa",
                    label: "Assessed Value of lot"
                }]
            }],
        }
    });

    var buildingsLayer = new FeatureLayer({
        url: "https://services.arcgis.com/uDTUpUPbk8X8mXwl/arcgis/rest/services/buildings_energy/FeatureServer",
        title: 'Buildings',
        renderer: buildingRenderer,
        elevationInfo: "on-the-ground",
        popupTemplate: {
            // autocasts as new PopupTemplate()
            title: "{LandUse} in {CLASS}",
            content: [{
                type: "fields",
                fieldInfos: [{
                        fieldName: "FullName",
                        label: "Address"
                    }, {
                        fieldName: "CLASS",
                        label: "Energy classification"
                    }, {
                        fieldName: 'KWH',
                        label: 'Kilowatt-hour of energy per square foot'
                    }, { fieldName: 'Total_Ener', label: 'Total energy consumed (kwh)' },
                    { fieldName: 'DpK', label: 'Dollars per kilowatt-hour' },
                    { fieldName: 'Total_Cost', label: 'Estimated expense of energy in USD' }
                ]
            }]
        }


    });
    var spendLayer = new FeatureLayer({
        url: "https://services.arcgis.com/uDTUpUPbk8X8mXwl/arcgis/rest/services/spending/FeatureServer",
        title: 'Yearly Spending Index (Electricity)',
        renderer: {
            type: "simple", // autocasts as new UniqueValueRenderer()
            symbol: {
                type: "simple-fill", // autocasts as new PolygonSymbol3D()
                outline: { width: 0 }
            },
            visualVariables: [{
                type: "color",
                field: "X3063_I",
                legendOptions: { 'title': 'Electricity index' },
                //valueUnit: "px" // Converts and extrudes all data values in feet
                stops: [{
                        value: 0,
                        color: "#e8e7c5",
                        opacity: 0.1
                    },
                    {
                        value: 100,
                        color: "#ff8575",
                        opacity: 0.1
                    }
                ]
            }, {
                type: "opacity",
                field: "X3063_I",
                legendOptions: { 'showLegend': false },
                // maps data values to opacity values
                stops: [
                    { value: 0, opacity: 0.1 },
                    { value: 100, opacity: 0.5 }
                ]
            }]

        },
        elevationInfo: "on-the-ground",
        popupTemplate: {
            // autocasts as new PopupTemplate()
            title: "Spending by Census Tract",
            content: [{
                type: "fields",
                fieldInfos: [{
                        fieldName: "TOTHH_CY",
                        label: "Total Households"
                    },
                    {
                        fieldName: "TOTPOP_CY",
                        label: "TOtal Population"
                    }, {
                        fieldName: "X3063_I",
                        label: "Elecricity Index"
                    },
                    {
                        fieldName: "X3063_A",
                        label: "Elecricity Average"
                    }, {
                        fieldName: "X1002_I",
                        label: "Food Index"
                    },
                    {
                        fieldName: "X1002_A",
                        label: "Food Average"
                    }
                ]
            }]
        },
        visible: true

    });

    var carLayer = new FeatureLayer({
        url: "https://services.arcgis.com/uDTUpUPbk8X8mXwl/arcgis/rest/services/car_count_air_pollution/FeatureServer",
        title: 'Instantaneous position of cars (sample day)',
        renderer: {
            type: 'simple',
            symbol: {
                type: 'simple-marker',
                size: 3,
                color: [255, 0, 255],
                opacity: 0.2,
                outline: null
            }
        },
        elevationInfo: { mode: "relativeToGround", offset: 5, unit: 'foot' },
        visible: false

    });


    var map = new Map({
        //basemap: "gray-vector",
        //basemap: vectLayer,
        ground: "world-elevation",

    });
    map.add(vectLayer)
    let layerList = [codeViolations, buildingsLayer, parcelsLayer, carLayer, spendLayer];
    map.addMany(layerList)
    layerList.forEach(el => addLyrToggle(el))

    //map.add(parcelsLayer);
    let OnondagaExtent = {}
    let viewIn = new SceneView({
        container: "viewDiv",
        map: map,
        viewingMode: 'local',
        camera: {
            position: {

                x: -76.1314379, //long
                y: 43.037945, //lat
                z: 20000,

            },
            heading: 0,
            tilt: 15
        }
    });

    const properties = [
        "focused",
        "interacting",
        "updating",
        "resolution",
        "scale",
        "zoom",
        "stationary",
        'camera.position.x',
        'camera.position.y',
        'camera.position.latitude',
        'camera.position.longitude',
        "camera.position.z",
        "camera.tilt",
        "camera.heading",
        'SceneView.center',
        'center'
    ];
    const events = [
        "pointer-enter",
        "pointer-leave",
        "pointer-move",
        "pointer-down",
        "pointer-up",
        "immediate-click",
        "click",
        "immediate-double-click",
        "double-click",
        "mouse-wheel",
        "drag",
        "hold",
        "key-down",
        "key-up",
        "focus",
        "blur",
        "resize"
    ];

    function createTables() {
        const eventsTable = document.getElementById("events");
        let content = eventsTable.innerHTML;
        for (let i = 0; i < events.length; i++) {
            content += '<div class="event" id="' + events[i] + '">' + events[i];
            content += "</div>";
        }
        eventsTable.innerHTML = content;
        const propertiesTable = document.getElementById("properties");
        content = propertiesTable.innerHTML;
        for (let i = 0; i < properties.length; i++) {
            content +=
                '<div class="property" id="' +
                properties[i] +
                '">' +
                properties[i] +
                " = </div>";
        }
        propertiesTable.innerHTML = content;
    }

    function setupEventListener(view, name) {
        const eventRow = document.getElementById(name);
        view.on(name, function(value) {
            eventRow.className = "event active";
            if (eventRow.highlightTimeout) {
                clearTimeout(eventRow.highlightTimeout);
            }
            eventRow.highlightTimeout = setTimeout(function() {
                // after a timeout of one second disable the highlight
                eventRow.className = "event inactive";
            }, 1000);
        });
    }

    function setupPropertiesListener(view, name) {
        const propertiesRow = document.getElementById(name);
        view.watch(name, function(value) {
            propertiesRow.className = "property active";
            propertiesRow.innerHTML = propertiesRow.innerHTML.substring(
                0,
                propertiesRow.innerHTML.indexOf(" = ")
            );
            // set the text to the received value
            const formattedValue =
                typeof value === "number" ? value.toFixed(4) : value;
            propertiesRow.innerHTML += " = " + formattedValue.toString();
            if (propertiesRow.highlightTimeout) {
                clearTimeout(propertiesRow.highlightTimeout);
            }
            propertiesRow.highlightTimeout = setTimeout(function() {
                // after a timeout of one second disable the highlight
                propertiesRow.className = "property inactive";
            }, 1000);
        });
    }

    // create the tables for the events and properties
    createTables();

    // Setup all view events defined in the array
    for (let i = 0; i < events.length; i++) {
        setupEventListener(viewIn, events[i]);
    }
    // Setup all watch properties defined in the array
    for (let i = 0; i < properties.length; i++) {
        setupPropertiesListener(viewIn, properties[i])
    };

    /*let viewOut = new SceneView({
        container: 'viewDiv',
        map: map,

    })*/
    //In:properties: scale = 873.1921, zoom = 19.9380, z:338.5404, tilt:0, heading:298.8023


    let moveIn = document.querySelector('#closeIn')
    moveIn.addEventListener('click', () => changeScale(1));
    console.log(moveIn);
    //document.querySelector('#scroll-through').addEventListener('mouseenter', () => console.log('aks;lf'))
    let moveOut = document.querySelector('#closeOut')
        .addEventListener('click', () => changeScale(0))
        //view.watch('camera', updateIndicator)
    let nope = document.querySelector('#nope')
        .addEventListener('click', () => changeScale(-1));

    let one = document.querySelector('#one').addEventListener('mouseenter', () => {
        changeScale(1);
        console.log('entered')
    });

    document.querySelector('#two')
        .addEventListener('mouseenter', () => changeScale(0));
    document.querySelector('#three')
        .addEventListener('mouseenter', () => changeScale(-1));

    function rotateView(direction) {
        console.log('rotating')
        let heading = viewIn.camera.heading;
        if (direction > 0) {
            heading = Math.floor((heading + 1e-3) / 90) * 90 + 90;
            console.log(heading)
        } else {
            heading = Math.ceil((heading - 1e-3) / 90) * 90 - 90;
            console.log(heading)
        }

        viewIn.goTo({ heading: heading }).catch(err => {
            if (err.name != 'AbortError') { console.errror(err) }
        });
    }

    function changeScale(param) {
        let view = viewIn;
        if (param === 1) {
            let cam = { position: [-76.1442, 43.0409, 832.9322], scale: 800, tilt: 0, heading: 0 }
            view.goTo(cam);
            view.clippingArea = {
                xmin: -8476500.6652,
                ymax: 5318489.9631,
                xmax: -8476129.8733,
                ymin: 5318109.2994,
                spatialReference: {
                    // autocasts as new SpatialReference()
                    wkid: 3857
                }
            }

        } else if (param === 0) {
            let cam = { position: [-76.1754, 43.0694, 20625.8040], tilt: 0, heading: 0 };
            view.goTo(cam);
            view.clippingArea = {
                xmin: -8483236.8664,
                ymax: 5332964.1233,
                xmax: -8476129.8733,
                ymin: 5314748.6160,
                spatialReference: {
                    // autocasts as new SpatialReference()
                    wkid: 3857
                }
            }
        } else if (param === -1) {
            view.clippingArea = null;
        }
    }
    var legend = new Legend({
        container: document.querySelector('div#key'),
        type: 'classic',
        view: viewIn,
        layout: 'side-by-side'
    });
    //viewIn.ui.add(legend, "bottom-right"); 
    //Source of sync err
    /*let collapsibles = document.querySelectorAll('button.collapsible');
    //collapsibles.forEach(el => console.log(el))
    console.log(collapsibles)
    collapsibles.forEach((el) => {
        el.addEventListener("click", function(event) {
            let sibling = event.target.nextSibling
            sibling = sibling.nextSibling
            console.log(sibling.style.visibility)
            if (sibling.style.visibility == 'visible') {
                sibling.setAttribute('style', 'visibility: hidden;')
            } else {
                sibling.style.visibility = 'visible'
            }
        });
    })*/
    document.querySelector('#events-toggle').addEventListener('change', function(event) {
        let evts = document.querySelectorAll('.event');
        let chk = event.target.checked;
        if (!chk) {
            evts.forEach((el) => el.style.display = 'none')

        } else {
            evts.forEach((el) => el.style.display = 'block')
        }

    });
    document.querySelector('#props-toggle').addEventListener('change', function(event) {
        let evts = document.querySelectorAll('.property');
        let chk = event.target.checked;
        if (!chk) {
            evts.forEach((el) => el.style.display = 'none')

        } else {
            evts.forEach((el) => el.style.display = 'block')
        }

    });
});