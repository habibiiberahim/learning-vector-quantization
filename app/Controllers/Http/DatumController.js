"use strict";
const ImportService = use("App/Services/ImportService");
const training = use("App/Models/Datum");
const user = use("App/Models/Testing");

const Database = use("Database");

class DatumController {
  constructor() {
    this.mufrodat = 0;
    this.tarakib = 0;
    this.qiroah = 0;
    this.kitabah = 0;

    this.wA = {
      mufrodat: 0.938,
      tarakib: 0.692,
      qiroah: 0.7,
      kitabah: 0.667,
    };
    this.wB = {
      mufrodat: 0.5,
      tarakib: 0.692,
      qiroah: 0.6,
      kitabah: 0.667,
    };
    (this.wC = {
      mufrodat: 0.438,
      tarakib: 0.154,
      qiroah: 0.5,
      kitabah: 0.333,
    }),
    
    //parameter training
    (this.fixLr = 0);
    this.epoch = 1000;
    this.decLr = 0.1;
    this.lr = 0.001;
    this.episilon = 0.00001;

    //variabel pendukung
    this.wResult = {};
    this.dataTested = [];
    this.dataTraining = [];
    this.dataTesting = [];
    this.countTrue = 0;
    this.countFalse = 0;
    this.countAll = 0;
    this.accuration = 0;
    this.ratio = 0;

    //confusion matrix variable
    this.Paa = 0;
    this.Pab = 0;
    this.Pac = 0;
    this.Pba = 0;
    this.Pbb = 0;
    this.Pbc = 0;
    this.Pca = 0;
    this.Pcb = 0;
    this.Pcc = 0;

    (this.minMufrodat = 0),
      (this.maxMufrodat = 0),
      (this.minTarakib = 0),
      (this.maxTarakib = 0),
      (this.minQiroah = 0),
      (this.maxQiroah = 0),
      (this.minKitabah = 0),
      (this.maxKitabah = 0);
  }

  async index({ view }) {
    return view.render("testing");
  }

  async test({ view }) {
    return view.render("home");
  }

  async single({ request, view }) {
    this.mufrodat = parseInt(request.input("mufrodat"));
    this.tarakib = parseInt(request.input("tarakib"));
    this.qiroah = parseInt(request.input("qiroah"));
    this.kitabah = parseInt(request.input("kitabah"));

    await this.getSingle();
    await this.training(this.dataTraining);
    await this.normalizationSingle();

    let user = {
      mufrodat: this.mufrodat,
      tarakib: this.tarakib,
      qiroah: this.qiroah,
      kitabah: this.kitabah,
    }
    await this.testingSingle(user)

    return view.render("single_result", {
      data: this.dataTested,
    });
  
  }

  async importData() {
    await Database.truncate("data");
    await ImportService.ImportDataTraining(60);
  }

  async classification({ request, view }) {
    // await this.importData()
    
    const key = request.input("ratio");

    if (key == 1) {
      await this.getData(60);
    } else if (key == 2) {
      await this.getData(70);
    } else {
      await this.getData(80);
    }
   

    await this.training(this.dataTraining);
    await this.testing(this.dataTesting);

    
    return view.render("result", {
      data: this.dataTested,
      accuration: this.accuration,
      countTrue: this.countTrue,
      countFalse: this.countFalse,
      countAll: this.countAll,
    });
  }

  

  async normalizationSingle() {
    this.mufrodat = (
      (this.mufrodat - this.minMufrodat) /
      (this.maxMufrodat - this.minMufrodat)
    ).toFixed(3);
    this.tarakib = (
      (this.tarakib - this.minTarakib) /
      (this.maxTarakib - this.minTarakib)
    ).toFixed(3);
    this.qiroah = (
      (this.qiroah - this.minQiroah) /
      (this.maxQiroah - this.minQiroah)
    ).toFixed(3);
    this.kitabah = (
      (this.kitabah - this.minKitabah) /
      (this.maxKitabah - this.minKitabah)
    ).toFixed(3);
 

  }

  async dataset({ view }) {
    let data = await training.all();
    data = data.toJSON();
    // data = this.normalization(data)
    return view.render("dataset", { dataset: data });
  }

