/*
ipmifan made by @tur_lx on Instagram

This is a fairly simple script that controls server fans based off a pre-determined fan curve.
This is great for small homelabs that may be in a room you dont want a ton of noise in, like a bedroom

future plans if for this script to calculate the speed the fan should be when the temperature is inbetween two values

you need to have ipmitool installed on your machine
apt-get install ipmitool

Enable Manual Fan Control:
ipmitool raw 0x30 0x30 0x01 0x00

Disable Manual Fan Control:
ipmitool raw 0x30 0x30 0x01 0x01

*/


const config = require("./config.json");
const { exec } = require("child_process");
const { stdout } = require("process");
var quiet_mode_force_on = ''
var debug_mode = false
quiet_mode_force_on = config["activation-settings"]["quiet-mode-force-on"]

//ENABLES MANUAL FAN CONTROL
exec("ipmitool raw 0x30 0x30 0x01 0x00")


//EXTERNAL ARGUMENTS
const commander = require('commander'); // Handles External Arguments
const { urlToHttpOptions } = require("url");
commander
  .version('1.0.0', '-v, --version')
  .usage('[OPTIONS]...')
  .option('-m, --manual <value>', 'Sets A Static Fan Speed')
  .option('-q, --quiet', 'Forces To Use Quiet Mode Fan Curve')
  .option('-d, --debug', 'Displays Current Fan Speed and System Temperature')
  .parse(process.argv);
  const options = commander.opts();

if (options.manual) {
    return fanspeed(options.manual)
}

if (options.quiet) {
    quiet_mode_force_on = true
    console.log(quiet_mode_force_on)
}

if (options.debug) {
    debug_mode = true
}



//some information from config
const quiet_start = config["activation-settings"]["time-start"];
const quiet_end = config["activation-settings"]["time-end"];
const quiet_start_seconds = quiet_start.split(":")[0] * 3600 + quiet_end.split(":")[1] * 60;
const quiet_end_seconds = quiet_end.split(":")[0] * 3600 + quiet_end.split(":")[1] * 60;
const twentyfour_hour = "860000"
var temp = "";
var fan_speed = "";
closest_fan_speed = 20;
var current_time = "";
var sensor_temperature_command = "";
//import fan curve temp data
const quiet_temp = []
const normal_temp = []
const curvearray = []
const quietcurvearray = []

for (var i = 0; i < config.fancurves.Quiet.length; i++) {
    quiet_temp.push(config.fancurves.Quiet[i].temp)
}

for (var i = 0; i < config.fancurves.Normal.length; i++) {
    normal_temp.push(config.fancurves.Normal[i].temp)
}

// get/check temperature metric
if (config["temp-metric"] == "f") {
    sensor_temperature_command = `sensors -f | awk '/^Core /{++r; gsub(/[^[:digit:]]+/, "", $3); s+=$3} END{print s/(10*r)}'`
} else if (config["temp-metric"] == "c") {
    sensor_temperature_command = `sensors | awk '/^Core /{++r; gsub(/[^[:digit:]]+/, "", $3); s+=$3} END{print s/(10*r)}'`
} else {
    console.log("Config Error: Temp Metric Error (c/f)")
}

//gets temperature and changes fan speed based on config setting
function checkloop() {
    var quiet_time_activation = 0;
    const time = new Date();
    current_time = time.getHours() + ':' + ('0' + time.getMinutes()).slice(-2);
    current_time_seconds = current_time.split(":")[0] * 3600 + current_time.split(":")[1] * 60;
    // if time activation is enables and within set time
    //this time check is quite flawed but works within the hours I want it to be activated within probably could do it another way
    if (config["activation-settings"]["quiet-mode-time-activation"] == true) {
        if (current_time_seconds >= quiet_start_seconds && twentyfour_hour >= current_time_seconds || current_time_seconds <= quiet_end_seconds && current_time_seconds < twentyfour_hour) {
            quiet_time_activation = 1
        } else {
            quiet_time_activation = 0
        }
    }
    exec(sensor_temperature_command, (error, stdout) => {
        temp = stdout
    })

    if (quiet_time_activation == "1" | quiet_mode_force_on == true) {
        //enable quiet fan curve | grab fan curve values
        const closest = quiet_temp.reduce((prev, curr) => {
            return (Math.abs(curr - temp) < Math.abs(prev - temp) ? curr : prev);
        });

        for (var i = 0; i < config.fancurves.Quiet.length; i++) {
            quietcurvearray.push(config.fancurves.Quiet[i])

            if (config.fancurves.Quiet[i].temp == closest) {
                closest_fan_speed = config.fancurves.Quiet[i].fan
            }
        }

        if (closest_fan_speed != fan_speed) {
            fanspeed(closest_fan_speed)
        } else {
            if (debug_mode == true) {
                return console.log(`Quiet Mode: | Speed: ${fan_speed} | TEMP: ${temp}`)
            }
        }

    } else {
        //enable normal fan curve | grab fan curve values
        const closest = normal_temp.reduce((prev, curr) => {
            return (Math.abs(curr - temp) < Math.abs(prev - temp) ? curr : prev);
        });

        for (var i = 0; i < config.fancurves.Normal.length; i++) {
            curvearray.push(config.fancurves.Normal[i])
            if (config.fancurves.Normal[i].temp == closest) {
                closest_fan_speed = config.fancurves.Normal[i].fan
            }
        }

        if (closest_fan_speed != fan_speed) {
            fanspeed(closest_fan_speed)
        } else {
            if (debug_mode == true) {
                return console.log(`Normal Mode: | Speed: ${fan_speed} | TEMP: ${temp}`)
            }
        }
    }
}

//change fan speed
function fanspeed(percentage) {
    var percentage_hex = ((percentage) >>> 0).toString(16);
    exec(`ipmitool raw 0x30 0x30 0x02 0xff 0x${percentage_hex}`, (error, stdout) => {
        fan_speed = percentage;
        if (error) {
            console.log(`error: ${error.message}`);
            return;
        }
        if (debug_mode == true) {
            return console.log(`New Fan Speed: | Speed: ${fan_speed} | TEMP: ${temp}`)
        }
    });
}

async function loop() {
    checkloop()
    setTimeout(loop, config["temp-scrape-interval"]);
}
loop()


//process.on('exit', code => {
//    exec("ipmitool raw 0x30 0x30 0x01 0x01") //Turns Off Manual Fan
//  });
