import React, { Component, useState } from 'react';
import ReactDOM from "react-dom"
import logo from '../logo.svg';
import '../App.css';
import {ExcelRenderer, OutTable} from 'react-excel-renderer';
import {
  Container,
  Row,
  Col,
  Jumbotron,
  Button,
  Table, Modal, ModalHeader, ModalFooter, ModalBody, Form, FormGroup, Label, Input
} from 'reactstrap';
import Spreadsheet from "react-spreadsheet";

const BPlusTree = require('bplustree');

//default order: 6
let tree = new BPlusTree()

let outputTable, searchResultTable, single_search_button, range_search_button, single_remove_button, range_remove_button;
let single_search_returned_key = [], remove_returned_key = [], range_remove_returned_key = []
let singleSearchResult = [], range_search_result = [], range_search_returned_key = [], arri_array = []

let data = []

class Start extends Component {

  constructor() {
    super();
    this.state = {
      first_time_upload: true,
      rows: [],
      cols: [],
      attri: [],
      isSearchSelectionModalOpen: false, 
      isRangeSearchModalOpen: false, 
      isSingelSearchModalOpen: false,

      isUploadAckModalOpen: false,
      isErrorModalOpen: false,

      single_search_index: '', 

      isSingleSearch: false,

      isResultPanelModalOpen: false, 
      searchResult: [], 

      range_search_lower_index: '', 
      range_search_upper_index: '', 

      single_remove_index: '', 
      range_remove_lower_index: '', 
      range_remove_upper_index:'', 
      isSingleRemoveModalOpen: false, 
      isRangeRemoveModalOpen: false, 

      isRemoveAckModalOpen: false
    }

    this.toggleSearchSelectionModal = this.toggleSearchSelectionModal.bind()
    this.toggleRangeSearchModal = this.toggleRangeSearchModal.bind()
    this.toggleSingleSearchModal = this.toggleSingleSearchModal.bind()
    this.toggleUploadAckModal = this.toggleUploadAckModal.bind()
    this.toggleResultPanelModal = this.toggleResultPanelModal.bind()
    this.toggleErrorModal = this.toggleErrorModal.bind()
    this.toggleSingleRemoveModal = this.toggleSingleRemoveModal.bind()
    this.toggleRangeRemoveModal = this.toggleRangeRemoveModal.bind()
    this.toggleRemoveAckModal = this.toggleRemoveAckModal.bind()
  }

  toggleRemoveAckModal = () => {
    this.setState({
      isRemoveAckModalOpen: !this.state.isRemoveAckModalOpen
    })
  }

  toggleSingleRemoveModal = () => {
    this.setState({
      isSingleRemoveModalOpen: !this.state.isSingleRemoveModalOpen
    })
  }

  toggleRangeRemoveModal = () => {
    this.setState({
      isRangeRemoveModalOpen: !this.state.isRangeRemoveModalOpen
    })
  }

  toggleErrorModal = () => {
    this.setState({
      isErrorModalOpen: !this.state.isErrorModalOpen
    })
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
    let resultMatrix = []
    for (var i = 0; i < single_search_returned_key.length; i++) {
      resultMatrix[i] = data[single_search_returned_key[i]]
    }
    
    console.log("final single search result is ", resultMatrix)
    if (resultMatrix.length == 0) {
      searchResultTable = <Jumbotron>
                              <div>
                                  No Entries Are Retrieved
                              </div>
                          </Jumbotron>
    } else {
      searchResultTable = <Jumbotron>
                            <div>
                                Below Is The Retrieved Data
                            </div>
                             <div>
                                <Spreadsheet data={resultMatrix} />
                             </div>
                        </Jumbotron>
    }
    this.toggleResultPanelModal()
  }

