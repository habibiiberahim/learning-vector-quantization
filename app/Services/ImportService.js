'use strict'
const Excel = require('exceljs')
const Training = use('App/Models/Datum')
const Testing = use('App/Models/Testing')

class ImportService{
    static async ImportDataTraining(count) {
        var workbook = new Excel.Workbook()
    
        workbook = await workbook.xlsx.readFile('public/data.xlsx')
    
        let explanation = workbook.getWorksheet('Data Latih '+count) // get sheet name
        let colComment = explanation.getColumn('A')//column name
      
        colComment.eachCell( async (cell, rowNumber) => {
          
          if(rowNumber > 1){
            let mufrodat = explanation.getCell('A' + rowNumber).value 
            let tarakib = explanation.getCell('B' + rowNumber).value
            let qiroah = explanation.getCell('C' + rowNumber).value
            let kitabah = explanation.getCell('D' + rowNumber).value
            let target = explanation.getCell('E' + rowNumber).value
          
            //custom field name in database to variable
            let inputTraining = {
              mufrodat: mufrodat,
              tarakib: tarakib,
              qiroah:qiroah,
              kitabah: kitabah,
              target:target
            }
    
            let resTraining = await Training.create(inputTraining)
            // console.log('Training', resTraining.toJSON())
          }
        })
    }

    static async ImportDataTesting(count) {
      var workbook = new Excel.Workbook()
  
      workbook = await workbook.xlsx.readFile('public/data.xlsx')
  
      let explanation = workbook.getWorksheet('Data Uji '+count) // get sheet name
      let colComment = explanation.getColumn('A')//column name
    
      colComment.eachCell( async (cell, rowNumber) => {
        
        if(rowNumber > 1){
          let mufrodat = explanation.getCell('A' + rowNumber).value 
          let tarakib = explanation.getCell('B' + rowNumber).value
          let qiroah = explanation.getCell('C' + rowNumber).value
          let kitabah = explanation.getCell('D' + rowNumber).value
          let target = explanation.getCell('E' + rowNumber).value
        
          //custom field name in database to variable
          let inputTesting = {
            mufrodat: mufrodat,
            tarakib: tarakib,
            qiroah:qiroah,
            kitabah: kitabah,
            target:target
          }
  
          let resTesting = await Testing.create(inputTesting)
          // console.log('Testing', resTesting.toJSON())
        }
      })
  }

}    
module.exports = ImportService