  async getData(index) {
    let data = await training.all();

    data = data.toJSON();
    data = this.normalization(data);

    let count = (data.length * index) / 100;
    data.forEach((element) => {
      if (count > 0) {
        this.dataTraining.push(element);
        count--;
      } else {
        this.dataTesting.push(element);
      }
    });
  }

  async getSingle() {
    let data = await training.all();
    data = data.toJSON();
    data = this.normalization(data);
    this.dataTraining = data;
  }

  async training(data) {
    this.fixLr = this.lr;
    const epoh = this.epoch;
    let a,
      b,
      c = null; // a = kelas A, b = kelas B, c = Kelas C

    for (let i = 0; i < epoh && this.lr >= this.episilon; i++) {
      data.forEach((item) => {
        a = this.euclidean(this.wA, item);
        b = this.euclidean(this.wB, item);
        c = this.euclidean(this.wC, item);

        let minimum = Math.min(...[a, b, c]);

        if (a === minimum) {
          if (item.target === "A") {
            this.match(this.wA, item);
          } else {
            this.mismatch(this.wA, item);
          }
        } else if (b === minimum) {
          if (item.target === "B") {
            this.match(this.wB, item);
          } else {
            this.mismatch(this.wB, item);
          }
        } else {
          if (item.target === "C") {
            this.match(this.wC, item);
          } else {
            this.mismatch(this.wC, item);
          }
        }

        //decrement learning rate
        this.lr = this.lr - this.lr * this.decLr;
      });
    }

    //simpan bobot akhir
    this.wResult = {
      A: a,
      B: b,
      C: c,
    };
  }

  async testing(data) {
    data.forEach((item) => {
      // console.log(item)
      let a,
        b,
        c = 0;
      a = this.euclidean(this.wA, item);
      b = this.euclidean(this.wB, item);
      c = this.euclidean(this.wC, item);

      // seleksi kelas pemenang
      let minimum = Math.min(...[a, b, c]);

      //cek prediksi kelas pemenang
      let resultTarget = null;
      if (a === minimum) {
        resultTarget = "A";
      } else if (b === minimum) {
        resultTarget = "B";
      } else if (c === minimum) {
        resultTarget = "C";
      }
      //simpan hasil kelas pemenang
      item.resultTarget = resultTarget;

      //pengecekan kelas pemenang dengan kelas real
      if (item.target === "A") {
        if (resultTarget === "C") {
          this.Pca++;
          item.status = "False";
        } else if (resultTarget === "B") {
          this.Pba++;
          item.status = "False";
        } else {
          this.Paa++;
          item.status = "True";
        }
      } else if (item.target === "B") {
        if (resultTarget === "C") {
          this.Pcb++;
          item.status = "False";
        } else if (resultTarget === "A") {
          this.Pab++;
          item.status = "False";
        } else {
          this.Pbb++;
          item.status = "True";
        }
      } else {
        if (resultTarget === "A") {
          this.Pac++;
          item.status = "False";
        } else if (resultTarget === "B") {
          this.Pbc++;
          item.status = "False";
        } else {
          this.Pcc++;
          item.status = "True";
        }
      }

      this.dataTested.push(item);
    });
    this.countAll =
      this.Paa +
      this.Pab +
      this.Pac +
      this.Pbb +
      this.Pba +
      this.Pbc +
      this.Pcc +
      this.Pca +
      this.Pcb;
    this.countTrue = this.Paa + this.Pbb + this.Pcc;
    this.countFalse =
      +this.Pab + this.Pac + this.Pba + this.Pbc + this.Pca + this.Pcb;
    this.accuration = Math.round((this.countTrue / this.countAll) * 100);
  }

  match(weight, item) {
    weight.mufrodat =
      weight.mufrodat + this.lr * Math.abs(item.mufrodat - weight.mufrodat);
    weight.tarakib =
      weight.tarakib + this.lr * Math.abs(item.tarakib - weight.tarakib);
    weight.qiroah =
      weight.qiroah + this.lr * Math.abs(item.qiroah - weight.qiroah);
    weight.kitabah =
      weight.kitabah + this.lr * Math.abs(item.kitabah - weight.kitabah);
  }

