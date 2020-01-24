let meters = require('../model/parkingMeters');
let tickets = require('../model/parkingTickets');
let ax = require('axios');
let streetInfo = [];
let countInfo = [];
let xrMap = new Map();
let counter = 0;
const googleMaps = require('@google/maps').createClient({
    key: 'AIzaSyBwKIOT2BqfVZ4MlygirFkvuRBoQ7wbdmM'
});

var test = '';


  function findStreet(input, callback) {
      var latlng = input.split(',', 2);
      var newlat = latlng[1] + ',' + latlng[0];
    googleMaps.reverseGeocode({
      latlng: newlat,
      result_type: 'street_address',
    }, function(err, response) {
      if (!err) {
        var streetName = response.json.results[0].address_components[1].short_name;
        var streetNum = streetNum = response.json.results[0].address_components[0].short_name;
        streetNum = streetNum.replace(/\D/g,'');
        if(streetNum.includes("-")) {
            let splitNum = streetNum.split("-");
            streetNum = splitNum[0];
        }
        var roundedStreetNum = Math.floor(streetNum / 100) * 100;
        // console.log(streetName + "/" + roundedStreetNum);
        var meterStreetBlock = streetName + "/" + roundedStreetNum;
        // console.log(streetName);
        
        callback(meterStreetBlock);
        // var xrMap = new Map();
        //  console.log(xrMap);
        // if(!xrMap.has(meterStreetBlock)) {
        //     xrMap.set(meterStreetBlock, 1);
        // } else {
        //     let numMeters = xrMap.get(meterStreetBlock);
        //     numMeters++;
        //     xrMap.set(meterStreetBlock, numMeters);
        //     // console.log("I am running", xrMap.get(meterStreetBlock) + 1);
        // }
      }
    });
    // console.log(xrMap);
  }


function alldone(ticketMap){
    console.log("all done");
    // console.log(xrMap[0].key);
    //console.log(ticketMap);

    
    
}
///////////////////////////
// function fetchMeters(ticketMap) {
    

//     ax.get('https://opendata.vancouver.ca/api/v2/catalog/datasets/parking-meters/exports/json?rows=4000&pretty=false&timezone=UTC')
//     .then(function (response) {
//         // xrMap.set('test', 2);
//         response.data.forEach(function(location){
//             var coordinates = location.geom.geometry.coordinates;
//             // xrMap.set('test', 2);
//             var testResult;
//             findStreet(coordinates.toString(),function(result){
//                 counter++;
//                 // console.log(ticketMap);
//                 // if(ticketMap.has(result)) {
//                 //     var meterCount = ticketMap.get(result).count;
//                 //     meterCount++;
//                 //     ticketMap.get(result).count = meterCount;
//                 //     // console.log(ticketMap.get(result).count);
//                 //     // console.log(ticketMap.get(result));
//                 // }
//                 // console.log(counter);
//                 // console.log("S*"+result);
//                  //console.log(xrMap);
//                 // if(!xrMap.has(result)) {
//                 //     xrMap.set(result, 1);
//                 // } else {
//                 //     let numMeters = xrMap.get(result);
//                 //     numMeters++;
//                 //     xrMap.set(result, numMeters);
//                 //     // console.log("I am running", xrMap.get(meterStreetBlock) + 1);
//                 // }       
//                 if(counter == 4000){
//                     alldone(ticketMap);
//                 }
//             });         
//         });
        
//         // console.log(xrMap);
//     })
//     .catch(function (error) {
//         console.log(error);
//     });
//     // function logMapElements(values) {
//     //     console.log(values);
//     // }
//     // ticketMap.forEach(logMapElements);
    
//     // console.log("please help");
// }


