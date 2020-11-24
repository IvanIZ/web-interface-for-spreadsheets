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
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link,
  useHistory,
  Redirect
} from "react-router-dom";
import Spreadsheet from "react-spreadsheet";
import { ReactCanvasGrid } from 'react-canvas-grid';
import InfiniteScroll from "react-infinite-scroll-component";

//default order: 6
const BPlusTree = require('bplustree');
let tree = new BPlusTree()

let outputTable, searchResultTable, single_search_button, range_search_button, single_remove_button, range_remove_button;
let single_search_returned_key = [], remove_returned_key = [], range_remove_returned_key = []
let singleSearchResult = [], range_search_result = [], range_search_returned_key = [], arri_array = []

let data = [], dataMatrix = [], columns = [], buffer = [], single_search_display_matrix = []
let first_time_upload = true
let DIV_WIDTH = 1260
let PREFETCH_SIZE = 50
let noData = true

//search result variables
let SEARCH_RESULT_PREFETCH_SIZE = 10;
let search_result_size = 0;
let first_time_search = true;
let current_result_fetch_index = 10;
let resultBuffer = []

let current_fetch_index = 49 //initial pre-prefetch index
let num_attr = 0;
const style = {
  height: 2500,
  width: DIV_WIDTH,
  border: "0.2px solid gray",
  margin: 0,
  padding: 0
};

const search_display_style = {
  height: 500,
  width: DIV_WIDTH,
  border: "0.2px solid gray",
  margin: 0,
  padding: 0
};

class Result extends Component {

