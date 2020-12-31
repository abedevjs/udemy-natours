//Ini cara utk menempel map di frontend yg data nya diambil dari backend
export const displayMap = (locations) => {
    mapboxgl.accessToken = 'pk.eyJ1IjoiYWJlOTgwNCIsImEiOiJja2oxeXVydTA1MWt1MnlxanBoOXB3YXBwIn0.pX1EYOR2L9Pnxo75ganPoA';
    
    var map = new mapboxgl.Map({//all these properties here belongs to mapbox website
        container: 'map',
        style: 'mapbox://styles/abe9804/ckj205160a59d19qk7m0oehp8',
        scrollZoom: false,//biar ga bisa otomatis zoom in map klo page lg di scroll down/up
        // center: [-118.113491, 34.111745],
        // zoom: 10,
        // interactive: false//map nya ga bisa di apa2kan jd seperti image aj
    });

    const bounds = new mapboxgl.LngLatBounds();//the area that will be displayed on the map
        //kita punya akses new mapboxgl krn sdh di include di tour.pug
        //LngLat map like mongo define longitude first then latitude

    locations.forEach(loc => {//loop through our location 
        //Create Marker
        const el = document.createElement('div');
        el.className = 'marker';

        new mapboxgl.Marker({//Add marker inside mapbox
            element: el,
            anchor:'bottom'//bottom of the pin/marker which is going to be located at the exact GPS location
        }).setLngLat(loc.coordinates).addTo(map);//this tells the mapbox where our coordinates and adds it to var map

        //Add popup informations on locations
        new mapboxgl.Popup({//we pass the options right on the popup
            offset: 30//30px biar ga nutupin marker nya
        })
            .setLngLat(loc.coordinates)
            .setHTML(`<p>Day ${loc.day}: ${loc.description} </p>`)
            .addTo(map);

        //Extend map bounds to include current locations
        bounds.extend(loc.coordinates);
    });

    map.fitBounds(bounds, {//Tell map to fit our location based on coordinates we specified
        padding: {//biar zoom nya ga terlalu in, jd di style
            top: 200,//all in pixel(px)
            bottom: 150,
            left: 200,
            right: 200
        }
    })
};


