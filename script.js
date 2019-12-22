/**
    *Discrete Input     i_b       1 Bit     Read Only
    *Coil               q_b       1 Bit     Read / Write
    *Input Register     i_w      16 Bits    Read Only
    *Holding Register   q_w      16 Bits    Read / Write
 */

module.exports = ModbusTcp()

function ModbusTcp(ipAddress,port){
    let net = require('net')
    this.client = new net.Socket()
    this.client.setEncoding('utf8')
    this.ipAddress = ipAddress
    this.port = port
    this.log = true

    this.sendTCP=(data,callback)=>{
        if(this.log==true){console.log('tx '+data).toString('hex')}
        let buffer = Buffer.from(data, "hex")
        if(this.isOpen()){this.client.write(buffer)}
        else{this.connect(()=>{this.client.write(buffer)})}

        
        
         this.client.on('data',(res,err)=>{
                let hex = Buffer.from(res).toString('hex') //convert response to hexadecimal 
                if(this.log==true){console.log('rx '+hex)}
                if(callback){callback(err,res)}  
         })
         this.client.on('close',(err)=>{   
                err = 'Connection Closed'
                if(callback){callback(err,null)}
         })
    }
    let getFuncCode=(address,readOrWrite)=>{

        let functionCode
        if(readOrWrite=='read'){
            if(dataType=='i_b'){functionCode=2}
            if(dataType=='q_b'){functionCode=1}
            if(dataType=='i_w'){functionCode=4}
            if(dataType=='q_w'){functionCode=3}
        }
        else if(readOrWrite=='write'){
            if(dataType=='i_w'||dataType=='i_b'){throw 'you cannot write to a read only register'}
            if(dataType=='q_w'){functionCode=6}
            if(dataType=='q_b'){functionCode=5}
        }
        else{
            throw "parameter 1 must be 'read' or 'write'"
        }

     
        return functionCode
      
    
    }

    this.read = (address,callback)=>{
        let funcCode = getFuncCode(address,readOrWrite)
        address = address.substr(3)
        let hexString = this.makeDataPacket(1,0,1,funcCode,address,0)

        this.sendTCP(hexString,0,(err,res)=>{
            if(callback){callback(err,res)}
        })
    }
    this.write = (address,value,callback)=>{
        let funcCode = getFuncCode(address,readOrWrite)
        address = address.substr(3)

        if (funcCode==5&&value==true){value = 65280} // To force a coil on you send FF00 not 0001

        let hexString = this.makeDataPacket(1,0,1,funcCode,address,value)

        this.sendTCP(hexString,(err,res)=>{
            if(err){throw err}
            if(callback){callback(err,res)}
        })
    }
    this.send=(functionCode,address,data,callback)=>{
        

        let hexString = this.makeDataPacket(1,0,1,functionCode,address,data)
        
        if(this.log==true){console.log('tx '+hexString)}
        sendTCP(hexString,(res)=>{
            let hex = Buffer.from(res).toString('hex') //convert response to hexadecimal 
            if(this.log==true){console.log('rx '+hex)}
            if(callback){callback()}
        })
       

       
    }
    this.connect=(callback)=>{
        this.client.connect(this.port, this.ipAddress, (err)=> {
            if(err){throw err}
            if(callback){callback()}
        })
    }
    this.isOpen=()=>{
        return this.client.writable
    }
    this.makeDataPacket=(transId,protoId,unitId,funcCode,address,data)=>{
        address = address -1
    
        unitId = decToHex(unitId)
        transId = decToHex(transId)
        protoId = decToHex(protoId)
        funcCode = decToHex(funcCode)
        address = decToHex(address)
        data = decToHex(data)
    
        unitId = makeHexConstantSize(unitId,2)
        transId = makeHexConstantSize(transId,4)
        protoId = makeHexConstantSize(protoId,4)
        funcCode = makeHexConstantSize(funcCode,2)
        address = makeHexConstantSize(address,4)
        data = makeHexConstantSize(data,4)
    
        let length = '0006'
    
        function makeHexConstantSize(data,outputCharCount){
            //Note 2 hex chars = 1 byte
            let inputCharCount = data.length
            let charsToAdd = outputCharCount - inputCharCount
            if(charsToAdd<0){
                throw 'input hex char count is greater then the output'
            }
          
            let adder = ''
            for(let i=0;i<charsToAdd;i++){adder+='0'}
            return adder+data
        }
        function decToHex(c){
            let rtn 
           
            rtn = Math.abs(c).toString(16)
           
    
            return rtn
        }
        
    
        return transId + protoId + length + unitId + funcCode + address + data
    
    }

}

