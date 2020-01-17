# modbus-tcp-ip
A simple interface for Modbus over TCP/IP



##### Read and Write
``` javascript
const modbus = require('modbus-tcp-ip')

//Multiple devices can be added
const deviceA = new modbus.device('192.168.0.1',502)
const deviceB = new modbus.device('192.168.0.2',502)

//Read discrete input at address 1
deviceA.read('i_b1',(err,res)=>{
        if(err){throw err}
        console.log(res)
})

//Write a coil at address 412
deviceA.write('q_b412',true,(err,res)=>{
        if(err){throw err}
        console.log(res)
})

//Read holding register 1
deviceA.read('q_w1',(err,res)=>{
        if(err){throw err}
        console.log(res)
})

```
#### Address Syntax
``` text
Short Hand+Register Number
i.e 
'i_b8'    - Descrite Input 8
'q_w418'  - Holding register 418 
```
#### Applicable Datatypes
``` text
Data Type                  Short Hand   Size        Accessibility     
Descrite Input             i_b          1 Bit       Read Only
Coil                       q_b          1 Bit       Read / Write
Input Register             i_w          16 Bits     Read Only
Holding Register           q_w          16 Bits     Read / Write

"i" indicates the register is read only (Descrite Inputs and Input Registers)
"q" indicates the register is read/write (Coils and Holding Registers)
"b" indicates the register is 1 bit (Coils and Descrite Inputs)
"w" indicates the register is 16 bit/1 word (Input and Holding Registers)


```
