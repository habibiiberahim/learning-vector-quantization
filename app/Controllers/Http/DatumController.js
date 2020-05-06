'use strict'
const ImportService = use('App/Services/ImportService')
const training = use('App/Models/Datum')
const testing = use('App/Models/Testing')
const Database = use("Database");

class DatumController {
  constructor() {
    this.wA = {
      mufrodat: 1.000,	
      tarakib: 0.700,	
      qiroah: 0.778,	
      kitabah: 0.833
    }
    this.wB = {
      mufrodat: 0.889,
      tarakib: 	0.700,
      qiroah: 	0.556,
      kitabah: 	0.500
    }
    this.wC = {
      mufrodat: 0.333,	
      tarakib: 0.000,
      qiroah: 	0.667	,
      kitabah: 0.500	
    },

    //
    this.decLr = 0
    this.lr = 0
    this.episilon = 0
    this.fixLr = 0

    //
    this.wResult = {}
    this.dataTested = []
    this.dataTraining = []
    this.dataTesting= []
    this.countTrue = 0
    this.countFalse = 0
    this.countAll = 0
    this.accuration = 0
    this.epoch = 0
    this.ratio = 60

    //confusion matrix variable
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

  async index({ view }) {
    return view.render('home')
  }

  async importData({request}){
    const key = request.input('ratio')
    await Database.truncate("data");
    await ImportService.ImportDataTesting()
  }


  async classification({ request, view }) {
    this.epoch = request.input('epoch')
    this.lr = request.input('alpha')
    this.decLr = request.input('decAlpha')
    this.episilon = request.input('episilon')
    const key = request.input('ratio')

    if (key == 1) {
      await this.getData(60)
    } else if (key == 2) {
      await this.getData(70)
    } else {
      await this.getData(80)
    }

    await this.training(this.dataTraining)
    await this.testing(this.dataTesting)

    return view.render('result', {
      data: this.dataTested,
      accuration: this.accuration,
      countTrue: this.countTrue,
      countFalse: this.countFalse,
      countAll: this.countAll,
    })
  }

  async dataset({ view }) { 
    let data = await training.all()
    data = data.toJSON()
    data = this.normalization(data)
    return view.render('dataset', { dataset : data})
  }
  
  async getData(index){
    let data = await training.all()
   
    data = data.toJSON()
    data = this.normalization(data)
  
    let count = (data.length * index )/100   
    data.forEach(element => {
      if(count>0){
        this.dataTraining.push(element)
        count--
      }else{
        this.dataTesting.push(element)
      }
    });
    
  }


  async training(data) {
  
    this.fixLr = this.lr
    const epoh = this.epoch
    let a, b, c = null // a = kelas A, b = kelas B, c = Kelas C
  

    for (let i = 0; i < epoh && this.lr >= this.episilon; i++) {

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

        //decrement learning rate
        this.lr = this.lr - (this.lr * this.decLr)

      })
    }

    //simpan bobot akhir
    this.wResult = {
      A: a,
      B: b,
      C: c
    }

  }

  async testing(data) {
   
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
      if (item.target === 'A') {
        if (resultTarget === "C") {
          this.Pca++;
          item.status = 'False'
        } else if (resultTarget === 'B') {
          this.Pba++;
          item.status = 'False'
        } else {
          this.Paa++
          item.status = 'True'
        }
      } else if (item.target === 'B') {
        if (resultTarget === "C") {
          this.Pcb++;
          item.status = 'False'
        } else if (resultTarget === 'A') {
          this.Pab++;
          item.status = 'False'
        } else {
          this.Pbb++
          item.status = 'True'
        }
      } else {
        if (resultTarget === "A") {
          this.Pac++;
          item.status = 'False'
        } else if (resultTarget === 'B') {
          this.Pbc++;
          item.status = 'False'
        } else {
          this.Pcc++
          item.status = 'True'
        }
      }

      this.dataTested.push(item)
    })
    this.countAll = this.Paa + this.Pab + this.Pac + this.Pbb + this.Pba + this.Pbc + this.Pcc + this.Pca + this.Pcb
    this.countTrue = this.Paa + this.Pbb + this.Pcc
    this.countFalse = +this.Pab + this.Pac + this.Pba + this.Pbc + this.Pca + this.Pcb
    this.accuration = Math.round(((this.countTrue) / (this.countAll)) * 100) 
    
  }

  match(weight, item) {
    weight.mufrodat = weight.mufrodat + (this.lr * Math.abs((item.mufrodat - weight.mufrodat)))
    weight.tarakib = weight.tarakib + (this.lr * Math.abs((item.tarakib - weight.tarakib)))
    weight.qiroah = weight.qiroah + (this.lr * Math.abs((item.qiroah - weight.qiroah)))
    weight.kitabah = weight.kitabah + (this.lr * Math.abs((item.kitabah - weight.kitabah)))


  }

  mismatch(weight, item) {
    weight.mufrodat = weight.mufrodat - (this.lr * Math.abs(item.mufrodat - weight.mufrodat))
    weight.tarakib = weight.tarakib - (this.lr * Math.abs(item.tarakib - weight.tarakib))
    weight.qiroah = weight.qiroah - (this.lr * Math.abs(item.qiroah - weight.qiroah))
    weight.kitabah = weight.kitabah - (this.lr * Math.abs(item.kitabah - weight.kitabah))
  }

  euclidean(weight, item) {
    return Math.sqrt(
      Math.pow((item.mufrodat - weight.mufrodat), 2) +
      Math.pow((item.tarakib - weight.tarakib), 2) +
      Math.pow((item.qiroah - weight.qiroah), 2) +
      Math.pow((item.kitabah - weight.kitabah), 2)
    )

  }

  normalization(data) {
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

    let minMufrodat = Math.min.apply(null, mufrodat)
    let maxMufrodat = Math.max.apply(null, mufrodat)
    let minTarakib = Math.min.apply(null, tarakib)
    let maxTarakib = Math.max.apply(null, tarakib)
    let minQiroah = Math.min.apply(null, qiroah)
    let maxQiroah = Math.max.apply(null, qiroah)
    let minKitabah = Math.min.apply(null, kitabah)
    let maxKitabah = Math.max.apply(null, kitabah)

    data.forEach(element => {
      element.mufrodat = ((element.mufrodat - minMufrodat) / (maxMufrodat - minMufrodat)).toFixed(3)
      element.tarakib = ((element.tarakib - minTarakib) / (maxTarakib - minTarakib)).toFixed(3)
      element.qiroah = ((element.qiroah - minQiroah) / (maxQiroah - minQiroah)).toFixed(3)
      element.kitabah = ((element.kitabah - minKitabah) / (maxKitabah - minKitabah)).toFixed(3)
    });
    return data
  }

}

module.exports = DatumController