exports.getTable = (req,res) => {
    // fetchMeters();
    let information = meters.check();
    let ticket = tickets.parkingTickets();
    if(meters.getEnd() == undefined){
    /*This is where we fetch the ticket information and start method chaining from the returned 
    promise object.*/
    ax.get('https://opendata.vancouver.ca/api/v2/catalog/datasets/parking-tickets-2017-2019/exports/json?rows=4000&pretty=false&timezone=UTC')
        .then(function (response) {
            //This is the "big" map that contains Street/Block : Year
            //Ex: HOWE ST/800 =>    2017 =>     03 =>       31 =>       2
            //                     (year)     (month)      (day)  (# tickets)
            let ticketMap = new Map();

            //This forEach loop iterates over all of the tickets and maps them.
            response.data.forEach(function (ticket) {
                let ticketStreet = ticket.street;
                let ticketBlock = ticket.block;
                //identifier that will be compared to the parking meter identifier
                //Ex HOWE ST/800
                let streetBlock = "" + ticketStreet + "/" + ticketBlock;
                // ticket date is being split into y/m/d to create progressively more granular objects
                let ticketDate = ticket.entrydate;
                let splitDate = ticketDate.split("-");
                let ticketYear = splitDate[0];
                let ticketMonth = splitDate[1];
                let ticketDay = splitDate[2];
                /*The ticket object is broken down into Year.Month.Day{ticketCount}
                in order to make it easy to progressively add records down the road
                Example: {year: {2018, month: {03, day: {03, 01}}}}
                dateCount is the number of tickets on a particular day. It is 
                initalized to one.*/
                var ticketObject = {
                    year: {
                        ticketYear,
                        month: {
                            ticketMonth,
                            day: {
                                ticketDay,
                                dateCount: 1
                            }
                        }
                    }
                };

                /*This conditional statement begins by asking:
                "Does the map contain this ticket record's streetBlock? (ex HOWE/800)" 
                If not, the conditional adds the whole record to the ticketMap.*/
                if (!ticketMap.has(streetBlock)) {
                    let dayMap = new Map();
                    dayMap.set(ticketDay, ticketObject.year.month.day.dateCount);
                    let monthMap = new Map();
                    monthMap.set(ticketMonth, dayMap);
                    let yearMap = new Map();
                    yearMap.set(ticketYear, monthMap);
                    ticketMap.set(streetBlock, {yearMap, count: 0});
                    /*If a match for the streetBlock is found, then it asks: 
                    "does the map contain a match for this ticket record's year of 
                    infraction?"
                    If not, the conditional adds the record starting at the year to the ticketMap.
                    The year is the key for the rest of the record (month, day, ticket count)*/
                } else {
                    // console.log(ticketMap.get(streetBlock).yearMap.has(ticketYear));
                    if (!ticketMap.get(streetBlock).yearMap.has(ticketYear)) {
                        let dayMap = new Map();
                        dayMap.set(ticketDay, ticketObject.year.month.day.dateCount);
                        let monthMap = new Map();
                        monthMap.set(ticketMonth, dayMap);
                        // console.log(ticketMap.get(streetBlock));
                        ticketMap.get(streetBlock).yearMap.set(ticketYear, monthMap);
                        /*If a match for the year is found, it asks whether a match for the
                        ticket record's month has been found. If not, it adds the ticket
                        record to the map starting at the month. The month is a key
                        for the rest of the record. */
                    } else {
                        if (!ticketMap.get(streetBlock).yearMap.get(ticketYear).has(ticketMonth)) {
                            let dayMap = new Map();
                            dayMap.set(ticketDay, ticketObject.year.month.day.dateCount);
                            ticketMap.get(streetBlock).yearMap.get(ticketYear).set(ticketMonth, dayMap);
                            /*If a match for the month is found, the conditional asks
                            whether a match for the day is found. If not, it adds
                            the ticket record starting at the day to the month map. The day 
                            is the key to the ticket count for that day.*/
                        } else {
                            if (!ticketMap.get(streetBlock).yearMap.get(ticketYear).get(ticketMonth).has(ticketDay)) {
                                ticketMap.get(streetBlock).yearMap.get(ticketYear).get(ticketMonth).set(ticketDay, ticketObject.year.month.day.dateCount);
                                /*At this point, the ticket record matches another ticket record exactly,
                                meaning that the streetBlock, year, month, and date are the same. So,
                                we increment the ticketcount for this day in this street/block. */
                            } else {
                                let ticketCount = ticketMap.get(streetBlock).yearMap.get(ticketYear).get(ticketMonth).get(ticketDay);
                                ticketCount++;
                                ticketMap.get(streetBlock).yearMap.get(ticketYear).get(ticketMonth).set(ticketDay, ticketCount);
                            }
                        }
                    }
                }
                
                });

                function logMapElements(values) {
                    //console.log(values);
                }
                
                meters.setMap(ticketMap);
                ticketMap.forEach(display);
            // function logMapElements(values) {
            //     console.log(values);
            // }
            // fetchMeters(ticketMap);
            //ticketMap.forEach(logMapElements);
            //console.log(ticketMap);
            
            
            function display(values, key){
                if(values.yearMap.has('2019')){
                    if(values.yearMap.get('2019').has('01')){
                        
                            streetInfo.push(key);
                            //console.log("information ");
                            // console.log(values.yearMap.get('2019').get('01').get('26'));
                            let count = 0;
                            values.yearMap.get('2019').get('01').forEach(function(values){
                                //console.log(values);
                                count += values;
                            });
                            countInfo.push(count);
                            //console.log("total count is " + count);
                            //values.yearMap.get('2019').get('01').get('26');
                        
                        // console.log(key);
                        // values.yearMap.get('2019').get('01').forEach(displayCount);
                        //console.log(values.yearMap.get('2019').get('01'));
                    }
                    
                }
                
                // if(values.has('2019')){
                //     console.log('keyvalue' + values + ' ' + key);
                    
                // }
                
            }
            function displayCount(values){
                console.log(values);
                return "values";
            }
            
            
            var allInfo = [];
            
            for(let x = 0; x < streetInfo.length; x++){
                
                // let street = streetInfo[x];
                // allInfo.push(street);
                var street = {street_name : streetInfo[x], amount : countInfo[x]};
                
                allInfo.push(street);
            }
            res.render('index', {
                // street: information,
                // ticket: ticket
                street: allInfo
            });
        })
        .catch(function (error) {
            console.log(error);
        });
    }
    else{
        console.log('output is not undefined');
        res.render('index',{
            street: information
        })
    }

    
    // information.then(([rows, fieldData])=>{
    //     res.render('index', {street:rows});

    // });

}

function testing() {
    let information = ['one', 'two', 'three', 'four'];
    meters.setLocations(information);

}
exports.setRange = (req, res) => {
    let dateStart = req.body.dateStart;
    let dateEnd = req.body.dateEnd;
    console.log("body start and end date is");
    console.log(dateStart);
    console.log(dateEnd);
    meters.setTime(dateEnd, dateStart);
    //let information = meters.getLocations(dateStart, dateEnd);
    //console.log(information[0]);
    res.redirect(301, '/');
}