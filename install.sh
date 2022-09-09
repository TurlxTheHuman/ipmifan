
#dependencies
sudo apt-get install nodejs npm

#install dir
mkdir /etc/ipmifan
mv ipmifan.js /etc/ipmifan/ipmifan.js
mv config.json /etc/ipmifan/config.json
cd /etc/ipmifan && npm i commander

cat <<EOF > /etc/systemd/system/ipmifan.service
[Unit]
Description=IPMIFan Javascript Fan Controller

[Service]
Type=simple
ExecStart=node /etc/ipmifan/ipmifan.js

[Install]
WantedBy=multi-user.target
EOF

systemctl start ipmifan.service
systemctl daemon-reload
systemctl enable ipmifan.service

cd..