  constructor() {
    super();
    this.state = {
      // first_time_upload: true,
      rows: [],
      cols: [],
      attri: [],
      isSearchSelectionModalOpen: false, 
      isRangeSearchModalOpen: false, 
      isSingelSearchModalOpen: false,

      isUploadAckModalOpen: false,
      isErrorModalOpen: false,

      single_search_index: '', 
      single_search_attribute: '',
      range_search_attribute:'',

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

      isRemoveAckModalOpen: false,
      items: Array.from({ length: 0 }),
      hasMore: false,
      load_from_buffer_to_matrix: false, 

      //retrieval display variables
      hasMoreResult: false,
      resultItems: Array.from({ length: 0 }), 
      load_result_from_buffer_to_matrix: false, 

      redirect_to_start: false,
      start_page_link: '/'
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

  getFinalSingleSearchResult = (resultMatrix) => {
    
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

  onSingleSearchKeySubmit = async (e) => {
    e.preventDefault();
    // this.props.history.push('/result')
    if (this.state.single_search_index == '') {
      this.toggleErrorModal()
    } else {
      this.toggleSingleSearchModal()  //close up the search modal

      //fetch the result from the db
      let onID = false
      if (this.state.single_search_attribute === '') {
        onID = true
      }
      let formResults = {
        attribute: this.state.single_search_attribute,
        index: this.state.single_search_index,
        onID: onID
      }
      //POST req here
      const requestOptions = {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({formResults})
      };
      fetch('/database/single-index-retrieval', requestOptions)
      .then(res => res.json())      
      .then(data => {
        if (data.length === 0) {
          console.log("No data is fetched by single retrieval function")
          let resultMatrix = []
          this.getFinalSingleSearchResult(resultMatrix)
        } else {

          //fill in result matrix
          let resultMatrix = []
          searchResultTable = ''
          for (var i = 0; i < data.length; i++) {
            let temp = []
            for (var j = 1; j < num_attr; j++) {
              temp[j - 1] = { value: data[i]["attribute" + j]}
            }
            resultMatrix[i] = temp
          }
          this.getFinalSingleSearchResult(resultMatrix)
        }
      });
    }
  }

  insertSearchTable = async (data) => {
    //insert content into result table
    console.log("the single search returned data matrix is: ")
    console.log(data)
    let resultBufferMatrix = []
    for (var i = 0; i < data.length; i++) {
      let temp = []
      for (var j = 1; j <= num_attr; j++) {
        temp[j - 1] = data[i]["attribute" + j]
      }
      resultBufferMatrix[i] = temp
    }
    console.log("the buffer matrix is: ")
    console.log(resultBufferMatrix)
    let formResults_result_buffer = {
      matrix: resultBufferMatrix,
      num_attr: num_attr
    }
    //POST req here
    const requestOptions_result = {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({formResults_result_buffer})
    };
    await fetch('/database/insert-result-content', requestOptions_result)

    //load future data into result buffer, and increment the fetch index
    if (data.length > 10) {
      this.loadResultBuffer(current_result_fetch_index);
      current_result_fetch_index = current_result_fetch_index + PREFETCH_SIZE
    }

    //enable scrolling
    this.setState({
      hasMoreResult: true, 
      resultItems: Array.from({ length: 0 })
    })
    this.getFinalSingleSearchResult()
  }

  onRangeSearchIndexSubmit = (e) => {
    e.preventDefault();
    if (this.state.range_search_lower_index == '' && this.state.range_search_upper_index == '') {
      this.toggleErrorModal()
    } else {
      this.toggleRangeSearchModal() // close range search modal
      let lowerBound, upperBound
      //Restore default min/max bound if null entered
      if (this.state.range_search_lower_index == '') {
        lowerBound = Number.MIN_VALUE
      } else {
        lowerBound = Number(this.state.range_search_lower_index)
      }

      if (this.state.range_search_upper_index == '') {
        upperBound = Number.MAX_VALUE
      } else {
        upperBound = Number(this.state.range_search_upper_index)
      }

      let onID = false;
      if (this.state.range_search_attribute === '') {
        onID = true;
      }

      //fetch the result from the db
      let formResults = {
        attribute: this.state.range_search_attribute,
        lower_index: lowerBound,
        upper_index: upperBound, 
        onID: onID
      }
      //POST req here
      const requestOptions = {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({formResults})
      };
      fetch('/database/range-index-retrieval', requestOptions)
      .then(res => res.json())      
      .then(data => {
        if (data.length === 0) {
          console.log("No data is fetched by range retrieval function")
          let resultMatrix = []
          this.getFinalSingleSearchResult(resultMatrix)
        } else {

          //fill in result matrix
          let resultMatrix = []
          searchResultTable = ''
          for (var i = 0; i < data.length; i++) {
            let temp = []
            for (var j = 1; j < num_attr; j++) {
              temp[j - 1] = { value: data[i]["attribute" + j]}
            }
            resultMatrix[i] = temp
          }
          this.getFinalSingleSearchResult(resultMatrix)
        }
      
      });
    }
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

  fileHandler = async (event) => {
    let fileObj = event.target.files[0];
    console.log("file change!")
    console.log("first time upload is: "  + first_time_upload)
    console.log(fileObj)
    this.setState({
      hasMore: true, 
      load_from_buffer_to_matrix: false, //set load to false s.t. the first display does not come from buffer
      items: Array.from({ length: 0 })
    })
    current_fetch_index = 49;  //reset the pre-fetch index to initial value
    outputTable = ''

    // delete previous table, except for first time upload
    if (first_time_upload) {
      first_time_upload = false
    } else {
      this.deleteDBTable()
    }

    tree = new BPlusTree()
  
    //just pass the fileObj as parameter
    await ExcelRenderer(fileObj, (err, resp) => {
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

    //pause until data is loaded from the imported file
    while (true) {
      if (this.state.rows.length !== 0) {
        break;
      }
    }
    this.toggleUploadAckModal() 
  }

  fillOutputTable = async () => {
    let row_copy = this.state.rows
    let col_copy = this.state.cols
    if (row_copy.length != 0 || col_copy.length != 0) {
      console.log("row is: ", row_copy)
      console.log("col is", col_copy)

      //fill in attribute row
      for (var i = 0; i < col_copy.length; i++) {
        arri_array[i] = { value: col_copy[i].name}
      }
      console.log("the arri_array is: ")
      console.log(arri_array)

      //fill in attribute row (i.e. columns), with id as the first column
      for (var i = 0; i <= col_copy.length; i++) {
        if (i == 0) {
          columns[i] = { fieldName: 'id', width: (DIV_WIDTH - col_copy.length - 1) / (col_copy.length + 1) }
        } else {
          columns[i] = { fieldName: 'attr' + i, width: (DIV_WIDTH - col_copy.length - 1) / (col_copy.length + 1) }
        }
      }
      console.log("the columns are: ")
      console.log(columns)


      //initial data matrix (with id as the first column)
      for (var i = 0; i < PREFETCH_SIZE; i++) {
        if (i == 0) {
          let jsonObj = {}
          for (var j = 0; j <= col_copy.length; j++) {
            if (j == 0) {
              let item = {text: 'id'}
              jsonObj['id'] = item
            } else {
              let item = {text: "Attribute" + j}
              jsonObj['attr' + j] = item
            }
          }
          dataMatrix[i] = jsonObj
        } else if (i < row_copy.length) {
          let jsonObj = {}
          for (var j = 0; j <= col_copy.length; j++) {
            if (j == 0) {
              let item = {text: i}
              jsonObj['id'] = item
            } else {
              let item = {text: row_copy[i - 1][j - 1]}
              jsonObj['attr' + j] = item
            }
          }
          dataMatrix[i] = jsonObj
        } else {
          let jsonObj = {}
          for (var j = 0; j <= col_copy.length; j++) {
            if (j == 0) {
              let item = {text: ''}
              jsonObj['id'] = item
            } else {
              let item = {text: ''}
              jsonObj['attr' + j] = item
            }
          }
          dataMatrix[i] = jsonObj
        }

      }
      console.log("the data matrix in json format is: ")
      console.log(dataMatrix)

      //fill in whole data
      data = []
      searchResultTable = ''
      for (var i = 0; i < row_copy.length; i++) {
        let temp = []
        for (var j = 0; j < col_copy.length; j++) {
          temp[j] = { value: row_copy[i][j]}
        }
        data[i] = temp
      }

      //create new DB table
      console.log("going to test create table")
      num_attr = col_copy.length
      let url = "/database/create-table/" + Number(num_attr)
      await fetch(url)

      //insert content into DB table
      let formResults = {
        matrix: row_copy,
        num_attr: col_copy.length
      }
      //POST req here
      const requestOptions = {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({formResults})
      };
      await fetch('/database/insert-content', requestOptions)

      //fetch future rows into the buffer, if possible. Also increment the index
      if (row_copy.length > 50) {
        //this.fetchMoreRows(current_fetch_index);
        for (var i = current_fetch_index; i < row_copy.length; i++) {
          if (i === current_fetch_index + PREFETCH_SIZE) {
            break;
          }
          let jsonObj = {}
          for (var j = 0; j <= col_copy.length; j++) {
            if (j == 0) {
              //let item = {text: i}
              jsonObj['id'] = i + 1
            } else {
              //let item = {text: row_copy[i - 1][j - 1]}
              jsonObj['attribute' + j] = row_copy[i - 1][j - 1]
            }
          }
          buffer[i - current_fetch_index] = jsonObj
        }
        current_fetch_index = current_fetch_index + PREFETCH_SIZE;
        console.log("see buffer data at this point")
      }
    


      if (tree.depth(true) == 0) {
        range_search_button = <Button size='lg' className='range-search-button' color="primary" onClick={this.toggleRangeSearchModal} >Range Index Retrieval</Button> 
        single_search_button = <Button size='lg' className='single-search-button' color="primary" onClick={this.toggleSingleSearchModal} type="submit">Single Index Retrieval</Button>
        single_remove_button = <Button color="primary" onClick={this.toggleSingleRemoveModal} >Single Index Removal</Button> 
        // console.log("create TREE")
        // for (var i = 0; i < row_copy.length; i++) {
        //   tree.store(row_copy[i][5], i)
        // }
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

  deleteResultTable = () => {
    console.log("going to delete result table")
    fetch("/database/delete-result-table")
  }

  fetchMoreData = () => {
    if (this.state.items.length >= Math.ceil(this.state.rows.length / 50.0) ) {
      this.setState({ hasMore: false });
      console.log('the final number of page is: ' + Math.ceil(this.state.rows.length / 50.0))
      return;
    }

    //load data from buffer to the display data matrix
    if (this.state.load_from_buffer_to_matrix == false) {
      this.setState({
        load_from_buffer_to_matrix: true
      })

      //double check if buffer has been loaded
      if (buffer.length == 0) {
        this.fetchMoreRows(PREFETCH_SIZE);
      }
    } else {

      //move data from buffer to matrix
      for (var i = 0; i < PREFETCH_SIZE; i++) {
        if (i < buffer.length) {
          let jsonObj = {}
          for (var j = 0; j <= num_attr; j++) {
            if (j == 0) {
              let item = {text: buffer[i].id}
              jsonObj['id'] = item
            } else {
              let item = {text: buffer[i]["attribute" + j]}
              jsonObj['attr' + j] = item
            }
          }
          dataMatrix[i] = jsonObj
        } else {
          console.log("i is greater than " + PREFETCH_SIZE + " now")
          let jsonObj = {}
          for (var j = 0; j <= num_attr; j++) {
            if (j == 0) {
              let item = {text: ''}
              jsonObj['id'] = item
            } else {
              let item = {text: ''}
              jsonObj['attr' + j] = item
            }
          }
          dataMatrix[i] = jsonObj
        }
      }

      //pre-fetch new data into the buffer
      this.fetchMoreRows(current_fetch_index)
      current_fetch_index = current_fetch_index + PREFETCH_SIZE

      console.log("data matrix at fetch more data is: ")
      console.log(dataMatrix)
    }

    // a fake async api call like which sends
    // 20 more records in 1.5 secs
    setTimeout(() => {
      this.setState({
        items: this.state.items.concat(Array.from({ length: 1 }))
      });
    }, 1500);
  };

  fetchMoreResult = () => {
    if (this.state.resultItems.length >= Math.ceil(search_result_size / 10.0)) {
      this.setState({ hasMoreResult: false });
      return;
    }

    if (this.state.load_result_from_buffer_to_matrix == false) {
      this.setState({
        load_result_from_buffer_to_matrix: true
      })
    } else {
      //...update the result display matrix and result buffer...

      //move data from search result buffer to result display matrix
      for (var i = 0; i < SEARCH_RESULT_PREFETCH_SIZE; i++) {
        if (i < resultBuffer.length) {
          let jsonObj = {}
          for (var j = 0; j <= num_attr; j++) {
            if (j == 0) {
              let item = {text: resultBuffer[i].id}
              jsonObj['id'] = item
            } else {
              let item = {text: resultBuffer[i]["attribute" + j]}
              jsonObj['attr' + j] = item
            }
          }
          single_search_display_matrix[i] = jsonObj
        } else {
          let jsonObj = {}
          for (var j = 0; j <= num_attr; j++) {
            if (j == 0) {
              let item = {text: ''}
              jsonObj['id'] = item
            } else {
              let item = {text: ''}
              jsonObj['attr' + j] = item
            }
          }
          single_search_display_matrix[i] = jsonObj
        }
      }

      //update search result buffer
      this.loadResultBuffer(current_result_fetch_index)
      current_result_fetch_index = current_result_fetch_index + SEARCH_RESULT_PREFETCH_SIZE

      console.log("the new search result display matrix is: ")
      console.log(single_search_display_matrix)
    }

    // a fake async api call like which sends
    // 20 more records in .5 secs
    setTimeout(() => {
      this.setState({
        resultItems: this.state.resultItems.concat(Array.from({ length: 1 }))
      });
    }, 500);
  };

  loadResultBuffer = (index) => {
    console.log("CALLED LOADRESULTBUFFER!")
    resultBuffer = []
    let url = '/database/fetch-ten-rows/' + index
      fetch(url)
      .then(res => res.json())      
      .then(data => {
        if (data.length === 0) {
          console.log("No data is fetched by fetchMoreResult function")
        } else {
          //load returned data into the buffer
          for (var i = 0; i < data.length; i++) {
            resultBuffer[i] = data[i]
          }
          console.log("the result buffer is: ")
          console.log(resultBuffer)
        }
      });
  }

  fetchMoreRows = (index) => {
    buffer = []
    let url = '/database/fetch-fifty-rows/' + index
      fetch(url)
      .then(res => res.json())      
      .then(data => {
        if (data.length === 0) {
          console.log("No data is fetched by fetchMoreRows function")
          noData = true
        } else {
          noData = false;
          //load returned data into the buffer
          for (var i = 0; i < data.length; i++) {
            buffer[i] = data[i]
          }
          console.log("the buffer is: ")
          console.log(buffer)
        }
      });
  }

  redirect_start = () => {
    this.setState( {
      redirect_to_start: true
    })
  }


  render() {
    if (this.state.redirect_to_start) {
      return <Redirect to={this.state.start_page_link} />
    }

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
                    
                    <Button size='lg' className='redirect-button' color="primary" onClick={this.redirect_start} >To Start Page</Button> 
                    &nbsp;&nbsp;&nbsp;&nbsp;
                    <Button size='lg' className='redirect-button' color="primary" onClick={this.deleteDBTable} >Delete Table</Button> 
                  </p>
                  {range_search_button}
                  &nbsp;&nbsp;&nbsp;&nbsp;
                  {single_search_button}
                  {/* &nbsp;&nbsp;&nbsp;&nbsp;
                  <Button color="primary" onClick={this.deleteDBTable} >Delete Table</Button> */}
                  

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
                    <ModalHeader toggle={this.toggleSingleSearchModal}>Please enter your search index and search attribute </ModalHeader>
                    <ModalBody>
                      <Form onSubmit={this.onSingleSearchKeySubmit}>
                        <FormGroup>
                          <Label for="single_search_index">Single Search Index</Label>
                          <Input type="text" pattern="[0-9]*" name="single_search_index" id="single_search_index" onChange={e => this.handleSearchIndexChange(e)} />
                        </FormGroup>
                        <FormGroup>
                          <Label for="single_search_attribute">Search Attribute Number (Leave blank to search on id)</Label>
                          <Input type="text" pattern="[0-9]*" name="single_search_attribute" id="single_search_attribute" onChange={e => this.handleSearchIndexChange(e)} />
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
                        <FormGroup>
                          <Label for="range_search_attribute">Attribute Number (Leave blank to search on id)</Label>
                          <Input type="text" pattern="[0-9]*" name="range_search_attribute" id="range_search_attribute" onChange={e => this.handleSearchIndexChange(e)} />
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
            {/* </Container> */}
        </Jumbotron>
        </div>
        {searchResultTable}
        {/* {outputTable} */}
        {/* <hr /> */}
        {/* <InfiniteScroll
          dataLength={this.state.resultItems.length}
          next={this.fetchMoreResult}
          hasMore={this.state.hasMoreResult}
          loader={<h4>Loading...</h4>}
          endMessage={
            <p style={{ textAlign: "center" }}>
              <b>No Search Result Displayed</b>
            </p>
          }
          >
          {this.state.resultItems.map((i, index) => (
            <div style={search_display_style} key={index}>
              <ReactCanvasGrid
                                  cssHeight={'499px'}
                                  columns={columns}
                                  data={single_search_display_matrix}
                                  rowHeight={49}
                    />
            </div>
          ))}
        </InfiniteScroll> */}

        <hr />
        Below Is The Entire Data Set
        <InfiniteScroll
          dataLength={this.state.items.length}
          next={this.fetchMoreData}
          hasMore={this.state.hasMore}
          loader={<h4>Loading...</h4>}
          endMessage={
            <p style={{ textAlign: "center" }}>
              <b>Yay! You have seen it all</b>
            </p>
          }
          >
          {this.state.items.map((i, index) => (
            <div style={style} key={index}>
              <ReactCanvasGrid
                                  cssHeight={'2499px'}
                                  columns={columns}
                                  data={dataMatrix}
                                  rowHeight={49}
                    />
            </div>
          ))}
        </InfiniteScroll>
      </div>

    );
  }
}
export default Result;
