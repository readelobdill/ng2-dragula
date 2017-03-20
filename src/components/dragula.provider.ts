import { dragula } from './dragula.class';
import { Injectable, EventEmitter } from '@angular/core';

@Injectable()
export class DragulaService {
  public cancel: EventEmitter<any> = new EventEmitter();
  public cloned: EventEmitter<any> = new EventEmitter();
  public drag: EventEmitter<any> = new EventEmitter();
  public dragend: EventEmitter<any> = new EventEmitter();
  public drop: EventEmitter<any> = new EventEmitter();
  public out: EventEmitter<any> = new EventEmitter();
  public over: EventEmitter<any> = new EventEmitter();
  public remove: EventEmitter<any> = new EventEmitter();
  public shadow: EventEmitter<any> = new EventEmitter();
  public dropModel: EventEmitter<any> = new EventEmitter();
  public removeModel: EventEmitter<any> = new EventEmitter();
  private events: string[] = [
    'cancel', 'cloned', 'drag', 'dragend', 'drop', 'out', 'over',
    'remove', 'shadow', 'dropModel', 'removeModel'
  ];
  private bags: any[] = [];

  public add(name: string, drake: any): any {
    let bag = this.find(name);
    if (bag) {
      throw new Error('Bag named: "' + name + '" already exists.');
    }
    bag = {name, drake};
    this.bags.push(bag);
    if (drake.models) { // models to sync with (must have same structure as containers)
      this.handleModels(name, drake);
    }
    if (!bag.initEvents) {
      this.setupEvents(bag);
    }
    return bag;
  }

  public find(name: string): any {
    for (let bag of this.bags) {
      if (bag.name === name) {
        return bag;
      }
    }
  }

  public destroy(name: string): void {
    let bag = this.find(name);
    let i = this.bags.indexOf(bag);
    this.bags.splice(i, 1);
    bag.drake.destroy();
  }

  public setOptions(name: string, options: any): void {
    let bag = this.add(name, dragula(options));
    this.handleModels(name, bag.drake);
  }

  private handleModels(name: string, drake: any): void {
    let dragElm: any;
    let dragIndex: number;
    let dropIndex: number;
    let sourceModel: any;
    let dragModels: any[] = [];
    drake.on('remove', (el: any, source: any) => {
      if (!drake.models) {
        return;
      }
      sourceModel = drake.models[drake.containers.indexOf(source)];
      sourceModel.splice(dragIndex, 1);
      // console.log('REMOVE');
      // console.log(sourceModel);
      this.removeModel.emit([name, el, source]);
    });
    drake.on('drag', (el: any, source: any) => {
      dragElm = el;
      // record models at beginning of drag
      let index = _this.domIndexOf(el, source);
      let model = drake.models[drake.containers.indexOf(source)];
      dragModels.push(model[index]);
    });
    drake.on('drop', (dropElm: any, target: any, source: any) => {
      if (!drake.models || !target) {
        return;
      }
      dropIndex = _this.minDomIndexOf(dropElms, target);
      let targetModel = drake.models[drake.containers.indexOf(target)];

      // remove from old models before update
      for (let dragModel of dragModels) {
        for (let model of drake.models) {
          let index = model.indexOf(dragModel);
          if(index > -1) {
            model.splice(index, 1);
          }
        }
      }

      targetModel.splice(dropIndex, 0, ...dragModels);
      dragModels = [];
      _this.dropModel.emit([name, dropElms[0], target, source]);
    });
  }

  private setupEvents(bag: any): void {
    bag.initEvents = true;
    let that: any = this;
    let emitter = (type: any) => {
      function replicate(): void {
        let args = Array.prototype.slice.call(arguments);
        that[type].emit([bag.name].concat(args));
      }

      bag.drake.on(type, replicate);
    };
    this.events.forEach(emitter);
  }

  private domIndexOf(child: any, parent: any): any {
    return Array.prototype.indexOf.call(parent.children, child);
  }

  private minDomIndexOf (children: any, parent: any) {
    let indexes = [];
    for (let child of children) {
        indexes.push(this.domIndexOf(child, parent));
    }
    return Math.min(...indexes);
  }
}
