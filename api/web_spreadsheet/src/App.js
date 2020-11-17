import React, { Component, useState } from 'react';
import ReactDOM from "react-dom"
import logo from './logo.svg';
import './App.css';
import {ExcelRenderer, OutTable} from 'react-excel-renderer';
import {
  Collapse,
  Navbar,
  NavbarToggler,
  NavbarBrand,
  Nav,
  NavItem,
  NavLink,
  Container,
  Row,
  Col,
  Jumbotron,
  Button,
  Table, Modal, ModalHeader, ModalFooter, ModalBody
} from 'reactstrap';
import ReactDataSheet from 'react-datasheet';
// Be sure to include styles at some point, probably during your bootstrapping
import 'react-datasheet/lib/react-datasheet.css';

import { BrowserRouter, Route, Switch } from 'react-router-dom';
import Start from './components/Start';
import Result from './components/Result';
import Simulations from './components/Simulations';
import Academic from './components/Academic';
import Management from './components/Management';
import Financing from './components/Financing';

const BPlusTree = require('bplustree');

//default order: 6
const tree = new BPlusTree()

class App extends Component {

  constructor() {
    super();
    this.state = {
      rows: [],
      cols: [],
      attri: [],
      isSearchSelectionModalOpen: false, 
      isRangeSearchModalOpen: false, 
      isSingelSearchModalOpen: false
    }

    this.toggleSearchSelectionModal = this.toggleSearchSelectionModal.bind()
    this.toggleRangeSearchModal = this.toggleRangeSearchModal.bind()
    this.toggleSingleSearchModal = this.toggleSearchSelectionModal.bind()
  }

  toggleSearchSelectionModal = () => {
    this.setState({
      isSearchSelectionModalOpen: !this.state.isSearchSelectionModalOpen
    })
  }

  toggleRangeSearchModal = () => {
    this.setState({
      isRangeSearchModalOpen: !this.state.isRangeSearchModalOpen,
      isSearchSelectionModalOpen: !this.state.isSearchSelectionModalOpen
    })
  }

  toggleSingleSearchModal = () => {
    this.setState({
      isSingelSearchModalOpen: !this.state.isSingelSearchModalOpen,
      isSearchSelectionModalOpen: !this.state.isSearchSelectionModalOpen
    })
  }

  onRetrieveSelectionClick = () => {
    this.toggleSearchSelectionModal();
  }

  fileHandler = (event) => {
    let fileObj = event.target.files[0];
  
    //just pass the fileObj as parameter
    ExcelRenderer(fileObj, (err, resp) => {
      if(err){
        console.log(err);            
      }
      else{
        this.setState({
          cols: resp.cols,
          rows: resp.rows
        });
      }
    });               
  
  }

  render() { 

    return (
      <div className="App">

           <BrowserRouter>
                <div>
                  {/* <Navbar /> */}
                  <Switch>
                    <Route path="/" component={Simulations} exact/>
                    <Route path="/result" component={Result}/>
                    <Route path="/start" component={Start}/>
                    <Route path="/academic" component={Academic}/>
                    <Route path="/management" component={Management}/>
                    <Route path="/financing" component={Financing}/>
                  </Switch>
                </div> 
            </BrowserRouter>
      </div>
    );
  }
}
export default App;
