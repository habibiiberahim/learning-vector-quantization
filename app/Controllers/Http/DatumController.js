'use strict'
const datum = use('App/Models/Datum')
class DatumController {
  constructor(){
    this.properti = 
    {
        user: {
            mufrodat: 0,
            tarakib: 0,
            qiroah: 0,
            kitabah: 0,
          },
          wA: {
            mufrodat: 30,
            tarakib: 20,
            qiroah: 14,
            kitabah: 10,
          },
          wB: {
            mufrodat: 24,
            tarakib: 10,
            qiroah: 22,
            kitabah: 9,
          },
          wC: {
            mufrodat: 22,
            tarakib: 8,
            qiroah: 18,
            kitabah: 10,
          },
          lr: 0.01,
          fixLr: 0, // akan di assign dengan nilai awal lr
          wResult: {},
          showTable: false,
          loading: false,
          isError: false,
          message: '',
          dataTested: [],
          countTrue: 0,
          accuration: 0
    }
  }
  
  async index({request, response, view}){
    let data = await datum.all()
    data = data.toJSON()
    return view.render('training', {data: data})
  }

  async training(){
      this.fixLr = this.lr
      const epoh = 1
      let a, b, c = null // a = kelas A, b = kelas B, c = Kelas C
      let data = await datum.all()
      data = data.toJSON()
      
      for (let i = 0; i < epoh; i++) {
          data.forEach(item => {
              
              a = this.euclidean(this.properti.wA, item)
              b = this.euclidean(this.properti.wB, item)
              c = this.euclidean(this.properti.wC, item)

              // seleksi kelas pemenang
              let minimum = Math.min(...[a, b, c])

              if (a === minimum) {
                  this.match(this.properti.wA, item)
                  // kurangi
                  this.mismatch(this.properti.wB, item)
                  this.mismatch(this.properti.wC, item)
              } else if (b === minimum) {
                  
                  this.match(this.properti.wB, item)
                  // kurangi
                  this.mismatch(this.properti.wA, item)
                  this.mismatch(this.properti.wC, item)
              } else {
                  
                  this.match(this.properti.wC, item)
                  // kurangi
                  this.mismatch(this.properti.wA, item)
                  this.mismatch(this.properti.wB, item)
              }

              //kurangi learning rate
              this.properti.lr = 0.1 * this.properti.lr
          })  
      }

      //simpan bobot akhir
      this.properti.wResult = {
          a: a,
          b: b,
          c: c
      }
      this.testing()
  }

  async analyze(){
      this.reset()

      this.properti.user.mufrodat = 30
      this.properti.user.tarakib = 10
      this.properti.user.qiroah = 10
      this.properti.user.kitabah = 10

      let a, b, c = 0
      a = this.euclidean(this.properti.wA, this.properti.user)
      b = this.euclidean(this.properti.wB, this.properti.user)
      c = this.euclidean(this.properti.wC, this.properti.user)

      // seleksi kelas pemenang
      let minimum = Math.min(...[a, b, c])
      if (a === minimum) {
        this.properti.user.target = 'A'
      } else if (b === minimum) {
        this.properti.user.target = 'B'
      } else if (c === minimum) {
        this.properti.user.target = 'C'
      }

      this.loading = false
      this.showTable = true


      
  }

  async testing(){
      let data = await datum.all()
      data = data.toJSON()
      data.forEach(item => {
          let a, b, c = 0
          a = this.euclidean(this.properti.wA, item)
          b = this.euclidean(this.properti.wB, item)
          c = this.euclidean(this.properti.wC, item)
  
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
          console.log(resultTarget)
  
          if (item.target === resultTarget) {
            item.status = 'benar'
            this.countTrue++;
          } else {
            item.status = 'salah'
          }
          
          this.properti.dataTested.push(item)
        })
  
        this.properti.accuration = Math.round((this.properti.countTrue / data.length) * 100)
    
  }

  match(weight, item) {
      weight.mufrodat = weight.mufrodat + (this.properti.lr * (item.mufrodat - weight.mufrodat))
      weight.tarakib = weight.tarakib + (this.properti.lr * (item.tarakib - weight.tarakib))
      weight.qiroah = weight.qiroah + (this.properti.lr * (item.qiroah - weight.qiroah))
      weight.kitabah = weight.kitabah + (this.properti.lr * (item.kitabah - weight.kitabah))
  
    
      console.log(weight.mufrodat)
      console.log(weight.tarakib)
      console.log(weight.qiroah)
      console.log(weight.kitabah)
  }

  mismatch(weight, item) {
      weight.mufrodat = weight.mufrodat - (this.properti.lr * (item.mufrodat - weight.mufrodat))
      weight.tarakib = weight.tarakib - (this.properti.lr * (item.tarakib - weight.tarakib))
      weight.qiroah = weight.qiroah - (this.properti.lr * (item.qiroah - weight.qiroah))
      weight.kitabah = weight.kitabah - (this.properti.lr * (item.kitabah - weight.kitabah))

      
      console.log(weight.mufrodat)
      console.log(weight.tarakib)
      console.log(weight.qiroah)
      console.log(weight.kitabah)
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

  normalization(){
      
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
