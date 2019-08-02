'use strict'
// 生成一个随机字符串  需要安装（yarn add randomstring)
const randomstring=use("randomstring")
// 要不要求转码 需要安装（yarn add querystring)
const querystring=use("querystring")
// 使用md5加密 需要安装（yarn add crypto）
const crypto=use("crypto")
// 进入进来js转成xml的插件 需要安装（yarn add xml-js）
const convert=use("xml-js")
// 引入进来axios跨域请求 需要安装（yarn add axios）
const axios=use("axios")
// 导入进来二维码生成工具 需要安装（yarn add qrcode）
const QRCode=use("qrcode")

// 引入进来日志插件
const log4js=use("log4js")

// 编写日志文件
log4js.configure({
    appenders: { cheese: { type: 'file', filename: 'cheese.log' } },
    categories: { default: { appenders: ['cheese'], level: 'debug' } }
  });




class WepayController {
    // 生成一个随机的32位的字符串
    _nonceStr(){
        return randomstring.generate({
            length:32,
            capitalization:"uppercase"
        })
    }
    // 按照key的循序进行排序
    _sign(paramObj,key){
        // reduce是相当于遍历一下,按照key进行排序，结果赋值于一个新的数组，tempObj就是从数组里面遍历出来tempObj,
        // paramObj[key]就是value的值
        let newObj=Object.keys(paramObj).sort().reduce((tempObj,key)=>{
            tempObj[key]=paramObj[key]
            return tempObj
        },{})
        // 生成一个串，要求不让他转码
        let stringA=querystring.stringify(newObj,null,null,{
            encodeURIComponent:querystring.unescape
        })
        // 生成md5加密，digest('hex')生成的为16进制，转成大写字母toUpperCase()
        let md5Str=crypto.createHash("md5").update(`${stringA}&key=${key}`).digest('hex').toUpperCase()
            return md5Str
        }
    // 生成一个随机商户订单号
    _number(){
        var number = new Date().getTime()
        console.log(number)
        return number
    }




// 这个是生成二维码，让用户付款的
   async render({response,view}){
        // key
        const key = 'T8NHKqOfKWtqZPnQm8K77PtQtaRXluU8'
        // 公众账号ID
        const appid = 'wx100749d4612ea385'
        // 商户号
        const mch_id = '1448624302'
        // 随机字符串
        const nonce_str = this._nonceStr()
        // 商品描述
        const body = '一桶爆米花'
        // 商户订单号
        const out_trade_no = "A101010102"                      //this._number()
        // 标价金额
        const total_fee = 1
        // 通知地址
        const notify_url = 'http://lqm.zlweb.cc/wxpay/notify'
        // 交易类型
        const trade_type = 'NATIVE'
        const order = {
            appid,
            mch_id,
            nonce_str,
            body,
            out_trade_no,
            total_fee,
            notify_url,
            trade_type
          }
          const sign=this._sign(order,key)
          const prepay_order={
              xml:{
                  ...order,
                //   这样会生成一个key为sign的键值对
                  sign
              }
          }
        //   把对象转化成xml的格式
          const xml_order=convert.js2xml(prepay_order,{
              compact:true
          })
          // 统一下单
          let result=await axios.post('https://api.mch.weixin.qq.com/pay/unifiedorder',xml_order)
        //   把xml转化成对象字符串
        let resultJS=convert.xml2js(result.data,{
            compact:true,
            textKey:"value",
            cdataKey:"value"
        })
        let url=await QRCode.toDataURL(resultJS.xml.code_url.value)
            return view.render("payment",{
                // 可以使用这种方式把参数传递给要渲染的摸板
                qrcodeData:url
            })
    }
// 这个是微信让你却确定支付完成的
    notify({request,response}){
        const logger = log4js.getLogger('cheese');
        const _raw=request._raw
        // 把xml文件转化成js格式
        let resultJS=convert.xml2js(_raw,{
            compact:true,
            textKey:"value",
            cdataKey:"value"
        })
         // 按照key进行排序
        let newObj=Object.keys(resultJS.xml).reduce((tempObj,key)=>{
            tempObj[key]=resultJS.xml[key]["value"]
            return tempObj
        },{})
        let originalSign=resultJS.sign  
        delete resultJS.sign
        const selfSign=this._sign(resultJS,'T8NHKqOfKWtqZPnQm8K77PtQtaRXluU8')
        // 判断一下自己生成的sign和微信发来的sign是否相同，如果相同的话就返回给微信支付成功的消息
        if(originalSign===selfSign){
            response.header('Content-type','text/plain')
            repsonse.send('<xml><return_code><![CDATA[SUCCESS]]></return_code><return_msg><![CDATA[OK]]></return_msg></xml>')
        }else{
            response.header('Content-type','text/plain')
            repsonse.send('<xml><return_code><![CDATA[FAIL]]></return_code><return_msg><![CDATA[ERROR]]></return_msg></xml>')
        }
    }
    // 这个是查询订单状态的，准备把订单入库
    async orderquery({request,response}){
         // key
         const key = 'T8NHKqOfKWtqZPnQm8K77PtQtaRXluU8'
         // 公众账号ID
         const appid = 'wx100749d4612ea385'
         // 商户号
         const mch_id = '1448624302'
         // 随机字符串
         const nonce_str = this._nonceStr()
         // 商户订单号
         const out_trade_no = request.body.out_trade_no
         let order={
            appid,
            mch_id,
            nonce_str,
            out_trade_no
         }
        //  生成签名
        const sign=this._sign(order,key)
        const prepay_order={
            xml:{
                ...order,
                sign
            }
        }
        // 把js格式的文件转化成xml格式的文件
        const xml_order=convert.js2xml(prepay_order,{
            compact:true
        })
        
        // 统一下单的连接
        let result=await axios.post("https://api.mch.weixin.qq.com/pay/orderquery",xml_order)
        
         // 把xml文件转化成js格式
         let resultJS=convert.xml2js(result.data,{
            compact:true,
            textKey:"value",
            cdataKey:"value"
        })
         // 把对象中的数据格式转化一下，使得以后取值的时候更加方便，不做这一步也可以的
        let newObj=Object.keys(resultJS.xml).reduce((tempObj,key)=>{
            tempObj[key]=resultJS.xml[key]["value"]
            return tempObj
        },{})
        response.send(newObj)
    }
}

module.exports = WepayController
