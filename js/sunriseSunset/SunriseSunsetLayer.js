// Copyright (c) 2012 Antonio Esquer (ae@char95.com)
// http://char95.com
// Dual licensed under the MIT and GPL licenses.
// http://opensource.org/licenses/mit-license.php
// https://gnu.org/licenses/gpl.html


var SunriseSunsetLayer = (function(){


	"use strict";


	// PRIVATE -----------------------------------------------------------------
	var
    MINUTES_TO_HOURS = 1/60,
    SECONDS_TO_HOURS = 1/3600,
    HOURS_TO_GRADS = 360/24,
    DEFINITION = 100;


	// CONSTRUCTOR -------------------------------------------------------------
	var SunriseSunsetLayer = function (map,api) {
        
        this.autoUpdate = false;
        this.map = map;
        this.api = api;
        this.dayLight = [];
        this.dayLightInterval = undefined;
        this.eFunction = { draw:this.draw.bind(this) };

        
		this.all = [
			new google.maps.LatLng( 90 , 0  ),
			new google.maps.LatLng( 90 , 180  ),
			new google.maps.LatLng( -90 ,180  ),
			new google.maps.LatLng( -90 , 0  ),
			new google.maps.LatLng( -90 , -180  ),
			new google.maps.LatLng( 90 , -180  ),
		];

		
        this.calculateLightAreaCoordinates();
    }
    

    // PROTOTYPE ---------------------------------------------------------------
    SunriseSunsetLayer.prototype = {

        destroy:function(){
            this.update(false);
            if(this.shadow) this.shadow.setMap(null);
            this.shadow = null;
            this.map = null;
            this.dayLight = null;
            this.eFunction = null;
        },
    
        getMapZoom:function(){
            switch(this.api) {
                case 'GOOGLE':					
                    return this.map.getZoom();
                    break;
            }
            return 1;
        },
    
        update:function(active){
        
            if(active!==false){

                var
                mapZoom = this.getMapZoom(),
                dt = parseInt(1000*(0.5+(10/mapZoom)));

                this.autoUpdate = true;
                this.timeout = setTimeout(this.eFunction.draw,dt);

            } else {

                this.autoUpdate = false;
                clearTimeout(this.timeout);

            }            
        },

        calculateLightAreaCoordinates:function() {
        
            var
            now = new Date(),
            
            y = now.getFullYear(),
            m = now.getMonth()+1,
            d = now.getDate(),
            
            hUtc = now.getUTCHours(),
            mUtc = now.getUTCMinutes(),
            sUtc = now.getUTCSeconds(),
        
            offset = hUtc+(mUtc*MINUTES_TO_HOURS)+(sUtc*SECONDS_TO_HOURS),
            location = new SunriseSunset( y , m , d , 0 , 0 ),
            
            dLat = 0.5,
            lMax = 90,
            lMin = -90;
        
            // GET NORTH LATITUDE LIMIT
            while (lMax>-90)
                {
                var location = new SunriseSunset( y , m , d , lMax -= dLat , 0 );
                if(!(isNaN(location.sunriseUtcHours()) || isNaN(location.sunsetUtcHours()))) break;
                }
        
            // GET SOUTH LATITUDE LIMIT
            while (lMin<90)
                {
                var location = new SunriseSunset( y , m , d , lMin += dLat , 0 );
                if(!(isNaN(location.sunriseUtcHours()) || isNaN(location.sunsetUtcHours()))) break;
                }
        
            dLat = (lMax-lMin)/DEFINITION;
        
            var sunrise = [];
            var sunset = [];
            var gapN = [];
            var gapS = [];
            var l = lMin;
        
            for (var n=0;n<DEFINITION;n++){
            
                var location = new SunriseSunset( y , m , d , l , 0 );
        
                this.dayLight[n] = { l:l , sunrise:location.sunriseUtcHours()*HOURS_TO_GRADS , sunset:location.sunsetUtcHours()*HOURS_TO_GRADS };
                l += dLat;
            }
        
        
            // SHADOW DRAW OR GAP DRAW
            //	(2012.08.25)		(2012.09.25)	summer in europe
            //	MODE A				MODE B			MODE C
            //	NORMAL				NORMAL			REVERT
            //
            //	 a,b,c				8,5,2			a,b,c
            //	   x			  xxxxxxxxx		      x
            //	  xxx			     xxx             xxx
            //	  xxx 			     xxx			 xxx
            //	   x			      x		 	  xxxxxxxxx
            //
            var
			lNorth = new SunriseSunset( y , m , d , lMax , 0 ),
            lEquator = new SunriseSunset( y , m , d , 0 , 0 ),
            lSouth = new SunriseSunset( y , m , d , lMin , 0 );
            
			this.shadowAlone = true;

			var
			dln = lNorth.sunsetUtcHours() - lNorth.sunriseUtcHours(),
			dle = lEquator.sunsetUtcHours() - lEquator.sunriseUtcHours(),
			dls = lSouth.sunsetUtcHours() - lSouth.sunriseUtcHours();
			
			// reverse drawing
			if(lNorth.sunriseUtcHours()<lEquator.sunriseUtcHours() && lEquator.sunriseUtcHours()<lSouth.sunriseUtcHours()) this.shadowAlone = false;
        },

        draw:function() {

			// 2014.03.23 < error -- day is where night is...
		
            var
            now = new Date(),
            hUtc = now.getUTCHours(),
            mUtc = now.getUTCMinutes(),
            sUtc = now.getUTCSeconds(),
            offset = (hUtc+(mUtc*MINUTES_TO_HOURS)+(sUtc*SECONDS_TO_HOURS))*HOURS_TO_GRADS,
            n = DEFINITION,
            dn = n-1,
            shadow = [];

            while (n--){
                shadow[dn-n] = new google.maps.LatLng( this.dayLight[n].l , this.dayLight[n].sunrise - offset );
                shadow[dn+n] = new google.maps.LatLng( this.dayLight[n].l , this.dayLight[n].sunset  - offset );
            }
 
            // DRAW SUN SHADOW
            if (this.shadow)
                {
                var options = { paths: this.shadowAlone?[shadow]:[this.all,shadow] }
				this.shadow.setOptions(options);
                }
            else
                {
                this.shadow = new google.maps.Polygon({zIndex:10 , paths:this.shadowAlone?[shadow]:[this.all,shadow] ,strokeWeight:0 , fillColor:"#000000" , fillOpacity:0.35 , geodesic:true });
				this.shadow.myData = this;
                this.shadow.setMap(this.map);
                
				
				// todo >>> triger movement events in the map !!!!!!!!
                //with (this) google.maps.event.addListener( shadow , 'mousemove' , function(e) { mouseMove(e); });
                }

            // UPDATE
            this.update(this.autoUpdate);
        }

    }
	
	
	return SunriseSunsetLayer;

}());