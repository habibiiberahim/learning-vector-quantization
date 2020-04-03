'use strict'
const training = use('App/Models/Datum')
const testing = use('App/Models/Testing')

class DatumController {
  constructor(){
    
        this.user = {
            mufrodat: 0,
            tarakib: 0,
            qiroah: 0,
            kitabah: 0,
            target: '',
        }
        this.wA = {
            mufrodat: 0.5,
            tarakib: 0.5,
            qiroah: 0.5,
            kitabah: 0.5,
          }
          this.wB = {
            mufrodat: 0.5,
            tarakib: 0.5,
            qiroah: 0.5,
            kitabah: 0.5,
          }
          this.wC = {
            mufrodat: 0.5,
            tarakib: 0.5,
            qiroah: 0.5,
            kitabah: 0.5 ,
          },
          this.lr = 0.05
          this.fixLr = 0 // akan di assign denTestinggan nilai awal lr
          this.wResult = {}
          this.showTable = false
          this.loading = false
          this.isError = false
          this.message = ''
          this.dataTested = []
          this.countTrue = 0
          this.accuration = 0
    
  }
  
  async index({request, response, view}){
    await this.training()
    await this.testing()
    return view.render('home', {data: this.dataTested})
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
      const epoh = 1
      let a, b, c = null // a = kelas A, b = kelas B, c = Kelas C
      let data = await training.all()
      data = data.toJSON()
      data = this.normalization(data)
      for (let i = 0; i < epoh; i++) {
          data.forEach(item => {
              
              a = this.euclidean(this.wA, item)
              b = this.euclidean(this.wB, item)
              c = this.euclidean(this.wC, item)

              // seleksi kelas pemenang
              let minimum = Math.min(...[a, b, c])

              if (a === minimum) {
                  this.match(this.wA, item)
                  // kurangi
                  this.mismatch(this.wB, item)
                  this.mismatch(this.wC, item)
              } else if (b === minimum) {
                  
                  this.match(this.wB, item)
                  // kurangi
                  this.mismatch(this.wA, item)
                  this.mismatch(this.wC, item)
              } else {
                  
                  this.match(this.wC, item)
                  // kurangi
                  this.mismatch(this.wA, item)
                  this.mismatch(this.wB, item)
              }

              //kurangi learning rate
              this.lr = 0.1 * this.lr
          })  
      }

      //simpan bobot akhir
      this.wResult = {
          A: a,
          B: b,
          C: c
      }

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
            item.status = 'False'
          }
          this.dataTested.push(item)
        })

        this.accuration = Math.round((this.countTrue / data.length) * 100)
        console.log("Akurasi: "+this.accuration)
  }

  match(weight, item) {
      weight.mufrodat = weight.mufrodat + (this.lr * (item.mufrodat - weight.mufrodat))
      weight.tarakib = weight.tarakib + (this.lr * (item.tarakib - weight.tarakib))
      weight.qiroah = weight.qiroah + (this.lr * (item.qiroah - weight.qiroah))
      weight.kitabah = weight.kitabah + (this.lr * (item.kitabah - weight.kitabah))
  
  }

  mismatch(weight, item) {
      weight.mufrodat = weight.mufrodat - (this.lr * (item.mufrodat - weight.mufrodat))
      weight.tarakib = weight.tarakib - (this.lr * (item.tarakib - weight.tarakib))
      weight.qiroah = weight.qiroah - (this.lr * (item.qiroah - weight.qiroah))
      weight.kitabah = weight.kitabah - (this.lr * (item.kitabah - weight.kitabah))

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
     
        element.mufrodat = ((element.mufrodat - minMufrodat)/(maxMufrodat - minMufrodat))
        element.tarakib = ((element.tarakib - minTarakib) / (maxTarakib - minTarakib))
        element.qiroah = ((element.qiroah - minQiroah) / (maxQiroah - minQiroah))
        element.kitabah = ((element.kitabah - minKitabah) / (maxKitabah - minKitabah))
    });
    console.log(data)
    
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
