# ipmifan
IPMIFan is an ipmi based fan controller written in NodeJS
Explaination/Summary:

ipmifan is a fan controller that uses ipmitool to manually set fan speeds
this is ran on the machine you want to control



I created this for my __poweredge r410__ this script should work for most poweredge servers however I am not too sure about anything else, but you are welcome to test that. This is good to set pre-determined fan curves based on what you want and not the preset ones that come with the machine.

A feature that I added for me was a __Quiet Mode__ a seperate fan curve that can be time activated, good for when a server in in your bedroom



Installation:
------------
```
apt-get install ipmitool nodejs npm screen git -y
git https://github.com/TurlxTheHuman/ipmifan/
cd ./ipmifan/

#Enable Manual Fan Control:
ipmitool raw 0x30 0x30 0x01 0x00

#Disable Manual Fan Control:
#ipmitool raw 0x30 0x30 0x01 0x01

```

Running
------------
This was made on a debian based machine, not tested on other operating systems but it still should work relatively the same

You can run it in the same terminal
> node ipmifan.js 

if you want it to be running despite closing ssh terminal
> screen -S ipmifan node ipmifan.js


TODO
--------------
- Will be workin on a docker container and some other things to make this work as best as possible and make it startup when machine starts up
- Make read all data using ipmitool so you can have script read and control multiple nodes
