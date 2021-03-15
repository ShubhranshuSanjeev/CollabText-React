class Identifier{
  constructor(id, siteID){
    this.id = id;
    this.siteID = siteID;
  }

  compareTo(otherIdentifier){
    if(this.id < otherIdentifier.id){
      return -1;
    }
    else if(this.id > otherIdentifier.id){
      return 1;
    }
    else{
      if(this.siteID < otherIdentifier.siteID){
        return -1;
      }
      else if(this.siteID > otherIdentifier.siteID){
        return 1;
      }
      else {
        return 0;
      }
    }
  }
}

export default Identifier;