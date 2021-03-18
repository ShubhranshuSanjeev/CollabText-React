import {React, Component} from 'react';
import ReactQuill from 'react-quill';
import socketIO from "socket.io-client";

import Char from "../CRDT/Char";
import CRDT from "../CRDT/CRDT";
import Identifier from "../CRDT/Identifier";
import VectorClock from "../VectorClock/VectorClock";

import 'react-quill/dist/quill.snow.css';
import './editor.css';

class Editor extends Component{
  constructor(){
    super();

    this.endpoint = "https://shielded-plateau-27399.herokuapp.com/";
    this.socket = null;
    this.siteID = '';

    this.quillRef = null;
    this.reactQuillRef = null;
    this.crdt = null;
    this.vectorClock = null;
    this.deleteBuffer = [];

    this.state = {
      htmlText: '' ,
      plainText: '',
    };
  }
  componentDidMount(){
    this.socket = socketIO(this.endpoint);

    this.socket.on('siteid', data => {
      console.log(data);
      this.siteID = data.siteID;
      this.vectorClock = new VectorClock(this.siteID);
      this.crdt = new CRDT(this.siteID, this.vectorClock);
    });

    this.socket.on('operation', operation => this.handleRemoteOperation(operation));

    this.attachQuillRefs();
  }

  componentDidUpdate(){
    this.attachQuillRefs();
  }

  attachQuillRefs = () => {
    if (typeof this.reactQuillRef.getEditor !== 'function') return;
    if (this.quillRef != null) return;

    const quillRef = this.reactQuillRef.getEditor();
    if (quillRef != null) this.quillRef = quillRef;
  }

  applyRemoteOperation(char, type, clock){
    const identifier = char.identifier.map(entry => new Identifier(entry.id, entry.siteID));
    const charCopy = new Char(char.value, char.eventCount, identifier, char.siteID);

    if(type === 'insert'){
      const position = this.crdt.insertRemoteCharacter(charCopy);
      this.insertCharIntoEditor(charCopy.value, position);
    }
    else if(type === 'delete'){
      const position = this.crdt.deleteRemoteCharacter(charCopy);
      this.deleteCharFromEditor(charCopy.value, position);
    }

    this.vectorClock.update(clock);
  }

  handleRemoteOperation(operation){
    operation = JSON.parse(operation);
    const { type, char, source, clock } = operation;

    if(source === this.siteID){
      return;
    }

    if(type === 'insert'){
      this.applyRemoteOperation(char, type, clock);
    }
    else if(type === 'delete'){
      this.deleteBuffer.push(operation);
    }

    this.processDeleteBuffer();
  }

  processDeleteBuffer() {
    let i = 0;
    let operation;

    while(i < this.deleteBuffer.length){
      operation = this.deleteBuffer[i];

      if(this.hasInsertOperationCompleted(operation)){
        this.applyRemoteOperation(operation.char, operation.type, operation.clock);
        this.deleteBuffer.splice(i, 1);
      }
      else {
        i++;
      }
    }
  }

  hasInsertOperationCompleted(operation){
    let operationClockSnapshot = {
      siteID: operation.char.siteID,
      eventCount: operation.char.eventCount
    };

    return this.vectorClock.hasBeenApplied(operationClockSnapshot);
  }


  deleteCharFromEditor(val, position){
    this.quillRef.deleteText(position, 1, 'silent');
  }

  insertCharIntoEditor(val, poisition){
    this.quillRef.insertText(poisition, val, 'silent');
  }


  sendOperation(char, type){
    const data = {
      type: type,
      char: char,
      source: this.siteID,
      clock: this.vectorClock.getLocalClock()
    }

    this.socket.emit('operation', JSON.stringify(data));
  }

  handleInsertOperation(index, content){
    const contentLength = content.length;
    for(let idx = 0; idx < contentLength; idx++){
      let insertPosition = idx + index;
      const char = this.crdt.insertCharacter(content[idx], insertPosition);

      this.sendOperation(char, 'insert');
    }
  }

  handleDeleteOperation(index, length){
    for(let idx = 0; idx < length; idx++){
      let deletePosition = index;
      const char = this.crdt.deleteCharacter(deletePosition);

      this.sendOperation(char, 'delete');
    }
  }

  handleChange = (content, delta, source, editor) => {
    /**
     * If delta variable has 2 entries in the array then the character
     * after the starting position has been removed
     * if the delta variable has 1 entry then the character at
     * starting position has been removed
     *
     * the retain key contains the position at which insert or delete has been performed
     *
     */
    if(source === 'silent'){
      return;
    }
    const { ops: operation } = delta;
    const len = operation.length;

    const operationType = Object.keys(operation[len-1])[0];
    const operationValue = operation[len-1][operationType];
    const index = len === 1 ? 0 : operation[0].retain;

    if(`${operationType}` === 'insert')
      this.handleInsertOperation(index, operationValue);
    else if(`${operationType}` === 'delete')
      this.handleDeleteOperation(index, operationValue);

    // console.log(this.crdt.editorEntries.length, delta, operationValue.length);
    // console.log(this.crdt.editorEntries);
    this.setState({ htmlText: content, plainText: editor.getText() });
  }

  render() {
    return (
      <>
        <ReactQuill
          ref={element => { this.reactQuillRef = element }}
          theme={'snow'}
          modules={{ toolbar : true }}
          value={this.state.htmlText}
          onChange={this.handleChange}
        />
      </>
    );
  }
}

export default Editor;