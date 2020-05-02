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

          this.minMufrodat = 0
          this.maxMufrodat = 0
          this.minTarakib = 0
          this.maxTarakib = 0
          this.minQiroah = 0
          this.maxQiroah = 0
          this.minKitabah = 0
          this.maxKitabah = 0

          this.Paa = 0
          this.Pab = 0
          this.Pac = 0
          this.Pba = 0
          this.Pbb = 0
          this.Pbc = 0
          this.Pca = 0
          this.Pcb = 0
          this.Pcc = 0
  }

  async importData({request, response}){
    const key = request.input('ratio')
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
     await response.redirect('/dataset')
  }
  
  async index({view}){
    return view.render('home')
  }

  async classification({request, view}){
    this.epoch = request.input('epoch')
    this.lr = request.input('alpha')
    this.decLr = request.input('decAlpha')
    this.episilon =  request.input('episilon')
   
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

  async dataset ({view}){
    let dataTraining = await training.all()
    let dataTesting = await testing.all()

    dataTraining = dataTraining.toJSON()
    dataTesting = dataTesting.toJSON()

    return view.render('dataset',{dataTraining: dataTraining, dataTesting: dataTesting})
  }


  async training(){
      this.fixLr = this.lr
      const epoh = this.epoch
      let a, b, c = null // a = kelas A, b = kelas B, c = Kelas C
      let data = await training.all()
      data = data.toJSON()
     
      this.minMax(data)
     
      data = this.normalization(data)
      
      for (let i = 0; i < epoh && this.lr >= this.episilon ; i++) {
     
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
          
          //cek prediksi kelas pemenang
          let resultTarget = null
          if (a === minimum) {
            resultTarget = 'A'
          } else if (b === minimum) {
            resultTarget = 'B'
          } else if (c === minimum) {
            resultTarget = 'C'
          }
          //simpan hasil kelas pemenang
          item.resultTarget = resultTarget

          //pengecekan kelas pemenang dengan kelas real
          if(resultTarget === 'A'){
            if (item.target === resultTarget ) {
              this.Paa++
              item.status = 'True'
            }else if(item.target === 'B'){
              this.Pab++;
              item.status = 'False'
            } else {
              this.Pac++;
              item.status = 'False'
            }
          }else if(resultTarget === 'B'){
            if (item.target === resultTarget ) {
              this.Pbb++
              item.status = 'True'
            }else if(item.target === 'C'){
              this.Pbc++;
              item.status = 'False'
            } else {
              this.Pba++;
              item.status = 'False'
            }
          }else{
            if (item.target === resultTarget ) {
              this.Pcc++
              item.status = 'True'
            }else if(item.target === 'A'){
              this.Pca++;
              item.status = 'False'
            } else {
              this.Pcb++;
              item.status = 'False'
            }
          }
          
          this.dataTested.push(item)
        })
        this.countAll = this.Paa+this.Pab+this.Pac+this.Pbb+this.Pba+this.Pbc+this.Pcc+this.Pca+this.Pcb
        this.countTrue = this.Paa+this.Pbb+this.Pcc
        this.countFalse = +this.Pab+this.Pac+this.Pba+this.Pbc+this.Pca+this.Pcb
        this.accuration = Math.round(((this.countTrue) / (this.countAll)) * 100)
        // console.log("Akurasi: "+this.accuration)
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
    data.forEach(element => {
        element.mufrodat = ((element.mufrodat - this.minMufrodat)/(this.maxMufrodat - this.minMufrodat)).toFixed(3)
        element.tarakib = ( (element.tarakib - this.minTarakib) / (this.maxTarakib - this.minTarakib)).toFixed(3)
        element.qiroah = ( (element.qiroah - this.minQiroah) / (this.maxQiroah - this.minQiroah)).toFixed(3)
        element.kitabah = ( (element.kitabah - this.minKitabah) / (this.maxKitabah - this.minKitabah)).toFixed(3)
    });
    return data
  }

  async minMax(data){
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

    this.minMufrodat = Math.min.apply(null,mufrodat)
    this.maxMufrodat = Math.max.apply(null,mufrodat)
    this.minTarakib = Math.min.apply(null,tarakib)
    this.maxTarakib = Math.max.apply(null,tarakib)
    this.minQiroah = Math.min.apply(null,qiroah)
    this.maxQiroah = Math.max.apply(null,qiroah)
    this.minKitabah = Math.min.apply(null,kitabah)
    this.maxKitabah = Math.max.apply(null,kitabah)
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
