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
    let outputTable;
    let output;
    let row_copy = this.state.rows
    let col_copy = this.state.cols
    let attri_cell_arr = [{name: "#", key: 0}]
    if (row_copy.length != 0 || col_copy.length != 0) {
      console.log("not null")
      console.log(row_copy)
      console.log(col_copy)

      //fill in attribute cell array
      for (var i = 0; i < col_copy.length; i++) {
        col_copy[i] = {name: col_copy[i].name, key: col_copy[i].key + 1 }
        attri_cell_arr[i + 1] = col_copy[i]
      }
      console.log(attri_cell_arr)

      if (tree.depth(true) == 0) {
        for (var i = 0; i < row_copy.length; i++) {
          tree.store(row_copy[i][0], i)
        }
      }
      
      //single fetch example
      let example_fetch = tree.fetch(34)
      console.log("The fetched value should be 11. Actual value is: " + example_fetch)

      //range fetch example
      let example_range_fetch = tree.fetchRange(40, 67)
      console.log("The range-fetched value is:  ", example_range_fetch)

      outputTable = <OutTable data={this.state.rows} columns={attri_cell_arr} tableClassName="ExcelTable2007" tableHeaderRowClass="heading" />

    } else {
      console.log("null")
      outputTable = "Not uploaded yet"
    }

    return (
      <div className="App">
          {/* <Jumbotron >
              <Container>
                  <header className="App-header">
                    <img src={logo} className="App-logo" alt="logo" />
                    <p>
                      Welcome to spreadsheet web. Upload file below......
                    </p>
                    <input type="file" onChange={this.fileHandler.bind(this)} style={{"padding":"10px"}} />
                    <p >
                      <Button size="lg" style={{fontSize: 36, fontWeight: 'bold'}} onClick={this.onRetrieveSelectionClick} block>Retrieve Data</Button>
                    </p>
                    <Modal isOpen={this.state.isSearchSelectionModalOpen} toggle={this.toggleSearchSelectionModal} >
                      <ModalHeader toggle={this.toggleSearchSelectionModal}>Select Data Retrieval Option</ModalHeader>
                      <ModalBody>
                          <Button color="primary" onClick={this.toggleRangeSearchModal} type="submit">Range Retrieval</Button> {' '}
                          <Button color="primary" onClick={this.toggleSingleSearchModal} type="submit">Single Row Retrieval</Button> {' '}
                      </ModalBody>
                    </Modal>
                  </header>  
                  
                  {outputTable}
              </Container>
          </Jumbotron> */}

           <BrowserRouter>
                <div>
                  {/* <Navbar /> */}
                  <Switch>
                    <Route path="/" component={Start} exact/>
                  </Switch>
                </div> 
            </BrowserRouter>
      </div>
    );
  }
}
export default App;