  getFinalRangeSearchResult = () => {
    let resultMatrix = []
    for (var i = 0; i < range_search_returned_key.length; i++) {
      resultMatrix[i] = data[range_search_returned_key[i]]
    }
    console.log("final range search result ", resultMatrix)
    if (resultMatrix.length == 0) {
      searchResultTable = <Jumbotron>
                              <div>
                                  No Entries Are Retrieved
                              </div>
                          </Jumbotron>
    } else {
      searchResultTable = <Jumbotron>
                            <div>
                                Below Is The Retrieved Data
                            </div>
                             <div>
                                <Spreadsheet data={resultMatrix} />
                             </div>
                        </Jumbotron>
    }
    //clear current index values
    this.setState({
      range_search_lower_index: '',
      range_search_upper_index: ''
    })
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
    if (this.state.single_search_index == '') {
      this.toggleErrorModal()
    } else {
      single_search_returned_key = tree.fetch(Number(this.state.single_search_index))
      console.log("user entered single search result key is: " , single_search_returned_key)
      this.toggleSingleSearchModal()
      this.getFinalSingleSearchResult()
    }
  }

  onRangeSearchIndexSubmit = (e) => {
    e.preventDefault();
    if (this.state.range_search_lower_index == '' && this.state.range_search_upper_index == '') {
      this.toggleErrorModal()
    } else {
      let lowerBound, upperBound
      //Restore default min/max bound if null entered
      if (this.state.range_search_lower_index == '') {
        lowerBound = Number.MIN_VALUE
      } else {
        lowerBound = Number(this.state.range_search_lower_index)
      }

      if (this.state.range_search_upper_index == '') {
        console.log("Invalid upper")
        upperBound = Number.MAX_VALUE
      } else {
        upperBound = Number(this.state.range_search_upper_index)
      }

      range_search_returned_key = tree.fetchRange(lowerBound, upperBound, false)
      console.log("user entered lower index is: " + lowerBound)
      console.log("user entered upper index is: " + upperBound)
      console.log("user entered range search result keys are: ", range_search_returned_key)
      this.toggleRangeSearchModal()
      this.getFinalRangeSearchResult()
    }
  }

  onSingleRemoveKeySubmit = (e) => {
    e.preventDefault();
    if (this.state.single_remove_index == '') {
      this.toggleErrorModal()
    } else {
      remove_returned_key = tree.fetch(Number(this.state.single_remove_index))
      console.log("the user single remove key is: ", remove_returned_key)
      this.updateTable()
    }
  }

  updateTable = () => {
    let temp = []
    for (var j = 0; j < arri_array.length; j++) {
      temp[j] = { value: "REMOVED"}
    }
    for (var i = 0; i < remove_returned_key.length; i++) {
      data[remove_returned_key[i]] =  temp
    }

    //remove items from the tree
    if (remove_returned_key.length !== 0) {
      console.log("tree update")
      let removed_val = tree.remove(Number(7))
      console.log("the removed value is: ", removed_val)
      console.log("after remove", tree.fetch(7))
    }

    console.log("the whole data matrix after remove is: ", data)
    outputTable = ''

    //clear current modals and indices
    this.setState({
      single_remove_index: '', 
      range_remove_lower_index: '',
      range_remove_upper_index: ''
    })
    if (this.state.isRangeRemoveModalOpen == true) {
      this.toggleRangeRemoveModal()
    }
    if (this.state.isSingleRemoveModalOpen == true) {
      this.toggleSingleRemoveModal()
    }
    this.toggleRemoveAckModal()
  }

  fillNewTable = () => {
    outputTable = <Jumbotron >
                      <Row>
                          Below Is The Entire Data Set
                      </Row>
                      <Spreadsheet data={data} />
                  </Jumbotron>
    
    this.toggleRemoveAckModal()
  }

