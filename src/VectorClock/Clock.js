class Clock{
  constructor(siteID){
    this.siteID = siteID;
    this.eventCount = 0;
    this.exceptions = [];
  }

  update(clock){
    const _eventCount = clock.eventCount;

    if(_eventCount <= this.eventCount){
      const idx = this.exceptions.indexOf(_eventCount);
      this.exceptions.splice(idx, 1);
    }
    else if(_eventCount === this.eventCount+1){
      ++this.eventCount;
    }
    else {
      for(let i = this.eventCount+1; i < _eventCount; i++){
        this.exceptions.push(i);
      }
      this.eventCount = _eventCount;
    }
  }
}

export default Clock;