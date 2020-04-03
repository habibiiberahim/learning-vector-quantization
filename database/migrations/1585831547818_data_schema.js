'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class DataSchema extends Schema {
  up () {
    this.create('data', (table) => {
      table.increments()
      table.integer('mufrodat').nullable()
      table.integer('tarakib').nullable()
      table.integer('qiroah').nullable()
      table.integer('kitabah').nullable()
      table.string('target').nullable()
      table.timestamps()
    })
  }

  down () {
    this.drop('data')
  }
}

module.exports = DataSchema