  fileHandler = (event) => {
    let fileObj = event.target.files[0];
    console.log("file change!")

    // delete previous table, except for first time upload
    if (this.state.first_time_upload) {
      this.setState({
        first_time_upload: false
      })
    } else {
      this.deleteDBTable()
    }

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
    if (row_copy.length != 0 || col_copy.length != 0) {
      console.log("row is: ", row_copy)
      console.log("col is", col_copy)

      //fill in attribute row
      for (var i = 0; i < col_copy.length; i++) {
        arri_array[i] = { value: col_copy[i].name}
      }
      console.log(arri_array)

      //fill in entire data matrix
      data = []
      searchResultTable = ''
      for (var i = 0; i < row_copy.length; i++) {
        let temp = []
        for (var j = 0; j < col_copy.length; j++) {
          temp[j] = { value: row_copy[i][j]}
        }
        data[i] = temp
      }
      console.log("the value of entire data matrix is: ", data)

      //create new DB table
      this.createDBTable(col_copy.length)


      if (tree.depth(true) == 0) {
        outputTable = <Jumbotron >
                          <div className='data-below-text'>
                              Below Is The Entire Data Set
                          </div>
                          <div>
                              <Spreadsheet data={data} />
                          </div>
                      </Jumbotron>
        range_search_button = <Button size='lg' className='range-search-button' color="primary" onClick={this.toggleRangeSearchModal} >Range Index Retrieval</Button> 
        single_search_button = <Button size='lg' className='single-search-button' color="primary" onClick={this.toggleSingleSearchModal} type="submit">Single Index Retrieval</Button>
        single_remove_button = <Button color="primary" onClick={this.toggleSingleRemoveModal} >Single Index Removal</Button> 
        console.log("create TREE")
        for (var i = 0; i < row_copy.length; i++) {
          tree.store(row_copy[i][5], i)
        }
        console.log("key type is: ", typeof(row_copy[0][0]))
      }
      
      this.setState({
        isSearchSelectionModalOpen:true
      })

    } else {
      console.log("null")
      outputTable = "Not uploaded yet"
    }
  }

  createDBTable = (num_attr) => {
    console.log("going to test create table")
    let url = "/database/create-table/" + num_attr
    fetch(url)
  }

  deleteDBTable = (e) => {
    console.log("going to test delete table")
    fetch("/database/delete-table")
  }


