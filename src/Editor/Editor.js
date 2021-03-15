import {React, Component} from 'react';
import ReactQuill from 'react-quill';
import socketIO from "socket.io-client";

import Char from "../CRDT/Char";
import CRDT from "../CRDT/CRDT";
import Identifier from "../CRDT/Identifier";

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
      this.crdt = new CRDT(this.siteID);
    });

    this.socket.on('insert', data => {
      data = JSON.parse(data).insert;
      const { source, char } = data;
      if(source === this.siteID){
        return;
      }

      const identifier = char.identifier.map(entry => new Identifier(entry.id, entry.siteID));
      const newChar = new Char(char.value, identifier, data.siteID);

      const position = this.crdt.insertRemoteCharacter(newChar);
      this.insertCharIntoEditor(newChar.value, position);
    });

    this.socket.on('delete', data => {
      data = JSON.parse(data).delete;
      const { deletedElement, source } = data;
      if(source === this.siteID){
        return;
      }

      console.log(deletedElement);

      const identifier = deletedElement.identifier.map(entry => new Identifier(entry.id, entry.siteID));
      const char = new Char(deletedElement.value, identifier, data.siteID);

      const position = this.crdt.deleteRemoteCharacter(char);
      this.deleteCharFromEditor(char.value, position);
    });

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

  sendInsertOperation(operation) {
    const data = JSON.stringify(operation);
    this.socket.emit('insert', data);
  }

  sendDeleteOperation(operation) {
    const data = JSON.stringify(operation);
    this.socket.emit('delete', data);
  }

  deleteCharFromEditor(val, position){
    this.quillRef.deleteText(position, 1, 'silent');
  }

  insertCharIntoEditor(val, poisition){
    this.quillRef.insertText(poisition, val, 'silent');
  }

  handleInsertOperation(index, content){
    const contentLength = content.length;
    for(let idx = 0; idx < contentLength; idx++){
      let insertPosition = idx + index;
      const data = this.crdt.insertCharacter(content[idx], insertPosition);

      this.sendInsertOperation(data);
    }
  }

  handleDeleteOperation(index, length){
    for(let idx = 0; idx < length; idx++){
      let deletePosition = index;
      const data = this.crdt.deleteCharacter(deletePosition);

      this.sendDeleteOperation(data);
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