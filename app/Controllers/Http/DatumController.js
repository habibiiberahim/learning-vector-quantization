'use strict'
const ImportService = use('App/Services/ImportService')
const training      = use('App/Models/Datum')
const testing       = use('App/Models/Testing')
const Database      = use("Database");

class DatumController {
  constructor(){
    
        this.user = {
         
        }
        this.wA = {
            mufrodat:  0.8125,
            tarakib: 0.76923,
            qiroah:  1,
            kitabah: 0.6666,
          }
          this.wB = {
            mufrodat: 0.5,
            tarakib: 0.69230,
            qiroah:  0.6,
            kitabah: 0.6666,
          }
          this.wC = {
            mufrodat:  0.4375	,
            tarakib: 0.15384,
            qiroah:  0.5,
            kitabah: 0.3333 ,
          },
          this.decLr = 0.35
          this.lr = 0.5
          this.episilon = 0.0001
          this.fixLr = 0 // akan di assign denTestinggan nilai awal lr
          this.wResult = {}
          this.showTable = false
          this.loading = false
          this.isError = false
          this.message = ''
          this.dataTested = []
          this.countTrue = 0
          this.countFalse = 0
          this.countAll = 0 
          this.accuration = 0
          this.epoch = 0
    
  }

  async importData(key){
    await Database.truncate("data");
    await Database.truncate("testings");
    if(key == 1){
      await ImportService.ImportDataTraining(25)
      await ImportService.ImportDataTesting(75)
     }else if(key == 2){
      await ImportService.ImportDataTraining(50)
      await ImportService.ImportDataTesting(50)
     }else{
      await ImportService.ImportDataTraining(75)
      await ImportService.ImportDataTesting(25)
     }
  }
  
  async index({request, response, view}){
    return view.render('home')
  }

  async classification({request, response, view}){
    this.epoch = request.input('epoch')
    this.lr = request.input('alpha')
    this.decLr = request.input('decAlpha')
    this.episilon =  request.input('episilon')
    await this.importData(request.input('ratio'))
    await this.training()
    await this.testing()
    return view.render('result', {
      data: this.dataTested,
      accuration: this.accuration,
      countTrue:this.countTrue,
      countFalse:this.countFalse,
      countAll:this.countAll,
    })
  }

  async dataTraining({request, response, view}){
    let dataTraining = await training.all()
    dataTraining = dataTraining.toJSON()
    dataTraining = this.normalization(dataTraining)
    return view.render('training', {data: dataTraining})
  }

  async dataTesting({request, response, view}){
    let dataTesting = await testing.all()
    dataTesting = dataTesting.toJSON()

    dataTesting = this.normalization(dataTesting)
    return view.render('testing', {data: dataTesting})
  }

  async training(){
      this.fixLr = this.lr
      const epoh = this.epoch
      let a, b, c = null // a = kelas A, b = kelas B, c = Kelas C
      let data = await training.all()
      data = data.toJSON()
      data = this.normalization(data)
      console.log('epoch', this.epoch)
      console.log('Alpha', this.lr)
      console.log('decAlpha',this.decLr)
      console.log('eps', this.episilon)
      for (let i = 0; i < epoh; i++) {
          data.forEach(item => {
              
              a = this.euclidean(this.wA, item)
              b = this.euclidean(this.wB, item)
              c = this.euclidean(this.wC, item)

              let minimum = Math.min(...[a, b, c])
              
              if (a === minimum) {
                 if (item.target === 'A') {
                  this.match(this.wA, item)
                 } else {
                  this.mismatch(this.wA, item)
                 }
              } else if (b === minimum) {
                if (item.target === 'B') {
                  this.match(this.wB, item)
                 } else {
                  this.mismatch(this.wB, item)
                 }
              } else {
                if (item.target === 'C') {
                  this.match(this.wC, item)
                 } else {
                  this.mismatch(this.wC, item)
                 }
                
              }

              //kurangi learning rate
              this.lr = this.lr - (this.lr * this.decLr)
              
          })  
      }

      //simpan bobot akhir
      this.wResult = {
          A: a,
          B: b,
          C: c
      }
      console.log(this.wResult)

    }

