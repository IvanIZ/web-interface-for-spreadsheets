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

class Start extends Component {

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

      redirect_import_page: false, 
      import_page_link: '/result'
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

  redirect_import = () => {
    this.setState( {
      redirect_import_page: true
    })
  }

  render() {
    if (this.state.redirect_import_page) {
      return <Redirect to={this.state.import_page_link} />
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
                  <p>Choose display data, or retrieve data from below</p>
                  <p className="lead">
                    <Button size='lg' className='redirect-button' color="primary" onClick={this.redirect_import} >To Import Page</Button> 
                  </p>
                  {range_search_button}
                  &nbsp;&nbsp;&nbsp;&nbsp;
                  {single_search_button}
              
            {/* </Container> */}
        </Jumbotron>
        </div>
        {searchResultTable}

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
export default Start;
