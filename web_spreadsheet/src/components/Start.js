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
// import {Modal, Button, Row, Col, Form} from 'react-bootstrap';
const BPlusTree = require('bplustree');

//default order: 6
let tree = new BPlusTree()

let outputTable, searchResultTable;
let single_search_returned_key 
let singleSearchResult = []
let attri_cell_arr 

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
      // single_search_returned_key: 0, 

      isSingleSearch: false,

      isResultPanelModalOpen: false, 
      searchResult: []
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

    //open seach selection panel, if it's closed
    if (this.state.isSearchSelectionModalOpen == false) {
      this.toggleSearchSelectionModal();
    }
    
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
   
    singleSearchResult = [this.state.rows[single_search_returned_key]]
    console.log("final result is")
    console.log(singleSearchResult)
    searchResultTable = <OutTable data={singleSearchResult} columns={attri_cell_arr} tableClassName="ExcelTable2007" tableHeaderRowClass="heading" />
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
    this.setState({
      isSingleSearch: true
    })
    console.log("user entered single search result key is: " + single_search_returned_key)
    this.getFinalSingleSearchResult()
  }

  fileHandler = (event) => {
    let fileObj = event.target.files[0];
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
    let row_copy = this.state.rows
    let col_copy = this.state.cols
    attri_cell_arr = [{name: "#", key: 0}]
    if (row_copy.length != 0 || col_copy.length != 0) {
      console.log("not null")
      console.log(row_copy)
      console.log(col_copy)
      
      // //fill in entire data
      // let whole_data = [atti_array]
      // for (var i = 0; i < row_copy.length; i++) {
      //   whole_data[i + 1] = row_copy[i]
      // }
      // console.log(whole_data)

      //fill in attribute cell array
      for (var i = 0; i < col_copy.length; i++) {
        col_copy[i] = {name: col_copy[i].name, key: col_copy[i].key + 1 }
        attri_cell_arr[i + 1] = col_copy[i]
      }
      console.log(attri_cell_arr)

      if (tree.depth(true) == 0) {
        outputTable = <OutTable data={row_copy} columns={attri_cell_arr} tableClassName="ExcelTable2007" tableHeaderRowClass="heading" />
        console.log("create TREE")
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

                  <Modal isOpen={this.state.isSearchSelectionModalOpen} toggle={this.toggleSearchSelectionModal} >
                    <ModalHeader toggle={this.toggleSearchSelectionModal}>
                          <Row>
                            &nbsp;&nbsp;Select Data Retrieval Option 
                          </Row>
                          &nbsp;
                          <Row>
                            &nbsp;&nbsp;
                            <Button color="primary" onClick={this.toggleRangeSearchModal} >Range Retrieval</Button> {' '}
                            &nbsp;&nbsp;&nbsp;
                            <Button color="primary" onClick={this.toggleSingleSearchModal} type="submit">Single Row Retrieval</Button> 
                          </Row>
                    </ModalHeader>
                    <ModalBody>
                        {outputTable}
                    </ModalBody>
                  </Modal>

                  <Modal isOpen={this.state.isUploadAckModalOpen} toggle={this.toggleUploadAckModal} >
                    <ModalHeader toggle={this.toggleUploadAckModal}>Upload Seccessful! </ModalHeader>
                    <ModalBody>
                      <Button color="primary" onClick={this.onRetrieveSelectionClick} type="submit">View and Select Data Retrieval Option</Button> {'   '}
                      <Button color="primary" onClick={this.toggleUploadAckModal} type="submit">Cancel/Re-upload</Button> 
                    </ModalBody>
                  </Modal>

                  <Modal isOpen={this.state.isSingelSearchModalOpen} toggle={this.toggleSingleSearchModal} >
                    <ModalHeader toggle={this.toggleSingleSearchModal}>Please enter your search index. (First Attribute Value) </ModalHeader>
                    <ModalBody>
                      <Form onSubmit={this.onSingleSearchKeySubmit}>
                        <FormGroup>
                          <Label for="single_search_index">Single Search Index</Label>
                          <Input type="text" name="single_search_index" id="single_search_index" onChange={e => this.handleSearchIndexChange(e)} />
                        </FormGroup>
                        <Button color="primary" className='single_search_submit' type="submit">Search</Button> {' '}
                      </Form>
                    </ModalBody>
                  </Modal>

                  <Modal isOpen={this.state.isResultPanelModalOpen} toggle={this.toggleResultPanelModal} >
                    <ModalHeader toggle={this.toggleResultPanelModal}>
                      <Row>
                        &nbsp;&nbsp;This Is Your Retreived Data 
                      </Row>
                      &nbsp;
                      <Row>
                        &nbsp;&nbsp;
                        <Button color="primary" onClick={this.onRetrieveSelectionClick} type="submit">Retrieve data again</Button> {'   '}
                        &nbsp;&nbsp;&nbsp;
                        <Button color="primary" onClick={this.toFrontPage} type="submit">Exit</Button> 
                      </Row>
                    </ModalHeader>
                    <ModalBody>
                          {searchResultTable}
                    </ModalBody>
                  </Modal>
            </Container>
        </Jumbotron>
      </div>
    );
  }
}
export default Start;
