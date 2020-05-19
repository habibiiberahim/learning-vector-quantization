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


Route.get('/', 'DatumController.index').as('data.index')
Route.get('/test', 'DatumController.test').as('data.test')
Route.get('single', 'DatumController.single').as('data.single')
Route.get('classification', 'DatumController.classification').as('data.classification')
Route.get('dataset', 'DatumController.dataset').as('data.set')
Route.get('import', 'DatumController.importData').as('data.import')
