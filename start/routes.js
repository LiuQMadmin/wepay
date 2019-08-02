'use strict'

/*
|--------------------------------------------------------------------------
| Routes
|--------------------------------------------------------------------------
|
| Http routes are entry points to your web application. You can create
| routes for different URL's and bind Controller actions to them.
|
| A complete guide on routing is available here.
| http://adonisjs.com/docs/4.1/routing
|
*/

/** @type {typeof import('@adonisjs/framework/src/Route/Manager')} */
const Route = use('Route')

Route.on('/').render('welcome')
// 微信返回sign的路由
Route.post("wxpay/notify","WepayController.notify")
// 查询订单的路由
Route.post("orderquery","WepayController.orderquery")


// 
Route.get("/order",({view})=>{
    return view.render("order")
})


// 支付的路由
Route.get("/checkout","WepayController.render")
