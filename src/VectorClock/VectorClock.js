import Clock from "./Clock";

class VectorClock{
  constructor(siteID){
    this.clocks = []
    this.localClock = new Clock(siteID);
    this.clocks.push(this.localClock);
  }

  increment(){
    ++this.localClock.eventCount;
  }

  getClockLocalCopy(clock){
    return this.clocks.find(c => c.siteID === clock.siteID)
  }

  update(clock){
    const clockLocalCopy = this.getClockLocalCopy(clock);

    if(!clockLocalCopy) {
      let newClockCopy = new Clock(clock.siteID);
      newClockCopy.update(clock);

      this.clocks.push(newClockCopy);
    }
    else {
      clockLocalCopy.update(clock);
    }
  }

  hasBeenApplied(operationClockSnapshot){
    const clockLocalCopy = this.getClockLocalCopy(operationClockSnapshot);
    const localCopyExists = !!clockLocalCopy;

    if(!localCopyExists) return false;

    const isClockSnapshotEventCountLower = operationClockSnapshot.eventCount <= clockLocalCopy.eventCount;
    const isInException = clockLocalCopy.exceptions.includes(operationClockSnapshot.eventCount);

    return isClockSnapshotEventCountLower && !isInException;
  }

  getLocalClock(){
    return {
      siteID: this.localClock.siteID,
      eventCount: this.localClock.eventCount
    }
  }
}

export default VectorClock;