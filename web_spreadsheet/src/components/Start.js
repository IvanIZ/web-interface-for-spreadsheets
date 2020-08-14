import React, { Component, useState } from 'react';
import ReactDOM from "react-dom"
import logo from '../logo.svg';
import '../App.css';
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
  Table, Modal, ModalHeader, ModalFooter, ModalBody, Form, FormGroup, Label, Input
} from 'reactstrap';
import Spreadsheet from "react-spreadsheet";

import { ReactCanvasGrid } from 'react-canvas-grid';
// import { FixedSizeHolder } from '../components/FixedSizeHolder';
// import { createFakeDataAndColumns } from '../data/dataAndColumns';
const BPlusTree = require('bplustree');

//default order: 6
let tree = new BPlusTree()

let outputTable, searchResultTable, range_search_upper_index, range_search_lower_index, single_search_button, range_search_button;
let single_search_returned_key = []
let singleSearchResult = [], range_search_result = [], range_search_returned_key = [], arri_array = []
let attri_cell_arr 

let data = []

const columnLabels = ["Name", "Age"];

class Start extends Component {

  constructor() {
    super();
    this.state = {
      rows: [],
      cols: [],
      attri: [],
      isSearchSelectionModalOpen: false, 
      isRangeSearchModalOpen: false, 
      isSingelSearchModalOpen: false,

      isUploadAckModalOpen: false,

      single_search_index: 0, 

      isSingleSearch: false,

      isResultPanelModalOpen: false, 
      searchResult: [], 

      range_search_lower_index: 0, 
      range_search_upper_index: 0
    }

    this.toggleSearchSelectionModal = this.toggleSearchSelectionModal.bind()
    this.toggleRangeSearchModal = this.toggleRangeSearchModal.bind()
    this.toggleSingleSearchModal = this.toggleSingleSearchModal.bind()
    this.toggleUploadAckModal = this.toggleUploadAckModal.bind()
    this.toggleResultPanelModal = this.toggleResultPanelModal.bind()
  }


