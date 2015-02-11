
var config = require('./config.js');
var db = require('monk')(config.dbInfo);
var sensorLib = require('node-dht-sensor');
var fs = require('fs');
var nodemailer = require('nodemailer');
var async = require('async');
var pitft = require("pitft");
var fb = pitft('/dev/fb1');
var obj = db.get('pigrometer');
var count = 0;
var timer = 0;

fb.clear();
fb.color(1,1,1);

function testObj() {
  var timestamp = new Date();
  this.time = timestamp;
  this.temp = temp;
  this.humi = humi;
  this.loc = 'top';
}

var sensor = {
  initialize: initialize(),
  read: read()  
}
 
var transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: config.piMailUn,
        pass: config.piMailPw
    }
});

function initialize() {
  this.totalReads = 0;
  return sensorLib.initialize(22, 4);
};
 
function read() {
    async.whilst( 
    function () { return count > -1 ; },
    function (callback) {
    count++;
    timer++;
    var readout = sensorLib.read();
    this.totalReads++;
    temp = parseInt(((readout.temperature.toFixed(1) * 9) / 5) + 32);
    humi = parseInt(readout.humidity.toFixed(1)) + 3;
    console.log('Temperature: ' + temp  + 'F, humidity: ' + humi + '%' + ', valid: ' + readout.isValid + ', errors: ' + readout.errors);
////////send to pitft
    fb.clear();
    fb.font("fantasy", 95);
    fb.text(0, 100, "T:" + temp + 'F', false, 0);
    fb.text(0, 200, "H:" + humi + '%', false, 0);
////////
    if(timer === 1200){
      timer = 0;
      var mailOptions = {
          from: config.piMailUn, // sender address
          to: config.piMailTo, // list of receivers
          subject: 'Humidity/Temp', // Subject line
          text: 'Humidity: ' + humi + '%' + ' Temperature: ' + temp + 'F', // plaintext body
      };
      transporter.sendMail(mailOptions, function(error, info){
        if(error){
          console.log(error);
        }else{
          console.log('Message sent: ' + info.response);
        }
      });
    };
///// Alert check
//    if(timer === 6 | 12 & humi < 60){
//      console.log("Humidity Alert");
//     var mailOptions = {
//          from: config.piMailUn, // sender address
//          to: config.piMailTo, // list of receivers
//          subject: 'Humidity Alert', // Subject line
//          text: 'Humidity has fallen below threshold ' + humi + '%', // plaintext body
//          };
//      transporter.sendMail(mailOptions, function(error, info){
//      if(error){
//      console.log(error);
//      }else{
 //      console.log('Message sent: ' + info.response);
//      }
//    }); 
//};
///updating database upon valid reading.    
   if (readout.isValid) {};
     var newObj = new testObj();
     obj.insert(newObj, function(err, testObj) {
     if(err) { console.log(err); }
       });
      //3600000
      setTimeout(callback, 3600);
    },
    function (err) {
      // 5 seconds have passed
    }
  );
  
  
  

  }

