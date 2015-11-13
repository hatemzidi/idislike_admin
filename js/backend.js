/**
 * Created with PhpStorm.
 * User: h.zidi
 * Date: 04/11/13
 * Time: 16:43
 *
 */

var swatches1 = ['#332244', '#BB3355', '#998899', '#FF5555', '#FFDD99'];
var swatches2 = ['#445555', '#889999', '#4499DD', '#DDDDDD', '#AACCCC'];
var swatches3 = ['#3366BB', '#CCCCCC', '#EEEEEE', '#DDDDEE', '#FFDD11'];
var swatches4 = ['#4D90FE', '#DD4B39', '#F1F1F1', '#777777'];
var swatches5 = ['#332244', '#5566AA', '#AA7799', '#DD9999', '#FFDD99'];

var SunriseSunsetLayer;

function getMap() {


    $('#gmap-marker').gmap({'zoom': 2, 'center': '20,0', 'disableDefaultUI': true}).bind('init', function (e, map) {
        $.getJSON('../backend/_api_map.php', function (data) {

            $.each(data, function (i, item) {
                var content = item.city === '' ? '?' : '<img src="images/blank.gif" class="flag flag-' + item.isoCode + '" /> ' + item.city;

                content += ' <i class="fa fa-thumbs-o-down"></i> ' + item.counter;

                $('#gmap-marker').gmap('addMarker', {
                    'position': new google.maps.LatLng(parseInt(item.latitude), parseInt(item.longitude)),
                    'icon': new google.maps.MarkerImage("images/markers/marker_red.png"),
                    'value': parseInt(item.counter),
                    'visible': true
                }).click(function () {
                    $('#gmap-marker').gmap('openInfoWindow', {'content': content, maxWidth: 200}, this);
                });
            });


            sunriseSunsetLayer = new SunriseSunsetLayer(map, 'GOOGLE');
            sunriseSunsetLayer.autoUpdate = true;
            sunriseSunsetLayer.draw();

        });


        // $('#map_canvas').gmap('set', 'MarkerClusterer', new MarkerClusterer(map, $(this).gmap('get', 'markers')));
    });
}


function getMapLarge() {

    var datum;

    $.getJSON('../backend/_api_map_large.php', function (data) {
        datum = data;
        google.setOnLoadCallback(drawRegionsMap)
    });

    function drawRegionsMap() {

        var data = google.visualization.arrayToDataTable(datum);

        var options = {};

        var chart = new google.visualization.GeoChart(document.getElementById('gmap-marker'));

        chart.draw(data, options);
    }

}


function getCounters() {
    if ($('#dislikes').length) {
        $.getJSON('../backend/_api_counters.php', function (stream) {
            Morris.Donut({
                element: 'dislikes',
                data: [
                    {value: stream.total, label: 'dislikes'}
                ],
                colors: swatches3,
                labelColor: '#fff',
                backgroundColor: '#1CAF9A'
            });


            Morris.Donut({
                element: 'referrers',
                data: stream.referrers,
                colors: swatches1,
                labelColor: '#fff',
                backgroundColor: '#F0AD4E'
            });


            Morris.Donut({
                element: 'origins',
                data: stream.origins,
                colors: swatches5,
                labelColor: '#fff',
                backgroundColor: '#428BCA'
            });

            /* Morris.Donut({
             element: 'browsers',
             data: stream.agent.browsers,
             colors: swatches4,
             labelColor: '#fff',
             backgroundColor: '#428BCA'
             });
             */
            Morris.Donut({
                element: 'os',
                data: stream.agent.os,
                colors: swatches2,
                labelColor: '#fff',
                backgroundColor: '#1D2939'
            });

        });
    }
}


function getStats() {
    if ($('#hourly').length) {
        $.getJSON('../backend/_api_stats.php', function (stream) {
            Morris.Bar({
                element: 'hourly',
                data: stream.hourstats,
                xkey: 'h',
                ykeys: ['v'],
                labels: ['dislikes'],
                barRatio: 0.4,
                xLabelAngle: 35,
                hideHover: 'auto'
            });

            Morris.Line({
                element: 'origins_daily',
                data: stream.origins,
                xkey: 'dh',
                ykeys: ['comment', 'chat'],
                labels: ['comments', 'chatbox'],
                parseTime: false,
                hideHover: 'auto'
            });


            Morris.Area({
                element: 'daily',
                data: stream.daystats,
                xkey: 'dh',
                ykeys: ['v'],
                parseTime: false,
                labels: ['dislikes']
            });

            Morris.Bar({
                element: 'weekly',
                data: stream.weekstats,
                xkey: 'dh',
                ykeys: ['v'],
                parseTime: false,
                labels: ['dislikes']
            });
        });
    }
}

function today() {
    $('.today.time').html(moment().format("H:mm A zz"));
    $('.today.date').html(moment().format("ddd, MMM Do"));
}

