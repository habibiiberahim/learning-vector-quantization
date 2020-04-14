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
Route.get('classification', 'DatumController.classification').as('data.classification')
Route.get('training', 'DatumController.dataTraining').as('data.training')
Route.get('testing', 'DatumController.dataTesting').as('data.testing')
Route.get('import', 'DatumController.importData').as('data.import')
