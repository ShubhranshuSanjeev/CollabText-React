import Char from './Char';
import Identifier from './Identifier';

class CRDT{
  constructor(siteID, vectorClock){
    this.boundary = 10;
    this.base = 32;
    this.text = '';
    this.siteID = siteID;
    this.vectorClock = vectorClock;
    this.boundaryStrategy = new Map();
    this.editorEntries = [];
  }

  findPositionByID(char){
    let left = 0;
    let right = this.editorEntries.length - 1;
    let mid, comparisonValue;

    while(left+1 < right){
      mid = Math.floor(left + (right - left)/2);
      comparisonValue = char.compareTo(this.editorEntries[mid]);

      if(comparisonValue === 0){
        return mid;
      }
      else if(comparisonValue < 0){
        right = mid;
      }
      else {
        left = mid;
      }
    }

    if(char.compareTo(this.editorEntries[left]) === 0){
      return left;
    }
    else if (char.compareTo(this.editorEntries[right]) === 0){
      return right;
    }
  }

  findInsertPosition(char){
    let left = 0;
    let right = this.editorEntries.length - 1;
    let mid, comparisonValue;

    if(this.editorEntries.length === 0 || char.compareTo(this.editorEntries[left]) < 0){
      return left;
    }
    else if (char.compareTo(this.editorEntries[right]) > 0){
      return this.editorEntries.length;
    }

    while(left+1 < right){
      mid = Math.floor(left + (right - left)/2);
      comparisonValue = char.compareTo(this.editorEntries[mid]);

      if(comparisonValue === 0){
        return mid;
      }
      else if(comparisonValue < 0){
        right = mid;
      }
      else {
        left = mid;
      }
    }

    return char.compareTo(this.editorEntries[left]) === 0 ? left : right;
  }

  getPredecessorID(index){
    if(index === 0) return [];
    return index <= this.editorEntries.length ? this.editorEntries[index-1].identifier : [];
  }

  getSuccessorID(index){
    return index < this.editorEntries.length ? this.editorEntries[index].identifier : [];
  }

  insertRemoteCharacter(char){
    const index = this.findInsertPosition(char);
    this.editorEntries.splice(index, 0, char);

    return index;
  }

  deleteRemoteCharacter(char){
    console.log("DELETE_REMOTE_CHAR: ", char);
    const index = this.findPositionByID(char);
    this.editorEntries.splice(index, 1);

    return index;
  }

  insertCharacter(value, index, ){
    this.vectorClock.increment();

    let successorID = this.getSuccessorID(index)
    let predecessorID = this.getPredecessorID(index)

    let newID = this.allocateIdBetween(predecessorID, successorID);
    let localEventCount = this.vectorClock.localClock.eventCount;

    let char = new Char(value, localEventCount, newID, this.siteID);

    this.editorEntries.splice(index, 0, char);
    return char;
  }

  deleteCharacter(index){
    this.vectorClock.increment();

    let char = this.editorEntries.splice(index, 1)[0];
    return char;
  }

  allocateIdBetween(predecessorID, successorID){
    let depth = 0;
    let interval = 0;
    let newID = [];

    while(interval < 2){
      let baseForCurrDepth = Math.pow(2,depth) * this.base;
      let boundaryStrategyForCurrDepth;

      if(this.boundaryStrategy.has(depth)){
        boundaryStrategyForCurrDepth = this.boundaryStrategy.get(depth);
      }
      else {
        boundaryStrategyForCurrDepth = (Math.round(Math.random()) === 0);
        this.boundaryStrategy.set(depth, boundaryStrategyForCurrDepth);
      }

      let id1 = predecessorID.length <= depth ? new Identifier(0, this.siteID) : predecessorID[depth];
      let id2 = successorID.length <= depth ? new Identifier(baseForCurrDepth, this.siteID) : successorID[depth];

      if(id2 < id1){
        let tmp = id1;
        id1 = id2;
        id2 = tmp;
      }

      interval = id2.id - id1.id;
      if(interval > 1){
        let step = Math.min(this.boundary, interval);
        let newPos;

        if(boundaryStrategyForCurrDepth){
          let addVal = Math.floor(Math.random() * step);
          if(addVal === 0) addVal+=1;
          newPos = id1.id + addVal;
        }
        else{
          let subVal = Math.floor(Math.random() * step);
          if(subVal === 0) subVal+=1;
          newPos = id2.id - subVal;
        }

        newID.push(new Identifier(newPos, this.siteID));
      }
      else if (interval === 1){
        newID.push(id1);
        successorID = [];
      }
      else if(interval === 0){
        if(id1.siteID < id2.siteID){
          newID.push(id1);
          successorID = [];
        }
        else if(id1.siteID === id2.siteID){
          newID.push(id1);
        }
      }
      depth++;
    }

    return newID;
  }

}

export default CRDT;