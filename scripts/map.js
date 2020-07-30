require([
    "esri/Map",
    "esri/views/SceneView",
    "esri/layers/FeatureLayer",
    "esri/widgets/Legend",
    "esri/renderers/SimpleRenderer",
    "esri/views/MapView",
    'esri/layers/VectorTileLayer'

], function(Map, SceneView, FeatureLayer, Legend, SimpleRenderer, MapView, VectorTileLayer) {




    let vectLayer = new VectorTileLayer({
        url: './styles/root.json'
    });
    let codeViolations = new FeatureLayer({
        url: 'https://services.arcgis.com/uDTUpUPbk8X8mXwl/arcgis/rest/services/code/FeatureServer',
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
            }]

        }
        // Set the renderer on the layer
    var parcelsLayer = new FeatureLayer({
        url: "https://services.arcgis.com/uDTUpUPbk8X8mXwl/arcgis/rest/services/parcel_data_april_2018_shp/FeatureServer",
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

    var map = new Map({
        //basemap: "gray-vector",
        //basemap: vectLayer,
        ground: "world-elevation",

    });
    map.add(codeViolations);
    map.add(buildingsLayer);
    map.add(parcelsLayer);
    map.add(vectLayer);
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
    view.ui.add(legend, "bottom-right");

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
});