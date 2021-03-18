class Char{
  constructor(value, eventCount, identifier, siteID){
    this.value = value;
    this.siteID = siteID;
    this.eventCount = eventCount;
    this.identifier = identifier;
  }

  compareTo(otherChar){
    let id1 = this.identifier;
    let id2 = otherChar.identifier;

    let currVal1, currVal2, comparisonValue;
    for(let i = 0; i < Math.min(id1.length, id2.length); i++){
      currVal1 = id1[i];
      currVal2 = id2[i];

      comparisonValue = currVal1.compareTo(currVal2);

      if(comparisonValue !== 0){
        return comparisonValue;
      }
    }

    if(id1.length < id2.length){
      return -1;
    }
    else if(id1.length > id2.length){
      return 1;
    }
    else {
      return 0;
    }
  }
}

export default Char;