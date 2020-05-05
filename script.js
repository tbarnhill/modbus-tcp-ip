module.exports = {
    device:ModbusTcp,
    makeDataPacket:makeDataPacket
}

function ModbusTcp(ipAddress,port,unitId){
    let net = require('net')
    this.client = new net.Socket()
    this.client.setEncoding('hex')
    this.ipAddress = ipAddress
    this.port = port
    this.unitId = unitId
    this.log = true
    let lastTid = 1
    this.online = false
    this.timeout = 10000
    this.packetBufferLength = 100
    this.packets = []

    if(!unitId){this.unitId=1}


    this.sendTCP=(data,callback)=>{
        if(this.log==true){console.log('tx '+data)}
        let buffer = Buffer.from(data, "hex")
        if(this.client.writable){this.client.write(buffer)}
        else{this.connect(()=>{this.client.write(buffer)})}
    }
    this.client.on('data',(res)=>{
        if(this.log==true){console.log('rx '+ res)}

        let modbusRes = parseResponse(res)
        let value = modbusRes.value
        let tid = modbusRes.tid
    
      
        let err = null
        this.packets[tid].rx = modbusRes
        this.packets[tid].rx.hex = res
        if(this.packets[tid].onResponce){
            this.packets[tid].onResponce(err,value)
        } 
        
    })
    this.client.on('close',()=>{
        this.online=false
    })
    this.client.on('connect',()=>{
        this.online=true
    })
    this.read = (address,callback)=>{
        let funcCode = getFuncCode(address,'read')
        let tid = getTid()

        address = address.substr(3)

        let hexString = makeDataPacket(tid,0,1,funcCode,address,1)

        let packet = {}
        packet.onResponce = callback
        packet.tx = {}
        packet.tx.funcCode = funcCode
        packet.tx.tid = tid
        packet.tx.address = address
        packet.tx.hex = hexString
        packet.rx = null
        this.packets[tid] = packet

        
        this.sendTCP(hexString,callback)
    }
    this.write = (address,value,callback)=>{
        let funcCode = getFuncCode(address,'write')
        let tid = getTid()
        address = address.substr(3)

        if (funcCode==5&&value==true){value = 65280} // To force a coil on you send FF00 not 0001

        let hexString = makeDataPacket(tid,0,this.unitId,funcCode,address,value)

        let packet = {}
        packet.onResponce = callback
        packet.tx = {}
        packet.tx.funcCode = funcCode
        packet.tx.tid = tid
        packet.tx.address = address
        packet.tx.hex = hexString
        packet.rx = null
        this.packets[tid] = packet
      
        
  
        this.sendTCP(hexString,callback)
    }
    this.connect=(callback)=>{
        
        this.client.connect(this.port, this.ipAddress, ()=> {
            if(callback){callback()}
        })

    }
    
    function getFuncCode(address,readOrWrite){
        let dataType = address.substr(0,3)
    
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
    
    let getTid=()=>{
        if(lastTid>this.packetBufferLength){lastTid=0}
        return lastTid++
    }
   
}

function makeDataPacket(transId,protoId,unitId,funcCode,address,data){
    

    address = address -1
    let length = 6 

    unitId = decToHex(unitId)
    transId = decToHex(transId)
    protoId = decToHex(protoId)
    funcCode = decToHex(funcCode)
    address = decToHex(address)
    length = decToHex(length)
    data = decToHex(data)

    unitId = makeHexConstantSize(unitId,2)
    transId = makeHexConstantSize(transId,4)
    protoId = makeHexConstantSize(protoId,4)
    funcCode = makeHexConstantSize(funcCode,2)
    address = makeHexConstantSize(address,4)
    length = makeHexConstantSize(length,4)
    data = makeHexConstantSize(data,4)

    function makeHexConstantSize(data,outputCharCount){
        //Note 2 hex chars = 1 byte
        let inputCharCount = data.length
        let charsToAdd = outputCharCount - inputCharCount
        if(charsToAdd<0){
            throw "input hex char count for '"+ data +"' is greater then the output"
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
function parseResponse(buf){
    buf = buf.toString()
    let tid = buf.substr(0,4)
    let protocallId = buf.substr(4,4)
    let length = buf.substr(8,4)
    length = parseInt(length,16)

    let unitId = buf.substr(12,2)
    let funcCode = buf.substr(14,2)
    let byteCount = buf.substr(16,2)
    byteCount = parseInt(byteCount,16)
    let value = buf.substr(12+(length*2)-(byteCount*2),byteCount*2)


  

    tid = parseInt(tid,16)
    protocallId = parseInt(protocallId,16)
   
    unitId = parseInt(unitId,16)
    funcCode = parseInt(funcCode,16)
    
    value = parseInt(value,16)


    let rtn =  {
        tid:tid,
        protocallId:protocallId,
        length:length,
        unitId:unitId,
        funcCode:funcCode,
        byteCount:byteCount,
        value:value
    }

    return rtn
}