  mismatch(weight, item) {
    weight.mufrodat =
      weight.mufrodat - this.lr * Math.abs(item.mufrodat - weight.mufrodat);
    weight.tarakib =
      weight.tarakib - this.lr * Math.abs(item.tarakib - weight.tarakib);
    weight.qiroah =
      weight.qiroah - this.lr * Math.abs(item.qiroah - weight.qiroah);
    weight.kitabah =
      weight.kitabah - this.lr * Math.abs(item.kitabah - weight.kitabah);
  }

  euclidean(weight, item) {
    return Math.sqrt(
      Math.pow(item.mufrodat - weight.mufrodat, 2) +
        Math.pow(item.tarakib - weight.tarakib, 2) +
        Math.pow(item.qiroah - weight.qiroah, 2) +
        Math.pow(item.kitabah - weight.kitabah, 2)
    );
  }

  normalization(data) {
    let mufrodat = [];
    let tarakib = [];
    let qiroah = [];
    let kitabah = [];
    let temp = data;

    temp.forEach((element) => {
      mufrodat.push(element.mufrodat);
      tarakib.push(element.tarakib);
      qiroah.push(element.qiroah);
      kitabah.push(element.kitabah);
    });

    this.minMufrodat = Math.min.apply(null, mufrodat);
    this.maxMufrodat = Math.max.apply(null, mufrodat);
    this.minTarakib = Math.min.apply(null, tarakib);
    this.maxTarakib = Math.max.apply(null, tarakib);
    this.minQiroah = Math.min.apply(null, qiroah);
    this.maxQiroah = Math.max.apply(null, qiroah);
    this.minKitabah = Math.min.apply(null, kitabah);
    this.maxKitabah = Math.max.apply(null, kitabah);

    data.forEach((element) => {
      element.mufrodat = (
        (element.mufrodat - this.minMufrodat) /
        (this.maxMufrodat - this.minMufrodat)
      ).toFixed(3);
      element.tarakib = (
        (element.tarakib - this.minTarakib) /
        (this.maxTarakib - this.minTarakib)
      ).toFixed(3);
      element.qiroah = (
        (element.qiroah - this.minQiroah) /
        (this.maxQiroah - this.minQiroah)
      ).toFixed(3);
      element.kitabah = (
        (element.kitabah - this.minKitabah) /
        (this.maxKitabah - this.minKitabah)
      ).toFixed(3);
    });
    return data;
  }


  async testingSingle(item) {
   
      let a,
        b,
        c = 0;
      a = this.euclidean(this.wA, item);
      b = this.euclidean(this.wB, item);
      c = this.euclidean(this.wC, item);

      // seleksi kelas pemenang
      let minimum = Math.min(...[a, b, c]);

      //cek prediksi kelas pemenang
      let resultTarget = null;
      if (a === minimum) {
        resultTarget = "A";
      } else if (b === minimum) {
        resultTarget = "B";
      } else if (c === minimum) {
        resultTarget = "C";
      }
      //simpan hasil kelas pemenang
      item.resultTarget = resultTarget;

      //pengecekan kelas pemenang dengan kelas real
      if (item.target === "A") {
        if (resultTarget === "C") {
          this.Pca++;
          item.status = "False";
        } else if (resultTarget === "B") {
          this.Pba++;
          item.status = "False";
        } else {
          this.Paa++;
          item.status = "True";
        }
      } else if (item.target === "B") {
        if (resultTarget === "C") {
          this.Pcb++;
          item.status = "False";
        } else if (resultTarget === "A") {
          this.Pab++;
          item.status = "False";
        } else {
          this.Pbb++;
          item.status = "True";
        }
      } else {
        if (resultTarget === "A") {
          this.Pac++;
          item.status = "False";
        } else if (resultTarget === "B") {
          this.Pbc++;
          item.status = "False";
        } else {
          this.Pcc++;
          item.status = "True";
        }
      }
      // console.log(item)
      this.dataTested.push(item);
    
    this.countAll =
      this.Paa +
      this.Pab +
      this.Pac +
      this.Pbb +
      this.Pba +
      this.Pbc +
      this.Pcc +
      this.Pca +
      this.Pcb;
    this.countTrue = this.Paa + this.Pbb + this.Pcc;
    this.countFalse =
      +this.Pab + this.Pac + this.Pba + this.Pbc + this.Pca + this.Pcb;
    this.accuration = Math.round((this.countTrue / this.countAll) * 100);
  }
}

module.exports = DatumController;
