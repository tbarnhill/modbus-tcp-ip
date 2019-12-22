# modbus-tcp-ip
A simple interface for Modbus over TCP/IP

#### Applicable Datatypes
``` text
Data Type                  Short Hand   Size        Accessibility     
Descrite Input             i_b          1 Bit       Read Only
Coil                       q_b          1 Bit       Read / Write
Input Register             i_w          16 Bits     Read Only
Holding Register           q_w          16 Bits     Read / Write
```

##### Read and Write
``` javascript
const modbus = require('modbus-tcp-ip')

//Multiple Devises can be added
const deviceA = new modbus('192.168.0.1',502)
const deviceB = new modbus('192.168.0.2',502)

//Read descrite input at address 1
deviceA.read('i_b1',(err,res)=>{
        if(err){throw err}
        console.log(res)
})

//Write Coil at address 1 
deviceA.write('q_b1',true,(err,res)=>{
        if(err){throw err}
        console.log(res)
})
```

###### If you wish to handle the TCP yourself 
``` javascript

let transId     = 0
let protoId     = 0
let unitId      = 1
let funcCode    = 5
let address     = 0
let data        = 0xFF00
let dataPacket = device.makeDataPacket(transId,protoId,unitId,funcCode,address,data)

let net = require('net')
let client = new net.Socket()
client.setEncoding('utf8')

client.connect(502, '192.168.0.001', ()=> {
          client.write(dataPacket)
})

client.on('data',(res,err)=>{
        let hex = Buffer.from(res).toString('hex') //Converts response to hexadecimal string
        console.log('rx '+hex)
})
```