'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class TestingSchema extends Schema {
  up () {
    this.create('testings', (table) => {
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
    this.drop('testings')
  }
}

module.exports = TestingSchema