  toggleUploadAckModal = () => {
    this.setState({
      isUploadAckModalOpen: !this.state.isUploadAckModalOpen
    })
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
      isSingelSearchModalOpen: !this.state.isSingelSearchModalOpen
    })
  }

  // close acknowledge modal, open selection and display penel, and fill out content
  onRetrieveSelectionClick = () => {
    this.fillOutputTable()
    
    if (this.state.isUploadAckModalOpen == true) {
      this.toggleUploadAckModal()
    }

    //close current result panel, if it's openned
    if (this.state.isResultPanelModalOpen == true) {
      this.toggleResultPanelModal()
    }

    //close single search modal, if it's openned
    if (this.state.isSingelSearchModalOpen == true) {
      this.toggleSingleSearchModal()
    }

    //close range search modal, if it's openned
    if (this.state.isRangeSearchModalOpen == true) {
      this.toggleRangeSearchModal()
    }
  }

  toFrontPage = () => {
    this.setState({
      isResultPanelModalOpen: false, 
      isRangeSearchModalOpen: false, 
      isSingelSearchModalOpen: false, 
      isSearchSelectionModalOpen: false, 
      isUploadAckModalOpen: false
    })
  }

  getFinalSingleSearchResult = () => {
    let resultMatrix = [data[0]]
    // resultMatrix[1] = data[Number(single_search_returned_key)]
    for (var i = 0; i < single_search_returned_key.length; i++) {
      resultMatrix[i + 1] = data[single_search_returned_key[i]]
    }
    
    console.log("final single search result is ", resultMatrix)
    searchResultTable = <Jumbotron>
                             Below Is The Retrieved Data
                            <Spreadsheet data={resultMatrix} />
                        </Jumbotron>
    this.toggleResultPanelModal()
  }

  getFinalRangeSearchResult = () => {
    let resultMatrix = [data[0]]
    for (var i = 0; i < range_search_returned_key.length; i++) {
      resultMatrix[i + 1] = data[range_search_returned_key[i]]
    }
    console.log("final range search result ", resultMatrix)
    searchResultTable = <Jumbotron>
                            <Row>
                               Below Is The Retrieved Data
                            </Row>
                            <Spreadsheet data={resultMatrix} />
                        </Jumbotron>
    this.toggleResultPanelModal()
  }

  toggleResultPanelModal = () => {
    this.setState({
      isResultPanelModalOpen: !this.state.isResultPanelModalOpen
    })
  }

  handleSearchIndexChange = (e) => {
    this.setState({
        [e.target.name]: e.target.value
    })
  }

  onSingleSearchKeySubmit = (e) => {
    e.preventDefault();
    single_search_returned_key = tree.fetch(this.state.single_search_index)
    console.log("user entered single search result key is: " , single_search_returned_key)
    this.toggleSingleSearchModal()
    this.getFinalSingleSearchResult()
  }

  onRangeSearchIndexSubmit = (e) => {
    e.preventDefault();
    range_search_returned_key = tree.fetchRange(Number(this.state.range_search_lower_index), Number(this.state.range_search_upper_index), false)
    console.log("user entered lower index is: " + this.state.range_search_lower_index)
    console.log("user entered upper index is: " + this.state.range_search_upper_index)
    console.log("user entered range search result keys are: ", range_search_returned_key)
    this.toggleRangeSearchModal()
    this.getFinalRangeSearchResult()
  }

  fileHandler = (event) => {
    let fileObj = event.target.files[0];
    console.log("file change!")
    tree = new BPlusTree()
  
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
    this.toggleUploadAckModal() 
  }

  fillOutputTable = () => {
    // searchResultTable = ''
    let row_copy = this.state.rows
    let col_copy = this.state.cols
    attri_cell_arr = [{name: "#", key: 0}]
    if (row_copy.length != 0 || col_copy.length != 0) {
      console.log("not null")
      console.log("row is: ", row_copy)
      console.log("col is", col_copy)

      //fill in attribute cell array
      for (var i = 0; i < col_copy.length; i++) {
        col_copy[i] = {name: col_copy[i].name, key: col_copy[i].key + 1 }
        attri_cell_arr[i + 1] = col_copy[i]
      }
      console.log(attri_cell_arr)

      //fill in attribute row
      for (var i = 0; i < col_copy.length; i++) {
        arri_array[i] = { value: col_copy[i].name}
      }
      console.log(arri_array)

      //fill in entire matrix
      //data = [arri_array]
      data = []
      searchResultTable = ''
      for (var i = 0; i < row_copy.length; i++) {
        let temp = []
        for (var j = 0; j < col_copy.length; j++) {
          temp[j] = { value: row_copy[i][j]}
        }
        data[i] = temp
      }
      console.log("the value of whole data is: ", data)


      if (tree.depth(true) == 0) {
        outputTable = <Jumbotron >
                          <Row>
                              Below Is The Entire Data Set
                          </Row>
                          <Spreadsheet data={data} />
                      </Jumbotron>
        single_search_button = <Button color="primary" onClick={this.toggleRangeSearchModal} >Range Retrieval</Button> 
        range_search_button = <Button color="primary" onClick={this.toggleSingleSearchModal} type="submit">Single Row Retrieval</Button> 
        console.log("create TREE")
        for (var i = 1; i < row_copy.length; i++) {
          tree.store(row_copy[i][0], i)
        }
      }
      
      //single fetch example
      let example_fetch = tree.fetch(34)
      console.log("The fetched value should be 11. Actual value is: " + example_fetch)

      //range fetch example
      let example_range_fetch = tree.fetchRange(40, 67)
      console.log("The range-fetched value is:  ", example_range_fetch)

      this.setState({
        isSearchSelectionModalOpen:true
      })

    } else {
      console.log("null")
      outputTable = "Not uploaded yet"
    }
  }


  render() {

    return (

      <div className="App">
         <Jumbotron className='logo-jumbo'>
          
          </Jumbotron >
          <Jumbotron fluid>
            <Container fluid>
                  <h1 className="display-3"> Welcome to spreadsheet web!</h1>
                  <p className="lead">This is a simple web interface that allows you to upload spreadsheets, and retreive or removal data.</p>
                  <hr className="my-2" />
                  <p>Please upload your file below</p>
                  <p className="lead">
                    <input type="file" onChange={this.fileHandler.bind(this)} style={{"padding":"10px"}} />
                  </p>
                  {single_search_button}
                  &nbsp;&nbsp;&nbsp;&nbsp;
                  {range_search_button}

                  <Modal isOpen={this.state.isUploadAckModalOpen} toggle={this.toggleUploadAckModal} >
                    <ModalHeader toggle={this.toggleUploadAckModal}>Upload Seccessful! </ModalHeader>
                    <ModalBody>
                      <Button color="primary" onClick={this.onRetrieveSelectionClick} type="submit">View and Select Data Retrieval Option</Button> {'   '}
                    </ModalBody>
                  </Modal>

                  <Modal isOpen={this.state.isSingelSearchModalOpen} toggle={this.toggleSingleSearchModal} >
                    <ModalHeader toggle={this.toggleSingleSearchModal}>Please enter your search index. (First Attribute Value) </ModalHeader>
                    <ModalBody>
                      <Form onSubmit={this.onSingleSearchKeySubmit}>
                        <FormGroup>
                          <Label for="single_search_index">Single Search Index</Label>
                          <Input type="number" name="single_search_index" id="single_search_index" onChange={e => this.handleSearchIndexChange(e)} />
                        </FormGroup>
                        <Button color="primary" className='single_search_submit' type="submit">Search</Button> {' '}
                      </Form>
                    </ModalBody>
                  </Modal>

                  <Modal isOpen={this.state.isRangeSearchModalOpen} toggle={this.toggleRangeSearchModal} >
                    <ModalHeader toggle={this.toggleRangeSearchModal}>Please enter upper and lower search index. (First Attribute Value) </ModalHeader>
                    <ModalBody>
                      <Form onSubmit={this.onRangeSearchIndexSubmit}>
                        <FormGroup>
                          <Label for="range_search_lower_index">Lower Index</Label>
                          <Input type="number" name="range_search_lower_index" id="range_search_lower_index" onChange={e => this.handleSearchIndexChange(e)} />
                        </FormGroup>
                        <FormGroup>
                          <Label for="range_search_upper_index">Upper Index</Label>
                          <Input type="number" name="range_search_upper_index" id="range_search_upper_index" onChange={e => this.handleSearchIndexChange(e)} />
                        </FormGroup>
                        <Button color="primary" className='range_search_submit' type="submit">Search</Button> {' '}
                      </Form>
                    </ModalBody>
                  </Modal>

                  <Modal isOpen={this.state.isResultPanelModalOpen} toggle={this.toggleResultPanelModal} >
                    <ModalHeader toggle={this.toggleResultPanelModal}>
                      Data is retrieved. Click view to see the result
                    </ModalHeader>
                    <ModalBody>
                        <Button color="primary" onClick={this.toFrontPage} type="submit">View</Button> 
                    </ModalBody>
                  </Modal>
            </Container>
        </Jumbotron>
        {searchResultTable}
        {outputTable}
      </div>

    );
  }
}
export default Start;