  render() {

    return (

      <div className="App">
         <Jumbotron className='logo-jumbo'>
          
          </Jumbotron >
          <div>

          
          <Jumbotron >
            {/* <Container fluid> */}
                  <h1 className="display-3"> Welcome to spreadsheet web!</h1>
                  <p className="lead">This is a simple web interface that allows you to upload spreadsheets and retrieve data.</p>
                  <hr className="my-2" />
                  <p>Please upload your spreadsheet below</p>
                  <p className="lead">
                    <input type="file" onChange={this.fileHandler.bind(this)} style={{"padding":"10px"}} />
                  </p>
                  {range_search_button}
                  &nbsp;&nbsp;&nbsp;&nbsp;
                  {single_search_button}
                  {/* &nbsp;&nbsp;&nbsp;&nbsp;
                  <Button color="primary" onClick={this.testCreate} >Test</Button>  */}
                  {/* &nbsp;&nbsp;&nbsp;&nbsp;
                  <Button color="primary" onClick={this.deleteDBTable} >delete</Button>  */}
                  

                  <Modal isOpen={this.state.isUploadAckModalOpen} toggle={this.toggleUploadAckModal} >
                    <ModalHeader toggle={this.toggleUploadAckModal}>Upload Seccessful! </ModalHeader>
                    <ModalBody>
                      <Button color="primary" onClick={this.onRetrieveSelectionClick} type="submit" block>View and Select Data Retrieval Option</Button> {'   '}
                    </ModalBody>
                  </Modal>

                  <Modal isOpen={this.state.isRemoveAckModalOpen} toggle={this.toggleRemoveAckModal} >
                    <ModalHeader toggle={this.toggleRemoveAckModal}>Remove Seccessful! </ModalHeader>
                    <ModalBody>
                      <Button color="primary" onClick={this.fillNewTable} type="submit">View New Content</Button> {'   '}
                    </ModalBody>
                  </Modal>

                  <Modal size='lg' isOpen={this.state.isSingelSearchModalOpen} toggle={this.toggleSingleSearchModal} >
                    <ModalHeader toggle={this.toggleSingleSearchModal}>Please enter your search index. (First Attribute Value) </ModalHeader>
                    <ModalBody>
                      <Form onSubmit={this.onSingleSearchKeySubmit}>
                        <FormGroup>
                          <Label for="single_search_index">Single Search Index</Label>
                          <Input type="text" pattern="[0-9]*" name="single_search_index" id="single_search_index" onChange={e => this.handleSearchIndexChange(e)} />
                        </FormGroup>
                        <Button size='lg' color="primary" className='single_search_submit' type="submit" >Search</Button> {' '}
                      </Form>
                    </ModalBody>
                  </Modal>

                  <Modal size='lg' isOpen={this.state.isRangeSearchModalOpen} toggle={this.toggleRangeSearchModal} >
                    <ModalHeader toggle={this.toggleRangeSearchModal}>Please enter upper and lower search index. (First Attribute Value) </ModalHeader>
                    <ModalBody>
                      <Form onSubmit={this.onRangeSearchIndexSubmit}>
                        <FormGroup>
                          <Label for="range_search_lower_index">Lower Bound</Label>
                          <Input type="text" pattern="[0-9]*" name="range_search_lower_index" id="range_search_lower_index" onChange={e => this.handleSearchIndexChange(e)} />
                        </FormGroup>
                        <FormGroup>
                          <Label for="range_search_upper_index">Upper Bound</Label>
                          <Input type="text" pattern="[0-9]*" name="range_search_upper_index" id="range_search_upper_index" onChange={e => this.handleSearchIndexChange(e)} />
                        </FormGroup>
                        <Button color="primary" className='range_search_submit' type="submit" block>Search</Button> {' '}
                      </Form>
                    </ModalBody>
                    <ModalFooter>
                      Hint: to find entries with indices greater/smaller than a value, only enter the lower bound/upper bound (e.g., Find 
                      entries with indices {'>'} 5, enter 5 in lower bound and leave upper bound blank).
                    </ModalFooter>
                  </Modal>

                  <Modal isOpen={this.state.isResultPanelModalOpen} toggle={this.toggleResultPanelModal} >
                    <ModalHeader toggle={this.toggleResultPanelModal}>
                      Data is retrieved. Click view to see the result
                    </ModalHeader>
                    <ModalBody>
                        <Button color="primary" onClick={this.toFrontPage} type="submit" block>View</Button> 
                    </ModalBody>
                  </Modal>

                  <Modal isOpen={this.state.isErrorModalOpen} toggle={this.toggleErrorModal} >
                    <ModalHeader toggle={this.toggleErrorModal}>
                      There is somgthing wrong with your input. Please try again
                    </ModalHeader>
                    <ModalBody>
                        <Button color="primary" onClick={this.toggleErrorModal} type="submit" block>Try Again</Button> 
                    </ModalBody>
                  </Modal>

                  <Modal isOpen={this.state.isSingleRemoveModalOpen} toggle={this.toggleSingleRemoveModal} >
                    <ModalHeader toggle={this.toggleSingleRemoveModal}>Please enter your remove index. (First Attribute Value) </ModalHeader>
                    <ModalBody>
                      <Form onSubmit={this.onSingleRemoveKeySubmit}>
                        <FormGroup>
                          <Label for="single_remove_index">Single Remove Index</Label>
                          <Input type="text" pattern="[0-9]*" name="single_remove_index" id="single_remove_index" onChange={e => this.handleSearchIndexChange(e)} />
                        </FormGroup>
                        <Button color="primary" className='single_remove_submit' type="submit">Remove Entries</Button> {' '}
                      </Form>
                    </ModalBody>
                  </Modal>
            {/* </Container> */}
        </Jumbotron>
        </div>
        {searchResultTable}
        {outputTable}
      </div>

    );
  }
}
export default Start;