  async testing(){
      let data = await testing.all()
      data = data.toJSON()
      data = this.normalization(data)
      data.forEach(item => {
          let a, b, c = 0
          a = this.euclidean(this.wA, item)
          b = this.euclidean(this.wB, item)
          c = this.euclidean(this.wC, item)

          // seleksi kelas pemenang
          let minimum = Math.min(...[a, b, c])
          let resultTarget = null
          if (a === minimum) {
            resultTarget = 'A'
          } else if (b === minimum) {
            resultTarget = 'B'
          } else if (c === minimum) {
            resultTarget = 'C'
          }

          item.resultTarget = resultTarget
          
          if (item.target === resultTarget) {
            item.status = 'True'
            this.countTrue++;
          } else {
            this.countFalse++;
            item.status = 'False'
          }
          this.dataTested.push(item)
        })
        this.countAll = data.length
        this.accuration = Math.round((this.countTrue / data.length) * 100)
        console.log("Akurasi: "+this.accuration)
  }

  match(weight, item) {
      weight.mufrodat = weight.mufrodat + (this.lr * Math.abs((item.mufrodat - weight.mufrodat)))
      weight.tarakib = weight.tarakib + (this.lr * Math.abs((item.tarakib - weight.tarakib)))
      weight.qiroah = weight.qiroah + (this.lr * Math.abs((item.qiroah - weight.qiroah)))
      weight.kitabah = weight.kitabah + (this.lr * Math.abs((item.kitabah - weight.kitabah)))
      // console.log("match: "+item.target)
      // console.log("1: "+weight.mufrodat)
      // console.log("2: "+weight.tarakib)
      // console.log("3: "+weight.qiroah)
      // console.log("4: "+weight.kitabah)
  
  }

  mismatch(weight, item) {
      weight.mufrodat = weight.mufrodat - (this.lr * Math.abs(item.mufrodat - weight.mufrodat))
      weight.tarakib = weight.tarakib - (this.lr * Math.abs(item.tarakib - weight.tarakib))
      weight.qiroah = weight.qiroah - (this.lr * Math.abs(item.qiroah - weight.qiroah))
      weight.kitabah = weight.kitabah - (this.lr * Math.abs(item.kitabah - weight.kitabah))
      // console.log("missmatch: "+item.target)
      // console.log("1 = "+weight.mufrodat )
      // console.log("2 ="+weight.tarakib)
      // console.log("3 ="+weight.qiroah)
      // console.log("4 ="+weight.kitabah)

  }

  euclidean (weight, item) {
      return Math.sqrt(
        Math.pow((item.mufrodat - weight.mufrodat), 2) +
        Math.pow((item.tarakib - weight.tarakib), 2) +
        Math.pow((item.qiroah - weight.qiroah), 2) +
        Math.pow((item.kitabah - weight.kitabah), 2) 
      )
      
  }

  reset() {
      this.user = {
        mufrodat: 0,
        tarakib: 0,
        qiroah: 0,
        kitabah: 0,
      }

      this.showTable = false
      this.isError = false
      this.loading = true
  }

  normalization(data){

    let mufrodat = []
    let tarakib = []
    let qiroah = []
    let kitabah = []

    let temp = data

    temp.forEach(element => {
        mufrodat.push(element.mufrodat)
        tarakib.push(element.tarakib)
        qiroah.push(element.qiroah)
        kitabah.push(element.kitabah)
    });

    let minMufrodat = Math.min.apply(null,mufrodat)
    let maxMufrodat = Math.max.apply(null,mufrodat)
    let minTarakib = Math.min.apply(null,tarakib)
    let maxTarakib = Math.max.apply(null,tarakib)
    let minQiroah = Math.min.apply(null,qiroah)
    let maxQiroah = Math.max.apply(null,qiroah)
    let minKitabah = Math.min.apply(null,kitabah)
    let maxKitabah = Math.max.apply(null,kitabah)

    data.forEach(element => {
     
        // element.mufrodat = Math.round((element.mufrodat - minMufrodat)/(maxMufrodat - minMufrodat))
        // element.tarakib =  Math.round((element.tarakib - minTarakib) / (maxTarakib - minTarakib))
        // element.qiroah =  Math.round((element.qiroah - minQiroah) / (maxQiroah - minQiroah))
        // element.kitabah =  Math.round((element.kitabah - minKitabah) / (maxKitabah - minKitabah))

        element.mufrodat = (element.mufrodat - minMufrodat)/(maxMufrodat - minMufrodat)
        element.tarakib =  (element.tarakib - minTarakib) / (maxTarakib - minTarakib)
        element.qiroah =  (element.qiroah - minQiroah) / (maxQiroah - minQiroah)
        element.kitabah =  (element.kitabah - minKitabah) / (maxKitabah - minKitabah)
    });
    return data
  }

  reset() {
      this.user = {
        x1: 0,
        x2: 0,
        x3: 0,
        x4: 0,
      }

      this.showTable = false
      this.isError = false
      this.loading = true
  }
}

module.exports = DatumController
